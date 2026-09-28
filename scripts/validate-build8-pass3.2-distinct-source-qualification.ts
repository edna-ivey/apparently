// SUPERSEDED by the Bible v1.4 qualification-foundation reconciliation pass. Run with:
//
//   npx tsx scripts/validate-build8-pass3.2-distinct-source-qualification.ts
//
// Build 8 Pass 3.2 originally qualified a Private dimension by counting DISTINCT behavioral
// sources (>= 1 distinct quiz_result source, OR >= 2 distinct daily_answer sources) rather than
// a raw evidence-row/item count. That rule did not match Bible v1.4 §15A/§43, which instead
// requires >= 3 active cumulative RAW EVIDENCE POINTS toward a dimension's winning pole --
// source count plays no role at all in the approved model. The distinct-source rule has been
// retired (isPrivateSignalQualified no longer exists; see private-signals.ts's own header
// comment and personality.ts's resolveActiveBoardPole/isActiveBoardQualified for the real,
// shared rule now used by both Core and Private).
//
// This file is kept (not deleted) as a regression guard: it proves the retired function is
// truly gone, and re-runs several of Pass 3.2's ORIGINAL named scenarios against the NEW rule,
// documenting explicitly where the outcome is now DIFFERENT from what Pass 3.2 originally
// asserted (source count and raw-point totals disagree in several of them by design -- that
// disagreement is exactly why the rule needed to change). The full required Bible v1.4 test
// matrix (raw within-quiz qualification, permanent quiz awards, active-board qualification,
// opposite-pole resolution/tie-breaks, Core/Private separation) lives in
// scripts/validate-build8-pass4-bible-qualification-reconciliation.ts.

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { isActiveBoardQualified, scorePersonalityProfile, type PersonalityAnswerEvidence } from '../src/data/personality';
import { selectStrongestPrivateSignals, selectRelicSlots } from '../src/data/private-signals';

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
// REGRESSION GUARD: the retired rule must never come back.
// ============================================================================================

const privateSignalsSource = read('../src/data/private-signals.ts');
const personalitySource = read('../src/data/personality.ts');
assert(!/isPrivateSignalQualified/.test(privateSignalsSource), 'the retired distinct-source qualification function does not exist in private-signals.ts');
assert(!/isPrivateSignalQualified/.test(personalitySource), 'the retired distinct-source qualification function does not exist in personality.ts');
assert(
  /export const isActiveBoardQualified/.test(personalitySource) && /export const resolveActiveBoardPole/.test(personalitySource),
  'the Bible v1.4 replacement (active-board qualification) is exported from personality.ts',
);

// ============================================================================================
// PASS 3.2 SCENARIO 2 RE-RUN: "one Daily source with one evidence row" -- unqualified under
// BOTH the old and new rule (1 source / 2 raw points, both below their respective thresholds).
// Same outcome, different reason.
// ============================================================================================

const dailyAnswer = (sourceId: string, dimension: PersonalityAnswerEvidence['effects'][number]['dimension'], value: -2 | -1 | 1 | 2, occurredAt: string, question = 'q'): PersonalityAnswerEvidence => ({
  question,
  category: 'Hidden You',
  chosenAnswer: 'option',
  sourceType: 'daily_answer',
  sourceId,
  occurredAt,
  effects: [{ dimension, value }],
});

const quizResult = (sourceId: string, dimension: PersonalityAnswerEvidence['effects'][number]['dimension'], value: -2 | -1 | 1 | 2, occurredAt: string, question = 'result'): PersonalityAnswerEvidence => ({
  question,
  category: 'The Good Stuff',
  chosenAnswer: 'result',
  sourceType: 'quiz_result',
  sourceId,
  occurredAt,
  effects: [{ dimension, value }],
});

