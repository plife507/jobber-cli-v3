import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type Config, loadConfig } from '../core/config.js';
import { createLogger } from '../utils/logger.js';
import { decodeToken, getTimeUntilExpiration, isTokenExpired } from '../utils/token-utils.js';

// Ported from reference/jobber-cli/commands/doctor.js. Intentionally does NOT
// extend BaseCommand: doctor must run even when config/token are broken so
// the user can diagnose why the CLI won't start. Presented as a plain
// function + class adapter so the registry can still construct it like any
// other command.

export interface DoctorReport {
  readonly ok: boolean;
  readonly runtime: {
    readonly node: string;
    readonly platform: string;
    readonly arch: string;
    readonly cwd: string;
  };
  readonly environment: {
    readonly isWSL: boolean;
    readonly machineMode: boolean;
    readonly nonInteractive: boolean;
  };
  readonly paths: {
    readonly envFile: string | null;
    readonly envFileExists: boolean;
    readonly schemaCacheDir: string;
    readonly schemaCacheExists: boolean;
    readonly pythonVenvReady: boolean;
  };
  readonly auth: {
    readonly present: boolean;
    readonly validFormat: boolean;
    readonly expired: boolean | null;
    readonly expiresIn: string | null;
  };
  readonly warnings: readonly string[];
  readonly recommendations: readonly string[];
}

export interface DoctorArgs {
  readonly json?: boolean;
  readonly machine?: boolean;
}

function detectWSL(): boolean {
  if (process.platform !== 'linux') return false;
  try {
    const fs = require('node:fs') as typeof import('node:fs');
    const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return version.includes('microsoft');
  } catch {
    return false;
  }
}

function buildAuthReport(token: string | undefined): DoctorReport['auth'] {
  if (!token || token.trim() === '' || token === 'your_access_token_here') {
    return { present: false, validFormat: false, expired: null, expiresIn: null };
  }
  const payload = decodeToken(token);
  if (!payload) {
    return { present: true, validFormat: false, expired: null, expiresIn: null };
  }
  let expired: boolean | null;
  try {
    expired = isTokenExpired(token);
  } catch {
    expired = null;
  }
  const ttl = getTimeUntilExpiration(token);
  const expiresIn = ttl
    ? ttl.expired
      ? 'expired'
      : `${ttl.hours}h ${ttl.minutes}m ${ttl.seconds}s`
    : null;
  return { present: true, validFormat: true, expired, expiresIn };
}

export class DoctorCommand {
  async execute(args: Record<string, unknown>): Promise<DoctorReport> {
    const json = Boolean(args.json) || Boolean(args.machine);
    let config: Config | null = null;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      config = loadConfig();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warnings.push(`Config could not be loaded: ${message}`);
      recommendations.push('Create .env or run: jobber token oauth-authorize.');
    }

    const cwd = process.cwd();
    const envFile = config ? findEnvFile(cwd) : null;
    const envFileExists = envFile !== null && existsSync(envFile);
    const schemaCacheDir = join(cwd, '.cache');
    const schemaCacheExists = existsSync(schemaCacheDir);
    const isWSL = detectWSL();
    const workspaceRoot = join(cwd, '..');
    const pythonVenvReady =
      existsSync(join(workspaceRoot, '.venv', 'bin', 'python')) ||
      existsSync(join(workspaceRoot, '.venv', 'Scripts', 'python.exe'));
    const auth = buildAuthReport(config?.JOBBER_ACCESS_TOKEN);

    if (!envFileExists) {
      warnings.push(`Env file not found: ${envFile ?? '(not resolved)'}`);
      recommendations.push('Create .env with JOBBER_ACCESS_TOKEN.');
    }
    if (!auth.present) {
      warnings.push('JOBBER_ACCESS_TOKEN is missing');
      recommendations.push('Run: jobber token oauth-authorize or set JOBBER_ACCESS_TOKEN in .env.');
      if (!pythonVenvReady) {
        warnings.push('Python venv for OAuth not found at ../.venv');
        recommendations.push(
          'Create venv at workspace root: python3 -m venv .venv && .venv/bin/pip install -r oauth/requirements.txt',
        );
      }
    } else if (!auth.validFormat) {
      warnings.push('JOBBER_ACCESS_TOKEN is not a valid JWT format');
      recommendations.push('Replace with a valid JWT from Jobber developer portal.');
    } else if (auth.expired) {
      warnings.push('JOBBER_ACCESS_TOKEN is expired');
      recommendations.push('Refresh via OAuth: jobber token oauth-refresh.');
    }

    const report: DoctorReport = {
      ok: warnings.length === 0,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd,
      },
      environment: {
        isWSL,
        machineMode: process.env.JOBBER_MACHINE_MODE === '1',
        nonInteractive: process.env.JOBBER_NON_INTERACTIVE === '1',
      },
      paths: {
        envFile,
        envFileExists,
        schemaCacheDir,
        schemaCacheExists,
        pythonVenvReady,
      },
      auth,
      warnings,
      recommendations,
    };

    if (json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      const logger = createLogger({ level: config?.LOG_LEVEL ?? 'info' });
      logger.info('Jobber CLI Doctor');
      logger.info(`  Node: ${report.runtime.node}`);
      logger.info(`  Platform: ${report.runtime.platform} (${report.runtime.arch})`);
      logger.info(`  WSL: ${isWSL ? 'yes' : 'no'}`);
      logger.info(
        `  Env file: ${envFile ?? '(not resolved)'} (${envFileExists ? 'found' : 'missing'})`,
      );
      logger.info(
        `  Token: ${auth.present ? 'present' : 'missing'}${auth.validFormat ? ', valid format' : ''}${auth.expiresIn ? `, ${auth.expiresIn}` : ''}`,
      );
      if (warnings.length > 0) {
        logger.info('');
        logger.warn('Warnings:');
        for (const w of warnings) logger.warn(`  - ${w}`);
      }
      if (recommendations.length > 0) {
        logger.info('');
        logger.info('Recommended actions:');
        for (const r of recommendations) logger.info(`  - ${r}`);
      }
    }
    return report;
  }
}

function findEnvFile(cwd: string): string | null {
  const local = join(cwd, '.env');
  const workspace = join(cwd, '..', '.env');
  if (existsSync(local)) return local;
  if (existsSync(workspace)) return workspace;
  return workspace;
}
