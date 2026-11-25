import { getCurrentUserId } from './auth-service';
import { supabase } from '@/lib/supabase';
import { reportBackendFailure } from '@/services/observability';
import type { UserTraitTotalRow } from '@/data/personality-v2/totals-ranking';

// Build 22: real I/O for the numeric user_trait_totals read path -- at most 64 small rows
// per user, read directly instead of scanning/reconstructing from raw evidence. This is the
// "fast You-page retrieval" path: totals-ranking.ts's pure ranking functions are the only
// thing that ever computes anything from these rows.
type UserTraitTotalDbRow = {
  trait_id: number;
  lifetime_earned: number;
  max_available_total: number;
  distinct_questions_with_earned: number;
  distinct_questions_presented: number;
};

export type GetMyTraitTotalsResult = { ok: true; data: UserTraitTotalRow[] } | { ok: false; message: string };

// Reads user_trait_active_totals (Bible v1.4 §43's 12-month ACTIVE evidence window,
// 20261030010000) -- NOT user_trait_totals (lifetime, permanent, never read for ranking).
// This is the one and only input Your Signature/The Undercurrent/Creature eligibility should
// ever rank from; totals-ranking.ts's functions are agnostic to which table a row came from,
// so getting this LOOKUP right is what actually enforces the 12-month rule for display.
export const getMyTraitTotals = async (): Promise<GetMyTraitTotalsResult> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'No active session.' };
  }

  const { data, error } = await supabase
    .from('user_trait_active_totals')
    .select('trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented')
    .eq('user_id', userId);

  if (error) {
    console.warn('[personality-v2-service] getMyTraitTotals failed:', error.message);
    reportBackendFailure({ operation: 'get_my_trait_totals', errorCode: error.code, recoverable: true }, error);
    return { ok: false, message: error.message };
  }
  const rows = (data ?? []) as UserTraitTotalDbRow[];
  return {
    ok: true,
    data: rows.map((row) => ({
      traitId: row.trait_id,
      lifetimeEarned: row.lifetime_earned,
      maxAvailableTotal: row.max_available_total,
      distinctQuestionsWithEarned: row.distinct_questions_with_earned,
      distinctQuestionsPresented: row.distinct_questions_presented,
    })),
  };
};

// Build 22 final cleanup (owner-authorized clean V1 reset, 2026-11-02): getMyPersonalityPoleEvidence/
// toEnginePoleEvidenceRows/submitQuizPoleEvidence (the interim V2-pole read/write path, backed by
// personality_pole_evidence/quiz_choice_pole_awards and the submit_quiz_pole_evidence RPC) are
// retired -- confirmed zero live callers anywhere in the app (getMyTraitTotals/
// user_trait_active_totals, above, is the real, live numeric read path You actually uses).
// This was already fully superseded by the numeric quiz_choice_trait_awards/user_trait_evidence
// architecture; "redundant scoring/backfill compatibility mechanism" per the Build 22 final
// cleanup directive.
