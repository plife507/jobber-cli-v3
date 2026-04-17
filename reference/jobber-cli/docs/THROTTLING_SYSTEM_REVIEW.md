# Throttling System Review

**Date:** 2024 Review  
**Status:** ✅ Complete - All issues fixed

## Overview

This document reviews the throttling/rate limiting system across the entire jobber-cli codebase. The system uses Jobber's throttle-based rate limiting with automatic budget management.

## System Architecture

### Core Components

1. **ThrottleManager** (`lib/core/throttle-manager.js`)
   - Tracks throttle status (maximumAvailable, currentlyAvailable, restoreRate)
   - Calculates wait times based on budget and restore rate
   - Automatically waits with progress updates when budget is low
   - Emits events for status changes and low budget warnings

2. **JobberClient** (`lib/core/jobber-client.js`)
   - Wraps ThrottleManager for API requests
   - Automatically waits before queries if budget is low
   - Updates throttle status from API responses
   - Handles throttle errors with auto-retry logic
   - Adds 100ms delay between requests to allow budget restoration

3. **BaseCommand** (`commands/_base.js`)
   - Provides `checkThrottle()` method for commands
   - Shows throttle status display
   - All commands inherit throttle awareness

### How It Works

1. **Before Query Execution:**
   - Estimates query cost (or uses provided estimate)
   - Checks if enough budget available
   - Waits automatically if needed (with progress updates)
   - Executes query

2. **After Query Execution:**
   - Updates throttle status from API response (`extensions.throttleStatus`)
   - Shows throttle status (if not silent)
   - Handles throttle errors with retry logic

3. **Throttle Error Handling:**
   - Detects throttle errors in GraphQL response
   - Calculates wait time based on actual budget
   - Auto-retries after waiting (up to 5 minutes)
   - Forces minimum 2-second wait for rate-based throttling

## Issues Found and Fixed

### ✅ Issue 1: `checkThrottle()` Only Checked, Didn't Wait

**Problem:** The `checkThrottle()` method in `BaseCommand` only checked if budget was available but didn't wait if it was low.

**Fix:** Updated `checkThrottle()` to call `waitIfNeeded()`, which automatically waits for budget to restore if needed.

```javascript
// Before:
async checkThrottle(estimatedCost) {
  return this.throttleManager.hasEnoughBudget(estimatedCost);
}

// After:
async checkThrottle(estimatedCost, options = {}) {
  await this.initialize();
  await this.throttleManager.waitIfNeeded(estimatedCost, options);
  return this.throttleManager.hasEnoughBudget(estimatedCost);
}
```

### ✅ Issue 2: Search Command Missing `estimatedCost`

**Problem:** The `search` command didn't provide cost estimates to `queryExecutor.execute()`, relying only on automatic estimation.

**Fix:** Added explicit cost estimates based on query type:
- Jobs search: 50 units (simpler query)
- Clients search: 100 units (requires pagination)

### ✅ Issue 3: Report Command Error Handling

**Problem:** Report command threw error even after `checkThrottle()` would wait for budget.

**Fix:** Simplified to just call `checkThrottle()` which now handles waiting automatically. Removed redundant error check.

## Current Implementation Status

### ✅ Commands with Proper Throttling

1. **get.js**
   - Uses `estimatedCost: 200` for main queries
   - Uses `estimatedCost: 20-100` for search/pagination queries
   - Has 100ms delays between pagination pages

2. **search.js**
   - Now uses `estimatedCost: 50-100` based on query type
   - ✅ Fixed in this review

3. **query.js**
   - Relies on automatic cost estimation (handled by JobberClient)
   - This is acceptable for custom queries

4. **report.js**
   - Checks throttle budget before operations
   - Uses `estimatedCost: 200` for main queries
   - Uses `estimatedCost: 100` for search queries
   - ✅ Fixed in this review

5. **schema.js**
   - Handles expensive introspection queries (45,000 units)
   - Shows warnings and checks budget before fetching
   - Properly waits if needed

6. **status.js**
   - Shows current throttle status
   - No queries needed

### ✅ Utility Files with Proper Throttling

1. **job-selector.js**
   - Uses `estimatedCost: 100` for search queries
   - Has 100ms delays between pagination pages
   - Limits to 5 pages max

2. **user-selector.js**
   - Uses `estimatedCost: 100` for pagination queries
   - Has 100ms delays between pagination pages
   - Limits to 10 pages max

## Throttling Best Practices

### ✅ Implemented

1. **Automatic Waiting:** All queries automatically wait if budget is low
2. **Progress Updates:** Shows progress during wait times
3. **Cost Estimation:** Most queries provide explicit cost estimates
4. **Delays Between Requests:** 100ms delay between requests/pages
5. **Error Handling:** Automatic retry on throttle errors
6. **Status Updates:** Throttle status updated from every API response

### Cost Estimation Guidelines

- Simple queries (single object, few fields): 5-20 units
- Medium queries (with connections, pagination): 50-200 units
- Complex queries (deep nesting, many fields): 200-500 units
- Very complex queries (large datasets): 500-1500 units
- Schema introspection: 45,000 units

## Pagination Patterns

All pagination loops follow this pattern:

```javascript
while (hasNextPage && pageCount < maxPages) {
  const result = await this.queryExecutor.execute(query, variables, { 
    estimatedCost: 100 
  });
  
  // Process results...
  
  // Small delay between pages
  if (hasNextPage) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

This ensures:
- Each page checks throttle budget before executing
- Automatic waiting if budget is low
- Small delay allows budget restoration between pages
- Page limits prevent excessive queries

## Testing Recommendations

1. **Low Budget Testing:**
   - Run commands with low throttle budget
   - Verify automatic waiting occurs
   - Check progress updates display correctly

2. **Pagination Testing:**
   - Test pagination with large datasets
   - Verify throttle checks between pages
   - Confirm delays are working

3. **Error Handling:**
   - Test throttle error recovery
   - Verify auto-retry logic
   - Check error messages are clear

## Summary

✅ **All throttling issues have been fixed:**
- `checkThrottle()` now properly waits for budget
- All commands use appropriate cost estimates
- Pagination loops have proper delays
- Error handling is robust

The throttling system is now **consistent and reliable** across the entire codebase.

