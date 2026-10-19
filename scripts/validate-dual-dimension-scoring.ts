// Validates the content-independent dual-dimension scoring engine (scoreDualDimensionQuiz,
// src/data/quizzes/scoring.ts) -- built for "What's Your Type?" per the Build 16 brief, but
// using entirely SYNTHETIC trait/question/choice ids throughout this file, never the real
// approved archetype names or copy. That real content could not be located in this repository,
// in docs/, or in any conversation record accessible in this session (confirmed by direct
// search); this script proves the ENGINE is correct and ready, independent of that content
// gap -- see the Build 16 completion report for the full content-transfer dependency note.
//
// Run with: npx tsx scripts/validate-dual-dimension-scoring.ts

import { resolveCombinationKey, scoreDualDimensionQuiz } from '../src/data/quizzes/scoring';
import type { DualDimensionQuizDefinition, QuizCombinationResult, QuizDimensionArchetype, QuizQuestion } from '../src/data/quizzes/types';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// Synthetic fixture: 2 questions per dimension (not the real 5), 3 archetypes per dimension
// (not the real 6) -- small enough to reason about exhaustively, structurally identical shape.
const DIM_A: QuizDimensionArchetype[] = [{ id: 'a1', title: 'Synthetic A1' }, { id: 'a2', title: 'Synthetic A2' }, { id: 'a3', title: 'Synthetic A3' }];
const DIM_B: QuizDimensionArchetype[] = [{ id: 'b1', title: 'Synthetic B1' }, { id: 'b2', title: 'Synthetic B2' }, { id: 'b3', title: 'Synthetic B3' }];

const questions: QuizQuestion[] = [
  { id: 'qa1', prompt: 'Synthetic A question 1', choices: [
    { id: 'x', label: 'x', resultWeights: { a1: 2 } },
    { id: 'y', label: 'y', resultWeights: { a2: 2 } },
    { id: 'z', label: 'z', resultWeights: { a3: 2 } },
  ] },
  { id: 'qa2', prompt: 'Synthetic A question 2', choices: [
    { id: 'x', label: 'x', resultWeights: { a1: 2 } },
    { id: 'y', label: 'y', resultWeights: { a2: 2 } },
    { id: 'z', label: 'z', resultWeights: { a3: 2 } },
  ] },
  { id: 'qb1', prompt: 'Synthetic B question 1', choices: [
    { id: 'x', label: 'x', resultWeights: { b1: 2 } },
    { id: 'y', label: 'y', resultWeights: { b2: 2 } },
    { id: 'z', label: 'z', resultWeights: { b3: 2 } },
  ] },
  { id: 'qb2', prompt: 'Synthetic B question 2', choices: [
    { id: 'x', label: 'x', resultWeights: { b1: 2 } },
    { id: 'y', label: 'y', resultWeights: { b2: 2 } },
    { id: 'z', label: 'z', resultWeights: { b3: 2 } },
  ] },
];

const combinations: Record<string, QuizCombinationResult> = {};
for (const a of DIM_A) {
  for (const b of DIM_B) {
    const key = resolveCombinationKey(a.id, b.id);
    combinations[key] = { id: key, title: `Synthetic combination ${key}` };
  }
}

const definition: DualDimensionQuizDefinition = {
  id: 'synthetic-dual-dimension-fixture',
  title: 'Synthetic Fixture',
  category: 'Ridiculous',
  access: 'free',
  eyebrow: '',
  introSupport: [],
  meta: '',
  introCta: '',
  questions,
  scoringType: 'dualDimension',
  dimensionALabel: 'Synthetic Dimension A',
  dimensionBLabel: 'Synthetic Dimension B',
  dimensionAQuestionIds: ['qa1', 'qa2'],
  dimensionBQuestionIds: ['qb1', 'qb2'],
  dimensionAArchetypes: DIM_A,
  dimensionBArchetypes: DIM_B,
  combinations,
};

