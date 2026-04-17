import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { ThrottleManager } from '../../src/core/throttle-manager.js';

describe('RateLimiter — pure delay math', () => {
  it('defaults to 200ms floor and 2000ms ceiling', () => {
    const rl = new RateLimiter(new ThrottleManager());
    expect(rl.delayMs).toBe(200);
  });

  it('backoff doubles the delay and caps at the maximum', () => {
    const rl = new RateLimiter(new ThrottleManager(), {
      minDelayMs: 200,
      maxDelayMs: 2_000,
      backoffMultiplier: 2,
    });
    rl.backoff();
    expect(rl.delayMs).toBe(400);
    rl.backoff();
    expect(rl.delayMs).toBe(800);
    rl.backoff();
    expect(rl.delayMs).toBe(1_600);
    rl.backoff();
    expect(rl.delayMs).toBe(2_000);
    rl.backoff();
    expect(rl.delayMs).toBe(2_000);
  });

  it('relax scales the delay down and floors at the minimum', () => {
    const rl = new RateLimiter(new ThrottleManager(), {
      minDelayMs: 200,
      maxDelayMs: 2_000,
      relaxMultiplier: 0.8,
    });
    rl.backoff(); // 400
    rl.backoff(); // 800
    rl.relax();
    expect(rl.delayMs).toBeCloseTo(640);
    for (let i = 0; i < 50; i++) rl.relax();
    expect(rl.delayMs).toBe(200);
  });

  it('accepts custom backoff and relax multipliers', () => {
    const rl = new RateLimiter(new ThrottleManager(), {
      minDelayMs: 100,
      maxDelayMs: 800,
      backoffMultiplier: 4,
      relaxMultiplier: 0.5,
    });
    rl.backoff();
    expect(rl.delayMs).toBe(400);
    rl.backoff();
    expect(rl.delayMs).toBe(800);
    rl.relax();
    expect(rl.delayMs).toBe(400);
  });
});

describe('RateLimiter.awaitSlot', () => {
  it('does not stall on the first call (no previous request to pace against)', async () => {
    const rl = new RateLimiter(new ThrottleManager(), { minDelayMs: 50 });
    const start = Date.now();
    await rl.awaitSlot(100);
    const elapsed = Date.now() - start;
    // First call has lastRequestAt=0, "since" is essentially Date.now() — massive,
    // so no delay is scheduled.
    expect(elapsed).toBeLessThan(50);
  });

  it('enforces the inter-request delay on a back-to-back second call', async () => {
    const rl = new RateLimiter(new ThrottleManager(), { minDelayMs: 60 });
    await rl.awaitSlot(100);
    const start = Date.now();
    await rl.awaitSlot(100);
    const elapsed = Date.now() - start;
    // Real timer, tolerant window for CI jitter.
    expect(elapsed).toBeGreaterThanOrEqual(50);
    expect(elapsed).toBeLessThan(500);
  });

  it('skips the inter-request delay once the window has elapsed', async () => {
    const rl = new RateLimiter(new ThrottleManager(), { minDelayMs: 20 });
    await rl.awaitSlot(100);
    await new Promise((r) => setTimeout(r, 40));
    const start = Date.now();
    await rl.awaitSlot(100);
    expect(Date.now() - start).toBeLessThan(20);
  });
});
