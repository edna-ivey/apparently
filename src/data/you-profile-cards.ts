import {
  getSignatureStrengthLabel,
  isCoreDimension,
  PERSONALITY_DIMENSIONS,
  type DimensionResult,
  type PersonalityDimensionId,
  type PersonalityProfile,
} from '@/data/personality';

// Pure card-selection logic for You's pattern/read cards — deliberately kept dependency-free
// (no react-native import anywhere in this file) so it can be exercised directly by a plain
// Node validation script, unlike src/app/(tabs)/you.tsx itself. src/app/(tabs)/you.tsx imports
// everything it needs from here rather than defining any of this inline.

// Real dimensions (evidenceCount >= 1) ranked for the "EARLY READS" fallback — used only
// when topTraits is empty (i.e. no dimension has yet reached the >=2 evidenceCount
// scorePersonalityProfile requires for a real signature trait). Rank: evidenceCount, then
// signatureStrength, then a fixed deterministic dimension order as the final tie-break, so
// two dimensions with identical real evidence never flicker order between renders.
const DIMENSION_ORDER = new Map(PERSONALITY_DIMENSIONS.map((dimension, index) => [dimension.id, index]));

// Build 8 Pass 3: Your Signature (mature or early-read) is Core-dimension-only -- see
// PersonalityDimensionType's own comment in personality.ts. Evidence from a private source
// that targets a Core dimension still fully counts here; this filters by dimension TYPE only.
const getEarlySignals = (dimensions: DimensionResult[]): DimensionResult[] =>
  dimensions
    .filter((dimension) => dimension.evidenceCount >= 1 && isCoreDimension(dimension.dimension))
    .sort((a, b) => {
      if (b.evidenceCount !== a.evidenceCount) return b.evidenceCount - a.evidenceCount;
      if (b.signatureStrength !== a.signatureStrength) return b.signatureStrength - a.signatureStrength;
      return (DIMENSION_ORDER.get(a.dimension) ?? 0) - (DIMENSION_ORDER.get(b.dimension) ?? 0);
    })
    .slice(0, 5);

// Deliberately modest language for 1-2 real data points — never implies a defining trait.
const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

export type YouProfileCard = {
  dimension: PersonalityDimensionId;
  label: string;
  strengthLabel: string;
};

const MAX_PROFILE_CARDS = 5;

// The ONE unified display list for remote You BELOW the 50-profile-answer YOUR 7 milestone
// (see buildYourSevenCards below for at/above it) — mature topTraits ALWAYS lead (already
// ranked by signatureStrength, already capped to 5 by scorePersonalityProfile itself), then
// whatever slots remain fill with the next-ranked real early-signal dimensions, excluding any
// dimension already shown as mature. Personality evidence is append-only in this V1 model, so
// the number of distinct dimensions with real evidence never decreases during normal use —
// this list must never shrink either. The bug this replaces: branching on
// `topTraits.length > 0 ? topTraits : earlySignals` meant the INSTANT any dimension matured,
// every still-valid early-signal card vanished, even though nothing about those other
// dimensions became less real. A dimension maturing should only ever change how THAT
// dimension is labeled — never make an unrelated, still-valid dimension disappear.
//
// getEarlySignals' own internal ranking (evidenceCount, then signatureStrength, then a fixed
// dimension order) already sorts every mature dimension (evidenceCount >= 2) at or above every
// true early-signal dimension (evidenceCount === 1, the only way a dimension can fail to
// qualify as mature when topTraits isn't already at its own 5-item cap — see this function's
// exported test fixtures for the exhaustive check). That means filtering the mature ones back
// out of getEarlySignals' own top-5 slice always leaves exactly the right next-ranked early
// dimensions behind — never a hidden gap. Never fabricates a card: every entry here traces
// back to a real evidenceCount >= 1.
export const buildYouProfileCards = (profile: PersonalityProfile): YouProfileCard[] => {
  const matureCards: YouProfileCard[] = profile.topTraits.map((trait) => ({
    dimension: trait.id,
    label: trait.name,
    strengthLabel: getSignatureStrengthLabel(trait.signatureStrength),
  }));

  const matureDimensionIds = new Set(matureCards.map((card) => card.dimension));

  const earlyCards: YouProfileCard[] = getEarlySignals(profile.dimensions)
    .filter((dimension) => !matureDimensionIds.has(dimension.dimension))
    .map((dimension) => ({
      dimension: dimension.dimension,
      label: dimension.displayName,
      strengthLabel: getEarlySignalLabel(dimension.evidenceCount),
    }));

  return [...matureCards, ...earlyCards].slice(0, MAX_PROFILE_CARDS);
};

// "YOUR 7" -- the milestone unlocked at profileAnswerCount >= 50. buildYouProfileCards above
// stays exactly as it was (still capped at 5, still used below 50 answers) because it goes
// through scorePersonalityProfile's own topTraits, which is INTENTIONALLY capped at 5 for
// every other consumer of it — this function deliberately does NOT reuse that cap. It reads
// straight from profile.dimensions (the full, uncapped, real per-dimension evidence array
// scorePersonalityProfile already computes for all 32 canonical dimensions) so it can surface
// up to seven real dimensions instead of being silently limited by topTraits' own 5-item slice.
//
// Ranking (one unified sort, not two separately-capped lists stitched together): mature
// dimensions (evidenceCount >= 2) always sort before early-signal ones (evidenceCount === 1,
// the only other way to have evidenceCount >= 1), each tier internally ranked by
// signatureStrength descending, with the same fixed canonical dimension order used elsewhere
// in this file (DIMENSION_ORDER) as the final deterministic tie-break. Every dimension in
// profile.dimensions appears at most once by construction (one entry per canonical id), so
// this can never duplicate a card. Slicing to 7 AFTER filtering to evidenceCount >= 1 means a
// user with fewer than 7 real evidenced dimensions honestly sees however many they actually
// have — never a fabricated 7th.
export const buildYourSevenCards = (profile: PersonalityProfile): YouProfileCard[] => {
  // Build 8 Pass 3: Core-dimension-only (see getEarlySignals' own comment above) -- a
  // Private-12 dimension must never appear in Your Signature/Your 7, regardless of how much
  // evidence it has. Evidence from private CONTENT that targets a Core dimension is untouched
  // by this filter (it's still a Core dimension) and fully contributes.
  const eligible = profile.dimensions.filter(
    (dimension) => dimension.evidenceCount >= 1 && isCoreDimension(dimension.dimension),
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

  return ranked.slice(0, 7).map((dimension) => ({
    dimension: dimension.dimension,
    label: dimension.displayName,
    strengthLabel:
      dimension.evidenceCount >= 2 ? getSignatureStrengthLabel(dimension.signatureStrength) : getEarlySignalLabel(dimension.evidenceCount),
  }));
};
