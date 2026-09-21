import type { PersonalityEffect } from '@/data/personality';

import type {
  ArchetypeQuizDefinition,
  NumericBandQuizDefinition,
  QuizArchetype,
  QuizDefinition,
  QuizResultBand,
  QuizStructuredRead,
} from './types';
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
  // Opt-in "close second" (see pickCloseSecond) — null unless definition.enableCloseSecond is
  // true AND a qualifying secondary result exists. Every existing archetype quiz always gets
  // null here (enableCloseSecond is unset), so nothing about their behavior changes.
  secondary: QuizArchetype | null;
};

// How many of the FINAL questions count as "high-signal" for the GENERIC (unconfigured)
// tie-break below. 3 covers Q10–Q12 for a 12-question quiz; a shorter future archetype quiz
// would naturally use its own last 3, or fewer if it has under 3 questions. Only used when a
// quiz does NOT set its own highSignalQuestionIds (see pickPrimaryArchetypeByHighSignal for
// the opt-in alternative) — every existing quiz keeps using this exact path, unchanged.
const TIE_BREAK_QUESTION_COUNT = 3;

// One answered question's full weight map, plus which question it was — the raw material
// every tie-break/close-second computation below is derived from. Built once per scoring
// pass; nothing here is quiz-specific.
type PerQuestionWeights = { questionId: string; weights: Record<string, number> };

// The single highest-weight entry in one choice's resultWeights — "primary" in the sense the
// approved scoring spec uses it (e.g. "Q1D: KNOWS +2, BD +1" — KNOWS is primary, BD is
// secondary). Ties within one choice are not expected in any registered quiz's content;
// Object.entries' encounter order is the defensive fallback, matching this engine's existing
// tie-within-a-question convention. Threshold is > 0 (a zero-or-absent entry is never a
// winner), matching the original single-entry-only engine's implicit behavior exactly.
// Exported for reuse by findPartYouMissed below (Compare's deterministic "THE PART YOU
// MISSED" selection) — same "primary role" definition the tie-break/close-second engine
// already uses, never a second interpretation of what "primary" means for a choice.
export const primaryWeightEntry = (weights: Record<string, number>): { archetypeId: string; value: number } | null => {
  let best: { archetypeId: string; value: number } | null = null;
  for (const [archetypeId, value] of Object.entries(weights)) {
    if (value > (best?.value ?? 0)) {
      best = { archetypeId, value };
    }
  }
  return best;
};

// Deterministic, never random. GENERIC path (no highSignalQuestionIds configured — every
// existing archetype quiz): look at the LAST TIE_BREAK_QUESTION_COUNT questions' primary
// winner, most recent first, and award the tie to the first one that's in the tied set. If
// that still doesn't resolve it, the final fallback is the tied archetype that appears
// earliest in the quiz definition's own `archetypes` array — a fixed, documented order, never
// randomized. Byte-for-byte the same outcome as before this function was generalized: every
// registered quiz's choices carry exactly one resultWeights entry per choice, so
// primaryWeightEntry always resolves to that single entry.
const pickPrimaryArchetypeGeneric = (
  definition: ArchetypeQuizDefinition,
  tied: string[],
  perQuestionWeights: PerQuestionWeights[],
): string => {
  const perQuestionWinner = perQuestionWeights.map((entry) => primaryWeightEntry(entry.weights)?.archetypeId ?? null);
  const recentWinners = perQuestionWinner.slice(-TIE_BREAK_QUESTION_COUNT).reverse();
  for (const winner of recentWinners) {
    if (winner && tied.includes(winner)) {
      return winner;
    }
  }
  return definition.archetypes.find((archetype) => tied.includes(archetype.id))!.id;
};

