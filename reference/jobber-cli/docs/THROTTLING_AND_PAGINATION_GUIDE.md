# Throttling & Pagination Guide - jobber-cli

**Focus:** How throttling and pagination work in the jobber-cli project

---

## 🎯 Quick Overview

### Throttling (Rate Limiting)
- **What:** Jobber API has a budget of throttle points (default: 10,000 units)
- **How:** CLI automatically checks budget before queries and waits if needed
- **Where:** `lib/core/throttle-manager.js` + `lib/core/jobber-client.js`

### Pagination
- **What:** Fetching large datasets in chunks using cursors
- **How:** GraphQL cursor-based pagination with `first`, `after`, `pageInfo`
- **Where:** Various commands like `list-ar-jobs.js`, `searchpp.js`

---

## 🔧 Throttling System

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Command (e.g., get, search)            │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│              BaseCommand.initialize()               │
│  - Creates ThrottleManager                          │
│  - Creates JobberClient with ThrottleManager        │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│         JobberClient.executeQuery()                 │
│  1. Estimate query cost                             │
│  2. Ask ThrottleManager: Do we have budget?         │
│  3. Wait if needed (with progress bar)              │
│  4. Execute query                                   │
│  5. Update throttle status from response            │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│            ThrottleManager                          │
│  - Tracks: currentlyAvailable / maximumAvailable    │
│  - Calculates wait times                            │
│  - Shows progress during waits                      │
└─────────────────────────────────────────────────────┘
```

### How It Works

#### 1. Throttle Status Tracking

```javascript
// lib/core/throttle-manager.js
this.throttleStatus = {
  maximumAvailable: 10000,      // Max budget
  currentlyAvailable: 10000,    // Current budget
  restoreRate: 500              // Units restored per second
};
```

Every API response includes throttle status:
```json
{
  "extensions": {
    "throttleStatus": {
      "maximumAvailable": 10000,
      "currentlyAvailable": 8500,
      "restoreRate": 500
    }
  }
}
```

#### 2. Before Query: Check Budget

```javascript
// lib/core/jobber-client.js - executeQuery()

// Estimate cost if not provided
estimatedCost = this.estimateQueryCost(query);

// Wait if needed (automatic!)
await this.throttleManager.waitIfNeeded(estimatedCost);
```

**Cost Estimation:**
- Simple query (just ID): ~10-50 units
- Medium query (basic fields): ~50-200 units
- Complex query (nested data): ~500-1500 units
- Schema introspection: ~45,000 units

#### 3. If Budget Low: Auto-Wait

```javascript
// lib/core/throttle-manager.js - waitIfNeeded()

async waitIfNeeded(estimatedCost, options = {}) {
  const waitTime = this.calculateWaitTime(estimatedCost);
  
  if (waitTime > 0) {
    logger.info(`⏳ Throttle budget low: ${currentlyAvailable} available`);
    logger.info(`   Waiting ${waitTime} seconds for budget to restore...`);
    
    // Wait with progress updates every 2 seconds
    while (waited < waitTime) {
      await sleep(2000);
      process.stdout.write(`\r   ⏳ ${waited}s / ${waitTime}s...`);
    }
    
    logger.info(`✅ Ready!`);
  }
}
```

**Wait Time Calculation:**
```javascript
calculateWaitTime(requiredUnits) {
  const unitsNeeded = requiredUnits - currentlyAvailable;
  
  if (unitsNeeded <= 0) return 0;
  
  // Add 10% buffer for safety
  const waitSeconds = (unitsNeeded / restoreRate) * 1.1;
  
  return Math.ceil(waitSeconds);
}
```

**Example:**
- Need: 2000 units
- Available: 500 units
- Needed: 1500 units
- Restore rate: 500 units/sec
- Wait time: (1500 / 500) × 1.1 = 3.3 seconds

#### 4. After Query: Update Status

```javascript
// lib/core/jobber-client.js - executeQuery()

const result = await response.json();

// Update throttle status from response
await this.throttleManager.updateStatus(result);

logger.info(`Throttle: ${status.currentlyAvailable}/${status.maximumAvailable} available`);
```

### Manual Throttle Check

Commands can check throttle status manually:

```javascript
// In any command that extends BaseCommand
await this.checkThrottle(estimatedCost, { silent: true });
```

### View Throttle Status

```bash
cd jobber-cli
node bin/jobber status
```

**Output:**
```
📊 Throttle Status
─────────────────────────────────────
Current Budget:  8,500 / 10,000 units
Restore Rate:    500 units/second
Usage:           15%

