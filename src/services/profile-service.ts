import { getCurrentUserId } from './auth-service';
import type { ProfileRow } from './types';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over the `profiles` table. NOT wired into onboarding yet — see
// src/data/onboarding.ts, which remains the authoritative local store for this sprint. These
// functions exist for future wiring only (Sprint 1B+).

export const getProfile = async (): Promise<ProfileRow | null> => {
  if (!supabase) {
    return null;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) {
    console.warn('[profile-service] getProfile failed:', error.message);
    return null;
  }
  return data;
};

export type UpsertProfileInput = {
  preferredName?: string | null;
  ageRange?: string | null;
  gender?: string | null;
  selfPerception?: Record<string, unknown> | null;
  onboardingCompletedAt?: string | null;
};

export const upsertProfile = async (input: UpsertProfileInput): Promise<ProfileRow | null> => {
  if (!supabase) {
    return null;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      preferred_name: input.preferredName,
      age_range: input.ageRange,
      gender: input.gender,
      self_perception: input.selfPerception,
      onboarding_completed_at: input.onboardingCompletedAt,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.warn('[profile-service] upsertProfile failed:', error.message);
    return null;
  }
  return data;
};
