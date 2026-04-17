import { buildSchema } from 'graphql';
import { describe, expect, it } from 'vitest';
import { QueryValidator, type SchemaSource } from '../../src/query/query-validator.js';

describe('QueryValidator.validateSyntax', () => {
  const v = new QueryValidator();

  it('accepts a syntactically valid query', () => {
    const r = v.validateSyntax('query { me { id } }');
    expect(r.valid).toBe(true);
  });

  it('rejects empty or non-string input', () => {
    expect(v.validateSyntax('').valid).toBe(false);
    // @ts-expect-error — runtime guard
    expect(v.validateSyntax(null).valid).toBe(false);
  });

  it('reports parse errors with a line/column hint', () => {
    const r = v.validateSyntax('query { me { }');
    expect(r.valid).toBe(false);
    expect(r.errors?.join(' ')).toMatch(/line/);
  });
});

describe('QueryValidator.validate (with schema source)', () => {
  const schema = buildSchema(`
    type Query { me: User }
    type User { id: ID! name: String }
  `);
  const source: SchemaSource = { getSchema: () => schema };

  it('accepts queries that match the schema', async () => {
    const v = new QueryValidator(source);
    const r = await v.validate('query { me { id } }', true);
    expect(r.valid).toBe(true);
  });

  it('rejects queries that reference unknown fields', async () => {
    const v = new QueryValidator(source);
    const r = await v.validate('query { me { notARealField } }', true);
    expect(r.valid).toBe(false);
    expect(r.errors?.some((e) => /notARealField/.test(e))).toBe(true);
  });

  it('falls back to syntax-only validation (with warning) when no schema source is available', async () => {
    const v = new QueryValidator(null);
    const r = await v.validate('query { me { id } }', true);
    expect(r.valid).toBe(true);
    expect(r.warning).toMatch(/Schema not available/);
  });
});
