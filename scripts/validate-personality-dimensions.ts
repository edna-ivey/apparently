// Standalone validation for the 12-dimension personality expansion (20 -> 32) and the approved
// Private -> You result-level profile mappings. Run with:
//
//   npx tsx scripts/validate-personality-dimensions.ts
//
// Same conventions as scripts/validate-keep-you-around.ts. Does NOT import supabase.ts/
// personality-service.ts (RN-unparseable import chain outside Metro) — the actual
// submit_quiz_result RPC round-trip for the new dimensions is verified live instead (see the
// engineering sprint report's live-testing section), not here.

import { BE_SO_SERIOUS_QUIZ } from '../src/data/quizzes/be-so-serious';
import { KEEP_YOU_AROUND_QUIZ } from '../src/data/quizzes/keep-you-around';
import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId } from '../src/data/personality';

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
// 1. EXACTLY 32 CANONICAL DIMENSIONS — no #33, no accidental duplicate/removal
// ============================================================================================

assert(PERSONALITY_DIMENSIONS.length === 32, `exactly 32 canonical dimensions (got ${PERSONALITY_DIMENSIONS.length})`);
const ids = PERSONALITY_DIMENSIONS.map((d) => d.id);
assert(new Set(ids).size === ids.length, 'every dimension id is unique (no duplicates)');

const ORIGINAL_20: PersonalityDimensionId[] = [
  'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
  'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
  'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
  'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
  'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
];
assert(
  ORIGINAL_20.every((id) => ids.includes(id)),
  'all 20 original dimension ids are still present (none renamed/removed)',
);

const NEW_12: PersonalityDimensionId[] = [
  'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
  'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing', 'tactful_blunt',
  'duty_first_self_preserving', 'supportive_challenging', 'gives_freely_keeps_score',
  'perspective_taking_self_referencing', 'initiating_responsive',
];
assert(NEW_12.length === 12, 'exactly 12 new dimension ids listed for this check');
assert(
  new Set([...ORIGINAL_20, ...NEW_12]).size === 32 && ids.every((id) => [...ORIGINAL_20, ...NEW_12].includes(id)),
  'the full 32-id set is exactly ORIGINAL_20 + NEW_12, nothing else',
);

// ============================================================================================
// 2. THE 12 NEW DIMENSIONS — exact approved id/labels/poles/explanation/flavor
// ============================================================================================

