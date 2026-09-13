import { getCurrentUserId } from './auth-service';
import type { DailyAnswerRow, DailyDistributionRow, DailyOptionRow, DailyQuestionRow } from './types';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over daily_questions/daily_options/daily_answers and the
// get_daily_distribution RPC. Consumed by src/data/consumer-daily.ts (Sprint 1B-A), which is
// the only place Today's remote flow is wired up — this file stays a plain data-access layer,
// no consumer-facing branching/fallback decisions live here.

export type LiveDailyQuestion = {
  question: DailyQuestionRow;
  options: DailyOptionRow[];
};

// Result types below distinguish a genuine error (network/DB failure — the caller should
// show a retry state) from a successful call that legitimately found nothing (no Live
// question; this user hasn't answered yet) — the caller needs those to be different UI
// states, so this layer can't collapse them both into a bare `null` the way earlier,
// not-yet-wired versions of this file did.

export type GetLiveDailyQuestionResult = { ok: true; data: LiveDailyQuestion | null } | { ok: false; message: string };

export const getLiveDailyQuestion = async (): Promise<GetLiveDailyQuestionResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
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
    return { ok: false, message: questionError.message };
  }
  if (!question) {
    return { ok: true, data: null };
  }

  const { data: options, error: optionsError } = await supabase
    .from('daily_options')
    .select('*')
    .eq('question_id', question.id)
    .order('position', { ascending: true });

  if (optionsError) {
    console.warn('[daily-service] fetching options for live question failed:', optionsError.message);
    return { ok: false, message: optionsError.message };
  }

  return { ok: true, data: { question, options: options ?? [] } };
};

export type GetDailyAnswerResult = { ok: true; data: DailyAnswerRow | null } | { ok: false; message: string };

export const getDailyAnswer = async (questionId: string): Promise<GetDailyAnswerResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase
    .from('daily_answers')
    .select('*')
    .eq('question_id', questionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[daily-service] getDailyAnswer failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, data };
};

export type CommitDailyAnswerResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'no_session' | 'insert_failed'; message?: string; code?: string };

// Server-side immutability lives in the migration (UNIQUE(user_id, question_id), no
// UPDATE/DELETE policy) — this function does not re-implement that guarantee, it just
// surfaces whatever the database decides. A unique-violation (Postgres SQLSTATE 23505) here
// means "this user already committed an answer for this question" — not a bug, and not the
// same as a real failure. `code` is passed through so a caller (consumer-daily.ts) can tell
// the two apart and RECONCILE to the server's existing row instead of showing a generic
// failure — see its handling for the full behavior.
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
    return { ok: false, reason: 'insert_failed', message: error.message, code: error.code };
  }
  return { ok: true };
};

// Real per-option percentages, derived only from actual daily_answers rows via the
// SECURITY DEFINER RPC — never fabricated, never read from raw other-user answer rows on
// the client. A successful call resolves all four options, even ones with zero answers.
//
// `ok: true, data: []` (a genuinely empty result — e.g. the server-side answer-first gate
// isn't satisfied yet) is intentionally distinct from `ok: false` (a real network/RPC
// failure). Collapsing both into `[]` is exactly what let a request failure look
// indistinguishable from "everyone has 0%" to a caller — see consumer-daily.ts's
// DistributionState, which is why this distinction exists.
export type GetDailyDistributionResult = { ok: true; data: DailyDistributionRow[] } | { ok: false; message: string };

export const getDailyDistribution = async (questionId: string): Promise<GetDailyDistributionResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.rpc('get_daily_distribution', { p_question_id: questionId });
  if (error) {
    console.warn('[daily-service] getDailyDistribution failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: data ?? [] };
};
