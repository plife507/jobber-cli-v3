/**
 * Purpose: Query Command - executes custom GraphQL queries against Jobber API
 * Inputs: GraphQL query string or file path, optional variables JSON
 * Outputs: Raw JSON responses from API, formatted output
 * Dependencies: BaseCommand, QueryValidator, logger, fs
 */

import { BaseCommand } from './_base.js';
import QueryValidator from '../lib/query/query-validator.js';
import logger from '../lib/utils/logger.js';
import fs from 'fs';
import path from 'path';

export class QueryCommand extends BaseCommand {
  async run(args) {
    await this.initialize();

    const { query: queryString, file, variables: varsString, validate } = args;

    if (!queryString && !file) {
      throw new Error('Usage: jobber query "<query>" or jobber query --file <file>');
    }

    let query = queryString;
    if (file) {
      // Validate file path (prevent directory traversal)
      const resolvedPath = path.resolve(file);
      const baseDir = path.resolve(process.cwd());
      const relative = path.relative(baseDir, resolvedPath);
      const outsideBase = relative.startsWith('..') || path.isAbsolute(relative);
      if (outsideBase) {
        throw new Error('File path must be within current directory');
      }
      
      // Check file exists and get size
      let stats;
      try {
        stats = fs.statSync(resolvedPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`File not found: ${file}`);
        }
        throw new Error(`Cannot access file: ${error.message}`);
      }
      
      // Check file size (limit to 1MB)
      if (stats.size > 1024 * 1024) {
        throw new Error('Query file too large (max 1MB)');
      }
      
      query = fs.readFileSync(resolvedPath, 'utf8');
      
      // Strip UTF-8 BOM if present
      if (query.charCodeAt(0) === 0xFEFF) {
        query = query.slice(1);
      }
      
      // Validate query length
      if (query.length > 100000) {
        throw new Error('Query too large (max 100KB)');
      }
    }

    // Parse variables
    let variables = null;
    if (varsString) {
      try {
        // Limit JSON size
        if (varsString.length > 10000) {
          throw new Error('Variables JSON too large (max 10KB)');
        }
        
        const parsed = JSON.parse(varsString);
        
        // Validate it's an object
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('Variables must be a JSON object');
        }
        
        variables = parsed;
      } catch (error) {
        throw new Error(`Invalid JSON in variables: ${error.message}`);
      }
    }

    // Validate if requested (skip if no schema available)
    if (validate !== false && this.schemaManager.getCache().hasSchema()) {
      const validator = new QueryValidator(this.schemaManager);
      const validationResult = await validator.validate(query, true);
      
      if (!validationResult.valid) {
        logger.error('Query validation failed:');
        validationResult.errors?.forEach(err => logger.error(`  - ${err}`));
        throw new Error('Query validation failed');
      }

      if (validationResult.warning) {
        logger.warn(validationResult.warning);
      }
    } else if (validate !== false && !this.schemaManager.getCache().hasSchema()) {
      logger.warn('Schema not found. Query validation skipped. Run "jobber schema fetch" to enable validation.');
    }

    // Set up cancellation handler
    const cancel = this.setupCancellation('Query Execution');
    
    try {
      logger.info('Executing query...');
      
      // Let queryExecutor estimate cost automatically if not provided
      // The JobberClient will estimate based on query complexity
      const result = await this.queryExecutor.execute(query, variables);
      
      if (cancel.cancelled()) {
        logger.warn('\n⚠️  Query execution was cancelled');
        cancel.cleanup();
        return null;
      }
      
      if (!result.success) {
        const formatted = this.errorHandler.formatError(result.errorDetails[0]);
        logger.error(formatted);
        cancel.cleanup();
        throw new Error('Query execution failed');
      }

      logger.success('Query executed successfully');

      console.log(this.formatJSON(result.data));
      
      cancel.cleanup();
      return result;
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }
}

export default QueryCommand;
