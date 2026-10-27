// Item 4 of the 2026-10-26 handoff: the existing Core-trait audit
// (docs/quiz-reviews/FREE_QUIZ_CORE_TRAIT_AUDIT_2026-10-26.md) reports "available points" as a
// naive SUM of every award entry for a pole across all 392 answers. That number overstates what
// any one real user could ever actually earn, because a user can select at most ONE answer per
// question -- two awards to the same pole sitting on two different choices of the SAME question
// are mutually exclusive, not additive.
//
// This script computes the real ceiling: for every one of the 98 questions across the 12 free
// quizzes, take the MAX points any single choice of that question offers to a given pole (0 if
// no choice offers it), then sum that max across all 98 questions. This is the true "most this
// pole could reach in one pass through every free quiz," and is what item 4's 9-point
// eligibility question must be evaluated against, not the naive per-entry sum.
//
// Run with: npx tsx scripts/audit-max-achievable-pole-points.ts

import { CORE_POLE_IDS, poleLabel } from '../src/data/personality-v2/pole-ids';
import { ELIGIBILITY_THRESHOLD } from '../src/data/personality-v2/scoring-engine';
import type { QuizPoleAwardMap } from '../src/data/quiz-pole-awards/types';

import { PETTY_POLE_AWARDS } from '../src/data/quiz-pole-awards/petty';
import { CRISIS_POLE_AWARDS } from '../src/data/quiz-pole-awards/crisis';
import { DATING_POLE_AWARDS } from '../src/data/quiz-pole-awards/dating';
import { FRIENDSHIP_POLE_AWARDS } from '../src/data/quiz-pole-awards/friendship';
import { FOOD_ORDER_POLE_AWARDS } from '../src/data/quiz-pole-awards/food-order';
import { SPENDING_POLE_AWARDS } from '../src/data/quiz-pole-awards/spending';
import { ERA_POLE_AWARDS } from '../src/data/quiz-pole-awards/era';
import { ICK_POLE_AWARDS } from '../src/data/quiz-pole-awards/ick';
import { GROUP_CHAT_POLE_AWARDS } from '../src/data/quiz-pole-awards/group-chat';
import { ONE_BITE_POLE_AWARDS } from '../src/data/quiz-pole-awards/one-bite';
import { UNEXPECTED_MONEY_POLE_AWARDS } from '../src/data/quiz-pole-awards/unexpected-money';
import { KID_YOU_POLE_AWARDS } from '../src/data/quiz-pole-awards/kid-you';

const FREE_QUIZZES: Record<string, QuizPoleAwardMap> = {
  petty: PETTY_POLE_AWARDS,
  crisis: CRISIS_POLE_AWARDS,
  dating: DATING_POLE_AWARDS,
  friendship: FRIENDSHIP_POLE_AWARDS,
  'food-order': FOOD_ORDER_POLE_AWARDS,
  spending: SPENDING_POLE_AWARDS,
  era: ERA_POLE_AWARDS,
  ick: ICK_POLE_AWARDS,
  'group-chat': GROUP_CHAT_POLE_AWARDS,
  'one-bite': ONE_BITE_POLE_AWARDS,
  'unexpected-money': UNEXPECTED_MONEY_POLE_AWARDS,
  'kid-you': KID_YOU_POLE_AWARDS,
};

const maxAchievable = new Map<string, number>();
const opportunityCount = new Map<string, number>();
let totalQuestions = 0;

for (const poleId of CORE_POLE_IDS) {
  maxAchievable.set(poleId, 0);
  opportunityCount.set(poleId, 0);
}

for (const [, awardMap] of Object.entries(FREE_QUIZZES)) {
  for (const [, choices] of Object.entries(awardMap)) {
    totalQuestions += 1;
    const bestPerPoleThisQuestion = new Map<string, number>();
    for (const choice of Object.values(choices)) {
      for (const award of choice.awards) {
        opportunityCount.set(award.pole, (opportunityCount.get(award.pole) ?? 0) + 1);
        const currentBest = bestPerPoleThisQuestion.get(award.pole) ?? 0;
        if (award.points > currentBest) {
          bestPerPoleThisQuestion.set(award.pole, award.points);
        }
      }
    }
    for (const [poleId, best] of bestPerPoleThisQuestion) {
      maxAchievable.set(poleId, (maxAchievable.get(poleId) ?? 0) + best);
    }
  }
}

console.log(`Audited ${totalQuestions} questions across ${Object.keys(FREE_QUIZZES).length} free quizzes.\n`);
console.log('| Core pole | Opportunities | Max achievable (one answer/question) | 9-pt eligible |');
console.log('|---|---:|---:|:---:|');

const rows = CORE_POLE_IDS.map((poleId) => ({
  label: poleLabel(poleId),
  opportunities: opportunityCount.get(poleId) ?? 0,
  maxAchievable: maxAchievable.get(poleId) ?? 0,
}));

let eligibleCount = 0;
let ineligible: { label: string; maxAchievable: number }[] = [];
for (const row of rows) {
  const eligible = row.maxAchievable >= ELIGIBILITY_THRESHOLD;
  if (eligible) eligibleCount += 1;
  else ineligible.push({ label: row.label, maxAchievable: row.maxAchievable });
  console.log(`| ${row.label} | ${row.opportunities} | ${row.maxAchievable} | ${eligible ? 'YES' : 'NO'} |`);
}

console.log(`\n${eligibleCount}/${rows.length} Core poles can reach the ${ELIGIBILITY_THRESHOLD}-point eligibility threshold in a single pass through all 12 free quizzes.`);
if (ineligible.length > 0) {
  console.log(`Ineligible: ${ineligible.map((p) => `${p.label} (max ${p.maxAchievable})`).join(', ')}.`);
}
