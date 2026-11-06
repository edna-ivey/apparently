-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 server-authoritative quiz scoring, on the numeric trait/content catalog
-- (20261028010000, 20261028020000). REWRITTEN (2026-10-29) after owner audit found five real
-- defects in the first version, all fixed here:
--
-- 1. First-completion credit was decided per-QUESTION (user_quiz_answers' own unique
--    constraint), so a partial/incomplete submission could still credit individual questions
--    it happened to answer for the first time. Fixed: credit is now decided atomically at
--    (user_id, quiz_id) via a new user_quiz_completions table, AFTER validating the submitted
--    answer set is exactly complete and every choice is valid -- never partially.
-- 2. The composite FK from user_quiz_answers to (quiz_choices.choice_id, question_id) was
--    declared via a separate ALTER TABLE in this file, AFTER 20261028020000 had already
--    created quiz_choices -- order was fine across files, but the unique constraint the FK
--    needs is now declared directly in CREATE TABLE (20261028020000), never bolted on after.
--    Added here: a composite FK ensuring question_id actually belongs to quiz_id.
-- 3. No FK/ownership validation protected daily-equivalent concerns for quiz premium
--    gating -- unchanged in spirit from the original (7-id hardcoded list), restated below.
-- 4. upsert_personality_summary let a client write arbitrary trait_ids with no connection to
--    their real evidence -- REMOVED entirely. The You page reads user_trait_totals (<=64
--    rows) directly and ranks client-side with the existing, tested TS engine; no writable
--    identity-ranking RPC exists.
-- =========================================================================================
-- 1. USER_QUIZ_COMPLETIONS -- the atomic first-completion decider, at (user_id, quiz_id),
--    never at the per-question level. One row per (user, quiz) EVER. This is what "only the
--    first FULLY COMPLETED quiz" actually requires -- a partial submission can never win
--    this race, because it's rejected (see submit_quiz_completion) before this table is
--    even reached.
-- =========================================================================================

create table public.user_quiz_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id smallint not null references public.quizzes (quiz_id),
  -- Reuses quiz_results.id (per owner instruction: no separate attempt table) -- the specific
  -- completion that won first-completion credit.
  quiz_result_id uuid not null references public.quiz_results (id) on delete cascade,
  completed_at timestamptz not null,
  primary key (user_id, quiz_id)
);

comment on table public.user_quiz_completions is 'Atomic first-completion decider at (user_id, quiz_id) -- NOT per-question. A row here means this user has ALREADY permanently earned whatever evidence their first complete submission produced; every later submission of the same quiz, regardless of which questions it answers, is a pure retake. Seeded for pre-existing quiz_results rows (including the 22 historical completions with no recoverable per-question answers) so a retake of an already-completed quiz can never look like a fresh first completion merely because user_quiz_answers has no rows for it.';

alter table public.user_quiz_completions enable row level security;
create policy "user_quiz_completions_select_own" on public.user_quiz_completions for select to authenticated using (auth.uid() = user_id);

-- =========================================================================================
-- 2. USER_QUIZ_ANSWERS -- the first completed quiz's own per-question answers, permanent.
--    Only ever written alongside a user_quiz_completions insert, for the SAME completion,
--    in the SAME transaction -- never independently.
-- =========================================================================================

create table public.user_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id smallint not null references public.quizzes (quiz_id),
  question_id integer not null references public.quiz_questions (question_id),
  choice_id integer not null references public.quiz_choices (choice_id),
  answered_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint user_quiz_answers_unique_question unique (user_id, quiz_id, question_id),
  -- Choice must actually belong to the stated question (unique constraint declared directly
  -- in quiz_choices' own CREATE TABLE, 20261028020000 -- never bolted on after the fact).
  constraint user_quiz_answers_choice_belongs_to_question
    foreign key (choice_id, question_id) references public.quiz_choices (choice_id, question_id),
  -- NEW (owner-flagged gap): the question must actually belong to the stated quiz -- nothing
  -- previously enforced this; a client could not have exploited it (the RPC always resolves
  -- question_id by joining through quiz_id itself), but the schema should not rely on that
  -- alone.
  constraint user_quiz_answers_question_belongs_to_quiz
    foreign key (question_id, quiz_id) references public.quiz_questions (question_id, quiz_id)
);

comment on table public.user_quiz_answers is 'The permanent, first-completed answer for every (user, quiz, question) -- written ONLY alongside the user_quiz_completions row that first earned it, in the same transaction. A retake never writes here, regardless of which questions it answers.';

