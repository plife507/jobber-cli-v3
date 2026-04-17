# Phase 3 — Schema + Error Handler

## Phase Status

pending

## Objective

Provide schema introspection caching and schema-aware error recovery so commands can surface actionable messages without re-introspecting (which costs ~45k units).

## Scope

Modules under `src/schema/` and `src/error/`. On-disk cache shared with v2.5. No mutation-related paths exercised here.

Modules:
1. **SchemaCache** — port of `reference/jobber-cli/lib/schema/schema-cache.js`. Zod-validate on read.
2. **SchemaManager** — port of `schema-manager.js`. Lazy load, refresh, typed accessors.
3. **IncrementalIntrospector** — port of `incremental-introspector.js`. Respects 45k-unit introspection cost; re-uses cache.
4. **Additional mappers/analyzers** — `api-mapper.ts`, `custom-fields-mapper.ts`, `custom-fields-validator.ts`, `schema-analyzer.ts`.
5. **ErrorHandler** — port of `reference/jobber-cli/lib/error/error-handler.js`. Matches validation errors against cached schema, produces suggestions.

## Tasks

- [ ] `src/schema/schema-cache.ts`
- [ ] `src/schema/schema-manager.ts`
- [ ] `src/schema/incremental-introspector.ts`
- [ ] `src/schema/api-mapper.ts`, `custom-fields-mapper.ts`, `custom-fields-validator.ts`, `schema-analyzer.ts`
- [ ] `src/error/error-handler.ts`
- [ ] Unit tests per module; fixture-based tests for error-suggestion mapping
- [ ] Round-trip test: load a v2.5-written cache file without error

## Gates

- [ ] `yarn typecheck` clean
- [ ] `yarn lint` clean
- [ ] `yarn test test/schema test/error` — all green
- [ ] Cache compatibility test: loads a fixture produced by v2.5 without schema migration
- [ ] Error-suggestion test: known-bad field name yields a correct suggestion from the cached schema
- [ ] Introspection is not invoked during normal query flows in tests (spy assertion)

## Pass Criteria

- All gates recorded in Evidence.
- Error handler never throws on unexpected input — returns enriched result.
- Cache path matches v2.5 location exactly.

## Evidence

- typecheck:
- lint:
- vitest schema+error:
- v2.5 cache interop test:
- suggestion fixture test:
- introspection-spy test:

## Assumptions

- v2.5 cache format is JSON and Zod-describable without lossy coercion.
- Suggestion mapping fidelity from v2.5 is adequate; no algorithmic improvements during port.
- Schema rarely changes between introspections; an hours-to-days TTL is acceptable.

## Blockers / Open Questions

- Should introspection TTL be configurable via env in v3, or hard-coded like v2.5? Default: mirror v2.5 for parity.
- If the v2.5 cache file format turns out to not round-trip cleanly, does Phase 3 include a one-way migration? Default: add migration only if interop test fails.
