// Deterministic validation for First Form, immediate first mixed form, and global Friday
// Creature evolution. Run with:
//
//   npx tsx scripts/validate-creature-evolution.ts

import {
  buildCreatureIdentity,
  buildFirstFormIdentity,
  type CreatureIdentity,
  type CreatureRecipe,
} from '../src/data/creature/creature-identity';
import {
  checkWeeklyEvolution,
  createMixedCreatureSnapshot,
  FIRST_FORM_ANSWER_THRESHOLD,
  FIRST_MIXED_FORM_ANSWER_THRESHOLD,
  getLatestFridayCheckpointKey,
  getNextFridayCheckpointKey,
  getPendingEvolutionCheckpointKey,
  isFirstFormEligible,
  isFirstMixedFormEligible,
} from '../src/data/creature/creature-progression';
import {
  scorePersonalityProfile,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
} from '../src/data/personality';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (condition) {
    console.log(`OK: ${message}`);
    return;
  }
  failures += 1;
  console.error(`FAIL: ${message}`);
};

let answerSequence = 0;
const qualifyingAnswers = (
  dimension: PersonalityDimensionId,
  sign: 1 | -1,
  points: number,
): PersonalityAnswerEvidence[] => {
  const answers: PersonalityAnswerEvidence[] = [];
  let remaining = points;
  while (remaining > 0) {
    const chunk = remaining >= 2 ? 2 : 1;
    answerSequence += 1;
    answers.push({
      question: `evolution-${answerSequence}`,
      category: 'validation',
      chosenAnswer: 'validated',
      effects: [{ dimension, value: (sign * chunk) as 1 | 2 | -1 | -2 }],
    });
    remaining -= chunk;
  }
  return answers;
};

const completeIdentity = (answers: PersonalityAnswerEvidence[]): CreatureIdentity & {
  name: string;
  recipe: CreatureRecipe;
} => {
  const identity = buildCreatureIdentity(scorePersonalityProfile(answers));
  if (!identity.isComplete || identity.name === null) {
    throw new Error('Validation fixture did not create a complete mixed Creature.');
  }
  return identity as CreatureIdentity & { name: string; recipe: CreatureRecipe };
};

const zorafoxAnswers = (): PersonalityAnswerEvidence[] => [
  ...qualifyingAnswers('direct_indirect', 1, 10),
  ...qualifyingAnswers('social_attunement', 1, 9),
  ...qualifyingAnswers('forgiving_receipts', -1, 8),
  ...qualifyingAnswers('trust_verify', -1, 7),
  ...qualifyingAnswers('practical_idealistic', 1, 6),
];

const alternateAnswers = (): PersonalityAnswerEvidence[] => [
  ...qualifyingAnswers('curious_decisive', 1, 12),
  ...qualifyingAnswers('playful_serious', 1, 11),
  ...qualifyingAnswers('sentimental_thick_skinned', 1, 10),
  ...qualifyingAnswers('ambitious_content', 1, 9),
  ...qualifyingAnswers('conflict_peacekeeping', -1, 8),
];

// First Form: one real top Core trait, copied across all five visual parts, with only the
// characteristic's first root as its name.
{
  const profile = scorePersonalityProfile(qualifyingAnswers('curious_decisive', 1, 6));
  const firstForm = buildFirstFormIdentity(profile);
  assert(firstForm !== null, 'a qualifying Core trait derives a First Form');
  assert(firstForm?.name === 'Lumi', `Curious First Form uses only first root "Lumi" (got ${firstForm?.name})`);
  assert(
    firstForm !== null && Object.values(firstForm.recipe).every((value) => value === 'curious'),
    'First Form fills all five visual parts with the same Curious family',
  );
  assert(
    firstForm !== null && Object.keys(firstForm.recipe).length === 5,
    'First Form is a complete five-part Creature, not a partial reveal',
  );

  assert(FIRST_FORM_ANSWER_THRESHOLD === 8, 'First Form answer threshold is exactly 8');
  assert(!isFirstFormEligible(7, firstForm), '7 answers never unlock First Form');
  assert(isFirstFormEligible(8, firstForm), '8 answers plus a qualifying Core trait unlock First Form');
  assert(!isFirstFormEligible(8, null), '8 answers without a qualifying Core trait stays placeholder');
}

// First mixed form: both gates are mandatory, with the locked Zorafox fixture unchanged.
{
  const candidate = completeIdentity(zorafoxAnswers());
  assert(FIRST_MIXED_FORM_ANSWER_THRESHOLD === 50, 'first mixed answer threshold is exactly 50');
  assert(!isFirstMixedFormEligible(49, candidate), '49 answers never unlock the first mixed form');
  assert(isFirstMixedFormEligible(50, candidate), '50 answers plus five qualifying traits unlock immediately');
  assert(
    !isFirstMixedFormEligible(50, buildCreatureIdentity(scorePersonalityProfile(qualifyingAnswers('direct_indirect', 1, 8)))),
    '50 answers without five qualifying traits does not unlock a mixed form',
  );
  assert(candidate.name === 'Zorafox', `locked fixture name remains exactly Zorafox (got ${candidate.name})`);
  assert(
    JSON.stringify(candidate.recipe) === JSON.stringify({
      eyes: 'bold',
      earsHorns: 'curious',
      wings: 'strong',
      body: 'curious',
      tail: 'grounded',
    }),
    `Zorafox keeps the exact locked rank-to-part result (got ${JSON.stringify(candidate.recipe)})`,
  );

  const sameProfile = scorePersonalityProfile(zorafoxAnswers());
  assert(
    JSON.stringify(buildCreatureIdentity(sameProfile)) === JSON.stringify(buildCreatureIdentity(sameProfile)),
    'the same current profile always derives the same mixed candidate',
  );
}