// Opt-in tie-break (definition.highSignalQuestionIds set — currently only keep-you-around).
// Step 1: compare tied identities using ONLY points (every weight entry, primary or
// secondary) from the designated high-signal questions. Step 2: if still tied, compare each
// candidate's count of full +2 PRIMARY selections across the WHOLE quiz (a weak +1-only
// primary, or a +1 secondary contribution, never counts here). Step 3: a fixed
// archetypes-array-order fallback. A question NOT in highSignalQuestionIds (e.g. Q10 in
// keep-you-around, whose answers are all deliberately weak +1s) can never win step 1 by
// construction (it's excluded from the sum) and can never win step 2 either, since none of
// its weights are ever +2 — so it can never independently break a tie either way.
const pickPrimaryArchetypeByHighSignal = (
  definition: ArchetypeQuizDefinition,
  tied: string[],
  perQuestionWeights: PerQuestionWeights[],
): string => {
  const highSignalIds = new Set(definition.highSignalQuestionIds);

  const highSignalTotals: Record<string, number> = {};
  tied.forEach((id) => {
    highSignalTotals[id] = 0;
  });
  for (const { questionId, weights } of perQuestionWeights) {
    if (!highSignalIds.has(questionId)) {
      continue;
    }
    for (const [archetypeId, value] of Object.entries(weights)) {
      if (tied.includes(archetypeId)) {
        highSignalTotals[archetypeId] += value;
      }
    }
  }
  const bestHighSignal = Math.max(...tied.map((id) => highSignalTotals[id]));
  const afterHighSignal = tied.filter((id) => highSignalTotals[id] === bestHighSignal);
  if (afterHighSignal.length === 1) {
    return afterHighSignal[0];
  }

  const fullPrimaryTwoCount: Record<string, number> = {};
  afterHighSignal.forEach((id) => {
    fullPrimaryTwoCount[id] = 0;
  });
  for (const { weights } of perQuestionWeights) {
    const winner = primaryWeightEntry(weights);
    if (winner && winner.value === 2 && afterHighSignal.includes(winner.archetypeId)) {
      fullPrimaryTwoCount[winner.archetypeId] += 1;
    }
  }
  const bestPrimaryCount = Math.max(...afterHighSignal.map((id) => fullPrimaryTwoCount[id]));
  const afterPrimaryCount = afterHighSignal.filter((id) => fullPrimaryTwoCount[id] === bestPrimaryCount);
  if (afterPrimaryCount.length === 1) {
    return afterPrimaryCount[0];
  }

  return definition.archetypes.find((archetype) => afterPrimaryCount.includes(archetype.id))!.id;
};

const pickPrimaryArchetype = (
  definition: ArchetypeQuizDefinition,
  totals: Record<string, number>,
  perQuestionWeights: PerQuestionWeights[],
): string => {
  const maxScore = Math.max(...definition.archetypes.map((archetype) => totals[archetype.id] ?? 0));
  const tied = definition.archetypes.filter((archetype) => (totals[archetype.id] ?? 0) === maxScore).map((a) => a.id);

  if (tied.length === 1) {
    return tied[0];
  }

  if (definition.highSignalQuestionIds && definition.highSignalQuestionIds.length > 0) {
    return pickPrimaryArchetypeByHighSignal(definition, tied, perQuestionWeights);
  }
  return pickPrimaryArchetypeGeneric(definition, tied, perQuestionWeights);
};

