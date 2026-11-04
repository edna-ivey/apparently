// Server-backed notification preferences, with a local cache for instant reads (same
// read-local-first, sync-to-server pattern age-eligibility.ts and onboarding.ts already use).
// The SERVER row (notification_preferences) is authoritative for anything a send-side Edge
// Function needs to respect; the local cache exists purely so Settings can render instantly
// without a network round trip, and so the Daily-reminder scheduler can read the user's chosen
// time without an async fetch on every app launch.
//
// TIMEZONE (owner correction, 2026-10-23): the device's own IANA timezone
// (Intl.DateTimeFormat().resolvedOptions().timeZone) is sent to the server on every
// preference write AND independently via syncDeviceTimeZone(), called on every app
// launch/foreground (see _layout.tsx) -- not only when the user happens to touch a
// notification setting. A travelling user's zone change is reflected promptly either way; a
// DST shift within an UNCHANGED zone needs no re-sync at all, since the send function derives
// the real local hour from the IANA zone name at send TIME (see supabase/functions/_shared/
// push-notification-logic.ts), never from a stored numeric offset that could go stale.
//
// CURRENT STATE (Build 23 P0 stability review, confirmed directly against the real linked
// production database, not assumed): the notification_preferences table and
// upsert_notification_preferences RPC do NOT exist in production yet (one of the 5
// independently-gated migrations -- see supabase/release-manifest.json). Every call site below
// is fire-and-forget (`void`, never awaited by any caller -- confirmed in settings.tsx and
// _layout.tsx) and the local cache/UI already updates from the LOCAL write alone, so this gap
// cannot block a Settings toggle or freeze anything. It does mean: toggling a notification
// category in Settings today changes this device's local state and the (currently nonexistent)
// server intent, but nothing server-side can read it yet to actually gate a push send -- no UI
// copy anywhere claims otherwise, and this must stay true until that migration is separately
// reviewed and deployed. daily_reminder is the one category genuinely live end-to-end today,
// since it is scheduled entirely locally (see daily-reminder-service.ts) and never depends on
// this table at all.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';

const getDeviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

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
      const { data, error } = await supabase.from('notification_preferences').select('*').maybeSingle();
      if (error && __DEV__) {
        console.warn('[notification-preferences-service] server refresh failed (expected until that migration ships):', error.message);
      }
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

// In the owner-only diagnostic build, Notifications OFF also suppresses the
// hook's normal eager hydration (including the server request) on cold start.
export const useNotificationPreferences = (suspendHydration = false): NotificationPreferences => {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  if (!snapshot.hydrated && !suspendHydration) {
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
  const { error } = await supabase.rpc('upsert_notification_preferences', {
    p_daily_reminder_enabled: patch.dailyReminderEnabled ?? null,
    p_daily_reminder_hour: patch.dailyReminderHour ?? null,
    p_daily_reminder_minute: patch.dailyReminderMinute ?? null,
    p_friend_activity_enabled: patch.friendActivityEnabled ?? null,
    p_creature_evolution_enabled: patch.creatureEvolutionEnabled ?? null,
    p_new_quizzes_enabled: patch.newQuizzesEnabled ?? null,
    p_private_updates_enabled: patch.privateUpdatesEnabled ?? null,
    p_quiet_hours_start_hour: next.quietHoursStartHour,
    p_quiet_hours_end_hour: next.quietHoursEndHour,
    p_timezone: getDeviceTimeZone(),
  });
  if (error && __DEV__) {
    console.warn('[notification-preferences-service] upsert_notification_preferences failed (expected until that migration ships):', error.message);
  }
};

// Called on every app launch/foreground (see _layout.tsx) -- independent of any preference
// edit, so a travelling user's zone change reaches the server promptly even if they never
// open Settings. A plain timezone-only RPC call (every other field stays unchanged, per the
// RPC's own null-means-unchanged contract) -- never touches the local cache/snapshot, since
// NotificationPreferences doesn't expose timezone to the UI at all (nothing in Settings reads
// or displays it; quiet hours are shown/edited as plain hour-of-day, same as before).
export const syncDeviceTimeZone = async (): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.rpc('upsert_notification_preferences', { p_timezone: getDeviceTimeZone() });
  if (error && __DEV__) {
    console.warn('[notification-preferences-service] syncDeviceTimeZone failed (expected until that migration ships):', error.message);
  }
};
