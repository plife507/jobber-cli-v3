# TODO — jobber-cli-v3 Port

Authoritative operational doc for the v2.5 JS → v3.0 TS port. Drives day-to-day work.

- High-level summary (unchanged, static): [`PHASES.md`](./PHASES.md)
- Ground rules (workspace): [`../CLAUDE.md`](../CLAUDE.md)
- Per-phase specs + gates + evidence: [`phases/`](./phases/)

`PHASES.md` is the at-a-glance roadmap. `TODO.md` + `phases/*.md` are the source of truth for what is active, what must pass to close a phase, and what evidence has been captured.

## Active Phase

**None — v3.0.0 shipped 2026-04-17.** Reference tree preserved for a future calculation-module port.

## Phase Status

| # | Phase | Doc | Status | Gates |
|---|---|---|---|---|
| 0 | Scaffold | [phase-0-scaffold.md](./phases/phase-0-scaffold.md) | complete | passed (initial commit) |
| 1 | Core | [phase-1-core.md](./phases/phase-1-core.md) | complete | passed 2026-04-17 |
| 2 | GraphQL client + codegen | [phase-2-graphql.md](./phases/phase-2-graphql.md) | complete | passed 2026-04-17 |
| 3 | Schema + error handler | [phase-3-schema.md](./phases/phase-3-schema.md) | complete | passed 2026-04-17 |
| 4 | BaseCommand + registry + status/token/get | [phase-4-base-commands.md](./phases/phase-4-base-commands.md) | complete | passed 2026-04-17 |
| 5 | Schema-based transport commands (7 total) | [phase-5-commands.md](./phases/phase-5-commands.md) | complete | passed 2026-04-17 (scope narrowed — report/calculation commands permanently out of scope) |
| 6 | Tests + cutover + release | [phase-6-cutover.md](./phases/phase-6-cutover.md) | complete | passed 2026-04-17 (live writes-gate proven on job 12241; v3.0.0 tag applied) |

## Rules of Engagement

1. Do not declare a phase complete until every gate in its doc has recorded evidence.
2. Evidence = command invocation + result, or file path + short note. Not prose.
3. Feature parity first — port semantics from `reference/jobber-cli/`, no redesigns.
4. All GraphQL goes through the typed client's `executeQuery` (throttle-aware).
5. Mutations stay refused unless `JOBBER_WRITES_ENABLED=1`. Phases 5 and 6 must prove this gate.
6. Do not fork token storage or rewrite OAuth Python — shell out to it.

## Workflow per Phase

1. Open the phase doc.
2. Execute tasks under the listed constraints.
3. Run gate commands. Paste results into Evidence.
4. Flip status in this table to `complete` only when all gates pass.
5. Advance Active Phase pointer to the next doc.
