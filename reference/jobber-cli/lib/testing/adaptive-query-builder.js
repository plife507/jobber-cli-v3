/**
 * Purpose: Adaptive Query Builder - builds GraphQL queries dynamically based on schema introspection
 * Inputs: Query name, schema introspector, test options
 * Outputs: Valid GraphQL query strings adapted to actual schema structure
 * Dependencies: SchemaIntrospector, logger
 */

import logger from '../utils/logger.js';

export class AdaptiveQueryBuilder {
  constructor(schemaIntrospector) {
    this.introspector = schemaIntrospector;
  }

  /**
   * Build a query adapted to the actual schema structure
   * @param {Object} queryDef - Query definition from API mapping
   * @param {Object} options - Build options
   * @returns {Object} { query: string, variables: Object, pattern: string }
   */
  buildAdaptiveQuery(queryDef, options = {}) {
    const queryName = queryDef.name;
    
    // Get return type information
    const returnTypeInfo = this.introspector.getQueryReturnType(queryName);
    
    if (!returnTypeInfo) {
      // Fallback to basic query
      return this._buildFallbackQuery(queryDef, options);
    }
    
    logger.debug(`Building adaptive query for ${queryName} (${returnTypeInfo.kind})`);
    
    // Check if it's a connection query
    if (returnTypeInfo.isConnection) {
      return this._buildConnectionQuery(queryDef, returnTypeInfo, options);
    }
    
    // Check if it's a single object query
    const requiredArgs = this.introspector.getQueryRequiredArgs(queryName);
    
    if (requiredArgs.some(arg => arg.name === 'id')) {
      return this._buildSingleObjectQuery(queryDef, returnTypeInfo, options);
    }
    
    // Check if it's a scalar return
    if (returnTypeInfo.kind === 'SCALAR') {
      return this._buildScalarQuery(queryDef, returnTypeInfo, options);
    }
    
    // Default to object query
    return this._buildObjectQuery(queryDef, returnTypeInfo, options);
  }

  /**
   * Build connection query (list/paginated query)
   * @private
   */
  _buildConnectionQuery(queryDef, returnTypeInfo, options) {
    const queryName = queryDef.name;
    const connectionTypeName = returnTypeInfo.name;
    
    // Check if connection uses nodes pattern or edges pattern
    const usesNodes = this.introspector.usesNodesPattern(connectionTypeName);
    
    // Get the item type (what's inside the connection)
    const itemType = this._getConnectionItemType(connectionTypeName, usesNodes);
    
    // Build variables for pagination
    const variables = { first: options.pageSize || 5 };
    const variableDefs = '$first: Int!';
    
    // Handle union types in the item
    const itemFields = this._buildItemFields(itemType, queryDef);
    
    let query;
    
    if (usesNodes) {
      // nodes pattern (simpler)
      query = `query Test${this._capitalize(queryName)}(${ variableDefs}) {
  ${queryName}(first: $first) {
    nodes ${itemFields}
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}`;
    } else {
      // edges pattern (standard Relay)
      const edgeFieldName = this.introspector.getConnectionEdgeFieldName(connectionTypeName);
      
      query = `query Test${this._capitalize(queryName)}(${variableDefs}) {
  ${queryName}(first: $first) {
    edges {
      ${edgeFieldName} ${itemFields}
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}`;
    }
    
    return {
      query,
      variables,
      pattern: usesNodes ? 'nodes' : 'edges',
      itemType: itemType,
      success: true
    };
  }

