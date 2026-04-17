import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ENV_FILE = '.env';

// Workspace root is the parent of jobber-cli-v3 (same .env v2.5 reads).
// Falls back to the CLI-local .env if the workspace file is missing.
function resolveDefaultEnvPath(): string {
  const cliRoot = resolve(here, '..', '..');
  const workspaceEnv = join(cliRoot, '..', DEFAULT_ENV_FILE);
  const localEnv = join(cliRoot, DEFAULT_ENV_FILE);
  if (existsSync(workspaceEnv)) return workspaceEnv;
  if (existsSync(localEnv)) return localEnv;
  return workspaceEnv;
}

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf8');
  return dotenv.parse(content);
}

// Only the literal string "1" enables writes; every other value → false.
// Workspace rule: mutations refused unless this is true.
const writesEnabledSchema = z
  .string()
  .optional()
  .transform((v) => v === '1');

const debugFlagSchema = z
  .string()
  .optional()
  .transform((v) => v !== undefined && v !== '' && v !== '0');

const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug']).default('info');

const EnvSchema = z.object({
  JOBBER_ACCESS_TOKEN: z
    .string({ required_error: 'JOBBER_ACCESS_TOKEN is required' })
    .min(1, 'JOBBER_ACCESS_TOKEN is required')
    .refine(
      (v) => v.trim() !== '' && v !== 'your_access_token_here',
      'JOBBER_ACCESS_TOKEN is a placeholder',
    ),
  JOBBER_API_URL: z.string().url().default('https://api.getjobber.com/api/graphql'),
  JOBBER_API_VERSION: z.string().min(1).default('2025-04-16'),
  JOBBER_WRITES_ENABLED: writesEnabledSchema,
  LOG_LEVEL: logLevelSchema,
  DEBUG: debugFlagSchema,
});

export type Config = z.infer<typeof EnvSchema>;

export interface LoadConfigOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly envFilePath?: string;
}

export function loadConfig(options: LoadConfigOptions = {}): Config {
  const env = options.env ?? process.env;
  const envFilePath = options.envFilePath ?? env.JOBBER_ENV_PATH ?? resolveDefaultEnvPath();
  const fileValues = readEnvFile(envFilePath);
  const merged: Record<string, string | undefined> = { ...fileValues, ...env };
  return EnvSchema.parse(merged);
}

export { EnvSchema };
