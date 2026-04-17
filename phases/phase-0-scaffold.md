# Phase 0 — Scaffold

## Phase Status

complete

## Objective

Land a committable TypeScript skeleton so subsequent phases have a strict-typed, testable starting point with no runtime logic yet.

## Scope

Compiler config, package manifest, lint/format config, test runner wiring, bin entry, empty `src/` tree. No application code beyond entry stubs. Reference clone of v2.5 JS kept under `reference/jobber-cli/` for parity lookup.

## Tasks

- [x] `tsconfig.json` with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [x] `package.json` with `type: module`, bin entry, scripts (build/dev/test/typecheck/codegen/lint/format)
- [x] `biome.json` lint/format config
- [x] `src/` tree: `cli.ts`, `index.ts`, `commands/`, `core/`, `error/`, `query/`, `reporting/`, `schema/`, `types/`, `utils/`
- [x] `bin/jobber.js` entry
- [x] `reference/jobber-cli/` clone present

## Gates

- [x] Repo builds a committable tree (initial commit present)
- [x] `package.json` scripts resolvable by yarn/npm
- [x] Directory layout matches `PHASES.md`

## Pass Criteria

- All gates above checked.
- `tsconfig.json` strict-flag triple confirmed on disk.
- Initial commit SHA recorded in Evidence.

## Evidence

- Initial commit: `4c8db42 Initial commit: jobber-cli v3.0.0-alpha.0 TS scaffold`
- `src/` subdirs present (empty except `cli.ts`, `index.ts`) — verified at phase handoff
- `package.json` scripts: build, dev, start, test, test:watch, test:live, typecheck, codegen, lint, format
- `tsconfig.json` flags confirmed: strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes

## Assumptions

- v2.5 reference clone stays read-only throughout the port.
- Yarn is the package manager of record; npm remains compatible.
- Workspace `.env` and `tokens/` live at `/home/plife507/Projects/jobber/` and are shared with v2.5.

## Blockers / Open Questions

- None. Phase closed at initial commit.
