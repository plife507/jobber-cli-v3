import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/utils/logger.js';

function captureStreams(): {
  stdout: PassThrough;
  stderr: PassThrough;
  stdoutText(): string;
  stderrText(): string;
} {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let out = '';
  let err = '';
  stdout.on('data', (c: Buffer) => {
    out += c.toString();
  });
  stderr.on('data', (c: Buffer) => {
    err += c.toString();
  });
  return {
    stdout,
    stderr,
    stdoutText: () => out,
    stderrText: () => err,
  };
}

describe('createLogger', () => {
  it('routes warn and error to stderr; info, debug, success to stdout', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'debug', stdout: s.stdout, stderr: s.stderr });
    log.error('err-msg');
    log.warn('warn-msg');
    log.info('info-msg');
    log.debug('debug-msg');
    log.success('ok-msg');

    expect(s.stderrText()).toContain('err-msg');
    expect(s.stderrText()).toContain('warn-msg');
    expect(s.stderrText()).not.toContain('info-msg');
    expect(s.stderrText()).not.toContain('debug-msg');
    expect(s.stderrText()).not.toContain('ok-msg');

    expect(s.stdoutText()).toContain('info-msg');
    expect(s.stdoutText()).toContain('debug-msg');
    expect(s.stdoutText()).toContain('ok-msg');
    expect(s.stdoutText()).not.toContain('err-msg');
    expect(s.stdoutText()).not.toContain('warn-msg');
  });

  it('suppresses info and debug when level=warn', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'warn', stdout: s.stdout, stderr: s.stderr });
    log.info('ignored-info');
    log.debug('ignored-debug');
    log.warn('kept-warn');
    log.error('kept-error');

    expect(s.stdoutText()).toBe('');
    expect(s.stderrText()).toContain('kept-warn');
    expect(s.stderrText()).toContain('kept-error');
  });

  it('suppresses warn and info when level=error', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'error', stdout: s.stdout, stderr: s.stderr });
    log.warn('ignored');
    log.info('ignored');
    log.debug('ignored');
    log.error('boom');
    expect(s.stdoutText()).toBe('');
    expect(s.stderrText()).toContain('boom');
    expect(s.stderrText()).not.toContain('ignored');
  });

  it('emits no ANSI color codes and no emoji prefix on non-TTY streams', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'debug', stdout: s.stdout, stderr: s.stderr });
    log.info('plain');
    log.error('plain-err');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape match.
    const ansi = /\x1b\[\d+m/;
    expect(s.stdoutText()).not.toMatch(ansi);
    expect(s.stderrText()).not.toMatch(ansi);
    expect(s.stdoutText().trim()).toBe('plain');
    expect(s.stderrText().trim()).toBe('plain-err');
  });

  it('honors LOG_LEVEL from the provided env bag', () => {
    const s = captureStreams();
    const log = createLogger({
      stdout: s.stdout,
      stderr: s.stderr,
      env: { LOG_LEVEL: 'error' },
    });
    log.info('nope');
    log.error('yes');
    expect(s.stdoutText()).toBe('');
    expect(s.stderrText()).toContain('yes');
  });

  it('falls back to info when LOG_LEVEL is invalid', () => {
    const s = captureStreams();
    const log = createLogger({
      stdout: s.stdout,
      stderr: s.stderr,
      env: { LOG_LEVEL: 'bogus' },
    });
    log.debug('no');
    log.info('yes');
    expect(s.stdoutText()).toContain('yes');
    expect(s.stdoutText()).not.toContain('no');
  });

  it('setLevel changes verbosity at runtime', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'info', stdout: s.stdout, stderr: s.stderr });
    log.debug('before');
    log.setLevel('debug');
    log.debug('after');
    expect(s.stdoutText()).not.toContain('before');
    expect(s.stdoutText()).toContain('after');
    expect(log.getLevel()).toBe('debug');
  });

  it('stringifies extra args on their own lines', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'info', stdout: s.stdout, stderr: s.stderr });
    log.info('header', { k: 1 }, 'tail');
    const lines = s.stdoutText().split('\n').filter(Boolean);
    expect(lines[0]).toContain('header');
    expect(lines[1]).toBe('{"k":1}');
    expect(lines[2]).toBe('tail');
  });

  it('formats Error extras with a stack trace', () => {
    const s = captureStreams();
    const log = createLogger({ level: 'info', stdout: s.stdout, stderr: s.stderr });
    const err = new Error('bang');
    log.error('failure', err);
    expect(s.stderrText()).toContain('failure');
    expect(s.stderrText()).toMatch(/Error: bang/);
  });

  it('filePath returns an OSC 8 hyperlink wrapping the path', () => {
    const log = createLogger({ level: 'info' });
    const link = log.filePath('/abs/path.txt');
    expect(link.startsWith('\x1b]8;;file:///abs/path.txt\x1b\\')).toBe(true);
    expect(link.endsWith('\x1b]8;;\x1b\\')).toBe(true);
    expect(link).toContain('/abs/path.txt');
  });
});
