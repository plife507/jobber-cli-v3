import type { BaseCommandOptions } from './base-command.js';
import { DoctorCommand } from './doctor.js';
import { GetCommand } from './get.js';
import { JobExpenseCommand } from './job-expense.js';
import { JobNoteCommand } from './job-note.js';
import { NotesCommand } from './notes.js';
import { QueryCommand } from './query.js';
import { SchemaCommand } from './schema.js';
import { SearchCommand } from './search.js';
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
    description: 'Check access token status',
    factory: (opts) => new TokenCommand(opts),
  },
  {
    name: 'get',
    description: 'Fetch an entity (job/client/quote/invoice) by id',
    factory: (opts) => new GetCommand(opts),
  },
  {
    name: 'query',
    description: 'Run an arbitrary GraphQL query (with optional schema validation)',
    factory: (opts) => new QueryCommand(opts),
  },
  {
    name: 'search',
    description: 'Search for jobs or clients',
    factory: (opts) => new SearchCommand(opts),
  },
  {
    name: 'notes',
    description: 'Aggregate notes across the most recently updated jobs',
    factory: (opts) => new NotesCommand(opts),
  },
  {
    name: 'schema',
    description: 'Manage the cached GraphQL schema (fetch | analyze | help <TypeName>)',
    factory: (opts) => new SchemaCommand(opts),
  },
  {
    name: 'doctor',
    description: 'Validate local runtime, env, and token health (no API call)',
    factory: () => new DoctorCommand(),
  },
  {
    name: 'job-note',
    description: 'List / create / edit / delete notes on a job (writes gated)',
    factory: (opts) => new JobNoteCommand(opts),
  },
  {
    name: 'job-expense',
    description: 'List / create / edit / delete expenses on a job (writes gated)',
    factory: (opts) => new JobExpenseCommand(opts),
  },
];

const byName = new Map(ENTRIES.map((entry) => [entry.name, entry]));

export function listCommands(): readonly CommandEntry[] {
  return ENTRIES;
}

export function getCommand(name: string): CommandEntry | undefined {
  return byName.get(name);
}
