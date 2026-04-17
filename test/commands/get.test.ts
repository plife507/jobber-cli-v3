import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { GetCommand } from '../../src/commands/get.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';
import { ThrottleManager } from '../../src/core/throttle-manager.js';
import { createLogger } from '../../src/utils/logger.js';

function jsonResponse(body: unknown): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

function buildContext(fetchImpl: FetchLike) {
  const throttleManager = new ThrottleManager();
  const rateLimiter = new RateLimiter(throttleManager);
  const client = new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token: 't',
    fetchImpl,
    throttleManager,
    rateLimiter,
  });
  const logger = createLogger({ level: 'info' });
  const schemaManager = new SchemaManager();
  const errorHandler = new ErrorHandler({ schemaManager });
  const queryExecutor = new QueryExecutor(client, errorHandler);
  return {
    config: {
      JOBBER_ACCESS_TOKEN: 't',
      JOBBER_API_URL: 'https://api.test/graphql',
      JOBBER_API_VERSION: 'v',
      JOBBER_WRITES_ENABLED: false,
      LOG_LEVEL: 'info' as const,
      DEBUG: false,
    },
    logger,
    throttleManager,
    rateLimiter,
    client,
    schemaManager,
    errorHandler,
    queryExecutor,
  };
}

describe('GetCommand', () => {
  it('fetches a job by encoded id and returns the entity', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: { job: { id: 'Z2lk', jobNumber: 12345, title: 'Service call' } },
        extensions: {
          cost: {
            actualQueryCost: 10,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 9_900,
              restoreRate: 500,
            },
          },
        },
      });
    const cmd = new GetCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ type: 'job', id: 'Z2lk', json: true });
    spy.mockRestore();
    expect(result.type).toBe('job');
    expect((result.entity as { jobNumber: number }).jobNumber).toBe(12345);
  });

  it('converts numeric IDs to base64-encoded gids before querying', async () => {
    let receivedId: string | null = null;
    const fetchImpl: FetchLike = async (_url, init) => {
      const body = JSON.parse(init.body ?? '{}') as { variables: { id: string } };
      receivedId = body.variables.id;
      return jsonResponse({
        data: { client: { id: body.variables.id, name: 'Acme' } },
        extensions: {
          cost: {
            actualQueryCost: 5,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 9_995,
              restoreRate: 500,
            },
          },
        },
      });
    };
    const cmd = new GetCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await cmd.execute({ type: 'client', id: '42', json: true });
    spy.mockRestore();
    expect(receivedId).toBeTruthy();
    const decoded = Buffer.from(receivedId as unknown as string, 'base64').toString('utf-8');
    expect(decoded).toBe('gid://Jobber/Client/42');
  });

  it('throws with a usage message when type or id is missing', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
    const cmd = new GetCommand({ context: buildContext(fetchImpl) });
    await expect(cmd.execute({})).rejects.toThrow(/Usage/);
    await expect(cmd.execute({ type: 'job' })).rejects.toThrow(/Usage/);
  });

  it('rejects invalid entity types', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
    const cmd = new GetCommand({ context: buildContext(fetchImpl) });
    await expect(cmd.execute({ type: 'visit', id: 'x' })).rejects.toThrow(/Invalid type/);
  });

  it('throws when the entity is not found', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: { job: null },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 10_000,
              restoreRate: 500,
            },
          },
        },
      });
    const cmd = new GetCommand({ context: buildContext(fetchImpl) });
    await expect(cmd.execute({ type: 'job', id: 'missing', json: true })).rejects.toThrow(
      /not found/,
    );
  });
});
