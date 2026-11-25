-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-10-30), item 3: "Preserve first-completion identity for old
-- clients." The legacy sync path (src/services/legacy-quiz-backfill-service.ts) still calls
-- submit_quiz_result (V1, unchanged by Build 22) for pre-V2 local-only history. That function
-- has never written to user_quiz_completions -- the one-time historical backfill
-- (scripts/backfill-quiz-pole-evidence.ts) seeded it for every quiz_results row that existed
-- AT THE TIME THE BACKFILL RAN, but cannot protect a legacy completion that arrives AFTER that
-- one-time run (a still-installed older TestFlight build, or a delayed/offline-queued upload).
-- Concretely: such a submission writes its quiz_results row (and, correctly, V1
-- personality_evidence on its own first-completion check) but leaves zero trace in
-- user_quiz_completions. A later genuine V2 submission of the SAME quiz
-- (submit_quiz_completion) would then find no existing user_quiz_completions row and
-- incorrectly treat its own submission as the first completion -- earning NEW numeric
-- evidence/active-totals credit for a quiz this user had, in reality, already completed.
--
-- FIX: submit_quiz_result additionally reserves the V2 first-completion gate at the same
-- moment it determines v_is_first (the EXISTING, unchanged V1 check against quiz_results),
-- using the exact same completion-only seed shape the one-time backfill already uses for its
-- 22 unrecoverable-answer historical rows: a user_quiz_completions row with NO
-- user_quiz_answers/user_trait_evidence. Why no evidence here: a legacy local record's
-- per-question answers (when present at all, in p_answers) were captured by an OLD client
-- build against OLD quiz content, with no guarantee they still resolve to today's
-- quiz_questions/quiz_choices catalog rows the way submit_quiz_completion strictly requires --
-- writing evidence from them would mean trusting an unverified mapping. The product rule
-- stays exactly what it already is: ONLY submit_quiz_completion's complete-set-validated
-- p_answers, checked against the live catalog in the same transaction, may ever write
-- user_trait_evidence. This migration's reservation only ever closes the FIRST-COMPLETION GATE
-- early, nothing else.
--
-- Race safety: this INSERT ... ON CONFLICT (user_id, quiz_id) DO NOTHING races safely against
-- a concurrent submit_quiz_completion call for the SAME (user, quiz) pair -- exactly the same
-- unique-index-row-lock mechanism submit_quiz_completion itself already relies on for its own
-- atomic decision (20261028040000's own comment: "Postgres's own unique-index row lock makes
-- two concurrent 'first' submissions ... resolve to exactly one winner, deterministically, with
-- no explicit application lock needed"). Whichever call's INSERT lands first in commit order
-- wins the gate; the other's ON CONFLICT DO NOTHING is a safe, silent no-op -- this is the
-- SAME "first one the server actually commits" rule the existing advisory
-- lock + (user_id, quiz_id, completed_at) unique index already apply within submit_quiz_result
-- itself, merely extended to also cover the cross-function race. It does not, and is not
-- intended to, reorder credit by chronological completed_at across the two RPCs -- that
-- ordering behavior is unchanged from the existing V1 model (whichever submission the server
-- processes first already wins personality_evidence today; this migration does not alter that
-- rule, only mirrors it for the V2 gate).
--
-- Silently a no-op when p_quiz_id does not resolve to a row in the V2 quizzes catalog (a
-- held/retired quiz V2 never tracks) -- there is no V2 gate to reserve for a quiz V2 does not
-- know about; quiz_results/personality_evidence are written exactly as before regardless.
--
-- Every other line of this function is byte-for-byte unchanged from
-- 20261018020000_age_eligibility_gate.sql.
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
  v_effect jsonb;
  v_dimension text;
  v_value integer;
  v_effect_count integer;
  v_seen_dimensions text[] := '{}';
  -- NEW (this migration): the V2 catalog's numeric quiz_id for p_quiz_id, or null when this
  -- legacy quiz_id is not (or no longer) tracked by the V2 schema at all.
  v_v2_quiz_id smallint;
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

  -- Server-authoritative premium gate (Build 13 audit fix) -- unchanged.
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

  -- Server-authoritative 18+ gate (Build 16) -- additive, runs ALONGSIDE the premium gate
  -- above, never instead of it. Only 'private-private-trouble' is in the 'Private Private. 😈'
  -- category; every other quiz (free, preview, and the other 6 premium quizzes) is completely
  -- untouched by this check.
  if p_quiz_id = 'private-private-trouble' then
    if not public.is_adult_eligible(v_user_id) then
      raise exception 'This content requires confirming you are 18 or older.';
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

  -- NEW (this migration, item 3): reserve the V2 first-completion gate at the same moment the
  -- V1 gate is won -- see this file's header for the full rationale and race-safety argument.
  if v_is_first then
    select quiz_id into v_v2_quiz_id from public.quizzes where quiz_key = p_quiz_id;
    if v_v2_quiz_id is not null then
      insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
      values (v_user_id, v_v2_quiz_id, v_new_id, p_completed_at)
      on conflict (user_id, quiz_id) do nothing;
    end if;
  end if;

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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Build 16: additionally gates private-private-trouble on is_adult_eligible(). Build 22 (this migration): also reserves the V2 user_quiz_completions first-completion gate on the same first completion, completion-only (never user_quiz_answers/user_trait_evidence), so a legacy client syncing AFTER the one-time historical backfill cannot leave a quiz unprotected against a later V2 retake incorrectly re-earning first-completion credit. Idempotent on (user_id, quiz_id, completed_at). Everything else unchanged from 20261018020000.';
