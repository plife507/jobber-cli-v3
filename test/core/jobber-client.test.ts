import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberAuthError,
  JobberClient,
  JobberThrottleExceedsMaxError,
} from '../../src/core/jobber-client.js';

// Minimal fetch-response stub.
function jsonResponse(body: unknown, ok = true, status = 200): FetchResponseLike {
  return {
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body,
  };
}

function withThrottle(status: { currentlyAvailable: number; maximumAvailable?: number; restoreRate?: number }) {
  return {
    extensions: {
      cost: {
        actualQueryCost: 10,
        throttleStatus: {
          maximumAvailable: status.maximumAvailable ?? 10_000,
          currentlyAvailable: status.currentlyAvailable,
          restoreRate: status.restoreRate ?? 500,
        },
      },
    },
  };
}

describe('JobberClient — happy path', () => {
  it('sends a POST to the endpoint with auth headers and returns data', async () => {
    const calls: { url: string; init: Parameters<FetchLike>[1] }[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return jsonResponse({
        data: { me: { id: 'u1' } },
        ...withThrottle({ currentlyAvailable: 9_900 }),
      });
    };

    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: '2025-04-16',
      token: 'tok-abc',
      fetchImpl,
    });
    const res = await client.executeQuery<{ me: { id: string } }>('query Me { me { id } }');
    expect(res.hasErrors).toBe(false);
    expect(res.errors).toBeNull();
    expect(res.data?.me.id).toBe('u1');
    expect(res.throttleStatus.currentlyAvailable).toBe(9_900);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://api.test/graphql');
    const headers = (calls[0]?.init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
    expect(headers['X-JOBBER-GRAPHQL-VERSION']).toBe('2025-04-16');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('resolves a token-provider function per-request', async () => {
    let provided = 0;
    const fetchImpl: FetchLike = async (_url, _init) =>
      jsonResponse({ data: { x: 1 }, ...withThrottle({ currentlyAvailable: 10_000 }) });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: '2025-04-16',
      token: async () => {
        provided++;
        return `tok-${provided}`;
      },
      fetchImpl,
    });
    await client.executeQuery('query { x }');
    await client.executeQuery('query { x }');
    expect(provided).toBe(2);
  });
});

describe('JobberClient — error paths', () => {
  it('throws JobberAuthError on HTTP 401', async () => {
    const fetchImpl: FetchLike = async () => jsonResponse('Unauthorized', false, 401);
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    await expect(client.executeQuery('query { x }')).rejects.toBeInstanceOf(JobberAuthError);
  });

  it('sanitizes token-shaped and path-shaped data in non-401 HTTP errors', async () => {
    const body =
      'Error body: eyJabc.def.ghi and /home/user/secret/path.txt should be masked';
    const fetchImpl: FetchLike = async () => jsonResponse(body, false, 500);
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
      debug: false,
    });
    const err = await client.executeQuery('query { x }').catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    const msg = (err as Error).message;
    expect(msg).toContain('[TOKEN]');
    expect(msg).toContain('[path]');
    expect(msg).not.toContain('eyJabc.def.ghi');
    expect(msg).not.toContain('/home/user/secret/path.txt');
  });

  it('throws JobberAuthError when a GraphQL error indicates auth failure', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: null,
        errors: [{ message: 'Unauthenticated user' }],
        ...withThrottle({ currentlyAvailable: 10_000 }),
      });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    await expect(client.executeQuery('query { x }')).rejects.toBeInstanceOf(JobberAuthError);
  });

  it('returns hasErrors=true for non-auth, non-throttle GraphQL errors', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: null,
        errors: [{ message: 'Field "foo" does not exist on type Bar' }],
        ...withThrottle({ currentlyAvailable: 10_000 }),
      });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    const res = await client.executeQuery('query { foo }');
    expect(res.hasErrors).toBe(true);
    expect(res.errors?.[0]?.message).toMatch(/does not exist/);
  });

  it('throws JobberThrottleExceedsMaxError when requested cost exceeds the budget ceiling', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: null,
        errors: [{ message: 'Throttled' }],
        extensions: {
          cost: {
            requestedQueryCost: 50_000,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 0,
              restoreRate: 500,
            },
          },
        },
      });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    await expect(client.executeQuery('query { huge }')).rejects.toBeInstanceOf(
      JobberThrottleExceedsMaxError,
    );
  });
});

