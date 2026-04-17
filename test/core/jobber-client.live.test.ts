import { describe, expect, it } from 'vitest';
import { JobberClient } from '../../src/core/jobber-client.js';
import type { Query } from '../../src/types/graphql.js';
import { loadConfig } from '../../src/core/config.js';
import { getAccessToken } from '../../src/utils/oauth-subprocess.js';

// Gated by JOBBER_TEST_LIVE=1. Hits a cheap read-only query against the real
// Jobber endpoint using the shared OAuth manager. Skipped in default CI.
const live = process.env.JOBBER_TEST_LIVE === '1';

describe.skipIf(!live)('JobberClient (LIVE)', () => {
  it('fetches the authenticated account id', async () => {
    const config = loadConfig();
    const client = new JobberClient({
      endpoint: config.JOBBER_API_URL,
      version: config.JOBBER_API_VERSION,
      token: async () => getAccessToken(),
    });

    const res = await client.executeQuery<Pick<Query, 'account'>>(
      'query LiveAccount { account { id } }',
      null,
      50,
      { silent: true },
    );
    expect(res.hasErrors).toBe(false);
    expect(res.data?.account?.id).toBeTruthy();
    expect(res.throttleStatus.maximumAvailable).toBeGreaterThan(0);
  }, 30_000);
});
