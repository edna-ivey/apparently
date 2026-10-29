// Sends real, already-enqueued notifications (notification_outbox) via Expo's push API, with
// a genuine pending/claimed/sent/delivered/failed lifecycle. Invoked on a schedule (pg_cron ->
// net.http_post, see the migration that wires this up) rather than from a DB trigger directly.
//
// CORRECTED (owner security/correctness pass, 2026-10-23) from this file's original draft,
// before anything was ever applied -- see supabase/migrations/20261022020000_push_notifications
// _schema.sql's own header comment for the full list of what was wrong and why. In short: the
// original version marked EVERY row it looked at as sent regardless of whether sending
// actually succeeded, never checked Expo's delivery receipts, never cleaned up a token Expo
// reports as dead, and had no retry/backoff or concurrency-safe claiming at all. All of that
// is fixed here.
//
// SECURITY: uses the service-role key to read/write across every user's own notification_
// outbox/notification_preferences/push_tokens rows, which RLS would otherwise restrict to
// each row's own owner -- the same privileged-access pattern delete-account already uses for
// its own cross-user cleanup. Never reachable by a consumer client (no client code anywhere
// in this app calls it; it is invoked only by the pg_cron job).
//
// PRIVACY: never sends personality trait values, quiz answers, or Private-specific content in
// a notification's title/body -- every row's title/body was already composed, by this app's
// own trigger/broadcast functions, to be safe generic copy. This function does not compose
// copy itself; it only delivers what was already enqueued.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  classifyReceipt,
  classifyTicket,
  computeNextAttempt,
  isCategoryEnabled,
  isWithinQuietHours,
  type CategoryPreferences,
  type DeliveryAction,
  type ExpoPushReceipt,
  type ExpoPushTicket,
  type NotificationCategory,
} from '../_shared/push-notification-logic.ts';

const EXPO_PUSH_SEND_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const SEND_BATCH_SIZE = 100;
const RECEIPT_CHECK_BATCH_SIZE = 200;
// Expo recommends waiting before checking receipts -- sending them immediately after the
// ticket is often too soon for Apple/Google to have reported back yet.
const RECEIPT_CHECK_MIN_AGE_MINUTES = 2;
// If a receipt genuinely never arrives (Expo-side issue, or this cron job being paused for a
// long stretch), give up rather than checking forever -- resolved with whatever partial
// delivery_results already exist at that point.
const RECEIPT_CHECK_MAX_AGE_HOURS = 24;

// 'pending' is distinct from 'failed' -- a token classified 'retry' stays 'pending' (eligible
// to be re-attempted on the row's next send pass) and must never be confused with a genuinely
// permanent 'failed' outcome (DeviceNotRegistered, MessageTooBig, etc.), even though both
// currently happen to be excluded from the SAME "already resolved, skip on retry" filter
// (which only excludes 'sent'/'delivered'). Keeping them distinct avoids silently relying on
// that coincidence and keeps delivery_results an honest, inspectable record.
type DeliveryResult = { token: string; tokenId: string; ticketId: string | null; status: 'pending' | 'sent' | 'delivered' | 'failed'; error: string | null };

type OutboxRow = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data: Record<string, unknown>;
  attempt_count: number;
  delivery_results: DeliveryResult[];
};

type PreferencesRow = CategoryPreferences & { timezone: string | null; quiet_hours_start_hour: number | null; quiet_hours_end_hour: number | null };

