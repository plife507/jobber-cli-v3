/**
 * Purpose: Base Command Class - provides common functionality for all CLI commands including rate limiting and error handling
 * Inputs: Command arguments, configuration from .env
 * Outputs: Initialized command instances with JobberClient, ThrottleManager, SchemaManager
 * Dependencies: JobberClient, ThrottleManager, SchemaManager, ErrorHandler, QueryExecutor, Config, logger
 */

import { JobberClient } from '../lib/core/jobber-client.js';
import { ThrottleManager } from '../lib/core/throttle-manager.js';
import SchemaManager from '../lib/schema/schema-manager.js';
import ErrorHandler from '../lib/error/error-handler.js';
import QueryExecutor from '../lib/query/query-executor.js';
import Config from '../lib/utils/config.js';
import logger from '../lib/utils/logger.js';
import { arcadeTable, cleanSection, cleanRow, cleanCurrency, colorize, boldColor, colors, getTerminalWidth as getTermWidth, calculateCleanWidth } from '../lib/utils/theme.js';
import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { updateEnvFile } from '../lib/utils/env-writer.js';
import { isTokenExpired, decodeToken, formatTokenExpiration, getTimeUntilExpiration } from '../lib/utils/token-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jobberCliRoot = join(__dirname, '..'); // jobber-cli directory
const projectRoot = join(jobberCliRoot, '..'); // KC directory (parent of jobber-cli)
const envPath = Config.ENV_FILE;

