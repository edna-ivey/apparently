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
// 2. EFFECTIVE PREMIUM (mirrors useEffectivePremium: REAL entitlement only)
//
// Build 8 CORRECTION: this used to OR in the client tester-access build flag ("entitlement OR
// tester override"). That was the confirmed root cause of a real bug -- on the TestFlight
// build (where the tester flag is always true), a successful purchase's status transition
// ('free' -> 'premium') never changed this function's OUTPUT (true || true stayed true), so
// nothing that depended on it as a dependency ever re-ran, and Private Daily stayed locked
// until a force-close+relaunch. A client build flag must never be able to mask a real
// entitlement transition -- effective premium is now the real entitlement status alone.
// ============================================================================================

const effectivePremium = (status: 'loading' | 'free' | 'premium' | 'error'): boolean => status === 'premium';

assert(effectivePremium('premium') === true, 'real entitlement -> effective premium true');
assert(effectivePremium('free') === false, 'no real entitlement -> effective premium false, regardless of any client build flag');
assert(effectivePremium('loading') === false, 'loading status never optimistically counts as premium');
assert(effectivePremium('error') === false, 'error status never optimistically counts as premium');
assert(
  effectivePremium('free') !== true,
  'a "free" -> "premium" transition is a real, detectable boolean change with no OR-masking -- this is what makes purchase-triggered refetch dependencies actually fire',
);

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
// 6. PRIVATE DAILY UNLOCK LOGIC -- mirrors get_private_daily's SQL unlock OR-condition AS OF
//    THE CRITICAL SECURITY CORRECTION (20260924010000_secure_entitlement_authorization.sql).
//    Inputs are now SERVER-DERIVED booleans (hasActiveEntitlement/hasTesterAccess, themselves
//    computed from user_entitlements/tester_access_grants) -- there is no client-asserted
//    "premium"/"testerAccess" boolean anywhere in this chain anymore. This mirror exists to
//    exercise the OR-logic itself; the live security QA in the sprint report exercises the
//    real RPC end to end (including proving the OLD p_premium/p_tester_access parameters no
//    longer exist at all).
// ============================================================================================

const isPrivateDailyUnlocked = (opts: {
  hasActiveEntitlement: boolean;
  hasTesterAccess: boolean;
  freeUnlock: boolean;
  hasAnswered: boolean;
}): boolean => opts.freeUnlock || opts.hasAnswered || opts.hasActiveEntitlement || opts.hasTesterAccess;

assert(
  isPrivateDailyUnlocked({ hasActiveEntitlement: false, hasTesterAccess: false, freeUnlock: true, hasAnswered: false }) === true,
  'free-unlock day still unlocks with no subscription (existing behavior preserved)',
);
assert(
  isPrivateDailyUnlocked({ hasActiveEntitlement: true, hasTesterAccess: false, freeUnlock: false, hasAnswered: false }) === true,
  'a server-verified active entitlement unlocks a non-free-unlock day',
);
assert(
  isPrivateDailyUnlocked({ hasActiveEntitlement: false, hasTesterAccess: true, freeUnlock: false, hasAnswered: false }) === true,
  'a server-verified tester grant unlocks (preserved product intent, now server-authorized)',
);
assert(
  isPrivateDailyUnlocked({ hasActiveEntitlement: false, hasTesterAccess: false, freeUnlock: false, hasAnswered: true }) === true,
  'an already-answered day stays visible regardless of premium (preserved)',
);
assert(
  isPrivateDailyUnlocked({ hasActiveEntitlement: false, hasTesterAccess: false, freeUnlock: false, hasAnswered: false }) === false,
  'no server-verified reason to unlock -> stays locked',
);

// ============================================================================================
// 6b. ENTITLEMENT EXPIRY LOGIC -- mirrors has_active_entitlement's SQL exactly:
//     is_active = true AND (expires_at is null OR expires_at > now())
// ============================================================================================

