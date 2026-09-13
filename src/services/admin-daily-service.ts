import { adminSupabase } from '@/lib/admin-supabase';
import type { DailyOptionRow, DailyQuestionRow } from '@/services/types';

// Thin Admin-facing data-access layer over the privileged admin_* RPCs created in
// supabase/migrations/20260913220000_admin_control_room.sql. Every mutation here is a
// deliberate, server-enforced editorial action — this file does not re-implement any
// authorization or lifecycle-transition logic client-side; it only surfaces whatever the
// database decides (see each RPC's own comments for the real rule). Uses the ADMIN Supabase
// client exclusively — never the consumer client, never a raw table write.

export type AdminResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

const NOT_CONFIGURED: AdminResult<never> = { ok: false, message: 'Admin is not configured.' };

const runRpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<AdminResult<T>> => {
  if (!adminSupabase) {
    return NOT_CONFIGURED;
  }
  const { data, error } = await adminSupabase.rpc(fn, args);
  if (error) {
    // RAISE EXCEPTION messages from the database (e.g. "Not authorized.", "That date
    // already belongs to another Scheduled Daily.") arrive here as error.message — surfaced
    // as-is rather than a generic failure, since they're already written to be shown to
    // Michelle/an editor.
    return { ok: false, message: error.message };
  }
  return { ok: true, data: data as T };
};

export const listDailyQuestions = (): Promise<AdminResult<DailyQuestionRow[]>> =>
  runRpc<DailyQuestionRow[]>('admin_list_daily_questions').then((result) =>
    result.ok ? { ok: true, data: result.data ?? [] } : result,
  );

export const getDailyQuestion = (questionId: string): Promise<AdminResult<DailyQuestionRow | null>> =>
  runRpc<DailyQuestionRow | null>('admin_get_daily_question', { p_question_id: questionId });

export const listDailyOptions = (questionId: string): Promise<AdminResult<DailyOptionRow[]>> =>
  runRpc<DailyOptionRow[]>('admin_list_daily_options', { p_question_id: questionId }).then((result) =>
    result.ok ? { ok: true, data: result.data ?? [] } : result,
  );

export type AdminDistributionRow = {
  option_id: string;
  position: number;
  label: string;
  answer_count: number;
  percent: number;
  total_answers: number;
};

export const getAdminDailyDistribution = (questionId: string): Promise<AdminResult<AdminDistributionRow[]>> =>
  runRpc<AdminDistributionRow[]>('admin_get_daily_distribution', { p_question_id: questionId }).then((result) =>
    result.ok ? { ok: true, data: result.data ?? [] } : result,
  );

export const createDaily = (): Promise<AdminResult<string>> => runRpc<string>('admin_create_daily');

export const updateDailyContent = (questionId: string, prompt: string, category: string): Promise<AdminResult> =>
  runRpc('admin_update_daily_content', { p_question_id: questionId, p_prompt: prompt, p_category: category });

export const updateDailyOption = (
  optionId: string,
  label: string,
  personalityEffects: unknown,
  apparentlyFeedback: string | null,
): Promise<AdminResult> =>
  runRpc('admin_update_daily_option', {
    p_option_id: optionId,
    p_label: label,
    p_personality_effects: personalityEffects,
    p_apparently_feedback: apparentlyFeedback,
  });

export const moveToDraft = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_move_to_draft', { p_question_id: questionId });

export const submitForReview = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_submit_for_review', { p_question_id: questionId });

export const approveDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_approve_daily', { p_question_id: questionId });

export const sendToRevision = (questionId: string, note: string): Promise<AdminResult> =>
  runRpc('admin_send_to_revision', { p_question_id: questionId, p_note: note });

export const rejectDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_reject_daily', { p_question_id: questionId });

export const scheduleDaily = (questionId: string, date: string): Promise<AdminResult> =>
  runRpc('admin_schedule_daily', { p_question_id: questionId, p_date: date });

export const unscheduleDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_unschedule_daily', { p_question_id: questionId });

export const deleteDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_delete_daily', { p_question_id: questionId });

// Owner-only at the database level (is_owner()) — a non-owner calling either of these gets
// a clear "Not authorized. ...owner-only." error back from the RPC, surfaced as-is.
export const publishDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_publish_daily', { p_question_id: questionId });

export const archiveLiveDaily = (questionId: string): Promise<AdminResult> =>
  runRpc('admin_archive_live_daily', { p_question_id: questionId });
