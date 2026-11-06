// Build 22 historical quiz backfill, REWRITTEN (2026-10-29) for the completion-level gating
// schema (user_quiz_completions). Two things must happen together, for every (user, quiz)
// pair, using the EARLIEST completion only:
//
// 1. Seed user_quiz_completions so that (user, quiz) pair is marked "already completed" --
//    required even when the earliest completion's answers are NOT recoverable (22 of 100,
//    confirmed), so a later retake of that quiz can never look like a fresh first completion
//    merely because user_quiz_answers has no rows for it. This is the fix for the owner's
//    explicit warning: "their retakes must not become newly creditable merely because
//    user_quiz_answers is empty."
// 2. ONLY when the earliest completion's answers ARE recoverable (quiz_results.answers is
//    not null) and the quiz is in approved scope: also write user_quiz_answers + its trait
//    evidence for that same earliest completion, in the same seed transaction.
//
// SCOPE for evidence (not for the completion seed, which covers every quiz including held
// ones): the 12 approved free quizzes + whats-your-type only.
//
// THIS SCRIPT NEVER CONNECTS TO ANY DATABASE -- transforms already-fetched, read-only JSON
// into a SQL file for the next approval gate. No write is ever executed by running it.
//
// Run with: npx tsx scripts/backfill-quiz-pole-evidence.ts <all-quiz-results.json> <output-sql-path>

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void };
declare const process: { argv: string[]; exit: (code: number) => void };
const { readFileSync, writeFileSync } = require('fs');

import { readApprovedQuizPoleAwardRows } from './lib/quiz-pole-award-rows';
import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

type QuizResultRow = { id: string; user_id: string; quiz_id: string; completed_at: string; answers: Record<string, string> | null };

const readJsonRows = <T>(path: string): T[] => {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  return parsed.rows as T[];
};

const [, , resultsPath, outputSqlPath] = process.argv;
if (!resultsPath || !outputSqlPath) {
  console.error('Usage: npx tsx scripts/backfill-quiz-pole-evidence.ts <all-quiz-results.json> <output-sql-path>');
  process.exit(1);
}

const allResults = readJsonRows<QuizResultRow>(resultsPath);
const allAwardRows = readApprovedQuizPoleAwardRows();

// Build 22 owner audit (2026-10-31), item 1: dimension_id must come from the SAME persisted
// ledger scripts/generate-trait-catalog-sql.ts uses -- never recomputed from
// PERSONALITY_DIMENSIONS array position, which is exactly the bug this item fixes everywhere
// else it appeared. resolveDimensionId is READ-ONLY: a dimension missing from the ledger here
// means the ledger is stale, not a license to mint a new id in a backfill script.
const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};
const awardsByQuizQuestion = new Map<string, { choiceId: string; poleId: string; points: number }[]>();
for (const row of allAwardRows) {
  const key = `${row.quizId}::${row.questionId}`;
  const list = awardsByQuizQuestion.get(key) ?? [];
  list.push({ choiceId: row.choiceId, poleId: row.poleId, points: row.points });
  awardsByQuizQuestion.set(key, list);
}

// Group by (user_id, quiz_id); the EARLIEST completion is the one that determines
// user_quiz_completions, regardless of whether its answers are recoverable.
const byUserQuiz = new Map<string, QuizResultRow[]>();
for (const r of allResults) {
  const key = `${r.user_id}::${r.quiz_id}`;
  const list = byUserQuiz.get(key) ?? [];
  list.push(r);
  byUserQuiz.set(key, list);
}

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

type CompletionSeed = { userId: string; quizKey: string; quizResultId: string; completedAt: string };
type PlannedAnswer = { userId: string; quizKey: string; questionKey: string; choiceKey: string; answeredAt: string };
type PlannedEvidence = { answerKey: string; traitId: number; pointsEarned: number; maxAvailable: number };

const completionSeeds: CompletionSeed[] = [];
const plannedAnswers: PlannedAnswer[] = [];
const plannedEvidence: PlannedEvidence[] = [];
let unrecoverableCount = 0;
let recoverableCount = 0;
let skippedNoMapping = 0;

