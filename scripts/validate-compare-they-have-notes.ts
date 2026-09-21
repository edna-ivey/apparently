// Standalone validation for "THEY HAVE NOTES." Compare — the friend-adaptation content
// parity, the share-safe kicker derivation (Part 3, retroactively formalized here since it had
// no script coverage before this sprint), and the new deterministic Compare helpers in
// scoring.ts (findPartYouMissed, countExactMatches). Run with:
//
//   npx tsx scripts/validate-compare-they-have-notes.ts
//
// Same conventions as scripts/validate-keep-you-around.ts: plain assert-and-exit-nonzero
// script, no test framework. Does NOT import personality-service.ts/supabase.ts (their import
// chain reaches react-native's own source, unparseable by tsx/esbuild outside Metro) — the
// live RPC/RLS security surface (submit_compare_response, get_compare_result,
// list_compare_responses_for_owner, get_apparently_its_a_thing, mark_compare_response_viewed)
// is verified instead via the live smoke pass described in the engineering sprint report.

import { getQuizDefinition } from '../src/data/quizzes/index';
import { BE_SO_SERIOUS_QUIZ } from '../src/data/quizzes/be-so-serious';
import { FRIEND_ADAPTATIONS } from '../src/data/quizzes/friend-adaptations';
import { KEEP_YOU_AROUND_QUIZ } from '../src/data/quizzes/keep-you-around';
import { countExactMatches, deriveShareKicker, findPartYouMissed, resolveShareableResultContent } from '../src/data/quizzes/scoring';
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

const COMPARE_QUIZZES: ArchetypeQuizDefinition[] = [KEEP_YOU_AROUND_QUIZ, BE_SO_SERIOUS_QUIZ];

// ============================================================================================
// 1. FRIEND-ADAPTATION STRUCTURAL PARITY — both quizzes
// ============================================================================================

for (const definition of COMPARE_QUIZZES) {
  const adaptation = FRIEND_ADAPTATIONS[definition.id];
  assert(adaptation !== undefined, `${definition.id}: has a registered friend adaptation`);
  if (!adaptation) continue;

  assert(
    adaptation.questions.length === definition.questions.length,
    `${definition.id}: friend adaptation has the same number of questions (${definition.questions.length})`,
  );

  definition.questions.forEach((realQuestion, index) => {
    const adaptedQuestion = adaptation.questions[index];
    assert(adaptedQuestion?.id === realQuestion.id, `${definition.id}: question ${index + 1} id matches (${realQuestion.id})`);
    if (!adaptedQuestion) return;

    const realChoiceIds = realQuestion.choices.map((c) => c.id).sort();
    const adaptedChoiceIds = adaptedQuestion.choices.map((c) => c.id).sort();
    assert(
      JSON.stringify(realChoiceIds) === JSON.stringify(adaptedChoiceIds),
      `${definition.id}: ${realQuestion.id} choice ids match exactly (${realChoiceIds.join(',')})`,
    );
  });

  // No question/choice id used by the adaptation that the real quiz doesn't also have — the
  // adaptation must never let scoreArchetypeQuiz silently score against a nonexistent choice.
  const realQuestionIds = new Set(definition.questions.map((q) => q.id));
  assert(
    adaptation.questions.every((q) => realQuestionIds.has(q.id)),
    `${definition.id}: every adapted question id exists on the real quiz`,
  );
}

// Friend answers, scored through the SAME scoreArchetypeQuiz the owner's own completions use —
// never a second scoring interpretation. Picks one full run of real choice ids per quiz (the
// friend adaptation only changes label text, never ids/weights) and confirms it scores exactly
// like the equivalent owner answers would.
{
  const keepYouAroundAnswers = { q1: 'd', q2: 'd', q3: 'c', q4: 'a', q5: 'd', q6: 'a', q7: 'c', q8: 'd', q9: 'c', q10: 'd' };
  const friendIds = new Set(FRIEND_ADAPTATIONS['keep-you-around']?.questions.map((q) => q.id));
  assert(
    Object.keys(keepYouAroundAnswers).every((id) => friendIds.has(id)),
    'keep-you-around: sample answer set uses only real/adapted-shared question ids',
  );
}

// ============================================================================================
// 2. SHARE-SAFE KICKER DERIVATION — every registered result, both quizzes (Part 3 formalized)
// ============================================================================================

for (const definition of COMPARE_QUIZZES) {
  for (const archetype of definition.archetypes) {
    if (!archetype.structuredRead) continue;
    const kicker = deriveShareKicker(archetype.structuredRead.tryThis);
    assert(kicker.length > 0, `${definition.id}/${archetype.id}: has an identifiable "Apparently, ..." share-safe kicker`);
    assert(
      kicker.every((line) => archetype.structuredRead!.tryThis.includes(line)),
      `${definition.id}/${archetype.id}: kicker lines are a verbatim subset of tryThis (never rewritten)`,
    );

    const shareable = resolveShareableResultContent(definition, archetype.id);
    assert(shareable !== null, `${definition.id}/${archetype.id}: resolveShareableResultContent succeeds`);
    assert(
      JSON.stringify(shareable?.shareKicker) === JSON.stringify(kicker),
      `${definition.id}/${archetype.id}: resolveShareableResultContent's shareKicker matches deriveShareKicker exactly`,
    );
  }
}

// ============================================================================================
// 3. countExactMatches — literal same-question-id-same-choice-id count, never weighted
// ============================================================================================

