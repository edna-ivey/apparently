// Focused validation for Build 8 Pass 2: Private becoming the locked-center primary tab
// (Today / Explore / Private / Compare / You), and the /private route migration that made it
// possible. Run with:
//
//   npx tsx scripts/validate-build8-pass2-navigation.ts
//
// Source-text checks only -- these files import react-native/expo-router, which esbuild/tsx
// cannot parse outside Metro (same established convention as every other script in this repo).

declare const require: (id: string) => {
  readFileSync: (path: string, encoding: string) => string;
  existsSync: (path: string) => boolean;
};
declare const __dirname: string;
const { readFileSync, existsSync } = require('fs');
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
const exists = (relativePath: string): boolean => existsSync(join(__dirname, relativePath));

// ============================================================================================
// 1. ROUTE MIGRATION -- proves the /private collision this pass fixed is actually fixed:
//    exactly ONE file can now resolve the pathless /private URL, and it lives inside (tabs).
// ============================================================================================

assert(
  !exists('../src/app/private.tsx'),
  'the old top-level src/app/private.tsx no longer exists -- it would otherwise shadow the (tabs)-group version at the same pathless /private URL (proven via a real `expo export` during this migration: both files DID coexist and export as distinct static routes without erroring, but the top-level file silently won the canonical /private path, leaving the tabs-group version dead/unreachable)',
);
assert(exists('../src/app/(tabs)/private.tsx'), 'src/app/(tabs)/private.tsx exists -- Private now lives inside the tab group');

const privateTabSource = read('../src/app/(tabs)/private.tsx');
assert(!/router\.back\(\)/.test(privateTabSource), 'the tab-hosted Private screen has no router.back() modal-dismiss affordance (a persistent tab has no "close" action, matching every sibling tab)');
assert(!/accessibilityLabel="Close"/.test(privateTabSource), 'no leftover "Close" button accessibility label');
assert(/useResponsiveTopInset/.test(privateTabSource), 'Private clears the floating web nav the same way every sibling tab does (useResponsiveTopInset), not a fixed modal-style padding');
assert(/BottomTabInset/.test(privateTabSource), 'Private reserves the native bottom tab bar the same way every sibling tab does (BottomTabInset)');

// ============================================================================================
// 2. EXACTLY FIVE TABS, CORRECT ORDER, PRIVATE CENTERED, NO CONDITIONAL HIDING, NO SETTINGS TAB
// ============================================================================================

const nativeTabsSource = read('../src/components/app-tabs.tsx');
const webTabsSource = read('../src/components/app-tabs.web.tsx');

const extractNativeTriggerOrder = (source: string): string[] =>
  [...source.matchAll(/<NativeTabs\.Trigger name="([a-z]+)">/g)].map((m) => m[1]);
const extractWebTriggerOrder = (source: string): string[] =>
  [...source.matchAll(/<TabTrigger name="([a-z]+)"/g)].map((m) => m[1]);

const nativeOrder = extractNativeTriggerOrder(nativeTabsSource);
const webOrder = extractWebTriggerOrder(webTabsSource);
const LOCKED_ORDER = ['index', 'explore', 'private', 'compare', 'you'];

assert(nativeOrder.length === 5, `native tab bar registers exactly 5 tabs (got ${nativeOrder.length}: ${JSON.stringify(nativeOrder)})`);
assert(JSON.stringify(nativeOrder) === JSON.stringify(LOCKED_ORDER), `native tab order is Today/Explore/Private/Compare/You (got ${JSON.stringify(nativeOrder)})`);
assert(nativeOrder[2] === 'private', 'native: Private occupies the CENTER position (index 2 of 5)');

assert(webOrder.length === 5, `web tab bar registers exactly 5 tabs (got ${webOrder.length}: ${JSON.stringify(webOrder)})`);
assert(JSON.stringify(webOrder) === JSON.stringify(LOCKED_ORDER), `web tab order is Today/Explore/Private/Compare/You (got ${JSON.stringify(webOrder)})`);
assert(webOrder[2] === 'private', 'web: Private occupies the CENTER position (index 2 of 5)');

assert(!/name="settings"/.test(nativeTabsSource) && !/name="settings"/.test(webTabsSource), 'Settings is registered as a tab nowhere -- it stays reachable only via the gear on You');

// No conditional hiding: the Private trigger must not be wrapped in any premium/subscriber
// check in either tab bar file (same navigation for free users and subscribers).
assert(
  !/isSubscriber|isPremium|premium\.status|useEffectivePremium|usePremiumStatus/.test(nativeTabsSource),
  'the native tab bar never references premium/subscriber state -- Private is never conditionally hidden',
);
assert(
  !/isSubscriber|isPremium|premium\.status|useEffectivePremium|usePremiumStatus/.test(webTabsSource),
  'the web tab bar never references premium/subscriber state -- Private is never conditionally hidden',
);

// ============================================================================================
// 3. EXISTING /private CALL SITES PRESERVED UNCHANGED (the actual backwards-compatibility proof)
// ============================================================================================

const exploreSource = read('../src/app/(tabs)/explore.tsx');
const todaySource = read('../src/app/(tabs)/index.tsx');
const quizRunnerSource = read('../src/app/quiz/[quizId].tsx');

assert(/router\.push\('\/private'\)/.test(exploreSource), "Explore's private portal still calls router.push('/private') unchanged");
assert(/router\.push\('\/private'\)/.test(todaySource), "Today's Private Drop card still calls router.push('/private') unchanged");
assert(/onBackToPrivate=\{\(\) => router\.push\('\/private'\)\}/.test(quizRunnerSource), "the quiz runner's onBackToPrivate still calls router.push('/private') unchanged");

// ============================================================================================
// 4. UNIVERSAL LINKS / AASA UNTOUCHED BY THIS MIGRATION
// ============================================================================================

const aasaWellKnown = JSON.parse(read('../public/.well-known/apple-app-site-association'));
const aasaRoot = JSON.parse(read('../public/apple-app-site-association'));
assert(
  JSON.stringify(aasaWellKnown.applinks.details[0].paths) === JSON.stringify(['/s/*']) &&
    JSON.stringify(aasaRoot.applinks.details[0].paths) === JSON.stringify(['/s/*']),
  'AASA still only allows /s/* -- this navigation migration never touched Universal Links scope',
);
const vercelConfig = JSON.parse(read('../vercel.json'));
assert(
  !JSON.stringify(vercelConfig).includes('/private'),
  'vercel.json has no /private-specific rewrite/redirect -- the plain file-based route continues to resolve on its own, same as every other non-bracketed route',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 2 (Private primary tab navigation) VALIDATION CHECKS PASSED.');
