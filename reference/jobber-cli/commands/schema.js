/**
 * Purpose: Schema Command - handles GraphQL schema operations (fetch, analyze, help)
 * Inputs: Subcommand (fetch/analyze/help), optional type name for help
 * Outputs: Schema files, analysis reports, type documentation
 * Dependencies: BaseCommand, SchemaManager, logger
 */

import { BaseCommand } from './_base.js';
import logger from '../lib/utils/logger.js';
import CustomFieldsMapper from '../lib/schema/custom-fields-mapper.js';
import CustomFieldsValidator from '../lib/schema/custom-fields-validator.js';
import { IncrementalIntrospector } from '../lib/schema/incremental-introspector.js';
import { buildClientSchema, printSchema } from 'graphql';
import fs from 'fs';
import { join } from 'path';

export class SchemaCommand extends BaseCommand {
  async run(args) {
    await this.initialize();

    const { subcommand, type } = args;

    switch (subcommand) {
      case 'fetch':
        return this.fetchSchema(args);
      case 'analyze':
        return this.analyzeSchema(args);
      case 'help':
        return this.helpType(type || args.type);
      case 'map':
        return this.mapCustomFields(args);
      case 'api-map':
        return this.mapApi(args);
      case 'refresh':
        return this.refreshSchema(args);
      default:
        throw new Error(`Unknown schema subcommand: ${subcommand}. Use: fetch, analyze, help, map, api-map, or refresh`);
    }
  }

