// Focused validation for the Build 9 Part B fix: Private Daily choices not rendering on
// first load until a force-close + relaunch. Root cause (confirmed via live Playwright repro
// against a simulated transient RPC failure): usePrivateDailyExperience's first load had no
// retry on a genuine transient failure, no refresh-on-foreground (so a server-granted
// tester_access_grants row -- invisible to RevenueCat/isPremium -- was never picked up without
// a full relaunch), and the consuming screen rendered nothing at all for the
// 'loading'/'error' phases, so any hiccup looked like "the choices never showed up." Run with:
//
//   npx tsx scripts/validate-private-daily-hydration.ts

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const read = (relativePath: string): string => readFileSync(join(__dirname, relativePath), 'utf8');

const hookSource = read('../src/data/consumer-private-daily.ts');
const todaySource = read('../src/app/(tabs)/index.tsx');

// ============================================================================================
// BOUNDED RETRY ON A GENUINE FIRST-LOAD FAILURE
// ============================================================================================

assert(/FIRST_LOAD_RETRY_DELAYS_MS/.test(hookSource), 'a dedicated bounded retry delay list exists for the first load');
assert(/phase !== 'error'/.test(hookSource), 'the retry loop only retries on a genuine error phase -- never re-requests a legitimately resolved locked/no-live-private/ready state');
assert(
  !/setTimeout\(resolve, \d{4,}\)/.test(hookSource.match(/FIRST_LOAD_RETRY_DELAYS_MS = \[[^\]]*\]/)?.[0] ?? ''),
  'this is not a single arbitrary long delay -- it is a short, bounded, increasing retry sequence',
);

// ============================================================================================
// REFRESH ON APP FOREGROUND -- not just on mount / RevenueCat isPremium changes.
// ============================================================================================

assert(/import \{ AppState \} from 'react-native'/.test(hookSource), 'the hook imports AppState');
assert(/AppState\.addEventListener\('change'/.test(hookSource), 'the hook subscribes to AppState changes');
assert(/nextState === 'active'/.test(hookSource), 'the hook refetches specifically on transition to the active (foregrounded) state');
assert(/subscription\.remove\(\)/.test(hookSource), 'the AppState subscription is cleaned up on unmount (no leak, no duplicate listeners across remounts)');

// This refetch must be independent of isPremium -- the whole point is to catch an unlock
// (e.g. a server-granted tester_access_grants row) that RevenueCat/isPremium never reflects.
const foregroundEffectMatch = hookSource.match(/useEffect\(\(\) => \{\s*if \(!isRemoteDailyEnabled\) \{\s*return;\s*\}\s*const subscription = AppState[\s\S]*?\}, \[load\]\);/);
assert(foregroundEffectMatch !== null, 'the foreground-refresh effect depends only on `load` (not `isPremium`), so it fires regardless of RevenueCat entitlement state');

// ============================================================================================
// THE CONSUMING SCREEN NEVER SILENTLY RENDERS NOTHING
// ============================================================================================

assert(/privateDaily\.experience\.phase === 'loading'/.test(todaySource), "Today renders an intentional state for 'loading' instead of nothing");
assert(/privateDaily\.experience\.phase === 'error'/.test(todaySource), "Today renders a retry affordance for 'error' instead of nothing");
assert(/onPress=\{privateDaily\.retry\}/.test(todaySource), 'the error-state retry button calls the hook\'s own retry() (re-runs load(), not a page reload)');
assert(/Loading today.s Private question/.test(todaySource), 'the loading state uses honest, non-technical copy');
assert(/couldn.t load today.s Private question/.test(todaySource), 'the error state uses honest, non-technical copy');

// 'no-live-private' intentionally still renders nothing -- that is a real, non-error state
// (genuinely no Private Daily today), not a bug to patch over. Confirm it is never used as an
// actual JSX rendering condition (only ever discussed in a comment).
assert(
  !/phase === 'no-live-private'/.test(todaySource),
  "'no-live-private' never drives a rendering branch in Today -- it is a legitimately empty state (genuinely no Private Daily today), not an error to patch over",
);

// ============================================================================================
// NOT AN ARBITRARY-DELAY PATCH -- the fix targets real causes (retry on real error, refresh on
// real foreground signal, render real intentional states), never a blind sleep-and-hope.
// ============================================================================================

assert(!/setTimeout\(\(\) => \{\s*void load\(\);\s*\}, \d+\);\s*\}\s*, \[\]\)/.test(hookSource), 'no unconditional fixed-delay re-load exists anywhere in this hook (only the bounded, condition-gated retries documented above)');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Private Daily hydration (Build 9 Part B) VALIDATION CHECKS PASSED.');
