// Generates the data-only seed migration for `quiz_choice_pole_awards` (the server-side
// authoritative copy of src/data/quiz-pole-awards/*.ts that submit_quiz_pole_evidence joins
// against -- see docs/personality-scoring-v2-design.md section 9 and the schema migration's
// own comment on this table). Source of truth stays src/data/quiz-pole-awards/*.ts; this
// script only transcribes it into INSERT statements, computing nothing and inventing nothing.
//
// Reuses the EXACT SAME quiz_id -> QuizPoleAwardMap mapping scripts/validate-quiz-pole-award-
// matrix.ts already uses and keeps passing against the live 21-quiz registry, so this script
// never needs its own separate quiz_id correctness check -- that validator is already the
// proof this mapping is right.
//
// Also seeds "What's Your Type?" (src/data/quizzes/whats-your-type-content.ts) under its own
// quiz_id -- its Core-evidence `coreAwards` per choice are the exact same {pole, points} shape,
// so the one universal submit_quiz_pole_evidence RPC can serve it with no special-casing,
// exactly like every other quiz.
//
// Run with: npx tsx scripts/generate-quiz-pole-award-seed-sql.ts > /tmp/seed.sql (or see main()
// below, which writes directly to the migration file path).

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

// quiz registry id -> its pole-award map -- IDENTICAL to scripts/validate-quiz-pole-award-
// matrix.ts's own POLE_AWARD_MAPS. Kept as a literal copy (not a shared import) so this
// generator has zero runtime dependency on that validator module; the validator remains the
// correctness check against the live quiz registry either way.
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

// What's Your Type? -- same {pole, points} shape, own quiz_id, own question ids (q1..q10).
for (const question of WHATS_YOUR_TYPE_QUESTIONS) {
  for (const choice of question.choices) {
    for (const award of choice.coreAwards) {
      rows.push({ quizId: 'whats-your-type', questionId: question.id, choiceId: choice.id, poleId: award.pole, points: award.points });
    }
  }
}

if (rows.length === 0) {
  throw new Error('No rows generated -- refusing to write an empty seed migration.');
}

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

const valuesSql = rows
  .map(
    (row) =>
      `('${escapeLiteral(row.quizId)}', '${escapeLiteral(row.questionId)}', '${escapeLiteral(row.choiceId)}', '${escapeLiteral(row.poleId)}', ${row.points}, 'v2.0')`,
  )
  .join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT YET APPLIED (generated). Data-only seed for quiz_choice_pole_awards -- requires
-- 20261018010000_personality_scoring_v2_schema.sql (which creates this table) to already be
-- applied first. Generated mechanically from src/data/quiz-pole-awards/*.ts and
-- src/data/quizzes/whats-your-type-content.ts by scripts/generate-quiz-pole-award-seed-sql.ts
-- -- do not hand-edit; regenerate instead if the source calibration changes.
--
-- ${rows.length} rows across ${Object.keys(POLE_AWARD_MAPS).length + 1} quizzes (the 21 QUIZ_REGISTRY quizzes with V2
-- calibration, plus What's Your Type?, which carries its own Core-evidence coreAwards in the
-- same {pole, points} shape). "on conflict do nothing" against the table's own primary key
-- (quiz_id, question_id, choice_id, pole_id) makes this safe to re-run.
-- ============================================================================================

insert into public.quiz_choice_pole_awards (quiz_id, question_id, choice_id, pole_id, points, scoring_version)
values
  ${valuesSql}
on conflict (quiz_id, question_id, choice_id, pole_id) do nothing;
`;

const outputPath = join(__dirname, '../supabase/migrations/20261019010000_quiz_choice_pole_awards_seed.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${rows.length} rows to ${outputPath}`);
