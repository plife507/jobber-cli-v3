# jobber-cli (TypeScript)

v3.0 — TypeScript rewrite of the Jobber GraphQL CLI. Feature-parity port of v2.5 with typed GraphQL results, strict config validation, and modern tooling.

## Status

Alpha. Phase 0 (scaffold) complete. See `PHASES.md` for roadmap.

## Setup

```bash
yarn install          # or npm install
cp .env.example .env  # fill in OAuth + access token
yarn build
yarn start            # or: node bin/jobber.js
```

## Development

```bash
yarn dev              # tsx runner, no build step
yarn typecheck        # tsc --noEmit
yarn test             # vitest
yarn codegen          # regenerate GraphQL types from cached schema
```

## Architecture

Mirrors v2.5 with types:

- `src/core/` — JobberClient, ThrottleManager, RateLimiter
- `src/query/` — query executor, builder, validator
- `src/schema/` — schema fetch/cache/analysis
- `src/error/` — error handler with schema-based suggestions
- `src/commands/` — BaseCommand + command implementations
- `src/utils/` — Config (Zod-validated), Logger, token-utils
- `src/types/` — generated GraphQL types + shared types

## Relationship to Legacy CLI

The v2.5 JS CLI is cloned into `reference/jobber-cli/` inside this repo for side-by-side development.

- Shares `.env` with workspace root (`../.env`) and `tokens/` (`../tokens/`)
- OAuth Python bridge at `../oauth/jobber_oauth_manager.py` (unchanged)
- Cached GraphQL schema reused via same cache file in `../tokens/`

### This repo's layout

```
jobber-cli-v3/
├── src/              # new TS source
├── bin/jobber.js     # CLI entry (shebang → dist/index.js)
├── dist/             # tsc output (gitignored)
├── reference/
│   └── jobber-cli/   # v2.5 JS clone — reference only, not built
└── ...
```
