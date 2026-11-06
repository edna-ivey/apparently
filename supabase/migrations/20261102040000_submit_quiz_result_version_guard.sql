-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Deployment-safety review (2026-11-03), item 2: "Stop old TestFlight clients from
-- recreating obsolete results... The modified submit_quiz_result correctly stops awarding
-- legacy personality evidence, but it still inserts old quiz_results records. Our V1 policy
-- is to discard obsolete quiz history. Old clients must not repopulate the reset database
-- with retired results. Implement a safe server-side compatibility/version guard. An outdated
-- client should receive a clear update-required response rather than saving incompatible
-- quiz history."
--
-- 20261102020000 already stopped this RPC from writing personality_evidence (closing the
-- evidence-correctness gap). This migration goes further: submit_quiz_result now writes
-- NOTHING AT ALL, for any caller, unconditionally -- no personality_evidence (already true),
-- and now no quiz_results row either. It still authenticates the caller first (consistent
-- with every other RPC's security posture) and then ALWAYS raises a clear, structured
-- 'UPDATE_REQUIRED' exception naming exactly what happened and what to do, rather than a
-- generic permission-denied error a revoked grant would produce. This is deliberately
-- unconditional (not a reset-date flag check) -- confirmed zero current, live client call
-- sites remain (every real quiz flow calls submit_quiz_completion exclusively; see the Build
-- 22 final report, item 2), so the ONLY remaining caller of this RPC, ever, is an
-- already-installed pre-cutover build that has not yet updated. There is no legitimate
-- scenario left where this RPC inserting a row is correct, before OR after the V1 data
-- reset -- so the guard does not need to know whether a reset has happened.
--
-- Scope: one CREATE OR REPLACE FUNCTION. No table/column change, nothing dropped. The
-- function's signature is unchanged so an old client's call shape still matches (no
-- "function not found" error, which an old client's error handling may not expect) -- it
-- simply never reaches any INSERT any more, under any input.
-- ============================================================================================

create or replace function public.submit_quiz_result(
  p_quiz_id text,
  p_quiz_title text,
  p_quiz_category text,
  p_completed_at timestamptz,
  p_question_count smallint,
  p_score integer,
  p_percent integer,
  p_result_id text,
  p_result_title text,
  p_traits text[],
  p_mix jsonb,
  p_profile_effects jsonb,
  p_answers jsonb default null
)
returns table (quiz_result_id uuid, is_first_profile_completion boolean, was_retry boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  -- UNCONDITIONAL, by design -- see this migration's header. Every parameter above is
  -- deliberately left unused: there is no input shape that makes an old-client call to this
  -- RPC correct any more, so nothing about p_quiz_id/p_completed_at/etc. is worth inspecting
  -- before rejecting. Nothing is written -- not quiz_results, not personality_evidence.
  raise exception using
    errcode = 'P0001',
    message = 'UPDATE_REQUIRED: This version of Apparently You is no longer supported. Please update the app to continue saving your results.';

  -- Unreachable -- required only so this function's RETURNS TABLE signature type-checks.
  return query select null::uuid, null::boolean, null::boolean where false;
end;
$$;

comment on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) is
  'RETIRED as of the Build 22 V1 cutover (2026-11-03). Writes NOTHING under any input -- no quiz_results row, no personality_evidence row. Authenticates the caller, then unconditionally raises a clear ''UPDATE_REQUIRED: ...'' exception. The only remaining caller of this RPC is an already-installed pre-cutover client that has not yet updated; submit_quiz_completion (20261101040000/50000) is the one real, live submission path for every quiz. Kept callable (not revoked) so an old client receives this specific, actionable message rather than a generic permission-denied error.';

revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from public;
revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) to authenticated;
