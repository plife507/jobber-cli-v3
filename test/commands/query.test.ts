import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { QueryCommand } from '../../src/commands/query.js';
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

describe('QueryCommand', () => {
  it('runs a literal query and emits JSON', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: { me: { id: '1' } },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_999, restoreRate: 500 },
          },
        },
      });
    const cmd = new QueryCommand({ context: buildContext(fetchImpl) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ query: 'query { me { id } }', validate: false });
    spy.mockRestore();
    expect((result.data as { me: { id: string } }).me.id).toBe('1');
  });

  it('reads a query from a file and executes it', async () => {
    // v2.5 parity: file paths must resolve inside cwd (anti directory-traversal).
    // Tests run with cwd === project root, so create a temp dir under cwd.
    const dir = mkdtempSync(join(process.cwd(), 'test-tmp-query-'));
    const file = join(dir, 'q.graphql');
    writeFileSync(file, 'query { me { id } }\n');
    try {
      const fetchImpl: FetchLike = async () =>
        jsonResponse({
          data: { me: { id: '2' } },
          extensions: {
            cost: {
              actualQueryCost: 1,
              throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_999, restoreRate: 500 },
            },
          },
        });
      const cmd = new QueryCommand({ context: buildContext(fetchImpl) });
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const result = await cmd.execute({ file, validate: false, json: false });
      spy.mockRestore();
      expect((result.data as { me: { id: string } }).me.id).toBe('2');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects variables that are not a JSON object', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
    const cmd = new QueryCommand({ context: buildContext(fetchImpl) });
    await expect(
      cmd.execute({ query: 'query { x }', variables: '[1,2]', validate: false }),
    ).rejects.toThrow(/JSON object/);
  });

  it('throws with a usage hint when neither query nor file is provided', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
    const cmd = new QueryCommand({ context: buildContext(fetchImpl) });
    await expect(cmd.execute({})).rejects.toThrow(/Usage/);
  });
});
