/**
 * Purpose: Schema Introspector - deep inspection of GraphQL schema for adaptive query building
 * Inputs: Introspection data, API mapping, type names
 * Outputs: Type details, field information, relationship data, query patterns
 * Dependencies: Schema cache, logger
 */

import logger from '../utils/logger.js';
import SchemaCache from '../schema/schema-cache.js';

export class SchemaIntrospector {
  constructor(apiMapping = null, introspectionData = null) {
    this.apiMapping = apiMapping;
    this.introspectionData = introspectionData;
    this.typeCache = new Map();
    
    // Load from cache if not provided
    if (!this.introspectionData) {
      const cache = new SchemaCache();
      this.introspectionData = cache.loadIntrospection();
    }
    
    if (!this.apiMapping && !this.introspectionData) {
      throw new Error('Either apiMapping or introspectionData required');
    }
    
    // Build type index for fast lookup
    if (this.introspectionData) {
      this._buildTypeIndex();
    }
  }

  /**
   * Build fast lookup index for types
   * @private
   */
  _buildTypeIndex() {
    if (!this.introspectionData?.__schema?.types) return;
    
    for (const type of this.introspectionData.__schema.types) {
      this.typeCache.set(type.name, type);
    }
    
    logger.debug(`Indexed ${this.typeCache.size} types`);
  }

  /**
   * Get type definition by name
   * @param {string} typeName - Type name
   * @returns {Object|null} Type definition
   */
  getType(typeName) {
    // Handle wrapped types (NON_NULL, LIST)
    const unwrapped = this._unwrapTypeName(typeName);
    return this.typeCache.get(unwrapped);
  }

  /**
   * Unwrap type name from NON_NULL and LIST wrappers
   * @private
   */
  _unwrapTypeName(typeNameOrObject) {
    if (typeof typeNameOrObject === 'string') {
      return typeNameOrObject.replace(/[!\[\]]/g, '');
    }
    
    if (typeNameOrObject?.name) {
      return typeNameOrObject.name;
    }
    
    if (typeNameOrObject?.ofType) {
      return this._unwrapTypeName(typeNameOrObject.ofType);
    }
    
    return null;
  }

  /**
   * Check if type is a union
   * @param {string} typeName - Type name
   * @returns {boolean}
   */
  isUnionType(typeName) {
    const type = this.getType(typeName);
    return type?.kind === 'UNION';
  }

  /**
   * Check if type is an interface
   * @param {string} typeName - Type name
   * @returns {boolean}
   */
  isInterfaceType(typeName) {
    const type = this.getType(typeName);
    return type?.kind === 'INTERFACE';
  }

  /**
   * Check if type is an enum
   * @param {string} typeName - Type name
   * @returns {boolean}
   */
  isEnumType(typeName) {
    const type = this.getType(typeName);
    return type?.kind === 'ENUM';
  }

  /**
   * Check if type is a scalar
   * @param {string} typeName - Type name
   * @returns {boolean}
   */
  isScalarType(typeName) {
    const type = this.getType(typeName);
    return type?.kind === 'SCALAR';
  }

  /**
   * Get possible types for a union
   * @param {string} typeName - Union type name
   * @returns {Array<string>} Array of possible type names
   */
  getUnionPossibleTypes(typeName) {
    const type = this.getType(typeName);
    
    if (type?.kind !== 'UNION') {
      return [];
    }
    
    return (type.possibleTypes || []).map(t => t.name);
  }

  /**
   * Get all fields for a type
   * @param {string} typeName - Type name
   * @returns {Array<Object>} Array of field definitions
   */
  getTypeFields(typeName) {
    const type = this.getType(typeName);
    
    if (!type || !type.fields) {
      return [];
    }
    
    return type.fields;
  }

  /**
   * Get identifier field for a type (id, or first available)
   * @param {string} typeName - Type name
   * @returns {string|null} Field name
   */
  getIdentifierField(typeName) {
    const fields = this.getTypeFields(typeName);
    
    if (fields.length === 0) {
      return null;
    }
    
    // Prefer 'id' field
    const idField = fields.find(f => f.name === 'id');
    if (idField) {
      return 'id';
    }
    
    // Try other ID patterns
    const idPatternField = fields.find(f => 
      f.name.endsWith('Id') || f.name === '_id' || f.name === 'ID'
    );
    
    if (idPatternField) {
      return idPatternField.name;
    }
    
    // Return first non-connection field
    const simpleField = fields.find(f => {
      const fieldType = this._unwrapType(f.type);
      return fieldType.kind === 'SCALAR' || fieldType.kind === 'ENUM';
    });
    
    return simpleField ? simpleField.name : fields[0].name;
  }

  /**
   * Unwrap type object recursively
   * @private
   */
  _unwrapType(type) {
    if (!type) return null;
    
    if (type.kind && type.kind !== 'NON_NULL' && type.kind !== 'LIST') {
      return type;
    }
    
    if (type.ofType) {
      return this._unwrapType(type.ofType);
    }
    
    return type;
  }

