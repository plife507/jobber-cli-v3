/**
 * Purpose: List Action Required Jobs - get all jobs with action_required status
 * Inputs: Optional filters (status, limit)
 * Outputs: List of jobs requiring action with totals and summaries
 * Dependencies: BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';

export class ListARJobsCommand extends BaseCommand {
  /**
   * Command metadata
   */
  static get commandName() {
    return 'list-ar';
  }

  static get description() {
    return 'List all jobs requiring action (AR status)';
  }

  /**
   * Execute list-ar command
   */
  async run(options) {
    try {
      await this.initialize();

      const status = options.status || 'action_required';
      const limit = parseInt(options.limit) || 100;

      logger.info(`\n╔═══════════════════════════════════════════════════════════╗`);
      logger.info(`║  Jobs with Status: ${status.toUpperCase().padEnd(38)} ║`);
      logger.info(`╚═══════════════════════════════════════════════════════════╝\n`);

      logger.info(`Fetching jobs with status: ${status}...\n`);

      // Query jobs with filter (supports pagination)
      const query = `query GetJobsByStatus($status: JobStatusTypeEnum!, $first: Int!, $after: String) {
  jobs(first: $first, filter: { status: $status }, after: $after) {
    nodes {
      id
      jobNumber
      title
      jobStatus
      jobType
      total
      invoicedTotal
      startAt
      completedAt
      client {
        id
        name
      }
      property {
        id
        address {
          street
          street1
          city
          province
          postalCode
        }
      }
      quote {
        quoteNumber
        amounts {
          total
        }
      }
      invoices {
        nodes {
          invoiceNumber
          amounts {
            total
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

      // Fetch all jobs using pagination
      // Use smaller page sizes to avoid rate limits (20 jobs per page is safe)
      const allJobs = [];
      let cursor = null;
      let hasNextPage = true;
      let pageCount = 0;
      const pageSize = 20; // Smaller page size to avoid rate limits
      const maxPages = Math.ceil(limit / pageSize) + 2; // Allow a couple extra pages
      
      logger.info(`Fetching jobs (${pageSize} per page, up to ${limit} total)...\n`);

      while (hasNextPage && allJobs.length < limit && pageCount < maxPages) {
        await this.checkThrottle(200, { silent: true });
        
        // Add small delay between pagination pages (already handled by MIN_REQUEST_DELAY in client)
        // No additional delay needed - client handles rate limiting
        
        const result = await this.queryExecutor.execute(
          query,
          { 
            status: status.toLowerCase(), 
            first: Math.min(pageSize, limit - allJobs.length),
            after: cursor 
          },
          { estimatedCost: 200 }
        );

        if (!result.success) {
          // If we got some jobs, return what we have
          if (allJobs.length > 0) {
            logger.warn(`\n⚠️  Stopped fetching after page ${pageCount} due to error, but got ${allJobs.length} jobs`);
            break;
          }
          throw new Error('Failed to fetch jobs');
        }

        const pageJobs = result.data?.jobs?.nodes || [];
        const pageInfo = result.data?.jobs?.pageInfo || {};
        
        allJobs.push(...pageJobs);
        hasNextPage = pageInfo.hasNextPage || false;
        cursor = pageInfo.endCursor || null;
        pageCount++;

        if (pageJobs.length > 0 && !options.json) {
          logger.info(`   Fetched page ${pageCount}: ${pageJobs.length} jobs (total: ${allJobs.length})`);
        }
        
        // If we got fewer jobs than requested, we've reached the end
        if (pageJobs.length < pageSize) {
          hasNextPage = false;
        }
      }

      const jobs = allJobs.slice(0, limit); // Respect limit
      const hasMore = hasNextPage || allJobs.length > limit;

      if (jobs.length === 0) {
        logger.info(`No jobs found with status: ${status}`);
        return;
      }

      // If we hit the limit but there are more, inform user
      if (hasMore && allJobs.length >= limit) {
        logger.warn(`\n⚠️  Note: Fetched ${allJobs.length} jobs (limit: ${limit}), but more are available.`);
        logger.warn(`   To get more, increase --limit or wait a few minutes to avoid rate limits.\n`);
      }

      // Calculate totals
      let totalValue = 0;
      let totalInvoiced = 0;
      let recurringCount = 0;
      let needsInvoicingCount = 0;

      jobs.forEach(job => {
        totalValue += job.total || 0;
        totalInvoiced += job.invoicedTotal || 0;
        if (job.jobType === 'RECURRING') recurringCount++;
        if (job.jobStatus === 'requires_invoicing') needsInvoicingCount++;
      });

      const outstanding = totalValue - totalInvoiced;

      // Display results
      logger.success(`Found ${jobs.length} jobs${hasMore ? ' (more available)' : ''}\n`);

      if (!options.json) {
        // Console display
        jobs.forEach((job, i) => {
          const recurring = job.jobType === 'RECURRING' ? ' 🔄' : '';
          const needsInvoice = job.invoicedTotal < job.total ? ' 💰' : '';
          
          logger.info(`${i + 1}. Job #${job.jobNumber}${recurring}${needsInvoice} - $${job.total.toLocaleString()}`);
          console.log(`   ${job.title}`);
          console.log(`   Client: ${job.client.name}`);
          
          if (job.property?.address) {
            const addr = job.property.address;
            const street = addr.street || addr.street1;
            console.log(`   Property: ${street}, ${addr.city}`);
          }
          
          if (job.invoicedTotal < job.total) {
            const gap = job.total - job.invoicedTotal;
            console.log(`   ⚠️  Outstanding: $${gap.toLocaleString()} (${job.invoices.nodes.length} invoices)`);
          }
          
          console.log('');
        });

        // Summary
        logger.info('═'.repeat(80));
        logger.info('SUMMARY');
        logger.info('═'.repeat(80));
        logger.info(`Total Jobs: ${jobs.length}`);
        logger.info(`Recurring Jobs: ${recurringCount}`);
        logger.info(`Needs Invoicing: ${needsInvoicingCount}`);
        logger.info(`Total Value: $${totalValue.toLocaleString()}`);
        logger.info(`Total Invoiced: $${totalInvoiced.toLocaleString()}`);
        logger.warn(`Outstanding: $${outstanding.toLocaleString()}`);
        logger.info(`Average Job Value: $${Math.round(totalValue / jobs.length).toLocaleString()}`);
        logger.info('═'.repeat(80) + '\n');
      } else {
        // JSON output
        console.log(JSON.stringify({
          status,
          count: jobs.length,
          hasMore,
          totals: {
            totalValue,
            totalInvoiced,
            outstanding,
            averageValue: Math.round(totalValue / jobs.length)
          },
          counts: {
            recurring: recurringCount,
            needsInvoicing: needsInvoicingCount
          },
          jobs
        }, null, 2));
      }

      return;

    } catch (error) {
      logger.error(`Failed to list jobs: ${error.message}`);

      if (error.stack && process.env.DEBUG) {
        logger.debug(error.stack);
      }

      throw error;
    }
  }
}

export default ListARJobsCommand;

