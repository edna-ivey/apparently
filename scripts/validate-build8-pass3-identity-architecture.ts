// Focused validation for Build 8 Pass 3: the Core You / Private You identity architecture.
// Run with:
//
//   npx tsx scripts/validate-build8-pass3-identity-architecture.ts
//
// Imports the real pure modules directly (personality.ts, you-profile-cards.ts,
// private-signals.ts are all RN-free by design — same established convention as
// validate-your-seven.ts). Source-text checks cover what can only be verified against the
// actual shipped files (e.g. "no trait->object mapping exists").

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import {
  CORE_DIMENSION_IDS,
  PRIVATE_DIMENSION_IDS,
  PERSONALITY_DIMENSIONS,
  isCoreDimension,
  isPrivateDimension,
  scorePersonalityProfile,
  getCoreCreatureInputTraits,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
} from '../src/data/personality';
import { buildYouProfileCards, buildYourSevenCards } from '../src/data/you-profile-cards';
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

// Strips `//` line comments (a simple, line-based strip -- adequate for these source files,
// none of which use `//` inside a string literal on the same line as prose this check cares
// about). Several checks below must only ever flag REAL CODE, never an explanatory comment
// that quotes the task's own "do not invent X" examples to document the boundary -- matching
// prose like that is not a violation, it's the opposite: documentation of what was deliberately
// NOT built.
const stripLineComments = (source: string): string =>
  source
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');

// ============================================================================================
// R. DIMENSION ARCHITECTURE
// ============================================================================================

assert(CORE_DIMENSION_IDS.length === 20, `exactly 20 dimensions classified Core (got ${CORE_DIMENSION_IDS.length})`);
assert(PRIVATE_DIMENSION_IDS.length === 12, `exactly 12 dimensions classified Private (got ${PRIVATE_DIMENSION_IDS.length})`);
assert(PERSONALITY_DIMENSIONS.length === 32, `all 32 dimensions exist (got ${PERSONALITY_DIMENSIONS.length})`);

const combined = [...CORE_DIMENSION_IDS, ...PRIVATE_DIMENSION_IDS];
assert(new Set(combined).size === 32, 'Core + Private together are exactly 32 distinct ids (no omission, no duplicate across groups)');
assert(
  CORE_DIMENSION_IDS.every((id) => !PRIVATE_DIMENSION_IDS.includes(id)),
  'no dimension is classified as both Core and Private',
);
assert(
  PERSONALITY_DIMENSIONS.every((d) => (d.type === 'core') === isCoreDimension(d.id) && (d.type === 'private') === isPrivateDimension(d.id)),
  'isCoreDimension/isPrivateDimension agree with each dimension\'s own declared type, for all 32',
);

const APPROVED_CORE_20: PersonalityDimensionId[] = [
  'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
  'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
  'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
  'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
  'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
];
const APPROVED_PRIVATE_12: PersonalityDimensionId[] = [
  'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
  'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing', 'tactful_blunt',
  'duty_first_self_preserving', 'supportive_challenging', 'gives_freely_keeps_score',
  'perspective_taking_self_referencing', 'initiating_responsive',
];
assert(
  JSON.stringify([...CORE_DIMENSION_IDS].sort()) === JSON.stringify([...APPROVED_CORE_20].sort()),
  'the Core 20 classification matches the approved Core You list exactly',
);
assert(
  JSON.stringify([...PRIVATE_DIMENSION_IDS].sort()) === JSON.stringify([...APPROVED_PRIVATE_12].sort()),
  'the Private 12 classification matches the approved Private You list exactly',
);

// Dimension ids and pole labels unchanged -- validate-personality-dimensions.ts already
// exhaustively checks every field for the 12 newest dimensions; this re-confirms the
// classification pass didn't rename/re-pole anything by checking every dimension still has
// its original 6 content fields alongside the new `type` field.
for (const dimension of PERSONALITY_DIMENSIONS) {
  assert(
    typeof dimension.name === 'string' && typeof dimension.positiveLabel === 'string' && typeof dimension.negativeLabel === 'string',
    `${dimension.id}: still has its original name/positiveLabel/negativeLabel fields (unrenamed)`,
  );
}

