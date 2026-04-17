/**
 * Purpose: Structured Logging Utility - provides clean minimal formatting with emojis and color
 * Inputs: Log level, message strings, optional metadata
 * Outputs: Formatted log messages to console with appropriate colors and emojis
 * Dependencies: theme.js for colorization utilities
 */
/**
 * Structured Logging Utility - Clean Minimal Formatting
 * Simple, clean log messages with emojis and color
 */

import { colorize, colors, calculateCleanWidth } from './theme.js';

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(level = 'INFO') {
    const upperLevel = (level || '').toUpperCase();
    if (LOG_LEVELS[upperLevel] !== undefined) {
      this.level = LOG_LEVELS[upperLevel];
    } else {
      if (level && level !== 'INFO') {
        console.warn(`Invalid log level "${level}", defaulting to INFO`);
      }
      this.level = LOG_LEVELS.INFO;
    }
  }

  /**
   * Format log message in clean minimal format
   */
  formatLogMessage(message, icon, color) {
    const isTTY = process.stdout.isTTY;
    const iconText = (icon && isTTY) ? `${icon} ` : '';
    const fullMessage = `${iconText}${message}`;
    return colorize(fullMessage, color);
  }

  error(message, ...args) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formatted = this.formatLogMessage(message, '❌', colors.error);
      console.error(formatted);
      if (args.length > 0) {
        console.error(...args);
      }
    }
  }

  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formatted = this.formatLogMessage(message, '⚠️', colors.warning);
      console.warn(formatted);
      if (args.length > 0) {
        console.warn(...args);
      }
    }
  }

  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatLogMessage(message, 'ℹ️', colors.lightBlue);
      console.log(formatted);
      if (args.length > 0) {
        console.log(...args);
      }
    }
  }

  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatLogMessage(message, '🔍', colors.grey);
      console.log(formatted);
      if (args.length > 0) {
        console.log(...args);
      }
    }
  }

  success(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatLogMessage(message, '✅', colors.green);
      console.log(formatted);
      if (args.length > 0) {
        console.log(...args);
      }
    }
  }

  /**
   * Format file path as clickable hyperlink (OSC 8 escape sequence)
   * Works in Windows Terminal, VS Code, and most modern terminals
   */
  filePath(filePath) {
    // Convert Windows backslashes to forward slashes for file:// URLs
    let normalizedPath = filePath.replace(/\\/g, '/');
    
    // Build file:// URL
    let url;
    if (normalizedPath.match(/^[A-Z]:\//i)) {
      // Windows absolute path: C:/path -> file:///C:/path (three slashes)
      url = `file:///${normalizedPath}`;
    } else if (normalizedPath.startsWith('/')) {
      // Unix absolute path: /path -> file:///path
      url = `file://${normalizedPath}`;
    } else {
      // Relative path: path -> file:///path (assume current directory)
      url = `file:///${normalizedPath}`;
    }
    
    // Use OSC 8 hyperlink escape sequence
    // Format: \x1b]8;;<url>\x1b\\<text>\x1b]8;;\x1b\\
    return `\x1b]8;;${url}\x1b\\${filePath}\x1b]8;;\x1b\\`;
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
  }
}

export default new Logger(process.env.LOG_LEVEL || 'INFO');
