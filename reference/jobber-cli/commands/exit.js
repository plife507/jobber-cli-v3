/**
 * Purpose: Exit Command - gracefully exit the CLI
 * Inputs: None
 * Outputs: Exits with code 0
 * Dependencies: BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';

export class ExitCommand extends BaseCommand {
  async run(args) {
    // Don't initialize - just exit cleanly
    logger.info('👋 Goodbye!');
    process.exit(0);
  }

  static get commandName() {
    return 'exit';
  }

  static get description() {
    return 'Exit the CLI';
  }
}

export default ExitCommand;

