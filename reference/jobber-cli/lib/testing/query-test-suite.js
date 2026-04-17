/**
 * Purpose: Basic Query Test Suite - tests individual queries with minimal and full field selections
 * Inputs: JobberClient, API mapping data, list of queries to test
 * Outputs: Test results with success/failure status, query examples, error details
 * Dependencies: JobberClient, logger
 */

import logger from '../utils/logger.js';

export class QueryTestSuite {
  constructor(client, apiMapping) {
    this.client = client;
    this.apiMapping = apiMapping;
    this.results = [];
    this.idCache = new Map(); // Cache IDs for single-object queries
  }

  /**
   * Test all queries systematically
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async testAllQueries(options = {}) {
    const startTime = Date.now();
    logger.info('📋 Phase 1: Basic Query Verification\n');

    const queries = this._getAllQueries();
    logger.info(`Found ${queries.length} queries to test\n`);

    let tested = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const query of queries) {
      // Check if we should skip this query
      if (options.queryFilter && !this._matchesFilter(query.name, options.queryFilter)) {
        continue;
      }

      tested++;
      logger.info(`[${tested}/${queries.length}] Testing: ${query.name}`);

      try {
        const result = await this.testQuery(query, options);
        
        if (result.success) {
          successful++;
          logger.success(`  ✅ Success`);
        } else if (result.skipped) {
          skipped++;
          logger.warn(`  ⏭️  Skipped: ${result.reason}`);
        } else {
          failed++;
          logger.error(`  ❌ Failed: ${result.error}`);
        }

        this.results.push(result);

        // Show throttle status every 10 queries
        if (tested % 10 === 0) {
          const throttleStatus = this.client.getThrottleStatus();
          logger.info(`\n📊 Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}\n`);
        }

      } catch (error) {
        failed++;
        logger.error(`  ❌ Error: ${error.message}`);
        
        this.results.push({
          name: query.name,
          type: query.type,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info(`\n✅ Phase 1 Complete`);
    logger.info(`   Tested: ${tested}`);
    logger.info(`   Successful: ${successful}`);
    logger.info(`   Failed: ${failed}`);
    logger.info(`   Skipped: ${skipped}`);
    logger.info(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);

    return {
      phase: 'Phase 1: Basic Query Verification',
      duration,
      tested,
      successful,
      failed,
      skipped,
      results: this.results
    };
  }

  /**
   * Test a single query
   * @param {Object} queryDef - Query definition from API mapping
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test result
   */
  async testQuery(queryDef, options = {}) {
    const startTime = Date.now();

    try {
      // Determine query type - check multiple signals for connection queries
      const isConnection = queryDef.type === 'connection' || 
                          queryDef.name.toLowerCase().includes('connection') ||
                          queryDef.returnType?.includes('Connection') ||
                          this._isConnectionReturnType(queryDef);
      const requiresId = queryDef.args?.some(arg => arg.name === 'id' && arg.required);

      let queryString, variables;

      if (isConnection) {
        // Connection query - test with pagination
        queryString = this._buildConnectionQuery(queryDef);
        variables = { first: 5 }; // Request small page
      } else if (requiresId) {
        // Single-object query - need to get ID first
        const entityId = await this._getEntityId(queryDef, options);
        
        if (!entityId) {
          return {
            name: queryDef.name,
            type: 'single',
            success: false,
            skipped: true,
            reason: 'No entity ID available',
            timestamp: new Date().toISOString()
          };
        }

        queryString = this._buildSingleObjectQuery(queryDef);
        variables = { id: entityId };
      } else {
        // Query without required arguments - could still be a connection query
        // Check if it accepts pagination arguments
        const hasPaginationArgs = queryDef.args?.some(arg => 
          ['first', 'last', 'before', 'after'].includes(arg.name)
        );
        
        if (hasPaginationArgs) {
          // It's a connection query
          queryString = this._buildConnectionQuery(queryDef);
          variables = { first: 5 };
        } else {
          // Basic query without arguments
          queryString = this._buildBasicQuery(queryDef);
          variables = {};
        }
      }

      // Estimate cost
      const estimatedCost = this.client.estimateQueryCost(queryString);

      // Execute query with throttle management
      const response = await this.client.executeQuery(
        queryString,
        variables,
        estimatedCost,
        { silent: options.silent }
      );

      const duration = Date.now() - startTime;

      // Check for errors
      if (response.hasErrors) {
        return {
          name: queryDef.name,
          type: isConnection ? 'connection' : 'single',
          success: false,
          error: response.errors?.[0]?.message || 'Unknown error',
          query: queryString,
          variables,
          estimatedCost,
          duration,
          timestamp: new Date().toISOString()
        };
      }

      // Cache IDs from successful connection queries
      if (isConnection && response.data) {
        this._cacheIdsFromResponse(queryDef.name, response.data);
      }

      return {
        name: queryDef.name,
        type: isConnection ? 'connection' : 'single',
        success: true,
        query: queryString,
        variables,
        estimatedCost,
        duration,
        responseSize: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        name: queryDef.name,
        type: queryDef.type || 'unknown',
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build connection query with minimal fields
   * @private
   */
  _buildConnectionQuery(queryDef) {
    const queryName = queryDef.name;
    
    return `query Test${this._capitalize(queryName)} {
  ${queryName}(first: 5) {
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

  /**
   * Build single-object query with minimal fields
   * @private
   */
  _buildSingleObjectQuery(queryDef) {
    const queryName = queryDef.name;
    
    return `query Test${this._capitalize(queryName)}($id: ID!) {
  ${queryName}(id: $id) {
    id
  }
}`;
  }

  /**
   * Build basic query (no required args)
   * @private
   */
  _buildBasicQuery(queryDef) {
    const queryName = queryDef.name;
    
    return `query Test${this._capitalize(queryName)} {
  ${queryName} {
    id
  }
}`;
  }

  /**
   * Get entity ID for single-object queries
   * @private
   */
  async _getEntityId(queryDef, options) {
    const typeName = this._inferTypeFromQueryName(queryDef.name);
    
    // Check cache first
    if (this.idCache.has(typeName)) {
      const ids = this.idCache.get(typeName);
      if (ids.length > 0) {
        return ids[0];
      }
    }

    // Try to fetch from corresponding connection query
    const connectionQueryName = this._findConnectionQueryForType(typeName);
    
    if (connectionQueryName) {
      try {
        const query = `query GetIds {
  ${connectionQueryName}(first: 1) {
    edges {
      node {
        id
      }
    }
  }
}`;

        const response = await this.client.executeQuery(query, {}, 50, { silent: true });
        
        if (response.data && !response.hasErrors) {
          const edges = response.data[connectionQueryName]?.edges || [];
          if (edges.length > 0) {
            const id = edges[0].node.id;
            this._cacheId(typeName, id);
            return id;
          }
        }
      } catch (error) {
        logger.debug(`Failed to fetch ID for ${typeName}: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Cache IDs from connection query response
   * @private
   */
  _cacheIdsFromResponse(queryName, responseData) {
    const data = responseData[queryName];
    if (!data || !data.edges) return;

    const typeName = this._inferTypeFromQueryName(queryName);
    const ids = data.edges.map(edge => edge.node.id).filter(Boolean);

    if (ids.length > 0) {
      this.idCache.set(typeName, ids);
      logger.debug(`Cached ${ids.length} IDs for ${typeName}`);
    }
  }

  /**
   * Cache single ID
   * @private
   */
  _cacheId(typeName, id) {
    if (!this.idCache.has(typeName)) {
      this.idCache.set(typeName, []);
    }
    this.idCache.get(typeName).push(id);
  }

  /**
   * Get all queries from API mapping
   * @private
   */
  _getAllQueries() {
    if (!this.apiMapping || !this.apiMapping.queries) {
      throw new Error('Invalid API mapping - missing queries');
    }

    // Return query list from mapping
    return this.apiMapping.queries.list || [];
  }

  /**
   * Infer type name from query name
   * @private
   */
  _inferTypeFromQueryName(queryName) {
    // Remove common suffixes
    let typeName = queryName.replace(/Connection$/, '');
    typeName = typeName.replace(/^get/, '');
    
    // Capitalize first letter
    return this._capitalize(typeName);
  }

  /**
   * Find connection query for a type
   * @private
   */
  _findConnectionQueryForType(typeName) {
    const queries = this._getAllQueries();
    
    // Try pluralized form
    const plural = typeName.toLowerCase() + 's';
    let found = queries.find(q => q.name.toLowerCase() === plural);
    if (found) return found.name;

    // Try with "Connection" suffix
    const connectionName = typeName.toLowerCase() + 'sConnection';
    found = queries.find(q => q.name.toLowerCase() === connectionName);
    if (found) return found.name;

    // Try singular
    const singular = typeName.toLowerCase();
    found = queries.find(q => q.name.toLowerCase() === singular + 'connection');
    if (found) return found.name;

    return null;
  }

  /**
   * Check if query matches filter
   * @private
   */
  _matchesFilter(queryName, filter) {
    if (!filter) return true;
    
    const lowerQuery = queryName.toLowerCase();
    const lowerFilter = filter.toLowerCase();
    
    return lowerQuery.includes(lowerFilter);
  }

  /**
   * Check if query returns a connection type
   * @private
   */
  _isConnectionReturnType(queryDef) {
    if (!queryDef.returnType) return false;
    
    // Check if return type name indicates a connection
    if (typeof queryDef.returnType === 'string') {
      return queryDef.returnType.includes('Connection');
    }
    
    // Check if returnType is an object with a name field
    if (queryDef.returnType.name) {
      return queryDef.returnType.name.includes('Connection');
    }
    
    return false;
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

  /**
   * Get ID cache (for use by other test suites)
   * @returns {Map} ID cache
   */
  getIdCache() {
    return this.idCache;
  }
}

export default QueryTestSuite;

