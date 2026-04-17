import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';

const SDL = `
  type Query { job(id: ID!): Job }
  type Job { id: ID! title: String }
`;

function clientWithFetch(fetchImpl: FetchLike): JobberClient {
  return new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token: 't',
    fetchImpl,
  });
}

function jsonResponse(body: unknown, ok = true, status = 200): FetchResponseLike {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

describe('SchemaManager', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'jobber-cli-schema-mgr-'));
  });

  it('does not fetch when the schema is already cached (no introspection)', async () => {
    const spy = vi.fn(async () => {
      throw new Error('fetch should not be called');
    });
    const client = clientWithFetch(spy);
    const mgr = new SchemaManager({ client, cacheDir: dir });
    mgr.getCache().saveSchema(SDL);

    const path = await mgr.fetchSchema();
    expect(path).toMatch(/jobber_schema\.graphql$/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('analyzeSchema uses the cached SDL, writes the analysis file', async () => {
    const mgr = new SchemaManager({ cacheDir: dir });
    mgr.getCache().saveSchema(SDL);
    const a = await mgr.analyzeSchema();
    expect(a.queries.map((q) => q.name)).toContain('job');
    expect(mgr.getCache().hasAnalysis()).toBe(true);
    // Second call uses memoized analysis — no recompute.
    const spyAnalyze = vi.spyOn(
      // biome-ignore lint/suspicious/noExplicitAny: targeted runtime spy
      mgr as any,
      'analyzeSchema',
    );
    const cached = mgr.getCachedAnalysis();
    expect(cached?.queries.map((q) => q.name)).toContain('job');
    spyAnalyze.mockRestore();
  });

  it('implements SchemaSource — getSchema returns a compiled GraphQLSchema', () => {
    const mgr = new SchemaManager({ cacheDir: dir });
    mgr.getCache().saveSchema(SDL);
    const schema = mgr.getSchema();
    expect(schema).not.toBeNull();
    expect(schema?.getQueryType()?.name).toBe('Query');
  });

  it('getSchema returns null when no SDL is cached', () => {
    const mgr = new SchemaManager({ cacheDir: dir });
    expect(mgr.getSchema()).toBeNull();
  });

  it('getTypeHelp returns suggestions for an unknown type (fuzzy match)', async () => {
    const mgr = new SchemaManager({ cacheDir: dir });
    mgr.getCache().saveSchema(SDL);
    // 2-char prefix triggers the fuzzy PascalCase word-start match; `Jo` → `Job`.
    const help = await mgr.getTypeHelp('Jo');
    expect(help.found).toBe(false);
    if (!help.found) {
      expect(help.suggestions.some((s) => s.type === 'type' && s.name === 'Job')).toBe(true);
    }
  });

  it('fetchSchema calls the introspection query when no cache exists', async () => {
    const fetchImpl: FetchLike = async () => {
      // Minimal shape buildClientSchema accepts.
      return jsonResponse({
        data: {
          __schema: {
            queryType: { name: 'Query' },
            types: [
              {
                kind: 'OBJECT',
                name: 'Query',
                fields: [
                  {
                    name: 'me',
                    args: [],
                    type: { kind: 'SCALAR', name: 'String', ofType: null },
                    isDeprecated: false,
                  },
                ],
                interfaces: [],
              },
              { kind: 'SCALAR', name: 'String' },
              { kind: 'SCALAR', name: 'Boolean' },
              { kind: 'SCALAR', name: 'Int' },
              { kind: 'SCALAR', name: 'Float' },
              { kind: 'SCALAR', name: 'ID' },
            ],
            directives: [],
          },
        },
        extensions: {
          cost: {
            actualQueryCost: 45_000,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 10_000,
              restoreRate: 500,
            },
          },
        },
      });
    };
    const client = clientWithFetch(fetchImpl);
    // Seed budget so the 45k cost doesn't trigger a wait.
    await client.throttleManager.updateStatus({
      extensions: {
        cost: {
          throttleStatus: {
            maximumAvailable: 100_000,
            currentlyAvailable: 100_000,
            restoreRate: 500,
          },
        },
      },
    });
    const mgr = new SchemaManager({ client, cacheDir: dir });
    const path = await mgr.fetchSchema({ silent: true });
    expect(path).toMatch(/jobber_schema\.graphql$/);
    expect(mgr.getCache().hasSchema()).toBe(true);
    expect(mgr.getCache().hasIntrospection()).toBe(true);
  });
});