describe('JobberClient — throttle integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('defers (does not reject) a query when budget is insufficient, then proceeds after waiting', async () => {
    let fetchCalls = 0;
    const fetchImpl: FetchLike = async () => {
      fetchCalls++;
      return jsonResponse({
        data: { ok: true },
        ...withThrottle({ currentlyAvailable: 4_000 }),
      });
    };
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    // Seed the throttle state: 0/10000 with 500/s → need 5000 → 11s wait.
    await client.throttleManager.updateStatus({
      extensions: {
        cost: {
          throttleStatus: {
            maximumAvailable: 10_000,
            currentlyAvailable: 0,
            restoreRate: 500,
          },
        },
      },
    });
    const waitingSpy = vi.fn();
    client.throttleManager.on('waiting', waitingSpy);

    const p = client.executeQuery('query { ok }', null, 5_000, { silent: true });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(res.hasErrors).toBe(false);
    expect(waitingSpy).toHaveBeenCalledTimes(1);
    expect(fetchCalls).toBe(1);
  });
});

describe('JobberClient — malformed responses', () => {
  it('tolerates missing extensions (falls back to current throttle status)', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({ data: { x: 1 } });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    const res = await client.executeQuery('query { x }');
    expect(res.hasErrors).toBe(false);
    expect(res.throttleStatus.maximumAvailable).toBe(10_000); // default fallback
  });

  it('ignores a malformed throttleStatus payload', async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        data: { x: 1 },
        extensions: {
          cost: {
            throttleStatus: {
              // numeric fields broken; Zod at boundary rejects → fallback to prior state
              maximumAvailable: 'oops',
              currentlyAvailable: 0,
              restoreRate: 500,
            },
          },
        },
      });
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    const res = await client.executeQuery('query { x }');
    expect(res.hasErrors).toBe(false);
    // Defaults preserved because the malformed payload is rejected at the Zod boundary.
    expect(res.throttleStatus.maximumAvailable).toBe(10_000);
  });
});

describe('JobberClient — retry semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a retryable throttle error and succeeds on the second attempt', async () => {
    let call = 0;
    const fetchImpl: FetchLike = async () => {
      call++;
      if (call === 1) {
        return jsonResponse({
          data: null,
          errors: [{ message: 'Throttled' }],
          extensions: {
            cost: {
              requestedQueryCost: 100,
              throttleStatus: {
                maximumAvailable: 10_000,
                currentlyAvailable: 0,
                restoreRate: 500,
              },
            },
          },
        });
      }
      return jsonResponse({
        data: { ok: true },
        ...withThrottle({ currentlyAvailable: 9_900 }),
      });
    };
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });

    const p = client.executeQuery('query { ok }', null, 100, { silent: true });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(call).toBe(2);
    expect(res.hasErrors).toBe(false);
  });

  it('stops after MAX_RETRY_COUNT retries (3 total attempts) when throttle persists', async () => {
    let call = 0;
    const fetchImpl: FetchLike = async () => {
      call++;
      return jsonResponse({
        data: null,
        errors: [{ message: 'Throttled' }],
        extensions: {
          cost: {
            requestedQueryCost: 100,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 0,
              restoreRate: 500,
            },
          },
        },
      });
    };
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
    });
    const p = client.executeQuery('query { ok }', null, 100, { silent: true });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(call).toBe(3); // initial + 2 retries = 3
    expect(res.hasErrors).toBe(true);
  });

});

describe('JobberClient — network retries (real timers)', () => {
  it('retries a network-layer 429 once, then surfaces the error if it repeats', async () => {
    const { RateLimiter } = await import('../../src/core/rate-limiter.js');
    const { ThrottleManager } = await import('../../src/core/throttle-manager.js');
    let call = 0;
    const fetchImpl: FetchLike = async () => {
      call++;
      throw new Error('HTTP 429: Too Many Requests');
    };
    const throttleManager = new ThrottleManager();
    const client = new JobberClient({
      endpoint: 'https://api.test/graphql',
      version: 'v',
      token: 't',
      fetchImpl,
      throttleManager,
      // Tight pacing so the retry's inter-request delay doesn't dominate the test.
      rateLimiter: new RateLimiter(throttleManager, { minDelayMs: 1, maxDelayMs: 5 }),
    });
    await expect(
      client.executeQuery('query { x }', null, 100, { silent: true }),
    ).rejects.toThrow(/429/);
    expect(call).toBe(2);
  }, 5_000);
});

describe('JobberClient.estimateQueryCost', () => {
  it('returns the introspection cost for __schema queries', () => {
    const client = new JobberClient({
      endpoint: 'x',
      version: 'v',
      token: 't',
      fetchImpl: async () => jsonResponse({ data: {} }),
    });
    expect(client.estimateQueryCost('query { __schema { types { name } } }')).toBe(45_000);
  });

  it('caps the heuristic at 2000 units', () => {
    const client = new JobberClient({
      endpoint: 'x',
      version: 'v',
      token: 't',
      fetchImpl: async () => jsonResponse({ data: {} }),
    });
    const huge = `query { ${'a: b '.repeat(2_000)} }`;
    expect(client.estimateQueryCost(huge)).toBeLessThanOrEqual(2_000);
  });
});
