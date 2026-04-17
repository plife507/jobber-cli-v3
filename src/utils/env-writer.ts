import {
  chmodSync,
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

// Ported from reference/jobber-cli/lib/utils/env-writer.js. Atomic update
// via temp file + rename, restricts the written file to 0600 on POSIX.
// Does NOT reload `process.env` — callers that need that should use
// `loadConfig` again with the refreshed file.

export interface UpdateEnvFileOptions {
  /** When true, inject updates into `process.env` too. Default: false. */
  readonly mutateProcessEnv?: boolean;
}

export function updateEnvFile(
  envPath: string,
  updates: Readonly<Record<string, string>>,
  options: UpdateEnvFileOptions = {},
): void {
  const tempPath = `${envPath}.tmp`;

  const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const lines = existing.length === 0 ? [] : existing.split('\n');
  const keysToAdd: Record<string, string> = { ...updates };

  const updated = lines.map((line) => {
    for (const [key, value] of Object.entries(updates)) {
      if (line.startsWith(`${key}=`)) {
        delete keysToAdd[key];
        return `${key}=${value}`;
      }
    }
    return line;
  });

  for (const [key, value] of Object.entries(keysToAdd)) {
    if (updated.length > 0 && updated[updated.length - 1] !== '') {
      updated.push('');
    }
    updated.push(`${key}=${value}`);
  }

  let finalContent = updated.join('\n');
  if (!finalContent.endsWith('\n')) finalContent += '\n';
  writeFileSync(tempPath, finalContent, 'utf8');

  try {
    renameSync(tempPath, envPath);
    try {
      chmodSync(envPath, 0o600);
    } catch {
      /* ignore on Windows */
    }
  } catch (err) {
    try {
      unlinkSync(tempPath);
    } catch {
      /* best-effort */
    }
    throw err;
  }

  if (options.mutateProcessEnv) {
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
    }
  }
}
