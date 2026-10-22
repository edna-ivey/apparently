import { getCurrentUserId } from './auth-service';
import type { ProfileRow } from './types';
import { supabase } from '@/lib/supabase';

// Thin Supabase-facing layer over the `profiles` table — the canonical server-side profile
// store. Called from src/data/onboarding.ts (completeOnboarding, updateUserProfile,
// hydrateUserProfile's server reconciliation) and src/services/profile-backfill-service.ts
// (historical local-only profiles / failed-write retry). Local storage in onboarding.ts
// remains the fast-path cache for instant UI; this is the source of truth.

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

// Deliberately separate from upsertProfile above -- age_eligibility is a one-time legal gate,
// never a freely-editable preference (see src/data/age-eligibility.ts's own header comment).
// This still goes through the same table-level RLS as every other profile write, but the
// staged migration adds a BEFORE UPDATE trigger that makes this specific column immutable
// once set, server-side -- a second call here (or a raw client PATCH bypassing this function
// entirely) can set it ONCE from null, never change it after. Returns false (not a throw) on
// any failure, including a rejected immutability-violation update, so a caller can treat "the
// write didn't happen" as a normal, expected outcome rather than a crash.
export const upsertAgeEligibility = async (ageEligibility: '13to17' | '18plus'): Promise<boolean> => {
  if (!supabase) {
    return false;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  const { error } = await supabase.from('profiles').upsert({ user_id: userId, age_eligibility: ageEligibility });
  if (error) {
    console.warn('[profile-service] upsertAgeEligibility failed:', error.message);
    return false;
  }
  return true;
};
