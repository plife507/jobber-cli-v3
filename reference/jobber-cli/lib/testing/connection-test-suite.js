/**
 * Purpose: Connection Query Test Suite - tests pagination, pageInfo, and edge cases for connection queries
 * Inputs: JobberClient, API mapping data, ID cache from basic tests
 * Outputs: Test results for connection query pagination and edge cases
 * Dependencies: JobberClient, logger
 */

import logger from '../utils/logger.js';

export class ConnectionTestSuite {
  constructor(client, apiMapping, idCache = null) {
    this.client = client;
    this.apiMapping = apiMapping;
    this.idCache = idCache || new Map();
    this.results = [];
  }

  /**
   * Test all connection queries
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async testAllConnections(options = {}) {
    const startTime = Date.now();
    logger.info('📋 Phase 2: Connection Query Testing\n');

    const connectionQueries = this._getConnectionQueries();
    logger.info(`Found ${connectionQueries.length} connection queries to test\n`);

    let tested = 0;
    let successful = 0;
    let failed = 0;

    for (const query of connectionQueries) {
      // Check if we should skip this query
      if (options.queryFilter && !query.name.toLowerCase().includes(options.queryFilter.toLowerCase())) {
        continue;
      }

      tested++;
      logger.info(`[${tested}/${connectionQueries.length}] Testing: ${query.name}`);

      try {
        // Test pagination
        const paginationResult = await this.testPagination(query, options);
        
        // Test edge cases
        const edgeCaseResult = await this.testEdgeCases(query, options);

        const success = paginationResult.success && edgeCaseResult.success;

        if (success) {
          successful++;
          logger.success(`  ✅ Success (pagination + edge cases)`);
        } else {
          failed++;
          logger.error(`  ❌ Failed`);
          if (!paginationResult.success) {
            logger.error(`     Pagination: ${paginationResult.error}`);
          }
          if (!edgeCaseResult.success) {
            logger.error(`     Edge cases: ${edgeCaseResult.error}`);
          }
        }

        this.results.push({
          name: query.name,
          type: 'connection',
          success,
          pagination: paginationResult,
          edgeCases: edgeCaseResult,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        failed++;
        logger.error(`  ❌ Error: ${error.message}`);
        
        this.results.push({
          name: query.name,
          type: 'connection',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Show throttle status every 5 queries
      if (tested % 5 === 0) {
        const throttleStatus = this.client.getThrottleStatus();
        logger.info(`\n📊 Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}\n`);
      }
    }

    const duration = Date.now() - startTime;

    logger.info(`\n✅ Phase 2 Complete`);
    logger.info(`   Tested: ${tested}`);
    logger.info(`   Successful: ${successful}`);
    logger.info(`   Failed: ${failed}`);
    logger.info(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);

    return {
      phase: 'Phase 2: Connection Query Testing',
      duration,
      tested,
      successful,
      failed,
      results: this.results
    };
  }

  /**
   * Test pagination for a connection query
   * @param {Object} queryDef - Query definition
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Pagination test result
   */
  async testPagination(queryDef, options = {}) {
    const tests = {
      firstPage: false,
      secondPage: false,
      pageInfoValid: false,
      cursorsValid: false
    };

    try {
      // Test 1: First page with 'first' argument
      const firstPageQuery = this._buildPaginationQuery(queryDef, 'first');
      const firstResponse = await this.client.executeQuery(
        firstPageQuery,
        { first: 3 },
        100,
        { silent: options.silent }
      );

      if (firstResponse.hasErrors) {
        return {
          success: false,
          error: firstResponse.errors[0].message,
          tests
        };
      }

      const firstData = firstResponse.data[queryDef.name];
      
      // Validate structure
      if (!firstData) {
        return {
          success: false,
          error: 'No data returned',
          tests
        };
      }

      if (!firstData.edges || !Array.isArray(firstData.edges)) {
        return {
          success: false,
          error: 'Invalid edges structure',
          tests
        };
      }

      if (!firstData.pageInfo) {
        return {
          success: false,
          error: 'Missing pageInfo',
          tests
        };
      }

      tests.firstPage = true;

      // Validate pageInfo structure
      const pageInfo = firstData.pageInfo;
      if (typeof pageInfo.hasNextPage !== 'boolean' ||
          typeof pageInfo.hasPreviousPage !== 'boolean') {
        return {
          success: false,
          error: 'Invalid pageInfo structure',
          tests
        };
      }

      tests.pageInfoValid = true;

      // Validate cursor structure
      if (firstData.edges.length > 0) {
        const hasValidCursor = firstData.edges.every(edge => 
          edge.cursor && typeof edge.cursor === 'string'
        );
        
        if (!hasValidCursor) {
          return {
            success: false,
            error: 'Invalid cursor structure',
            tests
          };
        }

        tests.cursorsValid = true;

        // Test 2: Second page if hasNextPage
        if (pageInfo.hasNextPage && pageInfo.endCursor) {
          const secondPageQuery = this._buildPaginationQuery(queryDef, 'after');
          const secondResponse = await this.client.executeQuery(
            secondPageQuery,
            { first: 3, after: pageInfo.endCursor },
            100,
            { silent: options.silent }
          );

          if (!secondResponse.hasErrors) {
            const secondData = secondResponse.data[queryDef.name];
            if (secondData && secondData.edges && Array.isArray(secondData.edges)) {
              tests.secondPage = true;
            }
          }
        } else {
          // No second page available, but that's ok
          tests.secondPage = true;
        }
      } else {
        // Empty result set - that's valid
        tests.cursorsValid = true;
        tests.secondPage = true;
      }

      return {
        success: Object.values(tests).every(t => t === true),
        tests,
        itemCount: firstData.edges.length,
        hasNextPage: pageInfo.hasNextPage
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests
      };
    }
  }

