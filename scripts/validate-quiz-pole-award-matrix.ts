// Validates src/data/quiz-pole-awards/*.ts (the Build 16/V2 answer-level scoring matrix)
// against the REAL quiz content in src/data/quizzes/*.ts -- every playable question and choice
// across all 21 current quizzes must have exactly one calibration entry, every pole id must be
// a real one of the 64 canonical poles, every point value must be in {1,2,3}, free quizzes must
// never award a Private pole, and the recorded `wording` must still match the quiz's actual
// current choice label (catches an editorial wording change made after calibration without
// this matrix being revisited). Run with:
//
//   npx tsx scripts/validate-quiz-pole-award-matrix.ts

declare const require: (id: string) => { readdirSync: (path: string) => string[]; readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import type { QuizDefinition } from '../src/data/quizzes/types';
import { ALL_POLE_IDS, poleIsPrivate } from '../src/data/personality-v2/pole-ids';
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

let failures = 0;
let warnings = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
};
const warn = (message: string): void => {
  warnings += 1;
  console.warn(`WARN: ${message}`);
};

// quiz registry id -> its pole-award map. 'secretly-love' is deliberately excluded --
// historicalOnly, not part of the current playable catalog (see QUIZ_REGISTRY's own comment
// and src/data/quizzes/secretly-love.ts).
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

const CURRENT_PLAYABLE_QUIZ_IDS = Object.keys(QUIZ_REGISTRY).filter((id) => !(QUIZ_REGISTRY[id] as QuizDefinition & { historicalOnly?: boolean }).historicalOnly);

assert(CURRENT_PLAYABLE_QUIZ_IDS.length === 21, `exactly 21 current playable quizzes in QUIZ_REGISTRY (got ${CURRENT_PLAYABLE_QUIZ_IDS.length}: ${CURRENT_PLAYABLE_QUIZ_IDS.join(', ')})`);

const POLE_ID_SET = new Set(ALL_POLE_IDS);

let totalQuestions = 0;
let totalChoices = 0;
let totalChoicesWithAwards = 0;
let totalAwardEntries = 0;
const statusCounts: Record<string, number> = { new: 0, 'unchanged-from-authored-signal': 0, corrected: 0 };

