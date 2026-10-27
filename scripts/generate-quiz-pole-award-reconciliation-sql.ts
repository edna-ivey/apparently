// Generates a RECONCILIATION migration for `quiz_choice_pole_awards` -- the already-APPLIED
// 20261019010000_quiz_choice_pole_awards_seed.sql seed is now badly out of date relative to
// the current src/data/quiz-pole-awards/*.ts calibration (confirmed via `supabase db query
// --linked` on 2026-10-26: production row counts per quiz are roughly 30-60% of what current
// source now specifies -- e.g. petty 49 rows live vs 69 in current source, era 43 vs 131,
// group-chat 30 vs 102 -- because the Oct 22-26 locked-review implementation pass added many
// multi-pole awards per answer that did not exist when the Oct 19 seed was generated).
//
// Unlike the original seed (plain INSERT ... ON CONFLICT DO NOTHING, which only ever ADDS new
// rows and can never fix a changed point value or remove an award that was dropped), this
// migration does a real DELETE-then-INSERT per quiz_id so the table ends up EXACTLY matching
// current source -- no stale rows left behind, no missing new ones. Safe to re-run (idempotent):
// deleting first means a second run just deletes-and-reinserts the same rows.
//
// Source of truth stays src/data/quiz-pole-awards/*.ts; this script only transcribes it, same
// as scripts/generate-quiz-pole-award-seed-sql.ts (which this one is a sibling of, kept
// separate so neither script's job is ambiguous, and so the original historical seed file is
// never rewritten after the fact).
//
// Writes a NEW migration file (never overwrites 20261019010000, which is already applied and
// must stay byte-for-byte what was actually run against production). STAGED, NOT APPLIED --
// requires explicit owner review/authorization before `supabase db push`.
//
// Run with: npx tsx scripts/generate-quiz-pole-award-reconciliation-sql.ts

