import { getCurrentUserId } from './auth-service';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over compare_responses and its RPCs — see the migration
// (20260921010000_compare_they_have_notes.sql) for the full security/privacy design. Never
// reads/writes compare_responses directly; RLS default-denies that on purpose.

export type SubmitCompareResponseResult = { ok: true; responseId: string } | { ok: false; message: string };

export const submitCompareResponse = async (
  shareId: string,
  respondentToken: string,
  respondentNickname: string,
  answers: Record<string, string>,
  primaryResultId: string,
  secondaryResultId: string | null,
  note: string | null,
): Promise<SubmitCompareResponseResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase.rpc('submit_compare_response', {
    p_share_id: shareId,
    p_respondent_token: respondentToken,
    p_respondent_nickname: respondentNickname,
    p_answers: answers,
    p_primary_result_id: primaryResultId,
    p_secondary_result_id: secondaryResultId,
    p_note: note,
  });
  if (error) {
    console.warn('[compare-service] submitCompareResponse failed:', error.message);
    return { ok: false, message: error.message };
  }
  const row = (Array.isArray(data) ? data[0] : data) as { response_id: string } | undefined;
  if (!row?.response_id) {
    return { ok: false, message: 'submit_compare_response returned no row.' };
  }
  return { ok: true, responseId: row.response_id };
};

export type CompareResultRow = {
  response_id: string;
  quiz_id: string;
  owner_result_id: string;
  owner_answers: Record<string, string> | null;
  owner_display_name: string | null;
  respondent_nickname: string;
  friend_answers: Record<string, string>;
  friend_primary_result_id: string;
  friend_secondary_result_id: string | null;
  note: string | null;
  match_count: number | null;
  created_at: string;
};

export type GetCompareResultResult = { ok: true; data: CompareResultRow | null } | { ok: false; message: string };

// Callable by either the share's owner (their own session) or the specific respondent who
// holds this response's opaque token (respondentToken) — the RPC itself enforces that; this
// layer just passes both through.
export const getCompareResult = async (shareId: string, respondentToken: string | null): Promise<GetCompareResultResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('get_compare_result', { p_share_id: shareId, p_respondent_token: respondentToken });
  if (error) {
    console.warn('[compare-service] getCompareResult failed:', error.message);
    return { ok: false, message: error.message };
  }
  const rows = (data ?? []) as CompareResultRow[];
  return { ok: true, data: rows[0] ?? null };
};

export type CompareResponseListRow = {
  response_id: string;
  share_id: string;
  quiz_id: string;
  respondent_nickname: string;
  friend_primary_result_id: string;
  match_count: number;
  note: string | null;
  created_at: string;
  viewed_at: string | null;
};

export type ListCompareResponsesResult = { ok: true; data: CompareResponseListRow[] } | { ok: false; message: string };

export const listCompareResponsesForOwner = async (quizId?: string): Promise<ListCompareResponsesResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('list_compare_responses_for_owner', { p_quiz_id: quizId ?? null });
  if (error) {
    console.warn('[compare-service] listCompareResponsesForOwner failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: (data ?? []) as CompareResponseListRow[] };
};

export type ApparentlyItsAThingRow = { result_id: string; respondent_count: number };

export type GetApparentlyItsAThingResult = { ok: true; data: ApparentlyItsAThingRow[] } | { ok: false; message: string };

export const getApparentlyItsAThing = async (quizId: string): Promise<GetApparentlyItsAThingResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { data, error } = await supabase.rpc('get_apparently_its_a_thing', { p_quiz_id: quizId });
  if (error) {
    console.warn('[compare-service] getApparentlyItsAThing failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: (data ?? []) as ApparentlyItsAThingRow[] };
};

export const markCompareResponseViewed = async (responseId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const { error } = await supabase.rpc('mark_compare_response_viewed', { p_response_id: responseId });
  if (error) {
    console.warn('[compare-service] markCompareResponseViewed failed:', error.message);
    return { ok: false, message: error.message };
  }
  return { ok: true };
};
