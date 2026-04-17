# Phase 5 — Remaining 13 Commands

## Phase Status

pending

## Objective

Port the remaining commands at feature parity with v2.5, introducing the first mutation-capable commands under a mandatory `JOBBER_WRITES_ENABLED` gate.

## Scope

All commands in `reference/jobber-cli/commands/` not covered by Phase 4. Reporting helpers land under `src/reporting/`. Writes gate becomes load-bearing — every mutation path must route through a single shared refusal helper.

Commands to port (grouped):

Read-only:
- `query`, `search`, `searchpp`, `notes`, `schema`, `map-schema`, `doctor`, `test-api`, `list-ar-jobs`, `sort-jobs`

Mutation-capable (writes-gated):
- `job-note`
- `job-expense`
- `register` (if it writes)

Reporting (read-only, heavier surface):
- `client-report`, `creport`, `batch-html-report`, `visits-report`, `analyze-line-items`

(Final grouping may shift; total port count stays at 13 per `PHASES.md`.)

## Tasks

- [ ] Port each command into `src/commands/` as a BaseCommand subclass
- [ ] Reporting helpers under `src/reporting/` for shared rendering/formatting logic
- [ ] Shared writes-gate helper checking `config.writesEnabled`, producing a single refusal message + exit code
- [ ] Unit tests per command (mocked)
- [ ] Writes-gate test: `JOBBER_WRITES_ENABLED` unset/`0` → mutation command exits non-zero without calling the client
- [ ] Writes-gate test: `JOBBER_WRITES_ENABLED=1` → mutation path reaches the client (mocked, not live)

## Gates

- [ ] `yarn typecheck` clean
- [ ] `yarn lint` clean
- [ ] `yarn test test/commands test/reporting` — all green
- [ ] **Mutation-gate check (required)**: automated test proves mutation command refuses when `JOBBER_WRITES_ENABLED` is unset/`0`
- [ ] **Mutation-gate check (required)**: automated test proves mutation command proceeds (mocked) when `JOBBER_WRITES_ENABLED=1`
- [ ] Grep check: every mutation operation is wrapped by the shared writes-gate helper
- [ ] Per-command `yarn dev <cmd>` smoke run recorded for each read-only command
- [ ] Throttle-budget test per reporting command confirms it stays within 10,000 units in a representative run

## Pass Criteria

- All gates recorded in Evidence.
- No mutation command executes against live API in tests unless both `JOBBER_TEST_LIVE=1` and `JOBBER_WRITES_ENABLED=1` are set against a sandbox-safe target.
- Shared refusal message + exit code used identically across mutation commands — verified by grep.

## Evidence

- typecheck:
- lint:
- vitest commands+reporting:
- writes-gate default-off test:
- writes-gate enabled test:
- grep: mutation-wrapping helper usage:
- per-command dev smoke runs:
- reporting budget checks:

## Assumptions

- v2.5 behavior per command is the spec; no redesigns.
- Reporting commands' unit costs are representative enough that a single budget check per command covers real usage.
- `register` may or may not write; classification settled on first read of its source.

## Blockers / Open Questions

- Is `register` a mutation? Resolve on first read; update grouping if so.
- Do any reporting commands legitimately exceed 10,000 units and need pagination-over-time? Record as deferred improvement rather than parity break.
