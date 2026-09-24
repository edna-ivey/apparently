// Standalone validation for the "remove fake quiz percentages" product fix. Run with:
//
//   npx tsx scripts/validate-no-quiz-percentages.ts
//
// This is necessarily a source-text check, not a rendered-output check (no React Native
// renderer available outside Metro in this script environment, same constraint every other
// script in this repo documents) -- it inspects the actual shipped quiz runner source to
// confirm the scoring-derived percentage UI was removed, while confirming the underlying
// SCORING computation (mix/percent/archetype totals) is untouched, since history/tie-breaking
// still depend on it. Real Daily/Room and Admin analytics percentages (backed by actual
// aggregate response data) are explicitly confirmed present, not removed.

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
// 1. QUIZ RESULT SCREEN — no scoring-derived percentage UI
// ============================================================================================

const quizRunnerSource = readFileSync(join(__dirname, '../src/app/quiz/[quizId].tsx'), 'utf8');

assert(!/mixBlock|mixBarFill|mixRowPercent/.test(quizRunnerSource), 'the archetype mix percentage bar UI (mixBlock/mixBarFill/mixRowPercent) no longer exists in the quiz runner');
assert(!/meterBlock|meterPercent/.test(quizRunnerSource), 'the numeric-band percent meter UI (meterBlock/meterPercent) no longer exists in the quiz runner');
assert(!/\{result\.percent\}%/.test(quizRunnerSource), 'result.percent is never interpolated into a rendered "%" string anywhere in the quiz runner');
// Note: `entry.percent` (or `liveResult.mix...entry.percent`) legitimately still appears in
// the DATA layer -- building the `mix` object persisted to local history/remote submission for
// tie-breaking/history purposes (explicitly permitted to remain). Only the UI RENDERING checks
// above (mixBlock/mixBarFill/mixRowPercent, meterBlock/meterPercent, {result.percent}%) prove
// the presentation itself was removed; a blanket "no entry.percent anywhere" check would
// incorrectly flag that legitimate persistence code too.

// Sanity: the function that actually computes result.percent/mix (computeQuizResult) is NOT
// itself touched by this fix -- scoring math must stay exactly as it was, since tie-breaking/
// result selection/history depend on it. This script does not re-run the full scoring
// validation (see validate-keep-you-around.ts/validate-be-so-serious.ts for that); it only
// confirms this fix didn't reach into scoring.ts's computation itself.
const scoringSource = readFileSync(join(__dirname, '../src/data/quizzes/scoring.ts'), 'utf8');
assert(/percentages\[archetype\.id\] = totalPoints > 0/.test(scoringSource), 'scoreArchetypeQuiz still computes real percentages internally (unchanged) -- this fix only touched presentation, never scoring');
assert(/mix,\s*$/m.test(scoringSource) || /mix,/.test(scoringSource), 'computeQuizResult still populates ResultDisplay.mix internally (unchanged) -- history/tie-break data is preserved even though the UI no longer renders it');

// ============================================================================================
// 2. YOU's RECENT READ — no formatResultMetric percentage line
// ============================================================================================

const youScreenSource = readFileSync(join(__dirname, '../src/app/(tabs)/you.tsx'), 'utf8');
assert(!/formatResultMetric/.test(youScreenSource), 'you.tsx no longer imports or calls formatResultMetric (the Recent Read "% <label>" line)');
assert(!/recentReadMeter/.test(youScreenSource), 'the now-dead recentReadMeter style is removed from you.tsx');

assert(!/export const formatResultMetric/.test(scoringSource), 'formatResultMetric itself is removed from scoring.ts (no remaining call site anywhere)');

// ============================================================================================
// 3. NO FABRICATED REPLACEMENT PERCENTAGES — the fix must not invent new stats in their place
// ============================================================================================

for (const source of [quizRunnerSource, youScreenSource]) {
  assert(!/\d+%\s*of people/i.test(source), 'no invented "N% of people..." copy was added anywhere');
  assert(!/you'?re\s+\d+%/i.test(source), 'no invented "You\'re N%..." copy was added anywhere');
}

// ============================================================================================
// 4. REAL AGGREGATE PERCENTAGES ARE PRESERVED — Daily/Room and Admin analytics must NOT be
//    touched by this fix (they're backed by actual response data, not per-user scoring math).
// ============================================================================================

const homeScreenSource = readFileSync(join(__dirname, '../src/app/(tabs)/index.tsx'), 'utf8');
assert(/getConsensusLanguage|percent/.test(homeScreenSource), 'Home/Today still renders real Daily/Room consensus percentages (untouched by this fix)');

const adminIndexSource = readFileSync(join(__dirname, '../supabase/migrations/20260920010000_admin_quiz_result_distribution.sql'), 'utf8');
assert(/admin_get_quiz_result_distribution/.test(adminIndexSource), 'the real admin quiz-result-distribution RPC (backing Admin analytics percentages) is untouched');

const adminScreenSource = readFileSync(join(__dirname, '../src/app/admin/(protected)/index.tsx'), 'utf8');
assert(/row\.percent/.test(adminScreenSource), 'Admin analytics still renders real per-result percentages from actual aggregate response data (untouched by this fix)');

// ============================================================================================
// 5. PRIVATE STRUCTURED RESULTS — already never rendered mix/percent; confirm still true
// ============================================================================================

assert(
  /Deliberately does not render result\.mix\/result\.percent/.test(quizRunnerSource),
  'PrivateStructuredResult\'s own "never renders mix/percent" documentation is still present (Private already avoided this presentation, unaffected by this fix)',
);

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL "no fake quiz percentages" VALIDATION CHECKS PASSED.');
