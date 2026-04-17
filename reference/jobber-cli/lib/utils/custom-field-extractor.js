/**
 * Purpose: Custom Field Extractor - utility functions to extract values from Jobber custom fields
 * Inputs: Custom fields array from GraphQL job data
 * Outputs: Extracted field values (branch location, division, etc.)
 * Dependencies: None
 */

/**
 * Extract custom field value by field name
 * Handles all custom field types: Text, Dropdown, Numeric, TrueFalse, Link, Area
 * @param {Array} customFields - Array of custom field objects from job
 * @param {string} fieldName - Name of the field to search for (case-insensitive, partial match)
 * @returns {string|number|boolean|null} - Extracted value or null if not found
 */
export function extractCustomField(customFields, fieldName) {
  if (!customFields || !Array.isArray(customFields)) return null;
  
  const normalizedFieldName = fieldName.toLowerCase();
  const field = customFields.find(cf => 
    cf.customFieldConfiguration?.name?.toLowerCase().includes(normalizedFieldName)
  );
  
  if (!field) return null;
  
  // Handle different custom field types
  if (field.valueText !== undefined && field.valueText !== null && field.valueText !== '') {
    return field.valueText;
  }
  
  if (field.valueDropdown !== undefined && field.valueDropdown !== null && field.valueDropdown !== '') {
    return field.valueDropdown;
  }
  
  if (field.valueNumeric !== undefined && field.valueNumeric !== null) {
    return field.valueNumeric;
  }
  
  if (field.valueTrueFalse !== undefined && field.valueTrueFalse !== null) {
    return field.valueTrueFalse;
  }
  
  if (field.valueLink?.url) {
    return field.valueLink.text || field.valueLink.url;
  }
  
  if (field.valueArea && (field.valueArea.length !== undefined || field.valueArea.width !== undefined)) {
    return `${field.valueArea.length || 0} × ${field.valueArea.width || 0}`;
  }
  
  return null;
}

/**
 * Extract branch location from job custom fields
 * @param {Array} customFields - Array of custom field objects from job
 * @returns {string|null} - Branch location value or null if not found
 */
export function extractBranchLocation(customFields) {
  return extractCustomField(customFields, 'branch location');
}

/**
 * Extract division/work type from job custom fields
 * @param {Array} customFields - Array of custom field objects from job
 * @returns {string|null} - Division value or null if not found
 */
export function extractDivision(customFields) {
  return extractCustomField(customFields, 'division');
}

/**
 * Extract multiple custom fields at once
 * @param {Array} customFields - Array of custom field objects from job
 * @param {Array<string>} fieldNames - Array of field names to extract
 * @returns {Object} - Object with field names as keys and extracted values
 */
export function extractCustomFields(customFields, fieldNames) {
  const result = {};
  for (const fieldName of fieldNames) {
    result[fieldName] = extractCustomField(customFields, fieldName);
  }
  return result;
}

