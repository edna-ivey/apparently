import {
  isCoreDimension,
  isPrivateDimension,
  PERSONALITY_DIMENSIONS,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
  type PersonalityEffect,
  type PersonalityEffectValue,
} from '@/data/personality';

// ---------------------------------------------------------------------------------------
// Bible v1.4 §15A "QUIZ PERSONALITY EVIDENCE AWARDS" -- the WITHIN-QUIZ half of the pipeline
// (answers -> temporary raw trait evidence -> 3-point qualification check -> resolve opposite
// poles -> rank qualifying winning poles -> apply permanent profile awards). This is a
// SEPARATE threshold/stage from personality.ts's resolveActiveBoardPole/
// ACTIVE_BOARD_QUALIFICATION_THRESHOLD (the ALL-TIME "active identity ledger" that combines
// permanent quiz awards with approved Daily evidence) -- the Bible is explicit that these are
// two different thresholds ("This active-board threshold is separate from the within-quiz
// raw-evidence threshold") that merely happen to share the same current numeric value (3).
// Kept as its own small, dependency-light copy of the raw-pole-resolution math (rather than
// importing personality.ts's private rawPoleTotal/firstTimestampReaching helpers) because it
// resolves poles across a single quiz's TEMPORARY per-answer evidence (ordered by answer
// position within that one completion), not across a real evidence ledger's historical
// timestamps -- two genuinely different orderings that should not be forced to share one
// implementation just because the math looks similar.
//
// SCOPE NOTE, UPDATED FOR BUILD 11: the comment that used to live here said no quiz content
// could supply this module real per-answer raw evidence. That's no longer true and hasn't been
// since the 7 premium Apparently Private quizzes were authored with real per-choice
// `traitSignals` (src/data/quizzes/career-how-bad.ts, career-proving.ts, love-ready.ts,
// life-match-dream-life.ts, private-private-trouble.ts, hidden-you-wrong.ts,
// style-vibe-intimidating.ts — each sets `answerLevelPersonalityEvidence: true`). scoring.ts's
// answerLevelProfileSignals() builds real PersonalityAnswerEvidence from those per-choice
// traitSignals and calls applyPermanentQuizAwards below on every fresh completion of those 7
// quizzes. Quizzes WITHOUT that flag (every public/free quiz, plus the 2 free Private-preview
// quizzes keep-you-around.ts and be-so-serious.ts, which have no traitSignals authored at all)
// still use the older, simpler path: a small hand-picked `profileSignals` list attached
// directly to the winning result/archetype, never routed through this module's ranking at all.
// Both paths are real and currently live; they are not layered, a given quiz uses exactly one.
// ---------------------------------------------------------------------------------------

export const WITHIN_QUIZ_QUALIFICATION_THRESHOLD = 3;

export type QuizType = 'public' | 'private';

type RawAnswerItem = { dimension: PersonalityDimensionId; value: PersonalityEffectValue; order: number };

const DIMENSION_ORDER = new Map(PERSONALITY_DIMENSIONS.map((dimension, index) => [dimension.id, index]));

const flattenAnswers = (answers: PersonalityAnswerEvidence[]): RawAnswerItem[] => {
  const items: RawAnswerItem[] = [];
  answers.forEach((answer, order) => {
    answer.effects.forEach((effect) => {
      items.push({ dimension: effect.dimension, value: effect.value, order });
    });
  });
  return items;
};

type PoleResolution = { winningSign: 1 | -1; winningRawPoints: number; firstReachedOrder: number };

// Resolves ONE dimension's opposite poles from this quiz's temporary raw evidence only --
// mirrors personality.ts's resolveActiveBoardPole exactly in spirit (higher raw-point total
// wins; ties broken by "first reached that tied high score" -- here, by answer ORDER within
// the quiz, since a single quiz completion has no meaningfully distinct real timestamps per
// answer, only a real sequence) but scoped to WITHIN_QUIZ_QUALIFICATION_THRESHOLD, a distinct
// constant from the active-board's own threshold per the Bible's explicit "these are separate"
// language above.
const resolveWithinQuizPole = (items: RawAnswerItem[]): PoleResolution => {
  const bySign = (sign: 1 | -1) => items.filter((item) => Math.sign(item.value) === sign);
  const totalOf = (matched: RawAnswerItem[]) => matched.reduce((sum, item) => sum + Math.abs(item.value), 0);

  const positiveItems = bySign(1);
  const negativeItems = bySign(-1);
  const positiveTotal = totalOf(positiveItems);
  const negativeTotal = totalOf(negativeItems);

  const firstOrderReaching = (matched: RawAnswerItem[], target: number): number => {
    const ordered = [...matched].sort((a, b) => a.order - b.order);
    let running = 0;
    for (const item of ordered) {
      running += Math.abs(item.value);
      if (running >= target) {
        return item.order;
      }
    }
    return Number.POSITIVE_INFINITY;
  };

  let winningSign: 1 | -1;
  if (positiveTotal !== negativeTotal) {
    winningSign = positiveTotal > negativeTotal ? 1 : -1;
  } else if (positiveTotal === 0) {
    winningSign = 1;
  } else {
    const positiveFirst = firstOrderReaching(positiveItems, positiveTotal);
    const negativeFirst = firstOrderReaching(negativeItems, negativeTotal);
    winningSign = positiveFirst <= negativeFirst ? 1 : -1;
  }

  const winningRawPoints = winningSign === 1 ? positiveTotal : negativeTotal;
  const winningItems = winningSign === 1 ? positiveItems : negativeItems;
  const firstReachedOrder = winningRawPoints > 0 ? firstOrderReaching(winningItems, winningRawPoints) : Number.POSITIVE_INFINITY;

  return { winningSign, winningRawPoints, firstReachedOrder };
};

