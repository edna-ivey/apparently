// Build 22 numeric-totals ranking adapter -- ranks a user's small, precomputed
// user_trait_totals rows (<=64) directly, WITHOUT reconstructing synthetic answer-level
// PoleEvidenceRow observations and feeding them through rankPoles()/dedupeForRanking. That
// would be the wrong tool for this input on two counts: (1) dedupeForRanking's
// (questionStableId, poleId) "earliest row wins" rule exists to stop a RETAKE from inflating
// evidence -- totals are already final, already-deduplicated-at-write-time aggregates (the
// server's ON CONFLICT/unique-constraint rules enforced that when each row was written), so
// re-deriving fake per-question identities and re-running retake-suppression on them a
// second time is both unnecessary and, for Daily, actively wrong: two genuinely different
// occurrences of a recycled template are REAL, separate evidence (see 20261028050000's
// occurrence-not-fingerprint identity rule) -- synthesizing one fake "observation" per total
// row would silently collapse them back down to looking like a single retake, exactly the
// bug the occurrence-identity fix exists to prevent. (2) dedupeForRanking needs a
// questionStableId/occurredAt per row -- data totals don't carry and shouldn't need to
// fabricate.
//
// This module re-derives ONLY the real ranking math rankPoles already implements --
// eligibility (lifetimeEarned >= ELIGIBILITY_THRESHOLD), earnedPercent, the same tie-break
// chain -- directly over totals, and reuses the EXACT SAME collapse-to-one-trait-per-
// dimension/cap/SignatureTrait-conversion logic activation.ts already uses for answer-level
// ranking, so Your Signature/The Undercurrent/Creature eligibility read IDENTICAL downstream
// shapes regardless of which input they were ranked from.

import { getSignatureStrengthLabel, PERSONALITY_DIMENSIONS, type PersonalityDimensionId, type SignatureTrait } from '@/data/personality';
import { MAX_PRIVATE_SIGNALS, type PrivateSignalTrait } from '@/data/private-signals';
import { ELIGIBILITY_THRESHOLD } from './scoring-engine';
import { MAX_CORE_SIGNATURE_TRAITS } from './activation';
import { isCoreTrait, isPrivateTrait, traitDimensionId, traitInfo, type NumericTraitId } from './numeric-trait-catalog';

const PERSONALITY_DIMENSIONS_BY_ID = new Map(PERSONALITY_DIMENSIONS.map((d) => [d.id, d] as const)) as Map<PersonalityDimensionId, (typeof PERSONALITY_DIMENSIONS)[number]>;

export type UserTraitTotalRow = {
  traitId: NumericTraitId;
  lifetimeEarned: number;
  maxAvailableTotal: number;
  distinctQuestionsWithEarned: number;
  distinctQuestionsPresented: number;
};

export type RankedNumericTrait = UserTraitTotalRow & {
  earnedPercent: number;
  eligible: boolean;
  rank: number;
};

// Same comparator shape as rankPoles: earnedPercent desc, then lifetimeEarned desc, then a
// fixed canonical order as the final tiebreak. traitId itself already encodes exactly that
// canonical order (dimensionId*2-1/dimensionId*2, and dimensionId is PERSONALITY_DIMENSIONS'
// own array position) -- sorting by traitId ascending IS comparePoleOrder, with no second
// lookup table needed.
type UnrankedTotal = Omit<RankedNumericTrait, 'rank'>;
const compareRankedTotals = (a: UnrankedTotal, b: UnrankedTotal): number => {
  if (b.earnedPercent !== a.earnedPercent) return b.earnedPercent - a.earnedPercent;
  if (b.lifetimeEarned !== a.lifetimeEarned) return b.lifetimeEarned - a.lifetimeEarned;
  return a.traitId - b.traitId;
};

export const rankNumericTotals = (totals: readonly UserTraitTotalRow[]): RankedNumericTrait[] => {
  const withDerived = totals.map((t) => ({
    ...t,
    earnedPercent: t.maxAvailableTotal > 0 ? t.lifetimeEarned / t.maxAvailableTotal : 0,
    eligible: t.lifetimeEarned >= ELIGIBILITY_THRESHOLD,
  }));
  const eligible = withDerived.filter((t) => t.eligible).sort(compareRankedTotals);
  return eligible.map((t, i) => ({ ...t, rank: i + 1 }));
};

// Identical rule to scoring-engine.ts's collapseToOnePerDimension: input is assumed already
// sorted strongest-first (rankNumericTotals' own output), so keeping the first pole seen per
// dimension IS keeping the higher-ranked one -- no re-sort needed.
export const collapseNumericToOnePerDimension = (
  ranked: readonly RankedNumericTrait[],
  predicate: (traitId: NumericTraitId) => boolean,
): RankedNumericTrait[] => {
  const seenDimensions = new Set<number>();
  const collapsed: RankedNumericTrait[] = [];
  for (const trait of ranked) {
    if (!predicate(trait.traitId)) continue;
    const dimensionId = traitDimensionId(trait.traitId);
    if (seenDimensions.has(dimensionId)) continue;
    seenDimensions.add(dimensionId);
    collapsed.push(trait);
  }
  return collapsed;
};

const toSignatureTrait = (trait: RankedNumericTrait): SignatureTrait => {
  const info = traitInfo(trait.traitId);
  const dimension = PERSONALITY_DIMENSIONS_BY_ID.get(info.dimensionKey)!;
  const label = info.polarity === 'positive' ? dimension.positiveLabel : dimension.negativeLabel;
  return {
    id: info.dimensionKey,
    name: label,
    displayName: label,
    percent: Math.round(trait.earnedPercent * 100),
    normalizedScore: trait.earnedPercent,
    signatureStrength: trait.earnedPercent,
    confidence: Math.min(1, trait.lifetimeEarned / (2 * ELIGIBILITY_THRESHOLD)),
    breadth: Math.min(1, trait.distinctQuestionsWithEarned / 5),
    evidenceCount: trait.distinctQuestionsWithEarned,
  };
};

const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

export const rankCoreSignatureTraitsFromTotals = (totals: readonly UserTraitTotalRow[]): SignatureTrait[] =>
  collapseNumericToOnePerDimension(rankNumericTotals(totals), isCoreTrait)
    .slice(0, MAX_CORE_SIGNATURE_TRAITS)
    .map(toSignatureTrait);

export const rankPrivateSignalTraitsFromTotals = (totals: readonly UserTraitTotalRow[]): PrivateSignalTrait[] =>
  collapseNumericToOnePerDimension(rankNumericTotals(totals), isPrivateTrait)
    .slice(0, MAX_PRIVATE_SIGNALS)
    .map((trait) => {
      const signatureTrait = toSignatureTrait(trait);
      return {
        dimension: signatureTrait.id,
        label: signatureTrait.displayName,
        strengthLabel: trait.distinctQuestionsWithEarned >= 2 ? getSignatureStrengthLabel(signatureTrait.signatureStrength) : getEarlySignalLabel(trait.distinctQuestionsWithEarned),
        signatureStrength: signatureTrait.signatureStrength,
        evidenceCount: trait.distinctQuestionsWithEarned,
      };
    });
