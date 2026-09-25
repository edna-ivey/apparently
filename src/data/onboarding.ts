import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Onboarding collects two DELIBERATELY separate things, plus a completion flag:
//   1. UserProfile        — what the user told us about themselves (name/age/gender).
//   2. SelfPerceptionProfile — what the user CLAIMS about who they are (5 quick questions).
//   3. OnboardingState     — has this device finished onboarding at all.
// These are never merged into Daily answer history, Commonality, or personality scoring —
// self-perception is "what you said," not a behavioral signal. Future work can compare the
// two ("YOU SAID: independent. APPARENTLY: your last 42 answers disagree.") but that
// comparison doesn't exist yet — this module only stores the raw, original snapshots.

export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export const AGE_RANGES: AgeRange[] = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export type GenderIdentity = 'Woman' | 'Man' | 'Nonbinary' | 'Another identity' | 'Prefer not to say';

export const GENDER_IDENTITIES: GenderIdentity[] = [
  'Woman',
  'Man',
  'Nonbinary',
  'Another identity',
  'Prefer not to say',
];

// Structured so basic profile fields can be edited later (a future Settings screen) without
// touching the self-perception snapshot below, which must stay exactly as first answered.
export type UserProfile = {
  firstName: string;
  ageRange: AgeRange;
  gender: GenderIdentity;
  customGender?: string;
};

export type SelfPerceptionAnswers = {
  groupRole: string;
  dramatic: string;
  decisionStyle: string;
  proudTrait: string;
  selfBlindSpot: string;
};

export type SelfPerceptionProfile = {
  completedAt: string;
  answers: SelfPerceptionAnswers;
};

export type OnboardingState = {
  completed: boolean;
  completedAt: string | null;
};

// Versioned, distinct keys — none of these ever share storage with Daily answers
// (apparently:daily-answers) or any other existing record.
const ONBOARDING_KEY = 'apparently:onboarding';
const PROFILE_KEY = 'apparently:user-profile';
const SELF_PERCEPTION_KEY = 'apparently:self-perception';

// Same dual web/native storage shim used by daily-answer.ts — kept local rather than shared
// so this module has no import-order coupling to unrelated Daily storage.
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
      // ignore storage errors in development, keep the in-memory state working
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore storage errors — worst case the key is cleared again next time
    }
  },
};

// --- Onboarding completion: the one piece the (tabs) layout needs reactively, to decide
// whether a device sees onboarding or the consumer tabs. ---------------------------------

// `hydrated` lives INSIDE the snapshot object on purpose. useSyncExternalStore decides
// whether to re-render a subscriber by comparing the previous and next getSnapshot() results
// with Object.is — a plain module-level `let onboardingHydrated = false` flipping to `true`
// is invisible to that comparison unless the object returned by getSnapshot() is itself a
// new reference. An earlier version kept `hydrated` as a separate variable and only
// reassigned `onboardingState` when a stored record actually existed — so on a genuine first
// launch (no stored key at all), hydration flipped `onboardingHydrated` to true but
// getSnapshot() kept returning the exact same object, React saw "no change," and the
// subscribed component never re-rendered past 'loading'. Every mutation below now replaces
// `snapshot` wholesale with a brand-new object, even when the logical state (e.g. "not
// completed") hasn't changed — that's what makes the identity check fire correctly.
type OnboardingStoreSnapshot = {
  hydrated: boolean;
  state: OnboardingState;
};

const listeners = new Set<() => void>();
let snapshot: OnboardingStoreSnapshot = {
  hydrated: false,
  state: { completed: false, completedAt: null },
};
let hydrationPromise: Promise<void> | null = null;

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

const isValidOnboardingState = (value: unknown): value is OnboardingState =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as { completed?: unknown }).completed === 'boolean';

