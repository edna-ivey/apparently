// Focused validation for Build 8 Pass 3.1: The Undercurrent must represent a PATTERN, not one
// isolated Daily answer. Run with:
//
//   npx tsx scripts/validate-build8-pass3.1-private-signal-confidence.ts
//
// Imports the real functions directly (personality.ts, private-signals.ts are RN-free by
// design — same established convention as every other validate-build8-*.ts script).

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { scorePersonalityProfile, isCoreDimension, type PersonalityAnswerEvidence } from '../src/data/personality';
import { selectStrongestPrivateSignals, selectRelicSlots, isPrivateSignalQualified } from '../src/data/private-signals';

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
// PRIVATE QUIZ EVIDENCE
// ============================================================================================

// 1. One approved quiz_result Private signal may qualify.
const oneQuizResult = scorePersonalityProfile([
  { question: 'THE HYPE DEPARTMENT', category: 'The Good Stuff', chosenAnswer: 'result', sourceType: 'quiz_result', sourceId: 'quiz-result-1', effects: [{ dimension: 'supportive_challenging', value: 2 }] },
]);
const oneQuizSignals = selectStrongestPrivateSignals(oneQuizResult);
assert(oneQuizSignals.length === 1, `one approved quiz_result Private signal qualifies and appears (got ${oneQuizSignals.length})`);
assert(oneQuizSignals[0]?.dimension === 'supportive_challenging', 'the qualified signal is the correct dimension');

// 2. The same quiz cannot be retaken repeatedly to manufacture additional confidence -- this
// is enforced server-side (submit_quiz_result's is_first_profile_completion / advisory-lock
// protection, unchanged by this pass -- see supabase/migrations/20260916040000_quiz_builds_you.sql
// and .../20260916050000_quiz_first_completion_advisory_lock.sql). Proven here as: a retake
// never reaches groupEvidenceIntoAnswers at all (the RPC simply doesn't write a second
// personality_evidence row), so from this module's perspective there is only ever ONE
// quiz_result-sourced evidence item per (user, quiz) regardless of how many times the quiz UI
// is completed -- confirmed via source-text check that this pass did not touch that
// protection.
const submitQuizResultSource = read('../supabase/migrations/20260916050000_quiz_first_completion_advisory_lock.sql');
assert(
  /pg_advisory_xact_lock/.test(submitQuizResultSource) && /v_is_first/.test(submitQuizResultSource),
  'submit_quiz_result\'s first-completion-only / advisory-lock retake protection is untouched by this pass (still present in its migration)',
);

// 3. A quiz result mapped to BOTH Core and Private still sends Core evidence through Core
// architecture and Private evidence through Private architecture -- unaffected by the
// qualification gate (the gate only filters WHICH Private dimensions surface, never touches
// Core evidence at all).
const bothTypesQuizResult = scorePersonalityProfile([
  {
    question: 'THE EMERGENCY CONTACT (real keep-you-around mapping)',
    category: 'The Good Stuff',
    chosenAnswer: 'result',
    sourceType: 'quiz_result',
    sourceId: 'quiz-result-2',
    effects: [
      { dimension: 'duty_first_self_preserving', value: 2 }, // Private
      { dimension: 'protective_hands_off', value: 1 }, // Core
      { dimension: 'practical_idealistic', value: 1 }, // Core
    ],
  },
]);
assert(
  bothTypesQuizResult.topTraits.some((t) => t.id === 'protective_hands_off' || t.id === 'practical_idealistic') ||
    bothTypesQuizResult.dimensions.find((d) => d.dimension === 'protective_hands_off')?.evidenceCount === 1,
  'Core evidence from a both-mapped quiz result reaches Core architecture (evidenceCount recorded)',
);
assert(
  selectStrongestPrivateSignals(bothTypesQuizResult).some((s) => s.dimension === 'duty_first_self_preserving'),
  'Private evidence from that SAME both-mapped quiz result qualifies and reaches Private architecture',
);

// ============================================================================================
// DAILY EVIDENCE
// ============================================================================================

