-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-11-01), V1 scope round. Three parts:
--
-- 1. CONFIGURABLE ARCHETYPE SCORING ENGINE ("a reusable, versioned scoring configuration
--    representation rather than hardcoding each quiz into a separate SQL function"). The four
--    newly approved Private quizzes use scoring.ts's opt-in tie-break/gate fields
--    (highSignalQuestionIds, resultGates, tieFallbackOrder, primaryTieWeight,
--    finalTieQuestionId, countPrimaryMatchesTieBreak) -- the exact scope
--    20261101030000 documented as a deliberate, narrow limit ("Replicating those overrides in
--    SQL is real additional scope this migration deliberately does not take on"). That gap
--    cannot ship with these quizzes: the app and server would disagree on which result is
--    correct. resolve_archetype_result is rewritten (same signature, same callers, nothing
--    else changes) to read quizzes.scoring_config (new column, 20261028020000 this round) and
--    reproduce scoring.ts's full algorithm -- eligibility gates, the opt-in high-signal tie
--    path, the opt-in countPrimaryMatchesTieBreak/finalTieQuestionId steps, and the
--    tieFallbackOrder/archetype-array-order fallback -- not just the generic last-3-questions
--    path. A null/empty scoring_config (every quiz before this round) behaves byte-identically
--    to the previous version. quiz_choice_result_weights gained a weight_order column
--    (20261028020000 this round) so a tie BETWEEN TWO ENTRIES ON THE SAME CHOICE (the
--    "blended weights" this round's content introduces, e.g. Love Q3A "BAE +1; TERMS +1")
--    resolves the same deterministic way scoring.ts's primaryWeightEntry does (first-authored
--    wins) -- no existing quiz has ever had more than one resultWeights entry per choice, so
--    this is additive, not a behavior change for any of them.
--
-- 2. PRIVATE QUIZ TRAIT-AWARD ACTIVATION. love-soulmates-ready, career-ambition-how-bad,
--    career-ambition-proving, and hidden-you-wrong are the first Private quizzes ever approved
--    for real server-side Creature/Relic award activation (scripts/lib/private-quiz-trait-
--    awards.ts, transcribed directly from the four locked documents' own numeric trait IDs).
--    No change is needed here beyond the already-regenerated 20261028020000 (which now emits
--    their quiz_choice_trait_awards rows) -- this item is called out so it is never mistaken
--    for an unrelated, unapproved activation.
--
-- 3. LEGACY CROSS-VERSION PERSONALITY-EVIDENCE LOOPHOLE (item 7: "Correct any cross-version
--    legacy first-completion credit loopholes, including any legacy personality-evidence
--    writes that might still earn credit after a different content version was completed").
--    20261101040000 added a cross-version check that correctly stops submit_quiz_result's
--    user_quiz_completions reservation from firing twice for the same logical quiz -- but its
--    v_is_first flag (which independently gates the personality_evidence INSERT) was computed
--    ONLY from "does THIS quiz_id have prior history", never from logical_quiz_key. A user who
--    completes content version A (quiz_id 10, logical_key L) via the legacy submit_quiz_result
--    path, then later completes version B (quiz_id 11, same logical_key L) via the SAME legacy
--    path, would have v_is_first evaluate to TRUE for quiz_id 11 (its OWN quiz_results history
--    is empty) and write a SECOND round of personality_evidence rows for the same logical
--    quiz -- a genuine double-credit bug, confirmed by tracing the function as it stood.
--    Fixed: the SAME cross-version lookup already used for the user_quiz_completions
--    reservation now also gates the personality_evidence write.
-- ============================================================================================

-- ============================================================================================
-- resolve_archetype_result: rewritten as a single plpgsql function (was `language sql`) --
-- the gate/tie-break control flow below has real branching (eligibility gates, two distinct
-- tie-break strategies, several sequential tie-break steps) that is far more directly
-- verifiable written as explicit, named steps than as nested CTEs; submit_quiz_completion's
-- call site is UNCHANGED (same name, same four arguments, same return shape).
-- ============================================================================================

create or replace function public.resolve_archetype_result(
  p_quiz_id smallint,
  p_answers jsonb,
  p_scoring_role text,
  p_tiebreak_window integer
)
returns table (winner_key text, winner_total integer, total_points integer)
language plpgsql
stable
as $$
declare
  v_cfg jsonb;
  v_high_signal_ids text[] := array[]::text[];
  v_primary_tie_weight int := 2;
  v_count_primary_matches boolean := false;
  v_final_tie_question_id text := null;
  v_tie_fallback_order text[] := null;
  v_result_gates jsonb := '{}'::jsonb;

  v_keys text[];
  v_n int;
  v_totals int[];
  v_eligible boolean[];
  v_total_points int := 0;
  v_max_total int;
  v_tied text[] := array[]::text[];

  -- Per-question (by authored position) data, ordered by position ascending.
  v_positions int[];
  v_q_keys text[];
  v_q_winner_keys text[];
  v_q_winner_weights int[];
  v_qcount int;

  v_i int;
  v_j int;
  v_key text;
  v_gate jsonb;
  v_signals text[];
  v_enough boolean;
  v_groups_ok boolean;
  v_counted_groups_ok boolean;
  v_grp jsonb;
  v_cnt int;

  v_cand text[];
  v_metric int[];
  v_best int;
  v_next text[];

  v_winner text := null;
  v_sum int;
  v_window int;
  v_start int;
  v_hs_total int;
  v_match_count int;
  v_final_winner text;
begin
  select coalesce(scoring_config, '{}'::jsonb) into v_cfg from public.quizzes where quiz_id = p_quiz_id;

  if v_cfg ? 'highSignalQuestionIds' then
    select coalesce(array_agg(x), array[]::text[]) into v_high_signal_ids from jsonb_array_elements_text(v_cfg->'highSignalQuestionIds') x;
  end if;
  if v_cfg ? 'primaryTieWeight' then
    v_primary_tie_weight := (v_cfg->>'primaryTieWeight')::int;
  end if;
  if v_cfg ? 'countPrimaryMatchesTieBreak' then
    v_count_primary_matches := (v_cfg->>'countPrimaryMatchesTieBreak')::boolean;
  end if;
  if v_cfg ? 'finalTieQuestionId' then
    v_final_tie_question_id := v_cfg->>'finalTieQuestionId';
  end if;
  if v_cfg ? 'tieFallbackOrder' then
    select array_agg(x) into v_tie_fallback_order from jsonb_array_elements_text(v_cfg->'tieFallbackOrder') x;
  end if;
  v_result_gates := coalesce(v_cfg->'resultGates', '{}'::jsonb);

  -- universe: every real result_component_key for this quiz/scoring_role, ordered by
  -- result_order (the authored archetypes[] array position -- the same source
  -- generate-quiz-result-catalog-sql.ts uses) -- this doubles as the "archetype array order"
  -- fallback scoring.ts's own tie-break functions rely on.
  select coalesce(array_agg(result_component_key order by ord), array[]::text[]) into v_keys
  from (
    select distinct w.result_component_key, coalesce(rd.result_order, 32767) as ord
    from public.quiz_choice_result_weights w
    join public.quiz_choices qc on qc.choice_id = w.choice_id
    join public.quiz_questions qq on qq.question_id = qc.question_id
    left join public.quiz_result_definitions rd on rd.quiz_id = p_quiz_id and rd.result_key = w.result_component_key
    where qq.quiz_id = p_quiz_id and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
  ) u;
  v_n := coalesce(array_length(v_keys, 1), 0);

  -- Per-question top-weight winner (mirrors scoring.ts's primaryWeightEntry: the single
  -- highest-weight resultWeights entry on the CHOSEN choice; a same-choice value tie resolves
  -- to whichever entry was authored first -- weight_order ascending).
  with chosen as (
    select qq.position, qq.question_key, qc.choice_id
    from jsonb_each_text(p_answers) a(question_key, choice_key)
    join public.quiz_questions qq on qq.quiz_id = p_quiz_id and qq.question_key = a.question_key
      and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
    join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
  ),
  weighted as (
    select c.position, c.question_key, w.result_component_key, w.weight, w.weight_order
    from chosen c
    join public.quiz_choice_result_weights w on w.choice_id = c.choice_id
  ),
  per_q_winner as (
    select distinct on (position) position, question_key, result_component_key, weight
    from weighted
    order by position, weight desc, weight_order asc
  )
  select
    coalesce(array_agg(position order by position), array[]::int[]),
    coalesce(array_agg(question_key order by position), array[]::text[]),
    coalesce(array_agg(result_component_key order by position), array[]::text[]),
    coalesce(array_agg(weight order by position), array[]::int[])
  into v_positions, v_q_keys, v_q_winner_keys, v_q_winner_weights
  from per_q_winner;
  v_qcount := coalesce(array_length(v_positions, 1), 0);

  -- Candidate totals: every real candidate, defaulting to 0 (mirrors scoreArchetypeQuiz's own
  -- pre-initialization of totals for every archetype before summing).
  v_totals := array_fill(0, array[greatest(v_n, 1)]);
  for v_i in 1..v_n loop
    select coalesce(sum(w.weight), 0) into v_sum
    from jsonb_each_text(p_answers) a(question_key, choice_key)
    join public.quiz_questions qq on qq.quiz_id = p_quiz_id and qq.question_key = a.question_key
      and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
    join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
    join public.quiz_choice_result_weights w on w.choice_id = qc.choice_id and w.result_component_key = v_keys[v_i];
    v_totals[v_i] := v_sum;
    v_total_points := v_total_points + v_sum;
  end loop;

  -- Eligibility: a candidate with no configured gate is always eligible. A gated candidate's
  -- signals are "question_key-choice_key" pairs where the chosen choice awards it > 0 points
  -- -- mirrors scoring.ts's eligibleArchetypeIds exactly (minSignals / requiredAnyOf /
  -- requiredGroups).
  v_eligible := array_fill(true, array[greatest(v_n, 1)]);
  for v_i in 1..v_n loop
    v_key := v_keys[v_i];
    v_gate := v_result_gates->v_key;
    if v_gate is not null then
      select coalesce(array_agg(a.question_key || '-' || a.choice_key), array[]::text[]) into v_signals
      from jsonb_each_text(p_answers) a(question_key, choice_key)
      join public.quiz_questions qq on qq.quiz_id = p_quiz_id and qq.question_key = a.question_key
        and (p_scoring_role is null or qq.scoring_role = p_scoring_role)
      join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
      join public.quiz_choice_result_weights w on w.choice_id = qc.choice_id and w.result_component_key = v_key and w.weight > 0;

      v_enough := true;
      if v_gate ? 'minSignals' then
        v_enough := coalesce(array_length(v_signals, 1), 0) >= (v_gate->>'minSignals')::int;
      end if;

      v_groups_ok := true;
      if v_gate ? 'requiredAnyOf' then
        for v_grp in select * from jsonb_array_elements(v_gate->'requiredAnyOf') loop
          if not exists (select 1 from jsonb_array_elements_text(v_grp) k where k.value = any(v_signals)) then
            v_groups_ok := false;
          end if;
        end loop;
      end if;

      v_counted_groups_ok := true;
      if v_gate ? 'requiredGroups' then
        for v_grp in select * from jsonb_array_elements(v_gate->'requiredGroups') loop
          select count(*) into v_cnt from jsonb_array_elements_text(v_grp->'answers') k where k.value = any(v_signals);
          if v_cnt < (v_grp->>'min')::int then
            v_counted_groups_ok := false;
          end if;
        end loop;
      end if;

      v_eligible[v_i] := v_enough and v_groups_ok and v_counted_groups_ok;
    end if;
  end loop;

  -- Highest total among eligible candidates; the tied set.
  v_max_total := null;
  for v_i in 1..v_n loop
    if v_eligible[v_i] and (v_max_total is null or v_totals[v_i] > v_max_total) then
      v_max_total := v_totals[v_i];
    end if;
  end loop;
  for v_i in 1..v_n loop
    if v_eligible[v_i] and v_totals[v_i] = v_max_total then
      v_tied := array_append(v_tied, v_keys[v_i]);
    end if;
  end loop;

  if array_length(v_tied, 1) = 1 then
    v_winner := v_tied[1];

  elsif coalesce(array_length(v_high_signal_ids, 1), 0) = 0 then
    -- GENERIC tie-break (pickPrimaryArchetypeGeneric): the most recent of the last
    -- p_tiebreak_window questions' own top-weight winner that is itself tied (null window =
    -- unlimited, matching the dualDimension "reverse the whole list" behavior); else the
    -- tied candidate appearing earliest in archetype-array order (v_keys).
    v_window := coalesce(p_tiebreak_window, v_qcount);
    v_start := greatest(v_qcount - v_window + 1, 1);
    for v_j in reverse v_qcount..v_start loop
      if v_q_winner_keys[v_j] = any(v_tied) then
        v_winner := v_q_winner_keys[v_j];
        exit;
      end if;
    end loop;
    if v_winner is null then
      for v_i in 1..v_n loop
        if v_keys[v_i] = any(v_tied) then
          v_winner := v_keys[v_i];
          exit;
        end if;
      end loop;
    end if;

  else
    -- Opt-in HIGH-SIGNAL tie-break (pickPrimaryArchetypeByHighSignal), step by step, each
    -- narrowing v_cand from the previous step's survivors.
    v_cand := v_tied;

    -- Step 1: highest total of ALL weight entries (primary or secondary) on the designated
    -- high-signal questions, restricted to the currently tied candidates.
    v_metric := array_fill(0, array[greatest(array_length(v_cand, 1), 1)]);
    for v_i in 1..array_length(v_cand, 1) loop
      select coalesce(sum(w.weight), 0) into v_hs_total
      from jsonb_each_text(p_answers) a(question_key, choice_key)
      join public.quiz_questions qq on qq.quiz_id = p_quiz_id and qq.question_key = a.question_key
        and (p_scoring_role is null or qq.scoring_role = p_scoring_role) and qq.question_key = any(v_high_signal_ids)
      join public.quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
      join public.quiz_choice_result_weights w on w.choice_id = qc.choice_id and w.result_component_key = v_cand[v_i];
      v_metric[v_i] := v_hs_total;
    end loop;
    v_best := null;
    for v_i in 1..array_length(v_cand, 1) loop
      if v_best is null or v_metric[v_i] > v_best then v_best := v_metric[v_i]; end if;
    end loop;
    v_next := array[]::text[];
    for v_i in 1..array_length(v_cand, 1) loop
      if v_metric[v_i] = v_best then v_next := array_append(v_next, v_cand[v_i]); end if;
    end loop;
    v_cand := v_next;

    if array_length(v_cand, 1) > 1 then
      -- Step 2: count of questions where this candidate is the per-question top-weight
      -- winner AND that winning weight equals v_primary_tie_weight (a "full primary"
      -- selection, e.g. a +2 or +3, never a weak secondary contribution).
      v_metric := array_fill(0, array[array_length(v_cand, 1)]);
      for v_i in 1..array_length(v_cand, 1) loop
        v_match_count := 0;
        for v_j in 1..v_qcount loop
          if v_q_winner_keys[v_j] = v_cand[v_i] and v_q_winner_weights[v_j] = v_primary_tie_weight then
            v_match_count := v_match_count + 1;
          end if;
        end loop;
        v_metric[v_i] := v_match_count;
      end loop;
      v_best := null;
      for v_i in 1..array_length(v_cand, 1) loop
        if v_best is null or v_metric[v_i] > v_best then v_best := v_metric[v_i]; end if;
      end loop;
      v_next := array[]::text[];
      for v_i in 1..array_length(v_cand, 1) loop
        if v_metric[v_i] = v_best then v_next := array_append(v_next, v_cand[v_i]); end if;
      end loop;
      v_cand := v_next;
    end if;

    if array_length(v_cand, 1) > 1 and v_count_primary_matches then
      -- Step 3 (opt-in): count of questions where this candidate is the per-question
      -- top-weight winner, REGARDLESS of weight value.
      v_metric := array_fill(0, array[array_length(v_cand, 1)]);
      for v_i in 1..array_length(v_cand, 1) loop
        v_match_count := 0;
        for v_j in 1..v_qcount loop
          if v_q_winner_keys[v_j] = v_cand[v_i] then
            v_match_count := v_match_count + 1;
          end if;
        end loop;
        v_metric[v_i] := v_match_count;
      end loop;
      v_best := null;
      for v_i in 1..array_length(v_cand, 1) loop
        if v_best is null or v_metric[v_i] > v_best then v_best := v_metric[v_i]; end if;
      end loop;
      v_next := array[]::text[];
      for v_i in 1..array_length(v_cand, 1) loop
        if v_metric[v_i] = v_best then v_next := array_append(v_next, v_cand[v_i]); end if;
      end loop;
      v_cand := v_next;
    end if;

    if array_length(v_cand, 1) = 1 then
      v_winner := v_cand[1];
    else
      -- Step 4 (opt-in): the designated final-tie question's own top-weight winner, if it is
      -- still among the survivors.
      if v_final_tie_question_id is not null then
        v_final_winner := null;
        for v_j in 1..v_qcount loop
          if v_q_keys[v_j] = v_final_tie_question_id then
            v_final_winner := v_q_winner_keys[v_j];
          end if;
        end loop;
        if v_final_winner is not null and v_final_winner = any(v_cand) then
          v_winner := v_final_winner;
        end if;
      end if;

      -- Step 5: explicit tieFallbackOrder if configured, else archetype-array order (v_keys).
      if v_winner is null then
        if v_tie_fallback_order is not null then
          for v_i in 1..array_length(v_tie_fallback_order, 1) loop
            if v_tie_fallback_order[v_i] = any(v_cand) then
              v_winner := v_tie_fallback_order[v_i];
              exit;
            end if;
          end loop;
        end if;
      end if;
      if v_winner is null then
        for v_i in 1..v_n loop
          if v_keys[v_i] = any(v_cand) then
            v_winner := v_keys[v_i];
            exit;
          end if;
        end loop;
      end if;
      if v_winner is null then
        v_winner := v_cand[1];
      end if;
    end if;
  end if;

  return query select v_winner, v_totals[array_position(v_keys, v_winner)], v_total_points;
end;
$$;

comment on function public.resolve_archetype_result(smallint, jsonb, text, integer) is 'The one real archetype-style scoring computation submit_quiz_completion needs. Reads quizzes.scoring_config (a per-quiz JSON mirror of scoring.ts''s opt-in ArchetypeQuizDefinition fields: highSignalQuestionIds, resultGates, tieFallbackOrder, primaryTieWeight, finalTieQuestionId, countPrimaryMatchesTieBreak) and reproduces the full algorithm -- eligibility gates, the opt-in high-signal tie-break path (with its own sequential sub-steps), and the generic last-N-questions tie-break when no config is set. A null/empty scoring_config behaves exactly as the previous, unconfigured version did. Reused for both plain archetype quizzes (p_scoring_role=null, p_tiebreak_window=3) and each half of a dualDimension quiz (p_scoring_role=''dimensionA''/''dimensionB'', p_tiebreak_window=null i.e. unlimited), neither of which ever sets scoring_config today.';

revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from public;
revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from anon;
grant execute on function public.resolve_archetype_result(smallint, jsonb, text, integer) to authenticated;

-- ============================================================================================
-- submit_quiz_result: fix the item-7 cross-version personality_evidence loophole. Identical
-- to 20261101040000's version except the single `if v_is_first and p_profile_effects...`
-- condition below, which now ALSO requires that no other content version sharing this
-- logical identity already holds the first-completion credit -- the SAME lookup that version
-- already uses to guard the user_quiz_completions reservation, computed slightly earlier so
-- both gates can share it.
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
  v_access_tier text;
  v_requires_age_verification boolean;
  v_logical_quiz_key text;
  v_other_version_result_id uuid;
  -- NEW (item 7): computed once, right after v_is_first, and reused to gate BOTH the
  -- user_quiz_completions reservation AND the personality_evidence write -- previously only
  -- the former was guarded, letting a second content version's legacy submission still earn
  -- a second round of permanent personality_evidence for the same logical quiz.
  v_blocked_by_other_version boolean := false;
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

  -- NEW (item 7): resolve this ONCE, before either gate needs it, from the SAME lookup
  -- 20261101040000 already performs inside `if v_is_first`.
  if v_is_first then
    select quiz_id into v_v2_quiz_id from public.quizzes where quiz_key = p_quiz_id;
    if v_v2_quiz_id is not null then
      select uqc.quiz_result_id into v_other_version_result_id
        from public.user_quiz_completions uqc
        join public.quizzes other_version on other_version.quiz_id = uqc.quiz_id
        where uqc.user_id = v_user_id and other_version.logical_quiz_key = v_logical_quiz_key and uqc.quiz_id <> v_v2_quiz_id
        limit 1;
      v_blocked_by_other_version := v_other_version_result_id is not null;
    end if;
  end if;

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

  if v_is_first and v_v2_quiz_id is not null and not v_blocked_by_other_version then
    insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
    values (v_user_id, v_v2_quiz_id, v_new_id, p_completed_at)
    on conflict (user_id, quiz_id) do nothing;
  end if;

  -- CHANGED (item 7): now ALSO requires `not v_blocked_by_other_version` -- a content-version
  -- replacement completed via this legacy path can no longer earn a second round of
  -- permanent personality_evidence for a logical quiz another version already credited.
  if v_is_first and not v_blocked_by_other_version and p_profile_effects is not null and p_profile_effects <> 'null'::jsonb then
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
  'Persists a completed quiz result and, ONLY on the first completion of a given (user, quiz_id) AND only when no other content version sharing the same logical_quiz_key already holds that credit, writes up to 6 personality_evidence rows from server-validated profile_effects. Build 22 (2026-11-01): fixes a cross-version double-credit loophole in the legacy personality_evidence write path (20261101040000 had already fixed the analogous user_quiz_completions reservation, but not this one). Idempotent on (user_id, quiz_id, completed_at).';

revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from public;
revoke all on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_result(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb, jsonb) to authenticated;
