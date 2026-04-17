/**
 * Purpose: Comprehensive API Mapper - uses GraphQL introspection to map the entire Jobber API
 * Inputs: Introspection result data or schema analysis
 * Outputs: Complete API mapping with queries, mutations, types, relationships, and query builders
 * Dependencies: SchemaAnalyzer, buildClientSchema from graphql
 */

import { buildClientSchema } from 'graphql';
import SchemaAnalyzer from './schema-analyzer.js';
import logger from '../utils/logger.js';

export class ApiMapper {
  /**
   * Map the entire Jobber API from introspection data
   * @param {Object} introspectionData - Raw introspection query result
   * @returns {Object} Complete API mapping
   */
  static mapFromIntrospection(introspectionData) {
    if (!introspectionData || !introspectionData.__schema) {
      throw new Error('Invalid introspection data: missing __schema');
    }

    const schema = buildClientSchema(introspectionData);
    const mapping = {
      queries: {},
      mutations: {},
      subscriptions: {},
      types: {},
      connections: {},
      relationships: {},
      enums: {},
      inputTypes: {},
      scalars: {},
      interfaces: {},
      unions: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        schemaVersion: introspectionData.__schema.description || 'unknown'
      }
    };

    // Map Query type
    if (introspectionData.__schema.queryType) {
      mapping.queries = this.mapOperationType(
        introspectionData.__schema.queryType,
        introspectionData.__schema.types,
        'query'
      );
    }

    // Map Mutation type
    if (introspectionData.__schema.mutationType) {
      mapping.mutations = this.mapOperationType(
        introspectionData.__schema.mutationType,
        introspectionData.__schema.types,
        'mutation'
      );
    }

    // Map Subscription type
    if (introspectionData.__schema.subscriptionType) {
      mapping.subscriptions = this.mapOperationType(
        introspectionData.__schema.subscriptionType,
        introspectionData.__schema.types,
        'subscription'
      );
    }

    // Map all types
    if (introspectionData.__schema.types) {
      const typeMapping = this.mapAllTypes(introspectionData.__schema.types);
      Object.assign(mapping, typeMapping);
    }

    // Build relationships
    mapping.relationships = this.buildRelationships(mapping.types, mapping.queries);

    // Identify connections
    mapping.connections = this.identifyConnections(mapping.types, mapping.queries);

