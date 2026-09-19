// react-native-url-polyfill's side effects (a spec-compliant URL/URLSearchParams global) must
// run before supabase-js does any networking — putting it as the very first import in this
// module (the ONE place createClient is ever called) guarantees that ordering without
// depending on every entry point remembering to import it themselves.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// ---------------------------------------------------------------------------------------
// Config detection
//
// Backend-foundation sprint: this app must keep working exactly as before when Supabase
// hasn't been configured yet (no project created, .env not filled in). isSupabaseConfigured
// is the one place that decides "is this real," so nothing else has to guess by probing a
// fake/example endpoint. Both env vars must be present AND not one of the literal
// placeholder values shipped in .env.example.
// ---------------------------------------------------------------------------------------

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const PLACEHOLDER_MARKERS = ['your-project-ref', 'your-publishable-key-here'];

const isRealConfiguredValue = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  return !PLACEHOLDER_MARKERS.some((marker) => trimmed.toLowerCase().includes(marker));
};

export const isSupabaseConfigured = isRealConfiguredValue(supabaseUrl) && isRealConfiguredValue(supabasePublishableKey);

// Today stays on local prototype Daily data (current production behavior) unless BOTH:
// Supabase is actually configured, AND this flag is the literal string "true". Never a
// hidden hard-coded boolean — always read live from the environment, same as
// isSupabaseConfigured above. Sprint 1B-A: set to "true" only in an ignored .env.local for
// local testing; apparentlyyou.com stays on local Daily until this is deliberately turned on
// there (see docs/backend-setup.md).
export const isRemoteDailyEnabled = isSupabaseConfigured && process.env.EXPO_PUBLIC_REMOTE_DAILY_ENABLED === 'true';

// TestFlight-beta-only override: unlocks every Private Daily for this build regardless of
// each question's own is_free_private_unlock flag, so beta testers can answer Private every
// day while the product concept is being evaluated. Set ONLY in the dedicated EAS
// "testflight" build profile's env — never in "production" (App Store) or in Vercel/web, so
// an ordinary consumer or web visitor never inherits it. This is a client-asserted signal:
// every read/write it affects is re-validated server-side in get_private_daily/
// submit_private_daily_answer (see that migration's security note) — this flag alone can
// never bypass RLS or read another user's data.
export const isPrivateDailyTesterAccessEnabled = process.env.EXPO_PUBLIC_PRIVATE_DAILY_TESTER_ACCESS === 'true';

if (__DEV__ && !isSupabaseConfigured) {
  // Loud, but never fatal — see the module-level comment on `supabase` below for why a
  // missing config must never crash the app or a static export.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set (or are still ' +
      'placeholder values from .env.example). Supabase-backed features are disabled; existing local/prototype ' +
      'behavior is unaffected. See docs/backend-setup.md.',
  );
}

// ---------------------------------------------------------------------------------------
// The one shared client
//
// createClient() throws synchronously if given an empty/invalid URL or key — calling it
// unconditionally at module scope would crash on first import (including a static web
// export's build step) whenever Supabase isn't configured yet. Guarding it behind
// isSupabaseConfigured, and typing `supabase` as possibly-null, is what lets every consumer
// (services, the root layout bootstrap) fail safe to "Supabase unavailable" instead.
//
// Storage: AsyncStorage on native (the same package already used by every other local store
// in this repo — no second copy/version). On web, `storage` is left undefined so supabase-js
// falls back to its own default (window.localStorage), matching this repo's existing
// convention of preferring real localStorage over AsyncStorage's web shim.
// ---------------------------------------------------------------------------------------

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// ---------------------------------------------------------------------------------------
// Native AppState-driven auto-refresh
//
// Recommended React Native pattern for supabase-js: pause the auto-refresh timer while the
// app is backgrounded and resume it when it comes back to the foreground. Scoped to native
// only — web has no equivalent backgrounding concept and already handles this differently.
//
// The listener reference is stashed on globalThis (not a plain module-level `let`) because
// Metro Fast Refresh re-evaluates this module's top-level code on every edit during
// development, which would otherwise register a fresh AppState listener each time without
// ever removing the previous one. Removing whatever is stored there first, unconditionally,
// keeps exactly one listener alive no matter how many times this module reloads.
// ---------------------------------------------------------------------------------------

type GlobalWithSupabaseAppStateSubscription = typeof globalThis & {
  __apparentlySupabaseAppStateSubscription?: { remove: () => void };
};

const globalScope = globalThis as GlobalWithSupabaseAppStateSubscription;

globalScope.__apparentlySupabaseAppStateSubscription?.remove();
globalScope.__apparentlySupabaseAppStateSubscription = undefined;

if (supabase && Platform.OS !== 'web') {
  globalScope.__apparentlySupabaseAppStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
