import { BE_SO_SERIOUS_QUIZ } from './be-so-serious';
import { CRISIS_QUIZ } from './crisis';
import { CAREER_HOW_BAD_QUIZ } from './career-how-bad';
import { CAREER_PROVING_QUIZ } from './career-proving';
import { DATING_QUIZ } from './dating';
import { ERA_QUIZ } from './era';
import { FOOD_ORDER_QUIZ } from './food-order';
import { FRIENDSHIP_QUIZ } from './friendship';
import { GOOD_STUFF_TRUST_QUIZ } from './good-stuff-trust';
import { GROUP_CHAT_QUIZ } from './group-chat';
import { HIDDEN_YOU_HIDE_QUIZ } from './hidden-you-hide';
import { HIDDEN_YOU_WRONG_QUIZ } from './hidden-you-wrong';
import { ICK_QUIZ } from './ick';
import { KEEP_YOU_AROUND_QUIZ } from './keep-you-around';
import { LIFE_MATCH_DREAM_LIFE_QUIZ } from './life-match-dream-life';
import { LIFE_MATCH_FREEDOM_QUIZ } from './life-match-freedom';
import { KID_YOU_QUIZ } from './kid-you';
import { LOVE_SOULMATES_BECOME_QUIZ } from './love-soulmates-become';
import { ONE_BITE_QUIZ } from './one-bite';
import { LOVE_READY_QUIZ } from './love-ready';
import { PETTY_QUIZ } from './petty';
import { PRIVATE_PRIVATE_PROOF_QUIZ } from './private-private-proof';
import { PRIVATE_PRIVATE_TROUBLE_QUIZ } from './private-private-trouble';
import { SECRETLY_LOVE_QUIZ } from './secretly-love';
import { SHADOW_SIDE_HYPOCRISY_QUIZ } from './shadow-side-hypocrisy';
import { SPENDING_QUIZ } from './spending';
import { STYLE_VIBE_ATTENTION_QUIZ } from './style-vibe-attention';
import { STYLE_VIBE_INTIMIDATING_QUIZ } from './style-vibe-intimidating';
import type { QuizDefinition } from './types';
import { UNEXPECTED_MONEY_QUIZ } from './unexpected-money';

export type {
  ArchetypeQuizDefinition,
  FreeQuizCategory,
  NumericBandQuizDefinition,
  PrivateQuizCategory,
  QuizAccess,
  QuizArchetype,
  QuizCategory,
  QuizChoice,
  QuizDefinition,
  QuizQuestion,
  QuizResultBand,
  QuizStructuredRead,
} from './types';

// Adding a future quiz is: write src/data/quizzes/<id>.ts conforming to QuizDefinition
// (either scoringType), then add one line here. The runner screen (src/app/quiz/[quizId].tsx)
// needs no changes for either scoring style. Only PLAYABLE definitions belong here — Apparently
// Private's locked teasers (private-catalog.ts) are metadata-only and deliberately never
// registered, since they have no questions/scoring to run.
export const QUIZ_REGISTRY: Record<string, QuizDefinition> = {
  petty: PETTY_QUIZ,
  crisis: CRISIS_QUIZ,
  dating: DATING_QUIZ,
  friendship: FRIENDSHIP_QUIZ,
  'food-order': FOOD_ORDER_QUIZ,
  spending: SPENDING_QUIZ,
  era: ERA_QUIZ,
  ick: ICK_QUIZ,
  'group-chat': GROUP_CHAT_QUIZ,
  'one-bite': ONE_BITE_QUIZ,
  'unexpected-money': UNEXPECTED_MONEY_QUIZ,
  'kid-you': KID_YOU_QUIZ,
  // secretly-love: revived as an active free Private preview (Build 22 owner audit,
  // 2026-11-02) — historicalOnly removed, content rewritten per the approved source pack.
  'secretly-love': SECRETLY_LOVE_QUIZ,
  'keep-you-around': KEEP_YOU_AROUND_QUIZ,
  'be-so-serious': BE_SO_SERIOUS_QUIZ,
  'private-private-trouble': PRIVATE_PRIVATE_TROUBLE_QUIZ,
  'private-private-proof': PRIVATE_PRIVATE_PROOF_QUIZ,
  'life-match-dream-life': LIFE_MATCH_DREAM_LIFE_QUIZ,
  'life-match-freedom': LIFE_MATCH_FREEDOM_QUIZ,
  'style-vibe-intimidating': STYLE_VIBE_INTIMIDATING_QUIZ,
  'style-vibe-attention': STYLE_VIBE_ATTENTION_QUIZ,
  'hidden-you-wrong': HIDDEN_YOU_WRONG_QUIZ,
  'hidden-you-hide': HIDDEN_YOU_HIDE_QUIZ,
  'career-ambition-how-bad': CAREER_HOW_BAD_QUIZ,
  'career-ambition-proving': CAREER_PROVING_QUIZ,
  'love-soulmates-ready': LOVE_READY_QUIZ,
  'love-soulmates-become': LOVE_SOULMATES_BECOME_QUIZ,
  'shadow-side-hypocrisy': SHADOW_SIDE_HYPOCRISY_QUIZ,
  'good-stuff-trust': GOOD_STUFF_TRUST_QUIZ,
};

export const getQuizDefinition = (quizId: string | undefined): QuizDefinition | null =>
  (quizId && QUIZ_REGISTRY[quizId]) || null;
