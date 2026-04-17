import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import {
  JwtTokenSchema,
  OAuthSubprocessError,
  TokenCacheSchema,
  getAccessToken,
} from '../../src/utils/oauth-subprocess.js';

// A minimal ChildProcess stand-in. Emits data on the streams and 'close' to
// drive the spawn contract that getAccessToken expects.
class FakeChild extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  killed = false;
  kill(_signal?: NodeJS.Signals | number): boolean {
    this.killed = true;
    return true;
  }
}

function makeSpawn(setup: (child: FakeChild) => void): typeof import('node:child_process').spawn {
  return ((..._args: unknown[]) => {
    const child = new FakeChild();
    // Defer setup to the next tick so listeners attach first.
    queueMicrotask(() => setup(child));
    return child as unknown as ReturnType<typeof import('node:child_process').spawn>;
  }) as unknown as typeof import('node:child_process').spawn;
}

describe('getAccessToken', () => {
  it('returns a JWT-shaped token when the subprocess prints one and exits 0', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sig-part';
    const spawnImpl = makeSpawn((child) => {
      child.stdout.write(`${jwt}\n`);
      child.stdout.end();
      child.emit('close', 0);
    });
    const token = await getAccessToken({ spawnImpl });
    expect(token).toBe(jwt);
  });

  it('rejects with ZodError when stdout is not JWT-shaped', async () => {
    const spawnImpl = makeSpawn((child) => {
      child.stdout.write('not-a-token\n');
      child.stdout.end();
      child.emit('close', 0);
    });
    await expect(getAccessToken({ spawnImpl })).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects with OAuthSubprocessError on non-zero exit', async () => {
    const spawnImpl = makeSpawn((child) => {
      child.stderr.write('boom: credentials missing\n');
      child.stderr.end();
      child.emit('close', 1);
    });
    await expect(getAccessToken({ spawnImpl })).rejects.toMatchObject({
      name: 'OAuthSubprocessError',
      code: 1,
    });
  });

  it('rejects with OAuthSubprocessError when spawn itself fails', async () => {
    const spawnImpl = makeSpawn((child) => {
      child.emit('error', new Error('ENOENT'));
    });
    const err = await getAccessToken({ spawnImpl }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OAuthSubprocessError);
    expect((err as OAuthSubprocessError).message).toMatch(/ENOENT/);
  });

  it('times out and kills the child when the subprocess hangs', async () => {
    let seen: FakeChild | null = null;
    const spawnImpl = makeSpawn((child) => {
      seen = child;
      // never emit close
    });
    // Real timers, very short timeout — deterministic and keeps the rejection
    // attached to a single awaited promise (avoids fake-timer unhandled-rejection
    // races when the timer fires before the expect is awaited).
    const p = getAccessToken({ spawnImpl, timeoutMs: 20 });
    await expect(p).rejects.toMatchObject({ name: 'OAuthSubprocessError' });
    expect(seen?.killed).toBe(true);
  });
});

describe('JwtTokenSchema', () => {
  it('accepts JWT-shaped strings and trims whitespace', () => {
    const parsed = JwtTokenSchema.parse('  eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig  ');
    expect(parsed).toBe('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig');
  });

  it('rejects empty strings', () => {
    expect(() => JwtTokenSchema.parse('')).toThrow();
  });

  it('rejects non-JWT-shaped strings', () => {
    expect(() => JwtTokenSchema.parse('only-one-segment')).toThrow();
    expect(() => JwtTokenSchema.parse('two.segments')).toThrow();
    expect(() => JwtTokenSchema.parse('has spaces . in . it')).toThrow();
  });
});

describe('TokenCacheSchema', () => {
  it('accepts the current shape of tokens/jobber_tokens.json', () => {
    const parsed = TokenCacheSchema.parse({
      access_token: 'abc',
      refresh_token: 'def',
      expires_at: '2026-01-01T00:00:00Z',
      warning: 'some message',
    });
    expect(parsed.access_token).toBe('abc');
  });

  it('rejects missing access_token', () => {
    expect(() => TokenCacheSchema.parse({ refresh_token: 'x' })).toThrow();
  });
});
