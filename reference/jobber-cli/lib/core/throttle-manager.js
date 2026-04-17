/**
 * Purpose: Throttle Manager - tracks throttle status, calculates wait times, and manages rate limits for Jobber API
 * Inputs: API response headers with throttle information
 * Outputs: Updated throttle status, wait time calculations, rate limit events
 * Dependencies: EventEmitter, logger
 */

import EventEmitter from 'events';
import logger from '../utils/logger.js';

export class ThrottleManager extends EventEmitter {
  constructor() {
    super();
    this.throttleStatus = {
      maximumAvailable: 10000,
      currentlyAvailable: 10000,
      restoreRate: 500
    };
    // CRITICAL FIX #2: Add update queue to prevent race conditions
    this._updateQueue = Promise.resolve();
    this._lastUpdateTimestamp = Date.now();
  }

  /**
   * Extract throttle status from API response and update internal state
   * CRITICAL FIX #2: Queued updates to prevent race conditions
   * @param {Object} response - GraphQL API response
   * @returns {Promise<Object|null>} Updated throttle status or null if not found
   */
  updateStatus(response) {
    // Queue updates to ensure atomic operations
    this._updateQueue = this._updateQueue.then(() => {
      const throttle = response.extensions?.cost?.throttleStatus || response.extensions?.throttleStatus;
      if (throttle) {
        const now = Date.now();

        // Create new object to avoid mutation issues
        const newStatus = {
          maximumAvailable: throttle.maximumAvailable,
          currentlyAvailable: throttle.currentlyAvailable,
          restoreRate: throttle.restoreRate
        };
        
        // Atomic update
        this.throttleStatus = newStatus;
        this._lastUpdateTimestamp = now;

        // Emit event for monitoring (always emit to keep listeners informed)
        this.emit('statusUpdated', this.throttleStatus);
        
        // Emit warning if budget is low
        const usagePercent = (1 - (this.throttleStatus.currentlyAvailable / this.throttleStatus.maximumAvailable)) * 100;
        if (usagePercent > 80) {
          this.emit('budgetLow', { 
            available: this.throttleStatus.currentlyAvailable,
            maximum: this.throttleStatus.maximumAvailable,
            usagePercent 
          });
        }

        return this.throttleStatus;
      }
      return null;
    });
    
    // Return the queued promise
    return this._updateQueue;
  }

  /**
   * Calculate wait time needed for required units
   * CRITICAL FIX #2: Enhanced validation to prevent infinite/NaN values
   * @param {number} requiredUnits - Number of throttle units needed
   * @returns {number} Wait time in seconds (0 if no wait needed)
   */
  calculateWaitTime(requiredUnits) {
    // CRITICAL FIX #2: Input validation
    if (!Number.isFinite(requiredUnits) || requiredUnits < 0) {
      throw new Error(`Invalid requiredUnits: ${requiredUnits}`);
    }
    
    const { currentlyAvailable, restoreRate } = this.throttleStatus;
    
    // CRITICAL FIX #2: Validate throttle status
    if (!Number.isFinite(currentlyAvailable) || currentlyAvailable < 0) {
      logger.error(`Invalid currentlyAvailable: ${currentlyAvailable}`);
      throw new Error('Throttle status is corrupted');
    }
    
    // Validate restore rate
    if (!restoreRate || restoreRate <= 0 || !Number.isFinite(restoreRate)) {
      logger.warn(`Invalid restoreRate: ${restoreRate}, using default`);
      const DEFAULT_RESTORE_RATE = 500;
      const unitsNeeded = requiredUnits - currentlyAvailable;
      
      if (unitsNeeded <= 0) return 0;
      
      const waitSeconds = (unitsNeeded / DEFAULT_RESTORE_RATE) * 1.1;
      
      // CRITICAL FIX #2: Final validation
      if (!Number.isFinite(waitSeconds) || waitSeconds < 0) {
        throw new Error(`Calculated invalid wait time: ${waitSeconds}`);
      }
      
      // Cap at reasonable maximum (1 hour)
      return Math.min(Math.ceil(waitSeconds), 3600);
    }
    
    const unitsNeeded = requiredUnits - currentlyAvailable;
    
    if (unitsNeeded <= 0) {
      return 0;
    }

    // Add 10% buffer for safety
    const waitSeconds = (unitsNeeded / restoreRate) * 1.1;
    
    // CRITICAL FIX #2: Validate result
    if (!Number.isFinite(waitSeconds) || waitSeconds < 0) {
      throw new Error(`Calculated invalid wait time: ${waitSeconds}`);
    }
    
    // Cap at reasonable maximum (1 hour)
    return Math.min(Math.ceil(waitSeconds), 3600);
  }

