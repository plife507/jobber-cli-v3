# Phase 4 — BaseCommand + Registry + status/token/get

## Phase Status

complete

## Objective

Land the command-execution spine (BaseCommand + registry + CLI dispatch) and port the three simplest read-only commands to prove the pattern end-to-end.

## Scope

Modules under `src/commands/`. Wiring in `src/cli.ts`. Three read-only commands: `status`, `token`, `get`. No mutations.

Modules:
1. **BaseCommand** — TS class injecting `client`, `throttle`, `schema`, `errorHandler`, `logger`, `config`. Handles OAuth refresh trigger + cleanup on exit.
2. **Registry** — maps command name → handler. Drives `src/cli.ts` dispatch with help + unknown-command handling.
3. **status**, **token**, **get** — ports of `reference/jobber-cli/commands/{status,token,get}.js`.

## Tasks

- [x] `src/commands/base-command.ts` — abstract class; composes Phase 1-3 primitives; injectable context (test seam); token provider: OAuth subprocess → env → hard error.
- [x] `src/commands/registry.ts` — explicit name → factory map (`status`, `token`, `get`).
- [x] `src/commands/status.ts` — pings `__typename` to refresh throttle status, prints summary.
- [x] `src/commands/token.ts` — `check` action (Phase 5 will add interactive/update/oauth subcommands). Never emits the token body.
- [x] `src/commands/get.ts` — fetch job/client/quote/invoice by encoded id or numeric id (gid-encoded). JSON output; rich pretty-printing deferred to Phase 5.
- [x] `src/utils/token-utils.ts` + `src/utils/env-writer.ts` — supporting ports required by BaseCommand/token/get.
- [x] `src/cli.ts` wired to registry with help/unknown-command handling; `src/index.ts` forwards the run() exit code.
- [x] Unit tests per command (mocked `FetchLike` + in-memory context).
- [x] CLI integration tests: help, version, unknown-command, config-error exit path.
- [ ] Live run (`JOBBER_TEST_LIVE=1` + real token) deferred until a working OAuth/env session is in place; status/token/get all exercised against mocks in this phase.

## Gates

- [x] `yarn typecheck` clean
- [x] `yarn lint` clean
- [x] `yarn test test/commands` — 14/14 green (status 1, token 4, get 5, cli 4)
- [x] `yarn dev --help` renders help listing the 3 registered commands; `yarn dev --version` prints `jobber-cli v3.0.0-alpha.0`.
- [x] `jobber token` JSON output never includes the raw token body — covered by `test/commands/token.test.ts > returns a valid-token summary without emitting the token body`.
- [x] `jobber get <type> <id>` returns a typed result — covered by `test/commands/get.test.ts` (happy path + numeric-id-to-gid encoding + missing-id + invalid-type + not-found).
- [x] Registry rejects unknown commands with a clear stderr message and non-zero exit — covered by `test/commands/cli.test.ts > rejects an unknown command with exit code 1` and manual smoke test (`yarn dev unknown-cmd` → exit 1, "Unknown command:" on stderr).

## Pass Criteria

- All gates recorded in Evidence.
- No command module imports OAuth subprocess directly — must go through BaseCommand.
- No command bypasses `executeQuery`.

## Evidence

- typecheck: `yarn typecheck` → exit 0 (2026-04-17).
- lint: `yarn lint` → `Checked 24 files. No fixes applied.`
- vitest: `yarn test` → 152 passed + 1 live-skipped across 19 suites. Phase 4 adds 5 new suites / 17 tests (status 1 + token 4 + get 5 + cli 4 + base-command 3).
- code-review follow-ups applied: (1) registry exposes a structural `ExecutableCommand` shape and drops the `as unknown as BaseCommand<unknown, unknown>` casts; (2) CLI arg parser now accepts `--flag=value` and no longer treats negative-number values as flags; (3) exit-code classifier ported to reference/jobber-cli/bin/jobber:28-37 map (adds `NON_INTERACTIVE=7` and `INTERNAL=10`, `EXIT_CODES` exported for Phase 5); (4) token summarizer surfaces `validFormat: false` when the JWT payload lacks `exp`; (5) stale header comment in `token.ts` corrected; (6) `test/commands/base-command.test.ts` added to prove cleanup runs on both happy and throw paths and that `ErrorHandler.handleError` is invoked before rethrow.
- dev help: `yarn dev --help` → prints "jobber-cli v3.0.0-alpha.0" header + the 3 commands (status/token/get). Exit 0.
- dev version: `yarn dev --version` → `jobber-cli v3.0.0-alpha.0`. Exit 0.
- dev token (mock): `test/commands/token.test.ts` asserts JSON output is a summary (present/validFormat/valid/expired/expiresSoon/expiresIn/userId/accountId/clientId) and that the emitted bytes never contain the full token body.
- dev get (mock): `test/commands/get.test.ts` covers all 4 entity types' codepaths via mocked `FetchLike`; gid encoding verified by decoding the base64 back to `gid://Jobber/Client/42`.
- unknown-command exit code: `test/commands/cli.test.ts` asserts `run(['does-not-exist'])` returns `1` with `Unknown command:` on stderr. Matches the manual smoke test (`yarn dev unknown-cmd` → exit 1).
- live run: deferred — requires a populated `.env` + valid OAuth token. Recorded as a known hold; the mock suite exercises the same dispatch paths.

## Assumptions

- OAuth refresh can be driven from BaseCommand setup/teardown without reshaping the Phase 2 shim.
- The three chosen commands are representative enough to validate the BaseCommand pattern before Phase 5.
- Dev environment has a populated `.env` and valid cached token.

## Blockers / Open Questions

- Does `get` need `--format` options at parity, or only default output? Default: match v2.5 flags exactly.
- Where does global flag parsing live — BaseCommand or registry? Default: registry handles global flags, BaseCommand handles per-command flags.