for (const [, group] of byUserQuiz) {
  const earliest = [...group].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())[0];
  completionSeeds.push({ userId: earliest.user_id, quizKey: earliest.quiz_id, quizResultId: earliest.id, completedAt: new Date(earliest.completed_at).toISOString() });

  if (!earliest.answers) {
    unrecoverableCount += 1;
    continue; // completion-level seed only -- no answers to reconstruct, never fabricated.
  }
  recoverableCount += 1;

  for (const [questionKey, choiceKey] of Object.entries(earliest.answers)) {
    const key = `${earliest.quiz_id}::${questionKey}`;
    const awards = awardsByQuizQuestion.get(key);
    const answerKey = `${earliest.user_id}::${earliest.quiz_id}::${questionKey}`;
    plannedAnswers.push({ userId: earliest.user_id, quizKey: earliest.quiz_id, questionKey, choiceKey, answeredAt: new Date(earliest.completed_at).toISOString() });
    if (!awards || awards.length === 0) {
      skippedNoMapping += 1;
      continue; // held/unapproved quiz, or a legitimately zero-award question -- no evidence rows, answer row still written.
    }
    const maxByTrait = new Map<number, number>();
    const earnedByTrait = new Map<number, number>();
    for (const award of awards) {
      const traitId = traitIdForPoleKey(award.poleId);
      maxByTrait.set(traitId, Math.max(maxByTrait.get(traitId) ?? 0, award.points));
      if (award.choiceId === choiceKey) earnedByTrait.set(traitId, Math.max(earnedByTrait.get(traitId) ?? 0, award.points));
    }
    for (const [traitId, maxAvailable] of maxByTrait) {
      plannedEvidence.push({ answerKey, traitId, pointsEarned: earnedByTrait.get(traitId) ?? 0, maxAvailable });
    }
  }
}

const distinctEvidenceKeys = new Set(plannedEvidence.map((e) => `${e.answerKey}::${e.traitId}`));
const violations = plannedEvidence.filter((e) => e.pointsEarned > e.maxAvailable).length;

console.log('=== Build 22 quiz backfill v3 (completion-level seed) -- report (dry run, no writes) ===');
console.log(`(user, quiz) pairs: ${byUserQuiz.size}  -> user_quiz_completions rows seeded: ${completionSeeds.length}`);
console.log(`  earliest completion UNRECOVERABLE (no stored answers): ${unrecoverableCount} -- seeded as completed, zero evidence, retakes will never re-earn credit for these`);
console.log(`  earliest completion recoverable: ${recoverableCount}`);
console.log(`Planned user_quiz_answers rows: ${plannedAnswers.length}`);
console.log(`Planned user_trait_evidence rows: ${plannedEvidence.length} (distinct keys: ${distinctEvidenceKeys.size} -- must be equal)`);
console.log(`Question/choice pairs with no approved mapping (held quiz or zero-award question): ${skippedNoMapping}`);
console.log(`points_earned > max_available violations: ${violations} (must be 0)`);

if (violations > 0 || distinctEvidenceKeys.size !== plannedEvidence.length) {
  console.error('\nABORTING SQL generation: a correctness violation was found.');
  process.exit(1);
}

const nowComment = new Date().toISOString();
const completionValuesSql = completionSeeds
  .map((c) => `((select quiz_id from public.quizzes where quiz_key = '${escapeLiteral(c.quizKey)}'), '${escapeLiteral(c.userId)}', '${escapeLiteral(c.quizResultId)}', '${escapeLiteral(c.completedAt)}')`)
  .join(',\n  ');
