// Pure decision logic for push notification delivery -- zero Deno-specific, npm, or Supabase
// imports, only Date/Intl/plain TypeScript. This exact file is imported both by the real
// send-push-notification Edge Function (Deno, relative import -- Deno natively supports plain
// relative .ts imports) and by scripts/validate-push-notification-logic.ts (tsx/Node) for
// genuine behavioral tests of this logic, without needing a live Deno runtime or network.
// Node and Deno both ship full ICU, so the Intl.DateTimeFormat timezone math below is exactly
// what runs in production, not an approximation requiring separate verification.

// ============================================================================================
// Timezone-aware quiet hours (owner correction 2026-10-23: the original design compared a
// stored hour-of-day against the Edge Function's own server UTC clock, which is only correct
// for UTC+0 users and silently wrong -- by a fixed, DST-unaware offset -- for everyone else).
// ============================================================================================

export type QuietHoursPreferences = {
  timezone: string | null;
  quietHoursStartHour: number | null;
  quietHoursEndHour: number | null;
};

export const isValidTimeZone = (timezone: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// The real local hour-of-day (0-23) for `now` in `timezone`, derived from the IANA timezone
// database via Intl -- correctly reflects DST on both sides of any transition, for any zone,
// with no manually-maintained offset table that could go stale.
export const localHourInTimeZone = (now: Date, timezone: string): number => {
  const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: 'numeric', hour12: false }).format(now);
  // en-GB's 24-hour format can render midnight as "24" in some ICU versions -- normalize.
  const hour = Number(formatted);
  return hour === 24 ? 0 : hour;
};

export const isWithinQuietHours = (now: Date, prefs: QuietHoursPreferences): boolean => {
  if (prefs.quietHoursStartHour === null || prefs.quietHoursEndHour === null) {
    return false;
  }
  const timezone = prefs.timezone && isValidTimeZone(prefs.timezone) ? prefs.timezone : 'UTC';
  const hour = localHourInTimeZone(now, timezone);
  const { quietHoursStartHour: start, quietHoursEndHour: end } = prefs;
  // A window that doesn't cross midnight (e.g. 9-17): simple range. A window that DOES cross
  // midnight (e.g. 22-8, the common "quiet overnight" case): the complement.
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
};

// ============================================================================================
// Retry/backoff (owner correction 2026-10-23: the original design marked every row it looked
// at as "sent" regardless of whether sending actually succeeded, with no retry at all).
// ============================================================================================

export const MAX_SEND_ATTEMPTS = 5;

export type NextAttempt = { nextAttemptAt: Date; giveUp: boolean };

export const computeNextAttempt = (attemptCountAfterThisOne: number, now: Date): NextAttempt => {
  if (attemptCountAfterThisOne >= MAX_SEND_ATTEMPTS) {
    return { nextAttemptAt: now, giveUp: true };
  }
  // Exponential backoff: 1, 2, 4, 8, 16 minutes after attempts 1-5 respectively.
  const backoffMinutes = 2 ** (attemptCountAfterThisOne - 1);
  return { nextAttemptAt: new Date(now.getTime() + backoffMinutes * 60 * 1000), giveUp: false };
};

// ============================================================================================
// Expo push ticket/receipt classification (owner correction 2026-10-23: the original design
// never distinguished Expo's two-phase ticket+receipt delivery confirmation at all, and never
// cleaned up a token Expo reports as no longer registered).
// See https://docs.expo.dev/push-notifications/sending-notifications/#individual-errors and
// https://docs.expo.dev/push-notifications/sending-notifications/#response-data for the
// documented shapes and error codes this classifies.
// ============================================================================================

export type ExpoPushTicket = { status: 'ok'; id: string } | { status: 'error'; message: string; details?: { error?: string } };
export type ExpoPushReceipt = { status: 'ok' } | { status: 'error'; message: string; details?: { error?: string } };

export type DeliveryAction =
  | { action: 'mark_sent'; expoTicketId: string }
  | { action: 'mark_delivered' }
  | { action: 'remove_token_and_fail'; reason: string }
  | { action: 'fail_permanently'; reason: string }
  | { action: 'retry'; reason: string };

// Errors Expo documents as never resolving on retry -- the message/credentials/payload itself
// is the problem, not a transient condition.
const NON_RETRYABLE_ERROR_CODES = new Set(['MessageTooBig', 'InvalidCredentials']);

export const classifyTicket = (ticket: ExpoPushTicket): DeliveryAction => {
  if (ticket.status === 'ok') {
    return { action: 'mark_sent', expoTicketId: ticket.id };
  }
  const errorCode = ticket.details?.error;
  if (errorCode === 'DeviceNotRegistered') {
    return { action: 'remove_token_and_fail', reason: ticket.message };
  }
  if (errorCode && NON_RETRYABLE_ERROR_CODES.has(errorCode)) {
    return { action: 'fail_permanently', reason: ticket.message };
  }
  // MessageRateExceeded and any error code this classifier doesn't specifically recognize are
  // both treated as transient -- retry with backoff rather than silently dropping a
  // notification over an error this app has never seen before.
  return { action: 'retry', reason: ticket.message };
};

export const classifyReceipt = (receipt: ExpoPushReceipt): DeliveryAction => {
  if (receipt.status === 'ok') {
    return { action: 'mark_delivered' };
  }
  const errorCode = receipt.details?.error;
  if (errorCode === 'DeviceNotRegistered') {
    return { action: 'remove_token_and_fail', reason: receipt.message };
  }
  if (errorCode && NON_RETRYABLE_ERROR_CODES.has(errorCode)) {
    return { action: 'fail_permanently', reason: receipt.message };
  }
  return { action: 'retry', reason: receipt.message };
};

// ============================================================================================
// Category/preference gating -- whether a given enqueued row's category is currently enabled
// for its recipient. No preferences row at all means "never explicitly set," which defaults to
// enabled (matches notification_preferences' own column defaults).
// ============================================================================================

export type NotificationCategory = 'friend_activity' | 'creature_evolution' | 'new_quizzes' | 'private_updates';

export type CategoryPreferences = {
  friendActivityEnabled: boolean;
  creatureEvolutionEnabled: boolean;
  newQuizzesEnabled: boolean;
  privateUpdatesEnabled: boolean;
};

export const isCategoryEnabled = (prefs: CategoryPreferences | null, category: NotificationCategory): boolean => {
  if (!prefs) return true;
  switch (category) {
    case 'friend_activity':
      return prefs.friendActivityEnabled;
    case 'creature_evolution':
      return prefs.creatureEvolutionEnabled;
    case 'new_quizzes':
      return prefs.newQuizzesEnabled;
    case 'private_updates':
      return prefs.privateUpdatesEnabled;
  }
};
