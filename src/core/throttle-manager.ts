import { EventEmitter } from 'node:events';
import { z } from 'zod';

// Ported from reference/jobber-cli/lib/core/throttle-manager.js.
// Constants and math preserved line-for-line.

export interface ThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

// Boundary schema: GraphQL responses are untyped network input until validated.
const ThrottleStatusSchema = z.object({
  maximumAvailable: z.number().finite().nonnegative(),
  currentlyAvailable: z.number().finite().nonnegative(),
  restoreRate: z.number().finite(),
});

const ThrottleExtensionsSchema = z
  .object({
    extensions: z
      .object({
        cost: z.object({ throttleStatus: ThrottleStatusSchema.optional() }).optional(),
        throttleStatus: ThrottleStatusSchema.optional(),
      })
      .optional(),
  })
  .passthrough();

export type ThrottleExtensionsShape = z.input<typeof ThrottleExtensionsSchema>;

export interface BudgetLowPayload {
  available: number;
  maximum: number;
  usagePercent: number;
}

export interface WaitingPayload {
  waitTime: number;
  needed: number;
  available: number;
}

export interface WaitCompletePayload {
  waitTime: number;
  restored: number;
}

export interface ThrottleEvents {
  statusUpdated: [ThrottleStatus];
  budgetLow: [BudgetLowPayload];
  waiting: [WaitingPayload];
  waitComplete: [WaitCompletePayload];
}

export interface WaitOptions {
  readonly silent?: boolean;
}

// reference line 14-18: default budget, restore rate.
const DEFAULT_MAX = 10_000;
const DEFAULT_RESTORE_RATE = 500;

// reference line 116: 10% safety buffer.
const BUFFER_MULTIPLIER = 1.1;
// reference line 124: cap at 1 hour.
const MAX_WAIT_SECONDS = 3600;
// reference line 53: budget-low threshold.
const BUDGET_LOW_PERCENT = 80;
// reference line 181: progress tick cadence.
const PROGRESS_INTERVAL_MS = 2000;

function isStdoutTTY(): boolean {
  return Boolean((process.stdout as { isTTY?: boolean }).isTTY);
}

export class ThrottleManager extends EventEmitter<ThrottleEvents> {
  private status: ThrottleStatus = {
    maximumAvailable: DEFAULT_MAX,
    currentlyAvailable: DEFAULT_MAX,
    restoreRate: DEFAULT_RESTORE_RATE,
  };

  // reference line 20-21: queued updates prevent race conditions.
  private updateQueue: Promise<ThrottleStatus | null> = Promise.resolve(null);
  private lastUpdateAt: number = Date.now();

  updateStatus(response: unknown): Promise<ThrottleStatus | null> {
    this.updateQueue = this.updateQueue.then(() => {
      const parsed = ThrottleExtensionsSchema.safeParse(response);
      if (!parsed.success) return null;
      const throttle =
        parsed.data.extensions?.cost?.throttleStatus ?? parsed.data.extensions?.throttleStatus;
      if (!throttle) return null;

      const next: ThrottleStatus = {
        maximumAvailable: throttle.maximumAvailable,
        currentlyAvailable: throttle.currentlyAvailable,
        restoreRate: throttle.restoreRate,
      };
      this.status = next;
      this.lastUpdateAt = Date.now();

      this.emit('statusUpdated', next);

      const usagePercent = (1 - next.currentlyAvailable / next.maximumAvailable) * 100;
      if (usagePercent > BUDGET_LOW_PERCENT) {
        this.emit('budgetLow', {
          available: next.currentlyAvailable,
          maximum: next.maximumAvailable,
          usagePercent,
        });
      }
      return next;
    });
    return this.updateQueue;
  }

  calculateWaitTime(requiredUnits: number): number {
    if (!Number.isFinite(requiredUnits) || requiredUnits < 0) {
      throw new Error(`Invalid requiredUnits: ${requiredUnits}`);
    }
    const { currentlyAvailable, restoreRate } = this.status;
    if (!Number.isFinite(currentlyAvailable) || currentlyAvailable < 0) {
      throw new Error('Throttle status is corrupted');
    }

    const effectiveRate =
      Number.isFinite(restoreRate) && restoreRate > 0 ? restoreRate : DEFAULT_RESTORE_RATE;

    const unitsNeeded = requiredUnits - currentlyAvailable;
    if (unitsNeeded <= 0) return 0;

    const waitSeconds = (unitsNeeded / effectiveRate) * BUFFER_MULTIPLIER;
    if (!Number.isFinite(waitSeconds) || waitSeconds < 0) {
      throw new Error(`Calculated invalid wait time: ${waitSeconds}`);
    }
    return Math.min(Math.ceil(waitSeconds), MAX_WAIT_SECONDS);
  }

  async waitIfNeeded(estimatedCost: number, options: WaitOptions = {}): Promise<void> {
    const waitTime = this.calculateWaitTime(estimatedCost);
    if (!Number.isFinite(waitTime) || waitTime < 0 || waitTime > MAX_WAIT_SECONDS) {
      throw new Error(
        `Invalid throttle wait time calculated: ${waitTime}. Maximum wait time is 1 hour.`,
      );
    }
    if (waitTime === 0) return;

    const { currentlyAvailable, restoreRate } = this.status;
    this.emit('waiting', {
      waitTime,
      needed: estimatedCost,
      available: currentlyAvailable,
    });

    await ThrottleManager.waitWithProgress(waitTime, options);

    // Reference parity: post-wait restore writes from a pre-wait snapshot. If an
    // updateStatus resolves during the wait, its newer currentlyAvailable will
    // be clobbered here. Phase 2 callers should treat post-wait budget as a
    // lower-bound estimate; real values come from the next response header.
    const restored = Math.floor(waitTime * restoreRate);
    this.status = {
      ...this.status,
      currentlyAvailable: Math.min(this.status.maximumAvailable, currentlyAvailable + restored),
    };
    this.emit('waitComplete', { waitTime, restored });
  }

  static async waitWithProgress(
    totalSeconds: number,
    options: WaitOptions = {},
    progressFn?: (waited: number, total: number) => string,
  ): Promise<void> {
    let waited = 0;
    while (waited < totalSeconds) {
      const sleepMs = Math.min(PROGRESS_INTERVAL_MS, (totalSeconds - waited) * 1000);
      await new Promise<void>((r) => setTimeout(r, sleepMs));
      waited += sleepMs / 1000;

      if (!options.silent && isStdoutTTY() && waited < totalSeconds) {
        const msg = progressFn
          ? progressFn(waited, totalSeconds)
          : `\r   ⏳ ${Math.floor(waited)}s / ${totalSeconds}s...`;
        process.stdout.write(msg);
      }
    }
    if (!options.silent && isStdoutTTY()) {
      process.stdout.write('\r   ✅ Ready!                                      \n');
    }
  }

  getStatus(): ThrottleStatus {
    return { ...this.status };
  }

  hasEnoughBudget(estimatedCost: number): boolean {
    return this.status.currentlyAvailable >= estimatedCost;
  }

  getUsagePercent(): number {
    return (1 - this.status.currentlyAvailable / this.status.maximumAvailable) * 100;
  }
}
