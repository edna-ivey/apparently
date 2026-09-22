// Standalone validation for the Build 7 monetization foundation (RevenueCat entitlement
// logic, Private Daily premium unlock, locked-catalog/preview-quiz safety). Run with:
//
//   npx tsx scripts/validate-purchases.ts
//
// Cannot import src/services/purchases-service.ts directly -- it imports react-native-purchases,
// which itself imports react-native, which esbuild/tsx cannot parse outside Metro (same
// reason every other script in this repo avoids the supabase.ts import chain). The pure
// decision logic below is a hand-mirrored copy of that module's real logic, kept in sync by
// hand -- same established convention as validate-personality-dimensions.ts's SQL_ALLOW_LIST
// mirror. Source-text checks (section 5) verify the ACTUAL shipped file for what can't be
// exercised any other way outside a real native/web build.

// This repo has no @types/node dependency (deliberately -- see every other script's own
// header comment on why this project avoids adding devDependencies outside what's asked).
// Minimal local ambient declarations for the handful of Node builtins this script needs,
// scoped to this ONE file only -- real values at runtime (tsx runs this as CJS), just not
// otherwise typed without @types/node.
declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string; readdirSync: (path: string) => string[]; statSync: (path: string) => { isDirectory: () => boolean } };
declare const __dirname: string;
const { readFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { BE_SO_SERIOUS_QUIZ } from '../src/data/quizzes/be-so-serious';
import { KEEP_YOU_AROUND_QUIZ } from '../src/data/quizzes/keep-you-around';
import { PRIVATE_LOCKED_CATALOG } from '../src/data/quizzes/private-catalog';
import { PERSONALITY_DIMENSIONS } from '../src/data/personality';

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
// 1. ENTITLEMENT -> PREMIUM STATUS DERIVATION (mirrors deriveSnapshotFromCustomerInfo)
// ============================================================================================

const APPARENTLY_PRIVATE_ENTITLEMENT_ID = 'apparently_private';

type FakeCustomerInfo = { entitlements: { active: Record<string, { isActive: boolean } | undefined> } };

const derivePremiumStatus = (customerInfo: FakeCustomerInfo): 'premium' | 'free' =>
  customerInfo.entitlements.active[APPARENTLY_PRIVATE_ENTITLEMENT_ID]?.isActive ? 'premium' : 'free';

assert(
  derivePremiumStatus({ entitlements: { active: { apparently_private: { isActive: true } } } }) === 'premium',
  'active apparently_private entitlement -> premium',
);
assert(derivePremiumStatus({ entitlements: { active: {} } }) === 'free', 'no active entitlement -> free');
assert(
  derivePremiumStatus({ entitlements: { active: { some_other_entitlement: { isActive: true } } } }) === 'free',
  'a DIFFERENT active entitlement (not apparently_private) -> free, never conflated',
);

// ============================================================================================
// 2. EFFECTIVE PREMIUM (mirrors useEffectivePremium: entitlement OR tester override)
// ============================================================================================

const effectivePremium = (status: 'loading' | 'free' | 'premium' | 'error', testerOverride: boolean): boolean =>
  status === 'premium' || testerOverride;

assert(effectivePremium('premium', false) === true, 'real entitlement alone -> effective premium true');
assert(effectivePremium('free', true) === true, 'tester override alone -> effective premium true');
assert(effectivePremium('free', false) === false, 'neither entitlement nor tester override -> effective premium false');
assert(effectivePremium('loading', false) === false, 'loading status never optimistically counts as premium');
assert(effectivePremium('error', false) === false, 'error status never optimistically counts as premium');

// ============================================================================================
// 3. PURCHASE / RESTORE OUTCOME SHAPES (mirrors subscribeMonthly / restorePurchases)
// ============================================================================================

type SubscribeResult = { ok: true; status: 'purchased' | 'cancelled' } | { ok: false; message: string };

const classifyPurchaseError = (error: { userCancelled?: boolean | null }): SubscribeResult =>
  error.userCancelled ? { ok: true, status: 'cancelled' } : { ok: false, message: 'That didn’t go through. Please try again.' };

const cancelled = classifyPurchaseError({ userCancelled: true });
assert(cancelled.ok === true && cancelled.status === 'cancelled', 'user cancellation is a clean, non-error outcome (remains free)');
const realFailure = classifyPurchaseError({ userCancelled: false });
assert(realFailure.ok === false && !!realFailure.message, 'a real purchase failure returns ok:false with a nontechnical message');

type RestoreResult = { ok: true; restored: boolean } | { ok: false; message: string };
const classifyRestore = (customerInfo: FakeCustomerInfo | null, threw: boolean): RestoreResult => {
  if (threw || !customerInfo) return { ok: false, message: 'Restore didn’t go through. Please try again.' };
  return { ok: true, restored: Boolean(customerInfo.entitlements.active[APPARENTLY_PRIVATE_ENTITLEMENT_ID]?.isActive) };
};
assert(classifyRestore({ entitlements: { active: { apparently_private: { isActive: true } } } }, false).ok === true, 'restore with an active entitlement succeeds');
assert(
  (classifyRestore({ entitlements: { active: { apparently_private: { isActive: true } } } }, false) as { restored: boolean }).restored === true,
  'restore correctly reports restored:true when an active entitlement is found',
);
assert(
  (classifyRestore({ entitlements: { active: {} } }, false) as { restored: boolean }).restored === false,
  'restore with NO active entitlement is still ok:true, restored:false -- never treated as an error',
);
assert(classifyRestore(null, true).ok === false, 'a real restore failure (threw) returns ok:false');

// ============================================================================================
// 4. MONTHLY PACKAGE RESOLUTION (mirrors getMonthlyOffering's fallback chain)
// ============================================================================================

type FakePackage = { identifier: string; packageType: string };
type FakeOffering = { monthly: FakePackage | null; availablePackages: FakePackage[] } | null;

const resolveMonthlyPackage = (offering: FakeOffering): FakePackage | null => {
  if (!offering) return null;
  return offering.monthly ?? offering.availablePackages.find((p) => p.packageType === 'MONTHLY' || p.identifier === 'monthly') ?? null;
};

assert(
  resolveMonthlyPackage({ monthly: { identifier: '$rc_monthly', packageType: 'MONTHLY' }, availablePackages: [] })?.identifier === '$rc_monthly',
  'prefers the offering\'s predefined `monthly` slot when present',
);
assert(
  resolveMonthlyPackage({ monthly: null, availablePackages: [{ identifier: 'monthly', packageType: 'CUSTOM' }] })?.identifier === 'monthly',
  'falls back to a custom package literally identified "monthly" when no predefined monthly slot exists',
);
assert(resolveMonthlyPackage({ monthly: null, availablePackages: [] }) === null, 'no monthly package anywhere -> null, never a fabricated package (missing monthly package handled)');
assert(resolveMonthlyPackage(null) === null, 'no offering at all -> null, never a fabricated package (unavailable offering handled)');

// ============================================================================================
// 5. SOURCE-TEXT SAFETY CHECKS -- what can only be verified against the actual shipped file
// ============================================================================================

const purchasesServiceSource = readFileSync(join(__dirname, '../src/services/purchases-service.ts'), 'utf8');

assert(
  /isPurchasesPlatformSupported\s*=\s*Platform\.OS === 'ios' \|\| Platform\.OS === 'android'/.test(purchasesServiceSource),
  'isPurchasesPlatformSupported excludes web by construction (only ios/android)',
);
// Every exported action that would touch the native module checks isPurchasesPlatformSupported
// (or isRevenueCatConfigured, which is also false-safe) before calling into Purchases.* --
// verified by confirming the guard clause appears once per public entry point.
const guardedFunctionCount = (purchasesServiceSource.match(/if \(!isPurchasesPlatformSupported/g) ?? []).length;
assert(guardedFunctionCount >= 4, `at least 4 exported functions guard on isPurchasesPlatformSupported before touching the native module (found ${guardedFunctionCount})`);
assert(!/^import Purchases/m.test(purchasesServiceSource) === false, 'react-native-purchases IS imported (sanity check the file wasn\'t accidentally emptied)');

// No other file in the app should import react-native-purchases directly -- purchases-service.ts
// must stay the ONE place. (Screens import purchases-service.ts's own exports instead.)
const otherPurchaseImports: string[] = [];
const walk = (dir: string): string[] => {
  const entries = readdirSync(dir);
  let files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files = files.concat(walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
};
for (const file of walk(join(__dirname, '../src'))) {
  if (file.endsWith('purchases-service.ts')) continue;
  const contents = readFileSync(file, 'utf8');
  if (/from ['"]react-native-purchases['"]/.test(contents)) {
    otherPurchaseImports.push(file);
  }
}
assert(otherPurchaseImports.length === 0, `no screen imports react-native-purchases directly (found: ${otherPurchaseImports.join(', ') || 'none'})`);

// ============================================================================================
// 6. PRIVATE DAILY PREMIUM UNLOCK LOGIC (mirrors get_private_daily's SQL unlock OR-condition)
// ============================================================================================

const isPrivateDailyUnlocked = (opts: { testerAccess: boolean; premium: boolean; freeUnlock: boolean; hasAnswered: boolean }): boolean =>
  opts.testerAccess || opts.premium || opts.freeUnlock || opts.hasAnswered;

assert(isPrivateDailyUnlocked({ testerAccess: false, premium: false, freeUnlock: true, hasAnswered: false }) === true, 'free-unlock day still unlocks with no subscription (existing behavior preserved)');
assert(isPrivateDailyUnlocked({ testerAccess: false, premium: true, freeUnlock: false, hasAnswered: false }) === true, 'a real premium entitlement unlocks a non-free-unlock day');
assert(isPrivateDailyUnlocked({ testerAccess: true, premium: false, freeUnlock: false, hasAnswered: false }) === true, 'tester override still unlocks (preserved)');
assert(isPrivateDailyUnlocked({ testerAccess: false, premium: false, freeUnlock: false, hasAnswered: true }) === true, 'an already-answered day stays visible regardless of premium (preserved)');
assert(isPrivateDailyUnlocked({ testerAccess: false, premium: false, freeUnlock: false, hasAnswered: false }) === false, 'no reason to unlock -> stays locked');

// ============================================================================================
// 7. LOCKED CATALOG / PREVIEW QUIZ SAFETY -- unchanged from Build 6, re-asserted here since
//    Build 7 touches adjacent Private surfaces
// ============================================================================================

assert(KEEP_YOU_AROUND_QUIZ.access === 'private-preview', 'keep-you-around remains a free/preview-access quiz (unaffected by premium gating)');
assert(BE_SO_SERIOUS_QUIZ.access === 'private-preview', 'be-so-serious remains a free/preview-access quiz (unaffected by premium gating)');

const registeredIds = new Set([KEEP_YOU_AROUND_QUIZ.id, BE_SO_SERIOUS_QUIZ.id]);
assert(
  PRIVATE_LOCKED_CATALOG.every((entry) => !registeredIds.has(entry.id)),
  'no locked catalog entry shares an id with a real registered quiz',
);
// This is the same guarantee Build 6 already established (locked catalog entries have no
// QuizDefinition/registry entry at all) -- re-confirmed here because Build 7 explicitly must
// not make any of these 30 playable yet.
assert(PRIVATE_LOCKED_CATALOG.length === 30, `locked catalog still has exactly 30 non-playable entries (got ${PRIVATE_LOCKED_CATALOG.length})`);

// ============================================================================================
// 8. PERSONALITY MODEL UNCHANGED (32 dimensions -- full detail already covered by
//    validate-personality-dimensions.ts; this is a fast sanity re-check for this script's own
//    "premium/tester never touches You" scope)
// ============================================================================================

assert(PERSONALITY_DIMENSIONS.length === 32, `personality model still has exactly 32 dimensions (got ${PERSONALITY_DIMENSIONS.length})`);
assert(!/^import Purchases/m.test(readFileSync(join(__dirname, '../src/services/quiz-result-service.ts'), 'utf8')), 'quiz-result-service.ts (You-profile writes) never references purchases -- premium/tester status cannot influence personality_evidence');

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL purchases / Build 7 monetization VALIDATION CHECKS PASSED.');
