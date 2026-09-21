-- Expands the canonical personality dimension validation from 20 to the approved bounded set
-- of 32 (12 new dimensions added in src/data/personality.ts alongside this migration — see
-- that file for the full PERSONALITY_DIMENSIONS entries/copy). This migration ONLY widens the
-- two server-side allow-lists that gate which dimension ids may be written as profile_effects/
-- personality_effects; it does not touch scoring, evidence storage, or either function's other
-- behavior. Both functions below are reproduced in full (CREATE OR REPLACE requires the whole
-- body) from their current authoritative definitions:
--   - submit_quiz_result:   supabase/migrations/20260921010000_compare_they_have_notes.sql
--   - admin_approve_daily:  supabase/migrations/20260918010000_public_private_daily_rooms.sql
-- Every line outside the dimension list is byte-for-byte unchanged from those definitions.

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
    if v_effect_count > 3 then
      raise exception 'profile_effects may contain at most 3 entries.';
    end if;

    for v_effect in select * from jsonb_array_elements(p_profile_effects)
    loop
      if jsonb_typeof(v_effect -> 'dimension') <> 'string' then
        raise exception 'Malformed profile_effects entry: dimension must be a string.';
      end if;
      v_dimension := v_effect ->> 'dimension';

      -- 32 canonical dimensions (the original 20 plus the 12 approved in this pass) -- kept
      -- in exact sync with PersonalityDimensionId in src/data/personality.ts. Adding a
      -- dimension anywhere else without updating BOTH this list and admin_approve_daily's
      -- copy below would silently reject valid content -- there is no single source of truth
      -- this SQL function can read from at runtime, so the two lists must be kept manually in
      -- sync by hand on any future change (same maintenance cost that already existed for the
      -- original 20).
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 3 personality_evidence rows from server-validated profile_effects. Also stores the raw question-id -> choice-id answer map (p_answers, nullable) for Compare''s exact-match-count. Idempotent on (user_id, quiz_id, completed_at). Dimension allow-list covers all 32 canonical dimensions as of the 20260922010000 expansion.';

-- admin_approve_daily -- same 32-dimension allow-list, applied to Admin-authored
-- daily_options.personality_effects before a PROFILE Daily can be approved. Full body
-- reproduced unchanged except for the dimension list (see header comment above).
create or replace function public.admin_approve_daily(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  q record;
  opt_count int;
  bad_count int;
  bad_profile_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorized.';
  end if;

  select * into q from public.daily_questions where id = p_question_id for update;
  if q is null then
    raise exception 'Daily question not found.';
  end if;
  if q.status <> 'ReadyForReview' then
    raise exception 'Only a Daily that is Ready for Review can be approved.';
  end if;

  if btrim(q.prompt) = '' or btrim(q.prompt) = 'Untitled question' then
    raise exception 'Question wording is missing.';
  end if;
  if btrim(q.category) = '' then
    raise exception 'Category is missing.';
  end if;

  select count(*) into opt_count from public.daily_options where question_id = p_question_id;
  if opt_count <> 4 then
    raise exception 'Expected exactly 4 answer choices, found %.', opt_count;
  end if;

  -- Baseline, mode-independent: real wording and a real Apparently reaction are ALWAYS
  -- required, regardless of PROFILE vs ROOM_ONLY.
  select count(*) into bad_count
  from public.daily_options
  where question_id = p_question_id
    and (
      btrim(label) = '' or label ~ '^Option [A-D]$'
      or apparently_feedback is null or btrim(apparently_feedback) = ''
    );
  if bad_count > 0 then
    raise exception 'One or more answers are missing wording or an Apparently response.';
  end if;

  if q.daily_mode = 'room_only' then
    -- ROOM_ONLY: personality_effects MUST be empty -- this is what keeps a Room-only Daily
    -- from ever silently becoming personality evidence.
    select count(*) into bad_count
    from public.daily_options
    where question_id = p_question_id
      and personality_effects is not null
      and jsonb_array_length(personality_effects) > 0;
    if bad_count > 0 then
      raise exception 'Room-only Dailies must have empty personality effects on every option.';
    end if;
  else
    -- PROFILE: at least one effect required (existing rule), max 3, every dimension
    -- canonical, every value in {-2,-1,1,2} -- the same validation submit_quiz_result already
    -- applies to quiz results, now applied here too rather than trusting Admin-entered JSON.
    select count(*) into bad_count
    from public.daily_options
    where question_id = p_question_id
      and (personality_effects is null or jsonb_array_length(personality_effects) = 0);
    if bad_count > 0 then
      raise exception 'One or more answers are missing a personality signal.';
    end if;

    select count(*) into bad_profile_count
    from public.daily_options o
    where o.question_id = p_question_id
      and (
        jsonb_array_length(o.personality_effects) > 3
        or exists (
          select 1 from jsonb_array_elements(o.personality_effects) eff
          where not (eff ->> 'dimension') in (
            'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
            'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
            'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
            'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
            'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
            'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
            'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing',
            'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
            'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive'
          )
          or not ((eff ->> 'value')::int in (-2, -1, 1, 2))
        )
      );
    if bad_profile_count > 0 then
      raise exception 'One or more answers have an invalid personality signal (max 3, canonical dimension, value in {-2,-1,1,2}).';
    end if;
  end if;

  update public.daily_questions
  set status = 'Approved',
      approved_by = auth.uid(),
      approved_at = now(),
      approved_content_version = public.admin_compute_daily_fingerprint(p_question_id)
  where id = p_question_id;
end;
$function$;

comment on function public.admin_approve_daily(uuid) is
  'Approves a ReadyForReview Daily after validating wording/options and (PROFILE mode only) every option''s personality_effects: max 3, canonical dimension, value in {-2,-1,1,2}. Dimension allow-list covers all 32 canonical dimensions as of the 20260922010000 expansion.';
