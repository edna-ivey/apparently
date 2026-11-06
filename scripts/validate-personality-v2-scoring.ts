// End-to-end validation for the Build 16 personality scoring V2 engine (src/data/
// personality-v2/*.ts) against the locked product rules: positive-only independent-pole
// evidence, user-specific per-question max opportunity, 9-point eligibility, earned-percentage
// ranking with a raw-points tiebreak, replay/duplicate-scenario non-inflation, and historical
// evidence retention. Covers automated-test requirements #1-4, #6-12 from the Build 16/V2
// brief that are testable at the pure-engine level (requirements #5/13-20 depend on
// content/UI/server integration -- see the brief's own numbering and this repo's other
// validate-*.ts scripts for those). Run with:
//
//   npx tsx scripts/validate-personality-v2-scoring.ts

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { ALL_POLE_IDS, buildPoleId } from '../src/data/personality-v2/pole-ids';
import {
  buildPoleEvidenceForPresentedQuestion,
  computeAllPoleStats,
  ELIGIBILITY_THRESHOLD,
  rankPoles,
  type PoleEvidenceRow,
  type PresentedChoice,
} from '../src/data/personality-v2/scoring-engine';
import { computeDailyScenarioFingerprint } from '../src/data/personality-v2/daily-scenario-fingerprint';
import { toSignatureTraits } from '../src/data/personality-v2/signature-adapter';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const USER = 'user-1';
const DIRECT = buildPoleId('direct_indirect', 'positive');
const INDIRECT = buildPoleId('direct_indirect', 'negative');
const PLAYFUL = buildPoleId('playful_serious', 'positive');
const SERIOUS = buildPoleId('playful_serious', 'negative');

const row = (overrides: Partial<PoleEvidenceRow> & Pick<PoleEvidenceRow, 'sourceId' | 'questionStableId' | 'poleId' | 'pointsEarned' | 'maxAvailable'>): PoleEvidenceRow => ({
  userId: USER,
  sourceType: 'quiz_result',
  choiceStableId: 'c',
  scoringVersion: 'v2.0',
  occurredAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

// ============================================================================================
// #1 — Direct and Indirect both earn points independently (opposite poles, same dimension,
// from DIFFERENT answers). #2 — never subtracted from each other.
// ============================================================================================

{
  const rows: PoleEvidenceRow[] = [
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's2', questionStableId: 'q2', poleId: INDIRECT, pointsEarned: 2, maxAvailable: 2 }),
  ];
  const stats = computeAllPoleStats(rows);
  const direct = stats.find((s) => s.poleId === DIRECT)!;
  const indirect = stats.find((s) => s.poleId === INDIRECT)!;
  assert(direct.lifetimeEarned === 3, `#1: Direct earns its own 3 points independently (got ${direct.lifetimeEarned})`);
  assert(indirect.lifetimeEarned === 2, `#1: Indirect earns its own 2 points independently (got ${indirect.lifetimeEarned})`);
  assert(direct.lifetimeEarned === 3 && indirect.lifetimeEarned === 2, '#2: neither pole\'s total was reduced by the other\'s evidence (no opposite-pole subtraction)');
}

// ============================================================================================
// #3 — zero-earned opportunities still increase the denominator. #4 — max opportunity uses the
// best SINGLE choice per question, never a sum across mutually exclusive choices.
// ============================================================================================

{
  const choices: PresentedChoice[] = [
    { choiceId: 'a', awards: [{ pole: DIRECT, points: 3 }] },
    { choiceId: 'b', awards: [{ pole: INDIRECT, points: 2 }] },
    { choiceId: 'c', awards: [] },
  ];
  const rows = buildPoleEvidenceForPresentedQuestion({
    userId: USER,
    sourceType: 'quiz_result',
    sourceId: 's1',
    questionStableId: 'q1',
    choices,
    chosenChoiceId: 'c',
    occurredAt: '2026-01-01T00:00:00.000Z',
  });
  const directRow = rows.find((r) => r.poleId === DIRECT)!;
  const indirectRow = rows.find((r) => r.poleId === INDIRECT)!;
  assert(directRow.pointsEarned === 0 && directRow.maxAvailable === 3, '#3: choosing "c" still records a Direct opportunity (earned 0, max 3) -- the denominator sees it even though nothing was earned');
  assert(indirectRow.pointsEarned === 0 && indirectRow.maxAvailable === 2, '#3: same for Indirect (earned 0, max 2)');
  assert(directRow.maxAvailable === 3, '#4: max available for Direct is the single best choice\'s points (3), never summed across choices');

  const multiAwardChoices: PresentedChoice[] = [
    { choiceId: 'a', awards: [{ pole: DIRECT, points: 1 }] },
    { choiceId: 'b', awards: [{ pole: DIRECT, points: 3 }] },
  ];
  const maxRows = buildPoleEvidenceForPresentedQuestion({
    userId: USER,
    sourceType: 'quiz_result',
    sourceId: 's2',
    questionStableId: 'q2',
    choices: multiAwardChoices,
    chosenChoiceId: 'a',
    occurredAt: '2026-01-01T00:00:00.000Z',
  });
  assert(maxRows.find((r) => r.poleId === DIRECT)?.maxAvailable === 3, '#4: max available is the BEST choice\'s points (3) even when the user picked the weaker choice (earned only 1)');
}

