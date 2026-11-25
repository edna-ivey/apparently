# Build 22 Final Cleanup: Clean V1 Prelaunch Data Reset — Inventory

Companion reference for `supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql`
(the executable plan, STAGED, NOT APPLIED) and
`scripts/pglite-harness/run-clean-v1-reset-rehearsal-test.mjs` (the rehearsal proof, 27/27
checks passing against representative seeded data in an isolated PGlite instance). This
document is the readable summary; the migration file's own header comment is the authoritative,
more detailed version — if the two ever disagree, the migration file wins.

**Status:** prepared and rehearsed locally. **NOT applied anywhere.**

**Updated 2026-11-03 (deployment-safety review) — three corrections:**

1. **Physical isolation.** The reset file now lives under `supabase/manual_operations/`, NOT
   `supabase/migrations/` — the Supabase CLI only ever scans the latter for
   `push`/`migration list`/`db diff`, so this file is now structurally invisible to a normal
   deployment, not merely excluded by an informational list in a TypeScript script. See
   `supabase/manual_operations/README.md` and `scripts/verify-reset-isolation.ts` (a local
   mechanical filesystem proof). **Confirmed again, resumed session (2026-11-03), with a
   genuine read-only linked-project check**: `npx supabase migration list --linked` and
   `npx supabase db push --linked --dry-run` against the real linked production project
   (`apparently-you`, ref `rjslgjxlpsjljbrlxfet`) both show the reset file entirely absent from
   the remote comparison — this environment's `supabase` CLI is reachable via `npx supabase`
   even though the bare `supabase` binary is not on PATH. The mature-content sharing-block migration
   (`20261021150000_block_private_private_trouble_sharing.sql`) was also found miscategorized
   as "independent, do not bundle" despite being a hard prerequisite for this release — it is
   now a normal, ordinary member of `supabase/migrations/`, confirmed by the same proof script
   to be among the files a real push would apply.
2. **Old-client version guard.** A new migration,
   `supabase/migrations/20261102040000_submit_quiz_result_version_guard.sql`, makes the legacy
   `submit_quiz_result` RPC unconditionally reject every call with a clear
   `UPDATE_REQUIRED: ...` message and write NOTHING — not even the bare `quiz_results` history
   row it still wrote before this correction. This is a dependency of the reset (an old client
   must already be unable to recreate obsolete results before or after the reset), proven by
   `scripts/pglite-harness/run-submit-quiz-result-version-guard-test.mjs` (11/11 checks).
3. **Atomic cutover.** The `user_trait_totals`/`user_trait_active_totals` recalculation is now
   INSIDE the same transaction as the reset's deletes (previously: a required, separate manual
   script run afterward, leaving a window where the app could read stale pre-reset aggregates).
   There is no longer a second step to remember. The whole transaction also runs at
   `SERIALIZABLE` isolation, so it cannot silently interleave with a concurrent live write —
   Postgres aborts the conflicting side with SQLSTATE `40001` instead. **Resumed session
   (2026-11-03):** relying on isolation alone to abort a conflict is not the same as handling
   it, so `submitQuizCompletion` (`src/services/quiz-result-service.ts`) now catches exactly
   that `40001` and retries the RPC call once, automatically — a real completion that happens
   to land mid-reset self-heals instead of surfacing a bare failure to the submitting user.
   Client-side: `CREATURE_EVOLUTION_SCHEMA_VERSION` in `src/data/creature/creature-reveal-state.ts`
   was bumped 1→2 so a device's sticky, locally-cached Creature "first reveal" snapshot
   (computed from pre-reset evidence, otherwise never re-checked against the server) is
   discarded and recomputed fresh on the next load, shipped as an ordinary app update.

## Why

> "Apparently You is still in TestFlight. It has never been publicly launched. We do NOT need
> to preserve obsolete beta quiz scores, historical quiz results, or old personality evidence...
> Existing testers can retake all finalized quizzes."

This supersedes every earlier instruction in this engagement requiring preservation of/
compatibility with obsolete prelaunch quiz data.

## Affected-table inventory

| Table | Action | Scope |
|---|---|---|
| `user_quiz_completions` | DELETE (full) | all rows |
| `user_quiz_answers` | DELETE (full) | all rows |
| `quiz_results` | DELETE (full) | all rows — cascades `quiz_shares` → `compare_responses` |
| `quiz_shares` | DELETE (full, also cascades) | all rows |
| `compare_responses` | DELETE (full, also cascades) | all rows |
| `user_trait_evidence` | DELETE (filtered) | `WHERE source_type = 'quiz_answer'` only — Daily-sourced rows preserved |
| `personality_evidence` | DELETE (filtered) | `WHERE source_type = 'quiz_result'` only — Daily-sourced rows preserved |
| `personality_pole_evidence` | DELETE (full) | all rows — retired V2-interim architecture, zero live callers |
| `creature_published_recipes` | DELETE (full) | all rows |
| `creature_evolution_cycle_markers` | DELETE (full) | all rows |
| `user_known_creature_traits` | DELETE (full) | all rows |
| `evidence_expiry_job_state` | UPSERT the one job row | seeded to a 12-months-ago watermark matching the recalculation below, so the recurring job doesn't redundantly re-scan |
| `user_trait_totals`, `user_trait_active_totals` | **RECALCULATED, SAME TRANSACTION** | inline `INSERT ... ON CONFLICT` from whatever `user_trait_evidence` remains — no separate script, no post-reset window |

