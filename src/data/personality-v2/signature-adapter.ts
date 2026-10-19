import { poleDimensionId, poleIsCore, poleLabel, type PersonalityPoleId } from './pole-ids';
import type { RankedPole } from './scoring-engine';
import type { SignatureTrait } from '@/data/personality';

// Compatibility bridge ONLY -- proves (and is tested to prove, see scripts/
// validate-personality-v2-scoring.ts) that V2's ranked output can be consumed by every
// existing SignatureTrait[] reader (Your Signature, creature-identity.ts's
// buildCreatureIdentity/buildFirstFormIdentity, creature-combined-read-copy.ts) with ZERO
// changes to any of those files.
//
// NOT wired into any live call site. personality.ts's scorePersonalityProfile /
// getCoreCreatureInputTraits are completely untouched by Build 16/V2 -- every current screen
// keeps reading today's signed-evidence ranking exactly as before. Swapping a real call site
// to use this adapter's output instead is a SEPARATE, explicitly-approved cutover decision
// (see docs/personality-scoring-v2-design.md's "Rollout" section) -- this module exists so
// that decision, whenever it's made, has a ready, already-tested bridge rather than a fresh
// design exercise under time pressure.
//
// percent/normalizedScore/signatureStrength/confidence/breadth below are presentation-shaped
// values filled from V2's OWN stats (earnedPercent, lifetimeEarned) rather than the old
// confidence/breadth/signatureStrength formulas -- those formulas are specific to the old
// signed-average model and have no V2 equivalent to port; downstream consumers only ever
// branch on relative ORDER (already-sorted input) and the pole NAME/id, never recompute their
// own ranking from these fields, so this substitution is safe for every current consumer --
// see creature-identity.ts's resolveTraitCharacteristic (reads only trait.id/trait.name) and
// you-profile-cards.ts (reads the array in the order it's given).
export const toSignatureTraits = (ranked: readonly RankedPole[]): SignatureTrait[] =>
  ranked.map((pole) => ({
    id: poleDimensionId(pole.poleId),
    name: poleLabel(pole.poleId),
    displayName: poleLabel(pole.poleId),
    percent: Math.round(pole.earnedPercent * 100),
    normalizedScore: pole.earnedPercent,
    signatureStrength: pole.earnedPercent,
    confidence: Math.min(1, pole.lifetimeEarned / (2 * 9)),
    breadth: Math.min(1, pole.distinctQuestionsWithEarnedPoints / 5),
    evidenceCount: pole.distinctQuestionsWithEarnedPoints,
  }));

export const toCoreSignatureTraits = (ranked: readonly RankedPole[]): SignatureTrait[] =>
  toSignatureTraits(ranked.filter((pole) => poleIsCore(pole.poleId)));

export const polesToDimensionIds = (poleIds: readonly PersonalityPoleId[]): string[] => [...new Set(poleIds.map(poleDimensionId))];
