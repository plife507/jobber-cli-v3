import { describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { JobNoteCommand } from '../../src/commands/job-note.js';
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

describe('JobNoteCommand — writes gate (default off)', () => {
  it('refuses create without calling the API', async () => {
    let fetchCalls = 0;
    const fetchImpl: FetchLike = async () => {
      fetchCalls++;
      return jsonResponse({ data: null, extensions: throttleEnv });
    };
    const cmd = new JobNoteCommand({ context: buildContext(fetchImpl, false) });
    await expect(
      cmd.execute({ action: 'create', job: 'Z2lkOi8v-job-x', message: 'hi' }),
    ).rejects.toBeInstanceOf(WritesDisabledError);
    expect(fetchCalls).toBe(0);
  });

  it('refuses edit and delete without calling the API', async () => {
    let fetchCalls = 0;
    const fetchImpl: FetchLike = async () => {
      fetchCalls++;
      return jsonResponse({ data: null, extensions: throttleEnv });
    };
    const ctx = buildContext(fetchImpl, false);
    const edit = new JobNoteCommand({ context: ctx });
    await expect(
      edit.execute({ action: 'edit', 'note-id': 'n-1', message: 'x' }),
    ).rejects.toBeInstanceOf(WritesDisabledError);
    const del = new JobNoteCommand({ context: ctx });
    await expect(del.execute({ action: 'delete', 'note-id': 'n-1' })).rejects.toBeInstanceOf(
      WritesDisabledError,
    );
    expect(fetchCalls).toBe(0);
  });
});

describe('JobNoteCommand — writes gate enabled', () => {
  it('sends the create mutation to the client when JOBBER_WRITES_ENABLED=1', async () => {
    const bodies: string[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      bodies.push(init.body ?? '');
      return jsonResponse({
        data: {
          jobCreateNote: {
            job: { id: 'Z2lkOi8v-job-x', jobNumber: 42 },
            jobNote: { id: 'Z2lkOi8v-note-y', message: 'hi', pinned: false, createdAt: null },
            userErrors: [],
          },
        },
        extensions: throttleEnv,
      });
    };
    const cmd = new JobNoteCommand({ context: buildContext(fetchImpl, true) });
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const result = await cmd.execute({
      action: 'create',
      job: 'Z2lkOi8v-job-x',
      message: 'hi',
      json: true,
    });
    spy.mockRestore();
    expect(result.action).toBe('create');
    const sent = bodies[0] ?? '';
    expect(sent).toContain('jobCreateNote');
    expect(sent).toContain('hi');
  });
});

describe('JobNoteCommand — list (read)', () => {
  it('runs without the writes gate when listing notes', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: {
          job: {
            id: 'Z2lkOi8v-job-x',
            jobNumber: 42,
            title: 'Weekly service',
            notes: { nodes: [{ __typename: 'JobNote', id: 'n', message: 'hi', pinned: false }] },
          },
        },
        extensions: throttleEnv,
      });
    const cmd = new JobNoteCommand({ context: buildContext(fetchImpl, false) });
    const result = await cmd.execute({ action: 'list', job: 'Z2lkOi8v-job-x' });
    expect(result.action).toBe('list');
    expect(result.notes?.length).toBe(1);
  });
});
