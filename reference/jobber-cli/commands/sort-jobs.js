/**
 * Purpose: Sort Jobs Command - categorizes jobs from CSV as PP (Preferred Partner), PP-mix, or Hybrid
 * Inputs: CSV file with job numbers
 * Outputs: Sorted CSV with job categories and details
 * Dependencies: BaseCommand, ProfitabilityCalculator, fs, csv-parser
 */

import { BaseCommand } from './_base.js';
import ProfitabilityService from '../lib/reporting/profitability-service.js';
import { parseJobNumbersFromCSV } from '../lib/utils/csv-parser.js';
import logger from '../lib/utils/logger.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export class SortJobsCommand extends BaseCommand {
  constructor() {
    super();
    this.profitabilityService = null;
  }

  /**
   * Strip quotes from path (handles single, double, or mixed quotes)
   * @param {string} filePath - File path that may have quotes
   * @returns {string} Path without quotes
   */
  stripQuotes(filePath) {
    if (!filePath) return filePath;
    
    // Remove leading and trailing quotes (both single and double)
    let cleaned = filePath.trim();
    
    // Remove surrounding quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned.trim();
  }

  /**
   * Prompt user for CSV file path
   * @returns {Promise<string>} File path entered by user
   */
  async promptForCSVPath() {
    if (process.env.JOBBER_NON_INTERACTIVE === '1' || !process.stdin.isTTY) {
      throw new Error('CSV file path is required in non-interactive mode. Use: jobber sort-jobs <csv-file>');
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve, reject) => {
      logger.info('');
      logger.info('📂 Job Sorting Tool');
      logger.info('');
      logger.info('(Type "exit" to quit)');
      logger.info('');
      rl.question('Enter the path to your CSV file (or drag & drop the file here): ', (answer) => {
        rl.close();
        const input = answer?.trim() || null;

        // Check for exit commands
        if (input && (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit')) {
          reject(new Error('User cancelled'));
          return;
        }

        resolve(input);
      });
    });
  }

  async run(args) {
    await this.initialize();

    // Get input CSV file path from positional args or prompt
    const positional = args._positional || [];
    let inputFile = positional[0];
    
    // If no file provided, prompt for it
    if (!inputFile) {
      inputFile = await this.promptForCSVPath();
      if (!inputFile) {
        logger.error('❌ No CSV file path provided');
        return;
      }
    }
    
    // Strip quotes from path (handles drag-and-drop or copy-paste with quotes)
    inputFile = this.stripQuotes(inputFile);
    
    // Verify file exists
    if (!fs.existsSync(inputFile)) {
      logger.error(`❌ File not found: ${inputFile}`);
      return;
    }

    // Get output directory (optional, defaults to sorted-jobs-output folder)
    let outputDir = positional[1];
    const parsedPath = path.parse(inputFile);
    const baseName = parsedPath.name;
    
    if (!outputDir) {
      // Create timestamped subfolder for this run
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      
      const runFolder = `${baseName}_${timestamp}`;
      outputDir = path.join(process.cwd(), 'sorted-jobs-output', runFolder);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } else {
      // If user specified a directory, create it if needed
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    }

    // Create output file names
    const outputFiles = {
      pp: path.join(outputDir, `${baseName}_PP.csv`),
      ppMix: path.join(outputDir, `${baseName}_PP-mix.csv`),
      hybrid: path.join(outputDir, `${baseName}_Hybrid.csv`)
    };

    logger.info('🔍 Job Sorting Tool');
    logger.info('');
    logger.info(`Input file:   ${inputFile}`);
    logger.info(`Output files:`);
    logger.info(`  PP:      ${outputFiles.pp}`);
    logger.info(`  PP-mix:  ${outputFiles.ppMix}`);
    logger.info(`  Hybrid:  ${outputFiles.hybrid}`);
    logger.info('');

    // Read and parse CSV
    const jobNumbers = await this.readJobNumbersFromCSV(inputFile);
    
    if (jobNumbers.length === 0) {
      logger.error('❌ No job numbers found in CSV');
      return;
    }

    logger.info(`Found ${jobNumbers.length} job numbers to process`);
    logger.info('');

    // Fetch and categorize jobs
    const categorizedJobs = await this.categorizeJobs(jobNumbers);

    // Sort by category: PP, PP-mix, Hybrid
    const sortedJobs = this.sortJobsByCategory(categorizedJobs);

    // Write output CSVs (3 separate files)
    const filesSaved = await this.writeOutputCSVs(outputFiles, sortedJobs);

    // Display summary
    this.displaySummary(sortedJobs);

    logger.success('✅ Job sorting complete!');
    logger.info('');
    logger.info(`📁 Output folder: ${outputDir}`);
    logger.info('');
    logger.info('Files saved:');
    if (filesSaved.pp > 0) logger.info(`  ${path.basename(outputFiles.pp)} (${filesSaved.pp} jobs)`);
    if (filesSaved.ppMix > 0) logger.info(`  ${path.basename(outputFiles.ppMix)} (${filesSaved.ppMix} jobs)`);
    if (filesSaved.hybrid > 0) logger.info(`  ${path.basename(outputFiles.hybrid)} (${filesSaved.hybrid} jobs)`);
  }

  /**
   * Read job numbers from CSV file using shared csv-parser
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<number[]>} Array of job numbers
   */
  async readJobNumbersFromCSV(filePath) {
    try {
      const result = parseJobNumbersFromCSV(filePath, { reportDuplicates: true });
      
      // Log duplicate information if found
      if (result.duplicates.length > 0) {
        logger.warn(`Found ${result.duplicates.length} duplicate job number(s) in CSV - processing each job once`);
        logger.info(`Unique jobs to process: ${result.jobNumbers.length}`);
        logger.info('');
      }
      
      if (!result.columnDetected) {
        logger.info('Job number column not detected in header - using first column');
        logger.info('');
      }

      // Convert to numbers for compatibility with existing code
      return result.jobNumbers.map(n => parseInt(n, 10));
    } catch (error) {
      logger.error(`Failed to read CSV file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create ProfitabilityService instance
   */
  getProfitabilityService() {
    if (!this.profitabilityService) {
      this.profitabilityService = new ProfitabilityService(this.queryExecutor, this.errorHandler);
    }
    return this.profitabilityService;
  }

  /**
   * Categorize jobs by fetching from API and analyzing
   * @param {number[]} jobNumbers - Array of job numbers
   * @returns {Promise<Array>} Array of categorized job objects
   */
  async categorizeJobs(jobNumbers) {
    const categorizedJobs = [];
    const service = this.getProfitabilityService();

    logger.info('Fetching and categorizing jobs...');
    logger.info('');
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jobNumbers.length; i++) {
      const jobNumber = jobNumbers[i];
      const progress = `[${i + 1}/${jobNumbers.length}]`;
      logger.info(`${progress} Processing Job #${jobNumber}...`);

      try {
        // Step 1: Find job ID by job number
        // Uses queryExecutor with automatic throttle management (cost: ~20 units)
        const encodedId = await this.findJobIdByNumber(jobNumber);
        
        if (!encodedId) {
          logger.warn(`  ⚠️  Job #${jobNumber} not found`);
          categorizedJobs.push({
            jobNumber,
            category: 'NOT FOUND',
            title: 'N/A',
            client: 'N/A',
            ppWorkers: [],
            error: 'Job not found'
          });
          errorCount++;
          continue;
        }

        // Step 2: Fetch full job details and calculate profitability
        // ProfitabilityService uses queryExecutor with automatic throttle (cost: ~150-200 units)
        // No manual throttle check needed - service handles it automatically
        const { job, profitability } = await service.getJobAndProfitability(encodedId);
        
        // Map job type to category
        let category = 'KC';
        if (profitability.jobType === 'PP') {
          category = 'PP';
        } else if (profitability.jobType === 'PP-mix') {
          category = 'PP-mix';
        } else if (profitability.jobType === 'Hybrid') {
          category = 'Hybrid';
        }

        categorizedJobs.push({
          jobNumber: job.jobNumber,
          category,
          title: job.title || 'Untitled',
          client: job.client?.name || 'N/A',
          ppWorkers: profitability.jobPPUsers || [],
          status: job.jobStatus || 'N/A',
          total: job.total || 0
        });

        successCount++;
        logger.info(`  ✓ ${category} - ${profitability.jobPPUsers.length > 0 ? profitability.jobPPUsers.join(', ') : 'No PP'}`);
        
        // Show periodic progress summary
        if ((i + 1) % 10 === 0 || (i + 1) === jobNumbers.length) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const rate = (i + 1) / elapsed;
          const remaining = Math.round((jobNumbers.length - i - 1) / rate);
          logger.info(``);
          logger.info(`  Progress: ${i + 1}/${jobNumbers.length} jobs (${successCount} success, ${errorCount} errors)`);
          logger.info(`  Time: ${elapsed}s elapsed, ~${remaining}s remaining (${rate.toFixed(1)} jobs/sec)`);
          logger.info(``);
        }

      } catch (error) {
        errorCount++;
        logger.error(`  ❌ Failed to process Job #${jobNumber}: ${error.message}`);
        if (process.env.DEBUG) {
          console.error('Stack trace:', error.stack);
        }
        categorizedJobs.push({
          jobNumber,
          category: 'ERROR',
          title: 'N/A',
          client: 'N/A',
          ppWorkers: [],
          error: error.message
        });
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    logger.info('');
    logger.info(`✅ Processing complete: ${successCount} success, ${errorCount} errors in ${totalTime}s`);
    logger.info('');
    return categorizedJobs;
  }

  /**
   * Sort jobs by category: PP, PP-mix, Hybrid, Standard, ERROR, NOT FOUND
   * @param {Array} jobs - Array of categorized job objects
   * @returns {Array} Sorted array
   */
  sortJobsByCategory(jobs) {
    const categoryOrder = {
      'PP': 1,
      'PP-mix': 2,
      'Hybrid': 3,
      'KC': 4,
      'ERROR': 5,
      'NOT FOUND': 6
    };

    return jobs.sort((a, b) => {
      const orderA = categoryOrder[a.category] || 99;
      const orderB = categoryOrder[b.category] || 99;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same category, sort by job number
      return a.jobNumber - b.jobNumber;
    });
  }

  /**
   * Write output CSV files (3 separate files by category)
   * Uses 'job number' header (lowercase) to match input CSV format for seamless re-processing
   * @param {Object} outputFiles - Object with pp, ppMix, hybrid file paths
   * @param {Array} jobs - Sorted job array
   * @returns {Object} Count of jobs saved per file
   */
  async writeOutputCSVs(outputFiles, jobs) {
    try {
      // Group jobs by category
      const ppJobs = jobs.filter(j => j.category === 'PP');
      const ppMixJobs = jobs.filter(j => j.category === 'PP-mix');
      const hybridJobs = jobs.filter(j => j.category === 'Hybrid');

      const counts = { pp: 0, ppMix: 0, hybrid: 0 };

      // Use lowercase 'job number' header to match input CSV format
      // This allows seamless re-processing without header matching logic
      const csvHeader = 'job number';

      // Write PP file
      if (ppJobs.length > 0) {
        const content = csvHeader + '\n' + ppJobs.map(j => j.jobNumber).join('\n');
        fs.writeFileSync(outputFiles.pp, content, 'utf-8');
        counts.pp = ppJobs.length;
      }

      // Write PP-mix file
      if (ppMixJobs.length > 0) {
        const content = csvHeader + '\n' + ppMixJobs.map(j => j.jobNumber).join('\n');
        fs.writeFileSync(outputFiles.ppMix, content, 'utf-8');
        counts.ppMix = ppMixJobs.length;
      }

      // Write Hybrid file
      if (hybridJobs.length > 0) {
        const content = csvHeader + '\n' + hybridJobs.map(j => j.jobNumber).join('\n');
        fs.writeFileSync(outputFiles.hybrid, content, 'utf-8');
        counts.hybrid = hybridJobs.length;
      }

      return counts;
      
    } catch (error) {
      logger.error(`Failed to write output CSV files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Display summary of categorization
   * @param {Array} jobs - Categorized jobs array
   */
  displaySummary(jobs) {
    const summary = {
      'PP': [],
      'PP-mix': [],
      'Hybrid': [],
      'KC': [],
      'ERROR': [],
      'NOT FOUND': []
    };

    jobs.forEach(job => {
      if (summary[job.category]) {
        summary[job.category].push(job.jobNumber);
      }
    });

    logger.info('');
    logger.info('📊 Categorization Summary:');
    logger.info('');
    
    Object.entries(summary).forEach(([category, jobNums]) => {
      if (jobNums.length > 0) {
        logger.info(`${category}: ${jobNums.length} jobs`);
        logger.info(`  Jobs: ${jobNums.join(', ')}`);
      }
    });
    
    logger.info('');
    logger.info('Legend:');
    logger.info('  PP       = Preferred Partner (single subcontractor)');
    logger.info('  PP-mix   = Multiple Preferred Partners');
    logger.info('  Hybrid   = KC + Preferred Partner labor');
    logger.info('  Standard = KC labor only');
    logger.info('');
  }

  static get commandName() {
    return 'sort-jobs';
  }

  static get description() {
    return 'Sort jobs from CSV into 3 files: PP (Preferred Partner), PP-mix, and Hybrid';
  }
}

export default SortJobsCommand;

