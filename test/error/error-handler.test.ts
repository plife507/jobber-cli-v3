import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorHandler } from '../../src/error/error-handler.js';
import { SchemaManager } from '../../src/schema/schema-manager.js';

const SDL = `
  type Query { job(id: ID!): Job }
  type Job { id: ID! title: String description: String }
`;

function mgrWithSDL(): SchemaManager {
  const dir = mkdtempSync(join(tmpdir(), 'jobber-cli-err-'));
  const mgr = new SchemaManager({ cacheDir: dir });
  mgr.getCache().saveSchema(SDL);
  return mgr;
}

describe('ErrorHandler.parseError', () => {
  const h = new ErrorHandler();

  it('classifies auth errors from message hints', () => {
    expect(h.parseError({ message: 'unauthenticated user' }).classification).toBe('auth');
    expect(h.parseError({ message: 'HTTP 401' }).classification).toBe('auth');
  });

  it('classifies throttle/rate-limit errors', () => {
    expect(h.parseError({ message: 'Throttled' }).classification).toBe('throttle');
    expect(h.parseError({ message: 'HTTP 429' }).classification).toBe('throttle');
    expect(h.parseError({ message: 'Rate limit exceeded' }).classification).toBe('throttle');
  });

  it('classifies field errors and captures the field + type', () => {
    const p = h.parseError({
      message: `Field 'titel' doesn't exist on type 'Job'`,
    });
    expect(p.classification).toBe('field');
    expect(p.field).toBe('titel');
    expect(p.type).toBe('Job');
  });

  it('classifies type errors', () => {
    const p = h.parseError({ message: `Unknown type 'Jub'` });
    expect(p.classification).toBe('type');
    expect(p.type).toBe('Jub');
  });

  it('classifies argument errors', () => {
    const p = h.parseError({
      message: `Unknown argument 'orderBy' on field 'jobs' of type 'Query'`,
    });
    expect(p.classification).toBe('argument');
    expect(p.field).toBe('orderBy');
    expect(p.type).toBe('Query');
  });

  it('defaults to unknown for unrecognized messages', () => {
    expect(h.parseError({ message: 'Something went sideways' }).classification).toBe('unknown');
  });
});

describe('ErrorHandler.handleError — no SchemaManager', () => {
  const h = new ErrorHandler();

  it('returns a throttle recovery even without a schema', async () => {
    const r = await h.handleError({ message: 'Throttled' });
    expect(r.classification).toBe('throttle');
    expect(r.recovery?.action).toBe('wait');
    expect(r.suggestions).toBeUndefined();
  });

  it('returns an auth recovery with refresh command', async () => {
    const r = await h.handleError({ message: 'HTTP 401 Unauthorized' });
    expect(r.classification).toBe('auth');
    expect(r.recovery?.command).toContain('oauth-refresh');
  });

  it('returns a validation recovery with no suggestions when schema absent', async () => {
    const r = await h.handleError({
      message: `Field 'titel' doesn't exist on type 'Job'`,
    });
    expect(r.classification).toBe('field');
    expect(r.recovery?.type).toBe('validation');
    expect(r.suggestions).toBeUndefined();
  });
});

describe('ErrorHandler.handleError — with SchemaManager', () => {
  it('offers field-replacement suggestions for a misspelled field (substring match)', async () => {
    const h = new ErrorHandler({ schemaManager: mgrWithSDL() });
    // `titl` overlaps `title` in the substring filter v2.5 uses.
    const r = await h.handleError({
      message: `Field 'titl' doesn't exist on type 'Job'`,
    });
    expect(r.classification).toBe('field');
    expect(r.suggestions?.hasSuggestions).toBe(true);
    const replacement = r.suggestions?.suggestions?.find(
      (g) => g.type === 'field_replacement',
    );
    expect(replacement?.options?.map((o) => o.name)).toContain('title');
  });

  it('falls back to available_fields when no similar field is found', async () => {
    const h = new ErrorHandler({ schemaManager: mgrWithSDL() });
    const r = await h.handleError({
      message: `Field 'zzzzz' doesn't exist on type 'Job'`,
    });
    expect(r.classification).toBe('field');
    const available = r.suggestions?.suggestions?.find((g) => g.type === 'available_fields');
    expect(available?.options?.map((o) => o.name)).toEqual(
      expect.arrayContaining(['id', 'title', 'description']),
    );
  });

  it('offers type-replacement suggestions for a misspelled type (fuzzy prefix)', async () => {
    const h = new ErrorHandler({ schemaManager: mgrWithSDL() });
    const r = await h.handleError({
      message: `Unknown type 'Jo'`,
    });
    expect(r.classification).toBe('type');
    const replacement = r.suggestions?.suggestions?.find(
      (g) => g.type === 'type_replacement',
    );
    expect(replacement?.options?.map((o) => o.name)).toContain('Job');
  });

  it('never throws when the schema manager itself explodes', async () => {
    const broken = {
      getAnalysis: async () => {
        throw new Error('schema load failure');
      },
    } as unknown as SchemaManager;
    const h = new ErrorHandler({ schemaManager: broken });
    const r = await h.handleError({
      message: `Field 'titel' doesn't exist on type 'Job'`,
    });
    expect(r.classification).toBe('field');
    expect(r.suggestions).toBeUndefined();
  });
});
