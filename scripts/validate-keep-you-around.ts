// Focused, standalone validation for the keep-you-around quiz and the generic scoring-engine
// behavior it introduces (opt-in tie-break / close-second). Run with:
//
//   npx tsx scripts/validate-keep-you-around.ts
//
// No test framework is configured in this repo (see package.json) — this is a plain script
// that asserts and exits non-zero on the first failure, exactly like scripts/reset-project.js
// is a plain script rather than a test file. Every ArchetypeQuizDefinition constructed here
// beyond the real KEEP_YOU_AROUND_QUIZ is a minimal SYNTHETIC fixture used only to exercise
// the generic scoring engine (scoring.ts) with easy, exact numbers — it is never registered,
// never rendered, and asserts nothing about real Private content.
//
// Deliberately does NOT import personality-service.ts (computeProfileActivityCounts) — that
// module's import chain reaches src/lib/supabase.ts, which imports react-native directly;
// react-native's own source isn't parseable by tsx/esbuild outside Metro. The
// contributesToProfile exclusion that function implements is verified instead via a live
// smoke pass (see the engineering sprint report) rather than here.

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
// 1. STRUCTURAL VALIDATION — the real KEEP_YOU_AROUND_QUIZ
// ============================================================================================

const quiz = getQuizDefinition('keep-you-around');
assert(quiz !== null, 'keep-you-around is registered in QUIZ_REGISTRY');
assert(Object.prototype.hasOwnProperty.call(QUIZ_REGISTRY, 'secretly-love'), 'secretly-love remains registered (historical compatibility)');

