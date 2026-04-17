/**
 * Purpose: Parse and map custom fields JSON schema to GraphQL types
 * Inputs: Custom fields JSON schema (file path or object)
 * Outputs: Structured mapping object with field definitions and GraphQL type mappings
 * Dependencies: fs, logger
 */

import fs from 'fs';
import logger from '../utils/logger.js';

export class CustomFieldsMapper {
  /**
   * Parse custom fields JSON from file or object
   * @param {string|Object} input - File path or JSON object
   * @returns {Object} Parsed custom fields schema
   */
  static parse(input) {
    let jsonData;
    
    if (typeof input === 'string') {
      // Assume it's a file path
      if (!fs.existsSync(input)) {
        throw new Error(`Custom fields file not found: ${input}`);
      }
      const content = fs.readFileSync(input, 'utf8');
      try {
        jsonData = JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON in custom fields file: ${error.message}`);
      }
    } else if (typeof input === 'object' && input !== null) {
      jsonData = input;
    } else {
      throw new Error('Input must be a file path (string) or JSON object');
    }

    return this.validateAndMap(jsonData);
  }

  /**
   * Validate and map custom fields schema
   * @param {Object} jsonData - Parsed JSON data
   * @returns {Object} Mapped custom fields structure
   */
  static validateAndMap(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Custom fields schema must be an object');
    }

    const mapping = {
      fields: [],
      types: new Set(),
      byName: {},
      byType: {},
      byEntity: {},
      graphqlFragments: {}
    };

    // Handle different possible JSON structures
    let fieldsArray = [];
    let entityType = null;
    
    // Check if this is the entity-based structure (job.json, invoice.json, etc.)
    // Structure: { "job": { "fieldName": { "type": "text" }, ... } }
    const topLevelKeys = Object.keys(jsonData);
    if (topLevelKeys.length === 1 && ['job', 'invoice', 'quote', 'client', 'property'].includes(topLevelKeys[0])) {
      entityType = topLevelKeys[0];
      const entityFields = jsonData[entityType];
      
      // Convert to array format
      fieldsArray = Object.entries(entityFields).map(([fieldName, fieldDef]) => ({
        name: fieldName,
        ...fieldDef,
        appliesTo: entityType.toUpperCase() + 'S' // e.g., "JOBS", "INVOICES"
      }));
    } else if (Array.isArray(jsonData)) {
      fieldsArray = jsonData;
    } else if (Array.isArray(jsonData.fields)) {
      fieldsArray = jsonData.fields;
    } else if (Array.isArray(jsonData.customFields)) {
      fieldsArray = jsonData.customFields;
    } else if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
      fieldsArray = jsonData.nodes;
    } else {
      // Try to extract fields from object values
      fieldsArray = Object.values(jsonData).filter(item => 
        item && typeof item === 'object' && (item.name || item.id || item.type)
      );
    }

    // Map each field
    fieldsArray.forEach((field, index) => {
      if (!field || typeof field !== 'object') {
        logger.warn(`Skipping invalid field at index ${index}`);
        return;
      }

      const fieldDef = this.mapFieldDefinition(field);
      if (fieldDef) {
        mapping.fields.push(fieldDef);
        mapping.types.add(fieldDef.graphqlType);
        
        if (fieldDef.name) {
          mapping.byName[fieldDef.name] = fieldDef;
        }
        
        if (!mapping.byType[fieldDef.graphqlType]) {
          mapping.byType[fieldDef.graphqlType] = [];
        }
        mapping.byType[fieldDef.graphqlType].push(fieldDef);
        
        // Group by entity type if available
        if (fieldDef.appliesTo) {
          const entityKey = fieldDef.appliesTo.toLowerCase();
          if (!mapping.byEntity[entityKey]) {
            mapping.byEntity[entityKey] = [];
          }
          mapping.byEntity[entityKey].push(fieldDef);
        }
      }
    });

    // Generate GraphQL fragments for each type
    mapping.graphqlFragments = this.generateGraphQLFragments(mapping.byType);

    return {
      fields: mapping.fields,
      types: Array.from(mapping.types).sort(),
      byName: mapping.byName,
      byType: mapping.byType,
      byEntity: mapping.byEntity,
      graphqlFragments: mapping.graphqlFragments,
      totalFields: mapping.fields.length,
      entityType: entityType
    };
  }

  /**
   * Map a single field definition to structured format
   * @param {Object} field - Raw field object
   * @returns {Object|null} Mapped field definition
   */
  static mapFieldDefinition(field) {
    // Extract field name
    const name = field.name || field.label || field.id || null;
    
    // Extract type - could be in various fields
    const type = field.type || field.valueType || field.fieldType || null;
    
    // Map to GraphQL type
    const graphqlType = this.mapToGraphQLType(type, field);
    
    if (!graphqlType) {
      logger.warn(`Could not determine GraphQL type for field: ${name || 'unknown'}`);
      return null;
    }

    return {
      name: name,
      type: type,
      graphqlType: graphqlType,
      label: field.label || name,
      appliesTo: field.appliesTo || field.applies_to || null,
      defaultValue: field.defaultValue || field.default_value || null,
      readOnly: field.readOnly || field.read_only || false,
      transferable: field.transferable !== false,
      unit: field.unit || null,
      options: field.options || field.dropdownOptions || null,
      original: field // Keep original for reference
    };
  }

  /**
   * Map field type to GraphQL CustomField type
   * @param {string} type - Field type string
   * @param {Object} field - Full field object for context
   * @returns {string|null} GraphQL type name
   */
  static mapToGraphQLType(type, field = {}) {
    if (!type) {
      // Try to infer from field structure
      if (field.valueLink || field.link) return 'CustomFieldLink';
      if (field.valueArea || field.area) return 'CustomFieldArea';
      if (field.valueNumeric !== undefined || field.numeric !== undefined) return 'CustomFieldNumeric';
      if (field.valueTrueFalse !== undefined || field.trueFalse !== undefined) return 'CustomFieldTrueFalse';
      if (field.valueDropdown !== undefined || field.dropdown !== undefined || field.options) return 'CustomFieldDropdown';
      if (field.valueText !== undefined || field.text !== undefined) return 'CustomFieldText';
      return null;
    }

    const typeLower = String(type).toLowerCase();
    
    // Handle common type mappings
    const typeMap = {
      'text': 'CustomFieldText',
      'numeric': 'CustomFieldNumeric',
      'number': 'CustomFieldNumeric',
      'true_false': 'CustomFieldTrueFalse',
      'boolean': 'CustomFieldTrueFalse',
      'bool': 'CustomFieldTrueFalse',
      'dropdown': 'CustomFieldDropdown',
      'select': 'CustomFieldDropdown',
      'enum': 'CustomFieldDropdown', // enum with options maps to dropdown
      'link': 'CustomFieldLink',
      'url': 'CustomFieldLink',
      'area': 'CustomFieldArea'
    };

    // Check if it's an enum type (has options array)
    if (typeLower === 'enum' || (field.options && Array.isArray(field.options))) {
      return 'CustomFieldDropdown';
    }

    return typeMap[typeLower] || null;
  }

  /**
   * Generate GraphQL fragments for all custom field types
   * @param {Object} byType - Fields grouped by GraphQL type
   * @returns {Object} GraphQL fragments for each type
   */
  static generateGraphQLFragments(byType) {
    const fragments = {};

    // Standard fragments for known types
    const standardFragments = {
      CustomFieldText: `... on CustomFieldText {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueText
      }`,
      CustomFieldNumeric: `... on CustomFieldNumeric {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueNumeric
        unit
      }`,
      CustomFieldTrueFalse: `... on CustomFieldTrueFalse {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueTrueFalse
      }`,
      CustomFieldDropdown: `... on CustomFieldDropdown {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueDropdown
      }`,
      CustomFieldLink: `... on CustomFieldLink {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueLink {
          text
          url
        }
      }`,
      CustomFieldArea: `... on CustomFieldArea {
        id
        label
        customFieldConfiguration {
          id
          name
        }
        valueArea {
          length
          width
        }
        unit
      }`
    };

    // Use standard fragments for known types, or generate custom ones
    Object.keys(byType).forEach(graphqlType => {
      if (standardFragments[graphqlType]) {
        fragments[graphqlType] = standardFragments[graphqlType];
      } else {
        // Generate a basic fragment for unknown types
        fragments[graphqlType] = `... on ${graphqlType} {
        id
        label
        customFieldConfiguration {
          id
          name
        }
      }`;
      }
    });

    return fragments;
  }

  /**
   * Generate complete customFields fragment for GraphQL queries
   * @param {Object} mapping - Mapped custom fields structure
   * @returns {string} Complete GraphQL fragment
   */
  static generateCustomFieldsFragment(mapping) {
    if (!mapping || !mapping.graphqlFragments) {
      throw new Error('Invalid mapping object');
    }

    const fragments = Object.values(mapping.graphqlFragments);
    
    if (fragments.length === 0) {
      return '';
    }

    return `customFields {
      ${fragments.join('\n      ')}
    }`;
  }
}

export default CustomFieldsMapper;

