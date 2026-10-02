// End-to-end validation for the Creature v1 identity resolver (src/data/creature/
// creature-identity.ts) against the locked Creature rules: 8 characteristics, 5 ranked slots
// (Eyes/Ears-Horns/Wings/Body/Tail), locked naming roots, and the SAME ranked Core identity
// source Your Signature uses (profile.topTraits via getCoreCreatureInputTraits) -- never a
// second ranking system. Run with:
//
//   npx tsx scripts/validate-creature-identity.ts

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import {
  buildCreatureIdentity,
  CHARACTERISTIC_NAMING_ROOTS,
  CORE_POLE_CHARACTERISTICS,
  CREATURE_SLOT_BY_RANK,
} from '../src/data/creature/creature-identity';
import { isCoreDimension, isPrivateDimension, scorePersonalityProfile, type PersonalityAnswerEvidence, type PersonalityDimensionId } from '../src/data/personality';
import type { CreatureTestCategory } from '../src/data/creature-test/creature-test-assets';

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

const qualifyingAnswers = (dimension: PersonalityDimensionId, sign: 1 | -1, points: number): PersonalityAnswerEvidence[] => {
  const out: PersonalityAnswerEvidence[] = [];
  let remaining = points;
  while (remaining > 0) {
    const chunk = remaining >= 2 ? 2 : 1;
    out.push({ question: `q-${dimension}-${Math.random()}`, category: 'test', chosenAnswer: 'a', effects: [{ dimension, value: (sign * chunk) as 1 | 2 | -1 | -2 }] });
    remaining -= chunk;
  }
  return out;
};

// ============================================================================================
// LOCKED STRUCTURE CHECKS
// ============================================================================================

assert(CREATURE_SLOT_BY_RANK.length === 5, `exactly 5 ranked slots (got ${CREATURE_SLOT_BY_RANK.length})`);
assert(
  JSON.stringify(CREATURE_SLOT_BY_RANK) === JSON.stringify(['eyes', 'earsHorns', 'wings', 'body', 'tail']),
  'rank-to-slot order is exactly Eyes / Ears-Horns / Wings / Body / Tail -- never reordered, never a 6th/7th slot',
);

const EXPECTED_CHARACTERISTICS: CreatureTestCategory[] = ['strong', 'sentimental', 'grounded', 'curious', 'playful', 'visionary', 'bold', 'harmonious'];
assert(
  JSON.stringify(Object.keys(CHARACTERISTIC_NAMING_ROOTS).sort()) === JSON.stringify([...EXPECTED_CHARACTERISTICS].sort()),
  'exactly the 8 locked characteristics have naming roots -- none added, none removed',
);

const EXPECTED_ROOTS: Record<string, { first: string; second: string }> = {
  strong: { first: 'Vara', second: 'Stone' },
  sentimental: { first: 'Sera', second: 'Pearl' },
  grounded: { first: 'Tera', second: 'Moss' },
  curious: { first: 'Lumi', second: 'Fox' },
  playful: { first: 'Jovi', second: 'Dash' },
  visionary: { first: 'Nova', second: 'Moon' },
  bold: { first: 'Zora', second: 'Blaze' },
  harmonious: { first: 'Mira', second: 'Sage' },
};
for (const characteristic of EXPECTED_CHARACTERISTICS) {
  assert(
    JSON.stringify(CHARACTERISTIC_NAMING_ROOTS[characteristic]) === JSON.stringify(EXPECTED_ROOTS[characteristic]),
    `naming roots for "${characteristic}" exactly match the locked spec`,
  );
}

// Every Core-20 dimension has a pole->characteristic mapping (no silently-missing Core trait).
const CORE_20: PersonalityDimensionId[] = [
  'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
  'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
  'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
  'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
  'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
];
assert(
  CORE_20.every((id) => CORE_POLE_CHARACTERISTICS[id] !== undefined),
  'every one of the 20 Core dimensions has a pole->characteristic mapping (no Core trait can crash the resolver)',
);
assert(
  CORE_20.every((id) => EXPECTED_CHARACTERISTICS.includes((CORE_POLE_CHARACTERISTICS[id] as { positive: CreatureTestCategory }).positive))
    && CORE_20.every((id) => EXPECTED_CHARACTERISTICS.includes((CORE_POLE_CHARACTERISTICS[id] as { negative: CreatureTestCategory }).negative)),
  'every mapped pole resolves to one of the 8 locked characteristics -- no invented 9th category',
);

