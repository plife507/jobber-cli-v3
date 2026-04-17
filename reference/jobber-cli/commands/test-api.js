/**
 * Purpose: Test API Command - runs comprehensive API verification tests against Jobber GraphQL API
 * Inputs: Command arguments for test phase selection, query filtering, report generation
 * Outputs: Test results, JSON reports, Markdown documentation
 * Dependencies: ApiVerificationTester, BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import ApiVerificationTester from '../lib/testing/api-verification-tester.js';
import logger from '../lib/utils/logger.js';

export class TestApiCommand extends BaseCommand {
  /**
   * Command metadata
   */
  static get commandName() {
    return 'test-api';
  }

  static get description() {
    return 'Run comprehensive API verification tests';
  }

  /**
   * Execute test-api command
   */
  async run(options) {
    try {
      logger.info('\n╔═══════════════════════════════════════════════════════════╗');
      logger.info('║  Jobber API Verification Testing Suite                   ║');
      logger.info('╚═══════════════════════════════════════════════════════════╝\n');

      // Parse phase option
      let phase = 'all';
      if (options.phase) {
        const phaseNum = parseInt(options.phase);
        if (!isNaN(phaseNum) && phaseNum >= 1 && phaseNum <= 3) {
          phase = phaseNum;
        } else if (options.phase.toLowerCase() === 'all') {
          phase = 'all';
        } else {
          throw new Error('Invalid phase. Must be 1, 2, 3, or "all"');
        }
      }

      // Handle connection-only and single-only flags
      if (options.connectionOnly && options.singleOnly) {
        throw new Error('Cannot use both --connection-only and --single-only');
      }

      // Build tester options
      const testerOptions = {
        phase,
        query: options.query,
        connectionOnly: options.connectionOnly,
        singleOnly: options.singleOnly,
        noReport: options.noReport,
        outputDir: options.outputDir,
        force: options.force,
        silent: options.silent
      };

      // Display test configuration
      logger.info('📋 Test Configuration:');
      logger.info(`   Phase: ${phase === 'all' ? 'All phases' : `Phase ${phase}`}`);
      if (options.query) {
        logger.info(`   Query filter: ${options.query}`);
      }
      if (options.connectionOnly) {
        logger.info(`   Mode: Connection queries only`);
      }
      if (options.singleOnly) {
        logger.info(`   Mode: Single-object queries only`);
      }
      logger.info(`   Report generation: ${options.noReport ? 'Disabled' : 'Enabled'}`);
      logger.info(`   Output directory: ${options.outputDir}`);
      logger.info('');

      // Warning about API usage
      logger.warn('⚠️  API Verification Testing');
      logger.info('   This will execute multiple API queries');
      logger.info('   Throttle management is enabled to respect rate limits');
      logger.info('   Tests will automatically wait if throttle budget is low\n');

      // Create and initialize tester
      const tester = new ApiVerificationTester(testerOptions);

      await tester.initialize();

      // Run tests
      logger.info('▶️  Starting tests...\n');
      let results;
      try {
        results = await tester.runAllTests();
      } finally {
        // Cleanup tester's client to prevent memory/listener leaks
        if (tester.client) {
          tester.client.cleanup();
        }
      }

      // Display summary
      this._displaySummary(results);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      }

      // Return result (entry point handles exit codes)
      const hasFailures = results.failures && results.failures.length > 0;
      if (hasFailures) {
        throw new Error('API tests had failures');
      }
      return results;

    } catch (error) {
      if (error.message === 'API tests had failures') throw error;
      logger.error(`Test execution failed: ${error.message}`);

      if (error.stack && process.env.DEBUG) {
        logger.debug(error.stack);
      }

      throw error;
    }
  }

  /**
   * Display test summary
   * @private
   */
  _displaySummary(results) {
    logger.info('\n╔═══════════════════════════════════════════════════════════╗');
    logger.info('║  Test Summary                                             ║');
    logger.info('╚═══════════════════════════════════════════════════════════╝\n');

    const totalQueries = results.queries?.length || 0;
    const successful = results.queries?.filter(q => q.success).length || 0;
    const failed = results.queries?.filter(q => !q.success && !q.skipped).length || 0;
    const skipped = results.queries?.filter(q => q.skipped).length || 0;
    const successRate = totalQueries > 0 ? ((successful / totalQueries) * 100).toFixed(2) : 0;

    logger.info('📊 Overall Results:');
    logger.info(`   Total Queries: ${totalQueries}`);
    logger.success(`   ✅ Successful: ${successful}`);
    if (failed > 0) {
      logger.error(`   ❌ Failed: ${failed}`);
    } else {
      logger.info(`   ❌ Failed: ${failed}`);
    }
    if (skipped > 0) {
      logger.warn(`   ⏭️  Skipped: ${skipped}`);
    }
    logger.info(`   Success Rate: ${successRate}%`);
    logger.info('');

    // Throttle statistics
    if (results.throttleStats) {
      logger.info('⚡ Throttle Statistics:');
      logger.info(`   Units Used: ${Math.round(results.throttleStats.totalUnitsUsed || 0)}`);
      logger.info(`   Average Cost: ${(results.throttleStats.avgCostPerQuery || 0).toFixed(2)} units/query`);
      logger.info(`   Wait Count: ${results.throttleStats.waitCount || 0}`);
      logger.info(`   Total Wait Time: ${Math.round((results.throttleStats.totalWaitTime || 0) / 1000)}s`);
      logger.info(`   Violations: ${results.throttleStats.violations || 0}`);
      
      if (results.throttleStats.finalBudget !== undefined) {
        logger.info(`   Final Budget: ${results.throttleStats.finalBudget}/${results.throttleStats.maximumBudget}`);
      }
      logger.info('');
    }

    // Phase results
    if (results.phases && Object.keys(results.phases).length > 0) {
      logger.info('📋 Phase Results:');
      Object.entries(results.phases).forEach(([phaseName, phaseData]) => {
        const phaseSuccess = phaseData.successful || 0;
        const phaseTotal = phaseData.tested || 0;
        const phaseRate = phaseTotal > 0 ? ((phaseSuccess / phaseTotal) * 100).toFixed(0) : 0;
        logger.info(`   ${phaseName}: ${phaseSuccess}/${phaseTotal} (${phaseRate}%)`);
      });
      logger.info('');
    }

    // Relationships
    if (results.relationships && results.relationships.length > 0) {
      logger.info('🔗 Relationships Verified:');
      logger.info(`   ${results.relationships.length} relationship patterns confirmed`);
      logger.info('');
    }

    // Duration
    if (results.duration) {
      const seconds = Math.floor(results.duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        logger.info(`⏱️  Total Duration: ${minutes}m ${remainingSeconds}s`);
      } else {
        logger.info(`⏱️  Total Duration: ${seconds}s`);
      }
      logger.info('');
    }

    // Top failures
    if (results.failures && results.failures.length > 0) {
      logger.warn('⚠️  Top Failures:');
      results.failures.slice(0, 5).forEach((failure, index) => {
        logger.error(`   ${index + 1}. ${failure.queryName}: ${failure.error}`);
        if (failure.suggestion) {
          logger.info(`      → ${failure.suggestion}`);
        }
      });
      
      if (results.failures.length > 5) {
        logger.info(`   ... and ${results.failures.length - 5} more (see full report)`);
      }
      logger.info('');
    }

    logger.success('✅ Testing complete!');
    logger.info('');
  }
}

export default TestApiCommand;

