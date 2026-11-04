// Device push token lifecycle: register once permission is granted, refresh on the SDK's own
// rotation event, remove on logout/disable/account deletion. Uses Expo's own push notification
// service (getExpoPushTokenAsync) rather than a raw APNs device token -- EAS brokers delivery
// to Apple's APNs directly using push credentials it manages per this app's own EAS project
// (projectId below), so no separate Firebase project and no app-managed APNs certificate/key
// are needed (see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md for the full
// transport decision this confirms).

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// CURRENT STATE (Build 23 P0 stability review, confirmed directly against the real linked
// production database, not assumed): the push_tokens table and upsert_push_token/
// delete_push_token RPCs do NOT exist in production yet (one of the 5 independently-gated
// migrations -- see supabase/release-manifest.json). Every function below is already called
// fire-and-forget (`void`, never awaited -- confirmed in _layout.tsx and settings.tsx) and
// already treats every failure as non-fatal, so this gap cannot block anything. It does mean:
// no device's Expo push token is actually being stored server-side yet, so no server-sent push
// notification (friend activity, Creature evolution, new quizzes, private updates) can reach
// any device today, regardless of what a user has enabled in Settings -- this file makes no
// claim otherwise, and that remains true until the migration is separately reviewed and
// deployed.

const EAS_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

let registeredSubscription: Notifications.Subscription | null = null;

// Call once permission is confirmed granted. Fetches the real Expo push token for this device
// and upserts it server-side under the caller's own session. Never throws -- a registration
// failure (offline, Expo's push service unreachable) is reported the same way every other
// non-critical backend call in this app already is, and never blocks the screen that called it.
export const registerPushToken = async (): Promise<void> => {
  if (!supabase || !EAS_PROJECT_ID || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    const { error } = await supabase.rpc('upsert_push_token', { p_token: data, p_platform: Platform.OS });
    if (error && __DEV__) {
      console.warn('[push-token-service] upsert_push_token failed:', error.message);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[push-token-service] registerPushToken failed:', error);
    }
  }

  // Fires whenever the OS rotates this device's underlying push token. The listener payload
  // is the RAW native device token, not an Expo push token -- re-deriving the real Expo push
  // token via getExpoPushTokenAsync() again (rather than storing the raw payload directly) is
  // deliberate: push_tokens.token must always hold the Expo-formatted token, since that's the
  // only format the send-push-notification Edge Function's call to Expo's push API accepts.
  // Only one listener ever attached, regardless of how many times this function is called
  // (e.g. once at launch and again right after a fresh permission grant).
  if (!registeredSubscription) {
    registeredSubscription = Notifications.addPushTokenListener(() => {
      if (!supabase) return;
      void Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID }).then(({ data }) => {
        void supabase?.rpc('upsert_push_token', { p_token: data, p_platform: Platform.OS }).then(({ error }) => {
          if (error && __DEV__) {
            console.warn('[push-token-service] upsert_push_token (rotation) failed (expected until that migration ships):', error.message);
          }
        });
      });
    });
  }
};

// Call when the user explicitly disables notifications on this device, or before a local
// account-deletion flow begins its own server call (defense in depth -- the delete-account
// function's cascade already removes every token for this user regardless, since push_tokens.
// user_id references auth.users(id) on delete cascade; this additionally removes just THIS
// device's row immediately, for the "toggle off" case where the account itself isn't going away).
export const removeThisDevicePushToken = async (): Promise<void> => {
  if (!supabase || !EAS_PROJECT_ID) {
    return;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    const { error } = await supabase.rpc('delete_push_token', { p_token: data });
    if (error && __DEV__) {
      console.warn('[push-token-service] delete_push_token failed (expected until that migration ships):', error.message);
    }
  } catch (error) {
    // Best-effort -- see registerPushToken's own comment on why a failure here never blocks
    // the caller's own flow (settings toggle, account deletion).
    if (__DEV__) {
      console.warn('[push-token-service] removeThisDevicePushToken failed:', error);
    }
  }
};
