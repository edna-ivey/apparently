// THE post-implementation fairness/coverage audit (Build 16/V2, task section 12). Computes the
// REAL per-pole opportunity matrix from the actual calibrated data in
// src/data/quiz-pole-awards/*.ts against the actual live quiz definitions in
// src/data/quizzes/*.ts -- never from assumption or memory of what "should" be mapped.
//
// IMPORTANT SCOPE LIMITATION, stated here and in the generated report: this script can only see
// QUIZ content. The Daily side (public.daily_questions/daily_options/daily_answers) could not be
// inspected in this pass -- no live Supabase credentials with sufficient access were available
// in this environment (no service-role key, no admin-authenticated session; RLS blocks an
// anonymous/unauthenticated read of that content). Every number below is QUIZ-ONLY unless noted.
// See docs/personality-scoring-v2-design.md and the final report for how to complete the Daily
// side once someone with real database access runs the equivalent audit against
// personality_pole_evidence/daily_options.pole_personality_effects.
//
// "Catalog-wide potential" below means: the maximum a user COULD earn if they answered every
// current question of the relevant access tier exactly once, taking the single best choice's
// points per pole per question (never summed across mutually exclusive choices). This is
// deliberately distinct from "realistic user access," which depends on real usage patterns this
// script has no data on -- see the printed caveat under each tier.
//
// Run with:
//   npx tsx scripts/generate-personality-v2-coverage-report.ts

import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import type { QuizDefinition } from '../src/data/quizzes/types';
import { ALL_POLE_IDS, poleIsCore, poleLabel, type PersonalityPoleId } from '../src/data/personality-v2/pole-ids';
import type { QuizPoleAwardMap } from '../src/data/quiz-pole-awards/types';
import { ELIGIBILITY_THRESHOLD } from '../src/data/personality-v2/scoring-engine';

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

type Tier = 'free' | 'private-preview' | 'private';

const tierOf = (quizId: string): Tier => QUIZ_REGISTRY[quizId].access as Tier;

type PoleCatalogStats = {
  poleId: PersonalityPoleId;
  label: string;
  isCore: boolean;
  byTier: Record<Tier, { maxAvailable: number; distinctQuestions: number; distinctQuizzes: Set<string> }>;
};

const emptyTierStats = () => ({ maxAvailable: 0, distinctQuestions: 0, distinctQuizzes: new Set<string>() });

const statsByPole = new Map<PersonalityPoleId, PoleCatalogStats>();
for (const poleId of ALL_POLE_IDS) {
  statsByPole.set(poleId, {
    poleId,
    label: poleLabel(poleId),
    isCore: poleIsCore(poleId),
    byTier: { free: emptyTierStats(), 'private-preview': emptyTierStats(), private: emptyTierStats() },
  });
}

const CURRENT_PLAYABLE_QUIZ_IDS = Object.keys(QUIZ_REGISTRY).filter((id) => !(QUIZ_REGISTRY[id] as QuizDefinition & { historicalOnly?: boolean }).historicalOnly);

for (const quizId of CURRENT_PLAYABLE_QUIZ_IDS) {
  const definition = QUIZ_REGISTRY[quizId];
  const map = POLE_AWARD_MAPS[quizId];
  const tier = tierOf(quizId);
  if (!map) {
    console.warn(`WARN: no pole-award matrix for "${quizId}" -- excluded from this report`);
    continue;
  }

  for (const question of definition.questions) {
    const questionEntry = map[question.id];
    if (!questionEntry) continue;

    const maxByPoleThisQuestion = new Map<PersonalityPoleId, number>();
    for (const choice of question.choices) {
      const calibration = questionEntry[choice.id];
      if (!calibration) continue;
      for (const award of calibration.awards) {
        const current = maxByPoleThisQuestion.get(award.pole) ?? 0;
        if (award.points > current) {
          maxByPoleThisQuestion.set(award.pole, award.points);
        }
      }
    }

    for (const [poleId, maxPoints] of maxByPoleThisQuestion.entries()) {
      const stats = statsByPole.get(poleId);
      if (!stats) continue;
      stats.byTier[tier].maxAvailable += maxPoints;
      stats.byTier[tier].distinctQuestions += 1;
      stats.byTier[tier].distinctQuizzes.add(quizId);
    }
  }
}

// ============================================================================================
// Report
// ============================================================================================

console.log('='.repeat(100));
console.log('PERSONALITY SCORING V2 -- POST-FIX 64-POLE COVERAGE REPORT (QUIZ CONTENT ONLY)');
console.log('='.repeat(100));
console.log('');
console.log('SCOPE LIMITATION: Daily content (public.daily_questions/daily_options) could not be');
console.log('inspected in this session -- no live Supabase admin/service credentials were available.');
console.log('All figures below are QUIZ-ONLY. See the accompanying report text for how this changes');
console.log('once Daily is included.');
console.log('');
console.log('"Catalog potential" = max earnable if a user answered every current question of that');
console.log('access tier once, best single choice per question per pole. This is NOT a claim about');
console.log('what any real user actually encounters -- see "realistic access" notes per pole.');
console.log('');

const rows: string[] = [];
let withMapping = 0;
let withNinePlusCombined = 0;
let withThreeQuestionsCombined = 0;
let coreFreeEligible = 0;
let coreFreeIneligible: string[] = [];
let privateEligibleViaPermittedContent = 0;
let privateIneligible: string[] = [];
let belowThreshold: string[] = [];
let needsMoreScenarios: string[] = [];

