import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId } from '@/data/personality';

// Scoring V2 -- the 64 independent personality POLES (not dimensions). Each of the 32
// canonical dimensions in personality.ts has exactly two poles; V2 evidence accumulates
// toward a pole directly, never toward "a dimension with a sign," so each pole needs its own
// stable identity. Deliberately NOT a hand-authored 64-entry union of new slug strings --
// derived mechanically from PersonalityDimensionId (already the single source of truth for
// dimension identity) so a pole id can never drift out of sync with personality.ts, and so
// adding/renaming a dimension there is the only place that ever needs to change.
//
// This module is purely additive: nothing here is imported by any currently-live scoring or
// display code. It exists for the V2 engine (src/data/personality-v2/scoring-engine.ts) and
// its content-calibration data (src/data/quiz-pole-awards/*.ts). See docs/
// personality-scoring-v2-design.md for the full architecture and why this is a parallel system
// rather than an in-place rewrite of personality.ts.

export type PersonalityPolePolarity = 'positive' | 'negative';

export type PersonalityPoleId = `${PersonalityDimensionId}:${PersonalityPolePolarity}`;

export const buildPoleId = (dimensionId: PersonalityDimensionId, polarity: PersonalityPolePolarity): PersonalityPoleId =>
  `${dimensionId}:${polarity}`;

export const ALL_POLE_IDS: readonly PersonalityPoleId[] = PERSONALITY_DIMENSIONS.flatMap((dimension) => [
  buildPoleId(dimension.id, 'positive'),
  buildPoleId(dimension.id, 'negative'),
]);

// 64 = 32 canonical dimensions x 2 poles -- asserted once here (not just documented) so this
// module itself fails loudly if personality.ts's dimension count ever drifts without this
// file being revisited.
if (ALL_POLE_IDS.length !== 64) {
  throw new Error(`Expected exactly 64 personality poles, got ${ALL_POLE_IDS.length}`);
}

export const parsePoleId = (poleId: PersonalityPoleId): { dimensionId: PersonalityDimensionId; polarity: PersonalityPolePolarity } => {
  const separatorIndex = poleId.lastIndexOf(':');
  const dimensionId = poleId.slice(0, separatorIndex) as PersonalityDimensionId;
  const polarity = poleId.slice(separatorIndex + 1) as PersonalityPolePolarity;
  return { dimensionId, polarity };
};

const dimensionMap = new Map(PERSONALITY_DIMENSIONS.map((dimension) => [dimension.id, dimension]));

export const poleLabel = (poleId: PersonalityPoleId): string => {
  const { dimensionId, polarity } = parsePoleId(poleId);
  const dimension = dimensionMap.get(dimensionId);
  if (!dimension) {
    throw new Error(`Unknown personality dimension in pole id: ${poleId}`);
  }
  return polarity === 'positive' ? dimension.positiveLabel : dimension.negativeLabel;
};

export const poleDimensionId = (poleId: PersonalityPoleId): PersonalityDimensionId => parsePoleId(poleId).dimensionId;

export const poleIsCore = (poleId: PersonalityPoleId): boolean => dimensionMap.get(poleDimensionId(poleId))?.type === 'core';

export const poleIsPrivate = (poleId: PersonalityPoleId): boolean => dimensionMap.get(poleDimensionId(poleId))?.type === 'private';

// Canonical, deterministic ordering for poles -- same dimension order personality.ts/
// quiz-personality-awards.ts already use (PERSONALITY_DIMENSIONS array order), positive pole
// before negative pole within a dimension. Used as the FINAL tiebreak in the V2 ranking
// engine when two poles are tied on every real criterion (earned percentage, then raw earned
// points) -- see scoring-engine.ts's rankPoles. Never used to break a tie that a real rule
// should be deciding; this only exists so "stable ranking when exact ties remain" has one
// fixed, reproducible answer instead of depending on object/array iteration order.
const POLE_ORDER = new Map(ALL_POLE_IDS.map((poleId, index) => [poleId, index]));

export const comparePoleOrder = (a: PersonalityPoleId, b: PersonalityPoleId): number =>
  (POLE_ORDER.get(a) ?? 0) - (POLE_ORDER.get(b) ?? 0);

export const CORE_POLE_IDS: readonly PersonalityPoleId[] = ALL_POLE_IDS.filter(poleIsCore);
export const PRIVATE_POLE_IDS: readonly PersonalityPoleId[] = ALL_POLE_IDS.filter(poleIsPrivate);
