import type { QuizDefinition, QuizResultBand } from './types';

export type QuizScore = {
  score: number;
  percent: number;
  band: QuizResultBand;
};

// Pure and generic over any QuizDefinition — sums the chosen choice's `score` per question,
// then finds the result band whose [minScore, maxScore] contains the total. Falls back to
// the last band if a quiz's bands don't fully cover its own maxScore (defensive only; the
// registered quizzes are expected to cover their full range).
export const scoreQuiz = (definition: QuizDefinition, answers: Record<string, string>): QuizScore => {
  const score = definition.questions.reduce((total, question) => {
    const chosenId = answers[question.id];
    const choice = question.choices.find((candidate) => candidate.id === chosenId);
    return total + (choice?.score ?? 0);
  }, 0);

  const percent = Math.round((score / definition.maxScore) * 100);
  const band =
    definition.resultBands.find((candidate) => score >= candidate.minScore && score <= candidate.maxScore) ??
    definition.resultBands[definition.resultBands.length - 1];

  return { score, percent, band };
};
