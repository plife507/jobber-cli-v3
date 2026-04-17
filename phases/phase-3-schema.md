# Phase 3 — Schema + Error Handler

## Phase Status

complete

## Objective

Provide schema introspection caching and schema-aware error recovery so commands can surface actionable messages without re-introspecting (which costs ~45k units).

## Scope

Modules under `src/schema/` and `src/error/`. On-disk cache shared with v2.5. No mutation-related paths exercised here.

Modules:
1. **SchemaCache** — port of `reference/jobber-cli/lib/schema/schema-cache.js`. Zod-validate on read.
2. **SchemaManager** — port of `schema-manager.js`. Lazy load, refresh, typed accessors. Implements the `SchemaSource` interface that `QueryValidator` already consumes.
3. **IncrementalIntrospector** — port of `incremental-introspector.js`. Respects 45k-unit introspection cost; re-uses cache.
4. **SchemaAnalyzer** — port of `schema-analyzer.js`. Extracts queries/types/connections/enums/customFieldTypes and powers suggestion lookups.
5. **ErrorHandler** — port of `reference/jobber-cli/lib/error/error-handler.js`. Matches validation errors against cached schema, produces suggestions. Implements the `ErrorHandler` interface that `QueryExecutor` already consumes.

**Scope deferral.** `api-mapper.ts` (~620 lines), `custom-fields-mapper.ts` (~334 lines), and `custom-fields-validator.ts` (~299 lines) are only consumed by Phase 5 commands (API mapping + custom-field CRUD). Deferring their port to Phase 5 avoids carrying ~1,250 lines of unused code through Phases 3-4 and does not affect any Phase 3 gate (ErrorHandler and Phase 4 commands do not depend on them). This deferral is recorded so spec-reviewer can confirm the trimmed scope is intentional.

## Tasks

- [x] `src/schema/schema-cache.ts` — Zod-validated reads, atomic writes, shared path layout with v2.5.
- [x] `src/schema/schema-analyzer.ts` — structural field iteration so unions/inputs/enums coexist; markdown generator.
- [x] `src/schema/schema-manager.ts` — implements `SchemaSource`, memoizes compiled `GraphQLSchema` + analysis.
- [x] `src/schema/incremental-introspector.ts` — 4 batch profiles preserved line-for-line from v2.5; type cost 200 units.
- [x] `src/error/error-handler.ts` — implements the Phase 2 `ErrorHandler` interface; never throws.
- [x] Unit tests per module; fixture-based tests for error-suggestion mapping.
- [x] Round-trip test: loads the real `reference/jobber-cli/.cache/jobber_schema.graphql` + `introspection_result.json` fixtures without error.
- [x] Deferred: `api-mapper.ts`, `custom-fields-mapper.ts`, `custom-fields-validator.ts` → Phase 5 (~1,250 reference lines, consumed only by schema-inspection and custom-field commands).

## Gates

- [x] `yarn typecheck` clean
- [x] `yarn lint` clean
- [x] `yarn test test/schema test/error` — 39/39 green (cache 7 · analyzer 6 · introspector 7 · manager 6 · error-handler 13)
- [x] Cache compatibility test: `test/schema/schema-cache.test.ts > loads the real v2.5-written cache fixtures round-trip (interop gate)` — loads `reference/jobber-cli/.cache/jobber_schema.graphql` + `introspection_result.json`, asserts >10 types.
- [x] Error-suggestion test: `test/error/error-handler.test.ts > offers field-replacement suggestions` + `> offers type-replacement suggestions` + `> falls back to available_fields`.
- [x] Introspection not invoked during normal flow: `test/schema/schema-manager.test.ts > does not fetch when the schema is already cached (no introspection)` — spies on fetch and asserts it was not called after `mgr.fetchSchema()` with cached SDL.

## Pass Criteria

- All gates recorded in Evidence.
- Error handler never throws on unexpected input — returns enriched result.
- Cache path matches v2.5 location exactly.

## Evidence

- typecheck: `yarn typecheck` → exit 0 (2026-04-17).
- lint: `yarn lint` → `Checked 17 files in 13ms. No fixes applied.`
- vitest: `yarn test` → 14 suites pass + 1 live-skipped, 133 passed + 1 skipped (134 total). Phase 3 contributed +39 tests (5 suites): `schema-cache`, `schema-analyzer`, `schema-manager`, `incremental-introspector`, `error-handler`.
- v2.5 cache interop test: `test/schema/schema-cache.test.ts` — opens `reference/jobber-cli/.cache/` directly, asserts SDL length > 1000 chars and `__schema.types.length > 10`. No schema migration required.
- suggestion fixture test: `test/error/error-handler.test.ts` — 3 suggestion cases (substring field match → `title` suggested for `titl`; no-match fallback → full `available_fields` list; fuzzy type match → `Job` suggested for `Jo`). All pass.
- introspection-spy test: `test/schema/schema-manager.test.ts` seeds a cached SDL, then calls `mgr.fetchSchema()` with a `fetchImpl` that throws if invoked. The call returns the cached path without the fetch ever running, proving normal flows do not trigger the 45k-cost introspection.
- Phase 2 integration: Phase 2's `QueryValidator` and `QueryExecutor` accept Phase 3's `SchemaManager` / `ErrorHandler` directly — `ErrorSuggestions` widened (commit 416b025 evidence block in phase-2 doc) to carry the richer v2.5 suggestion shape.

## Assumptions

- v2.5 cache format is JSON and Zod-describable without lossy coercion.
- Suggestion mapping fidelity from v2.5 is adequate; no algorithmic improvements during port.
- Schema rarely changes between introspections; an hours-to-days TTL is acceptable.

## Blockers / Open Questions

- Should introspection TTL be configurable via env in v3, or hard-coded like v2.5? Default: mirror v2.5 for parity.
- If the v2.5 cache file format turns out to not round-trip cleanly, does Phase 3 include a one-way migration? Default: add migration only if interop test fails.
