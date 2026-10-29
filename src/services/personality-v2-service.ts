import { getCurrentUserId } from './auth-service';
import { supabase } from '@/lib/supabase';
import { reportBackendFailure } from '@/services/observability';
import type { PersonalityPoleEvidenceRow } from '@/services/types';
import type { PersonalityPoleId } from '@/data/personality-v2/pole-ids';
import type { PoleEvidenceRow } from '@/data/personality-v2/scoring-engine';

// Build 16: real I/O for Scoring V2 -- the fetch half of "profile reconstruction" (the pure
// ranking math already existed in scoring-engine.ts; this is what makes it reconstructible
// from a real user's real persisted evidence, same as getMyPersonalityEvidence does for the
// old engine). Mirrors personality-service.ts's own getMyPersonalityEvidence exactly: real
// consumer client only, explicit .eq('user_id', ...) as defense-in-depth alongside the real
// RLS boundary (personality_pole_evidence_select_own).

export type GetPersonalityPoleEvidenceResult =
  | { ok: true; data: PersonalityPoleEvidenceRow[] }
  | { ok: false; message: string };

export const getMyPersonalityPoleEvidence = async (): Promise<GetPersonalityPoleEvidenceResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase
    .from('personality_pole_evidence')
    .select('id, user_id, source_type, source_id, question_stable_id, choice_stable_id, pole_id, points_earned, max_available, scoring_version, created_at')
    .eq('user_id', userId);

  if (error) {
    console.warn('[personality-v2-service] getMyPersonalityPoleEvidence failed:', error.message);
    reportBackendFailure({ operation: 'get_my_personality_pole_evidence', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: (data ?? []) as PersonalityPoleEvidenceRow[] };
};

// Converts raw DB rows into the engine's own PoleEvidenceRow shape (scoring-engine.ts) --
// purely a field-rename/reshape, no computation. rankPoles() and friends are the only thing
// that ever computes anything from these.
export const toEnginePoleEvidenceRows = (rows: readonly PersonalityPoleEvidenceRow[]): PoleEvidenceRow[] =>
  rows.map((row) => ({
    userId: row.user_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    questionStableId: row.question_stable_id,
    choiceStableId: row.choice_stable_id,
    poleId: row.pole_id as PersonalityPoleId,
    pointsEarned: row.points_earned as 0 | 1 | 2 | 3,
    maxAvailable: row.max_available as 0 | 1 | 2 | 3,
    scoringVersion: row.scoring_version,
    occurredAt: row.created_at,
  }));

// Calls submit_quiz_pole_evidence (the additive, server-authoritative V2 RPC -- see the schema
// migration's section 5) right after a successful submit_quiz_result, passing the SAME
// quiz_id/answers the caller already has and the real quiz_results row id that call just
// returned. Computes nothing client-side -- the server joins p_answers against
// quiz_choice_pole_awards itself. A no-op (zero rows written, no error) for a quiz_id with no
// seeded calibration, so this is safe to call unconditionally after every quiz submission,
// calibrated or not. Never throws; a failure here must never block or roll back the already-
// succeeded submit_quiz_result completion.
export const submitQuizPoleEvidence = async (quizId: string, sourceId: string, answers: Record<string, string>): Promise<boolean> => {
  if (!supabase) {
    return false;
  }
  const { error } = await supabase.rpc('submit_quiz_pole_evidence', {
    p_quiz_id: quizId,
    p_source_id: sourceId,
    p_answers: answers,
  });
  if (error) {
    console.warn('[personality-v2-service] submitQuizPoleEvidence failed:', error.message);
    // Recoverable and non-blocking by design -- V1's personality_evidence for this completion
    // already landed via submit_quiz_result; this is additive V2 evidence, not required for
    // the completion itself to be considered successful.
    reportBackendFailure({ operation: 'submit_quiz_pole_evidence', errorCode: error.code, recoverable: true }, error);
    return false;
  }
  return true;
};
