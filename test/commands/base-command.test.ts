import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { BaseCommand, type BaseCommandContext } from '../../src/commands/base-command.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
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

function buildContext(): BaseCommandContext {
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

class ThrowingCommand extends BaseCommand<void, unknown> {
  cleanupRan = false;
  runRan = false;
  protected override async run(): Promise<void> {
    this.runRan = true;
    throw new Error('boom');
  }
  protected override async cleanup(): Promise<void> {
    this.cleanupRan = true;
  }
}

class HappyCommand extends BaseCommand<string, unknown> {
  cleanupRan = false;
  protected override async run(): Promise<string> {
    return 'ok';
  }
  protected override async cleanup(): Promise<void> {
    this.cleanupRan = true;
  }
}

describe('BaseCommand lifecycle', () => {
  it('runs cleanup even when run() throws', async () => {
    const cmd = new ThrowingCommand({ context: buildContext() });
    await expect(cmd.execute({})).rejects.toThrow(/boom/);
    expect(cmd.runRan).toBe(true);
    expect(cmd.cleanupRan).toBe(true);
  });

  it('runs cleanup on the happy path and returns the result', async () => {
    const cmd = new HappyCommand({ context: buildContext() });
    const result = await cmd.execute({});
    expect(result).toBe('ok');
    expect(cmd.cleanupRan).toBe(true);
  });

  it('routes thrown errors through ErrorHandler before rethrowing', async () => {
    const ctx = buildContext();
    const spy = vi.spyOn(ctx.errorHandler, 'handleError');
    const cmd = new ThrowingCommand({ context: ctx });
    await expect(cmd.execute({})).rejects.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
