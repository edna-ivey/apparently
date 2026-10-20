import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { clearLocalSession, getCurrentUserId } from './auth-service';
import { supabase } from '@/lib/supabase';
import { reportBackendFailure } from '@/services/observability';

// Build 18 Work Package 3: in-app account deletion. Orchestrates (1) the real server-side
// deletion via the delete-account Edge Function, which cascades through every user-linked
// table (see that function's own header comment for the full, verified cascade chain and
// what is explicitly NOT deleted), then, ONLY after that succeeds, (2) clears this device's
// own locally-cached copies of the same data and (3) clears the now-invalid local session.
// Never performs step 2/3 first -- a failed server-side deletion must never look locally like
// a successful one.

export type DeleteAccountResult = { ok: true } | { ok: false; message: string };

// Every per-USER local storage key in the app, cross-referenced directly against each
// owning module's own STORAGE_KEY/*_KEY constant (not guessed) -- kept as a literal list here
// rather than importing from each module, since most of those constants are intentionally
// private to their own file and this is the one place that needs the full cross-cutting set.
// Deliberately EXCLUDES apparently:daily-questions (shared editorial CONTENT, never
// per-user), apparently-admin-auth (a separate admin login, not a consumer account), and the
// Relic Lab dev-tooling keys (internal calibration tooling, not real user data).
const LOCAL_USER_DATA_KEYS = [
  'apparently:onboarding', // src/data/onboarding.ts -- OnboardingState
  'apparently:user-profile', // src/data/onboarding.ts -- UserProfile
  'apparently:self-perception', // src/data/onboarding.ts -- SelfPerceptionProfile
  'apparently:age-eligibility', // src/data/age-eligibility.ts
  'apparently:daily-answers', // src/data/daily-answer.ts
  'apparently:daily-answer', // src/data/daily-answer.ts -- legacy key, same data
  'apparently:today-welcome-dismissed', // src/data/today-welcome-state.ts
  'apparently:creature-evolution:v1', // src/data/creature/creature-reveal-state.ts
  'apparently:pending-quiz-submissions', // src/data/quizzes/pending-quiz-submissions.ts
  'apparently:quiz-results', // src/data/quizzes/results.ts
];

const removeLocalKey = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch {
    // Best-effort -- a single key failing to clear locally must never block the rest, and
    // the account is already gone server-side regardless (the authoritative outcome).
  }
};

const clearLocalUserData = async (): Promise<void> => {
  await Promise.all(LOCAL_USER_DATA_KEYS.map(removeLocalKey));
};

// The one function Settings calls. Returns ok:true ONLY when the server confirmed real
// deletion -- a network/server failure is reported honestly as a failure, with local data
// and session left completely untouched, so a failed attempt never strands the user
// signed-out with their data already wiped locally while it still exists on the server.
export const deleteAccount = async (): Promise<DeleteAccountResult> => {
  if (!supabase) {
    return { ok: false, message: 'Account deletion isn’t available right now.' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: 'You’re not signed in.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) {
      console.warn('[account-deletion-service] delete-account failed:', error.message);
      reportBackendFailure({ operation: 'delete_account', recoverable: false }, error);
      return { ok: false, message: 'That didn’t go through. Please try again.' };
    }
    if (!data?.ok) {
      reportBackendFailure({ operation: 'delete_account', recoverable: false }, new Error('delete-account returned no ok:true'));
      return { ok: false, message: 'That didn’t go through. Please try again.' };
    }
  } catch (error) {
    console.warn('[account-deletion-service] delete-account threw:', error);
    reportBackendFailure({ operation: 'delete_account', recoverable: false }, error);
    return { ok: false, message: 'That didn’t go through. Please try again.' };
  }

  // Only reached once the server has confirmed the account and every linked row are gone.
  await clearLocalUserData();
  await clearLocalSession();
  return { ok: true };
};
