import { describe, expect, it } from 'vitest';
import {
  WRITES_REFUSAL_MESSAGE,
  WritesDisabledError,
  requireWritesEnabled,
} from '../../src/commands/writes-gate.js';

describe('requireWritesEnabled', () => {
  it('throws WritesDisabledError with the canonical message when disabled', () => {
    expect(() => requireWritesEnabled({ JOBBER_WRITES_ENABLED: false })).toThrow(
      WritesDisabledError,
    );
    try {
      requireWritesEnabled({ JOBBER_WRITES_ENABLED: false });
    } catch (err) {
      expect((err as Error).message).toBe(WRITES_REFUSAL_MESSAGE);
    }
  });

  it('does nothing when enabled', () => {
    expect(() => requireWritesEnabled({ JOBBER_WRITES_ENABLED: true })).not.toThrow();
  });

  it('canonical message mentions the env var', () => {
    expect(WRITES_REFUSAL_MESSAGE).toContain('JOBBER_WRITES_ENABLED');
  });
});