  async fetchSchema(args) {
    const { force } = args;
    
    // Set up cancellation handler
    const cancel = this.setupCancellation('Schema Fetch');
    
    try {
      logger.info('Fetching schema from Jobber API...\n');
      await this.schemaManager.fetchSchema({ force: !!force });
      
      if (cancel.cancelled()) {
        logger.warn('\n⚠️  Schema fetch was cancelled');
        cancel.cleanup();
        return;
      }
      
      logger.success('Schema fetched and cached successfully!');
      cancel.cleanup();
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }

  async analyzeSchema(args) {
    const { force } = args;
    
    // Check if analysis already exists in cache
    const cache = this.schemaManager.getCache();
    const hadCachedAnalysis = cache.hasAnalysis() && !force;
    
    if (force) {
      logger.info('Analyzing schema (force refresh)...\n');
    } else {
      logger.info('Analyzing cached schema...\n');
    }
    
    const analysis = await this.schemaManager.analyzeSchema(!!force);
    
    // Show summary - schema manager shows it when analyzing, but not when loading from cache
    if (hadCachedAnalysis && !force) {
      logger.success('Schema analysis loaded from cache');
      logger.info(`\n📊 Summary:`);
      logger.info(`   - Total Queries: ${analysis.queries.length}`);
      logger.info(`   - Connection Queries: ${analysis.connections.length}`);
      logger.info(`   - Single Object Queries: ${analysis.singleObjects.length}`);
      logger.info(`   - Total Types: ${Object.keys(analysis.types).length}\n`);
    } else {
      // Summary already shown by schema manager during analysis
    }
    
    if (args.json) {
      console.log(this.formatJSON(analysis));
    }
    
    return analysis;
  }

  async helpType(typeName) {
    if (!typeName) {
      throw new Error('Type name required for schema help. Usage: jobber schema help <TypeName>');
    }

    const help = await this.schemaManager.getTypeHelp(typeName);
    
    if (!help.found) {
      logger.error(`Type "${typeName}" not found in schema.`);
      if (help.suggestions && help.suggestions.length > 0) {
        logger.info('\n💡 Similar types found:');
        // Show top 5 suggestions
        help.suggestions.slice(0, 5).forEach(s => {
          logger.info(`   - ${s.name} (${s.type || 'type'})`);
        });
        logger.info('\n💡 Try: jobber schema help <typeName>');
      } else {
        logger.info('\n💡 Available types include: Job, Client, Quote, Invoice, Visit, Property, etc.');
        logger.info('💡 Try: jobber schema help <typeName>');
      }
      return;
    }

    logger.info(`\n📖 Schema Help: ${help.type.name}`);
    logger.info(`Type: ${help.type.kind}`);
    if (help.type.description) {
      logger.info(`Description: ${help.type.description}`);
    }

    if (help.type.fields && help.type.fields.length > 0) {
      logger.info(`\nFields (${help.type.fields.length}):`);
      help.type.fields.slice(0, 20).forEach(field => {
        logger.info(`  - ${field.name}: ${field.type}`);
        if (field.description) {
          logger.info(`    ${field.description}`);
        }
      });
      if (help.type.fields.length > 20) {
        logger.info(`  ... and ${help.type.fields.length - 20} more fields`);
      }
    }
  }

  async mapCustomFields(args) {
    const { customFields, validate, output } = args;
    
    if (!customFields) {
      throw new Error('Custom fields file path required. Usage: jobber schema map --custom-fields <file>');
    }

    // Set up cancellation handler
    const cancel = this.setupCancellation('Schema Mapping');
    
    try {
      logger.info('Mapping custom fields...\n');
      
      // Step 1: Parse custom fields JSON
      logger.info('📄 Parsing custom fields JSON...');
      const customFieldsMapping = CustomFieldsMapper.parse(customFields);
      logger.success(`   Parsed ${customFieldsMapping.totalFields} custom field(s)`);
      logger.info(`   Found ${customFieldsMapping.types.length} custom field type(s): ${customFieldsMapping.types.join(', ')}\n`);
      
      // Step 2: Ensure schema is fetched and analyzed
      logger.info('📖 Ensuring schema is available...');
      const cache = this.schemaManager.getCache();
      
      if (!cache.hasSchema()) {
        logger.warn('   Schema not found. Fetching schema (this may take a moment)...');
        await this.schemaManager.fetchSchema({ warn: true });
      }
      
      // Analyze schema if needed
      const analysis = await this.schemaManager.analyzeSchema();
      logger.success('   Schema analysis complete\n');
      
      // Step 3: Validate custom fields against schema
      if (validate !== false) {
        logger.info('🔍 Validating custom fields against GraphQL schema...');
        const validation = CustomFieldsValidator.validate(customFieldsMapping, analysis);
        
        // Show validation summary
        const summary = CustomFieldsValidator.generateSummary(validation);
        logger.info('\n' + summary + '\n');
        
        if (!validation.valid) {
          logger.warn('⚠️  Validation found issues. Review the errors above.');
        } else {
          logger.success('✅ All custom fields validated successfully!');
        }
      }
      
      // Step 4: Generate mapping documentation
      logger.info('📝 Generating mapping documentation...');
      
      const outputDir = output || join(process.cwd(), 'docs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const mappingDoc = this.generateMappingDocumentation(customFieldsMapping, analysis);
      const docPath = join(outputDir, 'JOBBER_SCHEMA_COMPLETE_MAPPING.md');
      fs.writeFileSync(docPath, mappingDoc, 'utf8');
      logger.success(`   Documentation saved: ${docPath}\n`);
      
      // Step 5: Show summary
      logger.success('✅ Custom fields mapping complete!');
      logger.info(`\n📊 Summary:`);
      logger.info(`   - Custom Fields: ${customFieldsMapping.totalFields}`);
      logger.info(`   - Custom Field Types: ${customFieldsMapping.types.length}`);
      logger.info(`   - Schema Custom Field Types: ${analysis.customFieldTypes?.length || 0}`);
      logger.info(`   - Entities with Custom Fields: ${analysis.entitiesWithCustomFields?.length || 0}\n`);
      
      if (cancel.cancelled()) {
        logger.warn('\n⚠️  Schema mapping was cancelled');
        cancel.cleanup();
        return;
      }
      
      cancel.cleanup();
      return {
        mapping: customFieldsMapping,
        analysis: analysis,
        validation: validate !== false ? CustomFieldsValidator.validate(customFieldsMapping, analysis) : null
      };
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }

  async refreshSchema(args) {
    const cancel = this.setupCancellation('Schema Refresh');

    try {
      const cache = this.schemaManager.getCache();

      // Load existing introspection data
      const existingData = cache.loadIntrospection();
      if (!existingData) {
        throw new Error('No cached introspection data found. Run "jobber schema fetch" first (costs 45k units).');
      }

      const cachedTypes = existingData.__schema.types;
      logger.info(`📦 Cached schema: ${cachedTypes.length} types\n`);

      // Determine which profiles to run
      let profiles = [];
      if (args.customFields || args['custom-fields']) {
        profiles.push('custom-fields', 'entities');
      } else if (args.core) {
        profiles.push('core');
      } else if (args.all) {
        profiles = ['roots', 'custom-fields', 'entities', 'core'];
      } else if (args.types) {
        // Custom type list
        const typeNames = args.types.split(',').map(t => t.trim());
        const introspector = new IncrementalIntrospector(this.client);
        logger.info(`🔍 Refreshing ${typeNames.length} specific types...\n`);

        const results = await introspector.introspectBatch(typeNames, (cur, total, name) => {
          logger.info(`  [${cur}/${total}] ${name}`);
        });

        if (results.updated.length > 0) {
          const merged = IncrementalIntrospector.mergeTypes(existingData, results.updated);
          await this._regenerateCache(cache, merged, this.client);
        }

        this._showRefreshSummary([{
          profile: 'custom', label: 'Custom Types',
          queried: typeNames.length, updated: results.updated.length,
          failed: results.failed.length, notFound: results.notFound.length
        }]);

        cancel.cleanup();
        return;
      } else {
        // Default: custom fields + entities (most common need)
        profiles.push('custom-fields', 'entities');
      }

      // Run profiles
      const introspector = new IncrementalIntrospector(this.client);
      const results = await introspector.runProfiles(profiles, cachedTypes);

      if (cancel.cancelled()) {
        logger.warn('\n⚠️  Schema refresh was cancelled');
        cancel.cleanup();
        return;
      }

      // Merge and regenerate
      if (results.updated.length > 0) {
        logger.info('\n🔄 Merging updated types into cache...');
        const merged = IncrementalIntrospector.mergeTypes(existingData, results.updated);
        await this._regenerateCache(cache, merged, this.client);
      } else {
        logger.warn('No types were updated.');
      }

      this._showRefreshSummary(results.batches);
      cancel.cleanup();
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }

  async _regenerateCache(cache, mergedData, client = null) {
    // Save merged introspection
    cache.saveIntrospection(mergedData);
    logger.success('  Introspection cache updated');

    // Regenerate SDL — auto-fetch missing referenced types
    const maxAttempts = 50;
    let attempt = 0;
    const fetchedTypes = new Set();
    const introspector = client ? new IncrementalIntrospector(client) : null;
    while (attempt < maxAttempts) {
      try {
        const schema = buildClientSchema(mergedData);
        const sdl = printSchema(schema);
        cache.saveSchema(sdl);
        logger.success('  Schema SDL regenerated');
        break;
      } catch (error) {
        const match = error.message.match(/unknown type: (\w+)/);
        if (match && introspector) {
          const missingType = match[1];
          if (fetchedTypes.has(missingType)) {
            logger.warn(`  Type ${missingType} already fetched but still unresolved — aborting`);
            break;
          }
          attempt++;
          fetchedTypes.add(missingType);
          logger.info(`  Fetching missing type: ${missingType} (${attempt}/${maxAttempts})`);
          const typeData = await introspector.introspectType(missingType);
          if (typeData) {
            IncrementalIntrospector.mergeTypes(mergedData, [typeData]);
            continue; // retry SDL build
          }
        }
        logger.warn(`  SDL regeneration failed: ${error.message}`);
        if (!client) {
          logger.warn('  Try running refresh again to auto-fetch missing types.');
        }
        break;
      }
    }
    // Save final merged introspection after all missing types resolved
    cache.saveIntrospection(mergedData);

    // Clear analysis cache so it regenerates on next use
    const analysisPath = cache.getPaths().analysisJson;
    if (fs.existsSync(analysisPath)) {
      fs.unlinkSync(analysisPath);
    }
    const analysisMdPath = cache.getPaths().analysisMd;
    if (fs.existsSync(analysisMdPath)) {
      fs.unlinkSync(analysisMdPath);
    }
    const apiMappingPath = cache.getPaths().apiMappingJson;
    if (fs.existsSync(apiMappingPath)) {
      fs.unlinkSync(apiMappingPath);
    }
    logger.success('  Stale analysis/mapping caches cleared');
  }

  _showRefreshSummary(batches) {
    const totalUpdated = batches.reduce((s, b) => s + b.updated, 0);
    const totalQueried = batches.reduce((s, b) => s + b.queried, 0);
    const totalFailed = batches.reduce((s, b) => s + b.failed, 0);

    logger.info('\n📊 Refresh Summary:');
    batches.forEach(b => {
      logger.info(`   ${b.label}: ${b.updated}/${b.queried} updated`);
    });
    logger.info(`   Total: ${totalUpdated}/${totalQueried} types refreshed`);
    if (totalFailed > 0) {
      logger.warn(`   Failed: ${totalFailed}`);
    }
    logger.success('\n✅ Schema refresh complete!');
    logger.info('   Run "jobber schema analyze --force" to regenerate analysis.');
  }

  /**
   * Generate comprehensive mapping documentation
   * @param {Object} customFieldsMapping - Mapped custom fields
   * @param {Object} analysis - Schema analysis
   * @returns {string} Markdown documentation
   */
  generateMappingDocumentation(customFieldsMapping, analysis) {
    let doc = `# Complete Jobber GraphQL Schema Mapping\n\n`;
    doc += `**Generated:** ${new Date().toISOString()}\n\n`;
    doc += `## Overview\n\n`;
    doc += `This document provides a complete mapping of the Jobber GraphQL API schema, including all custom field types, queries, mutations, and entity relationships.\n\n`;
    
    // Custom Field Types Section
    doc += `## Custom Field Types\n\n`;
    doc += `The Jobber API supports the following custom field types:\n\n`;
    
    if (analysis.customFieldTypes && analysis.customFieldTypes.length > 0) {
      analysis.customFieldTypes.forEach(cfType => {
        doc += `### ${cfType.name}\n\n`;
        if (cfType.description) {
          doc += `${cfType.description}\n\n`;
        }
        doc += `**GraphQL Type:** \`${cfType.name}\`\n\n`;
        
        if (cfType.fields && cfType.fields.length > 0) {
          doc += `**Fields:**\n`;
          cfType.fields.forEach(field => {
            doc += `- \`${field.name}\`: \`${field.type}\``;
            if (field.description) {
              doc += ` - ${field.description}`;
            }
            doc += `\n`;
          });
          doc += `\n`;
        }
        
        // Generate fragment example
        const fragment = this.schemaManager.analyzer.generateCustomFieldFragment(cfType);
        if (fragment) {
          doc += `**GraphQL Fragment:**\n\`\`\`graphql\n${fragment}\n\`\`\`\n\n`;
        }
      });
    } else {
      doc += `*No custom field types found in schema.*\n\n`;
    }
    
    // Entities with Custom Fields
    doc += `## Entities with Custom Fields\n\n`;
    if (analysis.entitiesWithCustomFields && analysis.entitiesWithCustomFields.length > 0) {
      doc += `The following entity types support custom fields:\n\n`;
      analysis.entitiesWithCustomFields.forEach(entity => {
        doc += `- **${entity.name}** - ${entity.description || 'Supports custom fields'}\n`;
      });
      doc += `\n`;
    } else {
      doc += `*No entities with custom fields found.*\n\n`;
    }
    
    // Mapping Summary
    doc += `## Custom Fields Mapping Summary\n\n`;
    doc += `- **Total Custom Fields in Mapping:** ${customFieldsMapping.totalFields}\n`;
    doc += `- **Custom Field Types in Mapping:** ${customFieldsMapping.types.length}\n`;
    doc += `- **Custom Field Types in Schema:** ${analysis.customFieldTypes?.length || 0}\n\n`;
    
    if (customFieldsMapping.types.length > 0) {
      doc += `### Mapped Types:\n\n`;
      customFieldsMapping.types.forEach(type => {
        const count = customFieldsMapping.byType[type]?.length || 0;
        doc += `- \`${type}\`: ${count} field(s)\n`;
      });
      doc += `\n`;
    }
    
    // Usage Examples
    doc += `## Usage Examples\n\n`;
    doc += `### Query Job with All Custom Fields\n\n`;
    doc += `\`\`\`graphql\n`;
    doc += `query GetJobWithCustomFields($id: EncodedId!) {\n`;
    doc += `  job(id: $id) {\n`;
    doc += `    id\n`;
    doc += `    jobNumber\n`;
    doc += `    title\n`;
    const customFieldsFragment = this.schemaManager.analyzer.generateCustomFieldsFragment(analysis);
    if (customFieldsFragment) {
      doc += `    ${customFieldsFragment.split('\n').join('\n    ')}\n`;
    }
    doc += `  }\n`;
    doc += `}\n`;
    doc += `\`\`\`\n\n`;
    
    return doc;
  }

  async mapApi(args) {
    const { force, output, json } = args;
    
    // Set up cancellation handler
    const cancel = this.setupCancellation('API Mapping');
    
    try {
      logger.info('🗺️  Mapping entire Jobber API using introspection...\n');
      
      // Map the API
      const mapping = await this.schemaManager.mapApi(!!force);
      
      if (cancel.cancelled()) {
        logger.warn('\n⚠️  API mapping was cancelled');
        cancel.cleanup();
        return;
      }
      
      // Generate comprehensive documentation
      if (output !== false) {
        logger.info('📝 Generating API mapping documentation...');
        const doc = this.generateApiMappingDocumentation(mapping);
        
        const outputDir = output || join(process.cwd(), 'docs');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const docPath = join(outputDir, 'JOBBER_API_COMPLETE_MAP.md');
        fs.writeFileSync(docPath, doc, 'utf8');
        logger.success(`   Documentation saved: ${docPath}\n`);
      }
      
      // Show summary
      logger.success('✅ Complete API mapping finished!');
      logger.info(`\n📊 Summary:`);
      logger.info(`   - Total Queries: ${mapping.queries?.list?.length || 0}`);
      logger.info(`   - Connection Queries: ${mapping.queries?.connections?.length || 0}`);
      logger.info(`   - Single Object Queries: ${mapping.queries?.singleObjects?.length || 0}`);
      logger.info(`   - Mutations: ${mapping.mutations?.list?.length || 0}`);
      logger.info(`   - Subscriptions: ${mapping.subscriptions?.list?.length || 0}`);
      logger.info(`   - Total Types: ${Object.keys(mapping.types || {}).length}`);
      logger.info(`   - Enums: ${Object.keys(mapping.enums || {}).length}`);
      logger.info(`   - Input Types: ${Object.keys(mapping.inputTypes || {}).length}`);
      logger.info(`   - Connections: ${mapping.connections?.queryConnections?.length || 0}`);
      logger.info(`   - Custom Field Types: ${mapping.customFieldTypes?.length || 0}`);
      logger.info(`   - Entities with Custom Fields: ${mapping.entitiesWithCustomFields?.length || 0}\n`);
      
      if (json) {
        console.log(this.formatJSON(mapping));
      }
      
      cancel.cleanup();
      return mapping;
    } catch (error) {
      cancel.cleanup();
      throw error;
    }
  }

  /**
   * Generate comprehensive API mapping documentation
   * @param {Object} mapping - Complete API mapping
   * @returns {string} Markdown documentation
   */
  generateApiMappingDocumentation(mapping) {
    let doc = `# Complete Jobber API Mapping\n\n`;
    doc += `**Generated:** ${new Date(mapping.metadata?.generatedAt || Date.now()).toISOString()}\n\n`;
    doc += `## Overview\n\n`;
    doc += `This document provides a complete mapping of the Jobber GraphQL API, generated dynamically from introspection.\n\n`;
    doc += `### Statistics\n\n`;
    doc += `- **Total Queries:** ${mapping.queries?.list?.length || 0}\n`;
    doc += `- **Connection Queries:** ${mapping.queries?.connections?.length || 0}\n`;
    doc += `- **Single Object Queries:** ${mapping.queries?.singleObjects?.length || 0}\n`;
    doc += `- **Mutations:** ${mapping.mutations?.list?.length || 0}\n`;
    doc += `- **Subscriptions:** ${mapping.subscriptions?.list?.length || 0}\n`;
    doc += `- **Total Types:** ${Object.keys(mapping.types || {}).length}\n`;
    doc += `- **Enums:** ${Object.keys(mapping.enums || {}).length}\n`;
    doc += `- **Input Types:** ${Object.keys(mapping.inputTypes || {}).length}\n`;
    doc += `- **Interfaces:** ${Object.keys(mapping.interfaces || {}).length}\n`;
    doc += `- **Unions:** ${Object.keys(mapping.unions || {}).length}\n\n`;
    
    // Queries Section
    if (mapping.queries && mapping.queries.list && mapping.queries.list.length > 0) {
      doc += `## Queries\n\n`;
      doc += `### Connection Queries (Paginated)\n\n`;
      mapping.queries.connections.forEach(queryName => {
        const query = mapping.queries.list.find(q => q.name === queryName);
        if (query) {
          doc += this.documentQuery(query);
        }
      });
      
      doc += `### Single Object Queries\n\n`;
      mapping.queries.singleObjects.forEach(queryName => {
        const query = mapping.queries.list.find(q => q.name === queryName);
        if (query) {
          doc += this.documentQuery(query);
        }
      });
    }
    
    // Mutations Section
    if (mapping.mutations && mapping.mutations.list && mapping.mutations.list.length > 0) {
      doc += `## Mutations\n\n`;
      mapping.mutations.list.forEach(mutation => {
        doc += this.documentMutation(mutation);
      });
    }
    
    // Important Types
    doc += `## Important Types\n\n`;
    const importantTypes = ['Job', 'Client', 'Quote', 'Invoice', 'Visit', 'Property', 'User', 'LineItem'];
    importantTypes.forEach(typeName => {
      if (mapping.types[typeName]) {
        doc += this.documentType(mapping.types[typeName]);
      }
    });
    
    // Custom Field Types
    if (mapping.customFieldTypes && mapping.customFieldTypes.length > 0) {
      doc += `## Custom Field Types\n\n`;
      mapping.customFieldTypes.forEach(cfType => {
        doc += this.documentType(cfType);
      });
    }
    
    // Connections
    if (mapping.connections && mapping.connections.queryConnections && mapping.connections.queryConnections.length > 0) {
      doc += `## Connection Patterns\n\n`;
      mapping.connections.queryConnections.forEach(conn => {
        doc += `### ${conn.name}\n\n`;
        doc += `**Return Type:** \`${conn.returnType}\`\n\n`;
        if (conn.paginationArgs && conn.paginationArgs.length > 0) {
          doc += `**Pagination Arguments:**\n`;
          conn.paginationArgs.forEach(arg => {
            doc += `- \`${arg.name}\`: \`${arg.type}\`\n`;
          });
          doc += `\n`;
        }
      });
    }
    
    return doc;
  }

  /**
   * Document a query
   * @param {Object} query - Query definition
   * @returns {string} Markdown documentation
   */
  documentQuery(query) {
    let doc = `### \`${query.name}\`\n\n`;
    if (query.description) {
      doc += `${query.description}\n\n`;
    }
    doc += `**Return Type:** \`${query.returnType}\`\n`;
    doc += `**Is Connection:** ${query.isConnection ? 'Yes' : 'No'}\n`;
    doc += `**Estimated Cost:** ~${query.costEstimate} throttle units\n\n`;
    
    if (query.arguments && query.arguments.length > 0) {
      doc += `**Arguments:**\n`;
      query.arguments.forEach(arg => {
        doc += `- \`${arg.name}\`: \`${arg.type}\``;
        if (arg.isRequired) doc += ` (required)`;
        if (arg.description) doc += ` - ${arg.description}`;
        if (arg.defaultValue !== null) doc += ` (default: ${arg.defaultValue})`;
        doc += `\n`;
      });
      doc += `\n`;
    }
    
    return doc;
  }

  /**
   * Document a mutation
   * @param {Object} mutation - Mutation definition
   * @returns {string} Markdown documentation
   */
  documentMutation(mutation) {
    let doc = `### \`${mutation.name}\`\n\n`;
    if (mutation.description) {
      doc += `${mutation.description}\n\n`;
    }
    doc += `**Return Type:** \`${mutation.returnType}\`\n`;
    doc += `**Estimated Cost:** ~${mutation.costEstimate} throttle units\n\n`;
    
    if (mutation.arguments && mutation.arguments.length > 0) {
      doc += `**Arguments:**\n`;
      mutation.arguments.forEach(arg => {
        doc += `- \`${arg.name}\`: \`${arg.type}\``;
        if (arg.isRequired) doc += ` (required)`;
        if (arg.description) doc += ` - ${arg.description}`;
        doc += `\n`;
      });
      doc += `\n`;
    }
    
    return doc;
  }

  /**
   * Document a type
   * @param {Object} type - Type definition
   * @returns {string} Markdown documentation
   */
  documentType(type) {
    let doc = `### \`${type.name}\` (${type.kind})\n\n`;
    if (type.description) {
      doc += `${type.description}\n\n`;
    }
    
    if (type.fields && type.fields.length > 0) {
      doc += `**Fields (${type.fields.length}):**\n\n`;
      type.fields.slice(0, 30).forEach(field => {
        doc += `- \`${field.name}\`: \`${field.type}\``;
        if (field.isRequired) doc += ` (required)`;
        if (field.isList) doc += ` (list)`;
        if (field.description) doc += ` - ${field.description}`;
        doc += `\n`;
      });
      if (type.fields.length > 30) {
        doc += `\n*... and ${type.fields.length - 30} more fields*\n`;
      }
      doc += `\n`;
    }
    
    if (type.values && type.values.length > 0) {
      doc += `**Enum Values:**\n`;
      type.values.forEach(value => {
        doc += `- \`${value.name}\``;
        if (value.description) doc += ` - ${value.description}`;
        doc += `\n`;
      });
      doc += `\n`;
    }
    
    return doc;
  }
}

export default SchemaCommand;
