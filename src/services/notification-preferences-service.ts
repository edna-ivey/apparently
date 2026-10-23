// Server-backed notification preferences, with a local cache for instant reads (same
// read-local-first, sync-to-server pattern age-eligibility.ts and onboarding.ts already use).
// The SERVER row (notification_preferences) is authoritative for anything a send-side Edge
// Function needs to respect; the local cache exists purely so Settings can render instantly
// without a network round trip, and so the Daily-reminder scheduler can read the user's chosen
// time without an async fetch on every app launch.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';

export type NotificationPreferences = {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  friendActivityEnabled: boolean;
  creatureEvolutionEnabled: boolean;
  newQuizzesEnabled: boolean;
  privateUpdatesEnabled: boolean;
  quietHoursStartHour: number | null;
  quietHoursEndHour: number | null;
};

// Matches the migration's own column defaults exactly -- a device that has never written
// preferences (no local cache, no server row yet) starts here.
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminderEnabled: true,
  dailyReminderHour: 19,
  dailyReminderMinute: 0,
  friendActivityEnabled: true,
  creatureEvolutionEnabled: true,
  newQuizzesEnabled: true,
  privateUpdatesEnabled: true,
  quietHoursStartHour: null,
  quietHoursEndHour: null,
};

const STORAGE_KEY = 'apparently:notifications:preferences';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
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
      // Best-effort -- the server row (once synced) remains the authoritative source either way.
    }
  },
};

let snapshot: { hydrated: boolean; value: NotificationPreferences } = { hydrated: false, value: DEFAULT_NOTIFICATION_PREFERENCES };
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => snapshot.value;

const parseStored = (raw: string | null): NotificationPreferences => {
  if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

export const hydrateNotificationPreferences = async (): Promise<void> => {
  if (snapshot.hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const stored = await storage.getItem(STORAGE_KEY);
    snapshot = { hydrated: true, value: parseStored(stored) };
    notify();

    // Best-effort refresh from the server row, if one exists -- never blocks the local read
    // above, which already resolved. A user with no server row yet (never changed a
    // preference) simply keeps the defaults until their first write.
    if (supabase) {
      const { data } = await supabase.from('notification_preferences').select('*').maybeSingle();
      if (data) {
        const fromServer: NotificationPreferences = {
          dailyReminderEnabled: data.daily_reminder_enabled,
          dailyReminderHour: data.daily_reminder_hour,
          dailyReminderMinute: data.daily_reminder_minute,
          friendActivityEnabled: data.friend_activity_enabled,
          creatureEvolutionEnabled: data.creature_evolution_enabled,
          newQuizzesEnabled: data.new_quizzes_enabled,
          privateUpdatesEnabled: data.private_updates_enabled,
          quietHoursStartHour: data.quiet_hours_start_hour,
          quietHoursEndHour: data.quiet_hours_end_hour,
        };
        snapshot = { hydrated: true, value: fromServer };
        await storage.setItem(STORAGE_KEY, JSON.stringify(fromServer));
        notify();
      }
    }
  })();
  await hydrationPromise;
  hydrationPromise = null;
};

export const useNotificationPreferences = (): NotificationPreferences => {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  if (!snapshot.hydrated) {
    void hydrateNotificationPreferences();
  }
  return current;
};

// Partial update -- only the passed fields change, matching the RPC's own "null means leave
// unchanged" contract (quietHours fields are the one exception, see the migration's comment;
// this function always sends both quiet-hours fields together so that contract is honored
// correctly from every call site).
export const updateNotificationPreferences = async (patch: Partial<NotificationPreferences>): Promise<void> => {
  await hydrateNotificationPreferences();
  const next = { ...snapshot.value, ...patch };
  snapshot = { hydrated: true, value: next };
  notify();
  await storage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (!supabase) return;
  await supabase.rpc('upsert_notification_preferences', {
    p_daily_reminder_enabled: patch.dailyReminderEnabled ?? null,
    p_daily_reminder_hour: patch.dailyReminderHour ?? null,
    p_daily_reminder_minute: patch.dailyReminderMinute ?? null,
    p_friend_activity_enabled: patch.friendActivityEnabled ?? null,
    p_creature_evolution_enabled: patch.creatureEvolutionEnabled ?? null,
    p_new_quizzes_enabled: patch.newQuizzesEnabled ?? null,
    p_private_updates_enabled: patch.privateUpdatesEnabled ?? null,
    p_quiet_hours_start_hour: next.quietHoursStartHour,
    p_quiet_hours_end_hour: next.quietHoursEndHour,
  });
};
