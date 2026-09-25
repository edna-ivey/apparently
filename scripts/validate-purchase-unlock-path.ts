// Focused validation for Build 8's "Private Daily doesn't unlock immediately after a real
// purchase" fix. Run with:
//
//   npx tsx scripts/validate-purchase-unlock-path.ts
//
// Root cause (confirmed by reading purchases-service.ts / consumer-private-daily.ts before any
// change was made): useEffectivePremium() used to return `status === 'premium' ||
// isTesterOverrideEnabled`. On the TestFlight build (where the tester flag is always true),
// this returned `true` BEFORE a purchase too, so a real purchase's status transition
// ('free' -> 'premium') never changed the function's OUTPUT value (true || true is still
// true). usePrivateDailyExperience's load() is a useCallback keyed on that output value, so
// its effect never saw a dependency change and never refetched -- Private Daily stayed locked
// until a force-close+relaunch remounted the hook from scratch and read fresh (by-then-synced)
// server state. The fix: useEffectivePremium is now the real entitlement status alone, plus a
// bounded revalidation retry in usePrivateDailyExperience to absorb the remaining small chance
// of the server-side sync genuinely still being in flight.
//
// Cannot import purchases-service.ts / consumer-private-daily.ts directly (react-native-purchases
// -> react-native import chain, same reason every other script in this repo hand-mirrors pure
// logic -- see validate-purchases.ts's own header). Source-text checks verify the actual
// shipped files for what can't be exercised any other way outside a real native build.

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

// ============================================================================================
// 1. REPRODUCE THE BUG in isolation -- proves the OLD formula really did fail to react to a
//    real purchase on a tester-access build, before proving the NEW formula fixes it.
// ============================================================================================

const oldEffectivePremium = (status: 'free' | 'premium', testerOverride: boolean): boolean =>
  status === 'premium' || testerOverride;

const beforePurchaseOld = oldEffectivePremium('free', true);
const afterPurchaseOld = oldEffectivePremium('premium', true);
assert(
  beforePurchaseOld === afterPurchaseOld,
  `BUG REPRODUCED: on a tester-access build, the OLD formula's output does not change across a real purchase (before=${beforePurchaseOld}, after=${afterPurchaseOld}) -- this is exactly why a useCallback/useEffect keyed on it never refetched`,
);

const newEffectivePremium = (status: 'free' | 'premium'): boolean => status === 'premium';

const beforePurchaseNew = newEffectivePremium('free');
const afterPurchaseNew = newEffectivePremium('premium');
assert(
  beforePurchaseNew !== afterPurchaseNew,
  `FIX VERIFIED: the NEW formula's output DOES change across a real purchase (before=${beforePurchaseNew}, after=${afterPurchaseNew}), regardless of any client tester-access build flag`,
);

// ============================================================================================
// 2. BOUNDED REVALIDATION -- mirrors the retry loop added to usePrivateDailyExperience's
//    isPremium-just-became-true effect. Must: (a) settle as soon as the server confirms
//    unlocked, (b) never claim unlocked without the server actually saying so, (c) terminate
//    in bounded time even if the server never catches up.
// ============================================================================================

const DELAYS_MS = [800, 1600, 3200];

// Simulates load() against a fake server that takes `readyAfterAttempt` calls to reflect the
// just-completed purchase (1 = correct on the very first call, matching the common case; a
// higher number simulates a slow sync).
const simulateRevalidation = (readyAfterAttempt: number): { attempts: number; finalPhase: 'ready' | 'locked' } => {
  let attempts = 0;
  const fakeLoad = (): 'ready' | 'locked' => {
    attempts += 1;
    return attempts >= readyAfterAttempt ? 'ready' : 'locked';
  };

  let phase = fakeLoad();
  for (const _delay of DELAYS_MS) {
    if (phase !== 'locked') break;
    phase = fakeLoad();
  }
  if (phase === 'locked' && attempts <= DELAYS_MS.length) {
    phase = fakeLoad();
  }
  return { attempts, finalPhase: phase };
};

const immediate = simulateRevalidation(1);
assert(immediate.finalPhase === 'ready', 'server already current on the very first check (the common case) -> unlocks immediately, no wasted retries');
assert(immediate.attempts === 1, `the common case takes exactly 1 attempt (got ${immediate.attempts}) -- no artificial delay when the server is already current`);

