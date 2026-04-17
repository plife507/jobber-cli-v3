import { getCommand, listCommands } from './commands/registry.js';

const VERSION = '3.0.0-alpha.0';

interface ParsedArgs {
  readonly _positional: string[];
  readonly flags: Record<string, string | boolean>;
}

// A token that starts with `-` is only treated as a flag if it looks like one:
// `--name`, `-n`, or `--name=value`. This lets `--limit -5` pass `-5` as the
// value and keeps negative-number positionals working.
const FLAG_PATTERN = /^--?[A-Za-z]/;

function parseArgs(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let i = 0;
  while (i < argv.length) {
    const raw = argv[i];
    if (raw === undefined) {
      i++;
      continue;
    }
    if (raw.startsWith('--')) {
      const eq = raw.indexOf('=');
      if (eq > 2) {
        const key = raw.slice(2, eq);
        const value = raw.slice(eq + 1);
        flags[key] = value;
        i += 1;
        continue;
      }
      const key = raw.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !FLAG_PATTERN.test(next)) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else if (raw.startsWith('-') && raw.length === 2 && /^[A-Za-z]$/.test(raw[1] ?? '')) {
      const key = raw.slice(1);
      const next = argv[i + 1];
      if (next !== undefined && !FLAG_PATTERN.test(next)) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else {
      positional.push(raw);
      i += 1;
    }
  }
  return { _positional: positional, flags };
}

function bindArgs(commandName: string, parsed: ParsedArgs): Record<string, unknown> {
  const args: Record<string, unknown> = { ...parsed.flags };
  const positional = parsed._positional;
  args._positional = positional;
  if (commandName === 'get') {
    if (positional[0]) args.type = positional[0];
    if (positional.length > 1) {
      if (positional[0] === 'client') {
        args.id = positional.slice(1).join(' ');
      } else {
        args.id = positional[1];
      }
    }
  } else if (commandName === 'token') {
    if (positional[0]) args.action = positional[0];
    if (positional[1]) args.token = positional[1];
  } else if (commandName === 'query') {
    if (positional[0]) args.query = positional.join(' ');
  } else if (commandName === 'search') {
    if (positional[0]) args.type = positional[0];
    if (positional.length > 1) args.query = positional.slice(1).join(' ');
  } else if (commandName === 'schema') {
    if (positional[0]) args.subcommand = positional[0];
    if (positional[1]) args.type = positional[1];
  } else if (commandName === 'job-note' || commandName === 'job-expense') {
    if (positional[0]) args.action = positional[0];
    if (positional[1]) args.job = positional[1];
  }
  return args;
}

function printHelp(): void {
  const commandLines = listCommands()
    .map((entry) => `  ${entry.name.padEnd(10)} ${entry.description}`)
    .join('\n');
  process.stdout.write(
    `jobber-cli v${VERSION}

Usage: jobber <command> [options] [arguments]

Commands:
${commandLines}

Options:
  --json          Emit machine-readable JSON to stdout
  --help, -h      Show this help message
  --version, -v   Show version
`,
  );
}

function printVersion(): void {
  process.stdout.write(`jobber-cli v${VERSION}\n`);
}

export async function run(argv: readonly string[]): Promise<number> {
  if (argv.length === 0) {
    printHelp();
    return 0;
  }
  const [commandName, ...rest] = argv;
  if (commandName === undefined) {
    printHelp();
    return 0;
  }
  if (commandName === '--help' || commandName === '-h') {
    printHelp();
    return 0;
  }
  if (commandName === '--version' || commandName === '-v') {
    printVersion();
    return 0;
  }

  const entry = getCommand(commandName);
  if (!entry) {
    process.stderr.write(`Unknown command: ${commandName}\n\n`);
    process.stderr.write('Available commands:\n');
    for (const c of listCommands()) {
      process.stderr.write(`  ${c.name}\n`);
    }
    process.stderr.write('\nRun `jobber --help` for more information.\n');
    return 1;
  }

  const parsed = parseArgs(rest);
  const args = bindArgs(commandName, parsed);
  const command = entry.factory();
  try {
    await command.execute(args);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    return classifyExitCode(message);
  }
}

// Exit-code map ported from reference/jobber-cli/bin/jobber:28-37. Keep the
// mapping structural so the Phase 5 doctor/report/search commands stay in
// alignment and scripts wrapping `jobber` see stable contracts.
export const EXIT_CODES = {
  UNKNOWN: 1,
  VALIDATION: 2,
  AUTH: 3,
  RATE_LIMIT: 4,
  NOT_FOUND: 5,
  CONFIG: 6,
  NON_INTERACTIVE: 7,
  INTERNAL: 10,
} as const;

export function classifyExitCode(message: string): number {
  const lower = message.toLowerCase();
  if (
    lower.includes('non-interactive') ||
    lower.includes('requires a tty') ||
    lower.includes('requires a browser') ||
    lower.includes('run headless') ||
    lower.includes('interactive prompt blocked')
  ) {
    return EXIT_CODES.NON_INTERACTIVE;
  }
  if (
    lower.includes('usage:') ||
    lower.includes('invalid') ||
    lower.includes('unknown command') ||
    lower.includes('unknown action')
  ) {
    return EXIT_CODES.VALIDATION;
  }
  if (
    lower.includes('unauth') ||
    lower.includes('authentication') ||
    (lower.includes('token') && lower.includes('expired')) ||
    lower.includes('401')
  ) {
    return EXIT_CODES.AUTH;
  }
  if (
    lower.includes('throttle') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('exceeds maximum throttle budget')
  ) {
    return EXIT_CODES.RATE_LIMIT;
  }
  if (lower.includes('not found') || (lower.includes('no ') && lower.includes('found'))) {
    return EXIT_CODES.NOT_FOUND;
  }
  if (
    lower.includes('configuration') ||
    lower.includes('jobber_access_token') ||
    lower.includes('no jobber access token')
  ) {
    return EXIT_CODES.CONFIG;
  }
  return EXIT_CODES.INTERNAL;
}
