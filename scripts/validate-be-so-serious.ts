// Focused, standalone validation for the be-so-serious quiz (Apparently Private Open Quiz
// #2), reusing the exact same opt-in tie-break/close-second mechanism keep-you-around
// introduced. Run with:
//
//   npx tsx scripts/validate-be-so-serious.ts
//
// No test framework is configured in this repo — see scripts/validate-keep-you-around.ts's
// header for why (this script deliberately avoids importing personality-service.ts for the
// same react-native-import-chain reason). Every test below runs against the REAL
// BE_SO_SERIOUS_QUIZ content and real answer maps, hand-derived and verified against the
// approved scoring table — except the single "single-question-evidence" close-second
// rejection case, which needs a raw point gap large enough, relative to its own total, to
// stay within the 10-percentage-point threshold; constructing that from this quiz's real
// integer weights would require an impractically large answer set, so that ONE case uses a
// minimal synthetic ArchetypeQuizDefinition fixture (never registered/rendered) to exercise
// the SAME generic scoring engine already proven against real content everywhere else in this
// file — exactly the fallback keep-you-around's own script already established for this exact
// scenario.

import { QUIZ_REGISTRY, getQuizDefinition } from '../src/data/quizzes/index';
import { scoreArchetypeQuiz } from '../src/data/quizzes/scoring';
import type { ArchetypeQuizDefinition } from '../src/data/quizzes/types';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// ============================================================================================
// 1. STRUCTURAL VALIDATION — the real BE_SO_SERIOUS_QUIZ
// ============================================================================================

const quiz = getQuizDefinition('be-so-serious');
assert(quiz !== null, 'be-so-serious is registered in QUIZ_REGISTRY');
assert(Object.prototype.hasOwnProperty.call(QUIZ_REGISTRY, 'keep-you-around'), 'keep-you-around remains registered (not replaced)');
assert(Object.prototype.hasOwnProperty.call(QUIZ_REGISTRY, 'secretly-love'), 'secretly-love remains registered (historical compatibility)');