  /**
   * Get edge field name for connection (usually 'node', but can vary)
   * @param {string} connectionTypeName - Connection type name
   * @returns {string} Edge field name
   */
  getConnectionEdgeFieldName(connectionTypeName) {
    const type = this.getType(connectionTypeName);
    
    if (!type || !type.fields) {
      return 'node'; // Default assumption
    }
    
    // Get the 'edges' field
    const edgesField = type.fields.find(f => f.name === 'edges');
    
    if (!edgesField) {
      return 'node';
    }
    
    // Get edge type
    const edgeType = this._unwrapType(edgesField.type);
    const edgeTypeDef = this.getType(edgeType.name);
    
    if (!edgeTypeDef || !edgeTypeDef.fields) {
      return 'node';
    }
    
    // Look for 'node' field first
    const nodeField = edgeTypeDef.fields.find(f => f.name === 'node');
    if (nodeField) {
      return 'node';
    }
    
    // Otherwise, find first field that's not 'cursor'
    const otherField = edgeTypeDef.fields.find(f => f.name !== 'cursor');
    
    return otherField ? otherField.name : 'node';
  }

  /**
   * Check if connection uses nodes pattern instead of edges
   * @param {string} connectionTypeName - Connection type name
   * @returns {boolean}
   */
  usesNodesPattern(connectionTypeName) {
    const type = this.getType(connectionTypeName);
    
    if (!type || !type.fields) {
      return false;
    }
    
    // Check if it has 'nodes' field
    const nodesField = type.fields.find(f => f.name === 'nodes');
    return !!nodesField;
  }

  /**
   * Get query return type information
   * @param {string} queryName - Query name
   * @returns {Object|null} Return type info
   */
  getQueryReturnType(queryName) {
    if (!this.introspectionData?.__schema?.types) {
      return null;
    }
    
    // Find Query type
    const queryType = this.introspectionData.__schema.types.find(
      t => t.name === 'Query'
    );
    
    if (!queryType || !queryType.fields) {
      return null;
    }
    
    // Find the query field
    const queryField = queryType.fields.find(f => f.name === queryName);
    
    if (!queryField) {
      return null;
    }
    
    const returnType = this._unwrapType(queryField.type);
    
    return {
      name: returnType.name,
      kind: returnType.kind,
      isConnection: returnType.name?.includes('Connection'),
      type: this.getType(returnType.name)
    };
  }

  /**
   * Get required arguments for a query
   * @param {string} queryName - Query name
   * @returns {Array<Object>} Required arguments
   */
  getQueryRequiredArgs(queryName) {
    if (!this.introspectionData?.__schema?.types) {
      return [];
    }
    
    const queryType = this.introspectionData.__schema.types.find(
      t => t.name === 'Query'
    );
    
    if (!queryType || !queryType.fields) {
      return [];
    }
    
    const queryField = queryType.fields.find(f => f.name === queryName);
    
    if (!queryField || !queryField.args) {
      return [];
    }
    
    return queryField.args.filter(arg => {
      const type = this._unwrapType(arg.type);
      // Check if it's NON_NULL (required)
      return arg.type.kind === 'NON_NULL' || type.kind === 'NON_NULL';
    });
  }

  /**
   * Get all arguments for a query
   * @param {string} queryName - Query name
   * @returns {Array<Object>} All arguments
   */
  getQueryArgs(queryName) {
    if (!this.introspectionData?.__schema?.types) {
      return [];
    }
    
    const queryType = this.introspectionData.__schema.types.find(
      t => t.name === 'Query'
    );
    
    if (!queryType || !queryType.fields) {
      return [];
    }
    
    const queryField = queryType.fields.find(f => f.name === queryName);
    
    return queryField?.args || [];
  }

  /**
   * Generate default value for an argument
   * @param {Object} arg - Argument definition
   * @returns {any|null} Default value or null if can't generate
   */
  generateDefaultArgValue(arg) {
    const type = this._unwrapType(arg.type);
    
    switch (type.kind) {
      case 'SCALAR':
        switch (type.name) {
          case 'String':
            if (arg.name === 'searchTerm') return '*';
            if (arg.name.includes('search')) return '*';
            return '';
          case 'Int':
            if (arg.name === 'first') return 5;
            if (arg.name === 'last') return 5;
            return 0;
          case 'Boolean':
            return false;
          default:
            return null;
        }
      
      case 'ENUM':
        // Get first enum value
        const enumType = this.getType(type.name);
        if (enumType?.enumValues && enumType.enumValues.length > 0) {
          return enumType.enumValues[0].name;
        }
        return null;
      
      case 'INPUT_OBJECT':
        // Return empty object for input types
        return {};
      
      default:
        return null;
    }
  }
}

export default SchemaIntrospector;

