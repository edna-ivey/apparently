-- ============================================================================================
-- STAGED, NOT YET APPLIED. Prepared per the App Privacy / age-eligibility audit task
-- (2026-10-21, extended 2026-11-02 for the second mature quiz) -- do not run `supabase db
-- push` (or any other apply step) against this file until the product owner has explicitly
-- reviewed and approved it. Nothing here has been applied to the production database.
--
-- Finding: 'private-private-trouble' and 'private-private-proof' (added 2026-11-02 as the
-- final approved 18+ "Private Private" premium quiz) are the two quizzes gated 18+ (see
-- 20261018020000_age_eligibility_gate.sql's is_adult_eligible()/submit_quiz_result check), but
-- the public shared-result landing (/s/[token], backed by get_shared_quiz_result) is
-- deliberately reachable by a FULLY ANONYMOUS web visitor with no session and no age check --
-- that is its whole purpose for every other quiz (an unauthenticated friend can view a shared
-- result without installing the app). create_quiz_share/get_shared_quiz_result
-- (20260919010000_quiz_result_sharing.sql) never special-cased either quiz id, so an 18+
-- subscriber tapping "Share this" on one of these results could hand its mature/suggestive-
-- themed copy (see src/data/quizzes/private-private-trouble.ts and
-- src/data/quizzes/private-private-proof.ts) to literally anyone with the link, of any age,
-- completely bypassing the 18+ gate. The client-side fix (src/app/quiz/[quizId].tsx,
-- isShareRestricted / MATURE_PRIVATE_PRIVATE_QUIZ_IDS) stops the app itself from ever
-- offering or creating such a link, but per this audit's own standard ("client-side hiding
-- alone is insufficient"), that is not real enforcement on its own -- a direct RPC call could
-- still create or read one. This migration is the real, server-side enforcement; the client
-- fix is defense-in-depth on top of it.
--
-- Scope: two CREATE OR REPLACE FUNCTION statements, no table/column changes, nothing dropped.
-- Also closes the retroactive case: get_shared_quiz_result now excludes both quiz ids even for
-- a share row that might already exist (none is known to -- there is no RPC to enumerate
-- quiz_shares by quiz_id from this environment to confirm either way -- but the fix is
-- correct regardless of whether one does).
-- ============================================================================================

-- =========================================================================================
-- 1. CREATE_QUIZ_SHARE -- additive: reject p_quiz_id in ('private-private-trouble',
--    'private-private-proof') before any row is read or written. Every other quiz id is
--    completely unchanged from 20260919010000_quiz_result_sharing.sql.
-- =========================================================================================

create or replace function public.create_quiz_share(p_quiz_id text, p_sharer_display_name text default null)
returns table (share_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_result record;
  v_existing uuid;
  v_new_id uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'Not authenticated.';
  end if;

  if p_quiz_id in ('private-private-trouble', 'private-private-proof') then
    raise exception 'This result cannot be shared.';
  end if;

  select id, result_id into v_result
  from public.quiz_results
  where user_id = v_user and quiz_id = p_quiz_id
  order by completed_at desc
  limit 1;

  if v_result is null then
    raise exception 'No completion found for this quiz.';
  end if;

  select id into v_existing
  from public.quiz_shares
  where sharer_user_id = v_user and quiz_result_id = v_result.id
  limit 1;

  if v_existing is not null then
    return query select v_existing;
    return;
  end if;

  insert into public.quiz_shares (sharer_user_id, quiz_id, result_id, quiz_result_id, sharer_display_name)
  values (v_user, p_quiz_id, v_result.result_id, v_result.id, nullif(btrim(coalesce(p_sharer_display_name, '')), ''))
  returning id into v_new_id;

  return query select v_new_id;
end;
$$;

comment on function public.create_quiz_share(text, text) is
  'The one write path for quiz_shares. Always pins the CALLER''s (auth.uid()) own latest completion of p_quiz_id -- a client can never supply an arbitrary quiz_result_id or share on behalf of another user. Age-eligibility audit (2026-10-21, extended 2026-11-02): rejects private-private-trouble and private-private-proof outright -- their 18+ gated content must never become a public, unauthenticated web link.';

-- =========================================================================================
-- 2. GET_SHARED_QUIZ_RESULT -- additive: returns zero rows for a share row whose quiz_id is
--    'private-private-trouble' or 'private-private-proof', regardless of when that row was
--    created. Every other quiz id is completely unchanged from
--    20260919010000_quiz_result_sharing.sql.
-- =========================================================================================

create or replace function public.get_shared_quiz_result(p_share_id uuid)
returns table (quiz_id text, result_id text, sharer_display_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.quiz_id, s.result_id, s.sharer_display_name, s.created_at
  from public.quiz_shares s
  where s.id = p_share_id
    and s.quiz_id not in ('private-private-trouble', 'private-private-proof');
$$;

comment on function public.get_shared_quiz_result(uuid) is
  'The one read path for a shared quiz result -- safe for a fully anonymous caller. Never exposes sharer_user_id or any column beyond quiz_id/result_id/sharer_display_name/created_at. Age-eligibility audit (2026-10-21, extended 2026-11-02): excludes private-private-trouble and private-private-proof unconditionally, including any share row that predates create_quiz_share''s own new rejection of those quiz ids -- /s/[token] has no age check, so this 18+ content must never be readable through it.';
