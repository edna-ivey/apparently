import type { PersonalityDimensionId } from '@/data/personality';

// The shared shape every Explore quiz conforms to. New quizzes should be almost entirely
// data — one file like petty.ts plus a registry entry — not new UI. The runner screen
// (src/app/quiz/[quizId].tsx) is generic over this shape.

export type QuizChoice = {
  id: string;
  label: string;
  // Generic point value for this quiz's own scoring scale (petty points, for now). Explicit
  // per choice rather than implied by list position, so a future quiz's scoring doesn't have
  // to be monotonic with answer order.
  score: number;
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

export type QuizDefinition = {
  id: string;
  title: string;
  eyebrow: string;
  // Intro support copy, one paragraph per line (same "separate lines" rationale as heroRead).
  introSupport: string[];
  meta: string;
  introNote?: string;
  questions: QuizQuestion[];
  maxScore: number;
  resultBands: QuizResultBand[];
  meterLabel: string;
  scoreLabel: string;
};
