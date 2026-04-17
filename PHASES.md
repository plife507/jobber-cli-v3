# Migration Phases

Reference CLI: `reference/jobber-cli/` (v2.5.0, JS — cloned into this repo). Port to TS, feature parity first.

| Phase | Scope | Status |
|---|---|---|
| 0 | Scaffold: tsconfig, package.json, tsx, vitest, bin entry | ✅ |
| 1 | Core: Config (Zod), Logger, ThrottleManager, RateLimiter | ⏳ |
| 2 | GraphQL: JobberClient, codegen, typed QueryResult | ⏳ |
| 3 | Schema: SchemaManager, SchemaCache, ErrorHandler | ⏳ |
| 4 | BaseCommand + registry + status/token/get | ⏳ |
| 5 | Remaining 13 commands | ⏳ |
| 6 | Tests, cutover, archive old CLI | ⏳ |

## Ground Rules

1. **Feature parity first.** No redesigns during port. Behavioral changes after v3.0 ships.
2. **Strict TS.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` on.
3. **No `any`.** Use `unknown` + narrowing at boundaries (Zod for JSON/env/subprocess).
4. **Shared state.** Read the same `.env`, `tokens/`, and schema cache as v2.5 — OAuth Python untouched.
5. **Throttle math preserved.** Port `ThrottleManager` logic line-for-line; don't "improve" it.
6. **Writes disabled during port.** User has API writes turned off. All mutation-capable commands (`job-note`, `job-expense`, any `mutation` in Phase 5) must be gated behind `JOBBER_WRITES_ENABLED=1`. Default refuses with a clear error. Flip the flag only after the user re-enables writes on the Jobber side.
