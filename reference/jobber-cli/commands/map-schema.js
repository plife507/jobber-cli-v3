/**
 * Purpose: Map Schema Command - runs adaptive iterative testing to map entire Jobber GraphQL schema
 * Inputs: Test options (max iterations, silent mode, etc.)
 * Outputs: Complete schema mapping with progress tracking
 * Dependencies: BaseCommand, IterativeTestRunner, SchemaManager, logger
 */

import { BaseCommand } from './_base.js';
import IterativeTestRunner from '../lib/testing/iterative-test-runner.js';
import { SchemaManager } from '../lib/schema/schema-manager.js';
import logger from '../lib/utils/logger.js';
import Config from '../lib/utils/config.js';

export class MapSchemaCommand extends BaseCommand {
  /**
   * Command metadata
   */
  static get commandName() {
    return 'map-schema';
  }

  static get description() {
    return 'Map entire Jobber GraphQL schema using adaptive iterative testing';
  }

  /**
   * Execute map-schema command
   */
  async run(options) {
    try {
      logger.info('\n╔═══════════════════════════════════════════════════════════╗');
      logger.info('║  Jobber GraphQL Schema Mapping - Adaptive Testing        ║');
      logger.info('╚═══════════════════════════════════════════════════════════╝\n');

      // Parse options
      const maxIterations = parseInt(options.maxIterations) || 3;

      // Display configuration
      logger.info('📋 Configuration:');
      logger.info(`   Max Iterations: ${maxIterations}`);
      logger.info(`   Progress File: ${options.progressFile}`);
      logger.info(`   Silent Mode: ${options.silent ? 'Yes' : 'No'}`);
      logger.info('');

      logger.warn('⚠️  Schema Mapping Process');
      logger.info('   This will systematically test all API queries');
      logger.info('   Queries will adapt to schema structure automatically');
      logger.info('   Progress saved continuously to survive crashes');
      logger.info('   Throttle management enabled - may take time\n');

      // Validate config
      Config.validate();

      // Initialize client
      await this.initialize();

      // Load API mapping
      logger.info('📂 Loading API mapping...');
      const schemaManager = new SchemaManager(this.client);
      
      const apiMapping = await schemaManager.mapApi(options.force);
      
      if (!apiMapping || !apiMapping.queries) {
        throw new Error('Invalid API mapping - missing queries');
      }

      const queryCount = apiMapping.queries.list?.length || 0;
      logger.success(`API mapping loaded: ${queryCount} queries found\n`);

      // Create iterative test runner
      const runner = new IterativeTestRunner(this.client, apiMapping, {
        maxIterations,
        silent: options.silent,
        progressFile: options.progressFile
      });

      // Run iterative tests
      logger.info('▶️  Starting adaptive schema mapping...\n');
      const results = await runner.runIterativeTests();

      // Display summary
      this._displaySummary(results);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      }

      // Return result (entry point handles exit codes)
      const hasFailures = results.failed.length > 0;
      if (hasFailures) {
        throw new Error('Schema mapping had failures');
      }
      return results;

    } catch (error) {
      if (error.message === 'Schema mapping had failures') throw error;
      logger.error(`Schema mapping failed: ${error.message}`);

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
    const totalQueries = results.fullyMapped.length + results.partiallyMapped.length + 
                        results.permissionDenied.length + results.failed.length + 
                        results.notTested.length;
    
    const fullyMapped = results.fullyMapped.length;
    const permissionDenied = results.permissionDenied.length;
    const failed = results.failed.length;
    
    const mappingRate = totalQueries > 0 
      ? ((fullyMapped / totalQueries) * 100).toFixed(1) 
      : 0;
    
    const accessibleQueries = totalQueries - permissionDenied;
    const accessibleMappingRate = accessibleQueries > 0 
      ? ((fullyMapped / accessibleQueries) * 100).toFixed(1) 
      : 0;

    logger.info('\n╔═══════════════════════════════════════════════════════════╗');
    logger.info('║  Schema Mapping Summary                                   ║');
    logger.info('╚═══════════════════════════════════════════════════════════╝\n');

    logger.info('📊 Overall Results:');
    logger.info(`   Total Queries: ${totalQueries}`);
    logger.success(`   ✅ Fully Mapped: ${fullyMapped} (${mappingRate}%)`);
    
    if (permissionDenied > 0) {
      logger.warn(`   🔒 Permission Denied: ${permissionDenied}`);
      logger.info(`   📈 Accessible Mapping Rate: ${accessibleMappingRate}%`);
    }
    
    if (failed > 0) {
      logger.error(`   ❌ Failed: ${failed}`);
    }
    
    logger.info('');

    // Iterations summary
    if (results.iterations && results.iterations.length > 0) {
      logger.info('🔄 Iterations:');
      results.iterations.forEach(iter => {
        const duration = ((iter.duration || 0) / 1000).toFixed(1);
        logger.info(`   Iteration ${iter.iteration}: ${iter.succeeded}/${iter.tested} succeeded (${duration}s)`);
      });
      logger.info('');
    }

    // Pattern breakdown
    const patterns = {};
    results.fullyMapped.forEach(q => {
      patterns[q.pattern] = (patterns[q.pattern] || 0) + 1;
    });

    if (Object.keys(patterns).length > 0) {
      logger.info('📋 Query Patterns Discovered:');
      Object.entries(patterns).forEach(([pattern, count]) => {
        logger.info(`   ${pattern}: ${count} queries`);
      });
      logger.info('');
    }

    // Duration
    if (results.endTime && results.startTime) {
      const duration = results.endTime - results.startTime;
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (minutes > 0) {
        logger.info(`⏱️  Total Duration: ${minutes}m ${remainingSeconds}s`);
      } else {
        logger.info(`⏱️  Total Duration: ${seconds}s`);
      }
      logger.info('');
    }

    // Top successful patterns
    if (results.fullyMapped.length > 0) {
      logger.success('✅ Successfully Mapped Queries:');
      results.fullyMapped.slice(0, 10).forEach((q, index) => {
        logger.info(`   ${index + 1}. ${q.name} (${q.pattern})`);
      });
      
      if (results.fullyMapped.length > 10) {
        logger.info(`   ... and ${results.fullyMapped.length - 10} more`);
      }
      logger.info('');
    }

    // Failed queries
    if (results.failed.length > 0) {
      logger.warn('⚠️  Failed Queries:');
      results.failed.slice(0, 5).forEach((q, index) => {
        logger.error(`   ${index + 1}. ${q.name}: ${q.error || 'Unknown error'}`);
      });
      
      if (results.failed.length > 5) {
        logger.info(`   ... and ${results.failed.length - 5} more`);
      }
      logger.info('');
    }

    logger.success('✅ Schema mapping complete!');
    logger.info(`📁 Progress saved to: ${this.options?.progressFile || './docs/SCHEMA_MAPPING_PROGRESS.md'}`);
    logger.info('');
  }
}

export default MapSchemaCommand;

