import { describe, expect, it } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';
import { ThrottleManager } from '../../src/core/throttle-manager.js';
import { TokenCommand } from '../../src/commands/token.js';
import { createLogger } from '../../src/utils/logger.js';

// Build a JWT-shaped token with a given expiration (seconds since epoch).
function makeJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf-8').toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
      sub: 'user-1',
      account_id: 'acct-42',
      client_id: 'client-xyz',
    }),
    'utf-8',
  ).toString('base64url');
  return `${header}.${payload}.signature`;
}

function buildContext(token: string) {
  const throttleManager = new ThrottleManager();
  const rateLimiter = new RateLimiter(throttleManager);
  const fetchImpl: FetchLike = async () =>
    ({ ok: true, status: 200, text: async () => '', json: async () => ({}) }) as FetchResponseLike;
  const client = new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token,
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
      JOBBER_ACCESS_TOKEN: token,
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

describe('TokenCommand — check', () => {
  it('returns a valid-token summary without emitting the token body', async () => {
    const token = makeJwt(3_600);
    const context = buildContext(token);
    const cmd = new TokenCommand({ context });
    const chunks: string[] = [];
    const writeSpy = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    try {
      const result = await cmd.execute({ action: 'check', json: true });
      expect(result.present).toBe(true);
      expect(result.validFormat).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(result.accountId).toBe('acct-42');
      // Token body must not appear in any emitted chunk.
      const emitted = chunks.join('');
      expect(emitted).not.toContain(token);
    } finally {
      process.stdout.write = writeSpy;
    }
  });

  it('reports expired=true for an expired token', async () => {
    const token = makeJwt(-10);
    const context = buildContext(token);
    const cmd = new TokenCommand({ context });
    const result = await cmd.execute({ action: 'check', json: true });
    expect(result.expired).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('returns present=false when no token is configured', async () => {
    const context = buildContext('dummy-jwt-token-for-client-init');
    // Override config to simulate no token present.
    const ctxWithNoToken = { ...context, config: { ...context.config, JOBBER_ACCESS_TOKEN: '' } };
    const cmd = new TokenCommand({ context: ctxWithNoToken });
    const result = await cmd.execute({ action: 'check', json: true });
    expect(result.present).toBe(false);
  });

  it('rejects non-check actions in Phase 4 with a clear error', async () => {
    const token = makeJwt(3_600);
    const context = buildContext(token);
    const cmd = new TokenCommand({ context });
    await expect(cmd.execute({ action: 'update' })).rejects.toThrow(/not available in Phase 4/);
  });
});
