import { type SpawnOptions, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Boundary schemas: everything crossing the subprocess / filesystem boundary
// is validated with Zod per workspace rule #3.

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

const JwtTokenSchema = z
  .string()
  .min(1)
  .refine((v) => JWT_SHAPE.test(v.trim()), { message: 'Expected a JWT-shaped token string' })
  .transform((v) => v.trim());

const TokenCacheSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_at: z.union([z.number(), z.string()]).optional(),
  warning: z.string().optional(),
});

export type TokenCache = z.infer<typeof TokenCacheSchema>;

export interface GetTokenOptions {
  /** Absolute path to the oauth manager Python script. */
  readonly managerPath?: string;
  /** Python interpreter. Default `python3`. */
  readonly python?: string;
  /** Timeout in ms. Default 30000. */
  readonly timeoutMs?: number;
  /** Env vars passed to the subprocess. Default `process.env`. */
  readonly env?: NodeJS.ProcessEnv;
  /** For tests: override the spawn implementation. */
  readonly spawnImpl?: typeof spawn;
}

export class OAuthSubprocessError extends Error {
  readonly stderr: string;
  readonly code: number | null;
  constructor(message: string, stderr: string, code: number | null) {
    super(message);
    this.name = 'OAuthSubprocessError';
    this.stderr = stderr;
    this.code = code;
  }
}

function defaultManagerPath(): string {
  // Walk up from this file: src/utils/ → src/ → jobber-cli-v3/ → workspace/
  const here = dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = resolve(here, '..', '..', '..');
  return join(workspaceRoot, 'oauth', 'jobber_oauth_manager.py');
}

function detectWorkspaceVenvPython(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = resolve(here, '..', '..', '..');
  const linux = join(workspaceRoot, '.venv', 'bin', 'python');
  const windows = join(workspaceRoot, '.venv', 'Scripts', 'python.exe');
  if (existsSync(linux)) return linux;
  if (existsSync(windows)) return windows;
  return null;
}

/**
 * Run `python3 oauth/jobber_oauth_manager.py get-token` and return a
 * Zod-validated JWT token string. Throws OAuthSubprocessError on non-zero
 * exit; throws ZodError on malformed stdout.
 */
export async function getAccessToken(options: GetTokenOptions = {}): Promise<string> {
  const managerPath = options.managerPath ?? defaultManagerPath();
  const envBag = options.env ?? process.env;
  // Resolution order for the python interpreter: explicit option → JOBBER_OAUTH_PYTHON
  // env var → workspace `.venv/bin/python` (auto-detected) → bare `python3`.
  const python =
    options.python ?? envBag.JOBBER_OAUTH_PYTHON ?? detectWorkspaceVenvPython() ?? 'python3';
  const timeoutMs = options.timeoutMs ?? 30_000;
  const spawnFn = options.spawnImpl ?? spawn;
  const spawnOpts: SpawnOptions = {
    env: envBag,
    stdio: ['ignore', 'pipe', 'pipe'],
  };

  return new Promise<string>((resolvePromise, rejectPromise) => {
    let settled = false;
    let stdout = '';
    let stderr = '';

    const child = spawnFn(python, [managerPath, 'get-token'], spawnOpts);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      rejectPromise(
        new OAuthSubprocessError(`OAuth subprocess timed out after ${timeoutMs}ms`, stderr, null),
      );
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rejectPromise(
        new OAuthSubprocessError(`Failed to spawn OAuth subprocess: ${err.message}`, stderr, null),
      );
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        rejectPromise(
          new OAuthSubprocessError(
            `OAuth subprocess exited with code ${code}: ${stderr.trim() || '(no stderr)'}`,
            stderr,
            code,
          ),
        );
        return;
      }

      try {
        const token = JwtTokenSchema.parse(stdout);
        resolvePromise(token);
      } catch (err) {
        rejectPromise(err);
      }
    });
  });
}

export interface ReadTokenCacheOptions {
  readonly path?: string;
}

function defaultTokenCachePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = resolve(here, '..', '..', '..');
  return join(workspaceRoot, 'tokens', 'jobber_tokens.json');
}

/**
 * Read and Zod-validate the shared token cache file. Returns null if the file
 * does not exist. Throws ZodError on malformed content.
 */
export function readTokenCache(options: ReadTokenCacheOptions = {}): TokenCache | null {
  const path = options.path ?? defaultTokenCachePath();
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return TokenCacheSchema.parse(parsed);
}

export { JwtTokenSchema, TokenCacheSchema };
