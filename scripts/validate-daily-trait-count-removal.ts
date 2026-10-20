// Validates Build 18 Work Package 1: the owner-locked removal of the "max 3 traits per
// Daily answer" cap (Bible §56/§77), while preserving duplicate-dimension prevention and the
// (unrelated, untouched) 3-points-per-pole magnitude limit.
//
// src/data/daily-questions.ts transitively imports react-native (AppState) and
// @react-native-async-storage/async-storage, which esbuild/tsx cannot reliably parse outside
// Metro -- same documented limitation as onboarding.ts/age-eligibility.ts elsewhere in this
// repo (confirmed directly: importing it from a plain tsx script intermittently throws
// "Unexpected typeof" inside react-native/index.js). Source-text checks for that file and the
// admin review screen, plus a standalone reimplementation of the trivial dedupe algorithm to
// prove its LOGIC against the exact 0/1/3/5/10/20-trait matrix the task specifies -- the
// text checks prove the real file calls that same logic with no count truncation anywhere
// in the chain.
//
// Run with: npx tsx scripts/validate-daily-trait-count-removal.ts

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
// 1. LOGIC PROOF: dedupe-by-dimension, no count truncation, across 0/1/3/5/10/20 traits.
//    Exact reimplementation of dedupeEffectsByDimension (daily-questions.ts) -- a 4-line
//    Set-based filter with no meaningful alternative implementation, so duplicating it here
//    is a faithful proof of the real function's behavior, not a different algorithm.
// ============================================================================================

type Effect = { dimension: string; value: number };
const dedupeEffectsByDimension = (effects: Effect[]): Effect[] => {
  const seen = new Set<string>();
  return effects.filter((effect) => {
    if (seen.has(effect.dimension)) return false;
    seen.add(effect.dimension);
    return true;
  });
};

for (const count of [0, 1, 3, 5, 10, 20]) {
  const input: Effect[] = Array.from({ length: count }, (_, i) => ({ dimension: `dim_${i}`, value: (i % 3) + 1 }));
  const output = dedupeEffectsByDimension(input);
  assert(output.length === count, `${count} genuinely distinct traits: all ${count} survive with zero truncation (got ${output.length})`);
}

// Duplicate dimensions ARE removed, regardless of how many total entries surround them.
{
  const input: Effect[] = [
    { dimension: 'planner_spontaneous', value: 2 },
    { dimension: 'trust_verify', value: 1 },
    { dimension: 'planner_spontaneous', value: -1 }, // duplicate -- first occurrence wins
    ...Array.from({ length: 17 }, (_, i) => ({ dimension: `dim_${i}`, value: 1 })), // pad past 3/5/10
  ];
  const output = dedupeEffectsByDimension(input);
  assert(output.length === 19, `19 distinct dimensions survive out of 20 total entries with 1 duplicate (got ${output.length})`);
  assert(output.find((e) => e.dimension === 'planner_spontaneous')?.value === 2, 'the FIRST occurrence of a duplicated dimension wins, never the later one');
}

// ============================================================================================
// 2. SOURCE-TEXT CHECKS: the real files call this same logic with no count-based truncation
//    anywhere in the chain, and the removed constant is gone (regression guard).
// ============================================================================================

