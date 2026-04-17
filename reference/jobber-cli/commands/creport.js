/**
 * Purpose: Console Report Command - generates profitability reports displayed in console or HTML format
 * Inputs: Job number, optional formatting options (--html, --output)
 * Outputs: Console-formatted profitability reports OR self-contained HTML file
 * Dependencies: BaseCommand, ProfitabilityService, renderConsoleReport, SingleJobHTMLGenerator, file-handler, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import ProfitabilityService from '../lib/reporting/profitability-service.js';
import { renderConsoleReport } from '../lib/reporting/console-report.js';
import { generateSingleJobHTML } from '../lib/reporting/generators/single-job-html-generator.js';
import { writeHTMLReport } from '../lib/reporting/utils/file-handler.js';
import ReportEngine from '../lib/reporting/report-engine.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

export class CReportCommand extends BaseCommand {
  constructor() {
    super();
    this.profitabilityService = null;
    this.reportEngine = new ReportEngine();
  }

  async run(args) {
    await this.initialize();

    const jobNumber = args.job || args._positional?.[0];
    if (!jobNumber) {
      throw new Error('Job number required. Usage: jobber creport <job_number> [--html] [--output <path>]');
    }

    const useHTML = args.html || args.HTML || false;
    const outputPath = args.output || args.o || null;

    logger.info(`Generating profitability report for job #${jobNumber}...`);

    const encodedId = await this.findJobIdByNumber(jobNumber);
    if (!encodedId) {
      throw new Error(`Job #${jobNumber} not found`);
    }

    const service = this.getProfitabilityService();

    try {
      logger.info('Fetching job details...');
      
      // Always use fullPagination to get all visits, expenses, etc.
      const fetchOptions = { fullPagination: true };
      const { job, profitability } = await service.getJobAndProfitability(encodedId, fetchOptions);
      
      logger.success(`Found job: #${job.jobNumber} - ${job.title || 'Untitled'} (${profitability.jobType})`);

      if (useHTML) {
        // Generate HTML report
        return await this.generateHTMLReport(job, profitability, jobNumber, outputPath);
      } else {
        // Console output (default)
        renderConsoleReport(profitability, job);
        return { profitability, job };
      }
    } catch (error) {
      if (error.formattedMessage) {
        logger.error(error.formattedMessage);
      } else {
        logger.error(error.message);
      }
      throw error;
    }
  }

  /**
   * Generate HTML report for a single job
   */
  async generateHTMLReport(job, profitability, jobNumber, outputPath) {
    // Validate the profitability data
    const { validation } = this.reportEngine.validate([profitability]);

    // Generate HTML
    const html = generateSingleJobHTML(job, profitability, {
      validation,
      generatedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    // Determine output path
    const finalPath = outputPath || this.getDefaultOutputPath(jobNumber);

    // Write HTML file
    const writeResult = writeHTMLReport(html, finalPath, {
      validate: true,
      backup: false,
      overwrite: true
    });

    if (!writeResult.success) {
      throw new Error(`Failed to write HTML report: ${writeResult.error}`);
    }

    logger.success(`✅ HTML report written to: ${writeResult.path} (${writeResult.sizeKB} KB)`);
    return { profitability, job, htmlPath: writeResult.path };
  }

  /**
   * Generate default output path for single-job HTML report
   */
  getDefaultOutputPath(jobNumber) {
    const timestamp = new Date().toISOString().split('T')[0];
    return join(projectRoot, 'batch-reports', 'html-reports', `job_${jobNumber}_report_${timestamp}.html`);
  }

  getProfitabilityService() {
    if (!this.profitabilityService) {
      this.profitabilityService = new ProfitabilityService(this.queryExecutor, this.errorHandler);
    }
    return this.profitabilityService;
  }

}

export default CReportCommand;

