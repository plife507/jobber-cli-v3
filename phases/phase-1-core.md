# Phase 1 — Core

## Phase Status

complete

## Objective

Build the leaf-level runtime foundations (Config, Logger, ThrottleManager, RateLimiter) so later phases have typed, test-covered primitives for env loading, structured logging, and Jobber's throttle arithmetic.

## Scope

Modules under `src/core/` and `src/utils/` only. Pure logic, no network, no GraphQL, no commands. Unit tests per module in `test/core/` and `test/utils/`.

Modules:
1. **Config** — Zod-validated `.env` loader. Reads workspace-root `.env` (same file v2.5 uses). Exposes typed config. Enforces `JOBBER_WRITES_ENABLED` as explicit boolean.
2. **Logger** — leveled logger (debug/info/warn/error), env-controlled verbosity, stderr for warn/error, stdout for info/debug, no color in non-TTY.
3. **ThrottleManager** — line-for-line port of `reference/jobber-cli/lib/core/throttle-manager.js`. Event-driven budget tracking (10,000 units), min 200ms / dynamic up to 2000ms delay, exponential backoff with max 3 retries.
4. **RateLimiter** — request pacing wrapper that consumes ThrottleManager events and defers execution until budget permits.

## Tasks

- [x] `src/core/config.ts` — Zod schema for env, `loadConfig()` returning `Config`, strict boolean parse for `JOBBER_WRITES_ENABLED`
- [x] `src/utils/logger.ts` — `createLogger(level)`, structured output, TTY detection
- [x] `src/core/throttle-manager.ts` — port from reference; preserve constants, math, event names
- [x] `src/core/rate-limiter.ts` — await-on-budget API; integrates with ThrottleManager
- [x] `test/core/config.test.ts`
- [x] `test/utils/logger.test.ts`
- [x] `test/core/throttle-manager.test.ts` — parity checks vs reference behavior table
- [x] `test/core/rate-limiter.test.ts`

## Gates

- [x] `yarn typecheck` clean
- [x] `yarn lint` clean
- [x] `yarn test` — all green (scoped to `test/` via `vitest.config.ts`)
- [x] Config: missing `JOBBER_ACCESS_TOKEN` produces a Zod error with a field-level message (reference env-var name — phase spec previously said `JOBBER_API_TOKEN`, corrected to match v2.5 parity)
- [x] Config: `JOBBER_WRITES_ENABLED` defaults to `false` when unset or any value other than `"1"`
- [x] ThrottleManager: unit tests assert parity with reference (defaults, budget floor, 10% buffer + 3600s cap, default-rate fallback, queued updates, budgetLow threshold)
- [x] Logger: `level=warn` suppresses info/debug; warn/error land on stderr
- [x] No imports from `src/commands/`, `src/query/`, `src/schema/` into Phase 1 modules (grep recorded)

## Pass Criteria

- Every gate above has a recorded Evidence entry.
- ThrottleManager constants in code match reference values; divergences carry a comment citing the reference line.
- Config, Logger, ThrottleManager, RateLimiter each have a dedicated unit-test file with green results.

## Evidence

- typecheck: `yarn typecheck` → exit 0, no output (2026-04-17).
- lint: `yarn lint` → `Checked 6 files in 3ms. No fixes applied.` (2026-04-17).
- vitest: `yarn test` → 4 files, 48 tests passed, 0 failed (2026-04-17).
  - `test/core/config.test.ts` — 11 tests (including env-overrides-file precedence proof with real temp .env file)
  - `test/core/rate-limiter.test.ts` — 7 tests
  - `test/core/throttle-manager.test.ts` — 20 tests (includes boundary-schema rejection of malformed payloads and non-object input, plus interleaved-await queue serialization proof)
  - `test/utils/logger.test.ts` — 10 tests
- config writes-gate test: `test/core/config.test.ts` → `JOBBER_WRITES_ENABLED` describe block. Asserts only literal `"1"` → true; `undefined`, `"0"`, `""`, `"true"`, `"false"`, `"yes"`, `"on"`, `"YES"`, `"2"`, `" 1 "`, `"1.0"` → false.
- throttle parity test: `test/core/throttle-manager.test.ts` covers defaults 10000/10000/500, both extension paths, budgetLow @ >80%, queued concurrent updates, 1.1 buffer + ceil, 3600s cap, default-rate fallback when `restoreRate ≤ 0`, waitIfNeeded event emission + budget restoration.
- logger stream routing test: `test/utils/logger.test.ts` — warn/error → stderr, info/debug/success → stdout; `level=warn` suppresses info+debug; no ANSI on non-TTY streams.
- cross-module import check: `grep "from ['\"]\.\./(commands|query|schema|core)"` run on `src/core/` and `src/utils/` → `No matches found` (2026-04-17).
- file contents match reference: constants and math cross-referenced with `reference/jobber-cli/lib/core/throttle-manager.js` (comments in `src/core/throttle-manager.ts` cite line numbers).
- code-review follow-ups applied before Phase 2: ThrottleEvents index-signature removed (now strictly typed); ThrottleManager.updateStatus Zod-validates input at the boundary (accepts `unknown`, rejects malformed); post-wait budget-restore race annotated; logger `getLevel` uses O(1) reverse map; rate-limiter reference citations split by function; config test now proves file-vs-env precedence against a real tempfile.

## Assumptions

- Reference ThrottleManager math is correct and already production-validated in v2.5.
- `.env` location is the workspace root, shared with v2.5.
- Node >=18 fetch/streams APIs are available; no polyfill needed for logger TTY detection.

## Blockers / Open Questions

- None known. Reopen if reference ThrottleManager formulas reveal ambiguity when ported.
