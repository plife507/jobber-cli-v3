/**
 * Purpose: Get Command - retrieves detailed information about a specific entity (job, client, quote, invoice)
 * Inputs: Entity type and ID (or name for clients), optional formatting options
 * Outputs: Formatted entity details with profitability calculations, displayed to console
 * Dependencies: BaseCommand, ProfitabilityCalculator, logger, theme utilities, date-formatter
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import { formatCompactDateTimePST } from '../lib/utils/date-formatter.js';
import { ProfitabilityCalculator } from '../lib/utils/profitability-calculator.js';
import { QueryBuilder } from '../lib/query/query-builder.js';
import { 
  colorize, bold, boldColor, money, primary, secondary, success, section, border, sectionHeader,
  arcadeHeader, textBox, wrapText, decorations, rightAlign, colors,
  getTerminalWidth as getTermWidth, calculateResponsiveWidth, formatCurrency, formatRow, getVisualWidth,
  cleanHeader, cleanSection, cleanRow, cleanCurrency, cleanStatus, cleanWrapText, calculateCleanWidth, separator, getCleanVisualWidth
} from '../lib/utils/theme.js';

export class GetCommand extends BaseCommand {
  async run(args) {
    await this.initialize();

    const { type, id } = args;

    if (!type || !id) {
      throw new Error('Usage: jobber get <type> <id>\n  type: job|client|quote|invoice\n  id: entity ID');
    }

    const validTypes = ['job', 'client', 'quote', 'invoice'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    return this.getEntity(type, id, args);
  }

  async getEntity(type, id, options = {}) {
    let encodedId = id;
    
    // For clients, check if it looks like an encoded ID or if we should search by name
    if (type === 'client') {
      if (!this.isNumeric(id)) {
        // Not numeric, search by name
        logger.info(`Looking up client "${id}"...`);
        encodedId = await this.findClientIdByName(id);
        
        if (!encodedId) {
          logger.error(`Client "${id}" not found`);
          throw new Error(`No client found with name "${id}"`);
        }
      } else {
        // Numeric string - likely a URL ID, convert to encoded ID
        logger.info(`Converting URL ID "${id}" to GraphQL encoded ID...`);
        encodedId = this.convertUrlIdToEncodedId(type, id);
        logger.info(`Using encoded ID: ${encodedId.substring(0, 20)}...`);
      }
    }
    // If ID looks like a number (job number or quote number), search for it first
    else if (this.isNumeric(id)) {
      if (type === 'invoice') {
        // For invoices, numeric IDs are treated as URL IDs and converted directly
        logger.info(`Converting URL ID "${id}" to GraphQL encoded ID...`);
        encodedId = this.convertUrlIdToEncodedId(type, id);
      } else {
        logger.info(`Looking up ${type} #${id}...`);
        encodedId = await this.findIdByNumber(type, id);
        
        if (!encodedId) {
          logger.error(`${type} #${id} not found`);
          throw new Error(`No ${type} found with number ${id}`);
        }
      }
    }
    
    // Build query — custom fields only when requested (saves ~20 units/node)
    const includeCF = options.cf || options.customFields || options['custom-fields'] || false;
    const query = this.buildGetQuery(type, { includeCustomFields: includeCF });
    
    logger.info(`Fetching ${type} details...`);
    
    await this.checkThrottle(100, { silent: true });
    const result = await this.queryExecutor.execute(query, { id: encodedId }, { estimatedCost: 100 });
    
    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to fetch entity');
    }

    const entity = result.data[type];
    
    if (!entity) {
      logger.error(`${type} not found`);
      return null;
    }

    logger.success(`Found ${type}: ${entity.jobNumber || entity.quoteNumber || entity.name || entity.id}`);

    if (options.json) {
      console.log(this.formatJSON(entity));
    } else {
      // Pretty print
      this.printEntity(type, entity);
    }

    return { entity, throttleStatus: result.throttleStatus };
  }

  /**
   * Check if a string is purely numeric (job number or quote number)
   */
  isNumeric(str) {
    return /^\d+$/.test(str);
  }

  /**
   * Convert URL numeric ID to GraphQL EncodedId
   * Jobber uses Global ID format: gid://Jobber/{Type}/{ID} encoded in base64
   */
  convertUrlIdToEncodedId(type, numericId) {
    // Validate type
    const validTypes = ['client', 'job', 'quote', 'invoice'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Validate numeric ID
    const numId = parseInt(numericId, 10);
    if (isNaN(numId) || numId <= 0) {
      throw new Error(`Invalid numeric ID: ${numericId}. Must be a positive integer.`);
    }
    
    const typeMap = {
      'client': 'Client',
      'job': 'Job',
      'quote': 'Quote',
      'invoice': 'Invoice'
    };
    
    const graphqlType = typeMap[type];
    const gid = `gid://Jobber/${graphqlType}/${numId}`;
    
    // Validate GID format
    if (!gid.match(/^gid:\/\/Jobber\/\w+\/\d+$/)) {
      throw new Error(`Invalid GID format: ${gid}`);
    }
    
    const encodedId = Buffer.from(gid).toString('base64');
    return encodedId;
  }

  /**
   * Extract numeric ID from GraphQL EncodedId
   * Decodes base64 and extracts the numeric ID from gid://Jobber/{Type}/{ID}
   */
  extractNumericIdFromEncodedId(encodedId) {
    try {
      const decoded = Buffer.from(encodedId, 'base64').toString('utf-8');
      // Format: gid://Jobber/Client/122025003
      const match = decoded.match(/gid:\/\/Jobber\/\w+\/(\d+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find client ID by name
   * 
   * NOTE: Jobber API doesn't support name filtering in ClientFilterAttributes.
   * This implementation paginates through clients which can be expensive
   * for large datasets (up to 1000 clients across 10 pages).
   * 
   * The search terminates early if an exact match is found to optimize performance.
   * Consider caching client name->ID mappings for frequently accessed clients.
   */
  async findClientIdByName(name) {
    // ClientFilterAttributes doesn't support name filtering, so we need to paginate through clients
    // Normalize the search name
    const searchName = name.toLowerCase().trim().replace(/\s+/g, ' ');
    // Set up cancellation handler
    const cancel = this.setupCancellation('Client Search');
    
    try {
      let allClients = [];
      let hasNextPage = true;
      let cursor = null;
      const maxPages = 10; // Limit to 10 pages (1000 clients) to avoid timeout
      let pageCount = 0;
      
      logger.info(`Searching for client "${name}"...`);
      
      // Paginate through clients until we find a match or run out
      while (hasNextPage && pageCount < maxPages && !cancel.cancelled()) {
        if (cancel.cancelled()) {
          logger.warn(`\n⚠️  Client search cancelled. Searched ${allClients.length} clients.`);
          cancel.cleanup();
          return null;
        }
        const searchQuery = `
        query SearchClients($first: Int, $after: String) {
          clients(first: $first, after: $after) {
            nodes {
              id
              name
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
        const variables = { first: 5 };
        if (cursor) {
          variables.after = cursor;
        }
        
        await this.checkThrottle(12, { silent: true });
        const result = await this.queryExecutor.execute(searchQuery, variables, { estimatedCost: 12 });
        
        if (!result.success || !result.data?.clients?.nodes) {
          if (result.errorDetails && result.errorDetails.length > 0) {
            const error = result.errorDetails[0];
            logger.error(`Error: ${error.message || JSON.stringify(error)}`);
          }
          break;
        }
        
        const clients = result.data.clients.nodes || [];
        allClients = allClients.concat(clients);
        
        // Try exact match first (case insensitive, normalized spaces)
        const exactMatch = clients.find(
          client => {
            if (!client.name) return false;
            const normalized = client.name.toLowerCase().replace(/\s+/g, ' ').trim();
            return normalized === searchName;
          }
        );
        
        if (exactMatch) {
          logger.info(`Found exact match: "${exactMatch.name}" (searched ${allClients.length} clients)`);
          return exactMatch.id;
        }
        
        // Try partial match (contains)
        const partialMatch = clients.find(
          client => {
            if (!client.name) return false;
            const normalized = client.name.toLowerCase().replace(/\s+/g, ' ').trim();
            return normalized.includes(searchName) || searchName.includes(normalized);
          }
        );
        
        if (partialMatch) {
          logger.info(`Found partial match: "${partialMatch.name}" (searched ${allClients.length} clients)`);
          return partialMatch.id;
        }
        
        // Update pagination
        hasNextPage = result.data.clients.pageInfo?.hasNextPage || false;
        cursor = result.data.clients.pageInfo?.endCursor || null;
        pageCount++;
        
        // Small delay to avoid rapid-fire requests and allow budget restoration
        if (hasNextPage && pageCount < maxPages) {
          await cancel.waitWithCancel(100);
        }
        
        logger.info(`Searched ${allClients.length} clients, continuing...`);
      }
      
      if (cancel.cancelled()) {
        logger.warn(`\n⚠️  Client search cancelled. Searched ${allClients.length} clients.`);
        cancel.cleanup();
        return null;
      }
      
      // If we've searched through all clients, try one more time with all collected clients
      if (allClients.length > 0) {
      // Try partial match across all collected clients
      const partialMatches = allClients.filter(
        client => {
          if (!client.name) return false;
          const normalized = client.name.toLowerCase().replace(/\s+/g, ' ').trim();
          return normalized.includes(searchName) || searchName.includes(normalized);
        }
      );
      
      if (partialMatches.length > 0) {
        // Prefer exact match length, then shortest name
        const bestMatch = partialMatches.reduce((best, current) => {
          const currentNorm = current.name.toLowerCase().replace(/\s+/g, ' ').trim();
          const bestNorm = best.name.toLowerCase().replace(/\s+/g, ' ').trim();
          if (currentNorm === searchName && bestNorm !== searchName) return current;
          if (bestNorm === searchName && currentNorm !== searchName) return best;
          return (!best || current.name.length < best.name.length) ? current : best;
        });
        logger.info(`Found best match: "${bestMatch.name}" (searched ${allClients.length} clients)`);
        return bestMatch.id;
      }
    }
    
      // Debug: show available client names if no match
      if (allClients.length > 0) {
        logger.info(`Searched ${allClients.length} clients. Sample names: ${allClients.slice(0, 5).map(c => `"${c.name}"`).join(', ')}${allClients.length > 5 ? '...' : ''}`);
      } else {
        logger.info(`No clients found in search`);
      }
      
      cancel.cleanup();
      return null;
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }

  /**
   * Find encoded ID by job number or quote number
   */
  async findIdByNumber(type, number) {
    if (type === 'job') {
      const searchQuery = `
        query SearchJob($searchTerm: String, $first: Int, $after: String) {
          jobs(searchTerm: $searchTerm, first: $first, after: $after) {
            nodes {
              id
              jobNumber
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      // Set up cancellation handler
      const cancel = this.setupCancellation('Job/Quote Search');
      
      try {
        let cursor = null;
        let hasNextPage = true;
        let pageCount = 0;
        const maxPages = 10; // Search up to 10 pages (1000 jobs max)
        
        while (hasNextPage && pageCount < maxPages && !cancel.cancelled()) {
          if (cancel.cancelled()) {
            logger.warn(`\n⚠️  Search cancelled at page ${pageCount + 1}`);
            cancel.cleanup();
            return null;
          }
          await this.checkThrottle(20, { silent: true });
          const result = await this.queryExecutor.execute(
            searchQuery,
            { searchTerm: String(number), first: 5, after: cursor },
            { estimatedCost: 20 }
          );
          
          if (!result.success) {
            // Log error details if query failed
            if (result.errorDetails && result.errorDetails.length > 0) {
              const error = result.errorDetails[0];
              logger.error(`Search query failed: ${error.message || JSON.stringify(error)}`);
            }
            break;
          }
          
          if (!result.data?.jobs?.nodes) {
            // No results or invalid response structure
            break;
          }
          
          // Find exact match by job number
          const match = result.data.jobs.nodes.find(job => String(job.jobNumber) === String(number));
          if (match) {
            return match.id;
          }
          
          // Check pagination
          hasNextPage = result.data.jobs.pageInfo?.hasNextPage || false;
          cursor = result.data.jobs.pageInfo?.endCursor || null;
          pageCount++;
          
          if (hasNextPage && pageCount < maxPages) {
            await cancel.waitWithCancel(100);
          }
        }
        
        cancel.cleanup();
        return null;
      } catch (error) {
        cancel.cleanup();
        throw error;
      }
    } else if (type === 'quote') {
      // Try searchTerm first (if quotes support it like jobs)
      let searchQuery = `
        query SearchQuotes($searchTerm: String, $first: Int, $after: String) {
          quotes(searchTerm: $searchTerm, first: $first, after: $after) {
            nodes {
              id
              quoteNumber
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;
      
      // Set up cancellation handler (reuse if already set, otherwise create new)
      const cancel = this.setupCancellation('Quote Search');
      
      try {
        let cursor = null;
        let hasNextPage = true;
        let pageCount = 0;
        const maxPages = 10;
        let useFilter = false;
        
        while (hasNextPage && pageCount < maxPages && !cancel.cancelled()) {
          if (cancel.cancelled()) {
            logger.warn(`\n⚠️  Quote search cancelled at page ${pageCount + 1}`);
            cancel.cleanup();
            return null;
          }
        let result;
        
        if (!useFilter) {
          await this.checkThrottle(20, { silent: true });
          result = await this.queryExecutor.execute(
            searchQuery,
            { searchTerm: String(number), first: 5, after: cursor },
            { estimatedCost: 20 }
          );
          
          // If searchTerm doesn't work on first attempt, switch to filter approach
          if (!result.success) {
            // Log error details if query failed
            if (result.errorDetails && result.errorDetails.length > 0 && pageCount === 0) {
              const error = result.errorDetails[0];
              logger.warn(`SearchTerm query failed, trying filter approach: ${error.message || JSON.stringify(error)}`);
            }
            if (pageCount === 0) {
              useFilter = true;
              searchQuery = `
                query SearchQuotes($filter: QuoteFilterAttributes, $first: Int, $after: String) {
                  quotes(filter: $filter, first: $first, after: $after) {
                    nodes {
                      id
                      quoteNumber
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              `;
              // Retry with filter on first page
              continue;
            } else {
              break;
            }
          }
          
          if (!result.data?.quotes) {
            if (pageCount === 0) {
              useFilter = true;
              searchQuery = `
                query SearchQuotes($filter: QuoteFilterAttributes, $first: Int, $after: String) {
                  quotes(filter: $filter, first: $first, after: $after) {
                    nodes {
                      id
                      quoteNumber
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              `;
              // Retry with filter on first page
              continue;
            } else {
              break;
            }
          }
        } else {
          await this.checkThrottle(20, { silent: true });
          result = await this.queryExecutor.execute(
            searchQuery,
            { filter: { quoteNumber: number }, first: 5, after: cursor },
            { estimatedCost: 20 }
          );
          
          if (!result.success) {
            // Log error details if query failed
            if (result.errorDetails && result.errorDetails.length > 0) {
              const error = result.errorDetails[0];
              logger.error(`Filter query failed: ${error.message || JSON.stringify(error)}`);
            }
            break;
          }
          
          if (!result.data?.quotes) {
            break;
          }
        }
        
        if (!result.data?.quotes?.nodes) {
          break;
        }
        
        // Find exact match by quote number
        const match = result.data.quotes.nodes.find(quote => String(quote.quoteNumber) === String(number));
        if (match) {
          return match.id;
        }
        
          // Check pagination
          hasNextPage = result.data.quotes.pageInfo?.hasNextPage || false;
          cursor = result.data.quotes.pageInfo?.endCursor || null;
          pageCount++;
        
        if (hasNextPage && pageCount < maxPages) {
          await cancel.waitWithCancel(100);
        }
        }
        
        cancel.cleanup();
        return null;
      } catch (error) {
        cancel.cleanup();
        throw error;
      }
    }
    
    return null;
  }

  /**
   * Get custom fields fragment for queries
   * Uses QueryBuilder to generate dynamic fragments
   * @returns {string} GraphQL fragment for customFields
   */
  getCustomFieldsFragment() {
    // Use QueryBuilder to generate fragment with all known custom field types
    return QueryBuilder.buildCustomFieldsFragment();
  }

  buildGetQuery(type, opts = {}) {
    // Custom fields are expensive (~20 units/node). Only include when requested.
    const customFieldsFragment = opts.includeCustomFields ? this.getCustomFieldsFragment() : '';
    
    const queries = {
      job: `
        query GetJob($id: EncodedId!) {
          job(id: $id) {
            id
            jobNumber
            title
            jobStatus
            jobType
            startAt
            endAt
            completedAt
            total
            invoicedTotal
            bookingConfirmationSentAt
            jobCosting {
              labourCost
              labourDuration
            }
            invoiceSchedule {
              billingFrequency
              scheduleSummary
              recurrenceSchedule {
                friendly
              }
            }
            salesperson {
              id
              name {
                full
              }
            }
            client {
              id
              name
              billingAddress {
                street
                city
                province
                postalCode
                country
              }
            }
            property {
              id
              address {
                street
                city
                province
                postalCode
                country
              }
            }
            lineItems(first: 20) {
              nodes {
                id
                name
                description
                quantity
                cost
                totalPrice
                totalCost
              }
            }
            quote {
              id
              quoteNumber
              title
              amounts {
                subtotal
                discountAmount
                taxAmount
                total
              }
              lineItems(first: 20) {
                nodes {
                  id
                  name
                  description
                  quantity
                  cost
                  totalPrice
                  totalCost
                  optional
                  recommended
                }
              }
            }
            invoices(first: 10) {
              nodes {
                id
                invoiceNumber
                amounts {
                  subtotal
                  total
                  invoiceBalance
                  depositAmount
                }
                paymentRecords(first: 20) {
                  nodes {
                    id
                    amount
                    entryDate
                    jobberPaymentPaymentMethod
                    jobberPaymentLast4
                    adjustmentType
                  }
                }
              }
            }
            visits(first: 10) {
              nodes {
                id
                title
                startAt
                endAt
                isComplete
                assignedUsers {
                  nodes {
                    id
                    name {
                      full
                    }
                  }
                }
              }
            }
            expenses(first: 20) {
              nodes {
                id
                title
                description
                total
                date
              }
            }
            ${customFieldsFragment}
            notes(first: 10) {
              nodes {
                __typename
                ... on JobNote {
                  id
                  message
                  createdAt
                  pinned
                }
              }
            }
          }
        }
      `,
      client: `
        query GetClient($id: EncodedId!) {
          client(id: $id) {
            id
            name
            title
            firstName
            lastName
            companyName
            isCompany
            isLead
            balance
            emails {
              address
            }
            phones {
              number
              description
            }
            billingAddress {
              street
              city
              province
              postalCode
              country
            }
            clientProperties(first: 5) {
              nodes {
                id
                address {
                  street
                  city
                  province
                  postalCode
                  country
                }
              }
            }
            jobs(first: 10) {
              nodes {
                id
                jobNumber
                title
                jobStatus
              }
            }
            quotes(first: 10) {
              nodes {
                id
                quoteNumber
                title
                quoteStatus
                amounts {
                  total
                }
              }
            }
          }
        }
      `,
      quote: `
        query GetQuote($id: EncodedId!) {
          quote(id: $id) {
            id
            quoteNumber
            title
            quoteStatus
            amounts {
              subtotal
              discountAmount
              taxAmount
              total
            }
            client {
              id
              name
            }
            lineItems(first: 20) {
              nodes {
                id
                name
                description
                quantity
                cost
                totalPrice
                totalCost
                optional
                recommended
              }
            }
            jobs(first: 10) {
              nodes {
                id
                jobNumber
                title
                jobStatus
              }
            }
          }
        }
      `,
      invoice: `
        query GetInvoice($id: EncodedId!) {
          invoice(id: $id) {
            id
            invoiceNumber
            invoiceStatus
            subject
            dueAt
            issuedAt
            paidAt
            client {
              id
              name
            }
            amounts {
              subtotal
              taxAmount
              total
              invoiceBalance
              depositAmount
            }
            lineItems(first: 20) {
              nodes {
                id
                name
                description
                quantity
                cost
                totalPrice
                totalCost
              }
            }
            paymentRecords(first: 20) {
              nodes {
                id
                amount
                entryDate
                adjustmentType
                jobberPaymentPaymentMethod
                jobberPaymentLast4
              }
            }
          }
        }
      `
    };

    return queries[type] || queries.job;
  }

  /**
   * Format a custom field value based on its type
   * Returns { emoji, value, hasValue } or null if field has no value
   */
  formatCustomField(field) {
    if (!field) return null;

    // CustomFieldText
    if (field.valueText !== undefined && field.valueText !== null && field.valueText !== '') {
      return {
        emoji: '📝',
        value: String(field.valueText),
        hasValue: true
      };
    }

    // CustomFieldNumeric
    if (field.valueNumeric !== undefined && field.valueNumeric !== null) {
      const unit = field.unit || '';
      return {
        emoji: '🔢',
        value: `${field.valueNumeric}${unit ? ` ${unit}` : ''}`,
        hasValue: true
      };
    }

    // CustomFieldTrueFalse
    if (field.valueTrueFalse !== undefined && field.valueTrueFalse !== null) {
      return {
        emoji: field.valueTrueFalse ? '✅' : '❌',
        value: field.valueTrueFalse ? 'Yes' : 'No',
        hasValue: true
      };
    }

    // CustomFieldDropdown
    if (field.valueDropdown !== undefined && field.valueDropdown !== null && field.valueDropdown !== '') {
      return {
        emoji: '📋',
        value: String(field.valueDropdown),
        hasValue: true
      };
    }

    // CustomFieldLink
    if (field.valueLink?.url) {
      const linkText = field.valueLink.text || field.valueLink.url;
      return {
        emoji: '🔗',
        value: linkText,
        hasValue: true
      };
    }

    // CustomFieldArea
    if (field.valueArea && (field.valueArea.length !== undefined || field.valueArea.width !== undefined)) {
      const length = field.valueArea.length || 0;
      const width = field.valueArea.width || 0;
      const unit = field.unit || '';
      return {
        emoji: '📐',
        value: `${length} × ${width}${unit ? ` ${unit}` : ''}`,
        hasValue: true
      };
    }

    // No value found
    return null;
  }

  printEntity(type, entity) {
    const displayName = entity.jobNumber || entity.quoteNumber || entity.name || entity.id;
    const emojiMap = {
      job: '📋',
      quote: '💰',
      client: '👤',
      invoice: '🧾'
    };
    const typeEmoji = emojiMap[type] || '📄';
    
    // Clean minimal style - max 100 chars, responsive
    const contentWidth = calculateCleanWidth();
    
    // Header - clean minimal with separator
    const headerText = `${type.toUpperCase()} #${displayName}`;
    console.log(cleanHeader(typeEmoji, headerText, contentWidth));
    
    // Status - clean with emoji (right after header)
    const statusText = entity.jobStatus || entity.quoteStatus || entity.status;
    if (statusText) {
      const statusLower = (statusText || '').toLowerCase();
      const isComplete = statusLower.includes('complete') || statusLower.includes('paid') || statusLower.includes('archived');
      const statusEmoji = isComplete ? '✅' : '📋';
      console.log(cleanRow('📋', 'Status', cleanStatus(statusEmoji, statusText.toLowerCase(), isComplete), false, contentWidth));
      console.log(''); // Blank line after status
    }
    
    // Title - clean two-column format with spacing
    if (entity.title) {
      const wrappedTitle = cleanWrapText(entity.title, 0, contentWidth - 18);
      const titleText = wrappedTitle.length > 0 ? primary(wrappedTitle[0]) : '';
      console.log(cleanRow('📝', 'Title', titleText, false, contentWidth));
      // Additional wrapped lines
      if (wrappedTitle.length > 1) {
        wrappedTitle.slice(1).forEach(line => {
          console.log(' '.repeat(18) + primary(line));
        });
      }
      console.log(''); // Blank line after title
    }
    
    // Client info
    if (entity.client) {
      const clientName = entity.client.name || 'N/A';
      const clientId = entity.client.id ? this.extractNumericIdFromEncodedId(entity.client.id) : null;
      const clientDisplay = clientId 
        ? `${primary(clientName)} ${secondary(`(ID: ${clientId})`)}`
        : primary(clientName);
      console.log(cleanRow('👤', 'Client', clientDisplay, false, contentWidth));
      console.log(''); // Blank line after client
    }
    
    // Quote amounts section (for quotes only)
    if (type === 'quote' && entity.amounts) {
      console.log(cleanSection('💰', 'QUOTE AMOUNTS'));
      
      const amt = entity.amounts;
      
      // Financial breakdown - right-aligned
      if (amt.subtotal !== undefined && amt.subtotal !== null) {
        console.log(cleanRow('', 'Subtotal', cleanCurrency(amt.subtotal), true, contentWidth));
      }
      
      if (amt.discountAmount !== undefined && amt.discountAmount !== null && amt.discountAmount !== 0) {
        console.log(cleanRow('', 'Discount', cleanCurrency(-Math.abs(amt.discountAmount)), true, contentWidth));
      }
      
      if (amt.taxAmount !== undefined && amt.taxAmount !== null && amt.taxAmount !== 0) {
        console.log(cleanRow('', 'Tax', cleanCurrency(amt.taxAmount), true, contentWidth));
      }
      
      // Separator before total
      if ((amt.subtotal !== undefined && amt.subtotal !== null) || 
          (amt.discountAmount !== undefined && amt.discountAmount !== null && amt.discountAmount !== 0) ||
          (amt.taxAmount !== undefined && amt.taxAmount !== null && amt.taxAmount !== 0)) {
        console.log(colorize('─'.repeat(contentWidth), colors.grey));
      }
      
      // Quote Total with emoji
      if (amt.total !== undefined && amt.total !== null) {
        console.log(cleanRow('💵', 'Quote Total', bold(cleanCurrency(amt.total)), true, contentWidth));
      }
      
      console.log(''); // Blank line after amounts
    }
    
    // Associated jobs section (for quotes only)
    if (type === 'quote' && entity.jobs?.nodes?.length > 0) {
      console.log(cleanSection('📋', `ASSOCIATED JOBS (${entity.jobs.nodes.length})`));
      
      entity.jobs.nodes.forEach((job, index) => {
        const jobNum = job.jobNumber || 'N/A';
        const jobTitle = job.title || 'Untitled';
        const jobStatus = job.jobStatus || 'unknown';
        
        const statusLower = jobStatus.toLowerCase();
        const statusEmoji = statusLower.includes('complete') ? '✅' : 
                           statusLower.includes('progress') ? '🔄' : '📋';
        
        console.log(`${index + 1}. ${boldColor(`Job #${jobNum}`, colors.blue)} ${statusEmoji} ${secondary(jobStatus)}`);
        console.log(`   ${primary(jobTitle)}`);
        console.log('');
      });
    }
    
    // Job details section (for jobs only)
    if (type === 'job') {
      const jobDetails = [];
      
      if (entity.jobType) {
        const jobTypeDisplay = entity.jobType.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());
        jobDetails.push({ emoji: '📋', label: 'Job type', value: jobTypeDisplay });
      }
      
      if (entity.startAt) {
        const startDate = formatCompactDateTimePST(entity.startAt);
        jobDetails.push({ emoji: '📅', label: 'Started on', value: startDate });
      }
      
      // Calculate duration for recurring jobs (startAt to endAt)
      if (entity.startAt && entity.endAt && entity.jobType === 'RECURRING') {
        const start = new Date(entity.startAt);
        const end = new Date(entity.endAt);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const durationText = diffDays === 1 ? '1 day' : `${diffDays} days`;
        jobDetails.push({ emoji: '⏱️', label: 'Lasts for', value: durationText });
      }
      
      if (entity.endAt && entity.jobType !== 'RECURRING') {
        const endDate = formatCompactDateTimePST(entity.endAt);
        jobDetails.push({ emoji: '📅', label: 'End date', value: endDate });
      }
      
      if (entity.completedAt) {
        const closedDate = formatCompactDateTimePST(entity.completedAt);
        jobDetails.push({ emoji: '✅', label: 'Marked closed', value: closedDate });
      }
      
      if (entity.invoiceSchedule?.scheduleSummary) {
        jobDetails.push({ emoji: '💰', label: 'Billing frequency', value: entity.invoiceSchedule.scheduleSummary });
      }
      
      // Show schedule for recurring jobs
      if (entity.invoiceSchedule?.recurrenceSchedule?.friendly) {
        jobDetails.push({ emoji: '📆', label: 'Schedule', value: entity.invoiceSchedule.recurrenceSchedule.friendly });
      }
      
      if (entity.salesperson?.name?.full) {
        jobDetails.push({ emoji: '👤', label: 'Salesperson', value: entity.salesperson.name.full });
      }
      
      if (entity.quote?.quoteNumber) {
        const quoteNum = entity.quote.quoteNumber;
        jobDetails.push({ emoji: '📄', label: 'From quote', value: `Quote #${quoteNum}` });
      }
      
      if (entity.bookingConfirmationSentAt) {
        const bookingDate = formatCompactDateTimePST(entity.bookingConfirmationSentAt);
        jobDetails.push({ emoji: '📧', label: 'Booking confirmation opened', value: bookingDate });
      }
      
      // Extract specific custom fields to display in Job Details
      if (entity.customFields && Array.isArray(entity.customFields)) {
        const fieldsToMove = [
          { search: 'estimated jobsite time', emoji: '⏱️', label: 'Estimated Jobsite Time' },
          { search: 'allowable working hours', emoji: '🕐', label: 'Allowable Working Hours' },
          { search: 'water access', emoji: '💧', label: 'Water Access' },
          { search: 'division', emoji: '🏢', label: 'Division' },
          { search: 'bmp/swppp', emoji: '🌊', label: 'BMP/SWPPP' },
          { search: 'gate code', emoji: '🔑', label: 'Gate Code/Access' },
          { search: 'name/# key contact onsite', emoji: '👥', label: 'Onsite Contact' },
          { search: 'sub', emoji: '✅', label: 'Sub' }
        ];
        
        fieldsToMove.forEach(fieldConfig => {
          const customField = entity.customFields.find(field => {
            const fieldName = field.customFieldConfiguration?.name || field.label || '';
            return fieldName.toLowerCase().includes(fieldConfig.search);
          });
          
          if (customField) {
            const formatted = this.formatCustomField(customField);
            if (formatted && formatted.hasValue) {
              jobDetails.push({ 
                emoji: fieldConfig.emoji, 
                label: fieldConfig.label, 
                value: formatted.value 
              });
            }
          }
        });
      }
      
      if (jobDetails.length > 0) {
        console.log(cleanSection('📋', 'JOB DETAILS'));
        
        // Calculate max label width for alignment
        const maxLabelWidth = Math.max(...jobDetails.map(d => {
          const labelText = `${d.emoji} ${d.label}:`;
          return getCleanVisualWidth(labelText);
        }));
        
        jobDetails.forEach(detail => {
          const labelText = `${detail.emoji} ${colorize(detail.label, colors.grey)}:`;
          const labelVisualWidth = getCleanVisualWidth(labelText);
          const padding = Math.max(2, maxLabelWidth - labelVisualWidth + 2);
          const alignedLabel = labelText + ' '.repeat(padding);
          console.log(alignedLabel + primary(detail.value));
        });
        
        console.log(''); // Blank line after job details
      }
    }
    
    // Job property/address (for jobs only) - with fallback to client billing address
    if (type === 'job') {
      let addressToShow = null;
      
      // Try property address first
      if (entity.property?.address) {
        const addr = entity.property.address;
        const addressParts = [
          addr.street,
          addr.city,
          addr.province,
          addr.postalCode,
          addr.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          addressToShow = addressParts.join(', ');
        }
      }
      
      // Fallback to client billing address if property address not available
      if (!addressToShow && entity.client?.billingAddress) {
        const addr = entity.client.billingAddress;
        const addressParts = [
          addr.street,
          addr.city,
          addr.province,
          addr.postalCode,
          addr.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          addressToShow = addressParts.join(', ');
        }
      }
      
      if (addressToShow) {
        const wrappedAddress = cleanWrapText(addressToShow, 0, contentWidth - 18);
        if (wrappedAddress.length > 0) {
          console.log(cleanRow('📍', 'Address', secondary(wrappedAddress[0]), false, contentWidth));
          if (wrappedAddress.length > 1) {
            wrappedAddress.slice(1).forEach(line => {
              console.log(' '.repeat(18) + secondary(line));
            });
          }
        }
        console.log(''); // Blank line after address
      }
      
      // Display Company Cam Link custom field if it exists
      if (entity.customFields && Array.isArray(entity.customFields)) {
        // Find all Company Cam fields and pick the one with a value
        const companyCamFields = entity.customFields.filter(field => {
          const fieldName = field.customFieldConfiguration?.name || field.label || '';
          return fieldName.toLowerCase().includes('company cam');
        });
        
        // Find the first field with a non-empty value
        const companyCamField = companyCamFields.find(field => {
          if (field.valueLink?.url) return true;
          if (field.valueText && field.valueText.trim()) return true;
          return false;
        });
        
        // Handle CustomFieldLink (with valueLink.url)
        if (companyCamField && companyCamField.valueLink?.url) {
          const linkUrl = companyCamField.valueLink.url;
          const linkText = companyCamField.valueLink.text || linkUrl;
          console.log(cleanRow('📷', 'CC Link', primary(linkText), false, contentWidth));
        }
        // Handle CustomFieldText (with valueText containing URL)
        else if (companyCamField && companyCamField.valueText && companyCamField.valueText.trim()) {
          const linkUrl = companyCamField.valueText.trim();
          console.log(cleanRow('📷', 'CC Link', primary(linkUrl), false, contentWidth));
        }
      }
      
      console.log(''); // Blank line after Company Cam Link
      
      // Display all custom fields in a dedicated section (for jobs)
      // Exclude CompanyCam and other specified fields
      if (entity.customFields && Array.isArray(entity.customFields)) {
        // Fields to exclude from display (moved to Job Details or otherwise hidden)
        const excludedFields = [
          'company cam',
          'kc sales rep',
          'lead source',
          'referred by',
          'pics',
          'collection',
          'opportunity type',
          'branch location',
          'estimated jobsite time',
          'allowable working hours',
          'water access',
          'division',
          'bmp/swppp',
          'gate code',
          'name/# key contact onsite',
          'sub',
          'potential upsells',
          'who\'s authorizing the work',
          'safety hazards',
          'ppe requisites',
          'recommended rig setup',
          'hose runs',
          'parking restrictions',
          'rentals',
          'special access equipment',
          'a/p contact',
          'po#',
          'scheduling reminders',
          'job walk',
          'requested service date',
          'service window',
          'upsell/recommendations',
          'primary service type'
        ];
        
        const fieldsWithValues = entity.customFields
          .map(field => {
            const fieldName = field.customFieldConfiguration?.name || field.label || '';
            const fieldNameLower = fieldName.toLowerCase();
            
            // Skip excluded fields
            if (excludedFields.some(excluded => fieldNameLower.includes(excluded))) {
              return null;
            }
            
            const formatted = this.formatCustomField(field);
            if (!formatted || !formatted.hasValue) return null;
            
            return {
              emoji: formatted.emoji,
              name: fieldName || 'Unknown Field',
              value: formatted.value
            };
          })
          .filter(Boolean);
        
        if (fieldsWithValues.length > 0) {
          console.log(cleanSection('🏷️', 'CUSTOM FIELDS'));
          
          fieldsWithValues.forEach(field => {
            console.log(cleanRow(field.emoji, field.name, primary(field.value), false, contentWidth));
          });
          
          console.log(''); // Blank line after custom fields
        }
      }
    }
    
    // Notes section (for jobs)
    if (type === 'job' && entity.notes && entity.notes.nodes && entity.notes.nodes.length > 0) {
      const notes = entity.notes.nodes;
      
      // Sort notes by date (newest first)
      const sortedNotes = [...notes].sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;  // Notes without dates go to the end
        if (!b.createdAt) return -1;  // Notes without dates go to the end
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();  // Newest first (descending)
      });
      
      console.log(cleanSection('📝', `NOTES (${sortedNotes.length})`));
      
      sortedNotes.forEach((note, index) => {
        const isPinned = note.pinned ? '📌 ' : '';
        const createdAt = note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date';
        
        console.log(`${isPinned}${primary(`${index + 1}.`)} ${secondary(createdAt)}`);
        
        // Wrap and display note message
        const message = note.message || '';
        const wrappedMessage = cleanWrapText(message, 3, contentWidth - 3);
        wrappedMessage.forEach(line => {
          console.log(`   ${line}`);
        });
        
        console.log(''); // Blank line after each note
      });
    }
    
    // For clients, show essential contact info - clean format
    if (type === 'client') {
      console.log(cleanSection('📞', 'CONTACT INFORMATION'));
      
      if (entity.emails && entity.emails.length > 0) {
        const emailAddresses = entity.emails.map(e => e.address).filter(Boolean);
        if (emailAddresses.length > 0) {
          console.log(cleanRow('📧', 'Email', secondary(emailAddresses.join(', ')), false, contentWidth));
        }
      }
      
      if (entity.phones && entity.phones.length > 0) {
        entity.phones.forEach(phone => {
          const phoneDisplay = phone.description 
            ? `${secondary(phone.number)} ${secondary(`(${phone.description})`)}`
            : secondary(phone.number);
          console.log(cleanRow('📱', 'Phone', phoneDisplay, false, contentWidth));
        });
      }
      
      // Billing Address
      if (entity.billingAddress) {
        const addr = entity.billingAddress;
        const addressParts = [
          addr.street,
          addr.city,
          addr.province,
          addr.postalCode,
          addr.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          const addressText = addressParts.join(', ');
          const wrappedAddress = cleanWrapText(addressText, 0, contentWidth - 18);
          if (wrappedAddress.length > 0) {
            console.log(cleanRow('📍', 'Address', secondary(wrappedAddress[0]), false, contentWidth));
            if (wrappedAddress.length > 1) {
              wrappedAddress.slice(1).forEach(line => {
                console.log(' '.repeat(18) + secondary(line));
              });
            }
          }
        }
      } else if (entity.clientProperties?.nodes?.length > 0) {
        const firstProperty = entity.clientProperties.nodes[0];
        if (firstProperty.address) {
          const addr = firstProperty.address;
          const addressParts = [
            addr.street,
            addr.city,
            addr.province,
            addr.postalCode
          ].filter(Boolean);
          if (addressParts.length > 0) {
            console.log(cleanRow('📍', 'Address', secondary(addressParts.join(', ')), false, contentWidth));
          }
        }
      }
      
      // Quick summary stats
      const stats = [];
      if (entity.jobs?.nodes && entity.jobs.nodes.length > 0) {
        stats.push(`📋 ${entity.jobs.nodes.length} job(s)`);
      }
      if (entity.quotes?.nodes && entity.quotes.nodes.length > 0) {
        stats.push(`💰 ${entity.quotes.nodes.length} quote(s)`);
      }
      if (stats.length > 0) {
        console.log(cleanRow('📊', 'Summary', secondary(stats.join(' | ')), false, contentWidth));
      }
      
      // Client Type & Balance
      if (entity.isLead) {
        console.log(cleanRow('🏷️', 'Type', secondary('Lead'), false, contentWidth));
      } else if (entity.isCompany && entity.companyName) {
        console.log(cleanRow('🏢', 'Company', primary(entity.companyName), false, contentWidth));
      }
      
      if (entity.balance !== undefined && entity.balance !== 0) {
        const balanceEmoji = entity.balance > 0 ? '⚠️' : '✅';
        console.log(cleanRow(balanceEmoji, 'Balance', cleanCurrency(Math.abs(entity.balance)), true, contentWidth));
      }
      
      console.log(''); // Blank line after client info
    }
    
    // Labor section (for jobs only)
    if (type === 'job' && entity.jobCosting && (entity.jobCosting.labourCost !== undefined || entity.jobCosting.labourDuration !== undefined)) {
      console.log(''); // Blank line before labor section
      console.log(cleanSection('👷', 'LABOR'));
      
      const laborDetails = [];
      
      if (entity.jobCosting.labourDuration !== undefined && entity.jobCosting.labourDuration > 0) {
        // Convert seconds to readable format
        const totalSeconds = entity.jobCosting.labourDuration;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
          if (minutes > 0) {
            durationText += ` ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
          }
        } else if (minutes > 0) {
          durationText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        } else {
          durationText = `${totalSeconds} ${totalSeconds === 1 ? 'second' : 'seconds'}`;
        }
        
        laborDetails.push({ emoji: '⏱️', label: 'Duration', value: durationText });
      }
      
      if (entity.jobCosting.labourCost !== undefined && entity.jobCosting.labourCost !== null) {
        laborDetails.push({ emoji: '💰', label: 'Cost', value: cleanCurrency(entity.jobCosting.labourCost) });
      }
      
      // Calculate max label width for alignment
      const maxLabelWidth = Math.max(...laborDetails.map(d => {
        const labelText = `${d.emoji} ${d.label}:`;
        return getCleanVisualWidth(labelText);
      }));
      
      laborDetails.forEach(detail => {
        const labelText = `${detail.emoji} ${colorize(detail.label, colors.grey)}:`;
        const labelVisualWidth = getCleanVisualWidth(labelText);
        const padding = Math.max(2, maxLabelWidth - labelVisualWidth + 2);
        const alignedLabel = labelText + ' '.repeat(padding);
        console.log(alignedLabel + primary(detail.value));
      });
      
      console.log(''); // Blank line after labor section
    }
    
    // Quote Information Section (for jobs with quotes)
    if (type === 'job' && entity.quote) {
      console.log(''); // Blank line before quote section
      console.log(cleanSection('💰', 'QUOTE'));
      
      if (entity.quote.title) {
        console.log(cleanRow('📄', 'Title', primary(entity.quote.title), false, contentWidth));
      }
      
      if (entity.quote.quoteNumber) {
        console.log(cleanRow('🔢', 'Quote #', secondary(String(entity.quote.quoteNumber)), false, contentWidth));
      }
      
      if (entity.quote.amounts) {
        const amt = entity.quote.amounts;
        
        // Financial breakdown - right-aligned
        if (amt.subtotal !== undefined && amt.subtotal !== null) {
          console.log(cleanRow('', 'Subtotal', cleanCurrency(amt.subtotal), true, contentWidth));
        }
        
        if (amt.discountAmount !== undefined && amt.discountAmount !== null && amt.discountAmount !== 0) {
          console.log(cleanRow('', 'Discount', cleanCurrency(-Math.abs(amt.discountAmount)), true, contentWidth));
        }
        
        if (amt.taxAmount !== undefined && amt.taxAmount !== null && amt.taxAmount !== 0) {
          console.log(cleanRow('', 'Tax', cleanCurrency(amt.taxAmount), true, contentWidth));
        }
        
        // Separator before total
        if ((amt.subtotal !== undefined && amt.subtotal !== null) || 
            (amt.discountAmount !== undefined && amt.discountAmount !== null && amt.discountAmount !== 0) ||
            (amt.taxAmount !== undefined && amt.taxAmount !== null && amt.taxAmount !== 0)) {
          console.log(colorize('─'.repeat(contentWidth), colors.grey));
        }
        
        // Quote Total with emoji
        if (amt.total !== undefined && amt.total !== null) {
          console.log(cleanRow('💵', 'Quote Total', bold(cleanCurrency(amt.total)), true, contentWidth));
        }
      }
      
      console.log(''); // Blank line after quote section
    }
    
    // Financial Summary - clean two-column, right-aligned prices
    // Calculate actual job value: prefer quote total (agreed price), then calculate from line items
    let jobValue = null;
    const quoteTotal = entity.quote?.amounts?.total;
    
    if (type === 'job') {
      // If there's a quote, use quote total as the job value (the agreed price)
      if (quoteTotal !== undefined && quoteTotal !== null) {
        jobValue = quoteTotal;
      } 
      // Otherwise, calculate from line items
      else if (entity.lineItems?.nodes?.length > 0) {
        jobValue = entity.lineItems.nodes.reduce((sum, item) => {
          return sum + (item.totalPrice || 0);
        }, 0);
      }
      // Fallback to entity.total if available
      else if (entity.total !== undefined && entity.total !== null) {
        jobValue = entity.total;
      }
    }
    
    const hasFinancial = (type === 'job' && jobValue !== null) ||
                         (type === 'job' && entity.invoices?.nodes?.length > 0) ||
                         (entity.invoicedTotal !== undefined);
    
    if (hasFinancial) {
      console.log(''); // Blank line before financial section
      console.log(cleanSection('💵', 'JOB VALUE'));
      
      // Show job value - always display for clarity
      // Uses quote total if available (the agreed price), otherwise calculated from line items
      if (type === 'job' && jobValue !== null) {
        console.log(cleanRow('💵', 'Total Job Value', bold(cleanCurrency(jobValue)), true, contentWidth));
      }
      
      // Invoiced
      if (type === 'job' && entity.invoices?.nodes?.length > 0) {
        const invoicedTotal = entity.invoices.nodes.reduce((sum, inv) => sum + (inv.amounts?.total || 0), 0);
        console.log(cleanRow('💳', 'Invoiced', cleanCurrency(invoicedTotal), true, contentWidth));
      } else if (entity.invoicedTotal !== undefined && entity.invoicedTotal !== null) {
        console.log(cleanRow('💳', 'Invoiced', cleanCurrency(entity.invoicedTotal), true, contentWidth));
      }
      
      console.log(''); // Blank line after financial section
    }
    
    // Line items - clean minimal list format (for both jobs and quotes)
    if ((type === 'job' || type === 'quote') && entity.lineItems?.nodes?.length > 0) {
      console.log(cleanSection('📦', `LINE ITEMS (${entity.lineItems.nodes.length})`));
      
      entity.lineItems.nodes.forEach((item, idx) => {
        const qty = item.quantity || 1;
        const price = item.totalPrice || item.cost || 0;
        const unitPrice = qty > 1 ? (price / qty) : price;
        const itemName = (item.name || 'Untitled').substring(0, 200);
        const isDisclosure = item.name && item.name.toLowerCase().includes('disclosure');
        
        // For quotes: show if item is optional or recommended
        const isOptional = type === 'quote' && item.optional;
        const isRecommended = type === 'quote' && item.recommended;
        
        // Determine emoji based on item type
        let itemEmoji = item.name?.toLowerCase().includes('disclosure') ? '📄' : '🔧';
        if (isOptional) itemEmoji = '⭕'; // Optional items
        if (isRecommended) itemEmoji = '⭐'; // Recommended items
        
        // Format item line: number + emoji + name + badges + price (right-aligned)
        let itemPrefix = `${idx + 1}  ${itemEmoji} `;
        let nameWithBadges = secondary(itemName);
        if (isOptional) nameWithBadges += ` ${colorize('[Optional]', colors.grey)}`;
        if (isRecommended) nameWithBadges += ` ${colorize('[Recommended]', colors.blue)}`;
        const nameWithPrefix = itemPrefix + nameWithBadges;
        const priceStr = cleanCurrency(price);
        
        // Calculate spacing for right-aligned price
        const nameVisualWidth = getCleanVisualWidth(nameWithPrefix);
        const priceVisualWidth = getCleanVisualWidth(priceStr);
        const spacing = Math.max(0, contentWidth - nameVisualWidth - priceVisualWidth);
        
        console.log(nameWithPrefix + ' '.repeat(spacing) + priceStr);
        
        // Quantity breakdown if > 1
        if (qty > 1) {
          const qtyLine = `   ${secondary(`${qty} × `)}${cleanCurrency(unitPrice)}${secondary(' = ')}${cleanCurrency(price)}`;
          console.log(qtyLine);
        }
        
        // Description (wrapped, indented) - skip disclosures
        if (!isDisclosure && item.description && item.description.trim()) {
          const desc = item.description.substring(0, 300).trim();
          const wrapped = cleanWrapText(desc, 3, contentWidth);
          wrapped.forEach(line => {
            console.log('   ' + colorize(line, colors.grey));
          });
        }
        
        console.log(''); // Blank line between items
      });
      
      // Show line item comparison if quote line items are available
      if (type === 'job' && entity.quote?.lineItems?.nodes && entity.quote.lineItems.nodes.length > 0) {
        const calculator = new ProfitabilityCalculator();
        const comparison = calculator.compareLineItems(
          entity.quote.lineItems.nodes,
          entity.lineItems?.nodes || []
        );
        
        if (comparison.added.length > 0 || comparison.removed.length > 0 || comparison.changed.length > 0) {
          console.log(cleanSection('🔄', 'LINE ITEM ADJUSTMENTS'));
          
          if (comparison.added.length > 0) {
            console.log(colorize(`   Added (${comparison.added.length}):`, colors.green));
            comparison.added.forEach(adj => {
              const item = adj.item;
              const value = adj.value;
              const name = item.name || 'Untitled';
              const qty = item.quantity || 1;
              const unitPrice = qty > 1 && value !== 0 ? value / qty : value;
              const description = item.description || '';
              const valueColor = value < 0 ? colors.green : colors.warning;
              
              // Calculate spacing for right-aligned currency
              const nameLabel = `   + ${primary(name)}`;
              const priceStr = colorize(cleanCurrency(value), valueColor);
              const nameLabelWidth = getCleanVisualWidth(nameLabel);
              const priceWidth = getCleanVisualWidth(priceStr);
              const padding = Math.max(2, contentWidth - nameLabelWidth - priceWidth - 4);
              console.log(`${nameLabel}${' '.repeat(padding)}${priceStr}`);
              
              if (qty > 1) {
                console.log(`     Quantity: ${qty} × ${cleanCurrency(unitPrice)} = ${cleanCurrency(value)}`);
              }
              
              // Only show description for non-disclosure items
              const isDisclosure = name.toLowerCase().includes('disclosure');
              if (!isDisclosure && description && description.trim()) {
                const desc = description.length > 150 ? description.substring(0, 150) + '...' : description;
                const wrapped = desc.split('\n').slice(0, 3);
                wrapped.forEach(line => {
                  if (line.trim()) {
                    console.log(`     ${colorize(line.trim(), colors.grey)}`);
                  }
                });
              }
            });
            console.log('');
          }
          
          if (comparison.removed.length > 0) {
            console.log(colorize(`   Removed (${comparison.removed.length}):`, colors.warning));
            comparison.removed.forEach(adj => {
              const item = adj.item;
              const value = adj.value;
              const name = item.name || 'Untitled';
              const qty = item.quantity || 1;
              const unitPrice = qty > 1 && value !== 0 ? value / qty : value;
              const description = item.description || '';
              
              // Calculate spacing for right-aligned currency
              const nameLabel = `   - ${secondary(name)}`;
              const priceStr = cleanCurrency(value);
              const nameLabelWidth = getCleanVisualWidth(nameLabel);
              const priceWidth = getCleanVisualWidth(priceStr);
              const padding = Math.max(2, contentWidth - nameLabelWidth - priceWidth - 4);
              console.log(`${nameLabel}${' '.repeat(padding)}${priceStr}`);
              
              if (qty > 1) {
                console.log(`     Quantity: ${qty} × ${cleanCurrency(unitPrice)} = ${cleanCurrency(value)}`);
              }
              
              // Only show description for non-disclosure items
              const isDisclosure = name.toLowerCase().includes('disclosure');
              if (!isDisclosure && description && description.trim()) {
                const desc = description.length > 150 ? description.substring(0, 150) + '...' : description;
                const wrapped = desc.split('\n').slice(0, 3);
                wrapped.forEach(line => {
                  if (line.trim()) {
                    console.log(`     ${colorize(line.trim(), colors.grey)}`);
                  }
                });
              }
            });
            console.log('');
          }
          
          if (comparison.changed.length > 0) {
            console.log(colorize(`   Changed (${comparison.changed.length}):`, colors.blue));
            comparison.changed.forEach(adj => {
              const quoteItem = adj.quote;
              const jobItem = adj.job;
              const name = jobItem.name || quoteItem.name || 'Untitled';
              const quoteVal = adj.quoteValue;
              const jobVal = adj.jobValue;
              const diff = adj.difference;
              const diffColor = diff < 0 ? colors.green : colors.warning;
              const quoteQty = quoteItem.quantity || 1;
              const jobQty = jobItem.quantity || 1;
              
              console.log(`    ~ ${primary(name)}`);
              console.log(`      Quote: ${cleanCurrency(quoteVal)}${quoteQty > 1 ? ` (${quoteQty} × ${cleanCurrency(quoteVal / quoteQty)})` : ''}`);
              console.log(`      Job:   ${cleanCurrency(jobVal)}${jobQty > 1 ? ` (${jobQty} × ${cleanCurrency(jobVal / jobQty)})` : ''}`);
              console.log(`      Change: ${colorize(diff >= 0 ? '+' : '', diffColor)}${cleanCurrency(Math.abs(diff))}`);
            });
            console.log('');
          }
        }
      }
    }
  }
}

export default GetCommand;
