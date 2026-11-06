-- ============================================================================================
-- STAGED, NOT YET APPLIED. Found during the Build 18 deployment-readiness re-inspection of
-- delete-account (checking specifically for orphaned-data/deletion-blocker risk, not assumed
-- clean from an earlier pass): two ADMIN-ATTRIBUTION columns reference auth.users with NO
-- ON DELETE behavior at all (confirmed live via `pg_get_constraintdef`, not just read from
-- the original migration file):
--   daily_questions.approved_by  -> auth.users(id)   -- no ON DELETE clause (defaults to NO ACTION)
--   tester_access_grants.granted_by -> auth.users(id) -- no ON DELETE clause (defaults to NO ACTION)
--
-- IMPACT: these are NOT the ownership columns delete-account's cascade analysis is about (that
-- analysis -- profiles/daily_answers/quiz_results/personality_evidence/
-- personality_pole_evidence/user_entitlements/tester_access_grants.user_id/quiz_shares/
-- compare_responses, all verified ON DELETE CASCADE -- is unaffected and still correct for any
-- REGULAR CONSUMER deleting their own account, since a consumer never appears in
-- daily_questions.approved_by or tester_access_grants.granted_by). The gap only matters for an
-- ADMIN account that has approved at least one Daily question or granted at least one tester
-- grant, and that then tries to delete ITS OWN account: today, that call fails with a foreign-
-- key violation (NO ACTION blocks it) -- a safe failure (no corruption, no orphaned pointer,
-- the account simply isn't deleted and delete-account's existing error handling reports it
-- honestly), but not the intended "delete my own account" outcome for that admin.
--
-- FIX: ON DELETE SET NULL on both columns -- preserves the historical record (which question
-- was approved, that a grant existed and by whom it was approved/granted) while allowing the
-- approving/granting admin's own account to be deleted later without a referential-integrity
-- failure. NEVER cascade here -- cascading would incorrectly delete the Daily question itself
-- (or the tester grant) just because the approving/granting admin's account was later removed,
-- which is a real content-loss risk this migration must not introduce.
-- ============================================================================================

alter table public.daily_questions
  drop constraint daily_questions_approved_by_fkey;

alter table public.daily_questions
  add constraint daily_questions_approved_by_fkey
  foreign key (approved_by) references auth.users (id) on delete set null;

alter table public.tester_access_grants
  drop constraint tester_access_grants_granted_by_fkey;

alter table public.tester_access_grants
  add constraint tester_access_grants_granted_by_fkey
  foreign key (granted_by) references auth.users (id) on delete set null;

comment on column public.daily_questions.approved_by is
  'The admin user_id who approved this question. ON DELETE SET NULL (Build 18) -- if that admin account is later deleted, this becomes null rather than blocking the deletion or losing the question itself. approved_at/approved_content_version are untouched by this and remain the record of WHEN/WHAT was approved even if WHO becomes unknown.';

comment on column public.tester_access_grants.granted_by is
  'The admin user_id who granted this tester access. ON DELETE SET NULL (Build 18) -- if that admin account is later deleted, this becomes null rather than blocking the deletion or revoking the grant itself.';
