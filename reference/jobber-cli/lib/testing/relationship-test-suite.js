/**
 * Purpose: Relationship Test Suite - tests cross-connections and nested queries between types
 * Inputs: JobberClient, API mapping data, ID cache from previous tests
 * Outputs: Test results for relationship traversal and nested queries
 * Dependencies: JobberClient, logger
 */

import logger from '../utils/logger.js';

export class RelationshipTestSuite {
  constructor(client, apiMapping, idCache = null) {
    this.client = client;
    this.apiMapping = apiMapping;
    this.idCache = idCache || new Map();
    this.results = [];
    this.relationships = [];
  }

  /**
   * Test relationships between types
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async testRelationships(options = {}) {
    const startTime = Date.now();
    logger.info('📋 Phase 3: Cross-Connection Testing\n');

    // Define common relationship patterns to test
    const relationshipPatterns = this._defineRelationshipPatterns();
    
    logger.info(`Testing ${relationshipPatterns.length} relationship patterns\n`);

    let tested = 0;
    let successful = 0;
    let failed = 0;

    for (const pattern of relationshipPatterns) {
      tested++;
      logger.info(`[${tested}/${relationshipPatterns.length}] Testing: ${pattern.from} → ${pattern.to}`);

      try {
        const result = await this.testRelationship(pattern, options);
        
        if (result.success) {
          successful++;
          logger.success(`  ✅ Success`);
          
          // Record verified relationship
          this.relationships.push({
            from: pattern.from,
            to: pattern.to,
            field: pattern.field,
            relationshipType: pattern.type,
            verified: true,
            depth: pattern.depth || 1
          });
        } else {
          failed++;
          if (result.skipped) {
            logger.warn(`  ⏭️  Skipped: ${result.reason}`);
          } else {
            logger.error(`  ❌ Failed: ${result.error}`);
          }
        }

        this.results.push(result);

      } catch (error) {
        failed++;
        logger.error(`  ❌ Error: ${error.message}`);
        
        this.results.push({
          from: pattern.from,
          to: pattern.to,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      // Show throttle status every 5 tests
      if (tested % 5 === 0) {
        const throttleStatus = this.client.getThrottleStatus();
        logger.info(`\n📊 Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}\n`);
      }
    }

    const duration = Date.now() - startTime;

    logger.info(`\n✅ Phase 3 Complete`);
    logger.info(`   Tested: ${tested}`);
    logger.info(`   Successful: ${successful}`);
    logger.info(`   Failed: ${failed}`);
    logger.info(`   Relationships verified: ${this.relationships.length}`);
    logger.info(`   Duration: ${(duration / 1000).toFixed(2)}s\n`);

    return {
      phase: 'Phase 3: Cross-Connection Testing',
      duration,
      tested,
      successful,
      failed,
      relationships: this.relationships,
      results: this.results
    };
  }

  /**
   * Test a specific relationship pattern
   * @param {Object} pattern - Relationship pattern definition
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test result
   */
  async testRelationship(pattern, options = {}) {
    const startTime = Date.now();

    try {
      // Get ID for the source entity
      const sourceId = await this._getEntityId(pattern.from);
      
      if (!sourceId) {
        return {
          from: pattern.from,
          to: pattern.to,
          success: false,
          skipped: true,
          reason: `No ${pattern.from} ID available`,
          timestamp: new Date().toISOString()
        };
      }

      // Build nested query
      const queryString = this._buildNestedQuery(pattern, sourceId);
      const estimatedCost = this.client.estimateQueryCost(queryString);

      // Execute query
      const response = await this.client.executeQuery(
        queryString,
        pattern.variables || {},
        estimatedCost,
        { silent: options.silent }
      );

      const duration = Date.now() - startTime;

      // Check for errors
      if (response.hasErrors) {
        return {
          from: pattern.from,
          to: pattern.to,
          success: false,
          error: response.errors[0].message,
          query: queryString,
          estimatedCost,
          duration,
          timestamp: new Date().toISOString()
        };
      }

      // Validate that nested data is present
      const data = response.data[pattern.queryName];
      if (!data) {
        return {
          from: pattern.from,
          to: pattern.to,
          success: false,
          error: 'No data returned',
          query: queryString,
          duration,
          timestamp: new Date().toISOString()
        };
      }

      // Check if nested field exists
      const nestedField = data[pattern.field];
      const hasNestedData = nestedField !== undefined && nestedField !== null;

      return {
        from: pattern.from,
        to: pattern.to,
        field: pattern.field,
        success: true,
        hasNestedData,
        query: queryString,
        estimatedCost,
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        from: pattern.from,
        to: pattern.to,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Define common relationship patterns to test
   * @private
   */
  _defineRelationshipPatterns() {
    return [
      // Job relationships
      {
        from: 'Job',
        to: 'Client',
        field: 'client',
        queryName: 'job',
        type: 'one-to-one',
        depth: 1
      },
      {
        from: 'Job',
        to: 'Property',
        field: 'property',
        queryName: 'job',
        type: 'one-to-one',
        depth: 1
      },
      {
        from: 'Job',
        to: 'LineItem',
        field: 'lineItems',
        queryName: 'job',
        type: 'one-to-many',
        depth: 1
      },
      {
        from: 'Job',
        to: 'Visit',
        field: 'visits',
        queryName: 'job',
        type: 'one-to-many',
        depth: 1
      },
      {
        from: 'Job',
        to: 'Quote',
        field: 'quotes',
        queryName: 'job',
        type: 'one-to-many',
        depth: 1
      },
      {
        from: 'Job',
        to: 'Invoice',
        field: 'invoices',
        queryName: 'job',
        type: 'one-to-many',
        depth: 1
      },
      
      // Client relationships
      {
        from: 'Client',
        to: 'Property',
        field: 'properties',
        queryName: 'client',
        type: 'one-to-many',
        depth: 1
      },
      {
        from: 'Client',
        to: 'Job',
        field: 'jobs',
        queryName: 'client',
        type: 'one-to-many',
        depth: 1
      },
      
      // Visit relationships
      {
        from: 'Visit',
        to: 'Job',
        field: 'job',
        queryName: 'visit',
        type: 'one-to-one',
        depth: 1
      },
      
      // Quote relationships
      {
        from: 'Quote',
        to: 'Job',
        field: 'job',
        queryName: 'quote',
        type: 'one-to-one',
        depth: 1
      },
      {
        from: 'Quote',
        to: 'Client',
        field: 'client',
        queryName: 'quote',
        type: 'one-to-one',
        depth: 1
      },
      
      // Invoice relationships
      {
        from: 'Invoice',
        to: 'Job',
        field: 'job',
        queryName: 'invoice',
        type: 'one-to-one',
        depth: 1
      },
      {
        from: 'Invoice',
        to: 'Client',
        field: 'client',
        queryName: 'invoice',
        type: 'one-to-one',
        depth: 1
      },
      
      // Property relationships
      {
        from: 'Property',
        to: 'Client',
        field: 'client',
        queryName: 'property',
        type: 'one-to-one',
        depth: 1
      },
      
      // User relationships
      {
        from: 'User',
        to: 'Account',
        field: 'account',
        queryName: 'user',
        type: 'one-to-one',
        depth: 1
      }
    ];
  }

  /**
   * Build nested query to test relationship
   * @private
   */
  _buildNestedQuery(pattern, sourceId) {
    const { queryName, field, to } = pattern;
    
    // Determine if the nested field is a connection or direct object
    const isConnection = pattern.type === 'one-to-many';
    
    let nestedFields;
    if (isConnection) {
      // It's a connection (edges/nodes)
      nestedFields = `{
      edges {
        node {
          id
        }
      }
    }`;
    } else {
      // It's a direct object
      nestedFields = `{
      id
    }`;
    }

    return `query Test${this._capitalize(queryName)}To${to} {
  ${queryName}(id: "${sourceId}") {
    id
    ${field} ${nestedFields}
  }
}`;
  }

  /**
   * Get entity ID from cache
   * @private
   */
  async _getEntityId(typeName) {
    // Check cache
    if (this.idCache.has(typeName)) {
      const ids = this.idCache.get(typeName);
      if (ids.length > 0) {
        return ids[0];
      }
    }

    // Try to fetch one
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
   * Find connection query for a type
   * @private
   */
  _findConnectionQueryForType(typeName) {
    const queries = this.apiMapping?.queries?.list || [];
    
    // Try lowercase plural
    const lowerType = typeName.toLowerCase();
    const plural = lowerType + 's';
    
    let found = queries.find(q => q.name.toLowerCase() === plural);
    if (found) return found.name;

    // Try with "Connection" suffix
    const connectionName = plural + 'connection';
    found = queries.find(q => q.name.toLowerCase() === connectionName);
    if (found) return found.name;

    // Try exact match
    found = queries.find(q => q.name.toLowerCase() === lowerType);
    if (found) return found.name;

    return null;
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
   * Get verified relationships
   * @returns {Array} Relationships
   */
  getRelationships() {
    return this.relationships;
  }
}

export default RelationshipTestSuite;

