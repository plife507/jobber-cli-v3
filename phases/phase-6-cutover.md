# Phase 6 — Tests, Cutover, Archive

## Phase Status

pending

## Objective

Harden the suite, perform the user-facing cutover from v2.5 to v3.0, and archive the reference tree — with the writes gate still enforced and proven against live API.

## Scope

Test coverage sweep, live matrix run, documentation refresh, bin smoke, release tag. Touches repo-level docs only.

**Reference tree is preserved** (user decision 2026-04-17). `reference/jobber-cli/` stays in place so the currently-skipped calculation modules (creport / batch-html-report / client-report / visits-report / analyze-line-items / sort-jobs / searchpp / ProfitabilityCalculator / HTML report templates) remain available as a source-of-truth for any future cutover port. Future work on those modules is out of the v3.0.0 scope but can resume against the same reference tree.

## Tasks

- [ ] Full test suite sweep; fill coverage gaps surfaced from Phases 1–5
- [ ] End-to-end live test matrix (`JOBBER_TEST_LIVE=1`): status, token, get, query, one mutation command (writes-enabled, sandbox-safe target)
- [ ] README + usage docs updated for v3
- [ ] `bin/jobber.js` verified as the user-facing entry post-build
- [ ] Update workspace `CLAUDE.md` "Current Focus" note when user confirms cutover
- [ ] Preserve `reference/jobber-cli/` — explicitly NOT archived, retained as source for the deferred calculation-module port work (user decision)
- [ ] Tag release `v3.0.0`

## Gates

- [ ] `yarn typecheck` clean
- [ ] `yarn lint` clean
- [ ] `yarn test` — full suite green
- [ ] `yarn build` produces a working `bin/jobber.js` (smoke: `node bin/jobber.js status`)
- [ ] **Mutation-gate check (required)**: fresh-env run with `JOBBER_WRITES_ENABLED` unset refuses every mutation command
- [ ] **Mutation-gate live check (required)**: with `JOBBER_WRITES_ENABLED=1` against sandbox-safe target, at least one mutation command succeeds end-to-end and is recorded
- [ ] Live read-only matrix run recorded (`JOBBER_TEST_LIVE=1 yarn test`)
- [ ] v3 README published; v2.5 usage references removed or redirected
- [ ] Git tag `v3.0.0` present

## Pass Criteria

- All gates recorded in Evidence.
- No prior phase has unresolved blockers carried forward.
- Writes gate remains default-off in shipped `v3.0.0`.

## Evidence

- typecheck:
- lint:
- full vitest:
- build + bin smoke:
- writes-gate fresh-env refusal:
- writes-gate live mutation success:
- live read-only matrix:
- README update commit:
- user confirmation for archival:
- v3.0.0 tag:

## Assumptions

- `reference/jobber-cli/` is preserved, not archived (user decision 2026-04-17) so the deferred calculation modules remain portable later.
- All Phase 1–5 gates are green before this phase starts.

## Live mutation gate — execution details (user-supplied 2026-04-17)

- **Test job number**: `12241` — use for both the writes-gate refusal (unset env) and the live mutation success (`JOBBER_WRITES_ENABLED=1`).
- **Planned live mutation**: `job-expense create 12241 --title "phase-6 gate check" --date <ISO> --total 0.01` followed by a `job-expense delete --expense-id <returned id>` so the test leaves no lingering record. `job-note create/delete` on 12241 is an acceptable alternate.
- **Re-auth prerequisite**: user has enabled expenses + job writes on the Jobber side but the cached access token may have been issued before that scope was granted. Run `python3 ../oauth/jobber_oauth_manager.py oauth-refresh` (or `authorize` if refresh fails) BEFORE the live mutation gate runs, then re-read the token via the OAuth subprocess shim.
- **Abort conditions**: any non-200 on the first mutation call that is NOT a throttle/auth retry → stop and surface the error; do not retry blindly against the real account.

## Blockers / Open Questions

- None. Reference archival is cancelled; sandbox target = job 12241; re-auth step is documented above.
