import { getCurrentUserId } from './auth-service';
import type { PersonalityAnswerEvidence, PersonalityDimensionId, PersonalityEffect } from '@/data/personality';
import { supabase } from '@/lib/supabase';
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
