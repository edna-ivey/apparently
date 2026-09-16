-- Apparently You — close a first-profile-completion race in submit_quiz_result().
--
-- v_is_first was decided from `not exists (select 1 from quiz_results where user_id = ...
-- and quiz_id = ...)`, read BEFORE this call's own insert. Under READ COMMITTED (Postgres'
-- default, which this function runs under), two concurrent calls for the SAME user_id +
-- quiz_id but DIFFERENT completed_at values (two genuinely distinct legitimate completions,
-- not a retry of one another — the unique index on (user_id, quiz_id, completed_at) never
-- fires for them) can each run that `not exists` check against a snapshot that doesn't yet
-- see the other call's still-uncommitted insert. Both would then legitimately conclude
-- v_is_first = true and both write up to 3 personality_evidence rows — double-counting one
-- quiz's influence on the profile, which the whole first-completion-only rule exists to
-- prevent.
--
-- Fix: serialize submissions for the same (user_id, quiz_id) pair with a transaction-scoped
-- advisory lock, acquired after validation but before the exact-retry lookup and the
-- first-completion check — so the second of two concurrent callers only proceeds once the
-- first has fully committed (or rolled back), and therefore always sees an accurate picture
-- of what already exists for that quiz_id. pg_advisory_xact_lock auto-releases at transaction
-- end (this function's implicit transaction), so there is nothing to explicitly unlock, and
-- nothing to clean up on an early `return`/exception. Keyed on hashtext(user_id) +
-- hashtext(quiz_id) — NOT a single global lock — so unrelated (user, quiz) pairs, and
-- different users retaking the same quiz, remain fully concurrent with each other.
--
-- CREATE OR REPLACE preserves the function's identity (same OID, same existing EXECUTE
-- grants from 20260916040000_quiz_builds_you.sql) — the signature is unchanged, only the
-- body gains this one serialization step. All other validation, auth.uid() identity,
-- idempotency, retake behavior, and personality-evidence rules are untouched.

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

  -- Serialize only submissions for THIS (user_id, quiz_id) pair — different users, and the
  -- same user's different quizzes, never contend for this lock and stay fully concurrent.
  -- Auto-releases at transaction end; no explicit unlock needed on any exit path below.
  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext(p_quiz_id));

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
  -- already exists for this quiz_id — now safe from the concurrent-different-completed_at
  -- race described above, because the advisory lock above guarantees no other submission for
  -- this exact (user_id, quiz_id) pair is concurrently between its own check and insert.
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
    -- the fast-path check: return the row that won, never a duplicate. (Retained as a
    -- backstop even with the advisory lock above: the lock is keyed on the whole quiz_id, so
    -- this still protects against any unforeseen path that reaches the insert without going
    -- through the lock, e.g. a future direct caller of the same statement shape.)
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 3 personality_evidence rows from server-validated profile_effects (max 3, canonical dimension whitelist, value in {-2,-1,1,2}, no duplicate dimensions). auth.uid()-based, never a client-supplied user_id. Serializes concurrent submissions for the same (user_id, quiz_id) via a transaction-scoped advisory lock (hashtext(user_id) + hashtext(quiz_id)) so two different-completed_at completions racing each other can never both be treated as first. Idempotent on (user_id, quiz_id, completed_at): a network retry of the same completion returns the existing row rather than duplicating it. Retakes (a new completed_at) always insert a new quiz_results history row but never add more evidence.';
