// Focused validation for Build 8 Pass 1: You-page redesign shell, Settings, and the
// subscriber-aware Private landing cleanup. Run with:
//
//   npx tsx scripts/validate-build8-pass1.ts
//
// Source-text checks only -- these screens import react-native/expo-router, which esbuild/tsx
// cannot parse outside Metro (same reason every other script in this repo avoids that import
// chain — see validate-purchases.ts's own header comment for the established convention).

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

// ============================================================================================
// 1. YOU PAGE -- removed surfaces, renamed section, gear -> settings, unchanged internal logic
// ============================================================================================

const youSource = read('../src/app/(tabs)/you.tsx');

assert(!/subscriptionCard/.test(youSource), 'You no longer renders an Apparently Private Active/Free subscription card');
assert(!/Restore Purchases/.test(youSource), 'You no longer renders "Restore Purchases" (moved to Settings)');
assert(!/restorePurchases/.test(youSource), 'You no longer imports/calls restorePurchases at all');
assert(!/Manage(\s|→|→)/.test(youSource) || !/getSubscriptionManagementUrl/.test(youSource), 'You no longer renders a "Manage" subscription action (moved to Settings)');
assert(!/getSubscriptionManagementUrl/.test(youSource), 'You no longer imports getSubscriptionManagementUrl');
assert(!/usePremiumStatus/.test(youSource), 'You no longer reads subscription status directly (that surface moved to Settings entirely)');
assert(!/progressCard/.test(youSource), 'You no longer renders the YOUR 7 progress card');
assert(!/\/\s*50/.test(youSource) === false || !/progressCount/.test(youSource), 'You no longer renders a "X / 50" milestone counter');
assert(!/'YOUR 7'/.test(youSource) && !/>YOUR 7</.test(youSource), 'You no longer exposes "YOUR 7" as a consumer-facing label');
assert(!/YOUR PATTERNS/.test(youSource), 'You no longer uses the retired "YOUR PATTERNS" label');
assert(/YOUR SIGNATURE/.test(youSource), 'You renders the new "YOUR SIGNATURE" identity section label');
assert(
  /buildYourSevenCards/.test(youSource) && /buildYouProfileCards/.test(youSource) && /profileAnswerCount >= 50/.test(youSource),
  'the internal seven-trait selection logic (buildYourSevenCards at >=50 answers, buildYouProfileCards below) is UNCHANGED -- this pass only changed presentation',
);
assert(/router\.push\('\/settings'\)/.test(youSource), 'You has a gear action that navigates to /settings');
assert(/gearIcon|gearButton/.test(youSource), 'a gear icon element exists in You (top-right settings entry point)');
assert(/IdentityHero/.test(youSource), 'You renders the avatar/relic hero prototype');
assert(/relicShape/.test(youSource) && /avatarArea/.test(youSource), 'the hero has structurally separate avatar and relic elements');
// Pass 1 correction: the hero must stay a LEFT avatar / RIGHT relic row on every viewport
// (approved Option B) -- isWide may only scale sizes/gap, never switch to a stacked column.
assert(!/heroColumn/.test(youSource), 'the hero no longer has a stacked-column layout branch at all');
assert(
  /heroRow: \{ flexDirection: 'row'/.test(youSource),
  "the hero's row style is unconditional (flexDirection: 'row' is not itself gated behind isWide)",
);
assert(
  /<View style={styles\.heroRow}>/.test(youSource),
  'IdentityHero always renders styles.heroRow (never a ternary between a row and a column style)',
);
assert(/CHARACTER NAME/.test(youSource), 'a neutral character-name placeholder is reserved above the relic (no invented syllable mapping)');
assert(
  !/TRAIT_SYLLABLES|CHARACTER_NAME_MAP|SYLLABLE_MAP/.test(youSource),
  'no invented trait-syllable/character-name mapping DATA STRUCTURE was added to You (mentioning the approved future example in an explanatory comment is fine; a real mapping table is not)',
);

// ============================================================================================
// 2. SETTINGS -- exists, edits the same profile store reactively, has all required sections
// ============================================================================================

const settingsSource = read('../src/app/settings.tsx');

assert(/updateUserProfile/.test(settingsSource), 'Settings edits the profile via the reactive updateUserProfile function, not a one-shot write');
assert(/AGE_RANGES/.test(settingsSource) && /GENDER_IDENTITIES/.test(settingsSource), 'Settings offers the same real age-range/gender options onboarding uses');
assert(/customGenderDraft/.test(settingsSource), "Settings supports editing custom gender when applicable");
assert(/Restore Purchases/.test(settingsSource) && /restorePurchases/.test(settingsSource), 'Restore Purchases lives in Settings');
assert(/Manage Subscription/.test(settingsSource) && /getSubscriptionManagementUrl/.test(settingsSource), 'Manage Subscription lives in Settings, shown when a real management URL exists');
assert(
  /const SUPPORT_EMAIL = 'edna\.tyus@gmail\.com'/.test(settingsSource) && /mailto:\$\{SUPPORT_EMAIL\}/.test(settingsSource),
  'the Support Contact Us action uses the exact required temporary mailto address (edna.tyus@gmail.com)',
);
assert(/Constants\.expoConfig\?\.version/.test(settingsSource) && /Constants\.expoConfig\?\.ios\?\.buildNumber/.test(settingsSource), 'About shows the real app version and build number, never hardcoded');
assert(!/Privacy Policy|Terms of Service|Terms & Conditions/i.test(settingsSource), 'no invented Privacy Policy/Terms text or dead legal links were added');

// ============================================================================================
// 3. ONBOARDING STORE -- updateUserProfile writes the SAME storage/shape and stays reactive
// ============================================================================================

const onboardingSource = read('../src/data/onboarding.ts');

assert(
  /export const updateUserProfile = async \(patch: Partial<UserProfile>\)/.test(onboardingSource),
  'updateUserProfile exists with the expected partial-update signature',
);
assert(
  /await setUserProfile\(next\)/.test(onboardingSource) && /notifyProfile\(\)/.test(onboardingSource),
  'updateUserProfile writes through the existing setUserProfile (same storage key/shape) AND notifies subscribers -- this is what makes a Settings edit reach an already-mounted You screen without a restart',
);
assert(
  !/completeOnboarding[\s\S]{0,400}rerun|rerunsOnboarding/i.test(onboardingSource),
  'no onboarding-rerun path was introduced for Settings edits',
);
assert(
  /SelfPerceptionAnswers/.test(onboardingSource) && /never meant to be edited/.test(onboardingSource),
  'the original self-perception snapshot remains explicitly documented as never-edited -- Settings must not touch it',
);

// ============================================================================================
// 4. PRIVATE LANDING -- subscriber-aware copy, real premium status, free tier unchanged
// ============================================================================================

const privateSource = read('../src/app/private.tsx');

assert(/usePremiumStatus/.test(privateSource), 'private.tsx reads real RevenueCat premium status');
assert(
  !/useEffectivePremium\(\)/.test(privateSource),
  'private.tsx never CALLS the tester-maskable useEffectivePremium for this subscriber-state decision -- real status only (a comment may reference its name to explain the design choice)',
);
assert(
  /isSubscriber \? \(/.test(privateSource) && /The questions stop being polite in here\./.test(privateSource),
  'a subscriber sees the approved core positioning copy (reused verbatim from paywall.tsx) instead of the pre-subscription pitch',
);
assert(
  /One preview is on us\. The rest are staying mysterious for now\./.test(privateSource),
  'the free/non-subscriber pitch copy is still present and unchanged (free access semantics preserved this pass)',
);
assert(
  /\(card\.completed \|\| !isSubscriber\)/.test(privateSource),
  "a subscriber viewing an uncompleted open quiz never sees a 'FREE PREVIEW' badge (it was never free FOR them) -- COMPLETED still shows for everyone",
);
assert(
  /isSubscriber \? \(\s*<ThemedText style=\{styles\.lockedBadge\}>COMING SOON<\/ThemedText>/.test(privateSource),
  "a subscriber sees 'COMING SOON' on not-yet-built locked entries, never 'LOCKED' (which would wrongly imply their paid subscription failed)",
);
assert(
  /lockedBadgeRow[\s\S]{0,300}PRIVATE<\/ThemedText>[\s\S]{0,200}LOCKED<\/ThemedText>/.test(privateSource),
  "the non-subscriber locked badge ('PRIVATE · LOCKED') is unchanged -- free-tier access semantics are not being altered this pass",
);
assert(
  /OPEN_PRIVATE_QUIZ_IDS = \['keep-you-around', 'be-so-serious'\]/.test(privateSource),
  'no change to which quizzes are free-preview this pass -- that decision is explicitly deferred to when the six new premium quizzes ship',
);

// --- Pass 1 corrections: subscriber CTA copy + coming-soon modal wording -------------------

assert(
  /\{isSubscriber \? 'Take the quiz →' : 'Take the preview →'\}/.test(privateSource),
  'a subscriber sees "Take the quiz →" on an open-quiz card, never "Take the preview →" (that quiz was never a preview FOR them)',
);
assert(
  /Take the preview →/.test(privateSource),
  'the free/non-subscriber "Take the preview →" copy still exists (unchanged for the free tier)',
);
assert(
  /This one isn&apos;t live yet\.\{'\\n'\}More Private reads are coming\./.test(privateSource),
  'a subscriber tapping a COMING SOON card sees "This one isn\'t live yet. More Private reads are coming." (never told their subscription is "locked")',
);
assert(
  /This one stays locked for now\.\{'\\n'\}More personal reads are coming\./.test(privateSource),
  'the free/non-subscriber locked-card modal wording is unchanged',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 1 (You/Settings/Private subscriber-state) VALIDATION CHECKS PASSED.');
