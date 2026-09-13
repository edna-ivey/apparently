import type { ArchetypeQuizDefinition, NumericBandQuizDefinition, QuizArchetype, QuizDefinition, QuizResultBand } from './types';
import type { QuizResultRecord } from './results';

export type QuizScore = {
  score: number;
  percent: number;
  band: QuizResultBand;
};

// The generic sentence-case fallback for any result title used outside the all-caps verdict
// heading (mix rows, Recent Read, native share text). Naive on purpose — lowercase, then
// capitalize the first letter after each space or the string start — which is correct for the
// vast majority of plain-English titles. It breaks on acronyms, hyphenated compounds, and
// titles that open with punctuation; QuizArchetype.displayTitle is the escape hatch for those
// specific cases, set once in the content file, never special-cased here or in a component.
const defaultTitleCase = (value: string): string => value.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());

// Single place every consumer (mix rows, ResultDisplay.resultDisplayTitle, You's Recent Read)
// resolves an archetype's display name from — so a fix here (or a new displayTitle override
// in a content file) is never duplicated across components.
const resolveArchetypeDisplayTitle = (archetype: QuizArchetype): string => archetype.displayTitle ?? defaultTitleCase(archetype.title);

// Pure and generic over any NumericBandQuizDefinition — sums the chosen choice's `score` per
// question, then finds the result band whose [minScore, maxScore] contains the total. Falls
// back to the last band if a quiz's bands don't fully cover its own maxScore (defensive only;
// the registered quizzes are expected to cover their full range). Unchanged since Petty
// shipped — this is the numericBand half of the engine.
export const scoreQuiz = (definition: NumericBandQuizDefinition, answers: Record<string, string>): QuizScore => {
  const score = definition.questions.reduce((total, question) => {
    const chosenId = answers[question.id];
    const choice = question.choices.find((candidate) => candidate.id === chosenId);
    return total + (choice?.score ?? 0);
  }, 0);

  const percent = Math.round((score / definition.maxScore) * 100);
  const band =
    definition.resultBands.find((candidate) => score >= candidate.minScore && score <= candidate.maxScore) ??
    definition.resultBands[definition.resultBands.length - 1];

  return { score, percent, band };
};

export type ArchetypeScore = {
  primary: QuizArchetype;
  totals: Record<string, number>;
  percentages: Record<string, number>;
};

// How many of the FINAL questions count as "high-signal" for tie-breaking (see
// pickPrimaryArchetype below). 3 covers Q10–Q12 for a 12-question quiz; a shorter future
// archetype quiz would naturally use its own last 3, or fewer if it has under 3 questions.
const TIE_BREAK_QUESTION_COUNT = 3;

// Deterministic, never random. Preferred rule: if multiple archetypes are tied for the top
// score, look at the LAST TIE_BREAK_QUESTION_COUNT questions' winning archetype (the choice
// with the single highest weight in that question — ties within a question are not expected
// given this quiz's content, but resolved by object key iteration order as a defensive
// fallback), most recent first, and award the tie to the first one that's in the tied set.
// If that still doesn't resolve it (e.g. none of those answers went to a tied archetype), the
// final fallback is the tied archetype that appears earliest in the quiz definition's own
// `archetypes` array — a fixed, documented order, never randomized.
const pickPrimaryArchetype = (
  definition: ArchetypeQuizDefinition,
  totals: Record<string, number>,
  perQuestionWinner: (string | null)[],
): string => {
  const maxScore = Math.max(...definition.archetypes.map((archetype) => totals[archetype.id] ?? 0));
  const tied = definition.archetypes.filter((archetype) => (totals[archetype.id] ?? 0) === maxScore).map((a) => a.id);

  if (tied.length === 1) {
    return tied[0];
  }

  const highSignalWinners = perQuestionWinner.slice(-TIE_BREAK_QUESTION_COUNT).reverse();
  for (const winner of highSignalWinners) {
    if (winner && tied.includes(winner)) {
      return winner;
    }
  }

  return definition.archetypes.find((archetype) => tied.includes(archetype.id))!.id;
};