const applyAction = (result: DeliveryResult, action: DeliveryAction): DeliveryResult => {
  switch (action.action) {
    case 'mark_sent':
      return { ...result, ticketId: action.expoTicketId, status: 'sent', error: null };
    case 'mark_delivered':
      return { ...result, status: 'delivered', error: null };
    case 'remove_token_and_fail':
    case 'fail_permanently':
      return { ...result, status: 'failed', error: action.reason };
    case 'retry':
      // Whether the ROW as a whole retries (vs. gives up after exhausting attempts) is a
      // row-level decision made by the caller -- see runSendPhase's anyRetryable branch. At
      // the per-token level, 'retry' simply means this token's own attempt stays 'pending'
      // (eligible to be re-sent on the row's next attempt), never 'failed'.
      return { ...result, status: 'pending', error: action.reason };
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Recover anything stuck in 'claimed' from a prior invocation that crashed/timed out
  // mid-batch, BEFORE claiming a new one -- otherwise those rows would never be retried.
  await admin.rpc('release_stale_notification_claims', { p_claim_timeout_minutes: 5 });

  const sendResult = await runSendPhase(admin);
  const receiptResult = await runReceiptPhase(admin);

  return new Response(JSON.stringify({ send: sendResult, receipts: receiptResult }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

async function runSendPhase(admin: ReturnType<typeof createClient>) {
  // claim_notification_outbox_batch is the ONE atomic operation (FOR UPDATE SKIP LOCKED) that
  // makes concurrent invocations of this function safe -- two overlapping cron runs (or a
  // manual + scheduled run colliding) each claim a DISJOINT set of rows, never the same row
  // twice. Everything after this point operates only on rows THIS invocation now owns.
  const { data: claimedRows, error: claimError } = await admin.rpc('claim_notification_outbox_batch', { p_batch_size: SEND_BATCH_SIZE });
  if (claimError) {
    return { error: claimError.message };
  }
  const rows = (claimedRows ?? []) as OutboxRow[];
  if (rows.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, retried: 0 };
  }

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: preferencesRows } = await admin
    .from('notification_preferences')
    .select('user_id, friend_activity_enabled, creature_evolution_enabled, new_quizzes_enabled, private_updates_enabled, quiet_hours_start_hour, quiet_hours_end_hour, timezone')
    .in('user_id', userIds);
  const preferencesByUser = new Map<string, PreferencesRow>(
    (preferencesRows ?? []).map((row: PreferencesRow & { user_id: string }) => [
      row.user_id,
      {
        friendActivityEnabled: row.friend_activity_enabled,
        creatureEvolutionEnabled: row.creature_evolution_enabled,
        newQuizzesEnabled: row.new_quizzes_enabled,
        privateUpdatesEnabled: row.private_updates_enabled,
        timezone: row.timezone,
        quiet_hours_start_hour: row.quiet_hours_start_hour,
        quiet_hours_end_hour: row.quiet_hours_end_hour,
      },
    ]),
  );

  const { data: tokenRows } = await admin.from('push_tokens').select('id, user_id, token').in('user_id', userIds);
  const tokensByUser = new Map<string, { id: string; token: string }[]>();
  for (const row of tokenRows ?? []) {
    const list = tokensByUser.get(row.user_id) ?? [];
    list.push({ id: row.id, token: row.token });
    tokensByUser.set(row.user_id, list);
  }

  let sentCount = 0;
  let failedCount = 0;
  let retriedCount = 0;
  const now = new Date();

  for (const row of rows) {
    const prefs = preferencesByUser.get(row.user_id) ?? null;

    if (!isCategoryEnabled(prefs, row.category)) {
      await admin.from('notification_outbox').update({ status: 'failed', last_error: 'category disabled by recipient preference', resolved_at: now.toISOString() }).eq('id', row.id);
      failedCount += 1;
      continue;
    }

    if (prefs && isWithinQuietHours(now, prefs)) {
      // A TEMPORARY condition, not a failure -- release the claim and retry soon (quiet hours
      // end eventually); never counted toward attempt_count, since nothing was actually
      // attempted.
      await admin.from('notification_outbox').update({ status: 'pending', claimed_at: null, next_attempt_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString() }).eq('id', row.id);
      continue;
    }

    const tokens = tokensByUser.get(row.user_id) ?? [];
    const alreadyResolvedTokenIds = new Set(row.delivery_results.filter((r) => r.status === 'sent' || r.status === 'delivered').map((r) => r.tokenId));
    const tokensToSend = tokens.filter((t) => !alreadyResolvedTokenIds.has(t.id));

    if (tokens.length === 0) {
      await admin.from('notification_outbox').update({ status: 'failed', last_error: 'no registered devices for this account', resolved_at: now.toISOString() }).eq('id', row.id);
      failedCount += 1;
      continue;
    }

    if (tokensToSend.length === 0) {
      // Defensive fallback -- by construction this row should never have been re-claimed in
      // this state (a row only returns to 'pending' when NO token has yet succeeded, so
      // alreadyResolvedTokenIds should be empty whenever a row reaches this phase at all).
      // If it ever is reached anyway, the honest, safe response is "every known token already
      // has a resolved outcome -- mark the row sent (never silently drop it, never re-send to
      // a token that already received it)," not a guess about whether sent_at was set before.
      await admin.from('notification_outbox').update({ status: 'sent', sent_at: now.toISOString() }).eq('id', row.id);
      sentCount += 1;
      continue;
    }

    const messages = tokensToSend.map((t) => ({ to: t.token, title: row.title, body: row.body, data: { ...row.data, category: row.category, outboxId: row.id } }));

    let tickets: ExpoPushTicket[] = [];
    try {
      const response = await fetch(EXPO_PUSH_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      const body = (await response.json().catch(() => null)) as { data?: ExpoPushTicket[] } | null;
      tickets = body?.data ?? tokensToSend.map(() => ({ status: 'error', message: `Unexpected Expo response (HTTP ${response.status})` }) as ExpoPushTicket);
    } catch (error) {
      tickets = tokensToSend.map(() => ({ status: 'error', message: error instanceof Error ? error.message : 'Network error calling Expo push API' }) as ExpoPushTicket);
    }

    const updatedResults: DeliveryResult[] = [...row.delivery_results.filter((r) => alreadyResolvedTokenIds.has(r.tokenId))];
    let anyRetryable = false;

    for (let i = 0; i < tokensToSend.length; i += 1) {
      const token = tokensToSend[i];
      const ticket = tickets[i];
      const action = classifyTicket(ticket);
      const base: DeliveryResult = { token: token.token, tokenId: token.id, ticketId: null, status: 'pending', error: null };
      const next = applyAction(base, action);
      updatedResults.push(next);

      if (action.action === 'retry') anyRetryable = true;
      if (action.action === 'remove_token_and_fail') {
        await admin.from('push_tokens').delete().eq('id', token.id);
      }
    }

    const anyEverSent = updatedResults.some((r) => r.status === 'sent' || r.status === 'delivered');

    if (anyEverSent) {
      await admin.from('notification_outbox').update({ status: 'sent', delivery_results: updatedResults, sent_at: now.toISOString() }).eq('id', row.id);
      sentCount += 1;
    } else if (anyRetryable) {
      const nextAttemptCount = row.attempt_count + 1;
      const { nextAttemptAt, giveUp } = computeNextAttempt(nextAttemptCount, now);
      if (giveUp) {
        await admin
          .from('notification_outbox')
          .update({ status: 'failed', delivery_results: updatedResults, attempt_count: nextAttemptCount, last_error: 'exhausted retry attempts', resolved_at: now.toISOString() })
          .eq('id', row.id);
        failedCount += 1;
      } else {
        await admin
          .from('notification_outbox')
          .update({ status: 'pending', claimed_at: null, delivery_results: updatedResults, attempt_count: nextAttemptCount, next_attempt_at: nextAttemptAt.toISOString() })
          .eq('id', row.id);
        retriedCount += 1;
      }
    } else {
      // Every token failed permanently (DeviceNotRegistered/non-retryable) and none were ever
      // sent -- this is a genuine, final failure, never marked sent.
      await admin.from('notification_outbox').update({ status: 'failed', delivery_results: updatedResults, last_error: 'all tokens failed permanently', resolved_at: now.toISOString() }).eq('id', row.id);
      failedCount += 1;
    }
  }

  return { claimed: rows.length, sent: sentCount, failed: failedCount, retried: retriedCount };
}

async function runReceiptPhase(admin: ReturnType<typeof createClient>) {
  const now = new Date();
  const maxSentAt = new Date(now.getTime() - RECEIPT_CHECK_MIN_AGE_MINUTES * 60 * 1000).toISOString();

  const { data: sentRows, error } = await admin
    .from('notification_outbox')
    .select('id, sent_at, delivery_results')
    .eq('status', 'sent')
    .lte('sent_at', maxSentAt)
    .limit(RECEIPT_CHECK_BATCH_SIZE);

  if (error) {
    return { error: error.message };
  }
  const rows = (sentRows ?? []) as { id: string; sent_at: string; delivery_results: DeliveryResult[] }[];
  if (rows.length === 0) {
    return { checked: 0, delivered: 0, failed: 0, stillPending: 0 };
  }

  // Collect every (row, ticketId) pair awaiting a receipt, across all claimed rows, into ONE
  // batched getReceipts call -- Expo's receipt API accepts a batch of ids.
  const pending: { rowId: string; tokenId: string; ticketId: string }[] = [];
  for (const row of rows) {
    for (const result of row.delivery_results) {
      if (result.status === 'sent' && result.ticketId) {
        pending.push({ rowId: row.id, tokenId: result.tokenId, ticketId: result.ticketId });
      }
    }
  }
  if (pending.length === 0) {
    return { checked: rows.length, delivered: 0, failed: 0, stillPending: 0 };
  }

  let receiptsById: Record<string, ExpoPushReceipt> = {};
  try {
    const response = await fetch(EXPO_PUSH_RECEIPTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ids: pending.map((p) => p.ticketId) }),
    });
    const body = (await response.json().catch(() => null)) as { data?: Record<string, ExpoPushReceipt> } | null;
    receiptsById = body?.data ?? {};
  } catch {
    // Network failure -- every row stays 'sent' and gets checked again on a later invocation.
    return { checked: rows.length, delivered: 0, failed: 0, stillPending: rows.length, error: 'network error calling Expo receipts API' };
  }

  let delivered = 0;
  let failed = 0;
  let stillPending = 0;

  for (const row of rows) {
    const updatedResults: DeliveryResult[] = [];
    let anyUnresolved = false;

    for (const result of row.delivery_results) {
      if (result.status !== 'sent' || !result.ticketId) {
        updatedResults.push(result);
        continue;
      }
      const receipt = receiptsById[result.ticketId];
      if (!receipt) {
        // Expo hasn't reported back yet -- leave as 'sent' for a later pass.
        updatedResults.push(result);
        anyUnresolved = true;
        continue;
      }
      const action = classifyReceipt(receipt);
      updatedResults.push(applyAction(result, action));
      if (action.action === 'remove_token_and_fail') {
        await admin.from('push_tokens').delete().eq('id', result.tokenId);
      }
      if (action.action === 'retry') {
        anyUnresolved = true;
      }
    }

    const rowAgeMs = now.getTime() - new Date(row.sent_at).getTime();
    const pastMaxAge = rowAgeMs > RECEIPT_CHECK_MAX_AGE_HOURS * 60 * 60 * 1000;

    if (anyUnresolved && !pastMaxAge) {
      await admin.from('notification_outbox').update({ delivery_results: updatedResults }).eq('id', row.id);
      stillPending += 1;
      continue;
    }

    const anyDelivered = updatedResults.some((r) => r.status === 'delivered');
    await admin
      .from('notification_outbox')
      .update({
        status: anyDelivered ? 'delivered' : 'failed',
        delivery_results: updatedResults,
        last_error: anyDelivered ? null : pastMaxAge ? 'receipt never resolved within the max wait window' : 'no delivery receipt succeeded',
        resolved_at: now.toISOString(),
      })
      .eq('id', row.id);
    if (anyDelivered) delivered += 1;
    else failed += 1;
  }

  return { checked: rows.length, delivered, failed, stillPending };
}
