-- MANUAL OPERATION. NOT a schema migration -- same elevated-session, explicit-authorization
-- category as 20261103020000_clean_v1_full_prelaunch_wipe.sql. DO NOT RUN AGAINST PRODUCTION
-- WITHOUT EXPLICIT OWNER AUTHORIZATION, and only AFTER that wipe has already run (this file's
-- own precondition guard below enforces that ordering).
--
-- V1 release execution (2026-11-06), item 5: the final content-catalog cleanup, run once,
-- after the full consumer wipe, before V1 launch. Two separate things, both dependency-safe:
--
-- 1. PERMANENTLY REMOVES the superseded political Daily (canonical row
--    05f3489c-709f-4a58-ab04-10c07c2f8001, currently status='Rejected' per
--    20261104000000_archive_superseded_political_daily.sql) and its 4 recurrence clones.
--    Clones first, then the canonical row -- recurrence_source_id is ON DELETE RESTRICT
--    (confirmed against the real schema), so the canonical row cannot be deleted while any
--    clone still references it. Both daily_options (ON DELETE CASCADE from question_id) and
--    daily_option_trait_awards (ON DELETE CASCADE from option_id) cascade away automatically;
--    daily_answers would too (ON DELETE CASCADE from question_id) but should already be empty
--    at this point, since the wipe runs first -- the precondition guard below checks that.
--
-- 2. REMOVES every OTHER recurrence clone -- i.e. every daily_questions row with
--    recurrence_source_id IS NOT NULL that is NOT one of the 4 just-removed political clones.
--    These are pure beta/rehearsal-period occurrence history for the 62 VALID canonical
--    questions (one row per calendar day a canonical question was ever actually shown) --
--    deleting them touches no valid approved content (the canonical rows themselves, and
--    their options/awards, are never deleted here) and is safe for the identical reason #1 is:
--    nothing ever references a clone via recurrence_source_id (only a clone references
--    AWAY, from itself to its canonical source -- never the reverse), so no RESTRICT applies
--    and the cascade-only dependents (daily_options, daily_option_trait_awards) go with it.
--    daily_rotation_state is reset to a genuinely fresh state for both rooms (empty
--    shown_question_ids, cycle_number back to its starting value) so V1 launch does not
--    silently inherit beta's "already shown" history, which would skip real first-time
--    exposure for whichever canonical questions beta testers happened to see first.
--
-- After this runs, the catalog is exactly: 62 approved canonical Dailies (50 public + 12
-- private), zero clone/occurrence rows, zero superseded content, a freshly-reset rotation
-- state. advance_daily_rotation(room) must then be called once per room (NOT automated by
-- this file -- that is the actual real launch-day action, deliberately left as an explicit,
-- separate, owner-timed step) to produce the first real V1 Daily for each room.

begin;

-- Precondition: refuse to run against a database that still has real consumer answers --
-- this file is a post-wipe cleanup step, never a substitute for the wipe, and never safe to
-- run before it (it would silently discard real, still-needed consumer answer history).
do $$
declare
  v_answer_count int;
begin
  select count(*) into v_answer_count from public.daily_answers;
  if v_answer_count > 0 then
    raise exception 'Refusing to run: % daily_answers rows still exist. This file must only run AFTER 20261103020000_clean_v1_full_prelaunch_wipe.sql, never before or instead of it.', v_answer_count;
  end if;
end $$;

-- 1. The superseded political Daily: 4 clones, then the canonical row.
do $$
declare
  v_canonical_id uuid := '05f3489c-709f-4a58-ab04-10c07c2f8001';
  v_clone_count int;
  v_canonical_count int;
begin
  if not exists (
    select 1 from public.daily_questions
    where id = v_canonical_id
      and prompt = 'Which principle would you defend even if your usual political side disagreed with you?'
      and status = 'Rejected'
  ) then
    raise exception 'Expected canonical row % to be the superseded political Daily, status Rejected -- found something else or nothing. Aborting without deleting anything.', v_canonical_id;
  end if;

  delete from public.daily_questions where recurrence_source_id = v_canonical_id;
  get diagnostics v_clone_count = row_count;

  delete from public.daily_questions where id = v_canonical_id;
  get diagnostics v_canonical_count = row_count;

  if v_clone_count <> 4 or v_canonical_count <> 1 then
    raise exception 'Expected to delete exactly 4 clones + 1 canonical row for the political Daily, deleted % clones + % canonical. Aborting -- investigate before re-running.', v_clone_count, v_canonical_count;
  end if;

  raise notice 'Permanently removed the superseded political Daily: 1 canonical row + 4 recurrence clones.';
end $$;

-- 2. Every remaining recurrence clone (beta/rehearsal occurrence history for valid canonical
--    content) -- the canonical rows themselves are never touched by this delete.
do $$
declare
  v_clone_count int;
begin
  delete from public.daily_questions where recurrence_source_id is not null;
  get diagnostics v_clone_count = row_count;
  raise notice 'Removed % obsolete beta/rehearsal recurrence clone(s) -- canonical content untouched.', v_clone_count;
end $$;

-- Reset rotation state to genuinely fresh for both rooms -- V1 launch starts its own history,
-- never inheriting which canonical questions beta testers happened to see first.
delete from public.daily_rotation_state;

-- Final verification: exactly 62 canonical Dailies (50 public + 12 private), zero clones,
-- zero Rejected content, zero rows in daily_rotation_state (freshly re-initialized by the
-- next advance_daily_rotation call, same as any room's very first-ever call).
do $$
declare
  v_canonical_total int;
  v_public_canonical int;
  v_private_canonical int;
  v_clone_remaining int;
  v_rejected_remaining int;
begin
  select count(*) into v_canonical_total from public.daily_questions where recurrence_source_id is null;
  select count(*) into v_public_canonical from public.daily_questions where recurrence_source_id is null and room = 'public';
  select count(*) into v_private_canonical from public.daily_questions where recurrence_source_id is null and room = 'private';
  select count(*) into v_clone_remaining from public.daily_questions where recurrence_source_id is not null;
  select count(*) into v_rejected_remaining from public.daily_questions where status = 'Rejected';

  if v_canonical_total <> 62 or v_public_canonical <> 50 or v_private_canonical <> 12 then
    raise exception 'Expected exactly 62 canonical Dailies (50 public + 12 private), found % total (% public + % private). Aborting -- do not treat this as clean.', v_canonical_total, v_public_canonical, v_private_canonical;
  end if;
  if v_clone_remaining <> 0 then
    raise exception 'Expected zero recurrence clones remaining, found %. Aborting.', v_clone_remaining;
  end if;
  if v_rejected_remaining <> 0 then
    raise exception 'Expected zero Rejected-status Dailies remaining, found %. Aborting.', v_rejected_remaining;
  end if;

  raise notice 'Clean V1 content catalog verified: 62 canonical Dailies (50 public + 12 private), 0 clones, 0 superseded/Rejected content, rotation state freshly reset.';
end $$;

commit;

-- Real launch-day action (deliberately NOT part of this file -- owner-timed, separate):
--   select advance_daily_rotation('public');
--   select advance_daily_rotation('private');
-- Each produces the first real V1 occurrence for its room, published_for = that day's date.
