// The real iOS system permission request -- requested CONTEXTUALLY (task requirement: "Do not
// request notification permission immediately at first app launch. Present a contextual
// explanation after the user experiences the app's value."), never at cold start. Callers
// (e.g. after a user's first completed Daily or first completed quiz) check hasShownContextual
// Prompt() first; if false, show their own explainer UI, then call requestNotificationPermission
// once the user taps through it. If the OS already has a real answer (granted OR denied),
// this never re-prompts -- "respect system-level permission denial" means exactly that: once
// denied, only the user's own iOS Settings can change it, never a repeat in-app ask.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { logAnalyticsEvent } from '@/services/analytics-service';
import { NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY } from '@/services/notifications-config';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

const toStatus = (response: Notifications.NotificationPermissionsStatus): NotificationPermissionStatus => {
  if (response.status === 'granted') return 'granted';
  if (response.status === 'denied') return 'denied';
  return 'undetermined';
};

// Read-only -- never prompts. Safe to call anywhere, any time (e.g. to decide whether Settings'
// notification section should show "Enable in iOS Settings" vs real per-category toggles).
export const getNotificationPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
  try {
    const response = await Notifications.getPermissionsAsync();
    return toStatus(response);
  } catch {
    return 'undetermined';
  }
};

export const hasShownContextualPermissionPrompt = async (): Promise<boolean> => {
  try {
    const stored =
      typeof window !== 'undefined' && 'localStorage' in window
        ? window.localStorage.getItem(NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY)
        : await AsyncStorage.getItem(NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

// Exported so a caller's "Not now" dismissal can mark this seen too -- the explainer shows at
// most once per device regardless of the answer (see NotificationPermissionPrompt's own
// comment); requestNotificationPermission also calls this itself for the "tapped through"
// path, so either exit from the explainer ends up marked.
export const markContextualPromptShown = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY, 'true');
      return;
    }
    await AsyncStorage.setItem(NOTIFICATION_CONTEXTUAL_PROMPT_SHOWN_KEY, 'true');
  } catch {
    // Best-effort -- worst case this device's own explainer could show once more than
    // intended; the real OS-level permission state (checked separately, above) is what
    // actually governs whether the system prompt itself can appear again.
  }
};

// Call ONLY after the app's own contextual explainer has already been shown and the user has
// tapped through it -- never call this directly from a cold-start effect. Requests the real
// iOS permission exactly once per undetermined state; if the OS already has an answer, this
// is a no-op read, never a second prompt.
export const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  await markContextualPromptShown();
  const before = await getNotificationPermissionStatus();
  if (before !== 'undetermined') {
    return before;
  }

  logAnalyticsEvent({ name: 'notification_permission_requested', properties: {} });
  try {
    const response = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    const status = toStatus(response);
    logAnalyticsEvent({ name: status === 'granted' ? 'notification_permission_granted' : 'notification_permission_denied', properties: {} });
    return status;
  } catch {
    logAnalyticsEvent({ name: 'notification_permission_denied', properties: {} });
    return 'denied';
  }
};
