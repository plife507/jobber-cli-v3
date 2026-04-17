import type { ThrottleStatus } from '../core/throttle-manager.js';
import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/status.js. Runs a tiny `__typename`
// query to refresh the throttle status, then prints the budget summary.

export interface StatusArgs {
  readonly json?: boolean;
  readonly silent?: boolean;
}

export interface StatusResult {
  readonly throttleStatus: ThrottleStatus;
  readonly usagePercent: number;
}

const PING_QUERY = 'query { __typename }';
const PING_COST = 5;

export class StatusCommand extends BaseCommand<StatusResult, StatusArgs> {
  protected async run(
    args: StatusArgs,
    { client, throttleManager, logger }: BaseCommandContext,
  ): Promise<StatusResult> {
    // Ping to refresh the throttle envelope with the latest server state.
    await client.executeQuery(PING_QUERY, null, PING_COST, { silent: true });
    const status = throttleManager.getStatus();
    const usagePercent = throttleManager.getUsagePercent();

    if (args.json) {
      process.stdout.write(
        `${JSON.stringify({ throttleStatus: status, usagePercent }, null, 2)}\n`,
      );
    } else if (!args.silent) {
      logger.info('THROTTLE STATUS');
      logger.info(`  Available:    ${status.currentlyAvailable}/${status.maximumAvailable}`);
      logger.info(`  Restore rate: ${status.restoreRate} units/sec`);
      logger.info(`  Usage:        ${usagePercent.toFixed(1)}%`);
    }

    return { throttleStatus: status, usagePercent };
  }
}