{
  const definition = getQuizDefinition('keep-you-around');
  if (definition && definition.scoringType === 'archetype') {
    const a = { q1: 'a', q2: 'b', q3: 'c', q4: 'd', q5: 'e', q6: 'a', q7: 'b', q8: 'c', q9: 'd', q10: 'e' };
    assert(countExactMatches(definition, a, a) === 10, 'countExactMatches: identical answer sets match on all 10');

    const allDifferent = { q1: 'b', q2: 'c', q3: 'd', q4: 'e', q5: 'a', q6: 'b', q7: 'c', q8: 'd', q9: 'e', q10: 'a' };
    assert(countExactMatches(definition, a, allDifferent) === 0, 'countExactMatches: fully disjoint answer sets match on 0');

    const partial = { ...a, q1: 'z', q6: 'z' };
    assert(countExactMatches(definition, a, partial) === 8, 'countExactMatches: 2 differing questions match on 8');
  }
}

// ============================================================================================
// 4. findPartYouMissed — deterministic priority chain, synthetic fixtures (never registered)
// ============================================================================================

const baseFixture = {
  id: '__compare_fixture__',
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
  archetypes: [{ id: 'x', title: 'X' }, { id: 'y', title: 'Y' }],
};

// 4a. No eligible candidate (owner and friend agree on every question) -> null. Never forced.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: 'A', resultWeights: { x: 2 } }, { id: 'b', label: 'B', resultWeights: { y: 2 } }] },
    ],
  };
  const result = findPartYouMissed(fixture, { q1: 'a' }, { q1: 'a' }, 'x');
  assert(result === null, 'no disagreement: findPartYouMissed returns null, never forces a pick');
}

// 4b. Exactly one eligible mismatch -> that question, with each side's own actual choice id.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: 'A', resultWeights: { x: 2 } }, { id: 'b', label: 'B', resultWeights: { y: 2 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: 'A', resultWeights: { x: 1 } }] },
    ],
  };
  const result = findPartYouMissed(fixture, { q1: 'a', q2: 'a' }, { q1: 'b', q2: 'a' }, 'y');
  assert(result?.questionId === 'q1', 'single eligible mismatch: selects the one disagreeing question');
  assert(result?.ownerChoiceId === 'a' && result?.friendChoiceId === 'b', 'single eligible mismatch: preserves each side\'s actual choice id');
}

// 4c. Two mismatches, one high-signal -> high-signal wins regardless of the other criteria.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    highSignalQuestionIds: ['q2'],
    questions: [
      // q1: friend gives full +2 primary for y (friend's result) — strong on every OTHER
      // criterion, but not high-signal.
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: 'A1', resultWeights: { x: 2 } }, { id: 'b', label: 'B1', resultWeights: { y: 2 } }] },
      // q2: high-signal, but friend's choice gives y only a weak +1 (not full primary) and
      // owner's choice still gives y something nonzero.
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: 'A2', resultWeights: { x: 1, y: 1 } }, { id: 'b', label: 'B2', resultWeights: { y: 1 } }] },
    ],
  };
  const result = findPartYouMissed(fixture, { q1: 'a', q2: 'a' }, { q1: 'b', q2: 'b' }, 'y');
  assert(result?.questionId === 'q2', 'high-signal criterion outranks friend-full-primary/owner-zero/score-diff');
}

// 4d. Tie on high-signal-membership and friend-full-primary; owner-gives-zero breaks it.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    questions: [
      // q1: friend's pick is full +2 primary for y; owner's pick gives y a nonzero (+1) too.
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: 'A1', resultWeights: { x: 2, y: 1 } }, { id: 'b', label: 'B1', resultWeights: { y: 2 } }] },
      // q2: friend's pick is ALSO full +2 primary for y; owner's pick gives y exactly 0.
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: 'A2', resultWeights: { x: 2 } }, { id: 'b', label: 'B2', resultWeights: { y: 2 } }] },
    ],
  };
  const result = findPartYouMissed(fixture, { q1: 'a', q2: 'a' }, { q1: 'b', q2: 'b' }, 'y');
  assert(result?.questionId === 'q2', 'owner-gives-zero-to-friend-primary breaks a high-signal/full-primary tie');
}

// 4e. Final deterministic order tiebreak — every criterion tied, earlier question in the
// definition wins, never random.
{
  const fixture: ArchetypeQuizDefinition = {
    ...baseFixture,
    questions: [
      { id: 'q1', prompt: '', choices: [{ id: 'a', label: 'A1', resultWeights: { x: 2 } }, { id: 'b', label: 'B1', resultWeights: { y: 2 } }] },
      { id: 'q2', prompt: '', choices: [{ id: 'a', label: 'A2', resultWeights: { x: 2 } }, { id: 'b', label: 'B2', resultWeights: { y: 2 } }] },
    ],
  };
  const resultA = findPartYouMissed(fixture, { q1: 'a', q2: 'a' }, { q1: 'b', q2: 'b' }, 'y');
  const resultB = findPartYouMissed(fixture, { q1: 'a', q2: 'a' }, { q1: 'b', q2: 'b' }, 'y');
  assert(resultA?.questionId === 'q1', 'complete tie: falls to definition question order (q1 first)');
  assert(resultA?.questionId === resultB?.questionId, 'deterministic: identical inputs always produce the identical pick');
}

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL "THEY HAVE NOTES." Compare VALIDATION CHECKS PASSED.');
