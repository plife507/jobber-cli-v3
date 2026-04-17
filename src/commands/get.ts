import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/get.js — core fetch-by-id flow.
// Phase 4 ships the typed JSON path (single-entity lookup by encoded ID or by
// numeric URL ID converted via gid encoding). The rich pretty-printing layer
// from v2.5 (1,200+ lines of theme formatting) is deferred to Phase 5.

const ENTITY_TYPES = ['job', 'client', 'quote', 'invoice'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface GetArgs {
  readonly type?: string;
  readonly id?: string;
  readonly json?: boolean;
}

export interface GetResult<T = unknown> {
  readonly type: EntityType;
  readonly entity: T;
}

const TYPE_NAME: Record<EntityType, string> = {
  job: 'Job',
  client: 'Client',
  quote: 'Quote',
  invoice: 'Invoice',
};

// The cost of these queries varies; 100 units is the v2.5 estimate used as
// the ceiling for a single-entity lookup and matches reference/jobber-cli/
// commands/get.js:83.
const GET_COST = 100;

function isEntityType(v: string | undefined): v is EntityType {
  return typeof v === 'string' && (ENTITY_TYPES as readonly string[]).includes(v);
}

function isNumeric(s: string): boolean {
  return /^\d+$/.test(s);
}

function gidEncode(type: EntityType, numericId: string): string {
  const n = Number.parseInt(numericId, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid numeric ID: ${numericId}`);
  }
  const gid = `gid://Jobber/${TYPE_NAME[type]}/${n}`;
  return Buffer.from(gid, 'utf-8').toString('base64');
}

function buildQuery(type: EntityType): string {
  // Minimal parity selection — the v2.5 get.js query shapes pull ~200 lines
  // of nested fragments. Phase 5 reintroduces the full selection when the
  // pretty-printer needs it; Phase 4 keeps the surface small so the typed
  // result is human-scannable and cheap (well under the 100-unit budget).
  switch (type) {
    case 'job':
      return `query GetJob($id: EncodedId!) {
        job(id: $id) {
          id
          jobNumber
          title
          jobStatus
          jobType
          total
          client { id name }
        }
      }`;
    case 'client':
      return `query GetClient($id: EncodedId!) {
        client(id: $id) {
          id
          name
          isCompany
          isLead
          balance
          emails { address }
        }
      }`;
    case 'quote':
      return `query GetQuote($id: EncodedId!) {
        quote(id: $id) {
          id
          quoteNumber
          title
          quoteStatus
          amounts { total }
          client { id name }
        }
      }`;
    case 'invoice':
      return `query GetInvoice($id: EncodedId!) {
        invoice(id: $id) {
          id
          invoiceNumber
          invoiceStatus
          amounts { total invoiceBalance }
          client { id name }
        }
      }`;
  }
}

export class GetCommand extends BaseCommand<GetResult, GetArgs> {
  protected async run(
    args: GetArgs,
    { queryExecutor, logger }: BaseCommandContext,
  ): Promise<GetResult> {
    const { type, id } = args;
    if (!type || !id) {
      throw new Error('Usage: jobber get <type> <id>  — type: job|client|quote|invoice');
    }
    if (!isEntityType(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${ENTITY_TYPES.join(', ')}`);
    }

    const encodedId = isNumeric(id) ? gidEncode(type, id) : id;
    const query = buildQuery(type);

    const result = await queryExecutor.execute<Record<string, unknown>>(
      query,
      { id: encodedId },
      { estimatedCost: GET_COST, silent: true },
    );
    if (!result.success) {
      const first = result.errors[0];
      const message = typeof first === 'string' ? first : (first?.message ?? 'unknown error');
      throw new Error(`Failed to fetch ${type}: ${message}`);
    }

    const entity = result.data?.[type];
    if (!entity) {
      throw new Error(`${type} not found`);
    }

    if (args.json) {
      process.stdout.write(`${JSON.stringify({ type, entity }, null, 2)}\n`);
    } else {
      logger.info(`${TYPE_NAME[type]} ${id}`);
      logger.info(JSON.stringify(entity, null, 2));
    }
    return { type, entity };
  }
}

export { ENTITY_TYPES };