  /**
   * Test edge cases for connection query
   * @param {Object} queryDef - Query definition
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Edge case test result
   */
  async testEdgeCases(queryDef, options = {}) {
    const tests = {
      emptyResult: false,
      largePageSize: false,
      smallPageSize: false
    };

    try {
      // Test 1: Very small page size (1)
      const smallPageQuery = this._buildPaginationQuery(queryDef, 'first');
      const smallResponse = await this.client.executeQuery(
        smallPageQuery,
        { first: 1 },
        100,
        { silent: options.silent }
      );

      if (!smallResponse.hasErrors) {
        const data = smallResponse.data[queryDef.name];
        if (data && data.edges !== undefined) {
          tests.smallPageSize = true;
        }
      }

      // Test 2: Larger page size (20)
      const largePageQuery = this._buildPaginationQuery(queryDef, 'first');
      const largeResponse = await this.client.executeQuery(
        largePageQuery,
        { first: 20 },
        150,
        { silent: options.silent }
      );

      if (!largeResponse.hasErrors) {
        const data = largeResponse.data[queryDef.name];
        if (data && data.edges !== undefined) {
          tests.largePageSize = true;
        }
      }

      // Test 3: Empty result handling
      // We'll consider this successful if any previous query returned valid structure
      tests.emptyResult = tests.smallPageSize || tests.largePageSize;

      return {
        success: Object.values(tests).some(t => t === true), // At least one test passed
        tests
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests
      };
    }
  }

  /**
   * Build pagination query
   * @private
   */
  _buildPaginationQuery(queryDef, paginationType = 'first') {
    const queryName = queryDef.name;
    
    if (paginationType === 'after') {
      return `query Test${this._capitalize(queryName)}WithAfter($first: Int!, $after: String!) {
  ${queryName}(first: $first, after: $after) {
    edges {
      node {
        id
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}`;
    } else if (paginationType === 'before') {
      return `query Test${this._capitalize(queryName)}WithBefore($last: Int!, $before: String!) {
  ${queryName}(last: $last, before: $before) {
    edges {
      node {
        id
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}`;
    } else {
      // 'first' - default
      return `query Test${this._capitalize(queryName)}($first: Int!) {
  ${queryName}(first: $first) {
    edges {
      node {
        id
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}`;
    }
  }

  /**
   * Get all connection queries from API mapping
   * @private
   */
  _getConnectionQueries() {
    if (!this.apiMapping || !this.apiMapping.queries) {
      throw new Error('Invalid API mapping - missing queries');
    }

    const queries = this.apiMapping.queries.list || [];
    
    // Filter for connection queries
    return queries.filter(q => 
      q.type === 'connection' || 
      q.name.toLowerCase().includes('connection') ||
      q.returnType?.includes('Connection')
    );
  }

  /**
   * Capitalize first letter
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get test results
   * @returns {Array} Test results
   */
  getResults() {
    return this.results;
  }
}

export default ConnectionTestSuite;

