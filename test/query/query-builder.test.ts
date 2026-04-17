import { describe, expect, it } from 'vitest';
import { QueryBuilder } from '../../src/query/query-builder.js';

describe('QueryBuilder.buildEntityQuery', () => {
  it('constructs a Get<Type>(id) query with the given fields', () => {
    const q = QueryBuilder.buildEntityQuery('job', 'Z2lk', ['id', 'title', 'total']);
    expect(q).toContain('query GetJob($id: ID!)');
    expect(q).toContain('job(id: $id)');
    expect(q).toContain('id');
    expect(q).toContain('title');
    expect(q).toContain('total');
  });

  it('rejects invalid identifiers', () => {
    expect(() => QueryBuilder.buildEntityQuery('1bad', 'x', ['id'])).toThrow();
    expect(() => QueryBuilder.buildEntityQuery('bad-name', 'x', ['id'])).toThrow();
  });

  it('rejects empty id or fields', () => {
    expect(() => QueryBuilder.buildEntityQuery('job', '', ['id'])).toThrow();
    expect(() => QueryBuilder.buildEntityQuery('job', 'x', [])).toThrow();
  });
});

describe('QueryBuilder.buildSearchQuery', () => {
  it('omits $filter when no filters are provided', () => {
    const q = QueryBuilder.buildSearchQuery('jobs', {}, ['id']);
    expect(q).not.toContain('$filter');
    expect(q).toContain('jobs(first: $first, after: $after)');
  });

  it('includes $filter when filters are provided', () => {
    const q = QueryBuilder.buildSearchQuery('jobs', { status: 'active' }, ['id']);
    expect(q).toContain('$filter: JobFilterAttributes');
    expect(q).toContain('jobs(filter: $filter, first: $first, after: $after)');
  });

  it('derives the filter type from the entity name', () => {
    expect(QueryBuilder.getFilterType('jobs')).toBe('JobFilterAttributes');
    expect(QueryBuilder.getFilterType('clients')).toBe('ClientFilterAttributes');
  });
});

describe('QueryBuilder.buildCustomFieldsFragment', () => {
  it('builds fragments for a given type array', () => {
    const f = QueryBuilder.buildCustomFieldsFragment(['CustomFieldText']);
    expect(f).toContain('... on CustomFieldText');
    expect(f).toContain('valueText');
    expect(f).toContain('customFields {');
  });

  it('uses default types when given an empty array', () => {
    const f = QueryBuilder.buildCustomFieldsFragment([]);
    expect(f).toContain('CustomFieldText');
    expect(f).toContain('CustomFieldNumeric');
    expect(f).toContain('CustomFieldArea');
  });

  it('reuses pre-generated graphqlFragments when provided', () => {
    const f = QueryBuilder.buildCustomFieldsFragment({
      graphqlFragments: { Text: '... on Foo { x }' },
    });
    expect(f).toContain('... on Foo { x }');
    expect(f).not.toContain('CustomFieldText');
  });

  it('includes unit field only for numeric and area types', () => {
    expect(QueryBuilder.customFieldTypeHasUnit('CustomFieldNumeric')).toBe(true);
    expect(QueryBuilder.customFieldTypeHasUnit('CustomFieldArea')).toBe(true);
    expect(QueryBuilder.customFieldTypeHasUnit('CustomFieldText')).toBe(false);
  });
});

describe('QueryBuilder.buildFieldSelection', () => {
  it('renders scalar fields and nested objects', () => {
    const out = QueryBuilder.buildFieldSelection({
      id: true,
      client: { id: true, name: true },
    });
    expect(out).toContain('id');
    expect(out).toContain('client {');
    expect(out).toContain('name');
    expect(out).toContain('}');
  });
});