if (quiz && quiz.scoringType === 'archetype') {
  const definition: ArchetypeQuizDefinition = quiz;

  assert(definition.questions.length === 10, 'exactly 10 questions');
  const expectedQuestionIds = Array.from({ length: 10 }, (_, i) => `q${i + 1}`);
  assert(
    definition.questions.every((q, i) => q.id === expectedQuestionIds[i]),
    'question ids are q1..q10 in order',
  );
  assert(
    definition.questions.every((q) => q.choices.length === 5),
    'every question has exactly 5 choices',
  );

  const expectedResultIds = [
    'emergency-contact',
    'reason-theres-a-story',
    'human-bullshit-detector',
    'hype-department',
    'one-who-knows-too-much',
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

  const findChoice = (questionId: string, choiceId: string) =>
    definition.questions.find((q) => q.id === questionId)?.choices.find((c) => c.id === choiceId);

  const q7b = findChoice('q7', 'b');
  assert(
    JSON.stringify(q7b?.resultWeights) === JSON.stringify({ 'emergency-contact': 1 }),
    'Q7B is exactly { emergency-contact: 1 } — no accidental secondary weight',
  );
  const q7e = findChoice('q7', 'e');
  assert(
    JSON.stringify(q7e?.resultWeights) === JSON.stringify({ 'reason-theres-a-story': 1 }),
    'Q7E is exactly { reason-theres-a-story: 1 } — no accidental secondary weight',
  );

  const q10ExpectedByChoice: Record<string, string> = {
    a: 'emergency-contact',
    b: 'reason-theres-a-story',
    c: 'human-bullshit-detector',
    d: 'one-who-knows-too-much',
    e: 'hype-department',
  };
  const q10AllWeak = Object.entries(q10ExpectedByChoice).every(([choiceId, resultId]) => {
    const weights = findChoice('q10', choiceId)?.resultWeights ?? {};
    return JSON.stringify(weights) === JSON.stringify({ [resultId]: 1 });
  });
  assert(q10AllWeak, 'every Q10 option is a solo +1 to its expected result id — none normalized/boosted');

  assert(
    JSON.stringify(definition.highSignalQuestionIds) === JSON.stringify(['q1', 'q3', 'q5', 'q6', 'q8']),
    'highSignalQuestionIds is exactly [q1, q3, q5, q6, q8]',
  );
  assert(!definition.highSignalQuestionIds?.includes('q10'), 'Q10 is NOT in the high-signal set (cannot independently break a tie)');
  assert(definition.enableCloseSecond === true, 'enableCloseSecond is true for this quiz');
  // Michelle/Forge approved this quiz's result-level You-profile mapping in the personality-
  // dimension-expansion pass -- see scripts/validate-personality-dimensions.ts for the exact
  // approved profileSignals per result; this script stays scoped to structure/scoring.
  assert(definition.contributesToProfile === true, 'contributesToProfile is true (approved profile mapping)');
  assert(
    definition.archetypes.every((a) => (a.profileSignals?.length ?? 0) >= 1 && (a.profileSignals?.length ?? 0) <= 3),
    'every archetype authors 1-3 profileSignals (exact values verified in validate-personality-dimensions.ts)',
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
    'every archetype has a complete structuredRead (THE READ / THE CALL-OUT / THE COST / TRY THIS)',
  );
}

// ============================================================================================
// 2. RESULT-CALCULATION TEST CASES — the real KEEP_YOU_AROUND_QUIZ
// ============================================================================================

if (quiz && quiz.scoringType === 'archetype') {
  const definition = quiz;

  // Clear primary: overwhelmingly human-bullshit-detector, no close second (gap far > 10 pts).
  {
    const answers = { q1: 'a', q2: 'e', q3: 'b', q4: 'c', q5: 'b', q6: 'd', q7: 'a', q8: 'b', q9: 'd', q10: 'c' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(score.primary.id === 'human-bullshit-detector', 'clear primary case: primary is human-bullshit-detector');
    assert(score.secondary === null, 'clear primary case: no close second (gap too large)');
  }

  // Q10 cannot independently resolve a tie: emergency-contact and one-who-knows-too-much end
  // up tied on total (5-5), tied on high-signal totals (4-4), and tied on full+2-primary count
  // (2-2) — Q10's answer (choice 'd') favors one-who-knows-too-much, but since Q10 is excluded
  // from both tie-break steps, the tie must fall through to the deterministic archetypes-array
  // fallback, which resolves to whichever is declared FIRST: emergency-contact.
  {
    const answers = { q1: 'b', q2: 'e', q3: 'c', q4: 'b', q5: 'a', q6: 'c', q7: 'a', q8: 'e', q9: 'e', q10: 'd' };
    const score = scoreArchetypeQuiz(definition, answers);
    assert(
      score.totals['emergency-contact'] === score.totals['one-who-knows-too-much'],
      'Q10 tie-break case: emergency-contact and one-who-knows-too-much are tied on raw total',
    );
    assert(
      score.primary.id === 'emergency-contact',
      "Q10 tie-break case: primary resolves to emergency-contact (array order), NOT one-who-knows-too-much (Q10's favorite)",
    );
  }
}

// ============================================================================================
// 3. GENERIC ENGINE BEHAVIOR — minimal synthetic fixtures (never registered/rendered)
// ============================================================================================

const baseFixture = {
  id: '__fixture__',
  scoringType: 'archetype' as const,
  category: 'The Good Stuff' as const,
  access: 'private-preview' as const,
  title: 'Fixture',
  eyebrow: '',
  introSupport: [],
  meta: '',
  introCta: '',
  mixLabel: '',
  recentReadMetricLabel: '',
};

// 3a. Tie resolved via high-signal questions alone (never reaches the full+2-count step).
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: ['q1'],
    enableCloseSecond: false,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 10 } }, { id: 'b', label: '', resultWeights: {} }] },
      { id: 'q3', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 10 } }, { id: 'b', label: '', resultWeights: {} }] },
    ],
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q3: 'a' });
  assert(score.totals.x === score.totals.y, 'high-signal tie-break fixture: totals are tied (10-10)');
  assert(score.primary.id === 'x', 'high-signal tie-break fixture: resolved to x via high-signal-only points (q1)');
}

