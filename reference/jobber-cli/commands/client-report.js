/**
 * Purpose: Client Report Command - generates single-page HTML profitability report for 1-3 related jobs
 * Inputs: 1-3 job numbers (main job + optional change orders)
 * Outputs: Self-contained HTML file with combined summary and individual job details
 * Dependencies: BaseCommand, ProfitabilityService, ClientReportHTMLGenerator, file-handler, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import ProfitabilityService from '../lib/reporting/profitability-service.js';
import { generateClientReportHTML } from '../lib/reporting/generators/client-report-html-generator.js';
import { writeHTMLReport } from '../lib/reporting/utils/file-handler.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

export class ClientReportCommand extends BaseCommand {
  constructor() {
    super();
    this.profitabilityService = null;
  }

  static get commandName() {
    return 'client-report';
  }

  static get description() {
    return 'Generate single-page HTML profitability report for 1-3 related jobs (e.g., main job + change orders)';
  }

  async run(args) {
    await this.initialize();

    // Parse job numbers from arguments
    const jobNumbers = this.parseJobNumbers(args);
    
    if (jobNumbers.length === 0) {
      throw new Error('At least one job number required. Usage: jobber client-report <job1> [job2] [job3] [--output <path>]');
    }

    if (jobNumbers.length > 3) {
      throw new Error('Maximum 3 job numbers allowed. For more jobs, use batch-html-report command.');
    }

    const outputPath = args.output || args.o || null;

    logger.info(`Generating client report for ${jobNumbers.length} job(s): ${jobNumbers.join(', ')}`);

    // Fetch all jobs
    const jobsData = [];
    const service = this.getProfitabilityService();

    for (const jobNumber of jobNumbers) {
      try {
        logger.info(`Fetching job #${jobNumber}...`);
        
        const encodedId = await this.findJobIdByNumber(jobNumber);
        if (!encodedId) {
          throw new Error(`Job #${jobNumber} not found`);
        }

        const { job, profitability } = await service.getJobAndProfitability(encodedId, { fullPagination: true });
        
        logger.success(`✅ Job #${jobNumber}: ${job.title || 'Untitled'} (${profitability.jobType})`);
        
        jobsData.push({ job, profitability });
      } catch (error) {
        logger.error(`❌ Failed to fetch job #${jobNumber}: ${error.message}`);
        
        // Handle token expiration
        if (error.message?.includes('expired')) {
          const refreshed = await this.handleTokenExpiration();
          if (!refreshed) {
            throw new Error('Token refresh failed');
          }
          // Retry this job
          const encodedId = await this.findJobIdByNumber(jobNumber);
          if (encodedId) {
            const { job, profitability } = await service.getJobAndProfitability(encodedId, { fullPagination: true });
            jobsData.push({ job, profitability });
            logger.success(`✅ Job #${jobNumber}: ${job.title || 'Untitled'}`);
          }
        } else {
          throw error;
        }
      }
    }

    if (jobsData.length === 0) {
      throw new Error('No job data fetched successfully');
    }

    // Generate HTML report
    logger.info('Generating HTML report...');
    
    const clientName = jobsData[0]?.job?.client?.name || 'Client';
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = generateClientReportHTML(jobsData, {
      clientName,
      generatedDate
    });

    // Determine output path
    const finalPath = outputPath || this.getDefaultOutputPath(jobNumbers, clientName);

    // Write HTML file
    const writeResult = writeHTMLReport(html, finalPath, {
      validate: true,
      backup: false,
      overwrite: true
    });

    if (!writeResult.success) {
      throw new Error(`Failed to write HTML report: ${writeResult.error}`);
    }

    logger.success(`✅ Report generated: ${writeResult.path}`);
    logger.info(`   File size: ${writeResult.sizeKB} KB`);

    // Display summary
    this.displaySummary(jobsData);

    return {
      success: true,
      outputFile: writeResult.path,
      jobsProcessed: jobsData.length,
      jobs: jobsData.map(d => ({
        jobNumber: d.job.jobNumber,
        title: d.job.title,
        profit: d.profitability.trueProfit,
        margin: d.profitability.trueProfitMarginPercent
      }))
    };
  }

  /**
   * Parse job numbers from arguments
   */
  parseJobNumbers(args) {
    const numbers = [];
    
    // From positional args
    if (args._positional) {
      args._positional.forEach(arg => {
        const num = String(arg).trim();
        if (num && !isNaN(num)) {
          numbers.push(num);
        }
      });
    }
    
    // From named args (job, jobs)
    if (args.job) {
      const jobs = Array.isArray(args.job) ? args.job : [args.job];
      jobs.forEach(j => {
        const num = String(j).trim();
        if (num && !isNaN(num)) numbers.push(num);
      });
    }
    
    if (args.jobs) {
      const jobList = String(args.jobs).split(',').map(s => s.trim());
      jobList.forEach(num => {
        if (num && !isNaN(num)) numbers.push(num);
      });
    }

    return [...new Set(numbers)].slice(0, 3); // Dedupe and limit to 3
  }

  /**
   * Get profitability service
   */
  getProfitabilityService() {
    if (!this.profitabilityService) {
      this.profitabilityService = new ProfitabilityService(this.queryExecutor, this.errorHandler);
    }
    return this.profitabilityService;
  }

  /**
   * Generate default output path
   */
  getDefaultOutputPath(jobNumbers, clientName) {
    const timestamp = new Date().toISOString().split('T')[0];
    const jobPart = jobNumbers.length === 1 
      ? `job_${jobNumbers[0]}`
      : `jobs_${jobNumbers.join('-')}`;
    
    // Sanitize client name for filename
    const sanitizedClient = clientName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    
    return join(projectRoot, 'batch-reports', 'html-reports', `${jobPart}_${sanitizedClient}_${timestamp}.html`);
  }

  /**
   * Display summary to console
   */
  displaySummary(jobsData) {
    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.info('📊 REPORT SUMMARY');
    logger.info('═══════════════════════════════════════');

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCosts = 0;

    jobsData.forEach(({ job, profitability }) => {
      totalRevenue += profitability.effectiveSalePrice || 0;
      totalProfit += profitability.trueProfit || 0;
      totalCosts += (profitability.ppPay || 0) + (profitability.kcLaborCost || 0) + (profitability.materialCost || 0) + (profitability.overheadCost || 0);

      const margin = profitability.trueProfitMarginPercent?.toFixed(1) || '0.0';
      logger.info(`Job #${job.jobNumber}: ${job.title || 'Untitled'}`);
      logger.info(`  Revenue: $${(profitability.effectiveSalePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      logger.info(`  Profit:  $${(profitability.trueProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${margin}%)`);
    });

    if (jobsData.length > 1) {
      logger.info('───────────────────────────────────────');
      logger.info('COMBINED TOTALS:');
      logger.info(`  Total Revenue: $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      logger.info(`  Total Profit:  $${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      const combinedMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
      logger.info(`  Combined Margin: ${combinedMargin}%`);
    }

    logger.info('═══════════════════════════════════════');
  }
}

export default ClientReportCommand;
