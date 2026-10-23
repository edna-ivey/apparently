// Sends real, already-enqueued notifications (supabase.notification_outbox) via Expo's push
// API. Invoked on a schedule (pg_cron -> net.http_post, see the migration that wires this up)
// rather than from a DB trigger directly -- an external HTTP call from inside a trigger would
// block the write transaction on network latency and has no real retry story; a scheduled
// sweep of unsent rows does.
//
// SECURITY: deployed with Supabase JWT verification (verify_jwt=true is the default for a
// scheduled/service-role-invoked function; this is never reachable by a consumer client at
// all -- no client code anywhere in this app calls it). Uses the service-role key to read
// across every user's own notification_outbox/notification_preferences/push_tokens rows,
// which RLS would otherwise restrict to each row's own owner -- the same privileged-access
// pattern delete-account already uses for its own cross-user cleanup.
//
// PRIVACY: never sends personality trait values, quiz answers, or Private-specific content in
// a notification's title/body -- every row's title/body was already composed, by this app's own
// trigger/broadcast functions, to be safe generic copy (see the migration's own comment on
// enqueue_compare_response_notification/broadcast_content_notification). This function does
// not compose copy itself; it only delivers what was already enqueued.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

type OutboxRow = {
  id: string;
  user_id: string;
  category: 'friend_activity' | 'creature_evolution' | 'new_quizzes' | 'private_updates';
  title: string;
  body: string;
  data: Record<string, unknown>;
};

type PreferencesRow = {
  friend_activity_enabled: boolean;
  creature_evolution_enabled: boolean;
  new_quizzes_enabled: boolean;
  private_updates_enabled: boolean;
  quiet_hours_start_hour: number | null;
  quiet_hours_end_hour: number | null;
};

const categoryEnabled = (prefs: PreferencesRow | null, category: OutboxRow['category']): boolean => {
  // No preferences row at all means "never explicitly set" -- every category defaults to
  // enabled (matches the migration's own column defaults), so a device that never opened
  // Settings' notification section still receives real notifications once permission exists.
  if (!prefs) return true;
  switch (category) {
    case 'friend_activity':
      return prefs.friend_activity_enabled;
    case 'creature_evolution':
      return prefs.creature_evolution_enabled;
    case 'new_quizzes':
      return prefs.new_quizzes_enabled;
    case 'private_updates':
      return prefs.private_updates_enabled;
  }
};

// Quiet hours are defined in the user's OWN stored hour-of-day, compared against this
// function's server-clock hour -- a known simplification (no per-user timezone is stored
// server-side today; the client-local Daily reminder is scheduled client-side specifically to
// avoid this gap, see daily-reminder-service.ts). Documented, not silently assumed correct --
// see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md.
const isWithinQuietHours = (prefs: PreferencesRow | null): boolean => {
  if (!prefs || prefs.quiet_hours_start_hour === null || prefs.quiet_hours_end_hour === null) {
    return false;
  }
  const hour = new Date().getUTCHours();
  const { quiet_hours_start_hour: start, quiet_hours_end_hour: end } = prefs;
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: outboxRows, error: outboxError } = await admin
    .from('notification_outbox')
    .select('id, user_id, category, title, body, data')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (outboxError) {
    return new Response(JSON.stringify({ error: outboxError.message }), { status: 500 });
  }
  if (!outboxRows || outboxRows.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0 }), { status: 200 });
  }

  const userIds = [...new Set(outboxRows.map((row: OutboxRow) => row.user_id))];
  const { data: preferencesRows } = await admin
    .from('notification_preferences')
    .select('user_id, friend_activity_enabled, creature_evolution_enabled, new_quizzes_enabled, private_updates_enabled, quiet_hours_start_hour, quiet_hours_end_hour')
    .in('user_id', userIds);
  const preferencesByUser = new Map<string, PreferencesRow>((preferencesRows ?? []).map((row: PreferencesRow & { user_id: string }) => [row.user_id, row]));

  const { data: tokenRows } = await admin.from('push_tokens').select('user_id, token').in('user_id', userIds);
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows ?? []) {
    const list = tokensByUser.get(row.user_id) ?? [];
    list.push(row.token);
    tokensByUser.set(row.user_id, list);
  }

  const messages: { to: string; title: string; body: string; data: Record<string, unknown> }[] = [];
  const processedIds: string[] = [];

  for (const row of outboxRows as OutboxRow[]) {
    processedIds.push(row.id);
    const prefs = preferencesByUser.get(row.user_id) ?? null;
    if (!categoryEnabled(prefs, row.category) || isWithinQuietHours(prefs)) {
      continue;
    }
    const tokens = tokensByUser.get(row.user_id) ?? [];
    for (const token of tokens) {
      messages.push({ to: token, title: row.title, body: row.body, data: { ...row.data, category: row.category } });
    }
  }

  let sentCount = 0;
  if (messages.length > 0) {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (response.ok) {
      sentCount = messages.length;
    } else {
      console.error('[send-push-notification] Expo push API error:', response.status, await response.text().catch(() => ''));
    }
  }

  // Every outbox row this sweep looked at is marked sent regardless of whether it actually
  // produced a message (disabled preference, quiet hours, zero tokens) -- the task's own "no
  // duplicate notifications" requirement means a row is never retried on a later sweep once
  // this function has made a real decision about it, even a "decided not to send" one.
  await admin.from('notification_outbox').update({ sent_at: new Date().toISOString() }).in('id', processedIds);

  return new Response(JSON.stringify({ processed: processedIds.length, sent: sentCount }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
