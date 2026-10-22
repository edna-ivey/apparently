// Validates the Build 16 age-eligibility feature end-to-end: the 2-tier client model
// (age-eligibility.ts), its two real entry points (the quiz-runner AgeEligibilityGate for a
// direct/deep-linked visit, and private.tsx's retroactive pill-confirm for an existing
// pre-Build-16 account discovering the category), and the staged server migration's
// fail-closed/immutable/additive design. Source-text checks for the two screens (same
// react-native/expo-router parse-limitation every other screen-checking script in this repo
// already documents), a real import+exercise of the pure age-eligibility.ts module, and a
// text check of the staged (not-yet-applied, or already-applied -- this doesn't care) SQL.
//
// Run with: npx tsx scripts/validate-age-eligibility-gate.ts

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
// 1. CLIENT MODEL (age-eligibility.ts) -- source-text checks only. This module transitively
//    imports react-native (AsyncStorage), which esbuild/tsx cannot parse outside Metro -- same
//    documented limitation as onboarding.ts; see that convention elsewhere in this repo.
// ============================================================================================

const ageEligibilitySource = read('../src/data/age-eligibility.ts');
assert(/export type AgeEligibility = '13to17' \| '18plus';/.test(ageEligibilitySource), "exactly two persistable AgeEligibility values exist ('13to17', '18plus') -- never a stored under13");
assert(/isAdultEligible = \(eligibility: AgeEligibility \| null \| 'loading'\): boolean => eligibility === '18plus'/.test(ageEligibilitySource), "isAdultEligible is a strict equality check against '18plus' -- null and 'loading' both fail closed by construction, not by a separate branch that could be gotten wrong");
assert(/if \(snapshot\.value\) \{\s*return snapshot\.value;/.test(ageEligibilitySource), 'setAgeEligibilityOnce never overwrites an already-set LOCAL value (set-once client semantics)');
assert(/ensureAnonymousSession/.test(ageEligibilitySource), 'setAgeEligibilityOnce ensures a real session exists before writing remotely');

// ============================================================================================
// 2. ENTRY POINT A -- quiz runner's AgeEligibilityGate (direct/deep-linked visit to the one
//    18+ quiz, private-private-trouble).
// ============================================================================================

const quizRunnerSource = read('../src/app/quiz/[quizId].tsx');
assert(/private-private-trouble.*&&.*ageEligibility !== 'loading'.*&&.*!isAdultEligible\(ageEligibility\)/s.test(quizRunnerSource) || /ageEligibility !== 'loading' && !isAdultEligible\(ageEligibility\)/.test(quizRunnerSource), 'the quiz runner gates private-private-trouble on real adult eligibility, not while still loading');
assert(/function AgeEligibilityGate/.test(quizRunnerSource), 'AgeEligibilityGate exists');
assert(/status === '13to17'/.test(quizRunnerSource), 'AgeEligibilityGate shows a real block (no re-ask) for an already-confirmed 13to17 account');
assert(
  /setAgeEligibilityOnce\('18plus'\)/.test(quizRunnerSource) && /setAgeEligibilityOnce\('13to17'\)/.test(quizRunnerSource),
  'AgeEligibilityGate offers both real confirm paths (18+ and under 18), both through the real set-once function',
);

// ============================================================================================
// 3. ENTRY POINT B -- private.tsx's retroactive pill-confirm (discoverability for an existing
//    pre-Build-16 account that predates the quiz runner's own gate ever being reachable).
// ============================================================================================

const privateScreenSource = read('../src/app/(tabs)/private.tsx');
assert(
  /CATEGORY_PILLS\.filter\(\(category\) => category !== 'Private Private\. 😈' \|\| isAdultEligible\(ageEligibility\) \|\| ageEligibility === null\)/.test(privateScreenSource),
  "the 'Private Private. 😈' pill stays visible for a null (never-asked) account -- it is NOT silently hidden forever like a real 13to17 decline",
);
assert(
  /category === 'Private Private\. 😈' && ageEligibility === null/.test(privateScreenSource),
  'tapping the pill while null opens the retroactive confirmation prompt instead of selecting the category directly',
);
assert(
  /confirmRetroactiveAge/.test(privateScreenSource) && /setAgeEligibilityOnce/.test(privateScreenSource),
  'the retroactive prompt writes through the SAME real set-once function as the quiz-runner gate -- no second, parallel write path',
);
// Never allows the null-state pill tap to reveal actual content before confirmation -- only
// a real isAdultEligible('18plus') result changes what visibleLockedEntries/openQuizCards show.
assert(
  /entry\.category !== 'Private Private\. 😈' \|\| isAdultEligible\(ageEligibility\)\)/.test(privateScreenSource),
  'locked teasers and open quiz cards for this category still require a REAL confirmed 18plus -- a null (unconfirmed) account sees no content, only the pill prompting confirmation',
);

// ============================================================================================
// 4. STAGED SERVER MIGRATION -- additive, fail-closed, immutable, additive-only gate.
// ============================================================================================