create index user_quiz_answers_user_id_idx on public.user_quiz_answers (user_id);

alter table public.user_quiz_answers enable row level security;
create policy "user_quiz_answers_select_own" on public.user_quiz_answers for select to authenticated using (auth.uid() = user_id);

-- =========================================================================================
-- 3. USER_TRAIT_EVIDENCE -- one row per (first-completion answer, awarded-or-offered trait).
-- =========================================================================================

create table public.user_trait_evidence (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('quiz_answer', 'daily_answer')),
  -- Polymorphic by source_type -- see this migration's own note on referential integrity
  -- below (owner item 3): a real FK into exactly one of two tables depending on a sibling
  -- column isn't expressible as a single Postgres FK constraint. Integrity here is enforced
  -- procedurally: both writers (submit_quiz_completion, submit_daily_answer) are the ONLY
  -- INSERT paths (no authenticated INSERT policy exists), and both always pass an id they
  -- just inserted or already validated themselves in the SAME transaction -- there is no
  -- code path that could pass an id that doesn't belong to a real row of the matching table.
  -- A `CHECK` trigger validating existence in the right table per source_type was considered
  -- and rejected as unnecessary complexity for a value this migration's own two writers
  -- already fully control (per owner guidance: smallest reliable change).
  source_answer_id uuid not null,
  trait_id smallint not null references public.personality_traits (trait_id),
  points_earned smallint not null check (points_earned between 0 and 3),
  max_available smallint not null check (max_available between 0 and 3),
  check (points_earned <= max_available),
  created_at timestamptz not null,
  last_corrected_at timestamptz,
  constraint user_trait_evidence_unique_answer_trait unique (source_answer_id, trait_id)
);

comment on table public.user_trait_evidence is 'Answer-level trait observations, unique per (source_answer_id, trait_id). created_at is the real original observation time; last_corrected_at (nullable) records when a backfill/correction script touched this row.';

create index user_trait_evidence_user_id_idx on public.user_trait_evidence (user_id);
create index user_trait_evidence_user_trait_idx on public.user_trait_evidence (user_id, trait_id);

alter table public.user_trait_evidence enable row level security;
create policy "user_trait_evidence_select_own" on public.user_trait_evidence for select to authenticated using (auth.uid() = user_id);

-- =========================================================================================
-- 4. USER_TRAIT_TOTALS -- compact, maintained aggregate. At most 64 rows per user.
-- =========================================================================================

create table public.user_trait_totals (
  user_id uuid not null references auth.users (id) on delete cascade,
  trait_id smallint not null references public.personality_traits (trait_id),
  lifetime_earned integer not null default 0,
  max_available_total integer not null default 0,
  distinct_questions_with_earned integer not null default 0,
  distinct_questions_presented integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, trait_id)
);

comment on table public.user_trait_totals is 'One row per (user, trait) with ANY evidence -- at most 64 rows per user. Maintained incrementally; never recomputed by scanning user_trait_evidence in the normal read path. The You page reads this table directly (<=64 small rows) and ranks client-side with the existing, tested engine -- there is no server-side writable summary cache (see this migration''s header, defect 4).';

create index user_trait_totals_user_id_idx on public.user_trait_totals (user_id);

alter table public.user_trait_totals enable row level security;
create policy "user_trait_totals_select_own" on public.user_trait_totals for select to authenticated using (auth.uid() = user_id);