// Pure and generic over any ArchetypeQuizDefinition. Each answered question awards its
// choice's resultWeights to the relevant archetype(s); the archetype with the highest total
// wins (ties resolved deterministically — see pickPrimaryArchetype). Archetype names/scores
// are never shown to the user during the quiz — only the final result screen reveals them.
export const scoreArchetypeQuiz = (definition: ArchetypeQuizDefinition, answers: Record<string, string>): ArchetypeScore => {
  const totals: Record<string, number> = {};
  definition.archetypes.forEach((archetype) => {
    totals[archetype.id] = 0;
  });

  const perQuestionWinner: (string | null)[] = definition.questions.map((question) => {
    const chosenId = answers[question.id];
    const choice = question.choices.find((candidate) => candidate.id === chosenId);
    const weights = choice?.resultWeights ?? {};

    let questionWinner: string | null = null;
    let questionWinnerWeight = 0;
    for (const [archetypeId, weight] of Object.entries(weights)) {
      totals[archetypeId] = (totals[archetypeId] ?? 0) + weight;
      if (weight > questionWinnerWeight) {
        questionWinner = archetypeId;
        questionWinnerWeight = weight;
      }
    }
    return questionWinner;
  });

  const totalPoints = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const percentages: Record<string, number> = {};
  definition.archetypes.forEach((archetype) => {
    percentages[archetype.id] = totalPoints > 0 ? Math.round(((totals[archetype.id] ?? 0) / totalPoints) * 100) : 0;
  });

  const primaryId = pickPrimaryArchetype(definition, totals, perQuestionWinner);
  const primary = definition.archetypes.find((archetype) => archetype.id === primaryId)!;

  return { primary, totals, percentages };
};

// --- Unified display/save model, so the screen and You page don't need to special-case
// scoringType themselves. One mix entry per archetype, for archetype quizzes; undefined for
// numericBand quizzes. -------------------------------------------------------------------

export type QuizMixEntry = { id: string; title: string; percent: number };

export type ResultDisplay = {
  scoringType: QuizDefinition['scoringType'];
  resultId: string;
  resultTitle: string;
  heroRead: string[];
  body: string;
  kicker: string;
  traits: string[];
  score: number;
  percent: number;
  // numericBand only:
  meterLabel?: string;
  // archetype only, sorted descending by percent so the primary naturally leads:
  mix?: QuizMixEntry[];
  mixLabel?: string;
  // archetype only, optional — small supporting context under the result title (e.g. Era's
  // "1950s"). Undefined for archetype quizzes/archetypes that don't set one.
  resultSubtitle?: string;
  // Always populated (both scoring types) — the sentence-case display name for use anywhere
  // BESIDES the all-caps verdict heading (share text, and mix rows for archetype quizzes,
  // which now populate their own `title` with this same resolution — see below).
  resultDisplayTitle: string;
};

// Scores fresh answers into a normalized ResultDisplay — the one place scoringType branching
// happens for computing a NEW result. Called once, right when a quiz reaches its result step.
export const computeQuizResult = (definition: QuizDefinition, answers: Record<string, string>): ResultDisplay => {
  if (definition.scoringType === 'archetype') {
    const { primary, totals, percentages } = scoreArchetypeQuiz(definition, answers);
    const mix = [...definition.archetypes]
      .map((archetype) => ({ id: archetype.id, title: resolveArchetypeDisplayTitle(archetype), percent: percentages[archetype.id] ?? 0 }))
      .sort((a, b) => b.percent - a.percent);

    return {
      scoringType: 'archetype',
      resultId: primary.id,
      resultTitle: primary.title,
      heroRead: primary.heroRead,
      body: primary.body,
      kicker: primary.kicker,
      traits: primary.traits,
      score: totals[primary.id] ?? 0,
      percent: percentages[primary.id] ?? 0,
      mix,
      mixLabel: definition.mixLabel,
      resultSubtitle: primary.resultSubtitle,
      resultDisplayTitle: resolveArchetypeDisplayTitle(primary),
    };
  }

  const { score, percent, band } = scoreQuiz(definition, answers);
  return {
    scoringType: 'numericBand',
    resultId: band.id,
    resultTitle: band.title,
    heroRead: band.heroRead,
    body: band.body,
    kicker: band.kicker,
    traits: band.traits,
    score,
    percent,
    meterLabel: definition.meterLabel,
    resultDisplayTitle: defaultTitleCase(band.title),
  };
};

