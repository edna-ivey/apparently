// Sprint 1C-A — a SECOND, independent Supabase client dedicated to Admin authentication.
//
// Why a second client at all: consumer users are anonymous-first (see src/lib/supabase.ts),
// and Michelle's own browser already carries a real anonymous consumer session that owns her
// first production Daily vote. If Admin sign-in reused the consumer client, signing into
// Admin would replace/overwrite that session's stored auth token — silently signing her out
// of her own consumer identity, or worse, mixing the two. This client uses the SAME project
// URL and the SAME public/publishable key (there is no separate Admin project, and no
// secret/service_role key is ever used here either) but a completely separate auth storage
// namespace, so the two sessions can never collide or overwrite one another.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { isSupabaseConfigured } from '@/lib/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Admin availability only ever depends on Supabase being configured at all — deliberately
// independent of EXPO_PUBLIC_REMOTE_DAILY_ENABLED. Michelle must be able to manage
// production content even in an environment where consumer remote Daily is intentionally
// still off (e.g. before the first real Daily is approved to go live for ordinary visitors).
export const isAdminSupabaseConfigured = isSupabaseConfigured;

// A distinct storageKey is the entire separation mechanism: supabase-js namespaces
// everything it persists (access/refresh tokens, user) under this key. Using a different key
// than the consumer client's default guarantees zero shared storage, on both native
// (AsyncStorage) and web (localStorage) — reading/writing/signing out of one can never touch
// the other's stored session.
const ADMIN_AUTH_STORAGE_KEY = 'apparently-admin-auth';

export const adminSupabase: SupabaseClient | null = isAdminSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        storageKey: ADMIN_AUTH_STORAGE_KEY,
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Same native AppState-driven auto-refresh pairing as the consumer client (src/lib/
// supabase.ts) — pause/resume this client's own refresh timer independently of the
// consumer client's. globalThis-stashed listener for the same Fast-Refresh-safety reason.
type GlobalWithAdminSupabaseAppStateSubscription = typeof globalThis & {
  __apparentlyAdminSupabaseAppStateSubscription?: { remove: () => void };
};

const globalScope = globalThis as GlobalWithAdminSupabaseAppStateSubscription;

globalScope.__apparentlyAdminSupabaseAppStateSubscription?.remove();
globalScope.__apparentlyAdminSupabaseAppStateSubscription = undefined;

if (adminSupabase && Platform.OS !== 'web') {
  globalScope.__apparentlyAdminSupabaseAppStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void adminSupabase.auth.startAutoRefresh();
    } else {
      void adminSupabase.auth.stopAutoRefresh();
    }
  });
}
