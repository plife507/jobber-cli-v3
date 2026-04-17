import { BaseCommand, type BaseCommandContext } from './base-command.js';
import { requireWritesEnabled } from './writes-gate.js';

// Ported from reference/jobber-cli/commands/job-note.js. Four actions:
//   list   (read)
//   create (mutation — writes-gated)
//   edit   (mutation — writes-gated)
//   delete (mutation — writes-gated)
//
// Every mutation codepath calls requireWritesEnabled(config) BEFORE
// constructing the mutation request. Grep gate in the phase doc verifies
// this wrapping.

export type JobNoteAction = 'list' | 'create' | 'edit' | 'delete';

export interface JobNoteArgs {
  readonly action?: string;
  readonly _positional?: readonly string[];
  readonly job?: string | number;
  readonly id?: string | number;
  readonly query?: string;
  readonly message?: string;
  readonly noteId?: string;
  readonly 'note-id'?: string;
  readonly pinned?: boolean;
  readonly 'no-pinned'?: boolean;
  readonly noPinned?: boolean;
  readonly first?: string | number;
  readonly limit?: string | number;
  readonly json?: boolean;
}

const LIST_QUERY = `
  query ListJobNotes($id: EncodedId!, $first: Int!) {
    job(id: $id) {
      id jobNumber title
      notes(first: $first) {
        nodes {
          __typename
          ... on JobNote { id message pinned createdAt lastEditedAt }
          ... on ClientNote { id message pinned createdAt lastEditedAt }
        }
      }
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateJobNote($jobId: EncodedId!, $input: JobCreateNoteInput!) {
    jobCreateNote(jobId: $jobId, input: $input) {
      job { id jobNumber }
      jobNote { id message pinned createdAt }
      userErrors { message path }
    }
  }
`;

const EDIT_MUTATION = `
  mutation EditJobNote($input: JobEditNoteInput!) {
    jobEditNote(input: $input) {
      job { id jobNumber }
      jobNote { id message pinned lastEditedAt }
      userErrors { message path }
    }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteJobNote($input: JobDeleteNoteInput!) {
    jobDeleteNote(input: $input) {
      job { id jobNumber }
      deletedNote { id message }
      userErrors { message path }
    }
  }
`;

function pinnedValue(args: JobNoteArgs): boolean | undefined {
  if (args.pinned === true) return true;
  if (args.pinned === false) return false;
  if (args.noPinned === true || args['no-pinned'] === true) return false;
  return undefined;
}

function firstId(args: JobNoteArgs): string | number | null {
  return args.job ?? args.id ?? args.query ?? args._positional?.[1] ?? null;
}

function extract<T>(result: { data?: unknown }, key: string): T | null {
  if (!result.data || typeof result.data !== 'object') return null;
  return ((result.data as Record<string, unknown>)[key] as T) ?? null;
}

export interface JobNoteResult {
  readonly action: JobNoteAction;
  readonly job?: {
    id: string | null;
    jobNumber: string | number | null;
    title?: string | null;
  } | null;
  readonly note?: Record<string, unknown> | null;
  readonly notes?: Array<Record<string, unknown>>;
}

export class JobNoteCommand extends BaseCommand<JobNoteResult, JobNoteArgs> {
  protected async run(args: JobNoteArgs, ctx: BaseCommandContext): Promise<JobNoteResult> {
    const action = (args.action ?? args._positional?.[0] ?? '') as JobNoteAction;
    switch (action) {
      case 'list':
        return this.list(args, ctx);
      case 'create':
        return this.create(args, ctx);
      case 'edit':
        return this.edit(args, ctx);
      case 'delete':
        return this.delete(args, ctx);
      default:
        throw new Error(`Unknown action: ${action || '(none)'}\n\n${this.usage()}`);
    }
  }

  private usage(): string {
    return [
      'Usage:',
      '  jobber job-note list <jobNumberOrId>',
      '  jobber job-note create <jobNumberOrId> --message "..." [--pinned]',
      '  jobber job-note edit --note-id <encodedId> --message "..." [--pinned|--no-pinned]',
      '  jobber job-note delete --note-id <encodedId>',
    ].join('\n');
  }

