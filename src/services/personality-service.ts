import { getCurrentUserId } from './auth-service';
import { getQuizResultsRemote, type GetQuizResultsResult } from './quiz-result-service';
import { getQuizDefinition } from '@/data/quizzes';
import type { PersonalityAnswerEvidence, PersonalityDimensionId, PersonalityEffect } from '@/data/personality';
import { supabase } from '@/lib/supabase';
import { reportBackendFailure } from '@/services/observability';
import type { PersonalityEvidenceRow } from '@/services/types';

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
    // This is the ONE read every identity surface (Your Signature, Undercurrent, Creature,
    // Relic) ultimately depends on -- a failure here means the user's own already-earned
    // identity can't be shown at all, not just a minor UI gap.
    reportBackendFailure({ operation: 'get_my_personality_evidence', errorCode: error.code, recoverable: true }, error);
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
//
// sourceType/sourceId (Build 8 Pass 3.1 / 3.2): every row sharing one source_id was written by
// the same insert (either the Daily-answer trigger or submit_quiz_result, never both), so it
// always carries the same source_type — reading it once per group, straight from the real row,
// is exactly as safe as reading question_snapshot/category once per group already was. The
// group's own Map key already IS the real source_id (grouping was always keyed on it).
//
// occurredAt (Bible v1.4 qualification-foundation reconciliation pass): also carries the
// group's earliest real row.created_at through as PersonalityAnswerEvidence.occurredAt, so
// personality.ts's active-board opposite-pole timestamp tie-break (§15A) resolves against the
// ACTUAL moment this evidence was recorded rather than "now" (its previous, fabricated
// behavior). Rows sharing one source_id come from one insert and should carry near-identical
// created_at values already; taking the minimum is a defensive, deterministic choice, never a
// guess.
export const groupEvidenceIntoAnswers = (rows: PersonalityEvidenceRow[]): PersonalityAnswerEvidence[] => {
  const bySource = new Map<
    string,
    {
      question: string;
      category: string;
      chosenAnswer: string;
      effects: PersonalityEffect[];
      sourceType: PersonalityEvidenceRow['source_type'];
      sourceId: string;
      occurredAt: string;
    }
  >();

  for (const row of rows) {
    const entry = bySource.get(row.source_id) ?? {
      question: row.question_snapshot,
      category: row.category,
      chosenAnswer: row.answer_snapshot,
      effects: [],
      sourceType: row.source_type,
      sourceId: row.source_id,
      occurredAt: row.created_at,
    };
    entry.effects.push({ dimension: row.dimension as PersonalityDimensionId, value: row.effect });
    if (new Date(row.created_at).getTime() < new Date(entry.occurredAt).getTime()) {
      entry.occurredAt = row.created_at;
    }
    bySource.set(row.source_id, entry);
  }

  return Array.from(bySource.values());
};

// The current user's own quiz_results, oldest first — RLS-scoped, never another user's rows.
// A thin re-export of quiz-result-service.ts's reader kept here too so every You-profile
// input (Daily evidence AND quiz history) is reachable from this one service module. Returns
// ok:false on a genuine fetch failure — the caller (You) must treat that the same as a
// personality-evidence load failure (the existing retryable error state), never as "zero
// quizzes completed."
//
// NOTE: no longer used to derive ProfileActivityCounts (see get_my_active_daily_answer_count/
// get_my_active_quiz_completions below) -- kept exported because v1Profile's own dimension
// scoring (Creature identity derivation, unrelated to this migration's scope) still reads
// full personality_evidence, and some callers still display real quiz_results history
// directly. Build 22 owner audit (2026-10-30), item 5: the You-page/creature-read activity-
// count read path specifically no longer calls this.
export const getMyQuizResults = getQuizResultsRemote;
export type { GetQuizResultsResult };

export type GetActiveDailyAnswerCountResult = { ok: true; data: number } | { ok: false; message: string };

