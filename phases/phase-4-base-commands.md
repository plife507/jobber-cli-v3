# Phase 4 — BaseCommand + Registry + status/token/get

## Phase Status

pending

## Objective

Land the command-execution spine (BaseCommand + registry + CLI dispatch) and port the three simplest read-only commands to prove the pattern end-to-end.

## Scope

Modules under `src/commands/`. Wiring in `src/cli.ts`. Three read-only commands: `status`, `token`, `get`. No mutations.

Modules:
1. **BaseCommand** — TS class injecting `client`, `throttle`, `schema`, `errorHandler`, `logger`, `config`. Handles OAuth refresh trigger + cleanup on exit.
2. **Registry** — maps command name → handler. Drives `src/cli.ts` dispatch with help + unknown-command handling.
3. **status**, **token**, **get** — ports of `reference/jobber-cli/commands/{status,token,get}.js`.

## Tasks

- [ ] `src/commands/base-command.ts`
- [ ] `src/commands/registry.ts`
- [ ] `src/commands/status.ts`
- [ ] `src/commands/token.ts`
- [ ] `src/commands/get.ts`
- [ ] Wire `src/cli.ts` to registry with help/unknown-command handling
- [ ] Unit tests per command (mocked client + schema)
- [ ] End-to-end live run (gated by `JOBBER_TEST_LIVE=1`) for `status`

## Gates

- [ ] `yarn typecheck` clean
- [ ] `yarn lint` clean
- [ ] `yarn test test/commands` — all green
- [ ] `yarn dev status` runs end-to-end in a dev environment (manual evidence acceptable)
- [ ] `yarn dev token` prints token status without exposing token body
- [ ] `yarn dev get <id>` returns a typed record for a known fixture
- [ ] Registry rejects unknown commands with a clear error and non-zero exit

## Pass Criteria

- All gates recorded in Evidence.
- No command module imports OAuth subprocess directly — must go through BaseCommand.
- No command bypasses `executeQuery`.

## Evidence

- typecheck:
- lint:
- vitest commands:
- dev status run:
- dev token run:
- dev get run:
- unknown-command exit code:

## Assumptions

- OAuth refresh can be driven from BaseCommand setup/teardown without reshaping the Phase 2 shim.
- The three chosen commands are representative enough to validate the BaseCommand pattern before Phase 5.
- Dev environment has a populated `.env` and valid cached token.

## Blockers / Open Questions

- Does `get` need `--format` options at parity, or only default output? Default: match v2.5 flags exactly.
- Where does global flag parsing live — BaseCommand or registry? Default: registry handles global flags, BaseCommand handles per-command flags.