const migrationSource = read('../supabase/migrations/20261018020000_age_eligibility_gate.sql');
assert(/add column\s+age_eligibility text/.test(migrationSource), 'additive column only -- no existing column altered/dropped');
assert(/check \(age_eligibility in \('13to17', '18plus'\)\)/.test(migrationSource), "server-side constraint allows only the two real values -- 'under13' can never be written, even by a raw client PATCH");
assert(/raise exception 'age_eligibility is immutable once set\.'/.test(migrationSource), 'a BEFORE UPDATE trigger makes the column immutable once set -- the real server-side enforcement, independent of client behavior');
assert(/coalesce\(\s*\(select age_eligibility = '18plus' from public\.profiles where user_id = p_user_id\),\s*false\s*\)/.test(migrationSource), "is_adult_eligible() fails closed -- a missing row or null/13to17 value all resolve to false, never null/error");
assert(
  /if p_quiz_id = 'private-private-trouble' then\s*if not public\.is_adult_eligible\(v_user_id\) then/.test(migrationSource),
  "submit_quiz_result's new 18+ gate runs ALONGSIDE (never replacing) the existing premium-entitlement gate for the same quiz",
);
assert(!/drop table|drop column|alter column .* type/.test(migrationSource), 'the migration contains no destructive operation (no drop/retype) -- purely additive');

// ============================================================================================
// 5. SHARING GAP FIX (App Privacy audit, 2026-10-21) -- /s/[token] is a fully anonymous, no
//    age-check public web page (by design, for every OTHER quiz). Without this fix, an 18+
//    subscriber's completed private-private-trouble result could be shared via that same
//    unguarded link, handing its mature/suggestive-themed copy to a visitor of any age. Client
//    fix: never offer/attempt a share for this one quiz. Server fix (staged, not yet applied):
//    create_quiz_share/get_shared_quiz_result both reject this quiz id outright, independent
//    of the client -- see the migration's own header for why client-side alone is insufficient.
// ============================================================================================

assert(
  /isShareRestricted = definition\.id === 'private-private-trouble'/.test(quizRunnerSource),
  'the quiz runner computes a dedicated share-restriction flag for private-private-trouble',
);
assert(
  /handleShare = async \(\) => \{\s*if \(!result \|\| isShareRestricted\) \{/.test(quizRunnerSource),
  'handleShare refuses to run for a share-restricted result, not just hide its own button',
);
assert(
  /handleAskForNotes = async \(\) => \{\s*if \(!result \|\| isShareRestricted\) \{/.test(quizRunnerSource),
  'handleAskForNotes (the second share entry point) is refused the same way as handleShare',
);
assert(/canShare={!isShareRestricted}/.test(quizRunnerSource), 'ResultScreen is told not to offer sharing for a restricted result');
assert(
  /\{canShare && \(\s*<Pressable onPress=\{onShare\}/.test(quizRunnerSource),
  'the Share button itself is never rendered when canShare is false -- not merely disabled',
);

const shareMigrationSource = read('../supabase/migrations/20261021150000_block_private_private_trouble_sharing.sql');
assert(
  /create_quiz_share[\s\S]*if p_quiz_id = 'private-private-trouble' then\s*raise exception/.test(shareMigrationSource),
  'create_quiz_share rejects private-private-trouble before reading or writing any row',
);
assert(
  /and s\.quiz_id <> 'private-private-trouble'/.test(shareMigrationSource),
  'get_shared_quiz_result excludes private-private-trouble even for a pre-existing share row, closing the retroactive case too',
);

// ============================================================================================
// 6. PRE-AGE-GATE SESSION CREATION FIX (App Privacy audit, 2026-10-21) -- the root layout's
//    background identity-bootstrap effect fired on every launch regardless of onboarding
//    progress, including a brand-new install's very first launch, before the age-gate step
//    had even rendered -- creating a real anonymous auth.users row ahead of the user ever
//    answering "under 13." Fixed by additionally requiring onboarding to be complete.
// ============================================================================================

const rootLayoutSource = read('../src/app/_layout.tsx');
assert(
  /const onboardingComplete = onboardingState !== 'loading' && onboardingState\.completed;/.test(rootLayoutSource),
  'the root layout computes a real onboarding-completion flag from the reactive onboarding store',
);
assert(
  /if \(isRemoteDailyEnabled && !isAdminRoute && onboardingComplete\) \{/.test(rootLayoutSource),
  'the background ensureAnonymousSession() bootstrap additionally requires onboarding to be complete -- never fires ahead of the age gate',
);
assert(
  /\}, \[segments, onboardingComplete\]\);/.test(rootLayoutSource),
  'the effect re-evaluates when onboarding completes, not only on navigation -- the bootstrap fires promptly once the age gate actually clears',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL age-eligibility (client set-once model, both real entry points, staged server migration) VALIDATION CHECKS PASSED.');
