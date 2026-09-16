import { getCurrentUserId } from './auth-service';
import type { QuizResultRow } from './types';
import { supabase } from '@/lib/supabase';
import type { PersonalityEffect } from '@/data/personality';

// Thin Supabase-facing layer over the append-only `quiz_results` table and the
// submit_quiz_result RPC. Persists a result a screen has already computed via the existing
// quiz engine (src/data/quizzes/scoring.ts) — this module does not score anything itself, and
// never writes personality_evidence directly (only the RPC's trusted server-side logic does
// that, and only on a quiz's first completion — see supabase/migrations/20260916040000_quiz_builds_you.sql).

export type SubmitQuizResultPayload = {
  quizId: string;
  quizTitle: string;
  quizCategory: string;
  // ISO timestamp — the SAME value the caller already used for the local QuizResultRecord.
  // Two submissions with the same (quizId, completedAt) are treated server-side as one
  // logical completion (a network retry), never a duplicate.
  completedAt: string;
  questionCount: number;
  score: number;
  percent: number;
  resultId: string;
  resultTitle: string;
  traits: string[];
  mix?: Record<string, number>;
  // Result-level canonical signals, only ever present on a fresh completion (ResultDisplay.profileSignals
  // — reconstructResultDisplay for ?view=result never sets this). Server-validated: max 3, a
  // known dimension, value in {-2,-1,1,2}, no duplicate dimension — this layer does not
  // re-validate, the RPC is the actual authority.
  profileSignals?: PersonalityEffect[];
};

export type SubmitQuizResultResult =
  | { ok: true; quizResultId: string; isFirstProfileCompletion: boolean; wasRetry: boolean }
  | { ok: false; message: string };

export const submitQuizResultRemote = async (payload: SubmitQuizResultPayload): Promise<SubmitQuizResultResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase.rpc('submit_quiz_result', {
    p_quiz_id: payload.quizId,
    p_quiz_title: payload.quizTitle,
    p_quiz_category: payload.quizCategory,
    p_completed_at: payload.completedAt,
    p_question_count: payload.questionCount,
    p_score: payload.score,
    p_percent: payload.percent,
    p_result_id: payload.resultId,
    p_result_title: payload.resultTitle,
    p_traits: payload.traits,
    p_mix: payload.mix ?? null,
    p_profile_effects: payload.profileSignals ?? null,
  });

  if (error) {
    console.warn('[quiz-result-service] submitQuizResultRemote failed:', error.message);
    return { ok: false, message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, message: 'submit_quiz_result returned no row.' };
  }

  return {
    ok: true,
    quizResultId: row.quiz_result_id,
    isFirstProfileCompletion: row.is_first_profile_completion,
    wasRetry: row.was_retry,
  };
};

// Full history, oldest first (matching the local store's own append order) — retakes are
// separate rows, never overwritten. Used by personality-service.ts to compute
// quizCompletionCount/profileAnswerCount from the user's own real completions.
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
