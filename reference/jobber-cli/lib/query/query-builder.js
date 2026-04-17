/**
 * Query Builder
 * Helper utilities for building GraphQL queries
 */

export class QueryBuilder {
  /**
   * Build a simple query for a single entity
   * @param {string} entityType - Entity type (e.g., 'job', 'client')
   * @param {string} id - Entity ID
   * @param {Array} fields - Fields to select
   * @returns {string} GraphQL query
   */
  static buildEntityQuery(entityType, id, fields = ['id']) {
    // Validate inputs
    if (!entityType || typeof entityType !== 'string') {
      throw new Error('Entity type must be a non-empty string');
    }
    if (!/^[a-zA-Z_]\w*$/.test(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    if (!id || typeof id !== 'string') {
      throw new Error('Entity ID must be a non-empty string');
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be a non-empty array');
    }

    const fieldSelection = fields.join('\n      ');
    return `
      query Get${this.capitalize(entityType)}($id: ID!) {
        ${entityType}(id: $id) {
          ${fieldSelection}
        }
      }
    `;
  }

  /**
   * Build a search query with filters
   * @param {string} entityType - Entity type (plural, e.g., 'jobs', 'clients')
   * @param {Object} filters - Filter object
   * @param {Array} fields - Fields to select
   * @param {Object} pagination - Pagination options
   * @returns {string} GraphQL query
   */
  static buildSearchQuery(entityType, filters = {}, fields = ['id'], pagination = {}) {
    // Validate inputs
    if (!entityType || typeof entityType !== 'string') {
      throw new Error('Entity type must be a non-empty string');
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be a non-empty array');
    }

    if (typeof filters !== 'object' || filters === null || Array.isArray(filters)) {
      throw new Error('Filters must be an object');
    }

    if (pagination && (typeof pagination !== 'object' || Array.isArray(pagination))) {
      throw new Error('Pagination must be an object');
    }

    const fieldSelection = fields.join('\n          ');
    const hasFilters = Object.keys(filters).length > 0;
    const filterVar = hasFilters ? `$filter: ${this.getFilterType(entityType)}, ` : '';
    const filterArg = hasFilters ? 'filter: $filter, ' : '';

    return `
      query Search${this.capitalize(entityType)}(${filterVar}$first: Int, $after: String) {
        ${entityType}(${filterArg}first: $first, after: $after) {
          nodes {
            ${fieldSelection}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }

  /**
   * Get filter type name for entity type
   */
  static getFilterType(entityType) {
    const singular = entityType.replace(/s$/, '');
    return this.capitalize(singular) + 'FilterAttributes';
  }

  /**
   * Capitalize first letter
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Build field selection for nested objects
   * @param {Object} fields - Field specification object
   * @returns {string} Formatted field selection
   */
  static buildFieldSelection(fields) {
    const lines = [];
    
    for (const [key, value] of Object.entries(fields)) {
      if (value === true || typeof value === 'string' || Array.isArray(value)) {
        lines.push(`  ${key}`);
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`  ${key} {`);
        lines.push(this.buildFieldSelection(value).split('\n').map(l => '  ' + l).join('\n'));
        lines.push(`  }`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Generate custom fields fragment for GraphQL queries
   * @param {Array|Object} customFieldTypes - Array of custom field type names or mapping object
   * @param {Object} options - Options for fragment generation
   * @returns {string} GraphQL fragment for customFields
   */
  static buildCustomFieldsFragment(customFieldTypes, options = {}) {
    const {
      includeId = true,
      includeLabel = true,
      includeConfiguration = true,
      includeUnit = true
    } = options;

    // Handle different input formats
    let types = [];
    if (Array.isArray(customFieldTypes)) {
      types = customFieldTypes;
    } else if (customFieldTypes && customFieldTypes.types) {
      types = customFieldTypes.types;
    } else if (customFieldTypes && customFieldTypes.graphqlFragments) {
      // Use pre-generated fragments
      const fragments = Object.values(customFieldTypes.graphqlFragments);
      if (fragments.length === 0) {
        return '';
      }
      return `customFields {
      ${fragments.join('\n      ')}
    }`;
    }

    if (types.length === 0) {
      // Default to all known custom field types
      types = [
        'CustomFieldText',
        'CustomFieldNumeric',
        'CustomFieldTrueFalse',
        'CustomFieldDropdown',
        'CustomFieldLink',
        'CustomFieldArea'
      ];
    }

    const fragments = types.map(typeName => {
      return this.buildCustomFieldTypeFragment(typeName, {
        includeId,
        includeLabel,
        includeConfiguration,
        includeUnit
      });
    });

    if (fragments.length === 0) {
      return '';
    }

    return `customFields {
      ${fragments.join('\n      ')}
    }`;
  }

  /**
   * Build fragment for a single custom field type
   * @param {string} typeName - Custom field type name (e.g., 'CustomFieldText')
   * @param {Object} options - Fragment options
   * @returns {string} GraphQL fragment
   */
  static buildCustomFieldTypeFragment(typeName, options = {}) {
    const {
      includeId = true,
      includeLabel = true,
      includeConfiguration = true,
      includeUnit = true
    } = options;

    const fields = [];
    
    if (includeId) {
      fields.push('id');
    }
    
    if (includeLabel) {
      fields.push('label');
    }
    
    if (includeConfiguration) {
      fields.push('customFieldConfiguration {\n          id\n          name\n        }');
    }

    // Add value field based on type
    const valueField = this.getCustomFieldValueField(typeName);
    if (valueField) {
      fields.push(valueField);
    }

    // Add unit for types that support it
    if (includeUnit && this.customFieldTypeHasUnit(typeName)) {
      fields.push('unit');
    }

    return `... on ${typeName} {
        ${fields.join('\n        ')}
      }`;
  }

  /**
   * Get the value field for a custom field type
   * @param {string} typeName - Custom field type name
   * @returns {string|null} Value field GraphQL fragment
   */
  static getCustomFieldValueField(typeName) {
    const valueFields = {
      'CustomFieldText': 'valueText',
      'CustomFieldNumeric': 'valueNumeric',
      'CustomFieldTrueFalse': 'valueTrueFalse',
      'CustomFieldDropdown': 'valueDropdown',
      'CustomFieldLink': 'valueLink {\n          text\n          url\n        }',
      'CustomFieldArea': 'valueArea {\n          length\n          width\n        }'
    };

    return valueFields[typeName] || null;
  }

  /**
   * Check if a custom field type has a unit field
   * @param {string} typeName - Custom field type name
   * @returns {boolean} True if type has unit field
   */
  static customFieldTypeHasUnit(typeName) {
    return ['CustomFieldNumeric', 'CustomFieldArea'].includes(typeName);
  }
}

export default QueryBuilder;
