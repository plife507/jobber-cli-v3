# jobber-cli v3.0 — Agent Usage Guide

Audience: an LLM agent (e.g. a Claude Code / OpenClaude harness) driving the
Jobber API. Humans can read this too, but it's optimised for an agent that
needs deterministic, machine-parseable output and clear failure signals.

## 1. Prerequisites (one-time, human-assisted)

These steps may need a human to bootstrap credentials. Once done, the agent
can run non-interactively.

1. **Workspace layout** — the CLI expects this tree:
   ```
   jobber/
   ├── .env                       # shared credentials (see below)
   ├── tokens/jobber_tokens.json  # OAuth token cache (written by the manager)
   ├── oauth/                     # Python OAuth manager
   ├── .venv/                     # Python venv for the OAuth manager
   └── jobber-cli-v3/             # this repo
   ```
2. **`.env` at workspace root** must contain at minimum:
   ```
   JOBBER_CLIENT_ID=<from Jobber developer portal>
   JOBBER_CLIENT_SECRET=<from Jobber developer portal>
   JOBBER_ACCESS_TOKEN=<optional; OAuth shim writes this on authorize>
   ```
3. **OAuth bootstrap** (only first time, or when scopes change):
   ```bash
   cd <workspace>
   python3 -m venv .venv
   .venv/bin/pip install -r oauth/requirements.txt
   .venv/bin/python oauth/jobber_oauth_manager.py authorize   # opens browser
   ```
4. **`yarn install`** in `jobber-cli-v3/` (Yarn 4, PnP).

If the OAuth flow needs a fresh browser-side authorize, the agent cannot
complete it autonomously — hand back to the human with a note.

## 2. How the agent invokes the CLI

Two equivalent entrypoints:

```bash
# Development (tsx, no build step)
yarn dev <cmd> [args...]

# Production bin (requires yarn's PnP loader)
yarn node bin/jobber.js <cmd> [args...]
```

**Always pass `JOBBER_ENV_PATH`** pointing at the workspace `.env` so
`loadConfig` resolves correctly regardless of `cwd`:

```bash
JOBBER_ENV_PATH=/path/to/workspace/.env yarn dev <cmd> [args...]
```

**Always pass `--json`** for structured output. Without it commands print
human-readable text and the agent has to parse prose.

**`JOBBER_OAUTH_SKIP_AUTHORIZE=1`** stops the OAuth manager from trying to
open a browser (which it cannot do headless). The agent should always set
this — it forces the manager to return existing cached tokens or fail
loudly instead of hanging.

### Canonical invocation template

```bash
JOBBER_ENV_PATH=/path/to/workspace/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev <cmd> [args...] --json
```

For mutations add `JOBBER_WRITES_ENABLED=1` — but **only** for the specific
invocation. Never export it permanently.

## 3. Exit codes (for branching)

The agent should always check the exit code before parsing stdout.

| Code | Meaning                                              |
|-----:|------------------------------------------------------|
| 0    | Success. Stdout is valid JSON when `--json` was set. |
| 2    | Validation error (bad args, unknown command)         |
| 3    | Auth failure (401, expired token, unauth message)    |
| 4    | Rate-limited / throttle budget exceeded              |
| 5    | Entity not found                                     |
| 6    | Configuration error (missing token, bad .env)        |
| 7    | Non-interactive block (e.g. interactive prompt)      |
| 10   | Internal error — **this is also where `WritesDisabledError` lands**. |

### Agent error-handling decision tree

- **Exit 3 (auth)** → need a fresh token. Either re-run the OAuth manager
  (`refresh`), or ask the human to re-`authorize`. Do NOT retry blindly.
- **Exit 4 (rate limit)** → CLI already waited and retried up to its
  internal cap. Back off substantially (≥60s) before retrying. Inspect the
  `throttleStatus` on the last success to budget future calls.
- **Exit 5 (not found)** → check the id you passed. For jobs, pass an
  encoded gid like `Z2lkOi8vSm9iYmVyL0pvYi84NTk3NjAxNQ==`, not a job number.
- **Exit 6 (config)** → `.env` missing JOBBER_ACCESS_TOKEN. Run OAuth bootstrap.
- **Exit 10 + stderr begins with "Mutations are disabled"** → you tried a
  mutation without `JOBBER_WRITES_ENABLED=1`. Decide whether this call
  should really be gated-off; if yes, escalate to human.
- **Exit 10 otherwise** → unexpected. Print stderr to the user verbatim.

## 4. Command reference (with JSON output shapes)

All JSON shown below is what the CLI emits on stdout with `--json`.

