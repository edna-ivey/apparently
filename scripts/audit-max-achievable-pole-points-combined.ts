// Extends audit-max-achievable-pole-points.ts to include the 10 Apparently Private quizzes
// alongside the 12 free quizzes, to answer: does combining Free + Private content (as it
// exists in code TODAY, before any owner review/approval of Private mappings) already clear
// the 9-point V2 eligibility threshold for poles that fall short on free content alone (Face
// Value, Competitive)? This does NOT imply the Private mappings are approved -- it only
// measures what the CURRENT code would produce, as input to the owner's own review decision.
//
// NOTE: secretly-love has NO quiz-pole-awards file at all (zero V2 calibration exists for it
// -- it is historicalOnly, superseded by keep-you-around, and was apparently never calibrated
// for V2). It is excluded from this count for that reason, not by oversight.
//
// Run with: npx tsx scripts/audit-max-achievable-pole-points-combined.ts

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

import { BE_SO_SERIOUS_POLE_AWARDS } from '../src/data/quiz-pole-awards/be-so-serious';
import { CAREER_HOW_BAD_POLE_AWARDS } from '../src/data/quiz-pole-awards/career-how-bad';
import { CAREER_PROVING_POLE_AWARDS } from '../src/data/quiz-pole-awards/career-proving';
import { HIDDEN_YOU_WRONG_POLE_AWARDS } from '../src/data/quiz-pole-awards/hidden-you-wrong';
import { KEEP_YOU_AROUND_POLE_AWARDS } from '../src/data/quiz-pole-awards/keep-you-around';
import { LIFE_MATCH_DREAM_LIFE_POLE_AWARDS } from '../src/data/quiz-pole-awards/life-match-dream-life';
import { LOVE_READY_POLE_AWARDS } from '../src/data/quiz-pole-awards/love-ready';
import { PRIVATE_PRIVATE_TROUBLE_POLE_AWARDS } from '../src/data/quiz-pole-awards/private-private-trouble';
import { STYLE_VIBE_INTIMIDATING_POLE_AWARDS } from '../src/data/quiz-pole-awards/style-vibe-intimidating';

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

const PRIVATE_QUIZZES: Record<string, QuizPoleAwardMap> = {
  'be-so-serious': BE_SO_SERIOUS_POLE_AWARDS,
  'career-how-bad': CAREER_HOW_BAD_POLE_AWARDS,
  'career-proving': CAREER_PROVING_POLE_AWARDS,
  'hidden-you-wrong': HIDDEN_YOU_WRONG_POLE_AWARDS,
  'keep-you-around': KEEP_YOU_AROUND_POLE_AWARDS,
  'life-match-dream-life': LIFE_MATCH_DREAM_LIFE_POLE_AWARDS,
  'love-ready': LOVE_READY_POLE_AWARDS,
  'private-private-trouble': PRIVATE_PRIVATE_TROUBLE_POLE_AWARDS,
  'style-vibe-intimidating': STYLE_VIBE_INTIMIDATING_POLE_AWARDS,
  // secretly-love: excluded, no V2 calibration file exists (historicalOnly, superseded).
};

function computeMaxAchievable(quizzes: Record<string, QuizPoleAwardMap>): { maxAchievable: Map<string, number>; opportunities: Map<string, number>; questionCount: number } {
  const maxAchievable = new Map<string, number>();
  const opportunities = new Map<string, number>();
  let questionCount = 0;
  for (const poleId of CORE_POLE_IDS) {
    maxAchievable.set(poleId, 0);
    opportunities.set(poleId, 0);
  }
  for (const [, awardMap] of Object.entries(quizzes)) {
    for (const [, choices] of Object.entries(awardMap)) {
      questionCount += 1;
      const bestThisQuestion = new Map<string, number>();
      for (const choice of Object.values(choices)) {
        for (const award of choice.awards) {
          opportunities.set(award.pole, (opportunities.get(award.pole) ?? 0) + 1);
          const current = bestThisQuestion.get(award.pole) ?? 0;
          if (award.points > current) bestThisQuestion.set(award.pole, award.points);
        }
      }
      for (const [poleId, best] of bestThisQuestion) {
        maxAchievable.set(poleId, (maxAchievable.get(poleId) ?? 0) + best);
      }
    }
  }
  return { maxAchievable, opportunities, questionCount };
}

const freeOnly = computeMaxAchievable(FREE_QUIZZES);
const privateOnly = computeMaxAchievable(PRIVATE_QUIZZES);
const combined = computeMaxAchievable({ ...FREE_QUIZZES, ...PRIVATE_QUIZZES });

console.log(`Free: ${freeOnly.questionCount} questions across ${Object.keys(FREE_QUIZZES).length} quizzes.`);
console.log(`Private (current code, NOT yet owner-reviewed/approved): ${privateOnly.questionCount} questions across ${Object.keys(PRIVATE_QUIZZES).length} quizzes (secretly-love excluded, no V2 file).\n`);

console.log('| Core pole | Free max | Private max (current code) | Combined max | 9-pt eligible (combined) |');
console.log('|---|---:|---:|---:|:---:|');

let eligibleCombined = 0;
const stillShort: { label: string; combined: number }[] = [];
for (const poleId of CORE_POLE_IDS) {
  const label = poleLabel(poleId);
  const freeMax = freeOnly.maxAchievable.get(poleId) ?? 0;
  const privMax = privateOnly.maxAchievable.get(poleId) ?? 0;
  const combinedMax = combined.maxAchievable.get(poleId) ?? 0;
  const eligible = combinedMax >= ELIGIBILITY_THRESHOLD;
  if (eligible) eligibleCombined += 1;
  else stillShort.push({ label, combined: combinedMax });
  console.log(`| ${label} | ${freeMax} | ${privMax} | ${combinedMax} | ${eligible ? 'YES' : 'NO'} |`);
}

console.log(`\n${eligibleCombined}/${CORE_POLE_IDS.length} Core poles reach the ${ELIGIBILITY_THRESHOLD}-point threshold when combining Free + current (unapproved) Private code.`);
if (stillShort.length > 0) {
  console.log(`Still short even with Private included: ${stillShort.map((p) => `${p.label} (max ${p.combined})`).join(', ')}.`);
} else {
  console.log('All 40 Core poles would be eligible once Private content is included -- but Private mappings are NOT yet owner-reviewed/approved, so this is informative only, not a basis for any code change yet.');
}