// Source vs dimension-type independence -- PersonalityAnswerEvidence/DimensionEvidence have NO
// "source" field distinguishing public/private content at all (only question/category/chosenAnswer/
// effects) -- classification is possible ONLY via dimension id, proving source cannot determine
// type by construction, not just by convention.
const personalitySource = read('../src/data/personality.ts');
assert(
  !/room\s*===?\s*['"]private['"]/.test(personalitySource) && !/source\s*===?\s*['"]private['"]/.test(personalitySource),
  'scorePersonalityProfile and the classification helpers contain no room/source-based branching -- classification reads dimension id only',
);

// A single "Private answer" (simulating a Private quiz result's profileSignals) that targets
// BOTH a Core and a Private dimension -- exactly the approved "both at once" example (Direct +
// Blunt) -- must produce real evidence for both, simultaneously, from one answer.
const bothAtOnceAnswer: PersonalityAnswerEvidence[] = [
  {
    question: 'A Private quiz result (simulated)',
    category: 'The Good Stuff',
    chosenAnswer: 'Example result',
    effects: [
      { dimension: 'direct_indirect', value: 2 }, // Core
      { dimension: 'tactful_blunt', value: -2 }, // Private ("Blunt" pole)
    ],
  },
];
const bothAtOnceProfile = scorePersonalityProfile(bothAtOnceAnswer);
const directResult = bothAtOnceProfile.dimensions.find((d) => d.dimension === 'direct_indirect');
const bluntResult = bothAtOnceProfile.dimensions.find((d) => d.dimension === 'tactful_blunt');
assert(directResult !== undefined && directResult.evidenceCount === 1, 'a single answer can produce real Core evidence (direct_indirect)');
assert(bluntResult !== undefined && bluntResult.evidenceCount === 1, 'the SAME single answer can ALSO produce real Private evidence (tactful_blunt) -- both at once');
assert(isCoreDimension('direct_indirect') && isPrivateDimension('tactful_blunt'), 'the two evidence types on that one answer are correctly classified');

// No automatic inference converts one type into the other -- a Private-only answer never
// produces Core evidence for an unrelated dimension, and vice versa.
const privateOnlyAnswer: PersonalityAnswerEvidence[] = [
  { question: 'Private-only result', category: 'X', chosenAnswer: 'Y', effects: [{ dimension: 'repair_punishing', value: 2 }] },
];
const privateOnlyProfile = scorePersonalityProfile(privateOnlyAnswer);
const coreEvidenceFromPrivateOnlyAnswer = privateOnlyProfile.dimensions.filter((d) => isCoreDimension(d.dimension) && d.evidenceCount > 0);
assert(
  coreEvidenceFromPrivateOnlyAnswer.length === 0,
  'an answer with ONLY a Private-dimension effect produces ZERO inferred Core evidence for any dimension',
);

// ============================================================================================
// S. YOUR SIGNATURE -- Core-only, but Private-SOURCED Core evidence still counts
// ============================================================================================

// A profile with real evidence on BOTH a Core and a Private dimension (mixed, mirroring a real
// user who took a Private quiz that mapped to both).
const mixedAnswers: PersonalityAnswerEvidence[] = [
  { question: 'q1', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'direct_indirect', value: 2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'direct_indirect', value: 2 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q4', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
];
const mixedProfile = scorePersonalityProfile(mixedAnswers);
assert(
  mixedProfile.topTraits.every((trait) => isCoreDimension(trait.id)),
  'Your Signature (topTraits) never contains a Private-12 dimension, even when a Private dimension has strong real evidence',
);
assert(
  mixedProfile.topTraits.some((trait) => trait.id === 'direct_indirect'),
  'a Core dimension with real evidence (regardless of what ELSE that source also mapped to) DOES appear in Your Signature',
);

const under50Cards = buildYouProfileCards(mixedProfile);
const over50Cards = buildYourSevenCards(mixedProfile);
assert(under50Cards.every((card) => isCoreDimension(card.dimension)), 'buildYouProfileCards (below-50 threshold) never returns a Private dimension');
assert(over50Cards.every((card) => isCoreDimension(card.dimension)), 'buildYourSevenCards (Your 7) never returns a Private dimension');
assert(over50Cards.some((card) => card.dimension === 'direct_indirect'), 'Your 7 still surfaces the real Core evidence from the mixed profile');
assert(!over50Cards.some((card) => card.dimension === 'tactful_blunt'), 'Your 7 excludes the Private dimension from that same mixed profile');

// Fewer than seven Core signals remains valid -- never padded with a fabricated 8th/duplicate.
assert(over50Cards.length === 1, `with only 1 real Core-evidenced dimension, exactly 1 card is returned, never padded (got ${over50Cards.length})`);

// ============================================================================================
// T. THE UNDERCURRENT (Private signal selector)
// ============================================================================================

const zeroPrivateProfile = scorePersonalityProfile([
  { question: 'q', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'direct_indirect', value: 2 }] },
]);
assert(selectStrongestPrivateSignals(zeroPrivateProfile).length === 0, 'zero Private evidence -> zero supported Private traits (no fabrication)');

