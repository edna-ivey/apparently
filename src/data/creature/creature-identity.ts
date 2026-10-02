import {
  PERSONALITY_DIMENSIONS,
  getCoreCreatureInputTraits,
  type PersonalityDimensionId,
  type PersonalityProfile,
  type SignatureTrait,
} from '@/data/personality';
import type { CreatureTestCategory, CreatureTestSlot } from '@/data/creature-test/creature-test-assets';

// PERSISTENCE (Build 8 Creature v1 polish pass): the personality profile remains the sole
// source of truth. buildCreatureIdentity below is a pure function of PersonalityProfile --
// nothing here is written to Supabase or persisted as a canonical recipe. If a user's
// qualifying Core traits change later (new evidence, expiration, etc.), calling this again
// naturally yields an updated CreatureIdentity -- the Creature can evolve by construction,
// with no separate migration or sync step.
//
// EXTENSION POINT -- a future "Your Creature evolved" product moment would compare a
// previously-seen CreatureIdentity (its `name`/`recipe` only -- small, not raw evidence)
// against a freshly-resolved one and detect a meaningful change. That comparison, and any
// storage of the "previously seen" snapshot, does NOT exist yet (see
// src/data/creature/creature-reveal-state.ts for the one thing that IS persisted today -- a
// local, presentation-only "has the first reveal already played" flag, which is not an
// identity snapshot and cannot influence what Creature renders).
export type CreatureCharacteristic = CreatureTestCategory;
export type CreatureRecipe = Record<CreatureTestSlot, CreatureCharacteristic>;

export const CREATURE_SLOT_BY_RANK: readonly CreatureTestSlot[] = [
  'eyes',
  'earsHorns',
  'wings',
  'body',
  'tail',
] as const;

export const CHARACTERISTIC_NAMING_ROOTS: Record<
  CreatureCharacteristic,
  { first: string; second: string }
> = {
  strong: { first: 'Vara', second: 'Stone' },
  sentimental: { first: 'Sera', second: 'Pearl' },
  grounded: { first: 'Tera', second: 'Moss' },
  curious: { first: 'Lumi', second: 'Fox' },
  playful: { first: 'Jovi', second: 'Dash' },
  visionary: { first: 'Nova', second: 'Moon' },
  bold: { first: 'Zora', second: 'Blaze' },
  harmonious: { first: 'Mira', second: 'Sage' },
};

type PoleCharacteristic = {
  positive: CreatureCharacteristic;
  negative: CreatureCharacteristic;
};

// Core trait pole -> creature characteristic.
// This is intentionally keyed by dimension + pole rather than display string so copy changes
// do not silently change a user's Creature identity.
export const CORE_POLE_CHARACTERISTICS: Partial<
  Record<PersonalityDimensionId, PoleCharacteristic>
> = {
  planner_spontaneous: { positive: 'grounded', negative: 'playful' },
  emotional_intensity: { positive: 'sentimental', negative: 'grounded' },
  direct_indirect: { positive: 'bold', negative: 'harmonious' },
  social_attunement: { positive: 'curious', negative: 'grounded' },
  protective_hands_off: { positive: 'strong', negative: 'visionary' },
  adventure_comfort: { positive: 'playful', negative: 'sentimental' },
  independent_collaborative: { positive: 'strong', negative: 'harmonious' },
  control_allowing: { positive: 'strong', negative: 'playful' },
  practical_idealistic: { positive: 'grounded', negative: 'visionary' },
  sentimental_thick_skinned: { positive: 'sentimental', negative: 'strong' },
  rules_bending: { positive: 'grounded', negative: 'playful' },
  conflict_peacekeeping: { positive: 'bold', negative: 'harmonious' },
  trust_verify: { positive: 'sentimental', negative: 'curious' },
  forgiving_receipts: { positive: 'harmonious', negative: 'strong' },
  playful_serious: { positive: 'playful', negative: 'visionary' },
  competitive_cooperative: { positive: 'bold', negative: 'harmonious' },
  curious_decisive: { positive: 'curious', negative: 'bold' },
  private_open: { positive: 'strong', negative: 'curious' },
  patient_urgent: { positive: 'grounded', negative: 'bold' },
  ambitious_content: { positive: 'visionary', negative: 'harmonious' },
};

export type CreatureTraitAssignment = {
  rank: number;
  slot: CreatureTestSlot;
  trait: SignatureTrait;
  characteristic: CreatureCharacteristic;
};

export type CreatureIdentity = {
  name: string | null;
  recipe: Partial<CreatureRecipe>;
  assignments: CreatureTraitAssignment[];
  isComplete: boolean;
};

const getDimensionDefinition = (id: PersonalityDimensionId) =>
  PERSONALITY_DIMENSIONS.find((dimension) => dimension.id === id);

export function resolveTraitCharacteristic(trait: SignatureTrait): CreatureCharacteristic {
  const mapping = CORE_POLE_CHARACTERISTICS[trait.id];
  const dimension = getDimensionDefinition(trait.id);

  if (!mapping || !dimension || dimension.type !== 'core') {
    throw new Error(`Creature mapping missing for Core trait dimension: ${trait.id}`);
  }

  // SignatureTrait.name carries the actual pole label (e.g. "Direct"/"Indirect") --
  // SignatureTrait.displayName is the unrelated ALL-CAPS tagline (dimension.displayPole, e.g.
  // "SAY IT WITH YOUR CHEST") and can never equal dimension.positiveLabel/negativeLabel. Using
  // .displayName here was a bug: it made every real qualifying trait throw.
  if (trait.name === dimension.positiveLabel) {
    return mapping.positive;
  }

  if (trait.name === dimension.negativeLabel) {
    return mapping.negative;
  }

  throw new Error(
    `Creature trait pole could not be resolved for ${trait.id}: "${trait.name}"`,
  );
}

export function buildCreatureName(
  firstCharacteristic: CreatureCharacteristic,
  secondCharacteristic: CreatureCharacteristic,
): string {
  const firstRoot = CHARACTERISTIC_NAMING_ROOTS[firstCharacteristic].first;
  const secondRoot = CHARACTERISTIC_NAMING_ROOTS[secondCharacteristic].second;
  return `${firstRoot}${secondRoot.toLowerCase()}`;
}

export function buildCreatureIdentity(profile: PersonalityProfile): CreatureIdentity {
  const traits = getCoreCreatureInputTraits(profile).slice(0, CREATURE_SLOT_BY_RANK.length);

  const assignments = traits.map((trait, index) => ({
    rank: index + 1,
    slot: CREATURE_SLOT_BY_RANK[index],
    trait,
    characteristic: resolveTraitCharacteristic(trait),
  }));

  const recipe = assignments.reduce<Partial<CreatureRecipe>>((acc, assignment) => {
    acc[assignment.slot] = assignment.characteristic;
    return acc;
  }, {});

  const name =
    assignments.length >= 2
      ? buildCreatureName(assignments[0].characteristic, assignments[1].characteristic)
      : null;

  return {
    name,
    recipe,
    assignments,
    isComplete: assignments.length === CREATURE_SLOT_BY_RANK.length,
  };
}
