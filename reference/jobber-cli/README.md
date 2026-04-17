# Jobber CLI

Unified CLI tool for working with the Jobber GraphQL API. Features automatic rate limiting, schema exploration, and error recovery.

## Features

- ✅ **Automatic Rate Limiting**: All operations check throttle status and wait automatically
- ✅ **Token Management**: Automatic expiration detection and easy token updates
- ✅ **Schema Integration**: Automatic error recovery with schema suggestions
- ✅ **Report Generation**: Comprehensive profitability reports with HTML output
- ✅ **Interactive Search**: Advanced search by property manager and date ranges
- ✅ **Extensible**: Easy to add new commands and plugins
- ✅ **MCP-Ready**: Designed for future MCP server integration

## Installation

1. **Clone or navigate to the directory:**
   ```bash
   cd jobber-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your JOBBER_ACCESS_TOKEN
   ```

## Usage

### Basic Commands

```bash
# Check throttle status
jobber status

# Check token expiration status
jobber token check

# Update access token
jobber token update <your-token>

# Fetch schema (one-time, ~45k units)
jobber schema fetch

# Analyze cached schema
jobber schema analyze

# Get help for a type
jobber schema help Job

# Search for jobs
jobber search jobs "12345"

# Get job details
jobber get job <job-id>

# Execute custom query
jobber query "query { jobs(first: 1) { nodes { id } } }"

# Interactive search by PP and date range
jobber searchpp

# Generate profitability reports
jobber creport 18415              # Console report for single job
```

### Automation Mode (OpenClaw / Agents)

For local automation, run commands with:

```bash
jobber <command> ... --machine --non-interactive
```

Behavior:
- Outputs a single JSON envelope on `stdout`
- Disables interactive prompts and fails fast with actionable errors
- Uses stable non-zero exit codes for machine handling

Example:

```bash
jobber get job 18415 --machine --non-interactive
```

Use this preflight check before wiring OpenClaw:

```bash
jobber doctor --machine --non-interactive
```

### WSL Notes

`jobber-cli` works in WSL. For best results:
- Run Node + `jobber-cli` inside WSL.
- Keep the repo and `.env` in WSL filesystem (for example `~/code/jobber-cli`) instead of `/mnt/c/...`.
- Run `jobber doctor --machine --non-interactive` to verify environment path and token readiness.

### Token Management

The CLI automatically checks token expiration and warns you when your token is about to expire (within 2 hours). Use the token command to check status or update your token:

```bash
# Check current token status
jobber token check

# Update token (copies token from Jobber Dev Center)
jobber token update eyJhbGciOiJIUzI1NiJ9...
```

### Rate Limiting

All operations automatically:
- Check throttle budget before execution
- Wait if insufficient budget
- Show progress during wait times
- Report throttle usage after operations

### Error Recovery

When a query fails:
- Automatically consults cached schema
- Suggests valid fields/types
- Provides helpful error messages

## Architecture

- `lib/core/` - Core modules (client, throttle manager, rate limiter)
- `lib/schema/` - Schema fetching, analysis, and caching
- `lib/query/` - Query building, execution, and validation
- `lib/error/` - Error handling and recovery
- `commands/` - CLI command implementations

## Extension Points

### Adding New Commands

1. Create a file in `commands/` extending `BaseCommand`
2. Register in `commands/register.js`
3. Command automatically gets rate limiting and error handling

### Plugins

Create plugins in `plugins/` directory. Each plugin exports:
- `name`: Plugin name
- `description`: Plugin description
- `commands`: Object of command classes

## Future: MCP Integration

The CLI is designed to easily convert commands to MCP tools:
- Functions return structured data
- Input validation ready
- Error handling consistent
- Rate limiting transparent

See `docs/MCP_PREPARATION.md` for details.

## License

MIT
