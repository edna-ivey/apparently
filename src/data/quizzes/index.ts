import { CRISIS_QUIZ } from './crisis';
import { PETTY_QUIZ } from './petty';
import type { QuizDefinition } from './types';

export type { ArchetypeQuizDefinition, NumericBandQuizDefinition, QuizArchetype, QuizChoice, QuizDefinition, QuizQuestion, QuizResultBand } from './types';

// Adding a future quiz is: write src/data/quizzes/<id>.ts conforming to QuizDefinition
// (either scoringType), then add one line here. The runner screen (src/app/quiz/[quizId].tsx)
// needs no changes for either scoring style.
export const QUIZ_REGISTRY: Record<string, QuizDefinition> = {
  petty: PETTY_QUIZ,
  crisis: CRISIS_QUIZ,
};

export const getQuizDefinition = (quizId: string | undefined): QuizDefinition | null =>
  (quizId && QUIZ_REGISTRY[quizId]) || null;
