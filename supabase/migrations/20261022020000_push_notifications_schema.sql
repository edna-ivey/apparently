-- Push notification infrastructure: device tokens, per-user preferences, and the server-side
-- send path for the one category with a real, already-existing DB event to trigger from
-- (Friend/Compare activity -- a real INSERT into compare_responses). New-quiz and Private-
-- content notifications are static-content events (quizzes ship via app builds, not database
-- rows) and get an explicit, admin-invoked broadcast RPC instead of a fabricated automatic
-- trigger. Creature evolution's own table/RPC live in the separate 20261022030000 migration.
--
-- CORRECTED (owner security/correctness pass, 2026-10-23) from this file's original draft,
-- before anything was ever applied -- three real problems caught and fixed here:
--
-- 1. notification_preferences had no per-user TIMEZONE. quiet_hours_start_hour/end_hour were
--    plain hour-of-day integers with no timezone attached, which the send function originally
--    compared against the Edge Function's own server UTC clock -- correct for exactly one
--    timezone offset and silently wrong (by the offset, and wrong again across any DST
--    transition) for everyone else. Fixed: a real timezone column (IANA name, e.g.
--    "America/Anchorage"), validated against Postgres's own pg_timezone_names view so an
--    invalid string can never be stored, and the send function (see
--    supabase/functions/_shared/push-notification-logic.ts) now derives the real local hour
--    via Intl.DateTimeFormat with that timezone -- correct across DST automatically, for any
--    zone, because it asks the IANA timezone database itself rather than maintaining an
--    offset table.
-- 2. notification_outbox had only a nullable sent_at timestamp -- a failed Expo API call (or
--    one that never ran because the Edge Function crashed mid-batch) left a row permanently
--    unsent with no retry, AND the send function's original design marked EVERY row it looked
--    at as "sent" regardless of whether sending actually succeeded, which would have silently
--    dropped real notifications on any transient failure. Fixed: a real status/attempt/
--    backoff/claim model (status, attempt_count, next_attempt_at, claimed_at, delivery_results,
--    last_error) that distinguishes pending/claimed/sent/delivered/failed, supports Expo's
--    real two-phase ticket+receipt delivery confirmation, and lets concurrent invocations
--    safely claim disjoint batches (see claim_notification_outbox_batch below, FOR UPDATE
--    SKIP LOCKED) instead of racing on the same rows.
-- 3. enqueue_compare_response_notification's notification BODY embedded the respondent's
--    self-chosen nickname directly ("Becca answered about you...") -- visible identity
--    content in a push notification's title/body (shown on a lock screen, to anyone who can
--    see the device). Fixed: generic copy, matching the task's own original example text
--    ("Somebody answered about you. Apparently, they have thoughts.") -- the nickname is still
--    available in data (never shown by the OS notification banner itself) for the app's own
--    UI to use once opened.

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
  'One row per (user, Expo push token). A device''s token can change; re-registering the same (user_id, token) pair just bumps last_seen_at (see upsert_push_token). Cascades on account deletion -- no separate cleanup code needed. Also deleted by send-push-notification (service role, direct table access) whenever Expo reports DeviceNotRegistered for a token, via either a send ticket or a delivery receipt.';

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own"
  on public.push_tokens
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy for authenticated -- writes go through the SECURITY DEFINER
-- RPCs below (client-facing) or the Edge Function's service-role client (token cleanup only,
-- bypasses RLS by design -- the same trust boundary delete-account's admin client already uses).

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
-- 2. NOTIFICATION PREFERENCES -- one row per user, created lazily on first write. timezone is
--    a real IANA zone name (e.g. "America/Anchorage"), validated against pg_timezone_names
--    (Postgres's own, always-current timezone database) so an invalid/garbage string can
--    never be stored -- a client-side bug or a malformed value can never silently corrupt
--    quiet-hours behavior into "always true" or "always false."
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
  -- Default 'UTC' is a safe, inert fallback -- it only actually matters once quiet hours are
  -- also set (both null by default, so no quiet-hours comparison happens at all until a real
  -- timezone AND real quiet hours have both been written by a real client call).
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is
  'One row per user, created on first preference write. quiet_hours_* are both null (no quiet hours configured) unless the user explicitly sets both -- see upsert_notification_preferences''s own check. timezone is the device''s own IANA zone at last write (see notification-preferences-service.ts) -- re-sent on every preference update and on every app foreground, so a travelling user''s zone change is reflected promptly; DST within an unchanged zone needs no re-sync at all, since the send function derives the real local hour from the IANA zone at send TIME, not from a stored offset. All five category toggles default to true (opted in) -- the PERMISSION itself is still gated by the real iOS system prompt, requested contextually -- these toggles only ever narrow what a user who HAS granted permission actually receives.';

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
  p_quiet_hours_end_hour smallint default null,
  p_timezone text default null
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

  if p_timezone is not null and not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'Unknown IANA timezone: %', p_timezone;
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
    timezone = coalesce(p_timezone, timezone),
    updated_at = now()
  where user_id = v_user_id
  returning * into v_result;

  return v_result;
end;
$$;

comment on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint, text) is
  'The one write path for a user''s own notification preferences. Every parameter defaults to null, meaning "leave unchanged" EXCEPT quiet_hours_start_hour/quiet_hours_end_hour, which always get set to exactly what is passed (null clears them). timezone is validated against pg_timezone_names before being accepted -- an invalid value raises rather than silently storing garbage.';

