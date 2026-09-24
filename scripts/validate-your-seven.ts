// Standalone validation for the "YOUR 7 must actually show seven" product fix. Run with:
//
//   npx tsx scripts/validate-your-seven.ts
//
// Imports the real buildYouProfileCards/buildYourSevenCards from src/data/you-profile-cards.ts
// directly (that module was deliberately extracted from src/app/(tabs)/you.tsx to be
// react-native-free, specifically so it CAN be imported here rather than hand-mirrored — every
// other RN-adjacent script in this repo mirrors logic only because extraction wasn't already
// done; here it was, so this uses the real functions). scorePersonalityProfile/
// PersonalityAnswerEvidence come from src/data/personality.ts, also pure.

// This repo has no @types/node dependency (deliberately). Minimal local ambient declarations,
// scoped to this one file — same convention as scripts/validate-purchases.ts.
declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { buildYouProfileCards, buildYourSevenCards } from '../src/data/you-profile-cards';
import {
  PERSONALITY_DIMENSIONS,
  scorePersonalityProfile,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
} from '../src/data/personality';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// Builds N answers, each contributing ONE +2 effect to a distinct dimension in round-robin
// order across `dimensionIds`, so calling with e.g. 10 dimensions and answerCount=30 gives
// each of the 10 dimensions exactly 3 pieces of evidence (evidenceCount=3, safely >=2 ==
// "mature"). Deterministic, no randomness, category left constant (irrelevant to these tests).
const buildAnswers = (answerCount: number, dimensionIds: PersonalityDimensionId[]): PersonalityAnswerEvidence[] =>
  Array.from({ length: answerCount }, (_, i) => ({
    question: `synthetic question ${i}`,
    category: 'synthetic',
    chosenAnswer: `synthetic answer ${i}`,
    effects: [{ dimension: dimensionIds[i % dimensionIds.length], value: 2 as const }],
  }));

const ALL_DIMENSION_IDS = PERSONALITY_DIMENSIONS.map((d) => d.id);

// ============================================================================================
// 1. BELOW 50 ANSWERS: buildYouProfileCards stays capped at 5, even with far more than 5 real
//    evidenced dimensions available.
// ============================================================================================

{
  const tenDimensions = ALL_DIMENSION_IDS.slice(0, 10);
  const answers = buildAnswers(49, tenDimensions); // 49 answers, ~5 each across 10 dimensions -> all mature
  const profile = scorePersonalityProfile(answers);
  assert(profile.answeredCount === 49, 'fixture sanity: profile.answeredCount is exactly 49');
  const cards = buildYouProfileCards(profile);
  assert(cards.length <= 5, `49 answers: buildYouProfileCards returns at most 5 cards (got ${cards.length})`);
}

// ============================================================================================
// 2. AT 50 ANSWERS WITH >=7 EVIDENCED DIMENSIONS: buildYourSevenCards returns exactly 7.
// ============================================================================================

{
  const tenDimensions = ALL_DIMENSION_IDS.slice(0, 10);
  const answers = buildAnswers(50, tenDimensions);
  const profile = scorePersonalityProfile(answers);
  assert(profile.answeredCount === 50, 'fixture sanity: profile.answeredCount is exactly 50');
  const eligibleDimensionCount = profile.dimensions.filter((d) => d.evidenceCount >= 1).length;
  assert(eligibleDimensionCount >= 7, `fixture sanity: at least 7 dimensions have real evidence (got ${eligibleDimensionCount})`);
  const cards = buildYourSevenCards(profile);
  assert(cards.length === 7, `50 answers, >=7 evidenced dimensions: buildYourSevenCards returns EXACTLY 7 (got ${cards.length})`);
}

// ============================================================================================
// 3. AT 70 ANSWERS WITH >=7 EVIDENCED DIMENSIONS: still exactly 7, never more.
// ============================================================================================

{
  const fifteenDimensions = ALL_DIMENSION_IDS.slice(0, 15);
  const answers = buildAnswers(70, fifteenDimensions);
  const profile = scorePersonalityProfile(answers);
  assert(profile.answeredCount === 70, 'fixture sanity: profile.answeredCount is exactly 70');
  const cards = buildYourSevenCards(profile);
  assert(cards.length === 7, `70 answers, many evidenced dimensions: buildYourSevenCards returns EXACTLY 7, never more (got ${cards.length})`);
}

// ============================================================================================
// 4. NO DUPLICATE DIMENSION, NO CARD WITHOUT REAL EVIDENCE (across the 70-answer fixture above)
// ============================================================================================

