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

begin;

alter table public.daily_options drop constraint daily_options_position_range;
alter table public.daily_options add constraint daily_options_position_range check (position >= 1 and position <= 6);

insert into public.daily_options (id, question_id, "position", label, pole_personality_effects) values
  ('b028869c-799a-4de1-8d8d-3bd5c3ace0cd', '5c9a48bb-4606-43c7-8f3e-fac621ff6232', 5, 'The crew from Friends', '[{"pole":"independent_collaborative:negative","points":2},{"pole":"adventure_comfort:negative","points":1}]'::jsonb),
  ('84261060-66a6-454a-9d5d-3bb50d5a4135', '5c9a48bb-4606-43c7-8f3e-fac621ff6232', 6, 'The crew from New Girl', '[{"pole":"planner_spontaneous:negative","points":2},{"pole":"playful_serious:positive","points":2}]'::jsonb);

commit;
