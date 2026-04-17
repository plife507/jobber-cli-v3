/**
 * Purpose: API Verification Test Runner - orchestrates all test phases and generates comprehensive reports
 * Inputs: JobberClient, API mapping data, test phase selection options
 * Outputs: Complete test results, JSON reports, Markdown documentation
 * Dependencies: QueryTestSuite, ConnectionTestSuite, RelationshipTestSuite, TestReporter, logger
 */

import logger from '../utils/logger.js';
import { JobberClient } from '../core/jobber-client.js';
import { SchemaManager } from '../schema/schema-manager.js';
import QueryTestSuite from './query-test-suite.js';
import ConnectionTestSuite from './connection-test-suite.js';
import RelationshipTestSuite from './relationship-test-suite.js';
import TestReporter from './test-reporter.js';
import Config from '../utils/config.js';

export class ApiVerificationTester {
  constructor(options = {}) {
    this.options = options;
    this.client = null;
    this.apiMapping = null;
    this.results = {
      phases: {},
      queries: [],
      failures: [],
      relationships: [],
      throttleStats: {
        totalUnitsUsed: 0,
        avgCostPerQuery: 0,
        waitCount: 0,
        totalWaitTime: 0,
        violations: 0
      },
      startTime: null,
      endTime: null,
      duration: 0
    };
  }

  /**
   * Initialize the tester
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('🚀 Initializing API Verification Tester\n');

    // Validate config
    try {
      Config.validate();
    } catch (error) {
      logger.error(`Configuration error: ${error.message}`);
      throw error;
    }

    // Initialize client
    this.client = new JobberClient(
      Config.API_URL,
      Config.ACCESS_TOKEN,
      Config.API_VERSION
    );

    // Track throttle events
    this.client.getThrottleManager().on('waiting', (data) => {
      this.results.throttleStats.waitCount++;
      this.results.throttleStats.totalWaitTime += data.waitTime;
    });

    // Load API mapping
    logger.info('📂 Loading API mapping...');
    const schemaManager = new SchemaManager(this.client);
    
    try {
      this.apiMapping = await schemaManager.mapApi(this.options.force);
      
      if (!this.apiMapping || !this.apiMapping.queries) {
        throw new Error('Invalid API mapping - missing queries');
      }

      const queryCount = this.apiMapping.queries.list?.length || 0;
      logger.success(`API mapping loaded: ${queryCount} queries found\n`);

      // Store totals for reporting
      this.results.totalConnectionQueries = this.apiMapping.queries.list.filter(q => 
        q.type === 'connection' || q.name.includes('Connection')
      ).length;
      
      this.results.totalSingleObjectQueries = queryCount - this.results.totalConnectionQueries;

    } catch (error) {
      logger.error(`Failed to load API mapping: ${error.message}`);
      throw error;
    }

    logger.info('✅ Initialization complete\n');
  }

  /**
   * Run all test phases
   * @returns {Promise<Object>} Complete test results
   */
  async runAllTests() {
    this.results.startTime = Date.now();

    try {
      // Phase 1: Basic Query Verification
      if (this._shouldRunPhase(1)) {
        const phase1Results = await this.runPhase1();
        this.results.phases['Phase 1'] = phase1Results;
        this._mergeResults(phase1Results);
      }

      // Phase 2: Connection Query Testing
      if (this._shouldRunPhase(2)) {
        const phase2Results = await this.runPhase2();
        this.results.phases['Phase 2'] = phase2Results;
        this._mergeResults(phase2Results);
      }

      // Phase 3: Cross-Connection Testing
      if (this._shouldRunPhase(3)) {
        const phase3Results = await this.runPhase3();
        this.results.phases['Phase 3'] = phase3Results;
        this._mergeResults(phase3Results);
        
        // Store relationships
        if (phase3Results.relationships) {
          this.results.relationships = phase3Results.relationships;
        }
      }

      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;

      // Calculate final statistics
      this._calculateFinalStats();

      // Generate reports
      if (!this.options.noReport) {
        await this.generateReports();
      }

      return this.results;

    } catch (error) {
      logger.error(`Test execution failed: ${error.message}`);
      throw error;
    } finally {
      // Cleanup
      if (this.client) {
        this.client.cleanup();
      }
    }
  }