revoke all on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint, text) from public;
revoke all on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint, text) from anon;
grant execute on function public.upsert_notification_preferences(boolean, smallint, smallint, boolean, boolean, boolean, boolean, smallint, smallint, text) to authenticated;

-- =========================================================================================
-- 3. NOTIFICATION OUTBOX -- enqueued notifications with a real delivery lifecycle: pending ->
--    claimed (an Edge Function invocation is actively working on it) -> sent (Expo accepted
--    it and returned a ticket id, awaiting a later receipt) -> delivered (the receipt
--    confirmed real delivery) or failed (permanently given up, either by error classification
--    or by exhausting retries). A DB trigger (or, for new_quizzes/private_updates, an
--    admin-invoked broadcast RPC) inserts a row per real event; the send-push-notification
--    Edge Function claims batches, calls Expo's push API, and processes tickets/receipts --
--    see that function and supabase/functions/_shared/push-notification-logic.ts for the full
--    retry/backoff/token-cleanup logic. The trigger/RPCs below ONLY enqueue; they never call
--    out to the network themselves (an external HTTP call from inside a trigger is a known
--    anti-pattern -- no retry story, no secret-handling boundary, blocks the write transaction
--    on network latency).
-- =========================================================================================

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('friend_activity', 'creature_evolution', 'new_quizzes', 'private_updates')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'sent', 'delivered', 'failed')),
  attempt_count smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  -- One entry per (token this row has ever attempted to reach): {token, ticketId, status,
  -- error}. A recipient can have multiple devices/tokens -- this row represents ONE logical
  -- notification for that user, fanned out to every token at send time, with each token's own
  -- outcome tracked independently (so a retry never re-sends to a token that already
  -- succeeded, and cleaning up ONE dead token never affects another device's real delivery).
  delivery_results jsonb not null default '[]'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  resolved_at timestamptz
);

comment on table public.notification_outbox is
  'Enqueued notifications with a real pending/claimed/sent/delivered/failed lifecycle -- see this file''s own header comment (correction item 2) for why a plain nullable sent_at was replaced with this. Nothing here ever fabricates an event -- every row traces to something that genuinely happened (a real trigger-observed DB event, or an explicit admin broadcast call).';

-- Claim queries filter on status='pending' and next_attempt_at -- this index serves exactly
-- that query shape (a partial index, since 'claimed'/'sent'/'delivered'/'failed' rows are
-- never matched by it and would just be dead weight in a non-partial index).
create index notification_outbox_claimable_idx on public.notification_outbox (next_attempt_at) where status = 'pending';
-- Receipt-check queries filter on status='sent' and sent_at -- same reasoning.
create index notification_outbox_awaiting_receipt_idx on public.notification_outbox (sent_at) where status = 'sent';

alter table public.notification_outbox enable row level security;
-- No policies at all for any client role -- this table is entirely internal (trigger-written,
-- admin-RPC-written, Edge-Function-read/written via service role), matching admin_users' own
-- zero-policies pattern. claim_notification_outbox_batch below is SECURITY DEFINER specifically
-- so it can operate regardless of RLS, but is never granted to anon/authenticated -- only the
-- Edge Function's service-role client (which bypasses grants entirely, as the schema owner)
-- ever calls it in practice.

create or replace function public.claim_notification_outbox_batch(p_batch_size integer default 100)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.notification_outbox
  set status = 'claimed', claimed_at = now()
  where id in (
    select id from public.notification_outbox
    where status = 'pending' and next_attempt_at <= now()
    order by created_at
    -- FOR UPDATE SKIP LOCKED is what makes two concurrent invocations of this function safe:
    -- each claims a DISJOINT set of rows (whichever rows are not already locked by the other's
    -- in-flight transaction), rather than either blocking on the other or claiming the same
    -- row twice. This is the standard, correct Postgres pattern for a concurrent work queue.
    limit p_batch_size
    for update skip locked
  )
  returning *;
end;
$$;

comment on function public.claim_notification_outbox_batch(integer) is
  'Atomically claims up to p_batch_size pending, due rows and marks them claimed -- safe under concurrent invocation (FOR UPDATE SKIP LOCKED). Never granted to anon/authenticated; only the send-push-notification Edge Function''s service-role client calls this in practice. A claimed row that is never resolved (the Edge Function crashes mid-batch) is recovered by release_stale_notification_claims below, never left stuck forever.';

revoke all on function public.claim_notification_outbox_batch(integer) from public;
revoke all on function public.claim_notification_outbox_batch(integer) from anon;
revoke all on function public.claim_notification_outbox_batch(integer) from authenticated;

