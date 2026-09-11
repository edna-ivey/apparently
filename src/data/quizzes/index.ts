import { PETTY_QUIZ } from './petty';
import type { QuizDefinition } from './types';

export type { QuizChoice, QuizDefinition, QuizQuestion, QuizResultBand } from './types';

// Adding a future quiz is: write src/data/quizzes/<id>.ts conforming to QuizDefinition, then
// add one line here. The runner screen (src/app/quiz/[quizId].tsx) needs no changes.
export const QUIZ_REGISTRY: Record<string, QuizDefinition> = {
  petty: PETTY_QUIZ,
};

export const getQuizDefinition = (quizId: string | undefined): QuizDefinition | null =>
  (quizId && QUIZ_REGISTRY[quizId]) || null;
