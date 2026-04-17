/**
 * Schema Manager
 * Main interface for schema fetching, analysis, and caching
 * Combines functionality from schema_fetcher.js and analyze_schema.js
 */

import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';
import SchemaCache from './schema-cache.js';
import SchemaAnalyzer from './schema-analyzer.js';
import Config from '../utils/config.js';
import logger from '../utils/logger.js';

export class SchemaManager {
  constructor(client = null, cacheDir = null) {
    this.client = client;
    this.cache = new SchemaCache(cacheDir);
    this.analyzer = new SchemaAnalyzer();
    this._analysis = null; // Cached analysis object
  }

  /**
   * Fetch schema from API and cache it
   * @param {Object} options - Options for fetching
   * @param {boolean} options.force - Force fetch even if cached
   * @param {boolean} options.warn - Show warnings about cost
   * @returns {Promise<string>} Path to cached schema file
   */
  async fetchSchema(options = {}) {
    if (!this.client) {
      throw new Error('JobberClient required for fetching schema');
    }

    // Check if already cached
    if (!options.force && this.cache.hasSchema()) {
      logger.info('Schema already cached. Use --force to refetch.');
      return this.cache.getPaths().schema;
    }

    // Warn about cost
    if (options.warn !== false) {
      logger.warn('⚠️  WARNING: Full schema introspection costs ~45,000 throttle units!');
      logger.info('   This is a one-time cost. The schema will be cached locally.');
      logger.info('   The script will automatically wait if throttle budget is insufficient.\n');
    }

    // Get initial throttle status
    logger.info('📡 Checking throttle status...');
    try {
      const testQuery = `query { __typename }`;
      await this.client.executeQuery(testQuery, null, 5, { silent: true });
      const throttleStatus = this.client.getThrottleStatus();
      logger.info(`   Current budget: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}`);
      logger.info(`   Restore rate: ${throttleStatus.restoreRate} units/sec\n`);
      
      // Estimate if we have enough budget
      const INTROSPECTION_COST = Config.INTROSPECTION_COST;
      if (throttleStatus.currentlyAvailable < INTROSPECTION_COST) {
        const waitTime = this.client.getThrottleManager().calculateWaitTime(INTROSPECTION_COST);
        logger.warn(`⚠️  Insufficient budget for introspection. Need to wait ${waitTime} seconds...\n`);
      }
    } catch (error) {
      logger.warn(`Could not check throttle status: ${error.message}`);
      logger.info('   Proceeding anyway...\n');
    }

    logger.info(`📡 Fetching schema from ${this.client.endpoint}...`);
    logger.info('   This may take a moment (including any necessary wait time)...\n');

    try {
      // Use client's executeQuery which handles throttling automatically
      const introspectionQuery = getIntrospectionQuery();
      const introspectionResult = await this.client.executeQuery(
        introspectionQuery, 
        null, 
        Config.INTROSPECTION_COST
      );

      if (introspectionResult.hasErrors) {
        throw new Error(`GraphQL errors: ${introspectionResult.errors.map(e => e.message).join(', ')}`);
      }

      // Show throttle status after query
      const throttleStatus = this.client.getThrottleStatus();
      logger.info('\n📊 Throttle Status After Query:');
      logger.info(`   Available: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable}`);
      logger.info(`   Estimated Cost: ~${Config.INTROSPECTION_COST} units\n`);

      // Save raw introspection data for API mapping
      this.cache.saveIntrospection(introspectionResult.data);

      // Build schema object from introspection result
      logger.info('🔨 Building schema object...');
      const graphqlSchemaObj = buildClientSchema(introspectionResult.data);

      // Convert to SDL string
      logger.info('📝 Converting to SDL format...');
      const sdlString = printSchema(graphqlSchemaObj);

      // Save to cache
      this.cache.saveSchema(sdlString);

      logger.success(`Schema saved: ${this.cache.getPaths().schema}`);
      logger.info(`   File size: ${(sdlString.length / 1024).toFixed(2)} KB\n`);

      return this.cache.getPaths().schema;

    } catch (error) {
      logger.error(`Error fetching schema: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logger.error('\n💡 This usually means:');
        logger.error('   - Your access token is invalid or expired');
        logger.error('   - Check your .env file has the correct JOBBER_ACCESS_TOKEN');
      }
      
      throw error;
    }
  }

  /**
   * Analyze cached schema
   * @param {boolean} force - Force re-analysis even if cached
   * @returns {Promise<Object>} Analysis object
   */
  async analyzeSchema(force = false) {
    // Load from cache if available
    if (!force && this._analysis) {
      return this._analysis;
    }

    // Load from file cache
    if (!force) {
      const cached = this.cache.loadAnalysis();
      if (cached) {
        this._analysis = cached;
        return cached;
      }
    }

    // Need to analyze
    const schemaContent = this.cache.loadSchema();
    if (!schemaContent) {
      throw new Error('Schema not found. Please run "schema fetch" first.');
    }

    logger.info('📖 Reading schema file...');
    logger.info('🔍 Analyzing schema...');

    const analysis = this.analyzer.analyze(schemaContent);
    const markdown = this.analyzer.generateMarkdown(analysis);

    // Save analysis
    this.cache.saveAnalysis(analysis, markdown);
    this._analysis = analysis;

    logger.success('Schema analysis complete!');
    logger.info(`\n📊 Summary:`);
    logger.info(`   - Total Queries: ${analysis.queries.length}`);
    logger.info(`   - Connection Queries: ${analysis.connections.length}`);
    logger.info(`   - Single Object Queries: ${analysis.singleObjects.length}`);
    logger.info(`   - Total Types: ${Object.keys(analysis.types).length}\n`);

    return analysis;
  }

  /**
   * Get help information for a specific type
   * @param {string} typeName - Type name to get help for
   * @returns {Promise<Object>} Type information and suggestions
   */
  async getTypeHelp(typeName) {
    const analysis = await this.analyzeSchema();
    const type = this.analyzer.findType(analysis, typeName);
    
    if (!type) {
      // Try to find similar types
      const suggestions = this.analyzer.getSuggestions(analysis, typeName);
      return {
        found: false,
        typeName,
        suggestions
      };
    }

    return {
      found: true,
      type: {
        name: type.name,
        kind: type.kind,
        description: type.description,
        fields: type.fields || []
      }
    };
  }

  /**
   * Get analysis object (loads from cache if available)
   * @returns {Promise<Object>} Analysis object
   */
  async getAnalysis() {
    return this.analyzeSchema();
  }

  /**
   * Get cached analysis (synchronous, returns null if not loaded)
   * @returns {Object|null} Analysis object or null
   */
  getCachedAnalysis() {
    return this._analysis || this.cache.loadAnalysis();
  }

  /**
   * Get schema cache instance
   * @returns {SchemaCache} Cache instance
   */
  getCache() {
    return this.cache;
  }

  /**
   * Map the entire API from introspection
   * @param {boolean} force - Force remapping even if cached
   * @returns {Promise<Object>} Complete API mapping
   */
  async mapApi(force = false) {
    // Check cache first
    if (!force) {
      const cached = this.cache.loadApiMapping();
      if (cached) {
        logger.info('API mapping loaded from cache');
        return cached;
      }
    }

    // Load introspection data
    let introspectionData = this.cache.loadIntrospection();
    
    if (!introspectionData) {
      // Need to fetch schema first
      logger.info('Introspection data not found. Fetching schema...');
      await this.fetchSchema({ warn: true });
      introspectionData = this.cache.loadIntrospection();
      
      if (!introspectionData) {
        throw new Error('Failed to get introspection data');
      }
    }

    // Map the API
    logger.info('🗺️  Mapping entire Jobber API...');
    const ApiMapper = (await import('./api-mapper.js')).default;
    const mapping = ApiMapper.mapFromIntrospection(introspectionData);

    // Generate query builders
    mapping.queryBuilders = ApiMapper.generateQueryBuilders(mapping);

    // Save mapping
    this.cache.saveApiMapping(mapping);

    logger.success('API mapping complete!');
    logger.info(`   - Queries: ${mapping.queries?.list?.length || 0}`);
    logger.info(`   - Mutations: ${mapping.mutations?.list?.length || 0}`);
    logger.info(`   - Types: ${Object.keys(mapping.types || {}).length}`);
    logger.info(`   - Connections: ${mapping.connections?.queryConnections?.length || 0}\n`);

    return mapping;
  }
}

export default SchemaManager;
