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
// IMPORTANT SCOPE NOTE (see the reconciliation-pass final report): today's actual quiz content
// (src/data/quizzes/*.ts) authors each result's `profileSignals` as a small, already-final,
// human-picked list (<=3 signals) attached to the WINNING archetype/band, not as raw per-answer
// effects on each question's own choices. That means no current quiz can supply this module
// the real per-answer raw evidence its within-quiz qualification step is designed to consume.
// This module is still implemented and validated against the Bible's exact spec now (see
// scripts/validate-build8-pass4-bible-qualification-reconciliation.ts) so the algorithmic
// foundation is correct and ready -- wiring it into the real submission path would require
// authoring quiz content with real per-answer raw effects, which is a content change outside
// this pass's "scoring/evidence architecture correction only" scope. Flagged, not silently
// resolved, per instruction.
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

const toEffect = (trait: QualifiedQuizTrait, magnitude: 1 | 2): PersonalityEffect => ({
  dimension: trait.dimension,
  value: (trait.winningSign * magnitude) as PersonalityEffectValue,
});

// Step 4-5: rank qualifying winning poles -> apply permanent profile awards. Bible §15A:
//   PUBLIC / FREE quizzes  -- Core: top 3 qualifying traits +2 each, 4th/5th +1 each. No
//                             Private awards (even if a Private trait happened to qualify).
//   APPARENTLY PRIVATE     -- Core: top 3 qualifying traits +1 each. Private: top 3 qualifying
//   quizzes                  traits +2 each. Both layers ranked/capped independently.
// If fewer traits qualify than a tier needs, only the traits that genuinely qualified receive
// awards -- this NEVER pads a tier with an invented trait to fill it.
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
    privateQualified.slice(0, 3).forEach((trait) => awards.push(toEffect(trait, 2)));
  }

  return awards;
};