const APPROVED_NEW_DIMENSIONS = [
  {
    id: 'accountability_defensiveness', name: 'Accountability ↔ Defensiveness',
    positivePole: 'OWNS IT', positiveLabel: 'Accountability',
    negativePole: 'BUILDING MY CASE', negativeLabel: 'Defensiveness',
    explanation: 'How readily someone can own their part when confronted versus explaining, countering, or defending before taking responsibility.',
    flavor: 'Being wrong is uncomfortable. What happens next says a lot.',
  },
  {
    id: 'reflective_reactive', name: 'Reflective ↔ Reactive',
    positivePole: 'LET ME THINK', positiveLabel: 'Reflective',
    negativePole: 'I FELT IT, I DID IT', negativeLabel: 'Reactive',
    explanation: 'Tendency to examine an emotional reaction before acting versus responding directly from the feeling in the moment.',
    flavor: 'The first feeling is information. It does not always need the microphone.',
  },
  {
    id: 'self_secure_reassurance', name: 'Self-Secure ↔ Reassurance-Seeking',
    positivePole: 'I KNOW WE’RE GOOD', positiveLabel: 'Self-secure',
    negativePole: 'SHOW ME WE’RE GOOD', negativeLabel: 'Reassurance-seeking',
    explanation: 'How much security comes from within versus needing external signs of attention, affection, approval, or desire.',
    flavor: 'Sometimes you know. Sometimes you need a receipt.',
  },
  {
    id: 'boundary_holding_approval_seeking', name: 'Boundary-Holding ↔ Approval-Seeking',
    positivePole: 'THEY CAN BE MAD', positiveLabel: 'Boundary-holding',
    negativePole: 'KEEP EVERYBODY HAPPY', negativeLabel: 'Approval-seeking',
    explanation: 'Willingness to maintain a limit even when someone dislikes it versus changing course to avoid disappointment or disapproval.',
    flavor: 'A boundary gets interesting when somebody does not like it.',
  },
  {
    id: 'vulnerable_armored', name: 'Vulnerable ↔ Armored',
    positivePole: 'SAY THE SOFT THING', positiveLabel: 'Vulnerable',
    negativePole: 'PROTECT THE SOFT SPOT', negativeLabel: 'Armored',
    explanation: 'Willingness to reveal hurt, fear, need, embarrassment, or insecurity versus protecting those feelings behind distance, strength, humor, or control.',
    flavor: 'Some feelings come out. Others arrive wearing armor.',
  },
  {
    id: 'repair_punishing', name: 'Repair-Oriented ↔ Punishing',
    positivePole: 'LET’S FIX IT', positiveLabel: 'Repair-oriented',
    negativePole: 'YOU’RE GOING TO FEEL THIS', negativeLabel: 'Punishing',
    explanation: 'Whether hurt tends to move toward direct repair versus distance, retaliation, withdrawal, or behavior meant to make the other person feel the rupture.',
    flavor: 'Being hurt and making sure they feel it are not always the same thing.',
  },
  {
    id: 'tactful_blunt', name: 'Tactful ↔ Blunt',
    positivePole: 'PROTECT THE LANDING', positiveLabel: 'Tactful',
    negativePole: 'SAY THE SHARP THING', negativeLabel: 'Blunt',
    explanation: 'How much someone adjusts timing, tone, and wording to protect the delivery of a truth versus prioritizing saying it plainly and sharply.',
    flavor: 'The truth can arrive with a cushion or a folding chair. 😂',
  },
  {
    id: 'duty_first_self_preserving', name: 'Duty-First ↔ Self-Preserving',
    positivePole: 'I’LL SHOW UP', positiveLabel: 'Duty-first',
    negativePole: 'I CAN’T CARRY EVERYBODY', negativeLabel: 'Self-preserving',
    explanation: 'How strongly someone feels responsible for showing up, helping, and carrying their part versus protecting their own energy and limits.',
    flavor: 'Caring can become a responsibility faster than anybody notices.',
  },
  {
    id: 'supportive_challenging', name: 'Supportive ↔ Challenging',
    positivePole: 'I’M IN YOUR CORNER', positiveLabel: 'Supportive',
    negativePole: 'I’M GOING TO PUSH YOU', negativeLabel: 'Challenging',
    explanation: "Whether someone's instinct is to encourage and reinforce people versus challenge them, question them, or push them toward a harder truth.",
    flavor: 'Sometimes love says “You’ve got this.” Sometimes it says “Be serious.”',
  },
  {
    id: 'gives_freely_keeps_score', name: 'Gives Freely ↔ Keeps Score',
    positivePole: 'NO LEDGER', positiveLabel: 'Gives freely',
    negativePole: 'I REMEMBER WHAT I GAVE', negativeLabel: 'Keeps score',
    explanation: 'Whether favors, sacrifices, and support are given without much tracking versus becoming part of an internal record of reciprocity.',
    flavor: 'Some people forget the favor. Some people remember the invoice.',
  },
  {
    id: 'perspective_taking_self_referencing', name: 'Perspective-Taking ↔ Self-Referencing',
    positivePole: 'I CAN SEE YOUR SIDE', positiveLabel: 'Perspective-taking',
    negativePole: 'BUT HERE’S WHY I DID IT', negativeLabel: 'Self-referencing',
    explanation: "Ability to stay with another person's experience versus quickly returning to one's own intent, reasoning, or version of what happened.",
    flavor: "Understanding somebody's side does not require surrendering your own.",
  },
  {
    id: 'initiating_responsive', name: 'Initiating ↔ Responsive',
    positivePole: 'I START THE ENERGY', positiveLabel: 'Initiating',
    negativePole: 'I MEET THE ENERGY', negativeLabel: 'Responsive',
    explanation: 'Tendency to initiate plans, affection, conversations, romance, or intimacy versus engaging once another person opens the door.',
    flavor: 'Some people strike the match. Some people catch the flame.',
  },
] as const;

