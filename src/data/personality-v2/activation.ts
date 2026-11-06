import { getSignatureStrengthLabel, type SignatureTrait } from '@/data/personality';
import { MAX_PRIVATE_SIGNALS, type PrivateSignalTrait } from '@/data/private-signals';
import { poleIsCore, poleIsPrivate } from './pole-ids';
import { collapseToOnePerDimension, type RankedPole } from './scoring-engine';
import { toSignatureTraits } from './signature-adapter';

// Build 22: V2 is now the sole, authoritative ranking engine for both Your Signature/the
// Creature (Core) and The Undercurrent/Relic (Private) -- this file no longer merges V2 into a
// V1-derived list (the old mergeCoreTraitsWithV2Gaps/mergePrivateSignalsWithV2Gaps gap-fill
// rule, retired in this pass per the Build 22 unified-scoring plan). V1's own engine
// (personality.ts's scorePersonalityProfile/resolveActiveBoardPole) is untouched and still
// read for other purposes (answer counts, the first-form/full-mixed-form reveal thresholds),
// but no longer consulted for which traits rank, fill, or qualify -- a thin V2 profile is
// simply a thin profile, with no V1 fallback to patch the gap.
//
// Bible v1.4 §16's "up to seven strongest qualifying Core trait poles" is enforced here, on
// the real, ranked, per-dimension-collapsed pole list -- not assumed by whatever happened to
// be in profile.topTraits before.
export const MAX_CORE_SIGNATURE_TRAITS = 7;

const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

// Your Signature / the Creature's real input: rankPoles' output, collapsed to one entry per
// Core dimension (collapseToOnePerDimension -- see its own comment for why this collapse is
// necessary now that ranking is per-pole, not per-dimension), capped at 7. Creature input is
// this exact same list, sliced again to 5 by creature-identity.ts -- never a second ranking.
export const rankCoreSignatureTraits = (ranked: readonly RankedPole[]): SignatureTrait[] =>
  toSignatureTraits(collapseToOnePerDimension(ranked, poleIsCore).slice(0, MAX_CORE_SIGNATURE_TRAITS));

// The Undercurrent / Relic's real input: the identical collapse rule, filtered to Private
// poles instead of Core, capped at the same MAX_PRIVATE_SIGNALS private-signals.ts already
// enforces -- converted to the simpler PrivateSignalTrait[] shape selectRelicSlots reads.
// Label/strength text is never invented here -- getSignatureStrengthLabel and poleLabel (via
// toSignatureTraits) are the same already-approved functions/content the old V1 path used for
// these same dimensions.
export const rankPrivateSignalTraits = (ranked: readonly RankedPole[]): PrivateSignalTrait[] =>
  toSignatureTraits(collapseToOnePerDimension(ranked, poleIsPrivate).slice(0, MAX_PRIVATE_SIGNALS)).map((trait) => ({
    dimension: trait.id,
    label: trait.displayName,
    strengthLabel: trait.evidenceCount >= 2 ? getSignatureStrengthLabel(trait.signatureStrength) : getEarlySignalLabel(trait.evidenceCount),
    signatureStrength: trait.signatureStrength,
    evidenceCount: trait.evidenceCount,
  }));