// Re-derives a ResultDisplay from an already-persisted QuizResultRecord (the "See result →"
// path) — the saved record deliberately doesn't carry heroRead/body/kicker/mix titles (avoids
// duplicated copy), so this looks them back up from the quiz definition by resultId. Returns
// null only if the record references a resultId the current definition no longer has (quiz
// content changed after the record was saved) — the screen falls back to Explore in that case.
export const reconstructResultDisplay = (definition: QuizDefinition, record: QuizResultRecord): ResultDisplay | null => {
  if (definition.scoringType === 'archetype') {
    const primary = definition.archetypes.find((archetype) => archetype.id === record.resultId);
    if (!primary) {
      return null;
    }
    const mix = record.mix
      ? [...definition.archetypes]
          .map((archetype) => ({ id: archetype.id, title: resolveArchetypeDisplayTitle(archetype), percent: record.mix?.[archetype.id] ?? 0 }))
          .sort((a, b) => b.percent - a.percent)
      : undefined;

    return {
      scoringType: 'archetype',
      resultId: primary.id,
      resultTitle: primary.title,
      heroRead: primary.heroRead,
      body: primary.body,
      kicker: primary.kicker,
      traits: primary.traits,
      score: record.score,
      percent: record.percent,
      mix,
      mixLabel: definition.mixLabel,
      resultSubtitle: primary.resultSubtitle,
      resultDisplayTitle: resolveArchetypeDisplayTitle(primary),
    };
  }

  const band = definition.resultBands.find((candidate) => candidate.id === record.resultId);
  if (!band) {
    return null;
  }
  return {
    scoringType: 'numericBand',
    resultId: band.id,
    resultTitle: band.title,
    heroRead: band.heroRead,
    body: band.body,
    kicker: band.kicker,
    traits: band.traits,
    score: record.score,
    percent: record.percent,
    meterLabel: definition.meterLabel,
    resultDisplayTitle: defaultTitleCase(band.title),
  };
};

// Generic lookup for a display-ready title from just a definition + resultId, without needing
// a full ResultDisplay/QuizResultRecord — what You's Recent Read card needs (it only has the
// lightweight persisted record, not a reconstructed result). Returns null if the id no longer
// exists on the current definition (same "quiz content changed after the record was saved"
// case reconstructResultDisplay guards against).
export const resolveResultDisplayTitle = (definition: QuizDefinition, resultId: string): string | null => {
  if (definition.scoringType === 'archetype') {
    const archetype = definition.archetypes.find((candidate) => candidate.id === resultId);
    return archetype ? resolveArchetypeDisplayTitle(archetype) : null;
  }
  const band = definition.resultBands.find((candidate) => candidate.id === resultId);
  return band ? defaultTitleCase(band.title) : null;
};

// Recent Read's metric line on You — quiz-type-aware so a future scoringType isn't stuck with
// Petty's "X% <label> meter" phrasing. For archetype quizzes the suffix is content-owned
// (definition.recentReadMetricLabel — e.g. Crisis's "of your crisis picks"), the same way
// numericBand quizzes already own their scoreLabel, so no quiz-specific wording is
// hardcoded into this generic formatter. A numericBand quiz can also fully override the
// suffix via its own optional recentReadMetricLabel (e.g. Dating's "dating difficulty", no
// "meter" wanted) — Petty leaves that field unset and keeps its exact existing phrasing.
export const formatResultMetric = (definition: QuizDefinition, record: QuizResultRecord): string => {
  if (definition.scoringType === 'archetype') {
    return `${record.percent}% ${definition.recentReadMetricLabel}`;
  }
  return definition.recentReadMetricLabel
    ? `${record.percent}% ${definition.recentReadMetricLabel}`
    : `${record.percent}% ${definition.scoreLabel} meter`;
};