  private async list(args: JobNoteArgs, ctx: BaseCommandContext): Promise<JobNoteResult> {
    const jobId = await this.resolveJobId(firstId(args));
    const first =
      typeof args.first === 'number'
        ? args.first
        : Number.parseInt(String(args.first ?? args.limit ?? 20), 10);

    const result = await ctx.queryExecutor.execute<{
      job: {
        id: string;
        jobNumber: string | number | null;
        title: string | null;
        notes: { nodes: Array<Record<string, unknown>> };
      } | null;
    }>(
      LIST_QUERY,
      { id: jobId, first: Number.isFinite(first) ? first : 20 },
      { estimatedCost: 80, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));

    const job = result.data?.job ?? null;
    const notes = job?.notes?.nodes ?? [];
    const payload: JobNoteResult = {
      action: 'list',
      job: job ? { id: job.id, jobNumber: job.jobNumber, title: job.title } : null,
      notes,
    };
    if (args.json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  }

  private async create(args: JobNoteArgs, ctx: BaseCommandContext): Promise<JobNoteResult> {
    requireWritesEnabled(ctx.config);
    if (!args.message) throw new Error('Missing required flag: --message');
    const jobId = await this.resolveJobId(firstId(args));
    const pinned = pinnedValue(args) ?? false;

    const result = await ctx.queryExecutor.execute(
      CREATE_MUTATION,
      { jobId, input: { message: args.message, pinned } },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = extract<{
      job?: { id: string | null; jobNumber: string | number | null };
      jobNote?: Record<string, unknown>;
      userErrors?: Array<{ message: string }>;
    }>(result, 'jobCreateNote');
    if (payload?.userErrors?.length) {
      throw new Error(
        `Job note create failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobNoteResult = {
      action: 'create',
      job: payload?.job ?? null,
      note: payload?.jobNote ?? null,
    };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private async edit(args: JobNoteArgs, ctx: BaseCommandContext): Promise<JobNoteResult> {
    requireWritesEnabled(ctx.config);
    const noteId = args.noteId ?? args['note-id'];
    if (!noteId) throw new Error('Missing required flag: --note-id');
    if (!args.message) throw new Error('Missing required flag: --message');
    const input: Record<string, unknown> = { noteId, message: args.message };
    const pinned = pinnedValue(args);
    if (pinned !== undefined) input.pinned = pinned;

    const result = await ctx.queryExecutor.execute(
      EDIT_MUTATION,
      { input },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = extract<{
      job?: { id: string | null; jobNumber: string | number | null };
      jobNote?: Record<string, unknown>;
      userErrors?: Array<{ message: string }>;
    }>(result, 'jobEditNote');
    if (payload?.userErrors?.length) {
      throw new Error(
        `Job note edit failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobNoteResult = {
      action: 'edit',
      job: payload?.job ?? null,
      note: payload?.jobNote ?? null,
    };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private async delete(args: JobNoteArgs, ctx: BaseCommandContext): Promise<JobNoteResult> {
    requireWritesEnabled(ctx.config);
    const noteId = args.noteId ?? args['note-id'];
    if (!noteId) throw new Error('Missing required flag: --note-id');

    const result = await ctx.queryExecutor.execute(
      DELETE_MUTATION,
      { input: { noteId } },
      { estimatedCost: 20, silent: true },
    );
    if (!result.success) throw new Error(this.errorFrom(result.errors));
    const payload = extract<{
      job?: { id: string | null; jobNumber: string | number | null };
      deletedNote?: Record<string, unknown>;
      userErrors?: Array<{ message: string }>;
    }>(result, 'jobDeleteNote');
    if (payload?.userErrors?.length) {
      throw new Error(
        `Job note delete failed: ${payload.userErrors.map((e) => e.message).join('; ')}`,
      );
    }
    const out: JobNoteResult = {
      action: 'delete',
      job: payload?.job ?? null,
      note: payload?.deletedNote ?? null,
    };
    if (args.json) process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return out;
  }

  private errorFrom(errors: readonly (string | { message: string })[]): string {
    const first = errors[0];
    if (!first) return 'Job note operation failed';
    return typeof first === 'string' ? first : first.message;
  }
}
