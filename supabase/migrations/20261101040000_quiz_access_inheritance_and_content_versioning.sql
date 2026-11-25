-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-11-01), item 3: "Complete safe quiz content versioning and
-- authorization." The owner confirmed submit_quiz_completion and submit_quiz_result
-- authorize paid Private content using a HARD-CODED list of the 7 original quiz keys, then
-- independently added a synthetic 'love-soulmates-ready-v2' quiz to an isolated test
-- database and reproduced a user WITHOUT any subscription or tester entitlement successfully
-- submitting it -- the new key was simply absent from the hardcoded list. The prior round's
-- item-4 content-version fingerprint guard correctly stops a REVISION from reusing an
-- existing quiz_key's numeric identity, but never addressed what happens once a revision
-- legitimately ships under a NEW key, as that guard itself instructs.
--
-- FIXED, two parts:
--
-- 1. ACCESS INHERITANCE. quizzes.access_tier/requires_age_verification (20261028020000,
--    this round) mirror each quiz's own QuizDefinition.access/category verbatim -- the SAME
--    content decision every quiz (including any future content-version replacement) already
--    has to make when it is authored, with nothing extra to remember. submit_quiz_completion
--    and submit_quiz_result now gate on these two columns directly, never a quiz-key list.
--    generate-quiz-content-identity-sql.ts additionally REFUSES to generate (see that file)
--    if a logical group of content versions ever disagrees on access classification -- a
--    revision authored with a weaker tier than the original it replaces is caught at
--    generation time, not left to a runtime gate to also get right.
--
-- 2. FIRST-COMPLETION IDENTITY CONTINUITY. quizzes.logical_quiz_key (self-referencing for
--    every quiz today) lets both RPCs check "has this user already completed ANY content
--    version sharing this logical identity" before reserving user_quiz_completions for the
--    quiz_id actually being submitted -- so a content-version replacement can never earn a
--    SECOND "first completion" for what is, by product rule, the same quiz. The DEFAULT
--    behavior preserves identity across versions; the owner's own
--    scripts/reconcile-held-quiz-evidence.ts-style explicit, separate authorization remains
--    the path for a deliberately different credit policy, should one ever be approved --
--    nothing here invents that mechanism speculatively.
--
-- NEITHER the newly locked Love quiz replacement nor the newly locked Career-How-Bad
-- replacement (docs/private-quizzes/LOVE_READY_APPROVED_LOCKED_2026-10-31.md,
-- docs/private-quizzes/CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md) is implemented,
-- referenced, or activated by this migration -- their copy, verdict weights, trait mappings,
-- and reveals are untouched. This migration only establishes the contract those replacements
-- (and any other revised Private quiz) will need before either ever ships.
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
  v_historical_result_id uuid;
  v_historical_completed_at timestamptz;
  v_catalog_result_title text;
  v_scoring_type text;
  v_quiz_max_score integer;
  v_real_result_id text;
  v_real_score integer;
  v_real_percent integer;
  v_total_points integer;
  v_dimension_a_winner text;
  v_dimension_b_winner text;
  -- NEW (item 3): access inheritance + content-version identity continuity.
  v_access_tier text;
  v_requires_age_verification boolean;
  v_logical_quiz_key text;
  v_other_version_quiz_id smallint;
  v_other_version_result_id uuid;
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

  -- CHANGED (item 3): every column this function needs to classify the quiz now comes from
  -- the catalog itself -- never a hardcoded quiz-key list.
  select quiz_id, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key
    into v_quiz_id, v_scoring_type, v_quiz_max_score, v_access_tier, v_requires_age_verification, v_logical_quiz_key
    from public.quizzes where quiz_key = p_quiz_key;
  if v_quiz_id is null then
    raise exception 'Unknown quiz_key: %', p_quiz_key;
  end if;

  -- CHANGED (item 3): data-driven, never a hardcoded list -- a future content-version
  -- replacement is classified correctly automatically, from the SAME access/category its own
  -- definition already has to declare.
  if v_access_tier = 'private' then
    if not (public.has_active_entitlement(v_user_id, 'apparently_private') or public.has_tester_access(v_user_id)) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  if v_requires_age_verification then
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

  if p_question_count <> v_expected_question_count then
    raise exception 'question_count (%) does not match this quiz''s real question count (%).', p_question_count, v_expected_question_count;
  end if;

  if v_scoring_type = 'numericBand' then
    select coalesce(sum(qc.flavor_score), 0) into v_real_score
      from jsonb_each_text(p_answers) a(question_key, choice_key)
      join public.quiz_questions qq on qq.quiz_id = v_quiz_id and qq.question_key = a.question_key
      join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key;

    v_real_percent := round((v_real_score::numeric / v_quiz_max_score::numeric) * 100);

    select result_key into v_real_result_id
      from public.quiz_result_definitions
      where quiz_id = v_quiz_id and v_real_score between min_score and max_score
      order by result_order
      limit 1;
    if v_real_result_id is null then
      select result_key into v_real_result_id
        from public.quiz_result_definitions
        where quiz_id = v_quiz_id
        order by result_order desc
        limit 1;
    end if;

  elsif v_scoring_type = 'archetype' then
    select winner_key, winner_total, total_points into v_real_result_id, v_real_score, v_total_points
      from public.resolve_archetype_result(v_quiz_id, p_answers, null, 3);
    v_real_percent := case when v_total_points > 0 then round((v_real_score::numeric / v_total_points::numeric) * 100) else 0 end;

  elsif v_scoring_type = 'dualDimension' then
    select winner_key into v_dimension_a_winner from public.resolve_archetype_result(v_quiz_id, p_answers, 'dimensionA', null);
    select winner_key into v_dimension_b_winner from public.resolve_archetype_result(v_quiz_id, p_answers, 'dimensionB', null);
    v_real_result_id := v_dimension_a_winner || ':' || v_dimension_b_winner;
    v_real_score := null;
    v_real_percent := null;
  else
    raise exception 'Unhandled scoring_type "%" for quiz_key "%".', v_scoring_type, p_quiz_key;
  end if;

  if p_result_id <> v_real_result_id then
    raise exception 'Submitted result_id "%" does not match the result these answers actually produce ("%"). A result must be verified against the real submitted answers, never merely known to exist.', p_result_id, v_real_result_id;
  end if;
  if v_real_score is not null and p_score <> v_real_score then
    raise exception 'Submitted score (%) does not match the real score these answers produce (%).', p_score, v_real_score;
  end if;
  if v_real_percent is not null and p_percent <> v_real_percent then
    raise exception 'Submitted percent (%) does not match the real percent these answers produce (%).', p_percent, v_real_percent;
  end if;

  select result_title into v_catalog_result_title
    from public.quiz_result_definitions
    where quiz_id = v_quiz_id and result_key = p_result_id;

  -- NEW (item 3): does ANOTHER content version sharing this logical identity already own the
  -- first-completion credit? Checked BEFORE this quiz_id's own history, so a replacement can
  -- never win a second "first completion" for what is, by product rule, the same quiz.
  select uqc.quiz_id, uqc.quiz_result_id
    into v_other_version_quiz_id, v_other_version_result_id
    from public.user_quiz_completions uqc
    join public.quizzes other_version on other_version.quiz_id = uqc.quiz_id
    where uqc.user_id = v_user_id and other_version.logical_quiz_key = v_logical_quiz_key and uqc.quiz_id <> v_quiz_id
    limit 1;

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

  if v_other_version_result_id is not null then
    -- A different content version of this SAME logical quiz already owns the first-
    -- completion identity -- this submission (on THIS version) is necessarily a retake of
    -- that identity, regardless of whether this specific quiz_id has any history of its own.
    -- Never reserve user_quiz_completions for v_quiz_id; never write evidence.
    return query select v_new_result_id, false, false;
    return;
  end if;

  if v_historical_result_id is not null then
    insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
    values (v_user_id, v_quiz_id, v_historical_result_id, v_historical_completed_at)
    on conflict (user_id, quiz_id) do nothing;

    return query select v_new_result_id, false, false;
    return;
  end if;

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

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission. Build 22 (2026-11-01, item 3): premium/age gating is now read from quizzes.access_tier/requires_age_verification (mirroring each quiz''s own QuizDefinition.access/category), never a hardcoded quiz-key list -- a future content-version replacement is classified correctly automatically. First-completion credit is now checked against ANY content version sharing the SAME quizzes.logical_quiz_key before this quiz_id''s own history, preserving one identity across versions by default. Result-metadata verification, historical-completion timestamp preservation, and clock-skew tolerance are unchanged from 20261101030000.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;

