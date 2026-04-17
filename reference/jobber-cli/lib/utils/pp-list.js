/**
 * Preferred Partner (PP) List
 * List of known Preferred Partners for expense identification
 *
 * Source of truth: config/preferred-partners.json
 * Fallback: docs/PP_LIST.md (parsed via regex, for backward compatibility)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI root: lib/utils/ -> up 2 levels
const cliRoot = path.resolve(__dirname, '../..');
// Project root: lib/utils/ -> up 3 levels
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Load PP list from config/preferred-partners.json
 * @returns {string[]|null} Array of PP names, or null if file missing/invalid
 */
function loadFromJSON() {
  try {
    const jsonPath = path.join(cliRoot, 'config', 'preferred-partners.json');
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    if (Array.isArray(data.partners) && data.partners.length > 0) {
      return data.partners;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: Parse PP_LIST.md and extract PP names
 * @returns {string[]} Array of PP names (emoji-stripped), or empty array on error
 */
function loadFromMarkdown() {
  try {
    const ppListPath = path.join(projectRoot, 'docs', 'PP_LIST.md');
    const content = fs.readFileSync(ppListPath, 'utf-8');
    const lines = content.split('\n');

    const ppList = [];
    for (const line of lines) {
      const match = line.match(/🛻.*PP\s*-\s*(.+)/);
      if (match) {
        const name = stripEmojis(match[1].trim());
        if (name) {
          // Filter out generic placeholders (e.g., "OC > PP")
          const lower = name.toLowerCase();
          if (lower.startsWith('oc >') && lower.endsWith('pp')) continue;
          ppList.push(name);
        }
      }
    }

    return ppList;
  } catch (error) {
    console.error('Error loading PP_LIST.md:', error.message);
    return [];
  }
}

/**
 * Load PP list: JSON first, Markdown fallback
 */
function loadPPList() {
  const fromJSON = loadFromJSON();
  if (fromJSON) return fromJSON;
  return loadFromMarkdown();
}

export const PP_LIST = loadPPList();

/**
 * Strip all emoji characters from a string
 * @param {string} str - String to strip emojis from
 * @returns {string} String without emojis
 */
export function stripEmojis(str) {
  if (!str) return '';
  // Remove emoji characters using Unicode ranges
  return str
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes Extended
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows-C
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols (sun, cloud, etc)
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{2B00}-\u{2BFF}]/gu, '')   // Misc Symbols and Arrows (includes star)
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols
    .replace(/\s+/g, ' ')                    // Collapse multiple spaces
    .trim();
}

/**
 * Get clean display name for a PP (without emojis)
 * @param {string} ppName - PP name possibly containing emojis
 * @returns {string} Clean display name
 */
export function getPPDisplayName(ppName) {
  if (!ppName) return '';
  return stripEmojis(ppName);
}

/**
 * Normalize a name for comparison (remove extra spaces, lowercase, trim)
 * @param {string} name - Name to normalize
 * @returns {string} Normalized name
 */
export function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if a name matches any PP in the list
 * @param {string} name - Name to check
 * @returns {boolean} True if name matches a PP
 */
export function isKnownPP(name) {
  if (!name) return false;
  
  // Strip emojis and normalize for matching
  const normalized = normalizeName(stripEmojis(name));
  
  // Check exact match (comparing stripped names)
  for (const pp of PP_LIST) {
    const ppStripped = normalizeName(stripEmojis(pp));
    if (ppStripped === normalized) {
      return true;
    }
  }
  
  // Check if name contains any PP name as a complete word (using word boundaries)
  for (const pp of PP_LIST) {
    const ppStripped = normalizeName(stripEmojis(pp));
    
    // If PP is a single word, use word boundary matching
    if (!ppStripped.includes(' ')) {
      // Match as complete word only (prevents "leo" matching "leonardo")
      const wordBoundaryRegex = new RegExp(`\\b${ppStripped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryRegex.test(normalized)) {
        return true;
      }
    } else {
      // For multi-word PPs, check if the full PP name appears as a phrase
      const phraseRegex = new RegExp(`\\b${ppStripped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (phraseRegex.test(normalized)) {
        return true;
      }
    }
    
    // Also check if normalized name is contained in PP name as a complete word
    if (!normalized.includes(' ')) {
      const wordBoundaryRegex = new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordBoundaryRegex.test(ppStripped)) {
        return true;
      }
    }
  }
  
  // Check if ANY word of the name exactly matches a PP's first name
  // This handles "Subcon Brett $300" where we need to find "Brett" anywhere
  // BUT only for single-name PPs (like "Kobe", "Jesse") or when both first name + last initial match
  // This prevents "Jose Lopez" (W2 employee) from matching "Jose A" (PP)
  const nameWords = normalized.split(/\s+/).map(w => w.replace(/[(),\$\d]/g, '').trim()).filter(w => w.length >= 2);
  for (const word of nameWords) {
    for (const pp of PP_LIST) {
      const ppStripped = normalizeName(stripEmojis(pp));
      const ppWords = ppStripped.split(/\s+/);
      
      if (ppWords.length === 1) {
        // Single-name PP (e.g., "Kobe", "Jesse"): match first name exactly
        if (ppWords[0] === word) {
          return true;
        }
      } else if (ppWords.length >= 2) {
        // Multi-word PP (e.g., "Jose A", "Brett H"): require first name + last initial
        // Only match if we find BOTH the first name AND matching last initial in the input
        const ppFirstName = ppWords[0];
        const ppLastInitial = ppWords[1].charAt(0).toLowerCase();
        
        if (word === ppFirstName) {
          // Found first name, now check if any other word starts with the same last initial
          const hasMatchingLastInitial = nameWords.some(w => 
            w !== word && w.charAt(0).toLowerCase() === ppLastInitial
          );
          // Also check for patterns like "Jose A" directly in the text
          const hasDirectMatch = normalized.includes(`${ppFirstName} ${ppLastInitial}`);
          
          if (hasMatchingLastInitial || hasDirectMatch) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Get all matching PP names from the list (handles cases like "Leo Torres, CMAX")
 * @param {string} name - Name to match
 * @returns {string[]} Array of matching PP names
 */
export function getAllMatchingPPs(name) {
  if (!name) return [];
  
  // Strip emojis and normalize for matching
  const normalized = normalizeName(stripEmojis(name));
  const matches = new Set();
  
  // Extract the base PP name (without parenthetical descriptions and emojis)
  // e.g., "Brian (Pool Blast)" -> "Brian", "Brett H💦🪟🏠🏢" -> "Brett H"
  const ppBaseName = (ppName) => {
    const stripped = stripEmojis(ppName);
    const match = stripped.match(/^([^(]+)/);
    return match ? match[1].trim() : stripped;
  };
  
  // Try exact match first (comparing stripped names)
  for (const pp of PP_LIST) {
    const ppStripped = normalizeName(stripEmojis(pp));
    if (ppStripped === normalized) {
      matches.add(pp);
      return Array.from(matches); // Return immediately on exact match
    }
  }
  
  // Try matching against base names (prioritize actual names over descriptions)
  for (const pp of PP_LIST) {
    const baseName = ppBaseName(pp);
    const baseNameNormalized = normalizeName(baseName);
    
    // Check if the base name appears as a complete word/phrase in the input
    const phraseRegex = new RegExp(`\\b${baseNameNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (phraseRegex.test(normalized)) {
      matches.add(pp);
    }
  }
  
  // If we found matches based on base names, return them
  if (matches.size > 0) {
    return Array.from(matches);
  }
  
  // Try first name matching against ALL words in the input (not just first word)
  // This handles "Subcon Brett $300" where we need to find "Brett" anywhere
  const inputWords = normalized.split(/\s+/).map(w => w.replace(/[(),\$\d]/g, '').trim()).filter(w => w.length >= 3);
  
  for (const word of inputWords) {
    for (const pp of PP_LIST) {
      const baseName = ppBaseName(pp);
      const baseNameWords = normalizeName(baseName).split(/\s+/);
      
      // Match if word equals PP's first name
      if (baseNameWords.length > 0 && baseNameWords[0] === word.toLowerCase()) {
        matches.add(pp);
      }
    }
  }
  
  return Array.from(matches);
}

/**
 * Get matching PP name from the list (returns first match for backward compatibility)
 * @param {string} name - Name to match
 * @returns {string|null} Matching PP name or null
 */
export function getMatchingPP(name) {
  const matches = getAllMatchingPPs(name);
  return matches.length > 0 ? matches[0] : null;
}

export default {
  PP_LIST,
  normalizeName,
  stripEmojis,
  getPPDisplayName,
  isKnownPP,
  getMatchingPP,
  getAllMatchingPPs
};


