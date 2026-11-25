-- STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET. Content cleanup,
-- not a schema change -- requires its own owner review and sign-off, same as the other files
-- in this directory.
--
-- CORRECTED (V1 release execution, 2026-11-04): the previous version of this file set the
-- superseded political Daily's one Live row to 'Archived' via admin_archive_live_daily(). Two
-- real problems with that, found by independent code review, both fixed here:
--
-- 1. 'Archived' is NOT permanent exclusion. advance_daily_rotation()'s own candidate query
--    (supabase/migrations/20261028050000_daily_trait_identity_and_rotation_fix.sql, both
--    branches) selects canonical (recurrence_source_id IS NULL) questions with
--    `status in ('Live', 'Archived')` -- the canonical source row for this question
--    (05f3489c-709f-4a58-ab04-10c07c2f8001) was ALREADY 'Archived' before this file ever ran,
--    and remains a live rotation candidate forever unless its status changes to something
--    outside that set. Archiving only the one still-Live clone did nothing to stop the
--    CANONICAL row from being picked again later.
--
-- 2. admin_archive_live_daily() calls is_owner(), which resolves auth.uid() from the calling
--    session's JWT claim. A raw psql/SQL-editor session connected with superuser or
--    service_role credentials (the only way anything in this directory is ever applied -- see
--    supabase/manual_operations/README.md) has no such claim; auth.uid() returns null and the
--    function raises "Not authorized." Confirmed directly against the real function body, not
--    assumed. This file now performs the equivalent UPDATE directly, under the same elevated,
--    deliberately-authorized privilege level every file in this directory already requires to
--    be applied at all -- consistent with how the wipe migration itself manipulates auth.users
--    directly rather than through a client-facing RPC.
--
-- WHY A STATUS CHANGE, NOT DELETION: daily_questions.recurrence_source_id is
-- ON DELETE RESTRICT (confirmed against the real schema) -- the canonical row cannot be
-- deleted while its 4 recurrence clones still reference it, and deleting the clones first
-- would mean choreographing delete order around a CASCADE into daily_answers (moot once the
-- full wipe has already run, but this file may be applied before or independently of that).
-- Deleting also discards the actual historical record of what was once published -- this
-- engagement's own "necessary platform/migration history" principle. A status change is
-- simpler, fully reversible, and gives the exact same guarantee (structurally excluded from
-- advance_daily_rotation's own candidate query) without an FK-ordering risk. 'Rejected' is the
-- only status value in the public.daily_status enum that is both (a) excluded from
-- advance_daily_rotation's candidate set and (b) not 'NeedsRevision' (which implies someone
-- should fix and resubmit it -- wrong signal for permanently superseded content). No existing
-- admin_* function currently transitions Live/Archived -> Rejected (admin_reject_daily only
-- accepts Draft/ReadyForReview) -- that gap is pre-existing editorial-tool coverage, not
-- something this one-time content cleanup should fix by changing RPC logic.
--
-- If the owner still prefers physical deletion once the wipe has already run (so there are no
-- daily_answers left to cascade), that remains available as a separate, later, explicit action
-- -- delete the 4 clone rows, then the canonical row, in that order.

do $$
declare
  v_canonical_id uuid := '05f3489c-709f-4a58-ab04-10c07c2f8001';
  v_live_clone_id uuid := '52933764-8337-439a-94f8-b7071b98e567';
  v_updated_count int;
begin
  -- Guard: confirm the row this script targets is still the question we expect before
  -- touching anything -- refuses to silently act on a different row if ids have drifted.
  if not exists (
    select 1 from public.daily_questions
    where id = v_canonical_id
      and prompt = 'Which principle would you defend even if your usual political side disagreed with you?'
  ) then
    raise exception 'Expected canonical row % to be the superseded political Daily by its exact prompt -- found something else or nothing. Aborting without changing anything.', v_canonical_id;
  end if;

  -- The canonical source AND every recurrence clone of it (the 4 already-Archived clones plus
  -- the 1 still-Live one) all move to 'Rejected' -- the canonical row is what
  -- advance_daily_rotation actually queries as a future candidate; the clones are purely
  -- historical occurrences whose own status doesn't affect future rotation, but are updated
  -- too for a consistent, honest status across the whole question's history.
  update public.daily_questions
  set status = 'Rejected',
      review_note = 'Superseded by the owner''s own later, final approval (#37 in the approved 62: '
        || '"Your favorite politician gets caught doing the EXACT thing they''ve been criticizing '
        || 'everyone else for. What''s your reaction?"). Permanently excluded from rotation -- '
        || 'V1 release execution, 2026-11-04.'
  where id = v_canonical_id or recurrence_source_id = v_canonical_id;

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> 5 then
    raise exception 'Expected to update exactly 5 rows (1 canonical + 4 clones), updated %. Aborting -- investigate before re-running.', v_updated_count;
  end if;

  raise notice 'Superseded political Daily (canonical + 4 clones, 5 rows total) permanently set to Rejected -- structurally excluded from advance_daily_rotation going forward.';
end $$;

-- Verification: expect 0 rows -- confirms no row from this question is reachable by
-- advance_daily_rotation's own candidate query any more.
-- select id, status from public.daily_questions
--   where (id = '05f3489c-709f-4a58-ab04-10c07c2f8001' or recurrence_source_id = '05f3489c-709f-4a58-ab04-10c07c2f8001')
--     and status in ('Live', 'Archived');