for (const approved of APPROVED_NEW_DIMENSIONS) {
  const actual = PERSONALITY_DIMENSIONS.find((d) => d.id === approved.id);
  assert(actual !== undefined, `${approved.id}: exists exactly once`);
  if (!actual) continue;
  assert(actual.name === approved.name, `${approved.id}: name matches exactly`);
  assert(actual.positivePole === approved.positivePole, `${approved.id}: positivePole matches exactly`);
  assert(actual.positiveLabel === approved.positiveLabel, `${approved.id}: positiveLabel matches exactly`);
  assert(actual.negativePole === approved.negativePole, `${approved.id}: negativePole matches exactly`);
  assert(actual.negativeLabel === approved.negativeLabel, `${approved.id}: negativeLabel matches exactly`);
  assert(actual.explanation === approved.explanation, `${approved.id}: explanation matches exactly`);
  assert(actual.flavor === approved.flavor, `${approved.id}: flavor matches exactly`);
}

// ============================================================================================
// 3. THE SQL VALIDATION ALLOW-LIST (static mirror of supabase/migrations/
//    20260922010000_expand_personality_dimensions.sql's dimension list) — kept in sync by hand
//    since a plpgsql function body can't be introspected from a Node script. A real RPC
//    round-trip using these exact ids is verified live (see sprint report) — this check only
//    proves the TS-side id set matches what THIS script asserts the SQL list to be.
// ============================================================================================

const SQL_ALLOW_LIST: string[] = [
  'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement',
  'protective_hands_off', 'adventure_comfort', 'independent_collaborative', 'control_allowing',
  'practical_idealistic', 'sentimental_thick_skinned', 'rules_bending', 'conflict_peacekeeping',
  'trust_verify', 'forgiving_receipts', 'playful_serious', 'competitive_cooperative',
  'curious_decisive', 'private_open', 'patient_urgent', 'ambitious_content',
  'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance',
  'boundary_holding_approval_seeking', 'vulnerable_armored', 'repair_punishing',
  'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
  'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive',
];
assert(SQL_ALLOW_LIST.length === 32, 'SQL allow-list mirror has exactly 32 entries');
assert(
  new Set(SQL_ALLOW_LIST).size === 32 && ids.every((id) => SQL_ALLOW_LIST.includes(id)) && SQL_ALLOW_LIST.every((id) => ids.includes(id as PersonalityDimensionId)),
  'TypeScript PERSONALITY_DIMENSIONS and the SQL allow-list mirror are byte-for-byte the same 32-id set',
);

// ============================================================================================
// 4. APPROVED PRIVATE -> YOU RESULT MAPPINGS — exact profile effect arrays, both quizzes
// ============================================================================================

type Effect = { dimension: string; value: number };
const effectsFor = (quiz: typeof KEEP_YOU_AROUND_QUIZ, resultId: string): Effect[] | undefined =>
  quiz.archetypes.find((a) => a.id === resultId)?.profileSignals as Effect[] | undefined;

const KEEP_YOU_AROUND_EXPECTED: Record<string, Effect[]> = {
  'emergency-contact': [
    { dimension: 'duty_first_self_preserving', value: 2 },
    { dimension: 'protective_hands_off', value: 1 },
    { dimension: 'practical_idealistic', value: 1 },
  ],
  'reason-theres-a-story': [
    { dimension: 'adventure_comfort', value: 2 },
    { dimension: 'planner_spontaneous', value: -1 },
    { dimension: 'playful_serious', value: 1 },
  ],
  'human-bullshit-detector': [
    { dimension: 'direct_indirect', value: 2 },
    { dimension: 'social_attunement', value: 1 },
    { dimension: 'supportive_challenging', value: -1 },
  ],
  'hype-department': [{ dimension: 'supportive_challenging', value: 2 }],
  'one-who-knows-too-much': [
    { dimension: 'social_attunement', value: 2 },
    { dimension: 'curious_decisive', value: 1 },
  ],
};

