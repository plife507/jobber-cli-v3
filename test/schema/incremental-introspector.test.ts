import { describe, expect, it } from 'vitest';
import {
  type FetchLike,
  type FetchResponseLike,
  JobberClient,
} from '../../src/core/jobber-client.js';
import {
  BATCH_PROFILES,
  IncrementalIntrospector,
} from '../../src/schema/incremental-introspector.js';

function jsonResponse(body: unknown): FetchResponseLike {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

function clientReturning(typeName: string | null): JobberClient {
  const fetchImpl: FetchLike = async () =>
    jsonResponse({
      data: { __type: typeName === null ? null : { name: typeName, kind: 'OBJECT' } },
      extensions: {
        cost: {
          actualQueryCost: 1,
          throttleStatus: {
            maximumAvailable: 10_000,
            currentlyAvailable: 10_000,
            restoreRate: 500,
          },
        },
      },
    });
  return new JobberClient({
    endpoint: 'https://api.test/graphql',
    version: 'v',
    token: 't',
    fetchImpl,
  });
}

describe('IncrementalIntrospector', () => {
  it('getTypesForProfile resolves static profiles to their type list', () => {
    const ii = new IncrementalIntrospector(clientReturning(null));
    const entities = ii.getTypesForProfile('entities');
    expect(entities).toEqual(BATCH_PROFILES.entities.types);
  });

  it('getTypesForProfile filters dynamic profiles against cached types', () => {
    const ii = new IncrementalIntrospector(clientReturning(null));
    const names = ii.getTypesForProfile('custom-fields', [
      { name: 'CustomFieldText', kind: 'OBJECT' },
      { name: 'Job', kind: 'OBJECT' },
    ]);
    expect(names).toEqual(['CustomFieldText']);
  });

  it('throws on unknown profile', () => {
    const ii = new IncrementalIntrospector(clientReturning(null));
    expect(() => ii.getTypesForProfile('nope')).toThrow(/Unknown batch profile/);
  });

  it('introspectType returns the type payload when found', async () => {
    const ii = new IncrementalIntrospector(clientReturning('Job'));
    const t = await ii.introspectType('Job');
    expect(t?.name).toBe('Job');
  });

  it('introspectType returns null when the API reports no such type', async () => {
    const ii = new IncrementalIntrospector(clientReturning(null));
    expect(await ii.introspectType('Nonexistent')).toBeNull();
  });

  it('introspectBatch aggregates updated / notFound results', async () => {
    let call = 0;
    const fetchImpl: FetchLike = async () => {
      call++;
      const name = call === 1 ? 'Alpha' : null;
      return jsonResponse({
        data: { __type: name === null ? null : { name, kind: 'OBJECT' } },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 10_000,
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
    const ii = new IncrementalIntrospector(client);
    const res = await ii.introspectBatch(['Alpha', 'Missing']);
    expect(res.updated.map((t) => t.name)).toEqual(['Alpha']);
    expect(res.notFound).toEqual(['Missing']);
  });

  it('mergeTypes replaces existing entries by name and appends new ones', () => {
    const existing = {
      __schema: {
        types: [
          { kind: 'OBJECT', name: 'Job' },
          { kind: 'OBJECT', name: 'Client' },
        ],
      },
    };
    const merged = IncrementalIntrospector.mergeTypes(existing as never, [
      { kind: 'OBJECT', name: 'Job' },
      { kind: 'OBJECT', name: 'Quote' },
    ]);
    const names = (merged.__schema as { types: Array<{ name: string }> }).types.map(
      (t) => t.name,
    );
    expect(names).toEqual(['Job', 'Client', 'Quote']);
    expect(
      (merged.__schema as { _incrementalUpdate: { typesAdded: number; typesReplaced: number } })
        ._incrementalUpdate,
    ).toMatchObject({ typesAdded: 1, typesReplaced: 1 });
  });

  it('mergeTypes does not mutate the input payload', () => {
    const existing = {
      __schema: {
        types: [{ kind: 'OBJECT', name: 'Job' }],
      },
    };
    const originalTypesRef = existing.__schema.types;
    IncrementalIntrospector.mergeTypes(existing as never, [
      { kind: 'OBJECT', name: 'Client' },
    ]);
    // Same array reference, same contents — no in-place mutation.
    expect(existing.__schema.types).toBe(originalTypesRef);
    expect(existing.__schema.types.map((t) => t.name)).toEqual(['Job']);
  });

  it('runProfiles orchestrates multiple profiles and aggregates results', async () => {
    // custom-fields (dynamic): CustomFieldText resolves successfully.
    // roots (static): Query succeeds, Mutation returns null → notFound.
    const fetchImpl: FetchLike = async (_url, init) => {
      const body = JSON.parse(init.body ?? '{}') as { variables?: { name?: string } };
      const name = body.variables?.name;
      const returned =
        name === 'CustomFieldText' || name === 'Query' ? { name, kind: 'OBJECT' } : null;
      return jsonResponse({
        data: { __type: returned },
        extensions: {
          cost: {
            actualQueryCost: 1,
            throttleStatus: {
              maximumAvailable: 10_000,
              currentlyAvailable: 10_000,
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
    const ii = new IncrementalIntrospector(client);
    const seenProfiles: string[] = [];
    const result = await ii.runProfiles(
      ['custom-fields', 'roots'],
      [
        { name: 'CustomFieldText', kind: 'OBJECT' },
        { name: 'Job', kind: 'OBJECT' }, // filtered out by the dynamic selector
      ],
      (_cur, _total, _name, profile) => {
        if (profile && !seenProfiles.includes(profile)) seenProfiles.push(profile);
      },
    );
    expect(seenProfiles).toEqual(['custom-fields', 'roots']);
    expect(result.updated.map((t) => t.name).sort()).toEqual([
      'CustomFieldText',
      'Query',
    ]);
    expect(result.notFound).toEqual(['Mutation']);
    expect(result.batches).toHaveLength(2);
    expect(result.batches[0]).toMatchObject({ profile: 'custom-fields', updated: 1 });
    expect(result.batches[1]).toMatchObject({ profile: 'roots', updated: 1, notFound: 1 });
  });
});
