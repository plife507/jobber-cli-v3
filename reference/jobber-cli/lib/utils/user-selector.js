/**
 * User/Salesperson Selector
 * Multi-select with search/filter
 * Option: "All users" (no filter)
 */

import InteractiveSelector from './interactive-selector.js';
import logger from './logger.js';
import { colorize, colors, boldColor } from './theme.js';

export class UserSelector extends InteractiveSelector {
  constructor(queryExecutor = null) {
    super();
    this.queryExecutor = queryExecutor;
    this.usersCache = null;
  }

  /**
   * Select users/salespersons
   * @param {Array} users - Pre-fetched users (optional, will query if not provided)
   * @returns {Promise<Array<string>|null>} Array of user IDs or null for "all users"
   */
  async selectUsers(users = null) {
    // Fetch users if not provided
    if (!users) {
      users = await this.fetchUsers();
    }

    if (!users || users.length === 0) {
      logger.warn('No users found. Using "All users" filter.');
      return null;
    }

    // Show options
    const options = [
      {
        value: 'all',
        label: 'All users',
        hint: 'No filtering'
      },
      {
        value: 'select',
        label: 'Select specific users',
        hint: 'Multi-select with search'
      }
    ];

    const selected = await this.selectOption(
      options,
      '👤 Filter by User/Salesperson',
      'all'
    );

    if (selected === 'all') {
      return null; // null means no filter
    }

    return await this.multiSelectUsers(users);
  }

  /**
   * Multi-select users with search
   * @param {Array} users - Array of user objects { id, name, role? }
   * @returns {Promise<Array<string>>} Selected user IDs
   */
  async multiSelectUsers(users) {
    const selected = new Set();
    let searchTerm = '';

    console.log('');
    console.log(boldColor('👤 Select Users (multi-select)', colors.blue));
    console.log('');
    console.log(colorize('  Instructions:', colors.grey));
    console.log(colorize('  - Enter numbers to toggle selection (e.g., "1,3,5")', colors.grey));
    console.log(colorize('  - Enter "s <term>" to search/filter users', colors.grey));
    console.log(colorize('  - Enter "d" when done', colors.grey));
    console.log('');

    while (true) {
      // Filter users based on search
      const filtered = this.filterUsers(users, searchTerm);
      
      // Display users
      this.displayUsers(filtered, selected, searchTerm);

      // Get input
      const input = await this.getInput(
        'Enter selection',
        'Numbers (e.g., "1,3,5"), "s <term>" to search, "d" to done',
        '1,3,5 or "d"',
        null
      );

      const trimmed = input.trim().toLowerCase();

      // Check for done
      if (trimmed === 'd' || trimmed === 'done') {
        if (selected.size === 0) {
          logger.warn('No users selected. Using "All users".');
          return null;
        }
        break;
      }

      // Check for search
      if (trimmed.startsWith('s ')) {
        searchTerm = trimmed.substring(2).trim();
        continue;
      }

      // Parse numbers
      const numbers = trimmed.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0 && n <= filtered.length);
      
      if (numbers.length === 0) {
        logger.warn('Invalid selection. Enter numbers (e.g., "1,3,5") or "d" to done.');
        continue;
      }

      // Toggle selection
      numbers.forEach(num => {
        const user = filtered[num - 1];
        if (user) {
          if (selected.has(user.id)) {
            selected.delete(user.id);
          } else {
            selected.add(user.id);
          }
        }
      });
    }

    return Array.from(selected);
  }

  /**
   * Display users with checkboxes
   * @param {Array} users - Users to display
   * @param {Set} selected - Set of selected user IDs
   * @param {string} searchTerm - Current search term
   */
  displayUsers(users, selected, searchTerm) {
    console.log('');
    if (searchTerm) {
      console.log(colorize(`  Filtered by: "${searchTerm}" (${users.length} users)`, colors.grey));
    } else {
      console.log(colorize(`  ${users.length} users available`, colors.grey));
    }
    console.log('');

    users.forEach((user, index) => {
      const num = index + 1;
      const checkbox = selected.has(user.id) ? '☑' : '☐';
      const name = user.name || 'Unknown';
      const role = user.role ? colorize(` (${user.role})`, colors.grey) : '';
      const nameColor = selected.has(user.id) ? colors.blue : colors.white;
      
      console.log(`  ${checkbox} ${num}. ${boldColor(name, nameColor)}${role}`);
    });

    if (selected.size > 0) {
      console.log('');
      console.log(colorize(`  Selected: ${selected.size} user(s)`, colors.green));
    }
    console.log('');
  }

  /**
   * Filter users by search term
   * @param {Array} users - Users array
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered users
   */
  filterUsers(users, searchTerm) {
    if (!searchTerm) {
      return users;
    }

    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const name = (user.name || '').toLowerCase();
      const role = (user.role || '').toLowerCase();
      return name.includes(term) || role.includes(term);
    });
  }

  /**
   * Fetch users from Jobber API
   * Discovers users from jobs' salesperson fields
   * @returns {Promise<Array>} Array of user objects
   */
  async fetchUsers() {
    if (this.usersCache) {
      return this.usersCache;
    }

    if (!this.queryExecutor) {
      logger.warn('Query executor not available. Cannot fetch users.');
      return [];
    }

    logger.info('Fetching users from Jobber API...');

    // Query jobs to discover salespersons
    const query = `
      query DiscoverUsers($first: Int, $after: String) {
        jobs(first: $first, after: $after) {
          nodes {
            salesperson {
              id
              name {
                full
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const usersMap = new Map();
    let cursor = null;
    let hasNextPage = true;
    let pageCount = 0;
    const maxPages = 10; // Limit to avoid excessive queries

    while (hasNextPage && pageCount < maxPages) {
      const variables = { first: 50 };
      if (cursor) {
        variables.after = cursor;
      }

      const result = await this.queryExecutor.execute(query, variables, { estimatedCost: 102 });

      if (!result.success || !result.data?.jobs?.nodes) {
        break;
      }

      const jobs = result.data.jobs.nodes || [];
      jobs.forEach(job => {
        if (job.salesperson && job.salesperson.id) {
          const id = job.salesperson.id;
          if (!usersMap.has(id)) {
            usersMap.set(id, {
              id: id,
              name: job.salesperson.name?.full || 'Unknown',
              role: 'Salesperson'
            });
          }
        }
      });

      hasNextPage = result.data.jobs.pageInfo?.hasNextPage || false;
      cursor = result.data.jobs.pageInfo?.endCursor || null;
      pageCount++;

      // Small delay between pages
      if (hasNextPage && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const users = Array.from(usersMap.values());
    this.usersCache = users; // Cache for future use

    logger.success(`Found ${users.length} user(s)`);
    return users;
  }
}

export default UserSelector;

