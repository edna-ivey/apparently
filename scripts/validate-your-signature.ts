// "YOUR SIGNATURE" validation (Bible v1.4 §16) -- replaces the retired
// scripts/validate-your-seven.ts, which encoded the superseded "Your 7" mechanic (mixing real
// but unqualified "early signal" Core dimensions in with genuinely qualified ones to approach
// a fixed card count, gated by the 50-answer milestone). That mechanic has been removed from
// the product entirely -- see src/data/you-profile-cards.ts's own header comment. Run with:
//
//   npx tsx scripts/validate-your-signature.ts
//
// Imports the real functions directly (personality.ts, you-profile-cards.ts are RN-free by
// design — same established convention as every other validate-build8-*.ts script).

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import {
  isCoreDimension,
  isPrivateDimension,
  scorePersonalityProfile,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
} from '../src/data/personality';
import { buildYourSignatureCards } from '../src/data/you-profile-cards';

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

// Builds one answer carrying a single effect -- a convenience for raw-point fixtures below.
const answer = (dimension: PersonalityDimensionId, value: -2 | -1 | 1 | 2, occurredAt = '2026-01-01T00:00:00.000Z'): PersonalityAnswerEvidence => ({
  question: `q-${dimension}-${value}-${Math.random()}`,
  category: 'test',
  chosenAnswer: 'a',
  effects: [{ dimension, value }],
  occurredAt,
});

// A dimension reaching exactly `points` raw points via +2/+1 answers (all same sign).
const qualifyingAnswers = (dimension: PersonalityDimensionId, points: number): PersonalityAnswerEvidence[] => {
  const out: PersonalityAnswerEvidence[] = [];
  let remaining = points;
  while (remaining > 0) {
    const chunk = remaining >= 2 ? 2 : 1;
    out.push(answer(dimension, chunk as 1 | 2));
    remaining -= chunk;
  }
  return out;
};

const CORE_SAMPLE: PersonalityDimensionId[] = [
  'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
  'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
  'practical_idealistic', 'sentimental_thick_skinned',
];

// ============================================================================================
// Case 1 — zero qualifying traits (evidence may exist, but no winning pole reaches 3 points).
// ============================================================================================
{
  const profile = scorePersonalityProfile([answer('direct_indirect', 2)]);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 0, `Case 1: zero qualifying traits -> Your Signature contains 0 trait cards (got ${cards.length})`);
}

// ============================================================================================
// Case 2 — one weak Core observation: Direct +2 only -> Direct does NOT appear.
// ============================================================================================
{
  const profile = scorePersonalityProfile([answer('direct_indirect', 2)]);
  const cards = buildYourSignatureCards(profile);
  assert(!cards.some((c) => c.dimension === 'direct_indirect'), 'Case 2: Direct +2 alone does NOT appear in Your Signature');
}

// ============================================================================================
// Case 3 — exact threshold: Direct +2 plus Direct +1 -> Direct appears.
// ============================================================================================
{
  const profile = scorePersonalityProfile([answer('direct_indirect', 2), answer('direct_indirect', 1)]);
  const cards = buildYourSignatureCards(profile);
  assert(cards.some((c) => c.dimension === 'direct_indirect'), 'Case 3: Direct +2 then +1 (3 raw points) DOES appear in Your Signature');
  assert(cards.length === 1, `Case 3: exactly 1 card (got ${cards.length})`);
}

// ============================================================================================
// Case 4 — five qualifying Core traits -> exactly 5 appear.
// ============================================================================================
{
  const dims = CORE_SAMPLE.slice(0, 5);
  const answers = dims.flatMap((dimension, index) => qualifyingAnswers(dimension, 8 - index));
  const profile = scorePersonalityProfile(answers);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 5, `Case 4: 5 qualifying Core traits -> exactly 5 appear (got ${cards.length})`);
}

// ============================================================================================
// Case 5 — seven qualifying Core traits -> exactly 7 appear.
// ============================================================================================
{
  const dims = CORE_SAMPLE.slice(0, 7);
  const answers = dims.flatMap((dimension, index) => qualifyingAnswers(dimension, 10 - index));
  const profile = scorePersonalityProfile(answers);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 7, `Case 5: 7 qualifying Core traits -> exactly 7 appear (got ${cards.length})`);
}

// ============================================================================================
// Case 6 — ten qualifying Core traits -> strongest 7 only.
// ============================================================================================
{
  const dims = CORE_SAMPLE.slice(0, 10);
  const answers = dims.flatMap((dimension, index) => qualifyingAnswers(dimension, 20 - index)); // strictly decreasing, unambiguous ranking
  const profile = scorePersonalityProfile(answers);
  const qualifyingCount = profile.dimensions.filter((d) => d.activeBoardQualified && isCoreDimension(d.dimension)).length;
  assert(qualifyingCount === 10, `Case 6 fixture sanity: all 10 genuinely qualify (got ${qualifyingCount})`);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 7, `Case 6: 10 qualifying Core traits -> strongest 7 only (got ${cards.length})`);
  const strongestSeven = dims.slice(0, 7);
  assert(
    strongestSeven.every((dimension) => cards.some((c) => c.dimension === dimension)),
    'Case 6: the 7 returned are specifically the 7 STRONGEST (highest raw-point totals), not an arbitrary 7',
  );
}

