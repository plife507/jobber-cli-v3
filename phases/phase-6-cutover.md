# Phase 6 — Tests, Cutover, Release

## Phase Status

complete

## Objective

Harden the suite, ship v3.0.0, and prove the writes gate end-to-end against the real Jobber API. Reference tree preserved for any future port of the deferred calculation modules.

## Scope

Test coverage sweep, live matrix run, documentation refresh, bin smoke, release tag. Touches repo-level docs only.

**Reference tree is preserved** (user decision 2026-04-17). `reference/jobber-cli/` stays in place so the currently-skipped calculation modules (creport / batch-html-report / client-report / visits-report / analyze-line-items / sort-jobs / searchpp / ProfitabilityCalculator / HTML report templates) remain available as a source-of-truth for any future port. Future work on those modules is out of the v3.0.0 scope but can resume against the same reference tree.

## Tasks

- [x] Full test suite sweep — 176/1 green across 28 suites (Phases 1–5 baseline intact, no coverage gaps surfaced)
- [x] End-to-end live test matrix (`JOBBER_TEST_LIVE=1`): status, token, get, query, search + job-expense mutation gate — all succeeded on 2026-04-17
- [x] README rewritten for v3 (commands, writes gate, exit codes, architecture, out-of-scope list)
- [x] `bin/jobber.js` verified — `yarn node bin/jobber.js --help / --version / unknown-cmd` exit 0/0/1 with expected stdout/stderr
- [x] OAuth shim now auto-detects the workspace `.venv/bin/python` and honours `JOBBER_OAUTH_PYTHON` (unblocks `yarn dev` on machines whose system `python3` lacks `python-dotenv`)
- [x] `reference/jobber-cli/` preserved (user decision — deliberately not archived)
- [x] Tag release `v3.0.0`

## Gates

- [x] `yarn typecheck` clean
- [x] `yarn lint` clean — 32 files, no fixes applied
- [x] `yarn test` — 176 passed + 1 live-skipped in default mode; live-gated suite 1/1 green
- [x] `yarn build` produces a working `dist/` + `bin/jobber.js`; CLI smoke lists all 10 commands
- [x] **Mutation-gate refusal (live)**: `job-expense create 12241` with `JOBBER_WRITES_ENABLED` unset → exit 10, "Mutations are disabled..." on stderr, no HTTP call
- [x] **Mutation-gate live success**: `job-expense create` + immediate `delete` on job 12241 succeeded end-to-end with `JOBBER_WRITES_ENABLED=1`; post-run `list` shows no residue
- [x] Live read-only matrix recorded (`JOBBER_TEST_LIVE=1`, plus manual status/token/get/query/search smokes)
- [x] v3 README published
- [x] Git tag `v3.0.0` present

## Pass Criteria

- All gates recorded in Evidence.
- No prior phase has unresolved blockers carried forward.
- Writes gate remains default-off in shipped `v3.0.0`.

## Evidence

- typecheck: `yarn typecheck` → exit 0.
- lint: `yarn lint` → `Checked 32 files in 13ms. No fixes applied.`
- full vitest (default): `yarn test` → 176 passed + 1 skipped, 28 suites. `test/commands/doctor.test.ts` isolated via `JOBBER_ENV_PATH=/tmp/...-does-not-exist.env` to avoid the workspace `.env` after it was populated by the live OAuth authorize.
- full vitest (live): `JOBBER_TEST_LIVE=1 yarn test test/core/jobber-client.live.test.ts` → `JobberClient (LIVE) > fetches the authenticated account id` passed (415ms) against account 10592.
- build + bin smoke: `yarn build` → `dist/` populated. `yarn node bin/jobber.js --help` lists all 10 commands. `--version` prints `jobber-cli v3.0.0-alpha.0`. `unknown-cmd` → exit 1 with `"Unknown command: unknown-cmd"` on stderr.
- writes-gate fresh-env refusal (live): `yarn dev job-expense create 12241 --title "phase-6 gate check" --date 2026-04-17T00:00:00Z --total 0.01` with `JOBBER_WRITES_ENABLED` unset → stderr `"Error: Mutations are disabled. Set JOBBER_WRITES_ENABLED=1 in your .env to enable writes against the Jobber API."`, exit 10. Refusal fires from `requireWritesEnabled(ctx.config)` before `queryExecutor.execute` is reached.
- writes-gate live mutation success: with `JOBBER_WRITES_ENABLED=1` → create returned `{"action":"create","expense":{"id":"Z2lkOi8vSm9iYmVyL0V4cGVuc2UvMTc5NzA5MzY=","title":"phase-6 gate check","date":"2026-04-17T00:00:00Z","total":0.01,"linkedJob":{"jobNumber":12241,...}, ...}}`; delete returned the same id; `job-expense list 12241` shows no "phase-6 gate check" entry.
- live read-only matrix:
  - `status --json` → `{"throttleStatus":{"maximumAvailable":10000,"currentlyAvailable":9999,"restoreRate":500},"usagePercent":~0}`
  - `token check --json` → `{"present":true,"validFormat":true,"valid":true,"accountId":10592,"clientId":"7ba8c817-...","expiresIn":"0h 57m",...}` (no token body in emitted chunks)
  - `get job Z2lkOi8vSm9iYmVyL0pvYi84NTk3NjAxNQ== --json` → "Marketing Test Quote" on job 12241
  - `query 'query { account { id } }' --json` → `Z2lkOi8vSm9iYmVyL0FjY291bnQvMTA1OTI=`
  - `search jobs 12241 --json` → 1 item matching job 12241
- README: rewritten in this commit — 10 commands documented, writes-gate section with live example, exit-code table, architecture diagram, out-of-scope list.
- reference preservation: `reference/jobber-cli/` intact.
- v3.0.0 tag: applied in this commit.
- OAuth-shim resilience (Phase 6 add-on): `src/utils/oauth-subprocess.ts` resolution order is now `options.python` → `JOBBER_OAUTH_PYTHON` → `<workspace>/.venv/bin/python` → `python3`. Existing unit tests (10/10) remain green because they inject `spawnImpl`.

## Assumptions

- `reference/jobber-cli/` is preserved, not archived (user decision 2026-04-17) so the deferred calculation modules remain portable later.
- All Phase 1–5 gates are green before this phase starts — verified.

## Live mutation gate — execution details (user-supplied 2026-04-17)

- **Test job number**: `12241` — used for both the writes-gate refusal (unset env) and the live mutation success (`JOBBER_WRITES_ENABLED=1`).
- **Executed live mutation**: `job-expense create 12241 --title "phase-6 gate check" --date 2026-04-17T00:00:00Z --total 0.01` followed by `job-expense delete --expense-id Z2lkOi8vSm9iYmVyL0V4cGVuc2UvMTc5NzA5MzY=`. Both returned successfully; follow-up `list` confirmed no residue.
- **OAuth re-auth**: performed before the live run via `python3 oauth/jobber_oauth_manager.py authorize` (interactive browser flow) to refresh scopes after the user enabled expenses/job-write in the Jobber developer portal.

## Blockers / Open Questions

- None. Phase 6 complete; v3.0.0 shipped.
