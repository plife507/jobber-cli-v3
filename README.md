# jobber-cli v3.0 (TypeScript)

TypeScript CLI for the Jobber GraphQL API with:
- strict runtime validation
- throttle-aware reads
- schema exploration helpers
- gated mutation commands for notes and expenses
- headless-friendly usage for scripts and agents

This repo is the current v3 CLI for working with Jobber data safely from the terminal, automations, and agent workflows.

## Status

v3.0 — core transport and operational command surface shipped.

Included command areas:
- status
- token check
- get
- query
- search
- notes
- schema
- doctor
- job-note
- job-expense

Not ported from older internal tooling:
- profitability/report rendering flows
- HTML report generators
- older KC-specific reporting commands

Those remain out of scope for this repo unless intentionally ported later.

## What this CLI is good for

Use this CLI when you need to:
- inspect Jobber records from the API
- search jobs or clients
- run GraphQL queries with schema validation
- fetch and analyze the Jobber schema
- read recent notes
- create/edit/delete job notes
- create/edit/delete job expenses
- run Jobber operations safely in headless/automation contexts

## Prerequisites

- Node.js 18+
- Yarn 4
- Python 3 for the OAuth helper
- A Jobber developer app with API credentials

## Expected workspace layout

This repo expects a shared Jobber workspace layout like this:

```text
jobber/
├── .env
├── tokens/jobber_tokens.json
├── oauth/
├── .venv/
└── jobber-cli-v3/
```

Where:
- `jobber-cli-v3/` is this repo
- `.env` holds shared Jobber credentials
- `tokens/jobber_tokens.json` is the token cache
- `oauth/jobber_oauth_manager.py` is the OAuth helper
- `.venv/` is the Python virtualenv for the OAuth helper

## Setup

### 1. Install dependencies

```bash
cd jobber-cli-v3
yarn install
yarn build
```

### 2. Create the shared Python venv for OAuth

```bash
cd ..
python3 -m venv .venv
.venv/bin/pip install -r oauth/requirements.txt
```

### 3. Add credentials to the shared `.env`

At minimum:

```env
JOBBER_CLIENT_ID=your_client_id
JOBBER_CLIENT_SECRET=your_client_secret
JOBBER_ACCESS_TOKEN=
```

### 4. Bootstrap OAuth once

```bash
yarn dev token oauth-authorize
```

That first authorize flow may open a browser.

### 5. Refresh tokens later when needed

```bash
yarn dev token oauth-refresh --json
```

## Core usage

### Development entrypoint

```bash
yarn dev <command> [args...]
```

### Built CLI entrypoint

```bash
yarn node bin/jobber.js <command> [args...]
```

## Canonical headless invocation

For scripts, cron jobs, and agents, use this pattern:

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev <command> [args...] --json
```

Recommended rules:
- always set `JOBBER_ENV_PATH` explicitly
- always set `JOBBER_OAUTH_SKIP_AUTHORIZE=1` in headless mode
- always use `--json` for machine-readable output
- never export `JOBBER_WRITES_ENABLED=1` globally

## Commands

| Command | Purpose |
|---|---|
| `status` | Show throttle budget |
| `token check` | Inspect cached token metadata |
| `token oauth-refresh` | Refresh through the shared OAuth manager |
| `token oauth-authorize` | Start a fresh browser OAuth authorization |
| `get <type> <gid>` | Fetch a single job/client/quote/invoice by encoded id |
| `query` | Run arbitrary GraphQL |
| `search <jobs\|clients> <query>` | Search jobs or clients |
| `notes` | Aggregate recent notes |
| `schema fetch\|analyze\|help` | Introspect and inspect the schema |
| `doctor` | Validate env/runtime health without calling the API |
| `job-note list\|create\|edit\|delete` | Read and mutate job notes |
| `job-expense list\|create\|edit\|delete` | Read and mutate job expenses |

## Common examples

### Check health

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev doctor --json
```

### Check token state

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev token check --json
```

### Check throttle budget

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev status --json
```

### Search for a job by visible job number

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev search jobs 20459 --json
```

### Fetch a record by encoded id

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev get job Z2lkOi8vSm9iYmVyL0pvYi8xNDI1MzU5NjU= --json
```

### Run a GraphQL query

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev query 'query { account { id } }' --json
```

### Run a query from file

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev query --file ./my-query.graphql --json
```

### List notes for a job

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev job-note list 20459 --json
```

## Writes gate

Mutations are intentionally disabled by default.

For a single write call, enable writes inline only for that invocation:

```bash
JOBBER_WRITES_ENABLED=1 \
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev job-note create 20459 --message "hello" --json
```

Do **not** set `JOBBER_WRITES_ENABLED=1` globally in your shell profile or shared environment.

## Schema introspection

Schema introspection is expensive and should be treated as a setup/discovery step, not something you run on every sync.

### Fetch the schema cache once

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev schema fetch --json
```

### Analyze the cached schema

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev schema analyze --json
```

### Inspect a specific type

```bash
JOBBER_ENV_PATH=/abs/path/to/jobber/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev schema help Job --json
```

Use schema introspection to discover:
- root queries
- exact field names
- pagination shape
- nested entity structure
- which fields should be split into cheaper follow-up reads

## Rate limits and backoff

Jobber uses throttle/query-cost behavior, not just naive request counting.

Practical guidance:
- keep queries narrow
- paginate aggressively
- avoid very deep nested queries when possible
- prefer multiple smaller reads over one oversized expensive query
- inspect throttle budget before large batches
- let the CLI's built-in throttle handling work before adding wrapper retries

Recommended wrapper behavior:
- check exit code before parsing stdout
- treat exit code `4` as throttle/rate-limit exhaustion
- back off generously before retrying
- do not stack tight custom retry loops on top of the CLI's own retry logic

## Exit codes

| Code | Meaning |
|---:|---|
| `0` | success |
| `2` | validation error |
| `3` | auth failure |
| `4` | rate limit / throttle |
| `5` | not found |
| `6` | config error |
| `7` | non-interactive block |
| `10` | internal error, including writes-disabled refusal |

## Recommended automation posture

For production-style automation:
1. run `doctor --json`
2. run `token check --json`
3. optionally check `status --json` before a batch
4. resolve ids with `search`
5. perform reads in narrow paginated chunks
6. gate writes inline per command only when truly intended
7. capture stdout/stderr separately in wrappers
8. branch on exit code, not prose text

## Local scripts

```bash
yarn build
yarn typecheck
yarn test
```

## Docs worth reading

- `docs/agent-usage.md`
- `docs/headless-usage.md`
- `TODO.md`
- `phases/`

## Notes

- This repo is designed to be safe for scripted and agent-driven use.
- If OAuth authorization itself is required, a human browser step may still be necessary.
- For high-volume sync systems, treat schema fetches and nested note-heavy queries as expensive operations.
