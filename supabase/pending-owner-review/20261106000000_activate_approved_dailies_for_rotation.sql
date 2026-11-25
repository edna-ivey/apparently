-- STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET. One-time content-ops
-- cutover, not a schema change -- requires its own owner review and sign-off.
--
-- V1 release execution (2026-11-06), item 1: bootstraps every currently-Approved canonical
-- Daily into advance_daily_rotation()'s real candidate pool (see
-- 20261106010000_admin_activate_approved_daily_for_rotation.sql's own header for the full
-- explanation of the gap and why this is NOT a blind status flip). Performs the exact same
-- validation that new admin_activate_approved_daily_for_rotation() RPC does -- for every
-- canonical row, individually, failing the whole batch if even one fails -- but as a direct
-- UPDATE rather than calling the RPC, for the same reason every other content-ops file in this
-- directory does: is_owner() reads auth.uid() from a JWT claim that does not exist in a raw
-- psql/SQL-editor session (confirmed directly against the real function body, not assumed).
--
-- Expected to affect exactly 37 rows (34 public + 3 private) -- the Approved canonical count
-- confirmed directly against this engagement's own real-Postgres rehearsal before this file was
-- written. A different count means the approved content set has changed since this file was
-- staged; the guard below aborts rather than silently activating a different set.

do $$
declare
  v_row record;
  v_computed_fingerprint text;
  v_activated_count int := 0;
  v_expected_count int := 37;
begin
  for v_row in
    select id, prompt, room, approved_content_version
    from public.daily_questions
    where recurrence_source_id is null and status = 'Approved'
    order by room, prompt
  loop
    if v_row.approved_content_version is null then
      raise exception 'Daily % (%, room %) is Approved but has no recorded approval fingerprint -- aborting without activating anything.', v_row.id, v_row.prompt, v_row.room;
    end if;

    v_computed_fingerprint := public.admin_compute_daily_fingerprint(v_row.id);
    if v_computed_fingerprint <> v_row.approved_content_version then
      raise exception 'Daily % (%, room %) fingerprint no longer matches its recorded approval -- content changed since approval. Re-approve before activating. Aborting without activating anything.', v_row.id, v_row.prompt, v_row.room;
    end if;

    update public.daily_questions
    set status = 'Archived'
    where id = v_row.id;

    v_activated_count := v_activated_count + 1;
  end loop;

  if v_activated_count <> v_expected_count then
    raise exception 'Expected to activate exactly % Approved canonical Dailies, activated %. Aborting -- investigate before re-running (the approved content set may have changed since this file was staged).', v_expected_count, v_activated_count;
  end if;

  raise notice 'Activated % owner-approved canonical Dailies into the real advance_daily_rotation candidate pool (Approved -> Archived, fingerprint-verified, no Live row touched, no publication history fabricated).', v_activated_count;
end $$;

-- Verification: expect 0 rows -- confirms no canonical, non-Rejected Daily is still invisible
-- to advance_daily_rotation's own candidate query after this runs.
-- select id, prompt, room, status from public.daily_questions
--   where recurrence_source_id is null and status not in ('Live', 'Archived', 'Rejected');