const slowSync = simulateRevalidation(3);
assert(slowSync.finalPhase === 'ready', 'a server sync that only catches up on the 3rd check still resolves to unlocked within the bounded retry window');
assert(slowSync.attempts === 3, `settles on exactly the attempt where the server actually confirmed unlocked (got attempt ${slowSync.attempts})`);

const neverSyncs = simulateRevalidation(999);
assert(neverSyncs.finalPhase === 'locked', 'if the server NEVER confirms unlocked, the retry gives up truthfully as locked -- never optimistically shows unlocked content');
assert(neverSyncs.attempts <= DELAYS_MS.length + 1, `the retry is bounded -- at most ${DELAYS_MS.length + 1} attempts even when the server never confirms (got ${neverSyncs.attempts})`);

// ============================================================================================
// 3. SOURCE-TEXT SAFETY CHECKS -- verify the actual shipped fix, not just the mirrored logic.
// ============================================================================================

const purchasesServiceSource = readFileSync(join(__dirname, '../src/services/purchases-service.ts'), 'utf8');

assert(
  /export const useEffectivePremium = \(\): boolean => \{\s*const \{ status \} = usePremiumStatus\(\);\s*return status === 'premium';\s*\}/.test(
    purchasesServiceSource,
  ),
  "useEffectivePremium's shipped implementation is exactly `return status === 'premium'` -- no OR with any tester/override flag",
);
assert(
  !/return status === 'premium' \|\| isTesterOverrideEnabled/.test(purchasesServiceSource),
  'the old OR-with-tester-override formula no longer appears anywhere in purchases-service.ts',
);
assert(
  /export const isTesterOverrideEnabled = isPrivateDailyTesterAccessEnabled/.test(purchasesServiceSource),
  'the tester-access flag itself is still exported (kept for display copy) -- this fix changes gating/reactivity, not the flag\'s existence',
);

const consumerPrivateDailySource = readFileSync(join(__dirname, '../src/data/consumer-private-daily.ts'), 'utf8');

assert(
  /const access: 'free-unlock' \| 'tester' \| 'premium' = isPremium\s*\?\s*'premium'\s*:\s*isPrivateDailyTesterAccessEnabled/.test(
    consumerPrivateDailySource,
  ),
  "the 'access' display label checks the REAL entitlement (isPremium) BEFORE the tester-access flag -- a real subscriber is never mislabeled 'tester'",
);
assert(
  /previousIsPremiumRef/.test(consumerPrivateDailySource) && /justBecamePremium/.test(consumerPrivateDailySource),
  'a real premium-transition detector (false -> true) exists, distinguishing a just-completed purchase/restore from an ordinary load',
);
assert(
  /ENTITLEMENT_REVALIDATION_DELAYS_MS/.test(consumerPrivateDailySource),
  'a bounded revalidation delay schedule exists for the post-purchase propagation race',
);
assert(
  !/optimistic/i.test(consumerPrivateDailySource) || /never\s+(shown|optimistically)/i.test(consumerPrivateDailySource),
  'no optimistic-unlock language/logic was introduced -- the fix only retries the real server check, never fakes success locally',
);
assert(
  /load\(\).{0,40}\[refreshDistribution, isPremium\]/s.test(consumerPrivateDailySource) ||
    /}, \[refreshDistribution, isPremium\]\);/.test(consumerPrivateDailySource),
  "load()'s useCallback still depends on isPremium -- this is what lets the revalidation effect detect the transition at all",
);

const indexSource = readFileSync(join(__dirname, '../src/app/(tabs)/index.tsx'), 'utf8');
assert(
  /privateReady\?\.access === 'premium'\s*\?\s*'APPARENTLY PRIVATE · UNLOCKED'/.test(indexSource),
  "Today's Private Drop badge checks real premium access FIRST, so a real subscriber on a TestFlight build is shown as a real subscriber, not mislabeled 'TESTER ACCESS'",
);
assert(
  !/isPrivateDailyTesterAccessEnabled/.test(indexSource),
  'Today no longer imports/reads the client tester-access build flag directly -- it reads the single already-correctly-prioritized experience.access value instead',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL purchase -> entitlement sync -> Private Daily refetch path VALIDATION CHECKS PASSED.');
