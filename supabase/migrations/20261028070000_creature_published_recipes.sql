-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before `supabase db push`.
--
-- Build 22 Friday-evolution server persistence (docs/BUILD22_UNIFIED_SCORING_EVOLUTION_PLAN_
-- 2026-10-27.md Revision 6, §5/§6/§12). This migration establishes the SCHEMA and its
-- immutability guarantee only -- the publish RPC that actually evaluates a cycle and writes
-- through this table (cycle-cutoff evidence filtering, the calibrated anti-flap margin, the
-- notification trigger) is Phase 2 work, not built here. Creating the schema now, with its
-- hard constraints already in place, means no future RPC can ever be written against a
-- schema that allows the one thing this plan explicitly forbids: rewriting a past cycle's
-- already-published recipe.
--
-- UPDATED 2026-10-28 (Build 22 numeric-identity correction): trait_dimension_id/trait_pole_
-- sign (two string columns) replaced with a single numeric trait_id, referencing the trait
-- catalog added in 20261028010000_personality_trait_catalog.sql -- no persisted scoring
-- relationship may use a string identifier, per that migration's own locked decision. This
-- migration must therefore apply AFTER 20261028010000.
--
-- =========================================================================================
-- 1. CREATURE_PUBLISHED_RECIPES -- append-only, one row per (account, cycle, slot) that
--    actually changed that cycle. "What's showing right now" = the row with the greatest
--    cycle_week per (user_id, slot); every older row stays exactly as published, forever.
-- =========================================================================================

create table public.creature_published_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- ISO-week-style string derived from "the most recent Friday 00:00 America/Anchorage at or
  -- before the evaluation moment" -- computed server-side by the Phase 2 publish RPC, never
  -- client-supplied, so every device on an account agrees on the same cycle identity.
  cycle_week text not null,
  slot text not null check (slot in ('eyes', 'earsHorns', 'wings', 'body', 'tail')),
  trait_id smallint not null references public.personality_traits (trait_id),
  published_at timestamptz not null default now(),
  -- One row per (account, cycle, slot) -- the hard guarantee that a later correction or
  -- backfill can never alter what a past cycle published: the only way to change what a slot
  -- shows is a NEW row for a NEW (later) cycle_week, never an update to an existing one.
  constraint creature_published_recipes_unique_cycle_slot unique (user_id, cycle_week, slot)
);

comment on table public.creature_published_recipes is
  'Append-only. A cycle''s published row, once written, is never altered -- enforced by the unique constraint above AND by granting this role NO update privilege on this table at all (see below), not merely by procedural discipline. "Current" Creature state = the row with the greatest cycle_week per (user_id, slot). A mapping correction or historical backfill may change what a FUTURE cycle''s evaluation produces; it can never rewrite a row that already exists here.';

create index creature_published_recipes_user_id_idx on public.creature_published_recipes (user_id);
create index creature_published_recipes_user_slot_cycle_idx on public.creature_published_recipes (user_id, slot, cycle_week desc);

alter table public.creature_published_recipes enable row level security;

create policy "creature_published_recipes_select_own"
  on public.creature_published_recipes
  for select
  to authenticated
  using (auth.uid() = user_id);

-- OWNER AUDIT (2026-10-29): "immutable through database enforcement, not merely application
-- convention or unique keys." A missing GRANT is still only a privilege the role doesn't
-- have -- it says nothing about service_role or a future migration running as the table
-- owner, both of which bypass GRANT/REVOKE entirely. Added: a BEFORE UPDATE OR DELETE trigger
-- that unconditionally raises, regardless of role or privilege level. This is the actual
-- database-level enforcement; the missing GRANT below is now defense-in-depth on top of it,
-- not the primary guarantee.

create or replace function public.reject_creature_published_recipes_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'creature_published_recipes is append-only -- % is never permitted, by any role, on any row.', tg_op;
end;
$$;

create trigger creature_published_recipes_immutable
  before update or delete on public.creature_published_recipes
  for each row
  execute function public.reject_creature_published_recipes_mutation();

comment on trigger creature_published_recipes_immutable on public.creature_published_recipes is
  'Enforces append-only at the database level -- fires for ANY update/delete attempt regardless of role, including service_role or a future migration running as table owner (unlike a GRANT, a trigger cannot be bypassed by privilege level alone). This is the real immutability guarantee; the missing authenticated UPDATE/DELETE grant below is defense-in-depth, not the primary mechanism.';

-- Deliberately NO insert/update/delete policy for `authenticated` -- same pattern as every
-- other sensitive table in this schema (personality_pole_evidence, quiz_choice_pole_awards,
-- user_known_creature_traits): the only writer is a future SECURITY DEFINER publish RPC
-- (Phase 2), and that RPC itself will only ever INSERT, never UPDATE or DELETE, a published
-- recipe row -- there is no grant here that would even let it do otherwise.

-- =========================================================================================
-- 2. CREATURE_EVOLUTION_CYCLE_MARKERS -- the race-to-publish marker, same pattern already
--    shipped and approved for sync_creature_traits (20261022030000_creature_evolution_
--    notification.sql): INSERT ... ON CONFLICT DO NOTHING RETURNING * is how a future RPC
--    decides "am I the device that gets to evaluate and publish this cycle," so two devices
--    checking in for the same cycle can never both publish, and a retried call for an
--    already-evaluated cycle can never re-enter the write path at all.
-- =========================================================================================

create table public.creature_evolution_cycle_markers (
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_week text not null,
  evaluated_at timestamptz not null default now(),
  primary key (user_id, cycle_week)
);

comment on table public.creature_evolution_cycle_markers is
  'One row per (account, cycle) that has ever been evaluated, written by whichever device''s publish-RPC call wins the INSERT race for that cycle. A second device/retry for the same cycle finds the row already present and short-circuits before touching creature_published_recipes at all -- this table existing is what makes duplicate publication and duplicate evolution notifications structurally impossible, not just unlikely.';

alter table public.creature_evolution_cycle_markers enable row level security;

create policy "creature_evolution_cycle_markers_select_own"
  on public.creature_evolution_cycle_markers
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately NO insert/update/delete policy for `authenticated` -- same reasoning as above;
-- the Phase 2 publish RPC is the only writer.
