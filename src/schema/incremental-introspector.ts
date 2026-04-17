import type { JobberClient } from '../core/jobber-client.js';
import type { Logger } from '../utils/logger.js';
import type { CachedIntrospection } from './schema-cache.js';

// Ported from reference/jobber-cli/lib/schema/incremental-introspector.js.
// Fetches one type at a time via `__type(name: $name)` so a schema refresh can
// stay well under the 10k throttle budget instead of paying the full 45k cost
// of a complete introspection.

interface IntrospectedType {
  readonly name: string;
  readonly kind: string;
  // Retain the rest as unknown — the full shape is validated lazily on write.
  readonly [key: string]: unknown;
}

interface BatchProfileBase {
  readonly label: string;
}

interface StaticBatchProfile extends BatchProfileBase {
  readonly types: readonly string[];
}

interface DynamicBatchProfile extends BatchProfileBase {
  readonly getTypes: (cachedTypes: readonly IntrospectedType[]) => readonly IntrospectedType[];
}

type BatchProfile = StaticBatchProfile | DynamicBatchProfile;

export const BATCH_PROFILES: Readonly<Record<string, BatchProfile>> = Object.freeze({
  'custom-fields': {
    label: 'Custom Field Types',
    getTypes: (cachedTypes) => cachedTypes.filter((t) => t.name.startsWith('CustomField')),
  },
  entities: {
    label: 'Entities with Custom Fields',
    types: ['Client', 'Invoice', 'Job', 'ProductOrService', 'Property', 'Quote', 'User'],
  },
  core: {
    label: 'Core Business Types',
    types: [
      'Visit',
      'Request',
      'Assessment',
      'Expense',
      'TimeSheet',
      'LineItem',
      'Tax',
      'Discount',
      'Account',
      'JobCost',
      'Payment',
      'Note',
      'CompletedJob',
      'Reminder',
    ],
  },
  roots: {
    label: 'Query & Mutation Roots',
    types: ['Query', 'Mutation'],
  },
});

export type BatchProfileName = keyof typeof BATCH_PROFILES;

// reference line 35-52: deep type-reference fragment (up to 7 levels of ofType).
const TYPE_REF_FRAGMENT = `
fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
      }
    }
  }
}`;

const INTROSPECT_TYPE_QUERY = `
query IntrospectType($name: String!) {
  __type(name: $name) {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        name
        description
        type { ...TypeRef }
        defaultValue
      }
      type { ...TypeRef }
      isDeprecated
      deprecationReason
    }
    inputFields {
      name
      description
      type { ...TypeRef }
      defaultValue
    }
    interfaces { ...TypeRef }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes { ...TypeRef }
  }
}
${TYPE_REF_FRAGMENT}`;

// reference line 121: single __type cost is 1-400 units (avg ~180); 200 is the
// same estimate JobberClient already returns from `estimateQueryCost`.
const INTROSPECT_TYPE_COST = 200;

export interface IntrospectBatchResult {
  updated: IntrospectedType[];
  failed: Array<{ name: string; error: string }>;
  notFound: string[];
}

export interface IntrospectRunResult extends IntrospectBatchResult {
  batches: Array<{
    profile: string;
    label: string;
    queried: number;
    updated: number;
    failed: number;
    notFound: number;
  }>;
}

export type ProgressCallback = (
  current: number,
  total: number,
  typeName: string,
  profile?: string,
) => void;

export class IncrementalIntrospector {
  constructor(
    private readonly client: JobberClient,
    private readonly logger?: Logger,
  ) {}

  getTypesForProfile(profile: string, cachedTypes: readonly IntrospectedType[] = []): string[] {
    const config = BATCH_PROFILES[profile];
    if (!config) {
      throw new Error(
        `Unknown batch profile: ${profile}. Available: ${Object.keys(BATCH_PROFILES).join(', ')}`,
      );
    }
    if ('getTypes' in config) {
      return config.getTypes(cachedTypes).map((t) => t.name);
    }
    return [...config.types];
  }

  async introspectType(typeName: string): Promise<IntrospectedType | null> {
    const result = await this.client.executeQuery<{ __type: IntrospectedType | null }>(
      INTROSPECT_TYPE_QUERY,
      { name: typeName },
      INTROSPECT_TYPE_COST,
    );
    if (result.hasErrors) {
      this.logger?.warn(`  Error introspecting ${typeName}: ${result.errors?.[0]?.message}`);
      return null;
    }
    return result.data?.__type ?? null;
  }

  async introspectBatch(
    typeNames: readonly string[],
    onProgress?: ProgressCallback,
  ): Promise<IntrospectBatchResult> {
    const result: IntrospectBatchResult = { updated: [], failed: [], notFound: [] };
    for (let i = 0; i < typeNames.length; i++) {
      const name = typeNames[i];
      if (name === undefined) continue;
      onProgress?.(i + 1, typeNames.length, name);
      try {
        const typeData = await this.introspectType(name);
        if (typeData) {
          result.updated.push(typeData);
        } else {
          result.notFound.push(name);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger?.warn(`  Failed: ${name} - ${message}`);
        result.failed.push({ name, error: message });
      }
    }
    return result;
  }

  async runProfiles(
    profiles: readonly string[],
    cachedTypes: readonly IntrospectedType[] = [],
    onProgress?: ProgressCallback,
  ): Promise<IntrospectRunResult> {
    const all: IntrospectRunResult = { updated: [], failed: [], notFound: [], batches: [] };
    for (const profile of profiles) {
      const config = BATCH_PROFILES[profile];
      if (!config) continue;
      const typeNames = this.getTypesForProfile(profile, cachedTypes);
      this.logger?.info(`Batch: ${config.label} (${typeNames.length} types)`);

      const batchResult = await this.introspectBatch(typeNames, (cur, total, name) => {
        onProgress?.(cur, total, name, profile);
        this.logger?.debug(`  [${cur}/${total}] ${name}`);
      });

      all.updated.push(...batchResult.updated);
      all.failed.push(...batchResult.failed);
      all.notFound.push(...batchResult.notFound);
      all.batches.push({
        profile,
        label: config.label,
        queried: typeNames.length,
        updated: batchResult.updated.length,
        failed: batchResult.failed.length,
        notFound: batchResult.notFound.length,
      });

      this.logger?.success(
        `  ${batchResult.updated.length} updated, ${batchResult.notFound.length} not found, ${batchResult.failed.length} failed`,
      );
    }
    return all;
  }

  /**
   * Merge new type definitions into an existing introspection payload.
   * Returns a new payload — the input is NOT mutated, so Phase 5's
   * `schema update` command can safely retain the previous value for diffing.
   */
  static mergeTypes(
    existing: CachedIntrospection,
    newTypes: readonly IntrospectedType[],
  ): CachedIntrospection {
    const existingSchema = existing.__schema as {
      types: readonly IntrospectedType[];
      [key: string]: unknown;
    };
    const map = new Map<string, IntrospectedType>();
    for (const t of existingSchema.types) {
      if (typeof t.name === 'string') map.set(t.name, t);
    }
    let added = 0;
    let replaced = 0;
    for (const newType of newTypes) {
      if (map.has(newType.name)) replaced++;
      else added++;
      map.set(newType.name, newType);
    }
    const mergedTypes = Array.from(map.values());
    return {
      ...existing,
      __schema: {
        ...existingSchema,
        types: mergedTypes,
        _incrementalUpdate: {
          timestamp: new Date().toISOString(),
          typesReplaced: replaced,
          typesAdded: added,
          totalTypes: mergedTypes.length,
        },
      },
    };
  }
}
