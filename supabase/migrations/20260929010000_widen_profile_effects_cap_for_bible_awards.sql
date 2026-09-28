-- Bible v1.4 §15A qualification-foundation reconciliation: widens submit_quiz_result's
-- profile_effects cap from 3 to 6. The Bible's approved permanent-quiz-award model can
-- legitimately produce more than 3 signals from a single quiz completion:
--   PUBLIC / FREE quiz    -- up to 5 Core awards (top 3 qualifying traits +2 each, next 2 +1
--                            each).
--   APPARENTLY PRIVATE    -- up to 3 Core awards (+1 each) AND up to 3 Private awards (+2
--   quiz                    each) = up to 6 total.
-- The old cap of 3 (set when this function only ever received pre-resolved, human-authored
-- profileSignals -- see src/data/quizzes/*.ts) would silently reject a correctly-computed
-- Bible-compliant award list before it could ever reach personality_evidence. This migration
-- widens the ceiling only; it does not change dimension validation, value-range validation,
-- duplicate-dimension rejection, first-completion gating, or any other behavior. No current
-- quiz content sends more than 3 signals today, so this is a non-breaking, purely-widening
-- change -- see src/data/quiz-personality-awards.ts's own header comment for why the new
-- within-quiz award pipeline is not yet wired into real quiz content.
--
-- Full body reproduced (CREATE OR REPLACE requires the whole function) from
-- supabase/migrations/20260922010000_expand_personality_dimensions.sql, with only the
-- `v_effect_count > 3` check and its error message changed to `> 6`. Every other line is
-- byte-for-byte unchanged.

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
      if v_value not in (-2, -1, 1, 2) then
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects (widened from 3 in the Bible v1.4 qualification-foundation pass -- see this migration''s header comment). Also stores the raw question-id -> choice-id answer map (p_answers, nullable) for Compare''s exact-match-count. Idempotent on (user_id, quiz_id, completed_at). Dimension allow-list covers all 32 canonical dimensions as of the 20260922010000 expansion.';
