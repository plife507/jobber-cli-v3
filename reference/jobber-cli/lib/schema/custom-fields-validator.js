/**
 * Purpose: Validate custom fields JSON against GraphQL schema
 * Inputs: Custom fields mapping object, schema analysis object
 * Outputs: Validation report with matched/missing types and recommendations
 * Dependencies: CustomFieldsMapper, SchemaAnalyzer, logger
 */

import CustomFieldsMapper from './custom-fields-mapper.js';
import logger from '../utils/logger.js';

export class CustomFieldsValidator {
  /**
   * Validate custom fields mapping against GraphQL schema
   * @param {Object} customFieldsMapping - Mapped custom fields from CustomFieldsMapper
   * @param {Object} schemaAnalysis - Schema analysis from SchemaAnalyzer
   * @returns {Object} Validation report
   */
  static validate(customFieldsMapping, schemaAnalysis) {
    if (!customFieldsMapping || !schemaAnalysis) {
      throw new Error('Both customFieldsMapping and schemaAnalysis are required');
    }

    const report = {
      valid: true,
      matchedTypes: [],
      missingTypes: [],
      extraTypes: [],
      recommendations: [],
      warnings: [],
      errors: []
    };

    // Get custom field types from schema
    const schemaCustomFieldTypes = schemaAnalysis.customFieldTypes || [];
    const schemaTypeNames = new Set(schemaCustomFieldTypes.map(t => t.name));

    // Get custom field types from mapping
    const mappingTypes = customFieldsMapping.types || [];
    const mappingTypeNames = new Set(mappingTypes);

    // Check which mapping types exist in schema
    mappingTypeNames.forEach(typeName => {
      if (schemaTypeNames.has(typeName)) {
        report.matchedTypes.push({
          type: typeName,
          inSchema: true,
          inMapping: true
        });
      } else {
        report.missingTypes.push({
          type: typeName,
          inSchema: false,
          inMapping: true,
          error: `Type ${typeName} not found in GraphQL schema`
        });
        report.valid = false;
        report.errors.push(`Custom field type ${typeName} from mapping not found in GraphQL schema`);
      }
    });

    // Check for types in schema but not in mapping
    schemaTypeNames.forEach(typeName => {
      if (!mappingTypeNames.has(typeName)) {
        report.extraTypes.push({
          type: typeName,
          inSchema: true,
          inMapping: false,
          recommendation: `Consider adding ${typeName} to your custom fields mapping`
        });
        report.recommendations.push(`GraphQL schema has ${typeName} but it's not in your mapping`);
      }
    });

    // Validate field definitions
    if (customFieldsMapping.fields && customFieldsMapping.fields.length > 0) {
      const fieldValidation = this.validateFieldDefinitions(
        customFieldsMapping.fields,
        schemaCustomFieldTypes
      );
      
      report.fieldValidation = fieldValidation;
      
      if (fieldValidation.errors.length > 0) {
        report.valid = false;
        report.errors.push(...fieldValidation.errors);
      }
      
      if (fieldValidation.warnings.length > 0) {
        report.warnings.push(...fieldValidation.warnings);
      }
    }

    // Generate recommendations
    report.recommendations.push(...this.generateRecommendations(report, schemaCustomFieldTypes));

    return report;
  }