if (quiz && quiz.scoringType === 'archetype') {
  const definition: ArchetypeQuizDefinition = quiz;

  assert(definition.questions.length === 10, 'exactly 10 questions');
  const expectedQuestionIds = Array.from({ length: 10 }, (_, i) => `q${i + 1}`);
  assert(definition.questions.every((q, i) => q.id === expectedQuestionIds[i]), 'question ids are q1..q10 in order');
  assert(definition.questions.every((q) => q.choices.length === 5), 'every question has exactly 5 choices');

  const expectedResultIds = [
    'handles-it-well',
    'standards-control',
    'communicate-punish',
    'honest-mad',
    'accountability-turn',
  ];
  const actualResultIds = definition.archetypes.map((a) => a.id);
  assert(
    expectedResultIds.every((id) => actualResultIds.includes(id)) && actualResultIds.length === 5,
    'exactly the 5 expected result ids exist',
  );

  const validIdSet = new Set(actualResultIds);
  const allWeightKeysValid = definition.questions.every((q) =>
    q.choices.every((c) => Object.keys(c.resultWeights ?? {}).every((key) => validIdSet.has(key))),
  );
  assert(allWeightKeysValid, 'every resultWeights key references a valid result id');

  // Exact deep-equality check against the FULL approved scoring table — catches any
  // transcription slip across all 50 choices, not just spot checks.
  const GOOD = 'handles-it-well';
  const CONTROL = 'standards-control';
  const PUNISH = 'communicate-punish';
  const HONEST = 'honest-mad';
  const ACCOUNT = 'accountability-turn';
  const EXPECTED_WEIGHTS: Record<string, Record<string, Record<string, number>>> = {
    q1: { a: { [GOOD]: 2 }, b: { [PUNISH]: 2 }, c: { [GOOD]: 1 }, d: { [HONEST]: 2 }, e: { [CONTROL]: 2 } },
    q2: { a: { [GOOD]: 2 }, b: { [ACCOUNT]: 2 }, c: { [ACCOUNT]: 2 }, d: { [HONEST]: 2, [ACCOUNT]: 1 }, e: { [GOOD]: 2 } },
    q3: { a: { [GOOD]: 2 }, b: { [CONTROL]: 2 }, c: { [PUNISH]: 2 }, d: { [GOOD]: 1 }, e: { [PUNISH]: 2, [CONTROL]: 1 } },
    q4: { a: { [GOOD]: 2 }, b: { [HONEST]: 1 }, c: { [CONTROL]: 1 }, d: { [CONTROL]: 2 }, e: { [GOOD]: 2, [HONEST]: 1 } },
    q5: { a: { [GOOD]: 2 }, b: { [CONTROL]: 1 }, c: { [PUNISH]: 2 }, d: { [PUNISH]: 2 }, e: { [CONTROL]: 2 } },
    q6: { a: { [GOOD]: 2 }, b: { [GOOD]: 1 }, c: { [ACCOUNT]: 2 }, d: { [ACCOUNT]: 1 }, e: { [ACCOUNT]: 2 } },
    q7: { a: { [GOOD]: 2 }, b: { [PUNISH]: 2 }, c: { [GOOD]: 2 }, d: { [HONEST]: 2 }, e: { [PUNISH]: 2 } },
    q8: { a: { [GOOD]: 2 }, b: { [CONTROL]: 2 }, c: { [GOOD]: 1 }, d: { [CONTROL]: 2 }, e: { [ACCOUNT]: 2 } },
    q9: { a: { [GOOD]: 2 }, b: { [ACCOUNT]: 2 }, c: { [GOOD]: 1 }, d: { [ACCOUNT]: 2 }, e: { [ACCOUNT]: 1 } },
    q10: { a: { [CONTROL]: 1 }, b: { [PUNISH]: 1 }, c: { [HONEST]: 1 }, d: { [ACCOUNT]: 1 }, e: { [CONTROL]: 1 } },
  };
  let allWeightsExact = true;
  for (const [qId, choiceMap] of Object.entries(EXPECTED_WEIGHTS)) {
    for (const [choiceId, expected] of Object.entries(choiceMap)) {
      const actual = definition.questions.find((q) => q.id === qId)?.choices.find((c) => c.id === choiceId)?.resultWeights ?? {};
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        allWeightsExact = false;
        console.error(`  MISMATCH ${qId}${choiceId}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }
  }
  assert(allWeightsExact, 'every approved weight (all 50 choices) matches the scoring table exactly');

  const q10AllWeakOne = ['a', 'b', 'c', 'd', 'e'].every((choiceId) => {
    const weights = definition.questions.find((q) => q.id === 'q10')?.choices.find((c) => c.id === choiceId)?.resultWeights ?? {};
    const values = Object.values(weights);
    return values.length === 1 && values[0] === 1;
  });
  assert(q10AllWeakOne, 'every Q10 option is a solo +1 — none normalized/boosted');

  assert(
    JSON.stringify(definition.highSignalQuestionIds) === JSON.stringify(['q2', 'q3', 'q5', 'q7', 'q9']),
    'highSignalQuestionIds is exactly [q2, q3, q5, q7, q9]',
  );
  assert(!definition.highSignalQuestionIds?.includes('q10'), 'Q10 is NOT in the high-signal set');
  assert(definition.enableCloseSecond === true, 'enableCloseSecond is true (same rule as keep-you-around)');
  assert(definition.contributesToProfile === false, 'contributesToProfile is false pending approved profile mapping');
  assert(
    definition.archetypes.every((a) => a.profileSignals === undefined),
    'no archetype authors profileSignals',
  );
  assert(
    definition.archetypes.every(
      (a) =>
        a.structuredRead &&
        a.structuredRead.theRead.length > 0 &&
        a.structuredRead.theCallOut.length > 0 &&
        a.structuredRead.theCost.length > 0 &&
        a.structuredRead.tryThis.length > 0,
    ),
    'all five structured Reads resolve (THE READ / THE CALL-OUT / THE COST / TRY THIS all non-empty)',
  );

  const expectedTitles = [
    'NO, ACTUALLY. YOU HANDLE THIS PRETTY WELL.',
    'YOU CALL IT STANDARDS. SOMETIMES IT’S CONTROL.',
    'YOU DON’T COMMUNICATE. YOU PUNISH.',
    'YOU’RE NOT “JUST HONEST.” SOMETIMES YOU’RE MAD.',
    'YOU WANT ACCOUNTABILITY UNTIL IT’S YOUR TURN.',
  ];
  assert(
    definition.archetypes.map((a) => a.title).join('|') === expectedTitles.join('|'),
    'all 5 result titles match exactly, in the documented order',
  );
}

// ============================================================================================
// 2. RESULT-CALCULATION TEST CASES — the real BE_SO_SERIOUS_QUIZ, hand-derived answer maps
// ============================================================================================

if (quiz && quiz.scoringType === 'archetype') {
  const definition = quiz;

  // Clear primary: overwhelmingly handles-it-well, no close second (gap far > 10 pts).
  {
    const answers = { q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a', q6: 'a', q7: 'a', q8: 'a', q9: 'a' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(score.primary.id === 'handles-it-well', 'clear primary case: primary is handles-it-well');
    assert(score.secondary === null, 'clear primary case: no close second');
  }

  // Q10 cannot independently resolve a tie: handles-it-well and standards-control tied 5-5 on
  // total, 4-4 on high-signal (Q2,Q3,Q5,Q7,Q9), 2-2 on full+2-primary count. Q10 (choice 'a',
  // CONTROL +1) favors standards-control, but since Q10 is excluded from both arbitration
  // steps, the tie falls to the deterministic array-order fallback: handles-it-well (declared
  // first).
  {
    const answers = { q1: 'c', q2: 'a', q3: 'b', q5: 'e', q7: 'a', q10: 'a' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(
      score.totals['handles-it-well'] === score.totals['standards-control'],
      'Q10 tie-break case: handles-it-well and standards-control are tied on raw total',
    );
    assert(
      score.primary.id === 'handles-it-well',
      'Q10 tie-break case: primary resolves to handles-it-well (array order), NOT standards-control (Q10’s favorite)',
    );
  }

  // Tie resolved via high-signal questions alone (both tied 4-4 raw, but handles-it-well’s
  // points came entirely from high-signal Q2/Q3 while standards-control’s came entirely from
  // non-high-signal Q1/Q4 — resolved at step 1, never reaching the full+2-count step).
  {
    const answers = { q1: 'e', q2: 'a', q3: 'a', q4: 'd' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(
      score.totals['handles-it-well'] === 4 && score.totals['standards-control'] === 4,
      'high-signal tie-break case: totals tied (4-4)',
    );
    assert(score.primary.id === 'handles-it-well', 'high-signal tie-break case: resolved via high-signal-only points');
  }

  // Tied on total AND on high-signal totals — resolved via count of full +2 PRIMARY
  // selections (handles-it-well has 2, standards-control has 1: its Q4/Q10 picks are weak +1s).
  {
    const answers = { q2: 'a', q3: 'b', q4: 'c', q6: 'a', q10: 'a' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(
      score.totals['handles-it-well'] === 4 && score.totals['standards-control'] === 4,
      'full+2-count tie-break case: totals tied (4-4)',
    );
    assert(
      score.primary.id === 'handles-it-well',
      'full+2-count tie-break case: resolved via full+2-primary count (2 vs 1)',
    );
  }

  // Complete tie (even full+2 count) — falls to the fixed archetypes-array-order fallback.
  // standards-control and accountability-turn tie at every step; standards-control is
  // declared earlier in the archetypes array.
  {
    const answers = { q2: 'b', q3: 'b' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(
      score.totals['standards-control'] === 2 && score.totals['accountability-turn'] === 2,
      'complete-tie case: totals tied (2-2)',
    );
    assert(score.primary.id === 'standards-control', 'complete-tie case: falls to archetypes-array order');
  }

  // Qualifying close second: handles-it-well ahead (55%), standards-control within 10 points
  // (45%), supported by 3 distinct questions including 2 full +2 primaries.
  {
    const answers = { q1: 'a', q2: 'a', q4: 'd', q6: 'a', q8: 'b', q10: 'a' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(score.primary.id === 'handles-it-well', 'qualifying close-second case: primary is handles-it-well');
    assert(score.secondary?.id === 'standards-control', 'qualifying close-second case: standards-control qualifies');
  }

  // Close second rejected: standards-control is within 10 points (36% vs 27%) and supported
  // by 3 distinct questions, but every one of its contributions is a WEAK solo +1 — never a
  // full +2 primary selection — so it must not qualify.
  {
    const answers = { q1: 'c', q3: 'd', q4: 'c', q5: 'b', q6: 'b', q7: 'd', q8: 'c', q9: 'b', q10: 'a' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(score.primary.id === 'handles-it-well', 'weak-only-evidence case: primary is handles-it-well');
    assert(score.secondary === null, 'weak-only-evidence case: no close second (never a full +2 primary)');
  }
}

// ============================================================================================
// 3. SINGLE-QUESTION-EVIDENCE CLOSE-SECOND REJECTION — minimal synthetic fixture
// ============================================================================================
//
// Reaching this specific boundary (within 10 points, ≥1 full +2 primary, but only 1
// supporting question) against be-so-serious's real integer weights would need a total point
// pool an order of magnitude larger than this 10-question quiz can produce (the required
// pool size scales with the primary/candidate raw-point gap). This exercises the exact same
// generic pickCloseSecond code path already proven against real content above and in
// keep-you-around's own validation script.

{
  const fixture: ArchetypeQuizDefinition = {
    id: '__fixture__',
    scoringType: 'archetype',
    category: 'Shadow Side',
    access: 'private-preview',
    title: 'Fixture',
    eyebrow: '',
    introSupport: [],
    meta: '',
    introCta: '',
    mixLabel: '',
    recentReadMetricLabel: '',
    highSignalQuestionIds: [],
    enableCloseSecond: true,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 9 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 8 } }] },
    ],
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'a' });
  assert(score.secondary === null, 'single-question-evidence fixture: no close second shown (only 1 supporting question)');
}

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL be-so-serious VALIDATION CHECKS PASSED.');
