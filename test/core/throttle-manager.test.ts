import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ThrottleManager,
  type ThrottleExtensionsShape,
  type ThrottleStatus,
} from '../../src/core/throttle-manager.js';

function response(
  currentlyAvailable: number,
  maximumAvailable = 10_000,
  restoreRate = 500,
): ThrottleExtensionsShape {
  return {
    extensions: {
      cost: {
        throttleStatus: { maximumAvailable, currentlyAvailable, restoreRate },
      },
    },
  };
}

describe('ThrottleManager — defaults (reference parity)', () => {
  it('starts at 10000/10000 with restoreRate 500', () => {
    const tm = new ThrottleManager();
    expect(tm.getStatus()).toEqual<ThrottleStatus>({
      maximumAvailable: 10_000,
      currentlyAvailable: 10_000,
      restoreRate: 500,
    });
  });

  it('hasEnoughBudget mirrors currentlyAvailable', () => {
    const tm = new ThrottleManager();
    expect(tm.hasEnoughBudget(9_999)).toBe(true);
    expect(tm.hasEnoughBudget(10_000)).toBe(true);
    expect(tm.hasEnoughBudget(10_001)).toBe(false);
  });

  it('getUsagePercent computes (1 - avail/max) * 100', async () => {
    const tm = new ThrottleManager();
    expect(tm.getUsagePercent()).toBe(0);
    await tm.updateStatus(response(2_500));
    expect(tm.getUsagePercent()).toBe(75);
  });
});

describe('ThrottleManager.updateStatus', () => {
  it('reads the primary extensions.cost.throttleStatus path', async () => {
    const tm = new ThrottleManager();
    const res = await tm.updateStatus(response(5_000));
    expect(res?.currentlyAvailable).toBe(5_000);
    expect(tm.getStatus().currentlyAvailable).toBe(5_000);
  });

  it('falls back to extensions.throttleStatus when cost is absent', async () => {
    const tm = new ThrottleManager();
    const res = await tm.updateStatus({
      extensions: {
        throttleStatus: {
          maximumAvailable: 10_000,
          currentlyAvailable: 3_000,
          restoreRate: 500,
        },
      },
    });
    expect(res?.currentlyAvailable).toBe(3_000);
  });

  it('returns null when no throttle data is present', async () => {
    const tm = new ThrottleManager();
    const res = await tm.updateStatus({});
    expect(res).toBeNull();
  });

  it('rejects malformed throttle payloads without mutating status', async () => {
    const tm = new ThrottleManager();
    const before = tm.getStatus();
    const res = await tm.updateStatus({
      extensions: {
        cost: {
          throttleStatus: {
            maximumAvailable: 'oops' as unknown as number,
            currentlyAvailable: 0,
            restoreRate: 500,
          },
        },
      },
    });
    expect(res).toBeNull();
    expect(tm.getStatus()).toEqual(before);
  });

  it('ignores non-object input', async () => {
    const tm = new ThrottleManager();
    expect(await tm.updateStatus(null)).toBeNull();
    expect(await tm.updateStatus('nope')).toBeNull();
    expect(await tm.updateStatus(42)).toBeNull();
  });

  it('emits statusUpdated on every successful update', async () => {
    const tm = new ThrottleManager();
    const spy = vi.fn();
    tm.on('statusUpdated', spy);
    await tm.updateStatus(response(8_000));
    await tm.updateStatus(response(7_500));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({
      maximumAvailable: 10_000,
      currentlyAvailable: 7_500,
      restoreRate: 500,
    });
  });

  it('emits budgetLow only when usage > 80%', async () => {
    const tm = new ThrottleManager();
    const spy = vi.fn();
    tm.on('budgetLow', spy);

    await tm.updateStatus(response(2_000)); // 80% used → no emission
    expect(spy).not.toHaveBeenCalled();

    await tm.updateStatus(response(1_500)); // 85% used → emits
    expect(spy).toHaveBeenCalledTimes(1);
    const [payload] = spy.mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      available: 1_500,
      maximum: 10_000,
    });
  });

  it('serializes concurrent updates with interleaved await points', async () => {
    const tm = new ThrottleManager();
    const observed: number[] = [];
    tm.on('statusUpdated', (s) => observed.push(s.currentlyAvailable));

    // Each update must complete before the next runs, in submission order.
    // A microtask (Promise.resolve) between awaits ensures this isn't just
    // same-tick resolution — genuine ordering is being exercised.
    const calls = [9_000, 8_000, 7_000, 6_000, 5_000].map((cur) => tm.updateStatus(response(cur)));
    await Promise.resolve();
    await Promise.resolve();
    const results = await Promise.all(calls);

    expect(results.map((r) => r?.currentlyAvailable)).toEqual([
      9_000, 8_000, 7_000, 6_000, 5_000,
    ]);
    expect(observed).toEqual([9_000, 8_000, 7_000, 6_000, 5_000]);
    expect(tm.getStatus().currentlyAvailable).toBe(5_000);
  });
});

