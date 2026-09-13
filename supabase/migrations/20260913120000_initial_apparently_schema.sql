-- Apparently You — initial production data foundation.
--
-- Scope: schema only. This migration deliberately does NOT seed any prototype Daily
-- questions, prototype percentages, or prototype quiz content — see Sprint 1 notes in
-- docs/backend-setup.md for why (some prototype records contain fake percentages, stale
-- scheduled dates, and incomplete editorial packages that must never reach production data).
--
-- Auth model: Supabase anonymous sign-ins (auth.users rows with is_anonymous = true) are
-- members of the standard `authenticated` role, exactly like a permanently-identified user.
-- Every policy below keys off auth.uid() ownership — never `using (true)` on private data —
-- so an anonymous user's own rows are exactly as private as a fully-identified user's.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------------------
-- Shared updated_at trigger — one reusable function instead of duplicating the same
-- "bump updated_at on every UPDATE" logic per table.
-- ---------------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic BEFORE UPDATE trigger: stamps updated_at = now() on the row being updated. Attach to any table with an updated_at column.';

-- =========================================================================================
-- 1. PROFILES
-- =========================================================================================

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Mirrors src/data/onboarding.ts's UserProfile.firstName. Client-side allowed values for
  -- age_range/gender are AGE_RANGES / GENDER_IDENTITIES in that same file; deliberately left
  -- as plain text here (not a DB enum/check) so the app can evolve that list without a
  -- migration every time.
  preferred_name text,
  age_range text,
  gender text,
  -- Mirrors SelfPerceptionProfile.answers (groupRole/dramatic/decisionStyle/proudTrait/
  -- selfBlindSpot) as a flexible snapshot — self-perception questions may change shape
  -- before this is ever wired up, so jsonb avoids a migration per copy change.
  self_perception jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user. Holds onboarding-collected profile fields and the self-perception snapshot. No secrets are stored here.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy: a user cannot delete their own profile row from the consumer app in
-- this sprint (account deletion, if ever needed, is a deliberate future decision, not an
-- accidental default).

-- =========================================================================================
-- 2. DAILY QUESTIONS
-- =========================================================================================

create type public.daily_status as enum (
  'Idea',
  'Draft',
  'ReadyForReview',
  'Approved',
  'Scheduled',
  'Live',
  'Archived',
  'NeedsRevision',
  'Rejected'
);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  category text not null,
  status public.daily_status not null default 'Idea',
  -- Named sort_order (not `order`, a reserved SQL keyword) — mirrors DailyQuestion.order in
  -- src/data/daily-questions.ts.
  sort_order integer not null default 0,
  scheduled_for date,
  published_for date,
  -- The client's current prototype uses a fixed placeholder editor string
  -- ("Michelle (prototype editor)"); this column anticipates a real authenticated editor
  -- account and is intentionally left null by this migration — no seed/backfill here.
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  approved_content_version text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.daily_questions is
  'Editorial lifecycle for the Daily one-question poll. Consumer app reads Live/Archived only. All admin/editorial writes (draft, approve, schedule, publish) are designed for a later sprint and are NOT reachable from the consumer app via RLS — see the deliberate absence of insert/update/delete policies below.';
comment on column public.daily_questions.approved_content_version is
  'Deterministic content fingerprint, mirroring computeContentFingerprint() in src/data/daily-questions.ts — lets the app detect edits made after approval.';

create index daily_questions_status_idx on public.daily_questions (status);
create index daily_questions_status_sort_order_idx on public.daily_questions (status, sort_order);

create trigger daily_questions_set_updated_at
  before update on public.daily_questions
  for each row
  execute function public.set_updated_at();

alter table public.daily_questions enable row level security;

-- Consumer-visible content only. No insert/update/delete policy exists for ANY role other
-- than the table owner — normal authenticated users (including anonymous-signed-in ones)
-- can never approve, schedule, publish, or edit a Daily question. That workflow will get its
-- own privileged/service-role-backed design in a later sprint.
create policy "daily_questions_select_consumer_visible"
  on public.daily_questions
  for select
  to authenticated
  using (status in ('Live', 'Archived'));

-- =========================================================================================
-- 3. DAILY OPTIONS
-- =========================================================================================

