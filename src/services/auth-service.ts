import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// V1 auth strategy: anonymous-first. A user gets a real, authenticated Supabase identity the
// moment the app can reach Supabase — no email, no password, no login screen, no forced
// signup. Later work will LINK this anonymous identity to Sign in with Apple (or another
// permanent identity); that linking is NOT built here. This module is the only place that
// talks to supabase.auth — nothing else in the app should call it directly.

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!supabase) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[auth-service] getCurrentSession failed:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.warn('[auth-service] getCurrentSession threw:', error);
    return null;
  }
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getCurrentSession();
  return session?.user.id ?? null;
};

// Concurrent-call-safe and idempotent: every caller made while an attempt is already in
// flight shares that SAME promise, so two screens mounting at once (or one screen mounting
// twice during a fast re-render) can never trigger two separate signInAnonymously() calls —
// and therefore can never create two separate anonymous accounts for one app install. Once
// a real session exists (this call or any prior one already established it), subsequent
// calls resolve immediately from getCurrentSession() without touching the network again.
let ensureAnonymousSessionPromise: Promise<Session | null> | null = null;

export const ensureAnonymousSession = async (): Promise<Session | null> => {
  if (!supabase || !isSupabaseConfigured) {
    // Additive foundation only: with no Supabase project configured, there is nothing to
    // establish. This is not an error — every existing local/prototype flow must keep
    // working exactly as before with no session at all.
    return null;
  }

  if (ensureAnonymousSessionPromise) {
    return ensureAnonymousSessionPromise;
  }

  ensureAnonymousSessionPromise = (async () => {
    try {
      const existing = await getCurrentSession();
      if (existing) {
        return existing;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[auth-service] signInAnonymously failed:', error.message);
        return null;
      }
      return data.session;
    } catch (error) {
      console.warn('[auth-service] ensureAnonymousSession threw:', error);
      return null;
    } finally {
      ensureAnonymousSessionPromise = null;
    }
  })();

  return ensureAnonymousSessionPromise;
};

// Returns an unsubscribe function, always — a no-op one when Supabase isn't configured, so
// callers never need to branch on whether Supabase is available before cleaning up.
export const subscribeToAuthChanges = (callback: (session: Session | null) => void): (() => void) => {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
};
