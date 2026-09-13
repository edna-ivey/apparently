import type { PersonalityDimensionId } from '@/data/personality';

// The shared shape every Explore quiz conforms to. New quizzes should be almost entirely
// data — one file like petty.ts plus a registry entry — not new UI. The runner screen
// (src/app/quiz/[quizId].tsx) is generic over this shape.

export type QuizChoice = {
  id: string;
  label: string;
  // numericBand quizzes (e.g. Petty): a point value on the quiz's own single spectrum.
  // Explicit per choice rather than implied by list position, so scoring never depends on
  // answer order.
  score?: number;
  // archetype quizzes (e.g. Crisis): points this choice contributes to one or more result
  // archetypes, keyed by QuizArchetype.id. Most choices contribute to exactly one archetype;
  // the shape allows more if a future quiz wants partial credit.
  resultWeights?: Record<string, number>;
  // Optional, currently unused by any live scoring or display — a forward-looking hook so a
  // future pass can feed quiz answers into scorePersonalityProfile's existing evidence model
  // without redesigning quiz content. Uses the SAME PersonalityDimensionId/effect values
  // personality.ts already defines; no parallel trait system. See quiz/[quizId].tsx and the
  // implementation report for why this isn't wired into live scoring yet.
  traitSignals?: { dimension: PersonalityDimensionId; value: -2 | -1 | 1 | 2 }[];
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
};

export type QuizResultBand = {
  id: string;
  title: string;
  minScore: number;
  maxScore: number;
  // Rendered as separate lines — keeps the two-beat "hero read" rhythm from the copy spec
  // without embedding a raw \n in content strings.
  heroRead: string[];
  body: string;
  kicker: string;
  traits: string[];
};

// One possible outcome of an archetype quiz (e.g. "THE COMMANDER"). Structurally identical
// in spirit to QuizResultBand — same heroRead/body/kicker/traits — just keyed by id/points
// instead of a numeric range.
export type QuizArchetype = {
  id: string;
  title: string;
  // Optional small supporting context shown under the result title (e.g. Era's "1950s" under
  // "THE GOLDEN AGE") — generic across any archetype quiz, not an Era-only special case.
  // Undefined for archetypes that don't need one (Crisis, Friendship, Food, Spending).
  resultSubtitle?: string;
  // Optional override for how this result's name renders in sentence-case contexts (mix rows,
  // Recent Read, native share text — anywhere the ALL-CAPS `title` isn't used verbatim). The
  // generic fallback naively lowercases `title` then capitalizes the first letter after each
  // space, which mangles acronyms ("Y2K" → "Y2k"), hyphenated words ("Always-On" → "Always-on"),
  // and titles opening with punctuation (a curly quote swallows the capital that should follow
  // it). Set this only when that fallback produces something wrong — most archetypes across
  // every quiz don't need it. Never derived by special-casing any particular quiz in a
  // component; see scoring.ts's resolveArchetypeDisplayTitle.
  displayTitle?: string;
  heroRead: string[];
  body: string;
  kicker: string;
  traits: string[];
};

// Explore's category filter chips — a fixed, known set (not user-authored strings), so a
// future "filter by category" pass has a real enum to switch on instead of loose strings.
export type QuizCategory = 'Love' | 'Friendship' | 'Food' | 'Money' | 'Nostalgia' | 'Ridiculous';

type QuizBase = {
  id: string;
  title: string;
  category: QuizCategory;
  eyebrow: string;
  // Intro support copy, one paragraph per line (same "separate lines" rationale as heroRead).
  introSupport: string[];
  meta: string;
  // The intro screen's start CTA — quiz-specific ("Let's find out →" for Petty, "Put me
  // under pressure →" for Crisis), so it lives in content, not hardcoded in the runner.
  introCta: string;
  introNote?: string;
  questions: QuizQuestion[];
};

// A single numeric spectrum with named bands (Petty: 0–24 → four bands). Unchanged shape
// from before this file became a union — existing Petty content/behavior is untouched.
export type NumericBandQuizDefinition = QuizBase & {
  scoringType: 'numericBand';
  maxScore: number;
  resultBands: QuizResultBand[];
  meterLabel: string;
  scoreLabel: string;
  // Optional full override for You's Recent Read line — when set, formatResultMetric uses
  // `${percent}% ${recentReadMetricLabel}` verbatim instead of the default
  // `${percent}% ${scoreLabel} meter` phrasing. Petty leaves this unset and keeps its exact
  // existing wording; Dating sets it to "dating difficulty" (no "meter" suffix wanted).
  recentReadMetricLabel?: string;
};

// Four (or more) competing archetypes scored independently; the highest total wins (see
// scoring.ts for the deterministic tie-break). mixLabel is the eyebrow over the per-archetype
// percentage breakdown (e.g. "YOUR CRISIS MIX"). recentReadMetricLabel is the suffix after
// the percentage on You's Recent Read card (e.g. "of your crisis picks") — content-owned per
// quiz, same way scoreLabel lets numericBand quizzes control their own "X% <label> meter"
// wording, so a future archetype quiz isn't stuck reusing Crisis's exact phrase.
export type ArchetypeQuizDefinition = QuizBase & {
  scoringType: 'archetype';
  archetypes: QuizArchetype[];
  mixLabel: string;
  recentReadMetricLabel: string;
};

export type QuizDefinition = NumericBandQuizDefinition | ArchetypeQuizDefinition;
