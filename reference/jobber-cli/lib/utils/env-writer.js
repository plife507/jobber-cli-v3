/**
 * Purpose: Atomic .env file writer — shared utility for token updates across CLI
 * Inputs: .env file path, key-value pairs to update
 * Outputs: Atomically updated .env file (temp write + rename)
 * Dependencies: fs, dotenv
 */

import { readFileSync, writeFileSync, renameSync, unlinkSync, chmodSync } from 'fs';
import dotenv from 'dotenv';
import Config from './config.js';

/**
 * Atomically update key-value pairs in a .env file
 * Uses temp file + rename pattern to prevent corruption
 * @param {string} envPath - Path to .env file
 * @param {Object} updates - Key-value pairs to update (e.g., { JOBBER_ACCESS_TOKEN: 'xyz' })
 * @param {Object} options
 * @param {boolean} options.reload - Reload dotenv and update Config after write (default: true)
 * @returns {void}
 */
export function updateEnvFile(envPath, updates, options = {}) {
  const { reload = true } = options;
  const tempPath = `${envPath}.tmp`;

  // Read existing .env file
  let envContent = '';
  try {
    envContent = readFileSync(envPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // Update existing keys or track which ones need adding
  const keysToAdd = { ...updates };
  const lines = envContent.split('\n');
  const updatedLines = lines.map(line => {
    for (const [key, value] of Object.entries(updates)) {
      if (line.startsWith(`${key}=`)) {
        delete keysToAdd[key];
        return `${key}=${value}`;
      }
    }
    return line;
  });

  // Append any keys that weren't found
  for (const [key, value] of Object.entries(keysToAdd)) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== '') {
      updatedLines.push('');
    }
    updatedLines.push(`${key}=${value}`);
  }

  // Write to temp file
  let finalContent = updatedLines.join('\n');
  if (!finalContent.endsWith('\n')) finalContent += '\n';
  writeFileSync(tempPath, finalContent, 'utf8');

  // Atomic rename
  try {
    renameSync(tempPath, envPath);
    // Restrict to owner read/write only (sensitive credentials)
    try { chmodSync(envPath, 0o600); } catch (_) { /* ignore on Windows */ }
  } catch (renameError) {
    try { unlinkSync(tempPath); } catch (_) { /* ignore cleanup errors */ }
    throw renameError;
  }

  // Reload into process
  if (reload) {
    dotenv.config({ path: envPath, override: true });

    // Update Config and process.env for each key
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
      if (key === 'JOBBER_ACCESS_TOKEN') {
        Config.ACCESS_TOKEN = value;
      }
    }
  }
}
