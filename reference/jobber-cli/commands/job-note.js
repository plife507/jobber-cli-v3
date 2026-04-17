/**
 * Purpose: Job Note Command - create, edit, delete, and list job notes through the Jobber GraphQL API
 * Inputs: action plus job number/id or note id, message, pinned flag
 * Outputs: Structured note mutation/read results
 * Dependencies: BaseCommand, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';

export class JobNoteCommand extends BaseCommand {
  static get commandName() { return 'job-note'; }
  static get description() { return 'Create, edit, delete, or list notes on a job'; }

  async run(args) {
    await this.initialize();

    const action = args.action || args._positional?.[0];
    if (!action) {
      throw new Error(this.usage());
    }

    switch (action) {
      case 'list':
        return this.listNotes(args);
      case 'create':
        return this.createNote(args);
      case 'edit':
        return this.editNote(args);
      case 'delete':
        return this.deleteNote(args);
      default:
        throw new Error(`Unknown action: ${action}\n\n${this.usage()}`);
    }
  }

  usage() {
    return [
      'Usage:',
      '  jobber job-note list <jobNumberOrId>',
      '  jobber job-note create <jobNumberOrId> --message "..." [--pinned]',
      '  jobber job-note edit --note-id <encodedId> --message "..." [--pinned|--no-pinned]',
      '  jobber job-note delete --note-id <encodedId>',
    ].join('\n');
  }

  getPinnedValue(args, defaultValue = undefined) {
    if (args.pinned === true) return true;
    if (args.pinned === false) return false;
    if (args.noPinned === true || args['no-pinned'] === true) return false;
    return defaultValue;
  }

  async listNotes(args) {
    const jobArg = args.job || args.id || args.query || args._positional?.[1];
    const jobId = await this.resolveJobId(jobArg);
    const first = Number.parseInt(args.first || args.limit || 20, 10);

    const query = `
      query ListJobNotes($id: EncodedId!, $first: Int!) {
        job(id: $id) {
          id
          jobNumber
          title
          notes(first: $first) {
            nodes {
              __typename
              ... on JobNote {
                id
                message
                pinned
                createdAt
                lastEditedAt
              }
              ... on ClientNote {
                id
                message
                pinned
                createdAt
                lastEditedAt
              }
            }
          }
        }
      }
    `;

    await this.checkThrottle(80, { silent: true });
    const result = await this.queryExecutor.execute(query, { id: jobId, first }, { estimatedCost: 80 });

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to list job notes');
    }

    const job = result.data?.job;
    const notes = job?.notes?.nodes || [];

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Found ${notes.length} note(s) on job #${job?.jobNumber ?? 'unknown'}`);
    }

    return {
      job: {
        id: job?.id || null,
        jobNumber: job?.jobNumber || null,
        title: job?.title || null,
      },
      notes,
      throttleStatus: result.throttleStatus,
    };
  }

  async createNote(args) {
    const jobArg = args.job || args.id || args.query || args._positional?.[1];
    const message = args.message;
    if (!message) {
      throw new Error('Missing required flag: --message');
    }

    const jobId = await this.resolveJobId(jobArg);
    const pinned = this.getPinnedValue(args) ?? false;

    const mutation = `
      mutation CreateJobNote($jobId: EncodedId!, $input: JobCreateNoteInput!) {
        jobCreateNote(jobId: $jobId, input: $input) {
          job {
            id
            jobNumber
          }
          jobNote {
            id
            message
            pinned
            createdAt
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const result = await this.queryExecutor.execute(
      mutation,
      { jobId, input: { message, pinned } },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to create job note');
    }

    const payload = result.data?.jobCreateNote;
    if (payload?.userErrors?.length) {
      throw new Error(`Job note create failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Created note on job #${payload?.job?.jobNumber}`);
    }

    return {
      action: 'create',
      job: payload?.job || null,
      note: payload?.jobNote || null,
      throttleStatus: result.throttleStatus,
    };
  }

  async editNote(args) {
    const noteId = args.noteId || args['note-id'];
    const message = args.message;
    if (!noteId) {
      throw new Error('Missing required flag: --note-id');
    }
    if (!message) {
      throw new Error('Missing required flag: --message');
    }

    const pinned = this.getPinnedValue(args);

    const mutation = `
      mutation EditJobNote($input: JobEditNoteInput!) {
        jobEditNote(input: $input) {
          job {
            id
            jobNumber
          }
          jobNote {
            id
            message
            pinned
            lastEditedAt
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const input = { noteId, message };
    if (pinned !== undefined) {
      input.pinned = pinned;
    }

    const result = await this.queryExecutor.execute(
      mutation,
      { input },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to edit job note');
    }

    const payload = result.data?.jobEditNote;
    if (payload?.userErrors?.length) {
      throw new Error(`Job note edit failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Edited note on job #${payload?.job?.jobNumber}`);
    }

    return {
      action: 'edit',
      job: payload?.job || null,
      note: payload?.jobNote || null,
      throttleStatus: result.throttleStatus,
    };
  }

  async deleteNote(args) {
    const noteId = args.noteId || args['note-id'];
    if (!noteId) {
      throw new Error('Missing required flag: --note-id');
    }

    const mutation = `
      mutation DeleteJobNote($input: JobDeleteNoteInput!) {
        jobDeleteNote(input: $input) {
          job {
            id
            jobNumber
          }
          deletedNote {
            id
            message
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    await this.checkThrottle(20, { silent: true });
    const result = await this.queryExecutor.execute(
      mutation,
      { input: { noteId } },
      { estimatedCost: 20 }
    );

    if (!result.success) {
      const formatted = this.errorHandler.formatError(result.errorDetails[0]);
      logger.error(formatted);
      throw new Error('Failed to delete job note');
    }

    const payload = result.data?.jobDeleteNote;
    if (payload?.userErrors?.length) {
      throw new Error(`Job note delete failed: ${payload.userErrors.map(e => e.message).join('; ')}`);
    }

    if (!process.env.JOBBER_MACHINE_MODE && !args.json) {
      logger.success(`Deleted note from job #${payload?.job?.jobNumber}`);
    }

    return {
      action: 'delete',
      job: payload?.job || null,
      note: payload?.deletedNote || null,
      throttleStatus: result.throttleStatus,
    };
  }
}

export default JobNoteCommand;
