export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LEVEL_BY_RANK: readonly LogLevel[] = ['error', 'warn', 'info', 'debug'];

type IconKey = LogLevel | 'success';

const ICON_BY_LEVEL: Record<IconKey, string> = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍',
  success: '✅',
};

const COLOR_BY_LEVEL: Record<IconKey, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[94m',
  debug: '\x1b[90m',
  success: '\x1b[32m',
};

const RESET = '\x1b[0m';

export interface Logger {
  error(message: string, ...args: readonly unknown[]): void;
  warn(message: string, ...args: readonly unknown[]): void;
  info(message: string, ...args: readonly unknown[]): void;
  debug(message: string, ...args: readonly unknown[]): void;
  success(message: string, ...args: readonly unknown[]): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  filePath(path: string): string;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly stdout?: NodeJS.WritableStream;
  readonly stderr?: NodeJS.WritableStream;
  readonly env?: NodeJS.ProcessEnv;
}

function parseLevel(raw: string | undefined, fallback: LogLevel): LogLevel {
  if (!raw) return fallback;
  const lower = raw.toLowerCase() as LogLevel;
  return lower in LEVEL_ORDER ? lower : fallback;
}

function isTTYStream(stream: NodeJS.WritableStream): boolean {
  return Boolean((stream as { isTTY?: boolean }).isTTY);
}

function formatMessage(message: string, key: IconKey, stream: NodeJS.WritableStream): string {
  const tty = isTTYStream(stream);
  if (!tty) return message;
  return `${COLOR_BY_LEVEL[key]}${ICON_BY_LEVEL[key]} ${message}${RESET}`;
}

function stringifyArg(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function writeLine(stream: NodeJS.WritableStream, line: string, extras: readonly unknown[]): void {
  stream.write(`${line}\n`);
  for (const extra of extras) {
    stream.write(`${stringifyArg(extra)}\n`);
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const env = options.env ?? process.env;
  let current = LEVEL_ORDER[options.level ?? parseLevel(env.LOG_LEVEL, 'info')];

  const enabled = (level: LogLevel): boolean => current >= LEVEL_ORDER[level];

  return {
    error(message, ...args) {
      if (!enabled('error')) return;
      writeLine(stderr, formatMessage(message, 'error', stderr), args);
    },
    warn(message, ...args) {
      if (!enabled('warn')) return;
      writeLine(stderr, formatMessage(message, 'warn', stderr), args);
    },
    info(message, ...args) {
      if (!enabled('info')) return;
      writeLine(stdout, formatMessage(message, 'info', stdout), args);
    },
    debug(message, ...args) {
      if (!enabled('debug')) return;
      writeLine(stdout, formatMessage(message, 'debug', stdout), args);
    },
    success(message, ...args) {
      if (!enabled('info')) return;
      writeLine(stdout, formatMessage(message, 'success', stdout), args);
    },
    setLevel(level) {
      current = LEVEL_ORDER[level];
    },
    getLevel(): LogLevel {
      return LEVEL_BY_RANK[current] ?? 'info';
    },
    filePath(path: string): string {
      // OSC 8 hyperlink escape — same behavior as v2.5 logger.
      const normalized = path.replace(/\\/g, '/');
      let url: string;
      if (/^[A-Za-z]:\//.test(normalized)) {
        url = `file:///${normalized}`;
      } else if (normalized.startsWith('/')) {
        url = `file://${normalized}`;
      } else {
        url = `file:///${normalized}`;
      }
      return `\x1b]8;;${url}\x1b\\${path}\x1b]8;;\x1b\\`;
    },
  };
}
