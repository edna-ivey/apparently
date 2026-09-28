// Bible v1.4 qualification-foundation reconciliation pass -- the full required test matrix
// (raw within-quiz qualification, permanent quiz awards, active-board qualification, opposite
// -pole resolution/tie-breaks, Core/Private separation) exactly as specified in the audit task.
// Run with:
//
//   npx tsx scripts/validate-build8-pass4-bible-qualification-reconciliation.ts

import {
  ACTIVE_BOARD_QUALIFICATION_THRESHOLD,
  isActiveBoardQualified,
  isCoreDimension,
  isPrivateDimension,
  resolveActiveBoardPole,
  scorePersonalityProfile,
  type DimensionEvidence,
  type PersonalityAnswerEvidence,
} from '../src/data/personality';
import { selectStrongestPrivateSignals, selectRelicSlots } from '../src/data/private-signals';
import { applyPermanentQuizAwards, resolveWithinQuizQualification, WITHIN_QUIZ_QUALIFICATION_THRESHOLD } from '../src/data/quiz-personality-awards';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// A tiny evidence-item builder for exercising resolveWithinQuizQualification directly with a
// single answer per raw point contribution (matching the task's "Q1 +2 / Q2 +1" framing, one
// question per array entry).
const answer = (dimension: PersonalityAnswerEvidence['effects'][number]['dimension'], value: -2 | -1 | 1 | 2): PersonalityAnswerEvidence => ({
  question: `q-${dimension}-${value}-${Math.random()}`,
  category: 'test',
  chosenAnswer: 'a',
  effects: [{ dimension, value }],
});

// ============================================================================================
// QUIZ RAW QUALIFICATION (within-quiz, WITHIN_QUIZ_QUALIFICATION_THRESHOLD = 3)
// ============================================================================================

console.log('\n--- QUIZ RAW QUALIFICATION ---');
assert(WITHIN_QUIZ_QUALIFICATION_THRESHOLD === 3, 'within-quiz raw qualification threshold is 3');

// Case A: Direct Q1 +2, Q2 +1 = 3 -> qualifies.
{
  const qualified = resolveWithinQuizQualification([answer('direct_indirect', 2), answer('direct_indirect', 1)]);
  assert(qualified.length === 1 && qualified[0].dimension === 'direct_indirect' && qualified[0].winningRawPoints === 3, 'Case A: Direct +2 then +1 (total 3) qualifies within the quiz');
}

// Case B: Direct Q1 +2 only -> does NOT qualify.
{
  const qualified = resolveWithinQuizQualification([answer('direct_indirect', 2)]);
  assert(qualified.length === 0, 'Case B: Direct +2 alone (total 2) does NOT qualify -- one answer alone can never qualify a trait');
}

// Case C: Direct +1 +1 +1 -> qualifies.
{
  const qualified = resolveWithinQuizQualification([answer('direct_indirect', 1), answer('direct_indirect', 1), answer('direct_indirect', 1)]);
  assert(qualified.length === 1 && qualified[0].winningRawPoints === 3, 'Case C: Direct +1 +1 +1 (total 3) qualifies');
}

// Case D: Direct = 4, Indirect = 3 -> Direct wins the dimension.
{
  const qualified = resolveWithinQuizQualification([
    answer('direct_indirect', 2), answer('direct_indirect', 2), // Direct: 4
    answer('direct_indirect', -2), answer('direct_indirect', -1), // Indirect: 3
  ]);
  assert(qualified.length === 1 && qualified[0].winningSign === 1 && qualified[0].winningRawPoints === 4, 'Case D: Direct(4) beats Indirect(3) -- Direct wins the dimension outright');
}