Status: ✅ Healthy (85% available)
```

---

## 📄 Pagination System

### How GraphQL Pagination Works

Jobber uses **cursor-based pagination** (Relay-style):

```graphql
query {
  jobs(first: 20, after: "cursor123") {
    nodes {
      id
      title
    }
    pageInfo {
      hasNextPage      # Are there more results?
      endCursor        # Cursor for next page
      hasPreviousPage
      startCursor
    }
  }
}
```

### Pagination Flow

```
Request Page 1:
  jobs(first: 20)
  
Response:
  nodes: [job1, job2, ... job20]
  pageInfo: { hasNextPage: true, endCursor: "abc123" }
  
Request Page 2:
  jobs(first: 20, after: "abc123")
  
Response:
  nodes: [job21, job22, ... job40]
  pageInfo: { hasNextPage: true, endCursor: "def456" }
  
... continue until hasNextPage: false
```

### Implementation Examples

#### Example 1: List AR Jobs (Action Required)

**File:** `commands/list-ar-jobs.js`

```javascript
async run(options) {
  const { limit = 50, status = 'active' } = options;
  
  let allJobs = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;
  const pageSize = 20;
  
  // Pagination loop
  while (hasNextPage && allJobs.length < limit) {
    // Check throttle before each page (200 units estimated)
    await this.checkThrottle(200, { silent: true });
    
    // Execute query for this page
    const result = await this.queryExecutor.execute(
      query,
      { 
        status: status.toLowerCase(), 
        first: Math.min(pageSize, limit - allJobs.length),
        after: cursor 
      },
      { estimatedCost: 200 }
    );
    
    // Extract results
    const pageJobs = result.data?.jobs?.nodes || [];
    const pageInfo = result.data?.jobs?.pageInfo || {};
    
    // Add to collection
    allJobs.push(...pageJobs);
    
    // Update pagination state
    hasNextPage = pageInfo.hasNextPage || false;
    cursor = pageInfo.endCursor || null;
    pageCount++;
    
    logger.info(`Fetched page ${pageCount}: ${pageJobs.length} jobs`);
    
    // Early exit if we got fewer than expected
    if (pageJobs.length < pageSize) {
      hasNextPage = false;
    }
  }
  
  // Use only the requested limit
  const jobs = allJobs.slice(0, limit);
  
  // Display results
  this.displayJobs(jobs);
}
```

**Key Points:**
- ✅ Checks throttle before each page
- ✅ Tracks `hasNextPage` and `endCursor`
- ✅ Respects the limit
- ✅ Early exit if fewer results than page size
- ✅ Shows progress for each page

#### Example 2: Search by Property Partner

**File:** `commands/searchpp.js`

```javascript
// Fetch all jobs for a date range
async fetchJobsForDateRange(startDate, endDate, ppName) {
  let allJobs = [];
  let hasNextPage = true;
  let cursor = null;
  
  while (hasNextPage) {
    const variables = {
      filter: {
        clientNames: [ppName],
        startAt: { after: startDate },
        endAt: { before: endDate }
      },
      first: 50,
      after: cursor
    };
    
    const result = await this.queryExecutor.execute(
      searchQuery,
      variables,
      { estimatedCost: 300 }
    );
    
    const jobs = result.data?.jobs?.nodes || [];
    const pageInfo = result.data?.jobs?.pageInfo || {};
    
    allJobs.push(...jobs);
    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }
  
  return allJobs;
}
```

#### Example 3: Query Builder Helper

**File:** `lib/query/query-builder.js`

```javascript
static buildSearchQuery(entityType, filters, fields, pagination = {}) {
  const { first = 20, after = null } = pagination;
  
  return `
    query Search${entityType}($filter: Filter, $first: Int, $after: String) {
      ${entityType}(filter: $filter, first: $first, after: $after) {
        nodes {
          ${fields.join('\n          ')}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
}
```

---

## 🎓 Best Practices

### For Throttling

#### ✅ DO:
```javascript
// Let the system handle it automatically
const result = await this.client.executeQuery(query, variables);
// Throttle check happens automatically!
```

#### ❌ DON'T:
```javascript
// Don't bypass throttle management
const response = await fetch(API_URL, { ... }); // No throttle check!
```

#### ✅ DO: Estimate costs for expensive queries
```javascript
// Large schema introspection
await this.checkThrottle(45000);
const schema = await this.client.executeQuery(introspectionQuery);
```

#### ✅ DO: Use silent mode for pagination
```javascript
// Don't spam logs during pagination
await this.checkThrottle(200, { silent: true });
```

### For Pagination

#### ✅ DO: Set reasonable page sizes
```javascript
const pageSize = 20;  // Good - balances speed and throttle cost
```

#### ❌ DON'T: Use huge page sizes
```javascript
const pageSize = 1000;  // Bad - expensive, might timeout
```

#### ✅ DO: Check hasNextPage
```javascript
while (hasNextPage && results.length < limit) {
  // Fetch next page
  hasNextPage = pageInfo.hasNextPage;
}
```

#### ✅ DO: Respect the limit
```javascript
const jobs = allJobs.slice(0, limit);  // Always trim to requested limit
```

#### ✅ DO: Handle early termination
```javascript
if (pageJobs.length < pageSize) {
  hasNextPage = false;  // Last page had fewer results
}
```

---

## 🔍 Debugging

### Check Throttle Status

```bash
# View current throttle status
node bin/jobber status

# Check before running expensive command
node bin/jobber status
node bin/jobber schema fetch
```

### Enable Debug Logging

```bash
# Set DEBUG environment variable
DEBUG=1 node bin/jobber get job 12345

# Shows:
# - Throttle checks
# - Wait times
# - API responses
# - Pagination progress
```

### Monitor Throttle in Code

```javascript
// Listen to throttle events
this.throttleManager.on('statusUpdated', (status) => {
  console.log(`Budget: ${status.currentlyAvailable}/${status.maximumAvailable}`);
});

this.throttleManager.on('budgetLow', ({ usagePercent }) => {
  console.log(`⚠️  Budget low: ${usagePercent}% used`);
});

this.throttleManager.on('waiting', ({ waitTime }) => {
  console.log(`⏳ Waiting ${waitTime} seconds...`);
});
```

---

## 📊 Performance Considerations

### Throttle Budget Math

**Default Budget:**
- Maximum: 10,000 units
- Restore rate: 500 units/second
- Full restore: 20 seconds

**Example Operations:**
| Operation | Cost | Time to Restore |
|-----------|------|-----------------|
| Get single job | ~50 | 0.1 sec |
| Search 20 jobs | ~200 | 0.4 sec |
| List 100 jobs (5 pages) | ~1000 | 2 sec |
| Schema fetch | ~45,000 | 90 sec |

### Pagination Strategy

**Small datasets (< 100 items):**
```javascript
const pageSize = 50;  // Fewer pages, faster
```

**Large datasets (> 1000 items):**
```javascript
const pageSize = 20;  // More pages, better throttle management
```

**Very large datasets:**
```javascript
// Add small delays between pages
await this.checkThrottle(200, { silent: true });
await sleep(100);  // Extra 100ms between pages
```

---

## 🛠️ Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `lib/core/throttle-manager.js` | Throttle tracking and wait logic |
| `lib/core/jobber-client.js` | API client with auto-throttle |
| `commands/_base.js` | Base command with throttle helpers |
| `commands/list-ar-jobs.js` | Example pagination implementation |
| `commands/searchpp.js` | Example with filters + pagination |
| `lib/query/query-builder.js` | Query helpers with pagination |

### Key Methods

**ThrottleManager:**
```javascript
updateStatus(response)          // Update from API response
calculateWaitTime(units)        // Calculate wait needed
waitIfNeeded(units, options)    // Auto-wait if budget low
getStatus()                     // Get current status
hasEnoughBudget(units)         // Check if enough budget
```

**JobberClient:**
```javascript
executeQuery(query, vars, cost) // Execute with auto-throttle
estimateQueryCost(query)        // Estimate query cost
```

**BaseCommand:**
```javascript
initialize()                    // Sets up throttle manager
checkThrottle(cost, options)   // Manual throttle check
```

---

## ✅ Testing

### Test Throttle System

```bash
# Run status check (low cost)
node bin/jobber status

# Run search (medium cost, ~200 units)
node bin/jobber search jobs "test"

# Watch throttle decrease and restore
node bin/jobber status
```

### Test Pagination

```bash
# List many jobs (pagination kicks in)
node bin/jobber list-ar --limit 100

# Watch pagination in action:
# "Fetched page 1: 20 jobs (total: 20)"
# "Fetched page 2: 20 jobs (total: 40)"
# ...
```

### Test Throttle Waiting

```bash
# Fetch schema (expensive: ~45k units)
node bin/jobber schema fetch

# If budget is low, you'll see:
# "⏳ Throttle budget low: 500 available, need ~45000"
# "   Waiting 90 seconds for budget to restore..."
# "   ⏳ 5s / 90s (3000 available)..."
```

---

## 📚 Summary

### Throttling
- ✅ **Automatic**: System checks and waits automatically
- ✅ **Transparent**: You don't need to think about it
- ✅ **Visible**: Shows progress when waiting
- ✅ **Safe**: Prevents API errors from rate limiting

### Pagination
- ✅ **Cursor-based**: Uses GraphQL Relay pagination
- ✅ **Efficient**: Fetches in chunks (typically 20-50 per page)
- ✅ **Throttle-aware**: Checks budget between pages
- ✅ **Flexible**: Respects limits and early termination

**Bottom Line:** The CLI handles all the complexity automatically. Just use the commands, and the system ensures you never hit rate limits or miss data!

---

**Last Updated:** March 18, 2026
**CLI Version:** 2.3.0

