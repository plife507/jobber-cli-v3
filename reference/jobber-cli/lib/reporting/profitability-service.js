/**
 * Purpose: Profitability Service - fetches job data and calculates profitability using ProfitabilityCalculator
 * Inputs: Job IDs, GraphQL queries
 * Outputs: Job data with profitability calculations, aggregated results
 * Dependencies: ProfitabilityCalculator, JobberClient, GraphQL queries
 */
import { ProfitabilityCalculator } from '../utils/profitability-calculator.js';

// Custom fields fragment — only included when requested (saves ~20 units/node)
const CUSTOM_FIELDS_FRAGMENT = `
      customFields {
        ... on CustomFieldText {
          label
          customFieldConfiguration { name }
          valueText
        }
        ... on CustomFieldDropdown {
          label
          customFieldConfiguration { name }
          valueDropdown
        }
        ... on CustomFieldLink {
          label
          customFieldConfiguration { name }
          valueLink { text url }
        }
      }`;

export const JOB_PROFITABILITY_QUERY = `
  query GetJobProfitability($id: EncodedId!) {
    job(id: $id) {
      id
      jobNumber
      title
      jobStatus
      total
      quote {
        id
        quoteNumber
        amounts {
          subtotal
          discountAmount
          taxAmount
          total
          depositAmount
          outstandingDepositAmount
        }
        depositRecords(first: 10) {
          nodes {
            id
            amount
            entryDate
            jobberPaymentPaymentMethod
            jobberPaymentLast4
            adjustmentType
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
      expenses(first: 20) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          description
          total
          date
          paidBy {
            id
            name {
              full
            }
          }
          reimbursableTo {
            id
            name {
              full
            }
          }
          enteredBy {
            id
            name {
              full
            }
          }
        }
      }
      visits(first: 10) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          startAt
          endAt
          completedAt
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
      timeSheetEntries(first: 25) {
        nodes {
          id
          user {
            id
            name {
              full
            }
          }
          labourRate
          finalDuration
          label
          note
        }
      }
      jobCosting {
        labourCost
        labourDuration
      }
      client {
        id
        name
      }
      property {
        address {
          street
          street1
          street2
          city
          province
          postalCode
          country
        }
      }
      salesperson {
        id
        name {
          full
        }
      }
      # CUSTOM_FIELDS_PLACEHOLDER
    }
  }
`;

// Query with custom fields included (use when --cf flag is set)
export const JOB_PROFITABILITY_QUERY_WITH_CF = JOB_PROFITABILITY_QUERY.replace(
  '# CUSTOM_FIELDS_PLACEHOLDER',
  CUSTOM_FIELDS_FRAGMENT
);

// Pagination query for expenses
const EXPENSES_PAGE_QUERY = `
  query GetJobExpenses($id: EncodedId!, $cursor: String) {
    job(id: $id) {
      expenses(first: 20, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          description
          total
          date
          paidBy { id name { full } }
          reimbursableTo { id name { full } }
          enteredBy { id name { full } }
        }
      }
    }
  }
`;

// Pagination query for visits
const VISITS_PAGE_QUERY = `
  query GetJobVisits($id: EncodedId!, $cursor: String) {
    job(id: $id) {
      visits(first: 20, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          startAt
          endAt
          completedAt
          assignedUsers {
            nodes { id name { full } }
          }
        }
      }
    }
  }
`;

export class ProfitabilityService {
  constructor(queryExecutor, errorHandler, options = {}) {
    this.queryExecutor = queryExecutor;
    this.errorHandler = errorHandler;
    this.calculator = options.calculator || new ProfitabilityCalculator();
  }

  getCalculator() {
    return this.calculator;
  }

  /**
   * Paginate through a connection (expenses, visits, etc.)
   */
  async paginateConnection(encodedId, query, connectionName, initialData) {
    const allNodes = [...(initialData.nodes || [])];
    let pageInfo = initialData.pageInfo;
    
    while (pageInfo?.hasNextPage) {
      const result = await this.queryExecutor.execute(
        query,
        { id: encodedId, cursor: pageInfo.endCursor },
        { estimatedCost: 50 }
      );
      
      if (!result.success || !result.data?.job?.[connectionName]) {
        break;
      }
      
      const connection = result.data.job[connectionName];
      allNodes.push(...(connection.nodes || []));
      pageInfo = connection.pageInfo;
    }
    
    return { nodes: allNodes };
  }

  /**
   * Fetch job data with optional full pagination
   */
  async fetchJob(encodedId, options = {}) {
    const { fullPagination = false, includeCustomFields = false, ...executionOptions } = options;
    const query = includeCustomFields ? JOB_PROFITABILITY_QUERY_WITH_CF : JOB_PROFITABILITY_QUERY;
    const costEstimate = includeCustomFields ? 200 : 150;
    const finalOptions = { estimatedCost: costEstimate, ...executionOptions };

    const result = await this.queryExecutor.execute(
      query,
      { id: encodedId },
      finalOptions
    );

    if (!result.success) {
      const errorDetails = result.errorDetails?.[0];
      let formattedMessage = null;

      if (errorDetails && this.errorHandler?.formatError) {
        formattedMessage = this.errorHandler.formatError(errorDetails);
      } else if (result.errors?.length) {
        formattedMessage = result.errors.map(err => err.message).join('\n');
      }

      const error = new Error('Failed to fetch job details');
      if (formattedMessage) {
        error.formattedMessage = formattedMessage;
      }
      error.result = result;
      throw error;
    }

    if (!result.data?.job) {
      throw new Error('Job not found');
    }

    const job = result.data.job;

    // If fullPagination requested, fetch all paginated data
    if (fullPagination) {
      // Paginate expenses if needed
      if (job.expenses?.pageInfo?.hasNextPage) {
        job.expenses = await this.paginateConnection(
          encodedId, EXPENSES_PAGE_QUERY, 'expenses', job.expenses
        );
      }
      
      // Paginate visits if needed
      if (job.visits?.pageInfo?.hasNextPage) {
        job.visits = await this.paginateConnection(
          encodedId, VISITS_PAGE_QUERY, 'visits', job.visits
        );
      }
    }

    return job;
  }

  calculate(job) {
    const profitability = this.calculator.calculateProfitability(job);
    profitability._calculator = this.calculator;
    return profitability;
  }

  async getJobAndProfitability(encodedId, options = {}) {
    const job = await this.fetchJob(encodedId, options);
    const profitability = this.calculate(job);
    return { job, profitability };
  }
}

export default ProfitabilityService;