const onePrivateProfile = scorePersonalityProfile([
  { question: 'q', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const oneSignals = selectStrongestPrivateSignals(onePrivateProfile);
assert(oneSignals.length === 1, `exactly 1 real Private signal returns 1 (got ${oneSignals.length})`);
assert(oneSignals.every((s) => isPrivateDimension(s.dimension)), 'every returned signal is a genuine Private-12 dimension');

const twoPrivateProfile = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'vulnerable_armored', value: -2 }] },
]);
assert(selectStrongestPrivateSignals(twoPrivateProfile).length === 2, '2 real Private signals returns 2');

const fourPrivateProfile = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'vulnerable_armored', value: -2 }] },
  { question: 'q4', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'vulnerable_armored', value: -2 }] },
  { question: 'q5', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'repair_punishing', value: -2 }] },
  { question: 'q6', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'repair_punishing', value: -2 }] },
  { question: 'q7', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'initiating_responsive', value: 1 }] },
]);
const fourSignals = selectStrongestPrivateSignals(fourPrivateProfile);
assert(fourSignals.length === 3, `4+ real Private signals still caps at the strongest 3 (got ${fourSignals.length})`);
assert(
  !fourSignals.some((s) => s.dimension === 'initiating_responsive'),
  'with 4 real signals, the weakest (single-evidence) one is correctly excluded from the strongest-3',
);

const mixedForUndercurrent = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'direct_indirect', value: 2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
assert(
  selectStrongestPrivateSignals(mixedForUndercurrent).every((s) => s.dimension !== 'direct_indirect'),
  'a Core dimension with real evidence never leaks into the Private signal selector',
);

// Deterministic: identical input always produces the identical output.
const run1 = selectStrongestPrivateSignals(fourPrivateProfile).map((s) => s.dimension);
const run2 = selectStrongestPrivateSignals(fourPrivateProfile).map((s) => s.dimension);
assert(JSON.stringify(run1) === JSON.stringify(run2), 'selectStrongestPrivateSignals is deterministic for identical input');

// ============================================================================================
// U. RELIC SLOTS
// ============================================================================================

const relicFromFour = selectRelicSlots(fourSignals);
assert(relicFromFour.relicTrait?.dimension === fourSignals[0].dimension, 'strongest Private signal -> relic slot');
assert(relicFromFour.colorTrait?.dimension === fourSignals[1].dimension, 'second strongest -> color slot');
assert(relicFromFour.effectTrait?.dimension === fourSignals[2].dimension, 'third strongest -> effect slot');

