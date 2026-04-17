/**
 * Purpose: Doctor Command - validates local runtime and configuration for automation use
 * Inputs: Optional flags (--json, --machine)
 * Outputs: Health report for runtime, env file, token metadata, and WSL hints
 * Dependencies: Config, token-utils, fs, os
 */

import fs from 'fs';
import os from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { BaseCommand } from './_base.js';
import Config from '../lib/utils/config.js';
import logger from '../lib/utils/logger.js';
import { decodeToken, isTokenExpired, getTimeUntilExpiration } from '../lib/utils/token-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jobberCliRoot = join(__dirname, '..');
const kcRepoRoot = join(jobberCliRoot, '..');
const venvPythonLinux = join(kcRepoRoot, '.venv', 'bin', 'python');
const venvPythonWin = join(kcRepoRoot, '.venv', 'Scripts', 'python.exe');

function detectWSL() {
  if (process.platform !== 'linux') return false;

  try {
    const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return version.includes('microsoft');
  } catch {
    return false;
  }
}

function buildTokenReport(token) {
  if (!token || token.trim() === '' || token === 'your_access_token_here') {
    return {
      present: false,
      validFormat: false,
      expired: null,
      expiresIn: null
    };
  }

  const payload = decodeToken(token);
  if (!payload) {
    return {
      present: true,
      validFormat: false,
      expired: null,
      expiresIn: null
    };
  }

  let expired = null;
  try {
    expired = isTokenExpired(token);
  } catch {
    expired = null;
  }

  const ttl = getTimeUntilExpiration(token);
  const expiresIn = ttl
    ? (ttl.expired ? 'expired' : `${ttl.hours}h ${ttl.minutes}m ${ttl.seconds}s`)
    : null;

  return {
    present: true,
    validFormat: true,
    expired,
    expiresIn
  };
}

export class DoctorCommand extends BaseCommand {
  static get commandName() { return 'doctor'; }
  static get description() { return 'Validate runtime configuration and environment health'; }

  async run(args = {}) {
    // Don't call this.initialize() — doctor should work even with broken config
    Config.reload();

    const isWSL = detectWSL();
    const envFile = Config.ENV_FILE;
    const envFileExists = fs.existsSync(envFile);
    const cacheExists = fs.existsSync(Config.SCHEMA_CACHE_DIR);
    const tokenReport = buildTokenReport(Config.ACCESS_TOKEN);
    const warnings = [];
    const recommendations = [];

    if (!envFileExists) {
      warnings.push(`Env file not found: ${envFile}`);
      recommendations.push('Create .env with JOBBER_ACCESS_TOKEN');
    }

    if (!tokenReport.present) {
      warnings.push('JOBBER_ACCESS_TOKEN is missing');
      recommendations.push('Run: jobber token oauth-authorize (browser login) or jobber token update <jwt>');
      const venvOk =
        fs.existsSync(venvPythonLinux) || fs.existsSync(venvPythonWin);
      if (!venvOk) {
        warnings.push('Python venv for OAuth not found at repo .venv');
        recommendations.push(
          'Create venv: cd repo root && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt'
        );
      }
    } else if (!tokenReport.validFormat) {
      warnings.push('JOBBER_ACCESS_TOKEN is not a valid JWT format');
      recommendations.push('Replace token with a valid JWT from Jobber developer portal');
    } else if (tokenReport.expired) {
      warnings.push('JOBBER_ACCESS_TOKEN is expired');
      recommendations.push('Run: jobber token update <token> or OAuth refresh flow');
    }

    if (isWSL && envFile.startsWith('/mnt/')) {
      warnings.push('Using env file from mounted Windows filesystem inside WSL');
      recommendations.push('Prefer running repo from WSL filesystem (for example ~/code/jobber-cli)');
    }

    const report = {
      ok: warnings.length === 0,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        shell: process.env.SHELL || process.env.ComSpec || null
      },
      environment: {
        isWSL,
        machineMode: process.env.JOBBER_MACHINE_MODE === '1',
        nonInteractive: process.env.JOBBER_NON_INTERACTIVE === '1'
      },
      paths: {
        envFile,
        envFileExists,
        schemaCacheDir: Config.SCHEMA_CACHE_DIR,
        schemaCacheExists: cacheExists,
        repoRoot: kcRepoRoot,
        pythonVenvReady:
          fs.existsSync(venvPythonLinux) || fs.existsSync(venvPythonWin)
      },
      auth: tokenReport,
      warnings,
      recommendations
    };

    if (process.env.JOBBER_MACHINE_MODE === '1' || args.json) {
      return report;
    }

    console.log('Jobber CLI Doctor');
    console.log(`Node: ${report.runtime.node}`);
    console.log(`Platform: ${report.runtime.platform} (${report.runtime.arch})`);
    console.log(`WSL: ${report.environment.isWSL ? 'yes' : 'no'}`);
    console.log(`Env file: ${report.paths.envFile} (${report.paths.envFileExists ? 'found' : 'missing'})`);
    console.log(`Token: ${report.auth.present ? 'present' : 'missing'}${report.auth.validFormat ? ', valid format' : ''}${report.auth.expiresIn ? `, ${report.auth.expiresIn}` : ''}`);

    if (warnings.length > 0) {
      console.log('\nWarnings:');
      warnings.forEach((w) => console.log(`- ${w}`));
    }

    if (recommendations.length > 0) {
      console.log('\nRecommended actions:');
      recommendations.forEach((r) => console.log(`- ${r}`));
    }

    return report;
  }
}

export default DoctorCommand;
