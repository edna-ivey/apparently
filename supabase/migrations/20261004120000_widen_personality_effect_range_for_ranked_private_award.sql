-- Build 11 "LOCKED PRIVATE QUIZ RANKED EVIDENCE": rank #1/#2/#3 of a Private quiz's qualifying
-- Private traits now award ±3/±2/±1 permanent evidence points (replacing the previous flat ±2
-- for all three ranks) -- see src/data/quiz-personality-awards.ts's applyPermanentQuizAwards.
-- Rank #1's ±3 is new; the personality_evidence table and submit_quiz_result's server-side
-- validation both still hard-reject anything outside {-2,-1,1,2} today, so without this
-- migration a correctly-computed Build 11 award list would be silently rejected before ever
-- reaching personality_evidence. Widens the ALLOWED range only -- does not change dimension
-- validation, duplicate-dimension rejection, the 6-entry cap (20260929010000), first-completion
-- gating, or Daily's own separate ±1/±2-only validation (admin_approve_daily in
-- 20260918010000_public_private_daily_rooms.sql / 20260922010000_expand_personality_dimensions.sql
-- is deliberately NOT touched here -- individual Daily/answer-level signals stay small, only the
-- ranked Private quiz-level award can ever produce ±3, per the Bible's explicit instruction).

-- 1. Widen the table-level CHECK so a ±3 quiz_result-sourced row can actually be inserted.
alter table public.personality_evidence drop constraint personality_evidence_effect_check;
alter table public.personality_evidence add constraint personality_evidence_effect_check check (effect in (-3, -2, -1, 1, 2, 3));

-- 2. Widen submit_quiz_result's own server-side value-range validation to match. Full body
-- reproduced (CREATE OR REPLACE requires the whole function) from
-- supabase/migrations/20260929010000_widen_profile_effects_cap_for_bible_awards.sql, with only
-- the `v_value not in (...)` check and its error message's literal value list changed. Every
-- other line -- including the 6-entry cap, the 32-dimension allow-list, duplicate-dimension
-- rejection, first-completion gating, and the advisory lock -- is byte-for-byte unchanged.

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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Value range widened to {-3,-2,-1,1,2,3} in Build 11 for the ranked Private quiz award (rank #1 -> ±3, rank #2 -> ±2, rank #3 -> ±1 -- see 20261004120000). Idempotent on (user_id, quiz_id, completed_at). Dimension allow-list covers all 32 canonical dimensions as of the 20260922010000 expansion.';
