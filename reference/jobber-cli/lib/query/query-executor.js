/**
 * Query Executor
 * Executes GraphQL queries with rate limit checks and error handling
 */

import { JobberClient } from '../core/jobber-client.js';
import ErrorHandler from '../error/error-handler.js';
import logger from '../utils/logger.js';

export class QueryExecutor {
  constructor(client, errorHandler = null) {
    this.client = client;
    this.errorHandler = errorHandler || new ErrorHandler();
  }

  /**
   * Execute a GraphQL query
   * @param {string} query - GraphQL query string
   * @param {Object} variables - Query variables
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Query result with metadata
   */
  async execute(query, variables = null, options = {}) {
    try {
      const { estimatedCost, ...execOptions } = options;
      const result = await this.client.executeQuery(
        query,
        variables,
        estimatedCost,
        execOptions
      );

      // Check for GraphQL errors in result
      if (result.hasErrors || result.errors) {
        return this._handleQueryErrors(result, query, variables);
      }

      return {
        success: true,
        data: result.data,
        throttleStatus: result.throttleStatus,
        errors: null
      };
    } catch (error) {
      return this._handleExecutionError(error, query, variables);
    }
  }

  /**
   * Handle GraphQL errors in query result
   */
  async _handleQueryErrors(result, query, variables) {
    const errors = result.errors || [];
    const errorResults = [];

    for (const error of errors) {
      const errorResult = await this.errorHandler.handleError(error);
      errorResults.push(errorResult);
    }

    return {
      success: false,
      data: result.data,
      throttleStatus: result.throttleStatus,
      errors: errors,
      errorDetails: errorResults,
      suggestions: errorResults.map(r => r.suggestions).filter(s => s?.hasSuggestions)
    };
  }

  /**
   * Handle execution errors (network, etc.)
   */
  async _handleExecutionError(error, query, variables) {
    const errorResult = await this.errorHandler.handleError(error);

    return {
      success: false,
      data: null,
      throttleStatus: this.client.getThrottleStatus(),
      errors: [error.message],
      errorDetails: [errorResult],
      suggestions: errorResult.suggestions?.hasSuggestions ? [errorResult.suggestions] : []
    };
  }

  /**
   * Set error handler
   */
  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }
}

export default QueryExecutor;
