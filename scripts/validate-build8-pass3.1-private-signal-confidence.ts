// Focused validation for Build 8 Pass 3.1: The Undercurrent must represent a PATTERN, not one
// weak, isolated observation. Run with:
//
//   npx tsx scripts/validate-build8-pass3.1-private-signal-confidence.ts
//
// REVISED in the Bible v1.4 qualification-foundation reconciliation pass: Pass 3.1/3.2
// originally qualified a Private dimension by counting DISTINCT SOURCES (>=1 quiz_result OR
// >=2 daily_answer sources). That rule has been retired -- see private-signals.ts's own header
// comment. This file now proves the SAME product intent ("a pattern, not one weak
// observation") holds under the Bible's actual rule: >= 3 active cumulative RAW EVIDENCE
// POINTS toward a dimension's winning pole (personality.ts's resolveActiveBoardPole /
// isActiveBoardQualified / DimensionResult.activeBoardQualified), which is now shared
// identically by Core (Your Signature) and Private (The Undercurrent).
//
// Imports the real functions directly (personality.ts, private-signals.ts are RN-free by
// design — same established convention as every other validate-build8-*.ts script).

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { isActiveBoardQualified, isCoreDimension, scorePersonalityProfile, type PersonalityAnswerEvidence } from '../src/data/personality';
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
// PRIVATE QUIZ EVIDENCE -- one quiz_result alone reaching 3 raw points DOES qualify; reaching
// only 2 does NOT (this is the concrete behavior change from the retired distinct-source rule,
// which used to qualify ANY single quiz_result source regardless of its point value).
// ============================================================================================

const oneQuizResultBelowThreshold = scorePersonalityProfile([
  { question: 'THE HYPE DEPARTMENT', category: 'The Good Stuff', chosenAnswer: 'result', sourceType: 'quiz_result', sourceId: 'quiz-result-1', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'supportive_challenging', value: 2 }] },
]);
assert(
  selectStrongestPrivateSignals(oneQuizResultBelowThreshold).length === 0,
  'a single quiz_result contributing only 2 raw points does NOT qualify (Bible v1.4: 3-point minimum, not "1 distinct source")',
);

const oneQuizResultAtThreshold = scorePersonalityProfile([
  { question: 'THE HYPE DEPARTMENT', category: 'The Good Stuff', chosenAnswer: 'result', sourceType: 'quiz_result', sourceId: 'quiz-result-1b', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'supportive_challenging', value: 2 }, { dimension: 'supportive_challenging', value: 1 }] },
]);
// (a real quiz_result never sends two effects for the same dimension in one payload, but
// scorePersonalityProfile itself is answer/effect-shaped, not payload-shaped -- this proves the
// threshold math itself, independent of that upstream invariant.)
const supportiveDim = oneQuizResultAtThreshold.dimensions.find((d) => d.dimension === 'supportive_challenging');
assert(supportiveDim !== undefined && isActiveBoardQualified(supportiveDim.evidence), 'reaching exactly 3 raw points (2+1) DOES qualify');
assert(selectStrongestPrivateSignals(oneQuizResultAtThreshold).some((s) => s.dimension === 'supportive_challenging'), 'and surfaces in The Undercurrent');

// 3. A quiz result mapped to BOTH Core and Private still sends Core evidence through Core
// architecture and Private evidence through Private architecture -- unaffected by the
// qualification gate (the gate only filters WHICH dimensions surface, never touches which
// evidence is recorded).
const bothTypesQuizResult = scorePersonalityProfile([
  {
    question: 'THE EMERGENCY CONTACT (real keep-you-around mapping)',
    category: 'The Good Stuff',
    chosenAnswer: 'result',
    sourceType: 'quiz_result',
    sourceId: 'quiz-result-2',
    occurredAt: '2026-01-01T00:00:00.000Z',
    effects: [
      { dimension: 'duty_first_self_preserving', value: 2 }, // Private
      { dimension: 'protective_hands_off', value: 1 }, // Core
      { dimension: 'practical_idealistic', value: 1 }, // Core
    ],
  },
]);
assert(
  bothTypesQuizResult.dimensions.find((d) => d.dimension === 'protective_hands_off')?.evidenceCount === 1,
  'Core evidence from a both-mapped quiz result reaches Core architecture (evidenceCount recorded)',
);

// ============================================================================================
// DAILY EVIDENCE
// ============================================================================================

