import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { SchemaCache } from '../../src/schema/schema-cache.js';

const REFERENCE_CACHE = join(
  process.cwd(),
  'reference',
  'jobber-cli',
  '.cache',
);

describe('SchemaCache', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'jobber-cli-schema-cache-'));
  });

  it('creates the cache directory and reports empty state', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    expect(cache.hasSchema()).toBe(false);
    expect(cache.hasAnalysis()).toBe(false);
    expect(cache.hasIntrospection()).toBe(false);
    expect(cache.hasApiMapping()).toBe(false);
  });

  it('round-trips SDL through saveSchema / loadSchema atomically', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    cache.saveSchema('type Query { me: String }');
    expect(cache.hasSchema()).toBe(true);
    expect(cache.loadSchema()).toBe('type Query { me: String }');
    // Atomic rename leaves no .tmp dangling.
    expect(() => readFileSync(`${join(dir, 'jobber_schema.graphql')}.tmp`)).toThrow();
  });

  it('round-trips analysis JSON + optional markdown', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    const analysis = {
      queries: [],
      types: {},
      connections: [],
      singleObjects: [],
      enums: [],
      inputTypes: [],
      customFieldTypes: [],
      entitiesWithCustomFields: [],
      generatedAt: '2026-04-17T00:00:00Z',
    };
    cache.saveAnalysis(analysis, '# analysis');
    expect(cache.hasAnalysis()).toBe(true);
    const loaded = cache.loadAnalysis();
    expect(loaded?.generatedAt).toBe('2026-04-17T00:00:00Z');
    const md = readFileSync(join(dir, 'schema_analysis.md'), 'utf8');
    expect(md).toBe('# analysis');
  });

  it('returns null and logs when JSON is unparseable', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    writeFileSync(join(dir, 'schema_analysis.json'), '{not json');
    expect(cache.loadAnalysis()).toBeNull();
  });

  it('returns null and ignores malformed shapes (passthrough still validates required keys)', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    // Write a shape that is parseable JSON but does not match the schema.
    writeFileSync(join(dir, 'introspection_result.json'), '{"not_a_schema": true}');
    expect(cache.loadIntrospection()).toBeNull();
  });

  it('clear() removes every cached artifact', () => {
    const cache = new SchemaCache({ cacheDir: dir });
    cache.saveSchema('type Query { me: String }');
    cache.saveAnalysis(
      {
        queries: [],
        types: {},
        connections: [],
        singleObjects: [],
        enums: [],
        inputTypes: [],
        customFieldTypes: [],
        entitiesWithCustomFields: [],
      },
      '# md',
    );
    cache.saveIntrospection({ __schema: { types: [] } });
    cache.clear();
    expect(cache.hasSchema()).toBe(false);
    expect(cache.hasAnalysis()).toBe(false);
    expect(cache.hasIntrospection()).toBe(false);
  });

  it('loads the real v2.5-written cache fixtures round-trip (interop gate)', () => {
    const cache = new SchemaCache({ cacheDir: REFERENCE_CACHE });
    expect(cache.hasSchema()).toBe(true);
    const sdl = cache.loadSchema();
    expect(sdl).toBeTruthy();
    expect(sdl?.length).toBeGreaterThan(1_000);
    expect(cache.hasIntrospection()).toBe(true);
    const intro = cache.loadIntrospection();
    expect(intro).not.toBeNull();
    expect(Array.isArray(intro?.__schema?.types)).toBe(true);
    expect((intro?.__schema?.types.length ?? 0)).toBeGreaterThan(10);
  });
});