### `status` — check throttle budget

```bash
jobber status --json
```

```json
{
  "throttleStatus": {
    "maximumAvailable": 10000,
    "currentlyAvailable": 9999,
    "restoreRate": 500
  },
  "usagePercent": 0.01
}
```

Use before launching a big batch. If `currentlyAvailable` < your estimated
cost, wait; the CLI will auto-wait inside `executeQuery` too, but checking
first lets the agent schedule work.

### `token check` — inspect the cached token

```bash
jobber token check --json
```

```json
{
  "present": true,
  "validFormat": true,
  "valid": true,
  "expired": false,
  "expiresSoon": true,
  "expiresIn": "0h 57m",
  "userId": null,
  "accountId": 10592,
  "clientId": "7ba8c817-..."
}
```

The token body itself is **never** emitted. If `expired: true`, run:

```bash
jobber token oauth-refresh --json
```

If the refresh token itself is expired, run `jobber token oauth-authorize` with human browser approval.

### `get <type> <gid>` — fetch a single entity

```bash
jobber get job Z2lkOi8vSm9iYmVyL0pvYi84NTk3NjAxNQ== --json
```

`<type>` ∈ `job | client | quote | invoice`. The id **must be an encoded
gid**. Numeric ids like `12241` are job numbers, not gids — use `search`
first to resolve them.

```json
{
  "type": "job",
  "entity": {
    "id": "Z2lkOi8v...",
    "jobNumber": 12241,
    "title": "Marketing Test Quote",
    "jobStatus": "archived",
    "jobType": "ONE_OFF",
    "total": 0.10,
    "client": { "id": "Z2lk...", "name": "KC Test" }
  }
}
```

### `search <type> <query>` — jobs or clients

```bash
jobber search jobs 12241 --json
jobber search clients "Acme" --json
```

`<type>` ∈ `jobs | clients`. Jobs use the server's `searchTerm` filter;
clients are filtered client-side by name substring (Jobber API limitation).

```json
{
  "items": [
    { "id": "Z2lk...", "jobNumber": 12241, "title": "...", "jobStatus": "...",
      "client": { "id": "Z2lk...", "name": "..." } }
  ]
}
```

**To resolve job-number → gid**, search jobs and match on `jobNumber`:

```bash
jobber search jobs 12241 --json | jq -r '.items[] | select(.jobNumber==12241) | .id'
```

### `query "<graphql>"` or `query --file <path>`

Raw GraphQL passthrough. Validates against the cached schema when one
exists (run `jobber schema fetch` once).

```bash
jobber query 'query { account { id } }' --json --no-validate
```

`--no-validate` skips the schema check — useful if the cached schema is
missing or stale.

```json
{ "account": { "id": "Z2lk..." } }
```

For big queries pass `--file <path>` (path must be inside cwd — anti
directory-traversal guard). Use `--variables '{"key":"value"}'` for params.

### `notes` — aggregate recent job notes

```bash
jobber notes --json --limit 25 --notes-per-job 15 --max-notes 100
```

- `--limit` is clamped to 40 (throttle-budget ceiling).
- `--notes-per-job` is clamped to 25.

```json
{ "notes": [ { "message": "...", "createdAt": "...", "pinned": false,
               "jobNumber": 101, "clientName": "...", "jobTitle": "..." } ],
  "count": 3 }
```

### `schema` — manage the cached GraphQL schema

```bash
jobber schema fetch              # ~45,000 throttle units (one-time)
jobber schema analyze --json     # parses the cached SDL
jobber schema help <TypeName> --json
```

**Always `fetch` once per environment** so `query --validate` works and so
the ErrorHandler can produce field-name suggestions.

```json
// schema help Job
{
  "found": true,
  "type": { "name": "Job", "kind": "Object",
            "description": "...", "fields": [ ... ] }
}
```

If `found: false`, the `suggestions` array gives fuzzy matches.

### `doctor` — health check (no API call)

```bash
jobber doctor --json
```

Use before any run to verify the environment is wired correctly. Never
calls Jobber; safe to invoke anywhere.

```json
{ "ok": true, "runtime": { "node": "v24..." },
  "environment": { "isWSL": false, ... },
  "paths": { "envFile": "...", "envFileExists": true, ... },
  "auth": { "present": true, "validFormat": true, "expired": false, ... },
  "warnings": [], "recommendations": [] }
```

### `job-note <action>` — notes CRUD (mutations gated)

