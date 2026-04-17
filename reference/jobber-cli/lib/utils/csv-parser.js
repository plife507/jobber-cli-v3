/**
 * Purpose: CSV Parser - extracts job numbers from CSV files
 * Inputs: CSV file path containing job numbers
 * Outputs: Array of job numbers (strings)
 * Dependencies: fs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Find the job number column index from header row
 * @param {string} headerLine - First line of CSV
 * @returns {number} Column index (-1 if not found)
 */
function findJobNumberColumn(headerLine) {
  const parts = headerLine.split(/[,\t;]/);
  const headers = parts.map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  
  return headers.findIndex(h => 
    (h.includes('job') && (h.includes('number') || h.includes('#'))) ||
    h === 'jobnumber' ||
    h === 'job_number' ||
    h === 'job number'
  );
}

/**
 * Parse CSV file containing job numbers
 * Supports header detection, multiple delimiters, and duplicate removal
 * @param {string} filePath - Path to CSV file
 * @param {Object} options - Parsing options
 * @param {boolean} options.reportDuplicates - If true, returns duplicates info
 * @returns {Array<string>|Object} Array of job numbers or object with numbers and duplicates
 */
export function parseJobNumbersFromCSV(filePath, options = {}) {
  try {
    const absolutePath = resolve(filePath);
    const content = readFileSync(absolutePath, 'utf-8');
    
    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Try to detect job number column from header
    const columnIndex = findJobNumberColumn(lines[0]);
    const useColumn = columnIndex !== -1 ? columnIndex : 0;
    
    // Skip header row (first line)
    const dataLines = lines.slice(1);
    
    if (dataLines.length === 0) {
      throw new Error('CSV file contains no job numbers (only header)');
    }
    
    // Track duplicates if requested
    const seen = new Set();
    const duplicates = [];
    
    // Extract job numbers (handle CSV with commas, tabs, or semicolons)
    const jobNumbers = dataLines
      .map(line => {
        // Split by comma, tab, or semicolon
        const parts = line.split(/[,\t;]/);
        if (parts.length <= useColumn) return null;
        // Take the appropriate column and remove quotes
        const jobNumber = parts[useColumn].trim().replace(/["']/g, '');
        return jobNumber;
      })
      .filter(num => {
        // Filter out invalid entries
        if (!num) return false;
        // Must be numeric or contain only digits
        if (!/^\d+$/.test(num)) return false;
        
        // Track duplicates
        if (seen.has(num)) {
          duplicates.push(num);
          return false;
        }
        seen.add(num);
        return true;
      });
    
    if (jobNumbers.length === 0) {
      throw new Error('No valid job numbers found in CSV');
    }
    
    // Return with duplicate info if requested
    if (options.reportDuplicates) {
      return {
        jobNumbers,
        duplicates,
        columnDetected: columnIndex !== -1
      };
    }
    
    return jobNumbers;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Validate job number format
 * @param {string|number} jobNumber - Job number to validate
 * @returns {boolean} True if valid
 */
export function isValidJobNumber(jobNumber) {
  const str = String(jobNumber);
  return /^\d+$/.test(str) && parseInt(str) > 0;
}

/**
 * Convert job number to GraphQL GID format
 * @param {string|number} jobNumber - Job number
 * @returns {string} GID format: "gid://jobber/Job/<jobNumber>"
 */
export function jobNumberToGID(jobNumber) {
  if (!isValidJobNumber(jobNumber)) {
    throw new Error(`Invalid job number: ${jobNumber}`);
  }
  return `gid://jobber/Job/${jobNumber}`;
}

