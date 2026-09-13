-- Apparently You — backend hardening pass.
--
-- Scope: permissions, RLS performance, and two covering indexes only. Does NOT touch table
-- shapes, trigger behavior, or personality-evidence logic — see the initial migration
-- (20260913120000_initial_apparently_schema.sql, already applied remotely and historical;
-- not edited here) for the schema itself. This migration only tightens/optimizes what's
-- already there, in response to the Supabase security/performance advisors run after that
-- migration was applied to the real project.

-- =========================================================================================
-- 1. FUNCTION EXECUTE PERMISSIONS
-- =========================================================================================
--
-- Supabase grants EXECUTE on every new public-schema function to anon/authenticated/
-- service_role via its own platform-level default privileges, independent of any
-- `revoke ... from public` a migration issues — that's why the initial migration's
-- `revoke all ... from public` on get_daily_distribution didn't actually stop `anon` from
-- being able to call it. Fixed here by revoking from the specific roles directly.

-- --- 1A. get_daily_distribution(uuid): an intentional AUTHENTICATED consumer RPC. ---------
--
-- Internal access rules are UNCHANGED by this migration (still enforced inside the function
-- body from the initial migration): auth.uid() must be non-null, the question must be Live
-- or Archived, and the caller must already have a daily_answers row for it. This migration
-- only touches who may attempt to CALL the function at all.

revoke execute on function public.get_daily_distribution(uuid) from public;
revoke execute on function public.get_daily_distribution(uuid) from anon;
-- Re-stated explicitly (idempotent — authenticated already had this from the initial
-- migration) so this file is a complete, self-contained statement of the intended grants.
grant execute on function public.get_daily_distribution(uuid) to authenticated;

comment on function public.get_daily_distribution(uuid) is
  'The Room is server-locked until the current user has committed their answer. Returns all four options'' real counts/percentages, derived only from actual daily_answers rows, ONLY when: auth.uid() is not null, the question is consumer-visible (Live or Archived), AND the caller already has a daily_answers row for this question. Any other caller (unauthenticated, hasn''t answered yet, or the question is Draft/Scheduled/etc.) gets zero rows back — never a fabricated 0%-everywhere distribution, and never any signal about whether other users have answered. SECURITY DEFINER lets it aggregate across every user''s rows (a normal authenticated user''s own RLS policy only covers their own answers) while returning nothing but the gated aggregate — no raw other-user answer row is ever exposed. search_path is pinned to public. EXECUTE is intentionally granted to `authenticated` only (anon and PUBLIC revoked) — the Supabase security advisor''s remaining "authenticated can execute this SECURITY DEFINER function" notice is an ACCEPTED, INTENTIONAL architectural exception for this specific RPC, not an oversight: this function is deliberately meant to be called by any signed-in (including anonymous-signed-in) user, and its own internal access rules are what actually gate the data, not the grant.';

-- --- 1B. handle_daily_answer_personality_evidence(): trigger-only, never a public RPC. -----
--
-- Revoking EXECUTE from every consumer-facing role does not affect the AFTER INSERT trigger
-- on daily_answers created by the initial migration — trigger firing is a separate privilege
-- path (governed by the table's own trigger definition), not a direct function call, so it
-- never needs the invoking session to hold EXECUTE on the trigger function itself. This
-- purely closes the accidental "callable directly via /rest/v1/rpc/..." exposure the
-- security advisor flagged; the trigger keeps firing exactly as before.

revoke execute on function public.handle_daily_answer_personality_evidence() from public;
revoke execute on function public.handle_daily_answer_personality_evidence() from anon;
revoke execute on function public.handle_daily_answer_personality_evidence() from authenticated;

-- --- 1C. set_updated_at(): trigger-only infrastructure, plus a mutable-search_path fix. ---
--
-- CREATE OR REPLACE keeps the function's identity (same OID), so the three existing
-- BEFORE UPDATE triggers that already reference it (profiles_set_updated_at,
-- daily_questions_set_updated_at, daily_options_set_updated_at, all from the initial
-- migration) pick up this definition automatically — nothing about them needs to be
-- recreated, and their behavior (new.updated_at = now()) is unchanged.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic BEFORE UPDATE trigger: stamps updated_at = now() on the row being updated. Attach to any table with an updated_at column. search_path is pinned to public. Trigger-only infrastructure — EXECUTE is revoked from every consumer-facing role; firing as a trigger never requires that grant.';

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

-- =========================================================================================
-- 2. RLS PERFORMANCE HARDENING
-- =========================================================================================
--
-- `auth.uid() = user_id` re-evaluates auth.uid() once per row under RLS; wrapping it as
-- `(select auth.uid()) = user_id` lets Postgres treat it as an initplan (evaluated once per
-- statement) instead — the Supabase performance advisor's standard recommendation. This is a
-- pure performance change: every USING/WITH CHECK expression below is otherwise byte-for-byte
-- identical in meaning to what the initial migration created. ALTER POLICY updates each named
-- policy in place (no drop/recreate, no window where the policy doesn't exist).

alter policy "profiles_select_own" on public.profiles
  using ((select auth.uid()) = user_id);

alter policy "profiles_insert_own" on public.profiles
  with check ((select auth.uid()) = user_id);

alter policy "profiles_update_own" on public.profiles
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- daily_answers_insert_own MUST keep BOTH conditions — this is still the Live-only voting
-- rule from the initial migration, only the auth.uid() call is now wrapped for performance.
-- The EXISTS subquery's own reference to daily_questions carries no auth.uid() call of its
-- own, so there is nothing else to wrap here.
alter policy "daily_answers_select_own" on public.daily_answers
  using ((select auth.uid()) = user_id);

alter policy "daily_answers_insert_own" on public.daily_answers
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.daily_questions q
      where q.id = daily_answers.question_id
        and q.status = 'Live'
    )
  );

alter policy "quiz_results_select_own" on public.quiz_results
  using ((select auth.uid()) = user_id);

alter policy "quiz_results_insert_own" on public.quiz_results
  with check ((select auth.uid()) = user_id);

alter policy "personality_evidence_select_own" on public.personality_evidence
  using ((select auth.uid()) = user_id);

-- =========================================================================================
-- 3. FK COVERING INDEXES
-- =========================================================================================
--
-- Postgres does not automatically index foreign-key columns. These two were flagged by the
-- performance advisor as unindexed FKs. Existing indexes from the initial migration
-- (daily_answers_question_id_idx, daily_answers_user_id_idx, etc.) are untouched — the
-- unused-index INFO notices the advisor also reports are expected on a brand-new,
-- zero-traffic database and are not addressed by this migration.

create index if not exists daily_answers_option_question_idx
  on public.daily_answers (option_id, question_id);

create index if not exists daily_questions_approved_by_idx
  on public.daily_questions (approved_by);