for (const poleId of ALL_POLE_IDS) {
  const stats = statsByPole.get(poleId)!;
  const free = stats.byTier.free;
  const preview = stats.byTier['private-preview'];
  const premium = stats.byTier.private;
  const combinedMax = free.maxAvailable + preview.maxAvailable + premium.maxAvailable;
  const combinedQuestions = free.distinctQuestions + preview.distinctQuestions + premium.distinctQuestions;
  const combinedQuizzes = new Set([...free.distinctQuizzes, ...preview.distinctQuizzes, ...premium.distinctQuizzes]);
  const hasAnyMapping = combinedQuestions > 0;
  const nineAttainable = combinedMax >= ELIGIBILITY_THRESHOLD;
  const threeQuestionsAttainable = combinedQuestions >= 3;

  if (hasAnyMapping) withMapping += 1;
  if (nineAttainable) withNinePlusCombined += 1;
  if (threeQuestionsAttainable) withThreeQuestionsCombined += 1;

  const freeAlonePath = free.maxAvailable + preview.maxAvailable; // preview quizzes are free to play
  const freeReachable = freeAlonePath >= ELIGIBILITY_THRESHOLD && (free.distinctQuestions + preview.distinctQuestions) >= 3;

  if (stats.isCore) {
    if (freeReachable) {
      coreFreeEligible += 1;
    } else {
      coreFreeIneligible.push(`${stats.label} (${poleId})`);
    }
  } else {
    // Private poles: "permitted content" = private-preview + premium (their intended access
    // paths) -- free-only reachability is not expected/required for these.
    const privateReachable = (preview.maxAvailable + premium.maxAvailable) >= ELIGIBILITY_THRESHOLD && (preview.distinctQuestions + premium.distinctQuestions) >= 3;
    if (privateReachable) {
      privateEligibleViaPermittedContent += 1;
    } else {
      privateIneligible.push(`${stats.label} (${poleId})`);
    }
  }

  if (!nineAttainable || !threeQuestionsAttainable) {
    belowThreshold.push(`${stats.label} (${poleId}): combined max ${combinedMax} pts across ${combinedQuestions} question(s), ${combinedQuizzes.size} quiz(zes)`);
  }
  if (combinedQuizzes.size <= 1 && hasAnyMapping) {
    needsMoreScenarios.push(`${stats.label} (${poleId}): only ${combinedQuizzes.size} quiz currently offers this pole -- single point of failure if that quiz changes`);
  }

  rows.push(
    [
      stats.label.padEnd(22),
      poleId.padEnd(38),
      stats.isCore ? 'Core   ' : 'Private',
      `free:${free.maxAvailable}/${free.distinctQuestions}q`.padEnd(14),
      `preview:${preview.maxAvailable}/${preview.distinctQuestions}q`.padEnd(16),
      `premium:${premium.maxAvailable}/${premium.distinctQuestions}q`.padEnd(16),
      `combined:${combinedMax}/${combinedQuestions}q/${combinedQuizzes.size}quiz`.padEnd(22),
      nineAttainable ? '9pt OK ' : '9pt MISS',
      threeQuestionsAttainable ? '3q OK' : '3q MISS',
    ].join(' | '),
  );
}

console.log('Per-pole catalog potential (quiz-only):');
console.log('-'.repeat(100));
rows.forEach((row) => console.log(row));
console.log('-'.repeat(100));
console.log('');

console.log('SUMMARY COUNTS (64 poles total, quiz-only):');
console.log(`  Poles with at least one legitimate mapping:        ${withMapping} / 64`);
console.log(`  Poles with catalog-wide max >= 9 points:            ${withNinePlusCombined} / 64`);
console.log(`  Poles with >= 3 distinct supporting questions:      ${withThreeQuestionsCombined} / 64`);
console.log(`  Core poles reachable through FREE + preview alone:  ${coreFreeEligible} / 40`);
console.log(`  Private poles reachable through permitted content:  ${privateEligibleViaPermittedContent} / 24`);
console.log(`  Poles still below the 9pt/3q threshold (combined):  ${belowThreshold.length} / 64`);
console.log(`  Poles needing additional scenarios (<=1 quiz src):  ${needsMoreScenarios.length} / 64`);
console.log('');

if (coreFreeIneligible.length > 0) {
  console.log('CORE poles NOT realistically reachable by a free user from current quiz content alone:');
  coreFreeIneligible.forEach((line) => console.log(`  - ${line}`));
  console.log('');
}
if (privateIneligible.length > 0) {
  console.log('PRIVATE poles not yet reaching threshold through their permitted (preview/premium) content:');
  privateIneligible.forEach((line) => console.log(`  - ${line}`));
  console.log('');
}
if (belowThreshold.length > 0) {
  console.log('All poles below threshold (9pts or 3 questions), combined across every tier:');
  belowThreshold.forEach((line) => console.log(`  - ${line}`));
  console.log('');
}
if (needsMoreScenarios.length > 0) {
  console.log('Poles with fragile single-source coverage (only one quiz currently supports them):');
  needsMoreScenarios.forEach((line) => console.log(`  - ${line}`));
}
