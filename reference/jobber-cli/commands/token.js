/**
 * Purpose: Token Command - manages and checks access token expiration status
 * Inputs: Command arguments (check, update, refresh), optional token string
 * Outputs: Token status information, updates .env file with new tokens
 * Dependencies: BaseCommand, Config, token-utils, dotenv, fs
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import Config from '../lib/utils/config.js';
import { 
  isTokenExpired, 
  expiresSoon, 
  formatTokenExpiration,
  getTimeUntilExpiration,
  decodeToken
} from '../lib/utils/token-utils.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { updateEnvFile } from '../lib/utils/env-writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// token.js is in commands/, so: commands -> jobber-cli -> KC (project root)
const jobberCliRoot = join(__dirname, '..'); // jobber-cli directory
const projectRoot = join(jobberCliRoot, '..'); // KC directory (parent of jobber-cli)
const envPath = Config.ENV_FILE;

export class TokenCommand extends BaseCommand {
  async run(args) {
    const { action, token } = args;

    if (action === 'update') {
      // Allow token as argument OR prompt for it (more flexible)
      if (token) {
        return this.updateTokenDirect(token);
      } else {
        return this.updateToken();
      }
    } else if (action === 'oauth-authorize') {
      return this.oauthAuthorize();
    } else if (action === 'oauth-refresh') {
      return this.oauthRefresh();
    } else if (action === 'check' || !action) {
      return this.checkToken();
    } else {
      throw new Error(`Unknown action: ${action}. Use 'check', 'update', 'oauth-authorize', or 'oauth-refresh'`);
    }
  }

  /**
   * Start OAuth authorization flow
   */
  async oauthAuthorize() {
    const { execFileSync } = await import('child_process');
    const { existsSync } = await import('fs');

    if (!process.stdin.isTTY) {
      throw new Error('OAuth authorize requires a browser and interactive terminal. Cannot run headless.');
    }

    // projectRoot is already defined at the top of this file
    const oauthManager = join(projectRoot, 'jobber_oauth_manager.py');

    // Detect python executable (venv first, then system)
    const venvLinux = join(projectRoot, '.venv', 'bin', 'python');
    const venvWin = join(projectRoot, '.venv', 'Scripts', 'python.exe');
    const venvPython = existsSync(venvLinux) ? venvLinux : (existsSync(venvWin) ? venvWin : null);
    const pythonBin = venvPython || (process.platform === 'win32' ? 'python' : 'python3');

    logger.info('Starting OAuth authorization flow...');
    try {
      const execEnv = { ...process.env, JOBBER_ENV_PATH: envPath };
      execFileSync(pythonBin, [oauthManager, 'authorize'], {
        stdio: 'inherit',
        cwd: projectRoot,
        env: execEnv
      });
      logger.success('✅ OAuth authorization completed!');
    } catch (error) {
      logger.error(`OAuth authorization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh OAuth token
   */
  async oauthRefresh() {
    const { execFileSync } = await import('child_process');
    const { existsSync } = await import('fs');

    // projectRoot is already defined at the top of this file
    const oauthManager = join(projectRoot, 'jobber_oauth_manager.py');

    // Check if OAuth manager exists
    if (!existsSync(oauthManager)) {
      logger.error('OAuth manager not found. Please set up OAuth first: jobber token oauth-authorize');
      throw new Error('OAuth manager not found');
    }

    // Try Linux venv, then Windows venv (for WSL/mounted drive), then system python
    const venvLinux = join(projectRoot, '.venv', 'bin', 'python');
    const venvWin = join(projectRoot, '.venv', 'Scripts', 'python.exe');
    const venvPython = existsSync(venvLinux) ? venvLinux : (existsSync(venvWin) ? venvWin : null);
    const pythonBin = venvPython || (process.platform === 'win32' ? 'python' : 'python3');

    logger.info('Refreshing OAuth token...');
    logger.info(`Using Python: ${pythonBin}`);

    try {
      const execEnv = {
        ...process.env,
        JOBBER_ENV_PATH: envPath,
        JOBBER_OAUTH_SKIP_AUTHORIZE: '1'
      };
      // Pipe stdio so subprocess output doesn't pollute machine-mode JSON on stdout.
      const output = execFileSync(pythonBin, [oauthManager, 'refresh'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: projectRoot,
        env: execEnv,
        encoding: 'utf-8'
      });
      if (process.env.DEBUG && output) {
        logger.debug(output.trim());
      }
      logger.success('✅ Token refreshed!');
      return { refreshed: true };
    } catch (error) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      const stdout = error.stdout ? error.stdout.toString() : '';
      const detail = (stderr || stdout || error.message).split('\n')[0];
      logger.error(`Token refresh failed: ${detail}`);
      throw new Error(`Token refresh failed: ${detail}`);
    }
  }

  /**
   * Check current token status
   */
  async checkToken() {
    // Try to get OAuth token first if available
    let token = Config.ACCESS_TOKEN;
    
    // Check if OAuth is available and try to get/refresh token
    const { existsSync } = await import('fs');
    
    // projectRoot is already defined at the top of this file
    const oauthManager = join(projectRoot, 'jobber_oauth_manager.py');
    
    // Try to get OAuth token if OAuth manager exists
    if (existsSync(oauthManager)) {
      try {
        const venvLinux = join(projectRoot, '.venv', 'bin', 'python');
        const venvWin = join(projectRoot, '.venv', 'Scripts', 'python.exe');
        const venvPython = existsSync(venvLinux) ? venvLinux : (existsSync(venvWin) ? venvWin : null);
        const pythonBin = venvPython || (process.platform === 'win32' ? 'python' : 'python3');

        const execEnv = {
          ...process.env,
          JOBBER_ENV_PATH: envPath,
          JOBBER_OAUTH_SKIP_AUTHORIZE: '1'
        };
        const { execFileSync } = await import('child_process');
        const oauthToken = execFileSync(pythonBin, [oauthManager, 'get-token'], {
          encoding: 'utf-8',
          cwd: projectRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: execEnv
        }).trim();
        if (oauthToken && oauthToken.length > 50) {
          token = oauthToken;
          logger.info('✅ Using OAuth token (auto-refreshed if needed)');
        }
      } catch (error) {
        // OAuth not available or failed, use manual token
      }
    }

    if (!token || token === 'your_access_token_here') {
      logger.error('No access token configured');
      logger.info('Options:');
      logger.info('  1. Set up OAuth: jobber token oauth-authorize');
      logger.info('  2. Manual token: jobber token update <token>');
      return { present: false, valid: false };
    }

    const payload = decodeToken(token);
    if (!payload) {
      logger.error('Invalid token format');
      return { present: true, validFormat: false, valid: false };
    }

    const expired = isTokenExpired(token);
    const expiresSoonFlag = expiresSoon(token, 2);
    const timeUntil = getTimeUntilExpiration(token);

    logger.info('📋 Token Status');
    logger.info('─'.repeat(60));
    if (payload.sub) logger.info(`User ID: ${payload.sub}`);
    if (payload.account_id) logger.info(`Account ID: ${payload.account_id}`);
    if (payload.client_id) logger.info(`Client ID: ${payload.client_id}`);
    logger.info('');

    if (expired) {
      logger.error('❌ Token is EXPIRED');
      logger.error('   Update immediately to use the CLI');
    } else if (expiresSoonFlag) {
      logger.warn('⚠️  Token expires soon!');
      logger.warn(`   ${formatTokenExpiration(token)}`);
    } else {
      logger.success('✅ Token is valid');
      logger.info(`   ${formatTokenExpiration(token)}`);
    }

    logger.info('');
    logger.info('💡 To update token:');
    logger.info('   1. Get new token from: https://developer.getjobber.com/');
    logger.info('   2. Copy the Authorization header value (with or without "Bearer ")');
    logger.info('   3. Run: jobber token update');
    logger.info('   4. Paste the token when prompted');

    return {
      present: true,
      validFormat: true,
      valid: !expired,
      expired,
      expiresSoon: expiresSoonFlag,
      expiresIn: timeUntil && !timeUntil.expired
        ? `${timeUntil.hours}h ${timeUntil.minutes}m`
        : null,
      userId: payload.sub || null,
      accountId: payload.account_id || null,
      clientId: payload.client_id || null
    };
  }

  /**
   * Update token directly from argument (for easier pasting)
   * @param {string} tokenInput - Token from command line
   */
  async updateTokenDirect(tokenInput) {
    if (!tokenInput || tokenInput.trim() === '') {
      logger.error('No token provided. Update cancelled.');
      return;
    }
    
    return this.processTokenUpdate(tokenInput.trim());
  }

  /**
   * Update token in .env file
   * Automatically handles "Bearer " prefix if present
   * Prompts for token if not provided as argument
   */
  async updateToken() {
    if (this.isNonInteractive()) {
      throw new Error('Token update requires input, but CLI is running in non-interactive mode. Use: jobber token update <token>');
    }

    logger.info('Please enter your new Jobber access token.');
    logger.info('You can paste the full Authorization header value (with "Bearer ")');
    logger.info('or just the token itself.');
    logger.info('');
    logger.info('💡 Tip: You can also paste the token directly: jobber token update <token>');
    logger.info('');
    
    const tokenInput = await this.prompt('Token: ');
    
    if (!tokenInput || tokenInput.trim() === '') {
      logger.error('No token provided. Update cancelled.');
      return;
    }
    
    return this.processTokenUpdate(tokenInput.trim());
  }

  /**
   * Process token update (shared logic)
   * @param {string} newToken - New token to set
   */
  async processTokenUpdate(newToken) {

    // Remove "Bearer " prefix if present (allows pasting full Authorization header)
    let cleanToken = newToken.trim();
    if (cleanToken.startsWith('Bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }
    if (cleanToken.startsWith('bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
    }

    // Validate token length (JWTs are typically 200-800 characters)
    if (cleanToken.length < 50 || cleanToken.length > 2000) {
      logger.error('Invalid token length. JWT tokens are typically 200-800 characters.');
      logger.info(`Received token length: ${cleanToken.length}`);
      return;
    }

    // Validate token format
    const payload = decodeToken(cleanToken);
    if (!payload) {
      logger.error('Invalid token format');
      logger.info('Make sure you copied the full JWT token');
      return;
    }

    // Check if it's already expired
    if (isTokenExpired(cleanToken)) {
      logger.warn('⚠️  Warning: The token you provided is already expired!');
      if (this.isNonInteractive()) {
        throw new Error('Expired token rejected in non-interactive mode');
      }
      const proceed = await this.prompt('Continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        logger.info('Update cancelled');
        return;
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

  /**
   * Simple prompt helper with better paste support
   * Improved for Windows PowerShell pasting
   */
  async prompt(message) {
    if (this.isNonInteractive() || !process.stdin.isTTY) {
      throw new Error('Interactive prompt blocked in non-interactive mode');
    }

    const readline = await import('readline');

    // Create readline interface with configuration optimized for pasting
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: process.stdin.isTTY || false
    });

    // On Windows, provide helpful instructions
    if (process.platform === 'win32') {
      logger.info('💡 Tip: Right-click in the terminal to paste (or Ctrl+Shift+V in PowerShell)');
      logger.info('   Or paste directly: jobber token update <your-token-here>');
      logger.info('');
    }

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer || '');
      });
    });
  }
}

export default TokenCommand;
