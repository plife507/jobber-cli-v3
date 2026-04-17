/**
 * Job Selector
 * Interactive job selection with search
 */

import InteractiveSelector from './interactive-selector.js';
import logger from './logger.js';
import { colorize, colors, boldColor } from './theme.js';

export class JobSelector extends InteractiveSelector {
  constructor(queryExecutor = null) {
    super();
    this.queryExecutor = queryExecutor;
  }

  /**
   * Select a job interactively
   * @param {string} searchTerm - Optional initial search term
   * @returns {Promise<string|null>} Selected job ID or null if cancelled
   */
  async selectJob(searchTerm = null) {
    console.log('');
    console.log(boldColor('📋 Select a Job', colors.blue));
    console.log('');

    // If search term provided, use it directly
    let term = searchTerm;
    if (!term) {
      term = await this.getInput(
        'Search for job (by number, title, or client name)',
        'Enter search term or job number',
        '',
        null
      );
    }

    if (!term || term.trim() === '') {
      logger.warn('No search term provided');
      return null;
    }

    logger.info(`Searching for jobs matching "${term}"...`);

    // Search for jobs
    const jobs = await this.searchJobs(term.trim());

    if (!jobs || jobs.length === 0) {
      logger.error(`No jobs found matching "${term}"`);
      return null;
    }

    // If only one result, use it automatically
    if (jobs.length === 1) {
      logger.success(`Found job: #${jobs[0].jobNumber} - ${jobs[0].title || 'Untitled'}`);
      return jobs[0].id;
    }

    // Display multiple results for selection
    return await this.selectFromResults(jobs);
  }

  /**
   * Search for jobs
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of job objects
   */
  async searchJobs(searchTerm) {
    if (!this.queryExecutor) {
      logger.warn('Query executor not available. Cannot search jobs.');
      return [];
    }

    const query = `
      query SearchJobs($searchTerm: String, $first: Int, $after: String) {
        jobs(searchTerm: $searchTerm, first: $first, after: $after) {
          nodes {
            id
            jobNumber
            title
            jobStatus
            client {
              id
              name
            }
            total
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const allJobs = [];
    let cursor = null;
    let hasNextPage = true;
    let pageCount = 0;
    const maxPages = 2; // Limit to 2 pages (50 jobs max for display)

    while (hasNextPage && pageCount < maxPages) {
      const variables = {
        searchTerm: searchTerm,
        first: 25
      };
      if (cursor) {
        variables.after = cursor;
      }

      const result = await this.queryExecutor.execute(query, variables, { estimatedCost: 52 });

      if (!result.success || !result.data?.jobs?.nodes) {
        break;
      }

      const jobs = result.data.jobs.nodes || [];
      allJobs.push(...jobs);

      hasNextPage = result.data.jobs.pageInfo?.hasNextPage || false;
      cursor = result.data.jobs.pageInfo?.endCursor || null;
      pageCount++;

      // Small delay between pages
      if (hasNextPage && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Limit total results to 50 for display
      if (allJobs.length >= 50) {
        break;
      }
    }

    return allJobs.slice(0, 50); // Return max 50 results
  }

  /**
   * Select from search results
   * @param {Array} jobs - Jobs array
   * @returns {Promise<string|null>} Selected job ID
   */
  async selectFromResults(jobs) {
    console.log('');
    console.log(boldColor(`Found ${jobs.length} job(s)`, colors.blue));
    console.log('');

    // Display jobs
    jobs.forEach((job, index) => {
      const num = index + 1;
      const jobNum = job.jobNumber || 'N/A';
      const title = (job.title || 'Untitled').substring(0, 40);
      const client = job.client?.name || 'N/A';
      const status = job.jobStatus || 'N/A';
      const total = job.total ? `$${job.total.toFixed(2)}` : 'N/A';

      console.log(`  ${num}. ${boldColor(`Job #${jobNum}`, colors.blue)} - ${title}`);
      console.log(`     ${colorize(`Client: ${client}`, colors.grey)} | ${colorize(`Status: ${status}`, colors.grey)} | ${colorize(`Total: ${total}`, colors.grey)}`);
    });

    console.log('');

    const selected = await this.selectOption(
      jobs.map((job, index) => ({
        value: job.id,
        label: `Job #${job.jobNumber} - ${job.title || 'Untitled'}`,
        hint: `${job.client?.name || 'N/A'} | ${job.jobStatus || 'N/A'}`
      })),
      'Select a job',
      null
    );

    return selected;
  }
}

export default JobSelector;

