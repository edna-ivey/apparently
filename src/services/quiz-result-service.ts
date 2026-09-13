import { getCurrentUserId } from './auth-service';
import type { QuizResultRow } from './types';
import { supabase } from '@/lib/supabase';
import type { QuizResultRecord } from '@/data/quizzes/results';

// Thin Supabase-facing layer over the append-only `quiz_results` table. Deliberately reuses
// the EXISTING QuizResultRecord shape from src/data/quizzes/results.ts rather than inventing
// a parallel one — this module persists a result a screen has already computed via the
// existing quiz engine (src/data/quizzes/scoring.ts); it does not score anything itself.
// NOT wired into the quiz runner yet — src/app/quiz/[quizId].tsx still saves exclusively to
// local history this sprint (see saveQuizResult in results.ts).

export const saveQuizResultRemote = async (record: QuizResultRecord): Promise<boolean> => {
  if (!supabase) {
    return false;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  const { error } = await supabase.from('quiz_results').insert({
    user_id: userId,
    quiz_id: record.quizId,
    completed_at: record.completedAt,
    score: record.score,
    percent: record.percent,
    result_id: record.resultId,
    result_title: record.resultTitle,
    traits: record.traits,
    mix: record.mix ?? null,
  });

  if (error) {
    console.warn('[quiz-result-service] saveQuizResultRemote failed:', error.message);
    return false;
  }
  return true;
};

// Full history, oldest first (matching the local store's own append order) — retakes are
// separate rows, never overwritten; there is no UNIQUE(user_id, quiz_id) constraint.
export const getQuizResultsRemote = async (): Promise<QuizResultRow[]> => {
  if (!supabase) {
    return [];
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });

  if (error) {
    console.warn('[quiz-result-service] getQuizResultsRemote failed:', error.message);
    return [];
  }
  return data ?? [];
};