const oneDailyOneRow = scorePersonalityProfile([dailyAnswer('daily-source-A', 'tactful_blunt', -2, '2026-01-01T00:00:00.000Z')]);
const oneDailyOneRowDim = oneDailyOneRow.dimensions.find((d) => d.dimension === 'tactful_blunt')!;
assert(!isActiveBoardQualified(oneDailyOneRowDim.evidence), 'SAME outcome as Pass 3.2: one Daily source, one row (2 raw points) is still unqualified');
assert(selectStrongestPrivateSignals(oneDailyOneRow).length === 0, 'and correctly does not surface in the selector');

// ============================================================================================
// PASS 3.2 SCENARIO 4 RE-RUN: "two DIFFERENT Daily source IDs" -- qualified under BOTH rules
// here (2 distinct sources -> old rule qualifies; 4 raw points -> new rule also qualifies) --
// but for a different reason, and NOT a general guarantee (see the DIFFERENT case just below).
// ============================================================================================

const twoDifferentDailySources = scorePersonalityProfile([
  dailyAnswer('daily-source-B1', 'tactful_blunt', -2, '2026-01-01T00:00:00.000Z', 'day 1'),
  dailyAnswer('daily-source-B2', 'tactful_blunt', -2, '2026-01-02T00:00:00.000Z', 'day 2'),
]);
const twoDailySignals = selectStrongestPrivateSignals(twoDifferentDailySources);
assert(twoDailySignals.length === 1 && twoDailySignals[0]?.dimension === 'tactful_blunt', 'two different Daily sources totalling 4 raw points still qualify under the new rule too');
assert(selectRelicSlots(twoDailySignals).relicTrait !== null, 'and the Relic slot resolves once qualified');

// ============================================================================================
// PASS 3.2 SCENARIO 5 RE-RUN: "one quiz_result source" -- this is where the rules now DISAGREE.
// Pass 3.2 asserted this qualifies immediately (>= 1 distinct quiz_result source). Under the
// Bible's raw-point rule, a single quiz_result contributing only 2 raw points does NOT
// qualify -- exactly the behavior change this reconciliation pass makes.
// ============================================================================================

const oneQuizSource = scorePersonalityProfile([quizResult('quiz-source-C', 'vulnerable_armored', -2, '2026-01-01T00:00:00.000Z')]);
assert(
  selectStrongestPrivateSignals(oneQuizSource).length === 0,
  'DIFFERENT outcome from Pass 3.2: one quiz_result source contributing only 2 raw points does NOT qualify under Bible v1.4 (Pass 3.2 would have qualified this immediately -- that was the non-compliant behavior)',
);

// ============================================================================================
// PASS 3.2 SCENARIO 7 RE-RUN: "quiz + Daily together" -- qualifies under both rules (1 source
// each -> old rule qualifies; -2 + -1 = 3 raw points -> new rule also qualifies at exactly the
// threshold).
// ============================================================================================

const quizPlusDaily = scorePersonalityProfile([
  dailyAnswer('daily-source-D', 'repair_punishing', -2, '2026-01-01T00:00:00.000Z'),
  quizResult('quiz-source-D', 'repair_punishing', -1, '2026-01-02T00:00:00.000Z'),
]);
assert(
  selectStrongestPrivateSignals(quizPlusDaily).some((s) => s.dimension === 'repair_punishing'),
  '1 quiz source (-1) + 1 Daily source (-2) together reach exactly 3 raw points and qualify under the new rule too',
);

// ============================================================================================
// RAW EVIDENCE REMAINS INTACT (qualification never deletes/suppresses stored evidence) --
// unchanged guarantee, re-confirmed.
// ============================================================================================

assert(
  oneDailyOneRow.dimensions.find((d) => d.dimension === 'tactful_blunt')?.evidenceCount === 1,
  'the unqualified single-Daily-source dimension is still fully present in profile.dimensions with its real evidenceCount',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 3.2 SUPERSESSION checks passed -- distinct-source qualification is gone; Bible v1.4 raw-point qualification is confirmed in its place.');
