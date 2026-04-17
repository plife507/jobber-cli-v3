/**
 * Purpose: Centralized file handling for report output with atomic writes and validation
 * Inputs: HTML content, file paths
 * Outputs: Written files with validation
 * Dependencies: fs, path, report-validators
 */

import { writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve, basename, join, dirname } from 'path';
import { validateHTMLStructure } from './report-validators.js';

/**
 * Generate default output path for a report based on CSV input
 * @param {string} csvFile - Input CSV file path
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Additional options
 * @returns {string} Generated output file path
 */
export function getDefaultReportPath(csvFile, projectRoot, options = {}) {
  const baseName = basename(csvFile, '.csv');
  const timestamp = options.timestamp || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const suffix = options.suffix || 'profitability_report';
  
  return join(projectRoot, 'batch-reports', 'html-reports', `${baseName}_${suffix}_${timestamp}.html`);
}

/**
 * Ensure directory exists for file path
 * @param {string} filePath - Full file path
 */
export function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Write HTML report atomically (write to temp, then rename)
 * @param {string} html - HTML content to write
 * @param {string} outputPath - Target file path
 * @param {Object} options - Write options
 * @returns {Object} Write result with stats
 */
export function writeHTMLReport(html, outputPath, options = {}) {
  const {
    validate = true,
    backup = false,
    overwrite = true
  } = options;
  
  const absolutePath = resolve(outputPath);
  const tempPath = `${absolutePath}.tmp`;
  const backupPath = `${absolutePath}.bak`;
  
  const result = {
    success: false,
    path: absolutePath,
    size: 0,
    sizeKB: 0,
    validation: null,
    error: null
  };
  
  // Validate HTML structure if requested
  if (validate) {
    result.validation = validateHTMLStructure(html);
    if (!result.validation.isValid) {
      result.error = `HTML validation failed: ${result.validation.errors.map(e => e.message).join(', ')}`;
      return result;
    }
  }
  
  try {
    // Ensure directory exists
    ensureDirectoryExists(absolutePath);
    
    // Check if file exists and handle accordingly
    const fileExists = existsSync(absolutePath);
    if (fileExists && !overwrite) {
      result.error = `File already exists: ${absolutePath}`;
      return result;
    }
    
    // Create backup if requested
    if (fileExists && backup) {
      try {
        const existingContent = readFileSync(absolutePath, 'utf-8');
        writeFileSync(backupPath, existingContent, 'utf-8');
      } catch (backupError) {
        // Non-fatal, continue with write
        console.warn(`Warning: Could not create backup: ${backupError.message}`);
      }
    }
    
    // Write to temp file first (atomic write strategy)
    writeFileSync(tempPath, html, 'utf-8');
    
    // Verify temp file was written correctly
    const tempStats = statSync(tempPath);
    if (tempStats.size === 0) {
      unlinkSync(tempPath);
      result.error = 'Temp file was empty after write';
      return result;
    }
    
    if (tempStats.size !== Buffer.byteLength(html, 'utf-8')) {
      unlinkSync(tempPath);
      result.error = 'Temp file size mismatch - partial write detected';
      return result;
    }
    
    // Atomic rename
    renameSync(tempPath, absolutePath);
    
    // Get final stats
    const finalStats = statSync(absolutePath);
    result.success = true;
    result.size = finalStats.size;
    result.sizeKB = (finalStats.size / 1024).toFixed(2);
    
  } catch (error) {
    result.error = error.message;
    
    // Clean up temp file if it exists
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
  
  return result;
}

/**
 * Generate a unique filename if file already exists
 * @param {string} basePath - Base file path
 * @returns {string} Unique file path
 */
export function getUniqueFilePath(basePath) {
  if (!existsSync(basePath)) {
    return basePath;
  }
  
  const dir = dirname(basePath);
  const ext = '.html';
  const baseNameWithoutExt = basename(basePath, ext);
  
  let counter = 1;
  let newPath = basePath;
  
  while (existsSync(newPath)) {
    newPath = join(dir, `${baseNameWithoutExt}_${counter}${ext}`);
    counter++;
    
    // Safety limit
    if (counter > 100) {
      throw new Error('Unable to generate unique filename after 100 attempts');
    }
  }
  
  return newPath;
}

/**
 * Get file info if it exists
 * @param {string} filePath - File path to check
 * @returns {Object|null} File info or null if doesn't exist
 */
export function getFileInfo(filePath) {
  const absolutePath = resolve(filePath);
  
  if (!existsSync(absolutePath)) {
    return null;
  }
  
  try {
    const stats = statSync(absolutePath);
    return {
      path: absolutePath,
      exists: true,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    return null;
  }
}

/**
 * Clean up old report files (keep only N most recent)
 * @param {string} directory - Directory to clean
 * @param {number} keepCount - Number of files to keep
 * @param {string} pattern - File pattern to match (default: *.html)
 * @returns {Object} Cleanup result
 */
export function cleanupOldReports(directory, keepCount = 10, pattern = '*.html') {
  // readdirSync already imported at top of file
  
  const result = {
    success: false,
    deleted: [],
    kept: [],
    error: null
  };
  
  try {
    if (!existsSync(directory)) {
      result.error = `Directory does not exist: ${directory}`;
      return result;
    }
    
    // Get all HTML files
    const files = readdirSync(directory)
      .filter(f => f.endsWith('.html'))
      .map(f => ({
        name: f,
        path: join(directory, f),
        stats: statSync(join(directory, f))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Newest first
    
    // Keep the most recent
    result.kept = files.slice(0, keepCount).map(f => f.name);
    
    // Delete the rest
    const toDelete = files.slice(keepCount);
    for (const file of toDelete) {
      try {
        unlinkSync(file.path);
        result.deleted.push(file.name);
      } catch (deleteError) {
        // Continue with other files
      }
    }
    
    result.success = true;
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

export default {
  getDefaultReportPath,
  ensureDirectoryExists,
  writeHTMLReport,
  getUniqueFilePath,
  getFileInfo,
  cleanupOldReports
};

