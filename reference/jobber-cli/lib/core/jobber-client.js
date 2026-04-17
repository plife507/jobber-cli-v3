/**
 * Purpose: Jobber API Client with Automatic Throttle Management - handles GraphQL query execution with integrated rate limiting
 * Inputs: GraphQL query strings, variables, access token, API endpoint
 * Outputs: JSON responses from Jobber GraphQL API, handles rate limiting automatically
 * Dependencies: node-fetch, ThrottleManager, logger, Config
 */

import fetch from 'node-fetch';
import http from 'http';
import https from 'https';
import { ThrottleManager } from './throttle-manager.js';
import costReference from './cost-reference.js';
import logger from '../utils/logger.js';
import Config from '../utils/config.js';

export class JobberClient {
  constructor(endpoint, token, version, throttleManager = null) {
    this.endpoint = endpoint;
    this.token = token;
    this.version = version;
    this.throttleManager = throttleManager || new ThrottleManager();
    
    // HTTP keep-alive agents for connection reuse (critical for long-running batch operations)
    this._httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000
    });
    this._httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 60000
    });
    
    // Rate limiting: Track last request time to enforce minimum delay between requests
    this._lastRequestTime = 0;
    this.MIN_REQUEST_DELAY = 200; // Minimum 200ms between requests (matches MCP server)
    this._rateLimitDelay = this.MIN_REQUEST_DELAY; // Dynamic delay that increases after throttle errors
    
    // Request timeout (increased for complex queries in long-running operations)
    this.REQUEST_TIMEOUT = 60000; // 60 seconds (was 30)
    
    // Store listener reference for cleanup
    this._statusListener = (status) => {
      logger.debug(`Throttle status: ${status.currentlyAvailable}/${status.maximumAvailable}`);
    };
    
    // Set up throttle manager event listeners
    this.throttleManager.on('statusUpdated', this._statusListener);
    
    // Register cleanup handler for process exit
    // Only cleanup on 'exit' — let caller's SIGINT/SIGTERM handlers decide exit behavior
    this._cleaned = false;
    this._processCleanupHandler = () => {
      if (!this._cleaned) {
        this._cleaned = true;
        this.cleanup();
      }
    };
    process.once('exit', this._processCleanupHandler);
  }

  /**
   * Update the access token (for token refresh during long operations)
   * @param {string} newToken - New JWT token
   */
  updateToken(newToken) {
    this.token = newToken;
  }

  /**
   * Cleanup event listeners to prevent memory leaks
   * CRITICAL FIX #1: Enhanced cleanup with process handler removal
   */
  cleanup() {
    // Flush cost reference data
    costReference.flush();

    // Remove throttle manager event listener
    if (this.throttleManager && this._statusListener) {
      this.throttleManager.removeListener('statusUpdated', this._statusListener);
      this._statusListener = null;
    }
    
    // Remove process exit handler
    if (this._processCleanupHandler) {
      process.removeListener('exit', this._processCleanupHandler);
      this._processCleanupHandler = null;
    }
    
    // Destroy HTTP agents to close connections
    if (this._httpAgent) {
      this._httpAgent.destroy();
      this._httpAgent = null;
    }
    if (this._httpsAgent) {
      this._httpsAgent.destroy();
      this._httpsAgent = null;
    }
  }

  /**
   * Estimate query cost based on query complexity
   * @param {string} query - GraphQL query string
   * @returns {number} Estimated throttle units needed
   */
  estimateQueryCost(query) {
    // Full schema introspection is expensive (~45k units)
    if (query.includes('__schema')) {
      return Config.INTROSPECTION_COST;
    }
    // Single __type queries: 1-400 units depending on type size
    if (query.includes('__type') && !query.includes('__typename')) {
      return 200;
    }

    // Check cost reference for real historical data
    const knownCost = costReference.estimate(query);
    if (knownCost !== null) {
      return knownCost;
    }

    // Fallback: heuristic based on query structure
    let depth = 0;
    let maxDepth = 0;
    for (const char of query) {
      if (char === '{') {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (char === '}') {
        depth--;
      }
    }

    const fieldCount = (query.match(/\w+\s*:/g) || []).length;
    const baseCost = 10;
    const depthMultiplier = maxDepth * 10;
    const fieldMultiplier = fieldCount * 2;

    return Math.min(baseCost + depthMultiplier + fieldMultiplier, 2000);
  }

  /**
   * Execute GraphQL query with throttle management
   * @param {string} query - GraphQL query string
   * @param {Object} variables - Query variables (optional)
   * @param {number} estimatedCost - Estimated throttle cost (optional, will estimate if not provided)
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} GraphQL response with throttle metadata
   */
  async executeQuery(query, variables = null, estimatedCost = null, options = {}) {
    // Estimate cost if not provided
    if (estimatedCost === null) {
      estimatedCost = this.estimateQueryCost(query);
    }

    // Wait if needed (unless silent mode)
    await this.throttleManager.waitIfNeeded(estimatedCost, { silent: options.silent });

    // Enforce minimum delay between requests to respect rate limits
    const now = Date.now();
    const timeSinceLastRequest = now - this._lastRequestTime;
    if (timeSinceLastRequest < this._rateLimitDelay) {
      const waitNeeded = this._rateLimitDelay - timeSinceLastRequest;
      if (!options.silent && waitNeeded > 50) { // Only log if > 50ms
        logger.debug(`Rate limit: Waiting ${waitNeeded}ms before request...`);
      }
      await new Promise(resolve => setTimeout(resolve, waitNeeded));
    }
    this._lastRequestTime = Date.now();

    try {
      // Use AbortController for timeout (configurable, default 60s for long operations)
      const timeout = options.timeout || this.REQUEST_TIMEOUT;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Determine which agent to use based on endpoint protocol
      const url = new URL(this.endpoint);
      const agent = url.protocol === 'https:' ? this._httpsAgent : this._httpAgent;

      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            'X-JOBBER-GRAPHQL-VERSION': this.version,
            'Connection': 'keep-alive'
          },
          body: JSON.stringify({
            query,
            variables: variables || {}
          }),
          agent: agent,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorText = await response.text();
          
          // Check if it's an authentication error (401)
          if (response.status === 401) {
            const authError = new Error(`HTTP ${response.status}: Authentication failed - token may be expired`);
            authError.isAuthError = true;
            authError.statusCode = 401;
            throw authError;
          }
          
          // Sanitize error messages in production: only redact JWT-shaped tokens
          // and filesystem-looking absolute paths (≥2 segments). The previous
          // blanket 20+ alphanumeric redaction also removed GraphQL type names
          // and enum values, making errors unreadable.
          if (!process.env.DEBUG) {
            errorText = errorText.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '[TOKEN]');
            errorText = errorText.replace(
              /(^|[\s"'(])(\/(?:[A-Za-z0-9._-]+\/){1,}[A-Za-z0-9._-]+)/g,
              '$1[path]'
            );
          }
          
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

      const result = await response.json();

      // Update throttle status from response
      // CRITICAL FIX #2: updateStatus now returns a Promise (for queue), must await it
      const throttleStatus = await this.throttleManager.updateStatus(result);

      // Record actual cost from API response (Jobber returns exact cost)
      const actualCost = result.extensions?.cost?.actualQueryCost;
      if (actualCost > 0) {
        costReference.record(query, actualCost);
      }

      if (throttleStatus && !options.silent) {
        logger.info(`Throttle: ${throttleStatus.currentlyAvailable}/${throttleStatus.maximumAvailable} available`);
      }

      // Check for GraphQL errors
      if (result.errors) {
        // Check if it's an authentication error
        const authError = result.errors.find(err => 
          err.message?.toLowerCase().includes('unauthenticated') ||
          err.message?.toLowerCase().includes('unauthorized') ||
          err.message?.toLowerCase().includes('token expired') ||
          err.message?.toLowerCase().includes('authentication')
        );
        
        if (authError) {
          const error = new Error(`Authentication failed: ${authError.message}`);
          error.isAuthError = true;
          error.graphqlError = authError;
          throw error;
        }
        
        // Check if it's a throttle error
        const throttleError = result.errors.find(err => 
          err.message?.toLowerCase().includes('throttle') ||
          err.message?.toLowerCase().includes('rate limit')
        );

        if (throttleError) {
          const currentStatus = this.throttleManager.getStatus();
          const updatedStatus = await this.throttleManager.updateStatus(result);
          const statusToUse = updatedStatus || currentStatus;

          // Prefer the API's actual cost over our estimate when deciding what to do
          const requestedCost = result.extensions?.cost?.requestedQueryCost;
          const realCost = Number.isFinite(requestedCost) ? requestedCost : estimatedCost;

          // If the query costs more than the maximum budget, it can NEVER succeed.
          // Fail fast with a clear error instead of retrying forever.
          if (realCost > statusToUse.maximumAvailable) {
            const err = new Error(
              `Query cost (${realCost}) exceeds maximum throttle budget (${statusToUse.maximumAvailable}). ` +
              `Reduce query complexity (e.g. lower "first" values or request fewer nested fields).`
            );
            err.isThrottleExceedsMax = true;
            err.requestedCost = realCost;
            err.maxBudget = statusToUse.maximumAvailable;
            throw err;
          }

          let waitTime = this.throttleManager.calculateWaitTime(realCost);

          // API said throttled but our budget math says 0 wait → this is rate-based
          // (request frequency), not budget-based. Apply a short backoff.
          if (waitTime === 0) {
            waitTime = 5;
            this._rateLimitDelay = Math.min(this._rateLimitDelay * 2, 2000);
            if (!options.silent) {
              logger.warn(`   Rate limit detected. Increasing request delay to ${this._rateLimitDelay}ms`);
            }
          }

          logger.error(`Throttled! Need to wait ${waitTime} seconds`);
          logger.error(`   Current budget: ${statusToUse.currentlyAvailable}/${statusToUse.maximumAvailable}`);
          logger.error(`   Requested cost: ${realCost}${realCost !== estimatedCost ? ` (estimated ${estimatedCost})` : ''}`);
          
          // Auto-retry after waiting (unless disabled)
          const retryCount = options.retryCount || 0;
          if (!options.noRetry && retryCount < 2 && waitTime > 0 && waitTime < 300) { // Don't auto-retry if > 5 minutes
            // Apply exponential backoff if this is a retry (retryCount exists)
            const backoffMultiplier = Math.min(1 + (retryCount * 0.5), 3); // Max 3x multiplier
            const actualWaitTime = Math.ceil(waitTime * backoffMultiplier);
            
            logger.info(`   Auto-retrying in ${actualWaitTime} seconds...`);
            
            // When API returns throttle error, we MUST wait the calculated time
            // Don't use waitIfNeeded() here because it checks budget (which may be full),
            // but API throttle might be rate-based, not budget-based
            if (!options.silent) {
              logger.info(`⏳ Waiting ${actualWaitTime} seconds for rate limit to reset...`);
            }
            
            // Wait with progress updates
            await ThrottleManager.waitWithProgress(actualWaitTime, options);
            
            // Reset rate limit delay gradually (keep higher than initial to prevent re-throttling)
            this._rateLimitDelay = Math.max(this.MIN_REQUEST_DELAY, this._rateLimitDelay * 0.8);
            
            // Add extra delay before retry to ensure rate limit has fully reset
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return this.executeQuery(query, variables, estimatedCost, { 
              ...options, 
              noRetry: retryCount >= 2, // Stop after 3 attempts total (initial + 2 retries)
              retryCount: retryCount + 1
            });
          }
        }

        // Return error result (let caller handle it)
        return {
          ...result,
          throttleStatus: this.throttleManager.getStatus(),
          hasErrors: true
        };
      }

      // Note: Minimum delay between requests is now enforced BEFORE the request
      // (see line 120-130) to prevent rate limiting

      return {
        ...result,
        throttleStatus: this.throttleManager.getStatus(),
        hasErrors: false
      };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout / 1000} seconds`);
        }
        throw fetchError;
      }

    } catch (error) {
      // If it's a network error, check if it might be throttling
      if (!options.noRetry && (error.message.includes('429') || error.message.includes('Too Many Requests'))) {
        const waitTime = this.throttleManager.calculateWaitTime(estimatedCost);
        logger.error(`Rate limited (429). Waiting ${waitTime} seconds...`);
        await this.throttleManager.waitIfNeeded(estimatedCost, { silent: options.silent });
        // Retry once
        return this.executeQuery(query, variables, estimatedCost, { ...options, noRetry: true });
      }
      throw error;
    }
  }

  /**
   * Get current throttle status
   * @returns {Object} Current throttle status
   */
  getThrottleStatus() {
    return this.throttleManager.getStatus();
  }

  /**
   * Get throttle manager instance (for advanced usage)
   * @returns {ThrottleManager} Throttle manager instance
   */
  getThrottleManager() {
    return this.throttleManager;
  }
}
