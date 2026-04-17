/**
 * Schema Analyzer
 * Analyzes GraphQL schema to extract queries, types, fields, and relationships
 * Ported from analyze_schema.js
 */

import { buildSchema } from 'graphql';
import { formatDateTimePST } from '../utils/date-formatter.js';

export class SchemaAnalyzer {
  /**
   * Analyze schema content and extract structured information
   * @param {string} schemaContent - Schema in SDL format
   * @returns {Object} Analysis object with queries, types, connections, etc.
   */
  analyze(schemaContent) {
    try {
      // Parse the schema
      const schema = buildSchema(schemaContent);
      
      // Extract information
      const analysis = {
        queries: [],
        types: {},
        connections: [],
        singleObjects: [],
        enums: [],
        inputTypes: [],
        customFieldTypes: [],
        entitiesWithCustomFields: [],
        generatedAt: new Date().toISOString()
      };

      // Get Query type
      const queryType = schema.getQueryType();
      if (queryType) {
        const fields = queryType.getFields();
        
        Object.values(fields).forEach(field => {
          const fieldInfo = {
            name: field.name,
            description: field.description || null,
            returnType: field.type.toString(),
            arguments: field.args.map(arg => ({
              name: arg.name,
              type: arg.type.toString(),
              description: arg.description || null,
              defaultValue: arg.defaultValue !== undefined ? String(arg.defaultValue) : null
            }))
          };

          // Check if it's a connection type (paginated)
          const returnTypeStr = field.type.toString();
          if (returnTypeStr.includes('Connection') || returnTypeStr.includes('!')) {
            // Check if it has first/last/after/before args (connection pattern)
            const hasPaginationArgs = field.args.some(arg => 
              ['first', 'last', 'after', 'before'].includes(arg.name)
            );
            if (hasPaginationArgs) {
              analysis.connections.push(field.name);
            } else {
              analysis.singleObjects.push(field.name);
            }
          } else {
            analysis.singleObjects.push(field.name);
          }

          analysis.queries.push(fieldInfo);
        });
      }

      // Extract all types
      const typeMap = schema.getTypeMap();
      Object.values(typeMap).forEach(type => {
        // Skip built-in types
        if (type.name.startsWith('__')) return;
        if (['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)) return;

        const typeInfo = {
          name: type.name,
          kind: type.constructor.name.replace('GraphQL', '').replace('Type', ''),
          description: type.description || null
        };

        // Add fields if it's an object type
        if (type.getFields) {
          const fields = type.getFields();
          typeInfo.fields = Object.values(fields).map(field => ({
            name: field.name,
            type: field.type.toString(),
            description: field.description || null,
            args: field.args ? field.args.map(arg => ({
              name: arg.name,
              type: arg.type.toString()
            })) : []
          }));
        }

        // Handle enums
        if (type.getValues) {
          typeInfo.values = type.getValues().map(val => ({
            name: val.name,
            value: val.value,
            description: val.description || null
          }));
          analysis.enums.push(type.name);
        }

        // Handle input types
        if (typeInfo.kind === 'InputObject') {
          analysis.inputTypes.push(type.name);
        }

        analysis.types[type.name] = typeInfo;
      });

      // Extract custom field types
      analysis.customFieldTypes = this.extractCustomFieldTypes(analysis.types);
      
      // Find entities that support customFields
      analysis.entitiesWithCustomFields = this.findEntitiesWithCustomFields(analysis.types);

      return analysis;
    } catch (error) {
      throw new Error(`Error analyzing schema: ${error.message}`);
    }
  }

  /**
   * Generate markdown documentation from analysis
   * @param {Object} analysis - Analysis object from analyze()
   * @returns {string} Markdown documentation
   */
  generateMarkdown(analysis) {
    let md = `# Jobber GraphQL Schema Analysis\n\n`;
    md += `**Generated:** ${formatDateTimePST(analysis.generatedAt)}\n\n`;
    md += `---\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `- **Total Queries:** ${analysis.queries.length}\n`;
    md += `- **Connection Queries (Paginated):** ${analysis.connections.length}\n`;
    md += `- **Single Object Queries:** ${analysis.singleObjects.length}\n`;
    md += `- **Total Types:** ${Object.keys(analysis.types).length}\n`;
    md += `- **Enums:** ${analysis.enums.length}\n`;
    md += `- **Input Types:** ${analysis.inputTypes.length}\n\n`;
    md += `---\n\n`;

    // Queries
    md += `## Available Queries\n\n`;
    md += `### Connection Queries (Paginated)\n\n`;
    analysis.connections.forEach(queryName => {
      const query = analysis.queries.find(q => q.name === queryName);
      if (query) {
        md += `#### \`${query.name}\`\n\n`;
        if (query.description) md += `${query.description}\n\n`;
        md += `**Return Type:** \`${query.returnType}\`\n\n`;
        if (query.arguments.length > 0) {
          md += `**Arguments:**\n`;
          query.arguments.forEach(arg => {
            md += `- \`${arg.name}\` (\`${arg.type}\`)`;
            if (arg.description) md += ` - ${arg.description}`;
            if (arg.defaultValue !== null) md += ` (default: ${arg.defaultValue})`;
            md += `\n`;
          });
        }
        md += `\n`;
      }
    });

    md += `### Single Object Queries\n\n`;
    analysis.singleObjects.forEach(queryName => {
      const query = analysis.queries.find(q => q.name === queryName);
      if (query) {
        md += `#### \`${query.name}\`\n\n`;
        if (query.description) md += `${query.description}\n\n`;
        md += `**Return Type:** \`${query.returnType}\`\n\n`;
        if (query.arguments.length > 0) {
          md += `**Arguments:**\n`;
          query.arguments.forEach(arg => {
            md += `- \`${arg.name}\` (\`${arg.type}\`)`;
            if (arg.description) md += ` - ${arg.description}`;
            if (arg.defaultValue !== null) md += ` (default: ${arg.defaultValue})`;
            md += `\n`;
          });
        }
        md += `\n`;
      }
    });

    md += `---\n\n`;

    // Important Types
    md += `## Important Types\n\n`;
    const importantTypes = ['Job', 'Client', 'Quote', 'Invoice', 'Visit', 'Property'];
    importantTypes.forEach(typeName => {
      if (analysis.types[typeName]) {
        const type = analysis.types[typeName];
        md += `### \`${type.name}\` (${type.kind})\n\n`;
        if (type.description) md += `${type.description}\n\n`;
        if (type.fields) {
          md += `**Fields:**\n\n`;
          type.fields.slice(0, 20).forEach(field => { // Limit to first 20 fields
            md += `- \`${field.name}\`: \`${field.type}\``;
            if (field.description) md += ` - ${field.description}`;
            md += `\n`;
          });
          if (type.fields.length > 20) {
            md += `\n*... and ${type.fields.length - 20} more fields*\n`;
          }
        }
        md += `\n`;
      }
    });

    // Common Filters
    md += `## Common Filter Types\n\n`;
    const filterTypes = Object.keys(analysis.types).filter(name => 
      name.includes('Filter') || name.includes('Attributes')
    );
    filterTypes.forEach(filterName => {
      const filter = analysis.types[filterName];
      if (filter && filter.fields) {
        md += `### \`${filter.name}\`\n\n`;
        filter.fields.forEach(field => {
          md += `- \`${field.name}\`: \`${field.type}\`\n`;
        });
        md += `\n`;
      }
    });

    return md;
  }

  /**
   * Find type information in analysis
   * @param {Object} analysis - Analysis object
   * @param {string} typeName - Type name to find
   * @returns {Object|null} Type information or null
   */
  findType(analysis, typeName) {
    return analysis.types[typeName] || null;
  }

  /**
   * Find field information in a type
   * @param {Object} typeInfo - Type information object
   * @param {string} fieldName - Field name to find
   * @returns {Object|null} Field information or null
   */
  findField(typeInfo, fieldName) {
    if (!typeInfo.fields) return null;
    return typeInfo.fields.find(f => f.name === fieldName) || null;
  }

  /**
   * Get suggestions for similar field/type names (for error recovery)
   * @param {Object} analysis - Analysis object
   * @param {string} searchTerm - Term to search for
   * @returns {Array} Array of suggestions
   */
  getSuggestions(analysis, searchTerm) {
    const suggestions = [];
    const lowerSearch = searchTerm.toLowerCase();

    // Search in types - check for exact match, contains, or starts with
    Object.keys(analysis.types).forEach(typeName => {
      const lowerType = typeName.toLowerCase();
      
      // Exact match (highest priority)
      if (lowerType === lowerSearch) {
        suggestions.unshift({ type: 'type', name: typeName, match: 'exact' });
      }
      // Starts with (high priority)
      else if (lowerType.startsWith(lowerSearch)) {
        suggestions.push({ type: 'type', name: typeName, match: 'starts' });
      }
      // Contains (lower priority)
      else if (lowerType.includes(lowerSearch)) {
        suggestions.push({ type: 'type', name: typeName, match: 'contains' });
      }
      // Fuzzy match for short queries (e.g., "Jb" -> "Job")
      else if (searchTerm.length >= 2 && lowerSearch.length <= 4) {
        // Check if search term appears at the start of type name words
        const typeWords = lowerType.split(/(?=[A-Z])/);
        if (typeWords.some(word => word.startsWith(lowerSearch))) {
          suggestions.push({ type: 'type', name: typeName, match: 'fuzzy' });
        }
      }
    });

    // Search in query names
    analysis.queries.forEach(query => {
      if (query.name.toLowerCase().includes(lowerSearch)) {
        suggestions.push({ type: 'query', name: query.name });
      }
    });

    // Search in fields of important types
    const importantTypes = ['Job', 'Client', 'Quote', 'Invoice', 'Visit'];
    importantTypes.forEach(typeName => {
      const type = analysis.types[typeName];
      if (type && type.fields) {
        type.fields.forEach(field => {
          if (field.name.toLowerCase().includes(lowerSearch)) {
            suggestions.push({ 
              type: 'field', 
              name: field.name, 
              parentType: typeName 
            });
          }
        });
      }
    });

    return suggestions;
  }

  /**
   * Extract all CustomField* types from schema
   * @param {Object} types - Types map from analysis
   * @returns {Array} Array of custom field type information
   */
  extractCustomFieldTypes(types) {
    const customFieldTypes = [];
    
    Object.keys(types).forEach(typeName => {
      if (typeName.startsWith('CustomField') && typeName !== 'CustomFieldUnion' && typeName !== 'CustomFieldConfiguration') {
        const type = types[typeName];
        if (type && type.fields) {
          customFieldTypes.push({
            name: typeName,
            kind: type.kind,
            description: type.description,
            fields: type.fields,
            valueField: this.findValueField(type.fields, typeName)
          });
        }
      }
    });

    return customFieldTypes.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Find the value field for a custom field type
   * @param {Array} fields - Fields array
   * @param {string} typeName - Type name
   * @returns {Object|null} Value field information
   */
  findValueField(fields, typeName) {
    // Common patterns: valueText, valueNumeric, valueTrueFalse, valueDropdown, valueLink, valueArea
    const valueField = fields.find(f => 
      f.name.startsWith('value') || 
      f.name === 'value' ||
      (typeName === 'CustomFieldArea' && f.name === 'valueArea') ||
      (typeName === 'CustomFieldLink' && f.name === 'valueLink')
    );
    
    return valueField || null;
  }

  /**
   * Find all entity types that have a customFields field
   * @param {Object} types - Types map from analysis
   * @returns {Array} Array of entity type names that support customFields
   */
  findEntitiesWithCustomFields(types) {
    const entities = [];
    
    Object.keys(types).forEach(typeName => {
      const type = types[typeName];
      // Skip custom field types themselves
      if (typeName.startsWith('CustomField')) return;
      
      if (type && type.fields) {
        const hasCustomFields = type.fields.some(field => 
          field.name === 'customFields' || 
          field.name === 'customField'
        );
        
        if (hasCustomFields) {
          entities.push({
            name: typeName,
            kind: type.kind,
            description: type.description,
            customFieldsType: this.getCustomFieldsType(type.fields)
          });
        }
      }
    });

    return entities.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get the type of customFields field
   * @param {Array} fields - Fields array
   * @returns {string|null} Type of customFields field
   */
  getCustomFieldsType(fields) {
    const customFieldsField = fields.find(f => f.name === 'customFields' || f.name === 'customField');
    return customFieldsField ? customFieldsField.type : null;
  }

  /**
   * Generate GraphQL fragment for all custom field types
   * @param {Object} analysis - Analysis object
   * @returns {string} GraphQL fragment string
   */
  generateCustomFieldsFragment(analysis) {
    if (!analysis.customFieldTypes || analysis.customFieldTypes.length === 0) {
      return '';
    }

    const fragments = analysis.customFieldTypes.map(cfType => {
      const fragment = this.generateCustomFieldFragment(cfType);
      return fragment;
    });

    return `customFields {
      ${fragments.join('\n      ')}
    }`;
  }

  /**
   * Generate GraphQL fragment for a single custom field type
   * @param {Object} customFieldType - Custom field type information
   * @returns {string} GraphQL fragment
   */
  generateCustomFieldFragment(customFieldType) {
    const baseFields = ['id', 'label', 'customFieldConfiguration { id name }'];
    const valueField = customFieldType.valueField;
    
    let fragment = `... on ${customFieldType.name} {\n        ${baseFields.join('\n        ')}`;
    
    if (valueField) {
      fragment += `\n        ${valueField.name}`;
      
      // Handle nested value types (like valueLink, valueArea)
      if (valueField.type.includes('LinkValue') || valueField.type.includes('AreaValue')) {
        if (valueField.type.includes('LinkValue')) {
          fragment += ` {\n          text\n          url\n        }`;
        } else if (valueField.type.includes('AreaValue')) {
          fragment += ` {\n          length\n          width\n        }`;
        }
      }
    }
    
    // Add unit field for types that have it
    if (customFieldType.fields.some(f => f.name === 'unit')) {
      fragment += `\n        unit`;
    }
    
    fragment += `\n      }`;
    
    return fragment;
  }
}

export default SchemaAnalyzer;
