import {
  getSignatureStrengthLabel,
  isPrivateDimension,
  PERSONALITY_DIMENSIONS,
  type DimensionResult,
  type PersonalityDimensionId,
  type PersonalityProfile,
} from '@/data/personality';

// The deeper Private identity layer's selector/aggregator (Build 8 Pass 3). Deliberately
// generic names throughout -- "Undercurrent" is still a WORKING consumer-facing title, not a
// locked product decision, so it stays confined to UI copy (src/app/(tabs)/you.tsx) rather
// than baked into this low-level data module. Structurally this mirrors
// src/data/you-profile-cards.ts's buildYourSevenCards exactly (same ranking principles: real
// evidence only, mature-before-early-signal, signatureStrength, deterministic dimension-order
// tie-break) but is scoped to Private-12 dimensions and capped at 3, not Core-20 capped at 7.
// Pure and dependency-free (no react-native import) so it can be exercised directly by a plain
// Node validation script, same convention as you-profile-cards.ts.

const DIMENSION_ORDER = new Map(PERSONALITY_DIMENSIONS.map((dimension, index) => [dimension.id, index]));

// Deliberately modest language for a single real data point — mirrors
// you-profile-cards.ts's getEarlySignalLabel exactly (kept as its own local copy rather than
// a cross-module import, since these two selectors are meant to stay independently reusable
// — see this file's header comment).
const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

export type PrivateSignalTrait = {
  dimension: PersonalityDimensionId;
  label: string;
  strengthLabel: string;
  signatureStrength: number;
  evidenceCount: number;
};

const MAX_PRIVATE_SIGNALS = 3;

// "What are this user's strongest supported Private traits?" -- Private-12 dimensions only
// (isPrivateDimension), real stored evidence only (evidenceCount >= 1, never fabricated to
// fill three slots), deterministic (mature-first, then signatureStrength, then a fixed
// canonical dimension order as the final tie-break — identical ranking shape to
// buildYourSevenCards). Returns 0-3 entries: exactly as many as are genuinely supported, never
// padded. A Core-20 dimension can never appear here regardless of its evidence, and evidence
// originating from ANY source (a Private quiz, a Private Daily) that targets a Private
// dimension is exactly what this reads — there is no separate "was this private-sourced"
// check because dimension TYPE alone determines eligibility, not source (see
// PersonalityDimensionType's own comment in personality.ts).
export const selectStrongestPrivateSignals = (profile: PersonalityProfile): PrivateSignalTrait[] => {
  const eligible = profile.dimensions.filter(
    (dimension) => dimension.evidenceCount >= 1 && isPrivateDimension(dimension.dimension),
  );

  const ranked = [...eligible].sort((a, b) => {
    const aMature = a.evidenceCount >= 2;
    const bMature = b.evidenceCount >= 2;
    if (aMature !== bMature) {
      return aMature ? -1 : 1;
    }
    if (b.signatureStrength !== a.signatureStrength) {
      return b.signatureStrength - a.signatureStrength;
    }
    return (DIMENSION_ORDER.get(a.dimension) ?? 0) - (DIMENSION_ORDER.get(b.dimension) ?? 0);
  });

  return ranked.slice(0, MAX_PRIVATE_SIGNALS).map((dimension: DimensionResult) => ({
    dimension: dimension.dimension,
    label: dimension.displayName,
    strengthLabel:
      dimension.evidenceCount >= 2 ? getSignatureStrengthLabel(dimension.signatureStrength) : getEarlySignalLabel(dimension.evidenceCount),
    signatureStrength: dimension.signatureStrength,
    evidenceCount: dimension.evidenceCount,
  }));
};

// ---------------------------------------------------------------------------------------
// Relic slot selection (Build 8 Pass 3) -- STRUCTURE ONLY. Locked logic: strongest Private
// signal -> relic slot, second -> color slot, third -> effect slot. This identifies WHICH
// TRAIT will eventually control each authored Relic property -- it does NOT identify the
// actual object/color/effect. Those creative mappings (e.g. "Blunt -> Blade", "Armored ->
// Black") are unapproved and unauthored; nothing here or downstream of it may invent them.
// ---------------------------------------------------------------------------------------

export type RelicSlotAssignment = {
  relicTrait: PrivateSignalTrait | null;
  colorTrait: PrivateSignalTrait | null;
  effectTrait: PrivateSignalTrait | null;
};

export const selectRelicSlots = (signals: PrivateSignalTrait[]): RelicSlotAssignment => ({
  relicTrait: signals[0] ?? null,
  colorTrait: signals[1] ?? null,
  effectTrait: signals[2] ?? null,
});
