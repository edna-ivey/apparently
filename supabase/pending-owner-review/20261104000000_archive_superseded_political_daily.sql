-- STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET. Content cleanup,
-- not a schema change -- requires its own owner review and sign-off, same as the other files
-- in this directory.
--
-- Archives the one live row of the superseded political Daily ("Which principle would you
-- defend even if your usual political side disagreed with you?") -- confirmed (V1 release
-- execution, 2026-11-03) to be a pre-Build-22 draft the owner's own approval ledger explicitly
-- replaced: "This replaces the earlier political question and its answer options in the
-- editorial handoff" (docs/DAILY_PRODUCTION_OWNER_APPROVALS.md). Its approved final
-- replacement -- "Your favorite politician gets caught doing the EXACT thing they've been
-- criticizing everyone else for. What's your reaction?" -- is question #37 in the approved 62,
-- already included in 20261103000000_daily_missing_approved_questions_seed.sql.
--
-- Of the superseded question's 5 total rows (1 canonical + 4 recurrence clones), 4 are already
-- 'Archived'; only one clone (id 52933764-8337-439a-94f8-b7071b98e567, confirmed directly
-- against the real production backup) is still 'Live' in the public room today. This migration
-- archives exactly that one row, via the real admin function (not a raw UPDATE), so it is
-- removed from rotation eligibility the same way any other Daily's lifecycle would be ended.
-- Nothing is deleted -- consistent with "necessary platform/migration history," the row and
-- its full edit history remain in the table, just no longer eligible to be shown.
--
-- Run this BEFORE the 36-missing-Dailies seed is scheduled into rotation, so the superseded
-- question is never live at the same time as, or after, its approved replacement.

select public.admin_archive_live_daily('52933764-8337-439a-94f8-b7071b98e567');

-- Verification: expect 0 rows.
-- select count(*) from public.daily_questions where status = 'Live' and room = 'public'
--   and id = '52933764-8337-439a-94f8-b7071b98e567';