create table public.daily_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.daily_questions (id) on delete cascade,
  -- 1-4, mirrors the option's index in DailyQuestion.options. "Exactly four options" is an
  -- editorial/application rule (see isQuestionComplete / getCompletenessIssues in
  -- src/data/daily-questions.ts) deliberately NOT enforced as a hard "must have exactly 4
  -- rows" database constraint — that would require a deferred cross-row check/trigger and
  -- would make ordinary content-entry (inserting one option at a time) painful. What IS
  -- enforced at the database level: a question can never have two options claiming the same
  -- position, and a position can only ever be 1-4.
  "position" smallint not null,
  label text not null,
  -- Never authoritative for world percentages — see get_daily_distribution() below, which
  -- computes real percentages from daily_answers. No `percent` column exists here at all.
  personality_effects jsonb not null default '[]'::jsonb,
  apparently_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_options_position_range check ("position" between 1 and 4),
  constraint daily_options_question_position_unique unique (question_id, "position"),
  -- Exists solely so daily_answers can enforce "the chosen option actually belongs to the
  -- given question" via a composite foreign key (see below) instead of trusting the client
  -- or adding a trigger.
  constraint daily_options_id_question_unique unique (id, question_id)
);

comment on table public.daily_options is
  'The (up to) four answer choices for a Daily question. personality_effects is the server-side source of truth the personality_evidence trigger reads from — never trust a client-supplied effects list.';

create index daily_options_question_id_idx on public.daily_options (question_id);

create trigger daily_options_set_updated_at
  before update on public.daily_options
  for each row
  execute function public.set_updated_at();

alter table public.daily_options enable row level security;

create policy "daily_options_select_for_consumer_visible_questions"
  on public.daily_options
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.daily_questions q
      where q.id = daily_options.question_id
        and q.status in ('Live', 'Archived')
    )
  );

-- No insert/update/delete policy — same admin-writes-come-later reasoning as daily_questions.

-- =========================================================================================
-- 4. DAILY ANSWERS
-- =========================================================================================

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.daily_questions (id) on delete cascade,
  option_id uuid not null,
  created_at timestamptz not null default now(),
  -- THE server-side guarantee behind "One Daily. One committed answer. No changing it after
  -- reveal." A second insert attempt for the same (user_id, question_id) fails outright —
  -- there is no update/delete policy below to "fix" it either, so a committed Daily answer
  -- is immutable for the row's entire lifetime, not just app-session-immutable.
  constraint daily_answers_user_question_unique unique (user_id, question_id),
  -- Enforces "the chosen option actually belongs to the given question" as a pure foreign-key
  -- constraint (no trigger needed): this can only reference a (id, question_id) pair that
  -- really exists together in daily_options, so an option_id from a DIFFERENT question can
  -- never be inserted alongside this question_id, even by a buggy or malicious client.
  constraint daily_answers_option_belongs_to_question
    foreign key (option_id, question_id)
    references public.daily_options (id, question_id)
);

comment on table public.daily_answers is
  'One immutable row per (user, Daily question). UNIQUE(user_id, question_id) + no UPDATE/DELETE policy is the whole immutability guarantee — enforced by Postgres, not just client discipline. The composite FK to daily_options(id, question_id) guarantees the answered option actually belongs to the answered question.';

create index daily_answers_question_id_idx on public.daily_answers (question_id);
create index daily_answers_user_id_idx on public.daily_answers (user_id);

alter table public.daily_answers enable row level security;

create policy "daily_answers_select_own"
  on public.daily_answers
  for select
  to authenticated
  using (auth.uid() = user_id);

-- A vote is only accepted while its question is the CURRENT Live Daily. Without the second
-- condition below, anyone who learned an Archived (or Draft/Scheduled/etc.) question's id and
-- a valid option id could insert a fresh answer for a Daily that already ended, distorting
-- its historical world percentages after the fact. Once a question leaves Live, this policy
-- makes it permanently impossible to add another vote to it through the consumer app's
-- role — which is exactly what makes an Archived Daily's percentages immutable: the
-- denominator and every option's count can never change again after that transition,
-- because no further row can ever be inserted for it.
create policy "daily_answers_insert_own"
  on public.daily_answers
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.daily_questions q
      where q.id = daily_answers.question_id
        and q.status = 'Live'
    )
  );

-- Deliberately no update/delete policy, and no select policy for other users' rows: a Daily
-- answer can be read only by the person who cast it, and once inserted it cannot be
-- changed or removed by anyone through the consumer app's role.