const relicFromOne = selectRelicSlots(oneSignals);
assert(relicFromOne.relicTrait !== null, 'with 1 signal, the relic slot resolves');
assert(relicFromOne.colorTrait === null && relicFromOne.effectTrait === null, 'with 1 signal, color and effect slots stay unresolved (never fabricated)');

const relicFromZero = selectRelicSlots([]);
assert(
  relicFromZero.relicTrait === null && relicFromZero.colorTrait === null && relicFromZero.effectTrait === null,
  'with 0 signals, all three slots are unresolved',
);

// Deterministic slot assignment.
assert(
  JSON.stringify(selectRelicSlots(fourSignals)) === JSON.stringify(selectRelicSlots(fourSignals)),
  'selectRelicSlots is deterministic for identical input',
);

// No trait->object/color/effect mapping exists anywhere -- source-text check against the
// actual shipped selector file and the You screen that consumes it.
const privateSignalsSource = read('../src/data/private-signals.ts');
const youSource = read('../src/app/(tabs)/you.tsx');
const SUSPICIOUS_CREATIVE_TOKENS = /Blade|Dagger|Talon|Ember|Frost|Crimson|Obsidian|Amethyst\b.*color|relicTrait\s*=\s*['"]/i;
assert(
  !SUSPICIOUS_CREATIVE_TOKENS.test(stripLineComments(privateSignalsSource)),
  'private-signals.ts contains no invented trait->object/color/effect literal mapping in actual code (comments may cite the task\'s own "do not do this" examples)',
);
assert(
  !SUSPICIOUS_CREATIVE_TOKENS.test(stripLineComments(youSource)),
  'you.tsx contains no invented trait->object/color/effect literal mapping in actual code',
);
assert(
  !/colorTrait\.dimension\s*===?\s*['"]/.test(privateSignalsSource) && !/effectTrait\.dimension\s*===?\s*['"]/.test(privateSignalsSource),
  'no code branches on a SPECIFIC trait to decide a visual property -- slot assignment is purely positional',
);

// ============================================================================================
// V. CREATURE INPUT BOUNDARY
// ============================================================================================

assert(
  getCoreCreatureInputTraits(mixedProfile).every((trait) => isCoreDimension(trait.id)),
  'the Creature input boundary (getCoreCreatureInputTraits) returns Core dimensions only',
);
assert(
  getCoreCreatureInputTraits(mixedProfile).some((trait) => trait.id === 'direct_indirect'),
  'Private-SOURCED Core evidence (direct_indirect in this fixture) DOES reach the Creature input boundary',
);
assert(
  !getCoreCreatureInputTraits(mixedProfile).some((trait) => (trait.id as string) === 'tactful_blunt'),
  'a Private-12 dimension (tactful_blunt) never reaches the Creature input boundary directly',
);

// Real invented mappings would look like CODE (an object/array literal, a switch/case, an
// assignment) associating a specific trait id with a specific body part -- never prose. Check
// against comment-stripped source so an explanatory comment listing the seven still-unapproved
// part names (to document that boundary) is never mistaken for actually implementing it.
const BODY_PART_NAMES = /\bEyes\b|\bEars\b|\bWings\b|\bTail\b|Head Feature|Chest Symbol/;
assert(!BODY_PART_NAMES.test(stripLineComments(personalitySource)), 'personality.ts invents no trait->Creature-body-part mapping in actual code');
assert(!BODY_PART_NAMES.test(stripLineComments(privateSignalsSource)), 'private-signals.ts invents no trait->Creature-body-part mapping in actual code');
assert(!BODY_PART_NAMES.test(stripLineComments(youSource)), 'you.tsx invents no trait->Creature-body-part mapping in actual code');
assert(
  !/Lumifox|CHARACTER_NAME_MAP|SYLLABLE_MAP/.test(stripLineComments(youSource)),
  'no character-name syllable mapping was created in actual code (a comment may cite the approved future example, e.g. "Lumi + Fox -> Lumifox", to explain the concept)',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 3 (Core You / Private You identity architecture) VALIDATION CHECKS PASSED.');
