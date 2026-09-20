import { CRISIS_QUIZ } from './crisis';
import { DATING_QUIZ } from './dating';
import { ERA_QUIZ } from './era';
import { FOOD_ORDER_QUIZ } from './food-order';
import { FRIENDSHIP_QUIZ } from './friendship';
import { GROUP_CHAT_QUIZ } from './group-chat';
import { ICK_QUIZ } from './ick';
import { KEEP_YOU_AROUND_QUIZ } from './keep-you-around';
import { KID_YOU_QUIZ } from './kid-you';
import { ONE_BITE_QUIZ } from './one-bite';
import { PETTY_QUIZ } from './petty';
import { SECRETLY_LOVE_QUIZ } from './secretly-love';
import { SPENDING_QUIZ } from './spending';
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
  // secretly-love: retained, unregistered from the active Private preview surface (see
  // private.tsx), but kept fully registered so historical completions, "See result", and old
  // shared-result links keep resolving exactly as before this quiz replaced it as the OPEN
  // preview. Never destructively removed or overwritten.
  'secretly-love': SECRETLY_LOVE_QUIZ,
  'keep-you-around': KEEP_YOU_AROUND_QUIZ,
};

export const getQuizDefinition = (quizId: string | undefined): QuizDefinition | null =>
  (quizId && QUIZ_REGISTRY[quizId]) || null;