```bash
# Read (no gate)
jobber job-note list 12241 --json --limit 20

# Mutations — require JOBBER_WRITES_ENABLED=1
JOBBER_WRITES_ENABLED=1 jobber job-note create 12241 --message "..." --json
JOBBER_WRITES_ENABLED=1 jobber job-note edit --note-id <gid> --message "..." --json
JOBBER_WRITES_ENABLED=1 jobber job-note delete --note-id <gid> --json
```

Optional `--pinned` / `--no-pinned` on create/edit.

Success shapes:
```json
{ "action": "create", "job": { "id": "Z2lk...", "jobNumber": 12241 },
  "note": { "id": "Z2lk...", "message": "...", "pinned": false,
            "createdAt": "2026-..." } }
```

### `job-expense <action>` — expenses CRUD (mutations gated)

```bash
# Read
jobber job-expense list 12241 --json

# Create (require writes gate + title + date)
JOBBER_WRITES_ENABLED=1 jobber job-expense create 12241 \
  --title "Sub" --date 2026-04-17T00:00:00Z --total 100 \
  --description "Sub 100" \
  --accounting-code-id MTExMTYy \
  --json

# Edit (any subset of fields; at least --expense-id)
JOBBER_WRITES_ENABLED=1 jobber job-expense edit --expense-id <gid> \
  --accounting-code-id <gid> --total 150 --json

# Delete
JOBBER_WRITES_ENABLED=1 jobber job-expense delete --expense-id <gid> --json
```

**Accounting-code IDs cannot be discovered via API** — they are write-only.
`docs/schema/accounting-codes.json` in this repo is the canonical lookup
table for this account. For agents on other accounts, the human must
provide their own table.

## 5. Writes-gate contract

- **Default**: mutations refuse with stderr `"Error: Mutations are disabled.
  Set JOBBER_WRITES_ENABLED=1 in your .env to enable writes against the
  Jobber API."` and exit code 10. Zero network traffic.
- **Enabled**: set `JOBBER_WRITES_ENABLED=1` for exactly one invocation.
  Do not export it into the agent's persistent env.
- The gate is enforced *before* the mutation reaches the GraphQL client,
  so the agent can safely dry-run by omitting the env var.
- An agent that creates a mutation should pair it with a plan for undo
  (e.g. keep the returned gid for a delete). Destructive operations should
  always be reviewed before execution.

## 6. Throttle semantics (what the agent doesn't need to do)

The CLI handles all of this internally; the agent just sees success or
exit code 4:

- Automatic `waitIfNeeded` before every call when budget < cost.
- 200ms minimum inter-request delay, dynamically up to 2s on throttle errors.
- 3-total-attempts auto-retry on throttle errors (initial + 2 retries) with
  exponential backoff capped at 3x.
- 429 network retry once.
- `JobberThrottleExceedsMaxError` surfaces as exit 4 — the query's cost
  exceeds the per-request budget ceiling; reduce `first:` or field fanout.

Agents should not implement their own rate limiter on top; it will fight
the CLI's.

## 7. Common agent pitfalls

- **Passing a job number instead of a gid** to `get job` → returns
  "not found". Search first, use the returned `id`.
- **Omitting `--json`** → the agent parses human prose. Always set it.
- **Interactive OAuth flow** → `authorize` opens a browser; the agent
  cannot drive this. If the human hasn't bootstrapped the token, exit
  early and say so.
- **Mutations without the gate** → exit 10, not 2 or 3. Branch on the
  error message, not the exit code alone.
- **Stale schema cache** → `query --validate` will reject valid new
  queries. Run `schema fetch` when Jobber announces a schema update.
- **Long-running loops without budget checks** → get the `throttleStatus`
  from each response and pace the loop against `currentlyAvailable`.
- **Multi-word positional args to `get client`** — client names with
  spaces are joined across positionals: `get client "Acme Inc"` or
  `get client Acme Inc` both resolve to the name `"Acme Inc"`.

## 8. Out-of-scope commands

v3.0 deliberately does NOT ship: `creport`, `batch-html-report`,
`client-report`, `visits-report`, `analyze-line-items`, `sort-jobs`,
`searchpp`, `ProfitabilityCalculator`, HTML report templates.

The agent should treat these as unavailable and use `query` + its own
analysis if it needs equivalent data. The v2.5 reference source is
preserved under `reference/jobber-cli/` for any future port.

## 9. Minimal agent loop pseudocode

```
doctor → if !ok: fix env or escalate
token check → if expired: refresh OAuth or escalate
status → if currentlyAvailable < expected: wait

for each task:
    yarn dev <cmd> --json
    if exit != 0:
        branch on exit code (see §3)
    else:
        parse stdout as JSON
        record the operation
        if mutation: remember gid so undo is possible
```
