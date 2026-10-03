-- Apparently You — restore the pre-Build-9 Daily cron target (Build 9 correction pass).
--
-- 20261001010000_daily_rotation_cycle.sql added an automatic pool-rotation fallback for the
-- Public Daily, on the assumption that the admin-curated Scheduled calendar would eventually
-- run dry and leave Public stuck on a stale Live question. Real-world testing (the live
-- apparentlyyou.com preview) showed this was never actually happening — the admin Scheduled
-- calendar has continued to cover every real day. Checking the live daily_rotation_state row
-- confirms the automatic fallback (advance_daily_rotation) has only ever fired ONCE in
-- production, and that one firing was this engagement's own manual test call during Build 9
-- development, not an organic schedule gap — the very next real day's publish came from the
-- admin's Scheduled calendar exactly as before, superseding it.
--
-- Per Bible v1.4 §42 (Data Honesty) and this project's own migration-safety convention, this
-- does NOT delete 20261001010000's table/functions (daily_rotation_state,
-- advance_daily_rotation, run_daily_rollover all remain, unmodified, for a possible deliberate
-- future re-enable if the Scheduled calendar is ever genuinely observed to run dry). This
-- migration only repoints the hourly cron job back to publish_scheduled_daily_for_today()
-- directly — the exact pre-Build-9 behavior — so Public Daily can never be automatically
-- substituted with a random previously-published question the admin did not choose for today.

select cron.schedule(
  'apparently_daily_rollover',
  '5 * * * *',
  $$select public.publish_scheduled_daily_for_today();$$
);

comment on function public.run_daily_rollover() is
  'Automatic Public Daily rollover fallback (Build 9) -- NOT currently wired to cron (see 20261002030000_restore_scheduled_daily_rollover.sql: real-world testing showed the admin Scheduled calendar never actually runs dry, so this was reverted to avoid substituting a random question the admin did not choose for today). Retained, unmodified, for a possible deliberate future re-enable if that ever changes -- call this instead of publish_scheduled_daily_for_today() in the cron.schedule call above to restore it.';
