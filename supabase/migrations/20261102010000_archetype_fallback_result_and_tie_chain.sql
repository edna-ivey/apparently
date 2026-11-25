-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 owner audit (2026-11-02), second implementation round. Two small, targeted
-- extensions to resolve_archetype_result (same signature, same callers), needed by the newly
-- approved free-preview revisions:
--
-- 1. MULTI-QUESTION TIE CHAIN. keep-you-around's approved tie order ends in "the last
--    diagnostic question among Q8, Q6, Q5, Q3, Q1" -- a SEQUENCE of final-tie questions
--    checked in order, not the single question the prior round's finalTieQuestionId
--    supported. scoring.ts's own finalTieQuestionId now accepts a string OR a string array
--    (a bare string is a one-element list, so every quiz using the old single-id form is
--    unaffected); this migration mirrors that exact change in SQL.
--
-- 2. ZERO-WEIGHT FALLBACK RESULTS. be-so-serious's revised content adds a sixth outcome, MX
--    ("you're not the villain, you're also not above it") -- a genuine safety net that wins
--    ONLY when all five real, gated outcomes (CT/PU/HM/AC harsh gates, HW's own "at least 3
--    different +2 choices" gate) fail to qualify. MX itself never receives resultWeights from
--    any real choice (it is not a scored dimension), so it was previously undiscoverable: the
--    old `universe` CTE found candidates ONLY via quiz_choice_result_weights, which MX never
--    appears in. Fixed by sourcing `universe`, for plain archetype quizzes (p_scoring_role is
--    null) only, from quiz_result_definitions instead -- which already has one row per real
--    archetypes[] entry regardless of whether that archetype ever receives weights (see
--    generate-quiz-result-catalog-sql.ts's own unconditional `.forEach` over the array). No
--    new scoring_config field needed: once MX is discoverable, the EXISTING logic already
--    handles it correctly with zero special-casing -- it is "ungated" (always eligible) with
--    a total that is always 0, so it only wins the normal eligible-candidates max-total
--    comparison when it is the LAST one left standing (every real, weight-bearing candidate
--    having been excluded by its own gate) and therefore the sole, automatic
--    tied.length===1 winner. dualDimension's per-dimension universe (p_scoring_role is NOT
--    null) is unchanged -- whats-your-type's own per-dimension archetype ids are never stored
--    in quiz_result_definitions (only the final "dimA:dimB" combination keys are), so it must
--    keep discovering its universe via quiz_choice_result_weights as before.
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
  v_final_tie_question_ids text[] := null;
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
  v_k int;
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
  -- NEW: finalTieQuestionId may be a bare JSON string (one question, every quiz before this
  -- round) or a JSON array (a sequence, e.g. keep-you-around's Q8/Q6/Q5/Q3/Q1 chain).
  if v_cfg ? 'finalTieQuestionId' then
    if jsonb_typeof(v_cfg->'finalTieQuestionId') = 'array' then
      select array_agg(x) into v_final_tie_question_ids from jsonb_array_elements_text(v_cfg->'finalTieQuestionId') x;
    else
      v_final_tie_question_ids := array[v_cfg->>'finalTieQuestionId'];
    end if;
  end if;
  if v_cfg ? 'tieFallbackOrder' then
    select array_agg(x) into v_tie_fallback_order from jsonb_array_elements_text(v_cfg->'tieFallbackOrder') x;
  end if;
  v_result_gates := coalesce(v_cfg->'resultGates', '{}'::jsonb);

  -- universe: every real result_component_key for this quiz/scoring_role, ordered by
  -- result_order (the authored archetypes[] array position). For a plain archetype quiz
  -- (p_scoring_role is null), sourced from quiz_result_definitions -- covers EVERY authored
  -- archetype, including one (like MX) that never receives any real resultWeights. For a
  -- dualDimension half (p_scoring_role is NOT null), unchanged: sourced from
  -- quiz_choice_result_weights, since per-dimension archetype ids have no quiz_result_
  -- definitions row of their own.
  if p_scoring_role is null then
    select coalesce(array_agg(result_key order by result_order), array[]::text[]) into v_keys
    from public.quiz_result_definitions
    where quiz_id = p_quiz_id;
  else
    select coalesce(array_agg(result_component_key order by ord), array[]::text[]) into v_keys
    from (
      select distinct w.result_component_key, coalesce(rd.result_order, 32767) as ord
      from public.quiz_choice_result_weights w
      join public.quiz_choices qc on qc.choice_id = w.choice_id
      join public.quiz_questions qq on qq.question_id = qc.question_id
      left join public.quiz_result_definitions rd on rd.quiz_id = p_quiz_id and rd.result_key = w.result_component_key
      where qq.quiz_id = p_quiz_id and qq.scoring_role = p_scoring_role
    ) u;
  end if;
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
  -- pre-initialization of totals for every archetype before summing). A candidate with zero
  -- quiz_choice_result_weights rows (e.g. MX) correctly stays at 0 here -- the join simply
  -- matches nothing.
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

  -- Eligibility: a candidate with no configured gate is always eligible (true for MX, by
  -- design -- it carries no resultGates entry). A gated candidate's signals are
  -- "question_key-choice_key" pairs where the chosen choice awards it > 0 points -- mirrors
  -- scoring.ts's eligibleArchetypeIds exactly (minSignals / requiredAnyOf / requiredGroups).
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
      -- Step 4 (opt-in): each designated final-tie question, IN ORDER -- the first whose own
      -- top-weight winner is still among the survivors wins.
      if v_final_tie_question_ids is not null then
        for v_k in 1..array_length(v_final_tie_question_ids, 1) loop
          v_final_winner := null;
          for v_j in 1..v_qcount loop
            if v_q_keys[v_j] = v_final_tie_question_ids[v_k] then
              v_final_winner := v_q_winner_keys[v_j];
            end if;
          end loop;
          if v_final_winner is not null and v_final_winner = any(v_cand) then
            v_winner := v_final_winner;
            exit;
          end if;
        end loop;
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

comment on function public.resolve_archetype_result(smallint, jsonb, text, integer) is 'The one real archetype-style scoring computation submit_quiz_completion needs. Reads quizzes.scoring_config (a per-quiz JSON mirror of scoring.ts''s opt-in ArchetypeQuizDefinition fields) and reproduces the full algorithm -- eligibility gates, the opt-in high-signal tie-break path (with its own sequential sub-steps, including a MULTI-QUESTION finalTieQuestionId chain), the generic last-N-questions tie-break, and (2026-11-02) a quiz_result_definitions-sourced universe for plain archetype quizzes so a zero-weight safety-net result (e.g. be-so-serious''s MX) is a discoverable, correctly-automatic winner when every real candidate''s gate fails. A null/empty scoring_config behaves exactly as the unconfigured version did.';

revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from public;
revoke all on function public.resolve_archetype_result(smallint, jsonb, text, integer) from anon;
grant execute on function public.resolve_archetype_result(smallint, jsonb, text, integer) to authenticated;
