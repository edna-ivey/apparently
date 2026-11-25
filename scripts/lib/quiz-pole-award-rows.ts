// Shared source of the APPROVED quiz-choice-pole-award calibration, for the Build 22 free-
// quiz-only migration generator and the quiz historical backfill script. Rather than
// re-importing all 21 src/data/quiz-pole-awards/*.ts files a second time (the same import list
// scripts/generate-quiz-pole-award-reconciliation-sql.ts already assembled and already wrote
// out, reviewed, and confirmed byte-identical on regeneration), this module parses that
// already-generated, already-verified migration file
// (supabase/migrations/20261026170000_reconcile_quiz_choice_pole_awards.sql) as the one
// canonical intermediate artifact -- so there is exactly one place the 21-file import list
// lives, and every downstream consumer (this file's callers included) reads the SAME
// reviewed data, never a second transcription that could silently drift from it.

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { PRIVATE_QUIZ_TRAIT_AWARDS } from './private-quiz-trait-awards';
import { loadDimensionIdLedger } from './dimension-id-ledger';

export type QuizPoleAwardRow = { quizId: string; questionId: string; choiceId: string; poleId: string; points: number };

export const FREE_QUIZ_IDS = [
  'petty', 'crisis', 'dating', 'friendship', 'food-order', 'spending', 'era', 'ick',
  'group-chat', 'one-bite', 'unexpected-money', 'kid-you',
] as const;

// Archived (never applied, superseded by the numeric design) -- see
// supabase/migrations_archive/README.md. Read from there, not the active migrations
// directory, so this is never mistaken for a pending migration by `supabase db push`.
const MIGRATION_PATH = join(__dirname, '../../supabase/migrations_archive/20261026170000_reconcile_quiz_choice_pole_awards.sql');

