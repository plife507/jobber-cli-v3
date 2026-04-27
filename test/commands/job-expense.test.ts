import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { JobExpenseCommand } from '../../src/commands/job-expense.js';
import { QueryExecutor } from '../../src/query/query-executor.js';
import { RateLimiter } from '../../src/core/rate-limiter.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';
import { ThrottleManager } from '../../src/core/throttle-manager.js';
import { WritesDisabledError } from '../../src/commands/writes-gate.js';
import { createLogger } from '../../src/utils/logger.js';

function jsonResponse(body: unknown): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

const throttleEnv = {
  cost: {
    actualQueryCost: 1,
    throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: 9_999, restoreRate: 500 },
  },
};

function buildContext(fetchImpl: FetchLike, writesEnabled: boolean) {
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
      JOBBER_WRITES_ENABLED: writesEnabled,
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

describe('JobExpenseCommand — writes gate', () => {
  it('refuses create/edit/delete without calling the API', async () => {
    let fetchCalls = 0;
    const fetchImpl: FetchLike = async () => {
      fetchCalls++;
      return jsonResponse({ data: null, extensions: throttleEnv });
    };
    const ctx = buildContext(fetchImpl, false);
    const cmd1 = new JobExpenseCommand({ context: ctx });
    await expect(
      cmd1.execute({
        action: 'create',
        job: 'Z2lkOi8v-job-x',
        title: 'gas',
        date: '2026-04-17T00:00:00Z',
        total: 42.5,
      }),
    ).rejects.toBeInstanceOf(WritesDisabledError);
    const cmd2 = new JobExpenseCommand({ context: ctx });
    await expect(
      cmd2.execute({ action: 'edit', 'expense-id': 'e-1', title: 'fix' }),
    ).rejects.toBeInstanceOf(WritesDisabledError);
    const cmd3 = new JobExpenseCommand({ context: ctx });
    await expect(
      cmd3.execute({ action: 'delete', 'expense-id': 'e-1' }),
    ).rejects.toBeInstanceOf(WritesDisabledError);
    expect(fetchCalls).toBe(0);
  });

  it('sends the create mutation when enabled', async () => {
    const bodies: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      bodies.push(init.body ?? '');
      return jsonResponse({
        data: {
          expenseCreate: {
            expense: {
              id: 'e-1',
              title: 'gas',
              description: null,
              date: '2026-04-17T00:00:00Z',
              total: 42.5,
              linkedJob: { id: 'Z2lkOi8v-job-x', jobNumber: 42 },
              reimbursableTo: null,
            },
            userErrors: [],
          },
        },
        extensions: throttleEnv,
      });
    };
    const cmd = new JobExpenseCommand({ context: buildContext(fetchImpl, true) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({
      action: 'create',
      job: 'Z2lkOi8v-job-x',
      title: 'gas',
      date: '2026-04-17T00:00:00Z',
      total: 42.5,
      json: true,
    });
    spy.mockRestore();
    expect(result.action).toBe('create');
    expect(bodies[0] ?? '').toContain('expenseCreate');
  });

  it('normalizes date-only inputs to midday UTC to avoid local off-by-one shifts', async () => {
    const bodies: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      bodies.push(init.body ?? '');
      return jsonResponse({
        data: {
          expenseCreate: {
            expense: {
              id: 'e-1',
              title: 'gas',
              description: null,
              date: '2026-04-17T12:00:00Z',
              total: 42.5,
              linkedJob: { id: 'Z2lkOi8v-job-x', jobNumber: 42 },
              reimbursableTo: null,
            },
            userErrors: [],
          },
        },
        extensions: throttleEnv,
      });
    };
    const cmd = new JobExpenseCommand({ context: buildContext(fetchImpl, true) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await cmd.execute({
      action: 'create',
      job: 'Z2lkOi8v-job-x',
      title: 'gas',
      date: '2026-04-17',
      total: 42.5,
      json: true,
    });
    spy.mockRestore();
    expect(bodies[0] ?? '').toContain('2026-04-17T12:00:00Z');
  });

  it('rejects invalid --total values', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse({ data: null, extensions: throttleEnv });
    const cmd = new JobExpenseCommand({ context: buildContext(fetchImpl, true) });
    await expect(
      cmd.execute({
        action: 'create',
        job: 'Z2lkOi8v-job-x',
        title: 't',
        date: 'd',
        total: 'nan' as unknown as number,
      }),
    ).rejects.toThrow(/Invalid total/);
  });
});
