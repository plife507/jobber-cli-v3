# Jobber CLI Architecture

## Overview

The Jobber CLI is designed with extensibility, rate limit awareness, and future MCP integration in mind.

## Directory Structure

```
jobber-cli/
├── bin/                    # CLI entry point
├── lib/
│   ├── core/              # Core modules (client, throttle, rate limiter)
│   ├── schema/            # Schema management (fetch, analyze, cache)
│   ├── query/             # Query utilities (builder, executor, validator)
│   ├── error/             # Error handling and recovery
│   ├── export/            # Data export (JSON, CSV)
│   └── utils/             # Utilities (config, logger)
├── commands/              # Command implementations
├── plugins/               # Extension point for plugins
├── examples/              # Example scripts
└── docs/                  # Documentation
```

## Core Components

### ThrottleManager (`lib/core/throttle-manager.js`)

- Tracks throttle status (available, maximum, restore rate)
- Calculates wait times
- Provides `waitIfNeeded()` method
- Emits events for monitoring

### JobberClient (`lib/core/jobber-client.js`)

- GraphQL query execution
- Uses ThrottleManager for rate limiting
- Automatic retry on throttle errors
- Returns structured responses with throttle metadata

### SchemaManager (`lib/schema/schema-manager.js`)

- Fetches schema from API (~45k units)
- Analyzes schema structure
- Caches schema and analysis
- Provides type/field lookups

### ErrorHandler (`lib/error/error-handler.js`)

- Parses GraphQL errors
- Consults schema for suggestions
- Generates recovery hints
- Formats error output

## Command System

### BaseCommand

All commands extend `BaseCommand` which provides:
- Automatic initialization (client, schema, error handler)
- Throttle awareness
- Error handling
- Output formatting (JSON, table)

### Command Registration

Commands are registered in `commands/register.js`:
- Built-in commands: status, schema, search, get, query
- Plugin commands: loaded dynamically from `plugins/`

## Rate Limiting Flow

1. Command execution starts
2. ThrottleManager checks budget
3. If insufficient, automatically waits
4. Query executes
5. Throttle status updated from response
6. Result returned with throttle metadata

## Error Recovery Flow

1. Query error occurs
2. ErrorHandler parses error
3. If validation error, consults schema
4. Generates suggestions (field/type corrections)
5. Formats helpful error message
6. Suggests `schema help` command if applicable

## Extension Points

### Adding Commands

1. Create command class extending `BaseCommand`
2. Register in `commands/register.js`
3. Command automatically gets all base features

### Adding Plugins

1. Create plugin in `plugins/`
2. Export plugin definition
3. System loads and registers automatically

## Future: MCP Integration

Functions are designed to map cleanly to MCP tools:
- Structured input/output
- JSON schema ready
- Error handling consistent
- Rate limiting transparent

See `docs/MCP_PREPARATION.md` for details.
