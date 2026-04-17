import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';

// Ported from reference/jobber-cli/lib/core/cost-reference.js.
// Persists historical query costs, averages samples, and returns estimates.
//
// Single-writer assumption: concurrent CLI invocations writing the same cost
// file can clobber each other's entries (last writer wins). Acceptable for a
// dev CLI but revisit if Phase 5+ ever dispatches parallel commands.

const CostEntrySchema = z.object({
  samples: z.number().int().nonnegative(),
  min: z.number(),
  max: z.number(),
  avg: z.number(),
  depth: z.number(),
  fields: z.number(),
  lastCost: z.number().optional(),
  lastSeen: z.string().optional(),
});
type CostEntry = z.infer<typeof CostEntrySchema>;

const CostFileSchema = z.object({
  costs: z.record(z.string(), CostEntrySchema).default({}),
  updated: z.string().nullable().default(null),
});
type CostFile = z.infer<typeof CostFileSchema>;

function emptyData(): CostFile {
  return { costs: {}, updated: null };
}

function queryKey(query: string): string | null {
  const op = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  if (op?.[1]) return op[1];
  const field = query.match(/\{\s*(\w+)/);
  return field?.[1] ?? null;
}

interface QueryShape {
  key: string;
  depth: number;
  fields: number;
}

function queryShape(query: string): QueryShape | null {
  const key = queryKey(query);
  if (!key) return null;
  let depth = 0;
  let maxDepth = 0;
  for (const c of query) {
    if (c === '{') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (c === '}') {
      depth--;
    }
  }
  const fields = (query.match(/\w+\s*[{(:]/g) || []).length;
  return { key, depth: maxDepth, fields };
}

export interface CostReferenceOptions {
  /** Absolute path to the JSON file. Default `<cwd>/.cache/query_costs.json`. */
  readonly filePath?: string;
}

export class CostReference {
  private readonly filePath: string;
  private data: CostFile | null = null;
  private dirty = false;

  constructor(options: CostReferenceOptions = {}) {
    this.filePath = options.filePath ?? join(process.cwd(), '.cache', 'query_costs.json');
  }

  private load(): CostFile {
    if (this.data) return this.data;
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf8');
        const parsed: unknown = JSON.parse(raw);
        const result = CostFileSchema.safeParse(parsed);
        this.data = result.success ? result.data : emptyData();
      } else {
        this.data = emptyData();
      }
    } catch {
      this.data = emptyData();
    }
    return this.data;
  }

  private save(): void {
    if (!this.dirty || !this.data) return;
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.data.updated = new Date().toISOString();
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
    try {
      renameSync(tempPath, this.filePath);
    } catch (err) {
      try {
        unlinkSync(tempPath);
      } catch {
        /* best-effort cleanup */
      }
      throw err;
    }
    this.dirty = false;
  }

  record(query: string, actualCost: number): void {
    if (!Number.isFinite(actualCost) || actualCost <= 0) return;
    const shape = queryShape(query);
    if (!shape) return;

    const data = this.load();
    const existing = data.costs[shape.key];
    const entry: CostEntry = existing ?? {
      samples: 0,
      min: actualCost,
      max: 0,
      avg: 0,
      depth: shape.depth,
      fields: shape.fields,
    };

    const weight = Math.min(entry.samples, 20);
    entry.avg = Math.round((entry.avg * weight + actualCost) / (weight + 1));
    entry.min = Math.min(entry.min, actualCost);
    entry.max = Math.max(entry.max, actualCost);
    entry.samples += 1;
    entry.lastCost = actualCost;
    entry.lastSeen = new Date().toISOString();
    entry.depth = shape.depth;
    entry.fields = shape.fields;

    data.costs[shape.key] = entry;
    this.dirty = true;

    // reference line 111: batch writes — save every 5 records.
    if (entry.samples % 5 === 0) this.save();
  }

  estimate(query: string): number | null {
    const shape = queryShape(query);
    if (!shape) return null;
    const entry = this.load().costs[shape.key];
    if (!entry || entry.samples === 0) return null;
    // reference line 128: avg + 20% buffer.
    return Math.ceil(entry.avg * 1.2);
  }

  flush(): void {
    this.save();
  }

  getTable(): Readonly<Record<string, CostEntry>> {
    return this.load().costs;
  }
}
