/**
 * Purpose: Analyze Line Items Command - deep analysis of line item changes through Quote → Job → Invoice
 * Inputs: Job number or ID
 * Outputs: Complete line item lifecycle report with all transitions and issues
 * Dependencies: BaseCommand, LineItemAnalyzer, logger
 */

import { BaseCommand } from './_base.js';
import LineItemAnalyzer from '../lib/testing/line-item-analyzer.js';
import logger from '../lib/utils/logger.js';
import fs from 'fs';
import path from 'path';

export class AnalyzeLineItemsCommand extends BaseCommand {
  /**
   * Command metadata
   */
  static get commandName() {
    return 'analyze-line-items';
  }

  static get description() {
    return 'Analyze line item changes through Quote → Job → Invoice lifecycle';
  }

  /**
   * Execute analyze-line-items command
   */
  async run(options) {
    try {
      const jobNumber = options._positional?.[0] || options.job;

      if (!jobNumber) {
        throw new Error('Job number required. Usage: jobber analyze-line-items <job_number>');
      }

      logger.info(`\n╔═══════════════════════════════════════════════════════════╗`);
      logger.info(`║  Line Item Lifecycle Analysis                             ║`);
      logger.info(`╚═══════════════════════════════════════════════════════════╝\n`);

      // Initialize
      await this.initialize();

      // Find job ID
      logger.info(`Looking up job #${jobNumber}...`);
      const encodedId = await this.findJobIdByNumber(jobNumber);

      if (!encodedId) {
        throw new Error(`Job #${jobNumber} not found`);
      }

      // Create analyzer
      const analyzer = new LineItemAnalyzer(this.client);

      // Analyze
      logger.info(`Analyzing line item lifecycle...\n`);
      const analysis = await analyzer.analyzeJobLineItems(encodedId);

      // Display results
      analyzer.logAnalysis(analysis);

      // Generate report
      const report = analyzer.generateReport(analysis);

      // Save to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, report, 'utf8');
        logger.success(`Report saved: ${outputPath}`);
      }

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
      }

      // Return result (entry point handles exit codes)
      const hasCriticalIssues = analysis.summary.criticalIssues > 0;
      if (hasCriticalIssues) {
        throw new Error('Analysis found critical issues');
      }
      return analysis;

    } catch (error) {
      if (error.message === 'Analysis found critical issues') throw error;
      logger.error(`Analysis failed: ${error.message}`);

      if (error.stack && process.env.DEBUG) {
        logger.debug(error.stack);
      }

      throw error;
    }
  }

}

export default AnalyzeLineItemsCommand;

