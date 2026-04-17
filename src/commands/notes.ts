import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/notes.js. Aggregates notes across
// the N most-recently-updated jobs. The rich formatting layer from v2.5 is
// left out — JSON output and a compact text summary only.

interface JobNoteNode {
  id: string;
  message: string | null;
  createdAt: string | null;
  pinned: boolean | null;
}

interface JobWithNotes {
  id: string;
  jobNumber: string | number | null;
  title: string | null;
  client?: { name: string | null } | null;
  notes?: { nodes?: Array<JobNoteNode & { __typename?: string }> | null } | null;
}

export interface AggregatedNote {
  message: string;
  createdAt: string | null;
  pinned: boolean;
  jobNumber: string | number | null;
  jobTitle: string | null;
  clientName: string;
}

export interface NotesArgs {
  readonly limit?: string | number;
  readonly 'notes-per-job'?: string | number;
  readonly notesPerJob?: string | number;
  readonly 'max-notes'?: string | number;
  readonly maxNotes?: string | number;
  readonly json?: boolean;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export class NotesCommand extends BaseCommand<
  { notes: AggregatedNote[]; count: number },
  NotesArgs
> {
  protected async run(
    args: NotesArgs,
    { queryExecutor, logger }: BaseCommandContext,
  ): Promise<{ notes: AggregatedNote[]; count: number }> {
    const requestedLimit = clampInt(args.limit, 25, 1, 40);
    const notesPerJob = clampInt(args.notesPerJob ?? args['notes-per-job'], 15, 1, 25);
    const maxNotes = clampInt(args.maxNotes ?? args['max-notes'], 100, 1, 1_000);

    const query = `
      query GetRecentJobsWithNotes($first: Int!, $notes: Int!) {
        jobs(first: $first, sort: { direction: DESCENDING, key: UPDATED_AT }) {
          nodes {
            id
            jobNumber
            title
            client { name }
            notes(first: $notes) {
              nodes {
                __typename
                ... on JobNote {
                  id message createdAt pinned
                }
              }
            }
          }
        }
      }
    `;
    const estimatedCost = Math.max(200, Math.ceil(requestedLimit * notesPerJob * 6));
    const result = await queryExecutor.execute<{ jobs: { nodes: JobWithNotes[] } }>(
      query,
      { first: requestedLimit, notes: notesPerJob },
      { estimatedCost, silent: true },
    );
    if (!result.success) {
      const first = result.errors[0];
      throw new Error(typeof first === 'string' ? first : (first?.message ?? 'notes failed'));
    }

    const jobs = result.data?.jobs?.nodes ?? [];
    const all: AggregatedNote[] = [];
    for (const job of jobs) {
      for (const note of job.notes?.nodes ?? []) {
        if (!note.message?.trim()) continue;
        all.push({
          message: note.message,
          createdAt: note.createdAt ?? null,
          pinned: Boolean(note.pinned),
          jobNumber: job.jobNumber ?? null,
          jobTitle: job.title ?? null,
          clientName: job.client?.name ?? 'Unknown',
        });
      }
    }
    all.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const limited = all.slice(0, maxNotes);

    if (args.json) {
      process.stdout.write(`${JSON.stringify({ notes: limited, count: all.length }, null, 2)}\n`);
    } else {
      logger.info(`Found ${all.length} note(s) across ${jobs.length} job(s)`);
      if (all.length > maxNotes) {
        logger.info(`Showing first ${maxNotes} (use --max-notes to show more)`);
      }
    }
    return { notes: limited, count: all.length };
  }
}
