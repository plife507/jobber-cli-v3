import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { NotesCommand } from '../../src/commands/notes.js';
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

describe('NotesCommand', () => {
  it('sorts notes newest-first across jobs and respects max-notes', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: {
          jobs: {
            nodes: [
              {
                id: 'j1',
                jobNumber: 101,
                title: 'A',
                client: { name: 'Acme' },
                notes: {
                  nodes: [
                    { __typename: 'JobNote', id: 'n1', message: 'older', createdAt: '2025-01-01T00:00:00Z', pinned: false },
                    { __typename: 'JobNote', id: 'n2', message: 'newer', createdAt: '2026-01-01T00:00:00Z', pinned: true },
                  ],
                },
              },
              {
                id: 'j2',
                jobNumber: 102,
                title: 'B',
                client: { name: 'Bravo' },
                notes: {
                  nodes: [
                    { __typename: 'JobNote', id: 'n3', message: 'middle', createdAt: '2025-06-01T00:00:00Z', pinned: false },
                  ],
                },
              },
            ],
          },
        },
        extensions: {
          cost: {
            actualQueryCost: 200,
            throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_800, restoreRate: 500 },
          },
        },
      });
    const cmd = new NotesCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ json: true, limit: 2, 'notes-per-job': 5 });
    spy.mockRestore();
    expect(result.count).toBe(3);
    expect(result.notes[0]?.message).toBe('newer');
    expect(result.notes[2]?.message).toBe('older');
  });

  it('clamps limit to the documented 40-job ceiling', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: { jobs: { nodes: [] } },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_999, restoreRate: 500 },
          },
        },
      });
    const cmd = new NotesCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ json: true, limit: 9999 });
    spy.mockRestore();
    expect(result.count).toBe(0);
  });
});
