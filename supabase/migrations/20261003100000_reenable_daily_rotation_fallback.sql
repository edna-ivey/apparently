-- Emergency durability fix: Public Daily must roll every Alaska calendar day.
-- Prefer an explicitly Scheduled Daily for today; if none exists, recycle a real
-- previously-published Public Daily through the existing randomized rotation pool.
-- run_daily_rollover() is idempotent for a given day because it only falls back
-- when the current Live Public Daily was not published today.

select cron.schedule(
  'apparently_daily_rollover',
  '5 * * * *',
  $$select public.run_daily_rollover();$$
);

comment on function public.run_daily_rollover() is
  'Production Public Daily rollover. Hourly in Alaska time semantics: first publishes an admin-Scheduled Daily for today; if none exists and the current Live Public Daily is stale, advances the randomized pool of previously-published Public Dailies. This keeps Daily from ever remaining stuck solely because the schedule is empty.';
