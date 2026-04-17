import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/schema.js. Phase 5 keeps the
// three subcommands the Phase 3 SchemaManager already supports:
// `fetch` (45k-unit introspection), `analyze` (parses cached SDL), and
// `help <TypeName>` (looks up a type + suggestions).

export type SchemaSubcommand = 'fetch' | 'analyze' | 'help';

export interface SchemaArgs {
  readonly subcommand?: string;
  readonly type?: string;
  readonly force?: boolean;
  readonly json?: boolean;
  readonly silent?: boolean;
}

export interface SchemaResult {
  readonly subcommand: SchemaSubcommand;
  readonly result: unknown;
}

const USAGE =
  'Usage:\n' +
  '  jobber schema fetch [--force]            Fetch and cache the full schema (~45k units)\n' +
  '  jobber schema analyze [--force]          Analyze the cached schema (no API call)\n' +
  '  jobber schema help <TypeName>            Look up a type (suggestions on miss)';

export class SchemaCommand extends BaseCommand<SchemaResult, SchemaArgs> {
  protected async run(
    args: SchemaArgs,
    { schemaManager, logger }: BaseCommandContext,
  ): Promise<SchemaResult> {
    const subcommand = (args.subcommand ?? '').toLowerCase();
    if (subcommand === 'fetch') {
      const schemaPath = await schemaManager.fetchSchema({
        force: Boolean(args.force),
        silent: Boolean(args.silent),
        // Suppress the 45k-cost warning when --force is used.
        warn: !args.silent,
      });
      const result = { schemaPath, cached: true };
      if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else logger.success(`Schema cached at ${schemaPath}`);
      return { subcommand: 'fetch', result };
    }
    if (subcommand === 'analyze') {
      const analysis = await schemaManager.analyzeSchema(Boolean(args.force));
      const summary = {
        queries: analysis.queries.length,
        connections: analysis.connections.length,
        singleObjects: analysis.singleObjects.length,
        types: Object.keys(analysis.types).length,
        enums: analysis.enums.length,
        inputTypes: analysis.inputTypes.length,
        customFieldTypes: analysis.customFieldTypes.length,
        entitiesWithCustomFields: analysis.entitiesWithCustomFields.length,
      };
      if (args.json) {
        process.stdout.write(`${JSON.stringify({ summary, analysis }, null, 2)}\n`);
      } else {
        logger.info('Schema Analysis');
        for (const [key, value] of Object.entries(summary)) {
          logger.info(`  ${key.padEnd(25)} ${value}`);
        }
      }
      return { subcommand: 'analyze', result: summary };
    }
    if (subcommand === 'help') {
      if (!args.type) {
        throw new Error('Usage: jobber schema help <TypeName>');
      }
      const result = await schemaManager.getTypeHelp(args.type);
      if (args.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else if (result.found) {
        logger.info(`${result.type.name} (${result.type.kind})`);
        if (result.type.description) logger.info(`  ${result.type.description}`);
      } else {
        logger.warn(`Type not found: ${result.typeName}`);
        if (result.suggestions.length > 0) {
          logger.info('Suggestions:');
          for (const s of result.suggestions.slice(0, 10)) {
            logger.info(`  - ${s.name} (${s.type})`);
          }
        }
      }
      return { subcommand: 'help', result };
    }
    throw new Error(`Unknown schema subcommand: ${subcommand || '(none)'}\n\n${USAGE}`);
  }
}