// Friday helpers use local calendar constructors. They never pass through UTC date strings.
{
  const thu = new Date(2026, 9, 1, 12);
  const fri = new Date(2026, 9, 2, 12);
  const sat = new Date(2026, 9, 3, 12);
  const nextFri = new Date(2026, 9, 9, 12);
  assert(getLatestFridayCheckpointKey(thu) === '2026-09-25', 'Thu Oct 1 -> latest checkpoint Sep 25');
  assert(getNextFridayCheckpointKey(thu) === '2026-10-02', 'Thu Oct 1 -> next checkpoint Oct 2');
  assert(getLatestFridayCheckpointKey(fri) === '2026-10-02', 'Fri Oct 2 -> checkpoint Oct 2');
  assert(getLatestFridayCheckpointKey(sat) === '2026-10-02', 'Sat Oct 3 -> latest checkpoint Oct 2');
  assert(getLatestFridayCheckpointKey(nextFri) === '2026-10-09', 'Fri Oct 9 -> latest checkpoint Oct 9');
}

const zorafox = completeIdentity(zorafoxAnswers());

// A Thursday reveal is eligible the next day. A Friday reveal skips its own checkpoint.
{
  const thursdaySnapshot = createMixedCreatureSnapshot(zorafox, new Date(2026, 9, 1, 12));
  const fridaySnapshot = createMixedCreatureSnapshot(zorafox, new Date(2026, 9, 2, 12));
  assert(
    getPendingEvolutionCheckpointKey(new Date(2026, 9, 2, 12), thursdaySnapshot) === '2026-10-02',
    'first mixed reveal Thursday Oct 1 is eligible Friday Oct 2',
  );
  assert(
    getPendingEvolutionCheckpointKey(new Date(2026, 9, 2, 18), fridaySnapshot) === null,
    'first mixed reveal Friday Oct 2 is not eligible again that day',
  );
  assert(
    getPendingEvolutionCheckpointKey(new Date(2026, 9, 9, 12), fridaySnapshot) === '2026-10-09',
    'first mixed reveal Friday Oct 2 becomes eligible Friday Oct 9',
  );
}

// Weekly unchanged and changed paths both mark the offered Friday checked. Only the changed
// path replaces the visible recipe/name; merely deriving a different live candidate does not.
{
  const initial = createMixedCreatureSnapshot(zorafox, new Date(2026, 9, 1, 12));
  const unchanged = checkWeeklyEvolution(initial, zorafox, '2026-10-02');
  assert(unchanged.outcome === 'unchanged', 'weekly check reports unchanged for the same candidate');
  assert(unchanged.snapshot.lastCheckedEvolutionDate === '2026-10-02', 'unchanged path marks Oct 2 checked');
  assert(
    JSON.stringify(unchanged.snapshot.recipe) === JSON.stringify(initial.recipe),
    'unchanged path keeps the revealed recipe',
  );

  const alternate = completeIdentity(alternateAnswers());
  const visibleBeforeCheck = JSON.stringify(initial);
  void alternate; // Derivation alone is intentionally unable to mutate the presentation snapshot.
  assert(
    JSON.stringify(initial) === visibleBeforeCheck,
    'visible mixed snapshot stays stable between checkpoints even when the live candidate changes',
  );

  const changed = checkWeeklyEvolution(initial, alternate, '2026-10-02');
  assert(changed.outcome === 'changed', 'weekly check reports changed for a different candidate');
  assert(changed.changes.length > 0, 'changed path provides user-friendly change details');
  assert(changed.snapshot.name === alternate.name, 'changed path reveals the current candidate name');
  assert(
    JSON.stringify(changed.snapshot.recipe) === JSON.stringify(alternate.recipe),
    'changed path persists the current candidate Creature',
  );
  assert(changed.snapshot.lastCheckedEvolutionDate === '2026-10-02', 'changed path marks Oct 2 checked');
  assert(
    getPendingEvolutionCheckpointKey(new Date(2026, 9, 8, 12), changed.snapshot) === null,
    'no additional prompt appears between checked global Fridays',
  );
  assert(
    getPendingEvolutionCheckpointKey(new Date(2026, 9, 23, 12), changed.snapshot) === '2026-10-23',
    'missing multiple weeks offers only the latest catch-up checkpoint',
  );

}

if (failures > 0) {
  console.error(`\n${failures} Creature evolution check(s) FAILED.`);
  process.exit(1);
}

console.log('\nALL Creature progression/evolution validation checks PASSED.');