// ============================================================================================
// Case 7 — fewer than seven qualifying traits at >= 50 answered questions: no early-signal
// traits are inserted merely because the user crossed 50.
// ============================================================================================
{
  const qualifyingDims = CORE_SAMPLE.slice(0, 4);
  const qualifyingPart = qualifyingDims.flatMap((dimension, index) => qualifyingAnswers(dimension, 6 - index));
  // Padding answers that contribute NOTHING to personality evidence (empty effects) -- purely
  // to cross the 50-answered-questions mark without adding any additional qualifying (or
  // early-signal) Core evidence.
  const padding: PersonalityAnswerEvidence[] = Array.from({ length: 50 - qualifyingPart.length }, (_, i) => ({
    question: `padding-${i}`,
    category: 'test',
    chosenAnswer: 'a',
    effects: [],
  }));
  const profile = scorePersonalityProfile([...qualifyingPart, ...padding]);
  assert(profile.answeredCount >= 50, `Case 7 fixture sanity: answeredCount >= 50 (got ${profile.answeredCount})`);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 4, `Case 7: >= 50 answered questions but only 4 qualifying Core traits -> exactly 4 shown, no padding toward 7 (got ${cards.length})`);
}

// ============================================================================================
// Case 8 — Creature threshold preserved / decoupled: Your Signature no longer reads
// profileAnswerCount or any 50-answer branch at all. Source-text check against the real
// shipped you.tsx (react-native import chain, same convention as every other script that
// can't import it directly).
// ============================================================================================
{
  const youSource = read('../src/app/(tabs)/you.tsx');
  assert(/buildYourSignatureCards/.test(youSource), 'Case 8: you.tsx calls the new buildYourSignatureCards');
  assert(!/buildYourSevenCards|buildYouProfileCards/.test(youSource), 'Case 8: the retired Your 7 / early-signal builders are not referenced anywhere in you.tsx');

  const profileCardsMemoMatch = youSource.match(/const profileCards = useMemo\(\(\) => \{[\s\S]*?\}, \[remoteState\]\);/);
  assert(profileCardsMemoMatch !== null, 'Case 8: the profileCards memo exists in you.tsx');
  assert(
    !/profileAnswerCount/.test(profileCardsMemoMatch?.[0] ?? ''),
    'Case 8: the profileCards (Your Signature) memo no longer reads profileAnswerCount at all -- Your Signature qualification is fully independent of the answered-question count',
  );
  // profileAnswerCount still exists elsewhere in the file (the "answers shaping your read"
  // subline) -- this pass only removes its use as a Your-Signature gate, nothing else.
  assert(/profileAnswerCount/.test(youSource), 'Case 8: profileAnswerCount itself is still used elsewhere in you.tsx (the subline), unaffected by this pass');
}

// ============================================================================================
// Case 9 — opposite poles: Direct winning, Indirect losing -> only Direct may appear.
// ============================================================================================
{
  const profile = scorePersonalityProfile([
    answer('direct_indirect', 2), answer('direct_indirect', 2), // Direct: 4
    answer('direct_indirect', -2), // Indirect: 2 (losing, and itself below threshold anyway)
  ]);
  const cards = buildYourSignatureCards(profile);
  assert(cards.length === 1 && cards[0].dimension === 'direct_indirect', 'Case 9: only the winning pole (Direct) appears, never both poles of the same dimension');
}

// ============================================================================================
// Case 10 — Core boundary: no Private dimension may ever appear in Your Signature, even when
// fully qualified.
// ============================================================================================
{
  const profile = scorePersonalityProfile([
    answer('tactful_blunt', -2), answer('tactful_blunt', -1), // Private, qualifies (3 points)
    answer('direct_indirect', 2), answer('direct_indirect', 1), // Core, qualifies (3 points)
  ]);
  const cards = buildYourSignatureCards(profile);
  assert(cards.every((c) => isCoreDimension(c.dimension)), 'Case 10: every Your Signature card is a Core dimension');
  assert(!cards.some((c) => isPrivateDimension(c.dimension)), 'Case 10: no Private dimension ever appears in Your Signature, even when fully qualified');
  assert(cards.some((c) => c.dimension === 'direct_indirect'), 'Case 10 sanity: the qualifying Core dimension still appears');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL "YOUR SIGNATURE" (Bible v1.4 §16) VALIDATION CHECKS PASSED.');
