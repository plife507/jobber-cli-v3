# Headless usage best practices

Rules for running `jobber-cli` v3.0 from scripts, cron jobs, or agent harnesses.
These are opinionated defaults; deviate only with a reason.

## 1. One invocation = one explicit environment

Never rely on the caller's ambient env or cwd. Every invocation should be
fully self-describing:

```bash
JOBBER_ENV_PATH=/abs/path/to/workspace/.env \
JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
yarn dev <cmd> [args] --json
```

- `JOBBER_ENV_PATH` — absolute path. Never rely on `cwd` or parent-directory search.
- `JOBBER_OAUTH_SKIP_AUTHORIZE=1` — **always**. It stops the OAuth manager from
  trying to open a browser or start a local callback server (which it can't do
  headlessly). Without it, hangs are possible.
- `--json` — **always**. Parsing human prose is a foot-gun.
- **Never export `JOBBER_WRITES_ENABLED` globally.** Set it inline for the single
  mutation call and nothing else. Exported, it turns every future script into
  a potential write.

## 2. Token lifecycle is your responsibility

The CLI will try the OAuth Python manager on each invocation. In headless
contexts the manager can't re-authorize; it can only refresh. Schedule a
refresh **before** the caller's first call, not reactively:

```bash
# Run on a cron (e.g. every 30 minutes), not per-call
JOBBER_ENV_PATH=/abs/.env JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
  /path/to/.venv/bin/python /path/to/oauth/jobber_oauth_manager.py refresh
```

If the refresh token itself has expired, no automation can fix it — the
OAuth portal requires a human browser. Detect this and alert; don't loop.

**Prefer `token check --json` as a liveness probe**, not `status` (which
costs a throttle unit against the real API).

## 3. Branch on exit code, not stdout

```
0   success — stdout is parseable JSON when --json was set
2   validation (bad args / unknown command)
3   auth failure — refresh token, don't retry blindly
4   throttle / 429 — back off, don't retry tight
5   not found — check the id you passed
6   config error — .env or credentials
7   non-interactive block
10  internal — includes "writes disabled" refusal
```

Your wrapper must always check `$?` before `jq` runs. `jq` on stderr
text will silently produce garbage.

## 4. Capture streams separately

```bash
out=$(mktemp) err=$(mktemp)
JOBBER_ENV_PATH=... JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
  yarn dev <cmd> --json >"$out" 2>"$err"
code=$?
```

- stdout holds the JSON payload.
- stderr holds human messages, refusal reasons, and any `logger.warn`/`error`.
- Never pipe stdout through a tool that swallows exit codes (e.g. `| tail`) —
  it drops the CLI's real exit code.

## 5. Never implement your own retry on top

The CLI already:

- Waits when budget < estimated cost.
- Honours a 200ms–2s inter-request delay that dilates on throttle errors.
- Retries throttle errors up to 3 total attempts with exponential backoff.
- Retries 429 once.

Your wrapper's retry policy should kick in **only** after the CLI gives up
(exit 3 or 4), and should wait generously (≥60s) before attempting again.
Tight retries fight the CLI and get you rate-limited faster.

## 6. Throttle-aware scheduling

Before launching a batch (e.g. updating 100 notes), inspect budget first:

```bash
avail=$(yarn dev status --json | jq '.throttleStatus.currentlyAvailable')
if [ "$avail" -lt 3000 ]; then sleep 60; fi
```

The budget caps at 10,000 units. Typical single-entity ops are 20–200 units;
introspection is 45,000 (spike). Schedule wide jobs overnight or in chunks
bounded by the budget.

## 7. Mutations are deliberate — design for undo

Wrap every mutation call in a script that:

1. Captures the returned id on stdout.
2. Writes it to a rollback journal (file, database) before the next call.
3. On failure mid-batch, replays the journal to delete what it created.

```bash
resp=$(JOBBER_WRITES_ENABLED=1 yarn dev job-expense create 12241 \
  --title "X" --date 2026-04-17T00:00:00Z --total 100 --json)
id=$(echo "$resp" | jq -r '.expense.id')
echo "$id" >> /var/log/jobber/rollback.journal
```

Don't run mutations in parallel against the same account — the throttle
budget is account-global and you'll serialize on the server anyway, badly.

## 8. Schema cache hygiene

On a fresh machine, run `schema fetch` once (this costs 45k units so it
will wait). After that, `query --validate` catches bad queries locally.

Refresh the cache when Jobber ships schema changes (check the portal or
watch for new exit-3/5 errors with suggestions mentioning unknown fields):

```bash
yarn dev schema fetch --force
```

Don't run `schema fetch --force` on every invocation — it burns budget.

## 9. Secrets — never in logs, never in args

- The CLI already redacts JWT-shaped tokens from its own error messages.
- Your wrapper should redact anything it logs too. Tokens, refresh tokens,
  client secrets.
- `token check` prints metadata only, never the token body — safe to log.
- Passing tokens as CLI args is fine (they go through `process.argv`), but
  don't echo `ps`-visible commands or write them to shell history.

## 10. Idempotency by construction

Jobber mutations are not natively idempotent — there's no "create-or-update"
flow. Design wrappers to check before write:

```bash
# Don't just create; search first
existing=$(yarn dev job-expense list 12241 --json | \
  jq -r '.expenses[] | select(.title=="Sub") | .id')
if [ -n "$existing" ]; then
  yarn dev job-expense edit --expense-id "$existing" ...
else
  yarn dev job-expense create 12241 --title "Sub" ...
fi
```

Retry-safe wrappers turn "mutation ran twice" from a corruption bug into a
no-op.

## 11. One doctor per run

Run `doctor --json` at the start of every batch. It costs zero throttle
units, validates env / token / schema cache, and gives you a structured
reason to abort early:

```bash
health=$(yarn dev doctor --json)
if [ "$(echo "$health" | jq -r '.ok')" != "true" ]; then
  echo "$health" | jq '.warnings,.recommendations' >&2
  exit 1
fi
```

## 12. Don't fight the writes gate

If a mutation returns exit 10 with "Mutations are disabled", that's the
system working correctly. Escalate to a human decision — don't add
`JOBBER_WRITES_ENABLED=1` to the global environment to "fix" it. Automation
that silently enables writes is exactly how prod accidents happen.

---

## Minimum viable headless wrapper

```bash
#!/usr/bin/env bash
set -euo pipefail

WORKSPACE=/abs/path/to/workspace
CLI_DIR=$WORKSPACE/jobber-cli-v3

run() {
  local out err code
  out=$(mktemp); err=$(mktemp)
  ( cd "$CLI_DIR" && \
    JOBBER_ENV_PATH="$WORKSPACE/.env" \
    JOBBER_OAUTH_SKIP_AUTHORIZE=1 \
    yarn dev "$@" --json >"$out" 2>"$err" ) && code=0 || code=$?
  cat "$out"
  if [ $code -ne 0 ]; then
    cat "$err" >&2
    return $code
  fi
}

# Usage:
#   run status
#   run get job Z2lkOi8v...
#   JOBBER_WRITES_ENABLED=1 run job-note create 12241 --message "hi"
```

That's the floor. Everything in §§1–12 adds safety on top.