  /**
   * Wait if necessary based on throttle budget
   * Shows progress updates during wait
   * @param {number} estimatedCost - Estimated throttle units needed
   * @param {Object} options - Options for waiting behavior
   * @param {boolean} options.silent - If true, don't show progress (default: false)
   * @returns {Promise<void>}
   */
  async waitIfNeeded(estimatedCost, options = {}) {
    const waitTime = this.calculateWaitTime(estimatedCost);
    
    // Validate waitTime to prevent infinite loops
    if (!isFinite(waitTime) || waitTime < 0 || waitTime > 3600) {
      throw new Error(`Invalid throttle wait time calculated: ${waitTime}. Maximum wait time is 1 hour.`);
    }
    
    if (waitTime > 0) {
      const { currentlyAvailable, restoreRate } = this.throttleStatus;
      
      if (!options.silent) {
        logger.info(`⏳ Throttle budget low: ${currentlyAvailable} available, need ~${estimatedCost}`);
        logger.info(`   Waiting ${waitTime} seconds for budget to restore...`);
      }
      
      this.emit('waiting', { waitTime, needed: estimatedCost, available: currentlyAvailable });
      
      // Wait with progress updates every 2 seconds
      await ThrottleManager.waitWithProgress(waitTime, options, (waited, total) => {
        const restored = Math.floor(waited * restoreRate);
        const newAvailable = Math.min(this.throttleStatus.maximumAvailable, currentlyAvailable + restored);
        return `\r   ⏳ ${Math.floor(waited)}s / ${total}s (${newAvailable} available)...`;
      });
      
      // Update throttle status with restored units
      const restored = Math.floor(waitTime * restoreRate);
      this.throttleStatus.currentlyAvailable = Math.min(
        this.throttleStatus.maximumAvailable,
        currentlyAvailable + restored
      );

      this.emit('waitComplete', { waitTime, restored });
    }
  }

  /**
   * Wait for a given duration with TTY progress updates every ~2 seconds.
   * @param {number} totalSeconds - Total seconds to wait
   * @param {Object} options - { silent: boolean }
   * @param {Function} [progressFn] - Optional (waited, total) => string for custom progress text
   * @returns {Promise<void>}
   */
  static async waitWithProgress(totalSeconds, options = {}, progressFn = null) {
    let waited = 0;
    while (waited < totalSeconds) {
      const sleepTime = Math.min(2000, (totalSeconds - waited) * 1000);
      await new Promise(resolve => setTimeout(resolve, sleepTime));
      waited += sleepTime / 1000;

      if (!options.silent && process.stdout.isTTY && waited < totalSeconds) {
        const msg = progressFn
          ? progressFn(waited, totalSeconds)
          : `\r   ⏳ ${Math.floor(waited)}s / ${totalSeconds}s...`;
        process.stdout.write(msg);
      }
    }

    if (!options.silent && process.stdout.isTTY) {
      process.stdout.write(`\r   ✅ Ready!                                      \n`);
    }
  }

  /**
   * Get current throttle status
   * @returns {Object} Copy of current throttle status
   */
  getStatus() {
    return { ...this.throttleStatus };
  }

  /**
   * Check if we have enough budget for an operation
   * @param {number} estimatedCost - Estimated cost of operation
   * @returns {boolean} True if we have enough budget
   */
  hasEnoughBudget(estimatedCost) {
    return this.throttleStatus.currentlyAvailable >= estimatedCost;
  }

  /**
   * Get usage percentage (0-100)
   * @returns {number} Usage percentage
   */
  getUsagePercent() {
    return (1 - (this.throttleStatus.currentlyAvailable / this.throttleStatus.maximumAvailable)) * 100;
  }
}
