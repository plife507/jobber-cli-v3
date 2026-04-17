# Phase 2 — GraphQL Client + Codegen

## Phase Status

pending

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

- [ ] `codegen.ts` against cached schema (bootstrap from reference snapshot if needed)
- [ ] `src/core/jobber-client.ts` — `executeQuery(doc, vars)`, auth header injection, throttle integration
- [ ] `src/query/query-builder.ts`, `query-executor.ts`, `query-validator.ts`
- [ ] `src/types/graphql.ts` — codegen output committed
- [ ] `src/utils/oauth-subprocess.ts` — Python shim + Zod validation
- [ ] Unit tests: happy path, throttle-deferred call, auth failure, malformed response rejection
- [ ] Live integration test stub (gated by `JOBBER_TEST_LIVE=1`) hitting a cheap read-only query

## Gates

- [ ] `yarn typecheck` clean
- [ ] `yarn lint` clean
- [ ] `yarn codegen` runs without error; output committed to `src/types/`
- [ ] `yarn test test/core/jobber-client.test.ts test/query` — all green
- [ ] Throttle integration test: a query exceeding remaining budget is deferred, not rejected
- [ ] Malformed OAuth subprocess output triggers Zod error, not a crash
- [ ] Grep check: no `fetch(` outside `src/core/jobber-client.ts`

## Pass Criteria

- All gates recorded in Evidence.
- Token cache file path matches v2.5 (`tokens/jobber_tokens.json`) — verified.
- Generated types compile under strict TS and are imported by at least one test.

## Evidence

- typecheck:
- lint:
- codegen:
- vitest query+client:
- throttle-defer test:
- OAuth subprocess zod test:
- fetch-isolation grep:

## Assumptions

- OAuth Python manager's CLI contract (`get-token` returning JSON on stdout) is stable.
- Jobber schema is stable enough that a reference snapshot bootstraps codegen without drift before Phase 3 refreshes it.
- Error envelope from Jobber matches reference's normalized shape.

## Blockers / Open Questions

- Which schema source feeds codegen initially — reference snapshot vs live introspection? Default to reference snapshot; revisit if it causes typing drift.
- Does the OAuth shim need a refresh-on-401 hook in this phase, or defer to Phase 4 BaseCommand? Default: defer to Phase 4.