// Case E: Direct = 3, Indirect = 3 -> timestamp/order tie-break determines the winning pole
// (Direct reaches 3 first here: +2 then +1, vs Indirect's -2 then -1 arriving later in order).
{
  const qualified = resolveWithinQuizQualification([
    answer('direct_indirect', 2), // Direct running total: 2 (order 0)
    answer('direct_indirect', -2), // Indirect running total: 2 (order 1)
    answer('direct_indirect', 1), // Direct reaches 3 at order 2
    answer('direct_indirect', -1), // Indirect reaches 3 at order 3 (later)
  ]);
  assert(qualified.length === 1 && qualified[0].winningSign === 1 && qualified[0].winningRawPoints === 3, 'Case E: tied at 3/3 -- the pole that FIRST reached 3 (Direct, at order 2) wins the tie-break');
}

// ============================================================================================
// PUBLIC QUIZ AWARDS
// ============================================================================================

console.log('\n--- PUBLIC QUIZ AWARDS ---');
{
  // 6 Core traits qualify -- 6 distinct Core dimensions, each reaching a DIFFERENT raw-point
  // total (8,7,6,5,4,3 -- all >= the 3-point threshold, strictly decreasing so ranking order
  // is unambiguous without relying on the tie-break for this particular check).
  const coreDims: PersonalityAnswerEvidence['effects'][number]['dimension'][] = [
    'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement', 'protective_hands_off', 'adventure_comfort',
  ];
  const answers: PersonalityAnswerEvidence[] = [];
  coreDims.forEach((dimension, index) => {
    const points = 8 - index; // 8,7,6,5,4,3
    let remaining = points;
    while (remaining > 0) {
      const chunk = remaining >= 2 ? 2 : 1;
      answers.push(answer(dimension, chunk as 1 | 2));
      remaining -= chunk;
    }
  });
  const qualified = resolveWithinQuizQualification(answers);
  assert(qualified.length === 6, `fixture sanity: exactly 6 Core traits qualify (got ${qualified.length})`);

  const awards = applyPermanentQuizAwards(answers, 'public');
  const byDimension = new Map(awards.map((a) => [a.dimension, a.value]));
  assert(byDimension.get('planner_spontaneous') === 2, 'rank 1 (strongest, 8 points) Core trait = +2');
  assert(byDimension.get('emotional_intensity') === 2, 'rank 2 (7 points) Core trait = +2');
  assert(byDimension.get('direct_indirect') === 2, 'rank 3 (6 points) Core trait = +2');
  assert(byDimension.get('social_attunement') === 1, 'rank 4 (5 points) Core trait = +1');
  assert(byDimension.get('protective_hands_off') === 1, 'rank 5 (4 points) Core trait = +1');
  assert(!byDimension.has('adventure_comfort'), 'rank 6 (3 points, weakest of the six) receives NO award');
  assert(awards.length === 5, `only 5 total awards granted for 6 qualifying Core traits, per the top-3/next-2 cap (got ${awards.length})`);
}

{
  // Only 2 Core traits qualify -- only those two receive permanent awards, nothing invented for
  // ranks 3-5.
  const answers = [
    answer('planner_spontaneous', 2), answer('planner_spontaneous', 1),
    answer('direct_indirect', 2), answer('direct_indirect', 1),
  ];
  const awards = applyPermanentQuizAwards(answers, 'public');
  assert(awards.length === 2, `only 2 Core traits qualify -> only 2 awards granted, never padded to 3-5 (got ${awards.length})`);
  assert(awards.every((a) => a.value === 2), 'both qualifying traits receive the top-3 tier award (+2) since there are only 2 of them');
}

// Public quizzes never award Private traits, even if one happens to qualify.
{
  const answers = [
    answer('direct_indirect', 2), answer('direct_indirect', 1), // Core, qualifies
    answer('tactful_blunt', -2), answer('tactful_blunt', -1), // Private, qualifies -- must NOT be awarded on a public quiz
  ];
  const awards = applyPermanentQuizAwards(answers, 'public');
  assert(awards.every((a) => a.dimension !== 'tactful_blunt'), 'Public/Free quizzes never generate a Private/Relic award, even when a Private trait genuinely qualifies within the quiz');
}

