-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-11-01), item 1: "Finish server-side result integrity." The owner
-- reproduced, against the actual latest staged migrations:
--   Quiz: Petty. Answers: q1-q8 all A. Correct score from the real quiz definition: 12/24.
--   Correct percentage: 50%. Correct result: selectively-petty / SELECTIVELY PETTY.
--   Submitted instead: score=24, percent=100, result_id=mostly-unbothered, arbitrary traits.
--   The RPC accepted the submission as a first completion and saved the contradictory
--   metadata.
--
-- The prior round's fix (20261101020000) only checked that a submitted result_id EXISTS for
-- the quiz -- never that the submitted ANSWERS actually produce it. This migration adds real
-- server-side verification for all three scoring types, using the new scoring data
-- 20261028020000's generator now emits (quizzes.scoring_type/max_score, quiz_questions.
-- position/scoring_role, quiz_choices.flavor_score, quiz_choice_result_weights) and the new
-- quiz_result_definitions.min_score/max_score/result_order columns (20261101010000):
--
--   numericBand (Petty, dating, ick): real score = sum of the submitted choices' own
--   flavor_score (mirrors scoring.ts's scoreQuiz exactly); real percent = round(score /
--   quiz.max_score * 100); real result = the band whose [min_score, max_score] contains the
--   real score, falling back to the highest-order band if none does (mirrors scoreQuiz's own
--   `?? definition.resultBands[length-1]` fallback).
--
--   archetype (crisis, friendship, food-order, spending, era, group-chat, one-bite,
--   unexpected-money, kid-you -- the 9 approved archetype quizzes, none of which set any of
--   scoring.ts's opt-in tie-break overrides, confirmed directly against their real content):
--   real totals = sum of the submitted choices' own resultWeights per candidate (every real
--   candidate included, defaulting to 0, mirroring scoreArchetypeQuiz's own pre-
--   initialization); ties broken by the SAME generic rule scoring.ts uses when no opt-in
--   override is set (pickPrimaryArchetypeGeneric: the most recent of the last 3 questions'
--   own single top-weight winner that is itself tied; otherwise the tied candidate with the
--   lowest authored array position) -- implemented once, in the new
--   resolve_archetype_result() helper below, reused for dualDimension too.
--
--   dualDimension (whats-your-type, the one real quiz of this type): each dimension's real
--   winner is resolved independently via the SAME helper (scoped by quiz_questions.
--   scoring_role, with an UNLIMITED tie-break window -- scoring.ts's resolveDimensionWinner
--   reverses its own dimension's ENTIRE question list, never just the last 3, which this
--   round's helper supports via a nullable window parameter); the real result_id is the
--   "dimensionA:dimensionB" combination of both winners, the exact same key format
--   quiz_result_definitions already stores. score/percent for this type are a fixed client
--   convention (questionCount/100, never scoring.ts-computed) and are therefore not
--   independently re-verified here -- only result_id is, which is the only field this
--   scoring type's own submission logic ever actually derives from the answers.
--
-- KNOWN, DELIBERATE, NARROW SCOPE LIMIT (stated plainly, not glossed over): scoring.ts's
-- opt-in tie-break overrides (highSignalQuestionIds, resultGates, enableCloseSecond,
-- tieFallbackOrder, primaryTieWeight, finalTieQuestionId, countPrimaryMatchesTieBreak) are
-- used ONLY by quizzes that are currently HELD (career-ambition-how-bad/-proving,
-- hidden-you-wrong, life-match-dream-life, private-private-trouble, style-vibe-intimidating,
-- love-ready, keep-you-around, be-so-serious -- confirmed directly: zero APPROVED quiz uses
-- any of them). Replicating those overrides in SQL is real additional scope this migration
-- deliberately does not take on, since none of them can currently produce real personality
-- evidence anyway (their quizzes are unmapped). If any currently-held quiz using an override
-- is approved in the future, this verification would need a matching extension FIRST -- it is
-- flagged here so that gap is never silently assumed closed.
-- ============================================================================================

-- ============================================================================================
-- resolve_archetype_result: the one real scoring computation this fix needs, implemented
-- once and reused for both archetype quizzes (p_scoring_role = null, p_tiebreak_window = 3)
-- and each half of a dualDimension quiz (p_scoring_role = 'dimensionA'/'dimensionB',
-- p_tiebreak_window = null, i.e. unlimited). Pure SQL (no side effects, genuinely STABLE) --
-- every candidate real for this quiz/dimension is included via `universe`, defaulting to 0,
-- so an all-zero submission (not reachable by any real content today, since every real choice
-- carries exactly one nonzero resultWeights entry, but handled correctly regardless) still
-- resolves deterministically rather than silently returning nothing.
-- ============================================================================================

create or replace function public.resolve_archetype_result(
  p_quiz_id smallint,
  p_answers jsonb,
  p_scoring_role text,
  p_tiebreak_window integer
)
returns table (winner_key text, winner_total integer, total_points integer)
language sql
stable
as $$
  with universe as (
    select distinct w.result_component_key
    from public.quiz_choice_result_weights w
    join public.quiz_choices qc on qc.choice_id = w.choice_id
    join public.quiz_questions qq on qq.question_id = qc.question_id
    where qq.quiz_id = p_quiz_id
      and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
  ),
  chosen as (
    select qq.position, qc.choice_id
    from jsonb_each_text(p_answers) a(question_key, choice_key)
    join public.quiz_questions qq on qq.quiz_id = p_quiz_id and qq.question_key = a.question_key
      and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
    join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
  ),
  weights as (
    select c.position, w.result_component_key, w.weight
    from chosen c
    join public.quiz_choice_result_weights w on w.choice_id = c.choice_id
  ),
  totals as (
    select u.result_component_key, coalesce(sum(w.weight), 0)::integer as total
    from universe u
    left join weights w on w.result_component_key = u.result_component_key
    group by u.result_component_key
  ),
  max_total as (select coalesce(max(total), 0) as m from totals),
  tied as (select t.result_component_key from totals t, max_total where t.total = max_total.m),
  tied_count as (select count(*) as n from tied),
  per_question_winner as (
    select position, result_component_key,
      row_number() over (partition by position order by weight desc) as rn
    from weights
  ),
  -- The last p_tiebreak_window questions' own top-weight winner, most recent first (null
  -- window = ALL of them, matching Postgres's own "LIMIT NULL means no limit" semantics --
  -- used by dualDimension, which reverses its ENTIRE dimension-scoped question list, never
  -- just the last 3).
  recent_window as (
    select position, result_component_key
    from per_question_winner
    where rn = 1
    order by position desc
    limit p_tiebreak_window
  ),
  tiebreak_recent as (
    select r.result_component_key
    from recent_window r
    where r.result_component_key in (select result_component_key from tied)
    order by r.position desc
    limit 1
  ),
  -- Final fallback: the tied candidate with the lowest authored result_order (archetype
  -- quizzes only have this in quiz_result_definitions directly, since their
  -- result_component_key IS the final result_id; dualDimension's own per-dimension
  -- archetype ids are not final result_ids, so they fall back to the lowest key
  -- alphabetically -- a deterministic, documented stand-in for a path no approved quiz's
  -- real content can actually reach, confirmed: whats-your-type's uniform 3-point-per-choice
  -- scheme only ties when two archetypes are perfectly even all the way through one
  -- dimension's real questions, which this migration's own regression tests exercise
  -- directly to prove this fallback is at least deterministic even then).
  tiebreak_fallback as (
    select t.result_component_key
    from tied t
    left join public.quiz_result_definitions rd on rd.quiz_id = p_quiz_id and rd.result_key = t.result_component_key
    order by coalesce(rd.result_order, 32767), t.result_component_key
    limit 1
  ),
  winner as (
    select case
      when (select n from tied_count) = 1 then (select result_component_key from tied limit 1)
      else coalesce((select result_component_key from tiebreak_recent), (select result_component_key from tiebreak_fallback))
    end as result_component_key
  )
  select
    w.result_component_key,
    (select t.total from totals t where t.result_component_key = w.result_component_key),
    (select coalesce(sum(t2.total), 0)::integer from totals t2)
  from winner w;
