// Build 22 historical Daily backfill, rewritten against the numeric daily_option_trait_awards/
// user_trait_evidence schema (20261028050000). Simpler than the quiz backfill: a Daily
// occurrence can be answered at most once ever (daily_answers' own existing unique
// constraint), so there is no "first completion among several retakes" case to replay in
// order -- every real daily_answers row IS, by construction, the one and only answer for its
// occurrence.
//
// THIS SCRIPT NEVER CONNECTS TO ANY DATABASE -- same contract as the quiz backfill.
//
// Run with: npx tsx scripts/backfill-daily-pole-evidence.ts <daily-answers.json> <option-question-map.json> <output-sql-path>

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void };
declare const process: { argv: string[]; exit: (code: number) => void };
const { readFileSync, writeFileSync } = require('fs');

import { readDailyOptionPoleAwards } from './lib/daily-pole-award-rows';
import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

type DailyAnswer = { id: string; user_id: string; question_id: string; option_id: string; created_at: string };
type OptionQuestionMap = { id: string; question_id: string };

const readJsonRows = <T>(path: string): T[] => {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  return parsed.rows as T[];
};

const [, , answersPath, optionMapPath, outputSqlPath] = process.argv;
if (!answersPath || !optionMapPath || !outputSqlPath) {
  console.error('Usage: npx tsx scripts/backfill-daily-pole-evidence.ts <daily-answers.json> <option-question-map.json> <output-sql-path>');
  process.exit(1);
}

const answers = readJsonRows<DailyAnswer>(answersPath);
const optionQuestionMap = readJsonRows<OptionQuestionMap>(optionMapPath);
const optionAwards = readDailyOptionPoleAwards();

// Build 22 owner audit (2026-10-31), item 1: same ledger-backed, read-only resolution as
// backfill-quiz-pole-evidence.ts -- see that file's comment for the full rationale.
const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

const questionIdByOption = new Map(optionQuestionMap.map((r) => [r.id, r.question_id] as const));
const awardsByOption = new Map(optionAwards.map((r) => [r.optionId, r.awards] as const));
const optionsByQuestion = new Map<string, string[]>();
for (const row of optionQuestionMap) {
  const list = optionsByQuestion.get(row.question_id) ?? [];
  list.push(row.id);
  optionsByQuestion.set(row.question_id, list);
}

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

type PlannedEvidence = { userId: string; answerId: string; traitId: number; pointsEarned: number; maxAvailable: number; occurredAt: string };
const plannedEvidence: PlannedEvidence[] = [];
let skippedRoomOnly = 0;

for (const answer of answers) {
  const questionId = questionIdByOption.get(answer.option_id);
  if (!questionId) {
    skippedRoomOnly += 1;
    continue;
  }
  const maxByTrait = new Map<number, number>();
  const earnedByTrait = new Map<number, number>();
  for (const optionId of optionsByQuestion.get(questionId) ?? []) {
    for (const award of awardsByOption.get(optionId) ?? []) {
      const traitId = traitIdForPoleKey(award.pole);
      maxByTrait.set(traitId, Math.max(maxByTrait.get(traitId) ?? 0, award.points));
      if (optionId === answer.option_id) {
        earnedByTrait.set(traitId, Math.max(earnedByTrait.get(traitId) ?? 0, award.points));
      }
    }
  }
  for (const [traitId, maxAvailable] of maxByTrait) {
    plannedEvidence.push({
      userId: answer.user_id,
      answerId: answer.id,
      traitId,
      pointsEarned: earnedByTrait.get(traitId) ?? 0,
      maxAvailable,
      occurredAt: new Date(answer.created_at).toISOString(),
    });
  }
}

const distinctKeys = new Set(plannedEvidence.map((e) => `${e.answerId}::${e.traitId}`));
const violations = plannedEvidence.filter((e) => e.pointsEarned > e.maxAvailable).length;
const distinctUsers = new Set(answers.map((a) => a.user_id)).size;

console.log('=== Build 22 Daily backfill v2 -- report (dry run, no writes) ===');
console.log(`Daily answers processed: ${answers.length} (across ${distinctUsers} users)`);
console.log(`Answers for ROOM_ONLY questions (no personality mapping, correctly skipped): ${skippedRoomOnly}`);
console.log(`Planned user_trait_evidence rows: ${plannedEvidence.length}`);
console.log(`  distinct (answer, trait) keys: ${distinctKeys.size} (must equal total rows)`);
console.log(`points_earned > max_available violations: ${violations} (must be 0)`);

if (violations > 0 || distinctKeys.size !== plannedEvidence.length) {
  console.error('\nABORTING SQL generation: a correctness violation was found.');
  process.exit(1);
}

const nowComment = new Date().toISOString();
const valuesSql = plannedEvidence
  .map(
    (row) =>
      `('${escapeLiteral(row.userId)}', 'daily_answer', '${escapeLiteral(row.answerId)}', ${row.traitId}, ${row.pointsEarned}, ${row.maxAvailable}, '${escapeLiteral(row.occurredAt)}', now())`,
  )
  .join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Generated by scripts/backfill-daily-pole-evidence.ts on ${nowComment}.
-- PREREQUISITE: 20261028010000, 20261028040000, 20261028050000 must all be applied first.
--
-- Backfills ${plannedEvidence.length} user_trait_evidence rows for ${answers.length - skippedRoomOnly} historical Daily answers
-- that carry a real personality mapping (${skippedRoomOnly} ROOM_ONLY answers correctly excluded).
-- No user_quiz_answers-equivalent insert is needed here -- daily_answers already is the
-- permanent, one-shot answer record (its own existing unique constraint already enforces
-- "one answer per occurrence, ever"); this backfill only adds the trait evidence that would
-- have been written at submission time had daily_option_trait_awards existed then.
-- ============================================================================================

insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at, last_corrected_at)
values
  ${valuesSql}
on conflict (source_answer_id, trait_id) do update set
  points_earned = excluded.points_earned,
  max_available = excluded.max_available,
  last_corrected_at = excluded.last_corrected_at;
`;

writeFileSync(outputSqlPath, sql);
console.log(`\nSQL written to ${outputSqlPath} (NOT executed).`);
