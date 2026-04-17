/**
 * Purpose: Token Utilities - helper functions for JWT token decoding and expiration checking
 * Inputs: JWT token strings
 * Outputs: Decoded token payloads, expiration information, validation results
 * Dependencies: date-formatter
 */

import { formatCompactDateTimePST } from './date-formatter.js';

/**
 * Decode JWT token payload (without verification)
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function decodeToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64 URL-safe payload
    let payload = parts[1];
    
    // Convert URL-safe base64 to standard base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed (more precise calculation)
    const padLength = (4 - (payload.length % 4)) % 4;
    payload += '='.repeat(padLength);

    // Validate base64 before decoding
    if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
      return null;
    }

    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    
    // Validate JSON before parsing
    if (!decoded.trim().startsWith('{')) {
      return null;
    }
    
    const parsed = JSON.parse(decoded);
    
    // Basic validation - should be an object
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiration date
 * @param {string} token - JWT token string
 * @returns {Date|null} Expiration date or null if invalid
 */
export function getTokenExpiration(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // exp is Unix timestamp in seconds
  return new Date(payload.exp * 1000);
}

/**
 * Check if token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} True if expired
 * @throws {Error} If token format is invalid
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload) {
    throw new Error('Invalid token format');
  }
  
  const expDate = getTokenExpiration(token);
  if (!expDate) {
    // Token doesn't have expiration - consider it invalid
    throw new Error('Token missing expiration claim');
  }

  return expDate < new Date();
}

/**
 * Get time until token expires
 * @param {string} token - JWT token string
 * @returns {Object|null} Object with { hours, minutes, seconds } or null if invalid
 */
export function getTimeUntilExpiration(token) {
  const expDate = getTokenExpiration(token);
  if (!expDate) {
    return null;
  }

  const now = new Date();
  const diffMs = expDate - now;

  if (diffMs < 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}

/**
 * Format expiration info as human-readable string
 * @param {string} token - JWT token string
 * @returns {string} Formatted expiration info
 */
export function formatTokenExpiration(token) {
  const expDate = getTokenExpiration(token);
  if (!expDate) {
    return 'Invalid token';
  }

  const timeUntil = getTimeUntilExpiration(token);
  if (!timeUntil) {
    return 'Invalid token';
  }

  const formattedDate = formatCompactDateTimePST(expDate);
  
  if (timeUntil.expired) {
    return `Expired on ${formattedDate}`;
  }

  const { hours, minutes } = timeUntil;
  let timeStr = '';
  
  if (hours > 0) {
    timeStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) {
      timeStr += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } else {
    timeStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `Expires in ${timeStr} (${formattedDate})`;
}

/**
 * Check if token expires soon (within specified hours)
 * @param {string} token - JWT token string
 * @param {number} hours - Number of hours to check ahead (default: 1)
 * @returns {boolean} True if expires within the specified time
 */
export function expiresSoon(token, hours = 1) {
  const expDate = getTokenExpiration(token);
  if (!expDate) {
    return true;
  }

  const now = new Date();
  const warningTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return expDate < warningTime;
}

export default {
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  getTimeUntilExpiration,
  formatTokenExpiration,
  expiresSoon
};