/** Convert WSL path to Windows path when invoking Windows .exe from WSL */
function wslToWinPath(p) {
  if (process.platform !== 'linux' || typeof p !== 'string') return p;
  if (!p.startsWith('/mnt/') || p.length < 6) return p;
  const drive = p[5].toUpperCase();
  const rest = p.slice(6).replace(/\//g, '\\');
  return `${drive}:${rest ? '\\' + rest : ''}`;
}

export class BaseCommand {
  constructor() {
    this.client = null;
    this.throttleManager = null;
    this.schemaManager = null;
    this.errorHandler = null;
    this.queryExecutor = null;
    this._initialized = false;
  }

  /**
   * Initialize command with client and dependencies
   */
  async initialize() {
    if (this._initialized) return;

    Config.reload();
    const rawToken = Config.ACCESS_TOKEN;
    const tokenPlaceholder =
      !rawToken || rawToken === 'your_access_token_here' || rawToken.trim() === '';
    if (tokenPlaceholder) {
      const oauthOk = await this.tryOAuthRefresh();
      if (oauthOk) {
        Config.reload();
        logger.success('Loaded access token via OAuth');
      }
    }

    try {
      Config.validate();
    } catch (error) {
      // If token is expired, try OAuth refresh first, then prompt if needed
      if (error.message.includes('Access token expired') || error.message.includes('expired')) {
        logger.info('Token expired. Attempting automatic refresh via OAuth...');

        // Try OAuth automatic refresh first
        let configValid = false;
        const oauthRefreshed = await this.tryOAuthRefresh();
        if (oauthRefreshed) {
          Config.reload();
          try {
            Config.validate();
            configValid = true;
            logger.success('✅ Token automatically refreshed via OAuth!');
            logger.info('');
          } catch (retryError) {
            logger.warn('OAuth refresh succeeded but token still invalid. Prompting for manual update...');
          }
        }

        // If OAuth didn't resolve it, prompt for manual token
        if (!configValid) {
          if (this.isNonInteractive() || !process.stdin.isTTY) {
            throw new Error('Token expired and CLI is running in non-interactive mode. Refresh token via OAuth or run "jobber token update <token>" first.');
          }

          logger.error('❌ Access token has expired!');
          logger.info('');
          logger.info('Please enter your new Jobber access token.');
          logger.info('💡 Tip: Set up OAuth for automatic token refresh: jobber token oauth-authorize');
          logger.info('');

          const tokenInput = await this.promptToken('Token: ');
          if (!tokenInput || tokenInput.trim() === '') {
            throw new Error('No token provided. Command cancelled.');
          }

          await this.updateToken(tokenInput.trim());
          Config.reload();
          Config.validate();
        }
      } else if (
        error.message.includes('JOBBER_ACCESS_TOKEN is required') ||
        error.message.includes('required in .env file')
      ) {
        throw new Error(
          'No Jobber access token configured. Run: jobber token oauth-authorize\n' +
          'Or set JOBBER_ACCESS_TOKEN in your .env, or: jobber token update <jwt>'
        );
      } else {
        throw new Error(`Configuration error: ${error.message}`);
      }
    }

    this._initDependencies();
  }

  /** Initialize client and supporting services */
  _initDependencies() {
    this.throttleManager = new ThrottleManager();
    this.client = new JobberClient(
      Config.API_URL,
      Config.ACCESS_TOKEN,
      Config.API_VERSION,
      this.throttleManager
    );
    this.schemaManager = new SchemaManager(this.client);
    this.errorHandler = new ErrorHandler(this.schemaManager);
    this.queryExecutor = new QueryExecutor(this.client, this.errorHandler);
    this._initialized = true;
  }

  /**
   * Try to refresh token using OAuth
   * @returns {Promise<boolean>} True if OAuth refresh succeeded
   */
  async tryOAuthRefresh() {
    try {
      const { execFileSync } = await import('child_process');
      const { existsSync } = await import('fs');
      
      // projectRoot is already defined at the top of this file
      const oauthManager = join(projectRoot, 'jobber_oauth_manager.py');
      
      // Check if OAuth manager exists
      if (!existsSync(oauthManager)) {
        if (process.env.DEBUG) {
          logger.debug('OAuth manager not found at:', oauthManager);
        }
        return false;
      }
      
      // Try to find Python executable (Linux venv, then Windows venv for WSL/mounted drive, then system)
      const venvLinux = join(projectRoot, '.venv', 'bin', 'python');
      const venvWin = join(projectRoot, '.venv', 'Scripts', 'python.exe');
      const venvPython = existsSync(venvLinux) ? venvLinux : (existsSync(venvWin) ? venvWin : null);
      const usingWinVenv = venvPython === venvWin;
      const pythonBin = venvPython || (process.platform === 'win32' ? 'python' : 'python3');
      const oauthScript = usingWinVenv ? wslToWinPath(oauthManager) : oauthManager;
      // Windows Python from WSL can read Linux paths; use Windows path only for script so it can open the file
      const oauthEnvPath = envPath;

      // Try to get/refresh OAuth token
      let oauthToken;
      let errorOutput = '';

      try {
        const execEnv = {
          ...process.env,
          JOBBER_ENV_PATH: oauthEnvPath,
          JOBBER_OAUTH_SKIP_AUTHORIZE: '1'
        };
        const result = execFileSync(pythonBin, [oauthScript, 'get-token'], {
          encoding: 'utf-8',
          cwd: projectRoot,
          timeout: 15000,
          env: execEnv
        });
        oauthToken = result.trim();
      } catch (execError) {
        // Capture stderr and stdout for better error messages
        if (execError.stderr) {
          errorOutput = execError.stderr.toString();
        }
        if (execError.stdout) {
          const stdout = execError.stdout.toString();
          if (stdout && !errorOutput) {
            errorOutput = stdout;
          }
        }
        throw execError;
      }
      
      // Check if we got a valid token (not an error message)
      if (oauthToken && oauthToken.length > 50 && !oauthToken.includes('[ERROR]')) {
        updateEnvFile(envPath, { JOBBER_ACCESS_TOKEN: oauthToken });
        return true;
      } else if (errorOutput.includes('Refresh token expired') || errorOutput.includes('re-authorize')) {
        // Refresh token expired - need to re-authorize
        logger.warn('⚠️  OAuth refresh token has expired. Re-authorization required.');
        logger.info('   Run: jobber token oauth-authorize');
        return false;
      }
    } catch (error) {
      // Check if it's a refresh token expiration error
      const errorMsg = error.message || error.toString() || '';
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      
      if (errorMsg.includes('Refresh token expired') || 
          errorMsg.includes('re-authorize') ||
          stderr.includes('Refresh token expired') ||
          stderr.includes('re-authorize')) {
        logger.warn('⚠️  OAuth refresh token has expired. Re-authorization required.');
        logger.info('   Run: jobber token oauth-authorize');
        return false;
      }
      
      // Only show error message in DEBUG mode to avoid noise
      if (process.env.DEBUG) {
        if (stderr) {
          logger.debug(`OAuth refresh failed: ${stderr.trim() || errorMsg.split('\n')[0]}`);
        } else {
          logger.debug(`OAuth refresh failed: ${errorMsg.split('\n')[0]}`);
        }
        
        // Check for common issues
        if (stderr.includes('No module named') || stderr.includes('ModuleNotFoundError')) {
          logger.debug('Missing Python dependencies');
        } else if (stderr.includes('FileNotFoundError') || stderr.includes('No such file')) {
          logger.debug('OAuth tokens file not found');
        }
      }
      
      // OAuth not available or other error - will prompt for manual token
    }
    return false;
  }

  /**
   * Handle token expiration during long-running operations
   * Tries OAuth refresh first, then prompts for new token if needed
   * @returns {Promise<boolean>} True if token was successfully updated
   */
  async handleTokenExpiration() {
    // Try OAuth refresh first
    const oauthRefreshed = await this.tryOAuthRefresh();
    if (oauthRefreshed) {
      logger.success('✅ Token automatically refreshed via OAuth');
      // Reload config to get the new token
      Config.reload();
      // Update the client with the new token
      if (this.client) {
        this.client.updateToken(Config.ACCESS_TOKEN);
      }
      return true;
    }

    if (this.isNonInteractive()) {
      logger.error('Token expired during operation and non-interactive mode is enabled.');
      logger.error('Update token first using: jobber token update <token>');
      return false;
    }

    // OAuth not available, prompt for manual token
    logger.error('❌ Access token has expired during operation!');
    logger.info('');
    logger.info('Please enter your new Jobber access token to continue.');
    logger.info('You can paste the full Authorization header value (with "Bearer ")');
    logger.info('or just the token itself.');
    logger.info('');
    logger.warn('⚠️  Note: Operation will resume from where it left off after token update.');
    logger.info('💡 Tip: Set up OAuth for automatic token refresh: jobber token oauth-authorize');
    logger.info('');
    
    // Prompt for token
    const tokenInput = await this.promptToken('Token: ');
    
    if (!tokenInput || tokenInput.trim() === '') {
      logger.error('No token provided. Operation cannot continue.');
      return false;
    }
    
    try {
      // Process the token update
      await this.updateToken(tokenInput.trim());
      
      // Reload config to get new token
      Config.reload();
      Config.validate();
      
      // Update the client with the new token
      if (this.client) {
        this.client.updateToken(Config.ACCESS_TOKEN);
      }
      
      logger.success('✅ Token updated successfully! Operation will continue...');
      logger.info('');
      return true;
    } catch (error) {
      logger.error(`Failed to update token: ${error.message}`);
      return false;
    }
  }

  /**
   * Check throttle budget before operation and wait if needed
   * @param {number} estimatedCost - Estimated throttle cost
   * @param {Object} options - Options for waiting behavior
   * @param {boolean} options.silent - If true, don't show progress (default: false)
   * @returns {Promise<boolean>} True if enough budget available (after waiting if needed)
   */
  async checkThrottle(estimatedCost, options = {}) {
    await this.initialize();
    
    // Wait if needed (this handles both checking and waiting)
    await this.throttleManager.waitIfNeeded(estimatedCost, options);
    
    // Return true if we now have enough budget (after waiting)
    return this.throttleManager.hasEnoughBudget(estimatedCost);
  }

  /**
   * Execute command with error handling
   * CRITICAL FIX #1: Added finally block to ensure cleanup
   * @param {Function} fn - Command function to execute
   * @param {Object} args - Command arguments
   * @returns {Promise<any>} Command result
   */
  async execute(fn, args = {}) {
    await this.initialize();

    try {
      return await fn.call(this, args);
    } catch (error) {
      // Handle errors with error handler
      const errorResult = await this.errorHandler.handleError(error);
      const formatted = this.errorHandler.formatError(errorResult);
      
      logger.error(formatted);
      throw error;
    } finally {
      // CRITICAL FIX #1: Always cleanup resources
      if (this.client) {
        this.client.cleanup();
      }
    }
  }

  /**
   * Resolve a job argument that may be an encoded ID or a human-readable job number.
   * @param {string|number} jobArg - Encoded job ID (starts with Z2lkOi8v) or job number
   * @returns {Promise<string>} Encoded job ID
   * @throws {Error} If jobArg is falsy or no matching job is found
   */
  async resolveJobId(jobArg) {
    if (!jobArg) {
      throw new Error('Job number or encoded job id is required');
    }
    if (String(jobArg).startsWith('Z2lkOi8v')) {
      return jobArg;
    }
    const jobId = await this.findJobIdByNumber(jobArg);
    if (!jobId) {
      throw new Error(`No job found for: ${jobArg}`);
    }
    return jobId;
  }

  /**
   * Find job ID by job number using search API
   * @param {string|number} jobNumber - Job number to look up
   * @returns {Promise<string|null>} Encoded job ID or null if not found
   */
  async findJobIdByNumber(jobNumber) {
    const query = `
      query SearchJob($searchTerm: String, $first: Int) {
        jobs(searchTerm: $searchTerm, first: $first) {
          nodes {
            id
            jobNumber
          }
        }
      }
    `;

    const result = await this.queryExecutor.execute(
      query,
      { searchTerm: String(jobNumber), first: 5 },
      { estimatedCost: 12 }
    );

    if (!result.success || !result.data?.jobs?.nodes) {
      return null;
    }

    const match = result.data.jobs.nodes.find(job => String(job.jobNumber) === String(jobNumber));
    return match ? match.id : null;
  }

  /**
   * Format output as JSON
   * @param {any} data - Data to format
   * @returns {string} JSON string
   */
  formatJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Determine if interactive prompts are disabled
   * @returns {boolean}
   */
  isNonInteractive() {
    return process.env.JOBBER_NON_INTERACTIVE === '1';
  }

  /**
   * Get terminal width using centralized function
   * @returns {number} Terminal width in characters
   */
  getTerminalWidth() {
    return getTermWidth();
  }

  /**
   * Format output as clean minimal table
   * @param {Array} rows - Array of row objects
   * @param {Array} columns - Column definitions
   * @returns {string} Formatted table
   */
  formatTable(rows, columns) {
    // Use clean width calculation (max 100 chars)
    const tableWidth = calculateCleanWidth();
    return arcadeTable(rows, columns, tableWidth);
  }

  /**
   * Show throttle status in clean minimal format
   */
  showThrottleStatus() {
    const status = this.throttleManager.getStatus();
    const usage = this.throttleManager.getUsagePercent();
    const contentWidth = calculateCleanWidth();
    
    // Determine usage color
    let usageColor = colors.green;
    if (usage >= 90) {
      usageColor = colors.error;
    } else if (usage >= 70) {
      usageColor = colors.warning;
    }
    
    console.log(cleanSection('⚡', 'THROTTLE STATUS'));
    console.log(cleanRow('', 'Available', boldColor(`${status.currentlyAvailable}/${status.maximumAvailable}`, colors.blue), false, contentWidth));
    console.log(cleanRow('', 'Restore Rate', boldColor(`${status.restoreRate} units/sec`, colors.lightBlue), false, contentWidth));
    console.log(cleanRow('', 'Usage', colorize(`${usage.toFixed(1)}%`, usageColor), false, contentWidth));
    console.log(''); // Blank line after status
  }

  /**
   * Prompt for token input (helper for automatic token update)
   */
  async promptToken(message) {
    if (this.isNonInteractive() || !process.stdin.isTTY) {
      throw new Error('Interactive prompt blocked in non-interactive mode');
    }

    const readline = await import('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY || false
    });

    // On Windows, provide helpful instructions
    if (process.platform === 'win32') {
      logger.info('💡 Tip: Right-click in the terminal to paste (or Ctrl+Shift+V in PowerShell)');
      logger.info('');
    }

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer || '');
      });
    });
  }

  /**
   * Set up cancellation handler for long-running operations
   * Returns an object with cancellation state and helper functions
   * @param {string} operationName - Name of operation for logging (e.g., "Search", "Report Generation")
   * @returns {Object} Cancellation controller with { cancelled, cancelHandler, waitWithCancel, cleanup }
   */
  setupCancellation(operationName = 'Operation') {
    let cancelled = false;
    let cancelRequested = false;
    
    const cancelHandler = () => {
      if (cancelRequested) {
        // Second Ctrl+C - force exit
        logger.error(`\n⚠️  Force exit requested. Exiting immediately...`);
        process.exit(130); // Standard exit code for SIGINT
      }
      
      cancelRequested = true;
      cancelled = true;
      logger.warn(`\n⚠️  ${operationName} cancellation requested...`);
      logger.info('   Press Ctrl+C again to force exit immediately');
      logger.info('   Waiting for current operation to complete...');
    };

    // Register SIGINT handler (Ctrl+C)
    process.on('SIGINT', cancelHandler);

    // Helper function for cancellable delays
    const waitWithCancel = async (ms) => {
      const checkInterval = 100; // Check every 100ms
      const start = Date.now();
      
      while (Date.now() - start < ms) {
        if (cancelled) return;
        const remaining = Math.min(checkInterval, ms - (Date.now() - start));
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      }
    };

    // Cleanup function
    const cleanup = () => {
      process.removeListener('SIGINT', cancelHandler);
    };

    return {
      cancelled: () => cancelled,
      setCancelled: (value) => { cancelled = value; },
      cancelHandler,
      waitWithCancel,
      cleanup
    };
  }

  /**
   * Update token in .env file (helper for automatic token update)
   */
  async updateToken(newToken) {
    // Remove "Bearer " prefix if present
    let cleanToken = newToken.trim();
    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }
    if (cleanToken.startsWith('bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }

    // Validate token length
    if (cleanToken.length < 50 || cleanToken.length > 2000) {
      throw new Error('Invalid token length. JWT tokens are typically 200-800 characters.');
    }

    // Validate token format
    const payload = decodeToken(cleanToken);
    if (!payload) {
      throw new Error('Invalid token format. Make sure you copied the full JWT token');
    }

    // Check if it's already expired
    if (isTokenExpired(cleanToken)) {
      logger.warn('⚠️  Warning: The token you provided is already expired!');
      const proceed = await this.promptToken('Continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        throw new Error('Update cancelled');
      }
    }

    try {
      updateEnvFile(envPath, {
        JOBBER_ACCESS_TOKEN: cleanToken,
        JOBBER_API_VERSION: Config.API_VERSION
      });

      logger.success('✅ Token updated successfully!');
      logger.info(`   Updated: ${envPath}`);
      
      // Show new token status
      logger.info('');
      const timeUntil = getTimeUntilExpiration(cleanToken);
      if (timeUntil && !timeUntil.expired) {
        logger.info(`   ${formatTokenExpiration(cleanToken)}`);
      } else {
        logger.warn(`   Token expires: ${formatTokenExpiration(cleanToken)}`);
      }
    } catch (error) {
      logger.error(`Failed to update token: ${error.message}`);
      throw error;
    }
  }
}
