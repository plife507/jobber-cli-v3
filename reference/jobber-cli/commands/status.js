/**
 * Purpose: Status Command - displays current throttle status and rate limit budget
 * Inputs: None
 * Outputs: Console display of throttle manager status
 * Dependencies: BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';

export class StatusCommand extends BaseCommand {
  async run() {
    await this.initialize();
    const status = this.throttleManager.getStatus();
    const usagePercent = this.throttleManager.getUsagePercent();

    if (!process.env.JOBBER_MACHINE_MODE) {
      this.showThrottleStatus();
    }

    return {
      throttleStatus: status,
      usagePercent
    };
  }
}

export default StatusCommand;
