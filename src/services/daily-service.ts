import { getCurrentUserId } from './auth-service';
import type { DailyAnswerRow, DailyDistributionRow, DailyOptionRow, DailyQuestionRow } from './types';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over daily_questions/daily_options/daily_answers and the
// get_daily_distribution RPC. NOT wired into src/app/(tabs)/index.tsx yet — Today still runs
// entirely on local prototype data/percentages this sprint (src/data/daily-questions.ts,
// src/data/daily-answer.ts). These functions exist for Sprint 1B's wiring pass.

export type LiveDailyQuestion = {
  question: DailyQuestionRow;
  options: DailyOptionRow[];
};

export const getLiveDailyQuestion = async (): Promise<LiveDailyQuestion | null> => {
  if (!supabase) {
    return null;
  }

  const { data: question, error: questionError } = await supabase
    .from('daily_questions')
    .select('*')
    .eq('status', 'Live')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (questionError) {
    console.warn('[daily-service] getLiveDailyQuestion failed:', questionError.message);
    return null;
  }
  if (!question) {
    return null;
  }

  const { data: options, error: optionsError } = await supabase
    .from('daily_options')
    .select('*')
    .eq('question_id', question.id)
    .order('position', { ascending: true });

  if (optionsError) {
    console.warn('[daily-service] fetching options for live question failed:', optionsError.message);
    return null;
  }

  return { question, options: options ?? [] };
};

export const getDailyAnswer = async (questionId: string): Promise<DailyAnswerRow | null> => {
  if (!supabase) {
    return null;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('daily_answers')
    .select('*')
    .eq('question_id', questionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[daily-service] getDailyAnswer failed:', error.message);
    return null;
  }
  return data;
};

export type CommitDailyAnswerResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'no_session' | 'insert_failed'; message?: string };

// Server-side immutability lives in the migration (UNIQUE(user_id, question_id), no
// UPDATE/DELETE policy) — this function does not re-implement that guarantee, it just
// surfaces whatever the database decides. A unique-violation error here means "this user
// already committed an answer for this question," not a bug.
export const commitDailyAnswerRemote = async (questionId: string, optionId: string): Promise<CommitDailyAnswerResult> => {
  if (!supabase) {
    return { ok: false, reason: 'not_configured' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, reason: 'no_session' };
  }

  const { error } = await supabase
    .from('daily_answers')
    .insert({ user_id: userId, question_id: questionId, option_id: optionId });

  if (error) {
    console.warn('[daily-service] commitDailyAnswerRemote failed:', error.message);
    return { ok: false, reason: 'insert_failed', message: error.message };
  }
  return { ok: true };
};

// Real per-option percentages, derived only from actual daily_answers rows via the
// SECURITY DEFINER RPC — never fabricated, never read from raw other-user answer rows on
// the client. Always resolves all four options, even ones with zero answers.
export const getDailyDistribution = async (questionId: string): Promise<DailyDistributionRow[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_daily_distribution', { p_question_id: questionId });
  if (error) {
    console.warn('[daily-service] getDailyDistribution failed:', error.message);
    return [];
  }
  return data ?? [];
};