{
  const fifteenDimensions = ALL_DIMENSION_IDS.slice(0, 15);
  const profile = scorePersonalityProfile(buildAnswers(70, fifteenDimensions));
  const cards = buildYourSevenCards(profile);
  const dimensionIds = cards.map((c) => c.dimension);
  assert(new Set(dimensionIds).size === dimensionIds.length, 'no duplicate dimension across the 7 cards');
  const evidenceByDimension = new Map(profile.dimensions.map((d) => [d.dimension, d.evidenceCount]));
  assert(
    cards.every((card) => (evidenceByDimension.get(card.dimension) ?? 0) >= 1),
    'every returned card traces back to a dimension with evidenceCount >= 1 (never fabricated)',
  );
}

// ============================================================================================
// 5. MATURE-FIRST RANKING + EARLY-SIGNAL FALLBACK CAN HONESTLY REACH SEVEN
// ============================================================================================

{
  // 4 dimensions get 3 answers each (evidenceCount=3, mature). 3 different dimensions get
  // exactly 1 answer each (evidenceCount=1, early-signal). Total 7 real evidenced dimensions,
  // 4 mature + 3 early -- exactly the "fill remaining slots with early signal" case.
  const matureDimensions = ALL_DIMENSION_IDS.slice(0, 4);
  const earlyDimensions = ALL_DIMENSION_IDS.slice(4, 7);
  const matureAnswers = matureDimensions.flatMap((dimension) =>
    Array.from({ length: 3 }, (_, i) => ({
      question: `mature q ${dimension} ${i}`,
      category: 'synthetic',
      chosenAnswer: 'a',
      effects: [{ dimension, value: 2 as const }],
    })),
  );
  const earlyAnswers: PersonalityAnswerEvidence[] = earlyDimensions.map((dimension) => ({
    question: `early q ${dimension}`,
    category: 'synthetic',
    chosenAnswer: 'a',
    effects: [{ dimension, value: 1 as const }],
  }));
  // Deliberately NO padding to 50 answers here -- buildYourSevenCards only looks at
  // profile.dimensions (per-dimension evidence), never profile.answeredCount, so padding adds
  // nothing to what this specific ranking test needs to prove. (An earlier version of this
  // fixture padded with one dimension's worth of extra answers to also hit 50 total -- that
  // padding dimension's evidenceCount ended up high enough to legitimately outrank one of the
  // 3 intended early-signal dimensions for a real top-7 slot, which is CORRECT function
  // behavior, just not what this test is trying to isolate. The 50-answer threshold itself is
  // already covered by test 2 above.)
  const profile = scorePersonalityProfile([...matureAnswers, ...earlyAnswers]);
  const cards = buildYourSevenCards(profile);

  assert(cards.length === 7, `4 mature + 3 early-signal fixture: buildYourSevenCards reaches exactly 7 honestly (got ${cards.length})`);
  const returnedDimensions = new Set(cards.map((c) => c.dimension));
  assert(
    matureDimensions.every((d) => returnedDimensions.has(d)) && earlyDimensions.every((d) => returnedDimensions.has(d)),
    'all 4 mature AND all 3 early-signal dimensions are present among the 7 cards',
  );
  const matureCardIndices = cards.map((c, i) => (matureDimensions.includes(c.dimension) ? i : -1)).filter((i) => i >= 0);
  const earlyCardIndices = cards.map((c, i) => (earlyDimensions.includes(c.dimension) ? i : -1)).filter((i) => i >= 0);
  assert(
    Math.max(...matureCardIndices) < Math.min(...earlyCardIndices),
    'every mature card sorts strictly before every early-signal card (mature-first ranking)',
  );
}

// ============================================================================================
// 6. FEWER THAN 7 REAL EVIDENCED DIMENSIONS -> never fabricates a 7th
// ============================================================================================

{
  const threeDimensions = ALL_DIMENSION_IDS.slice(0, 3);
  const profile = scorePersonalityProfile(buildAnswers(55, threeDimensions));
  const cards = buildYourSevenCards(profile);
  assert(cards.length === 3, `only 3 real evidenced dimensions exist: buildYourSevenCards honestly returns 3, never fabricates up to 7 (got ${cards.length})`);
}

// ============================================================================================
// 7. SOURCE-TEXT CHECK — the actual >= 50 threshold wiring in you.tsx itself (the pure
//    functions above are correct in isolation; this confirms the SCREEN actually calls the
//    right one at the right threshold).
// ============================================================================================

{
  const youScreenSource = readFileSync(join(__dirname, '../src/app/(tabs)/you.tsx'), 'utf8');
  assert(/profileAnswerCount >= 50/.test(youScreenSource), 'you.tsx branches on profileAnswerCount >= 50 (the documented YOUR 7 threshold)');
  assert(/buildYourSevenCards\(remoteState\.profile\)/.test(youScreenSource), 'you.tsx calls buildYourSevenCards at/above the threshold');
  assert(/buildYouProfileCards\(remoteState\.profile\)/.test(youScreenSource), 'you.tsx calls buildYouProfileCards below the threshold');
}

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL "YOUR 7" VALIDATION CHECKS PASSED.');
