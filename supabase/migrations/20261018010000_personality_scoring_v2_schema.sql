-- ============================================================================================
-- STAGED, NOT YET APPLIED. Prepared per the Build 16 "Complete Personality Scoring V2" task --
-- do not run `supabase db push` (or any other apply step) against this file until the product
-- owner has explicitly reviewed and approved it. See docs/personality-scoring-v2-design.md for
-- the full design and the specific decisions this migration encodes.
--
-- Scope: purely additive. Nothing here alters, drops, or renames any existing table, column,
-- constraint, policy, trigger, or function signature. The existing signed personality_evidence
-- table/trigger/RPC continue to behave exactly as before this migration -- see the design doc's
-- "Historical signed evidence" section for why no conversion of existing rows is attempted here.
-- ============================================================================================

-- =========================================================================================
-- 1. PERSONALITY POLE EVIDENCE (V2) -- new table, parallel to personality_evidence.
-- =========================================================================================

create table public.personality_pole_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null,
  source_id text not null,
  -- Stable identity for the QUESTION this row observed -- "${quiz_id}:${question_id}" for
  -- quizzes, a normalized scenario fingerprint for Daily (see
  -- src/data/personality-v2/daily-scenario-fingerprint.ts) -- deliberately NOT the raw database
  -- row id for Daily, so the same real-world scenario re-entered under a new daily_questions.id
  -- is still recognized as the same question for ranking/replay purposes.
  question_stable_id text not null,
  choice_stable_id text not null,
  -- Audit-only pointers back to the real database rows, when the source is Daily -- never used
  -- for ranking identity (question_stable_id is), only for reconstructing exactly which live
  -- content row produced this observation.
  source_question_db_id text,
  source_choice_db_id text,
  -- One of the 64 canonical pole ids from src/data/personality-v2/pole-ids.ts, e.g.
  -- 'direct_indirect:positive'. Left as plain text (not a DB enum) for the same reason
  -- personality_evidence.dimension is -- validated at the application layer, allowed to evolve
  -- without a migration per change.
  pole_id text not null,
  points_earned smallint not null,
  max_available smallint not null,
  scoring_version text not null,
  -- Forward-compatible hook for a future "correct my answer" feature -- unused by any current
  -- code path. See docs/personality-scoring-v2-design.md section 6.
  supersedes_source_id text,
  created_at timestamptz not null default now(),
  constraint personality_pole_evidence_source_type_check check (source_type in ('daily_answer', 'quiz_result')),
  constraint personality_pole_evidence_points_earned_check check (points_earned between 0 and 3),
  constraint personality_pole_evidence_max_available_check check (max_available between 0 and 3),
  constraint personality_pole_evidence_earned_le_max check (points_earned <= max_available),
  -- One row per (user, source, pole) -- idempotency key. Keyed by POLE, never by dimension, so
  -- independent evidence toward BOTH poles of the same dimension from one source can coexist
  -- (the exact gap the old personality_evidence_unique_source_dimension constraint could not
  -- support -- see the design doc section 1).
  constraint personality_pole_evidence_unique unique (user_id, source_type, source_id, pole_id)
);

comment on table public.personality_pole_evidence is
  'V2 positive-only, independent-pole evidence. Parallel to and independent from personality_evidence (the old signed/dimension-keyed table, left untouched) -- see docs/personality-scoring-v2-design.md. Rows are never updated or deleted; every presented question writes one row per pole it could have awarded (including points_earned = 0 opportunities), giving each user a real, user-specific denominator for earned-percentage ranking.';

create index personality_pole_evidence_user_id_idx on public.personality_pole_evidence (user_id);
create index personality_pole_evidence_user_pole_idx on public.personality_pole_evidence (user_id, pole_id);
create index personality_pole_evidence_user_question_idx on public.personality_pole_evidence (user_id, question_stable_id);

alter table public.personality_pole_evidence enable row level security;