// Idempotent: a call while hydration is already resolved returns immediately, and concurrent
// calls while it's in flight share the same in-progress promise rather than issuing a second
// storage read. hydrationPromise is cleared once hydration settles (see finally) purely so
// the module never holds a stale reference to a promise nobody will await again — it isn't
// load-bearing for idempotency, since the `snapshot.hydrated` check above it already prevents
// hydration from ever re-running once complete.
export const hydrateOnboardingState = async (): Promise<void> => {
  if (snapshot.hydrated) {
    return;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    let nextState = snapshot.state;
    try {
      const stored = await storage.getItem(ONBOARDING_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (isValidOnboardingState(parsed)) {
            nextState = {
              completed: parsed.completed,
              completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
            };
          }
        } catch {
          // Corrupt JSON — fail safe to "not completed" (nextState stays the default).
        }
      }
      // No stored key at all (the common first-launch case) — nextState intentionally stays
      // the existing default; what MUST still change is the snapshot's object identity below.
    } catch {
      // Storage read itself failed — fail safe to "not completed".
    } finally {
      snapshot = { hydrated: true, state: nextState };
      hydrationPromise = null;
      notify();
    }
  })();

  return hydrationPromise;
};

// Returns 'loading' until hydration resolves, so the (tabs) layout can hold its initial
// routing decision instead of flashing the consumer tabs before redirecting to onboarding.
export const useOnboardingState = (): OnboardingState | 'loading' => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return current.hydrated ? current.state : 'loading';
};

// --- User profile: simple read/write, not reactive — nothing subscribes to it live today,
// and it's expected to be editable later (a future Settings screen), not watched. ---------

const isValidUserProfile = (value: unknown): value is UserProfile => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.firstName === 'string' &&
    candidate.firstName.trim().length > 0 &&
    typeof candidate.ageRange === 'string' &&
    AGE_RANGES.includes(candidate.ageRange as AgeRange) &&
    typeof candidate.gender === 'string' &&
    GENDER_IDENTITIES.includes(candidate.gender as GenderIdentity) &&
    (candidate.customGender === undefined || typeof candidate.customGender === 'string')
  );
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const stored = await storage.getItem(PROFILE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return isValidUserProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setUserProfile = async (profile: UserProfile): Promise<void> => {
  await storage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// Settings-facing edit path -- writes the SAME storage key/shape setUserProfile always has,
// but also updates the reactive snapshot and notifies subscribers immediately (the same thing
// completeOnboarding already does inline for the very first write). This is what makes editing
// a field in Settings update "[Name], apparently." on You in the same session, with no force-
// close/relaunch needed -- without this, a screen already mounted and subscribed via
// useUserProfile would only see the change on its next full hydration.
export const updateUserProfile = async (patch: Partial<UserProfile>): Promise<void> => {
  const current = profileSnapshot.hydrated ? profileSnapshot.profile : await getUserProfile();
  if (!current) {
    // Settings only ever edits an EXISTING profile created during onboarding -- never invents
    // one. If somehow reached with no profile yet, this is a no-op rather than fabricating a
    // partial/invalid record.
    return;
  }
  const next: UserProfile = { ...current, ...patch };
  await setUserProfile(next);
  profileSnapshot = { hydrated: true, profile: next };
  notifyProfile();
};

// --- Reactive profile access, on top of the plain get/set above (same storage, same key,
// no second read path) — added because the You screen previously read the profile via a
// one-shot useEffect + getUserProfile() on mount. If a device's tab navigator mounts (or
// pre-mounts) the You screen around the same time completeOnboarding() is writing the
// profile, that one-shot read can capture a snapshot from before the write lands, and —
// since the effect never re-runs — the screen is stuck showing the fallback name until the
// app restarts. Mirrors useOnboardingState's snapshot-identity pattern so any subscribed
// screen re-renders immediately when the profile actually changes, mount timing aside. -----

type UserProfileSnapshot = {
  hydrated: boolean;
  profile: UserProfile | null;
};

const profileListeners = new Set<() => void>();
let profileSnapshot: UserProfileSnapshot = { hydrated: false, profile: null };
let profileHydrationPromise: Promise<void> | null = null;

const notifyProfile = () => profileListeners.forEach((listener) => listener());

const subscribeProfile = (listener: () => void) => {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
};

const getProfileSnapshot = () => profileSnapshot;

// Idempotent, same pattern as hydrateOnboardingState — safe to call from every screen that
// needs the profile; only the first call actually reads storage.
export const hydrateUserProfile = async (): Promise<void> => {
  if (profileSnapshot.hydrated) {
    return;
  }
  if (profileHydrationPromise) {
    return profileHydrationPromise;
  }

  profileHydrationPromise = (async () => {
    const profile = await getUserProfile();
    profileSnapshot = { hydrated: true, profile };
    profileHydrationPromise = null;
    notifyProfile();
  })();

  return profileHydrationPromise;
};

// Returns 'loading' until hydration resolves, then the current profile (or null if none is
// saved yet) — reactively, so completing onboarding and landing on You in the same session
// updates this without a restart.
export const useUserProfile = (): UserProfile | null | 'loading' => {
  const current = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  return current.hydrated ? current.profile : 'loading';
};

// --- Self-perception: the user's original onboarding snapshot. Also simple read/write —
// unlike the profile, this is never meant to be edited after the fact; it's a record of
// what the user said at signup, preserved as-is for future "you said / apparently" copy. --

const isValidSelfPerceptionProfile = (value: unknown): value is SelfPerceptionProfile => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.completedAt !== 'string') {
    return false;
  }
  const answers = candidate.answers;
  if (!answers || typeof answers !== 'object') {
    return false;
  }
  const requiredFields: (keyof SelfPerceptionAnswers)[] = [
    'groupRole',
    'dramatic',
    'decisionStyle',
    'proudTrait',
    'selfBlindSpot',
  ];
  const answerRecord = answers as Record<string, unknown>;
  return requiredFields.every((field) => typeof answerRecord[field] === 'string' && answerRecord[field].length > 0);
};

