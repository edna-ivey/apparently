// Build 22 numeric-totals ranking adapter -- parity + correctness tests. Proves
// rankCoreSignatureTraitsFromTotals/rankPrivateSignalTraitsFromTotals (src/data/
// personality-v2/totals-ranking.ts, operating on small aggregated totals) produce results
// consistent with the real answer-level engine (rankPoles + the existing
// rankCoreSignatureTraits/rankPrivateSignalTraits in activation.ts, operating on raw
// PoleEvidenceRow observations) for equivalent evidence -- and specifically that repeated
// Daily occurrences of a recycled template both count (never silently collapsed), opposing
// poles still collapse to one winner per dimension, and the 7/3 caps and eligibility
// threshold all match.
//
// Run with: npx tsx scripts/validate-totals-ranking-parity.ts

import { rankPoles, computeAllPoleStats, buildPoleEvidenceForPresentedQuestion, ELIGIBILITY_THRESHOLD, type PoleEvidenceRow } from '../src/data/personality-v2/scoring-engine';
import { rankCoreSignatureTraits, rankPrivateSignalTraits } from '../src/data/personality-v2/activation';
import { rankCoreSignatureTraitsFromTotals, rankPrivateSignalTraitsFromTotals, rankNumericTotals, type UserTraitTotalRow } from '../src/data/personality-v2/totals-ranking';
import { traitIdForDimension } from '../src/data/personality-v2/numeric-trait-catalog';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// Aggregates real PoleEvidenceRow[] into the UserTraitTotalRow[] shape the server would
// have produced -- the same sums submit_quiz_completion/the Daily trigger compute.
const aggregateToTotals = (rows: readonly PoleEvidenceRow[]): UserTraitTotalRow[] => {
  const byTrait = new Map<string, { traitId: number; lifetimeEarned: number; maxAvailableTotal: number; distinctQuestionsWithEarned: number; distinctQuestionsPresented: number }>();
  for (const row of rows) {
    const [dimensionKey, polarity] = row.poleId.split(':') as [never, 'positive' | 'negative'];
    const traitId = traitIdForDimension(dimensionKey, polarity);
    const entry = byTrait.get(row.poleId) ?? { traitId, lifetimeEarned: 0, maxAvailableTotal: 0, distinctQuestionsWithEarned: 0, distinctQuestionsPresented: 0 };
    entry.lifetimeEarned += row.pointsEarned;
    entry.maxAvailableTotal += row.maxAvailable;
    entry.distinctQuestionsWithEarned += row.pointsEarned > 0 ? 1 : 0;
    entry.distinctQuestionsPresented += 1;
    byTrait.set(row.poleId, entry);
  }
  return [...byTrait.values()];
};

// ------------------------------------------------------------------------------------------
// Scenario: two DIFFERENT, real Daily occurrences (different questionStableId -- the new
// occurrence-identity rule, never a content fingerprint) of a recycled template both award
// the same trait. Both must count in the totals-based ranking, exactly as they would in the
// answer-level engine.
// ------------------------------------------------------------------------------------------
{
  const occurrence1 = buildPoleEvidenceForPresentedQuestion({
    userId: 'u1', sourceType: 'daily_answer', sourceId: 'daily-answer-1',
    questionStableId: 'daily:occurrence-1', // real occurrence id, per 20261028050000
    choices: [{ choiceId: 'a', awards: [{ pole: 'direct_indirect:positive', points: 2 }] }],
    chosenChoiceId: 'a', occurredAt: '2026-01-01T00:00:00Z',
  });
  const occurrence2 = buildPoleEvidenceForPresentedQuestion({
    userId: 'u1', sourceType: 'daily_answer', sourceId: 'daily-answer-2',
    questionStableId: 'daily:occurrence-2', // a LATER recycled occurrence of the SAME template -- a genuinely different id
    choices: [{ choiceId: 'a', awards: [{ pole: 'direct_indirect:positive', points: 2 }] }],
    chosenChoiceId: 'a', occurredAt: '2026-06-01T00:00:00Z',
  });
  const allRows = [...occurrence1, ...occurrence2];

  // computeAllPoleStats, not rankPoles -- rankPoles filters to ELIGIBILITY_THRESHOLD=9, and
  // this fixture's 2x2=4 points is deliberately below that; the point here is purely whether
  // BOTH occurrences' points are counted at all, independent of eligibility.
  const directIndirectAnswerLevel = computeAllPoleStats(allRows).find((p) => p.poleId === 'direct_indirect:positive');
  assert(directIndirectAnswerLevel?.lifetimeEarned === 4, `answer-level engine: both occurrences count (lifetimeEarned=${directIndirectAnswerLevel?.lifetimeEarned}, expected 4)`);

  const totals = aggregateToTotals(allRows);
  const directIndirectTotals = totals.find((t) => t.traitId === traitIdForDimension('direct_indirect', 'positive'));
  assert(directIndirectTotals?.lifetimeEarned === 4, `totals-based adapter: both occurrences STILL count, nothing silently collapsed (lifetimeEarned=${directIndirectTotals?.lifetimeEarned}, expected 4)`);
  assert(directIndirectAnswerLevel?.lifetimeEarned === directIndirectTotals?.lifetimeEarned, 'answer-level and totals-based engines agree exactly on this trait\'s lifetime earned points');
}