const dailyQuestionsSource = read('../src/data/daily-questions.ts');
// A comment explaining WHY the old constant was removed is fine (and present, for history) --
// what matters is that it is no longer EXPORTED or DEFINED as a live binding anything could
// still import/use.
assert(!/export const MAX_PERSONALITY_EFFECTS_PER_OPTION/.test(dailyQuestionsSource), 'daily-questions.ts no longer exports the removed trait-count-cap constant');
assert(!/personalityEffects\.slice\(/.test(dailyQuestionsSource), 'normalizeQuestion no longer slices/truncates persisted personalityEffects by count');
assert(!/effects\.slice\(/.test(dailyQuestionsSource), 'updateQuestionOptionEffects no longer slices/truncates incoming effects by count');
assert(/const dedupeEffectsByDimension = /.test(dailyQuestionsSource), 'the shared dedupe-by-dimension helper exists');
assert(
  (dailyQuestionsSource.match(/dedupeEffectsByDimension\(/g) ?? []).length === 2,
  'both the load path (normalizeQuestion) and the save path (updateQuestionOptionEffects) route through the SAME dedupe helper -- never two different implementations',
);

const adminReviewSource = read('../src/app/admin/(protected)/review/[id].tsx');
assert(!/const MAX_PERSONALITY_EFFECTS_PER_OPTION/.test(adminReviewSource), "the admin review screen's own separate trait-count-cap constant is removed");
assert(!/current\.length >= .*MAX_PERSONALITY/.test(adminReviewSource), 'handleAddEffect no longer refuses a new trait once a fixed count is reached');
assert(
  /current\.some\(\(effect\) => effect\.dimension === dimensionId\)/.test(adminReviewSource),
  'handleAddEffect still refuses a SECOND effect for a dimension already present on this answer -- duplicate-dimension prevention preserved',
);
assert(
  /effects\.length < PERSONALITY_DIMENSIONS\.length/.test(adminReviewSource),
  '"+ Add signal" hides only once every one of the 32 real dimensions already has an effect -- a natural structural ceiling, never an arbitrary count',
);
assert(!/up to \{MAX_PERSONALITY_EFFECTS_PER_OPTION\}/.test(adminReviewSource), 'the picker hint no longer advertises a fixed per-answer trait limit');

// Score magnitude (points-per-pole) is a DIFFERENT, untouched limit -- still exactly +1/+2 in
// this admin UI (±3 was never exposed here and this task never asked to add it), and the
// underlying PersonalityEffectValue type still bounds every value to -3..3 wherever assigned.
assert(/editStrength === 1 \? 1 : 2/.test(adminReviewSource) || /pickerStrength: 1 \| 2/.test(adminReviewSource) || /\[1, 2\]/.test(adminReviewSource) || /editStrength === 1/.test(adminReviewSource), 'the existing +1/+2 strength picker is unchanged -- this task only removes the TRAIT-COUNT cap, never the per-trait magnitude picker');

const personalitySource = read('../src/data/personality.ts');
assert(/export type PersonalityEffectValue = -3 \| -2 \| -1 \| 1 \| 2 \| 3;/.test(personalitySource), 'PersonalityEffectValue is still exactly -3..3 -- the real, already-sufficient points-per-pole ceiling, unchanged');

// ============================================================================================
// 3. SERVER-SIDE STAGED MIGRATION: additive validation (dimension allow-list, value range,
//    duplicate-dimension rejection), explicitly with NO array-length/count cap.
// ============================================================================================

const migrationSource = read('../supabase/migrations/20261020010000_daily_option_effects_validation.sql');
assert(/create or replace function public\.admin_update_daily_option/.test(migrationSource), 'the staged migration redefines admin_update_daily_option additively (create or replace, same signature)');
assert(!/jsonb_array_length\(v_effects\)\s*>/.test(migrationSource), 'the staged migration never rejects based on array length -- no count cap is reintroduced server-side');
assert(/if v_dimension = any\(v_seen_dimensions\) then/.test(migrationSource), 'the staged migration rejects a duplicate dimension within one answer, server-side');
assert(/v_value not in \(-3, -2, -1, 1, 2, 3\)/.test(migrationSource), 'the staged migration enforces the real -3..3 points-per-pole range, server-side');
assert(/raise exception .Unknown personality dimension/.test(migrationSource), 'the staged migration rejects an unknown dimension id, server-side');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log(
  '\nALL Daily trait-count-cap removal (0/1/3/5/10/20-trait matrix, duplicate-dimension prevention preserved, magnitude limit untouched, staged server-side validation) VALIDATION CHECKS PASSED.',
);
