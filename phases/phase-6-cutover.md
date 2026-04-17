# Phase 6 — Tests, Cutover, Archive

## Phase Status

pending

## Objective

Harden the suite, perform the user-facing cutover from v2.5 to v3.0, and archive the reference tree — with the writes gate still enforced and proven against live API.

## Scope

Test coverage sweep, live matrix run, documentation refresh, bin smoke, reference archival, release tag. Touches repo-level docs and, on user confirmation, removal/relocation of `reference/jobber-cli/`.

## Tasks

- [ ] Full test suite sweep; fill coverage gaps surfaced from Phases 1–5
- [ ] End-to-end live test matrix (`JOBBER_TEST_LIVE=1`): status, token, get, query, one reporting command, one mutation command (writes-enabled, sandbox-safe target)
- [ ] README + usage docs updated for v3
- [ ] `bin/jobber.js` verified as the user-facing entry post-build
- [ ] Update workspace `CLAUDE.md` "Current Focus" note when user confirms cutover
- [ ] Archive `reference/jobber-cli/` — remove or relocate to labeled archive path (user decision; do not remove unilaterally)
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
- [ ] User confirmation obtained before reference archival
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

- User has re-enabled API writes on the Jobber side by the time this phase runs, or has a sandbox target available for the live mutation gate.
- Archival of `reference/` is acceptable post-cutover (subject to user confirmation).
- All Phase 1–5 gates are green before this phase starts.

## Blockers / Open Questions

- Sandbox-safe target for the live mutation check — which account/resource? Resolve with user before running live mutation gate.
- Archive destination — delete, move to `archive/jobber-cli-v2.5/`, or separate repo? Resolve with user before executing.
