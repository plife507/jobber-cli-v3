import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve as resolvePath } from 'node:path';
import { QueryValidator } from '../query/query-validator.js';
import { BaseCommand, type BaseCommandContext } from './base-command.js';

// Ported from reference/jobber-cli/commands/query.js. Executes an arbitrary
// GraphQL query via Phase 2's QueryExecutor, with optional schema validation
// against the Phase 3 SchemaManager's cached SDL.

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_QUERY_CHARS = 100_000;
const MAX_VARS_CHARS = 10_000;

export interface QueryArgs {
  readonly query?: string;
  readonly file?: string;
  readonly variables?: string;
  readonly validate?: boolean;
  readonly json?: boolean;
}

export interface QueryResult {
  readonly data: unknown;
  readonly errors: readonly unknown[] | null;
}

function readQueryFromFile(filePath: string): string {
  const resolved = resolvePath(filePath);
  const baseDir = resolvePath(process.cwd());
  const rel = relative(baseDir, resolved);
  // Reject path traversal outside the current working directory.
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('File path must be within current directory');
  }
  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const stats = statSync(resolved);
  if (stats.size > MAX_FILE_BYTES) {
    throw new Error('Query file too large (max 1MB)');
  }
  let content = readFileSync(resolved, 'utf8');
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  if (content.length > MAX_QUERY_CHARS) {
    throw new Error('Query too large (max 100KB)');
  }
  return content;
}

function parseVariables(varsString: string): Record<string, unknown> {
  if (varsString.length > MAX_VARS_CHARS) {
    throw new Error('Variables JSON too large (max 10KB)');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(varsString);
  } catch (err) {
    throw new Error(`Invalid JSON in variables: ${err instanceof Error ? err.message : err}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Variables must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

export class QueryCommand extends BaseCommand<QueryResult, QueryArgs> {
  protected async run(
    args: QueryArgs,
    { queryExecutor, schemaManager, logger }: BaseCommandContext,
  ): Promise<QueryResult> {
    if (!args.query && !args.file) {
      throw new Error('Usage: jobber query "<query>"  or  jobber query --file <path>');
    }

    const query = args.file ? readQueryFromFile(args.file) : (args.query as string);
    const variables = args.variables ? parseVariables(args.variables) : null;

    if (args.validate !== false && schemaManager.getCache().hasSchema()) {
      const validator = new QueryValidator(schemaManager);
      const result = await validator.validate(query, true);
      if (!result.valid) {
        const details = result.errors?.map((e) => `  - ${e}`).join('\n') ?? '';
        throw new Error(`Query validation failed:\n${details}`);
      }
      if (result.warning) {
        logger.warn(result.warning);
      }
    } else if (args.validate !== false && !schemaManager.getCache().hasSchema()) {
      logger.warn('Schema not cached. Run `jobber schema fetch` to enable validation.');
    }

    const exec = await queryExecutor.execute<Record<string, unknown>>(query, variables, {
      silent: true,
    });
    if (!exec.success) {
      const messages = exec.errors.map((e) => (typeof e === 'string' ? e : e.message)).join('; ');
      throw new Error(`Query execution failed: ${messages}`);
    }

    const payload: QueryResult = { data: exec.data, errors: null };
    if (args.json !== false) {
      process.stdout.write(`${JSON.stringify(exec.data, null, 2)}\n`);
    }
    return payload;
  }
}