// ============================================================================================
// #5 (threshold) and #6 (3 distinct questions) — nine-point eligibility, and the structural
// guarantee that reaching it requires at least 3 distinct questions (max 3 pts/question).
// ============================================================================================

{
  const twoQuestions: PoleEvidenceRow[] = [
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's2', questionStableId: 'q2', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const twoQStats = computeAllPoleStats(twoQuestions).find((s) => s.poleId === DIRECT)!;
  assert(twoQStats.lifetimeEarned === 6 && !twoQStats.eligible, `threshold: 6 points from 2 questions is below the ${ELIGIBILITY_THRESHOLD}-point threshold (not eligible)`);

  const threeQuestions: PoleEvidenceRow[] = [
    ...twoQuestions,
    row({ sourceId: 's3', questionStableId: 'q3', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const threeQStats = computeAllPoleStats(threeQuestions).find((s) => s.poleId === DIRECT)!;
  assert(threeQStats.lifetimeEarned === 9 && threeQStats.eligible, '#5: exactly 9 points reaches eligibility');
  assert(threeQStats.distinctQuestionsWithEarnedPoints === 3, '#6: eligibility at the minimum (9 pts) was reached via exactly 3 distinct questions, matching the structural "3 questions minimum" guarantee');
}

// ============================================================================================
// #7 — replaying the same question (same questionStableId, new sourceId/occurredAt) does not
// inflate lifetime earned points or the denominator.
// ============================================================================================

{
  const original: PoleEvidenceRow[] = [
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3, occurredAt: '2026-01-01T00:00:00.000Z' }),
    row({ sourceId: 's2', questionStableId: 'q2', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3, occurredAt: '2026-01-02T00:00:00.000Z' }),
    row({ sourceId: 's3', questionStableId: 'q3', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3, occurredAt: '2026-01-03T00:00:00.000Z' }),
  ];
  const withReplay: PoleEvidenceRow[] = [
    ...original,
    // A "replay" of q1 (same questionStableId), later in time, under a brand new sourceId.
    row({ sourceId: 's1-replay', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3, occurredAt: '2026-02-01T00:00:00.000Z' }),
  ];
  const before = computeAllPoleStats(original).find((s) => s.poleId === DIRECT)!;
  const after = computeAllPoleStats(withReplay).find((s) => s.poleId === DIRECT)!;
  assert(before.lifetimeEarned === after.lifetimeEarned && before.maxAvailableForUser === after.maxAvailableForUser, `#7: replaying q1 did not change lifetime earned (${before.lifetimeEarned} -> ${after.lifetimeEarned}) or the denominator (${before.maxAvailableForUser} -> ${after.maxAvailableForUser})`);
}

// ============================================================================================
// #8 — duplicate Daily scenario identities (same scenario, different database question ids)
// do not inflate evidence, because they fingerprint to the same questionStableId.
// ============================================================================================

{
  const fingerprintA = computeDailyScenarioFingerprint('A friend is late to something important. What do you do?', ['Ask for an update and stay calm.', 'Leave without them.', 'Text them repeatedly.', 'Shrug it off.']);
  const fingerprintAReorderedAndRetyped = computeDailyScenarioFingerprint('A FRIEND is late to something important.   What do you do?', ['Shrug it off.', 'Text them repeatedly.', 'Leave without them.', 'Ask for an update and stay calm.']);
  const fingerprintDifferentScenario = computeDailyScenarioFingerprint('Your best friend is dating someone you cannot stand. What do you do?', ['Tell them immediately.', 'Say nothing.', 'Hint at it.', 'Ask a mutual friend to say something.']);
  assert(fingerprintA === fingerprintAReorderedAndRetyped, '#8: the same Daily scenario (reordered options, trivial casing/whitespace differences) fingerprints identically');
  assert(fingerprintA !== fingerprintDifferentScenario, '#8: a genuinely different scenario fingerprints differently');

  const duplicatedDbRows: PoleEvidenceRow[] = [
    row({ sourceId: 'daily-db-id-1', questionStableId: fingerprintA, poleId: PLAYFUL, pointsEarned: 2, maxAvailable: 2, sourceType: 'daily_answer', occurredAt: '2026-01-01T00:00:00.000Z' }),
    // The same real-world scenario, re-entered under a different database question id months
    // later -- same questionStableId, so dedupeForRanking treats it as the same question.
    row({ sourceId: 'daily-db-id-2', questionStableId: fingerprintA, poleId: PLAYFUL, pointsEarned: 2, maxAvailable: 2, sourceType: 'daily_answer', occurredAt: '2026-05-01T00:00:00.000Z' }),
  ];
  const dupStats = computeAllPoleStats(duplicatedDbRows).find((s) => s.poleId === PLAYFUL)!;
  assert(dupStats.lifetimeEarned === 2 && dupStats.distinctQuestionsWithEarnedPoints === 1, `#8: two different DB question ids for the same scenario count as ONE question for ranking (earned ${dupStats.lifetimeEarned}, distinct questions ${dupStats.distinctQuestionsWithEarnedPoints})`);
}

// ============================================================================================
// #9 — earned percentage outranks raw points. #10 — raw points break an earned-percentage
// tie. Stable ranking when exact ties remain (final deterministic tiebreak).
// ============================================================================================

{
  const rows: PoleEvidenceRow[] = [
    // Direct: 15/15 = 100%.
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's2', questionStableId: 'q2', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's3', questionStableId: 'q3', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's4', questionStableId: 'q4', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's5', questionStableId: 'q5', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    // Playful: 30/45 = 66.7%, more RAW points than Direct but a lower rate.
    row({ sourceId: 's6', questionStableId: 'q6', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's7', questionStableId: 'q7', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's8', questionStableId: 'q8', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's9', questionStableId: 'q9', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's10', questionStableId: 'q10', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's11', questionStableId: 'q11', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's12', questionStableId: 'q12', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's13', questionStableId: 'q13', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's14', questionStableId: 'q14', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's15', questionStableId: 'q15', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    // 5 more presented questions where Playful was offered (max 3) but NOT chosen (earned 0) --
    // real zero-earned opportunities, same as any other pole -- bringing Playful's denominator
    // to 45 without ever exceeding the real per-question cap of 3.
    row({ sourceId: 's16', questionStableId: 'q16', poleId: PLAYFUL, pointsEarned: 0, maxAvailable: 3 }),
    row({ sourceId: 's17', questionStableId: 'q17', poleId: PLAYFUL, pointsEarned: 0, maxAvailable: 3 }),
    row({ sourceId: 's18', questionStableId: 'q18', poleId: PLAYFUL, pointsEarned: 0, maxAvailable: 3 }),
    row({ sourceId: 's19', questionStableId: 'q19', poleId: PLAYFUL, pointsEarned: 0, maxAvailable: 3 }),
    row({ sourceId: 's20', questionStableId: 'q20', poleId: PLAYFUL, pointsEarned: 0, maxAvailable: 3 }),
  ];
  const ranked = rankPoles(rows);
  const directRank = ranked.find((r) => r.poleId === DIRECT)!;
  const playfulRank = ranked.find((r) => r.poleId === PLAYFUL)!;
  assert(directRank.lifetimeEarned === 15 && directRank.maxAvailableForUser === 15, 'setup: Direct is 15/15');
  assert(playfulRank.lifetimeEarned === 30 && playfulRank.maxAvailableForUser === 45, 'setup: Playful is 30/45');
  assert(directRank.rank < playfulRank.rank, `#9: Direct (15/15 = 100%) outranks Playful (30/45 = 66.7%) despite Playful's higher raw total -- exactly the brief's own "15/15 should outrank 30/45" example`);

  // #10 — exact earned-percentage tie, broken by raw points.
  const tieRows: PoleEvidenceRow[] = [
    row({ sourceId: 't1', questionStableId: 'tq1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't2', questionStableId: 'tq2', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't3', questionStableId: 'tq3', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't4', questionStableId: 'tq4', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't5', questionStableId: 'tq5', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't6', questionStableId: 'tq6', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 't7', questionStableId: 'tq7', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const tieRanked = rankPoles(tieRows);
  const tieDirect = tieRanked.find((r) => r.poleId === DIRECT)!;
  const tiePlayful = tieRanked.find((r) => r.poleId === PLAYFUL)!;
  assert(tieDirect.earnedPercent === tiePlayful.earnedPercent && tieDirect.earnedPercent === 1, 'setup: Direct and Playful are both 100% earned');
  assert(tiePlayful.rank < tieDirect.rank, `#10: with percentages tied at 100%, Playful (12 raw pts) outranks Direct (9 raw pts) -- raw points broke the tie`);

  // Exact tie on BOTH earned percentage and raw points -- final deterministic tiebreak.
  const exactTieRows: PoleEvidenceRow[] = [
    row({ sourceId: 'e1', questionStableId: 'eq1', poleId: SERIOUS, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 'e2', questionStableId: 'eq2', poleId: SERIOUS, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 'e3', questionStableId: 'eq3', poleId: SERIOUS, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 'e4', questionStableId: 'eq4', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 'e5', questionStableId: 'eq5', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 'e6', questionStableId: 'eq6', poleId: PLAYFUL, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const exactTieRanked1 = rankPoles(exactTieRows);
  const exactTieRanked2 = rankPoles([...exactTieRows].reverse());
  assert(JSON.stringify(exactTieRanked1) === JSON.stringify(exactTieRanked2), '#11 stability: an exact earned%/raw-points tie resolves identically regardless of input row order (fixed canonical pole order as the final tiebreak)');
}

// ============================================================================================
// #12 — historical evidence is retained: every row survives dedupeForRanking's underlying
// data (nothing is deleted), even though only the earliest counts toward ranking. Verified by
// confirming computeAllPoleStats over the ORIGINAL (non-deduped) input is driven by the same
// rows whether or not a later duplicate exists -- i.e. the function never mutates or discards
// its input array.
// ============================================================================================

{
  const originalRows: PoleEvidenceRow[] = [
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const frozenCopy = JSON.parse(JSON.stringify(originalRows));
  computeAllPoleStats(originalRows);
  rankPoles(originalRows);
  assert(JSON.stringify(originalRows) === JSON.stringify(frozenCopy), '#12: computeAllPoleStats/rankPoles never mutate the raw evidence rows passed in -- the full historical row set survives untouched for the caller to persist/display in full');
}

// ============================================================================================
// #13 (restart) — pure functions of their input only: calling twice on identical data
// produces identical output (no hidden state, no Date.now()/Math.random() dependency).
// ============================================================================================

{
  const rows: PoleEvidenceRow[] = ALL_POLE_IDS.slice(0, 2).flatMap((poleId, i) => [
    row({ sourceId: `r${i}-1`, questionStableId: `rq${i}-1`, poleId, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: `r${i}-2`, questionStableId: `rq${i}-2`, poleId, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: `r${i}-3`, questionStableId: `rq${i}-3`, poleId, pointsEarned: 3, maxAvailable: 3 }),
  ]);
  const first = rankPoles(rows);
  const second = rankPoles(rows);
  assert(JSON.stringify(first) === JSON.stringify(second), '#13: rankPoles is a pure function of its input -- repeated calls (simulating app restarts) produce identical results');

  const engineSource = readFileSync(join(__dirname, '../src/data/personality-v2/scoring-engine.ts'), 'utf8');
  assert(!/Math\.random|Date\.now/.test(engineSource), 'scoring-engine.ts contains no Math.random/Date.now -- fully deterministic');
}

// ============================================================================================
// Compatibility bridge — V2 ranked output maps onto the exact SignatureTrait[] shape every
// existing Creature/Your-Signature consumer already reads, with no changes required to those
// consumers (see signature-adapter.ts's own header comment for why this is safe).
// ============================================================================================

{
  const rows: PoleEvidenceRow[] = [
    row({ sourceId: 's1', questionStableId: 'q1', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's2', questionStableId: 'q2', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
    row({ sourceId: 's3', questionStableId: 'q3', poleId: DIRECT, pointsEarned: 3, maxAvailable: 3 }),
  ];
  const traits = toSignatureTraits(rankPoles(rows));
  assert(traits.length === 1 && traits[0].id === 'direct_indirect' && traits[0].name === 'Direct', 'bridge: V2 ranked output converts to a valid SignatureTrait (id/name resolve exactly like the live engine\'s own output)');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL personality scoring V2 engine (independent poles, no subtraction, zero-earned opportunities, 9-point eligibility, replay/duplicate-scenario non-inflation, earned%/raw-points ranking, stability, determinism, SignatureTrait bridge) VALIDATION CHECKS PASSED.');
