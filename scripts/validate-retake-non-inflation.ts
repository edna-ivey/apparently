// Validates the Build 22 "a retake must not inflate a trait's strength" requirement through
// the real, public rankPoles() API -- not by re-asserting dedupeForRanking's own internal
// comment in isolation. scoring-engine.ts's dedupeForRanking already keeps only the EARLIEST
// row for a given (questionStableId, poleId) pair for ranking purposes (see that function's
// own comment); this proves it holds end-to-end, including the case where a retake's answer
// is DIFFERENT from (and would score higher than) the original.
//
// Run with: npx tsx scripts/validate-retake-non-inflation.ts

import { rankPoles, computeAllPoleStats, buildPoleEvidenceForPresentedQuestion, type PoleEvidenceRow } from '../src/data/personality-v2/scoring-engine';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const userId = 'u1';
const questionStableId = 'petty:q1';
const choices = [
  { choiceId: 'a', awards: [{ pole: 'forgiving_receipts:positive' as const, points: 1 as const }] },
  { choiceId: 'b', awards: [{ pole: 'forgiving_receipts:negative' as const, points: 3 as const }] },
];

// Original completion: weaker choice ('a'), 1 point.
const originalRows = buildPoleEvidenceForPresentedQuestion({
  userId,
  sourceType: 'quiz_result',
  sourceId: 'result-1',
  questionStableId,
  choices,
  chosenChoiceId: 'a',
  occurredAt: '2026-01-01T00:00:00Z',
});

// Retake, same question, DELIBERATELY picks the stronger choice ('b', 3 points) -- a user
// trying to game their score by re-answering more strongly on a retake.
const retakeRows = buildPoleEvidenceForPresentedQuestion({
  userId,
  sourceType: 'quiz_result',
  sourceId: 'result-2',
  questionStableId,
  choices,
  chosenChoiceId: 'b',
  occurredAt: '2026-01-05T00:00:00Z',
});

// A second, unrelated question's answer, present in both runs, to prove the dedupe is scoped
// to the retaken question only, not a blanket "ignore everything from source-2" rule.
const unrelatedRows = buildPoleEvidenceForPresentedQuestion({
  userId,
  sourceType: 'quiz_result',
  sourceId: 'result-2',
  questionStableId: 'petty:q2',
  choices: [{ choiceId: 'a', awards: [{ pole: 'direct_indirect:positive', points: 2 }] }],
  chosenChoiceId: 'a',
  occurredAt: '2026-01-05T00:00:05Z',
});

const withoutRetake: PoleEvidenceRow[] = [...originalRows];
const withRetake: PoleEvidenceRow[] = [...originalRows, ...retakeRows, ...unrelatedRows];

// rankPoles only ever returns ELIGIBLE poles (lifetimeEarned >= ELIGIBILITY_THRESHOLD=9) --
// these small fixtures intentionally stay under that threshold so computeAllPoleStats (which
// returns every pole's real standing regardless of eligibility) is the right tool to inspect
// exact point totals; rankPoles itself is still used below for the "never becomes ranked" check.
const statsWithoutRetake = computeAllPoleStats(withoutRetake);
const statsWithRetake = computeAllPoleStats(withRetake);
const negativeStatsWithout = statsWithoutRetake.find((p) => p.poleId === 'forgiving_receipts:negative');
const negativeStatsWith = statsWithRetake.find((p) => p.poleId === 'forgiving_receipts:negative');
const positiveStatsWith = statsWithRetake.find((p) => p.poleId === 'forgiving_receipts:positive');

assert(
  negativeStatsWithout?.lifetimeEarned === 0,
  'before the retake, forgiving_receipts:negative has zero evidence (the original answer never chose it)',
);
assert(
  negativeStatsWith?.lifetimeEarned === 0,
  "the retake's stronger choice ('b', 3 points on forgiving_receipts:negative) contributes ZERO ranking evidence -- the retake's row is excluded outright, not just capped",
);
assert(
  positiveStatsWith !== undefined && positiveStatsWith.lifetimeEarned === 1 && positiveStatsWith.distinctQuestionsPresented === 1,
  `the ORIGINAL answer's evidence (1 point, forgiving_receipts:positive) is exactly what still counts after the retake -- unchanged by the retake (lifetimeEarned=${positiveStatsWith?.lifetimeEarned}, distinctQuestionsPresented=${positiveStatsWith?.distinctQuestionsPresented})`,
);

const directStatsWithRetake = statsWithRetake.find((p) => p.poleId === 'direct_indirect:positive');
assert(
  directStatsWithRetake?.lifetimeEarned === 2,
  'an unrelated question answered in the same retake session still counts normally -- the dedupe is scoped to the retaken question only',
);

// Full-circle: a user cannot raise ANY pole's ranking position by retaking with a "better"
// answer. forgiving_receipts:negative must never become eligible/ranked no matter how many
// times the stronger choice is retaken.
const manyRetakes: PoleEvidenceRow[] = [...originalRows];
for (let i = 0; i < 5; i += 1) {
  manyRetakes.push(
    ...buildPoleEvidenceForPresentedQuestion({
      userId,
      sourceType: 'quiz_result',
      sourceId: `result-retake-${i}`,
      questionStableId,
      choices,
      chosenChoiceId: 'b',
      occurredAt: `2026-02-0${i + 1}T00:00:00Z`,
    }),
  );
}
const rankedAfterManyRetakes = rankPoles(manyRetakes);
assert(
  rankedAfterManyRetakes.find((p) => p.poleId === 'forgiving_receipts:negative') === undefined,
  'repeating the retake 5 more times still cannot make the opposing pole appear in ranking at all',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL retake non-inflation (real rankPoles API, including a scoped, repeated, deliberately-stronger retake) VALIDATION CHECKS PASSED.');
