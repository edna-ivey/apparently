// Content integrity for "What's Your Type?" (Build 16, owner-supplied content handoff).
// Verifies structural completeness and pole-validity -- NOT a claim that the copy itself was
// independently verified against any external recording/attachment; see
// whats-your-type-content.ts's header comment and docs/whats-your-type-approved-copy.md for
// the actual provenance (supplied directly in the implementation conversation).
//
// Run with: npx tsx scripts/validate-whats-your-type-content.ts

import { ATTRACTION_ARCHETYPE_IDS, PARTNER_ARCHETYPE_IDS, WHATS_YOUR_TYPE_QUESTIONS } from '../src/data/quizzes/whats-your-type-content';
import { ATTRACTION_RESULTS, COMBINATION_RESULTS, PARTNER_RESULTS, WHATS_YOUR_TYPE_DEFINITION } from '../src/data/quizzes/whats-your-type-results';
import { ALL_POLE_IDS, poleIsPrivate } from '../src/data/personality-v2/pole-ids';
import { resolveCombinationKey, scoreDualDimensionQuiz } from '../src/data/quizzes/scoring';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const POLE_SET = new Set(ALL_POLE_IDS);

// ============================================================================================
// 10 questions x 6 answers = 60. Two axes, 5 questions each.
// ============================================================================================

assert(WHATS_YOUR_TYPE_QUESTIONS.length === 10, `exactly 10 questions (got ${WHATS_YOUR_TYPE_QUESTIONS.length})`);
const attractionQuestions = WHATS_YOUR_TYPE_QUESTIONS.filter((q) => q.axis === 'attraction');
const partnerQuestions = WHATS_YOUR_TYPE_QUESTIONS.filter((q) => q.axis === 'partnerEnergy');
assert(attractionQuestions.length === 5, `exactly 5 Attraction-axis questions (got ${attractionQuestions.length})`);
assert(partnerQuestions.length === 5, `exactly 5 Partner Energy-axis questions (got ${partnerQuestions.length})`);

let totalChoices = 0;
for (const question of WHATS_YOUR_TYPE_QUESTIONS) {
  assert(question.choices.length === 6, `${question.id}: exactly 6 choices (got ${question.choices.length})`);
  totalChoices += question.choices.length;

  const validArchetypes = question.axis === 'attraction' ? ATTRACTION_ARCHETYPE_IDS : PARTNER_ARCHETYPE_IDS;
  for (const choice of question.choices) {
    assert(
      (validArchetypes as readonly string[]).includes(choice.archetype),
      `${question.id}/${choice.id}: archetype "${choice.archetype}" is valid for the ${question.axis} axis`,
    );
    assert(typeof choice.label === 'string' && choice.label.trim().length > 0, `${question.id}/${choice.id}: has nonempty label text`);

    // Attraction (Q1-5) must never carry Core evidence -- "never infer personality from
    // traits someone wants in a partner."
    if (question.axis === 'attraction') {
      assert(choice.coreAwards.length === 0, `${question.id}/${choice.id}: Attraction-axis choice carries zero Core evidence`);
    }

    for (const award of choice.coreAwards) {
      assert(POLE_SET.has(award.pole), `${question.id}/${choice.id}: "${award.pole}" is a real canonical pole id`);
      assert([1, 2, 3].includes(award.points), `${question.id}/${choice.id}: ${award.pole} points is 1, 2, or 3 (got ${award.points})`);
      assert(!poleIsPrivate(award.pole), `${question.id}/${choice.id}: "${award.pole}" is a Core pole, never Private (this is a Free quiz)`);
    }
  }

  // All 6 choices on one question must map to 6 DISTINCT archetypes (no two answers feeding
  // the same archetype, which would make that archetype structurally easier to reach).
  const archetypesUsed = new Set(question.choices.map((c) => c.archetype));
  assert(archetypesUsed.size === 6, `${question.id}: all 6 choices map to 6 distinct archetypes (got ${archetypesUsed.size} distinct)`);
}
assert(totalChoices === 60, `exactly 60 total answer choices (got ${totalChoices})`);

// Every archetype (both axes) is reachable from exactly 5 choices across its 5 questions --
// confirms "all 12 archetypes are reachable" structurally, not just by spot-check.
for (const archetypeId of [...ATTRACTION_ARCHETYPE_IDS, ...PARTNER_ARCHETYPE_IDS]) {
  const supportingQuestions = WHATS_YOUR_TYPE_QUESTIONS.filter((q) => q.choices.some((c) => c.archetype === archetypeId));
  assert(supportingQuestions.length === 5, `${archetypeId}: reachable from exactly 5 questions (got ${supportingQuestions.length})`);
}

