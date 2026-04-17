/**
 * Purpose: Shared HTML formatting utilities for report generation
 * Inputs: Various data types (numbers, strings)
 * Outputs: Formatted HTML-safe strings
 * Dependencies: pp-list (stripEmojis)
 */

// Re-export stripEmojis from canonical source so existing consumers keep working
export { stripEmojis } from '../../utils/pp-list.js';
import { stripEmojis } from '../../utils/pp-list.js';

/**
 * Format a number as USD currency
 * @param {number} value - The numeric value to format
 * @returns {string} Formatted currency string (e.g., "$1,234.56" or "-$1,234.56")
 */
export function formatCurrency(value) {
  if (!Number.isFinite(value)) return '$0.00';
  return value < 0 
    ? `-$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string|null|undefined} str - The string to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// stripEmojis imported from ../../utils/pp-list.js (single canonical source)

/**
 * Abbreviate division/location names for chart display
 * @param {string} name - Full division name
 * @returns {string} Abbreviated division name
 */
export function abbreviateDivision(name) {
  // Remove ", CA" suffix if present
  const cleanName = name.replace(/, CA$/, '');
  
  const abbreviations = {
    'South Orange County': 'SOC',
    'North Orange County': 'NOC',
    'West Los Angeles': 'WLA',
    'Inland Empire': 'IE',
    'North Los Angeles': 'NLA',
    'South Los Angeles': 'SLA',
    'North San Diego': 'NSD',
    'San Diego': 'SD',
    'South San Diego': 'SSD',
    'San Fernando Valley': 'SFV',
    'Bakersfield': 'BKF',
    'Lancaster': 'LAN',
    'Palmdale': 'PMD',
    'Victor Valley': 'VV',
    'Ventura County': 'VC',
    'Ventura': 'VC',
    'Orange County': 'OC',
    'Los Angeles': 'LA',
    'Other': 'OTH',
    'N/A': 'N/A'
  };
  
  return abbreviations[cleanName] || (cleanName.length > 3 ? cleanName.substring(0, 3).toUpperCase() : cleanName);
}

/**
 * Format a percentage with specified decimal places
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated string
 */
export function truncateString(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Get color for margin grade
 * @param {number} marginPercent - The margin percentage
 * @returns {string} CSS color value
 */
export function getMarginColor(marginPercent) {
  if (marginPercent >= 70) return '#10b981'; // Epic - emerald
  if (marginPercent >= 65) return '#22c55e'; // Very Good - green
  if (marginPercent >= 60) return '#14b8a6'; // Good - teal
  if (marginPercent >= 50) return '#fbbf24'; // Needs Inspection - amber
  return '#ef4444'; // Flagged - red
}

/**
 * Get badge class for job type
 * @param {string} jobType - The job type (KC, PP, PP-mix, Hybrid)
 * @returns {string} CSS class suffix for the badge
 */
export function getJobTypeBadgeClass(jobType) {
  if (jobType === null || jobType === undefined) {
    return 'standard';
  }

  const type = String(jobType).toLowerCase().replace('-', '');
  switch (type) {
    case 'pp': return 'pp';
    case 'ppmix': return 'ppmix';
    case 'hybrid': return 'hybrid';
    case 'kc': return 'kc';
    default: return 'kc';
  }
}

/**
 * Get color for job type
 * @param {string} jobType - The job type
 * @returns {string} CSS color value
 */
export function getJobTypeColor(jobType) {
  switch (jobType) {
    case 'PP': return '#10b981';
    case 'PP-mix': return '#3b82f6';
    case 'Hybrid': return '#f59e0b';
    default: return '#6b7280';
  }
}

/**
 * Get description for job type
 * @param {string} jobType - The job type
 * @returns {string} Human-readable description
 */
export function getJobTypeDescription(jobType) {
  switch (jobType) {
    case 'PP': return 'Preferred Partner (single subcontractor)';
    case 'PP-mix': return 'Multiple Preferred Partners';
    case 'Hybrid': return 'KC + Preferred Partner labor';
    default: return 'KC labor only';
  }
}

export default {
  formatCurrency,
  escapeHTML,
  stripEmojis,
  abbreviateDivision,
  formatPercent,
  truncateString,
  getMarginColor,
  getJobTypeBadgeClass,
  getJobTypeColor,
  getJobTypeDescription
};

