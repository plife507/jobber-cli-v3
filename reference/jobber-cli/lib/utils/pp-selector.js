/**
 * Preferred Partner Selector
 * Interactive menu for selecting one or more PPs
 */

import InteractiveSelector from './interactive-selector.js';
import { PP_LIST } from './pp-list.js';
import { colorize, colors, boldColor } from './theme.js';
import logger from './logger.js';

export class PPSelector extends InteractiveSelector {
  /**
   * Select PPs with multi-select interface
   * @returns {Promise<{selectedPPs: string[], allSelected: boolean}>}
   */
  async selectPPs() {
    const selectedPPs = new Set();
    let allSelected = false;
    
    // Get unique list of PPs (remove duplicates from PP_LIST)
    const uniquePPs = [...new Set(PP_LIST)];
    
    while (true) {
      // Build menu with selection state
      const options = uniquePPs.map((pp) => ({
        value: pp,
        label: `${selectedPPs.has(pp) ? '[✓]' : '[ ]'} ${pp}`,
        selected: selectedPPs.has(pp)
      }));
      
      // Add control options
      options.push({ 
        value: 'selectAll', 
        label: colorize('Select All', colors.green),
        hint: `Select all ${uniquePPs.length} PPs`
      });
      
      if (selectedPPs.size > 0) {
        options.push({ 
          value: 'clearAll', 
          label: colorize('Clear All', colors.warning),
          hint: 'Deselect all'
        });
      }
      
      options.push({ 
        value: 'done', 
        label: colorize('Done', colors.blue),
        hint: selectedPPs.size > 0 ? `Proceed with ${selectedPPs.size} selected` : 'Proceed with no filter (all jobs)'
      });
      
      const selected = await this.selectOption(
        options,
        `👥 Select Preferred Partners (${selectedPPs.size} selected)`,
        selectedPPs.size > 0 ? 'done' : null
      );
      
      if (selected === 'done') {
        break;
      } else if (selected === 'selectAll') {
        uniquePPs.forEach(pp => selectedPPs.add(pp));
        allSelected = true;
        logger.info(`Selected all ${uniquePPs.length} PPs`);
      } else if (selected === 'clearAll') {
        selectedPPs.clear();
        allSelected = false;
        logger.info('Cleared all selections');
      } else {
        // Toggle selection
        if (selectedPPs.has(selected)) {
          selectedPPs.delete(selected);
          logger.info(`Deselected: ${selected}`);
        } else {
          selectedPPs.add(selected);
          logger.info(`Selected: ${selected}`);
        }
      }
    }
    
    const selectedArray = Array.from(selectedPPs);
    const allSelectedFlag = allSelected || selectedArray.length === uniquePPs.length;
    
    if (selectedArray.length === 0) {
      logger.info('No PPs selected - will search all jobs');
    } else {
      logger.success(`Selected ${selectedArray.length} PP(s): ${selectedArray.join(', ')}`);
    }
    
    return {
      selectedPPs: selectedArray,
      allSelected: allSelectedFlag
    };
  }
}

export default PPSelector;

