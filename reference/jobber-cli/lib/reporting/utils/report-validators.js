/**
 * Purpose: Validation utilities for report generation and data integrity checks
 * Inputs: Profitability data, HTML content, file paths
 * Outputs: Validation results, warnings, and error messages
 * Dependencies: ReportCalculator for cross-check validation
 */

import { ReportCalculator } from '../calculations/report-calculator.js';

/**
 * Validate profitability data structure
 * @param {Array<Object>} data - Array of profitability objects
 * @returns {Object} Validation result with isValid flag and errors
 */
export function validateProfitabilityData(data) {
  const errors = [];
  const warnings = [];
  
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: [{ field: 'data', message: 'Data must be an array' }],
      warnings: []
    };
  }
  
  if (data.length === 0) {
    return {
      isValid: false,
      errors: [{ field: 'data', message: 'Data array is empty' }],
      warnings: []
    };
  }
  
  // Required fields for each job
  const requiredFields = ['jobNumber', 'effectiveSalePrice'];
  const recommendedFields = ['title', 'client', 'branchLocation', 'jobType', 'trueProfit', 'marginPercent'];
  
  data.forEach((job, index) => {
    // Check required fields
    requiredFields.forEach(field => {
      if (job[field] === undefined || job[field] === null) {
        errors.push({
          field,
          jobIndex: index,
          jobNumber: job.jobNumber || `(index ${index})`,
          message: `Missing required field: ${field}`
        });
      }
    });
    
    // Check recommended fields
    recommendedFields.forEach(field => {
      if (job[field] === undefined || job[field] === null) {
        warnings.push({
          field,
          jobIndex: index,
          jobNumber: job.jobNumber || `(index ${index})`,
          message: `Missing recommended field: ${field}`
        });
      }
    });
    
    // Validate numeric fields
    const numericFields = ['effectiveSalePrice', 'trueProfit', 'netRetained', 'marginPercent', 'ppPay', 'kcLaborCost', 'materialCost', 'overheadCost'];
    numericFields.forEach(field => {
      if (job[field] !== undefined && typeof job[field] !== 'number') {
        errors.push({
          field,
          jobIndex: index,
          jobNumber: job.jobNumber || `(index ${index})`,
          message: `Field ${field} must be a number, got ${typeof job[field]}`
        });
      }
    });
    
    // Validate job type
    const validJobTypes = ['KC', 'PP', 'PP-mix', 'Hybrid'];
    if (job.jobType && !validJobTypes.includes(job.jobType)) {
      errors.push({
        field: 'jobType',
        jobIndex: index,
        jobNumber: job.jobNumber || `(index ${index})`,
        message: `Invalid job type: ${job.jobType}. Must be one of: ${validJobTypes.join(', ')}`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalJobs: data.length,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  };
}

/**
 * Validate HTML content structure
 * @param {string} html - HTML content to validate
 * @returns {Object} Validation result
 */
export function validateHTMLStructure(html) {
  const errors = [];
  const warnings = [];
  
  if (!html || typeof html !== 'string') {
    return {
      isValid: false,
      errors: [{ message: 'HTML content must be a non-empty string' }],
      warnings: []
    };
  }
  
  // Check for basic HTML structure
  if (!html.includes('<!DOCTYPE html>')) {
    warnings.push({ message: 'Missing DOCTYPE declaration' });
  }
  
  if (!html.includes('<html')) {
    errors.push({ message: 'Missing <html> tag' });
  }
  
  if (!html.includes('</html>')) {
    errors.push({ message: 'Missing </html> closing tag' });
  }
  
  if (!html.includes('<head>') || !html.includes('</head>')) {
    warnings.push({ message: 'Missing or incomplete <head> section' });
  }
  
  if (!html.includes('<body>') || !html.includes('</body>')) {
    errors.push({ message: 'Missing or incomplete <body> section' });
  }
  
  // Check for title
  if (!html.includes('<title>')) {
    warnings.push({ message: 'Missing <title> tag' });
  }
  
  // Check minimum size (a valid report should be at least 10KB)
  if (html.length < 10000) {
    warnings.push({ message: `HTML content is unusually small (${html.length} bytes)` });
  }
  
  // Check for unclosed script tags (common issue)
  const scriptOpen = (html.match(/<script/g) || []).length;
  const scriptClose = (html.match(/<\/script>/g) || []).length;
  if (scriptOpen !== scriptClose) {
    errors.push({ message: `Mismatched script tags: ${scriptOpen} open, ${scriptClose} close` });
  }
  
  // Check for unclosed style tags
  const styleOpen = (html.match(/<style/g) || []).length;
  const styleClose = (html.match(/<\/style>/g) || []).length;
  if (styleOpen !== styleClose) {
    errors.push({ message: `Mismatched style tags: ${styleOpen} open, ${styleClose} close` });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      size: html.length,
      sizeKB: (html.length / 1024).toFixed(2),
      scriptTags: scriptOpen,
      styleTags: styleOpen
    }
  };
}

/**
 * Cross-validate report calculations
 * Ensures that summary totals match the sum of individual job values
 * @param {Array<Object>} data - Array of profitability objects
 * @param {Object} summary - Executive summary object
 * @returns {Object} Validation result
 */
export function validateCalculations(data, summary) {
  const errors = [];
  const calculator = new ReportCalculator();
  const recalculated = calculator.calculateExecutiveSummary(data);
  
  // Tolerance for floating point comparison
  const tolerance = 0.01;
  
  const fieldsToCheck = [
    'totalJobs',
    'totalEffectiveSale',
    'totalPPPay',
    'totalKCLabor',
    'totalMaterial',
    'totalNetRetained',
    'totalTrueProfit'
  ];
  
  fieldsToCheck.forEach(field => {
    const expected = recalculated[field];
    const actual = summary[field];
    
    if (Math.abs(expected - actual) > tolerance) {
      errors.push({
        field,
        expected,
        actual,
        difference: Math.abs(expected - actual),
        message: `Calculation mismatch for ${field}: expected ${expected}, got ${actual}`
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    recalculated
  };
}

/**
 * Validate job type consistency
 * Uses ReportCalculator's validateJobTypes for anomaly detection
 * @param {Array<Object>} data - Array of profitability objects
 * @returns {Object} Validation result with anomalies
 */
export function validateJobTypeConsistency(data) {
  const calculator = new ReportCalculator();
  return calculator.validateJobTypes(data);
}

/**
 * Validate category totals match overall totals
 * @param {Array<Object>} data - Array of profitability objects
 * @returns {Object} Validation result
 */
export function validateCategoryTotals(data) {
  const errors = [];
  const calculator = new ReportCalculator();
  
  const summary = calculator.calculateExecutiveSummary(data);
  const categoryMetrics = calculator.getAllCategoryMetrics(data);
  
  // Sum up all category counts
  const categoryTotal = {
    count: 0,
    totalSale: 0,
    totalProfit: 0
  };
  
  Object.values(categoryMetrics).forEach(cat => {
    categoryTotal.count += cat.count;
    categoryTotal.totalSale += cat.totalSale;
    categoryTotal.totalProfit += cat.totalProfit;
  });
  
  const tolerance = 0.01;
  
  if (categoryTotal.count !== summary.totalJobs) {
    errors.push({
      field: 'count',
      expected: summary.totalJobs,
      actual: categoryTotal.count,
      message: `Job count mismatch: categories sum to ${categoryTotal.count}, summary shows ${summary.totalJobs}`
    });
  }
  
  if (Math.abs(categoryTotal.totalSale - summary.totalEffectiveSale) > tolerance) {
    errors.push({
      field: 'totalSale',
      expected: summary.totalEffectiveSale,
      actual: categoryTotal.totalSale,
      message: `Sale total mismatch across categories`
    });
  }
  
  if (Math.abs(categoryTotal.totalProfit - summary.totalTrueProfit) > tolerance) {
    errors.push({
      field: 'totalProfit',
      expected: summary.totalTrueProfit,
      actual: categoryTotal.totalProfit,
      message: `Profit total mismatch across categories`
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    categoryMetrics,
    summary
  };
}

/**
 * Run all validations on profitability data
 * @param {Array<Object>} data - Array of profitability objects
 * @returns {Object} Complete validation report
 */
export function runAllValidations(data) {
  const dataValidation = validateProfitabilityData(data);
  
  // Only run further validations if data structure is valid
  if (!dataValidation.isValid) {
    return {
      isValid: false,
      dataValidation,
      jobTypeValidation: null,
      categoryValidation: null,
      overallErrors: dataValidation.errors.length,
      overallWarnings: dataValidation.warnings.length
    };
  }
  
  const jobTypeValidation = validateJobTypeConsistency(data);
  const categoryValidation = validateCategoryTotals(data);
  
  const overallErrors = 
    dataValidation.errors.length + 
    categoryValidation.errors.length;
    
  const overallWarnings = 
    dataValidation.warnings.length + 
    jobTypeValidation.anomalyCount + 
    jobTypeValidation.warningCount;
  
  return {
    isValid: overallErrors === 0,
    dataValidation,
    jobTypeValidation,
    categoryValidation,
    overallErrors,
    overallWarnings
  };
}

export default {
  validateProfitabilityData,
  validateHTMLStructure,
  validateCalculations,
  validateJobTypeConsistency,
  validateCategoryTotals,
  runAllValidations
};

