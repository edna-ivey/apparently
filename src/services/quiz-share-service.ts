import { getCurrentUserId } from './auth-service';
import type { CreateQuizShareRow, SharedQuizResultRow } from './types';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over quiz_shares and its two RPCs — see the migration
// (20260919010000_quiz_result_sharing.sql) for the full security/privacy design. Never reads
// or writes the quiz_shares table directly; RLS default-denies that on purpose.

export type CreateQuizShareResult = { ok: true; shareId: string } | { ok: false; message: string };

// Pins the caller's own latest completion of quizId. sharerDisplayName is the sharer's own
// local first name (or null) — self-reported, already visible in their own UI, never anything
// more sensitive. Requires an active session (this app's anonymous-first identity already
// satisfies that for every consumer) — never called for local/prototype (non-remote) mode.
export const createQuizShare = async (quizId: string, sharerDisplayName: string | null): Promise<CreateQuizShareResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase.rpc('create_quiz_share', {
    p_quiz_id: quizId,
    p_sharer_display_name: sharerDisplayName,
  });
  if (error) {
    console.warn('[quiz-share-service] createQuizShare failed:', error.message);
    return { ok: false, message: error.message };
  }
  const row = (Array.isArray(data) ? data[0] : data) as CreateQuizShareRow | undefined;
  if (!row?.share_id) {
    return { ok: false, message: 'create_quiz_share returned no row.' };
  }
  return { ok: true, shareId: row.share_id };
};

export type SharedQuizResult = { quizId: string; resultId: string; sharerDisplayName: string | null; createdAt: string };

export type GetSharedQuizResultResult = { ok: true; data: SharedQuizResult | null } | { ok: false; message: string };

// Deliberately callable with NO session — a fully anonymous recipient (no install, no sign-in)
// must be able to view a shared result on the web. get_shared_quiz_result is granted to anon.
// `ok: true, data: null` (a genuinely unknown/expired token) is distinct from `ok: false` (a
// real network/RPC failure) — the caller decides how to present each.
export const getSharedQuizResult = async (shareId: string): Promise<GetSharedQuizResultResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.rpc('get_shared_quiz_result', { p_share_id: shareId });
  if (error) {
    // Includes a malformed (non-uuid) token — Postgres rejects it before this function body
    // ever runs. Treated the same as "not found" by the caller; there is nothing sensitive in
    // that distinction for a share-link viewer.
    console.warn('[quiz-share-service] getSharedQuizResult failed:', error.message);
    return { ok: false, message: error.message };
  }
  const row = (Array.isArray(data) ? data[0] : data) as SharedQuizResultRow | undefined;
  if (!row) {
    return { ok: true, data: null };
  }
  return {
    ok: true,
    data: { quizId: row.quiz_id, resultId: row.result_id, sharerDisplayName: row.sharer_display_name, createdAt: row.created_at },
  };
};