    return mapping;
  }

  /**
   * Map an operation type (Query, Mutation, Subscription)
   * @param {Object} operationType - Operation type from introspection
   * @param {Array} allTypes - All types from introspection
   * @param {string} operationKind - 'query', 'mutation', or 'subscription'
   * @returns {Object} Mapped operations
   */
  static mapOperationType(operationType, allTypes, operationKind) {
    const operations = {
      list: [],
      byName: {},
      connections: [],
      singleObjects: []
    };

    const typeDef = allTypes.find(t => t.name === operationType.name);
    if (!typeDef || !typeDef.fields) {
      return operations;
    }

    typeDef.fields.forEach(field => {
      const operation = {
        name: field.name,
        description: field.description || null,
        returnType: this.resolveTypeName(field.type),
        returnTypeKind: this.getTypeKind(field.type),
        arguments: this.mapArguments(field.args || []),
        isConnection: this.isConnectionType(field.type),
        isPaginated: this.hasPaginationArgs(field.args || []),
        costEstimate: this.estimateCost(field)
      };

      operations.list.push(operation);
      operations.byName[operation.name] = operation;

      if (operation.isConnection || operation.isPaginated) {
        operations.connections.push(operation.name);
      } else {
        operations.singleObjects.push(operation.name);
      }
    });

    return operations;
  }

  /**
   * Map all types from introspection
   * @param {Array} types - Types array from introspection
   * @returns {Object} Mapped types by category
   */
  static mapAllTypes(types) {
    const result = {
      types: {},
      enums: {},
      inputTypes: {},
      scalars: {},
      interfaces: {},
      unions: {},
      objectTypes: {},
      customFieldTypes: [],
      entitiesWithCustomFields: []
    };

    types.forEach(type => {
      // Skip built-in types
      if (type.name.startsWith('__')) return;
      if (['String', 'Int', 'Float', 'Boolean', 'ID'].includes(type.name)) {
        result.scalars[type.name] = {
          name: type.name,
          description: type.description || null,
          kind: type.kind
        };
        return;
      }

      const typeInfo = {
        name: type.name,
        kind: type.kind,
        description: type.description || null
      };

      switch (type.kind) {
        case 'OBJECT':
          typeInfo.fields = this.mapFields(type.fields || []);
          typeInfo.interfaces = (type.interfaces || []).map(i => i.name);
          result.objectTypes[type.name] = typeInfo;
          
          // Check for custom fields
          if (type.name.startsWith('CustomField') && type.name !== 'CustomFieldUnion') {
            result.customFieldTypes.push(typeInfo);
          }
          
          // Check if entity has customFields
          if (type.fields && type.fields.some(f => f.name === 'customFields')) {
            result.entitiesWithCustomFields.push({
              name: type.name,
              customFieldsType: this.resolveTypeName(
                type.fields.find(f => f.name === 'customFields').type
              )
            });
          }
          break;

        case 'ENUM':
          typeInfo.values = (type.enumValues || []).map(v => ({
            name: v.name,
            description: v.description || null,
            isDeprecated: v.isDeprecated || false
          }));
          result.enums[type.name] = typeInfo;
          break;

        case 'INPUT_OBJECT':
          typeInfo.inputFields = this.mapInputFields(type.inputFields || []);
          result.inputTypes[type.name] = typeInfo;
          break;

        case 'INTERFACE':
          typeInfo.fields = this.mapFields(type.fields || []);
          typeInfo.possibleTypes = (type.possibleTypes || []).map(t => t.name);
          result.interfaces[type.name] = typeInfo;
          break;

        case 'UNION':
          typeInfo.possibleTypes = (type.possibleTypes || []).map(t => t.name);
          result.unions[type.name] = typeInfo;
          break;

        case 'SCALAR':
          result.scalars[type.name] = typeInfo;
          break;
      }

      result.types[type.name] = typeInfo;
    });

    return result;
  }

  /**
   * Map fields from introspection
   * @param {Array} fields - Fields array
   * @returns {Array} Mapped fields
   */
  static mapFields(fields) {
    return fields.map(field => ({
      name: field.name,
      description: field.description || null,
      type: this.resolveTypeName(field.type),
      typeKind: this.getTypeKind(field.type),
      isRequired: this.isRequired(field.type),
      isList: this.isList(field.type),
      arguments: this.mapArguments(field.args || []),
      isDeprecated: field.isDeprecated || false,
      deprecationReason: field.deprecationReason || null
    }));
  }

  /**
   * Map input fields
   * @param {Array} inputFields - Input fields array
   * @returns {Array} Mapped input fields
   */
  static mapInputFields(inputFields) {
    return inputFields.map(field => ({
      name: field.name,
      description: field.description || null,
      type: this.resolveTypeName(field.type),
      typeKind: this.getTypeKind(field.type),
      isRequired: this.isRequired(field.type),
      isList: this.isList(field.type),
      defaultValue: field.defaultValue != null ? String(field.defaultValue) : null
    }));
  }

  /**
   * Map arguments
   * @param {Array} args - Arguments array
   * @returns {Array} Mapped arguments
   */
  static mapArguments(args) {
    return args.map(arg => ({
      name: arg.name,
      description: arg.description || null,
      type: this.resolveTypeName(arg.type),
      typeKind: this.getTypeKind(arg.type),
      isRequired: this.isRequired(arg.type),
      isList: this.isList(arg.type),
      defaultValue: arg.defaultValue !== null ? String(arg.defaultValue) : null
    }));
  }

  /**
   * Resolve type name from introspection type
   * @param {Object} type - Type object from introspection
   * @returns {string} Type name
   */
  static resolveTypeName(type) {
    if (!type) return 'Unknown';
    if (typeof type === 'string') return type;

    if (type.name) {
      return type.name;
    }

    if (type.ofType) {
      return this.resolveTypeName(type.ofType);
    }
    
    return 'Unknown';
  }

  /**
   * Get type kind
   * @param {Object} type - Type object
   * @returns {string} Type kind
   */
  static getTypeKind(type) {
    if (!type) return 'UNKNOWN';
    if (type.kind) return type.kind;
    if (type.ofType) return this.getTypeKind(type.ofType);
    return 'UNKNOWN';
  }

  /**
   * Check if type is required (non-null)
   * @param {Object} type - Type object
   * @returns {boolean} True if required
   */
  static isRequired(type) {
    // Iterative unwrap to handle nested NON_NULL safely
    let t = type;
    while (t) {
      if (t.kind === 'NON_NULL') return true;
      t = t.ofType || null;
    }
    return false;
  }

  /**
   * Check if type is a list
   * @param {Object} type - Type object
   * @returns {boolean} True if list
   */
  static isList(type) {
    if (!type) return false;
    if (type.kind === 'LIST') return true;
    if (type.ofType) return this.isList(type.ofType);
    return false;
  }

  /**
   * Check if type is a connection type
   * @param {Object} type - Type object
   * @returns {boolean} True if connection
   */
  static isConnectionType(type) {
    const typeName = this.resolveTypeName(type);
    return typeName.endsWith('Connection');
  }

  /**
   * Check if field has pagination arguments
   * @param {Array} args - Arguments array
   * @returns {boolean} True if has pagination args
   */
  static hasPaginationArgs(args) {
    const paginationArgs = ['first', 'last', 'after', 'before'];
    return args.some(arg => paginationArgs.includes(arg.name));
  }

  /**
   * Estimate query cost based on complexity
   * @param {Object} field - Field definition
   * @returns {number} Estimated cost in throttle units
   */
  static estimateCost(field) {
    let cost = 10; // Base cost
    
    // Connection queries are more expensive
    if (this.isConnectionType(field.type)) {
      cost += 50;
    }
    
    // More arguments = more complexity
    if (field.args) {
      cost += field.args.length * 5;
    }
    
    return cost;
  }

  /**
   * Build relationships between types
   * @param {Object} types - Types map
   * @param {Object} queries - Queries map
   * @returns {Object} Relationships map
   */
  static buildRelationships(types, queries) {
    const relationships = {};

    Object.values(types).forEach(type => {
      if (!type.fields) return;

      const typeRelations = [];

      type.fields.forEach(field => {
        const fieldType = field.type;
        const relatedType = this.resolveTypeName(fieldType);
        
        // Skip scalar types
        if (['String', 'Int', 'Float', 'Boolean', 'ID', 'ISO8601DateTime'].includes(relatedType)) {
          return;
        }

        typeRelations.push({
          field: field.name,
          relatedType: relatedType,
          isList: this.isList(fieldType),
          isRequired: this.isRequired(fieldType),
          relationship: this.determineRelationshipType(field, relatedType)
        });
      });

      if (typeRelations.length > 0) {
        relationships[type.name] = typeRelations;
      }
    });

    return relationships;
  }

  /**
   * Determine relationship type
   * @param {Object} field - Field definition
   * @param {string} relatedType - Related type name
   * @returns {string} Relationship type
   */
  static determineRelationshipType(field, relatedType) {
    // Check for connection pattern (definitive one-to-many)
    if (this.isConnectionType(field.type)) {
      return 'one-to-many';
    }

    // Check if it's a list type
    if (this.isList(field.type)) {
      return 'one-to-many';
    }

    // Check field name for connection suffix
    const fieldName = field.name.toLowerCase();
    if (fieldName.includes('connection')) {
      return 'one-to-many';
    }

    return 'one-to-one';
  }

  /**
   * Identify connection patterns
   * @param {Object} types - Types map
   * @param {Object} queries - Queries map
   * @returns {Object} Connections map
   */
  static identifyConnections(types, queries) {
    const connections = {
      queryConnections: [],
      typeConnections: []
    };

    // Find connection queries
    if (queries.list) {
      queries.list.forEach(query => {
        if (query.isConnection || query.isPaginated) {
          connections.queryConnections.push({
            name: query.name,
            returnType: query.returnType,
            paginationArgs: query.arguments.filter(arg => 
              ['first', 'last', 'after', 'before'].includes(arg.name)
            )
          });
        }
      });
    }

    // Find connection types
    Object.values(types).forEach(type => {
      if (type.name && type.name.endsWith('Connection')) {
        connections.typeConnections.push({
          name: type.name,
          fields: type.fields ? type.fields.map(f => f.name) : [],
          hasPageInfo: type.fields && type.fields.some(f => f.name === 'pageInfo'),
          hasNodes: type.fields && type.fields.some(f => f.name === 'nodes')
        });
      }
    });

    return connections;
  }

  /**
   * Generate query builder code for all queries
   * @param {Object} mapping - Complete API mapping
   * @returns {Object} Query builders by operation type
   */
  static generateQueryBuilders(mapping) {
    const builders = {
      queries: {},
      mutations: {},
      subscriptions: {}
    };

    // Generate query builders
    if (mapping.queries && mapping.queries.list) {
      mapping.queries.list.forEach(query => {
        builders.queries[query.name] = this.generateQueryBuilder(query);
      });
    }

    // Generate mutation builders
    if (mapping.mutations && mapping.mutations.list) {
      mapping.mutations.list.forEach(mutation => {
        builders.mutations[mutation.name] = this.generateMutationBuilder(mutation);
      });
    }

    return builders;
  }

  /**
   * Generate query builder for a single query
   * @param {Object} query - Query definition
   * @returns {Object} Query builder template
   */
  static generateQueryBuilder(query) {
    const args = query.arguments || [];
    const hasArgs = args.length > 0;
    
    return {
      name: query.name,
      template: this.buildQueryTemplate(query.name, args, query.returnType, query.isConnection),
      arguments: args,
      returnType: query.returnType,
      isConnection: query.isConnection,
      estimatedCost: query.costEstimate
    };
  }

  /**
   * Generate mutation builder
   * @param {Object} mutation - Mutation definition
   * @returns {Object} Mutation builder template
   */
  static generateMutationBuilder(mutation) {
    const args = mutation.arguments || [];
    
    return {
      name: mutation.name,
      template: this.buildMutationTemplate(mutation.name, args, mutation.returnType),
      arguments: args,
      returnType: mutation.returnType,
      estimatedCost: mutation.costEstimate
    };
  }

  /**
   * Build query template
   * @param {string} queryName - Query name
   * @param {Array} args - Arguments
   * @param {string} returnType - Return type
   * @param {boolean} isConnection - Is connection query
   * @returns {string} GraphQL query template
   */
  static buildQueryTemplate(queryName, args, returnType, isConnection) {
    const varDeclarations = args.map(arg => {
      const varType = arg.isRequired ? `${arg.type}!` : arg.type;
      return `$${arg.name}: ${varType}`;
    }).join(', ');

    const varUsage = args.map(arg => `${arg.name}: $${arg.name}`).join(', ');
    const varDef = varDeclarations ? `(${varDeclarations})` : '';
    const varArgs = varUsage ? `(${varUsage})` : '';

    let selectionSet = 'id';
    if (isConnection) {
      selectionSet = `nodes {
        id
      }
      pageInfo {
        hasNextPage
        endCursor
      }`;
    }

    return `query ${this.capitalize(queryName)}${varDef} {
  ${queryName}${varArgs} {
    ${selectionSet}
  }
}`;
  }

  /**
   * Build mutation template
   * @param {string} mutationName - Mutation name
   * @param {Array} args - Arguments
   * @param {string} returnType - Return type
   * @returns {string} GraphQL mutation template
   */
  static buildMutationTemplate(mutationName, args, returnType) {
    const varDeclarations = args.map(arg => {
      const varType = arg.isRequired ? `${arg.type}!` : arg.type;
      return `$${arg.name}: ${varType}`;
    }).join(', ');

    const varUsage = args.map(arg => `${arg.name}: $${arg.name}`).join(', ');
    const varDef = varDeclarations ? `(${varDeclarations})` : '';
    const varArgs = varUsage ? `(${varUsage})` : '';

    return `mutation ${this.capitalize(mutationName)}${varDef} {
  ${mutationName}${varArgs} {
    id
  }
}`;
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default ApiMapper;

