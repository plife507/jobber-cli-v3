import { describe, expect, it, vi } from 'vitest';
import {
  BaseCommand,
  type BaseCommandContext,
  buildTokenProvider,
} from '../../src/commands/base-command.js';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { ThrottleManager } from '../../src/core/throttle-manager.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';
import { createLogger } from '../../src/utils/logger.js';

function jsonResponse(body: unknown): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

function makeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf-8').toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
    'utf-8',
  ).toString('base64url');
  return `${header}.${payload}.signature`;
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

describe('buildTokenProvider', () => {
  it('automatically refreshes OAuth tokens inside the refresh window', async () => {
    const ctx = buildContext();
    const expiringToken = makeJwt(60);
    const freshToken = makeJwt(3_600);
    const getOAuthAccessToken = vi
      .fn()
      .mockResolvedValueOnce(expiringToken)
      .mockResolvedValueOnce(freshToken);
    const runOAuthCommand = vi.fn().mockResolvedValue({ stdout: '', stderr: '', code: 0 });
    const provider = buildTokenProvider(ctx.config, ctx.logger, {
      getAccessToken: getOAuthAccessToken,
      runOAuthManagerCommand: runOAuthCommand,
    });

    await expect(provider()).resolves.toBe(freshToken);
    await expect(provider()).resolves.toBe(freshToken);
    expect(runOAuthCommand).toHaveBeenCalledOnce();
    expect(runOAuthCommand).toHaveBeenCalledWith('refresh', { stdio: 'pipe' });
    expect(getOAuthAccessToken).toHaveBeenCalledTimes(2);
  });
});

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