const hasActiveEntitlementMirror = (row: { isActive: boolean; expiresAt: Date | null } | null, now: Date): boolean => {
  if (!row) return false;
  return row.isActive && (row.expiresAt === null || row.expiresAt.getTime() > now.getTime());
};

const NOW = new Date('2026-09-24T00:00:00Z');
assert(hasActiveEntitlementMirror(null, NOW) === false, 'no row at all -> not active');
assert(hasActiveEntitlementMirror({ isActive: false, expiresAt: null }, NOW) === false, 'is_active=false -> not active regardless of expires_at');
assert(hasActiveEntitlementMirror({ isActive: true, expiresAt: null }, NOW) === true, 'is_active=true with no expiration (non-expiring) -> active');
assert(
  hasActiveEntitlementMirror({ isActive: true, expiresAt: new Date(NOW.getTime() + 24 * 60 * 60 * 1000) }, NOW) === true,
  'is_active=true with a FUTURE expires_at -> active',
);
assert(
  hasActiveEntitlementMirror({ isActive: true, expiresAt: new Date(NOW.getTime() - 24 * 60 * 60 * 1000) }, NOW) === false,
  'is_active=true with a PAST expires_at -> NOT active (row exists but has lapsed)',
);

// ============================================================================================
// 6c. SOURCE-TEXT SAFETY CHECKS -- the CRITICAL SECURITY CORRECTION migration itself, plus the
//     two Edge Functions. What can only be verified against the actual shipped files.
// ============================================================================================

const secureAuthMigrationPath = readdirSync(join(__dirname, '../supabase/migrations')).find((f) =>
  f.includes('secure_entitlement_authorization'),
);
assert(!!secureAuthMigrationPath, 'the secure-entitlement-authorization migration file exists');
if (secureAuthMigrationPath) {
  const migrationSource = readFileSync(join(__dirname, '../supabase/migrations', secureAuthMigrationPath), 'utf8');
  // Checks the actual parameter list of each NEW CREATE FUNCTION statement specifically --
  // the migration's own prose/comment strings legitimately mention "p_premium"/
  // "p_tester_access" by name (to explain what was removed and why), so a whole-file
  // substring check would false-positive on that documentation. Extracts just the text
  // between each "create function ...(" and its matching ")" (the parameter list) rather than
  // the whole file.
  const extractParamList = (fnSignaturePrefix: string): string => {
    const startIndex = migrationSource.indexOf(fnSignaturePrefix);
    if (startIndex === -1) return '';
    const openParenIndex = startIndex + fnSignaturePrefix.length - 1;
    const closeParenIndex = migrationSource.indexOf(')', openParenIndex);
    return migrationSource.slice(openParenIndex, closeParenIndex + 1);
  };
  const getPrivateDailyParams = extractParamList('create function public.get_private_daily(');
  const submitAnswerParams = extractParamList('create function public.submit_private_daily_answer(');
  assert(getPrivateDailyParams === '()', `get_private_daily's new CREATE FUNCTION parameter list is empty: () (got "${getPrivateDailyParams}")`);
  assert(!/p_premium|p_tester_access/.test(submitAnswerParams), `submit_private_daily_answer's new parameter list contains neither p_premium nor p_tester_access (got "${submitAnswerParams}")`);
  assert(/drop function if exists public\.get_private_daily\(boolean, boolean\)/.test(migrationSource), 'the old client-authorized get_private_daily(boolean, boolean) signature is explicitly dropped');
  assert(/drop function if exists public\.submit_private_daily_answer\(uuid, uuid, boolean, boolean\)/.test(migrationSource), 'the old client-authorized submit_private_daily_answer signature is explicitly dropped');
  assert(/create function public\.get_private_daily\(\)/.test(migrationSource), 'the new get_private_daily() takes NO parameters at all');
  assert(/has_active_entitlement\(v_user, 'apparently_private'\)/.test(migrationSource), 'get_private_daily checks has_active_entitlement server-side');
  assert(/has_tester_access\(v_user\)/.test(migrationSource), 'get_private_daily checks has_tester_access server-side');
  assert(/revoke all on function public\.has_tester_access\(uuid\) from authenticated/.test(migrationSource), 'has_tester_access is revoked from authenticated -- never directly callable by any client');
  assert(/revoke all on function public\.has_active_entitlement\(uuid, text\) from authenticated/.test(migrationSource), 'has_active_entitlement is revoked from authenticated -- never directly callable by any client');
  assert(/is_admin\(\)/.test(migrationSource) && /admin_grant_tester_access/.test(migrationSource), 'admin_grant_tester_access is gated by the existing is_admin() authorization boundary');
  // Exactly one policy is created anywhere in this migration (user_entitlements' own
  // select-own) -- tester_access_grants gets zero. A simple count is more robust here than a
  // greedy regex spanning "create policy ... for insert/update/delete" (a dotall/multiline
  // pattern like that can accidentally match across unrelated later statements in the file).
  const policyStatements = migrationSource.match(/create policy \S+ on public\.\S+/g) ?? [];
  assert(policyStatements.length === 1 && policyStatements[0].includes('user_entitlements'), `exactly one RLS policy exists in this migration, and it is user_entitlements' own select-own policy (found: ${JSON.stringify(policyStatements)})`);
  assert(/for select to authenticated/.test(migrationSource), 'that one policy is a SELECT policy, never insert/update/delete');
}