// 3b. Tied on totals AND on high-signal totals, resolved via count of full +2 PRIMARY
// selections across the whole quiz.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: ['q1', 'q2'],
    enableCloseSecond: false,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }, { id: 'b', label: '', resultWeights: { y: 2 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }, { id: 'b', label: '', resultWeights: { y: 2 } }] },
      { id: 'q3', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }] },
      { id: 'q4', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 1 } }] },
      { id: 'q5', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 1 } }] },
    ],
    // q1 -> x, q2 -> y : high-signal tied 2-2. q3 -> x full+2 (2nd full+2 for x). q4,q5 -> y
    // weak +1 each (never full+2). Totals: x=4, y=4 (tied). High-signal: x=2, y=2 (tied).
    // Full+2 count: x=2 (q1,q3), y=1 (q2 only) -> x wins.
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'b', q3: 'a', q4: 'a', q5: 'a' });
  assert(score.totals.x === 4 && score.totals.y === 4, 'full+2-count tie-break fixture: totals tied (4-4)');
  assert(score.primary.id === 'x', 'full+2-count tie-break fixture: resolved to x (2 full+2 primaries vs y’s 1)');
}

// 3c. Complete tie (even full+2 count) — falls to the fixed archetypes-array-order fallback.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: ['q1', 'q2'],
    enableCloseSecond: false,
    // Declared in this exact order — z first, so a naive "always pick alphabetically first"
    // bug would be caught: the fallback must respect THIS array's order, not id sort order.
    archetypes: [{ id: 'z', title: 'Z' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { z: 2 } }, { id: 'b', label: '', resultWeights: { y: 2 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { z: 2 } }, { id: 'b', label: '', resultWeights: { y: 2 } }] },
    ],
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'b' });
  assert(score.totals.z === 2 && score.totals.y === 2, 'complete-tie fixture: totals tied (2-2)');
  assert(score.primary.id === 'z', 'complete-tie fixture: falls to archetypes-array order (z declared first)');
}

// 3d. Qualifying close second: primary ahead but within 10 points, secondary supported by
// >=2 questions including >=1 full +2 primary selection.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: [],
    enableCloseSecond: true,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }] },
      { id: 'q3', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2 } }] },
      { id: 'q4', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 2 } }] },
      { id: 'q5', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 2 } }] },
      { id: 'q6', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 1 } }] },
    ],
    // x = 6 (3 full+2s), y = 5 (2 full+2s + 1 weak+1, from 3 distinct questions). total=11,
    // x%=55, y%=45, diff=10 (qualifies: within 10, >=2 questions, >=1 full+2).
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a', q6: 'a' });
  assert(score.primary.id === 'x', 'qualifying close-second fixture: primary is x');
  assert(score.secondary?.id === 'y', 'qualifying close-second fixture: y qualifies as close second');
}

// 3e. Close second within 10 points but ALL evidence is secondary-role (never a full +2
// PRIMARY for the candidate) — must NOT qualify, even though it's numerically close and has
// >=2 supporting questions.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: [],
    enableCloseSecond: true,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }, { id: 'z', title: 'Z' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 2, y: 1 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { z: 2, y: 1 } }] },
    ],
    // y appears on 2 distinct questions (>=2 ✓) but is ALWAYS the secondary (+1) role,
    // never the primary (+2) — must be rejected on the full+2-primary requirement.
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'a' });
  assert(score.secondary === null, 'secondary-only-evidence fixture: no close second shown (never a full +2 primary for y)');
}

// 3f. Close second within 10 points, has a full +2 primary, but supported by only ONE
// question — must NOT qualify (the >=2-questions requirement is independent of evidence
// quality).
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: [],
    enableCloseSecond: true,
    archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { x: 9 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: '', resultWeights: { y: 8 } }] },
    ],
    // x=9, y=8 (from ONE question only) — within 10 points (diff=6) and y's sole
    // contribution IS a full +2-or-more primary, but only 1 supporting question.
  };
  const score = scoreArchetypeQuiz(fixture, { q1: 'a', q2: 'a' });
  assert(score.secondary === null, 'single-question-evidence fixture: no close second shown (only 1 supporting question)');
}

// Note: the contributesToProfile exclusion in computeProfileActivityCounts
// (src/services/personality-service.ts) is NOT covered here — see the header comment above
// for why — and is instead verified via a live smoke pass (real completion, real You-page
// counts) rather than this script.

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL keep-you-around VALIDATION CHECKS PASSED.');
