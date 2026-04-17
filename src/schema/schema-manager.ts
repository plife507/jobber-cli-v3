import {
  type GraphQLSchema,
  type IntrospectionQuery,
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  printSchema,
} from 'graphql';
import type { JobberClient } from '../core/jobber-client.js';
import type { SchemaSource } from '../query/query-validator.js';
import type { Logger } from '../utils/logger.js';
import { type SchemaAnalysis, SchemaAnalyzer } from './schema-analyzer.js';
import {
  type CachedAnalysis,
  type CachedIntrospection,
  SchemaCache,
  type SchemaCacheOptions,
} from './schema-cache.js';

// Ported from reference/jobber-cli/lib/schema/schema-manager.js. Acts as the
// single entry point for schema lifecycle operations and implements the
// `SchemaSource` interface that QueryValidator (Phase 2) already expects.

// reference/jobber-cli/lib/utils/config.js:73 — keep the constant here so it
// is visible at call sites; JobberClient also uses 45_000 for __schema queries.
export const INTROSPECTION_COST = 45_000;

export interface FetchSchemaOptions {
  /** Refetch even if the schema is already cached. */
  readonly force?: boolean;
  /** Suppress the 45k-cost warning. */
  readonly warn?: boolean;
  /** Pass-through silent flag to the GraphQL client. */
  readonly silent?: boolean;
}

export interface SchemaManagerOptions extends SchemaCacheOptions {
  readonly client?: JobberClient;
  readonly cache?: SchemaCache;
  readonly analyzer?: SchemaAnalyzer;
  readonly logger?: Logger;
}

export class SchemaManager implements SchemaSource {
  private readonly client: JobberClient | undefined;
  private readonly cache: SchemaCache;
  private readonly analyzer: SchemaAnalyzer;
  private readonly logger: Logger | undefined;
  private memoizedAnalysis: SchemaAnalysis | null = null;
  private memoizedGraphQLSchema: GraphQLSchema | null = null;

  constructor(options: SchemaManagerOptions = {}) {
    this.client = options.client;
    this.cache =
      options.cache ??
      new SchemaCache({
        ...(options.cacheDir !== undefined ? { cacheDir: options.cacheDir } : {}),
        ...(options.logger !== undefined ? { logger: options.logger } : {}),
      });
    this.analyzer = options.analyzer ?? new SchemaAnalyzer();
    this.logger = options.logger;
  }

  getCache(): SchemaCache {
    return this.cache;
  }

  getAnalyzer(): SchemaAnalyzer {
    return this.analyzer;
  }

  /**
   * Fetch the full schema via introspection (respects the ~45k throttle cost)
   * and cache it as SDL + raw introspection result. Returns the cached SDL path.
   */
  async fetchSchema(options: FetchSchemaOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('JobberClient required for fetching schema');
    }

    if (!options.force && this.cache.hasSchema()) {
      this.logger?.info('Schema already cached. Use --force to refetch.');
      return this.cache.getPaths().schema;
    }

    if (options.warn !== false) {
      this.logger?.warn('Full schema introspection costs ~45,000 throttle units (one-time).');
    }

    const introspectionQuery = getIntrospectionQuery();
    const result = await this.client.executeQuery<IntrospectionQuery>(
      introspectionQuery,
      null,
      INTROSPECTION_COST,
      options.silent === true ? { silent: true } : {},
    );
    if (result.hasErrors) {
      const messages = (result.errors ?? []).map((e) => e.message).join(', ');
      throw new Error(`GraphQL errors during introspection: ${messages}`);
    }
    const data = result.data;
    if (!data) {
      throw new Error('Introspection returned no data');
    }

    // Persist raw introspection for IncrementalIntrospector + buildClientSchema.
    this.cache.saveIntrospection(data as unknown as CachedIntrospection);
    const graphqlSchema = buildClientSchema(data);
    const sdl = printSchema(graphqlSchema);
    this.cache.saveSchema(sdl);

    // Reset memoized schema so the next getSchema() reflects the refresh.
    this.memoizedGraphQLSchema = graphqlSchema;
    this.memoizedAnalysis = null;

    return this.cache.getPaths().schema;
  }

  /**
   * Return the cached analysis object, running the analyzer on demand if
   * necessary. Throws if no schema has been fetched yet.
   */
  async analyzeSchema(force = false): Promise<SchemaAnalysis> {
    if (!force && this.memoizedAnalysis) return this.memoizedAnalysis;
    if (!force) {
      const cached = this.cache.loadAnalysis();
      if (cached) {
        // `CachedAnalysis` has `unknown` inside queries/types; we trust it when
        // present because it was produced by the analyzer itself. A forced
        // refresh (Phase 3.5+) will re-derive it.
        this.memoizedAnalysis = cached as unknown as SchemaAnalysis;
        return this.memoizedAnalysis;
      }
    }

    const sdl = this.cache.loadSchema();
    if (!sdl) {
      throw new Error('Schema not found. Run `jobber schema fetch` first.');
    }
    const analysis = this.analyzer.analyze(sdl);
    const markdown = this.analyzer.generateMarkdown(analysis);
    // SchemaAnalysis is a strict superset of the Zod CachedAnalysis shape; the
    // cast is structural, not a soundness hole.
    this.cache.saveAnalysis(analysis as unknown as CachedAnalysis, markdown);
    this.memoizedAnalysis = analysis;
    return analysis;
  }

  /** Async equivalent of v2.5's `getAnalysis`. */
  async getAnalysis(): Promise<SchemaAnalysis> {
    return this.analyzeSchema(false);
  }

  /** Sync peek — returns null if neither memoized nor cached. */
  getCachedAnalysis(): SchemaAnalysis | null {
    if (this.memoizedAnalysis) return this.memoizedAnalysis;
    const cached = this.cache.loadAnalysis();
    if (!cached) return null;
    this.memoizedAnalysis = cached as unknown as SchemaAnalysis;
    return this.memoizedAnalysis;
  }

  /**
   * Return type information + suggestions; shape matches v2.5 exactly so the
   * Phase 5 `schema help` command can render without further transformation.
   */
  async getTypeHelp(typeName: string): Promise<
    | {
        found: true;
        type: { name: string; kind: string; description: string | null; fields: unknown[] };
      }
    | { found: false; typeName: string; suggestions: ReturnType<SchemaAnalyzer['getSuggestions']> }
  > {
    const analysis = await this.analyzeSchema();
    const type = this.analyzer.findType(analysis, typeName);
    if (!type) {
      return {
        found: false,
        typeName,
        suggestions: this.analyzer.getSuggestions(analysis, typeName),
      };
    }
    return {
      found: true,
      type: {
        name: type.name,
        kind: type.kind,
        description: type.description,
        fields: type.fields ?? [],
      },
    };
  }

  /**
   * `SchemaSource` implementation — compile the cached SDL into a runtime
   * GraphQLSchema for Phase 2's QueryValidator. Null if no schema is cached.
   */
  getSchema(): GraphQLSchema | null {
    if (this.memoizedGraphQLSchema) return this.memoizedGraphQLSchema;
    const sdl = this.cache.loadSchema();
    if (!sdl) return null;
    try {
      this.memoizedGraphQLSchema = buildSchema(sdl);
      return this.memoizedGraphQLSchema;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger?.warn(`Failed to build GraphQLSchema from cached SDL: ${message}`);
      return null;
    }
  }

  /** Drop the in-memory memoized schema + analysis. Useful before a forced refresh. */
  invalidate(): void {
    this.memoizedAnalysis = null;
    this.memoizedGraphQLSchema = null;
  }
}
