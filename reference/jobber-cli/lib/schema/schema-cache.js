/**
 * Schema Cache
 * Manages caching and retrieval of GraphQL schema files
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Config from '../utils/config.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SchemaCache {
  constructor(cacheDir = null) {
    this.cacheDir = cacheDir || Config.SCHEMA_CACHE_DIR;
    this.schemaFile = join(this.cacheDir, 'jobber_schema.graphql');
    this.analysisJson = join(this.cacheDir, 'schema_analysis.json');
    this.analysisMd = join(this.cacheDir, 'schema_analysis.md');
    this.introspectionJson = join(this.cacheDir, 'introspection_result.json');
    this.apiMappingJson = join(this.cacheDir, 'api_mapping.json');
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Check if schema file exists
   * @returns {boolean}
   */
  hasSchema() {
    return fs.existsSync(this.schemaFile);
  }

  /**
   * Check if analysis exists
   * @returns {boolean}
   */
  hasAnalysis() {
    return fs.existsSync(this.analysisJson);
  }

  /**
   * Save schema to cache
   * @param {string} schemaContent - Schema in SDL format
   */
  saveSchema(schemaContent) {
    const tmp = `${this.schemaFile}.tmp`;
    fs.writeFileSync(tmp, schemaContent, 'utf8');
    fs.renameSync(tmp, this.schemaFile);
    logger.info(`Schema cached: ${this.schemaFile}`);
  }

  /**
   * Load schema from cache
   * @returns {string|null} Schema content or null if not found
   */
  loadSchema() {
    if (!this.hasSchema()) {
      return null;
    }
    return fs.readFileSync(this.schemaFile, 'utf8');
  }

  /**
   * Save analysis to cache
   * @param {Object} analysis - Analysis object
   * @param {string} markdown - Markdown documentation
   */
  saveAnalysis(analysis, markdown) {
    const tmp = `${this.analysisJson}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(analysis, null, 2), 'utf8');
    fs.renameSync(tmp, this.analysisJson);
    if (markdown) {
      const tmpMd = `${this.analysisMd}.tmp`;
      fs.writeFileSync(tmpMd, markdown, 'utf8');
      fs.renameSync(tmpMd, this.analysisMd);
    }
    logger.info(`Analysis cached: ${this.analysisJson}`);
  }

  /**
   * Load analysis from cache
   * @returns {Object|null} Analysis object or null if not found
   */
  loadAnalysis() {
    if (!this.hasAnalysis()) {
      return null;
    }
    try {
      const content = fs.readFileSync(this.analysisJson, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error loading analysis: ${error.message}`);
      return null;
    }
  }

  /**
   * Save introspection result
   * @param {Object} introspectionData - Raw introspection data
   */
  saveIntrospection(introspectionData) {
    const tmp = `${this.introspectionJson}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(introspectionData, null, 2), 'utf8');
    fs.renameSync(tmp, this.introspectionJson);
    logger.info(`Introspection saved: ${this.introspectionJson}`);
  }

  /**
   * Load introspection result
   * @returns {Object|null} Introspection data or null
   */
  loadIntrospection() {
    if (!fs.existsSync(this.introspectionJson)) {
      return null;
    }
    try {
      const content = fs.readFileSync(this.introspectionJson, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error loading introspection: ${error.message}`);
      return null;
    }
  }

  /**
   * Save API mapping
   * @param {Object} mapping - API mapping object
   */
  saveApiMapping(mapping) {
    const tmp = `${this.apiMappingJson}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(mapping, null, 2), 'utf8');
    fs.renameSync(tmp, this.apiMappingJson);
    logger.info(`API mapping saved: ${this.apiMappingJson}`);
  }

  /**
   * Load API mapping
   * @returns {Object|null} API mapping or null
   */
  loadApiMapping() {
    if (!fs.existsSync(this.apiMappingJson)) {
      return null;
    }
    try {
      const content = fs.readFileSync(this.apiMappingJson, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Error loading API mapping: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if introspection exists
   * @returns {boolean}
   */
  hasIntrospection() {
    return fs.existsSync(this.introspectionJson);
  }

  /**
   * Check if API mapping exists
   * @returns {boolean}
   */
  hasApiMapping() {
    return fs.existsSync(this.apiMappingJson);
  }

  /**
   * Get cache file paths
   * @returns {Object} Cache file paths
   */
  getPaths() {
    return {
      schema: this.schemaFile,
      analysisJson: this.analysisJson,
      analysisMd: this.analysisMd,
      introspectionJson: this.introspectionJson,
      apiMappingJson: this.apiMappingJson,
      cacheDir: this.cacheDir
    };
  }

  /**
   * Clear all cached files
   */
  clear() {
    if (fs.existsSync(this.schemaFile)) {
      fs.unlinkSync(this.schemaFile);
    }
    if (fs.existsSync(this.analysisJson)) {
      fs.unlinkSync(this.analysisJson);
    }
    if (fs.existsSync(this.analysisMd)) {
      fs.unlinkSync(this.analysisMd);
    }
    if (fs.existsSync(this.introspectionJson)) {
      fs.unlinkSync(this.introspectionJson);
    }
    if (fs.existsSync(this.apiMappingJson)) {
      fs.unlinkSync(this.apiMappingJson);
    }
    logger.info('Schema cache cleared');
  }
}

export default SchemaCache;