  /**
   * Run Phase 1: Basic Query Verification
   * @returns {Promise<Object>} Phase 1 results
   */
  async runPhase1() {
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('  PHASE 1: Basic Query Verification');
    logger.info('═══════════════════════════════════════════════════════\n');

    const suite = new QueryTestSuite(this.client, this.apiMapping);
    const results = await suite.testAllQueries({
      queryFilter: this.options.query,
      silent: this.options.silent
    });

    // Store ID cache for later phases
    this.idCache = suite.getIdCache();

    return results;
  }

  /**
   * Run Phase 2: Connection Query Testing
   * @returns {Promise<Object>} Phase 2 results
   */
  async runPhase2() {
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('  PHASE 2: Connection Query Testing');
    logger.info('═══════════════════════════════════════════════════════\n');

    const suite = new ConnectionTestSuite(this.client, this.apiMapping, this.idCache);
    const results = await suite.testAllConnections({
      queryFilter: this.options.query,
      silent: this.options.silent
    });

    return results;
  }

  /**
   * Run Phase 3: Cross-Connection Testing
   * @returns {Promise<Object>} Phase 3 results
   */
  async runPhase3() {
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('  PHASE 3: Cross-Connection Testing');
    logger.info('═══════════════════════════════════════════════════════\n');

    const suite = new RelationshipTestSuite(this.client, this.apiMapping, this.idCache);
    const results = await suite.testRelationships({
      silent: this.options.silent
    });

    return results;
  }

  /**
   * Generate all reports
   * @returns {Promise<Object>} Report file paths
   */
  async generateReports() {
    logger.info('\n═══════════════════════════════════════════════════════');
    logger.info('  Generating Reports');
    logger.info('═══════════════════════════════════════════════════════\n');

    const reporter = new TestReporter({ outputDir: this.options.outputDir });
    const reportPaths = reporter.generateReports(this.results);

    logger.success('\n📊 Reports generated:');
    logger.info(`   JSON: ${reportPaths.json}`);
    logger.info(`   Summary: ${reportPaths.summary}`);
    logger.info(`   Examples: ${reportPaths.examples}`);
    logger.info(`   Relationships: ${reportPaths.relationships}\n`);

    return reportPaths;
  }

  /**
   * Determine if a phase should run based on options
   * @private
   */
  _shouldRunPhase(phaseNumber) {
    if (this.options.phase === 'all') return true;
    if (this.options.phase === phaseNumber) return true;
    if (!this.options.phase) return true; // Default: run all
    
    return false;
  }

  /**
   * Merge phase results into main results
   * @private
   */
  _mergeResults(phaseResults) {
    if (phaseResults.results) {
      this.results.queries.push(...phaseResults.results);
    }

    // Extract failures
    if (phaseResults.results) {
      const failures = phaseResults.results
        .filter(r => !r.success && !r.skipped)
        .map(r => ({
          queryName: r.name || `${r.from} → ${r.to}`,
          error: r.error,
          type: r.type,
          suggestion: this._getSuggestionForError(r.error)
        }));
      
      this.results.failures.push(...failures);
    }
  }

  /**
   * Calculate final statistics
   * @private
   */
  _calculateFinalStats() {
    // Calculate throttle stats
    const queriesWithCost = this.results.queries.filter(q => q.estimatedCost);
    
    if (queriesWithCost.length > 0) {
      const totalCost = queriesWithCost.reduce((sum, q) => sum + q.estimatedCost, 0);
      this.results.throttleStats.totalUnitsUsed = totalCost;
      this.results.throttleStats.avgCostPerQuery = totalCost / queriesWithCost.length;
    }

    // Get final throttle status
    if (this.client) {
      const finalStatus = this.client.getThrottleStatus();
      this.results.throttleStats.finalBudget = finalStatus.currentlyAvailable;
      this.results.throttleStats.maximumBudget = finalStatus.maximumAvailable;
    }
  }

  /**
   * Get suggestion for error
   * @private
   */
  _getSuggestionForError(errorMessage) {
    if (!errorMessage) return null;

    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('not found') || lowerError.includes('does not exist')) {
      return 'Verify query name and arguments match API schema';
    }

    if (lowerError.includes('required') || lowerError.includes('missing')) {
      return 'Check required arguments and their types';
    }

    if (lowerError.includes('permission') || lowerError.includes('unauthorized')) {
      return 'Verify API token has necessary permissions';
    }

    if (lowerError.includes('throttle') || lowerError.includes('rate limit')) {
      return 'Increase wait time between queries';
    }

    return null;
  }

  /**
   * Get test results
   * @returns {Object} Complete test results
   */
  getResults() {
    return this.results;
  }
}

export default ApiVerificationTester;