// ============================================================================================
// STATE B — fewer than 5 qualifying Core traits: partial, never fake-complete.
// ============================================================================================

{
  const answers = [
    ...qualifyingAnswers('direct_indirect', 1, 6),
    ...qualifyingAnswers('social_attunement', 1, 5),
    ...qualifyingAnswers('forgiving_receipts', -1, 4), // "Holds the Receipt" (negative pole)
  ];
  const profile = scorePersonalityProfile(answers);
  const identity = buildCreatureIdentity(profile);
  assert(identity.assignments.length === 3, `Case B: exactly 3 qualifying Core traits -> 3 assignments (got ${identity.assignments.length})`);
  assert(identity.isComplete === false, 'Case B: isComplete is false with fewer than 5 qualifying traits');
  assert(
    JSON.stringify(Object.keys(identity.recipe).sort()) === JSON.stringify(['earsHorns', 'eyes', 'wings'].sort()),
    `Case B: only the slots for ranks 1-3 are populated, never a fabricated 4th/5th slot (got ${JSON.stringify(Object.keys(identity.recipe))})`,
  );
  assert(identity.name !== null, 'Case B: with 2+ qualifying traits (3 here), a name IS still computed from ranks 1-2, even though the Creature itself stays incomplete');
}

{
  // Exactly 1 qualifying trait -- name requires at least 2 characteristics; with only 1, name
  // must be null, never a single-root guess.
  const profile = scorePersonalityProfile(qualifyingAnswers('direct_indirect', 1, 6));
  const identity = buildCreatureIdentity(profile);
  assert(identity.assignments.length === 1 && identity.name === null, 'Case B (1 trait): name is null, never a fabricated single-root name');
}

// ============================================================================================
// STATE C — exactly 5 qualifying Core traits: full recipe, correct rank-to-slot order.
// ============================================================================================

{
  const dims: PersonalityDimensionId[] = ['direct_indirect', 'social_attunement', 'forgiving_receipts', 'trust_verify', 'practical_idealistic'];
  const answers = dims.flatMap((dimension, index) => qualifyingAnswers(dimension, 1, 10 - index));
  const profile = scorePersonalityProfile(answers);
  const identity = buildCreatureIdentity(profile);
  assert(identity.assignments.length === 5 && identity.isComplete === true, `Case C: exactly 5 qualifying traits -> isComplete (got ${identity.assignments.length} assignments, isComplete=${identity.isComplete})`);
  assert(identity.assignments[0].slot === 'eyes', 'Case C: rank 1 -> eyes');
  assert(identity.assignments[1].slot === 'earsHorns', 'Case C: rank 2 -> earsHorns');
  assert(identity.assignments[2].slot === 'wings', 'Case C: rank 3 -> wings');
  assert(identity.assignments[3].slot === 'body', 'Case C: rank 4 -> body');
  assert(identity.assignments[4].slot === 'tail', 'Case C: rank 5 -> tail');
  assert(Object.keys(identity.recipe).length === 5, 'Case C: the recipe has exactly 5 entries, never a 6th/7th');
}

// ============================================================================================
// STATE D / EXPLICIT VALIDATION CASE -- the exact profile from the task:
//   1. Direct -> Bold -> Eyes
//   2. Vibe Checker -> Curious -> Ears/Horns
//   3. Holds the Receipt -> Strong -> Wings
//   4. Verify First -> Curious -> Body
//   5. Practical -> Grounded -> Tail
// Expected name: Zorafox. Expected recipe: eyes=bold, earsHorns=curious, wings=strong,
// body=curious, tail=grounded.
// ============================================================================================