// One Daily-only Private observation of value 2 (2 raw points, below the 3-point threshold)
// does NOT surface in The Undercurrent or resolve a Relic slot.
const oneDailyOnly = scorePersonalityProfile([
  { question: 'Private Daily prompt', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-1', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const oneDailySignals = selectStrongestPrivateSignals(oneDailyOnly);
assert(oneDailySignals.length === 0, `one isolated Daily observation below the 3-point threshold does NOT surface in The Undercurrent (got ${oneDailySignals.length})`);
assert(selectRelicSlots(oneDailySignals).relicTrait === null, 'and does NOT resolve any Relic slot');

// Two independent Daily observations of value -2 each (4 raw points, >= 3) DO qualify the
// dimension -- same outcome as the retired distinct-source rule here, but now for the right
// reason (raw points, not source count).
const twoDailyIndependent = scorePersonalityProfile([
  { question: 'Private Daily prompt, day 1', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-2', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'Private Daily prompt, day 2', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-3', occurredAt: '2026-01-02T00:00:00.000Z', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const twoDailySignals = selectStrongestPrivateSignals(twoDailyIndependent);
assert(twoDailySignals.length === 1 && twoDailySignals[0]?.dimension === 'tactful_blunt', 'two independent Daily observations totalling >= 3 raw points DO qualify');
assert(selectRelicSlots(twoDailySignals).relicTrait !== null, 'once qualified, the Relic slot resolves');

// Two Daily observations of value 1 each (2 raw points total) do NOT qualify, even though two
// DISTINCT sources exist -- this is the concrete case where the old distinct-source rule and
// the Bible's raw-point rule now disagree (old rule: qualifies at >=2 distinct daily sources
// regardless of magnitude; Bible rule: needs >=3 raw points regardless of source count).
const twoWeakDailySources = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'daily-answer-weak-1', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'gives_freely_keeps_score', value: 1 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'daily-answer-weak-2', occurredAt: '2026-01-02T00:00:00.000Z', effects: [{ dimension: 'gives_freely_keeps_score', value: 1 }] },
]);
assert(
  selectStrongestPrivateSignals(twoWeakDailySources).length === 0,
  'two distinct Daily sources totalling only 2 raw points do NOT qualify under the Bible v1.4 rule (this is the exact case where the retired distinct-source rule would have wrongly qualified it)',
);

// The raw first observation remains stored/real even before qualification -- proven by
// reading profile.dimensions directly (the complete, unfiltered evidence), independent of the
// selector's own display-eligibility filter.
const rawDimension = oneDailyOnly.dimensions.find((d) => d.dimension === 'tactful_blunt');
assert(
  rawDimension !== undefined && rawDimension.evidenceCount === 1 && rawDimension.evidence.length === 1,
  'the first (unqualified) Daily observation is still fully retained in profile.dimensions -- never deleted or suppressed',
);
assert(!isActiveBoardQualified(rawDimension!.evidence), 'that raw evidence correctly reports as NOT YET qualified (evidence exists != evidence is established)');

// ============================================================================================
// MIXED -- quiz + Daily evidence together reaching >= 3 raw points qualifies.
// ============================================================================================

const quizPlusDaily = scorePersonalityProfile([
  { question: 'Private Daily prompt', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-4', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'repair_punishing', value: -2 }] },
  { question: 'A Private quiz result', category: 'The Good Stuff', chosenAnswer: 'result', sourceType: 'quiz_result', sourceId: 'quiz-result-3', occurredAt: '2026-01-02T00:00:00.000Z', effects: [{ dimension: 'repair_punishing', value: -1 }] },
]);
assert(
  selectStrongestPrivateSignals(quizPlusDaily).some((s) => s.dimension === 'repair_punishing'),
  '1 quiz result (-1) + 1 Daily observation (-2) together reach 3 raw points and qualify the dimension',
);

// Strongest-three ordering remains deterministic after qualification.
const forDeterminism = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-4', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'tactful_blunt', value: -2 }, { dimension: 'tactful_blunt', value: -1 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-5', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'vulnerable_armored', value: -2 }, { dimension: 'vulnerable_armored', value: -1 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-6', occurredAt: '2026-01-01T00:00:00.000Z', effects: [{ dimension: 'repair_punishing', value: -2 }, { dimension: 'repair_punishing', value: -1 }] },
]);
const detRun1 = selectStrongestPrivateSignals(forDeterminism).map((s) => s.dimension);
const detRun2 = selectStrongestPrivateSignals(forDeterminism).map((s) => s.dimension);
assert(JSON.stringify(detRun1) === JSON.stringify(detRun2), 'strongest-three ordering is deterministic after qualification is applied');

// ============================================================================================
// BOUNDARIES (re-confirming Pass 3 guarantees are untouched by this correction)
// ============================================================================================

assert(
  selectStrongestPrivateSignals(bothTypesQuizResult).every((s) => !isCoreDimension(s.dimension)),
  'Core dimensions never appear in the Private signal selector output',
);

const personalitySource = read('../src/data/personality.ts');
assert(
  /getCoreCreatureInputTraits = \(profile: PersonalityProfile\): CoreSignatureTrait\[\] => profile\.topTraits/.test(personalitySource),
  'getCoreCreatureInputTraits is untouched by this pass -- still reads topTraits (already Core-only)',
);

// The active-board qualification rule now lives in ONE place (personality.ts), shared by both
// Core topTraits and Private selectStrongestPrivateSignals -- the opposite of Pass 3.1/3.2's
// original "gate lives only in private-signals.ts" design, which is exactly what let Core and
// Private drift onto two different, both non-Bible-compliant thresholds in the first place.
assert(/resolveActiveBoardPole/.test(personalitySource) && /isActiveBoardQualified/.test(personalitySource), 'the shared active-board qualification rule lives in personality.ts');
const privateSignalsSource = read('../src/data/private-signals.ts');
assert(!/isPrivateSignalQualified/.test(privateSignalsSource), 'the retired distinct-source qualification function no longer exists anywhere');
assert(
  bothTypesQuizResult.dimensions.find((d) => d.dimension === 'protective_hands_off')?.evidenceCount === 1,
  'Private-source Core evidence is recorded in profile.dimensions exactly as before this pass (unaffected by the qualification gate)',
);

// No fake traits are created -- every signal returned traces back to real evidenceCount >= 1
// AND real qualification, never fabricated.
assert(
  selectStrongestPrivateSignals(oneDailyOnly).length === 0,
  'no fake trait is fabricated to fill a slot when the only evidence is unqualified',
);

// No fake percentages are introduced by this pass.
assert(!/%/.test(privateSignalsSource.replace(/\/\/.*$/gm, '')), 'private-signals.ts introduces no percentage literal in actual code');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 3.1 (Private signal confidence / qualification, Bible v1.4-reconciled) VALIDATION CHECKS PASSED.');
