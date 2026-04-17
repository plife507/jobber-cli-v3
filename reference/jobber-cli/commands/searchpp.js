/**
 * Purpose: SearchPP Command - searches jobs by price point and date range with interactive selection
 * Inputs: Optional PP names, date ranges, interactive menu selections
 * Outputs: Job search results
 * Dependencies: BaseCommand, PPSelector, DatePicker, pp-list, logger
 */

import { BaseCommand } from './_base.js';
import PPSelector from '../lib/utils/pp-selector.js';
import DatePicker from '../lib/utils/date-picker.js';
import { isKnownPP, getMatchingPP, normalizeName, PP_LIST } from '../lib/utils/pp-list.js';
import logger from '../lib/utils/logger.js';
import { cleanSection, cleanRow, colorize, colors, boldColor, calculateCleanWidth } from '../lib/utils/theme.js';
import { formatDateOnlyPST } from '../lib/utils/date-formatter.js';

export class SearchPPCommand extends BaseCommand {
  /**
   * Check if running in non-interactive mode based on CLI args
   */
  isNonInteractive(args) {
    return process.env.JOBBER_NON_INTERACTIVE === '1' || !process.stdin.isTTY || args.all || args.pp || args.start || args.end || args.json;
  }

  /**
   * Get date range from CLI args or default to last 30 days
   */
  getDateRangeFromArgs(args) {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let end = formatDate(today);
    let start;
    
    if (args.end) {
      end = args.end;
    }
    
    if (args.start) {
      start = args.start;
    } else {
      // Default: last 30 days
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      start = formatDate(startDate);
    }

    return { start, end };
  }

  /**
   * Parse PP names from CLI args
   */
  parsePPsFromArgs(args) {
    if (args.all) {
      return { selectedPPs: [...new Set(PP_LIST)], allSelected: true };
    }
    
    if (!args.pp) {
      return { selectedPPs: [], allSelected: false };
    }

    // Handle single value or array
    const ppArg = args.pp;
    const ppNames = Array.isArray(ppArg) ? ppArg : [ppArg];
    
    // Validate PP names against known list
    const validPPs = [];
    const unknownPPs = [];
    
    for (const name of ppNames) {
      const match = getMatchingPP(name);
      if (match) {
        validPPs.push(match);
      } else if (isKnownPP(name)) {
        validPPs.push(name);
      } else {
        unknownPPs.push(name);
      }
    }

    if (unknownPPs.length > 0) {
      logger.warn(`Unknown PP names (not in PP_LIST): ${unknownPPs.join(', ')}`);
    }

    return { selectedPPs: [...new Set(validPPs)], allSelected: false };
  }

  async run(args) {
    await this.initialize();

    let selectedPPs, allSelected, dateRange;

    // Check for non-interactive mode
    if (this.isNonInteractive(args)) {
      logger.info('🔍 PP Job Search (non-interactive mode)');
      logger.info('');

      // Get PP selection from args
      const ppResult = this.parsePPsFromArgs(args);
      selectedPPs = ppResult.selectedPPs;
      allSelected = ppResult.allSelected;

      // Get date range from args or defaults
      dateRange = this.getDateRangeFromArgs(args);

      if (allSelected) {
        logger.info(`PPs: All (${selectedPPs.length} total)`);
      } else if (selectedPPs.length > 0) {
        logger.info(`PPs: ${selectedPPs.join(', ')}`);
      } else {
        logger.info('PPs: None specified (searching all jobs)');
      }
      logger.info(`Date Range: ${dateRange.start} to ${dateRange.end}`);
      logger.info('');
    } else {
      // Interactive mode
      logger.info('🔍 PP Job Search');
      logger.info('');

      // Step 1: PP Selection
      const ppSelector = new PPSelector();
      const ppResult = await ppSelector.selectPPs();
      selectedPPs = ppResult.selectedPPs;
      allSelected = ppResult.allSelected;
      ppSelector.close();

      // Step 2: Date Range Selection
      const datePicker = new DatePicker();
      dateRange = await datePicker.selectDateRange();
      datePicker.close();

      console.log('');
      console.log(`Date Range: ${dateRange.start} to ${dateRange.end}`);
      console.log('');
    }

    // Step 3: Fetch Jobs
    console.log('Searching jobs...');
    const jobs = await this.fetchJobsByCriteria(selectedPPs, dateRange, allSelected);

    if (jobs.length === 0) {
      logger.warn('No jobs found matching the criteria');
      return { jobs: [] };
    }

    // Step 4: Display Job List
    if (args.json) {
      console.log(JSON.stringify({ jobs, selectedPPs, dateRange, count: jobs.length }, null, 2));
    } else {
      this.displayJobList(jobs, selectedPPs, allSelected);
    }

    return { jobs, selectedPPs, dateRange };
  }

