import type { ThrottleManager, WaitOptions } from './throttle-manager.js';

// Pairs inter-request pacing with ThrottleManager budget-wait to form a single
// "await a slot" primitive for the future GraphQL client.
// - `awaitSlot` ports the pre-request pacing at reference/jobber-cli/lib/core/jobber-client.js:40-43, 165-175.
// - `backoff` / `relax` port the dynamic delay adjustment in the throttle-error
//   branch at reference/jobber-cli/lib/core/jobber-client.js:296-328.

export interface RateLimiterOptions {
  /** Minimum delay between requests in ms. Default 200. */
  readonly minDelayMs?: number;
  /** Upper bound for the dynamic delay in ms. Default 2000. */
  readonly maxDelayMs?: number;
  /** Multiplier applied on throttle errors. Default 2. */
  readonly backoffMultiplier?: number;
  /** Multiplier applied on successful calls. Default 0.8. */
  readonly relaxMultiplier?: number;
}

const DEFAULTS = {
  minDelayMs: 200,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  relaxMultiplier: 0.8,
} as const;

function sleep(ms: number): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export class RateLimiter {
  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly backoffMultiplier: number;
  private readonly relaxMultiplier: number;
  private currentDelayMs: number;
  private lastRequestAt = 0;

  constructor(
    private readonly throttle: ThrottleManager,
    options: RateLimiterOptions = {},
  ) {
    this.minDelayMs = options.minDelayMs ?? DEFAULTS.minDelayMs;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULTS.maxDelayMs;
    this.backoffMultiplier = options.backoffMultiplier ?? DEFAULTS.backoffMultiplier;
    this.relaxMultiplier = options.relaxMultiplier ?? DEFAULTS.relaxMultiplier;
    this.currentDelayMs = this.minDelayMs;
  }

  async awaitSlot(estimatedCost: number, options: WaitOptions = {}): Promise<void> {
    await this.throttle.waitIfNeeded(estimatedCost, options);

    const since = Date.now() - this.lastRequestAt;
    if (since < this.currentDelayMs) {
      await sleep(this.currentDelayMs - since);
    }
    this.lastRequestAt = Date.now();
  }

  /** Called after a throttle/rate error. Doubles delay up to the cap. */
  backoff(): void {
    this.currentDelayMs = Math.min(this.currentDelayMs * this.backoffMultiplier, this.maxDelayMs);
  }

  /** Called after a successful call. Decays delay toward the floor. */
  relax(): void {
    this.currentDelayMs = Math.max(this.minDelayMs, this.currentDelayMs * this.relaxMultiplier);
  }

  /** Current inter-request delay in ms. */
  get delayMs(): number {
    return this.currentDelayMs;
  }
}