for (const [resultId, expected] of Object.entries(KEEP_YOU_AROUND_EXPECTED)) {
  const actual = effectsFor(KEEP_YOU_AROUND_QUIZ, resultId);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `keep-you-around/${resultId}: profileSignals match the approved mapping exactly`);
}
assert(effectsFor(KEEP_YOU_AROUND_QUIZ, 'hype-department')?.length === 1, 'THE HYPE DEPARTMENT has exactly ONE profile effect (no filler)');

const BE_SO_SERIOUS_EXPECTED: Record<string, Effect[]> = {
  'handles-it-well': [
    { dimension: 'accountability_defensiveness', value: 2 },
    { dimension: 'reflective_reactive', value: 1 },
    { dimension: 'emotional_intensity', value: -1 },
  ],
  'standards-control': [
    { dimension: 'control_allowing', value: 2 },
    { dimension: 'planner_spontaneous', value: 1 },
  ],
  'communicate-punish': [
    { dimension: 'repair_punishing', value: -2 },
    { dimension: 'direct_indirect', value: -1 },
    { dimension: 'vulnerable_armored', value: -1 },
  ],
  'honest-mad': [
    { dimension: 'tactful_blunt', value: -2 },
    { dimension: 'direct_indirect', value: 1 },
    { dimension: 'reflective_reactive', value: -1 },
  ],
  'accountability-turn': [
    { dimension: 'accountability_defensiveness', value: -2 },
    { dimension: 'perspective_taking_self_referencing', value: -1 },
    { dimension: 'gives_freely_keeps_score', value: -1 },
  ],
};

for (const [resultId, expected] of Object.entries(BE_SO_SERIOUS_EXPECTED)) {
  const actual = effectsFor(BE_SO_SERIOUS_QUIZ, resultId);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `be-so-serious/${resultId}: profileSignals match the approved mapping exactly`);
}

// No result across either quiz exceeds 3 effects; every dimension referenced is one of the 32
// canonical ids; every value is in {-2,-1,1,2}.
for (const quiz of [KEEP_YOU_AROUND_QUIZ, BE_SO_SERIOUS_QUIZ]) {
  for (const archetype of quiz.archetypes) {
    const effects = (archetype.profileSignals ?? []) as Effect[];
    assert(effects.length <= 3, `${quiz.id}/${archetype.id}: at most 3 profile effects (got ${effects.length})`);
    assert(effects.length >= 1, `${quiz.id}/${archetype.id}: at least 1 profile effect authored`);
    assert(
      effects.every((e) => ids.includes(e.dimension as PersonalityDimensionId)),
      `${quiz.id}/${archetype.id}: every effect dimension is a canonical id`,
    );
    assert(
      effects.every((e) => [-2, -1, 1, 2].includes(e.value)),
      `${quiz.id}/${archetype.id}: every effect value is in {-2,-1,1,2}`,
    );
    const dims = effects.map((e) => e.dimension);
    assert(new Set(dims).size === dims.length, `${quiz.id}/${archetype.id}: no duplicate dimension within one result`);
  }
}

// ============================================================================================
// 5. contributesToProfile ENABLED FOR EXACTLY THESE TWO QUIZZES, NOTHING ELSE
// ============================================================================================

assert(KEEP_YOU_AROUND_QUIZ.contributesToProfile === true, 'keep-you-around.contributesToProfile is true');
assert(BE_SO_SERIOUS_QUIZ.contributesToProfile === true, 'be-so-serious.contributesToProfile is true');

// Note: "Compare/friend responses produce ZERO profile effects" is proven two other ways
// rather than a source-grep here (which would need @types/node, not currently a project
// dependency): (1) compare-service.ts's submitCompareResponse wraps submit_compare_response,
// which has no profile_effects/personality_evidence parameter or write path at all -- see
// supabase/migrations/20260921010000_compare_they_have_notes.sql and .../20260922020000_
// compare_respondent_identity.sql, neither of which touches personality_evidence; (2) the live
// smoke test (see the engineering sprint report) submits a real Compare response and confirms
// the respondent's own personality_evidence is untouched.

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL personality-dimension / Private-profile-mapping VALIDATION CHECKS PASSED.');