export const getSelfPerceptionProfile = async (): Promise<SelfPerceptionProfile | null> => {
  try {
    const stored = await storage.getItem(SELF_PERCEPTION_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return isValidSelfPerceptionProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setSelfPerceptionProfile = async (profile: SelfPerceptionProfile): Promise<void> => {
  await storage.setItem(SELF_PERCEPTION_KEY, JSON.stringify(profile));
};

// The single entry point the onboarding flow calls on its final screen: writes all three
// records together and flips the reactive completion flag so the (tabs) layout immediately
// sees the device as onboarded (no separate re-hydration round trip needed).
export const completeOnboarding = async (
  profile: UserProfile,
  answers: SelfPerceptionAnswers,
): Promise<void> => {
  const completedAt = new Date().toISOString();
  await setUserProfile(profile);
  await setSelfPerceptionProfile({ completedAt, answers });

  // Updates the reactive profile snapshot directly, in memory, rather than relying on a
  // subsequent read to pick it up — this is what makes it visible immediately to a screen
  // that's already mounted and subscribed (e.g. a tab navigator that keeps You mounted).
  profileSnapshot = { hydrated: true, profile };
  notifyProfile();

  const state: OnboardingState = { completed: true, completedAt };
  await storage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  snapshot = { hydrated: true, state };
  notify();
};

// Development-only: clears onboarding/profile/self-perception storage so first-launch
// onboarding can be re-tested repeatedly. Deliberately not exposed as any UI in the consumer
// app — call it from the JS debugger console during development:
//   __resetApparentlyOnboarding()
// or, without a debugger attached, clear these three keys manually (e.g. via the AsyncStorage
// devtools panel, or window.localStorage on web):
//   apparently:onboarding
//   apparently:user-profile
//   apparently:self-perception
// This never touches apparently:daily-answers or any other Daily/personality storage.
export const resetOnboardingForDevelopment = async (): Promise<void> => {
  await storage.removeItem(ONBOARDING_KEY);
  await storage.removeItem(PROFILE_KEY);
  await storage.removeItem(SELF_PERCEPTION_KEY);
  snapshot = { hydrated: true, state: { completed: false, completedAt: null } };
  notify();
  profileSnapshot = { hydrated: true, profile: null };
  notifyProfile();
};

if (process.env.NODE_ENV !== 'production') {
  (globalThis as typeof globalThis & { __resetApparentlyOnboarding?: () => Promise<void> }).__resetApparentlyOnboarding =
    resetOnboardingForDevelopment;
}