declare const require: (id: string) => { writeFileSync: (path: string, content: string) => void };
declare const __dirname: string;
const { writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import type { QuizPoleAwardMap } from '../src/data/quiz-pole-awards/types';
import { DATING_POLE_AWARDS } from '../src/data/quiz-pole-awards/dating';
import { FRIENDSHIP_POLE_AWARDS } from '../src/data/quiz-pole-awards/friendship';
import { FOOD_ORDER_POLE_AWARDS } from '../src/data/quiz-pole-awards/food-order';
import { GROUP_CHAT_POLE_AWARDS } from '../src/data/quiz-pole-awards/group-chat';
import { ICK_POLE_AWARDS } from '../src/data/quiz-pole-awards/ick';
import { KID_YOU_POLE_AWARDS } from '../src/data/quiz-pole-awards/kid-you';
import { ONE_BITE_POLE_AWARDS } from '../src/data/quiz-pole-awards/one-bite';
import { SPENDING_POLE_AWARDS } from '../src/data/quiz-pole-awards/spending';
import { UNEXPECTED_MONEY_POLE_AWARDS } from '../src/data/quiz-pole-awards/unexpected-money';
import { CRISIS_POLE_AWARDS } from '../src/data/quiz-pole-awards/crisis';
import { ERA_POLE_AWARDS } from '../src/data/quiz-pole-awards/era';
import { PETTY_POLE_AWARDS } from '../src/data/quiz-pole-awards/petty';
import { BE_SO_SERIOUS_POLE_AWARDS } from '../src/data/quiz-pole-awards/be-so-serious';
import { KEEP_YOU_AROUND_POLE_AWARDS } from '../src/data/quiz-pole-awards/keep-you-around';
import { CAREER_HOW_BAD_POLE_AWARDS } from '../src/data/quiz-pole-awards/career-how-bad';
import { CAREER_PROVING_POLE_AWARDS } from '../src/data/quiz-pole-awards/career-proving';
import { HIDDEN_YOU_WRONG_POLE_AWARDS } from '../src/data/quiz-pole-awards/hidden-you-wrong';
import { LIFE_MATCH_DREAM_LIFE_POLE_AWARDS } from '../src/data/quiz-pole-awards/life-match-dream-life';
import { LOVE_READY_POLE_AWARDS } from '../src/data/quiz-pole-awards/love-ready';
import { PRIVATE_PRIVATE_TROUBLE_POLE_AWARDS } from '../src/data/quiz-pole-awards/private-private-trouble';
import { STYLE_VIBE_INTIMIDATING_POLE_AWARDS } from '../src/data/quiz-pole-awards/style-vibe-intimidating';
import { WHATS_YOUR_TYPE_QUESTIONS } from '../src/data/quizzes/whats-your-type-content';

const POLE_AWARD_MAPS: Record<string, QuizPoleAwardMap> = {
  dating: DATING_POLE_AWARDS,
  friendship: FRIENDSHIP_POLE_AWARDS,
  'food-order': FOOD_ORDER_POLE_AWARDS,
  'group-chat': GROUP_CHAT_POLE_AWARDS,
  ick: ICK_POLE_AWARDS,
  'kid-you': KID_YOU_POLE_AWARDS,
  'one-bite': ONE_BITE_POLE_AWARDS,
  spending: SPENDING_POLE_AWARDS,
  'unexpected-money': UNEXPECTED_MONEY_POLE_AWARDS,
  crisis: CRISIS_POLE_AWARDS,
  era: ERA_POLE_AWARDS,
  petty: PETTY_POLE_AWARDS,
  'be-so-serious': BE_SO_SERIOUS_POLE_AWARDS,
  'keep-you-around': KEEP_YOU_AROUND_POLE_AWARDS,
  'career-ambition-how-bad': CAREER_HOW_BAD_POLE_AWARDS,
  'career-ambition-proving': CAREER_PROVING_POLE_AWARDS,
  'hidden-you-wrong': HIDDEN_YOU_WRONG_POLE_AWARDS,
  'life-match-dream-life': LIFE_MATCH_DREAM_LIFE_POLE_AWARDS,
  'love-soulmates-ready': LOVE_READY_POLE_AWARDS,
  'private-private-trouble': PRIVATE_PRIVATE_TROUBLE_POLE_AWARDS,
  'style-vibe-intimidating': STYLE_VIBE_INTIMIDATING_POLE_AWARDS,
};

type Row = { quizId: string; questionId: string; choiceId: string; poleId: string; points: 1 | 2 | 3 };

const rows: Row[] = [];
for (const [quizId, map] of Object.entries(POLE_AWARD_MAPS)) {
  for (const [questionId, choices] of Object.entries(map)) {
    for (const [choiceId, calibration] of Object.entries(choices)) {
      for (const award of calibration.awards) {
        rows.push({ quizId, questionId, choiceId, poleId: award.pole, points: award.points });
      }
    }
  }
}
for (const question of WHATS_YOUR_TYPE_QUESTIONS) {
  for (const choice of question.choices) {
    for (const award of choice.coreAwards) {
      rows.push({ quizId: 'whats-your-type', questionId: question.id, choiceId: choice.id, poleId: award.pole, points: award.points });
    }
  }
}

if (rows.length === 0) {
  throw new Error('No rows generated -- refusing to write an empty reconciliation migration.');
}

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");
const quizIds = Object.keys(POLE_AWARD_MAPS).concat(['whats-your-type']);

const valuesSql = rows
  .map(
    (row) =>
      `('${escapeLiteral(row.quizId)}', '${escapeLiteral(row.questionId)}', '${escapeLiteral(row.choiceId)}', '${escapeLiteral(row.poleId)}', ${row.points}, 'v2.0')`,
  )
  .join(',\n  ');

const quizIdListSql = quizIds.map((id) => `'${escapeLiteral(id)}'`).join(', ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
--
-- Reconciles public.quiz_choice_pole_awards (applied 2026-10-19 via
-- 20261019010000_quiz_choice_pole_awards_seed.sql) with the CURRENT src/data/quiz-pole-
-- awards/*.ts calibration, which has materially changed since that seed was generated -- the
-- 2026-10-22 through 2026-10-26 locked creative review passes added many multi-pole awards per
-- answer that the Oct 19 seed never had. Confirmed via \`supabase db query --linked\` on
-- 2026-10-26: live per-quiz row counts are roughly 30-60% of what current source now specifies
-- (e.g. petty 49 live vs ${rows.filter((r) => r.quizId === 'petty').length} current, era 43 live vs ${rows.filter((r) => r.quizId === 'era').length} current, group-chat 30 live vs ${rows.filter((r) => r.quizId === 'group-chat').length} current).
--
-- Generated mechanically by scripts/generate-quiz-pole-award-reconciliation-sql.ts from
-- src/data/quiz-pole-awards/*.ts and whats-your-type-content.ts -- do not hand-edit;
-- regenerate instead if the source calibration changes again.
--
-- Unlike the original seed's plain INSERT ... ON CONFLICT DO NOTHING (which can only ever ADD
-- rows, never fix a changed point value or remove a dropped award), this migration DELETEs
-- every existing row for each of these ${quizIds.length} quiz ids first, then inserts the full
-- current set -- so the table ends up EXACTLY matching current source, not merely a superset
-- of the old one. Idempotent/safe to re-run: a second run deletes and reinserts the identical
-- rows.
--
-- Does NOT touch personality_pole_evidence (the per-user evidence table) -- as of 2026-10-26
-- that table has 32 real rows across 4 real users, accumulated under the OLD, thinner
-- calibration. This migration does not retroactively recompute or correct those already-
-- recorded rows; it only fixes the calibration LOOKUP table so every submission FROM NOW ON
-- scores against the current, correct mappings. Whether the existing 32 rows for those 4 users
-- should also be corrected/backfilled is a separate decision for the product owner -- flagged,
-- not resolved, here.
--
-- ${rows.length} rows across ${quizIds.length} quizzes.
-- ============================================================================================

begin;

delete from public.quiz_choice_pole_awards
where quiz_id in (${quizIdListSql});

insert into public.quiz_choice_pole_awards (quiz_id, question_id, choice_id, pole_id, points, scoring_version)
values
  ${valuesSql};

commit;
`;

const outputPath = join(__dirname, '../supabase/migrations/20261026170000_reconcile_quiz_choice_pole_awards.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${rows.length} rows across ${quizIds.length} quizzes to ${outputPath}`);