export type QualifiedQuizTrait = {
  dimension: PersonalityDimensionId;
  winningSign: 1 | -1;
  winningRawPoints: number;
};

// Step 1-3 of the Bible's flow: temporary raw trait evidence -> 3-point qualification check ->
// resolve opposite poles. Returns every dimension that qualified WITHIN this one quiz
// completion (raw points >= WITHIN_QUIZ_QUALIFICATION_THRESHOLD toward its winning pole),
// ranked strongest-first (ties broken by earliest answer order the winning pole reached its
// final total, then by canonical dimension order for full determinism -- Bible §15A "RANKING
// TIES"). Never invents a qualifying trait: a dimension with zero evidence, or evidence below
// the threshold, is simply absent from the result.
export const resolveWithinQuizQualification = (answers: PersonalityAnswerEvidence[]): QualifiedQuizTrait[] => {
  const items = flattenAnswers(answers);
  const byDimension = new Map<PersonalityDimensionId, RawAnswerItem[]>();
  items.forEach((item) => {
    const list = byDimension.get(item.dimension) ?? [];
    list.push(item);
    byDimension.set(item.dimension, list);
  });

  const resolved: (QualifiedQuizTrait & { firstReachedOrder: number })[] = [];
  byDimension.forEach((dimensionItems, dimension) => {
    const pole = resolveWithinQuizPole(dimensionItems);
    if (pole.winningRawPoints >= WITHIN_QUIZ_QUALIFICATION_THRESHOLD) {
      resolved.push({
        dimension,
        winningSign: pole.winningSign,
        winningRawPoints: pole.winningRawPoints,
        firstReachedOrder: pole.firstReachedOrder,
      });
    }
  });

  resolved.sort((a, b) => {
    if (b.winningRawPoints !== a.winningRawPoints) {
      return b.winningRawPoints - a.winningRawPoints;
    }
    if (a.firstReachedOrder !== b.firstReachedOrder) {
      return a.firstReachedOrder - b.firstReachedOrder;
    }
    return (DIMENSION_ORDER.get(a.dimension) ?? 0) - (DIMENSION_ORDER.get(b.dimension) ?? 0);
  });

  return resolved.map(({ dimension, winningSign, winningRawPoints }) => ({ dimension, winningSign, winningRawPoints }));
};

const toEffect = (trait: QualifiedQuizTrait, magnitude: 1 | 2 | 3): PersonalityEffect => ({
  dimension: trait.dimension,
  value: (trait.winningSign * magnitude) as PersonalityEffectValue,
});

// Rank #1/#2/#3 of an already strongest-first ordered list -> award magnitudes 3/2/1. A list
// shorter than 3 (2 qualifying traits, 1, or 0) simply receives fewer awards — see the
// LOCKED PRIVATE QUIZ RANKED EVIDENCE rule below for why this must never be padded.
const RANKED_MAGNITUDES: readonly (1 | 2 | 3)[] = [3, 2, 1];
const applyRankedAwards = (ranked: QualifiedQuizTrait[], awards: PersonalityEffect[]): void => {
  ranked.slice(0, 3).forEach((trait, index) => awards.push(toEffect(trait, RANKED_MAGNITUDES[index])));
};

// Step 4-5: rank qualifying winning poles -> apply permanent profile awards.
//
//   PUBLIC / FREE quizzes   -- Core: top 3 qualifying traits +2 each, 4th/5th +1 each. No
//                              Private awards (even if a Private trait happened to qualify).
//   APPARENTLY PRIVATE      -- Core: top 3 qualifying traits +1 each (UNCHANGED — see the
//   quizzes                    "DO NOT DAMAGE CORE EVIDENCE" rule below; Private quizzes must
//                              never be allowed to outweigh Core/Creature identity).
//
//                              Private: LOCKED (Build 11) RANKED evidence —
//                                rank #1 qualifying trait -> ±3
//                                rank #2 qualifying trait -> ±2
//                                rank #3 qualifying trait -> ±1
//                              This REPLACES the previous flat ±2-for-all-three-ranks model.
//                              The strongest Private finding from a quiz now outweighs its
//                              secondary/tertiary findings instead of all three counting
//                              equally — see quiz-personality-awards.ts's module doc / the
//                              Apparently You Product Creative Bible's "PRIVATE QUIZ RANKED
//                              EVIDENCE" section for the full rationale.
//
// If fewer traits qualify than a tier needs, only the traits that genuinely qualified receive
// awards -- this NEVER pads a tier (Core OR Private) with an invented trait to fill it. Two
// qualifying Private traits award only ±3/±2; one qualifying trait awards only ±3; zero award
// nothing.
export const applyPermanentQuizAwards = (answers: PersonalityAnswerEvidence[], quizType: QuizType): PersonalityEffect[] => {
  const qualified = resolveWithinQuizQualification(answers);
  const coreQualified = qualified.filter((trait) => isCoreDimension(trait.dimension));
  const privateQualified = qualified.filter((trait) => isPrivateDimension(trait.dimension));

  const awards: PersonalityEffect[] = [];

  if (quizType === 'public') {
    coreQualified.slice(0, 3).forEach((trait) => awards.push(toEffect(trait, 2)));
    coreQualified.slice(3, 5).forEach((trait) => awards.push(toEffect(trait, 1)));
    // Public/Free quizzes do not generate Private/Relic personality awards (Bible §15A) --
    // privateQualified is deliberately never awarded here.
  } else {
    coreQualified.slice(0, 3).forEach((trait) => awards.push(toEffect(trait, 1)));
    applyRankedAwards(privateQualified, awards);
  }

  return awards;
};
