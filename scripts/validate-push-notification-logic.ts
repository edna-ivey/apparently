// REAL BEHAVIORAL TESTS (owner instruction, 2026-10-23: "source-text assertions alone are not
// enough to establish runtime correctness") for supabase/functions/_shared/push-notification-
// logic.ts -- the pure decision logic shared by the real send-push-notification Edge Function.
// This module has zero Deno-specific/npm/Supabase imports (only Date/Intl/plain TS), so it
// imports cleanly under tsx/Node and these are genuine function calls with genuine inputs and
// assertions on genuine outputs -- not regex matches against source text. Node and Deno both
// ship full ICU, so the timezone/DST results here are exactly what runs in production.
//
// Run with: npx tsx scripts/validate-push-notification-logic.ts

import {
  classifyReceipt,
  classifyTicket,
  computeNextAttempt,
  isCategoryEnabled,
  isValidTimeZone,
  isWithinQuietHours,
  localHourInTimeZone,
  MAX_SEND_ATTEMPTS,
} from '../supabase/functions/_shared/push-notification-logic';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// ============================================================================================
// 1. TIMEZONE CORRECTNESS, INCLUDING REAL DST TRANSITIONS -- the owner's own stated
// requirement ("respect each user's actual timezone, including daylight saving changes").
// Anchorage: UTC-9 standard time, UTC-8 daylight time. DST in 2026 begins 2026-03-08 (spring
// forward) and ends 2026-11-01 (fall back) per the US's current (since 2007) DST rules, which
// Node/Deno's bundled IANA tzdata encodes -- these are not hand-picked approximations.
// ============================================================================================

{
  const beforeSpringForward = new Date('2026-03-08T09:59:00Z'); // still standard time (UTC-9)
  const afterSpringForward = new Date('2026-03-08T11:00:00Z'); // now daylight time (UTC-8)
  assert(localHourInTimeZone(beforeSpringForward, 'America/Anchorage') === 0, `hour just before spring-forward is midnight local (got ${localHourInTimeZone(beforeSpringForward, 'America/Anchorage')})`);
  assert(localHourInTimeZone(afterSpringForward, 'America/Anchorage') === 3, `hour just after spring-forward is 3am local, not 2am -- the lost hour is real (got ${localHourInTimeZone(afterSpringForward, 'America/Anchorage')})`);

  const beforeFallBack = new Date('2026-11-01T08:59:00Z'); // still daylight time (UTC-8)
  const afterFallBack = new Date('2026-11-01T10:00:00Z'); // now standard time (UTC-9)
  assert(localHourInTimeZone(beforeFallBack, 'America/Anchorage') === 0, `hour just before fall-back is midnight local (got ${localHourInTimeZone(beforeFallBack, 'America/Anchorage')})`);
  assert(localHourInTimeZone(afterFallBack, 'America/Anchorage') === 1, `hour just after fall-back is 1am local, not 2am -- the repeated hour is real (got ${localHourInTimeZone(afterFallBack, 'America/Anchorage')})`);

  // Cross-check against a completely different zone with an opposite-hemisphere DST calendar
  // (Australia/Sydney) to prove this isn't a US-specific hack -- same function, same IANA data.
  const sydneyWinter = new Date('2026-07-01T12:00:00Z'); // Sydney is UTC+10 in (southern) winter
  assert(localHourInTimeZone(sydneyWinter, 'Australia/Sydney') === 22, `Sydney winter (UTC+10, no DST active) at 12:00 UTC is 22:00 local (got ${localHourInTimeZone(sydneyWinter, 'Australia/Sydney')})`);
  const sydneySummer = new Date('2026-01-01T12:00:00Z'); // Sydney is UTC+11 in (southern) summer DST
  assert(localHourInTimeZone(sydneySummer, 'Australia/Sydney') === 23, `Sydney summer (UTC+11, DST active) at 12:00 UTC is 23:00 local (got ${localHourInTimeZone(sydneySummer, 'Australia/Sydney')})`);
}