  /**
   * Fetch jobs matching PP and date criteria
   * @param {string[]} selectedPPs - Selected PP names
   * @param {{start: string, end: string}} dateRange - Date range
   * @param {boolean} allSelected - Whether all PPs are selected
   * @returns {Promise<Array>} Array of matching jobs
   */
  async fetchJobsByCriteria(selectedPPs, dateRange, allSelected) {
    // Set up cancellation handler using base class method
    const cancel = this.setupCancellation('Job Search');

    try {
      // Query with server-side date filtering using startAt filter
      // This is much more efficient than fetching all jobs and filtering client-side
      const query = `
        query SearchJobsByPP($filter: JobFilterAttributes, $first: Int, $after: String) {
          jobs(filter: $filter, first: $first, after: $after) {
            nodes {
              id
              jobNumber
              title
              createdAt
              startAt
              completedAt
              jobStatus
              total
              client {
                name
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const allJobs = [];
      const seenJobIds = new Set(); // Track unique job IDs to prevent duplicates
      let cursor = null;
      let hasNextPage = true;
      let pageCount = 0;
      
      // Adaptive limits based on filtering mode to prevent stalling
      // Without PP filtering: 100 pages (2,500 jobs) = ~52% budget, safe
      // With PP filtering: 5 pages (125 jobs) = ~22% budget for pagination + PP checks
      // PP filtering adds ~15 units per job check, so we need lower limits
      const maxPages = (allSelected || selectedPPs.length === 0)
        ? 100  // Without PP: 2,500 jobs (~52% budget usage)
        : 5;   // With PP: 125 jobs (~22% budget usage, prevents stalling)

      // Parse date range for server-side filtering
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day

      // Format dates for ISO8601DateTimeRangeInput (ISO 8601 format)
      const formatISODate = (date) => {
        return date.toISOString();
      };

      // Build filter with startAt date range (server-side filtering)
      const filter = {
        startAt: {
          after: formatISODate(startDate),
          before: formatISODate(endDate)
        }
      };

      // Check throttle budget before starting
      // Query with server-side filtering is still efficient
      const estimatedCostPerPage = 52; // Actual: 2+(25*2)=52 for first:25
      
      // Add initial delay BEFORE checking throttle to avoid rate-limit throttling
      // The API may have per-request rate limits regardless of budget
      // This helps when the command is run right after another API call
      console.log(`Fetching jobs (this may take a moment)...`);
      console.log(`   Using server-side date filtering (startAt: ${dateRange.start} to ${dateRange.end})`);
      console.log(`   Maximum pages: ${maxPages} (${maxPages * 25} jobs max)`);
      if (allSelected || selectedPPs.length === 0) {
        console.log(`   Mode: No PP filtering (higher limit)`);
      } else {
        console.log(`   Mode: PP filtering (conservative limit to prevent stalling)`);
      }
      console.log(`   Checking throttle budget...`);
      await this.checkThrottle(estimatedCostPerPage, { silent: false });
      
      if (cancel.cancelled()) {
        console.log(`   Search cancelled.`);
        cancel.cleanup();
        return allJobs;
      }
      
      console.log(`   Starting job search...`);

      // Reduce page size to lower per-request cost and reduce throttling risk
      const pageSize = 25; // Actual cost: 2+(25*2)=52 units per page

      while (hasNextPage && pageCount < maxPages && !cancel.cancelled()) {
        // Check if cancelled before each page
        if (cancel.cancelled()) {
          console.log(`   Search cancelled. Found ${allJobs.length} job(s) so far.`);
          break;
        }

        console.log(`   Fetching page ${pageCount + 1}...`);

        const variables = { 
          filter: filter,
          first: pageSize 
        };
        if (cursor) {
          variables.after = cursor;
        }

        // Use higher estimated cost for nested query with visits and assignedUsers
        // Retry with exponential backoff if throttled
        let result;
        let retryAttempt = 0;
        const maxRetries = 5; // Allow more retries for rate-limited requests
        
        while (retryAttempt <= maxRetries && !cancel.cancelled()) {
          if (retryAttempt > 0) {
            console.log(`   Retrying page ${pageCount + 1} (attempt ${retryAttempt + 1}/${maxRetries + 1})...`);
          }
          
          try {
            result = await this.queryExecutor.execute(query, variables, { estimatedCost: estimatedCostPerPage });
          } catch (error) {
            // Check if it's an authentication error
            if (error.isAuthError) {
              logger.warn(`   Token expired on page ${pageCount + 1}`);
              const tokenUpdated = await this.handleTokenExpiration();
              if (tokenUpdated) {
                // Retry with new token
                retryAttempt = 0; // Reset retry count for auth recovery
                continue;
              } else {
                // User cancelled or token update failed
                logger.error('   Cannot continue without valid token.');
                break;
              }
            }
            // Re-throw other errors
            throw error;
          }
          
          // Check if it's an authentication error in the result
          const isAuthError = result.errors?.some(err => 
            err.message?.toLowerCase().includes('unauthenticated') ||
            err.message?.toLowerCase().includes('unauthorized') ||
            err.message?.toLowerCase().includes('token expired') ||
            err.message?.toLowerCase().includes('authentication')
          ) || result.errorDetails?.some(detail => 
            detail.isAuthError || detail.error?.isAuthError || detail.originalError?.isAuthError
          );
          
          if (!result.success && isAuthError && !cancel.cancelled()) {
            logger.warn(`   Token expired on page ${pageCount + 1}`);
            const tokenUpdated = await this.handleTokenExpiration();
            if (tokenUpdated) {
              // Retry with new token
              retryAttempt = 0; // Reset retry count for auth recovery
              continue;
            } else {
              // User cancelled or token update failed
              logger.error('   Cannot continue without valid token.');
              break;
            }
          }
          
          // Check if it's a throttle error
          const isThrottleError = result.errors?.some(err => 
            err.message?.toLowerCase().includes('throttle') || 
            err.message?.toLowerCase().includes('rate limit')
          );
          
          if (!result.success && isThrottleError && retryAttempt < maxRetries && !cancel.cancelled()) {
            // Exponential backoff: 3s, 6s, 12s, 24s, 48s
            const waitTime = Math.min(3000 * Math.pow(2, retryAttempt), 30000); // Max 30 seconds
            logger.warn(`   Throttled on page ${pageCount + 1}, attempt ${retryAttempt + 1}/${maxRetries + 1}`);
            logger.info(`   Waiting ${waitTime/1000} seconds before retry...`);
            await cancel.waitWithCancel(waitTime);
            if (cancel.cancelled()) break;
            retryAttempt++;
            continue;
          }
          
          // Either success or non-throttle/non-auth error - break retry loop
          break;
        }

        if (cancel.cancelled()) {
          console.log(`   Search cancelled. Found ${allJobs.length} job(s) so far.`);
          break;
        }

        if (!result.success || !result.data?.jobs?.nodes) {
          if (retryAttempt >= maxRetries) {
            logger.error(`Failed to fetch page ${pageCount + 1} after ${maxRetries + 1} attempts due to rate limiting`);
            logger.warn(`   This may be due to strict API rate limits. Try again in a few minutes.`);
          } else {
            logger.warn(`Failed to fetch page ${pageCount + 1}`);
          }
          break;
        }

        const jobs = result.data.jobs.nodes || [];
        console.log(`   Received ${jobs.length} job(s) from page ${pageCount + 1}`);
        
        // Jobs are already filtered by date range on the server side
        // So we can use them directly (no client-side date filtering needed)
        const dateFilteredJobs = jobs;

        // Check if cancelled before processing
        if (cancel.cancelled()) {
          console.log(`   Search cancelled. Found ${allJobs.length} job(s) so far.`);
          break;
        }

        // If no PP filter, add all date-matched jobs (deduplicate by job ID)
        if (allSelected || selectedPPs.length === 0) {
          console.log(`   Adding all ${dateFilteredJobs.length} job(s) (no PP filter)`);
          for (const job of dateFilteredJobs) {
            // Deduplicate by job ID to prevent same job appearing multiple times
            if (!seenJobIds.has(job.id)) {
              seenJobIds.add(job.id);
              allJobs.push(job);
            }
          }
        } else {
          // For PP filtering, fetch visit details only for date-matched jobs
          // This is more efficient than fetching visits for all jobs
          console.log(`   Checking PP assignments for ${dateFilteredJobs.length} job(s)...`);
          // Add small delay between visit fetches to avoid rate limiting
          for (let i = 0; i < dateFilteredJobs.length; i++) {
            if (cancel.cancelled()) break; // Exit PP filtering loop early
            
            const job = dateFilteredJobs[i];
            
            // Skip if we've already seen this job (deduplicate)
            if (seenJobIds.has(job.id)) {
              continue;
            }
            
            // Show progress for PP checking
            if (i > 0 && i % 10 === 0) {
              console.log(`   Checking PP for job ${i + 1}/${dateFilteredJobs.length}...`);
            }
            
            // Small delay every 5 jobs to avoid rate limits
            if (i > 0 && i % 5 === 0) {
              await cancel.waitWithCancel(500);
              if (cancel.cancelled()) break;
            }
            
            const jobPPs = await this.fetchJobPPs(job.id);
            
            // Check again after fetch
            if (cancel.cancelled()) break;
            
            const hasMatchingPP = jobPPs.some(jobPP => {
              return selectedPPs.some(selectedPP => {
                return this.isPPMatch(jobPP, selectedPP);
              });
            });

            if (hasMatchingPP) {
              // Mark job as seen and add visit info to job object for later use
              seenJobIds.add(job.id);
              job.visits = { nodes: [{ assignedUsers: { nodes: jobPPs.map(pp => ({ name: { full: pp } })) } }] };
              allJobs.push(job);
            }
          }
          console.log(`   Found ${allJobs.length} unique job(s) matching PP criteria`);
        }

        hasNextPage = result.data.jobs.pageInfo?.hasNextPage || false;
        cursor = result.data.jobs.pageInfo?.endCursor || null;
        pageCount++;

        // Show progress and add delay between pages to respect rate limits
        if (hasNextPage && !cancel.cancelled()) {
          console.log(`   Processed page ${pageCount}, found ${allJobs.length} matching job(s) so far...`);
          console.log(`   Waiting before fetching next page...`);
          
          // Check throttle budget before next page
          await this.checkThrottle(estimatedCostPerPage, { silent: true });
          
          await cancel.waitWithCancel(250);
        } else if (!hasNextPage) {
          console.log(`   No more pages to fetch.`);
        }
      }

      // Clean up handler
      cancel.cleanup();

      if (cancel.cancelled()) {
        logger.warn(`\n⚠️  Search cancelled. Final count: ${allJobs.length} job(s)`);
        return allJobs; // Return partial results
      }

      logger.success(`✓ Found ${allJobs.length} job(s) matching criteria`);
      return allJobs;
    } catch (error) {
      // Clean up handler on error too
      cancel.cleanup();
      throw error;
    }
  }

  /**
   * Get the most relevant date from a job (completedAt, startAt, or createdAt)
   * @param {Object} job - Job object
   * @returns {string|null} Date string or null
   */
  getJobDate(job) {
    return job.completedAt || job.startAt || job.createdAt || null;
  }

  /**
   * Fetch PP names for a specific job by querying visits
   * @param {string} jobId - Encoded job ID
   * @returns {Promise<string[]>} Array of PP names found
   */
  async fetchJobPPs(jobId) {
    // Simple query to get visits with assigned users for a single job
    const query = `
      query GetJobVisits($id: EncodedId!) {
        job(id: $id) {
          visits(first: 5) {
            nodes {
              assignedUsers {
                nodes {
                  name {
                    full
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.queryExecutor.execute(query, { id: jobId }, { estimatedCost: 15 });
      
      if (!result.success || !result.data?.job?.visits?.nodes) {
        return [];
      }

      const pps = new Set();
      const visits = result.data.job.visits.nodes || [];

      for (const visit of visits) {
        const assignedUsers = visit.assignedUsers?.nodes || [];
        for (const user of assignedUsers) {
          const userName = user.name?.full || '';
          if (!userName) continue;

          // Check if this user is a known PP (this handles all matching logic)
          if (isKnownPP(userName)) {
            const matchingPP = getMatchingPP(userName);
            if (matchingPP) {
              pps.add(matchingPP);
            } else {
              pps.add(userName);
            }
          }
        }
      }

      return Array.from(pps);
    } catch (error) {
      logger.warn(`Failed to fetch visits for job ${jobId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract PP names from a job's assigned users (if visits already loaded)
   * @param {Object} job - Job object
   * @returns {string[]} Array of PP names found
   */
  extractPPsFromJob(job) {
    const pps = new Set();
    const visits = job.visits?.nodes || [];

    for (const visit of visits) {
      const assignedUsers = visit.assignedUsers?.nodes || [];
      for (const user of assignedUsers) {
        const userName = user.name?.full || '';
        if (!userName) continue;

        // Check if this user is a known PP (this handles all matching logic)
        if (isKnownPP(userName)) {
          const matchingPP = getMatchingPP(userName);
          if (matchingPP) {
            pps.add(matchingPP);
          } else {
            // If no exact match but isKnownPP returned true, add the normalized name
            pps.add(userName);
          }
        }
      }
    }

    return Array.from(pps);
  }

  /**
   * Check if a job PP matches a selected PP
   * @param {string} jobPP - PP name from job
   * @param {string} selectedPP - Selected PP name
   * @returns {boolean} True if match
   */
  isPPMatch(jobPP, selectedPP) {
    if (!jobPP || !selectedPP) return false;
    
    const jobPPNormalized = normalizeName(jobPP);
    const selectedPPNormalized = normalizeName(selectedPP);
    
    // Exact match
    if (jobPPNormalized === selectedPPNormalized) return true;
    
    // Word boundary match (prevents "leo" matching "leonardo")
    if (!selectedPPNormalized.includes(' ')) {
      // Single word PP - match as complete word only
      const wordBoundaryRegex = new RegExp(`\\b${selectedPPNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryRegex.test(jobPPNormalized)) {
        return true;
      }
    } else {
      // Multi-word PP - match full phrase
      const phraseRegex = new RegExp(`\\b${selectedPPNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (phraseRegex.test(jobPPNormalized)) {
        return true;
      }
    }
    
    // Check if jobPP (as single word) appears in selectedPP as complete word
    if (!jobPPNormalized.includes(' ')) {
      const wordBoundaryRegex = new RegExp(`\\b${jobPPNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryRegex.test(selectedPPNormalized)) {
        return true;
      }
    }
    
    // Check first name match as complete word (for "Marco" matching "Marco Nava")
    const jobPPWords = jobPPNormalized.split(/\s+/);
    const selectedPPWords = selectedPPNormalized.split(/\s+/);
    
    if (jobPPWords.length > 0 && selectedPPWords.length > 0) {
      const jobFirstName = jobPPWords[0];
      const selectedFirstName = selectedPPWords[0];
      
      // First names must match exactly and be at least 3 chars (prevents "leo" matching "leonardo")
      if (jobFirstName === selectedFirstName && jobFirstName.length >= 3) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Display formatted job list
   * @param {Array} jobs - Array of job objects
   * @param {string[]} selectedPPs - Selected PPs
   * @param {boolean} allSelected - Whether all PPs selected
   */
  displayJobList(jobs, selectedPPs, allSelected) {
    console.log('');
    console.log(`Jobs Found (${jobs.length}):`);
    console.log('');

    // Sort jobs by date (newest first)
    const sortedJobs = [...jobs].sort((a, b) => {
      const dateA = this.getJobDate(a);
      const dateB = this.getJobDate(b);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateB) - new Date(dateA);
    });

    sortedJobs.forEach((job, index) => {
      const jobPPs = this.extractPPsFromJob(job);
      const ppDisplay = jobPPs.length > 0 
        ? jobPPs.join(', ')
        : allSelected || selectedPPs.length === 0 ? 'All' : 'N/A';

      const jobNumber = String(job.jobNumber || 'N/A');
      const title = job.title || 'Untitled';
      const client = job.client?.name || 'N/A';
      const date = this.formatJobDate(this.getJobDate(job));

      console.log(`${index + 1}. Job #${jobNumber} - ${title}`);
      console.log(`   Client: ${client}`);
      console.log(`   PP: ${ppDisplay}`);
      console.log(`   Date: ${date}`);
      console.log('');
    });
  }

  /**
   * Format job date for display in PST/PDT
   * @param {string} dateStr - Date string
   * @returns {string} Formatted date
   */
  formatJobDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      return formatDateOnlyPST(dateStr);
    } catch {
      return dateStr.substring(0, 10);
    }
  }
}

export default SearchPPCommand;

