import type { PersonalityPoleId } from '@/data/personality-v2/pole-ids';

// Shared shape for the V2 per-quiz calibration data (src/data/quiz-pole-awards/<quiz-id>.ts).
// Deliberately a SEPARATE module tree from src/data/quizzes/*.ts -- the editorial content
// files (question/choice wording, result copy, resultWeights/score/traitSignals/
// profileSignals) are untouched by Build 16/V2 and stay the single source of truth for
// anything the user reads. This tree is the single source of truth for "how many points does
// choice X of question Y award to which poles, and why" -- reviewable, diffable, and testable
// on its own, per the brief's "reviewable source-controlled audit artifact ... protected from
// accidental rewriting" requirement. See docs/personality-scoring-v2-design.md.

export type PoleAwardEntry = {
  pole: PersonalityPoleId;
  points: 1 | 2 | 3;
};

export type QuizChoicePoleAward = {
  // Exact answer wording at calibration time -- copied, never summarized, so a reviewer can
  // read this file standalone without cross-referencing the quiz content file, and so a
  // future editorial wording change is detectable by diffing this field against the live
  // choice.label (see scripts/validate-quiz-pole-award-matrix.ts, which checks this).
  wording: string;
  // Empty array is a valid, deliberate answer: "no defensible evidence" for this choice.
  // Never populated merely to hit a coverage number.
  awards: PoleAwardEntry[];
  rationale: string;
  status: 'new' | 'unchanged-from-authored-signal' | 'corrected';
  scoringVersion: string;
};

// questionId -> choiceId -> calibration. Mirrors the real QuizQuestion/QuizChoice id shape in
// src/data/quizzes/types.ts exactly (same ids), so a lookup is a direct two-level map access,
// never a search.
export type QuizPoleAwardMap = Record<string, Record<string, QuizChoicePoleAward>>;
