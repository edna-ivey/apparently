-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-10-31), items 2 and 3 -- two real defects reproduced directly by
-- the owner in isolated PGlite, both inside submit_quiz_completion:
--
-- ITEM 2 (historical cutover failure): a user with an existing quiz_results row (1) and ZERO
-- user_quiz_completions rows (0) -- i.e. a historical completion the one-time backfill never
-- migrated, a MISSED RECORD -- submits a retake through submit_quiz_completion. The function
-- had no way to know this quiz was already completed, so its own atomic-decider INSERT found
-- no PK conflict, "won," and incorrectly treated the retake as the genuine first completion:
-- is_first_completion=true, 59 new user_trait_evidence rows fabricated for a quiz the user had
-- ALREADY completed. FIXED: before trusting user_quiz_completions' absence as "truly first,"
-- this function now checks for ANY pre-existing quiz_results row for this (user, quiz) BEFORE
-- the atomic decider runs. If one exists, it retroactively reserves the gate against that
-- EARLIEST historical row (completion-only, matching scripts/backfill-quiz-pole-evidence.ts's
-- own semantics exactly -- never fabricating evidence for a historical row this function never
-- validated p_answers against) and returns is_first_completion=false. This is a DEFENSE-IN-
-- DEPTH safety net for a missed migration record -- the primary mechanism remains running the
-- authorized backfill scripts BEFORE enabling new submission traffic; this makes a missed
-- record safe rather than silently wrong, it does not replace running the backfill.
--
-- ITEM 3 (timestamp trust): the owner separately reproduced submitting a first completion with
-- p_completed_at='2099-01-01'. The RPC accepted it and stored it directly into
-- user_quiz_completions.completed_at -- the SAME column get_my_active_quiz_completions()
-- filters on for the 12-month active window -- so a client-supplied date controlled whether a
-- quiz counts as "active" forever. FIXED: user_quiz_completions.completed_at (the ELIGIBILITY-
-- determining timestamp, in both the ordinary atomic-decider path and item 2's new retroactive-
-- reservation path above) is now ALWAYS this function's own server-trusted v_evidence_timestamp
-- (now()) -- a client-reported date can never again move a live completion in or out of the
-- active window. p_completed_at remains used ONLY for quiz_results.completed_at (display/
-- history/Compare, an already-accepted, already-documented trust boundary unchanged from
-- 20261006010000) and for exact-retry-match dedup (also unchanged -- matching a client's own
-- idempotency key is not an eligibility decision). A hard upper bound
-- (p_completed_at <= now()) is also added: a LIVE completion can never legitimately be dated
-- in the future, regardless of what it's used for display-wise, so this is rejected outright
-- rather than merely not trusted for eligibility.
--
-- Genuine historical imports (a real snapshot of old production data) remain the job of the
-- explicitly authorized, non-client-facing backfill scripts
-- (scripts/backfill-quiz-pole-evidence.ts + scripts/rebuild-user-trait-totals.ts), run by a
-- human against a real export -- never through this client-facing RPC. This migration does
-- NOT touch submit_quiz_result's existing legacy-sync timestamp handling (20261030020000) --
-- that path's whole purpose is preserving a REAL, already-recorded, genuinely historical local
-- completion date for a delayed/offline legacy sync, a deliberate and already-tested design
-- from the prior round, not the same "normal live submission" surface this item's reproduction
-- targeted. See this engagement's report for that explicit scoping decision.
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
  -- NEW (item 2): the earliest pre-existing quiz_results row for this (user, quiz), if any --
  -- a historical completion the backfill may have missed.
  v_historical_result_id uuid;
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
  -- NEW (item 3): a live completion can never legitimately be dated in the future. Rejected
  -- outright -- not merely "untrusted for eligibility" -- so a fabricated future date can
  -- never even land in quiz_results' own display history.
  if p_completed_at > v_evidence_timestamp then
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

  -- NEW (item 2): check BEFORE inserting this submission's own quiz_results row, so this
  -- query can never see itself.
  select id into v_historical_result_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_key
    order by completed_at asc
    limit 1;

  insert into public.quiz_results (
    user_id, quiz_id, completed_at, score, percent, result_id, result_title, traits, mix,
    question_count, answers
  ) values (
    v_user_id, p_quiz_key, p_completed_at, p_score, p_percent, p_result_id, p_result_title,
    coalesce(p_traits, '{}'), p_mix, p_question_count, p_answers
  ) returning id into v_new_result_id;

  if v_historical_result_id is not null then
    -- A historical completion already exists that user_quiz_completions does not yet know
    -- about -- retroactively reserve the gate against THAT row (never this new submission),
    -- using this function's own server-trusted v_evidence_timestamp (never a client-reported
    -- date -- see this migration's header). Safe against a concurrent winner via the same
    -- ON CONFLICT DO NOTHING every other path here already relies on.
    insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
    values (v_user_id, v_quiz_id, v_historical_result_id, v_evidence_timestamp)
    on conflict (user_id, quiz_id) do nothing;

    return query select v_new_result_id, false, false;
    return;
  end if;

  -- THE atomic first-completion decider, at (user_id, quiz_id) -- never per-question.
  -- CHANGED (item 3): completed_at is now v_evidence_timestamp (server now()), never
  -- p_completed_at -- the client can no longer control the timestamp
  -- get_my_active_quiz_completions() uses to decide active-window eligibility.
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

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission. Build 22 (2026-10-31, items 2+3): (1) defends against a MISSED historical-backfill record by checking for any pre-existing quiz_results row before trusting user_quiz_completions'' absence as "truly first" -- retroactively reserves the gate against the earliest such row rather than fabricating new evidence for what is actually a retake; (2) user_quiz_completions.completed_at (the 12-month active-eligibility timestamp) is now ALWAYS this function''s own server-trusted now(), never the client-reported p_completed_at, which remains used only for quiz_results display/history and exact-retry dedup; (3) p_completed_at in the future is rejected outright. Everything else unchanged from 20261030010000.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;

-- ============================================================================================
-- submit_quiz_result (V1, legacy sync path only): add the SAME future-date rejection, without
-- touching its existing, deliberate, already-tested old-date preservation (required for
-- delayed/offline legacy device sync -- see 20261030020000's own header). Everything else
-- byte-for-byte unchanged from that migration.
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
  -- NEW (item 3): a future completion date is never legitimate, even for a genuinely old
  -- legacy local record -- an old device's own clock cannot run ahead of the server's.
  -- Old dates remain fully trusted, unchanged -- that preservation is this RPC's entire
  -- purpose for the legacy sync path (20261030020000).
  if p_completed_at > now() then
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id), writes up to 6 personality_evidence rows from server-validated profile_effects. Build 16: additionally gates private-private-trouble on is_adult_eligible(). Build 22 (20261030020000): also reserves the V2 user_quiz_completions first-completion gate on the same first completion, completion-only. Build 22 (2026-10-31, item 3): rejects a future completed_at outright -- old dates remain fully trusted BY DESIGN, since this RPC''s entire purpose is preserving a genuinely historical local completion date for a delayed/offline legacy device sync. Idempotent on (user_id, quiz_id, completed_at). Everything else unchanged from 20261030020000.';
