import { describe, expect, it, vi } from 'vitest';
import { DoctorCommand } from '../../src/commands/doctor.js';

describe('DoctorCommand', () => {
  it('produces a report even when no env file / token is present', async () => {
    // Isolate from the workspace .env. Point loadConfig at a path that
    // definitely does not exist so the doctor surfaces warnings +
    // recommendations regardless of the dev's actual credentials.
    const saved = { ...process.env };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('JOBBER_')) delete process.env[key];
    }
    process.env.JOBBER_ENV_PATH = '/tmp/jobber-cli-v3-does-not-exist.env';
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const cmd = new DoctorCommand();
      const report = await cmd.execute({ json: true });
      expect(report).toHaveProperty('runtime');
      expect(report).toHaveProperty('auth');
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    } finally {
      spy.mockRestore();
      for (const key of Object.keys(process.env)) {
        if (key.startsWith('JOBBER_')) delete process.env[key];
      }
      for (const [k, v] of Object.entries(saved)) process.env[k] = v;
    }
  });
});
