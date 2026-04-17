import { describe, expect, it, vi } from 'vitest';
import { DoctorCommand } from '../../src/commands/doctor.js';

describe('DoctorCommand', () => {
  it('produces a report even when no env file / token is present', async () => {
    // Temporarily clear any JOBBER_* env vars so loadConfig() inside doctor
    // fails cleanly and the report surfaces warnings/recommendations.
    const saved = { ...process.env };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('JOBBER_')) delete process.env[key];
    }
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
      for (const [k, v] of Object.entries(saved)) process.env[k] = v;
    }
  });
});
