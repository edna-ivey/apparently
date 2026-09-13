import { CRISIS_QUIZ } from './crisis';
import { DATING_QUIZ } from './dating';
import { ERA_QUIZ } from './era';
import { FOOD_ORDER_QUIZ } from './food-order';
import { FRIENDSHIP_QUIZ } from './friendship';
import { PETTY_QUIZ } from './petty';
import { SPENDING_QUIZ } from './spending';
import type { QuizDefinition } from './types';

export type {
  ArchetypeQuizDefinition,
  NumericBandQuizDefinition,
  QuizArchetype,
  QuizCategory,
  QuizChoice,
  QuizDefinition,
  QuizQuestion,
  QuizResultBand,
} from './types';

// Adding a future quiz is: write src/data/quizzes/<id>.ts conforming to QuizDefinition
// (either scoringType), then add one line here. The runner screen (src/app/quiz/[quizId].tsx)
// needs no changes for either scoring style.
export const QUIZ_REGISTRY: Record<string, QuizDefinition> = {
  petty: PETTY_QUIZ,
  crisis: CRISIS_QUIZ,
  dating: DATING_QUIZ,
  friendship: FRIENDSHIP_QUIZ,
  'food-order': FOOD_ORDER_QUIZ,
  spending: SPENDING_QUIZ,
  era: ERA_QUIZ,
};

export const getQuizDefinition = (quizId: string | undefined): QuizDefinition | null =>
  (quizId && QUIZ_REGISTRY[quizId]) || null;
