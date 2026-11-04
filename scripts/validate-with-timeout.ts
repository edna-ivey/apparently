// Build 23 P0 review, item 6: targeted tests for the shared bounded-wait helper every AdMob
// async step (ads-consent-service.ts, ad-interstitial-service.ts) now depends on for its own
// "always resolves" guarantee. Zero RN/React dependencies -- withTimeout itself is pure
// Promise/setTimeout, so this runs as a plain Node script, same convention as
// validate-ad-eligibility-logic.ts.
//
// Run with: npx tsx scripts/validate-with-timeout.ts

declare const process: { exit: (code: number) => void };
import { withTimeout } from '../src/services/with-timeout';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const neverResolves = <T>(): Promise<T> => new Promise<T>(() => {});

const main = async () => {
  // 1. A promise that resolves well before the timeout returns its REAL value, not 'timeout'.
  const fast = await withTimeout(sleep(10).then(() => 'real-value'), 500);
  assert(fast === 'real-value', 'a promise resolving before the timeout returns its real value');

  // 2. A promise that never resolves returns 'timeout' once the bound elapses -- this is the
  //    exact property that turns "hangs forever" into "resolves within a known bound," the
  //    whole point of this helper existing.
  const start = Date.now();
  const timedOut = await withTimeout(neverResolves<string>(), 200);
  const elapsed = Date.now() - start;
  assert(timedOut === 'timeout', 'a promise that never resolves returns the literal string "timeout"');
  assert(elapsed >= 190 && elapsed < 2000, `timeout fires close to the requested bound, not immediately and not much later (took ${elapsed}ms for a 200ms bound)`);

  // 3. A promise that REJECTS before the timeout propagates the rejection, not 'timeout' --
  //    withTimeout must never swallow a real error into a false "it timed out" signal, since
  //    every caller (ads-consent-service.ts, ad-interstitial-service.ts) distinguishes a real
  //    SDK error from a timeout for its own error_code analytics property.
  let rejected = false;
  try {
    await withTimeout(sleep(10).then(() => Promise.reject(new Error('real SDK error'))), 500);
  } catch (error) {
    rejected = true;
    assert((error as Error).message === 'real SDK error', 'a promise rejecting before the timeout propagates the real error, not a generic one');
  }
  assert(rejected, 'a promise rejecting before the timeout causes withTimeout itself to reject (never silently resolves to "timeout")');

  // 4. A promise that resolves AFTER the timeout already fired must not retroactively change
  //    what the caller already received -- Promise.race's own semantics already guarantee this
  //    (the first settlement wins), but this is exactly the property every "late CLOSED event
  //    after a timeout" scenario in ad-interstitial-service.ts depends on; worth asserting
  //    directly rather than only trusting Promise.race by reputation.
  let lateResolveValue: string | null = null;
  const late = sleep(300).then(() => {
    lateResolveValue = 'late-value';
    return 'late-value';
  });
  const raced = await withTimeout(late, 50);
  assert(raced === 'timeout', 'a promise resolving AFTER the timeout still yields "timeout" from withTimeout at the time it was awaited');
  await sleep(300); // let the late promise actually settle
  assert(lateResolveValue === 'late-value', 'the late promise itself still eventually resolves on its own (withTimeout never cancels the underlying work, only stops waiting for it)');

  console.log(`\n${failures === 0 ? 'ALL withTimeout checks PASSED.' : failures + ' withTimeout check(s) FAILED.'}`);
  if (failures > 0) process.exit(1);
};

void main();