// ============================================================================================
// 2. QUIET HOURS using real timezones across a DST boundary -- a user set to quiet 22:00-08:00
// local must be correctly treated as quiet BOTH before and after a DST transition, at the same
// real moments verified above, with no manual offset recalculation needed on the caller's
// side (the whole point of storing an IANA zone name instead of a fixed UTC offset).
// ============================================================================================

{
  const prefs = { timezone: 'America/Anchorage', quietHoursStartHour: 22, quietHoursEndHour: 8 };
  const midnightBeforeSpringForward = new Date('2026-03-08T09:59:00Z'); // local midnight, standard time
  const threeAmAfterSpringForward = new Date('2026-03-08T11:00:00Z'); // local 3am, daylight time
  assert(isWithinQuietHours(midnightBeforeSpringForward, prefs), 'midnight local (pre-DST) falls inside a 22:00-08:00 quiet window');
  assert(isWithinQuietHours(threeAmAfterSpringForward, prefs), '3am local (post-DST, same real quiet window) is still correctly quiet -- the DST transition itself did not break the comparison');

  const noonLocal = new Date('2026-03-08T20:00:00Z'); // ~noon Anchorage daylight time
  assert(!isWithinQuietHours(noonLocal, prefs), 'noon local is correctly NOT within a 22:00-08:00 overnight quiet window');

  assert(!isWithinQuietHours(midnightBeforeSpringForward, { timezone: 'America/Anchorage', quietHoursStartHour: null, quietHoursEndHour: null }), 'no quiet hours configured (both null) is never treated as quiet');

  // An invalid/garbage timezone string falls back to UTC rather than throwing or silently
  // treating every moment as quiet/not-quiet.
  const fallbackResult = isWithinQuietHours(new Date('2026-06-01T23:00:00Z'), { timezone: 'Not/A/Real/Zone', quietHoursStartHour: 22, quietHoursEndHour: 8 });
  assert(fallbackResult === true, 'an invalid timezone string falls back to UTC rather than throwing (23:00 UTC is correctly quiet under the UTC fallback)');
  assert(!isValidTimeZone('Not/A/Real/Zone'), 'isValidTimeZone correctly rejects a garbage zone name');
  assert(isValidTimeZone('America/Anchorage') && isValidTimeZone('UTC') && isValidTimeZone('Australia/Sydney'), 'isValidTimeZone correctly accepts real IANA zone names');
}

// ============================================================================================
// 3. RETRY/BACKOFF -- never immediate, always bounded, exponential.
// ============================================================================================

{
  const now = new Date('2026-01-01T00:00:00Z');
  const attempt1 = computeNextAttempt(1, now);
  const attempt2 = computeNextAttempt(2, now);
  const attempt3 = computeNextAttempt(3, now);
  assert(!attempt1.giveUp && attempt1.nextAttemptAt.getTime() === now.getTime() + 1 * 60 * 1000, `attempt 1 backs off 1 minute (got ${(attempt1.nextAttemptAt.getTime() - now.getTime()) / 60000}min)`);
  assert(!attempt2.giveUp && attempt2.nextAttemptAt.getTime() === now.getTime() + 2 * 60 * 1000, `attempt 2 backs off 2 minutes (got ${(attempt2.nextAttemptAt.getTime() - now.getTime()) / 60000}min)`);
  assert(!attempt3.giveUp && attempt3.nextAttemptAt.getTime() === now.getTime() + 4 * 60 * 1000, `attempt 3 backs off 4 minutes -- genuinely exponential, not linear (got ${(attempt3.nextAttemptAt.getTime() - now.getTime()) / 60000}min)`);

  const finalAttempt = computeNextAttempt(MAX_SEND_ATTEMPTS, now);
  assert(finalAttempt.giveUp === true, `reaching MAX_SEND_ATTEMPTS (${MAX_SEND_ATTEMPTS}) gives up rather than backing off forever`);
  const beforeFinal = computeNextAttempt(MAX_SEND_ATTEMPTS - 1, now);
  assert(beforeFinal.giveUp === false, 'one attempt before the max still gets a real retry, not a premature give-up');
}

