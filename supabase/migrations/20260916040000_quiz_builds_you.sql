-- Apparently You — quizzes contribute to the same living You profile as Daily answers.
--
-- Adds what the trusted server side needs so a freshly-completed quiz can (a) persist to
-- quiz_results with its real question_count, (b) do so idempotently under network retry, and
-- (c) contribute AT MOST 3 canonical personality_evidence rows, and only on the FIRST
-- completion of a given (user, quiz) — a retake must never re-skew the profile. This mirrors
-- handle_daily_answer_personality_evidence() exactly in spirit (SECURITY DEFINER, pinned
-- search_path, personality_evidence has no client INSERT policy, on conflict do nothing) —
-- quizzes get their own dedicated RPC rather than a second personality engine, because a quiz
-- completion needs request-time validation (untrusted client-computed effects) that a plain
-- AFTER INSERT trigger reading only server-stored columns doesn't need.

-- =========================================================================================
-- 1. quiz_results.question_count
-- =========================================================================================
--
-- Nullable, not backfilled — production has zero quiz_results rows today (re-verified before
-- writing this migration), so there is no history to preserve either way, but nullable +
-- a range check (rather than NOT NULL) is the generically safe shape regardless of that.

alter table public.quiz_results add column question_count smallint;

alter table public.quiz_results
  add constraint quiz_results_question_count_range
  check (question_count is null or (question_count >= 1 and question_count <= 50));

-- =========================================================================================
-- 2. Idempotency: one quiz_results row per (user, quiz, completed_at)
-- =========================================================================================
--
-- Distinguishes a real retake (same quiz_id, a NEW completed_at) from a network retry of the
-- exact same completion (same quiz_id, same completed_at) — submit_quiz_result below checks
-- this first, but the unique index is the actual backstop against a race between two
-- near-simultaneous calls for the same completion.

create unique index quiz_results_user_quiz_completed_idx
  on public.quiz_results (user_id, quiz_id, completed_at);

-- =========================================================================================
-- 3. submit_quiz_result()
-- =========================================================================================

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
  p_profile_effects jsonb
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
  -- The database assigns the identity — auth.uid() only, never a client-supplied user_id.
  -- An anonymous Supabase session (signInAnonymously) is still `authenticated` here.
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

  -- Never trust client-computed personality effects blindly: max 3, each a known canonical
  -- dimension, value strictly in {-2,-1,1,2}, no dimension repeated within one submission.
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

      if v_dimension not in (
        'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
        'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
        'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
        'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
        'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content'
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

  -- Network retry of the exact same completion: same (user, quiz, completed_at) already
  -- exists. Return it as-is — never a duplicate quiz_results row, never duplicate evidence.
  select id into v_existing_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_id and completed_at = p_completed_at;

  if v_existing_id is not null then
    return query select v_existing_id, false, true;
    return;
  end if;

  -- First-completion rule: only the FIRST completed result for this (user, quiz_id) may ever
  -- contribute to personality_evidence. Decided BEFORE inserting the new row, from whatever
  -- already exists for this quiz_id.
  v_is_first := not exists (
    select 1 from public.quiz_results where user_id = v_user_id and quiz_id = p_quiz_id
  );

  begin
    insert into public.quiz_results (
      user_id, quiz_id, completed_at, question_count, score, percent, result_id, result_title, traits, mix
    ) values (
      v_user_id, p_quiz_id, p_completed_at, p_question_count, p_score, p_percent, p_result_id, p_result_title,
      coalesce(p_traits, '{}'), p_mix
    )
    returning id into v_new_id;
  exception when unique_violation then
    -- A concurrent retry raced us between the select above and this insert — same outcome as
    -- the fast-path check: return the row that won, never a duplicate.
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

comment on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) is
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 3 personality_evidence rows from server-validated profile_effects (max 3, canonical dimension whitelist, value in {-2,-1,1,2}, no duplicate dimensions). auth.uid()-based, never a client-supplied user_id. Idempotent on (user_id, quiz_id, completed_at): a network retry of the same completion returns the existing row rather than duplicating it. Retakes (a new completed_at) always insert a new quiz_results history row but never add more evidence.';

revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;
