/**
 * Purpose: Iterative Test Runner - runs adaptive testing with automatic fixes and retries
 * Inputs: JobberClient, API mapping, test options
 * Outputs: Complete schema mapping results with progress tracking
 * Dependencies: SchemaIntrospector, AdaptiveQueryBuilder, logger, fs
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import SchemaIntrospector from './schema-introspector.js';
import AdaptiveQueryBuilder from './adaptive-query-builder.js';

export class IterativeTestRunner {
  constructor(client, apiMapping, options = {}) {
    this.client = client;
    this.apiMapping = apiMapping;
    this.options = options;
    
    // Initialize components
    this.introspector = new SchemaIntrospector(apiMapping);
    this.queryBuilder = new AdaptiveQueryBuilder(this.introspector);
    
    // Tracking
    this.results = {
      queries: [],
      fullyMapped: [],
      partiallyMapped: [],
      needsAdaptation: [],
      failed: [],
      permissionDenied: [],
      notTested: [],
      iterations: [],
      startTime: Date.now(),
      endTime: null
    };
    
    // ID cache for single-object queries
    this.idCache = new Map();
    
    // Progress file
    this.progressFile = options.progressFile || path.join(process.cwd(), 'docs', 'SCHEMA_MAPPING_PROGRESS.md');
  }

  /**
   * Run iterative testing until schema is fully mapped
   * @returns {Promise<Object>} Complete results
   */
  async runIterativeTests() {
    logger.info('🔄 Starting Iterative Adaptive Testing\n');
    
    const queries = this.apiMapping.queries?.list || [];
    logger.info(`Found ${queries.length} queries to map\n`);
    
    let iteration = 1;
    let remainingQueries = [...queries];
    const maxIterations = this.options.maxIterations || 3;
    
    while (remainingQueries.length > 0 && iteration <= maxIterations) {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`  ITERATION ${iteration}: Testing ${remainingQueries.length} queries`);
      logger.info(`${'='.repeat(60)}\n`);
      
      const iterationStart = Date.now();
      const iterationResults = {
        iteration,
        tested: 0,
        succeeded: 0,
        failed: 0,
        fixed: 0,
        startTime: iterationStart,
        issues: [],
        fixes: []
      };
      
      const stillFailing = [];
      
      for (const queryDef of remainingQueries) {
        iterationResults.tested++;
        
        logger.info(`[${iterationResults.tested}/${remainingQueries.length}] Testing: ${queryDef.name}`);
        
        try {
          const result = await this.testQueryAdaptively(queryDef, iteration);
          
          if (result.success) {
            iterationResults.succeeded++;
            this._recordSuccess(queryDef, result);
            logger.success(`  ✅ Success (${result.pattern})`);
          } else if (result.requiresId && !result.idAvailable) {
            // Needs ID but we don't have one yet - may succeed in next iteration
            stillFailing.push(queryDef);
            iterationResults.failed++;
            logger.warn(`  ⏳ Waiting for ID (${result.pattern})`);
          } else if (result.permissionDenied) {
            this._recordPermissionDenied(queryDef, result);
            logger.warn(`  🔒 Permission denied`);
          } else {
            stillFailing.push(queryDef);
            iterationResults.failed++;
            iterationResults.issues.push({
              query: queryDef.name,
              error: result.error,
              pattern: result.pattern
            });
            logger.error(`  ❌ Failed: ${result.error}`);
          }
          
          // Update progress after each query
          if (iterationResults.tested % 10 === 0) {
            await this.updateProgress();
            
            const throttleStatus = this.client.getThrottleStatus();
            logger.info(`\n📊 Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}\n`);
          }
          
        } catch (error) {
          iterationResults.failed++;
          stillFailing.push(queryDef);
          logger.error(`  ❌ Error: ${error.message}`);
          
          iterationResults.issues.push({
            query: queryDef.name,
            error: error.message,
            pattern: 'exception'
          });
        }
      }
      
      iterationResults.endTime = Date.now();
      iterationResults.duration = iterationResults.endTime - iterationStart;
      
      this.results.iterations.push(iterationResults);
      
      // Update progress file
      await this.updateProgress();
      
      logger.info(`\n✅ Iteration ${iteration} Complete`);
      logger.info(`   Succeeded: ${iterationResults.succeeded}`);
      logger.info(`   Failed: ${iterationResults.failed}`);
      logger.info(`   Duration: ${(iterationResults.duration / 1000).toFixed(2)}s\n`);
      
      // Prepare for next iteration
      remainingQueries = stillFailing;
      iteration++;
      
      // Stop if no more progress
      if (iterationResults.succeeded === 0 && iteration > 1) {
        logger.warn('No progress made in this iteration. Stopping.');
        break;
      }
    }
    
    this.results.endTime = Date.now();
    
    // Final progress update
    await this.updateProgress();
    
    // Generate final summary
    this.generateFinalSummary();
    
    return this.results;
  }

  /**
   * Test a single query adaptively
   * @private
   */
  async testQueryAdaptively(queryDef, iteration) {
    const queryName = queryDef.name;
    
    // Step 1: Build adaptive query
    let queryBuild = this.queryBuilder.buildAdaptiveQuery(queryDef);
    
    // Step 2: Check if it requires arguments
    if (!queryBuild.success && queryBuild.error?.includes('arguments')) {
      // Try to build with default arguments
      queryBuild = this.queryBuilder.buildQueryWithArgs(queryDef);
    }
    
    if (!queryBuild.success) {
      return {
        name: queryName,
        success: false,
        error: queryBuild.error,
        pattern: queryBuild.pattern,
        requiresCustom: true
      };
    }
    
    // Step 3: Check if it requires ID
    if (queryBuild.requiresId) {
      const entityId = this._getEntityId(queryBuild.typeName || queryName);
      
      if (!entityId) {
        return {
          name: queryName,
          success: false,
          requiresId: true,
          idAvailable: false,
          pattern: queryBuild.pattern,
          error: 'No entity ID available'
        };
      }
      
      queryBuild.variables.id = entityId;
    }
    
    // Step 4: Execute query
    const estimatedCost = this.client.estimateQueryCost(queryBuild.query);
    
    const response = await this.client.executeQuery(
      queryBuild.query,
      queryBuild.variables,
      estimatedCost,
      { silent: this.options.silent }
    );
    
    // Step 5: Analyze response
    if (response.hasErrors) {
      const error = response.errors[0];
      
      // Check for permission errors
      if (error.message?.includes('permission') || error.message?.includes('hidden due to')) {
        return {
          name: queryName,
          success: false,
          permissionDenied: true,
          error: error.message,
          pattern: queryBuild.pattern
        };
      }
      
      return {
        name: queryName,
        success: false,
        error: error.message,
        pattern: queryBuild.pattern,
        query: queryBuild.query
      };
    }
    
    // Step 6: Cache IDs from successful connection queries
    if (queryBuild.pattern === 'nodes' || queryBuild.pattern === 'edges') {
      this._cacheIdsFromResponse(queryName, response.data, queryBuild.pattern);
    }
    
    return {
      name: queryName,
      success: true,
      pattern: queryBuild.pattern,
      query: queryBuild.query,
      variables: queryBuild.variables,
      itemType: queryBuild.itemType,
      estimatedCost,
      responseSize: JSON.stringify(response.data).length
    };
  }

  /**
   * Get entity ID from cache
   * @private
   */
  _getEntityId(typeName) {
    if (!typeName) return null;
    
    const normalizedType = typeName.replace(/Connection$/, '');
    
    if (this.idCache.has(normalizedType)) {
      const ids = this.idCache.get(normalizedType);
      if (ids.length > 0) {
        return ids[0];
      }
    }
    
    return null;
  }

  /**
   * Cache IDs from connection query response
   * @private
   */
  _cacheIdsFromResponse(queryName, responseData, pattern) {
    const data = responseData[queryName];
    if (!data) return;
    
    let ids = [];
    
    if (pattern === 'nodes' && data.nodes) {
      ids = data.nodes.map(node => node.id).filter(Boolean);
    } else if (pattern === 'edges' && data.edges) {
      ids = data.edges.map(edge => edge.node?.id).filter(Boolean);
    }
    
    if (ids.length > 0) {
      const typeName = this._inferTypeFromQueryName(queryName);
      this.idCache.set(typeName, ids);
      logger.debug(`Cached ${ids.length} IDs for ${typeName}`);
    }
  }

  /**
   * Infer type name from query name
   * @private
   */
  _inferTypeFromQueryName(queryName) {
    let typeName = queryName.replace(/Connection$/, '');
    typeName = typeName.replace(/s$/, ''); // Remove plural
    return typeName.charAt(0).toUpperCase() + typeName.slice(1);
  }

  /**
   * Record successful query
   * @private
   */
  _recordSuccess(queryDef, result) {
    this.results.fullyMapped.push({
      name: queryDef.name,
      pattern: result.pattern,
      itemType: result.itemType,
      query: result.query,
      estimatedCost: result.estimatedCost
    });
    
    // Remove from other categories
    this.results.notTested = this.results.notTested.filter(q => q !== queryDef.name);
    this.results.failed = this.results.failed.filter(f => f.name !== queryDef.name);
  }

  /**
   * Record permission denied
   * @private
   */
  _recordPermissionDenied(queryDef, result) {
    this.results.permissionDenied.push({
      name: queryDef.name,
      error: result.error,
      pattern: result.pattern
    });
    
    this.results.notTested = this.results.notTested.filter(q => q !== queryDef.name);
  }

  /**
   * Update progress markdown file
   */
  async updateProgress() {
    const totalQueries = this.apiMapping.queries?.list?.length || 0;
    const fullyMapped = this.results.fullyMapped.length;
    const partiallyMapped = this.results.partiallyMapped.length;
    const permissionDenied = this.results.permissionDenied.length;
    const failed = this.results.failed.length;
    const notTested = totalQueries - fullyMapped - partiallyMapped - permissionDenied - failed;
    
    const fullyMappedPercent = ((fullyMapped / totalQueries) * 100).toFixed(1);
    
    const content = `# Jobber GraphQL Schema Mapping Progress

**Last Updated:** ${new Date().toISOString()}  
**Goal:** Complete mapping of Jobber GraphQL API for MCP server tools  
**Target Audience:** Sales reps and project managers using LLM interactions

## Overall Progress

\`\`\`
Total Queries: ${totalQueries}
├─ Fully Mapped: ${fullyMapped} (${fullyMappedPercent}%)
├─ Partially Mapped: ${partiallyMapped}
├─ Permission Denied: ${permissionDenied}
├─ Failed: ${failed}
└─ Not Tested: ${notTested}
\`\`\`

## Query Status Summary

${this._generateQueryStatusList()}

## Recent Iterations

${this._generateIterationsSummary()}

## ID Cache Status

${this._generateIdCacheStatus()}

## Throttle Usage

${this._generateThrottleStatus()}

---

*This document updates automatically during adaptive testing*  
*Last test run: ${new Date().toISOString()}*
`;
    
    try {
      fs.writeFileSync(this.progressFile, content, 'utf8');
      logger.debug(`Progress updated: ${this.progressFile}`);
    } catch (error) {
      logger.warn(`Failed to update progress: ${error.message}`);
    }
  }

  /**
   * Generate query status list for progress
   * @private
   */
  _generateQueryStatusList() {
    const lines = [];
    
    if (this.results.fullyMapped.length > 0) {
      lines.push(`### ✅ Fully Mapped (${this.results.fullyMapped.length})\n`);
      this.results.fullyMapped.forEach(q => {
        lines.push(`- **${q.name}** - ${q.pattern} pattern, cost: ${q.estimatedCost} units`);
      });
      lines.push('');
    }
    
    if (this.results.permissionDenied.length > 0) {
      lines.push(`### 🔒 Permission Denied (${this.results.permissionDenied.length})\n`);
      this.results.permissionDenied.forEach(q => {
        lines.push(`- **${q.name}** - ${q.error}`);
      });
      lines.push('');
    }
    
    if (this.results.failed.length > 0) {
      lines.push(`### ❌ Failed (${this.results.failed.length})\n`);
      this.results.failed.forEach(q => {
        lines.push(`- **${q.name}** - ${q.error || 'Unknown error'}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Generate iterations summary
   * @private
   */
  _generateIterationsSummary() {
    if (this.results.iterations.length === 0) {
      return '*No iterations completed yet*';
    }
    
    const lines = [];
    
    this.results.iterations.forEach(iter => {
      const duration = ((iter.duration || 0) / 1000).toFixed(1);
      lines.push(`### Iteration ${iter.iteration}`);
      lines.push(`- Tested: ${iter.tested}`);
      lines.push(`- Succeeded: ${iter.succeeded}`);
      lines.push(`- Failed: ${iter.failed}`);
      lines.push(`- Duration: ${duration}s`);
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * Generate ID cache status
   * @private
   */
  _generateIdCacheStatus() {
    if (this.idCache.size === 0) {
      return '*No IDs cached yet*';
    }
    
    const lines = [];
    
    for (const [typeName, ids] of this.idCache.entries()) {
      lines.push(`- **${typeName}**: ${ids.length} IDs available`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate throttle status
   * @private
   */
  _generateThrottleStatus() {
    const status = this.client.getThrottleStatus();
    
    return `- Current Budget: ${status.currentlyAvailable}/${status.maximumAvailable}
- Restore Rate: ${status.restoreRate} units/sec`;
  }

  /**
   * Generate final summary
   * @private
   */
  generateFinalSummary() {
    const totalQueries = this.apiMapping.queries?.list?.length || 0;
    const fullyMapped = this.results.fullyMapped.length;
    const permissionDenied = this.results.permissionDenied.length;
    const failed = this.results.failed.length;
    
    const mappingRate = ((fullyMapped / totalQueries) * 100).toFixed(1);
    const accessibleQueries = totalQueries - permissionDenied;
    const accessibleMappingRate = accessibleQueries > 0 
      ? ((fullyMapped / accessibleQueries) * 100).toFixed(1) 
      : 0;
    
    logger.info('\n' + '='.repeat(60));
    logger.info('  FINAL SUMMARY');
    logger.info('='.repeat(60) + '\n');
    
    logger.info(`📊 Schema Mapping Results:`);
    logger.info(`   Total Queries: ${totalQueries}`);
    logger.success(`   ✅ Fully Mapped: ${fullyMapped} (${mappingRate}%)`);
    
    if (permissionDenied > 0) {
      logger.warn(`   🔒 Permission Denied: ${permissionDenied}`);
      logger.info(`   📈 Accessible Mapping Rate: ${accessibleMappingRate}%`);
    }
    
    if (failed > 0) {
      logger.error(`   ❌ Failed: ${failed}`);
    }
    
    logger.info(`\n🔄 Iterations: ${this.results.iterations.length}`);
    logger.info(`💾 ID Cache: ${this.idCache.size} types`);
    
    const throttleStatus = this.client.getThrottleStatus();
    logger.info(`⚡ Final Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}`);
    
    logger.info(`\n📁 Progress File: ${this.progressFile}`);
    logger.info('');
  }
}

export default IterativeTestRunner;