-- ============================================================================================
-- submit_quiz_result (V1, legacy sync path only): same access-inheritance fix; the SAME
-- cross-version logical-identity check now also guards its own user_quiz_completions
-- reservation. v_is_first (which still governs the unrelated, unchanged V1
-- personality_evidence write) is deliberately left exactly as-is -- that legacy mechanism is
-- untouched by this item.
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
  -- NEW (item 3): access inheritance + content-version identity continuity.
  v_access_tier text;
  v_requires_age_verification boolean;
  v_logical_quiz_key text;
  v_other_version_result_id uuid;
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

  -- CHANGED (item 3): data-driven, never a hardcoded quiz-key list. A legacy quiz_id unknown
  -- to the V2 catalog (v_access_tier/v_requires_age_verification both null) is treated as
  -- NOT gated -- exactly today's existing behavior for any quiz_id outside the old hardcoded
  -- list, unchanged.
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
      -- NEW (item 3): does ANOTHER content version sharing this logical identity already own
      -- the first-completion credit? If so, never reserve it a second time for v_v2_quiz_id.
      select uqc.quiz_result_id into v_other_version_result_id
        from public.user_quiz_completions uqc
        join public.quizzes other_version on other_version.quiz_id = uqc.quiz_id
        where uqc.user_id = v_user_id and other_version.logical_quiz_key = v_logical_quiz_key and uqc.quiz_id <> v_v2_quiz_id
        limit 1;

      if v_other_version_result_id is null then
        insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
        values (v_user_id, v_v2_quiz_id, v_new_id, p_completed_at)
        on conflict (user_id, quiz_id) do nothing;
      end if;
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Build 22 (2026-11-01, item 3): premium/age gating now reads quizzes.access_tier/requires_age_verification, never a hardcoded quiz-key list; its V2 user_quiz_completions reservation now also respects logical_quiz_key identity continuity across content versions. v_is_first (governing the legacy personality_evidence write) is unchanged. Idempotent on (user_id, quiz_id, completed_at).';

revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from public;
revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) to authenticated;