// ============================================================================================
// PRIVATE QUIZ AWARDS
// ============================================================================================

console.log('\n--- PRIVATE QUIZ AWARDS ---');
{
  // Core qualifying traits: A, B, C, D (4 qualify) -- only top 3 receive +1.
  const coreDims: PersonalityAnswerEvidence['effects'][number]['dimension'][] = ['planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement'];
  const privateDims: PersonalityAnswerEvidence['effects'][number]['dimension'][] = ['accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance', 'boundary_holding_approval_seeking'];
  const answers: PersonalityAnswerEvidence[] = [];
  coreDims.forEach((dimension, index) => {
    const points = 6 - index;
    let remaining = points;
    while (remaining > 0) {
      const chunk = remaining >= 2 ? 2 : 1;
      answers.push(answer(dimension, chunk as 1 | 2));
      remaining -= chunk;
    }
  });
  privateDims.forEach((dimension, index) => {
    const points = 6 - index;
    let remaining = points;
    while (remaining > 0) {
      const chunk = remaining >= 2 ? 2 : 1;
      answers.push(answer(dimension, chunk as 1 | 2));
      remaining -= chunk;
    }
  });

  const qualified = resolveWithinQuizQualification(answers);
  assert(qualified.filter((t) => isCoreDimension(t.dimension)).length === 4, 'fixture sanity: 4 Core traits qualify');
  assert(qualified.filter((t) => isPrivateDimension(t.dimension)).length === 4, 'fixture sanity: 4 Private traits qualify');

  const awards = applyPermanentQuizAwards(answers, 'private');
  const coreAwards = awards.filter((a) => isCoreDimension(a.dimension));
  const privateAwards = awards.filter((a) => isPrivateDimension(a.dimension));
  assert(coreAwards.length === 3, `top 3 only of 4 qualifying Core traits receive an award (got ${coreAwards.length})`);
  assert(coreAwards.every((a) => a.value === 1), 'every awarded Core trait on a Private quiz gets +1 (never +2)');
  assert(privateAwards.length === 3, `top 3 only of 4 qualifying Private traits receive an award (got ${privateAwards.length})`);
  assert(privateAwards.every((a) => a.value === 2), 'every awarded Private trait on a Private quiz gets +2');
  assert(!coreAwards.some((a) => a.dimension === 'social_attunement'), '4th-ranked Core trait (weakest) receives no award');
  assert(!privateAwards.some((a) => a.dimension === 'boundary_holding_approval_seeking'), '4th-ranked Private trait (weakest) receives no award');
}

// ============================================================================================
// ACTIVE BOARD (all-time ledger; separate threshold from within-quiz qualification, same
// current numeric value)
// ============================================================================================

console.log('\n--- ACTIVE BOARD ---');
assert(ACTIVE_BOARD_QUALIFICATION_THRESHOLD === 3, 'active-board qualification threshold is 3');

{
  // Direct: quiz award +2, Daily +1 -> 3 active points -> qualifies for Your Signature.
  const profile = scorePersonalityProfile([
    { question: 'quiz result', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'qr-1', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'direct_indirect', value: 2 }] },
    { question: 'daily', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'da-1', occurredAt: '2026-01-02T00:00:00.000Z', effects: [{ dimension: 'direct_indirect', value: 1 }] },
  ]);
  const direct = profile.dimensions.find((d) => d.dimension === 'direct_indirect')!;
  assert(direct.activeBoardQualified, '3 active cumulative points (2 quiz + 1 Daily) -> qualifies for Your Signature');
  assert(profile.topTraits.some((t) => t.id === 'direct_indirect'), 'and actually appears in topTraits (Your Signature)');
}

