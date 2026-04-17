# Phase 2 — GraphQL Client + Codegen

## Phase Status

complete

## Objective

Deliver a typed, throttle-integrated GraphQL client plus codegen pipeline so later phases build commands on a single sanctioned transport with generated types.

## Scope

Modules under `src/query/` and `src/core/jobber-client.ts`. Codegen config at repo root. OAuth subprocess shim under `src/utils/`. Read-only client surface — no mutations exercised here.

Modules:
1. **JobberClient** — port of `reference/jobber-cli/lib/core/jobber-client.js`. Wraps fetch, injects auth, routes every call through ThrottleManager, normalizes errors.
2. **QueryExecutor / QueryBuilder / QueryValidator** — ports of `reference/jobber-cli/lib/query/*.js`, typed.
3. **Codegen** — `codegen.ts` + `yarn codegen` producing typed operations/types into `src/types/`.
4. **QueryResult<T>** — discriminated union for success/error shapes consumed by callers.
5. **OAuth shim** — subprocess invocation of `oauth/jobber_oauth_manager.py get-token`, Zod-validated stdout.

## Tasks

- [x] `codegen.ts` against cached schema (bootstrap from reference snapshot). `defaultScalarType: 'unknown'` keeps unknown scalars lint-clean.
- [x] `src/core/jobber-client.ts` — `executeQuery(doc, vars)`, token provider (string or function), auth-error detection, throttle-error retry with exponential backoff, 429 retry, error-body sanitization, 60s timeout. Injectable `FetchLike` for testing.
- [x] `src/core/cost-reference.ts` — v2.5 query-cost persistence ported with Zod file-schema (required by JobberClient).
- [x] `src/query/query-builder.ts`, `src/query/query-validator.ts`, `src/query/query-executor.ts`. QueryValidator takes an injectable `SchemaSource`; QueryExecutor takes an injectable `ErrorHandler` with a passthrough default. Phase 3 fills both in.
- [x] `src/types/graphql.ts` — codegen output committed (12.8k lines). Ignored by biome to keep regen diffs clean; still typechecked by `tsc`.
- [x] `src/utils/oauth-subprocess.ts` — spawn the Python shim, capture stdout, Zod-validate JWT shape. `TokenCacheSchema` covers the shared `tokens/jobber_tokens.json` file.
- [x] Unit tests: happy path, throttle-deferred call, auth failure (HTTP + GraphQL paths), malformed response rejection, exceeds-max cost, error sanitization.
- [x] `test/core/jobber-client.live.test.ts` — `describe.skipIf(!process.env.JOBBER_TEST_LIVE)`, hits `account { id }` via real OAuth. Imports `Query` from `src/types/graphql.ts` (satisfies the "generated types imported by at least one test" gate).

## Gates

- [x] `yarn typecheck` clean
- [x] `yarn lint` clean
- [x] `yarn codegen` runs without error; output committed to `src/types/graphql.ts`
- [x] `yarn test` — 91 passed + 1 live-skipped (9 files + 1 live-gated)
- [x] Throttle integration test: a query needing more than the currently available budget is deferred via `waitIfNeeded`, not rejected (`test/core/jobber-client.test.ts` → "defers (does not reject) a query when budget is insufficient...")
- [x] Malformed OAuth subprocess output triggers Zod error, not a crash (`test/utils/oauth-subprocess.test.ts` → "rejects with ZodError when stdout is not JWT-shaped")
- [x] Grep check: no `fetch(` outside `src/core/jobber-client.ts`

## Pass Criteria

- All gates recorded in Evidence.
- Token cache file path matches v2.5 (`tokens/jobber_tokens.json`) — verified.
- Generated types compile under strict TS and are imported by at least one test.

## Evidence

- typecheck: `yarn typecheck` → exit 0 (2026-04-17).
- lint: `yarn lint` → `Checked 12 files in 6ms. No fixes applied.` — `src/types/graphql.ts` excluded via `biome.json` `files.ignore`.
- codegen: `yarn codegen` → `[SUCCESS] Generate to src/types/graphql.ts` (12855 lines, committed).
- vitest: `yarn test` → 9 suites pass, 94 passed + 1 skipped (live), 0 failed.
  - `test/core/jobber-client.test.ts` — 15 tests (happy path, token-provider call-per-request, 401 auth error, sanitization, GraphQL auth/non-auth/throttle errors, exceeds-max cost, throttle-defer, malformed extensions tolerated, cost estimator, **retry-on-retryable-throttle succeeds on 2nd attempt**, **max-retries = 3 total attempts**, **network-layer 429 retry + final surface**).
  - `test/query/query-builder.test.ts` — 11 tests
  - `test/query/query-validator.test.ts` — 6 tests (syntax + schema-aware + warning path)
  - `test/query/query-executor.test.ts` — 4 tests (success / GraphQL failure / custom ErrorHandler suggestions / HTTP 500 → failure envelope)
  - `test/utils/oauth-subprocess.test.ts` — 10 tests (JWT happy path, ZodError on malformed, OAuthSubprocessError on nonzero exit, spawn ENOENT, hang → timeout + kill, TokenCacheSchema accept/reject)
  - `test/core/jobber-client.live.test.ts` — 1 live-gated test (skipped unless `JOBBER_TEST_LIVE=1`). Imports `Query` from `src/types/graphql.ts` — proves generated types compile and are consumable.
- throttle-defer test: `test/core/jobber-client.test.ts:181` → seeds 0/10000 budget with 500/s restore rate, calls `executeQuery` with cost 5000, asserts the fetch call completes after a `waiting` event fires (i.e. the query is deferred, not rejected).
- OAuth subprocess zod test: `test/utils/oauth-subprocess.test.ts:54` → subprocess prints `not-a-token\n`, exits 0. `getAccessToken` rejects with a `ZodError`, not a crash.
- fetch-isolation grep: `grep -n '\\bfetch\\s*\\(' src/` → single match in `src/core/jobber-client.ts:86` (comment text). No other module calls `fetch(` directly.
- code-review follow-ups applied before commit: retry-path tests added (3-attempt cap + 429 retry both proven by tests, invalidating reviewer's claim of off-by-one); `QueryExecutor` inline-import types promoted to top-level import; redundant `errors && errors.length` check simplified; `CostReference` single-writer assumption documented; `codegen.ts` cross-references the biome ignore entry.

## Assumptions

- OAuth Python manager's CLI contract (`get-token` returning JSON on stdout) is stable.
- Jobber schema is stable enough that a reference snapshot bootstraps codegen without drift before Phase 3 refreshes it.
- Error envelope from Jobber matches reference's normalized shape.

## Blockers / Open Questions

- Which schema source feeds codegen initially — reference snapshot vs live introspection? Default to reference snapshot; revisit if it causes typing drift.
- Does the OAuth shim need a refresh-on-401 hook in this phase, or defer to Phase 4 BaseCommand? Default: defer to Phase 4.