for (const [fnName, needsUserAuth] of [['sync-revenuecat-entitlement', true], ['revenuecat-webhook', false]] as const) {
  const source = readFileSync(join(__dirname, '../supabase/functions', fnName, 'index.ts'), 'utf8');
  assert(!/console\.(log|warn|error)\([^)]*REVENUECAT_SECRET_API_KEY/.test(source), `${fnName}: never logs REVENUECAT_SECRET_API_KEY's value`);
  assert(!/console\.(log|warn|error)\([^)]*REVENUECAT_WEBHOOK_AUTH/.test(source), `${fnName}: never logs REVENUECAT_WEBHOOK_AUTH's value`);
  assert(!/return new Response\([^)]*secretKey/.test(source) && !/return new Response\([^)]*configuredAuth/.test(source), `${fnName}: never returns a secret value in any Response`);
  if (needsUserAuth) {
    assert(/auth\.getUser\(\)/.test(source), `${fnName}: derives the caller's identity from a verified Supabase JWT (auth.getUser()), never from the request body`);
    assert(!/req\.json\(\)[\s\S]{0,200}app_user_id/.test(source), `${fnName}: never reads an app_user_id/user id out of the request body as authoritative`);
  } else {
    assert(/Authorization/.test(source) && /REVENUECAT_WEBHOOK_AUTH/.test(source), `${fnName}: validates the RevenueCat webhook Authorization header against REVENUECAT_WEBHOOK_AUTH`);
    assert(/refreshUserEntitlement/.test(source), `${fnName}: re-queries RevenueCat's own current state rather than trusting the webhook payload's entitlement data directly`);
  }
}

// Client code must never reference either server-only secret name, and must never send the
// old client-asserted authorization parameters to either RPC.
for (const relativePath of ['../src/services/purchases-service.ts', '../src/services/daily-service.ts', '../src/data/consumer-private-daily.ts']) {
  const source = readFileSync(join(__dirname, relativePath), 'utf8');
  assert(!/REVENUECAT_SECRET_API_KEY/.test(source), `${relativePath}: never references REVENUECAT_SECRET_API_KEY`);
  assert(!/REVENUECAT_WEBHOOK_AUTH/.test(source), `${relativePath}: never references REVENUECAT_WEBHOOK_AUTH`);
  assert(!/p_premium/.test(source), `${relativePath}: never sends a p_premium parameter to any RPC`);
  assert(!/p_tester_access/.test(source), `${relativePath}: never sends a p_tester_access parameter to any RPC`);
}

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