export const readAllQuizPoleAwardRows = (): QuizPoleAwardRow[] => {
  const content = readFileSync(MIGRATION_PATH, 'utf8');
  const matches = content.matchAll(/\('([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+), 'v2\.0'\)/g);
  const rows: QuizPoleAwardRow[] = [];
  for (const match of matches) {
    const [, quizId, questionId, choiceId, poleId, points] = match;
    rows.push({ quizId, questionId, choiceId, poleId, points: Number(points) });
  }
  if (rows.length === 0) {
    throw new Error(`No rows parsed from ${MIGRATION_PATH} -- refusing to proceed with an empty calibration set.`);
  }
  return rows;
};

// Reverses traitIdForPoleKey's own formula (dimensionId * 2 - 1 = positive pole, * 2 =
// negative) so PRIVATE_QUIZ_TRAIT_AWARDS -- authored directly against the frozen numeric
// trait catalog, exactly as the locked documents themselves specify ("#25 Trust first") --
// can flow through the SAME poleId-based pipeline every other quiz's awards already use,
// rather than a second, parallel code path. Throws if a trait_id doesn't resolve to a real
// ledger dimension (e.g. out of 1-64 range) -- a transcription error, not a legitimate case.
const dimensionKeyById = new Map<number, string>();
for (const [key, id] of Object.entries(loadDimensionIdLedger().dimensionIds)) {
  dimensionKeyById.set(id, key);
}
const poleIdForTraitId = (traitId: number): string => {
  const dimensionId = Math.ceil(traitId / 2);
  const dimensionKey = dimensionKeyById.get(dimensionId);
  if (!dimensionKey) {
    throw new Error(`trait_id ${traitId} does not resolve to a real dimension in the frozen ledger (dimension_id ${dimensionId}) -- refusing to proceed with a transcription error.`);
  }
  return `${dimensionKey}:${traitId % 2 === 1 ? 'positive' : 'negative'}`;
};

// The four owner-approved Private quiz replacements' award rows, converted into the same
// QuizPoleAwardRow shape every free quiz's archived-migration-derived rows already use --
// see private-quiz-trait-awards.ts for the actual transcribed data and its own rationale.
const privateQuizAwardRows: QuizPoleAwardRow[] = PRIVATE_QUIZ_TRAIT_AWARDS.map((row) => ({
  quizId: row.quizId,
  questionId: row.questionId,
  choiceId: row.choiceId,
  poleId: poleIdForTraitId(row.traitId),
  points: row.points,
}));

export const readFreeQuizPoleAwardRows = (): QuizPoleAwardRow[] =>
  readAllQuizPoleAwardRows().filter((row) => (FREE_QUIZ_IDS as readonly string[]).includes(row.quizId));

// whats-your-type is approved, non-held content (already fully reconciled in production --
// confirmed 28 live rows = 28 current source rows, no drift) but is NOT one of the 12 free
// quizzes, so readFreeQuizPoleAwardRows() alone (used by the free-only migration generator,
// which has no reason to touch an already-correct quiz) is the wrong lookup for anything that
// also needs to reconstruct evidence for whats-your-type completions, e.g. the historical
// backfill script. This is the free quizzes plus whats-your-type -- every quiz_id NOT in the
// 9 held Apparently Private set.
export const APPROVED_NON_PRIVATE_QUIZ_IDS = [...FREE_QUIZ_IDS, 'whats-your-type'] as const;

export const readApprovedQuizPoleAwardRows = (): QuizPoleAwardRow[] =>
  readAllQuizPoleAwardRows().filter((row) => (APPROVED_NON_PRIVATE_QUIZ_IDS as readonly string[]).includes(row.quizId));

// Build 22 owner audit (2026-11-01): the SIX owner-approved Private quiz replacements (quiz
// content, verdict weights, and numeric Creature/Relic trait mappings) -- real server-side
// award activation. private-private-trouble remains absent: docs/private-quizzes/
// APPROVED_PRIVATE_QUIZZES.md (updated 2026-11-01) explicitly marks its replacement "REVISION
// IN PROGRESS -- FINAL SPICIER REPLACEMENT NOT APPROVED" and warns against implementing "the
// unapproved proposed replacement from November 1, 2026" -- a direct conflict with any
// instruction to treat it as approved; see the Build 22 report.
// Build 22 owner audit (2026-11-02): extended with the three revised Apparently Private free
// previews (keep-you-around, be-so-serious, secretly-love) and the After Dark replacement
// (private-private-trouble) and six new premium quizzes -- despite the "PRIVATE" name, this
// list really means "quizzes with real, owner-approved award data authored in
// private-quiz-trait-awards.ts," which now includes the free previews too (their own prior
// mechanism, result-level profileSignals, never wrote real quiz_choice_trait_awards rows).
export const APPROVED_PRIVATE_QUIZ_IDS = [
  'love-soulmates-ready', 'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong',
  'life-match-dream-life', 'style-vibe-intimidating',
  'keep-you-around', 'be-so-serious', 'secretly-love', 'private-private-trouble',
  'love-soulmates-become', 'shadow-side-hypocrisy', 'private-private-proof',
  'hidden-you-hide', 'life-match-freedom', 'style-vibe-attention', 'good-stuff-trust',
] as const;

export const readApprovedPrivateQuizPoleAwardRows = (): QuizPoleAwardRow[] => privateQuizAwardRows;

// Every quiz_id with real, owner-approved, server-activatable numeric award data -- the free
// quizzes plus whats-your-type (both from the archived migration) and the four newly approved
// Private quizzes above (from private-quiz-trait-awards.ts). generate-quiz-content-identity-
// sql.ts uses exactly this union to decide which choices get quiz_choice_trait_awards rows.
export const APPROVED_QUIZ_IDS_WITH_AWARDS = [...APPROVED_NON_PRIVATE_QUIZ_IDS, ...APPROVED_PRIVATE_QUIZ_IDS] as const;

export const readAllApprovedQuizPoleAwardRows = (): QuizPoleAwardRow[] => [
  ...readApprovedQuizPoleAwardRows(),
  ...readApprovedPrivateQuizPoleAwardRows(),
];
