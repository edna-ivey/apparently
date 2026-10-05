import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUserId } from './auth-service';
import { getProfile, upsertProfile } from './profile-service';
import { getOnboardingState, getSelfPerceptionProfile, getUserProfile } from '@/data/onboarding';

// Mirrors legacy-quiz-backfill-service.ts's exact shape. Profile persistence was wired up
// after profile-service.ts already existed but was never called from onboarding — any device
// that completed onboarding before this fix shipped has a real local profile (apparently:
// user-profile) with no corresponding public.profiles row at all. This recovers that local
// data into the canonical server store the FIRST time it's safe to do so, and is also what
// retries a completion/update write that succeeded locally but failed to reach Supabase (same
// symptom: local has data, server row is missing or was never created).
//
// Deliberately does NOT handle "server row exists but is stale relative to a failed local
// update" — that's a narrower edge case than the reported bug (profiles has zero rows at all)
// and existing writes already attempt the server push immediately at completion/edit time; see
// this module's own report for the explicit scope decision.

const MARKER_PREFIX = 'apparently:profile-backfill:v1:';

const storage = {
  getItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore storage errors — worst case, backfill is attempted again next time
    }
  },
};

// Safe to call often: a per-user marker skips the work once a server row is confirmed to
// exist (so this never re-overwrites a populated server profile with stale local data — the
// marker is only ever set AFTER confirming/creating that row), and re-running without the
// marker is always safe since upsertProfile is idempotent on user_id.
export const syncLocalProfileToRemote = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const markerKey = `${MARKER_PREFIX}${userId}`;
  const alreadyDone = await storage.getItem(markerKey);
  if (alreadyDone === 'done') {
    return;
  }

  const existing = await getProfile();
  if (existing) {
    // A real server row already exists for this user (created by a normal completion/edit
    // write, or a previous backfill) — never overwrite it with potentially-stale local state.
    await storage.setItem(markerKey, 'done');
    return;
  }

  const localProfile = await getUserProfile();
  if (!localProfile) {
    // Nothing local to recover for this install — mark done so future launches don't keep
    // re-checking an empty profile.
    await storage.setItem(markerKey, 'done');
    return;
  }

  const [selfPerception, onboardingState] = await Promise.all([getSelfPerceptionProfile(), getOnboardingState()]);

  const result = await upsertProfile({
    preferredName: localProfile.firstName,
    ageRange: localProfile.ageRange,
    // customGender, when present, IS the user's actual self-described identity — more
    // informative than the literal 'Another identity' category label, and profiles has no
    // separate custom-gender column to preserve both. Falls back to the selected category.
    gender: localProfile.gender === 'Another identity' && localProfile.customGender ? localProfile.customGender : localProfile.gender,
    selfPerception: selfPerception?.answers ?? null,
    onboardingCompletedAt: onboardingState.completedAt,
  });

  if (result) {
    await storage.setItem(markerKey, 'done');
  }
  // On failure, the marker stays unset — this safely retries on the next opportunity
  // (`_layout.tsx`'s session-established effect, same as quiz backfill/retry).
};