// 4 & 5. One Daily-only Private observation does NOT surface in The Undercurrent or resolve a
// Relic slot.
const oneDailyOnly = scorePersonalityProfile([
  { question: 'Private Daily prompt', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-1', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const oneDailySignals = selectStrongestPrivateSignals(oneDailyOnly);
assert(oneDailySignals.length === 0, `one isolated Daily-only Private observation does NOT surface in The Undercurrent (got ${oneDailySignals.length})`);
const oneDailyRelic = selectRelicSlots(oneDailySignals);
assert(
  oneDailyRelic.relicTrait === null && oneDailyRelic.colorTrait === null && oneDailyRelic.effectTrait === null,
  'one isolated Daily-only Private observation does NOT resolve any Relic slot',
);

// 6. Two independent Daily observations supporting the SAME Private dimension MAY qualify it.
const twoDailyIndependent = scorePersonalityProfile([
  { question: 'Private Daily prompt, day 1', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-2', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'Private Daily prompt, day 2', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-3', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const twoDailySignals = selectStrongestPrivateSignals(twoDailyIndependent);
assert(twoDailySignals.length === 1 && twoDailySignals[0]?.dimension === 'tactful_blunt', 'two independent Daily observations of the same Private dimension DO qualify it');
assert(selectRelicSlots(twoDailySignals).relicTrait !== null, 'once qualified via 2 Daily observations, the Relic slot resolves');

// 7. The raw first observation remains stored/real even before qualification -- proven by
// reading profile.dimensions directly (the complete, unfiltered evidence), independent of the
// selector's own display-eligibility filter.
const rawDimension = oneDailyOnly.dimensions.find((d) => d.dimension === 'tactful_blunt');
assert(
  rawDimension !== undefined && rawDimension.evidenceCount === 1 && rawDimension.evidence.length === 1,
  'the first (unqualified) Daily observation is still fully retained in profile.dimensions -- never deleted or suppressed',
);
assert(!isPrivateSignalQualified(rawDimension!.evidence), 'that raw evidence correctly reports as NOT YET qualified (evidence exists != evidence is established)');

// ============================================================================================
// MIXED
// ============================================================================================

// 8. Quiz + Daily evidence qualifies (either alone would already qualify; combined also
// qualifies, and is not double-penalized).
const quizPlusDaily = scorePersonalityProfile([
  { question: 'Private Daily prompt', category: 'Hidden You', chosenAnswer: 'option', sourceType: 'daily_answer', sourceId: 'daily-answer-4', effects: [{ dimension: 'repair_punishing', value: -2 }] },
  { question: 'A Private quiz result', category: 'The Good Stuff', chosenAnswer: 'result', sourceType: 'quiz_result', sourceId: 'quiz-result-3', effects: [{ dimension: 'repair_punishing', value: -1 }] },
]);
assert(
  selectStrongestPrivateSignals(quizPlusDaily).some((s) => s.dimension === 'repair_punishing'),
  '1 quiz result + 1 Daily observation together qualify the dimension',
);

// 9. Strongest-three ordering remains deterministic after qualification.
const forDeterminism = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-4', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-5', effects: [{ dimension: 'vulnerable_armored', value: -2 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-result-6', effects: [{ dimension: 'repair_punishing', value: -2 }] },
]);
const detRun1 = selectStrongestPrivateSignals(forDeterminism).map((s) => s.dimension);
const detRun2 = selectStrongestPrivateSignals(forDeterminism).map((s) => s.dimension);
assert(JSON.stringify(detRun1) === JSON.stringify(detRun2), 'strongest-three ordering is deterministic after qualification is applied');

// 10. Unqualified dimensions cannot outrank qualified dimensions merely because they have one
// extreme value -- an unqualified dimension with a maximal +/-2 single Daily observation must
// never appear ahead of (or instead of) a qualified dimension with a weaker value.
const unqualifiedExtremeVsQualifiedWeak = scorePersonalityProfile([
  // Unqualified: one isolated Daily observation (one distinct source), but an EXTREME value (2).
  { question: 'q1', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'daily-answer-5', effects: [{ dimension: 'initiating_responsive', value: 2 }] },
  // Qualified: two independent Daily observations (two distinct sources), but a WEAKER value (1 each).
  { question: 'q2', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'daily-answer-6', effects: [{ dimension: 'gives_freely_keeps_score', value: 1 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', sourceType: 'daily_answer', sourceId: 'daily-answer-7', effects: [{ dimension: 'gives_freely_keeps_score', value: 1 }] },
]);
const boundarySignals = selectStrongestPrivateSignals(unqualifiedExtremeVsQualifiedWeak);
assert(
  boundarySignals.length === 1 && boundarySignals[0]?.dimension === 'gives_freely_keeps_score',
  'the qualified-but-weaker dimension appears; the unqualified-but-extreme dimension is correctly excluded entirely, never outranking it',
);

// ============================================================================================
// BOUNDARIES (re-confirming Pass 3 guarantees are untouched by this correction)
// ============================================================================================

// 11. Core dimensions never appear in The Undercurrent.
assert(
  selectStrongestPrivateSignals(bothTypesQuizResult).every((s) => !isCoreDimension(s.dimension)),
  'Core dimensions never appear in the Private signal selector output',
);

// 12. Private dimensions never directly become Creature traits -- getCoreCreatureInputTraits
// itself is untouched by this pass; re-confirm via source-text that it still filters Core-only.
const personalitySource = read('../src/data/personality.ts');
assert(
  /getCoreCreatureInputTraits = \(profile: PersonalityProfile\): CoreSignatureTrait\[\] => profile\.topTraits/.test(personalitySource),
  'getCoreCreatureInputTraits is untouched by this pass -- still reads topTraits (already Core-only)',
);

// 13. Private-source Core evidence still contributes to Your Signature/Creature exactly as it
// did after Pass 3 -- the qualification gate only ever filters selectStrongestPrivateSignals'
// OWN output; it must never appear inside scorePersonalityProfile, topTraits, or
// getCoreCreatureInputTraits.
assert(!/isPrivateSignalQualified/.test(personalitySource), 'the qualification gate lives ONLY in private-signals.ts -- personality.ts\'s Core scoring path never references it');
assert(
  bothTypesQuizResult.dimensions.find((d) => d.dimension === 'protective_hands_off')?.evidenceCount === 1,
  'Private-source Core evidence is recorded in profile.dimensions exactly as before this pass (unaffected by the qualification gate)',
);

// 14. No fake traits are created -- every signal returned traces back to real evidenceCount >= 1
// AND real qualification, never fabricated.
assert(
  selectStrongestPrivateSignals(oneDailyOnly).length === 0,
  'no fake trait is fabricated to fill a slot when the only evidence is unqualified',
);

// 15. No fake percentages are introduced by this pass.
const privateSignalsSource = read('../src/data/private-signals.ts');
assert(!/%/.test(privateSignalsSource.replace(/\/\/.*$/gm, '')), 'private-signals.ts introduces no percentage literal in actual code');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 3.1 (Private signal confidence / qualification) VALIDATION CHECKS PASSED.');
