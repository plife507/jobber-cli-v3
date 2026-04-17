import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/core/config.js';

const MIN_ENV = { JOBBER_ACCESS_TOKEN: 'test-token-abcdef' };

// /dev/null exists on Linux/Darwin; readFileSync returns '' → dotenv parses to {}.
// This isolates the test from any ambient .env on disk.
const NO_FILE = '/dev/null';

describe('loadConfig', () => {
  it('returns documented defaults when only the token is provided', () => {
    const cfg = loadConfig({ env: MIN_ENV, envFilePath: NO_FILE });
    expect(cfg.JOBBER_ACCESS_TOKEN).toBe('test-token-abcdef');
    expect(cfg.JOBBER_API_URL).toBe('https://api.getjobber.com/api/graphql');
    expect(cfg.JOBBER_API_VERSION).toBe('2025-04-16');
    expect(cfg.LOG_LEVEL).toBe('info');
    expect(cfg.JOBBER_WRITES_ENABLED).toBe(false);
    expect(cfg.DEBUG).toBe(false);
  });

  it('throws a Zod error with a field-level message when the token is missing', () => {
    let caught: unknown;
    try {
      loadConfig({ env: {}, envFilePath: NO_FILE });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    const msg = (caught as Error).message;
    expect(msg).toMatch(/JOBBER_ACCESS_TOKEN/);
  });

  it('rejects the placeholder token value', () => {
    expect(() =>
      loadConfig({
        env: { JOBBER_ACCESS_TOKEN: 'your_access_token_here' },
        envFilePath: NO_FILE,
      }),
    ).toThrow();
  });

  it('rejects an all-whitespace token', () => {
    expect(() =>
      loadConfig({
        env: { JOBBER_ACCESS_TOKEN: '   ' },
        envFilePath: NO_FILE,
      }),
    ).toThrow();
  });

  describe('JOBBER_WRITES_ENABLED', () => {
    it('is false when the variable is unset', () => {
      const cfg = loadConfig({ env: MIN_ENV, envFilePath: NO_FILE });
      expect(cfg.JOBBER_WRITES_ENABLED).toBe(false);
    });

    it('is false for any value other than the literal string "1"', () => {
      for (const v of ['0', '', 'true', 'false', 'yes', 'on', 'YES', '2', ' 1 ', '1.0']) {
        const cfg = loadConfig({
          env: { ...MIN_ENV, JOBBER_WRITES_ENABLED: v },
          envFilePath: NO_FILE,
        });
        expect(cfg.JOBBER_WRITES_ENABLED, `value=${JSON.stringify(v)}`).toBe(false);
      }
    });

    it('is true only for the literal string "1"', () => {
      const cfg = loadConfig({
        env: { ...MIN_ENV, JOBBER_WRITES_ENABLED: '1' },
        envFilePath: NO_FILE,
      });
      expect(cfg.JOBBER_WRITES_ENABLED).toBe(true);
    });
  });

  it('accepts a custom API URL and version', () => {
    const cfg = loadConfig({
      env: {
        ...MIN_ENV,
        JOBBER_API_URL: 'https://staging.example.com/graphql',
        JOBBER_API_VERSION: '2024-01-01',
      },
      envFilePath: NO_FILE,
    });
    expect(cfg.JOBBER_API_URL).toBe('https://staging.example.com/graphql');
    expect(cfg.JOBBER_API_VERSION).toBe('2024-01-01');
  });

  it('rejects an invalid API URL', () => {
    expect(() =>
      loadConfig({
        env: { ...MIN_ENV, JOBBER_API_URL: 'not-a-url' },
        envFilePath: NO_FILE,
      }),
    ).toThrow();
  });

  it('parses LOG_LEVEL and falls back to info on invalid value', () => {
    const ok = loadConfig({
      env: { ...MIN_ENV, LOG_LEVEL: 'debug' },
      envFilePath: NO_FILE,
    });
    expect(ok.LOG_LEVEL).toBe('debug');

    expect(() =>
      loadConfig({
        env: { ...MIN_ENV, LOG_LEVEL: 'verbose' },
        envFilePath: NO_FILE,
      }),
    ).toThrow();
  });

  it('env-var values take precedence over .env file values', async () => {
    // Write a .env file with one value, then override it via the env bag.
    const { mkdtemp, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = await mkdtemp(join(tmpdir(), 'jobber-cli-config-'));
    const envFilePath = join(dir, '.env');
    await writeFile(
      envFilePath,
      'JOBBER_ACCESS_TOKEN=file-token\nJOBBER_API_VERSION=file-version\n',
    );

    const fileOnly = loadConfig({ env: {}, envFilePath });
    expect(fileOnly.JOBBER_ACCESS_TOKEN).toBe('file-token');
    expect(fileOnly.JOBBER_API_VERSION).toBe('file-version');

    const overridden = loadConfig({
      env: { JOBBER_API_VERSION: '2030-12-31' },
      envFilePath,
    });
    expect(overridden.JOBBER_ACCESS_TOKEN).toBe('file-token');
    expect(overridden.JOBBER_API_VERSION).toBe('2030-12-31');
  });
});