const answerValuesSql = plannedAnswers
  .map(
    (a) =>
      `((select quiz_id from public.quizzes where quiz_key = '${escapeLiteral(a.quizKey)}'), (select qq.question_id from public.quiz_questions qq join public.quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = '${escapeLiteral(a.quizKey)}' and qq.question_key = '${escapeLiteral(a.questionKey)}'), (select qc.choice_id from public.quiz_choices qc join public.quiz_questions qq on qq.question_id = qc.question_id join public.quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = '${escapeLiteral(a.quizKey)}' and qq.question_key = '${escapeLiteral(a.questionKey)}' and qc.choice_key = '${escapeLiteral(a.choiceKey)}'), '${escapeLiteral(a.userId)}', '${escapeLiteral(a.answeredAt)}')`,
  )
  .join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Generated by scripts/backfill-quiz-pole-evidence.ts on ${nowComment}.
-- PREREQUISITE: 20261028010000, 20261028020000, 20261028040000 must all be applied first.
--
-- Seeds user_quiz_completions for all ${completionSeeds.length} (user, quiz) pairs using each pair's
-- EARLIEST completion -- ${unrecoverableCount} of which have no recoverable answers and are seeded
-- completion-only (no user_quiz_answers/evidence; their retakes will correctly earn zero
-- future credit). The remaining ${recoverableCount} also get ${plannedAnswers.length} user_quiz_answers rows and
-- ${plannedEvidence.length} user_trait_evidence rows (${skippedNoMapping} question/choice pairs skipped -- held quiz
-- or a legitimately zero-award question, never fabricated).
--
-- Idempotent: ON CONFLICT DO NOTHING on user_quiz_completions (its own PK already IS the
-- idempotency key); trait evidence upserts via DO UPDATE so a rerun after a further mapping
-- correction recomputes rather than freezing stale values -- rerunning this script twice
-- produces the identical end state both times, never doubled totals.
-- ============================================================================================

begin;

create temporary table tmp_completion_seeds (quiz_id smallint, user_id uuid, quiz_result_id uuid, completed_at timestamptz) on commit drop;
insert into tmp_completion_seeds (quiz_id, user_id, quiz_result_id, completed_at) values
  ${completionValuesSql};

insert into public.user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at)
select user_id, quiz_id, quiz_result_id, completed_at from tmp_completion_seeds
on conflict (user_id, quiz_id) do nothing;

create temporary table tmp_backfill_answers (quiz_id smallint, question_id integer, choice_id integer, user_id uuid, answered_at timestamptz) on commit drop;
insert into tmp_backfill_answers (quiz_id, question_id, choice_id, user_id, answered_at) values
  ${answerValuesSql};

insert into public.user_quiz_answers (user_id, quiz_id, question_id, choice_id, answered_at, created_at)
select user_id, quiz_id, question_id, choice_id, answered_at, now() from tmp_backfill_answers
on conflict (user_id, quiz_id, question_id) do nothing;

insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at, last_corrected_at)
select
  uqa.user_id, 'quiz_answer', uqa.id, awards.trait_id,
  coalesce(max(awards.points) filter (where awards.choice_id = uqa.choice_id), 0),
  max(awards.points),
  tba.answered_at,
  now()
from tmp_backfill_answers tba
join public.user_quiz_answers uqa
  on uqa.user_id = tba.user_id and uqa.quiz_id = tba.quiz_id and uqa.question_id = tba.question_id and uqa.answered_at = tba.answered_at
join public.quiz_choice_trait_awards awards on true
join public.quiz_choices qc on qc.choice_id = awards.choice_id and qc.question_id = tba.question_id
group by uqa.user_id, uqa.id, awards.trait_id, tba.answered_at
on conflict (source_answer_id, trait_id) do update set
  points_earned = excluded.points_earned,
  max_available = excluded.max_available,
  last_corrected_at = excluded.last_corrected_at;

-- NOTE: user_trait_totals is deliberately NOT rebuilt here (owner audit, 2026-10-30): doing
-- so from inside EITHER source-specific backfill only ever captures whatever evidence the
-- OTHER source has written so far, which silently depends on run order. The rebuild is its
-- own final step -- see scripts/rebuild-user-trait-totals.ts -- run once, after BOTH this
-- script's and the Daily backfill's evidence inserts have landed, covering every user with
-- any evidence from either source.

commit;
`;

writeFileSync(outputSqlPath, sql);
console.log(`\nSQL written to ${outputSqlPath} (NOT executed).`);