{
  // Another trait: quiz award +2 only -> 2 active points -> does NOT yet make the board.
  const profile = scorePersonalityProfile([
    { question: 'quiz result', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'qr-2', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'ambitious_content', value: 2 }] },
  ]);
  const ambitious = profile.dimensions.find((d) => d.dimension === 'ambitious_content')!;
  assert(!ambitious.activeBoardQualified, '2 active cumulative points (quiz +2 only) does NOT yet make the board');
  assert(!profile.topTraits.some((t) => t.id === 'ambitious_content'), 'and does not appear in topTraits');
}

// ============================================================================================
// OPPOSITE ACTIVE POLES
// ============================================================================================

console.log('\n--- OPPOSITE ACTIVE POLES ---');
{
  // Direct active = 5, Indirect active = 4 -> Direct wins.
  const evidence: DimensionEvidence[] = [
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 2, normalized: 1, date: '2026-01-01T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 2, normalized: 1, date: '2026-01-02T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 1, normalized: 0.5, date: '2026-01-03T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: -2, normalized: -1, date: '2026-01-01T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: -2, normalized: -1, date: '2026-01-02T00:00:00.000Z' },
  ];
  const resolution = resolveActiveBoardPole(evidence);
  assert(resolution.winningSign === 1 && resolution.winningRawPoints === 5, 'Direct(5) beats Indirect(4) -- Direct is the current dimension winner');
}

{
  // Tie: Direct = 5, Indirect = 5 -> first-highest timestamp determines winner.
  const evidence: DimensionEvidence[] = [
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 2, normalized: 1, date: '2026-01-01T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: -2, normalized: -1, date: '2026-01-02T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 2, normalized: 1, date: '2026-01-03T00:00:00.000Z' },
    // Direct reaches 5 at 2026-01-05 (2+2+1); Indirect reaches 5 at 2026-01-06 (2+2+1) -- Direct first.
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: 1, normalized: 0.5, date: '2026-01-05T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: -2, normalized: -1, date: '2026-01-04T00:00:00.000Z' },
    { dimension: 'direct_indirect', question: 'q', category: 'c', chosenAnswer: 'a', effect: -1, normalized: -0.5, date: '2026-01-06T00:00:00.000Z' },
  ];
  const resolution = resolveActiveBoardPole(evidence);
  assert(resolution.winningRawPoints === 5 && resolution.losingRawPoints === 5, 'fixture sanity: both poles tied at 5 raw points');
  assert(resolution.winningSign === 1, 'tie at 5/5 -- Direct (which reached 5 first, on 01-05, versus Indirect on 01-06) wins the tie-break');
}

// ============================================================================================
// PRIVATE / CORE SEPARATION
// ============================================================================================

console.log('\n--- PRIVATE / CORE SEPARATION ---');
{
  const profile = scorePersonalityProfile([
    {
      question: 'a both-mapped observation', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'qr-both', occurredAt: '2026-01-01T00:00:00.000Z',
      effects: [
        { dimension: 'tactful_blunt', value: -2 }, // Private
        { dimension: 'tactful_blunt', value: -1 }, // Private (3 total -> qualifies)
        { dimension: 'direct_indirect', value: 2 }, // Core
        { dimension: 'direct_indirect', value: 1 }, // Core (3 total -> qualifies)
      ],
    },
  ]);
  assert(profile.topTraits.some((t) => t.id === 'direct_indirect'), 'Core evidence drives Your Signature/topTraits');
  assert(!profile.topTraits.some((t) => t.id === 'tactful_blunt'), 'Private evidence never enters Your Signature/topTraits, even when fully qualified');
  const privateSignals = selectStrongestPrivateSignals(profile);
  assert(privateSignals.some((s) => s.dimension === 'tactful_blunt'), 'Private evidence drives The Undercurrent');
  assert(!privateSignals.some((s) => s.dimension === 'direct_indirect'), 'Core evidence never enters The Undercurrent, even when fully qualified');
  assert(selectRelicSlots(privateSignals).relicTrait?.dimension === 'tactful_blunt', 'the Relic pool draws only from Private evidence');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Bible v1.4 qualification-foundation reconciliation VALIDATION CHECKS PASSED.');