  /**
   * Build single object query (requires ID)
   * @private
   */
  _buildSingleObjectQuery(queryDef, returnTypeInfo, options) {
    const queryName = queryDef.name;
    const typeName = returnTypeInfo.name;
    
    // Get identifier field
    const idField = this.introspector.getIdentifierField(typeName);
    
    if (!idField) {
      return {
        query: null,
        variables: {},
        pattern: 'single-object',
        error: 'No identifier field found',
        requiresId: true,
        success: false
      };
    }
    
    // Get the actual ID argument type from schema
    const args = this.introspector.getQueryArgs(queryName);
    const idArg = args.find(arg => arg.name === 'id');
    
    // Determine correct ID type (EncodedId! or ID!)
    let idType = 'ID!';
    if (idArg) {
      idType = this._formatTypeString(idArg.type);
    }
    
    // Build simple query with correct ID type
    const query = `query Test${this._capitalize(queryName)}($id: ${idType}) {
  ${queryName}(id: $id) {
    ${idField}
  }
}`;
    
    return {
      query,
      variables: {}, // ID will be provided at runtime
      pattern: 'single-object',
      typeName,
      idField,
      idType,
      requiresId: true,
      success: true
    };
  }

  /**
   * Build scalar query (returns primitive value)
   * @private
   */
  _buildScalarQuery(queryDef, returnTypeInfo, options) {
    const queryName = queryDef.name;
    
    // Scalar queries don't select fields
    const query = `query Test${this._capitalize(queryName)} {
  ${queryName}
}`;
    
    return {
      query,
      variables: {},
      pattern: 'scalar',
      scalarType: returnTypeInfo.name,
      success: true
    };
  }

  /**
   * Build object query (single object, no ID required)
   * @private
   */
  _buildObjectQuery(queryDef, returnTypeInfo, options) {
    const queryName = queryDef.name;
    const typeName = returnTypeInfo.name;
    
    // Get identifier field
    const idField = this.introspector.getIdentifierField(typeName);
    
    const query = `query Test${this._capitalize(queryName)} {
  ${queryName} {
    ${idField || '__typename'}
  }
}`;
    
    return {
      query,
      variables: {},
      pattern: 'object',
      typeName,
      success: true
    };
  }

  /**
   * Build fallback query when introspection unavailable
   * @private
   */
  _buildFallbackQuery(queryDef, options) {
    const queryName = queryDef.name;
    
    // Try to infer from name
    if (queryName.includes('Connection') || queryName.endsWith('s')) {
      // Assume connection
      return {
        query: `query Test${this._capitalize(queryName)} {
  ${queryName}(first: 5) {
    edges {
      node { id }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`,
        variables: { first: 5 },
        pattern: 'connection-fallback',
        success: true
      };
    }
    
    // Assume single object
    return {
      query: `query Test${this._capitalize(queryName)} {
  ${queryName} {
    id
  }
}`,
      variables: {},
      pattern: 'object-fallback',
      success: true
    };
  }

