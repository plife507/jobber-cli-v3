/**
 * Purpose: Query cost reference — learns actual API costs, uses them for future estimates
 * Inputs: Query strings, actual throttle costs from API responses
 * Outputs: Accurate cost estimates based on historical data
 * Dependencies: fs, Config
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import Config from '../utils/config.js';

const COST_FILE = join(Config.SCHEMA_CACHE_DIR, 'query_costs.json');

// Extract a stable key from a query (operation name or root field)
function getQueryKey(query) {
  // Try operation name first: query GetJob(...) or mutation CreateJob(...)
  const opMatch = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  if (opMatch) return opMatch[1];

  // Fall back to first root field: { job(...) { ... } }
  const fieldMatch = query.match(/\{\s*(\w+)/);
  if (fieldMatch) return fieldMatch[1];

  return null;
}

// Classify query shape for grouping similar queries
function getQueryShape(query) {
  const key = getQueryKey(query);
  if (!key) return null;

  // Count nesting depth
  let depth = 0, maxDepth = 0;
  for (const c of query) {
    if (c === '{') { depth++; maxDepth = Math.max(maxDepth, depth); }
    else if (c === '}') depth--;
  }

  // Count fields (rough)
  const fields = (query.match(/\w+\s*[{(:]/g) || []).length;

  return { key, depth: maxDepth, fields };
}

class CostReference {
  constructor() {
    this._data = null;
    this._dirty = false;
  }

  _load() {
    if (this._data) return this._data;
    try {
      if (existsSync(COST_FILE)) {
        this._data = JSON.parse(readFileSync(COST_FILE, 'utf8'));
      } else {
        this._data = { costs: {}, updated: null };
      }
    } catch {
      this._data = { costs: {}, updated: null };
    }
    return this._data;
  }

  _save() {
    if (!this._dirty) return;
    const dir = dirname(COST_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data = this._load();
    data.updated = new Date().toISOString();
    const tempPath = `${COST_FILE}.tmp`;
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    try {
      renameSync(tempPath, COST_FILE);
    } catch (err) {
      try { unlinkSync(tempPath); } catch (_) {}
      throw err;
    }
    this._dirty = false;
  }

  /**
   * Record actual cost for a query
   * @param {string} query - The GraphQL query
   * @param {number} actualCost - Actual throttle units consumed
   */
  record(query, actualCost) {
    if (!actualCost || actualCost <= 0) return;

    const shape = getQueryShape(query);
    if (!shape) return;

    const data = this._load();
    const entry = data.costs[shape.key] || { samples: 0, min: actualCost, max: 0, avg: 0, depth: shape.depth, fields: shape.fields };

    // Rolling average (keep last 20 samples worth of weight)
    const weight = Math.min(entry.samples, 20);
    entry.avg = Math.round((entry.avg * weight + actualCost) / (weight + 1));
    entry.min = Math.min(entry.min, actualCost);
    entry.max = Math.max(entry.max, actualCost);
    entry.samples = (entry.samples || 0) + 1;
    entry.lastCost = actualCost;
    entry.lastSeen = new Date().toISOString();
    entry.depth = shape.depth;
    entry.fields = shape.fields;

    data.costs[shape.key] = entry;
    this._dirty = true;

    // Batch writes — save every 5 records or on flush
    if (entry.samples % 5 === 0) this._save();
  }

  /**
   * Get estimated cost for a query based on historical data
   * @param {string} query - The GraphQL query
   * @returns {number|null} Estimated cost or null if no data
   */
  estimate(query) {
    const shape = getQueryShape(query);
    if (!shape) return null;

    const data = this._load();
    const entry = data.costs[shape.key];
    if (!entry || entry.samples === 0) return null;

    // Use avg + 20% buffer (balanced — avoids over-budgeting while staying safe)
    return Math.ceil(entry.avg * 1.2);
  }

  /**
   * Flush pending writes
   */
  flush() {
    this._save();
  }

  /**
   * Get full cost table for display
   * @returns {Object} All recorded costs
   */
  getTable() {
    return this._load().costs;
  }
}

// Singleton
const costReference = new CostReference();
export default costReference;
