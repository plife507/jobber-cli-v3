import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { SchemaCommand } from '../../src/commands/schema.js';
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

const SDL = `
  type Query { job(id: ID!): Job }
  type Job { id: ID! title: String }
`;

function buildContext() {
  const throttleManager = new ThrottleManager();
  const rateLimiter = new RateLimiter(throttleManager);
  const fetchImpl: FetchLike = async () => jsonResponse({ data: null });
  const client = new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token: 't',
    fetchImpl,
    throttleManager,
    rateLimiter,
  });
  const logger = createLogger({ level: 'info' });
  const dir = mkdtempSync(join(tmpdir(), 'jobber-schema-cmd-'));
  const schemaManager = new SchemaManager({ client, cacheDir: dir });
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

describe('SchemaCommand', () => {
  it('analyzes the cached schema and reports a summary', async () => {
    const ctx = buildContext();
    ctx.schemaManager.getCache().saveSchema(SDL);
    const cmd = new SchemaCommand({ context: ctx });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ subcommand: 'analyze', json: true });
    spy.mockRestore();
    expect(result.subcommand).toBe('analyze');
    const summary = result.result as { types: number; queries: number };
    expect(summary.queries).toBeGreaterThanOrEqual(1);
    expect(summary.types).toBeGreaterThanOrEqual(1);
  });

  it('help surfaces suggestions when the type is unknown', async () => {
    const ctx = buildContext();
    ctx.schemaManager.getCache().saveSchema(SDL);
    const cmd = new SchemaCommand({ context: ctx });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({ subcommand: 'help', type: 'Jo', json: true });
    spy.mockRestore();
    const payload = result.result as { found: boolean };
    expect(payload.found).toBe(false);
  });

  it('rejects an unknown subcommand', async () => {
    const ctx = buildContext();
    const cmd = new SchemaCommand({ context: ctx });
    await expect(cmd.execute({ subcommand: 'bogus' })).rejects.toThrow(/Unknown schema subcommand/);
  });

  it('rejects `help` without a type', async () => {
    const ctx = buildContext();
    ctx.schemaManager.getCache().saveSchema(SDL);
    const cmd = new SchemaCommand({ context: ctx });
    await expect(cmd.execute({ subcommand: 'help' })).rejects.toThrow(/Usage: jobber schema help/);
  });
});