-- =========================================================================================
-- 5. QUIZ RESULTS
-- =========================================================================================

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Text, not a FK — quiz_id mirrors the client's own static quiz registry key
  -- (src/data/quizzes/index.ts, e.g. 'petty', 'dating', 'food-order'), which lives in code,
  -- not a database table, in this sprint.
  quiz_id text not null,
  completed_at timestamptz not null default now(),
  score integer not null,
  percent integer not null,
  result_id text not null,
  result_title text not null,
  traits text[] not null default '{}',
  -- Archetype-quiz-only, mirrors QuizResultRecord.mix in src/data/quizzes/results.ts — null
  -- for numericBand quizzes (Petty, Dating).
  mix jsonb,
  created_at timestamptz not null default now(),
  constraint quiz_results_percent_range check (percent between 0 and 100)
);

comment on table public.quiz_results is
  'Append-only history mirroring the client''s existing QuizResultRecord. Retakes insert a NEW row on purpose — there is no UNIQUE(user_id, quiz_id), and no update/delete policy, so history can only ever grow.';

create index quiz_results_user_id_idx on public.quiz_results (user_id);
create index quiz_results_user_quiz_idx on public.quiz_results (user_id, quiz_id);

alter table public.quiz_results enable row level security;

create policy "quiz_results_select_own"
  on public.quiz_results
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quiz_results_insert_own"
  on public.quiz_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update/delete policy: append-only, and no policy exists letting anyone read another
-- user's quiz history.

-- =========================================================================================
-- 6. PERSONALITY EVIDENCE
-- =========================================================================================

create table public.personality_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- What produced this evidence. 'quiz_result' is accepted by the schema now for forward
  -- compatibility, even though only the daily_answer trigger below actually writes rows in
  -- this sprint — quiz-driven personality evidence is future work (see docs/backend-setup.md).
  source_type text not null,
  -- The originating row's id (as text) — a daily_answers.id or a future quiz_results.id.
  -- Not a foreign key on purpose: it can point at either table depending on source_type, and
  -- this row must survive even if the source row is later deleted (it never is today, but
  -- the snapshot columns below exist so evidence never depends on the source row surviving).
  source_id text not null,
  question_snapshot text not null,
  answer_snapshot text not null,
  category text not null,
  -- Matches PersonalityDimensionId string values in src/data/personality.ts. Left as plain
  -- text (not a DB enum) since that dimension list is expected to evolve without a migration
  -- every time; validate it at the application layer.
  dimension text not null,
  effect smallint not null,
  created_at timestamptz not null default now(),
  constraint personality_evidence_source_type_check check (source_type in ('daily_answer', 'quiz_result')),
  constraint personality_evidence_effect_check check (effect in (-2, -1, 1, 2)),
  -- One evidence row per (user, source, dimension) — a single Daily answer can legally carry
  -- several personality effects across DIFFERENT dimensions (see
  -- MAX_PERSONALITY_EFFECTS_PER_OPTION in src/data/daily-questions.ts), and this key allows
  -- one row per dimension per answer while making a duplicate insert for the SAME
  -- (source, dimension) a no-op instead of a duplicate row — see the trigger below.
  constraint personality_evidence_unique_source_dimension unique (user_id, source_type, source_id, dimension)
);

comment on table public.personality_evidence is
  'Server-derived personality signal history — will eventually replace demo personality evidence in src/data/personality.ts (getDemoPersonalityAnswers). Rows are NEVER inserted by the client directly; see handle_daily_answer_personality_evidence() below. Users may only SELECT their own rows.';

create index personality_evidence_user_id_idx on public.personality_evidence (user_id);
create index personality_evidence_user_dimension_idx on public.personality_evidence (user_id, dimension);

alter table public.personality_evidence enable row level security;

create policy "personality_evidence_select_own"
  on public.personality_evidence
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately NO insert/update/delete policy for `authenticated` — the ONLY writer is the
-- SECURITY DEFINER trigger function below, which (as long as this table is not put under
-- FORCE ROW LEVEL SECURITY) runs with the privileges of its owner and bypasses RLS entirely.
-- A client can never insert fabricated personality_evidence, even by calling the table
-- directly with a valid session.

-- ---------------------------------------------------------------------------------------
-- Server-derived personality evidence from Daily answers.
--
-- When a Daily answer is inserted, this trigger reads the CHOSEN OPTION's
-- personality_effects (already stored server-side on daily_options, never supplied by the
-- client alongside the answer — daily_answers has no effects column at all) and writes one
-- personality_evidence row per effect. `on conflict ... do nothing`, keyed to the unique
-- constraint above, makes this idempotent: re-running it (a retried insert, a replayed
-- trigger) can never produce duplicate evidence for the same answer.
-- ---------------------------------------------------------------------------------------

create or replace function public.handle_daily_answer_personality_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prompt text;
  v_category text;
  v_option_label text;
  v_effects jsonb;
  v_effect jsonb;
