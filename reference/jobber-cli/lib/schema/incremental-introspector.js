/**
 * Purpose: Incremental schema introspection using targeted __type queries
 * Inputs: List of type names, JobberClient instance
 * Outputs: Updated introspection data merged into cache
 * Dependencies: JobberClient, SchemaCache, logger
 */

import logger from '../utils/logger.js';

// Batch profiles for targeted introspection
const BATCH_PROFILES = {
  'custom-fields': {
    label: 'Custom Field Types',
    getTypes: (cachedTypes) => cachedTypes.filter(t => t.name.startsWith('CustomField'))
  },
  'entities': {
    label: 'Entities with Custom Fields',
    types: ['Client', 'Invoice', 'Job', 'ProductOrService', 'Property', 'Quote', 'User']
  },
  'core': {
    label: 'Core Business Types',
    types: [
      'Visit', 'Request', 'Assessment', 'Expense', 'TimeSheet',
      'LineItem', 'Tax', 'Discount', 'Account', 'JobCost',
      'Payment', 'Note', 'CompletedJob', 'Reminder'
    ]
  },
  'roots': {
    label: 'Query & Mutation Roots',
    types: ['Query', 'Mutation']
  }
};

// Deep type reference fragment for introspection
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

// Query template for single type introspection
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

export class IncrementalIntrospector {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get type names for a batch profile
   * @param {string} profile - Profile name from BATCH_PROFILES
   * @param {Array} cachedTypes - Existing cached types array
   * @returns {string[]} Type names to query
   */
  getTypesForProfile(profile, cachedTypes = []) {
    const config = BATCH_PROFILES[profile];
    if (!config) {
      throw new Error(`Unknown batch profile: ${profile}. Available: ${Object.keys(BATCH_PROFILES).join(', ')}`);
    }

    if (config.getTypes) {
      return config.getTypes(cachedTypes).map(t => t.name);
    }
    return config.types;
  }

  /**
   * Introspect a single type
   * @param {string} typeName - Type name to introspect
   * @returns {Object|null} Type definition or null if not found
   */
  async introspectType(typeName) {
    // Cost for single __type query is 1-400 units (avg ~180 for object types)
    const result = await this.client.executeQuery(
      INTROSPECT_TYPE_QUERY,
      { name: typeName },
      200
    );

    if (result.hasErrors) {
      logger.warn(`  Error introspecting ${typeName}: ${result.errors[0]?.message}`);
      return null;
    }

    return result.data?.__type || null;
  }

  /**
   * Introspect a batch of types
   * @param {string[]} typeNames - Type names to introspect
   * @param {Function} onProgress - Progress callback(current, total, typeName)
   * @returns {Object} { updated: [...], failed: [...], notFound: [...] }
   */
  async introspectBatch(typeNames, onProgress = null) {
    const results = { updated: [], failed: [], notFound: [] };

    for (let i = 0; i < typeNames.length; i++) {
      const name = typeNames[i];
      if (onProgress) onProgress(i + 1, typeNames.length, name);

      try {
        const typeData = await this.introspectType(name);
        if (typeData) {
          results.updated.push(typeData);
        } else {
          results.notFound.push(name);
        }
      } catch (error) {
        logger.warn(`  Failed: ${name} - ${error.message}`);
        results.failed.push({ name, error: error.message });
      }
    }

    return results;
  }

  /**
   * Run a full incremental refresh by profile
   * @param {string[]} profiles - Profile names to run
   * @param {Array} cachedTypes - Existing cached types
   * @param {Function} onProgress - Progress callback
   * @returns {Object} Combined results from all batches
   */
  async runProfiles(profiles, cachedTypes = [], onProgress = null) {
    const allResults = { updated: [], failed: [], notFound: [], batches: [] };

    for (const profile of profiles) {
      const config = BATCH_PROFILES[profile];
      const typeNames = this.getTypesForProfile(profile, cachedTypes);

      logger.info(`\n📦 Batch: ${config.label} (${typeNames.length} types)`);

      const batchResult = await this.introspectBatch(typeNames, (cur, total, name) => {
        if (onProgress) onProgress(cur, total, name, profile);
        logger.debug(`  [${cur}/${total}] ${name}`);
      });

      allResults.updated.push(...batchResult.updated);
      allResults.failed.push(...batchResult.failed);
      allResults.notFound.push(...batchResult.notFound);
      allResults.batches.push({
        profile,
        label: config.label,
        queried: typeNames.length,
        updated: batchResult.updated.length,
        failed: batchResult.failed.length,
        notFound: batchResult.notFound.length
      });

      logger.success(`  ✓ ${batchResult.updated.length} updated, ${batchResult.notFound.length} not found, ${batchResult.failed.length} failed`);
    }

    return allResults;
  }

  /**
   * Merge introspection results into existing cached data
   * @param {Object} existingIntrospection - Existing __schema data
   * @param {Array} newTypes - New type definitions to merge
   * @returns {Object} Merged introspection data
   */
  static mergeTypes(existingIntrospection, newTypes) {
    const schema = existingIntrospection.__schema;
    const typesMap = new Map(schema.types.map(t => [t.name, t]));

    let added = 0;
    let replaced = 0;

    for (const newType of newTypes) {
      if (typesMap.has(newType.name)) {
        replaced++;
      } else {
        added++;
      }
      typesMap.set(newType.name, newType);
    }

    // Rebuild types array from merged map
    schema.types = Array.from(typesMap.values());

    // Add metadata
    schema._incrementalUpdate = {
      timestamp: new Date().toISOString(),
      typesReplaced: replaced,
      typesAdded: added,
      totalTypes: schema.types.length
    };

    return existingIntrospection;
  }
}

export { BATCH_PROFILES };
export default IncrementalIntrospector;