$$;

comment on function public.resolve_archetype_result(smallint, jsonb, text, integer) is 'The one real archetype-style scoring computation submit_quiz_completion needs, implemented once and reused for both plain archetype quizzes (p_scoring_role=null, p_tiebreak_window=3, mirroring scoring.ts''s TIE_BREAK_QUESTION_COUNT) and each half of a dualDimension quiz (p_scoring_role=''dimensionA''/''dimensionB'', p_tiebreak_window=null i.e. unlimited, mirroring resolveDimensionWinner''s own full-list reversal). Pure SQL, STABLE, no side effects. See this file''s own header for the full rationale and its one documented scope limit (opt-in tie-break overrides, used only by currently-held quizzes).';

revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from public;
revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from anon;
grant execute on function public.resolve_archetype_result(smallint, jsonb, text, integer) to authenticated;

-- ============================================================================================
-- submit_quiz_completion: the score/percent/question_count/result_id bound-and-existence
-- checks from 20261101020000 are now REPLACED by real verification -- a submitted result must
-- be PRODUCED by the submitted answers, not merely a known, plausible-looking value.
-- Everything else (historical-completion timestamp preservation, clock-skew tolerance,
-- server-trusted eligibility timestamps, the retroactive-reservation safety net) is
-- byte-for-byte unchanged from 20261101020000.
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
  -- NEW (item 1, this round): real, server-computed scoring verification.
  v_scoring_type text;
  v_quiz_max_score integer;
  v_real_result_id text;
  v_real_score integer;
  v_real_percent integer;
  v_total_points integer;
  v_dimension_a_winner text;
  v_dimension_b_winner text;
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

  select quiz_id, scoring_type, max_score into v_quiz_id, v_scoring_type, v_quiz_max_score
    from public.quizzes where quiz_key = p_quiz_key;
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

  if p_question_count <> v_expected_question_count then
    raise exception 'question_count (%) does not match this quiz''s real question count (%).', p_question_count, v_expected_question_count;
  end if;

  -- NEW (item 1, this round): REAL server-side scoring, replacing the prior round's bound-
  -- and-existence-only checks. A submitted result must be PRODUCED by the submitted answers.
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
      -- Mirrors scoreQuiz's own `?? definition.resultBands[definition.resultBands.length-1]`
      -- fallback -- defensive only; real resultBands are expected to cover the full range.
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
    -- score/percent for this scoring type are a fixed client convention (questionCount/100),
    -- never scoring.ts-computed from weights -- not independently re-verified here, only
    -- result_id is (the only field this type's submission logic actually derives).
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

  -- The catalog's own approved title for the NOW-VERIFIED result_id -- never the client's.
  select result_title into v_catalog_result_title
    from public.quiz_result_definitions
    where quiz_id = v_quiz_id and result_key = p_result_id;

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

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission. Build 22 (2026-11-01, item 1): a submitted result_id/score/percent must now be PRODUCED by the submitted answers (verified via resolve_archetype_result for archetype/dualDimension, direct flavor_score summation for numericBand), never merely a known value within a plausible range. result_title stored is always the catalog''s own approved title for the now-verified result_id. Historical-completion timestamp preservation, clock-skew tolerance, and server-trusted eligibility timestamps are unchanged from 20261101020000.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;
