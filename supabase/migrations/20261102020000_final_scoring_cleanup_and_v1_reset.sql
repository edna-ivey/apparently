-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 final cleanup round (2026-11-02), item 2: "Confirm that the final system has
-- exactly one authoritative personality-evidence mechanism... Make old TestFlight clients
-- fail safely instead of allowing them to write incompatible scoring data after cutover."
--
-- Finding: submit_quiz_completion (20261101040000/50000) is already the one real, live
-- evidence-writing path for every quiz, client-side -- confirmed by reading every call site
-- (src/app/quiz/[quizId].tsx, whats-your-type.tsx, pending-quiz-submissions.ts all call ONLY
-- submit_quiz_completion today). BUT the legacy submit_quiz_result RPC (still callable by
-- ANY authenticated client, including an already-installed pre-cutover TestFlight build that
-- has not yet updated) still writes real personality_evidence rows from a client-supplied
-- p_profile_effects JSON array on a quiz's first completion. That is a second, independent,
-- client-trusted evidence-writing path -- exactly the kind of thing that could write stale,
-- pre-reset-era evidence into the fresh V1 database the moment an old build relaunches after
-- the clean V1 reset (item 1), regardless of what this round's CLIENT code now does (an old
-- build already has its own old JS compiled in; this fix must be server-side to protect
-- against every old build, not just the ones we know about).
--
-- Fix: submit_quiz_result keeps accepting calls with its existing signature (so an old client
-- gets a normal, successful response -- not a crash, not a confusing new error) and keeps
-- writing its quiz_results history row exactly as before (harmless, and still useful for
-- Compare/sharing continuity on an old completion). It simply NO LONGER WRITES
-- personality_evidence, from any input, ever -- p_profile_effects is accepted but completely
-- ignored. This closes the last remaining client-trusted evidence-writing path; after this,
-- submit_quiz_completion is the single, exclusively authoritative mechanism, server-side,
-- regardless of which client build calls which RPC.
--
-- Scope: one CREATE OR REPLACE FUNCTION. No table/column change, nothing dropped. Every other
-- line of this function (auth, validation, premium/age gates, quiz_results write,
-- user_quiz_completions cross-version reservation) is byte-for-byte unchanged from
-- 20261101050000 -- only the profile_effects validation block and the personality_evidence
-- INSERT loop are removed.
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
  v_existing_id uuid;
  v_is_first boolean;
  v_new_id uuid;
  v_v2_quiz_id smallint;
  v_access_tier text;
  v_requires_age_verification boolean;
  v_logical_quiz_key text;
  v_other_version_result_id uuid;
  v_blocked_by_other_version boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_quiz_id is null or length(trim(p_quiz_id)) = 0 then
    raise exception 'quiz_id is required.';
  end if;
  if p_completed_at is null then
    raise exception 'completed_at is required.';
  end if;
  if p_completed_at > now() + interval '5 minutes' then
    raise exception 'completed_at cannot be in the future.';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Invalid question_count.';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception 'Invalid percent.';
  end if;
  if p_result_id is null or p_result_title is null or p_quiz_title is null or p_quiz_category is null then
    raise exception 'Missing required quiz result fields.';
  end if;
  if p_answers is not null and p_answers <> 'null'::jsonb and jsonb_typeof(p_answers) <> 'object' then
    raise exception 'answers must be a JSON object.';
  end if;

  -- p_profile_effects is accepted (signature unchanged, so an old client's call shape still
  -- matches) but deliberately never read beyond this point -- see this migration's header.

  select access_tier, requires_age_verification, logical_quiz_key
    into v_access_tier, v_requires_age_verification, v_logical_quiz_key
    from public.quizzes where quiz_key = p_quiz_id;

  if v_access_tier = 'private' then
    if not (
      public.has_active_entitlement(v_user_id, 'apparently_private')
      or public.has_tester_access(v_user_id)
    ) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  if coalesce(v_requires_age_verification, false) then
    if not public.is_adult_eligible(v_user_id) then
      raise exception 'This content requires confirming you are 18 or older.';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext(p_quiz_id));

  select id into v_existing_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_id and completed_at = p_completed_at;

  if v_existing_id is not null then
    return query select v_existing_id, false, true;
    return;
  end if;

  v_is_first := not exists (
    select 1 from public.quiz_results where user_id = v_user_id and quiz_id = p_quiz_id
  );

  if v_is_first then
    select quiz_id into v_v2_quiz_id from public.quizzes where quiz_key = p_quiz_id;
    if v_v2_quiz_id is not null then
      select uqc.quiz_result_id into v_other_version_result_id
        from public.user_quiz_completions uqc
        join public.quizzes other_version on other_version.quiz_id = uqc.quiz_id
        where uqc.user_id = v_user_id and other_version.logical_quiz_key = v_logical_quiz_key and uqc.quiz_id <> v_v2_quiz_id
        limit 1;
      v_blocked_by_other_version := v_other_version_result_id is not null;
    end if;
  end if;

  begin
    insert into public.quiz_results (
      user_id, quiz_id, completed_at, question_count, score, percent, result_id, result_title, traits, mix, answers
    ) values (
      v_user_id, p_quiz_id, p_completed_at, p_question_count, p_score, p_percent, p_result_id, p_result_title,
      coalesce(p_traits, '{}'), p_mix, p_answers
    )
    returning id into v_new_id;
  exception when unique_violation then
    select id into v_existing_id
      from public.quiz_results
      where user_id = v_user_id and quiz_id = p_quiz_id and completed_at = p_completed_at;
    return query select v_existing_id, false, true;
    return;
  end;

  if v_is_first and v_v2_quiz_id is not null and not v_blocked_by_other_version then
    insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
    values (v_user_id, v_v2_quiz_id, v_new_id, p_completed_at)
    on conflict (user_id, quiz_id) do nothing;
  end if;

  -- REMOVED (Build 22 final cleanup, item 2): the personality_evidence INSERT loop that used
  -- to run here from client-supplied p_profile_effects. submit_quiz_completion is now the
  -- ONLY path that ever writes personality/trait evidence, for every quiz, regardless of
  -- which RPC an old client calls. This RPC still writes quiz_results history (above) so an
  -- old client gets a normal successful response, never a crash.

  return query select v_new_id, v_is_first, false;
end;
$$;

comment on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) is
  'LEGACY, HISTORY-ONLY as of Build 22 final cleanup (2026-11-02). Persists a completed quiz result into quiz_results (idempotent on (user_id, quiz_id, completed_at)) for Compare/sharing/history continuity. Deliberately WRITES NO personality_evidence any more, regardless of p_profile_effects -- submit_quiz_completion (see 20261101050000) is the single, exclusively authoritative evidence-writing path for every quiz. This keeps any already-installed pre-cutover client working (a normal successful response, no crash, no new error) while guaranteeing it can never write stale/incompatible evidence into the database after the clean V1 reset.';

revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from public;
revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) to authenticated;
