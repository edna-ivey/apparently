import { getCurrentUserId } from './auth-service';
import type { QuizResultRow } from './types';
import { supabase } from '@/lib/supabase';
import { reportBackendFailure } from '@/services/observability';

// Thin Supabase-facing layer over the append-only `quiz_results` table and the
// submit_quiz_completion RPC. Persists a result a screen has already computed via the
// existing quiz engine (src/data/quizzes/scoring.ts) — this module does not score anything
// itself, and never writes personality_evidence directly (only the RPC's trusted server-side
// logic does that, and only on a quiz's first completion).
//
// Build 22 final cleanup (owner-authorized clean V1 reset, 2026-11-02): the legacy
// submitQuizResultRemote/submit_quiz_result client path (and the profileSignals/
// applyPermanentQuizAwards evidence computation that fed it) is retired. It existed only to
// (a) resync pre-V2 local-only quiz history with no recoverable per-question answers
// (legacy-quiz-backfill-service.ts, now deleted) and (b) replay an already-queued pre-cutover
// payload (pending-quiz-submissions.ts now discards such a payload outright). The owner's
// clean V1 reset explicitly voids both purposes — "We do NOT need to preserve obsolete beta
// quiz scores... old TestFlight clients must fail safely instead of allowing them to write
// incompatible scoring data after cutover." submit_quiz_completion (below) is now the ONLY
// authoritative personality-evidence write path, for every quiz, with no exception. The
// legacy submit_quiz_result RPC itself still exists server-side for defense-in-depth (see
// the Build 22 final cleanup migration that stops it from writing personality_evidence at
// all, regardless of caller), but nothing in this client calls it any more.
export type SubmitQuizCompletionPayload = {
  quizKey: string;
  quizTitle: string;
  quizCategory: string;
  completedAt: string;
  questionCount: number;
  score: number;
  percent: number;
  resultId: string;
  resultTitle: string;
  traits: string[];
  mix?: Record<string, number>;
  // Every question_key -> choice_key this quiz has, per the real catalog -- submit_quiz_
  // completion rejects (writes nothing) if this isn't EXACTLY the quiz's full question set.
  answers: Record<string, string>;
};

export type SubmitQuizCompletionResult =
  | { ok: true; quizResultId: string; isFirstCompletion: boolean; wasRetry: boolean }
  | { ok: false; message: string };

// Postgres SQLSTATE for a SERIALIZABLE isolation conflict ("could not serialize access due to
// concurrent update" etc). The clean V1 reset's backup+delete+recalculation runs as a single
// SERIALIZABLE transaction specifically so Postgres itself detects and aborts any real
// completion that would otherwise interleave with it -- but an abort alone would surface to the
// submitting user as a bare failure with no automatic recovery. Deployment-safety review
// (2026-11-03), item 3: "account for concurrent submissions during the cutover rather than
// relying solely on transaction isolation." The reset is a sub-second, one-time, explicitly
// scheduled operation, so a single immediate retry is sufficient -- by the time it re-runs, the
// reset transaction has already committed or rolled back.
const SERIALIZATION_FAILURE_SQLSTATE = '40001';

export const submitQuizCompletion = async (payload: SubmitQuizCompletionPayload): Promise<SubmitQuizCompletionResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const rpcArgs = {
    p_quiz_key: payload.quizKey,
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
    p_answers: payload.answers,
  };

  let { data, error } = await supabase.rpc('submit_quiz_completion', rpcArgs);

  if (error && error.code === SERIALIZATION_FAILURE_SQLSTATE) {
    ({ data, error } = await supabase.rpc('submit_quiz_completion', rpcArgs));
  }

  if (error) {
    console.warn('[quiz-result-service] submitQuizCompletion failed:', error.message);
    reportBackendFailure({ operation: 'submit_quiz_completion', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { ok: false, message: 'submit_quiz_completion returned no row.' };
  }

  return {
    ok: true,
    quizResultId: row.quiz_result_id,
    isFirstCompletion: row.is_first_completion,
    wasRetry: row.was_retry,
  };
};

export type GetQuizResultsResult = { ok: true; data: QuizResultRow[] } | { ok: false; message: string };

// Full history, oldest first (matching the local store's own append order) — retakes are
// separate rows, never overwritten. Used by personality-service.ts to compute
// quizCompletionCount/profileAnswerCount from the user's own real completions.
//
// Returns an explicit ok:false on a genuine fetch failure — NEVER collapses that into
// ok:true, data:[]. A network/DB failure here is indistinguishable from "zero quizzes
// completed" if it's silently swallowed into an empty array, which would make You briefly
// (and wrongly) show a lower quizCompletionCount/profileAnswerCount/Your-7 progress than the
// user's real, already-earned personality evidence reflects. The caller (personality-service.ts)
// requires this AND the personality-evidence read to both succeed before treating a remote
// You profile as loaded.
export const getQuizResultsRemote = async (): Promise<GetQuizResultsResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });

  if (error) {
    console.warn('[quiz-result-service] getQuizResultsRemote failed:', error.message);
    reportBackendFailure({ operation: 'get_my_quiz_results', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: data ?? [] };
};