for (const quizId of CURRENT_PLAYABLE_QUIZ_IDS) {
  const definition = QUIZ_REGISTRY[quizId];
  const map = POLE_AWARD_MAPS[quizId];
  if (!map) {
    failures += 1;
    console.error(`FAIL: no pole-award matrix file registered for playable quiz "${quizId}"`);
    continue;
  }

  const isFree = definition.access === 'free';

  for (const question of definition.questions) {
    totalQuestions += 1;
    const questionEntry = map[question.id];
    assert(questionEntry !== undefined, `${quizId}: question "${question.id}" has a matrix entry`);
    if (!questionEntry) continue;

    for (const choice of question.choices) {
      totalChoices += 1;
      const calibration = questionEntry[choice.id];
      assert(calibration !== undefined, `${quizId}/${question.id}: choice "${choice.id}" has a matrix entry`);
      if (!calibration) continue;

      if (calibration.wording !== choice.label) {
        warn(`${quizId}/${question.id}/${choice.id}: matrix wording ("${calibration.wording}") no longer matches the live choice label ("${choice.label}") -- editorial copy may have changed since calibration; re-review this choice`);
      }

      assert(Array.isArray(calibration.awards), `${quizId}/${question.id}/${choice.id}: awards is an array`);
      assert(['new', 'unchanged-from-authored-signal', 'corrected'].includes(calibration.status), `${quizId}/${question.id}/${choice.id}: status is a valid value (got "${calibration.status}")`);
      statusCounts[calibration.status] = (statusCounts[calibration.status] ?? 0) + 1;
      assert(typeof calibration.rationale === 'string' && calibration.rationale.trim().length > 0, `${quizId}/${question.id}/${choice.id}: has a nonempty rationale`);
      assert(!calibration.rationale.includes('—'), `${quizId}/${question.id}/${choice.id}: rationale contains no em dash`);
      assert(calibration.scoringVersion === 'v2.0', `${quizId}/${question.id}/${choice.id}: scoringVersion is "v2.0" (got "${calibration.scoringVersion}")`);

      const seenPoles = new Set<string>();
      for (const award of calibration.awards) {
        totalAwardEntries += 1;
        assert(POLE_ID_SET.has(award.pole), `${quizId}/${question.id}/${choice.id}: "${award.pole}" is a real canonical pole id`);
        assert([1, 2, 3].includes(award.points), `${quizId}/${question.id}/${choice.id}: ${award.pole} points is 1, 2, or 3 (got ${award.points})`);
        assert(!seenPoles.has(award.pole), `${quizId}/${question.id}/${choice.id}: pole "${award.pole}" is not awarded twice on the same choice`);
        seenPoles.add(award.pole);
        if (isFree && poleIsPrivate(award.pole)) {
          failures += 1;
          console.error(`FAIL: ${quizId}/${question.id}/${choice.id}: free quiz awards a PRIVATE pole ("${award.pole}") -- free quizzes may only award Core poles`);
        }
      }
      if (calibration.awards.length > 0) {
        totalChoicesWithAwards += 1;
      }
    }

    // Every matrix choice id must correspond to a real choice -- catches a stale/renamed choice
    // id left behind in the matrix after a content change.
    const realChoiceIds = new Set(question.choices.map((c) => c.id));
    for (const choiceId of Object.keys(questionEntry)) {
      assert(realChoiceIds.has(choiceId), `${quizId}/${question.id}: matrix choice id "${choiceId}" corresponds to a real choice in the live quiz definition`);
    }
  }

  // Every matrix question id must correspond to a real question.
  const realQuestionIds = new Set(definition.questions.map((q) => q.id));
  for (const questionId of Object.keys(map)) {
    assert(realQuestionIds.has(questionId), `${quizId}: matrix question id "${questionId}" corresponds to a real question in the live quiz definition`);
  }
}

// No double counting with the old model's result-level profileSignals / per-choice
// traitSignals: the new calibration tree must never IMPORT OR READ either as code (an
// explanatory comment mentioning why they're deliberately unused is fine and expected -- see
// several of these files' own header comments). Comments are stripped before checking so this
// only flags an actual code reference.
{
  const dir = join(__dirname, '../src/data/quiz-pole-awards');
  const files = readdirSync(dir).filter((f: string) => f.endsWith('.ts'));
  for (const file of files) {
    const source = readFileSync(join(dir, file), 'utf8');
    const codeOnly = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    assert(!/profileSignals|traitSignals/.test(codeOnly), `src/data/quiz-pole-awards/${file} does not reference profileSignals or traitSignals as CODE (no coupling to the old engine's evidence -- cannot double-count)`);
  }
}

console.log(`\nTotals across ${CURRENT_PLAYABLE_QUIZ_IDS.length} current playable quizzes:`);
console.log(`  questions: ${totalQuestions}`);
console.log(`  choices:   ${totalChoices}`);
console.log(`  choices with at least one award: ${totalChoicesWithAwards} (${totalChoices > 0 ? Math.round((totalChoicesWithAwards / totalChoices) * 100) : 0}%)`);
console.log(`  total award entries: ${totalAwardEntries}`);
console.log(`  status breakdown: ${JSON.stringify(statusCounts)}`);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED${warnings > 0 ? `, ${warnings} warning(s)` : ''}.`);
  process.exit(1);
}
if (warnings > 0) {
  console.warn(`\nAll checks passed, but ${warnings} warning(s) were raised (see WARN lines above) -- review before treating the matrix as fully current.`);
}
console.log('\nALL quiz pole-award matrix structural VALIDATION CHECKS PASSED.');
