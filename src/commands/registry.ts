import type { BaseCommandOptions } from './base-command.js';
import { GetCommand } from './get.js';
import { StatusCommand } from './status.js';
import { TokenCommand } from './token.js';

// Simple name-to-factory registry. The CLI hands bound arguments (plain
// `Record<string, unknown>`) into `execute`; each command validates the
// shape internally. Keeping the public shape structural avoids the
// variance trap that casting `BaseCommand<TArgs>` down to
// `BaseCommand<unknown, unknown>` would introduce.

export interface ExecutableCommand {
  execute(args: Record<string, unknown>): Promise<unknown>;
}
export type CommandFactory = (options?: BaseCommandOptions) => ExecutableCommand;

export interface CommandEntry {
  readonly name: string;
  readonly description: string;
  readonly factory: CommandFactory;
}

const ENTRIES: readonly CommandEntry[] = [
  {
    name: 'status',
    description: 'Show throttle status and budget',
    factory: (opts) => new StatusCommand(opts),
  },
  {
    name: 'token',
    description: 'Check access token status (update/oauth actions land in Phase 5)',
    factory: (opts) => new TokenCommand(opts),
  },
  {
    name: 'get',
    description: 'Fetch an entity (job/client/quote/invoice) by id',
    factory: (opts) => new GetCommand(opts),
  },
];

const byName = new Map(ENTRIES.map((entry) => [entry.name, entry]));

export function listCommands(): readonly CommandEntry[] {
  return ENTRIES;
}

export function getCommand(name: string): CommandEntry | undefined {
  return byName.get(name);
}