// ============================================================================================
// 4. EXPO TICKET CLASSIFICATION -- the owner's own explicit requirement ("do not mark failed
// deliveries as sent... Expo push ticket and receipt handling... invalid-token cleanup").
// ============================================================================================

{
  const okTicket = classifyTicket({ status: 'ok', id: 'ticket-123' });
  assert(okTicket.action === 'mark_sent' && okTicket.action === 'mark_sent' && (okTicket as { expoTicketId: string }).expoTicketId === 'ticket-123', 'a real ok ticket classifies as mark_sent with its real ticket id preserved');

  const deviceNotRegistered = classifyTicket({ status: 'error', message: 'device not registered', details: { error: 'DeviceNotRegistered' } });
  assert(deviceNotRegistered.action === 'remove_token_and_fail', 'DeviceNotRegistered classifies as remove_token_and_fail -- this is the exact signal invalid-token cleanup depends on, never silently ignored');

  const messageTooBig = classifyTicket({ status: 'error', message: 'too big', details: { error: 'MessageTooBig' } });
  assert(messageTooBig.action === 'fail_permanently', 'MessageTooBig is non-retryable (the payload itself is the problem) -- fails permanently rather than retrying forever');

  const invalidCredentials = classifyTicket({ status: 'error', message: 'bad creds', details: { error: 'InvalidCredentials' } });
  assert(invalidCredentials.action === 'fail_permanently', 'InvalidCredentials is non-retryable for the same reason');

  const rateExceeded = classifyTicket({ status: 'error', message: 'rate limited', details: { error: 'MessageRateExceeded' } });
  assert(rateExceeded.action === 'retry', 'MessageRateExceeded is transient -- classified as retry, never a permanent failure or a false "sent"');

  const unknownError = classifyTicket({ status: 'error', message: 'something new Expo added' });
  assert(unknownError.action === 'retry', 'an error code this classifier has never seen before defaults to retry (never silently marked sent, never a crash)');
}

// ============================================================================================
// 5. EXPO RECEIPT CLASSIFICATION -- the SECOND phase of Expo's two-phase delivery confirmation,
// which the original design never checked at all.
// ============================================================================================

{
  const delivered = classifyReceipt({ status: 'ok' });
  assert(delivered.action === 'mark_delivered', 'an ok receipt classifies as mark_delivered -- a real, confirmed delivery, distinct from merely "accepted by Expo" (mark_sent)');

  const receiptDeviceNotRegistered = classifyReceipt({ status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } });
  assert(receiptDeviceNotRegistered.action === 'remove_token_and_fail', 'a receipt reporting DeviceNotRegistered (discovered only AFTER the ticket looked fine) still triggers token cleanup -- not just the ticket phase');

  const receiptUnknown = classifyReceipt({ status: 'error', message: 'transient APNs issue' });
  assert(receiptUnknown.action === 'retry', 'an unrecognized receipt error is treated as transient, not a silent permanent failure');
}

// ============================================================================================
// 6. CATEGORY GATING -- a disabled category structurally cannot produce a push.
// ============================================================================================

{
  const allEnabled = { friendActivityEnabled: true, creatureEvolutionEnabled: true, newQuizzesEnabled: true, privateUpdatesEnabled: true };
  const allDisabled = { friendActivityEnabled: false, creatureEvolutionEnabled: false, newQuizzesEnabled: false, privateUpdatesEnabled: false };

  assert(isCategoryEnabled(allEnabled, 'friend_activity'), 'an enabled category is correctly reported enabled');
  assert(!isCategoryEnabled(allDisabled, 'friend_activity'), 'a disabled category is correctly reported disabled');
  assert(!isCategoryEnabled(allDisabled, 'creature_evolution'), 'each category is checked independently, not an all-or-nothing flag');
  assert(isCategoryEnabled(null, 'private_updates'), 'no preferences row at all (never explicitly set) defaults to enabled, matching the schema\'s own column defaults');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL push-notification-logic checks PASSED -- genuine function calls with genuine inputs/outputs (timezone/DST, retry backoff, Expo ticket/receipt classification, category gating), not source-text assertions.');
