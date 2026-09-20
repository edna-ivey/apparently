import type { PersonalityDimensionId, PersonalityEffect } from '@/data/personality';

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
  // Result-level (not per-choice) personality signals this result contributes to the living
  // You profile, ONLY on a quiz's first completion — see src/services/quiz-service.ts and the
  // submit_quiz_result RPC. Max 3, conservative, authored explicitly from this result's own
  // title/heroRead/body/kicker/traits — never mechanically derived from `traits` at runtime,
  // and never a second personality engine: these are exactly the same PersonalityEffect shape
  // and PersonalityDimensionId values scorePersonalityProfile already consumes.
  profileSignals?: PersonalityEffect[];
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
  // Standard generic result presentation — required for every EXISTING archetype quiz.
  // Optional here ONLY so a result using structuredRead below never needs invented filler
  // content in fields its own UI never renders (see structuredRead's own comment).
  heroRead?: string[];
  body?: string;
  kicker?: string;
  traits?: string[];
  // Same contract as QuizResultBand.profileSignals above — result-level, max 3, first-
  // completion-only. See that field's comment for the full rationale.
  profileSignals?: PersonalityEffect[];
  // Apparently Private's own structured result presentation (THE READ / THE CALL-OUT /
  // THE COST / TRY THIS — see keep-you-around.ts and quiz/[quizId].tsx's
  // PrivateStructuredResult). When present, this ENTIRELY REPLACES the standard
  // hero/body/kicker/traits rendering for this specific result — the two are never combined,
  // and heroRead/body/kicker/traits are left unset on any archetype that sets this.
  structuredRead?: QuizStructuredRead;
};

// One section per beat of Apparently Private's own result structure — each array entry is a
// separate paragraph (same "one paragraph per line" convention heroRead/introSupport already
// use). Exists so a quiz can carry its OWN authored Read structure distinct from the generic
// hero/body/kicker/traits shape without inventing anything to fill unused fields.
export type QuizStructuredRead = {
  theRead: string[];
  theCallOut: string[];
  theCost: string[];
  tryThis: string[];
};

// Free Explore's category filter chips — a fixed, known set (not user-authored strings), so
// the free filter row has a real enum to switch on instead of loose strings. Kept separate
// from PrivateQuizCategory below so the free pill row can never accidentally render a Private
// category — see explore.tsx, which imports FreeQuizCategory specifically, not QuizCategory.
export type FreeQuizCategory = 'Love' | 'Friendship' | 'Food' | 'Money' | 'Nostalgia' | 'Ridiculous';

// Apparently Private's own category set — a different "room," never mixed into the free pill
// row. Only src/app/private.tsx and the locked catalog (private-catalog.ts) reference this.
export type PrivateQuizCategory =
  | 'Love & Soulmates'
  | 'Career & Ambition'
  | 'Hidden You'
  | 'Shadow Side'
  | 'The Good Stuff'
  | 'Life Match'
  | 'Style & Vibe';

export type QuizCategory = FreeQuizCategory | PrivateQuizCategory;

// Merchandising/access metadata, deliberately separate from scoring — a quiz's scoringType
// never changes based on who can reach it. 'free': the 12 free Explore quizzes. 'private-
// preview': the one real playable Apparently Private quiz (secretly-love) — fully playable,
// contributes to You exactly like any other quiz, just surfaced inside the Private room.
// 'private': a future paid playable quiz (none exist yet this sprint — locked teasers in
// private-catalog.ts are NOT QuizDefinitions and never appear in QUIZ_REGISTRY).
export type QuizAccess = 'free' | 'private-preview' | 'private';

type QuizBase = {
  id: string;
  title: string;
  category: QuizCategory;
  access: QuizAccess;
  eyebrow: string;
  // Intro support copy, one paragraph per line (same "separate lines" rationale as heroRead).
  introSupport: string[];
  meta: string;
  // The intro screen's start CTA — quiz-specific ("Let's find out →" for Petty, "Put me
  // under pressure →" for Crisis), so it lives in content, not hardcoded in the runner.
  introCta: string;
  introNote?: string;
  questions: QuizQuestion[];
  // Whether a first completion of this quiz may contribute to the living You profile
  // (personality_evidence + profileAnswerCount/Your7). Defaults to true (existing behavior,
  // unchanged) when absent. Set to false ONLY for a quiz whose result→profile mapping hasn't
  // been approved yet — see computeProfileActivityCounts in personality-service.ts, which
  // reads this to exclude such a quiz's question_count from profileAnswerCount even though
  // its quiz_results row is real and its completion still counts toward
  // quizCompletionCount/profileActivityCount. Independent of, and enforced in ADDITION to,
  // simply not authoring profileSignals on the quiz's own results.
  contributesToProfile?: boolean;
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
  // Opt-in tie-break override (see scoring.ts's pickPrimaryArchetype). When absent, ties use
  // the existing generic "last 3 questions" behavior — EVERY existing archetype quiz keeps
  // that exact behavior unchanged. When present, ties are resolved using ONLY these question
  // ids' points first, then (if still tied) each candidate's count of full +2 PRIMARY
  // selections across the whole quiz, then a fixed archetypes-array-order fallback.
  highSignalQuestionIds?: string[];
  // Opt-in "close second" reveal (see scoring.ts's pickCloseSecond) — a secondary result shown
  // alongside the primary only when it meets ALL of: within 10 percentage points, support
  // from >=2 distinct questions, and at least one of those was a full +2 PRIMARY selection for
  // it. Absent/false for every existing archetype quiz (unchanged: always exactly one result).
  enableCloseSecond?: boolean;
};

export type QuizDefinition = NumericBandQuizDefinition | ArchetypeQuizDefinition;