// ============================================================================================
// All 9 combinations (3x3) resolve correctly and deterministically.
// ============================================================================================
{
  let checked = 0;
  for (const a of ['x', 'y', 'z']) {
    for (const b of ['x', 'y', 'z']) {
      const answers = { qa1: a, qa2: a, qb1: b, qb2: b };
      const result = scoreDualDimensionQuiz(definition, answers);
      const expectedA = ({ x: 'a1', y: 'a2', z: 'a3' } as Record<string, string>)[a];
      const expectedB = ({ x: 'b1', y: 'b2', z: 'b3' } as Record<string, string>)[b];
      assert(result.dimensionA.archetypeId === expectedA, `clean ${a}/${a} answers resolve dimension A to ${expectedA} (got ${result.dimensionA.archetypeId})`);
      assert(result.dimensionB.archetypeId === expectedB, `clean ${b}/${b} answers resolve dimension B to ${expectedB} (got ${result.dimensionB.archetypeId})`);
      assert(result.combination.id === resolveCombinationKey(expectedA, expectedB), `combination resolves to the exact ${expectedA}:${expectedB} authored entry`);
      checked += 1;
    }
  }
  console.log(`OK: all ${checked} of 9 synthetic combinations resolved correctly`);
}

// ============================================================================================
// Independence: dimension A's answers never affect dimension B's winner, and vice versa.
// ============================================================================================
{
  const r1 = scoreDualDimensionQuiz(definition, { qa1: 'x', qa2: 'x', qb1: 'z', qb2: 'z' });
  const r2 = scoreDualDimensionQuiz(definition, { qa1: 'y', qa2: 'y', qb1: 'z', qb2: 'z' });
  assert(r1.dimensionB.archetypeId === r2.dimensionB.archetypeId, 'changing dimension A answers never changes dimension B\'s winner');
  assert(r1.dimensionA.archetypeId !== r2.dimensionA.archetypeId, 'sanity: the two runs really did pick different dimension A answers');
}

// ============================================================================================
// Deterministic tie-break: a genuine tie resolves the same way every time (never random).
// ============================================================================================
{
  const tiedAnswers = { qa1: 'x', qa2: 'y', qb1: 'x', qb2: 'y' }; // a1 and a2 tied 2-2; b1 and b2 tied 2-2
  const first = scoreDualDimensionQuiz(definition, tiedAnswers);
  const second = scoreDualDimensionQuiz(definition, tiedAnswers);
  assert(JSON.stringify(first) === JSON.stringify(second), 'a genuine tie resolves identically on repeated calls (deterministic, never random)');
  assert(first.dimensionA.archetypeId === 'a2', 'tie-break picks the most recent (last-answered) question\'s winner within that dimension (qa2 = a2)');
  assert(first.dimensionB.archetypeId === 'b2', 'tie-break picks the most recent (last-answered) question\'s winner within that dimension (qb2 = b2)');
}

// ============================================================================================
// Missing combination throws rather than fabricating filler copy.
// ============================================================================================
{
  const incompleteCombinations = { ...combinations };
  delete incompleteCombinations[resolveCombinationKey('a1', 'b1')];
  const incompleteDefinition: DualDimensionQuizDefinition = { ...definition, combinations: incompleteCombinations };
  let threw = false;
  try {
    scoreDualDimensionQuiz(incompleteDefinition, { qa1: 'x', qa2: 'x', qb1: 'x', qb2: 'x' });
  } catch {
    threw = true;
  }
  assert(threw, 'a missing combination entry throws rather than silently fabricating a result');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL dual-dimension scoring engine (independence, deterministic tie-break, missing-combination guard) VALIDATION CHECKS PASSED.');
console.log('\nNOTE: this validates the ENGINE only, using synthetic fixtures. "What\'s Your Type?" itself remains unregistered -- its approved question/answer/result copy could not be located; see the Build 16 completion report\'s content-transfer dependency note.');
