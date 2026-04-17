# jobber-cli v3.0 (TypeScript)

Transport CLI for the Jobber GraphQL API. Strict TypeScript, Zod at boundaries, throttle-aware client, schema-aware error recovery, gated mutation surface.

## Status

v3.0 — all 7 phases shipped. Covers the schema/transport command surface (status, token, get, query, search, notes, schema, doctor, job-note, job-expense). Profitability/HTML-report commands from v2.5 are intentionally **not** ported — the reference tree is retained for a future port if needed.

## Setup

```bash
yarn install
yarn build                           # tsc → dist/
# shared .env lives at workspace root (../.env) and is also read by v2.5.
# tokens cached at ../tokens/jobber_tokens.json (shared with v2.5).
```

The OAuth Python manager (`../oauth/jobber_oauth_manager.py`) is the one authoritative place tokens live. v3 spawns it via `src/utils/oauth-subprocess.ts` and Zod-validates the stdout. To bootstrap or refresh a token:

```bash
cd ..
python3 -m venv .venv && .venv/bin/pip install -r oauth/requirements.txt
.venv/bin/python oauth/jobber_oauth_manager.py authorize   # first time, opens browser
.venv/bin/python oauth/jobber_oauth_manager.py refresh     # subsequent refreshes
```

The CLI auto-detects `.venv/bin/python` at `../.venv/`; override via `JOBBER_OAUTH_PYTHON=/path/to/python` if yours lives elsewhere.

## Usage

```bash
# via tsx (development)
yarn dev <command> [args]

# via built bin (production) — requires yarn's PnP loader, so:
yarn node bin/jobber.js <command> [args]
```

### Commands

| Command | Role | Writes gate |
|---|---|---|
| `status` | Show throttle budget (pings `__typename` to refresh) | — |
| `token check` | Summarise the cached token (never prints the body) | — |
| `get <type> <encodedId>` | Fetch job / client / quote / invoice by gid | — |
| `query "<gql>"` / `query --file <path>` | Run arbitrary GraphQL, schema-validated when a cached schema is present | — |
| `search <jobs\|clients> <query>` | Search jobs or clients (clients filtered client-side per v2.5) | — |
| `notes [--limit N] [--notes-per-job N] [--max-notes N]` | Newest-first notes aggregation across recent jobs | — |
| `schema fetch` / `schema analyze` / `schema help <Type>` | Schema lifecycle (fetch ~45k throttle units) | — |
| `doctor` | Runtime / env / token health; does NOT call the API | — |
| `job-note list\|create\|edit\|delete` | Read + mutate notes on a job | create / edit / delete require `JOBBER_WRITES_ENABLED=1` |
| `job-expense list\|create\|edit\|delete` | Read + mutate expenses on a job | create / edit / delete require `JOBBER_WRITES_ENABLED=1` |

### Global flags

| Flag | Effect |
|---|---|
| `--json` | Emit machine-readable JSON on stdout |
| `--help`, `-h` | Print help and exit 0 |
| `--version`, `-v` | Print version and exit 0 |

### Exit codes

Matches the v2.5 map (`src/cli.ts` `EXIT_CODES`):
`0` success · `2` VALIDATION · `3` AUTH · `4` RATE_LIMIT · `5` NOT_FOUND · `6` CONFIG · `7` NON_INTERACTIVE · `10` INTERNAL (includes `WritesDisabledError`).

## Writes gate

Mutations refuse by default:

```
$ yarn dev job-expense create 12241 --title "x" --date 2026-04-17 --total 1
Error: Mutations are disabled. Set JOBBER_WRITES_ENABLED=1 in your .env to enable writes against the Jobber API.
(exit 10)
```

Every mutation path in `src/commands/{job-note,job-expense}.ts` calls `requireWritesEnabled(ctx.config)` before touching `queryExecutor.execute`. Proven by `test/commands/*.test.ts` and by the Phase 6 live run on job 12241 (`phases/phase-6-cutover.md`).

## Architecture

```
src/
├── core/        Config, Logger, ThrottleManager, RateLimiter, JobberClient, CostReference
├── query/       QueryExecutor (QueryResult<T>), QueryBuilder, QueryValidator
├── schema/      SchemaCache, SchemaAnalyzer, SchemaManager, IncrementalIntrospector
├── error/       ErrorHandler (implements the Phase 2 interface)
├── commands/    BaseCommand, writes-gate, registry, status/token/get/query/search/notes/schema/doctor/job-note/job-expense
├── utils/       Logger, token-utils, env-writer, oauth-subprocess
└── types/       Generated GraphQL types (codegen from reference/.cache/jobber_schema.graphql)
```

**Phase boundaries** live in `phases/*.md` with gate evidence. `TODO.md` is the active operational doc.

## Workspace layout

```
jobber/
├── .env                                  shared with v2.5
├── tokens/jobber_tokens.json             shared with v2.5
├── oauth/                                python OAuth manager (not ported)
├── .venv/                                local python venv for OAuth
└── jobber-cli-v3/
    ├── src/                              v3.0 TS source
    ├── dist/                             tsc output (gitignored)
    ├── bin/jobber.js                     CLI entry
    ├── reference/jobber-cli/             v2.5 JS reference — preserved,
                                          source for a future calculation-
                                          module port
    └── phases/                           gated phase docs
```

## Out of scope for v3.0

These v2.5 commands are deliberately **not** ported — they depend on calculation/rendering layers the v3 project is not re-implementing:

`creport`, `batch-html-report`, `client-report`, `visits-report`, `analyze-line-items`, `sort-jobs`, `searchpp`, `list-ar-jobs`, `map-schema`, `test-api`, `test-comprehensive`, `ProfitabilityCalculator`, HTML report templates, theme/widget renderer.

The `reference/jobber-cli/` tree is retained so any of these can be ported later without re-cloning v2.5.
