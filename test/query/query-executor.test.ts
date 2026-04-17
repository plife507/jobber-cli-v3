import { describe, expect, it } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { type ErrorHandler, QueryExecutor } from '../../src/query/query-executor.js';

function jsonResponse(body: unknown, ok = true, status = 200): FetchResponseLike {
  return {
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  };
}

const throttled = (cur: number) => ({
  extensions: {
    cost: {
      actualQueryCost: 1,
      throttleStatus: { maximumAvailable: 10_000, currentlyAvailable: cur, restoreRate: 500 },
    },
  },
});

function makeClient(fetchImpl: FetchLike): JobberClient {
  return new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token: 't',
    fetchImpl,
  });
}

describe('QueryExecutor', () => {
  it('returns success with data on a clean GraphQL response', async () => {
    const client = makeClient(async () =>
      jsonResponse({ data: { me: { id: '1' } }, ...throttled(9_999) }),
    );
    const ex = new QueryExecutor(client);
    const r = await ex.execute<{ me: { id: string } }>('query { me { id } }');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.me.id).toBe('1');
  });

  it('returns a failure envelope with errorDetails on GraphQL errors', async () => {
    const client = makeClient(async () =>
      jsonResponse({
        data: null,
        errors: [{ message: 'Field "foo" does not exist on type Query' }],
        ...throttled(10_000),
      }),
    );
    const ex = new QueryExecutor(client);
    const r = await ex.execute('query { foo }');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors[0]).toMatchObject({ message: expect.stringContaining('foo') });
      expect(r.errorDetails).toHaveLength(1);
    }
  });

  it('invokes a custom ErrorHandler for each error and surfaces suggestions', async () => {
    const handler: ErrorHandler = {
      handleError: async (err) => ({
        classification: 'schema',
        message: err instanceof Error ? err.message : (err as { message: string }).message,
        suggestions: {
          hasSuggestions: true,
          suggestions: [
            {
              type: 'field_replacement',
              message: 'Did you mean one of these fields on Foo?',
              options: [{ name: 'bar' }],
            },
          ],
        },
      }),
    };
    const client = makeClient(async () =>
      jsonResponse({
        data: null,
        errors: [{ message: 'Unknown field foo' }],
        ...throttled(10_000),
      }),
    );
    const ex = new QueryExecutor(client, handler);
    const r = await ex.execute('query { foo }');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.suggestions).toHaveLength(1);
      expect(r.suggestions[0]?.suggestions?.[0]?.options?.[0]?.name).toBe('bar');
    }
  });

  it('converts thrown transport errors into failure results', async () => {
    const client = makeClient(async () => jsonResponse('Internal server error', false, 500));
    const ex = new QueryExecutor(client);
    const r = await ex.execute('query { x }');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors[0]).toMatch(/HTTP 500/);
    }
  });
});
