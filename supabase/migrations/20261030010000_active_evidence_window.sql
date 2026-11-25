-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Bible v1.4 §43's LOCKED 12-MONTH ACTIVE EVIDENCE WINDOW, implemented against the numeric
-- schema (owner instruction, 2026-10-30: "do not reopen the product decision... keep
-- lifetime evidence and active evidence distinct... use active totals for current ranking").
--
-- DESIGN: user_trait_totals (20261028040000) already means LIFETIME -- its own column names
-- (lifetime_earned) already said so, and it is never touched by this migration: permanent,
-- append-only-in-spirit, the historical record the Bible requires ("preserve original quiz
-- answers and historical evidence"). A NEW table, user_trait_active_totals, holds the SAME
-- shape restricted to evidence from the trailing 12 months -- THIS is what ranking reads for
-- "current" Your Signature/Undercurrent/Creature eligibility. Both tables are maintained
-- incrementally on every new answer (trivial: new evidence is always "active" the moment it
-- exists); only EXPIRY (evidence aging out of the 12-month window) ever needs to touch the
-- active table, and never the lifetime one.
--
-- SCALE: the expiry job runs once daily, and only ever recomputes active totals for users who
-- have evidence crossing the 12-month boundary THAT SPECIFIC DAY -- never a full rescan of
-- every user, and the fast read path (a ranking query) never scans user_trait_evidence at
-- all, satisfying "without requiring full historical scans on every You-page load."
--
-- PERMANENT UNLOCKS / PUBLISHED CREATURE HISTORY: unaffected by construction, not by new
-- logic here. The 50-answer Creature reveal and 3-trait Relic reveal unlock flags (wherever
-- they are tracked) are never recomputed FROM active totals -- they are one-time facts
-- ("has this user ever reached N answers"), already permanent regardless of this migration.
-- creature_published_recipes (20261028070000) is already database-enforced append-only (its
-- own BEFORE UPDATE OR DELETE trigger) -- evidence expiring can only ever change what a
-- FUTURE Friday cycle's candidate computation sees; it is structurally incapable of altering
-- an already-published recipe, the same guarantee that already protects it from historical
-- corrections.
-- =========================================================================================
-- 1. USER_TRAIT_ACTIVE_TOTALS
-- =========================================================================================

create table public.user_trait_active_totals (
  user_id uuid not null references auth.users (id) on delete cascade,
  trait_id smallint not null references public.personality_traits (trait_id),
  lifetime_earned integer not null default 0,
  max_available_total integer not null default 0,
  distinct_questions_with_earned integer not null default 0,
  distinct_questions_presented integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, trait_id)
);

comment on table public.user_trait_active_totals is 'Bible v1.4 §43 12-month ACTIVE evidence window -- same shape as user_trait_totals (lifetime, untouched, permanent), restricted to evidence with created_at within the trailing 12 months. This is what current ranking (Your Signature/Undercurrent/Creature eligibility) reads. Column names match user_trait_totals'' own for clarity -- these are the ACTIVE-window versions of the identical concepts, not a different metric.';

create index user_trait_active_totals_user_id_idx on public.user_trait_active_totals (user_id);

alter table public.user_trait_active_totals enable row level security;
create policy "user_trait_active_totals_select_own" on public.user_trait_active_totals for select to authenticated using (auth.uid() = user_id);

-- =========================================================================================
-- 2. WRITE PATHS -- both submit_quiz_completion and the Daily trigger now upsert the active
--    table identically to the lifetime one for every NEW answer (new evidence is always
--    within the active window the moment it is created -- no filter needed on write).
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
  -- Result-integrity sanity bounds (owner audit, 2026-10-30) -- full server-side re-scoring
  -- is out of scope (see this function's own comment below), but grossly fabricated metadata
  -- is rejected rather than silently stored and later shared/displayed as if real.
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

  insert into public.quiz_results (
    user_id, quiz_id, completed_at, score, percent, result_id, result_title, traits, mix,
    question_count, answers
  ) values (
    v_user_id, p_quiz_key, p_completed_at, p_score, p_percent, p_result_id, p_result_title,
    coalesce(p_traits, '{}'), p_mix, p_question_count, p_answers
  ) returning id into v_new_result_id;

  insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
  values (v_user_id, v_quiz_id, v_new_result_id, p_completed_at)
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

      -- NEW: identical upsert against the active-window table -- a brand-new answer is
      -- always within the trailing 12 months at the moment it's created.
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

comment on function public.submit_quiz_completion is 'Server-authoritative, atomic quiz submission -- see 20261028040000''s original comment for the full first-completion/timestamp-trust design (unchanged). This revision (20261030010000) additionally maintains user_trait_active_totals (the Bible''s 12-month window) identically to user_trait_totals on every new answer, and adds basic result-metadata sanity bounds (score/result_id/result_title/question_count) -- full server-side re-scoring remains out of scope; see this migration''s header.';

revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from public;
revoke all on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) from anon;
grant execute on function public.submit_quiz_completion(text, text, text, timestamptz, smallint, integer, integer, text, text, text[], jsonb, jsonb) to authenticated;

create or replace function public.handle_daily_answer_trait_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trait record;
begin
  for v_trait in
    select
      awards.trait_id,
      max(awards.points) as max_available,
      coalesce(max(awards.points) filter (where o.id = new.option_id), 0) as points_earned
    from public.daily_option_trait_awards awards
    join public.daily_options o on o.id = awards.option_id
    where o.question_id = new.question_id
    group by awards.trait_id
  loop
    insert into public.user_trait_evidence (
      user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at
    ) values (
      new.user_id, 'daily_answer', new.id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available, new.created_at
    );

    insert into public.user_trait_totals (
      user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at
    ) values (
      new.user_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available,
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
      new.user_id, v_trait.trait_id, v_trait.points_earned, v_trait.max_available,
      case when v_trait.points_earned > 0 then 1 else 0 end, 1, now()
    )
    on conflict (user_id, trait_id) do update set
      lifetime_earned = public.user_trait_active_totals.lifetime_earned + excluded.lifetime_earned,
      max_available_total = public.user_trait_active_totals.max_available_total + excluded.max_available_total,
      distinct_questions_with_earned = public.user_trait_active_totals.distinct_questions_with_earned + excluded.distinct_questions_with_earned,
      distinct_questions_presented = public.user_trait_active_totals.distinct_questions_presented + excluded.distinct_questions_presented,
      updated_at = now();
  end loop;
  return new;
end;
$$;

-- =========================================================================================
-- 3. DAILY EXPIRY JOB -- recomputes active totals ONLY for users with evidence crossing the
--    12-month boundary today. Same pg_cron pattern as run_daily_rollover
--    (20261003103000_fresh_daily_occurrences_both_rooms.sql).
-- =========================================================================================

create table if not exists public.evidence_expiry_job_state (
  job_name text primary key,
  -- The CUTOFF value (now() - 12 months) as of the last successful run -- NOT a wall-clock
  -- timestamp. Evidence timestamps being compared are themselves ~12 months old, so the
  -- watermark must be expressed in that same "cutoff" terms, not "when did the job last run."
  last_cutoff_processed timestamptz not null
);

comment on table public.evidence_expiry_job_state is 'Watermark for expire_stale_active_evidence, stored as the CUTOFF value last processed (not a wall-clock run time) -- found by this migration''s own pglite test: a fixed "last 24h" window would permanently skip whatever evidence crossed the boundary during any missed day, since by the next run it is already more than a day past cutoff. The watermark instead catches everything between the last-processed cutoff and today''s cutoff, however wide that gap is -- correct even if the job is delayed or missed for a while, at the cost of a larger (but still correct) catch-up pass that one time.';

-- Internal job state, not per-user data -- RLS enabled with NO policies at all, so no role
-- (including authenticated/anon) can read or write it through the normal client API; only
-- the SECURITY DEFINER function above (and a service-role/owner connection) ever touches it.
alter table public.evidence_expiry_job_state enable row level security;

create or replace function public.expire_stale_active_evidence()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := now() - interval '12 months';
  v_affected_user uuid;
  v_watermark timestamptz;
begin
  select last_cutoff_processed into v_watermark from public.evidence_expiry_job_state where job_name = 'expire_stale_active_evidence';
  if v_watermark is null then
    -- First run ever: catch up on everything already past the 12-month cutoff, however far
    -- back it goes -- a one-time wider pass, not a recurring full scan.
    v_watermark := '-infinity'::timestamptz;
  end if;

  -- Users with evidence that crossed the boundary ANY TIME since this job's own last
  -- successful run (never a fixed "last 24h" that a missed run could silently skip past) --
  -- still never a full scan of every user, only the ones actually affected since last run.
  for v_affected_user in
    select distinct user_id from public.user_trait_evidence
    where created_at >= v_watermark and created_at < v_cutoff
  loop
    delete from public.user_trait_active_totals where user_id = v_affected_user;
    insert into public.user_trait_active_totals (user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at)
    select
      user_id, trait_id,
      sum(points_earned), sum(max_available),
      count(*) filter (where points_earned > 0),
      count(*),
      now()
    from public.user_trait_evidence
    where user_id = v_affected_user and created_at >= v_cutoff
    group by user_id, trait_id;
  end loop;

  insert into public.evidence_expiry_job_state (job_name, last_cutoff_processed)
  values ('expire_stale_active_evidence', v_cutoff)
  on conflict (job_name) do update set last_cutoff_processed = excluded.last_cutoff_processed;
end;
$$;

comment on function public.expire_stale_active_evidence is 'Bible v1.4 §43 12-month window enforcement. Recomputes user_trait_active_totals for every user whose evidence crossed the 12-month boundary since this job''s own last successful run (a watermark, not a fixed "last 24h" -- see evidence_expiry_job_state''s own comment for why a fixed window is wrong). user_trait_totals (lifetime) and every raw evidence/answer row are completely untouched -- this only ever changes what counts as CURRENTLY ACTIVE for ranking, never deletes or rewrites history. Scheduled daily, same pattern as run_daily_rollover.';

revoke execute on function public.expire_stale_active_evidence() from public;
revoke execute on function public.expire_stale_active_evidence() from anon;
revoke execute on function public.expire_stale_active_evidence() from authenticated;

select cron.schedule(
  'apparently_expire_stale_active_evidence',
  '30 4 * * *',
  $$select public.expire_stale_active_evidence();$$
);