describe('ThrottleManager.calculateWaitTime', () => {
  it('returns 0 when budget covers the request', () => {
    const tm = new ThrottleManager();
    expect(tm.calculateWaitTime(100)).toBe(0);
    expect(tm.calculateWaitTime(10_000)).toBe(0);
  });

  it('applies the 10% buffer and ceils the result', async () => {
    const tm = new ThrottleManager();
    await tm.updateStatus(response(0, 10_000, 500));
    // need 5000 units from zero: (5000 / 500) * 1.1 = 11 → ceil 11
    expect(tm.calculateWaitTime(5_000)).toBe(11);
  });

  it('caps at 3600 seconds (1 hour)', async () => {
    const tm = new ThrottleManager();
    await tm.updateStatus(response(0, 10_000, 500));
    expect(tm.calculateWaitTime(10_000_000)).toBe(3_600);
  });

  it('falls back to the default restore rate (500) when the provided rate is invalid', async () => {
    const tm = new ThrottleManager();
    await tm.updateStatus(response(0, 10_000, 0));
    // Default 500 kicks in: (5000 / 500) * 1.1 = 11
    expect(tm.calculateWaitTime(5_000)).toBe(11);
  });

  it('throws on non-finite or negative input', () => {
    const tm = new ThrottleManager();
    expect(() => tm.calculateWaitTime(-1)).toThrow(/Invalid requiredUnits/);
    expect(() => tm.calculateWaitTime(Number.NaN)).toThrow(/Invalid requiredUnits/);
    expect(() => tm.calculateWaitTime(Number.POSITIVE_INFINITY)).toThrow(
      /Invalid requiredUnits/,
    );
  });
});

describe('ThrottleManager.waitIfNeeded', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns immediately when no wait is needed', async () => {
    const tm = new ThrottleManager();
    const waiting = vi.fn();
    const done = vi.fn();
    tm.on('waiting', waiting);
    tm.on('waitComplete', done);
    await tm.waitIfNeeded(100, { silent: true });
    expect(waiting).not.toHaveBeenCalled();
    expect(done).not.toHaveBeenCalled();
  });

  it('emits waiting then waitComplete, and restores budget after the wait', async () => {
    const tm = new ThrottleManager();
    await tm.updateStatus(response(0, 10_000, 500));

    const waiting = vi.fn();
    const done = vi.fn();
    tm.on('waiting', waiting);
    tm.on('waitComplete', done);

    const p = tm.waitIfNeeded(5_000, { silent: true });
    await vi.runAllTimersAsync();
    await p;

    expect(waiting).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledTimes(1);
    // waited 11s at rate 500 = 5500 restored (capped at max 10000).
    expect(tm.getStatus().currentlyAvailable).toBe(5_500);
  });
});

describe('ThrottleManager.waitWithProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves in a single tick for sub-interval waits', async () => {
    const p = ThrottleManager.waitWithProgress(1, { silent: true });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
  });

  it('resolves after multi-interval waits', async () => {
    const p = ThrottleManager.waitWithProgress(5, { silent: true });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBeUndefined();
  });
});
