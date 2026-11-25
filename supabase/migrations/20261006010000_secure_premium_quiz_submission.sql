-- Build 13 audit fix (Work Package 1): submit_quiz_result currently performs NO entitlement
-- check at all for the 7 premium Apparently Private quizzes -- authorization has only ever
-- lived client-side (quiz/[quizId].tsx's `definition.access === 'private' && !isPremium`
-- redirect-to-paywall gate). Anyone able to patch the client bundle or call the RPC directly
-- could submit a premium quiz_id and receive a real permanent personality_evidence write with
-- no purchase, no tester grant, nothing behind it.
--
-- This mirrors the EXACT pattern already proven and shipped for Private Daily
-- (get_private_daily / submit_private_daily_answer, 20260924010000_secure_entitlement_
-- authorization.sql): has_active_entitlement(v_user_id, 'apparently_private') OR
-- has_tester_access(v_user_id), both already-existing internal-only functions reading
-- server-side-only tables (user_entitlements, written exclusively by the RevenueCat Edge
-- Functions under service_role; tester_access_grants, written exclusively by admin_grant_
-- tester_access under is_admin()). NO client-supplied boolean parameter is added -- the
-- function's signature is completely unchanged from 20261004120000 (still 13 parameters, same
-- names, same types, same order) -- a client literally cannot pass "premium=true" because no
-- such parameter exists to pass.
--
-- Scope: ONLY the 7 quizzes with access:'private' in src/data/quizzes/*.ts are gated below.
-- Free quizzes and 'private-preview' quizzes (be-so-serious, keep-you-around, secretly-love --
-- see those files' own comments confirming access is "merchandising metadata only... changes
-- nothing about scoring, persistence, or the You profile") are completely untouched by this
-- check and continue exactly as before. The gate is a hardcoded id list, kept in sync by hand
-- with QUIZ_REGISTRY's access:'private' entries -- same constraint already documented for the
-- 32-dimension allow-list above it in this same function ("there is no single source of truth
-- this SQL function can read from at runtime").
--
-- The check runs BEFORE the advisory lock and BEFORE any insert -- an unauthorized caller gets
-- a raised exception and the transaction is rolled back with zero rows written to either
-- quiz_results or personality_evidence. Every other line of this function -- the advisory
-- lock, first-completion gating, same-(user,quiz_id,completed_at) retry handling, the
-- 6-entry/32-dimension/±3-range profile_effects validation, the ranked Private evidence
-- insert -- is byte-for-byte unchanged from 20261004120000_widen_personality_effect_range_
-- for_ranked_private_award.sql.
--
-- Explicitly NOT touched by this migration (confirmed unnecessary for this objective during
-- audit): the quiz_results_insert_own RLS policy (20260913120000_initial_apparently_schema.sql)
-- still allows a client to insert directly into quiz_results, bypassing this RPC entirely. That
-- path cannot create personality_evidence (no trigger exists on quiz_results -- only this RPC
-- and the separate daily_answers trigger ever write evidence), so it cannot grant any
-- entitlement-gated identity consequence; its only effect is polluting the writer's OWN
-- quiz_results history / vanity completion counters. Left alone for a separately-approved
-- future work package, not bundled into this security fix.

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
  v_effect jsonb;
  v_dimension text;
  v_value integer;
  v_effect_count integer;
  v_seen_dimensions text[] := '{}';
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

  -- Server-authoritative premium gate (Build 13 audit fix) -- see this migration's header
  -- comment. Runs before anything else below can write a single row. The 7 ids here are the
  -- ENTIRE set of access:'private' quizzes in src/data/quizzes/*.ts as of Build 13 -- verified
  -- directly against source, not guessed: career-ambition-how-bad, career-ambition-proving,
  -- hidden-you-wrong, life-match-dream-life, love-soulmates-ready, private-private-trouble,
  -- style-vibe-intimidating.
  if p_quiz_id in (
    'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong',
    'life-match-dream-life', 'love-soulmates-ready', 'private-private-trouble',
    'style-vibe-intimidating'
  ) then
    if not (
      public.has_active_entitlement(v_user_id, 'apparently_private')
      or public.has_tester_access(v_user_id)
    ) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  if p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
    if jsonb_typeof(p_profile_effects) <> 'array' then
      raise exception 'profile_effects must be a JSON array.';
    end if;

    select count(*) into v_effect_count from jsonb_array_elements(p_profile_effects);
    if v_effect_count > 6 then
      raise exception 'profile_effects may contain at most 6 entries.';
    end if;

    for v_effect in select * from jsonb_array_elements(p_profile_effects)
    loop
      if jsonb_typeof(v_effect -> 'dimension') <> 'string' then
        raise exception 'Malformed profile_effects entry: dimension must be a string.';
      end if;
      v_dimension := v_effect ->> 'dimension';

      -- 32 canonical dimensions (the original 20 plus the 12 approved in the
      -- 20260922010000 expansion) -- kept in exact sync with PersonalityDimensionId in
      -- src/data/personality.ts. Adding a dimension anywhere else without updating BOTH this
      -- list and admin_approve_daily's copy would silently reject valid content -- there is no
      -- single source of truth this SQL function can read from at runtime, so the two lists
      -- must be kept manually in sync by hand on any future change.
      if v_dimension not in (
        'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
        'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
        'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
        'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
        'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
        'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
        'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing',
        'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
        'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive'
      ) then
        raise exception 'Unknown personality dimension: %', v_dimension;
      end if;

      if jsonb_typeof(v_effect -> 'value') <> 'number' then
        raise exception 'Malformed profile_effects entry: value must be a number.';
      end if;
      v_value := (v_effect ->> 'value')::integer;
      if v_value not in (-3, -2, -1, 1, 2, 3) then
        raise exception 'Invalid personality effect value: %', v_value;
      end if;

      if v_dimension = any(v_seen_dimensions) then
        raise exception 'Duplicate personality dimension in profile_effects: %', v_dimension;
      end if;
      v_seen_dimensions := array_append(v_seen_dimensions, v_dimension);
    end loop;
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

  if v_is_first and p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
    for v_effect in select * from jsonb_array_elements(p_profile_effects)
    loop
      insert into public.personality_evidence (
        user_id, source_type, source_id, question_snapshot, answer_snapshot, category, dimension, effect
      ) values (
        v_user_id, 'quiz_result', v_new_id::text, p_quiz_title, p_result_title, p_quiz_category,
        v_effect ->> 'dimension', (v_effect ->> 'value')::smallint
      )
      on conflict (user_id, source_type, source_id, dimension) do nothing;
    end loop;
  end if;

  return query select v_new_id, v_is_first, false;
end;
$$;

comment on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) is
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Value range {-3,-2,-1,1,2,3} (Build 11 ranked Private quiz award -- see 20261004120000). Idempotent on (user_id, quiz_id, completed_at). Dimension allow-list covers all 32 canonical dimensions as of the 20260922010000 expansion. Build 13 audit fix (20261006010000): the 7 access:''private'' premium quiz ids are now server-gated via has_active_entitlement(''apparently_private'')/has_tester_access -- the same authorization primitives already used by get_private_daily/submit_private_daily_answer -- raising an exception before any write for an unauthorized caller; free and private-preview quiz ids are never gated.';