create or replace function public.release_stale_notification_claims(p_claim_timeout_minutes integer default 5)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with released as (
    update public.notification_outbox
    set status = 'pending', claimed_at = null
    where status = 'claimed' and claimed_at < now() - (p_claim_timeout_minutes || ' minutes')::interval
    returning id
  )
  select count(*) into v_count from released;
  return v_count;
end;
$$;

comment on function public.release_stale_notification_claims(integer) is
  'Recovers any row stuck in "claimed" past the timeout -- the only way that happens is an Edge Function invocation crashing or timing out mid-batch, after claiming but before resolving a row. Called at the start of every send-push-notification invocation, before claiming a new batch, so a crashed prior run can never strand notifications indefinitely.';

revoke all on function public.release_stale_notification_claims(integer) from public;
revoke all on function public.release_stale_notification_claims(integer) from anon;
revoke all on function public.release_stale_notification_claims(integer) from authenticated;

-- =========================================================================================
-- 4. FRIEND/COMPARE ACTIVITY -- the one category with a genuine, existing DB event to trigger
--    from: a real row landing in compare_responses for a share the recipient (the original
--    quiz-taker) owns.
-- =========================================================================================

create or replace function public.enqueue_compare_response_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_quiz_id text;
begin
  select s.sharer_user_id, s.quiz_id into v_owner_id, v_quiz_id
  from public.quiz_shares s
  where s.id = new.share_id;

  if v_owner_id is null then
    return new;
  end if;

  -- Generic copy, deliberately (correction item 3 above) -- the respondent's self-chosen
  -- nickname is real content about who they are, and must never appear in the VISIBLE
  -- title/body of a push notification. It is still carried in `data` (never rendered by the
  -- OS notification banner itself) so the app's own UI can show it once actually opened.
  insert into public.notification_outbox (user_id, category, title, body, data)
  values (
    v_owner_id,
    'friend_activity',
    'Apparently, they have thoughts.',
    'Somebody answered about you. Come see if the story matches.',
    jsonb_build_object('type', 'compare_response', 'shareId', new.share_id::text, 'quizId', v_quiz_id, 'respondentNickname', new.respondent_nickname)
  );

  return new;
end;
$$;

comment on function public.enqueue_compare_response_notification() is
  'AFTER INSERT trigger on compare_responses. Enqueues a real notification for the share OWNER (never the anonymous respondent) only when their share genuinely received a response -- never a fabricated or speculative event. Notification copy is deliberately generic (no respondent nickname in the visible title/body -- see this file''s own header comment). No block/relationship-permission check exists to apply here: Compare respondents are anonymous-nickname, share-link-based (see compare-service.ts) -- there is no persistent friend graph in this app to check against (documented gap, see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md).';

create trigger compare_responses_after_insert_notify
  after insert on public.compare_responses
  for each row
  execute function public.enqueue_compare_response_notification();

-- =========================================================================================
-- 5. ADMIN BROADCAST -- new_quizzes / private_updates. Static app content (quizzes ship via a
--    build, not a database row) has no automatic "publish" event to trigger from -- this is an
--    explicit, admin-invoked action for after a build with new content has actually shipped,
--    never an automatic/fabricated trigger.
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

  -- Rewritten (correction item 7, production-readiness review) from the original draft's
  -- single dummy-row double-left-join expression -- functionally equivalent but genuinely
  -- hard to verify by inspection. A plain branch on p_category is clearer and exactly as
  -- correct: every user gets a new_quizzes broadcast; only active apparently_private
  -- entitlement holders get a private_updates one.
  if p_category = 'new_quizzes' then
    with inserted as (
      insert into public.notification_outbox (user_id, category, title, body, data)
      select id, p_category, p_title, p_body, p_data from auth.users
      returning id
    )
    select count(*) into v_count from inserted;
  else
    with inserted as (
      insert into public.notification_outbox (user_id, category, title, body, data)
      select user_id, p_category, p_title, p_body, p_data
      from public.user_entitlements
      where entitlement_id = 'apparently_private' and is_active
      returning id
    )
    select count(*) into v_count from inserted;
  end if;

  return v_count;
end;
$$;

comment on function public.broadcast_content_notification(text, text, text, jsonb) is
  'Admin-only. Enqueues ONE real notification per eligible recipient: every user for new_quizzes (opt-in is enforced by the send function reading notification_preferences, not here), only active apparently_private entitlement holders for private_updates. Never auto-invoked -- the owner/admin calls this explicitly after a build with genuinely new content has shipped. title/body are admin-authored free text, trusted the same way every other admin-only write path in this schema trusts its caller -- this function does not and cannot police the owner''s own copy. Returns the EXACT number of rows this call itself inserted (via INSERT...RETURNING, not a time-windowed re-query that could over/under-count a near-simultaneous second broadcast).';

revoke all on function public.broadcast_content_notification(text, text, text, jsonb) from public;
revoke all on function public.broadcast_content_notification(text, text, text, jsonb) from anon;
grant execute on function public.broadcast_content_notification(text, text, text, jsonb) to authenticated;
