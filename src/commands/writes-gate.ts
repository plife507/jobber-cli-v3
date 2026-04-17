import type { Config } from '../core/config.js';

// Workspace rule #5: "Never bypass writes-disabled gate. Mutations require
// `JOBBER_WRITES_ENABLED=1`." Every mutation command routes through
// `requireWritesEnabled(config)` before calling `executeQuery` with mutation
// text. The grep gate in Phase 5a's evidence proves this wrapping.

export const WRITES_REFUSAL_MESSAGE =
  'Mutations are disabled. Set JOBBER_WRITES_ENABLED=1 in your .env to enable writes against the Jobber API.';

export class WritesDisabledError extends Error {
  constructor(message: string = WRITES_REFUSAL_MESSAGE) {
    super(message);
    this.name = 'WritesDisabledError';
  }
}

/** Throw the standard refusal error if the writes gate is not enabled. */
export function requireWritesEnabled(config: Pick<Config, 'JOBBER_WRITES_ENABLED'>): void {
  if (!config.JOBBER_WRITES_ENABLED) {
    throw new WritesDisabledError();
  }
}
