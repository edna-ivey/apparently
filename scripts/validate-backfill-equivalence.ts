// Proves the Build 22 backfill reconstruction (scripts/lib/backfill-pole-evidence.ts's
// presentedChoicesFromAwardRows, feeding into the real buildPoleEvidenceForPresentedQuestion)
// produces output IDENTICAL to what the live submission path would have written, for the same
// (question, every choice's awards, chosen answer) -- this is the correctness bar for both the
// quiz and Daily backfill scripts: reconstruct from real stored data using the SAME function
// the live path uses, never a second, separately-written algorithm that could drift.
//
// Run with: npx tsx scripts/validate-backfill-equivalence.ts

import { buildPoleEvidenceForPresentedQuestion, type PresentedChoice } from '../src/data/personality-v2/scoring-engine';
import { presentedChoicesFromAwardRows, type AwardRow } from './lib/backfill-pole-evidence';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// A realistic question: 4 choices, several poles, one choice offering the SAME pole at a
// higher point value than the chosen one -- exactly the case that makes max_available differ
// from points_earned, and the case a naive "just score the chosen choice" backfill would get
// wrong (it would silently set max_available = points_earned instead of the real ceiling).
const liveChoices: PresentedChoice[] = [
  { choiceId: 'a', awards: [{ pole: 'forgiving_receipts:positive', points: 1 }] },
  { choiceId: 'b', awards: [{ pole: 'forgiving_receipts:negative', points: 2 }] },
  { choiceId: 'c', awards: [{ pole: 'forgiving_receipts:negative', points: 3 }, { pole: 'direct_indirect:positive', points: 1 }] },
  { choiceId: 'd', awards: [] },
];
const chosenChoiceId = 'b';
const common = {
  userId: 'u1',
  sourceType: 'quiz_result' as const,
  sourceId: 'result-1',
  questionStableId: 'petty:q3',
  occurredAt: '2026-10-02T23:33:13.908Z', // matches the real sample completed_at shape seen in production
};

const liveRows = buildPoleEvidenceForPresentedQuestion({ ...common, choices: liveChoices, chosenChoiceId });

// The backfill's actual inputs: flat award rows, exactly as a SELECT against
// quiz_choice_pole_awards for (quiz_id, question_id) would return -- every choice, not just
// the chosen one -- plus the chosen choice_id read from quiz_results.answers.
const flatAwardRows: AwardRow[] = [
  { choiceId: 'a', poleId: 'forgiving_receipts:positive', points: 1 },
  { choiceId: 'b', poleId: 'forgiving_receipts:negative', points: 2 },
  { choiceId: 'c', poleId: 'forgiving_receipts:negative', points: 3 },
  { choiceId: 'c', poleId: 'direct_indirect:positive', points: 1 },
];
const reconstructedChoices = presentedChoicesFromAwardRows(flatAwardRows);
const backfilledRows = buildPoleEvidenceForPresentedQuestion({ ...common, choices: reconstructedChoices, chosenChoiceId });

const sortRows = (rows: typeof liveRows) => [...rows].sort((a, b) => a.poleId.localeCompare(b.poleId));
const liveSorted = sortRows(liveRows);
const backfilledSorted = sortRows(backfilledRows);

assert(liveSorted.length === backfilledSorted.length, `same number of pole rows produced (live=${liveSorted.length}, backfilled=${backfilledSorted.length})`);
for (let i = 0; i < liveSorted.length; i += 1) {
  const live = liveSorted[i];
  const backfilled = backfilledSorted[i];
  assert(live.poleId === backfilled.poleId, `row ${i}: same poleId (live=${live.poleId}, backfilled=${backfilled.poleId})`);
  assert(live.pointsEarned === backfilled.pointsEarned, `${live.poleId}: pointsEarned matches (live=${live.pointsEarned}, backfilled=${backfilled.pointsEarned})`);
  assert(
    live.maxAvailable === backfilled.maxAvailable,
    `${live.poleId}: maxAvailable reflects the BEST choice across the whole question, not just the chosen one (live=${live.maxAvailable}, backfilled=${backfilled.maxAvailable})`,
  );
}

// The specific case this test exists to catch: forgiving_receipts:negative's max_available
// must be 3 (choice c's offer), even though the chosen choice (b) only earned 2.
const negativeRow = backfilledSorted.find((r) => r.poleId === 'forgiving_receipts:negative');
assert(negativeRow?.pointsEarned === 2 && negativeRow?.maxAvailable === 3, `forgiving_receipts:negative: earned 2 (from choice b), available 3 (from choice c's higher offer) -- got earned=${negativeRow?.pointsEarned}, available=${negativeRow?.maxAvailable}`);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL backfill/live reconstruction equivalence (points_earned, max_available scanning every choice, not just the chosen one) VALIDATION CHECKS PASSED.');
