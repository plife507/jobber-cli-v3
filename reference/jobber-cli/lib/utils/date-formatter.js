/**
 * Date Formatter Utility
 * Formats dates and times in PST/PDT (Pacific Time) with automatic DST handling
 */

/**
 * Format a date to PST/PDT timezone
 * @param {Date|string} date - Date object or ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDatePST(date, options = {}) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Los_Angeles',
    ...options
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', defaultOptions);
  return formatter.format(dateObj);
}

/**
 * Format date only (no time) in PST/PDT
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Formatted date string (MM/DD/YYYY)
 */
export function formatDateOnlyPST(date) {
  return formatDatePST(date, {
    dateStyle: 'short',
    timeStyle: undefined
  });
}

/**
 * Format time only in PST/PDT
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Formatted time string
 */
export function formatTimeOnlyPST(date) {
  return formatDatePST(date, {
    dateStyle: undefined,
    timeStyle: 'short'
  });
}

/**
 * Format date and time together in PST/PDT
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Formatted date and time string
 */
export function formatDateTimePST(date) {
  return formatDatePST(date, {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

/**
 * Get timezone abbreviation (PST or PDT) for a given date
 * Determines if date is in Daylight Saving Time (PDT) or Standard Time (PST)
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} 'PST' or 'PDT'
 */
export function getTimezoneAbbreviation(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // First, try to get timezone name directly from Intl API
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  });
  
  const parts = formatter.formatToParts(dateObj);
  const timeZonePart = parts.find(part => part.type === 'timeZoneName');
  
  if (timeZonePart?.value) {
    const tz = timeZonePart.value.toUpperCase();
    if (tz === 'PST' || tz === 'PDT') {
      return tz;
    }
  }
  
  // Fallback: Calculate UTC offset to determine PST vs PDT
  // PST is UTC-8, PDT is UTC-7
  // We'll create two dates: one in UTC and one formatted as Pacific time
  // Then compare to determine the offset
  
  // Get the date/time components in Pacific timezone
  const pacificFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const pacificParts = pacificFormatter.formatToParts(dateObj);
  const pacificDate = {
    year: parseInt(pacificParts.find(p => p.type === 'year').value),
    month: parseInt(pacificParts.find(p => p.type === 'month').value) - 1, // 0-indexed
    day: parseInt(pacificParts.find(p => p.type === 'day').value),
    hour: parseInt(pacificParts.find(p => p.type === 'hour').value),
    minute: parseInt(pacificParts.find(p => p.type === 'minute').value),
    second: parseInt(pacificParts.find(p => p.type === 'second').value)
  };
  
  // Create a date object from Pacific time components (treating as UTC for comparison)
  const pacificAsUTC = new Date(Date.UTC(
    pacificDate.year,
    pacificDate.month,
    pacificDate.day,
    pacificDate.hour,
    pacificDate.minute,
    pacificDate.second
  ));
  
  // Calculate offset in hours
  // Pacific time is behind UTC, so offset will be negative
  // PDT is UTC-7, so offset is -7 hours (or +7 when reversed)
  // PST is UTC-8, so offset is -8 hours (or +8 when reversed)
  const offsetHours = (pacificAsUTC.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
  
  // Round to nearest hour to handle any floating point issues
  const roundedOffset = Math.round(offsetHours);
  
  // The offset represents how many hours Pacific is behind UTC
  // PDT: Pacific is 7 hours behind UTC (offset ~7 or ~-7 depending on calculation)
  // PST: Pacific is 8 hours behind UTC (offset ~8 or ~-8 depending on calculation)
  // We check the absolute value and compare
  const absOffset = Math.abs(roundedOffset);
  return absOffset === 7 ? 'PDT' : 'PST';
}

/**
 * Format date with timezone abbreviation
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Formatted date with timezone (e.g., "11/3/2025, 8:00 AM PST")
 */
export function formatDateTimeWithTZ(date) {
  const dateTime = formatDateTimePST(date);
  const tz = getTimezoneAbbreviation(date);
  return `${dateTime} ${tz}`;
}

/**
 * Format date and time in a compact format for CLI display
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Compact formatted string (e.g., "11/03/2025 8:00 AM PST")
 */
export function formatCompactDateTimePST(date) {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'
  });
  
  const tz = getTimezoneAbbreviation(date);
  return `${formatter.format(dateObj)} ${tz}`;
}

export default {
  formatDatePST,
  formatDateOnlyPST,
  formatTimeOnlyPST,
  formatDateTimePST,
  formatDateTimeWithTZ,
  formatCompactDateTimePST,
  getTimezoneAbbreviation
};

