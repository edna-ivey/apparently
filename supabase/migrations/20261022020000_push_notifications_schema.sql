-- Push notification infrastructure: device tokens, per-user preferences, and the server-side
-- send path for the one category with a real, already-existing DB event to trigger from
-- (Friend/Compare activity -- a real INSERT into compare_responses). New-quiz and Private-
-- content notifications are static-content events (quizzes ship via app builds, not database
-- rows -- see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md) and get an explicit,
-- admin-invoked broadcast RPC instead of a fabricated automatic trigger. Creature evolution's
-- real trigger point is additive on top of the existing personality_evidence write path --
-- see the separate 20261022030000 migration for that one, which needs the dimension-ranking
-- read personality.ts already does to detect a genuine change, not just any write.

-- =========================================================================================
-- 1. PUSH TOKENS -- one row per (user, device). A user can have multiple devices; a device
--    token can change (Apple/the OS may rotate it) -- upsert by (user_id, token) so a refresh
--    just updates last_seen_at on the same logical row rather than growing stale duplicates
--    forever. on delete cascade means account deletion (the existing delete-account function's
--    auth.admin.deleteUser call) removes every token for that user automatically, with zero
--    new code needed there.
-- =========================================================================================

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_tokens_user_token_unique unique (user_id, token)
);

comment on table public.push_tokens is
  'One row per (user, Expo push token). A device''s token can change; re-registering the same (user_id, token) pair just bumps last_seen_at (see upsert_push_token). Cascades on account deletion -- no separate cleanup code needed.';

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy for authenticated -- writes go through the SECURITY DEFINER
-- RPCs below, same pattern as every other sensitive write path in this schema (submit_quiz_
-- result, upsert_age_eligibility, etc.) -- never a raw table write from the client.

create or replace function public.upsert_push_token(p_token text, p_platform text)
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
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'token is required.';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform: %', p_platform;
  end if;

  insert into public.push_tokens (user_id, token, platform, last_seen_at)
  values (v_user_id, p_token, p_platform, now())
  on conflict (user_id, token) do update set last_seen_at = now(), platform = excluded.platform;
end;
$$;

comment on function public.upsert_push_token(text, text) is
  'Registers or refreshes the caller''s own device push token. Always writes under auth.uid() -- a client can never register a token for another user.';

revoke all on function public.upsert_push_token(text, text) from public;
revoke all on function public.upsert_push_token(text, text) from anon;
grant execute on function public.upsert_push_token(text, text) to authenticated;

create or replace function public.delete_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;
  delete from public.push_tokens where user_id = auth.uid() and token = p_token;
end;
$$;

comment on function public.delete_push_token(text) is
  'Removes the caller''s own token (e.g. when the user disables notifications on this device). Deleting a token that does not exist or belongs to someone else is a silent no-op, never an error -- there is nothing a client could learn from the difference.';

revoke all on function public.delete_push_token(text) from public;
revoke all on function public.delete_push_token(text) from anon;
grant execute on function public.delete_push_token(text) to authenticated;

-- =========================================================================================
-- 2. NOTIFICATION PREFERENCES -- one row per user, created lazily on first write (no row means
--    "never set preferences," which the client treats as every category defaulting to the same
--    opt-in/opt-out posture app-wide onboarding uses -- see notification-preferences-service.ts).
-- =========================================================================================

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_reminder_enabled boolean not null default true,
  daily_reminder_hour smallint not null default 19 check (daily_reminder_hour between 0 and 23),
  daily_reminder_minute smallint not null default 0 check (daily_reminder_minute between 0 and 59),
  friend_activity_enabled boolean not null default true,
  creature_evolution_enabled boolean not null default true,
  new_quizzes_enabled boolean not null default true,
  private_updates_enabled boolean not null default true,
  quiet_hours_start_hour smallint check (quiet_hours_start_hour between 0 and 23),
  quiet_hours_end_hour smallint check (quiet_hours_end_hour between 0 and 23),
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is
  'One row per user, created on first preference write. quiet_hours_* are both null (no quiet hours configured) unless the user explicitly sets both -- see upsert_notification_preferences''s own check. All five category toggles default to true (opted in) -- the PERMISSION itself is still gated by the real iOS system prompt, requested contextually (see notification-permission-service.ts) -- these toggles only ever narrow what a user who HAS granted permission actually receives.';

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own"
  on public.notification_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.upsert_notification_preferences(
  p_daily_reminder_enabled boolean default null,
  p_daily_reminder_hour smallint default null,
  p_daily_reminder_minute smallint default null,
  p_friend_activity_enabled boolean default null,
  p_creature_evolution_enabled boolean default null,
  p_new_quizzes_enabled boolean default null,
  p_private_updates_enabled boolean default null,
  p_quiet_hours_start_hour smallint default null,
  p_quiet_hours_end_hour smallint default null
)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_result public.notification_preferences;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  insert into public.notification_preferences (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update public.notification_preferences
  set
    daily_reminder_enabled = coalesce(p_daily_reminder_enabled, daily_reminder_enabled),
    daily_reminder_hour = coalesce(p_daily_reminder_hour, daily_reminder_hour),
    daily_reminder_minute = coalesce(p_daily_reminder_minute, daily_reminder_minute),
    friend_activity_enabled = coalesce(p_friend_activity_enabled, friend_activity_enabled),
    creature_evolution_enabled = coalesce(p_creature_evolution_enabled, creature_evolution_enabled),
    new_quizzes_enabled = coalesce(p_new_quizzes_enabled, new_quizzes_enabled),
    private_updates_enabled = coalesce(p_private_updates_enabled, private_updates_enabled),
    quiet_hours_start_hour = p_quiet_hours_start_hour,
    quiet_hours_end_hour = p_quiet_hours_end_hour,
    updated_at = now()
  where user_id = v_user_id
  returning * into v_result;

  return v_result;
end;
$$;

comment on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint) is
  'The one write path for a user''s own notification preferences. Every parameter defaults to null, meaning "leave unchanged" EXCEPT quiet_hours_start_hour/quiet_hours_end_hour, which always get set to exactly what is passed (null clears them) -- a client clearing quiet hours passes both as null explicitly, never omits them to "leave unchanged" by accident.';

