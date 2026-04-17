/**
 * Interactive Selection Core
 * Menu navigation system using Node.js readline
 * Clean, minimal UI matching existing CLI style
 */

import readline from 'readline';
import { colorize, colors, boldColor } from './theme.js';
import logger from './logger.js';

export class InteractiveSelector {
  constructor() {
    if (process.env.JOBBER_NON_INTERACTIVE === '1') {
      throw new Error('Interactive selector is disabled in non-interactive mode');
    }
    if (!process.stdin.isTTY) {
      throw new Error('Interactive selector requires a TTY (stdin is not a terminal)');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Display a menu and get user selection
   * @param {Array} options - Array of { value, label, hint?, example? } objects
   * @param {string} prompt - Prompt text
   * @param {string} defaultOption - Default value if user presses Enter
   * @returns {Promise<string>} Selected value
   */
  async selectOption(options, prompt, defaultOption = null) {
    return new Promise((resolve) => {
      // Display menu
      console.log('');
      console.log(boldColor(prompt, colors.blue));
      console.log('');
      
      options.forEach((option, index) => {
        const num = index + 1;
        const label = option.label || option.value;
        const hint = option.hint ? colorize(`  (${option.hint})`, colors.grey) : '';
        const example = option.example ? colorize(`  Example: ${option.example}`, colors.lightBlue) : '';
        const defaultMarker = defaultOption === option.value ? colorize(' [default]', colors.grey) : '';
        
        console.log(`  ${num}. ${boldColor(label, colors.blue)}${defaultMarker}`);
        if (hint || example) {
          console.log(`     ${hint}${example}`);
        }
      });
      
      console.log('');
      
      // Build prompt text
      const defaultText = defaultOption ? ` (default: ${defaultOption})` : '';
      const promptText = `Select option [1-${options.length}${defaultText}]: `;
      
      this.rl.question(promptText, (answer) => {
        // Handle empty answer (use default)
        if (!answer.trim() && defaultOption) {
          resolve(defaultOption);
          return;
        }
        
        // Parse selection
        const selection = parseInt(answer.trim(), 10);
        
        if (isNaN(selection) || selection < 1 || selection > options.length) {
          logger.warn(`Invalid selection. Using default: ${defaultOption || options[0].value}`);
          resolve(defaultOption || options[0].value);
          return;
        }
        
        const selected = options[selection - 1];
        resolve(selected.value);
      });
    });
  }

  /**
   * Get text input from user
   * @param {string} prompt - Prompt text
   * @param {string} hint - Hint text
   * @param {string} example - Example value
   * @param {string} defaultValue - Default value
   * @param {Function} validator - Validation function (value) => boolean or error message
   * @returns {Promise<string>} User input
   */
  async getInput(prompt, hint = null, example = null, defaultValue = null, validator = null) {
    return new Promise((resolve, reject) => {
      console.log('');
      console.log(boldColor(prompt, colors.blue));
      if (hint) {
        console.log(colorize(`  Hint: ${hint}`, colors.grey));
      }
      if (example) {
        console.log(colorize(`  Example: ${example}`, colors.lightBlue));
      }
      console.log('');
      
      const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
      const promptText = `${prompt}${defaultText}: `;
      
      this.rl.question(promptText, (answer) => {
        // Use default if empty
        const value = answer.trim() || defaultValue || '';
        
        // Validate if validator provided
        if (validator) {
          try {
            const validation = validator(value);
            if (validation !== true) {
              const errorMsg = typeof validation === 'string' ? validation : 'Invalid input';
              logger.error(errorMsg);
              // Retry
              this.getInput(prompt, hint, example, defaultValue, validator)
                .then(resolve)
                .catch(reject);
              return;
            }
          } catch (error) {
            // If validator throws an error, reject the promise
            // This allows validators to throw special errors (e.g., USER_EXIT)
            reject(error);
            return;
          }
        }
        
        resolve(value);
      });
    });
  }

  /**
   * Get confirmation (yes/no)
   * @param {string} prompt - Prompt text
   * @param {boolean} defaultYes - Default to yes
   * @returns {Promise<boolean>} True if yes
   */
  async confirm(prompt, defaultYes = true) {
    return new Promise((resolve) => {
      const defaultText = defaultYes ? 'Y/n' : 'y/N';
      const promptText = `${prompt} [${defaultText}]: `;
      
      this.rl.question(promptText, (answer) => {
        const normalized = answer.trim().toLowerCase();
        
        if (!normalized) {
          resolve(defaultYes);
          return;
        }
        
        resolve(normalized === 'y' || normalized === 'yes');
      });
    });
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
}

export default InteractiveSelector;

