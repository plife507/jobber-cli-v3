# Rate Limits Documentation

## Overview

The Jobber API uses a throttle-based rate limiting system. The CLI automatically manages throttle budget for all operations.

## How It Works

### Throttle System

- **Maximum Available**: Typically 10,000 units
- **Currently Available**: Current budget
- **Restore Rate**: Typically 500 units/second

### Automatic Management

All CLI operations:
1. Estimate query cost before execution
2. Check if enough budget available
3. Wait automatically if needed
4. Execute query
5. Update throttle status from response

### Cost Estimation

Query costs are estimated based on complexity:
- Simple queries: 5-20 units
- Medium queries: 50-200 units
- Complex queries: 500-1500 units
- Schema introspection: 45,000 units

## Commands

### Check Status

```bash
jobber status
```

Shows:
- Current budget available
- Maximum available
- Restore rate
- Usage percentage

### Schema Fetch

```bash
jobber schema fetch
```

**Warning**: Costs ~45,000 throttle units!

- Automatically checks budget first
- Warns if insufficient budget
- Shows wait time if needed
- Only needs to be run once (schema is cached)

## Best Practices

1. **Check Status First**: Use `jobber status` before expensive operations
2. **Cache Schema**: Fetch schema once, analyze locally after
3. **Batch Operations**: Group related queries when possible
4. **Monitor Usage**: Watch throttle status during operations

## Automatic Behavior

The CLI automatically:
- Waits for budget restoration when needed
- Shows progress during wait times
- Retries on throttle errors (with backoff)
- Reports throttle usage after operations

## Manual Override

For programmatic use, you can:
- Access `throttleManager` directly
- Check budget before operations
- Estimate costs manually
- Control wait behavior

See `lib/core/throttle-manager.js` for API details.
