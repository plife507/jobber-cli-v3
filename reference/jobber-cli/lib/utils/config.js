/**
 * Purpose: Configuration Management - loads and manages configuration from environment variables
 * Inputs: .env file from project root, environment variables
 * Outputs: Config object with API settings, token validation, token expiration checks
 * Dependencies: dotenv, token-utils, logger
 */
/**
 * Configuration Management
 * Loads and manages configuration from environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { isTokenExpired, expiresSoon, formatTokenExpiration } from './token-utils.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths
// Prefer local jobber-cli/.env for portable execution; fall back to legacy parent .env
const jobberCliRoot = join(__dirname, '..', '..'); // jobber-cli directory
const legacyRoot = join(jobberCliRoot, '..'); // parent of jobber-cli
const localEnvPath = join(jobberCliRoot, '.env');
const legacyEnvPath = join(legacyRoot, '.env');
const envFilePath = process.env.JOBBER_ENV_PATH ||
  (existsSync(localEnvPath) ? localEnvPath : legacyEnvPath);

// Helper to reload .env file
function reloadEnv() {
  const result = dotenv.config({ path: envFilePath, override: true });
  return !result.error;
}

// Initial load
dotenv.config({ path: envFilePath });

export const Config = {
  // API Configuration
  API_URL: process.env.JOBBER_API_URL || 'https://api.getjobber.com/api/graphql',
  API_VERSION: process.env.JOBBER_API_VERSION || '2025-04-16',
  ENV_FILE: envFilePath,
  
  // ACCESS_TOKEN property - can be set directly or will read from process.env
  get ACCESS_TOKEN() {
    return process.env.JOBBER_ACCESS_TOKEN;
  },
  
  set ACCESS_TOKEN(value) {
    process.env.JOBBER_ACCESS_TOKEN = value;
  },
  
  // Helper to reload configuration from .env file
  reload() {
    reloadEnv();
    // Update process.env with reloaded values
    // (dotenv.config already does this, but we ensure it)
  },

  // Schema Configuration
  SCHEMA_CACHE_DIR: join(jobberCliRoot, '.cache'),
  SCHEMA_FILE: join(jobberCliRoot, '.cache', 'jobber_schema.graphql'),
  SCHEMA_ANALYSIS_JSON: join(jobberCliRoot, '.cache', 'schema_analysis.json'),
  SCHEMA_ANALYSIS_MD: join(jobberCliRoot, '.cache', 'schema_analysis.md'),

  // Rate Limiting
  DEFAULT_RESTORE_RATE: 500, // units per second
  DEFAULT_MAX_AVAILABLE: 10000,

  // Query Estimation
  INTROSPECTION_COST: 45000,
  
  validate() {
    // Always reload .env file to ensure we have the latest token
    // This is critical after token updates
    const reloadSuccess = this.reload();
    
    // Get the token value after reload
    const token = this.ACCESS_TOKEN;
    
    if (!token || 
        token === 'your_access_token_here' ||
        token.trim() === '') {
      throw new Error('JOBBER_ACCESS_TOKEN is required in .env file');
    }

    // Check token expiration
    try {
      if (isTokenExpired(token)) {
        throw new Error('Access token expired');
      }
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('missing')) {
        throw new Error(`Invalid access token: ${error.message}`);
      }
      throw error;
    }

    // Warn only when refresh is imminent (<10 min). Jobber tokens last 1h,
    // and OAuth auto-refresh handles expiry, so earlier warnings are noise.
    if (expiresSoon(token, 10 / 60)) {
      logger.warn('⚠️  Access token expires soon!');
      logger.warn(`   ${formatTokenExpiration(token)}`);
      logger.warn('   Consider running: jobber token oauth-refresh');
    }

    return true;
  }
};

export default Config;