create policy "personality_pole_evidence_select_own"
  on public.personality_pole_evidence
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately NO insert/update/delete policy for `authenticated` -- same reasoning as
-- personality_evidence: the only writers are SECURITY DEFINER functions below.

-- =========================================================================================
-- 2. QUIZ CHOICE POLE AWARDS (V2) -- server-side authoritative scoring data for quizzes.
-- =========================================================================================
--
-- Quiz CONTENT (question/choice wording, result copy) lives in the app's static TS bundle, not
-- in this database -- there is no other server-side source of truth this RPC could validate
-- against, which is exactly the same constraint submit_quiz_result's existing hardcoded
-- dimension allow-list already documents for itself. This table is seeded (by a separate,
-- reviewable data migration generated from src/data/quiz-pole-awards/*.ts -- see
-- scripts/generate-quiz-pole-award-seed-sql.ts) so the RPC can compute awarded points FROM THE
-- SUBMITTED ANSWERS, server-side, instead of trusting any client-submitted point value --
-- closing the gap documented in docs/personality-scoring-v2-design.md section 9.

create table public.quiz_choice_pole_awards (
  quiz_id text not null,
  question_id text not null,
  choice_id text not null,
  pole_id text not null,
  points smallint not null,
  scoring_version text not null,
  constraint quiz_choice_pole_awards_points_check check (points between 1 and 3),
  primary key (quiz_id, question_id, choice_id, pole_id)
);

comment on table public.quiz_choice_pole_awards is
  'Server-side authoritative copy of src/data/quiz-pole-awards/*.ts (quiz content lives client-side; this is the one server-readable source of truth for "how many points does this choice award to this pole"). Read-only from the app; written only via a reviewed data migration. The V2 submit_quiz_result revision joins this against the already-submitted p_answers to compute pole evidence itself, never trusting a client-submitted point value.';

alter table public.quiz_choice_pole_awards enable row level security;

create policy "quiz_choice_pole_awards_select_all"
  on public.quiz_choice_pole_awards
  for select
  to authenticated
  using (true);

-- No insert/update/delete policy for `authenticated` -- this is server-maintained content, the
-- same trust model as daily_options.personality_effects.

-- =========================================================================================
-- 3. DAILY OPTIONS -- additive column for V2 pole-based effects, parallel to the existing
--    signed `personality_effects` column (left untouched).
-- =========================================================================================

alter table public.daily_options
  add column pole_personality_effects jsonb not null default '[]'::jsonb;

comment on column public.daily_options.pole_personality_effects is
  'V2 positive-only pole awards for this option, e.g. [{"pole": "direct_indirect:positive", "points": 2}]. Parallel to and independent from personality_effects (the old signed column, untouched). Server-side only, same trust model as personality_effects -- never supplied by the client.';

-- =========================================================================================
-- 4. V2 DAILY TRIGGER -- additive: writes personality_pole_evidence alongside (never instead
--    of) the existing personality_evidence trigger's own writes.
-- =========================================================================================
--
-- Deliberately a SEPARATE trigger function (not a rewrite of
-- handle_daily_answer_personality_evidence) so the existing V1 trigger's behavior is provably
-- unchanged -- this migration adds a second AFTER INSERT trigger on the same table rather than
-- editing the first one's body at all.
--
-- max_available per pole (within one Daily question) is computed from EVERY option's
-- pole_personality_effects, not just the chosen one -- same "best single mutually-exclusive
-- choice" rule the quiz RPC enforces, so a Daily answer also gets real zero-earned-opportunity
-- rows for poles other options could have awarded.

create or replace function public.handle_daily_answer_pole_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_db_id text;
  v_scenario_fingerprint text;
  v_chosen_option_db_id text;
  v_pole record;
  v_max_by_pole jsonb := '{}'::jsonb;
  v_earned_by_pole jsonb := '{}'::jsonb;
  v_pole_id text;
  v_points smallint;
begin
  v_question_db_id := new.question_id::text;
  v_chosen_option_db_id := new.option_id::text;

  -- Scenario identity follows the SAME normalization rule as the client
  -- (src/data/personality-v2/daily-scenario-fingerprint.ts): lowercase/trim/collapse-whitespace
  -- the prompt, then the SORTED set of likewise-normalized option labels -- order-independent,
  -- tolerant of trivial re-entry differences, sensitive to an actual content change. The
  -- underlying hash function here (md5, truncated) is deliberately NOT required to match the
  -- client's FNV-1a byte-for-byte -- only the SERVER ever computes this value for a Daily row
  -- (it is the sole writer of personality_pole_evidence.question_stable_id via this trigger),
  -- so the two implementations only need to each be internally deterministic, not identical to
  -- each other.
  select 'daily:' || substr(md5(prompt || '|' || array_to_string(options, '|')), 1, 8)
  into v_scenario_fingerprint
  from (
    select
      regexp_replace(lower(trim(q.prompt)), '\s+', ' ', 'g') as prompt,
      array_agg(regexp_replace(lower(trim(o.label)), '\s+', ' ', 'g') order by regexp_replace(lower(trim(o.label)), '\s+', ' ', 'g')) as options
    from public.daily_questions q
    join public.daily_options o on o.question_id = q.id
    where q.id = new.question_id
    group by q.prompt
  ) as normalized;

  -- Union of every option's pole offers for this question -> max points per pole.
  for v_pole in
    select
      effect ->> 'pole' as pole_id,
      max((effect ->> 'points')::smallint) as max_points
    from public.daily_options o
    cross join lateral jsonb_array_elements(o.pole_personality_effects) as effect
    where o.question_id = new.question_id
    group by effect ->> 'pole'
  loop
    v_max_by_pole := jsonb_set(v_max_by_pole, array[v_pole.pole_id], to_jsonb(v_pole.max_points));
  end loop;

  -- Chosen option's own pole offers -> earned points per pole.
  for v_pole in
    select effect ->> 'pole' as pole_id, (effect ->> 'points')::smallint as points
    from public.daily_options o
    cross join lateral jsonb_array_elements(o.pole_personality_effects) as effect
    where o.id = new.option_id
  loop
    v_earned_by_pole := jsonb_set(v_earned_by_pole, array[v_pole.pole_id], to_jsonb(v_pole.points));
  end loop;

  for v_pole_id, v_points in select key, value::smallint from jsonb_each_text(v_max_by_pole)
  loop
    insert into public.personality_pole_evidence (
      user_id, source_type, source_id, question_stable_id, choice_stable_id,
      source_question_db_id, source_choice_db_id, pole_id, points_earned, max_available, scoring_version
    )
    values (
      new.user_id,
      'daily_answer',
      new.id::text,
      v_scenario_fingerprint,
      v_chosen_option_db_id,
      v_question_db_id,
      v_chosen_option_db_id,
      v_pole_id,
      coalesce((v_earned_by_pole ->> v_pole_id)::smallint, 0),
      v_points,
      'v2.0'
    )
    on conflict (user_id, source_type, source_id, pole_id) do nothing;
  end loop;

  return new;
end;
$$;

comment on function public.handle_daily_answer_pole_evidence() is
  'V2 AFTER INSERT trigger on daily_answers -- additive, parallel to handle_daily_answer_personality_evidence (unchanged). Computes the scenario fingerprint server-side, writes one personality_pole_evidence row per pole any option of this question could award (zero-earned opportunities included), idempotent via the (user_id, source_type, source_id, pole_id) unique constraint.';

create trigger daily_answers_after_insert_pole_evidence
  after insert on public.daily_answers
  for each row
  execute function public.handle_daily_answer_pole_evidence();

-- =========================================================================================
-- 5. V2 QUIZ SUBMISSION -- additive: a NEW function, called in addition to (never instead of)
--    the existing submit_quiz_result RPC, so no existing call site or return shape changes.
-- =========================================================================================
--
-- The app's existing quiz-result-service.ts already sends p_answers (question_id -> choice_id)
-- on every submission -- used today only by Compare's exact-match count. A future, separately
-- reviewed client change can call this additional RPC right after submit_quiz_result succeeds,
-- passing the same quiz_id/completed_at/answers it already has, to also write V2 pole evidence
-- -- entirely computed server-side from quiz_choice_pole_awards, never from a client-submitted
-- point value. Deliberately NOT folded into submit_quiz_result itself in this pass, so the
-- existing, already-audited function body is not touched at all until that follow-on change is
-- explicitly approved.

create or replace function public.submit_quiz_pole_evidence(
  p_quiz_id text,
  p_source_id uuid,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_owns_result boolean;
  v_question_id text;
  v_choice_id text;
  v_pole record;
  v_max_by_pole jsonb := '{}'::jsonb;
  v_earned_by_pole jsonb := '{}'::jsonb;
  v_pole_id text;
  v_max_points smallint;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  -- The source_id must be a real quiz_results row this caller owns -- prevents writing pole
  -- evidence against an arbitrary/forged source_id.
  select exists (
    select 1 from public.quiz_results where id = p_source_id and user_id = v_user_id and quiz_id = p_quiz_id
  ) into v_owns_result;
  if not v_owns_result then
    raise exception 'Unknown or unauthorized quiz_result for pole evidence submission.';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    return;
  end if;

  for v_question_id, v_choice_id in select key, value::text from jsonb_each_text(p_answers)
  loop
    -- Max available per pole for this question: best single choice's points, across every
    -- choice this quiz's catalog defines for it -- never summed across mutually exclusive
    -- choices.
    for v_pole in
      select pole_id, max(points) as max_points
      from public.quiz_choice_pole_awards
      where quiz_id = p_quiz_id and question_id = v_question_id
      group by pole_id
    loop
      v_max_by_pole := jsonb_set(v_max_by_pole || jsonb_build_object(v_question_id, '{}'::jsonb), array[v_question_id, v_pole.pole_id], to_jsonb(v_pole.max_points));
    end loop;

    -- Earned per pole: only the CHOSEN choice's own awards.
    for v_pole in
      select pole_id, points
      from public.quiz_choice_pole_awards
      where quiz_id = p_quiz_id and question_id = v_question_id and choice_id = v_choice_id
    loop
      v_earned_by_pole := jsonb_set(v_earned_by_pole || jsonb_build_object(v_question_id, '{}'::jsonb), array[v_question_id, v_pole.pole_id], to_jsonb(v_pole.points));
    end loop;

    for v_pole_id, v_max_points in
      select key, value::smallint from jsonb_each_text(coalesce(v_max_by_pole -> v_question_id, '{}'::jsonb))
    loop
      insert into public.personality_pole_evidence (
        user_id, source_type, source_id, question_stable_id, choice_stable_id, pole_id,
        points_earned, max_available, scoring_version
      )
      values (
        v_user_id,
        'quiz_result',
        p_source_id::text,
        p_quiz_id || ':' || v_question_id,
        v_choice_id,
        v_pole_id,
        coalesce((v_earned_by_pole -> v_question_id ->> v_pole_id)::smallint, 0),
        v_max_points,
        'v2.0'
      )
      on conflict (user_id, source_type, source_id, pole_id) do nothing;
    end loop;
  end loop;
end;
$$;

comment on function public.submit_quiz_pole_evidence(text, uuid, jsonb) is
  'V2 pole-evidence writer for quizzes -- additive, separate from submit_quiz_result (unchanged). Verifies p_source_id is a real quiz_results row the caller owns, then computes awarded points SERVER-SIDE by joining the submitted answers against quiz_choice_pole_awards -- never trusts a client-submitted point value. Not yet called from any client code path (see docs/personality-scoring-v2-design.md section 11).';

revoke all on function public.submit_quiz_pole_evidence(text, uuid, jsonb) from public;
grant execute on function public.submit_quiz_pole_evidence(text, uuid, jsonb) to authenticated;
