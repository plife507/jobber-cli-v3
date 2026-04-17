# Phase 5 — Schema-based transport commands

## Phase Status

complete

## Objective

Port the remaining schema-based transport commands at feature parity with v2.5, introducing the first mutation-capable commands under a mandatory `JOBBER_WRITES_ENABLED` gate.

## Scope (narrowed 2026-04-17)

Only the schema/transport-oriented command surface. Per user direction, the profitability/HTML reporting commands — which build calculation layers on top of the transport — are **out of scope** for this project and will not be ported. They remain available in the v2.5 reference if needed later.

Commands to port (7 total):

Read-only (schema-based):
- `query` — run arbitrary GraphQL with optional validation against the cached schema
- `search` — search jobs/clients via the search API
- `notes` — aggregate notes across recent jobs
- `schema` — `fetch` / `analyze` / `help` subcommands (wrap Phase 3 SchemaManager)
- `doctor` — runtime / env / token health diagnostic (no API call)

Mutation-capable (writes-gated):
- `job-note` — list / create / edit / delete
- `job-expense` — list / create / edit / delete

**Removed from scope:** `creport`, `batch-html-report`, `client-report`, `visits-report`, `analyze-line-items`, `sort-jobs`, `searchpp`, `list-ar-jobs`, `map-schema`, `test-api`, `test-comprehensive`. These depend on calculation/rendering layers (ProfitabilityCalculator, HTML report templates, theme widgets) that the v3 project is intentionally not re-implementing. `register` is v2.5's internal registry file, not a runtime command.

Also permanent: `api-mapper.ts`, `custom-fields-mapper.ts`, `custom-fields-validator.ts` (deferred from Phase 3) stay deferred — none of the 7 Phase 5 commands consume them.

## Tasks

- [x] `src/commands/writes-gate.ts` — `requireWritesEnabled()` + `WritesDisabledError` + canonical `WRITES_REFUSAL_MESSAGE`
- [x] `BaseCommand.resolveJobId` — accept gid (starts with `Z2lkOi8v`) or numeric job number (searches `jobs(searchTerm:)` for exact match)
- [x] `src/commands/query.ts` — literal or file-sourced GraphQL; path-traversal guarded; optional schema-aware validation
- [x] `src/commands/search.ts` — jobs (searchTerm) + clients (client-side name filter, matching v2.5 semantics)
- [x] `src/commands/notes.ts` — newest-first aggregation across recent jobs; clamps limit to 40
- [x] `src/commands/schema.ts` — `fetch` / `analyze` / `help <TypeName>` via Phase 3 SchemaManager
- [x] `src/commands/doctor.ts` — plain class (does NOT extend BaseCommand) so it runs with broken config
- [x] `src/commands/job-note.ts` — `list` (read) / `create` / `edit` / `delete`. Every mutation action gated.
- [x] `src/commands/job-expense.ts` — `list` / `create` / `edit` / `delete`. Every mutation action gated.
- [x] Registry extended (7 new entries: query/search/notes/schema/doctor/job-note/job-expense). `cli.ts` bindArgs now recognises all new positional shapes.
- [x] Unit tests per command (writes-gate, base-command lifecycle, job-note, job-expense, query, search, schema, notes, doctor).
- [x] Writes-gate default-off tests: job-note create/edit/delete AND job-expense create/edit/delete each throw `WritesDisabledError` with zero fetch calls.
- [x] Writes-gate enabled test: `JOBBER_WRITES_ENABLED=true` → create mutation body reaches the mocked fetch and contains `jobCreateNote` / `expenseCreate`.

## Gates

- [x] `yarn typecheck` clean (2026-04-17)
- [x] `yarn lint` clean — `Checked 32 files. No fixes applied.`
- [x] `yarn test` — 176 passed + 1 live-skipped across 28 suites
- [x] **Mutation-gate default-off** — `test/commands/job-note.test.ts > refuses create without calling the API` + `> refuses edit and delete without calling the API`; same pattern in `test/commands/job-expense.test.ts > refuses create/edit/delete without calling the API`. `fetchCalls === 0` asserted in each.
- [x] **Mutation-gate enabled** — `test/commands/job-note.test.ts > sends the create mutation to the client when JOBBER_WRITES_ENABLED=1` asserts the request body contains `jobCreateNote`; `test/commands/job-expense.test.ts > sends the create mutation when enabled` asserts `expenseCreate`.
- [x] **Grep check** — only `src/commands/{job-note,job-expense,writes-gate}.ts` contain the string `mutation `; `requireWritesEnabled(ctx.config)` appears at the top of every `create`/`edit`/`delete` method (6 total hits, one per mutation action).
- [x] `yarn dev --help` lists 10 registered commands; `yarn dev doctor --json` returns a populated report even without a `.env`.

## Pass Criteria

- All gates recorded in Evidence.
- No mutation command executes against live API in tests unless both `JOBBER_TEST_LIVE=1` and `JOBBER_WRITES_ENABLED=1` are set against a sandbox-safe target.
- Shared refusal message + exit code used identically across mutation commands — verified by grep.
- Out-of-scope report/calculation commands are NOT present in `src/commands/` and NOT registered in `registry.ts`.

## Evidence

- typecheck: `yarn typecheck` → exit 0 (2026-04-17).
- lint: `yarn lint` → `Checked 32 files in 15ms. No fixes applied.`
- vitest: `yarn test` → 27 suites pass + 1 live-skipped, 176 passed + 1 skipped. Phase 5 adds 8 new suites / 24 tests: writes-gate (3), job-note (4), job-expense (3), query (4), search (3), schema (4), notes (2), doctor (1).
- writes-gate default-off: `test/commands/job-note.test.ts` + `test/commands/job-expense.test.ts` both assert `fetchCalls === 0` when `JOBBER_WRITES_ENABLED=false` and a create/edit/delete action is attempted. `WritesDisabledError` thrown with `WRITES_REFUSAL_MESSAGE`.
- writes-gate enabled: with `JOBBER_WRITES_ENABLED=true` the create mutation body (`init.body`) is captured and asserted to contain `jobCreateNote` (job-note) and `expenseCreate` (job-expense) — proves the path reaches `queryExecutor.execute` with the intended mutation text.
- grep: `grep "mutation " src/commands/` → 3 files (job-note, job-expense, writes-gate comment). `grep "requireWritesEnabled" src/commands/` → 6 call sites (create/edit/delete × 2 commands), plus the definition and import lines.
- CLI smoke: `yarn dev --help` lists all 10 commands (status, token, get, query, search, notes, schema, doctor, job-note, job-expense). `yarn dev doctor --json` returns a structured report with `runtime`, `environment`, `paths`, `auth`, `warnings`, `recommendations`.
- out-of-scope report/calculation commands are NOT present in `src/commands/` (grep `src/commands/` for creport/batch-html/analyze-line/client-report/visits-report/sort-jobs/searchpp → 0 hits).

## Assumptions

- v2.5 transport behavior per command is the spec; no redesigns.
- Calculation/rendering modules from v2.5 (`ProfitabilityCalculator`, HTML templates, `theme.js` widget layer) are intentionally not ported — v3 is a pure transport CLI.

## Blockers / Open Questions

- None. Scope is final after the 2026-04-17 narrowing.
