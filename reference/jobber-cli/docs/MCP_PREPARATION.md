# MCP Preparation Documentation

## Overview

The Jobber CLI is designed to easily convert to an MCP (Model Context Protocol) server. This document outlines the design decisions and mapping strategy.

## Design Principles

### Function Signatures

All command handlers follow a consistent pattern:
```javascript
async function executeCommand(args) {
  // 1. Validate inputs
  // 2. Check rate limits
  // 3. Execute operation
  // 4. Handle errors
  // 5. Return structured result
  return {
    success: boolean,
    data: any,
    throttleUsed: number,
    throttleRemaining: number
  };
}
```

### Input/Output Schemas

Commands use structured inputs that map directly to MCP tool `inputSchema`:
- Type definitions ready
- Validation built-in
- Error messages clear

### Error Handling

Consistent error format:
- Structured error objects
- Recovery suggestions
- Schema integration

## Tool Mapping Strategy

### Current CLI Commands → Future MCP Tools

| CLI Command | MCP Tool Name | Input Schema |
|------------|---------------|--------------|
| `status` | `get_throttle_status` | `{}` |
| `schema fetch` | `fetch_schema` | `{ force?: boolean }` |
| `schema analyze` | `analyze_schema` | `{ force?: boolean }` |
| `schema help <Type>` | `get_schema_help` | `{ typeName: string }` |
| `search jobs <query>` | `search_jobs` | `{ query: string, limit?: number }` |
| `search clients <query>` | `search_clients` | `{ query: string, limit?: number }` |
| `get job <id>` | `get_job` | `{ id: string }` |
| `get client <id>` | `get_client` | `{ id: string }` |
| `query "<query>"` | `execute_query` | `{ query: string, variables?: object }` |

### Tool Grouping

Tools could be grouped by category:
- **Search**: search_jobs, search_clients, search_quotes
- **Get**: get_job, get_client, get_quote, get_invoice
- **Schema**: fetch_schema, analyze_schema, get_schema_help
- **Query**: execute_query, validate_query

## Rate Limit Considerations

### Per-Tool Costs

Each tool should document its estimated throttle cost:
- `get_throttle_status`: 5 units
- `search_*`: 20-50 units
- `get_*`: 100-200 units
- `fetch_schema`: 45,000 units
- `execute_query`: Variable (based on complexity)

### MCP Integration

MCP server should:
1. Check throttle before tool execution
2. Return throttle status in tool result
3. Handle throttle errors gracefully
4. Provide throttle status via separate tool

## Implementation Notes

### Code Reuse

The CLI implementation can be directly reused:
- Same function signatures
- Same error handling
- Same rate limiting
- Same schema integration

### MCP Server Structure

```
mcp-server/
├── index.js              # MCP server setup
├── tools/
│   ├── search.js        # Search tools (reuses CLI commands)
│   ├── get.js           # Get tools
│   ├── schema.js        # Schema tools
│   └── query.js         # Query tool
└── lib/                 # Shared with CLI (symlink or copy)
```

### Example MCP Tool

```javascript
import { SearchCommand } from '../cli/commands/search.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_jobs': {
      const command = new SearchCommand();
      const result = await command.run({
        type: 'jobs',
        query: args.query,
        limit: args.limit,
        json: true
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      };
    }
  }
});
```

## Next Steps

When ready to build MCP server:

1. Install `@modelcontextprotocol/sdk`
2. Create MCP server entry point
3. Map CLI commands to MCP tools
4. Define input schemas
5. Test with MCP client
6. Document tool usage

## Benefits

- Same codebase for CLI and MCP
- Consistent behavior
- Rate limiting handled automatically
- Error recovery built-in
- Schema integration ready
