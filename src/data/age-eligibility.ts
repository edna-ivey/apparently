import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { ensureAnonymousSession } from '@/services/auth-service';
import { upsertAgeEligibility } from '@/services/profile-service';

// Build 16: minimal, privacy-conscious age eligibility -- NOT part of UserProfile
// (onboarding.ts) and deliberately NEVER exposed through updateUserProfile's generic
// patch-merge path. That function is the Settings-facing "edit any field freely" seam;
// age eligibility is a one-time legal gate, not an editable preference, so it gets its own
// narrow set-once function and its own server-side immutability enforcement (see the staged
// migration's profiles_age_eligibility_immutable trigger) -- a client can never flip this
// after the fact just by calling the generic profile-update path.
//
// Only two values are ever PERSISTED. A user who self-identifies as under 13 is never asked
// anything else and never gets a profile/session created at all (see the onboarding age gate
// in onboarding.tsx) -- there is no 'under13' stored anywhere, consistent with "avoid
// collecting unnecessary sensitive personal information" and not retaining data from a
// self-identified minor beyond the single screen that said so.
export type AgeEligibility = '13to17' | '18plus';

const AGE_ELIGIBILITY_KEY = 'apparently:age-eligibility';

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
      // ignore storage errors, keep in-memory state working
    }
  },
};

const isAgeEligibility = (value: unknown): value is AgeEligibility => value === '13to17' || value === '18plus';

type Snapshot = { hydrated: boolean; value: AgeEligibility | null };

let snapshot: Snapshot = { hydrated: false, value: null };
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => snapshot;

export const hydrateAgeEligibility = async (): Promise<void> => {
  if (snapshot.hydrated) {
    return;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }
  hydrationPromise = (async () => {
    const stored = await storage.getItem(AGE_ELIGIBILITY_KEY);
    const value = isAgeEligibility(stored) ? stored : null;
    snapshot = { hydrated: true, value };
    notify();
  })();
  await hydrationPromise;
  hydrationPromise = null;
};

// Reactive read for components -- mirrors onboarding.ts's useUserProfile/useOnboardingState
// pattern exactly, so a screen that sets eligibility and a screen that gates on it (even if
// different screens) see the change in the same session with no relaunch needed.
export const useAgeEligibility = (): AgeEligibility | null | 'loading' => {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  if (!current.hydrated) {
    void hydrateAgeEligibility();
    return 'loading';
  }
  return current.value;
};

export const getAgeEligibility = async (): Promise<AgeEligibility | null> => {
  await hydrateAgeEligibility();
  return snapshot.value;
};

export const isAdultEligible = (eligibility: AgeEligibility | null | 'loading'): boolean => eligibility === '18plus';

// Set-once: a device that already has a LOCAL value never overwrites it by calling this
// again (the real, authoritative enforcement is server-side -- see the staged migration's
// immutability trigger -- this is just the client staying consistent with that same rule
// rather than contradicting it locally). Returns the eligibility that actually ended up
// persisted (the new one, or the pre-existing one if this was already set).
export const setAgeEligibilityOnce = async (eligibility: AgeEligibility): Promise<AgeEligibility> => {
  await hydrateAgeEligibility();
  if (snapshot.value) {
    return snapshot.value;
  }
  await storage.setItem(AGE_ELIGIBILITY_KEY, eligibility);
  snapshot = { hydrated: true, value: eligibility };
  notify();

  const session = await ensureAnonymousSession();
  if (session) {
    void upsertAgeEligibility(eligibility);
  }
  return eligibility;
};
