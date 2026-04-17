/**
 * Query Validator
 * Validates GraphQL queries using the graphql library for robust AST-based validation
 */

import { parse, validate, buildSchema } from 'graphql';

export class QueryValidator {
  constructor(schemaManager = null) {
    this.schemaManager = schemaManager;
    this._schema = null;
  }

  /**
   * Set schema manager for validation
   */
  setSchemaManager(schemaManager) {
    this.schemaManager = schemaManager;
    this._schema = null; // Reset cached schema
  }

  /**
   * Robust query syntax validation using GraphQL parser
   * @param {string} query - GraphQL query string
   * @returns {Object} Validation result
   */
  validateSyntax(query) {
    // Validate input
    if (!query || typeof query !== 'string') {
      return {
        valid: false,
        errors: ['Query must be a non-empty string']
      };
    }

    try {
      // Use GraphQL's parse function which validates syntax and creates AST
      // This provides much more robust validation than regex-based approaches
      parse(query);
      
      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      // GraphQL parse errors are more informative
      const errors = [error.message];
      
      // Include location information if available
      if (error.locations && error.locations.length > 0) {
        const loc = error.locations[0];
        errors.push(`at line ${loc.line}, column ${loc.column}`);
      }
      
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * Get or build GraphQL schema object from schema manager
   * @returns {Promise<GraphQLSchema|null>} Schema object or null if unavailable
   */
  async _getSchema() {
    if (this._schema) {
      return this._schema;
    }

    if (!this.schemaManager) {
      return null;
    }

    try {
      const cache = this.schemaManager.getCache();
      if (!cache.hasSchema()) {
        return null;
      }

      // Load schema SDL from cache
      const schemaSDL = cache.loadSchema();
      if (!schemaSDL) {
        return null;
      }

      // Build GraphQL schema object from SDL
      this._schema = buildSchema(schemaSDL);
      return this._schema;
    } catch (error) {
      // If schema building fails, return null (fallback to basic validation)
      return null;
    }
  }

  /**
   * Validate query against schema using GraphQL library validation
   * @param {string} query - GraphQL query string
   * @returns {Promise<Object>} Validation result
   */
  async validateAgainstSchema(query) {
    // Validate input
    if (!query || typeof query !== 'string') {
      return { valid: false, errors: ['Query must be a non-empty string'] };
    }

    // Parse once, reuse for both syntax check and schema validation
    let document;
    try {
      document = parse(query);
    } catch (error) {
      const errors = [error.message];
      if (error.locations && error.locations.length > 0) {
        const loc = error.locations[0];
        errors.push(`at line ${loc.line}, column ${loc.column}`);
      }
      return { valid: false, errors };
    }

    // Try to get schema for full validation
    const schema = await this._getSchema();

    if (!schema) {
      return {
        valid: true,
        warning: 'Schema not available for full validation. Only syntax validation was performed.'
      };
    }

    try {
      // Validate parsed AST against schema
      const validationErrors = validate(schema, document);
      
      if (validationErrors.length > 0) {
        // Format errors from GraphQL validation
        const errors = validationErrors.map(error => {
          let message = error.message;
          
          // Include location if available
          if (error.locations && error.locations.length > 0) {
            const loc = error.locations[0];
            message += ` (line ${loc.line}, column ${loc.column})`;
          }
          
          return message;
        });
        
        return {
          valid: false,
          errors
        };
      }

      return {
        valid: true,
        errors: []
      };
    } catch (error) {
      // If validation fails for any reason, return the error
      return {
        valid: false,
        errors: [error.message || 'Schema validation failed']
      };
    }
  }

  /**
   * Validate query (syntax and optionally schema)
   * @param {string} query - GraphQL query string
   * @param {boolean} checkSchema - Whether to check against schema
   * @returns {Promise<Object>} Validation result
   */
  async validate(query, checkSchema = false) {
    const syntaxResult = this.validateSyntax(query);
    
    if (!syntaxResult.valid) {
      return syntaxResult;
    }

    if (checkSchema) {
      return this.validateAgainstSchema(query);
    }

    return syntaxResult;
  }
}

export default QueryValidator;
