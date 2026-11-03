-- ============================================================================================
-- STRUCTURALLY ISOLATED FROM THE NORMAL MIGRATION PATH. This file lives under
-- supabase/manual_operations/, NOT supabase/migrations/ -- `supabase db push`/`supabase
-- migration list`/`supabase db diff` only ever scan supabase/migrations/*.sql by Supabase
-- CLI convention, so this file is structurally invisible to them, not merely excluded by an
-- informational allowlist. See supabase/manual_operations/README.md for the full isolation
-- rationale and scripts/verify-reset-isolation.ts for a mechanical proof this file is where
-- it claims to be and is absent from supabase/migrations/.
--
-- STAGED, NOT APPLIED. Requires EXPLICIT, SEPARATE owner authorization, applied MANUALLY
-- (`psql`/the Supabase SQL editor/`supabase db execute` against a specific file -- never
-- `supabase db push`) against a rehearsed-first, real, connected Supabase project, and only
-- AFTER both (a) the real engineering candidate set in the deployment manifest §1 is live, and
-- (b) the client-side compatibility-version bump this reset DEPENDS ON (migration
-- 20261102040000_submit_quiz_result_version_guard.sql, see its own header) is live. Nothing in
-- this file has been executed in this environment -- it is a prepared, reviewed, rehearsed
-- plan, not an action already taken.
--
-- Build 22 final cleanup round (2026-11-02), item 1: "Apparently You is still in TestFlight.
-- It has never been publicly launched. We do NOT need to preserve obsolete beta quiz scores,
-- historical quiz results, or old personality evidence... Existing testers can retake all
-- finalized quizzes." This is a controlled, ONE-TIME, reviewable reset of exactly that
-- prelaunch data -- not a schema change, and must never be re-applied twice (it is NOT
-- idempotent by design -- see the backup-table guard below, which refuses a second run against
-- the same reset date rather than silently re-truncating an already-clean table).
--
-- CORRECTED (deployment-safety review, 2026-11-03), item 3: the reset and the
-- user_trait_totals/user_trait_active_totals recalculation are now ONE atomic transaction
-- (previously: a required but separate manual follow-up script, leaving a window where the
-- app could read stale pre-reset aggregate totals after the per-row evidence was already
-- deleted). See STEP 3 below -- there is no longer a second step to remember to run.
--
-- ============================================================================================
-- WHAT THIS RESETS (user-generated prelaunch data) vs. WHAT IT PRESERVES
-- ============================================================================================
--
-- RESETS (deleted, after a full backup copy -- see STEP 1):
--   1. user_quiz_completions       -- first-completion reservation per (user, quiz)
--   2. user_quiz_answers           -- permanent per-question answer rows backing trait evidence
--   3. quiz_results                -- full completion/history rows (cascades quiz_shares,
--                                      which in turn cascades compare_responses -- see STEP 2)
--   4. user_trait_evidence         -- ONLY rows WHERE source_type = 'quiz_answer' (the real
--                                      numeric Core/Private evidence engine). Daily-sourced
--                                      rows (source_type = 'daily_answer') are a SEPARATE,
--                                      still-live, unrelated feature and are deliberately left
--                                      untouched -- "preserve... unrelated operational data."
--   5. personality_evidence        -- ONLY rows WHERE source_type = 'quiz_result' (the older,
--                                      still-live V1 "You" profile display engine). Its
--                                      'daily_answer' rows are left untouched for the same
--                                      reason as #4.
--   6. personality_pole_evidence   -- FULL reset. This is the interim V2-pole architecture,
--                                      confirmed to have ZERO live client callers today (see
--                                      the Build 22 final report, item 2) -- fully superseded
--                                      by user_trait_evidence. Resetting it is cleanup, not a
--                                      functional change.
--   7. creature_published_recipes, creature_evolution_cycle_markers,
--      user_known_creature_traits  -- per-user Creature caches/markers DERIVED FROM the
--                                      personality evidence above; stale once that evidence is
--                                      gone. (creature_published_recipes has no publish RPC
--                                      wired up yet per the manifest, so this is very likely
--                                      already empty in practice -- reset for correctness
--                                      regardless.)
--
-- REBUILT, IN THE SAME TRANSACTION AS THE DELETES ABOVE (STEP 3 -- no separate manual step):
--   user_trait_totals, user_trait_active_totals -- recomputed from whatever user_trait_evidence
--   rows remain immediately after STEP 2's deletes, inside the SAME transaction, so there is
--   no window where the app could read stale pre-reset aggregates. evidence_expiry_job_state's
--   watermark is seeded (not merely cleared) to match, so the recurring expiry job does not
--   redundantly re-scan what this reset already correctly computed.
--
-- CLIENT-SIDE CACHE INVALIDATION (handled OUTSIDE this SQL file, in the same release):
--   src/data/creature/creature-reveal-state.ts's CREATURE_EVOLUTION_SCHEMA_VERSION was bumped
--   1 -> 2. A device's locally-cached Creature "first reveal" snapshot is sticky (never
--   recomputed from fresh server data once set) -- the version bump forces every device to
--   discard its pre-reset local cache and recompute fresh from the post-reset server state the
--   next time the Creature screen loads. This ships as an ordinary app update; it is not part
--   of this SQL file because it is not a database change.
--
-- EXPLICITLY NOT TOUCHED BY THIS FILE (reviewed and intentionally excluded):
--   - auth.users, public.profiles (including self_perception -- verified NOT personality-
--     derived; it is raw onboarding self-report input, never written by quiz/Daily scoring)
--     and age_eligibility (a legal attestation, not personality-derived either).
--   - quizzes, quiz_questions, quiz_choices, quiz_choice_trait_awards,
--     quiz_choice_result_weights, quiz_result_definitions, personality_dimensions,
--     personality_traits, daily_questions, daily_options, daily_option_trait_awards,
--     daily_rotation_state -- the final approved V1 catalog content. These are already fully
--     replaced (DELETE+INSERT, never additive) by the existing content-identity generator
--     every time it runs, so there is no "obsolete content version" residue to separately
--     clean here as long as the normal generator-driven migrations (already in the
--     engineering candidate set) are applied in order.
--   - daily_answers, daily_rotation_state -- Daily is a separate, still-live, ongoing feature
--     unrelated to this quiz-launch reset; only its DERIVED personality_evidence/
--     user_trait_evidence rows are ever referenced above, and only to explicitly SKIP them.
--   - quiz_choice_pole_awards -- an older, fully-superseded calibration table (server-side
--     mirror for the retired V2-pole architecture). Confirmed zero live readers. NOT included
--     in this automated reset because it is static catalog content, not user data, and
--     carries zero correctness risk either way -- noted in the Build 22 final report as an
--     optional, separate, lower-priority cleanup item, not part of this user-data reset.
--   - user_entitlements, tester_access_grants -- EXPLICITLY NOT auto-reset. Per the owner's
--     own instruction: "Do not assume a user with Apparently Private access made a purchase.
--     TestFlight transactions are sandbox transactions, not real charges. Check actual records
--     before deciding." See the read-only inspection queries in
--     docs/BUILD_22_V1_RESET_INVENTORY.md -- any cleanup here is a SEPARATE, manually-reviewed
--     owner decision, never bundled into this reset.
--   - RevenueCat/Apple product configuration, analytics_events, push_tokens,
--     notification_preferences, notification_outbox, admin_users -- unrelated operational
--     data, explicitly preserved per instruction.
--
-- ============================================================================================
-- BACKUP / ROLLBACK STRATEGY
-- ============================================================================================
-- STEP 1 copies every affected table's CURRENT full contents into a dedicated, clearly-named
-- backup schema (_reset_backup_20261102) before anything is deleted, inside the SAME
-- transaction as the deletes and the totals rebuild -- so backup + delete + rebuild either all
-- commit together, or (on any error, including a concurrent-write serialization conflict --
-- see the isolation level below) the whole thing rolls back and NOTHING is lost or partially
-- applied, including the backup itself never partially existing.
--
-- To roll back AFTER a successful apply (i.e., restore the pre-reset state):
--   insert into public.<table> select * from _reset_backup_20261102.<table>;
-- for each affected table, in REVERSE of the deletion order below (parents before children
-- this time, since foreign keys must already exist for a child row to insert) -- see the
-- explicit restore block at the bottom of this file (commented out, never auto-run).
--
-- The backup schema is intentionally NOT dropped by this migration. Retain it for a defined
-- review window (recommend >=30 days post-reset) before a separate, explicit
-- `drop schema _reset_backup_20261102 cascade;` once the owner confirms the reset is final.
-- ============================================================================================

-- SERIALIZABLE: the full reset (backup + delete + totals rebuild) must never interleave with
-- a concurrent live write (e.g. a real user completing a quiz, or the recurring expiry job)
-- in a way that could silently compute incorrect totals. Postgres DETECTS any such conflict
-- and ABORTS this transaction with a retriable serialization_failure instead of committing an
-- inconsistent result -- this entire file is safe to simply re-run from the top on that error
-- (the "refuse to run twice" guard below only fires on a genuine prior SUCCESS, since the
-- backup schema itself is rolled back along with everything else on any abort).
begin transaction isolation level serializable;

-- Guard: refuse to run twice. A second accidental apply against an already-reset database
-- would otherwise silently back up (and then delete) an already-empty set of tables, masking
-- the mistake instead of failing loudly.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = '_reset_backup_20261102') then
    raise exception 'Reset backup schema _reset_backup_20261102 already exists -- this reset has already been applied successfully once. Refusing to run again. Review the existing backup schema before deciding how to proceed.';
  end if;
end $$;

-- ============================================================================================
-- STEP 1: BACKUP -- full snapshot of every affected table, before any delete.
-- ============================================================================================

create schema _reset_backup_20261102;

create table _reset_backup_20261102.user_quiz_completions as select * from public.user_quiz_completions;
create table _reset_backup_20261102.user_quiz_answers as select * from public.user_quiz_answers;
create table _reset_backup_20261102.quiz_results as select * from public.quiz_results;
create table _reset_backup_20261102.quiz_shares as select * from public.quiz_shares;
create table _reset_backup_20261102.compare_responses as select * from public.compare_responses;
create table _reset_backup_20261102.user_trait_evidence_quiz_sourced as
  select * from public.user_trait_evidence where source_type = 'quiz_answer';
create table _reset_backup_20261102.personality_evidence_quiz_sourced as
  select * from public.personality_evidence where source_type = 'quiz_result';
create table _reset_backup_20261102.personality_pole_evidence as select * from public.personality_pole_evidence;
create table _reset_backup_20261102.creature_published_recipes as select * from public.creature_published_recipes;
create table _reset_backup_20261102.creature_evolution_cycle_markers as select * from public.creature_evolution_cycle_markers;
create table _reset_backup_20261102.user_known_creature_traits as select * from public.user_known_creature_traits;
create table _reset_backup_20261102.evidence_expiry_job_state as select * from public.evidence_expiry_job_state;
-- Backed up for rollback convenience even though STEP 3 below recomputes (never restores)
-- these two tables going forward.
create table _reset_backup_20261102.user_trait_totals as select * from public.user_trait_totals;
create table _reset_backup_20261102.user_trait_active_totals as select * from public.user_trait_active_totals;

comment on schema _reset_backup_20261102 is
  'Full pre-reset snapshot of every table affected by 20261102030000_clean_v1_prelaunch_data_reset.sql (supabase/manual_operations/), taken inside the same transaction as the reset itself. Retain for a review window before a separate, explicit DROP SCHEMA ... CASCADE.';

-- ============================================================================================
-- STEP 2: DELETE, in dependency order (children before parents; explicit, not relying
-- silently on CASCADE, even where a CASCADE exists -- see the header's table-by-table list).
-- ============================================================================================

-- compare_responses cascades from quiz_shares (share_id references quiz_shares(id) on delete
-- cascade), which itself cascades from quiz_results (quiz_result_id references quiz_results(id)
-- on delete cascade). Deleted explicitly here, in order, for auditability rather than relying
-- on cascade to do it implicitly three tables down.
delete from public.compare_responses;
delete from public.quiz_shares;
delete from public.user_quiz_completions;
delete from public.quiz_results;
delete from public.user_quiz_answers;

delete from public.user_trait_evidence where source_type = 'quiz_answer';
delete from public.personality_evidence where source_type = 'quiz_result';
delete from public.personality_pole_evidence;

delete from public.creature_published_recipes;
delete from public.creature_evolution_cycle_markers;
delete from public.user_known_creature_traits;

-- ============================================================================================
-- STEP 3: RECALCULATE user_trait_totals/user_trait_active_totals, IN THE SAME TRANSACTION AS
-- STEP 2's deletes -- identical logic to scripts/rebuild-user-trait-totals.ts, inlined here so
-- there is no window between "evidence deleted" and "aggregates recomputed" during which the
-- app could read stale totals. Idempotent (INSERT ... ON CONFLICT DO UPDATE, then a cleanup
-- DELETE for any trait a user no longer has ANY evidence for at all) and safe to be part of
-- the same atomic unit as the deletes above.
-- ============================================================================================

insert into public.user_trait_totals (user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at)
select
  user_id, trait_id,
  sum(points_earned), sum(max_available),
  count(*) filter (where points_earned > 0),
  count(*),
  now()
from public.user_trait_evidence
group by user_id, trait_id
on conflict (user_id, trait_id) do update set
  lifetime_earned = excluded.lifetime_earned,
  max_available_total = excluded.max_available_total,
  distinct_questions_with_earned = excluded.distinct_questions_with_earned,
  distinct_questions_presented = excluded.distinct_questions_presented,
  updated_at = excluded.updated_at;

delete from public.user_trait_totals
where not exists (select 1 from public.user_trait_evidence e where e.user_id = user_trait_totals.user_id and e.trait_id = user_trait_totals.trait_id);

insert into public.user_trait_active_totals (user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at)
select
  user_id, trait_id,
  sum(points_earned), sum(max_available),
  count(*) filter (where points_earned > 0),
  count(*),
  now()
from public.user_trait_evidence
where created_at >= now() - interval '12 months'
group by user_id, trait_id
on conflict (user_id, trait_id) do update set
  lifetime_earned = excluded.lifetime_earned,
  max_available_total = excluded.max_available_total,
  distinct_questions_with_earned = excluded.distinct_questions_with_earned,
  distinct_questions_presented = excluded.distinct_questions_presented,
  updated_at = excluded.updated_at;

delete from public.user_trait_active_totals
where not exists (
  select 1 from public.user_trait_evidence e
  where e.user_id = user_trait_active_totals.user_id and e.trait_id = user_trait_active_totals.trait_id
    and e.created_at >= now() - interval '12 months'
);

-- Seed (not merely clear) the expiry job's watermark to match what this transaction already
-- correctly computed above -- avoids a redundant full re-scan on the job's next run, and
-- (unlike a bare DELETE of this row) requires no NOT NULL workaround.
insert into public.evidence_expiry_job_state (job_name, last_cutoff_processed)
values ('expire_stale_active_evidence', now() - interval '12 months')
on conflict (job_name) do update set last_cutoff_processed = greatest(evidence_expiry_job_state.last_cutoff_processed, excluded.last_cutoff_processed);

commit;

-- ============================================================================================
-- STEP 4: POST-RESET VERIFICATION QUERIES (read-only -- run these, do not just assume success)
-- ============================================================================================
-- select count(*) as should_be_zero from public.user_quiz_completions;
-- select count(*) as should_be_zero from public.user_quiz_answers;
-- select count(*) as should_be_zero from public.quiz_results;
-- select count(*) as should_be_zero from public.quiz_shares;
-- select count(*) as should_be_zero from public.compare_responses;
-- select count(*) as should_be_zero from public.user_trait_evidence where source_type = 'quiz_answer';
-- select count(*) as should_be_zero from public.personality_evidence where source_type = 'quiz_result';
-- select count(*) as should_be_zero from public.personality_pole_evidence;
-- select count(*) as should_be_zero from public.creature_published_recipes;
-- select count(*) as should_be_zero from public.creature_evolution_cycle_markers;
-- select count(*) as should_be_zero from public.user_known_creature_traits;
--
-- -- Totals must ALREADY be correct immediately after this transaction commits -- no separate
-- -- rebuild step to remember. For any user with ONLY Daily evidence (no quiz evidence ever),
-- -- confirm their totals exactly equal their Daily-only evidence sum (no quiz contribution
-- -- survives, no double-count, no stale leftover row for a trait they no longer have evidence
-- -- for at all):
-- select t.user_id, t.trait_id, t.lifetime_earned,
--        (select coalesce(sum(points_earned),0) from user_trait_evidence e where e.user_id = t.user_id and e.trait_id = t.trait_id) as recomputed_from_evidence
-- from user_trait_totals t
-- where t.lifetime_earned <> (select coalesce(sum(points_earned),0) from user_trait_evidence e where e.user_id = t.user_id and e.trait_id = t.trait_id);
-- -- ^ must return ZERO rows -- any row here means totals and evidence have drifted apart.
--
-- -- Daily evidence/users/catalog must be COMPLETELY UNTOUCHED (counts match pre-reset):
-- select count(*) as daily_evidence_preserved from public.user_trait_evidence where source_type = 'daily_answer';
-- select count(*) as daily_v1_evidence_preserved from public.personality_evidence where source_type = 'daily_answer';
-- select count(*) as users_preserved from auth.users;
-- select count(*) as profiles_preserved from public.profiles;
-- select count(*) as entitlements_preserved from public.user_entitlements;
-- select count(*) as tester_grants_preserved from public.tester_access_grants;
--
-- -- Final approved catalog must be fully intact (30 quizzes as of this round -- see the Build
-- -- 22 final report for the exact current count, which legitimately grows with future quizzes):
-- select count(*) as quiz_catalog_row_count from public.quizzes;
--
-- -- A retake must be possible and earn fresh evidence (manual smoke test, not a query): have a
-- -- test account complete any finalized quiz through the real app and confirm
-- -- user_trait_evidence gains new quiz_answer rows and is_first_completion = true.
-- -- An OLD (pre-cutover) client attempting to submit must receive the update-required
-- -- rejection from the version-guard migration (20261102040000), never a successful insert.
-- ============================================================================================

-- ============================================================================================
-- ROLLBACK (commented out -- never auto-run; execute manually, in this exact parent-before-
-- child order, only if the reset above needs to be reversed):
-- ============================================================================================
-- begin;
-- insert into public.quiz_results select * from _reset_backup_20261102.quiz_results;
-- insert into public.user_quiz_completions select * from _reset_backup_20261102.user_quiz_completions;
-- insert into public.user_quiz_answers select * from _reset_backup_20261102.user_quiz_answers;
-- insert into public.quiz_shares select * from _reset_backup_20261102.quiz_shares;
-- insert into public.compare_responses select * from _reset_backup_20261102.compare_responses;
-- insert into public.user_trait_evidence select * from _reset_backup_20261102.user_trait_evidence_quiz_sourced;
-- insert into public.personality_evidence select * from _reset_backup_20261102.personality_evidence_quiz_sourced;
-- insert into public.personality_pole_evidence select * from _reset_backup_20261102.personality_pole_evidence;
-- insert into public.creature_published_recipes select * from _reset_backup_20261102.creature_published_recipes;
-- insert into public.creature_evolution_cycle_markers select * from _reset_backup_20261102.creature_evolution_cycle_markers;
-- insert into public.user_known_creature_traits select * from _reset_backup_20261102.user_known_creature_traits;
-- delete from public.user_trait_totals;
-- insert into public.user_trait_totals select * from _reset_backup_20261102.user_trait_totals;
-- delete from public.user_trait_active_totals;
-- insert into public.user_trait_active_totals select * from _reset_backup_20261102.user_trait_active_totals;
-- insert into public.evidence_expiry_job_state select * from _reset_backup_20261102.evidence_expiry_job_state
--   on conflict (job_name) do update set last_cutoff_processed = excluded.last_cutoff_processed;
-- commit;
