// Local Daily-reminder notification. Deliberately a ONE-TIME scheduled notification re-computed
// and re-scheduled each time (never expo-notifications' own repeating DAILY trigger type) --
// a repeating trigger fires unconditionally every day regardless of whether today's Daily has
// already been answered, and expo-notifications has no way to cancel just "today's" occurrence
// of a repeating series without cancelling the whole series. Scheduling a fresh one-time
// notification for "the next occurrence of the user's preferred time" and explicitly cancelling
// it the moment today's Daily is answered gives exact control over both of the task's
// requirements ("do not send a reminder after the Daily has already been completed" and
// "respect the user's timezone," which falls out for free since this is computed from the
// device's own current local Date/time, recalculated fresh every call).
//
// Call scheduleNextDailyReminder() on app launch/foreground and whenever the user changes their
// preferred time. Call cancelTodaysDailyReminder() the moment a Daily answer is actually
// submitted (today's occurrence only -- the NEXT day's reminder is rescheduled separately, by
// the next scheduleNextDailyReminder() call, never by this one).

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { logAnalyticsEvent } from '@/services/analytics-service';
import { DAILY_REMINDER_NOTIFICATION_ID_KEY } from '@/services/notifications-config';

const DAILY_REMINDER_COPY = [
  'The room has opinions. Yours is missing. 👀',
  'Today’s Daily is still sitting there, waiting on you.',
  'Apparently, everyone else already answered.',
];

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage.getItem(key) : await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // Best-effort.
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      // Best-effort.
    }
  },
};

// The next occurrence of hour:minute in the device's own local time -- today if that time
// hasn't passed yet, tomorrow otherwise. Pure function of the device clock, so a timezone
// change (travel) is automatically reflected the next time this runs (app foreground already
// triggers a reschedule -- see the call site in _layout.tsx).
const nextOccurrence = (hour: number, minute: number): Date => {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
};

export const cancelTodaysDailyReminder = async (): Promise<void> => {
  const id = await storage.getItem(DAILY_REMINDER_NOTIFICATION_ID_KEY);
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired/doesn't exist -- nothing to do.
  }
  await storage.removeItem(DAILY_REMINDER_NOTIFICATION_ID_KEY);
};

// Re-derives and schedules the single next Daily-reminder notification, replacing any
// previously scheduled one (never leaves two pending at once). No-ops entirely if the platform
// can't schedule local notifications, if the category is disabled, or if permission was never
// granted -- scheduling without permission would simply be silently discarded by the OS, so
// this skips the no-op work and the misleading "scheduled" analytics event that would imply
// otherwise.
export const scheduleNextDailyReminder = async (params: { enabled: boolean; hour: number; minute: number; permissionGranted: boolean }): Promise<void> => {
  await cancelTodaysDailyReminder();

  if (!params.enabled || !params.permissionGranted || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return;
  }

  const fireAt = nextOccurrence(params.hour, params.minute);
  const body = DAILY_REMINDER_COPY[Math.floor(Math.random() * DAILY_REMINDER_COPY.length)];

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Apparently You',
        body,
        data: { category: 'daily_reminder', url: '/' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
    await storage.setItem(DAILY_REMINDER_NOTIFICATION_ID_KEY, id);
    logAnalyticsEvent({ name: 'notification_scheduled', properties: { category: 'daily_reminder' } });
  } catch {
    // Scheduling failure (e.g. OS-level limit hit) -- nothing this app can recover from locally;
    // the next scheduleNextDailyReminder() call (app foreground) tries again naturally.
  }
};
