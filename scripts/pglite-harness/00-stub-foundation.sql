-- Minimal, FAITHFUL stand-in for the pre-existing live Supabase schema this engagement's new
-- migrations depend on. Not the literal multi-month migration history (which includes
-- Supabase-platform-specific pieces -- pg_cron, pg_net, vault, the real auth schema internals
-- -- that a WASM Postgres engine does not provide), but real table/function definitions
-- transcribed directly from the already-applied migration files, trimmed to exactly what
-- Build 22's new migrations reference.

-- Supabase's standard roles -- real Postgres has no built-in concept of these; Supabase
-- creates them once per project. Needed because the real migration files GRANT/REVOKE
-- against these exact role names.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

-- Stub for the pg_cron extension (a real Supabase/Postgres extension this WASM engine does
-- not ship) -- just enough surface (cron.schedule) for migrations that schedule a job to
-- load without error. Never actually runs anything on a timer; this harness calls the
-- scheduled function directly when it wants to test it.
create schema if not exists cron;
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint
language sql
as $$ select 1::bigint; $$;

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Session-local actor impersonation for RLS/ownership testing -- the standard local-testing
-- substitute for a real verified JWT. Tests set this per "request" via set_config.
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.user_id', true), '')::uuid; $$;

-- Real table definitions, transcribed verbatim from the already-applied migrations.

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id text not null,
  completed_at timestamptz not null default now(),
  score integer not null,
  percent integer not null,
  result_id text not null,
  result_title text not null,
  traits text[] not null default '{}',
  mix jsonb,
  created_at timestamptz not null default now(),
  question_count smallint,
  answers jsonb,
  constraint quiz_results_percent_range check (percent between 0 and 100),
  constraint quiz_results_question_count_range check (question_count is null or (question_count >= 1 and question_count <= 50))
);
create unique index quiz_results_user_quiz_completed_idx on public.quiz_results (user_id, quiz_id, completed_at);
alter table public.quiz_results enable row level security;
create policy "quiz_results_select_own" on public.quiz_results for select using (auth.uid() = user_id);

create type public.daily_room as enum ('public', 'private');
create type public.daily_status as enum ('Idea', 'Live', 'Archived');
create type public.daily_mode as enum ('standard');

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  category text not null,
  status public.daily_status not null default 'Idea',
  sort_order integer not null default 0,
  scheduled_for date,
  published_for date,
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  approved_content_version text,
  review_note text,
  room public.daily_room not null default 'public',
  daily_mode public.daily_mode not null default 'standard',
  is_free_private_unlock boolean not null default false,
  recurrence_source_id uuid references public.daily_questions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.daily_questions (id) on delete cascade,
  "position" smallint not null,
  label text not null,
  personality_effects jsonb not null default '[]'::jsonb,
  apparently_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_options_position_range check ("position" between 1 and 4),
  constraint daily_options_question_position_unique unique (question_id, "position"),
  constraint daily_options_id_question_unique unique (id, question_id)
);

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.daily_questions (id) on delete cascade,
  option_id uuid not null,
  created_at timestamptz not null default now(),
  constraint daily_answers_user_question_unique unique (user_id, question_id),
  constraint daily_answers_option_belongs_to_question
    foreign key (option_id, question_id) references public.daily_options (id, question_id)
);
alter table public.daily_answers enable row level security;
create policy "daily_answers_select_own" on public.daily_answers for select using (auth.uid() = user_id);

create table public.daily_rotation_state (
  room public.daily_room primary key,
  cycle_number integer not null default 1,
  shown_question_ids uuid[] not null default '{}'
);

-- Minimal, deliberately simple stand-ins for the real entitlement/age functions -- real
-- signatures, test-controllable behavior via small marker tables (not the real RevenueCat/
-- tester-grant/age-verification machinery, which this harness cannot and does not need to
-- reproduce -- only the SHAPE other functions call needs to be real).

create table test_entitlements (user_id uuid, entitlement_id text);
create table test_tester_access (user_id uuid);
create table test_adult_eligible (user_id uuid);

create or replace function public.has_active_entitlement(p_user_id uuid, p_entitlement_id text) returns boolean
language sql stable
as $$ select exists (select 1 from test_entitlements where user_id = p_user_id and entitlement_id = p_entitlement_id); $$;

create or replace function public.has_tester_access(p_user_id uuid) returns boolean
language sql stable
as $$ select exists (select 1 from test_tester_access where user_id = p_user_id); $$;

create or replace function public.is_adult_eligible(p_user_id uuid) returns boolean
language sql stable
as $$ select exists (select 1 from test_adult_eligible where user_id = p_user_id); $$;

-- Supabase's platform bootstrap grants baseline table privileges to anon/authenticated by
-- default (RLS policies then govern actual row-level access on top) -- not itself a migration
-- file, but real, pre-existing platform behavior this harness must replicate to test RLS
-- faithfully (table-level GRANT and RLS policy are both required for a non-owner role to see
-- any effect at all).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
