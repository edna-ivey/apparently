import { getCurrentUserId } from './auth-service';
import { getQuizResultsRemote, type GetQuizResultsResult } from './quiz-result-service';
import type { PersonalityAnswerEvidence, PersonalityDimensionId, PersonalityEffect } from '@/data/personality';
import { supabase } from '@/lib/supabase';
import type { PersonalityEvidenceRow, QuizResultRow } from '@/services/types';

// Real remote personality evidence for the CURRENT signed-in consumer only. Uses the
// consumer Supabase client exclusively (never src/lib/admin-supabase.ts, never
// service_role) — personality_evidence's own RLS policy (`personality_evidence_select_own`,
// (select auth.uid()) = user_id) is what actually restricts this to the caller's own rows;
// the explicit .eq('user_id', ...) below is defense-in-depth, matching this codebase's
// existing pattern elsewhere (e.g. daily-service.ts), not the real security boundary.

export type GetPersonalityEvidenceResult =
  | { ok: true; data: PersonalityEvidenceRow[] }
  | { ok: false; message: string };

export const getMyPersonalityEvidence = async (): Promise<GetPersonalityEvidenceResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase
    .from('personality_evidence')
    .select('id, user_id, source_type, source_id, question_snapshot, answer_snapshot, category, dimension, effect, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[personality-service] getMyPersonalityEvidence failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: (data ?? []) as PersonalityEvidenceRow[] };
};

// personality_evidence stores ONE ROW PER EFFECT, not one row per answer — a single Daily
// answer with two personality effects produces two rows sharing the same source_id. This
// groups them back into the shape scorePersonalityProfile() already expects (one entry per
// originating answer). Real signed effect values are carried through completely unchanged;
// this function computes nothing and invents nothing — scoring itself still happens entirely
// inside the existing scorePersonalityProfile().
export const groupEvidenceIntoAnswers = (rows: PersonalityEvidenceRow[]): PersonalityAnswerEvidence[] => {
  const bySource = new Map<string, { question: string; category: string; chosenAnswer: string; effects: PersonalityEffect[] }>();

  for (const row of rows) {
    const entry = bySource.get(row.source_id) ?? {
      question: row.question_snapshot,
      category: row.category,
      chosenAnswer: row.answer_snapshot,
      effects: [],
    };
    entry.effects.push({ dimension: row.dimension as PersonalityDimensionId, value: row.effect });
    bySource.set(row.source_id, entry);
  }

  return Array.from(bySource.values());
};

// The real Daily-answer count behind a profile. Deliberately NOT rows.length or any count
// derived from personality_evidence row volume — one Daily answer can legally produce
// multiple evidence rows (one per personality effect on the chosen option), which would
// silently inflate this number. Counts unique source_id values scoped to source_type ===
// 'daily_answer' specifically, so a future evidence source (e.g. quiz_result, already
// accepted by the schema for forward compatibility) can never silently inflate this count.
export const countRealDailyAnswers = (rows: PersonalityEvidenceRow[]): number => {
  const sourceIds = new Set(rows.filter((row) => row.source_type === 'daily_answer').map((row) => row.source_id));
  return sourceIds.size;
};

// The current user's own quiz_results, oldest first — RLS-scoped, never another user's rows.
// A thin re-export of quiz-result-service.ts's reader kept here too so every You-profile
// input (Daily evidence AND quiz history) is reachable from this one service module. Returns
// ok:false on a genuine fetch failure — the caller (You) must treat that the same as a
// personality-evidence load failure (the existing retryable error state), never as "zero
// quizzes completed."
export const getMyQuizResults = getQuizResultsRemote;
export type { GetQuizResultsResult };

export type ProfileActivityCounts = {
  // Real Daily answers — same definition countRealDailyAnswers already uses.
  dailyAnswerCount: number;
  // DISTINCT quiz_ids with at least one completed remote result. A retake (a second row for
  // a quiz_id already completed) never increases this — it is a count of quizzes, not rows.
  quizCompletionCount: number;
  // dailyAnswerCount + quizCompletionCount — "how many things have you done," not "how many
  // answers went in." Drives the zero/First Signals/We're Noticing/Your Patterns staging.
  profileActivityCount: number;
  // dailyAnswerCount + the question_count of each quiz_id's FIRST completion only (a retake's
  // question_count is never added again). Drives Your 7 — "N answers shaping your read."
  profileAnswerCount: number;
};

// Pure — no network, no side effects. Takes exactly the two real inputs a You profile is
// built from (the user's own personality_evidence rows and their own quiz_results rows) and
// derives every count the You screen needs. quiz_results.question_count can be null for a
// row that predates that column, or malformed data — treated as 0 rather than throwing, so
// one bad row can never crash the whole profile.
export const computeProfileActivityCounts = (
  evidenceRows: PersonalityEvidenceRow[],
  quizResults: QuizResultRow[],
): ProfileActivityCounts => {
  const dailyAnswerCount = countRealDailyAnswers(evidenceRows);

  const firstCompletionByQuizId = new Map<string, QuizResultRow>();
  for (const row of quizResults) {
    const existing = firstCompletionByQuizId.get(row.quiz_id);
    if (!existing || new Date(row.completed_at).getTime() < new Date(existing.completed_at).getTime()) {
      firstCompletionByQuizId.set(row.quiz_id, row);
    }
  }

  const quizCompletionCount = firstCompletionByQuizId.size;
  const quizAnswerCount = Array.from(firstCompletionByQuizId.values()).reduce(
    (sum, row) => sum + (row.question_count ?? 0),
    0,
  );

  return {
    dailyAnswerCount,
    quizCompletionCount,
    profileActivityCount: dailyAnswerCount + quizCompletionCount,
    profileAnswerCount: dailyAnswerCount + quizAnswerCount,
  };
};
