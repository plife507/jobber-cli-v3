import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { Logger } from '../utils/logger.js';

// Ported from reference/jobber-cli/lib/schema/schema-cache.js.
// Path layout and atomic temp-rename writes match v2.5 exactly so the two
// CLIs can share the same on-disk cache during the migration.

export interface SchemaCacheOptions {
  readonly cacheDir?: string;
  readonly logger?: Logger;
}

export interface SchemaCachePaths {
  readonly cacheDir: string;
  readonly schema: string;
  readonly analysisJson: string;
  readonly analysisMd: string;
  readonly introspectionJson: string;
  readonly apiMappingJson: string;
}

// Boundary schemas: JSON on disk can be corrupted / written by older CLIs.
// Parse loosely — we preserve unknown fields via `.passthrough()` — and
// surface structure errors as null so callers can rebuild rather than crash.

const AnalysisSchema = z
  .object({
    queries: z.array(z.unknown()).default([]),
    types: z.record(z.string(), z.unknown()).default({}),
    connections: z.array(z.string()).default([]),
    singleObjects: z.array(z.string()).default([]),
    enums: z.array(z.string()).default([]),
    inputTypes: z.array(z.string()).default([]),
    customFieldTypes: z.array(z.unknown()).default([]),
    entitiesWithCustomFields: z.array(z.unknown()).default([]),
    generatedAt: z.string().optional(),
  })
  .passthrough();

export type CachedAnalysis = z.infer<typeof AnalysisSchema>;

const IntrospectionSchema = z
  .object({
    __schema: z
      .object({
        types: z.array(z.unknown()).default([]),
      })
      .passthrough(),
  })
  .passthrough();

export type CachedIntrospection = z.infer<typeof IntrospectionSchema>;

const ApiMappingSchema = z.record(z.string(), z.unknown());

export type CachedApiMapping = z.infer<typeof ApiMappingSchema>;

function defaultCacheDir(): string {
  return join(process.cwd(), '.cache');
}

function atomicWrite(target: string, content: string): void {
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, content, 'utf8');
  try {
    renameSync(tmp, target);
  } catch (err) {
    try {
      unlinkSync(tmp);
    } catch {
      /* best-effort */
    }
    throw err;
  }
}

export class SchemaCache {
  private readonly paths: SchemaCachePaths;
  private readonly logger: Logger | undefined;

  constructor(options: SchemaCacheOptions = {}) {
    const cacheDir = options.cacheDir ?? defaultCacheDir();
    this.paths = Object.freeze({
      cacheDir,
      schema: join(cacheDir, 'jobber_schema.graphql'),
      analysisJson: join(cacheDir, 'schema_analysis.json'),
      analysisMd: join(cacheDir, 'schema_analysis.md'),
      introspectionJson: join(cacheDir, 'introspection_result.json'),
      apiMappingJson: join(cacheDir, 'api_mapping.json'),
    });
    this.logger = options.logger;

    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
  }

  getPaths(): SchemaCachePaths {
    return this.paths;
  }

  hasSchema(): boolean {
    return existsSync(this.paths.schema);
  }

  hasAnalysis(): boolean {
    return existsSync(this.paths.analysisJson);
  }

  hasIntrospection(): boolean {
    return existsSync(this.paths.introspectionJson);
  }

  hasApiMapping(): boolean {
    return existsSync(this.paths.apiMappingJson);
  }

  saveSchema(sdl: string): void {
    atomicWrite(this.paths.schema, sdl);
    this.logger?.info(`Schema cached: ${this.paths.schema}`);
  }

  loadSchema(): string | null {
    if (!this.hasSchema()) return null;
    return readFileSync(this.paths.schema, 'utf8');
  }

  saveAnalysis(analysis: CachedAnalysis, markdown?: string): void {
    atomicWrite(this.paths.analysisJson, JSON.stringify(analysis, null, 2));
    if (markdown !== undefined) {
      atomicWrite(this.paths.analysisMd, markdown);
    }
    this.logger?.info(`Analysis cached: ${this.paths.analysisJson}`);
  }

  loadAnalysis(): CachedAnalysis | null {
    if (!this.hasAnalysis()) return null;
    const result = AnalysisSchema.safeParse(this.readRawJson(this.paths.analysisJson, 'analysis'));
    if (!result.success) {
      this.logger?.warn('analysis cache file failed Zod validation; ignoring.');
      return null;
    }
    return result.data;
  }

  saveIntrospection(data: CachedIntrospection): void {
    atomicWrite(this.paths.introspectionJson, JSON.stringify(data, null, 2));
    this.logger?.info(`Introspection saved: ${this.paths.introspectionJson}`);
  }

  loadIntrospection(): CachedIntrospection | null {
    if (!this.hasIntrospection()) return null;
    const result = IntrospectionSchema.safeParse(
      this.readRawJson(this.paths.introspectionJson, 'introspection'),
    );
    if (!result.success) {
      this.logger?.warn('introspection cache file failed Zod validation; ignoring.');
      return null;
    }
    return result.data;
  }

  saveApiMapping(mapping: CachedApiMapping): void {
    atomicWrite(this.paths.apiMappingJson, JSON.stringify(mapping, null, 2));
    this.logger?.info(`API mapping saved: ${this.paths.apiMappingJson}`);
  }

  loadApiMapping(): CachedApiMapping | null {
    if (!this.hasApiMapping()) return null;
    const result = ApiMappingSchema.safeParse(
      this.readRawJson(this.paths.apiMappingJson, 'API mapping'),
    );
    if (!result.success) {
      this.logger?.warn('API mapping cache file failed Zod validation; ignoring.');
      return null;
    }
    return result.data;
  }

  /** Remove every cached artifact. Used by `schema clear` in Phase 5. */
  clear(): void {
    const targets = [
      this.paths.schema,
      this.paths.analysisJson,
      this.paths.analysisMd,
      this.paths.introspectionJson,
      this.paths.apiMappingJson,
    ];
    for (const target of targets) {
      if (existsSync(target)) unlinkSync(target);
    }
    this.logger?.info('Schema cache cleared');
  }

  private readRawJson(path: string, label: string): unknown {
    try {
      const content = readFileSync(path, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger?.error(`Error loading ${label}: ${message}`);
      return null;
    }
  }
}

export { AnalysisSchema, IntrospectionSchema, ApiMappingSchema };
