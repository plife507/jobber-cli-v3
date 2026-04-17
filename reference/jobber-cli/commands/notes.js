/**
 * Purpose: Notes Command - displays notes from recent jobs sorted by date (newest to oldest)
 * Inputs: Optional date range, job filters, limit on number of jobs to search
 * Outputs: Aggregated notes list sorted by creation date with job context
 * Dependencies: BaseCommand, logger, theme utilities, date-formatter
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import { formatCompactDateTimePST } from '../lib/utils/date-formatter.js';
import { 
  colorize, primary, secondary, colors, boldColor,
  cleanHeader, cleanSection, cleanRow, cleanWrapText, calculateCleanWidth
} from '../lib/utils/theme.js';

export class NotesCommand extends BaseCommand {
  async run(args) {
    await this.initialize();

    // Cap job count and notes-per-job so the query fits under the 10k throttle budget.
    // Measured cost: ~2000 units for 25 jobs × 15 notes.
    const requestedLimit = args.limit ? parseInt(args.limit) : 25;
    const limit = Math.min(Math.max(requestedLimit, 1), 40);
    const notesPerJob = Math.min(parseInt(args['notes-per-job'] || 15, 10), 25);
    const maxNotes = args['max-notes'] ? parseInt(args['max-notes']) : 100;

    if (requestedLimit !== limit) {
      logger.warn(`Clamping --limit from ${requestedLimit} to ${limit} to stay under throttle budget`);
    }

    logger.info(`Fetching notes from last ${limit} jobs (up to ${notesPerJob} notes each)...`);
    console.log('');

    // Note: JobSortKey doesn't have CREATED_AT, using UPDATED_AT for recent jobs
    const query = `
      query GetRecentJobsWithNotes($first: Int!, $notes: Int!) {
        jobs(first: $first, sort: { direction: DESCENDING, key: UPDATED_AT }) {
          nodes {
            id
            jobNumber
            title
            client {
              name
            }
            notes(first: $notes) {
              nodes {
                __typename
                ... on JobNote {
                  id
                  message
                  createdAt
                  pinned
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const estimatedCost = Math.max(200, Math.ceil(limit * notesPerJob * 6));
    await this.checkThrottle(estimatedCost, { silent: true });
    const result = await this.queryExecutor.execute(query, { first: limit, notes: notesPerJob }, { estimatedCost });

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to fetch jobs with notes');
    }

    const jobs = result.data.jobs?.nodes || [];
    
    if (jobs.length === 0) {
      logger.warn('No jobs found');
      return;
    }

    // Aggregate all notes from all jobs
    const allNotes = [];
    
    jobs.forEach(job => {
      if (job.notes && job.notes.nodes && job.notes.nodes.length > 0) {
        job.notes.nodes.forEach(note => {
          if (note.message && note.message.trim()) {
            allNotes.push({
              message: note.message,
              createdAt: note.createdAt ? new Date(note.createdAt) : null,
              pinned: note.pinned || false,
              jobNumber: job.jobNumber,
              jobTitle: job.title,
              clientName: job.client?.name || 'Unknown'
            });
          }
        });
      }
    });

    if (allNotes.length === 0) {
      logger.warn('No notes found in recent jobs');
      return;
    }

    // Sort by date (newest first)
    allNotes.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;  // Notes without dates go to the end
      if (!b.createdAt) return -1;  // Notes without dates go to the end
      return b.createdAt.getTime() - a.createdAt.getTime();  // Newest first (descending)
    });

    // Limit to max notes
    const notesToDisplay = allNotes.slice(0, maxNotes);

    // Display notes
    const contentWidth = calculateCleanWidth();
    
    logger.success(`Found ${allNotes.length} note(s) across ${jobs.length} job(s)`);
    if (allNotes.length > maxNotes) {
      logger.info(`Showing first ${maxNotes} notes (use --max-notes to show more)`);
    }
    console.log('');
    
    console.log(cleanHeader('📝', 'NOTES FROM RECENT JOBS', contentWidth));
    console.log('');

    notesToDisplay.forEach((note, index) => {
      const isPinned = note.pinned ? '📌 ' : '';
      const dateStr = note.createdAt ? formatCompactDateTimePST(note.createdAt) : 'Unknown date';
      const jobInfo = `Job #${note.jobNumber}`;
      const clientInfo = note.clientName;
      
      // Note header
      console.log(`${isPinned}${boldColor(`${index + 1}.`, colors.blue)} ${secondary(dateStr)}`);
      console.log(`   ${colorize('Job:', colors.grey)} ${primary(jobInfo)} ${secondary('•')} ${primary(clientInfo)}`);
      
      if (note.jobTitle) {
        const titlePreview = note.jobTitle.length > 60 ? note.jobTitle.substring(0, 57) + '...' : note.jobTitle;
        console.log(`   ${colorize('Title:', colors.grey)} ${secondary(titlePreview)}`);
      }
      
      // Note message (wrapped)
      const message = note.message || '';
      const wrappedMessage = cleanWrapText(message, 3, contentWidth - 3);
      wrappedMessage.forEach(line => {
        console.log(`   ${line}`);
      });
      
      console.log(''); // Blank line after each note
    });

    // Summary
    console.log(colorize('─'.repeat(contentWidth), colors.grey));
    console.log('');
    logger.info(`Displayed ${notesToDisplay.length} of ${allNotes.length} total notes`);
    
    if (args.json) {
      console.log('');
      console.log(JSON.stringify(allNotes, null, 2));
    }

    return { notes: allNotes, count: allNotes.length };
  }
}

export default NotesCommand;

