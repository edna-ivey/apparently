-- STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET.
-- Adds the 2 approved options (E, F) still missing from the already-LIVE six-choice Daily
-- (#26, 'You have to spend an entire year with ONE TV friend group. Who are you choosing?'),
-- confirmed live with only 4 of its 6 approved options -- see
-- docs/V1_FINAL_RELEASE_EXECUTION_2026-11-02.md Phase 3 update. Relaxes the position CHECK
-- constraint from <=4 to <=6 first -- confirmed safe by reading the real app code: the
-- client (src/app/(tabs)/index.tsx, options.map + String.fromCharCode(65+index)) and the
-- server RPC (get_daily_distribution, groups by o.id/o.position generically) both already
-- support any option count with no hardcoded assumption of 4. Requires its own separate
-- owner review and sign-off -- see scripts/verify-migration-allowlist.ts.
--
-- CORRECTED (V1 release execution, 2026-11-06), item 3: E and F's pole_personality_effects
-- below were originally populated with nonzero mappings pulled from the stale master document
-- -- the exact same regression class already fixed for A-D (which already correctly carry
-- '[]'::jsonb, confirmed directly against the current data). The owner's own Round 3
-- Reassessment for B4-04 assigns NONE to all SIX answers, not just the four already-live ones.
-- This was not cosmetic: handle_daily_answer_pole_evidence (20261018010000), the legacy V2
-- trigger, is still live on daily_answers today -- confirmed by reading its real body, not
-- assumed, and confirmed NOT dropped by 20261028080000 (which only revokes the legacy RPC's
-- EXECUTE grant, never touches the trigger or table) -- and reads pole_personality_effects
-- directly to write real rows into personality_pole_evidence on every insert. A nonzero value
-- here would have caused that legacy path to record real, wrong personality evidence for
-- anyone answering E or F, even though the current numeric path (daily_option_trait_awards,
-- which this file never populates for E/F either) already correctly awards zero. Both options
-- now carry '[]'::jsonb, matching A-D exactly -- all six answers consistently entertainment-
-- only across every evidence-writing path, legacy and current.
--
-- ALSO CORRECTED (same date): scripts/validate-daily-content-against-specification.ts (new)
-- found E and F never had any apparently_feedback (reveal) text at all -- a separate, real gap
-- from the scoring one, not previously flagged. Both now carry their approved reveal text from
-- scripts/lib/daily-content-spec.ts (#26E/#26F), matching how A-D already read.

begin;

alter table public.daily_options drop constraint daily_options_position_range;
alter table public.daily_options add constraint daily_options_position_range check (position >= 1 and position <= 6);

insert into public.daily_options (id, question_id, "position", label, apparently_feedback, pole_personality_effects) values
  ('b028869c-799a-4de1-8d8d-3bd5c3ace0cd', '5c9a48bb-4606-43c7-8f3e-fac621ff6232', 5, 'The crew from Friends', 'Apparently, you want a permanent coffee-shop table, friends who practically live in your apartment, and absolutely no concept of personal space.', '[]'::jsonb),
  ('84261060-66a6-454a-9d5d-3bb50d5a4135', '5c9a48bb-4606-43c7-8f3e-fac621ff6232', 6, 'The crew from New Girl', 'Apparently, you want a house full of lovable chaos, questionable decisions, and roommates who treat every minor inconvenience like a season finale.', '[]'::jsonb);

commit;
