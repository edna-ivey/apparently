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

// ---------------------------------------------------------------------------------------
// Qualification (Build 8 Pass 3.1, made source-ID-aware in Pass 3.2, RECONCILED with Bible
// v1.4 in the qualification-foundation audit pass) -- "the harshness must be earned." A
// Private identity label must represent a genuine PATTERN before it becomes a persistent,
// consumer-visible part of The Undercurrent/Relic -- never a single isolated, weak answer.
// This is a display-eligibility gate on top of real evidence, not a second scoring system: it
// never deletes, hides, or recomputes anything in profile.dimensions itself -- it only decides
// which already-real dimensions are ESTABLISHED enough to surface here.
//
// Pass 3.1/3.2 implemented this as a DISTINCT-SOURCE-COUNT rule (>=1 quiz_result source OR >=2
// daily_answer sources). That rule has been retired: Bible v1.4 §15A/§43 instead defines ONE
// shared "active identity ledger" threshold -- >= 3 active cumulative RAW EVIDENCE POINTS
// toward a dimension's winning pole -- that governs BOTH Your Signature (Core) and The
// Undercurrent (Private) identically. That shared rule now lives in personality.ts
// (resolveActiveBoardPole / isActiveBoardQualified / DimensionResult.activeBoardQualified) so
// Core and Private can never drift onto two different qualification mechanics again; this
// module only ever reads the already-computed activeBoardQualified flag -- there is
// deliberately no Private-specific qualification function anymore (see
// personality.ts's isActiveBoardQualified/resolveActiveBoardPole for the real, shared rule).
//
// "What are this user's strongest supported Private traits?" -- Private-12 dimensions only
// (isPrivateDimension), QUALIFIED only via the shared Bible v1.4 active-board rule
// (activeBoardQualified -- see personality.ts's resolveActiveBoardPole for the raw-point/
// opposite-pole/timestamp-tie-break mechanics), deterministic (mature-first, then
// signatureStrength, then a fixed canonical dimension order as the final tie-break --
// identical ranking shape to buildYourSevenCards). Returns 0-3 entries: exactly as many as are
// genuinely supported AND established, never padded. Filtering unqualified dimensions out
// BEFORE ranking (rather than merely deprioritizing them) means an unqualified dimension can
// never outrank a qualified one, even with an extreme single value. A Core-20 dimension can
// never appear here regardless of its evidence, and evidence originating from ANY source (a
// Private quiz, a Private Daily) that targets a Private dimension is exactly what this reads —
// there is no separate "was this private-sourced" check because dimension TYPE alone
// determines eligibility, not source (see PersonalityDimensionType's own comment in
// personality.ts).
export const selectStrongestPrivateSignals = (profile: PersonalityProfile): PrivateSignalTrait[] => {
  const eligible = profile.dimensions.filter(
    (dimension) => isPrivateDimension(dimension.dimension) && dimension.activeBoardQualified,
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