-- =========================================================================================
-- 5. SUBMIT_QUIZ_COMPLETION -- server-authoritative, atomic, complete-set-validated.
-- =========================================================================================

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
  -- SERVER-TRUSTED timestamp for anything that feeds time-windowed logic (the 12-month
  -- active evidence window, Friday-evolution cycle cutoffs) -- owner audit, 2026-10-30:
  -- p_completed_at is a CLIENT-REPORTED value (kept only for display on quiz_results/
  -- user_quiz_completions and for exact-retry dedup matching, exactly as the existing,
  -- unchanged V1 submit_quiz_result already does) and must never be trusted as the
  -- evidence's real observation time -- a client could otherwise claim an arbitrary date to
  -- move evidence in or out of an eligibility window. now() is the one timestamp this
  -- function actually trusts for that purpose.
  v_evidence_timestamp timestamptz := now();
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
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception 'Invalid percent.';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'answers must be a JSON object.';
  end if;

  select quiz_id into v_quiz_id from public.quizzes where quiz_key = p_quiz_key;
  if v_quiz_id is null then
    raise exception 'Unknown quiz_key: %', p_quiz_key;
  end if;

  -- Server-authoritative premium gate -- unchanged from the existing, live submit_quiz_result
  -- (20261006010000): same 7-id list, same entitlement check.
  if p_quiz_key in (
    'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong',
    'life-match-dream-life', 'love-soulmates-ready', 'private-private-trouble',
    'style-vibe-intimidating'
  ) then
    if not (public.has_active_entitlement(v_user_id, 'apparently_private') or public.has_tester_access(v_user_id)) then
      raise exception 'This quiz requires an active Apparently Private subscription.';
    end if;
  end if;

  -- Server-authoritative age gate -- 'private-private-trouble' is the one 18+-gated quiz
  -- (20261018020000_age_eligibility_gate.sql's is_adult_eligible, already used by the
  -- existing live submit_quiz_result -- restated here, not re-invented).
  if p_quiz_key = 'private-private-trouble' then
    if not public.is_adult_eligible(v_user_id) then
      raise exception 'This quiz requires confirmed age eligibility.';
    end if;
  end if;

  -- Network retry of the exact same completion.
  select id into v_existing_result_id
    from public.quiz_results
    where user_id = v_user_id and quiz_id = p_quiz_key and completed_at = p_completed_at;
  if v_existing_result_id is not null then
    return query select v_existing_result_id, false, true;
    return;
  end if;

  -- COMPLETE-SET VALIDATION (owner defect #1): the submitted answers must be EXACTLY the
  -- quiz's real question set -- no missing, no extra, every choice real for its question.
  -- Rejects (raises, writes NOTHING -- not even quiz_results) rather than silently accepting
  -- a partial/malformed submission.
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

  -- quiz_results is written for EVERY completion (first or retake) -- entertainment/history,
  -- unchanged in shape from the existing live table.
  insert into public.quiz_results (
    user_id, quiz_id, completed_at, score, percent, result_id, result_title, traits, mix,
    question_count, answers
  ) values (
    v_user_id, p_quiz_key, p_completed_at, p_score, p_percent, p_result_id, p_result_title,
    coalesce(p_traits, '{}'), p_mix, p_question_count, p_answers
  ) returning id into v_new_result_id;

  -- THE atomic first-completion decider, at (user_id, quiz_id) -- never per-question. Only
  -- the device/request that wins this single INSERT ever reaches the evidence-writing code
  -- below; Postgres's own unique-index row lock makes two concurrent "first" submissions for
  -- the same (user, quiz) resolve to exactly one winner, deterministically, with no explicit
  -- application lock needed.
  insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
  values (v_user_id, v_quiz_id, v_new_result_id, p_completed_at)
  on conflict (user_id, quiz_id) do nothing;

  v_won_completion := found;

  if not v_won_completion then
    -- Already completed before (a real prior completion, OR a seeded historical completion
    -- with no recoverable per-question answers) -- this submission is a pure retake. Its
    -- quiz_results row above stands (entertainment/sharing); zero evidence is written.
    return query select v_new_result_id, false, false;
    return;
  end if;

  -- Genuine first completion: write every answer + its trait evidence, in this one
  -- transaction, alongside the user_quiz_completions row that just won.
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
    end loop;
  end loop;

  return query select v_new_result_id, true, false;
end;
$$;

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission. Rejects (writes nothing) any submission that is not exactly complete against the real question/choice catalog. First-completion credit is decided atomically at (user_id, quiz_id) via user_quiz_completions -- never per question -- so a retake can never gain partial credit regardless of which questions it answers. p_completed_at is CLIENT-REPORTED -- used only for quiz_results/user_quiz_completions display and exact-retry dedup matching (same trust level as the existing, unchanged V1 submit_quiz_result). user_quiz_answers.answered_at and user_trait_evidence.created_at use the function''s own now() instead, since those feed the 12-month active evidence window and Friday-evolution cycle cutoffs -- a client cannot move evidence in or out of an eligibility window by claiming an arbitrary completion date. Quiz result metadata (score/percent/result_id/result_title) is accepted from the client unvalidated beyond basic range checks, same trust boundary as the existing V1 RPC -- full server-side re-scoring would require porting all quiz scoring logic (src/data/quizzes/scoring.ts) into SQL, out of scope for this pass; the risk this leaves open is confined to a quiz''s own result display/sharing, never to personality evidence, which is derived solely from p_answers against the real, validated catalog.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;
