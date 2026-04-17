/**
 * Purpose: Error Handler - automatically analyzes GraphQL errors and consults schema for recovery suggestions
 * Inputs: GraphQL error objects, schema information
 * Outputs: Formatted error messages with suggestions, error analysis results
 * Dependencies: SchemaAnalyzer, logger, theme utilities
 */

import SchemaAnalyzer from '../schema/schema-analyzer.js';
import logger from '../utils/logger.js';
import { colorize, boldColor, colors } from '../utils/theme.js';

export class ErrorHandler {
  constructor(schemaManager = null) {
    this.schemaManager = schemaManager;
    this.analyzer = new SchemaAnalyzer();
  }

  /**
   * Set schema manager for error analysis
   * @param {SchemaManager} schemaManager - Schema manager instance
   */
  setSchemaManager(schemaManager) {
    this.schemaManager = schemaManager;
  }

  /**
   * Parse GraphQL error and extract relevant information
   * @param {Object} error - GraphQL error object or Error instance
   * @returns {Object} Parsed error information
   */
  parseError(error) {
    const errorMessage = error.message || String(error);
    const parsed = {
      message: errorMessage,
      originalError: error, // Preserve original for debugging
      type: null,
      field: null,
      suggestions: [],
      isThrottleError: false,
      isAuthError: error.isAuthError || false, // Preserve auth error flag
      isValidationError: false,
      isFieldError: false,
      isTypeError: false
    };

    // Check for authentication errors
    if (parsed.isAuthError || 
        errorMessage.toLowerCase().includes('unauthenticated') ||
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('token expired') ||
        errorMessage.toLowerCase().includes('authentication') ||
        errorMessage.includes('401')) {
      parsed.isAuthError = true;
      return parsed;
    }

    // Check for throttle errors
    if (errorMessage.toLowerCase().includes('throttle') || 
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.includes('429')) {
      parsed.isThrottleError = true;
      return parsed;
    }

    // Check for field errors (Field 'X' doesn't exist on type 'Y')
    const fieldErrorMatch = errorMessage.match(/Field ['"]([\w]+)['"] doesn't exist on type ['"]([\w]+)['"]/i);
    if (fieldErrorMatch) {
      parsed.field = fieldErrorMatch[1];
      parsed.type = fieldErrorMatch[2];
      parsed.isFieldError = true;
      parsed.isValidationError = true;
      return parsed;
    }

    // Check for type errors (Unknown type 'X')
    const typeErrorMatch = errorMessage.match(/Unknown type ['"]([\w]+)['"]/i);
    if (typeErrorMatch) {
      parsed.type = typeErrorMatch[1];
      parsed.isTypeError = true;
      parsed.isValidationError = true;
      return parsed;
    }

    // Check for argument errors (Unknown argument 'X' on field 'Y' of type 'Z')
    const argErrorMatch = errorMessage.match(/Unknown argument ['"]([\w]+)['"] on field ['"]([\w]+)['"] of type ['"]([\w]+)['"]/i);
    if (argErrorMatch) {
      parsed.field = argErrorMatch[1]; // Actually the argument name
      parsed.type = argErrorMatch[3];
      parsed.isValidationError = true;
    }

    // Preserve GraphQL error context if available
    if (error.extensions) {
      parsed.extensions = error.extensions;
    }

    if (error.path) {
      parsed.path = error.path;
    }

    return parsed;
  }

  /**
   * Generate recovery suggestions based on error and schema
   * @param {Object} parsedError - Parsed error from parseError()
   * @returns {Promise<Object>} Recovery suggestions
   */
  async getSuggestions(parsedError) {
    if (!this.schemaManager) {
      return {
        hasSuggestions: false,
        message: 'Schema manager not available for suggestions'
      };
    }

    try {
      const analysis = await this.schemaManager.getAnalysis();
      const suggestions = {
        hasSuggestions: true,
        error: parsedError,
        suggestions: []
      };

      // Handle field errors
      if (parsedError.isFieldError && parsedError.type && parsedError.field) {
        const typeInfo = this.analyzer.findType(analysis, parsedError.type);
        if (typeInfo) {
          // Find similar field names
          const similarFields = typeInfo.fields?.filter(f => 
            f.name.toLowerCase().includes(parsedError.field.toLowerCase()) ||
            parsedError.field.toLowerCase().includes(f.name.toLowerCase())
          ) || [];

          if (similarFields.length > 0) {
            suggestions.suggestions.push({
              type: 'field_replacement',
              message: `Did you mean one of these fields on ${parsedError.type}?`,
              options: similarFields.map(f => ({
                name: f.name,
                type: f.type,
                description: f.description
              }))
            });
          }

          // List all fields if similar not found
          if (similarFields.length === 0 && typeInfo.fields) {
            suggestions.suggestions.push({
              type: 'available_fields',
              message: `Available fields on ${parsedError.type}:`,
              options: typeInfo.fields.slice(0, 10).map(f => ({
                name: f.name,
                type: f.type
              }))
            });
          }
        }
      }

      // Handle type errors
      if (parsedError.isTypeError && parsedError.type) {
        const typeSuggestions = this.analyzer.getSuggestions(analysis, parsedError.type);
        if (typeSuggestions.length > 0) {
          suggestions.suggestions.push({
            type: 'type_replacement',
            message: `Did you mean one of these types?`,
            options: typeSuggestions.filter(s => s.type === 'type').map(s => ({
              name: s.name
            }))
          });
        }
      }

      // General suggestions
      if (parsedError.field || parsedError.type) {
        const generalSuggestions = this.analyzer.getSuggestions(
          analysis, 
          parsedError.field || parsedError.type
        );
        
        if (generalSuggestions.length > 0) {
          suggestions.suggestions.push({
            type: 'general',
            message: 'Similar names found:',
            options: generalSuggestions.slice(0, 5).map(s => ({
              name: s.name,
              context: s.type === 'field' ? `field on ${s.parentType}` : s.type
            }))
          });
        }
      }

      return suggestions;
    } catch (error) {
      logger.debug(`Error getting suggestions: ${error.message}`);
      return {
        hasSuggestions: false,
        message: `Could not get suggestions: ${error.message}`
      };
    }
  }

  /**
   * Handle error and provide recovery information
   * @param {Error|Object} error - Error object
   * @param {Object} options - Handling options
   * @returns {Promise<Object>} Error handling result with suggestions
   */
  async handleError(error, options = {}) {
    const parsed = this.parseError(error);
    const result = {
      error: parsed,
      suggestions: null,
      recovery: null
    };

    // For throttle errors, provide specific guidance
    if (parsed.isThrottleError) {
      result.recovery = {
        type: 'throttle',
        message: 'Rate limit exceeded. The system will automatically wait and retry.',
        action: 'wait'
      };
      return result;
    }

    // For validation errors, get suggestions
    if (parsed.isValidationError && this.schemaManager) {
      result.suggestions = await this.getSuggestions(parsed);
      
      // Generate recovery message
      if (result.suggestions.hasSuggestions) {
        result.recovery = {
          type: 'validation',
          message: 'Schema validation error detected. Use suggestions below.',
          action: 'review_suggestions',
          command: parsed.isFieldError && parsed.type 
            ? `jobber schema help ${parsed.type}` 
            : null
        };
      }
    }

    return result;
  }

  /**
   * Format error output for display in clean minimal style
   * @param {Object} errorResult - Result from handleError()
   * @returns {string} Formatted error message
   */
  formatError(errorResult) {
    const lines = [];
    
    lines.push(`${colorize('❌ Error:', colors.error)} ${boldColor(errorResult.error.message, colors.error)}`);

    if (errorResult.recovery) {
      lines.push('');
      lines.push(`${colorize('💡', colors.lightBlue)} ${colorize(errorResult.recovery.message, colors.lightBlue)}`);
      if (errorResult.recovery.command) {
        lines.push(`   ${colorize('Run:', colors.grey)} ${colorize(errorResult.recovery.command, colors.blue)}`);
      }
    }

    if (errorResult.suggestions && errorResult.suggestions.hasSuggestions) {
      lines.push('');
      lines.push(`${colorize('🔧 Suggestions:', colors.warning)}`);
      errorResult.suggestions.suggestions.forEach(suggestion => {
        lines.push('');
        lines.push(`   ${colorize(suggestion.message, colors.grey)}`);
        suggestion.options?.slice(0, 5).forEach(opt => {
          let optLine = `   • ${colorize(opt.name, colors.blue)}`;
          if (opt.type) optLine += ` ${colorize(`(${opt.type})`, colors.grey)}`;
          if (opt.description) optLine += ` ${colorize(`- ${opt.description}`, colors.grey)}`;
          lines.push(optLine);
        });
      });
    }

    return '\n' + lines.join('\n') + '\n';
  }
}

export default ErrorHandler;
