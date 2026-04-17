/**
 * Date Range Selector
 * Quick presets menu and custom date entry with format hints
 */

import InteractiveSelector from './interactive-selector.js';
import logger from './logger.js';

export class DatePicker extends InteractiveSelector {
  /**
   * Select date range
   * @returns {Promise<{start: string, end: string}>} Date range in YYYY-MM-DD format
   */
  async selectDateRange() {
    const presets = [
      {
        value: 'workWeek',
        label: 'Work Week (Monday - Friday)',
        hint: 'Select any date in the work week',
        example: 'Mon-Fri of selected week'
      },
      {
        value: 'month',
        label: 'Month (1st to last day)',
        hint: 'Select a specific month',
        example: 'Full month range'
      },
      {
        value: 'last7days',
        label: 'Last 7 days',
        hint: 'Past week',
        example: '2025-01-24 to 2025-01-31'
      },
      {
        value: 'last30days',
        label: 'Last 30 days',
        hint: 'Past month',
        example: '2025-01-01 to 2025-01-31'
      },
      {
        value: 'lastQuarter',
        label: 'Last quarter',
        hint: 'Previous 3 months',
        example: '2024-10-01 to 2024-12-31'
      },
      {
        value: 'thisYear',
        label: 'This year',
        hint: 'Year to date',
        example: '2025-01-01 to 2025-12-31'
      },
      {
        value: 'custom',
        label: 'Custom date range',
        hint: 'Enter start and end dates manually',
        example: 'YYYY-MM-DD format'
      }
    ];

    const selected = await this.selectOption(
      presets,
      '📅 Select Date Range',
      'last30days'
    );

    if (selected === 'workWeek') {
      return await this.selectWorkWeek();
    }
    
    if (selected === 'month') {
      return await this.selectMonth();
    }

    if (selected === 'custom') {
      return await this.getCustomDateRange();
    }

    return this.getPresetDates(selected);
  }

  /**
   * Select a work week (Monday - Friday)
   * User enters any date in the week, and we calculate Monday-Friday
   * @returns {Promise<{start: string, end: string}>} Date range
   */
  async selectWorkWeek() {
    const today = this.formatDate(new Date());
    const dateInput = await this.getInput(
      'Enter any date in the work week',
      'Format: YYYY-MM-DD (e.g., 2025-01-15)',
      today,
      today,
      this.validateDate
    );

    const date = new Date(dateInput);
    
    // Find Monday of the week containing this date
    // getDay() returns: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
    const dayOfWeek = date.getDay();
    
    // Calculate days to subtract to get to Monday
    // If Sunday (0), go back 6 days. Otherwise, go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Friday is 4 days after Monday
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const start = this.formatDate(monday);
    const end = this.formatDate(friday);
    
    logger.info(`Selected work week: ${start} (Monday) to ${end} (Friday)`);
    
    return { start, end };
  }

  /**
   * Select a month (1st to last day)
   * @returns {Promise<{start: string, end: string}>} Date range
   */
  async selectMonth() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Get year
    const yearInput = await this.getInput(
      'Enter year',
      'Format: YYYY',
      String(currentYear),
      String(currentYear),
      this.validateYear
    );
    const year = parseInt(yearInput, 10);

    // Get month
    const monthInput = await this.getInput(
      'Enter month (1-12)',
      'January = 1, December = 12',
      String(currentMonth),
      String(currentMonth),
      (value) => {
        const month = parseInt(value, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return 'Month must be between 1 and 12';
        }
        return true;
      }
    );
    const month = parseInt(monthInput, 10);

    // Calculate first day of month
    const firstDay = new Date(year, month - 1, 1);
    firstDay.setHours(0, 0, 0, 0);

    // Calculate last day of month (day 0 of next month = last day of current month)
    const lastDay = new Date(year, month, 0);
    lastDay.setHours(23, 59, 59, 999);

    const start = this.formatDate(firstDay);
    const end = this.formatDate(lastDay);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    logger.info(`Selected month: ${monthNames[month - 1]} ${year} (${start} to ${end})`);
    
    return { start, end };
  }

  /**
   * Validate year
   * @param {string} yearStr - Year string
   * @returns {boolean|string} True if valid, error message if invalid
   */
  validateYear(yearStr) {
    if (!yearStr) {
      return 'Year is required';
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return 'Year must be between 2000 and 2100';
    }

    return true;
  }

  /**
   * Get preset date range
   * @param {string} preset - Preset name
   * @returns {{start: string, end: string}} Date range
   */
  getPresetDates(preset) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // End of today
    const end = this.formatDate(endDate);

    let startDate = new Date(today);

    switch (preset) {
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'lastQuarter':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1); // January 1st
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0); // Start of day
    const start = this.formatDate(startDate);

    return { start, end };
  }

  /**
   * Get custom date range from user input
   * @returns {Promise<{start: string, end: string}>} Date range
   */
  async getCustomDateRange() {
    const start = await this.getInput(
      'Enter start date',
      'Format: YYYY-MM-DD',
      '2025-01-01',
      null,
      this.validateDate
    );

    const end = await this.getInput(
      'Enter end date',
      'Format: YYYY-MM-DD',
      '2025-01-31',
      null,
      this.validateDate
    );

    // Validate range
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      logger.error('Start date must be before end date');
      return await this.getCustomDateRange(); // Retry
    }

    return { start, end };
  }

  /**
   * Validate date format
   * @param {string} dateStr - Date string
   * @returns {boolean|string} True if valid, error message if invalid
   */
  validateDate(dateStr) {
    if (!dateStr) {
      return 'Date is required';
    }

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return 'Date must be in YYYY-MM-DD format (e.g., 2025-01-01)';
    }

    // Check if valid date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return true;
  }

  /**
   * Format date as YYYY-MM-DD
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Static helper to format date (for use in other modules)
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export default DatePicker;

