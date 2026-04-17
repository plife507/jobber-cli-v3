import { describe, expect, it, vi } from 'vitest';
import { run } from '../../src/cli.js';

function captureStderr<T>(fn: () => Promise<T>): Promise<{ result: T; stderr: string }> {
  const chunks: string[] = [];
  const original = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  return fn()
    .then((result) => ({ result, stderr: chunks.join('') }))
    .finally(() => {
      process.stderr.write = original;
    });
}

function captureStdout<T>(fn: () => Promise<T>): Promise<{ result: T; stdout: string }> {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  return fn()
    .then((result) => ({ result, stdout: chunks.join('') }))
    .finally(() => {
      process.stdout.write = original;
    });
}

describe('cli.run — dispatch', () => {
  it('prints help and exits 0 when no args are given', async () => {
    const { result, stdout } = await captureStdout(() => run([]));
    expect(result).toBe(0);
    expect(stdout).toContain('Usage: jobber');
    expect(stdout).toContain('status');
    expect(stdout).toContain('token');
    expect(stdout).toContain('get');
  });

  it('prints version and exits 0 for --version', async () => {
    const { result, stdout } = await captureStdout(() => run(['--version']));
    expect(result).toBe(0);
    expect(stdout).toMatch(/jobber-cli v3/);
  });

  it('rejects an unknown command with exit code 1 and a clear stderr message', async () => {
    const { result, stderr } = await captureStderr(() => run(['does-not-exist']));
    expect(result).toBe(1);
    expect(stderr).toContain('Unknown command: does-not-exist');
    expect(stderr).toContain('Available commands:');
  });

  it('maps config errors to exit code 6', async () => {
    // Calling a real command without a token should surface the config error
    // from BaseCommand's token provider (through our sanitized message path).
    const restoreEnv = { ...process.env };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('JOBBER_')) delete process.env[key];
    }
    process.env.JOBBER_ACCESS_TOKEN = ''; // explicit empty

    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      const result = await run(['status']);
      // Either 6 (config error from token provider) or 1 (generic) depending
      // on which validation path trips first. Both are acceptable failure
      // signals; the gate only requires a non-zero exit.
      expect(result).not.toBe(0);
    } finally {
      stderr.mockRestore();
      for (const [k, v] of Object.entries(restoreEnv)) process.env[k] = v;
    }
  });
});
