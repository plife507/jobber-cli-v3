/**
 * Format Selector
 * Output format selection (Console, CSV, JSON, HTML)
 */

import InteractiveSelector from './interactive-selector.js';
import DatePicker from './date-picker.js';

export class FormatSelector extends InteractiveSelector {
  /**
   * Select output format
   * @returns {Promise<{format: string, filename: string|null}>} Format and optional filename
   */
  async selectFormat() {
    const options = [
      {
        value: 'console',
        label: 'Console',
        hint: 'Display in terminal (default)',
        example: 'Formatted table output'
      },
      {
        value: 'csv',
        label: 'CSV',
        hint: 'Export to CSV file',
        example: 'report_2025-01-31.csv'
      },
      {
        value: 'json',
        label: 'JSON',
        hint: 'Export to JSON file',
        example: 'report_2025-01-31.json'
      },
      {
        value: 'html',
        label: 'HTML',
        hint: 'Export to HTML file',
        example: 'report_2025-01-31.html'
      }
    ];

    const format = await this.selectOption(
      options,
      '📄 Select Output Format',
      'console'
    );

    // If format is file-based, get filename
    let filename = null;
    if (format !== 'console') {
      const today = new Date();
      const dateStr = formatDate(today);
      const defaultFilename = `report_${dateStr}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'html'}`;

      filename = await this.getInput(
        'Enter filename',
        'File path (relative or absolute)',
        defaultFilename,
        defaultFilename
      );
    }

    return { format, filename };
  }
}

// Helper function to format date (using DatePicker static method)
function formatDate(date) {
  return DatePicker.formatDate(date);
}

export default FormatSelector;