// ============================================================================================
// 12 individual results, 36 combination results, stable keys.
// ============================================================================================

assert(Object.keys(ATTRACTION_RESULTS).length === 6, `exactly 6 Attraction individual results (got ${Object.keys(ATTRACTION_RESULTS).length})`);
assert(Object.keys(PARTNER_RESULTS).length === 6, `exactly 6 Partner Energy individual results (got ${Object.keys(PARTNER_RESULTS).length})`);
for (const id of ATTRACTION_ARCHETYPE_IDS) {
  const result = ATTRACTION_RESULTS[id];
  assert(!!result && result.hook.trim().length > 0 && result.body.trim().length > 0, `${id}: has a nonempty hook and body`);
}
for (const id of PARTNER_ARCHETYPE_IDS) {
  const result = PARTNER_RESULTS[id];
  assert(!!result && result.hook.trim().length > 0 && result.body.trim().length > 0, `${id}: has a nonempty hook and body`);
}

assert(Object.keys(COMBINATION_RESULTS).length === 36, `exactly 36 combination results (got ${Object.keys(COMBINATION_RESULTS).length})`);
let missingCombinations = 0;
for (const attraction of ATTRACTION_ARCHETYPE_IDS) {
  for (const partner of PARTNER_ARCHETYPE_IDS) {
    const key = resolveCombinationKey(attraction, partner);
    const result = COMBINATION_RESULTS[key];
    if (!result || result.key !== key || !result.body.trim()) {
      missingCombinations += 1;
      console.error(`FAIL: missing or malformed combination for "${key}"`);
    }
  }
}
assert(missingCombinations === 0, `all 36 of 36 (6x6) combinations present, correctly keyed, nonempty (${missingCombinations} missing/malformed)`);

// No two combinations accidentally share a key (would silently overwrite one in the Record).
const allKeys = Object.values(COMBINATION_RESULTS).map((r) => r.key);
assert(new Set(allKeys).size === allKeys.length, 'no duplicate combination keys');

// ============================================================================================
// End-to-end scoring: build a DualDimensionQuizDefinition from the real content and exercise
// scoreDualDimensionQuiz across representative answer sets, confirming every combination the
// real content can produce actually resolves.
// ============================================================================================

const definition = WHATS_YOUR_TYPE_DEFINITION;

let scoredCombinations = 0;
for (const attractionChoiceLetter of ['a', 'b', 'c', 'd', 'e', 'f'] as const) {
  for (const partnerChoiceLetter of ['a', 'b', 'c', 'd', 'e', 'f'] as const) {
    const answers: Record<string, string> = {};
    for (const q of attractionQuestions) answers[q.id] = attractionChoiceLetter;
    for (const q of partnerQuestions) answers[q.id] = partnerChoiceLetter;
    try {
      const result = scoreDualDimensionQuiz(definition, answers);
      scoredCombinations += 1;
      if (!result.combination.body) {
        failures += 1;
        console.error(`FAIL: scored combination for ${attractionChoiceLetter}/${partnerChoiceLetter} has no body`);
      }
    } catch (error) {
      failures += 1;
      console.error(`FAIL: scoring threw for choice-letter pattern ${attractionChoiceLetter}/${partnerChoiceLetter}: ${(error as Error).message}`);
    }
  }
}
assert(scoredCombinations === 36, `all 36 (6x6) answer-letter patterns scored to a real combination with no throw (got ${scoredCombinations})`);

// Deterministic: scoring the exact same answers twice gives the exact same result.
{
  const answers: Record<string, string> = {};
  attractionQuestions.forEach((q) => { answers[q.id] = 'c'; });
  partnerQuestions.forEach((q) => { answers[q.id] = 'e'; });
  const first = scoreDualDimensionQuiz(definition, answers);
  const second = scoreDualDimensionQuiz(definition, answers);
  assert(JSON.stringify(first) === JSON.stringify(second), 'scoring the same answers twice is deterministic');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL "What\'s Your Type?" content integrity (60 answers, 12 individual results, 36 combinations, pole validity, end-to-end scoring) VALIDATION CHECKS PASSED.');