## Explicitly preserved (reviewed, not touched)

- `auth.users`, `public.profiles` — including `self_perception` (verified: raw onboarding
  self-report, never written by quiz/Daily scoring — there is no "personality-derived field"
  on `profiles` to strip) and `age_eligibility` (a legal attestation, not personality-derived).
- The final approved V1 catalog: `quizzes`, `quiz_questions`, `quiz_choices`,
  `quiz_choice_trait_awards`, `quiz_choice_result_weights`, `quiz_result_definitions`,
  `personality_dimensions`, `personality_traits`, `daily_questions`, `daily_options`,
  `daily_option_trait_awards`, `daily_rotation_state`. Already fully replaced (DELETE+INSERT,
  never additive) by the existing content-identity generator every run — nothing extra to clean.
- `daily_answers` and all Daily-sourced evidence — a separate, still-live, unrelated feature.
- `quiz_choice_pole_awards` — a static, already-superseded calibration table (not user data).
  Zero live readers, but left alone: no correctness risk either way, flagged as an optional,
  separate, lower-priority cleanup if the owner wants it gone too.
- RevenueCat/Apple product configuration, `analytics_events`, `push_tokens`,
  `notification_preferences`, `notification_outbox`, `admin_users` — unrelated operational data.

## Entitlements and tester access — explicitly NOT auto-decided

Per instruction: *"Do not assume a user with Apparently Private access made a purchase.
TestFlight transactions are sandbox transactions, not real charges. Check actual records before
deciding whether any entitlement or tester-access cleanup is needed."*

This reset does not touch `user_entitlements` or `tester_access_grants` at all. Before any
separate decision about these, run against the real project (read-only):

```sql
-- Real RevenueCat entitlement rows -- `environment` distinguishes a genuine sandbox
-- TestFlight transaction from a real production purchase. Never written by any client.
select user_id, entitlement_id, is_active, environment, product_id, last_verified_at
from public.user_entitlements
order by last_verified_at desc;

-- Explicit, admin-granted tester access -- never a purchase, unrelated to RevenueCat entirely.
select user_id, granted_by, note, created_at
from public.tester_access_grants
order by created_at desc;
```

Any cleanup here (e.g. revoking a QA account's tester grant) is a separate, manually-reviewed
owner decision, never bundled into this reset.

## Backup / rollback

The migration creates schema `_reset_backup_20261102` and copies every affected table's full
pre-reset contents into it, inside the SAME `SERIALIZABLE` transaction as the deletes and the
totals recalculation — so backup + delete + rebuild either all commit together, or (on any
error, including a concurrent-write conflict) the whole thing rolls back and NOTHING is lost or
partially applied. A commented-out, exact restore block (parent-before-child insert order)
lives at the bottom of the migration file. Retain the backup schema for a review window
(recommend ≥30 days) before a separate, explicit
`drop schema _reset_backup_20261102 cascade;`.

The migration also refuses to run a second time (raises an exception if
`_reset_backup_20261102` already exists) — it is deliberately not idempotent, so a second
accidental apply can never silently re-backup-and-delete an already-reset (now harmlessly
empty) set of tables and mask that mistake.

## The safe migration procedure, end to end

1. Apply the real engineering candidate set (`supabase/migrations/`, in chronological order,
   via a normal `supabase db push`) — this now includes the mature-content sharing block and
   the `submit_quiz_result` version guard, both ordinary migrations.
2. Ship the client update that bumps `CREATURE_EVOLUTION_SCHEMA_VERSION` (already part of the
   same code change set as the version-guard migration).
3. Separately, when explicitly authorized: apply
   `supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql` MANUALLY
   (`psql`/the SQL editor/`supabase db execute` targeted at this exact file — never
   `supabase db push`, which cannot see it).
4. Run the post-reset verification queries below against the real project.

## Post-reset verification

See the migration file's own commented SQL block (Step 4) for the exact copy-pasteable
queries: every reset-scope table at zero, totals already correctly recalculated with ZERO
query-detectable drift between `user_trait_totals` and a fresh sum of `user_trait_evidence`,
Daily evidence/users/profiles/entitlements/catalog counts unchanged from pre-reset, plus a
manual smoke test (complete a real quiz through the real app, confirm fresh evidence and
`is_first_completion = true`; attempt the legacy RPC from an old-client simulator and confirm
the `UPDATE_REQUIRED` rejection).

## Local rehearsal (already run, not against production)

`scripts/pglite-harness/run-clean-v1-reset-rehearsal-test.mjs` — an isolated PGlite instance,
seeded with the same "stub mirror of already-applied production schema" convention
`run-engineering-candidate-set-apply-test.mjs` already establishes (now including the version
guard), extended with representative pre-reset TestFlight data across every affected table (a
real quiz completion with real trait evidence AND a real pre-reset aggregate total, a Daily
answer, a share + a Compare response, a sandbox entitlement row, a tester-access grant, a
retired V2-pole-evidence row, a Creature trait marker) — then applies the real reset migration
and verifies all 8 required guarantees, including the atomic-cutover proof (a real non-zero
pre-reset total, verified zero immediately after the single transaction commits, with no
separate rebuild step, then correctly non-zero again after a post-reset retake). **27/27 checks
passing.** The old-client version guard itself (before/after reset, duplicate submissions,
sharing/Compare unaffected) is proven separately by
`scripts/pglite-harness/run-submit-quiz-result-version-guard-test.mjs` (11/11 checks).
