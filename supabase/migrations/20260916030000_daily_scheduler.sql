-- Apparently You — automatic Scheduled Daily rollover for the TestFlight beta week.
--
-- Publishes a Scheduled Daily automatically once its scheduled_for date arrives, using
-- America/Anchorage (the product's beta-week timezone) as the local calendar date — never
-- UTC. Deliberately narrow in scope: this is NOT a general publishing endpoint. It only ever
-- promotes a Daily whose scheduled_for exactly equals "today" in Alaska time, and only when
-- its approval is still current. It is invoked exclusively by a scheduled pg_cron job running
-- as the database owner — never reachable by anon or authenticated, and never a substitute
-- for Michelle's own manual Publish Now (admin_publish_daily, untouched by this migration).

-- =========================================================================================
-- 1. ENABLE pg_cron
-- =========================================================================================
--
-- Not previously installed on this project (confirmed via pg_available_extensions before
-- writing this migration: pg_cron 1.6.4 is available but had never been enabled, and no
-- apparently_daily_rollover job — or any job — existed yet). Supabase's own documented
-- pattern is to install it into pg_catalog specifically; the extension creates its own
-- dedicated `cron` schema for its job tables/functions regardless of the install schema.

create extension if not exists pg_cron with schema pg_catalog;

-- =========================================================================================
-- 2. publish_scheduled_daily_for_today()
-- =========================================================================================

create or replace function public.publish_scheduled_daily_for_today()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  local_today date;
  target record;
  computed_fingerprint text;
begin
  -- America/Anchorage, not UTC — this is the ONE place "today" is decided for automatic
  -- rollover, so DST transitions (Alaska Daylight <-> Standard Time) are handled correctly
  -- by Postgres' own timezone database rather than any hardcoded UTC offset.
  local_today := (now() at time zone 'America/Anchorage')::date;

  select * into target
  from public.daily_questions
  where status = 'Scheduled' and scheduled_for = local_today
  for update;

  -- No Scheduled Daily for today: a clean no-op, not an error. This is what makes the
  -- function safe to run every hour — after the one real promotion for a given date, every
  -- subsequent hourly run that same day finds nothing left to do. It also means a date
  -- missed entirely (system offline, no Scheduled row matches any past date this function
  -- ever looks at) is never backfilled — scheduled_for < local_today is simply never queried
  -- for here, by design (the permanent no-catch-up product rule).
  if target is null then
    return;
  end if;

  -- Defensive re-checks, mirroring admin_publish_daily's own safeguards exactly — even
  -- though the WHERE clause above already required status = 'Scheduled', re-confirm after
  -- acquiring the row lock (in case of a concurrent editorial action) and refuse outright if
  -- the content drifted since approval instead of silently publishing stale-approved copy.
  if target.status <> 'Scheduled' then
    return;
  end if;
  if target.approved_content_version is null then
    raise exception 'Cannot auto-publish %: no recorded approval.', target.id;
  end if;

  computed_fingerprint := public.admin_compute_daily_fingerprint(target.id);
  if computed_fingerprint <> target.approved_content_version then
    raise exception 'Cannot auto-publish %: content has changed since approval.', target.id;
  end if;

  -- Transactional and one-Live-safe by the exact same construction as admin_publish_daily:
  -- both updates happen inside this one function invocation's single implicit transaction,
  -- and daily_questions_single_live_idx (see the admin control room migration) is the
  -- database-level backstop against ever having two Live rows even under a race. Archived
  -- rows are never touched here at all, so Archived content can never be reopened by this
  -- function either.
  update public.daily_questions set status = 'Archived' where status = 'Live';

  update public.daily_questions
  set status = 'Live', scheduled_for = null, published_for = local_today
  where id = target.id;
end;
$$;

comment on function public.publish_scheduled_daily_for_today() is
  'Automatic Daily rollover for the TestFlight beta week. Publishes ONLY the Scheduled Daily whose scheduled_for exactly equals today in America/Anchorage — never a past-due date (permanent no-catch-up rule: a date missed while the system was offline stays Scheduled for deliberate Owner attention, never silently backfilled). Invoked by the apparently_daily_rollover pg_cron job, hourly — never directly reachable by anon or authenticated. Michelle''s manual admin_publish_daily() Publish Now override is completely separate and unaffected by this function.';

revoke execute on function public.publish_scheduled_daily_for_today() from public;
revoke execute on function public.publish_scheduled_daily_for_today() from anon;
revoke execute on function public.publish_scheduled_daily_for_today() from authenticated;

-- =========================================================================================
-- 3. SCHEDULE: apparently_daily_rollover, hourly
-- =========================================================================================
--
-- Hourly, not a single fixed UTC-midnight run — America/Anchorage shifts between AKDT
-- (UTC-8) and AKST (UTC-9) with the rest of the US DST calendar, so there is no single fixed
-- UTC cron expression that reliably lands at "Alaska midnight" year-round. Running hourly and
-- letting the function itself decide (via local_today above) whether there's anything to do
-- sidesteps the DST problem entirely, at the cost of up to ~1 hour of latency after midnight
-- Alaska time — acceptable for a one-week beta. cron.schedule with a named job is itself
-- idempotent: re-running this migration updates the existing job rather than duplicating it,
-- and no job of any name existed on this project before this migration (confirmed above).

select cron.schedule(
  'apparently_daily_rollover',
  '5 * * * *',
  $$select public.publish_scheduled_daily_for_today();$$
);
