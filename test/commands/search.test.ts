import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';
import { SearchCommand } from '../../src/commands/search.js';
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

const throttleEnv = {
  cost: {
    actualQueryCost: 1,
    throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_999, restoreRate: 500 },
  },
};

describe('SearchCommand', () => {
  it('searches jobs via searchTerm', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: {
          jobs: {
            nodes: [
              { id: 'j1', jobNumber: 101, title: 'A', jobStatus: 'ACTIVE', client: { id: 'c1', name: 'Acme' } },
            ],
          },
        },
        extensions: throttleEnv,
      });
    const cmd = new SearchCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ type: 'jobs', query: '101', json: true });
    spy.mockRestore();
    expect(result.items).toHaveLength(1);
  });

  it('filters clients client-side by name substring', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: {
          clients: {
            nodes: [
              { id: 'c1', name: 'Acme Inc', title: null, emails: null },
              { id: 'c2', name: 'Bravo Co', title: null, emails: null },
            ],
          },
        },
        extensions: throttleEnv,
      });
    const cmd = new SearchCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ type: 'clients', query: 'acme', json: true });
    spy.mockRestore();
    expect(result.items).toHaveLength(1);
  });

  it('rejects invalid types', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
    const cmd = new SearchCommand({ context: buildContext(fetchImpl) });
    await expect(cmd.execute({ type: 'invoices', query: 'x' })).rejects.toThrow(/Invalid type/);
  });
});
