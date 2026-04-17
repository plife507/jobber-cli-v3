import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/search.js. JSON-default output;
// rich table rendering from v2.5 is deliberately left out (Phase 5 is
// schema/transport only per the 2026-04-17 scope narrow).

const ENTITY_TYPES = ['jobs', 'clients'] as const;
export type SearchEntity = (typeof ENTITY_TYPES)[number];

export interface SearchArgs {
  readonly type?: string;
  readonly query?: string;
  readonly limit?: string | number;
  readonly json?: boolean;
}

interface JobNode {
  id: string;
  jobNumber: string | number;
  title: string | null;
  jobStatus: string | null;
  client?: { id: string; name: string | null } | null;
}
interface ClientNode {
  id: string;
  name: string | null;
  title: string | null;
  emails?: Array<{ address: string | null }> | null;
}

function parseLimit(raw: SearchArgs['limit'], fallback: number): number {
  if (raw === undefined) return fallback;
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export class SearchCommand extends BaseCommand<{ items: Array<JobNode | ClientNode> }, SearchArgs> {
  protected async run(
    args: SearchArgs,
    { queryExecutor }: BaseCommandContext,
  ): Promise<{ items: Array<JobNode | ClientNode> }> {
    const { type, query: searchTerm } = args;
    if (!type || !searchTerm) {
      throw new Error('Usage: jobber search <type> <query>  — type: jobs|clients');
    }
    if (!(ENTITY_TYPES as readonly string[]).includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${ENTITY_TYPES.join(', ')}`);
    }

    if (type === 'jobs') {
      const first = parseLimit(args.limit, 10);
      const query = `
        query SearchJobs($searchTerm: String, $first: Int) {
          jobs(searchTerm: $searchTerm, first: $first) {
            nodes {
              id jobNumber title jobStatus
              client { id name }
            }
          }
        }
      `;
      const result = await queryExecutor.execute<{ jobs: { nodes: JobNode[] } }>(
        query,
        { searchTerm, first },
        { estimatedCost: 50, silent: true },
      );
      if (!result.success) {
        throw new Error(this.messageFrom(result.errors));
      }
      const items = result.data?.jobs?.nodes ?? [];
      if (args.json !== false) {
        process.stdout.write(`${JSON.stringify({ items }, null, 2)}\n`);
      }
      return { items };
    }

    // type === 'clients' — server does not support name filtering, so we
    // fetch a page and filter client-side (parity with v2.5).
    const first = parseLimit(args.limit, 50);
    const query = `
      query SearchClients($first: Int) {
        clients(first: $first) {
          nodes { id name title emails { address } }
        }
      }
    `;
    const result = await queryExecutor.execute<{ clients: { nodes: ClientNode[] } }>(
      query,
      { first },
      { estimatedCost: 100, silent: true },
    );
    if (!result.success) {
      throw new Error(this.messageFrom(result.errors));
    }
    const all = result.data?.clients?.nodes ?? [];
    const needle = searchTerm.toLowerCase();
    const items = all.filter((c) => (c.name ?? '').toLowerCase().includes(needle));
    if (args.json !== false) {
      process.stdout.write(`${JSON.stringify({ items }, null, 2)}\n`);
    }
    return { items };
  }

  private messageFrom(errors: readonly (string | { message: string })[]): string {
    const first = errors[0];
    if (!first) return 'Search failed (no error details)';
    return typeof first === 'string' ? first : first.message;
  }
}