  /**
   * Validate individual field definitions
   * @param {Array} fields - Field definitions from mapping
   * @param {Array} schemaTypes - Custom field types from schema
   * @returns {Object} Field validation results
   */
  static validateFieldDefinitions(fields, schemaTypes) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      validated: []
    };

    const schemaTypeMap = new Map();
    schemaTypes.forEach(type => {
      schemaTypeMap.set(type.name, type);
    });

    fields.forEach((field, index) => {
      const fieldResult = {
        index,
        name: field.name,
        graphqlType: field.graphqlType,
        valid: true,
        errors: [],
        warnings: []
      };

      // Check if GraphQL type exists
      if (field.graphqlType) {
        if (!schemaTypeMap.has(field.graphqlType)) {
          fieldResult.valid = false;
          fieldResult.errors.push(`GraphQL type ${field.graphqlType} not found in schema`);
          result.valid = false;
        } else {
          // Validate field structure against schema type
          const schemaType = schemaTypeMap.get(field.graphqlType);
          const validation = this.validateFieldStructure(field, schemaType);
          
          if (validation.errors.length > 0) {
            fieldResult.valid = false;
            fieldResult.errors.push(...validation.errors);
            result.valid = false;
          }
          
          if (validation.warnings.length > 0) {
            fieldResult.warnings.push(...validation.warnings);
          }
        }
      } else {
        fieldResult.warnings.push('No GraphQL type mapped for this field');
      }

      result.validated.push(fieldResult);
      
      if (!fieldResult.valid) {
        result.errors.push(`Field "${field.name || `index ${index}`}": ${fieldResult.errors.join(', ')}`);
      }
      
      if (fieldResult.warnings.length > 0) {
        result.warnings.push(`Field "${field.name || `index ${index}`}": ${fieldResult.warnings.join(', ')}`);
      }
    });

    return result;
  }

  /**
   * Validate field structure against schema type
   * @param {Object} field - Field definition
   * @param {Object} schemaType - Schema type information
   * @returns {Object} Validation result
   */
  static validateFieldStructure(field, schemaType) {
    const result = {
      errors: [],
      warnings: []
    };

    if (!schemaType.fields) {
      return result;
    }

    // Check if value field exists in schema
    const hasValueField = schemaType.fields.some(f =>
      f.name.startsWith('value') || f.name === 'value'
    );
    
    if (!hasValueField) {
      result.warnings.push(`Schema type ${schemaType.name} doesn't have a value field`);
    }

    return result;
  }

  /**
   * Generate recommendations based on validation results
   * @param {Object} report - Validation report
   * @param {Array} schemaTypes - Custom field types from schema
   * @returns {Array} Array of recommendation strings
   */
  static generateRecommendations(report, schemaTypes) {
    const recommendations = [];

    if (report.missingTypes.length > 0) {
      recommendations.push(
        `Found ${report.missingTypes.length} custom field type(s) in mapping that don't exist in GraphQL schema. ` +
        `These may be deprecated or incorrectly named.`
      );
    }

    if (report.extraTypes.length > 0) {
      recommendations.push(
        `GraphQL schema has ${report.extraTypes.length} additional custom field type(s) not in your mapping. ` +
        `Consider adding them for complete coverage.`
      );
    }

    if (report.matchedTypes.length > 0) {
      recommendations.push(
        `Successfully matched ${report.matchedTypes.length} custom field type(s) between mapping and schema.`
      );
    }

    // Generate GraphQL fragment recommendations
    if (schemaTypes.length > 0) {
      recommendations.push(
        `Use the generated GraphQL fragments to include all ${schemaTypes.length} custom field types in your queries.`
      );
    }

    return recommendations;
  }

  /**
   * Generate a summary report as a string
   * @param {Object} report - Validation report
   * @returns {string} Formatted summary
   */
  static generateSummary(report) {
    const lines = [];
    
    lines.push('Custom Fields Validation Summary');
    lines.push('='.repeat(50));
    lines.push('');
    
    lines.push(`Status: ${report.valid ? '✅ VALID' : '❌ INVALID'}`);
    lines.push('');
    
    lines.push(`Matched Types: ${report.matchedTypes.length}`);
    report.matchedTypes.forEach(m => {
      lines.push(`  ✅ ${m.type}`);
    });
    
    if (report.missingTypes.length > 0) {
      lines.push('');
      lines.push(`Missing Types (in mapping but not in schema): ${report.missingTypes.length}`);
      report.missingTypes.forEach(m => {
        lines.push(`  ❌ ${m.type} - ${m.error}`);
      });
    }
    
    if (report.extraTypes.length > 0) {
      lines.push('');
      lines.push(`Extra Types (in schema but not in mapping): ${report.extraTypes.length}`);
      report.extraTypes.forEach(e => {
        lines.push(`  ⚠️  ${e.type} - ${e.recommendation}`);
      });
    }
    
    if (report.errors.length > 0) {
      lines.push('');
      lines.push(`Errors: ${report.errors.length}`);
      report.errors.forEach(err => {
        lines.push(`  ❌ ${err}`);
      });
    }
    
    if (report.warnings.length > 0) {
      lines.push('');
      lines.push(`Warnings: ${report.warnings.length}`);
      report.warnings.forEach(warn => {
        lines.push(`  ⚠️  ${warn}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      lines.push('');
      lines.push('Recommendations:');
      report.recommendations.forEach(rec => {
        lines.push(`  💡 ${rec}`);
      });
    }
    
    return lines.join('\n');
  }
}

export default CustomFieldsValidator;

