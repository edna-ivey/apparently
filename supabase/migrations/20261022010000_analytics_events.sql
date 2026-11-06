-- First-party analytics events table for the advertising + push-notification launch work
-- (2026-10-22). No third-party analytics SDK is added -- owner decision, confirmed before this
-- was built (see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md). This is the single
-- place every ad/notification funnel event lands; business metrics (DAU/MAU, conversion,
-- retention, etc.) are computed as read-only queries/views against this table plus existing
-- tables (quiz_results, user_entitlements), never as separately tracked events.
--
-- Same RLS shape as every other user-owned table in this schema: a user can insert their own
-- events and can never read, update, or delete any event (their own or anyone else's) through
-- the normal client API -- this is a write-only telemetry stream from the client's point of
-- view, read only via direct project-admin SQL access (the same `supabase db query --linked`
-- access already used throughout this engagement) until/unless a real admin reporting screen is
-- built. event_name is a server-enforced allow-list -- an arbitrary/garbage event name is
-- rejected, not silently accepted, so this table can never accumulate typo'd or fabricated
-- event names.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_name_check check (event_name in (
    -- Advertising funnel
    'ad_eligible', 'ad_request', 'ad_loaded', 'ad_impression', 'ad_revenue_paid',
    'ad_dismissed', 'ad_failed', 'quiz_completed', 'result_revealed', 'ad_placement_variant',
    -- Notifications funnel
    'notification_permission_requested', 'notification_permission_granted',
    'notification_permission_denied', 'notification_scheduled', 'notification_sent',
    'notification_opened', 'notification_preference_changed'
  ))
);

comment on table public.analytics_events is
  'First-party, write-only (from the client''s perspective) event stream for the advertising and push-notification launch work. event_name is a server-enforced allow-list (see the CHECK constraint) -- a client can never write an event name outside this known set. No third-party analytics SDK exists in this app; this table is the entire analytics system.';

create index analytics_events_user_id_idx on public.analytics_events (user_id);
create index analytics_events_event_name_created_at_idx on public.analytics_events (event_name, created_at);

alter table public.analytics_events enable row level security;

create policy "analytics_events_insert_own"
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No select/update/delete policy for any role other than the table owner -- a user can write
-- their own events but can never read them back (this is telemetry, not user-facing content),
-- matching the zero-policies-beyond-what's-needed convention this schema already uses for
-- quiz_shares/admin_users.

-- The one write path. SECURITY DEFINER so it can derive user_id from auth.uid() itself (never
-- trusting a client-submitted user id) -- same identity-boundary pattern as submit_quiz_result.
-- Caps properties at a small size so this can never become a dumping ground for large payloads
-- (and, per this engagement's own privacy standard, properties must never contain quiz answer
-- text, personality trait values, or any other sensitive content -- enforced by convention in
-- the client helper, src/services/analytics-service.ts, not re-validated here since jsonb
-- shape alone cannot distinguish "safe" from "sensitive" content).
create or replace function public.log_analytics_event(p_event_name text, p_properties jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if p_properties is null or jsonb_typeof(p_properties) <> 'object' then
    raise exception 'properties must be a JSON object.';
  end if;
  if length(p_properties::text) > 4000 then
    raise exception 'properties payload is too large.';
  end if;

  insert into public.analytics_events (user_id, event_name, properties)
  values (v_user_id, p_event_name, p_properties);
end;
$$;

comment on function public.log_analytics_event(text, jsonb) is
  'The one write path for analytics_events. event_name is validated against the table''s own CHECK constraint (an invalid name raises, never silently drops). Always writes under auth.uid() -- a client can never log an event as another user.';

revoke all on function public.log_analytics_event(text, jsonb) from public;
revoke all on function public.log_analytics_event(text, jsonb) from anon;
grant execute on function public.log_analytics_event(text, jsonb) to authenticated;

-- ============================================================================================
-- Business-metric READ queries, documented here rather than built as a dashboard (no admin UI
-- for this exists yet). Views, not materialized -- always live, never stale/cached. Run via
-- project-admin SQL access (supabase db query --linked) or a future admin screen. Separating
-- "estimated ad revenue" (ad_revenue_paid events report an SDK-estimated micros value, NOT a
-- finalized payout) from real AdMob/App Store financial reporting is deliberate -- never
-- conflate the two, per this task's own "distinguish estimated advertising revenue from
-- finalized reporting" instruction.
-- ============================================================================================

create view public.analytics_daily_active_free_users as
select date_trunc('day', created_at) as day, count(distinct user_id) as active_free_users
from public.analytics_events
where event_name in ('quiz_completed', 'result_revealed')
group by 1
order by 1 desc;

comment on view public.analytics_daily_active_free_users is
  'Daily count of distinct users who generated at least one quiz_completed or result_revealed event -- a proxy for free-tier daily activity, not a full DAU definition (it does not count Daily-only or You/Creature-only sessions, which emit no analytics event in this pass). Read-only reference query, not a finalized metric.';

-- SECURITY (production-readiness review, 2026-10-23): a view does NOT automatically inherit
-- the base table's RLS restriction for every caller -- views run with the VIEW OWNER's
-- privileges for permission-checking purposes (the owner here is the migration-applying role,
-- typically a superuser-equivalent that bypasses RLS entirely), so if this view were ever
-- reachable by authenticated/anon (via Supabase's own schema-level default privileges, which
-- can auto-grant SELECT on new relations depending on project configuration), every user could
-- read every OTHER user's aggregate analytics data through it -- a real cross-user data
-- exposure the base table's own "insert-own-rows-only" RLS policy was never designed to allow.
-- Explicitly revoked here rather than assumed safe by omission.
revoke all on public.analytics_daily_active_free_users from public, anon, authenticated;

create view public.analytics_ad_funnel_by_placement as
select
  (properties ->> 'placement') as placement,
  count(*) filter (where event_name = 'ad_eligible') as eligible_count,
  count(*) filter (where event_name = 'ad_request') as request_count,
  count(*) filter (where event_name = 'ad_loaded') as loaded_count,
  count(*) filter (where event_name = 'ad_impression') as impression_count,
  count(*) filter (where event_name = 'ad_dismissed') as dismissed_count,
  count(*) filter (where event_name = 'ad_failed') as failed_count,
  coalesce(sum((properties ->> 'estimated_revenue_micros')::bigint) filter (where event_name = 'ad_revenue_paid'), 0) as estimated_revenue_micros_total
from public.analytics_events
where event_name in ('ad_eligible', 'ad_request', 'ad_loaded', 'ad_impression', 'ad_dismissed', 'ad_failed', 'ad_revenue_paid')
group by 1;

comment on view public.analytics_ad_funnel_by_placement is
  'Ad funnel counts per placement (quiz_interstitial / explore_native / daily_interstitial, as reported in each event''s own properties.placement). estimated_revenue_micros_total sums the AdMob SDK''s own on-device revenue estimate (micros of the ad''s currency) from ad_revenue_paid events -- an ESTIMATE the SDK itself reports, not a finalized/reconciled payout figure. Never presented to the owner as confirmed revenue without that distinction.';

-- Same reasoning as analytics_daily_active_free_users above -- revoked explicitly, not
-- assumed safe by omission. This view aggregates ACROSS all users (no per-user grouping at
-- all), which would be an even more direct cross-user exposure than the per-user-row view if
-- it were ever reachable by a normal client role.
revoke all on public.analytics_ad_funnel_by_placement from public, anon, authenticated;