// Build 22 owner audit (2026-10-30), item 5: authoritative, active-windowed replacement for
// counting source_type='daily_answer' rows in the legacy personality_evidence table. See
// get_my_active_daily_answer_count() in supabase/migrations/20261030030000_active_profile_
// activity_counts.sql for the full rationale (ROOM_ONLY exclusion via daily_mode = 'profile',
// matching the existing, unchanged eligibility rule; 12-month active window per the Bible's
// locked 12-MONTH ACTIVE EVIDENCE WINDOW section).
export const getMyActiveDailyAnswerCount = async (): Promise<GetActiveDailyAnswerCountResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('get_my_active_daily_answer_count');
  if (error) {
    console.warn('[personality-service] getMyActiveDailyAnswerCount failed:', error.message);
    reportBackendFailure({ operation: 'get_my_active_daily_answer_count', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: typeof data === 'number' ? data : 0 };
};

export type ActiveQuizCompletion = { quizKey: string; questionCount: number };
export type GetActiveQuizCompletionsResult = { ok: true; data: ActiveQuizCompletion[] } | { ok: false; message: string };

// Build 22 owner audit (2026-10-30), item 5: one row per quiz actively completed (first
// completion within the trailing 12 months) -- never a row per retake, never the user's full
// quiz_results history. Replaces client-side reconstruction of "first completion per quiz_id"
// from the full history with a direct read of the same atomic, retake-proof gate
// (user_quiz_completions) submit_quiz_completion itself relies on.
export const getMyActiveQuizCompletions = async (): Promise<GetActiveQuizCompletionsResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('get_my_active_quiz_completions');
  if (error) {
    console.warn('[personality-service] getMyActiveQuizCompletions failed:', error.message);
    reportBackendFailure({ operation: 'get_my_active_quiz_completions', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }
  const rows = (data ?? []) as { quiz_key: string; question_count: number | null }[];
  return { ok: true, data: rows.map((row) => ({ quizKey: row.quiz_key, questionCount: row.question_count ?? 0 })) };
};

export type ProfileActivityCounts = {
  // Real, ACTIVE (trailing 12 months) Daily answers -- see getMyActiveDailyAnswerCount.
  dailyAnswerCount: number;
  // DISTINCT quizzes with an ACTIVE (first-completed within 12 months) completion. A retake
  // never increases this, and never renews an already-inactive quiz back into the window
  // (user_quiz_completions.completed_at is immutable once set).
  quizCompletionCount: number;
  // dailyAnswerCount + quizCompletionCount — "how many things have you done," not "how many
  // answers went in." Drives the zero/First Signals/We're Noticing/Your Patterns staging.
  profileActivityCount: number;
  // dailyAnswerCount + the question_count of each ACTIVE quiz completion (a retake's
  // question_count is never added again, and an aged-out completion is already absent from
  // activeQuizCompletions entirely). Drives Your 7 — "N answers shaping your read."
  profileAnswerCount: number;
};

// Pure — no network, no side effects. Takes the two already-active-windowed, already-lean
// inputs (see getMyActiveDailyAnswerCount/getMyActiveQuizCompletions above) and derives every
// count the You/creature-read screens need.
export const computeProfileActivityCounts = (
  activeDailyAnswerCount: number,
  activeQuizCompletions: ActiveQuizCompletion[],
): ProfileActivityCounts => {
  const quizCompletionCount = activeQuizCompletions.length;
  // A quiz whose result→profile mapping isn't approved yet (QuizDefinition.contributesToProfile
  // === false, e.g. keep-you-around) still counts toward quizCompletionCount above — it WAS
  // completed — but its question_count is excluded here so it can never inflate
  // profileAnswerCount/Your7 ("answers shaping your read") before that mapping is approved.
  // Reads the CURRENT quiz definition (not anything snapshotted at completion time), so the
  // moment a mapping is approved and this flag is removed, past completions start counting
  // immediately with no backfill needed. A quiz_key with no current definition (e.g. removed
  // content) is treated as contributing, matching this function's existing behavior before
  // this flag existed.
  const quizAnswerCount = activeQuizCompletions.reduce((sum, completion) => {
    const contributes = getQuizDefinition(completion.quizKey)?.contributesToProfile !== false;
    return contributes ? sum + completion.questionCount : sum;
  }, 0);

  return {
    dailyAnswerCount: activeDailyAnswerCount,
    quizCompletionCount,
    profileActivityCount: activeDailyAnswerCount + quizCompletionCount,
    profileAnswerCount: activeDailyAnswerCount + quizAnswerCount,
  };
};

// --- Commonality (Build 9) ----------------------------------------------------------------
//
// Real aggregate Commonality (Bible v1.4 §25) -- see get_my_commonality() in
// supabase/migrations/20261002020000_add_commonality_rpc.sql for the full real calculation
// (Public-room Daily answers only, >= 10-respondent per-question eligibility, >= 10-eligible-
// answer user-level threshold before any aggregate number is shown). This is the first real
// implementation; nothing before this displayed anything but hardcoded demo literals.

export type MyCommonalityRow = {
  eligible_answer_count: number;
  average_percent: number | null;
  rare_pick_count: number;
};

export type GetMyCommonalityResult = { ok: true; data: MyCommonalityRow } | { ok: false; message: string };

export const getMyCommonality = async (): Promise<GetMyCommonalityResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('get_my_commonality');
  if (error) {
    console.warn('[personality-service] getMyCommonality failed:', error.message);
    return { ok: false, message: error.message };
  }
  const row = (Array.isArray(data) ? data[0] : data) as MyCommonalityRow | undefined;
  if (!row) {
    return { ok: false, message: 'get_my_commonality returned no row.' };
  }
  return { ok: true, data: row };
};
