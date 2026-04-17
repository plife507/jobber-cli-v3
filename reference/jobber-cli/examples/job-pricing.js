#!/usr/bin/env node

/**
 * Example: Get Job Pricing Information
 * Ported from test_job_pricing.js
 * 
 * Usage: node examples/job-pricing.js <job-number>
 */

import { JobberClient } from '../lib/core/jobber-client.js';
import Config from '../lib/utils/config.js';
import logger from '../lib/utils/logger.js';

async function getJobPricing(jobNumber) {
  try {
    Config.validate();
  } catch (error) {
    logger.error(`Configuration error: ${error.message}`);
    process.exit(1);
  }

  const client = new JobberClient(
    Config.API_URL,
    Config.ACCESS_TOKEN,
    Config.API_VERSION
  );

  logger.info(`Searching for Job #${jobNumber}...\n`);

  // Step 1: Search for job by number
  const searchQuery = `
    query SearchJob($searchTerm: String, $first: Int) {
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
      }
    }
  `;

  try {
    const searchResult = await client.executeQuery(searchQuery, { searchTerm: jobNumber }, 20);
    const jobs = searchResult.data?.jobs?.nodes || [];

    if (jobs.length === 0) {
      logger.error(`Job #${jobNumber} not found`);
      process.exit(1);
    }

    const job = jobs[0];
    const jobId = job.id;

    logger.success(`Found Job:`);
    logger.info(`   Number: ${job.jobNumber}`);
    logger.info(`   Title: ${job.title || 'N/A'}`);
    logger.info(`   Status: ${job.jobStatus}`);
    logger.info(`   Client: ${job.client?.name || 'N/A'}\n`);

    // Step 2: Get full job details with pricing
    logger.info(`Fetching full job details with pricing...\n`);

    const detailsQuery = `
      query GetJobPricing($jobId: EncodedId!) {
        job(id: $jobId) {
          id
          jobNumber
          title
          jobStatus
          total
          invoicedTotal
          client {
            id
            name
          }
          quote {
            id
            title
            amounts {
              subtotal
              discountAmount
              total
              taxAmount
            }
            lineItems(first: 10) {
              nodes {
                id
                name
                description
                quantity
                cost
              }
            }
          }
          expenses(first: 100) {
            nodes {
              id
              title
              description
              total
              date
            }
          }
          invoices(first: 10) {
            nodes {
              id
              invoiceNumber
              amounts {
                total
                subtotal
              }
            }
          }
        }
      }
    `;

    const detailsResult = await client.executeQuery(detailsQuery, { jobId: jobId }, 300);
    const jobData = detailsResult.data?.job;

    if (!jobData) {
      logger.error('Could not fetch job details');
      process.exit(1);
    }

    // Display results
    console.log('='.repeat(60));
    console.log(`JOB PRICING SUMMARY - Job #${jobData.jobNumber}`);
    console.log('='.repeat(60));
    console.log(`Title: ${jobData.title || 'N/A'}`);
    console.log(`Status: ${jobData.jobStatus}`);
    console.log(`Client: ${jobData.client?.name || 'N/A'}\n`);

    // Quote Information
    if (jobData.quote) {
      const quote = jobData.quote;
      const amounts = quote.amounts;

      console.log('QUOTE INFORMATION');
      console.log('-'.repeat(60));
      console.log(`Quote Title: ${quote.title || 'N/A'}\n`);

      console.log('PRICING BREAKDOWN:');
      console.log(`   Quote Cost (Subtotal):    $${amounts.subtotal?.toFixed(2) || '0.00'}`);
      console.log(`   Discount Amount:         $${amounts.discountAmount?.toFixed(2) || '0.00'}`);
      console.log(`   Tax Amount:               $${amounts.taxAmount?.toFixed(2) || '0.00'}`);
      console.log(`   Final Price (Total):      $${amounts.total?.toFixed(2) || '0.00'}\n`);

      if (quote.lineItems?.nodes?.length > 0) {
        console.log('LINE ITEMS:');
        quote.lineItems.nodes.forEach((item, index) => {
          const qty = item.quantity || 0;
          const cost = item.cost || 0;
          const lineTotal = qty * cost;
          console.log(`   ${index + 1}. ${item.name || 'N/A'}`);
          console.log(`      Qty: ${qty} × $${cost.toFixed(2)} = $${lineTotal.toFixed(2)}`);
        });
        console.log();
      }
    }

    // Expenses
    if (jobData.expenses?.nodes?.length > 0) {
      console.log('EXPENSES:');
      console.log('-'.repeat(60));
      const totalExpenses = jobData.expenses.nodes.reduce((sum, exp) => sum + (exp.total || 0), 0);
      console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}\n`);
    }

    // Job Totals
    console.log('JOB TOTALS:');
    console.log('-'.repeat(60));
    if (jobData.total !== undefined) {
      console.log(`   Job Total: $${jobData.total.toFixed(2)}`);
    }
    if (jobData.invoicedTotal !== undefined) {
      console.log(`   Invoiced Total: $${jobData.invoicedTotal.toFixed(2)}`);
    }

    // Invoices
    if (jobData.invoices?.nodes?.length > 0) {
      console.log(`\nINVOICES (${jobData.invoices.nodes.length}):`);
      jobData.invoices.nodes.forEach((inv, index) => {
        console.log(`   ${index + 1}. Invoice #${inv.invoiceNumber || 'N/A'}: $${inv.amounts?.total?.toFixed(2) || '0.00'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    logger.success('Analysis complete!');

  } catch (error) {
    logger.error(`Error: ${error.message}`);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      logger.error('\nThis usually means your access token is invalid or expired.');
    }
    process.exit(1);
  }
}

// Run example
const jobNumber = process.argv[2] || '18524';
getJobPricing(jobNumber);