{
  const answers = [
    ...qualifyingAnswers('direct_indirect', 1, 10), // Direct (positive) -> bold, rank 1 (strongest)
    ...qualifyingAnswers('social_attunement', 1, 9), // Vibe checker (positive) -> curious, rank 2
    ...qualifyingAnswers('forgiving_receipts', -1, 8), // Holds the Receipt (negative) -> strong, rank 3
    ...qualifyingAnswers('trust_verify', -1, 7), // Verify first (negative) -> curious, rank 4
    ...qualifyingAnswers('practical_idealistic', 1, 6), // Practical (positive) -> grounded, rank 5
  ];
  const profile = scorePersonalityProfile(answers);
  const identity = buildCreatureIdentity(profile);

  assert(identity.isComplete === true, 'Zorafox fixture: resolves to a complete (5-slot) Creature');
  assert(identity.recipe.eyes === 'bold', `Zorafox fixture: eyes = bold (got ${identity.recipe.eyes})`);
  assert(identity.recipe.earsHorns === 'curious', `Zorafox fixture: earsHorns = curious (got ${identity.recipe.earsHorns})`);
  assert(identity.recipe.wings === 'strong', `Zorafox fixture: wings = strong (got ${identity.recipe.wings})`);
  assert(identity.recipe.body === 'curious', `Zorafox fixture: body = curious (got ${identity.recipe.body})`);
  assert(identity.recipe.tail === 'grounded', `Zorafox fixture: tail = grounded (got ${identity.recipe.tail})`);
  assert(identity.name === 'Zorafox', `Zorafox fixture: name is exactly "Zorafox" (got "${identity.name}")`);
}

// Naming is a pure function of the top-two characteristics only -- not order-sensitive to
// anything else, and deterministic (no Math.random/Date.now anywhere in the module).
{
  const creatureIdentitySource = read('../src/data/creature/creature-identity.ts');
  assert(!/Math\.random|Date\.now/.test(creatureIdentitySource), 'creature-identity.ts contains no Math.random/Date.now -- naming and recipe resolution are fully deterministic');
}

// ============================================================================================
// STATE E — determinism: the SAME profile data produces the SAME Creature on repeated calls
// (simulating refresh/relaunch, since buildCreatureIdentity is a pure function of profile data
// alone -- no transient/browser-only state is consulted).
// ============================================================================================

{
  const dims: PersonalityDimensionId[] = ['direct_indirect', 'social_attunement', 'forgiving_receipts', 'trust_verify', 'practical_idealistic'];
  const answers = dims.flatMap((dimension, index) => qualifyingAnswers(dimension, 1, 10 - index));
  const profile = scorePersonalityProfile(answers);
  const first = buildCreatureIdentity(profile);
  const second = buildCreatureIdentity(profile);
  assert(JSON.stringify(first) === JSON.stringify(second), 'Case E: calling buildCreatureIdentity twice on identical profile data produces an identical result (name, recipe, assignments)');
}

// ============================================================================================
// SAME RANKING SOURCE AS YOUR SIGNATURE -- no second ranking system.
// ============================================================================================

{
  const creatureIdentitySource = read('../src/data/creature/creature-identity.ts');
  assert(/getCoreCreatureInputTraits/.test(creatureIdentitySource), 'buildCreatureIdentity reads getCoreCreatureInputTraits (= profile.topTraits), the same ranked Core list Your Signature uses');
  assert(!/\.sort\(/.test(creatureIdentitySource), 'creature-identity.ts performs no ranking/sorting of its own -- it only slices the already-ranked topTraits list');
}

// ============================================================================================
// CORE / PRIVATE BOUNDARY -- Private-12 evidence never enters the Creature recipe, even when
// strongly qualified.
// ============================================================================================

{
  const answers: PersonalityAnswerEvidence[] = [
    ...qualifyingAnswers('tactful_blunt', -1, 10), // Private -- must NEVER reach the Creature
    ...qualifyingAnswers('direct_indirect', 1, 9),
    ...qualifyingAnswers('social_attunement', 1, 8),
    ...qualifyingAnswers('forgiving_receipts', -1, 7),
    ...qualifyingAnswers('trust_verify', -1, 6),
    ...qualifyingAnswers('practical_idealistic', 1, 5),
  ];
  const profile = scorePersonalityProfile(answers);
  const identity = buildCreatureIdentity(profile);
  assert(identity.assignments.every((a) => isCoreDimension(a.trait.id)), 'every Creature slot assignment traces back to a Core dimension');
  assert(identity.assignments.every((a) => !isPrivateDimension(a.trait.id)), 'no Private-12 dimension ever appears in a Creature slot assignment, even when it strongly qualifies');
  assert(identity.assignments.length === 5, 'the 6-qualifying-trait profile (1 Private + 5 Core) still yields exactly 5 Core-only Creature assignments');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Creature v1 identity (locked structure, Zorafox fixture, determinism, Core/Private boundary) VALIDATION CHECKS PASSED.');
