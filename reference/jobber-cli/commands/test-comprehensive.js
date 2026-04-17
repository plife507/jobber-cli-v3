/**
 * Purpose: Comprehensive Test Command - maps entire schema AND validates all relationships/data
 * Inputs: Test options (sample size, output directory)
 * Outputs: Complete schema mapping, relationship validation, inconsistency reports
 * Dependencies: BaseCommand, IterativeTestRunner, RelationshipValidator, SchemaManager, logger
 */

import { BaseCommand } from './_base.js';
import IterativeTestRunner from '../lib/testing/iterative-test-runner.js';
import RelationshipValidator from '../lib/testing/relationship-validator.js';
import SchemaIntrospector from '../lib/testing/schema-introspector.js';
import { SchemaManager } from '../lib/schema/schema-manager.js';
import logger from '../lib/utils/logger.js';
import Config from '../lib/utils/config.js';
import fs from 'fs';
import path from 'path';

export class TestComprehensiveCommand extends BaseCommand {
  /**
   * Command metadata
   */
  static get commandName() {
    return 'test-comprehensive';
  }

  static get description() {
    return 'Comprehensive schema mapping AND relationship validation testing';
  }

  /**
   * Execute comprehensive test command
   */
  async run(options) {
    try {
      logger.info('\n╔═══════════════════════════════════════════════════════════╗');
      logger.info('║  Jobber API Comprehensive Testing Suite                  ║');
      logger.info('║  Schema Mapping + Relationship Validation                 ║');
      logger.info('╚═══════════════════════════════════════════════════════════╝\n');

      // Parse options
      const sampleSize = parseInt(options.sampleSize) || 10;
      const maxIterations = parseInt(options.maxIterations) || 3;

      // Display configuration
      logger.info('📋 Configuration:');
      logger.info(`   Schema Mapping: ${options.skipMapping ? 'Skipped' : 'Enabled'}`);
      logger.info(`   Relationship Validation: ${options.skipValidation ? 'Skipped' : 'Enabled'}`);
      logger.info(`   Sample Size: ${sampleSize} jobs`);
      logger.info(`   Max Iterations: ${maxIterations}`);
      logger.info(`   Output Directory: ${options.outputDir}`);
      logger.info('');

      logger.warn('⚠️  Comprehensive Testing');
      logger.info('   This will systematically test ALL API queries');
      logger.info('   AND validate data consistency across relationships');
      logger.info('   May take several minutes to complete\n');

      // Validate config
      Config.validate();

      // Initialize client
      await this.initialize();

      const results = {
        schemaMapping: null,
        relationshipValidation: null,
        startTime: Date.now(),
        endTime: null
      };

      // PHASE 1: Schema Mapping
      if (!options.skipMapping) {
        logger.info('═'.repeat(60));
        logger.info('  PHASE 1: COMPLETE SCHEMA MAPPING');
        logger.info('═'.repeat(60) + '\n');

        results.schemaMapping = await this.runSchemaMapping(maxIterations);
      }

      // PHASE 2: Relationship Validation
      if (!options.skipValidation) {
        logger.info('\n' + '═'.repeat(60));
        logger.info('  PHASE 2: RELATIONSHIP & DATA VALIDATION');
        logger.info('═'.repeat(60) + '\n');

        results.relationshipValidation = await this.runRelationshipValidation(sampleSize);
      }

      results.endTime = Date.now();

      // Generate comprehensive report
      await this.generateComprehensiveReport(results, options.outputDir);

      // Display final summary
      this._displayFinalSummary(results);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      }

      // Return result (entry point handles exit codes)
      const hasFailures = this._hasFailures(results);
      if (hasFailures) {
        throw new Error('Comprehensive tests had failures');
      }
      return results;

    } catch (error) {
      if (error.message === 'Comprehensive tests had failures') throw error;
      logger.error(`Comprehensive testing failed: ${error.message}`);

      if (error.stack && process.env.DEBUG) {
        logger.debug(error.stack);
      }

      throw error;
    }
  }

  /**
   * Run schema mapping phase
   * @private
   */
  async runSchemaMapping(maxIterations) {
    logger.info('📂 Loading API mapping...');
    const schemaManager = new SchemaManager(this.client);
    const apiMapping = await schemaManager.mapApi();

    const queryCount = apiMapping.queries?.list?.length || 0;
    logger.success(`API mapping loaded: ${queryCount} queries found\n`);

    // Create iterative test runner
    const runner = new IterativeTestRunner(this.client, apiMapping, {
      maxIterations,
      silent: false,
      progressFile: path.join(process.cwd(), 'docs', 'SCHEMA_MAPPING_PROGRESS.md')
    });

    // Run iterative tests
    logger.info('▶️  Starting adaptive schema mapping...\n');
    const results = await runner.runIterativeTests();

    return results;
  }

  /**
   * Run relationship validation phase
   * @private
   */
  async runRelationshipValidation(sampleSize) {
    logger.info('🔍 Initializing relationship validator...\n');
    
    const introspector = new SchemaIntrospector();
    const validator = new RelationshipValidator(this.client, introspector);

    // Test random sample of jobs
    const results = await validator.testRandomJobSample(sampleSize);

    return results;
  }

  /**
   * Generate comprehensive report
   * @private
   */
  async generateComprehensiveReport(results, outputDir) {
    logger.info('\n' + '═'.repeat(60));
    logger.info('  GENERATING COMPREHENSIVE REPORTS');
    logger.info('═'.repeat(60) + '\n');

    const outputPath = outputDir ? path.resolve(outputDir) : path.join(process.cwd(), 'docs');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // 1. Schema Mapping Report
    if (results.schemaMapping) {
      const mappingReportPath = path.join(outputPath, 'SCHEMA_MAPPING_REPORT.md');
      const mappingReport = this._generateMappingReport(results.schemaMapping);
      fs.writeFileSync(mappingReportPath, mappingReport, 'utf8');
      logger.success(`Schema mapping report: ${mappingReportPath}`);
    }

    // 2. Relationship Validation Report
    if (results.relationshipValidation) {
      const validationReportPath = path.join(outputPath, 'RELATIONSHIP_VALIDATION_REPORT.md');
      const validator = new RelationshipValidator(this.client, null);
      const validationReport = validator.generateInconsistencyReport(results.relationshipValidation);
      fs.writeFileSync(validationReportPath, validationReport, 'utf8');
      logger.success(`Relationship validation report: ${validationReportPath}`);
    }

    // 3. Combined Summary
    const summaryPath = path.join(outputPath, 'COMPREHENSIVE_TEST_SUMMARY.md');
    const summary = this._generateCombinedSummary(results);
    fs.writeFileSync(summaryPath, summary, 'utf8');
    logger.success(`Combined summary: ${summaryPath}`);

    // 4. JSON Results
    const jsonPath = path.join(outputPath, 'comprehensive_test_results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
    logger.success(`JSON results: ${jsonPath}\n`);
  }

  /**
   * Generate mapping report
   * @private
   */
  _generateMappingReport(mapping) {
    const lines = [];
    
    lines.push('# Schema Mapping Report\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    
    const fullyMapped = mapping.fullyMapped?.length || 0;
    const total = 55; // Total queries
    const percent = ((fullyMapped / total) * 100).toFixed(1);
    
    lines.push('## Summary\n');
    lines.push(`- **Total Queries:** ${total}`);
    lines.push(`- **Fully Mapped:** ${fullyMapped} (${percent}%)`);
    lines.push(`- **Permission Denied:** ${mapping.permissionDenied?.length || 0}`);
    lines.push(`- **Failed:** ${mapping.failed?.length || 0}`);
    lines.push(`- **Iterations:** ${mapping.iterations?.length || 0}\n`);
    
    if (fullyMapped > 0) {
      lines.push('## Successfully Mapped Queries\n');
      mapping.fullyMapped.forEach((q, i) => {
        lines.push(`${i + 1}. **${q.name}** - ${q.pattern} pattern (${q.estimatedCost} units)`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Generate combined summary
   * @private
   */
  _generateCombinedSummary(results) {
    const lines = [];
    
    lines.push('# Comprehensive Testing Summary\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    
    const duration = results.endTime - results.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    lines.push(`**Total Duration:** ${minutes}m ${seconds}s\n`);
    
    lines.push('## Phase 1: Schema Mapping\n');
    if (results.schemaMapping) {
      const fullyMapped = results.schemaMapping.fullyMapped?.length || 0;
      lines.push(`- ✅ Fully Mapped: ${fullyMapped}/55 queries (${((fullyMapped/55)*100).toFixed(1)}%)`);
      lines.push(`- 🔄 Iterations: ${results.schemaMapping.iterations?.length || 0}`);
      lines.push(`- 💾 ID Cache: ${results.schemaMapping.idCache?.size || 0} types\n`);
    } else {
      lines.push('*Skipped*\n');
    }
    
    lines.push('## Phase 2: Relationship Validation\n');
    if (results.relationshipValidation) {
      const tested = results.relationshipValidation.tested;
      const passed = results.relationshipValidation.passed;
      const failed = results.relationshipValidation.failed;
      const passRate = tested > 0 ? ((passed / tested) * 100).toFixed(1) : 0;
      
      lines.push(`- 🎲 Jobs Tested: ${tested}`);
      lines.push(`- ✅ Passed: ${passed} (${passRate}%)`);
      lines.push(`- ❌ Failed: ${failed}`);
      lines.push(`- 🔗 Relationships Verified: ${results.relationshipValidation.totalRelationshipsVerified}`);
      lines.push(`- ⚠️  Inconsistencies Found: ${results.relationshipValidation.allInconsistencies.length}\n`);
    } else {
      lines.push('*Skipped*\n');
    }
    
    lines.push('## Overall Status\n');
    
    const allPassed = this._hasFailures(results) === false;
    
    if (allPassed) {
      lines.push('### ✅ ALL TESTS PASSED\n');
      lines.push('- Schema mapping complete');
      lines.push('- All relationships verified');
      lines.push('- No data inconsistencies found\n');
    } else {
      lines.push('### ⚠️  ISSUES FOUND\n');
      
      if (results.schemaMapping && results.schemaMapping.failed?.length > 0) {
        lines.push(`- ${results.schemaMapping.failed.length} queries still unmapped`);
      }
      
      if (results.relationshipValidation && results.relationshipValidation.failed > 0) {
        lines.push(`- ${results.relationshipValidation.failed} jobs with inconsistencies`);
        lines.push(`- ${results.relationshipValidation.allInconsistencies.length} total inconsistencies`);
      }
      lines.push('');
    }
    
    lines.push('## Recommended Actions\n');
    
    if (results.schemaMapping && results.schemaMapping.failed?.length > 0) {
      lines.push('### Unmapped Queries');
      results.schemaMapping.failed.slice(0, 5).forEach(f => {
        lines.push(`- Fix: **${f.name}** - ${f.error || 'Unknown error'}`);
      });
      lines.push('');
    }
    
    if (results.relationshipValidation && results.relationshipValidation.allInconsistencies.length > 0) {
      lines.push('### Data Inconsistencies');
      
      // Group by type
      const byType = {};
      results.relationshipValidation.allInconsistencies.forEach(inc => {
        byType[inc.type] = (byType[inc.type] || 0) + 1;
      });
      
      Object.entries(byType).slice(0, 5).forEach(([type, count]) => {
        lines.push(`- Investigate: **${type}** (${count} occurrences)`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Display final summary
   * @private
   */
  _displayFinalSummary(results) {
    logger.info('\n' + '═'.repeat(60));
    logger.info('  FINAL COMPREHENSIVE RESULTS');
    logger.info('═'.repeat(60) + '\n');

    // Schema Mapping Summary
    if (results.schemaMapping) {
      const fullyMapped = results.schemaMapping.fullyMapped?.length || 0;
      const percent = ((fullyMapped / 55) * 100).toFixed(1);
      
      logger.info('📊 Schema Mapping:');
      logger.success(`   ✅ Mapped: ${fullyMapped}/55 queries (${percent}%)`);
      
      if (results.schemaMapping.permissionDenied?.length > 0) {
        logger.warn(`   🔒 Permission Denied: ${results.schemaMapping.permissionDenied.length}`);
      }
      
      if (results.schemaMapping.failed?.length > 0) {
        logger.error(`   ❌ Failed: ${results.schemaMapping.failed.length}`);
      }
      logger.info('');
    }

    // Relationship Validation Summary
    if (results.relationshipValidation) {
      const tested = results.relationshipValidation.tested;
      const passed = results.relationshipValidation.passed;
      const inconsistencies = results.relationshipValidation.allInconsistencies.length;
      
      logger.info('🔍 Relationship Validation:');
      logger.info(`   Jobs Tested: ${tested}`);
      logger.success(`   ✅ Passed: ${passed}`);
      
      if (results.relationshipValidation.failed > 0) {
        logger.error(`   ❌ Failed: ${results.relationshipValidation.failed}`);
      }
      
      logger.info(`   🔗 Relationships Verified: ${results.relationshipValidation.totalRelationshipsVerified}`);
      
      if (inconsistencies > 0) {
        logger.warn(`   ⚠️  Inconsistencies: ${inconsistencies}`);
      } else {
        logger.success(`   ✅ No inconsistencies found!`);
      }
      logger.info('');
    }

    // Overall Status
    const allPassed = !this._hasFailures(results);
    
    if (allPassed) {
      logger.success('🎉 ALL COMPREHENSIVE TESTS PASSED!');
    } else {
      logger.warn('⚠️  Some tests found issues - see reports for details');
    }

    // Duration
    const duration = results.endTime - results.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    logger.info(`\n⏱️  Total Duration: ${minutes}m ${seconds}s`);
    logger.info('');
  }

  /**
   * Check if there are any failures
   * @private
   */
  _hasFailures(results) {
    let hasFailures = false;
    
    if (results.schemaMapping) {
      if (results.schemaMapping.failed && results.schemaMapping.failed.length > 0) {
        hasFailures = true;
      }
    }
    
    if (results.relationshipValidation) {
      if (results.relationshipValidation.failed > 0) {
        hasFailures = true;
      }
      if (results.relationshipValidation.allInconsistencies.length > 0) {
        hasFailures = true;
      }
    }
    
    return hasFailures;
  }
}

export default TestComprehensiveCommand;

