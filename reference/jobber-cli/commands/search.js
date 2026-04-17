/**
 * Purpose: Search Command - searches for jobs, clients, or quotes using GraphQL queries
 * Inputs: Entity type (jobs/clients/quotes), search query string, optional filters
 * Outputs: Formatted search results displayed to console
 * Dependencies: BaseCommand, QueryBuilder, logger, theme utilities
 */

import { BaseCommand } from './_base.js';
import QueryBuilder from '../lib/query/query-builder.js';
import logger from '../lib/utils/logger.js';
import { cleanSection, cleanHeader, calculateCleanWidth } from '../lib/utils/theme.js';

export class SearchCommand extends BaseCommand {
  async run(args) {
    await this.initialize();

    const { type, query: searchTerm } = args;

    if (!type || !searchTerm) {
      throw new Error('Usage: jobber search <type> <query>\n  type: jobs|clients\n  query: search term');
    }

    const validTypes = ['jobs', 'clients'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    return this.search(type, searchTerm, args);
  }

  async search(type, searchTerm, options = {}) {
    // Build query based on type
    let query, variables;

    if (type === 'jobs') {
      query = `
        query SearchJobs($searchTerm: String, $first: Int) {
          jobs(searchTerm: $searchTerm, first: $first) {
            nodes {
              id
              jobNumber
              title
              jobStatus
              client {
                id
                name
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      variables = { searchTerm, first: parseInt(options.limit, 10) || 10 };
    } else if (type === 'clients') {
      // ClientFilterAttributes doesn't support name filtering, so fetch all and filter client-side
      query = `
        query SearchClients($first: Int) {
          clients(first: $first) {
            nodes {
              id
              name
              title
              emails {
                address
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;
      variables = { first: parseInt(options.limit, 10) || 50 };
    } else {
      throw new Error(`Search for ${type} not yet implemented`);
    }

    logger.info(`Searching ${type} for "${searchTerm}"...`);
    
    // Estimate cost based on query type and limit
    const estimatedCost = type === 'jobs' ? 50 : 100; // Jobs search is simpler, clients needs pagination
    await this.checkThrottle(estimatedCost, { silent: true });
    const result = await this.queryExecutor.execute(query, variables, { estimatedCost });
    
    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Search failed');
    }

    let items = result.data[type]?.nodes || [];
    
    // For clients, filter by name client-side since API doesn't support name filter
    if (type === 'clients' && searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(client => {
        if (!client.name) return false;
        return client.name.toLowerCase().includes(searchLower);
      });
    }
    
    if (items.length === 0) {
      logger.info('No results found');
      return { items: [] };
    }

    logger.success(`Found ${items.length} result(s)`);

    if (options.json) {
      console.log(this.formatJSON(items));
    } else {
      // Format as clean minimal table
      const columns = this.getColumnsForType(type);
      const contentWidth = calculateCleanWidth();
      
      console.log(cleanSection('🔍', `SEARCH RESULTS (${items.length})`));
      console.log(this.formatTable(items.map(item => this.flattenItem(item)), columns));
      console.log(''); // Blank line after table
    }

    return { items, throttleStatus: result.throttleStatus };
  }

  getColumnsForType(type) {
    const columnMap = {
      jobs: [
        { name: 'jobNumber', header: 'Job #' },
        { name: 'title', header: 'Title' },
        { name: 'jobStatus', header: 'Status' },
        { name: 'clientName', header: 'Client' }
      ],
      clients: [
        { name: 'name', header: 'Name' },
        { name: 'title', header: 'Title' },
        { name: 'email', header: 'Email' }
      ]
    };
    return columnMap[type] || [];
  }

  flattenItem(item) {
    const flat = { ...item };
    
    // Flatten nested objects
    if (item.client) {
      flat.clientName = item.client.name || '';
    }
    if (item.emails && item.emails.length > 0) {
      flat.email = item.emails.map(e => e.address).filter(Boolean).join(', ');
    }

    return flat;
  }
}

export default SearchCommand;
