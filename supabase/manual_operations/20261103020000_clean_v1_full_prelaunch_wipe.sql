-- ============================================================================================
-- STRUCTURALLY ISOLATED FROM THE NORMAL MIGRATION PATH. Lives under supabase/manual_operations/,
-- NOT supabase/migrations/ -- `supabase db push`/`migration list`/`db diff` only ever scan
-- supabase/migrations/*.sql, so this file is structurally invisible to them, not merely
-- excluded by an informational allowlist. See supabase/manual_operations/README.md and
-- scripts/verify-reset-isolation.ts.
--
-- STAGED, NOT APPLIED. Requires EXPLICIT, SEPARATE owner authorization, applied MANUALLY
-- (`psql`/the Supabase SQL editor/`supabase db execute` against this exact file -- never
-- `supabase db push`), only AFTER (a) the 21-file engineering candidate set is live, and
-- (b) 20261102040000_submit_quiz_result_version_guard.sql (part of that set) is live. Nothing
-- in this file has been executed in this environment.
--
-- SUPERSEDES supabase/manual_operations/20261102030000_clean_v1_prelaunch_data_reset.sql,
-- which preserved every consumer's auth identity, profile, Daily history, and tester/
-- entitlement grants -- an owner-confirmed, final, LATER decision: "That is no longer the
-- desired final launch state." That earlier file is retained for historical record only (moved
-- to supabase/migrations_archive/ alongside this migration going live) -- it must never be
-- applied; this file is now the one authoritative prelaunch reset.
--
-- ============================================================================================
-- WHAT THIS DOES: deletes every consumer/tester identity and everything linked to one,
-- preserving EXACTLY ONE admin identity, by deleting from auth.users directly.
-- ============================================================================================
--
-- `public.admin_users.user_id` carries `ON DELETE CASCADE` back to `auth.users.id`, and so
-- does every one of the following 17 user-linked tables (confirmed directly against the real
-- schema, not assumed): profiles, user_entitlements, tester_access_grants, quiz_results,
-- quiz_shares (which itself cascades to compare_responses), user_quiz_completions,
-- user_quiz_answers, user_trait_evidence, user_trait_totals, user_trait_active_totals,
-- personality_evidence, personality_pole_evidence, creature_published_recipes,
-- creature_evolution_cycle_markers, daily_answers, admin_users itself. Two columns reference
-- auth.users with ON DELETE SET NULL by design, correctly preserving the referencing row
-- rather than deleting it: daily_questions.approved_by and tester_access_grants.granted_by
-- (attribution only -- deleting the admin who approved a question must never delete the
-- question). A single `DELETE FROM auth.users WHERE id <> <preserved admin id>` therefore
-- correctly and atomically removes every consumer-linked row across all of the above, with
-- zero manual per-table deletes to keep in sync as the schema grows -- a structural guarantee,
-- not a hand-maintained list that can silently drift out of date. Auth's own internal schema
-- (auth.sessions, auth.refresh_tokens, auth.identities, etc. -- not covered by our own
-- migrations) cascades the same way inside Supabase's own platform-managed auth schema.
--
-- Two tables mentioned in the owner's directive -- analytics/session data and notification
-- tokens/device registrations -- do not exist in this schema at all yet (they are part of the
-- 4 "independent, unrelated" migrations -- analytics_events, push_notifications_schema, etc. --
-- never part of this release's candidate set, not yet reviewed, not applied). There is
-- currently nothing to clean up there. If and when those migrations are ever adopted, confirm
-- their own user_id column also carries ON DELETE CASCADE back to auth.users before relying on
-- this same cascade design to cover them -- do not assume it without checking.
--
-- WHAT THIS PRESERVES: exactly one auth.users row (the real owner/admin identity, verified by
-- its own admin_users membership, never guessed or hardcoded), platform roles, every migration,
-- the full approved quiz/Daily catalog and content tables (quizzes, quiz_questions,
-- quiz_choices, daily_questions, daily_options, daily_option_trait_awards,
-- personality_dimensions, personality_traits, quiz_result_definitions,
-- quiz_choice_result_weights, daily_rotation_state -- none of these carry a user_id column at
-- all; they are editorial/catalog content, not consumer data, and are never touched here),
-- billing product configuration (unrelated to this database entirely -- lives in App Store
-- Connect/RevenueCat, not Supabase), and `evidence_expiry_job_state` (a single global job
-- watermark row, not consumer data -- left untouched; the active-evidence-expiry job continues
-- to work correctly for whatever evidence a brand-new user earns after this reset).
--
-- WHAT THIS DOES NOT DECIDE: real RevenueCat purchase/transaction records are NOT stored in
-- this database at all (user_entitlements only mirrors already-verified entitlement state, is
-- deleted here along with its user, and is independently re-derivable from RevenueCat's own
-- records at any time via a restore). This migration does not touch RevenueCat, App Store
-- Connect, or Apple's own transaction ledger -- those have their own retention rules this
-- migration cannot and does not override. If the one preserved admin identity has a real
-- (non-sandbox) purchase on file, confirm that account's restore path before this reset, since
-- its own user_entitlements row IS deleted along with every other consumer's (the admin is
-- preserved as an auth/profile identity, not specially exempted from the entitlements wipe --
-- flagged here for explicit owner awareness, not silently special-cased).
--
-- VERIFICATION GUARD: aborts if admin_users does not contain EXACTLY ONE 'owner' row at the
-- moment this runs -- refuses to guess which identity to preserve, and refuses to proceed if
-- the owner population has drifted from the single-admin assumption this migration is built
-- on. Also refuses a second run (checks for the backup schema's existence first), same
-- non-idempotent-by-design convention as the migration this supersedes.
-- ============================================================================================

begin transaction isolation level serializable;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = '_reset_backup_20261103') then
    raise exception 'Backup schema _reset_backup_20261103 already exists -- this reset has already been run once. Refusing to run it again (not idempotent by design). If you intend a second, separate reset, use a new backup schema name and re-review this file first.';
  end if;
end $$;

-- STEP 0: identify and lock in the one identity to preserve. Fails loudly, not silently, if
-- the admin population is not exactly what this migration assumes.
do $$
declare
  v_owner_count int;
begin
  select count(*) into v_owner_count from public.admin_users where role = 'owner';
  if v_owner_count <> 1 then
    raise exception 'Expected exactly 1 admin_users row with role = ''owner'', found %. Refusing to guess which identity to preserve -- resolve the admin_users table to exactly one owner row before running this reset.', v_owner_count;
  end if;
end $$;

-- STEP 1: full backup, including auth.users itself (never covered by a standard pg_dump, but
-- fully readable/copyable here via plain SQL under this connection's own privileges) and every
-- consumer-linked table, before anything is deleted.
create schema _reset_backup_20261103;

create table _reset_backup_20261103.auth_users as table auth.users;
create table _reset_backup_20261103.admin_users as table public.admin_users;
create table _reset_backup_20261103.profiles as table public.profiles;
create table _reset_backup_20261103.user_entitlements as table public.user_entitlements;
create table _reset_backup_20261103.tester_access_grants as table public.tester_access_grants;
create table _reset_backup_20261103.quiz_results as table public.quiz_results;
create table _reset_backup_20261103.quiz_shares as table public.quiz_shares;
create table _reset_backup_20261103.compare_responses as table public.compare_responses;
create table _reset_backup_20261103.user_quiz_completions as table public.user_quiz_completions;
create table _reset_backup_20261103.user_quiz_answers as table public.user_quiz_answers;
create table _reset_backup_20261103.user_trait_evidence as table public.user_trait_evidence;
create table _reset_backup_20261103.user_trait_totals as table public.user_trait_totals;
create table _reset_backup_20261103.user_trait_active_totals as table public.user_trait_active_totals;
create table _reset_backup_20261103.personality_evidence as table public.personality_evidence;
create table _reset_backup_20261103.personality_pole_evidence as table public.personality_pole_evidence;
create table _reset_backup_20261103.creature_published_recipes as table public.creature_published_recipes;
create table _reset_backup_20261103.creature_evolution_cycle_markers as table public.creature_evolution_cycle_markers;
create table _reset_backup_20261103.daily_answers as table public.daily_answers;

-- STEP 2: the single cascading delete. Everything listed in this file's own header comment is
-- removed as a direct consequence of this one statement -- there is no second step, and
-- nothing here can be accidentally skipped because it was left out of a hand-maintained list.
delete from auth.users
where id <> (select user_id from public.admin_users where role = 'owner');

-- STEP 3: verification. Every check below must pass before this transaction is allowed to
-- commit -- a failure here rolls back the ENTIRE reset (backup included), never leaves a
-- partially-applied state.
do $$
declare
  v_remaining_users int;
  v_remaining_admin int;
  v_remaining_profiles int;
  v_remaining_quiz_results int;
  v_remaining_daily_answers int;
  v_remaining_entitlements int;
  v_remaining_tester_grants int;
  v_catalog_quizzes int;
  v_catalog_daily_questions int;
begin
  select count(*) into v_remaining_users from auth.users;
  select count(*) into v_remaining_admin from public.admin_users;
  select count(*) into v_remaining_profiles from public.profiles;
  select count(*) into v_remaining_quiz_results from public.quiz_results;
  select count(*) into v_remaining_daily_answers from public.daily_answers;
  select count(*) into v_remaining_entitlements from public.user_entitlements;
  select count(*) into v_remaining_tester_grants from public.tester_access_grants;
  select count(*) into v_catalog_quizzes from public.quizzes;
  select count(*) into v_catalog_daily_questions from public.daily_questions;

  if v_remaining_users <> 1 then
    raise exception 'Expected exactly 1 remaining auth.users row after the reset, found %. Aborting -- rolling back.', v_remaining_users;
  end if;
  if v_remaining_admin <> 1 then
    raise exception 'Expected exactly 1 remaining admin_users row after the reset, found %. Aborting -- rolling back.', v_remaining_admin;
  end if;
  if v_remaining_profiles > 1 then
    raise exception 'Expected at most 1 remaining profiles row (the admin''s own, if it has one) after the reset, found %. Aborting -- rolling back.', v_remaining_profiles;
  end if;
  if v_remaining_quiz_results <> 0 then
    raise exception 'Expected 0 remaining quiz_results after the reset, found %. Aborting -- rolling back.', v_remaining_quiz_results;
  end if;
  if v_remaining_daily_answers <> 0 then
    raise exception 'Expected 0 remaining daily_answers after the reset, found %. Aborting -- rolling back.', v_remaining_daily_answers;
  end if;
  if v_remaining_entitlements <> 0 then
    raise exception 'Expected 0 remaining user_entitlements after the reset, found %. Aborting -- rolling back.', v_remaining_entitlements;
  end if;
  if v_remaining_tester_grants <> 0 then
    raise exception 'Expected 0 remaining tester_access_grants after the reset, found %. Aborting -- rolling back.', v_remaining_tester_grants;
  end if;
  if v_catalog_quizzes = 0 then
    raise exception 'Expected the quiz catalog to be untouched and non-empty, found 0 quizzes. Aborting -- rolling back (this would indicate something far more wrong than intended).';
  end if;
  if v_catalog_daily_questions = 0 then
    raise exception 'Expected the Daily catalog to be untouched and non-empty, found 0 daily_questions. Aborting -- rolling back.';
  end if;

  raise notice 'Clean V1 full prelaunch wipe verified: % auth.users row, % admin_users row, 0 consumer records, catalog intact (% quizzes, % daily_questions).', v_remaining_users, v_remaining_admin, v_catalog_quizzes, v_catalog_daily_questions;
end $$;

commit;

-- ============================================================================================
-- POST-RESET MANUAL VERIFICATION (run separately, read-only, against the real project)
-- ============================================================================================
-- select id, email, created_at from auth.users;                    -- expect exactly 1 row
-- select user_id, role from public.admin_users;                     -- expect exactly 1 row, role = 'owner'
-- select count(*) from public.profiles;                             -- expect 0 or 1
-- select count(*) from public.quiz_results;                         -- expect 0
-- select count(*) from public.daily_answers;                        -- expect 0
-- select count(*) from public.user_trait_evidence;                  -- expect 0
-- select count(*) from public.user_entitlements;                    -- expect 0
-- select count(*) from public.tester_access_grants;                 -- expect 0
-- select count(*) from public.quizzes;                              -- expect unchanged (30)
-- select count(*) from public.daily_questions where status in ('Live','Approved'); -- expect the full catalog
--
-- Then, as a real end-to-end smoke test: sign in as the preserved admin and confirm access;
-- separately, from a clean device/simulator with no existing session, confirm a brand-new
-- anonymous sign-in, a fresh quiz completion, and a fresh Daily answer all work and award
-- evidence exactly once.
--
-- ============================================================================================
-- ROLLBACK (only before the retention window elapses, only if something is found wrong)
-- ============================================================================================
-- insert into auth.users select * from _reset_backup_20261103.auth_users where id not in (select id from auth.users);
-- insert into public.admin_users select * from _reset_backup_20261103.admin_users where user_id not in (select user_id from public.admin_users);
-- insert into public.profiles select * from _reset_backup_20261103.profiles where user_id not in (select user_id from public.profiles);
-- insert into public.user_entitlements select * from _reset_backup_20261103.user_entitlements;
-- insert into public.tester_access_grants select * from _reset_backup_20261103.tester_access_grants;
-- insert into public.quiz_results select * from _reset_backup_20261103.quiz_results;
-- insert into public.quiz_shares select * from _reset_backup_20261103.quiz_shares;
-- insert into public.compare_responses select * from _reset_backup_20261103.compare_responses;
-- insert into public.user_quiz_completions select * from _reset_backup_20261103.user_quiz_completions;
-- insert into public.user_quiz_answers select * from _reset_backup_20261103.user_quiz_answers;
-- insert into public.user_trait_evidence select * from _reset_backup_20261103.user_trait_evidence;
-- insert into public.user_trait_totals select * from _reset_backup_20261103.user_trait_totals;
-- insert into public.user_trait_active_totals select * from _reset_backup_20261103.user_trait_active_totals;
-- insert into public.personality_evidence select * from _reset_backup_20261103.personality_evidence;
-- insert into public.personality_pole_evidence select * from _reset_backup_20261103.personality_pole_evidence;
-- insert into public.creature_published_recipes select * from _reset_backup_20261103.creature_published_recipes;
-- insert into public.creature_evolution_cycle_markers select * from _reset_backup_20261103.creature_evolution_cycle_markers;
-- insert into public.daily_answers select * from _reset_backup_20261103.daily_answers;
-- -- Note: restoring auth.users rows this way recreates the public-schema identity but does
-- -- NOT restore that user's original Supabase Auth session/password/identity provider links
-- -- (auth.identities, auth.sessions, auth.refresh_tokens are platform-managed and were never
-- -- backed up here) -- a restored consumer would need to sign in fresh. This rollback exists
-- -- for data recovery within the retention window, not for seamlessly undoing the reset from
-- -- a user's point of view.
--
-- RETENTION: keep schema _reset_backup_20261103 for an explicit, agreed recovery window
-- (recommend >=30 days, matching the superseded reset's own convention), then run:
-- drop schema _reset_backup_20261103 cascade;
-- only after explicit owner confirmation that recovery is no longer needed.
