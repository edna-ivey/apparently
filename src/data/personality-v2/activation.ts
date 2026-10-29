import type { PersonalityProfile, SignatureTrait } from '@/data/personality';
import { getSignatureStrengthLabel } from '@/data/personality';
import { MAX_PRIVATE_SIGNALS, type PrivateSignalTrait } from '@/data/private-signals';
import { poleDimensionId, poleIsCore, poleIsPrivate } from './pole-ids';
import type { RankedPole } from './scoring-engine';
import { toSignatureTraits } from './signature-adapter';

// Build 16: the real, approved activation seam -- "where applicable" means specifically here:
// V2 is only ever used to fill a dimension the OLD engine (personality.ts) has LITERALLY ZERO
// evidence for. A dimension V1 already has any real evidence for (even a single answer, even
// if not yet "qualified") keeps its V1-derived value completely unchanged -- V2 never
// overrides, re-ranks, or contradicts a single existing evidence-backed result. This is what
// "preserve historical evidence" means in practice: no existing user's already-earned
// Creature/Signature/Relic identity can regress or change shape because V2 shipped. The only
// thing that changes for an existing user is a dimension that was previously blank (no V1
// evidence at all, so it could never appear) now having a chance to be filled once that user
// earns real V2 evidence toward it going forward. A BRAND NEW user who answers quizzes after
// this ships starts accumulating both V1 and V2 evidence from their very first answer, so this
// gap-filling rule naturally fades in importance over time as V2 coverage grows -- exactly the
// "parallel accumulation" default from docs/personality-scoring-v2-design.md section 1/11,
// made concretely load-bearing rather than left permanently inert.
//
// Label/strength text is NEVER invented here -- getSignatureStrengthLabel and poleLabel (via
// signature-adapter.ts's toSignatureTraits) are the exact same already-approved functions/
// content the V1 path already uses for these same dimensions.

const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

const dimensionsWithAnyV1Evidence = (profile: PersonalityProfile): Set<string> =>
  new Set(profile.dimensions.filter((dimension) => dimension.evidenceCount > 0).map((dimension) => dimension.dimension));

// Core/Creature path: profile.topTraits is already V1's own ranked, capped list (creature-
// identity.ts applies its own final slice on top) -- this only APPENDS V2-ranked Core poles
// whose dimension V1 has zero evidence for, in V2's own rank order, after every real V1 trait.
// Because V1 traits always come first, a user with enough V1 evidence to fill every Creature
// slot is completely unaffected -- the appended entries are simply never reached by the
// downstream .slice().
export const mergeCoreTraitsWithV2Gaps = (v1Profile: PersonalityProfile, v2Ranked: readonly RankedPole[]): SignatureTrait[] => {
  const v1Covered = dimensionsWithAnyV1Evidence(v1Profile);
  const v2OnlyCore = v2Ranked.filter((pole) => poleIsCore(pole.poleId) && !v1Covered.has(poleDimensionId(pole.poleId)));
  return [...v1Profile.topTraits, ...toSignatureTraits(v2OnlyCore)];
};

// Private/Relic path: operates on the ALREADY-SELECTED v1Signals (selectStrongestPrivateSignals's
// output), not on profile.dimensions directly -- Relic's slot-assignment logic
// (selectRelicSlots) only ever reads this simpler PrivateSignalTrait[] shape, so this stays a
// plain array merge/cap, never a reconstruction of DimensionResult's richer, authored-content
// shape. Only fills remaining slots (up to the same MAX_PRIVATE_SIGNALS cap private-signals.ts
// already enforces) when V1 didn't already fill all of them, and only with dimensions V1 has
// zero evidence for at all -- same rule as the Core path above.
export const mergePrivateSignalsWithV2Gaps = (
  v1Signals: readonly PrivateSignalTrait[],
  v1Profile: PersonalityProfile,
  v2Ranked: readonly RankedPole[],
): PrivateSignalTrait[] => {
  if (v1Signals.length >= MAX_PRIVATE_SIGNALS) {
    return [...v1Signals];
  }
  const v1Covered = dimensionsWithAnyV1Evidence(v1Profile);
  const v2OnlyPrivate = v2Ranked.filter((pole) => poleIsPrivate(pole.poleId) && !v1Covered.has(poleDimensionId(pole.poleId)));
  const v2AsPrivateSignals: PrivateSignalTrait[] = toSignatureTraits(v2OnlyPrivate).map((trait) => ({
    dimension: trait.id,
    label: trait.displayName,
    strengthLabel: trait.evidenceCount >= 2 ? getSignatureStrengthLabel(trait.signatureStrength) : getEarlySignalLabel(trait.evidenceCount),
    signatureStrength: trait.signatureStrength,
    evidenceCount: trait.evidenceCount,
  }));
  return [...v1Signals, ...v2AsPrivateSignals].slice(0, MAX_PRIVATE_SIGNALS);
};
