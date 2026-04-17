/**
 * Purpose: Batch HTML Report Command - generates comprehensive HTML profitability reports from CSV job lists
 * Inputs: CSV file path containing job numbers, optional output file path
 * Outputs: Self-contained HTML file with executive summaries, breakdowns, and detailed job cards
 * Dependencies: BaseCommand, ProfitabilityService, csv-parser, html-generator, file-handler, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import ProfitabilityService from '../lib/reporting/profitability-service.js';
import { parseJobNumbersFromCSV } from '../lib/utils/csv-parser.js';
import { writeHTMLReport, getDefaultReportPath } from '../lib/reporting/utils/file-handler.js';
import ReportEngine from '../lib/reporting/report-engine.js';
import Config from '../lib/utils/config.js';
import { basename, join } from 'path';

export class BatchHTMLReportCommand extends BaseCommand {
  constructor() {
    super();
    this.profitabilityService = null;
    this.reportEngine = new ReportEngine();
  }

  static get commandName() {
    return 'batch-html-report';
  }

  static get description() {
    return 'Generate comprehensive HTML profitability report from CSV of job numbers';
  }

  async run(args) {
    await this.initialize();

    // Get CSV file path (prompt if not provided)
    let csvFile = args.csv || args.file || args._positional?.[0];
    if (!csvFile) {
      csvFile = await this.promptForCSV();
      if (!csvFile) {
        throw new Error('CSV file path required to generate report');
      }
    }

    // Get output file path (optional)
    const outputFile = args.output || args.o || this.generateDefaultOutputPath(csvFile);

    logger.info(`📄 Reading job numbers from CSV: ${csvFile}`);

    // Parse CSV to get job numbers
    let jobNumbers;
    try {
      jobNumbers = parseJobNumbersFromCSV(csvFile);
      logger.success(`✅ Found ${jobNumbers.length} job numbers in CSV`);
    } catch (error) {
      logger.error(`❌ Failed to parse CSV: ${error.message}`);
      throw error;
    }

    if (jobNumbers.length === 0) {
      throw new Error('No valid job numbers found in CSV');
    }

    // Display job numbers
    logger.info(`Job numbers to process: ${jobNumbers.slice(0, 5).join(', ')}${jobNumbers.length > 5 ? '...' : ''}`);
    
    // Estimate total cost and time
    const estimatedCostPerJob = 200; // Actual: ~150 profitability + ~12 search lookup
    const totalEstimatedCost = jobNumbers.length * estimatedCostPerJob;
    const estimatedTimeSeconds = Math.ceil(totalEstimatedCost / 500); // Restore rate is 500 units/sec
    
    logger.info(`📊 Estimated throttle cost: ${totalEstimatedCost.toLocaleString()} units`);
    logger.info(`⏱️  Estimated time: ~${estimatedTimeSeconds} seconds`);
    logger.info('');

    // Fetch job data with progress tracking
    const profitabilityData = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;

    const service = this.getProfitabilityService();

    let retryCount = 0;
    const MAX_RETRIES_PER_JOB = 2;
    for (let i = 0; i < jobNumbers.length; i++) {
      const jobNumber = jobNumbers[i];
      const progress = `(${i + 1}/${jobNumbers.length})`;

      try {
        logger.info(`🔄 Fetching job #${jobNumber} ${progress}...`);

        // Find the job's encoded ID by searching (required by Jobber API)
        const encodedId = await this.findJobIdByNumber(jobNumber);
        if (!encodedId) {
          throw new Error(`Job #${jobNumber} not found`);
        }

        // Throttle manager handles rate limiting automatically
        // Fetch job and calculate profitability
        const { job, profitability } = await service.getJobAndProfitability(encodedId);

        profitabilityData.push(profitability);
        successCount++;
        retryCount = 0; // Reset retry counter on success

        logger.success(`✅ Job #${jobNumber}: ${job.title || 'Untitled'} - ${profitability.jobType}`);

        // Show throttle status every 10 jobs
        if ((i + 1) % 10 === 0 && this.throttleManager) {
          const status = this.throttleManager.getStatus();
          const maxBudget = status.maximumAvailable ?? status.maxBudget ?? '?';
          logger.info(`   💡 Throttle: ${status.currentlyAvailable}/${maxBudget} units available`);
        }

      } catch (error) {
        failCount++;
        logger.error(`❌ Failed to fetch job #${jobNumber}: ${error.message}`);
        
        errors.push({
          jobNumber,
          error: error.message
        });

        // If it's an auth error, try to handle it
        if (error.message && error.message.includes('expired')) {
          logger.warn('⚠️  Token may be expired, attempting refresh...');
          const refreshed = await this.handleTokenExpiration();
          if (refreshed && retryCount < MAX_RETRIES_PER_JOB) {
            logger.success('✅ Token refreshed, retrying job...');
            retryCount++;
            i--;
            continue;
          } else if (!refreshed) {
            logger.error('❌ Token refresh failed, stopping...');
            break;
          }
        }

        // Continue with next job
        continue;
      }
    }

    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.success(`✅ Successfully fetched: ${successCount} jobs`);
    if (failCount > 0) {
      logger.warn(`⚠️  Failed: ${failCount} jobs`);
    }
    logger.info('═══════════════════════════════════════');
    logger.info('');

    if (profitabilityData.length === 0) {
      throw new Error('No job data was successfully fetched. Cannot generate report.');
    }

    // Filter to PP only if requested
    const ppOnly = args['pp-only'] || args.ppOnly;
    if (ppOnly) {
      const before = profitabilityData.length;
      const filtered = profitabilityData.filter(p => p.jobType === 'PP');
      const removed = before - filtered.length;
      if (removed > 0) {
        profitabilityData.length = 0;
        profitabilityData.push(...filtered);
        logger.info(`📌 PP only: excluded ${removed} non-PP job(s). Report has ${profitabilityData.length} jobs.`);
      }
      if (profitabilityData.length === 0) {
        throw new Error('No PP jobs in the fetched set. Cannot generate report.');
      }
    }

    // Validate profitability data before report generation
    logger.info('🔍 Validating data integrity...');
    const { validation, blockingErrors } = this.reportEngine.validate(profitabilityData);
    
    if (blockingErrors) {
      logger.error('❌ Validation failed - fix data issues before generating the report.');
      const dataErrors = validation.dataValidation?.errors || [];
      const categoryErrors = validation.categoryValidation?.errors || [];
      
      dataErrors.slice(0, 3).forEach(err => {
        logger.error(`  • [Job ${err.jobNumber ?? err.jobIndex}] ${err.message}`);
      });
      categoryErrors.slice(0, 3).forEach(err => {
        logger.error(`  • [Category] ${err.message}`);
      });
      
      const remaining = Math.max(0, dataErrors.length + categoryErrors.length - 6);
      if (remaining > 0) {
        logger.warn(`  ...and ${remaining} more validation issues`);
      }
      
      throw new Error('Validation failed for profitability data');
    }
    
    if (validation.overallWarnings > 0) {
      logger.warn(`⚠️  Found ${validation.overallWarnings} data warnings`);
    }
    // Always log validation details, even if no warnings (shows what was checked)
    this.logValidationDetails(validation);
    
    if (validation.jobTypeValidation && validation.jobTypeValidation.summary) {
      const summary = validation.jobTypeValidation.summary;
      if (summary.anomalousJobs > 0) {
        logger.warn(`⚠️  ${summary.anomalousJobs} jobs have classification issues`);
      }
      if (summary.negativeMarginJobs > 0) {
        logger.warn(`⚠️  ${summary.negativeMarginJobs} jobs have negative margins`);
      }
    }

    // Generate HTML report with new modular generator
    logger.info('📝 Generating HTML report...');

    const reportTitle = `Job Profitability Report - ${basename(csvFile, '.csv')}`;
    const reportSubtitle = `${profitabilityData.length} jobs analyzed`;

    const { html, metrics } = this.reportEngine.generateHTML(profitabilityData, {
      title: reportTitle,
      subtitle: reportSubtitle,
      includeValidation: true,
      includeCategorySections: true,
      includePPSection: true,
      includeCharts: true,
      includeTable: true,
      includeJobCards: true,
      fullValidation: validation // Pass full validation object including dataValidation
    });

    // Write HTML to file using atomic file handler
    logger.info('💾 Writing report to disk...');
    
    const writeResult = writeHTMLReport(html, outputFile, {
      validate: true,
      backup: false,
      overwrite: true
    });
    
    if (!writeResult.success) {
      logger.error(`❌ Failed to write HTML file: ${writeResult.error}`);
      if (writeResult.validation && !writeResult.validation.isValid) {
        writeResult.validation.errors.forEach(err => {
          logger.error(`  - ${err.message}`);
        });
      }
      throw new Error(writeResult.error);
    }
    
    logger.success(`✅ Report generated: ${writeResult.path}`);
    logger.info(`   File size: ${writeResult.sizeKB} KB`);

    // Display summary
    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.info('📊 REPORT SUMMARY');
    logger.info('═══════════════════════════════════════');

    const summary = this.reportEngine.quickSummary(profitabilityData);
    logger.info(`Total Jobs: ${summary.totalJobs}`);
    logger.info(`Total Revenue: $${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    logger.info(`Total Profit: $${summary.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    logger.info(`Average Margin: ${summary.avgMargin.toFixed(1)}%`);
    logger.info('');
    logger.info(`By Category:`);
    Object.entries(summary.byType).forEach(([type, count]) => {
      if (count > 0) {
        logger.info(`  ${type}: ${count} jobs`);
      }
    });

    if (errors.length > 0) {
      logger.info('');
      logger.warn('⚠️  ERRORS ENCOUNTERED:');
      errors.forEach(err => {
        logger.warn(`  Job #${err.jobNumber}: ${err.error}`);
      });
    }

    logger.info('');
    logger.info('═══════════════════════════════════════');
    logger.success(`🎉 Report complete! Open in browser: ${writeResult.path}`);
    logger.info('═══════════════════════════════════════');

    return {
      success: true,
      outputFile: writeResult.path,
      jobsProcessed: profitabilityData.length,
      errors: errors.length,
      summary,
      validation: validation.jobTypeValidation?.summary,
      metrics
    };
  }

  logValidationDetails(validation) {
    if (!validation) {
      logger.warn('⚠️  No validation data available');
      return;
    }

    const dataErrors = validation.dataValidation?.errors || [];
    const dataWarnings = validation.dataValidation?.warnings || [];
    const anomalies = validation.jobTypeValidation?.anomalies || [];
    const jobTypeSummary = validation.jobTypeValidation?.summary || {};

    const logList = (label, items, level = 'warn', limit = 10) => {
      if (!items.length) return;
      logger[level](`⚠️    ${label}: showing first ${Math.min(items.length, limit)} of ${items.length}`);
      items.slice(0, limit).forEach(item => {
        const jobId = item.jobNumber ?? item.jobIndex ?? 'n/a';
        const msg = item.message || item.issue || JSON.stringify(item);
        logger[level](`⚠️      • [Job ${jobId}] ${msg}`);
      });
      if (items.length > limit) {
        logger[level](`⚠️      ...and ${items.length - limit} more ${label.toLowerCase()}`);
      }
    };

    if (dataErrors.length > 0) {
      logList('Validation errors', dataErrors, 'error');
    }
    if (dataWarnings.length > 0) {
      logList('Data warnings', dataWarnings, 'warn');
    }
    if (anomalies.length > 0) {
      logList('Classification anomalies', anomalies, 'warn');
    }
    
    // Show summary counts if warnings exist but details aren't available
    if (validation.overallWarnings > 0 && dataWarnings.length === 0 && anomalies.length === 0) {
      logger.warn(`⚠️    Warning summary:`);
      if (jobTypeSummary.anomalousJobs > 0) {
        logger.warn(`⚠️      • ${jobTypeSummary.anomalousJobs} jobs have classification issues`);
      }
      if (jobTypeSummary.lowMarginJobs > 0) {
        logger.warn(`⚠️      • ${jobTypeSummary.lowMarginJobs} jobs have low margins`);
      }
      if (jobTypeSummary.negativeMarginJobs > 0) {
        logger.warn(`⚠️      • ${jobTypeSummary.negativeMarginJobs} jobs have negative margins`);
      }
    }
  }

  /**
   * Prompt user for CSV file path
   */
  async promptForCSV() {
    if (process.env.JOBBER_NON_INTERACTIVE === '1' || !process.stdin.isTTY) {
      throw new Error('CSV path is required in non-interactive mode. Pass it as: jobber batch <csv>');
    }

    const readline = await import('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY || false
    });

    logger.info('');
    logger.info('📄 CSV file should contain job numbers (one per line with "job number" header)');
    logger.info('   Example: batch-reports/csv-data/octpp.csv');
    logger.info('');

    return new Promise((resolve) => {
      rl.question('Enter CSV file path: ', (answer) => {
        rl.close();
        // Strip quotes and trim whitespace
        let cleanPath = answer.trim();
        if ((cleanPath.startsWith('"') && cleanPath.endsWith('"')) ||
            (cleanPath.startsWith("'") && cleanPath.endsWith("'"))) {
          cleanPath = cleanPath.slice(1, -1);
        }
        resolve(cleanPath || '');
      });
    });
  }

  /**
   * Get or create profitability service
   */
  getProfitabilityService() {
    if (!this.profitabilityService) {
      this.profitabilityService = new ProfitabilityService(
        this.queryExecutor,
        this.errorHandler
      );
    }
    return this.profitabilityService;
  }

  /**
   * Generate default output file path based on input CSV
   */
  generateDefaultOutputPath(csvFile) {
    // Get project root from Config (SCHEMA_CACHE_DIR is projectRoot/.cache)
    const projectRoot = join(Config.SCHEMA_CACHE_DIR, '..');
    
    return getDefaultReportPath(csvFile, projectRoot);
  }

}

export default BatchHTMLReportCommand;
