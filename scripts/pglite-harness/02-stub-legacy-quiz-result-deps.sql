-- Minimal, schema-accurate stubs of two tables the REAL submit_quiz_result migration chain
-- needs but 00-stub-foundation.sql does not define (owner audit, 2026-10-30, item 3 test).
-- Column shapes copied verbatim from their real origin migrations so the REAL, unmodified
-- 20261018020000_age_eligibility_gate.sql and 20261030020000_legacy_quiz_result_completion_
-- reservation.sql migration files -- not a reimplementation of their logic -- can be loaded
-- and run as-is against this harness.

-- public.profiles: deliberately WITHOUT age_eligibility -- the real
-- 20261018020000_age_eligibility_gate.sql migration itself adds that column via its own
-- ALTER TABLE, and is loaded verbatim after this stub; predefining it here would make that
-- real migration's ALTER TABLE fail with "column already exists".
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- public.personality_evidence, copied from 20260913120000_initial_apparently_schema.sql
-- (lines 322-349), widened effect range per 20261004120000_widen_personality_effect_range_for_
-- ranked_private_award.sql (the real, currently-live constraint allows -3..3, not just -2..2).
create table public.personality_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null,
  source_id text not null,
  question_snapshot text not null,
  answer_snapshot text not null,
  category text not null,
  dimension text not null,
  effect smallint not null,
  created_at timestamptz not null default now(),
  constraint personality_evidence_source_type_check check (source_type in ('daily_answer', 'quiz_result')),
  constraint personality_evidence_effect_check check (effect in (-3, -2, -1, 1, 2, 3)),
  constraint personality_evidence_unique_source_dimension unique (user_id, source_type, source_id, dimension)
);
