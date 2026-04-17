import { describe, expect, it } from 'vitest';
import { SchemaAnalyzer } from '../../src/schema/schema-analyzer.js';

const SDL = `
  type Query {
    jobs(first: Int, after: String, filter: JobFilterAttributes): JobConnection!
    job(id: ID!): Job
  }
  type Job {
    id: ID!
    title: String
    customFields: [CustomFieldUnion!]
  }
  type JobConnection {
    nodes: [Job!]!
  }
  input JobFilterAttributes {
    status: String
  }
  enum JobStatus {
    ACTIVE
    ARCHIVED
  }
  union CustomFieldUnion = CustomFieldText | CustomFieldNumeric
  type CustomFieldText {
    id: ID!
    label: String!
    valueText: String
  }
  type CustomFieldNumeric {
    id: ID!
    label: String!
    valueNumeric: Float
    unit: String
  }
`;

describe('SchemaAnalyzer', () => {
  const analyzer = new SchemaAnalyzer();

  it('extracts queries, splits connections from single-object roots', () => {
    const a = analyzer.analyze(SDL);
    expect(a.queries.map((q) => q.name).sort()).toEqual(['job', 'jobs']);
    expect(a.connections).toContain('jobs');
    expect(a.singleObjects).toContain('job');
  });

  it('indexes named types and records their kind/fields', () => {
    const a = analyzer.analyze(SDL);
    expect(a.types.Job).toBeDefined();
    expect(a.types.Job?.fields?.find((f) => f.name === 'title')).toBeTruthy();
    expect(a.enums).toContain('JobStatus');
    expect(a.inputTypes).toContain('JobFilterAttributes');
  });

  it('picks out custom-field types and their value fields', () => {
    const a = analyzer.analyze(SDL);
    const names = a.customFieldTypes.map((t) => t.name).sort();
    expect(names).toEqual(['CustomFieldNumeric', 'CustomFieldText']);
    const numeric = a.customFieldTypes.find((t) => t.name === 'CustomFieldNumeric');
    expect(numeric?.valueField?.name).toBe('valueNumeric');
  });

  it('finds entities that support customFields', () => {
    const a = analyzer.analyze(SDL);
    const names = a.entitiesWithCustomFields.map((e) => e.name);
    expect(names).toContain('Job');
  });

  it('getSuggestions ranks exact → starts → contains → fuzzy', () => {
    const a = analyzer.analyze(SDL);
    const s = analyzer.getSuggestions(a, 'job');
    // Exact-match "Job" should be first.
    expect(s[0]?.name).toBe('Job');
    // "JobConnection" contains "job".
    expect(s.some((x) => x.name === 'JobConnection')).toBe(true);
    // Query named "job" is also suggested.
    expect(s.some((x) => x.type === 'query' && x.name === 'job')).toBe(true);
  });

  it('generates a markdown document with a Summary section', () => {
    const a = analyzer.analyze(SDL);
    const md = analyzer.generateMarkdown(a);
    expect(md).toContain('## Summary');
    expect(md).toContain('Total Queries');
  });
});
