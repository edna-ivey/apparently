-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-10-31, third round), items 1, 3, and 5 -- all against
-- submit_quiz_completion (item 1 also touches submit_quiz_result's retroactive-reservation
-- caller indirectly, by fixing which timestamp submit_quiz_completion itself preserves).
--
-- ITEM 1 (historical timestamp not preserved): the owner reproduced an August 1, 2025
-- completion with no user_quiz_completions row, then a retake on October 31, 2026. The prior
-- fix (20261031010000) correctly blocked new evidence, but retroactively reserved the gate
-- using THIS FUNCTION'S OWN now() instead of the historical row's real completed_at --
-- get_my_active_quiz_completions() then wrongly counted the 14-month-old quiz as active
-- again. FIXED: the historical lookup now also reads the historical row's OWN completed_at,
-- and the retroactive reservation uses THAT value, never now(). Server-authoritative
-- timestamps for a genuinely NEW first completion (the atomic-decider branch) are UNCHANGED
-- -- still always now(), never p_completed_at -- preserving the prior round's item-3 fix.
--
-- ITEM 3 (unvalidated result metadata): the owner submitted 8 valid Petty answers (which
-- correctly passed the EXISTING answer-completeness check) while separately claiming
-- question_count=1, score=90000, a fabricated result_id, and a fabricated result_title --
-- all four were accepted and stored. Full server-side re-scoring remains out of scope (see
-- this function's own existing comment); the explicitly stated minimum bar is implemented:
--   - question_count must now EXACTLY equal the quiz's real question count (previously only
--     range-checked 1-50, never cross-checked against the real catalog).
--   - score is now bounded to questionCount*3 -- every real choice's flavor-score field
--     across every quiz in this codebase is in [0,3] (confirmed directly against every quiz
--     content file), so this bound can never reject a legitimate result while catching any
--     wildly fabricated value.
--   - result_id must now resolve to a real row in the new quiz_result_definitions catalog
--     (20261101010000, mechanically derived from the real QUIZ_REGISTRY resultBands/
--     archetypes and whats-your-type's COMBINATION_RESULTS) -- unknown result_id is rejected
--     outright.
--   - result_title sent by the client is now IGNORED for storage -- the catalog's own
--     approved title for the validated result_id is what actually gets written, so a
--     fabricated title can never reach quiz_results/Compare/analytics even if result_id
--     happens to be real.
--
-- ITEM 5 (clock-skew tolerance): the prior round's future-date rejection
-- (`p_completed_at > v_evidence_timestamp`) would reject a perfectly legitimate submission
-- from a device whose clock is merely a little fast -- a real usability regression, and
-- unnecessary, since eligibility was ALREADY made server-controlled (v_evidence_timestamp,
-- never p_completed_at) in the prior round. A small, fixed tolerance (5 minutes) absorbs
-- ordinary clock drift without reopening the actual exploit (a client claiming 2099 is still
-- rejected outright; eligibility itself never depends on p_completed_at either way). The same
-- tolerance is applied to submit_quiz_result's own future-date check for the same reason.
-- ============================================================================================

create or replace function public.submit_quiz_completion(
  p_quiz_key text,
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
  p_answers jsonb
)
returns table (quiz_result_id uuid, is_first_completion boolean, was_retry boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_quiz_id smallint;
  v_existing_result_id uuid;
  v_new_result_id uuid;
  v_expected_question_count integer;
  v_submitted_question_count integer;
  v_matching_question_count integer;
  v_won_completion boolean := false;
  v_question_key text;
  v_choice_key text;
  v_question_id integer;
  v_choice_id integer;
  v_answer_id uuid;
  v_trait record;
  v_evidence_timestamp timestamptz := now();
  -- The earliest pre-existing quiz_results row for this (user, quiz), if any, AND its real
  -- original completed_at -- item 1's fix. Both captured together so the retroactive
  -- reservation branch below never has to re-query.
  v_historical_result_id uuid;
  v_historical_completed_at timestamptz;
  -- item 3: the catalog's own approved title for a validated result_id -- never the client's.
  v_catalog_result_title text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_quiz_key is null or length(trim(p_quiz_key)) = 0 then
    raise exception 'quiz_key is required.';
  end if;
  if p_completed_at is null then
    raise exception 'completed_at is required.';
  end if;
  -- CHANGED (item 5): a 5-minute tolerance absorbs ordinary client clock drift. Eligibility
  -- itself never depends on p_completed_at (see v_evidence_timestamp usage below) -- this
  -- bound exists only to reject a wildly fabricated date, not to police minor clock skew.
  if p_completed_at > v_evidence_timestamp + interval '5 minutes' then
    raise exception 'completed_at cannot be in the future.';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception 'Invalid percent.';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'Invalid score.';
  end if;
  if p_result_id is null or length(trim(p_result_id)) = 0 then
    raise exception 'result_id is required.';
  end if;
  if p_result_title is null or length(trim(p_result_title)) = 0 then
    raise exception 'result_title is required.';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Invalid question_count.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'answers must be a JSON object.';
  end if;

  select quiz_id into v_quiz_id from public.quizzes where quiz_key = p_quiz_key;
  if v_quiz_id is null then
    raise exception 'Unknown quiz_key: %', p_quiz_key;
  end if;

  if p_quiz_key in (
    'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong',
    'life-match-dream-life', 'love-soulmates-ready', 'private-private-trouble',
    'style-vibe-intimidating'
  ) then
    if not (public.has_active_entitlement(v_user_id, 'apparently_private') or public.has_tester_access(v_user_id)) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  if p_quiz_key = 'private-private-trouble' then
    if not public.is_adult_eligible(v_user_id) then
      raise exception 'This quiz requires confirmed age eligibility.';
    end if;
  end if;

  select id into v_existing_result_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_key and completed_at = p_completed_at;
  if v_existing_result_id is not null then
    return query select v_existing_result_id, false, true;
    return;
  end if;

  select count(*) into v_expected_question_count from public.quiz_questions where quiz_id = v_quiz_id;
  select count(*) into v_submitted_question_count from jsonb_each_text(p_answers);
  if v_submitted_question_count <> v_expected_question_count then
    raise exception 'Incomplete or malformed submission: expected % answers, got %.', v_expected_question_count, v_submitted_question_count;
  end if;

  select count(*) into v_matching_question_count
    from jsonb_each_text(p_answers) a(question_key, choice_key)
    join public.quiz_questions qq on qq.quiz_id = v_quiz_id and qq.question_key = a.question_key
    join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key;
  if v_matching_question_count <> v_expected_question_count then
    raise exception 'Invalid submission: one or more question_key/choice_key pairs do not resolve to real content for this quiz.';
  end if;

  -- NEW (item 3): question_count metadata must match the SAME real count the answer-set was
  -- already validated against above -- previously only range-checked, never cross-checked.
  if p_question_count <> v_expected_question_count then
    raise exception 'question_count (%) does not match this quiz''s real question count (%).', p_question_count, v_expected_question_count;
  end if;

  -- NEW (item 3): every real choice's flavor-score field across every quiz in this codebase
  -- is in [0,3] (verified directly against source content), so a legitimate total can never
  -- exceed questionCount*3 regardless of scoring type (numericBand sums per-question score;
  -- archetype sums per-question resultWeights, same [1,3] scale; dualDimension sends
  -- score=questionCount, always <= questionCount*3).
  if p_score > v_expected_question_count * 3 then
    raise exception 'Invalid score: % exceeds the maximum possible (%) for a %-question quiz.', p_score, v_expected_question_count * 3, v_expected_question_count;
  end if;

  -- NEW (item 3): result_id must be a real, approved result for this quiz. The catalog's own
  -- title is what gets stored -- never the client-reported p_result_title, which is read no
  -- further than this point.
  select result_title into v_catalog_result_title
    from public.quiz_result_definitions
    where quiz_id = v_quiz_id and result_key = p_result_id;
  if v_catalog_result_title is null then
    raise exception 'Unknown result_id "%" for this quiz.', p_result_id;
  end if;

  -- Historical check (item 2, prior round) -- BEFORE inserting this submission's own
  -- quiz_results row, so this query can never see itself. CHANGED (item 1, this round): also
  -- captures the historical row's REAL completed_at.
  select id, completed_at into v_historical_result_id, v_historical_completed_at
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_key
    order by completed_at asc
    limit 1;

  insert into public.quiz_results (
    user_id, quiz_id, completed_at, score, percent, result_id, result_title, traits, mix,
    question_count, answers
  ) values (
    v_user_id, p_quiz_key, p_completed_at, p_score, p_percent, p_result_id, v_catalog_result_title,
    coalesce(p_traits, '{}'), p_mix, p_question_count, p_answers
  ) returning id into v_new_result_id;

  if v_historical_result_id is not null then
    -- CHANGED (item 1): the retroactive reservation now uses the historical row's OWN real
    -- completed_at, never this function's now() -- a 14-month-old missed completion must
    -- stay 14 months old, not be reborn "active today," through this safety-net path.
    insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
    values (v_user_id, v_quiz_id, v_historical_result_id, v_historical_completed_at)
    on conflict (user_id, quiz_id) do nothing;

    return query select v_new_result_id, false, false;
    return;
  end if;

  -- THE atomic first-completion decider, at (user_id, quiz_id) -- never per-question. A
  -- genuinely NEW first completion always uses this function's own server-trusted
  -- v_evidence_timestamp (unchanged from the prior round's item-3 fix) -- never
  -- p_completed_at.
  insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
  values (v_user_id, v_quiz_id, v_new_result_id, v_evidence_timestamp)
  on conflict (user_id, quiz_id) do nothing;

  v_won_completion := found;

  if not v_won_completion then
    return query select v_new_result_id, false, false;
    return;
  end if;

  for v_question_key, v_choice_key in select key, value::text from jsonb_each_text(p_answers)
  loop
    select qq.question_id into v_question_id from public.quiz_questions qq where qq.quiz_id = v_quiz_id and qq.question_key = v_question_key;
    select qc.choice_id into v_choice_id from public.quiz_choices qc where qc.question_id = v_question_id and qc.choice_key = v_choice_key;

    insert into public.user_quiz_answers (user_id, quiz_id, question_id, choice_id, answered_at)
    values (v_user_id, v_quiz_id, v_question_id, v_choice_id, v_evidence_timestamp)
    returning id into v_answer_id;

    for v_trait in
      select
        awards.trait_id,
        max(awards.points) as max_available,
        coalesce(max(awards.points) filter (where qc2.choice_id = v_choice_id), 0) as points_earned
      from public.quiz_choice_trait_awards awards
      join public.quiz_choices qc2 on qc2.choice_id = awards.choice_id
      where qc2.question_id = v_question_id
      group by awards.trait_id
    loop
      insert into public.user_trait_evidence (
        user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at
      ) values (
        v_user_id, 'quiz_answer', v_answer_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available, v_evidence_timestamp
      );

      insert into public.user_trait_totals (
        user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at
      ) values (
        v_user_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available,
        case when v_trait.points_earned > 0 then 1 else 0 end, 1, now()
      )
      on conflict (user_id, trait_id) do update set
        lifetime_earned = public.user_trait_totals.lifetime_earned + excluded.lifetime_earned,
        max_available_total = public.user_trait_totals.max_available_total + excluded.max_available_total,
        distinct_questions_with_earned = public.user_trait_totals.distinct_questions_with_earned + excluded.distinct_questions_with_earned,
        distinct_questions_presented = public.user_trait_totals.distinct_questions_presented + excluded.distinct_questions_presented,
        updated_at = now();

      insert into public.user_trait_active_totals (
        user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at
      ) values (
        v_user_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available,
        case when v_trait.points_earned > 0 then 1 else 0 end, 1, now()
      )
      on conflict (user_id, trait_id) do update set
        lifetime_earned = public.user_trait_active_totals.lifetime_earned + excluded.lifetime_earned,
        max_available_total = public.user_trait_active_totals.max_available_total + excluded.max_available_total,
        distinct_questions_with_earned = public.user_trait_active_totals.distinct_questions_with_earned + excluded.distinct_questions_with_earned,
        distinct_questions_presented = public.user_trait_active_totals.distinct_questions_presented + excluded.distinct_questions_presented,
        updated_at = now();
    end loop;
  end loop;

  return query select v_new_result_id, true, false;
end;
$$;

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission. Build 22 (2026-10-31, third round): (1) the historical-completion safety net (item 2, prior round) now preserves the historical row''s REAL completed_at for the active-eligibility window, never now(); (2) question_count/score/result_id/result_title are validated against the real quiz catalog (quiz_questions count, a questionCount*3 score bound, and the new quiz_result_definitions catalog) -- result_title actually stored is ALWAYS the catalog''s own approved title, never the client''s; (3) the future-date rejection now tolerates 5 minutes of ordinary clock skew. Eligibility (user_quiz_completions.completed_at for a genuinely new completion) remains always server-trusted now(), unchanged from the prior round.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;

-- ============================================================================================
-- submit_quiz_result (V1, legacy sync path only): item 5's same clock-skew tolerance, nothing
-- else changed -- old-date preservation remains fully intact and untouched (that preservation
-- is this RPC's entire purpose for the legacy sync path, per 20261030020000/20261031010000).
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
  -- CHANGED (item 5): same 5-minute clock-skew tolerance as submit_quiz_completion. Old dates
  -- remain fully trusted, unchanged -- that preservation is this RPC's entire purpose for the
  -- legacy sync path.
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Build 22 (2026-10-31, third round): same 5-minute clock-skew tolerance as submit_quiz_completion. Old dates remain fully trusted BY DESIGN -- this RPC''s entire purpose is preserving a genuinely historical local completion date for a delayed/offline legacy device sync. Idempotent on (user_id, quiz_id, completed_at). Everything else unchanged from 20261031010000.';
