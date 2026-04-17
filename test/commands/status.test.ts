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
import { StatusCommand } from '../../src/commands/status.js';
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

describe('StatusCommand', () => {
  it('queries __typename then surfaces the refreshed throttle status', async () => {
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      const body = JSON.parse(init.body ?? '{}') as { query: string };
      calls.push(body.query);
      return jsonResponse({
        data: { __typename: 'Query' },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 7_500,
              restoreRate: 500,
            },
          },
        },
      });
    };
    const context = buildContext(fetchImpl);
    const cmd = new StatusCommand({ context });
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ json: true });
    writeSpy.mockRestore();
    expect(calls[0]).toContain('__typename');
    expect(result.throttleStatus.currentlyAvailable).toBe(7_500);
    expect(result.usagePercent).toBeCloseTo(25);
  });
});