// Opt-in "close second" (definition.enableCloseSecond — currently only keep-you-around).
// Every existing archetype quiz leaves this unset and always gets `secondary: null` — a
// single-result presentation, completely unchanged. Qualifies only when ALL of:
//   1. the best non-primary archetype's normalized percentage is within 10 points of primary.
//   2. that archetype received some nonzero weight (primary or secondary role) from at least
//      2 DISTINCT questions — a secondary-only (+1) accumulation across just one question is
//      not enough on its own.
//   3. at least one of those contributions was a full +2 PRIMARY selection for it specifically
//      (not a +1 secondary, and not a weak +1-only primary).
const pickCloseSecond = (
  definition: ArchetypeQuizDefinition,
  primary: QuizArchetype,
  percentages: Record<string, number>,
  perQuestionWeights: PerQuestionWeights[],
): QuizArchetype | null => {
  if (!definition.enableCloseSecond) {
    return null;
  }

  const candidates = definition.archetypes.filter((archetype) => archetype.id !== primary.id);
  if (candidates.length === 0) {
    return null;
  }

  const primaryPercent = percentages[primary.id] ?? 0;
  const bestCandidatePercent = Math.max(...candidates.map((archetype) => percentages[archetype.id] ?? 0));
  const topCandidates = candidates.filter((archetype) => (percentages[archetype.id] ?? 0) === bestCandidatePercent);

  for (const candidate of topCandidates) {
    const candidatePercent = percentages[candidate.id] ?? 0;
    if (primaryPercent - candidatePercent > 10) {
      continue;
    }

    const supportingQuestionIds = new Set(
      perQuestionWeights.filter((entry) => (entry.weights[candidate.id] ?? 0) > 0).map((entry) => entry.questionId),
    );
    if (supportingQuestionIds.size < 2) {
      continue;
    }

    const hasFullPrimaryTwo = perQuestionWeights.some((entry) => {
      const winner = primaryWeightEntry(entry.weights);
      return winner?.archetypeId === candidate.id && winner.value === 2;
    });
    if (!hasFullPrimaryTwo) {
      continue;
    }

    return candidate;
  }

  return null;
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

  const perQuestionWeights: PerQuestionWeights[] = definition.questions.map((question) => {
    const chosenId = answers[question.id];
    const choice = question.choices.find((candidate) => candidate.id === chosenId);
    const weights = choice?.resultWeights ?? {};
    for (const [archetypeId, weight] of Object.entries(weights)) {
      totals[archetypeId] = (totals[archetypeId] ?? 0) + weight;
    }
    return { questionId: question.id, weights };
  });

  const totalPoints = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const percentages: Record<string, number> = {};
  definition.archetypes.forEach((archetype) => {
    percentages[archetype.id] = totalPoints > 0 ? Math.round(((totals[archetype.id] ?? 0) / totalPoints) * 100) : 0;
  });

  const primaryId = pickPrimaryArchetype(definition, totals, perQuestionWeights);
  const primary = definition.archetypes.find((archetype) => archetype.id === primaryId)!;
  const secondary = pickCloseSecond(definition, primary, percentages, perQuestionWeights);

  return { primary, totals, percentages, secondary };
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
  // Only ever populated by computeQuizResult (a FRESH completion) — reconstructResultDisplay
  // (the ?view=result / "See result →" read-only path) deliberately leaves this undefined, so
  // it is structurally impossible for viewing an old saved result to carry signals a caller
  // could mistakenly submit as new profile evidence. See quiz/[quizId].tsx.
  profileSignals?: PersonalityEffect[];
  // Apparently Private's own structured presentation (THE READ / THE CALL-OUT / THE COST /
  // TRY THIS) — passed through unchanged from QuizArchetype.structuredRead wherever that's
  // set, on EVERY path (fresh completion, "See result", and shared-result content) since it's
  // static authored content, not scoring-sensitive like profileSignals. Undefined for every
  // quiz that doesn't set it — the standard hero/body/kicker/traits rendering is untouched.
  structuredRead?: QuizStructuredRead;
  // Opt-in "close second" (see pickCloseSecond) — ONLY ever populated by computeQuizResult on
  // a FRESH completion, same fresh-only convention as profileSignals above. Re-deriving it
  // requires the original raw answers, which are never persisted (only score/percent/mix/
  // resultId are) — reconstructResultDisplay and resolveShareableResultContent both leave this
  // undefined rather than guess. null means "computed, no qualifying secondary this time";
  // undefined means "not computed on this path at all."
  secondaryResult?: { resultId: string; resultDisplayTitle: string } | null;
};