  /**
   * Get connection item type
   * @private
   */
  _getConnectionItemType(connectionTypeName, usesNodes) {
    const connectionType = this.introspector.getType(connectionTypeName);
    
    if (!connectionType || !connectionType.fields) {
      return null;
    }
    
    if (usesNodes) {
      // Get type from nodes field
      const nodesField = connectionType.fields.find(f => f.name === 'nodes');
      if (nodesField) {
        const itemType = this.introspector._unwrapType(nodesField.type);
        return itemType.name;
      }
    } else {
      // Get type from edges -> node
      const edgesField = connectionType.fields.find(f => f.name === 'edges');
      if (edgesField) {
        const edgeType = this.introspector._unwrapType(edgesField.type);
        const edgeTypeDef = this.introspector.getType(edgeType.name);
        
        if (edgeTypeDef && edgeTypeDef.fields) {
          const nodeField = edgeTypeDef.fields.find(f => f.name === 'node');
          if (nodeField) {
            const itemType = this.introspector._unwrapType(nodeField.type);
            return itemType.name;
          }
          
          // Try other field names
          const otherField = edgeTypeDef.fields.find(f => f.name !== 'cursor');
          if (otherField) {
            const itemType = this.introspector._unwrapType(otherField.type);
            return itemType.name;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Build fields selection for item type
   * @private
   */
  _buildItemFields(itemTypeName, queryDef) {
    if (!itemTypeName) {
      return '{ id }';
    }
    
    const itemType = this.introspector.getType(itemTypeName);
    
    if (!itemType) {
      return '{ id }';
    }
    
    // Check if union type
    if (itemType.kind === 'UNION') {
      const possibleTypes = this.introspector.getUnionPossibleTypes(itemTypeName);
      
      if (possibleTypes.length === 0) {
        return '{ __typename }';
      }
      
      // Build fragments for each possible type
      const fragments = possibleTypes.map(typeName => {
        const idField = this.introspector.getIdentifierField(typeName);
        return `... on ${typeName} { ${idField || '__typename'} }`;
      }).join('\n        ');
      
      return `{
        __typename
        ${fragments}
      }`;
    }
    
    // Check if interface type
    if (itemType.kind === 'INTERFACE') {
      // For interfaces, just use the common fields
      const idField = this.introspector.getIdentifierField(itemTypeName);
      return `{ ${idField || '__typename'} }`;
    }
    
    // Regular object type
    const idField = this.introspector.getIdentifierField(itemTypeName);
    return `{ ${idField || 'id'} }`;
  }

  /**
   * Build query with required arguments filled in
   * @param {Object} queryDef - Query definition
   * @param {Object} defaultValues - Default argument values
   * @returns {Object} Query result
   */
  buildQueryWithArgs(queryDef, defaultValues = {}) {
    const queryName = queryDef.name;
    const requiredArgs = this.introspector.getQueryRequiredArgs(queryName);
    
    if (requiredArgs.length === 0) {
      // No required args, use standard build
      return this.buildAdaptiveQuery(queryDef);
    }
    
    // Try to generate defaults for required args
    const variables = { ...defaultValues };
    const variableDefs = [];
    
    let canBuild = true;
    
    for (const arg of requiredArgs) {
      if (variables[arg.name] === undefined) {
        const defaultValue = this.introspector.generateDefaultArgValue(arg);
        
        if (defaultValue === null && arg.name !== 'id') {
          // Can't generate default, query can't be built automatically
          canBuild = false;
          break;
        }
        
        if (defaultValue !== null) {
          variables[arg.name] = defaultValue;
        }
      }
      
      // Build variable definition
      const argType = this._formatTypeString(arg.type);
      variableDefs.push(`$${arg.name}: ${argType}`);
    }
    
    if (!canBuild) {
      return {
        query: null,
        variables: {},
        pattern: 'requires-custom-args',
        error: `Cannot auto-generate arguments: ${requiredArgs.map(a => a.name).join(', ')}`,
        requiredArgs,
        success: false
      };
    }
    
    // Build query with arguments
    const returnTypeInfo = this.introspector.getQueryReturnType(queryName);
    
    if (returnTypeInfo?.isConnection) {
      // Add pagination args
      if (!variables.first) {
        variables.first = 5;
        if (!variableDefs.includes('$first: Int!')) {
          variableDefs.push('$first: Int!');
        }
      }
    }
    
    // Build argument string
    const argString = requiredArgs.map(arg => `${arg.name}: $${arg.name}`).join(', ');
    const varDefString = variableDefs.join(', ');
    
    // Use adaptive builder to get field selection
    const baseQuery = this.buildAdaptiveQuery(queryDef);
    
    if (!baseQuery.success) {
      return baseQuery;
    }
    
    // Rebuild query with arguments
    const query = baseQuery.query.replace(
      `${queryName}(`,
      `${queryName}(${argString}, `
    ).replace(
      `Test${this._capitalize(queryName)}(`,
      `Test${this._capitalize(queryName)}(${varDefString}, `
    );
    
    return {
      query,
      variables,
      pattern: 'with-required-args',
      success: true
    };
  }

  /**
   * Format type string from type object
   * @private
   */
  _formatTypeString(type) {
    if (type.kind === 'NON_NULL') {
      return this._formatTypeString(type.ofType) + '!';
    }
    
    if (type.kind === 'LIST') {
      return '[' + this._formatTypeString(type.ofType) + ']';
    }
    
    return type.name;
  }

  /**
   * Capitalize first letter
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default AdaptiveQueryBuilder;