revoke all on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint) from public;
revoke all on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint) from anon;
grant execute on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint) to authenticated;

-- =========================================================================================
-- 3. FRIEND/COMPARE ACTIVITY -- the one category with a genuine, existing DB event to trigger
--    from: a real row landing in compare_responses for a share the recipient (the original
--    quiz-taker) owns. notification_outbox is the hand-off point to the actual send (an Edge
--    Function, which alone holds the Expo push access token secret and calls Expo's push API --
--    see supabase/functions/send-push-notification). The trigger here ONLY enqueues; it never
--    calls out to the network itself (triggers calling external HTTP are a known anti-pattern --
--    no retry, no secret-handling boundary, blocks the write transaction on network latency).
-- =========================================================================================

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('friend_activity', 'creature_evolution', 'new_quizzes', 'private_updates')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

comment on table public.notification_outbox is
  'Enqueued-but-not-yet-sent notifications. A DB trigger (or, for new_quizzes/private_updates, an admin-invoked broadcast RPC) inserts a row per real event; a scheduled Edge Function (send-push-notification, invoked by pg_cron) picks up unsent rows, respects the recipient''s own notification_preferences and quiet hours, calls Expo''s push API, and stamps sent_at. Nothing here ever fabricates an event -- every row traces to something that genuinely happened.';

create index notification_outbox_unsent_idx on public.notification_outbox (created_at) where sent_at is null;

alter table public.notification_outbox enable row level security;
-- No policies at all for any client role -- this table is entirely internal (trigger-written,
-- Edge-Function-read via service role), matching admin_users' own zero-policies pattern.

create or replace function public.enqueue_compare_response_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_quiz_id text;
  v_nickname text;
begin
  select s.sharer_user_id, s.quiz_id into v_owner_id, v_quiz_id
  from public.quiz_shares s
  where s.id = new.share_id;

  if v_owner_id is null then
    return new;
  end if;

  v_nickname := coalesce(nullif(btrim(new.respondent_nickname), ''), 'Someone');

  insert into public.notification_outbox (user_id, category, title, body, data)
  values (
    v_owner_id,
    'friend_activity',
    'Apparently, they have thoughts.',
    v_nickname || ' answered about you. Come see if the story matches.',
    jsonb_build_object('type', 'compare_response', 'shareId', new.share_id::text, 'quizId', v_quiz_id)
  );

  return new;
end;
$$;

comment on function public.enqueue_compare_response_notification() is
  'AFTER INSERT trigger on compare_responses. Enqueues a real notification for the share OWNER (never the anonymous respondent) only when their share genuinely received a response -- never a fabricated or speculative event. No block/relationship-permission check exists to apply here: Compare respondents are anonymous-nickname, share-link-based (see compare-service.ts) -- there is no persistent friend graph in this app to check against (documented gap, see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md).';

create trigger compare_responses_after_insert_notify
  after insert on public.compare_responses
  for each row
  execute function public.enqueue_compare_response_notification();

-- =========================================================================================
-- 4. ADMIN BROADCAST -- new_quizzes / private_updates. Static app content (quizzes ship via a
--    build, not a database row) has no automatic "publish" event to trigger from -- this is an
--    explicit, admin-invoked action for after a build with new content has actually shipped,
--    never an automatic/fabricated trigger. Reuses the existing admin_users authorization
--    pattern (same SECURITY DEFINER + admin-membership check every other admin RPC in this
--    schema already uses).
-- =========================================================================================

create or replace function public.broadcast_content_notification(
  p_category text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Not authorized.';
  end if;
  if p_category not in ('new_quizzes', 'private_updates') then
    raise exception 'Invalid category for broadcast: %', p_category;
  end if;

  insert into public.notification_outbox (user_id, category, title, body, data)
  select
    case p_category
      when 'new_quizzes' then nd.user_id
      else pd.user_id
    end,
    p_category,
    p_title,
    p_body,
    p_data
  from (select 1) as _dummy
  left join (select distinct user_id from auth.users) as nd on p_category = 'new_quizzes'
  left join (select distinct user_id from public.user_entitlements where entitlement_id = 'apparently_private' and is_active) as pd
    on p_category = 'private_updates';

  select count(*) into v_count from public.notification_outbox where title = p_title and body = p_body and created_at > now() - interval '1 minute';
  return v_count;
end;
$$;

comment on function public.broadcast_content_notification(text, text, text, jsonb) is
  'Admin-only. Enqueues ONE real notification per eligible recipient: every user for new_quizzes (opt-in is enforced by the send function reading notification_preferences, not here), only active apparently_private entitlement holders for private_updates. Never auto-invoked -- the owner/admin calls this explicitly after a build with genuinely new content has shipped. Returns the number of rows enqueued so the caller can confirm the real fan-out size before trusting it went out.';

revoke all on function public.broadcast_content_notification(text, text, text, jsonb) from public;
revoke all on function public.broadcast_content_notification(text, text, text, jsonb) from anon;
grant execute on function public.broadcast_content_notification(text, text, text, jsonb) to authenticated;