begin
  select prompt, category
    into v_prompt, v_category
    from public.daily_questions
    where id = new.question_id;

  select label, personality_effects
    into v_option_label, v_effects
    from public.daily_options
    where id = new.option_id;

  if v_effects is null or jsonb_typeof(v_effects) <> 'array' then
    return new;
  end if;

  for v_effect in select * from jsonb_array_elements(v_effects)
  loop
    insert into public.personality_evidence (
      user_id, source_type, source_id, question_snapshot, answer_snapshot,
      category, dimension, effect
    )
    values (
      new.user_id,
      'daily_answer',
      new.id::text,
      v_prompt,
      v_option_label,
      v_category,
      v_effect ->> 'dimension',
      (v_effect ->> 'value')::smallint
    )
    on conflict (user_id, source_type, source_id, dimension) do nothing;
  end loop;

  return new;
end;
$$;

comment on function public.handle_daily_answer_personality_evidence() is
  'AFTER INSERT trigger on daily_answers. Reads the chosen option''s personality_effects (server-side data, never client-supplied) and idempotently writes one personality_evidence row per effect. SECURITY DEFINER so it can write despite personality_evidence having no INSERT policy for authenticated; search_path is pinned to public to keep that elevated execution context safe.';

create trigger daily_answers_after_insert_personality_evidence
  after insert on public.daily_answers
  for each row
  execute function public.handle_daily_answer_personality_evidence();

-- =========================================================================================
-- 7. DAILY WORLD DISTRIBUTION (real percentages, no raw-row exposure)
-- =========================================================================================
--
-- Product rule: "Answer first. Then unlock the world." The Room is server-locked until the
-- current user has committed their answer — this is enforced HERE, inside the function
-- itself, not left to the client to politely wait before calling. A caller who has not yet
-- answered p_question_id (or isn't authenticated, or the question isn't consumer-visible)
-- gets zero rows back, never a fabricated 0%-everywhere distribution and never a hint about
-- whether ANYONE else has answered.

create or replace function public.get_daily_distribution(p_question_id uuid)
returns table (
  option_id uuid,
  answer_count bigint,
  percent numeric,
  total_answers bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with access as (
    -- Exactly one row, always — a plain boolean gate, never itself a source of rows.
    select
      auth.uid() is not null
      and exists (
        select 1
        from public.daily_questions q
        where q.id = p_question_id
          and q.status in ('Live', 'Archived')
      )
      and exists (
        select 1
        from public.daily_answers a
        where a.user_id = auth.uid()
          and a.question_id = p_question_id
      ) as allowed
  ),
  totals as (
    select count(*)::bigint as total
    from public.daily_answers
    where question_id = p_question_id
  ),
  counts as (
    select
      o.id as option_id,
      count(a.id)::bigint as answer_count
    from public.daily_options o
    left join public.daily_answers a
      on a.option_id = o.id
     and a.question_id = p_question_id
    where o.question_id = p_question_id
    group by o.id
  )
  select
    counts.option_id,
    counts.answer_count,
    case
      when totals.total > 0 then round((counts.answer_count::numeric / totals.total) * 100, 1)
      else 0
    end as percent,
    totals.total as total_answers
  from counts, totals, access
  where access.allowed;
$$;

comment on function public.get_daily_distribution(uuid) is
  'The Room is server-locked until the current user has committed their answer. Returns all four options'' real counts/percentages, derived only from actual daily_answers rows, ONLY when: auth.uid() is not null, the question is consumer-visible (Live or Archived), AND the caller already has a daily_answers row for this question. Any other caller (unauthenticated, hasn''t answered yet, or the question is Draft/Scheduled/etc.) gets zero rows back — never a fabricated 0%-everywhere distribution, and never any signal about whether other users have answered. SECURITY DEFINER lets it aggregate across every user''s rows (a normal authenticated user''s own RLS policy only covers their own answers) while returning nothing but the gated aggregate — no raw other-user answer row is ever exposed. search_path is pinned to public for the same safety reason as the trigger function above.';

-- Postgres grants EXECUTE on new functions to PUBLIC by default — revoke that first, then
-- grant only to the role real (including anonymous-signed-in) users hold, so a genuinely
-- unauthenticated caller can never invoke this even indirectly. The access gate inside the
-- function body above is still what actually withholds rows from an authenticated-but-not-
-- yet-answered caller — this grant only controls who may call the function at all.
revoke all on function public.get_daily_distribution(uuid) from public;
grant execute on function public.get_daily_distribution(uuid) to authenticated;