// Scores fresh answers into a normalized ResultDisplay — the one place scoringType branching
// happens for computing a NEW result. Called once, right when a quiz reaches its result step.
export const computeQuizResult = (definition: QuizDefinition, answers: Record<string, string>): ResultDisplay => {
  if (definition.scoringType === 'archetype') {
    const { primary, totals, percentages, secondary } = scoreArchetypeQuiz(definition, answers);
    const mix = [...definition.archetypes]
      .map((archetype) => ({ id: archetype.id, title: resolveArchetypeDisplayTitle(archetype), percent: percentages[archetype.id] ?? 0 }))
      .sort((a, b) => b.percent - a.percent);

    return {
      scoringType: 'archetype',
      resultId: primary.id,
      resultTitle: primary.title,
      heroRead: primary.heroRead ?? [],
      body: primary.body ?? '',
      kicker: primary.kicker ?? '',
      traits: primary.traits ?? [],
      score: totals[primary.id] ?? 0,
      percent: percentages[primary.id] ?? 0,
      mix,
      mixLabel: definition.mixLabel,
      resultSubtitle: primary.resultSubtitle,
      resultDisplayTitle: resolveArchetypeDisplayTitle(primary),
      profileSignals: primary.profileSignals,
      structuredRead: primary.structuredRead,
      secondaryResult: secondary ? { resultId: secondary.id, resultDisplayTitle: resolveArchetypeDisplayTitle(secondary) } : null,
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
    profileSignals: band.profileSignals,
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
      heroRead: primary.heroRead ?? [],
      body: primary.body ?? '',
      kicker: primary.kicker ?? '',
      traits: primary.traits ?? [],
      score: record.score,
      percent: record.percent,
      mix,
      mixLabel: definition.mixLabel,
      resultSubtitle: primary.resultSubtitle,
      resultDisplayTitle: resolveArchetypeDisplayTitle(primary),
      structuredRead: primary.structuredRead,
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

// The approved share-safe "kicker" for a structuredRead result is its own already-approved
// closing thought — every structuredRead's tryThis array ends with one or more lines starting
// "Apparently, ..." that form that closing beat (verified across all 10 registered
// structuredRead results at the time this was written). Derived, never duplicated: finds that
// line and returns everything from there to the end of tryThis, so it can never drift out of
// sync with tryThis and nothing is rewritten/summarized/generated. Returns [] (never invented
// filler) if no such line exists — callers must treat that as "no share-safe kicker available"
// rather than fabricate one.
export const deriveShareKicker = (tryThis: string[]): string[] => {
  const startIndex = tryThis.findIndex((line) => /^Apparently,/i.test(line.trim()));
  if (startIndex === -1) {
    return [];
  }
  return tryThis.slice(startIndex);
};

// Sharing-safe subset of a result's display content, resolved directly from a definition +
// resultId — no dependency on a persisted QuizResultRecord/score/percent (a shared result's
// anonymous recipient never receives those, see quiz-share-service.ts/src/app/s/[token].tsx).
// Deliberately omits percent/mix: a shared link shows the ONE result the sharer chose, never a
// breakdown of every other possible result's standing (which could reveal more about the
// sharer than they intended to share). Returns null if the resultId no longer exists on the
// current definition (content changed since the share was created).
export type ShareableResultContent = {
  resultTitle: string;
  resultDisplayTitle: string;
  heroRead: string[];
  body: string;
  kicker: string;
  traits: string[];
  resultSubtitle?: string;
  // See ResultDisplay.structuredRead — passed through unchanged, since it's static approved
  // content (never scoring-sensitive), so a shared link for a structuredRead result has
  // something to show at all (its heroRead/body/kicker/traits are intentionally empty).
  //
  // IMPORTANT: this field is ONLY safe to hand to fully-public/anonymous callers (the shared-
  // result landing) as its OWN approved share-safe subset — see ShareableResultContent's own
  // consumer (src/app/s/[token].tsx), which shows ONLY structuredRead.theRead + shareKicker,
  // never theCallOut/theCost/tryThis in full. The in-app quiz runner (quiz/[quizId].tsx) does
  // NOT use this function at all — it reads the full structuredRead directly off the
  // definition/ResultDisplay, so the owner's own in-app result is never shortened.
  structuredRead?: QuizStructuredRead;
  // The approved share-safe closing line(s) for a structuredRead result — see
  // deriveShareKicker. Undefined for a non-structuredRead result (those already have their
  // own plain `kicker` string above). Empty array only if a structuredRead result somehow has
  // no identifiable "Apparently, ..." closing line — never a fabricated substitute.
  shareKicker?: string[];
};

export const resolveShareableResultContent = (definition: QuizDefinition, resultId: string): ShareableResultContent | null => {
  if (definition.scoringType === 'archetype') {
    const archetype = definition.archetypes.find((candidate) => candidate.id === resultId);
    if (!archetype) {
      return null;
    }
    return {
      resultTitle: archetype.title,
      resultDisplayTitle: resolveArchetypeDisplayTitle(archetype),
      heroRead: archetype.heroRead ?? [],
      body: archetype.body ?? '',
      kicker: archetype.kicker ?? '',
      traits: archetype.traits ?? [],
      resultSubtitle: archetype.resultSubtitle,
      structuredRead: archetype.structuredRead,
      shareKicker: archetype.structuredRead ? deriveShareKicker(archetype.structuredRead.tryThis) : undefined,
    };
  }

  const band = definition.resultBands.find((candidate) => candidate.id === resultId);
  if (!band) {
    return null;
  }
  return {
    resultTitle: band.title,
    resultDisplayTitle: defaultTitleCase(band.title),
    heroRead: band.heroRead,
    body: band.body,
    kicker: band.kicker,
    traits: band.traits,
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

// LEGACY BACKFILL ONLY — see src/services/legacy-quiz-backfill-service.ts. Deliberately
// separate from reconstructResultDisplay above, which intentionally does NOT return
// profileSignals: merely viewing a saved result (?view=result) must never be able to create
// new personality evidence, and reconstructResultDisplay is exactly the function that path
// uses. This helper exists only for the one legitimate case where recovering a result's
// authored signals is correct — resyncing a real historical completion from an older
// TestFlight build that predates remote quiz submission. Returns undefined (not an error) if
// the resultId no longer exists on the current definition (content changed since) or the
// result never had any signals authored — the backfill still submits the quiz_results history
// row either way, just without profile_effects.
export const resolveStoredQuizProfileSignals = (definition: QuizDefinition, resultId: string): PersonalityEffect[] | undefined => {
  if (definition.scoringType === 'archetype') {
    return definition.archetypes.find((candidate) => candidate.id === resultId)?.profileSignals;
  }
  return definition.resultBands.find((candidate) => candidate.id === resultId)?.profileSignals;
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

// --- THEY HAVE NOTES. Compare — deterministic "THE PART YOU MISSED" selection -------------
//
// Chooses AT MOST one question where the owner and a friend disagreed, using the exact
// approved priority chain (never AI-generated, never custom prose — the answer difference
// itself is the entire point). This mirrors the SAME "prefer X, then Y, then Z, then a fixed
// deterministic fallback" shape pickCloseSecond/pickPrimaryArchetypeByHighSignal already use
// elsewhere in this file — criteria 2-5 are priority tiebreakers among eligible candidates,
// not a hard AND-filter; criterion 1 is the only hard eligibility gate, and criterion 6 is
// the final deterministic tiebreak. "A meaningful qualifying mismatch exists" simply means at
// least one question has a genuine self/friend disagreement — any such disagreement is a
// valid candidate; the chain below picks the single BEST one among them.
export type PartYouMissed = { questionId: string; ownerChoiceId: string; friendChoiceId: string };

export const findPartYouMissed = (
  definition: ArchetypeQuizDefinition,
  ownerAnswers: Record<string, string>,
  friendAnswers: Record<string, string>,
  friendPrimaryResultId: string,
): PartYouMissed | null => {
  const highSignalIds = new Set(definition.highSignalQuestionIds ?? []);

  type Candidate = {
    questionId: string;
    isHighSignal: boolean;
    friendGivesFullPrimary: boolean;
    ownerGivesZeroToFriendPrimary: boolean;
    scoreDiff: number;
    order: number;
  };

  const candidates: Candidate[] = [];
  definition.questions.forEach((question, index) => {
    const ownerChoiceId = ownerAnswers[question.id];
    const friendChoiceId = friendAnswers[question.id];
    // Criterion 1 — the only hard eligibility gate: a genuine disagreement must exist. A
    // question either party didn't answer is never eligible either.
    if (!ownerChoiceId || !friendChoiceId || ownerChoiceId === friendChoiceId) {
      return;
    }

    const friendWeights = question.choices.find((c) => c.id === friendChoiceId)?.resultWeights ?? {};
    const ownerWeights = question.choices.find((c) => c.id === ownerChoiceId)?.resultWeights ?? {};
    const friendPrimaryEntry = primaryWeightEntry(friendWeights);

    candidates.push({
      questionId: question.id,
      isHighSignal: highSignalIds.has(question.id),
      friendGivesFullPrimary: friendPrimaryEntry?.archetypeId === friendPrimaryResultId && friendPrimaryEntry.value === 2,
      ownerGivesZeroToFriendPrimary: (ownerWeights[friendPrimaryResultId] ?? 0) === 0,
      scoreDiff: (friendWeights[friendPrimaryResultId] ?? 0) - (ownerWeights[friendPrimaryResultId] ?? 0),
      order: index,
    });
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.isHighSignal !== b.isHighSignal) return a.isHighSignal ? -1 : 1; // 2
    if (a.friendGivesFullPrimary !== b.friendGivesFullPrimary) return a.friendGivesFullPrimary ? -1 : 1; // 3
    if (a.ownerGivesZeroToFriendPrimary !== b.ownerGivesZeroToFriendPrimary) return a.ownerGivesZeroToFriendPrimary ? -1 : 1; // 4
    if (a.scoreDiff !== b.scoreDiff) return b.scoreDiff - a.scoreDiff; // 5
    return a.order - b.order; // 6
  });

  const best = candidates[0];
  return { questionId: best.questionId, ownerChoiceId: ownerAnswers[best.questionId], friendChoiceId: friendAnswers[best.questionId] };
};

// Literal identical-choice count between two answer maps for the same quiz — "You matched on
// X of 10 answers." Same question id + same choice id only; never weighted similarity.
export const countExactMatches = (
  definition: ArchetypeQuizDefinition,
  answersA: Record<string, string>,
  answersB: Record<string, string>,
): number => definition.questions.filter((q) => answersA[q.id] && answersA[q.id] === answersB[q.id]).length;