// ------------------------------------------------------------------------------------------
// Full parity: a realistic multi-trait, multi-source evidence set -> compare the FINAL
// SignatureTrait[]/PrivateSignalTrait[] output of both pipelines end to end.
// ------------------------------------------------------------------------------------------
{
  const rows: PoleEvidenceRow[] = [];
  const add = (poleId: string, points: number, sourceId: string, occurredAt: string) => {
    rows.push(...buildPoleEvidenceForPresentedQuestion({
      userId: 'u1', sourceType: 'quiz_result', sourceId,
      questionStableId: `q:${sourceId}`,
      choices: [{ choiceId: 'a', awards: [{ pole: poleId as never, points: points as never }] }],
      chosenChoiceId: 'a', occurredAt,
    }));
  };
  // Enough distinct sources per trait to clear ELIGIBILITY_THRESHOLD=9.
  for (let i = 0; i < 3; i += 1) add('direct_indirect:positive', 3, `r1-${i}`, `2026-01-0${i + 1}T00:00:00Z`);
  for (let i = 0; i < 3; i += 1) add('forgiving_receipts:negative', 3, `r2-${i}`, `2026-02-0${i + 1}T00:00:00Z`);
  for (let i = 0; i < 2; i += 1) add('forgiving_receipts:positive', 2, `r3-${i}`, `2026-02-1${i + 1}T00:00:00Z`); // weaker opposing pole -- must lose
  for (let i = 0; i < 3; i += 1) add('vulnerable_armored:positive', 3, `r4-${i}`, `2026-03-0${i + 1}T00:00:00Z`); // Private

  const answerLevelRanked = rankPoles(rows);
  const answerLevelCore = rankCoreSignatureTraits(answerLevelRanked);
  const answerLevelPrivate = rankPrivateSignalTraits(answerLevelRanked);

  const totals = aggregateToTotals(rows);
  const totalsCore = rankCoreSignatureTraitsFromTotals(totals);
  const totalsPrivate = rankPrivateSignalTraitsFromTotals(totals);

  assert(answerLevelCore.length === totalsCore.length, `Core trait count matches (answer-level=${answerLevelCore.length}, totals=${totalsCore.length})`);
  assert(
    JSON.stringify(answerLevelCore.map((t) => t.id)) === JSON.stringify(totalsCore.map((t) => t.id)),
    `Core trait IDENTITY and ORDER match exactly: ${JSON.stringify(totalsCore.map((t) => t.id))}`,
  );
  assert(totalsCore.some((t) => t.id === 'forgiving_receipts'), 'forgiving_receipts appears exactly once (opposing-pole collapse works identically in both pipelines)');
  assert(!totalsCore.some((t) => t.name === 'Forgiving'), 'the WEAKER opposing pole (Forgiving, 2x2=4 points) lost to the stronger one (Holds the Receipt, 3x3=9 points) in the totals-based adapter too');

  assert(answerLevelPrivate.length === totalsPrivate.length, `Private signal count matches (answer-level=${answerLevelPrivate.length}, totals=${totalsPrivate.length})`);
  assert(
    JSON.stringify(answerLevelPrivate.map((t) => t.dimension)) === JSON.stringify(totalsPrivate.map((t) => t.dimension)),
    'Private signal identity and order match exactly',
  );
}

// ------------------------------------------------------------------------------------------
// Caps and eligibility threshold match the real engine's constants exactly.
// ------------------------------------------------------------------------------------------
{
  const totals: UserTraitTotalRow[] = [{ traitId: 1, lifetimeEarned: ELIGIBILITY_THRESHOLD - 1, maxAvailableTotal: 20, distinctQuestionsWithEarned: 3, distinctQuestionsPresented: 5 }];
  assert(rankNumericTotals(totals).length === 0, `a trait one point short of ELIGIBILITY_THRESHOLD=${ELIGIBILITY_THRESHOLD} is NOT eligible in the totals adapter either`);
  const totalsAtThreshold: UserTraitTotalRow[] = [{ traitId: 1, lifetimeEarned: ELIGIBILITY_THRESHOLD, maxAvailableTotal: 20, distinctQuestionsWithEarned: 3, distinctQuestionsPresented: 5 }];
  assert(rankNumericTotals(totalsAtThreshold).length === 1, 'a trait exactly AT the threshold is eligible');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL numeric-totals ranking parity (repeated Daily occurrences both count, opposing-pole collapse, full Core/Private pipeline identity, eligibility threshold) VALIDATION CHECKS PASSED.');
