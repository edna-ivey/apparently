import type { Session } from '@supabase/supabase-js';

import { adminSupabase, isAdminSupabaseConfigured } from '@/lib/admin-supabase';

// Admin auth — sign-in only. There is no self-signup here and never will be: the only way an
// account gets admin_users membership is controlled database administration outside this
// app entirely (see the migration's own comments). This module talks to the ADMIN Supabase
// client exclusively; it never touches the consumer client or a consumer session.

export type AdminRole = 'owner' | 'editor' | 'unauthorized';

export const getAdminSession = async (): Promise<Session | null> => {
  if (!adminSupabase) {
    return null;
  }
  try {
    const { data, error } = await adminSupabase.auth.getSession();
    if (error) {
      console.warn('[admin-auth-service] getAdminSession failed:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.warn('[admin-auth-service] getAdminSession threw:', error);
    return null;
  }
};

export type AdminSignInResult = { ok: true } | { ok: false; message: string };

export const signInAdmin = async (email: string, password: string): Promise<AdminSignInResult> => {
  if (!adminSupabase || !isAdminSupabaseConfigured) {
    return { ok: false, message: 'Admin is not configured.' };
  }
  const { error } = await adminSupabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: 'Incorrect email or password.' };
  }
  return { ok: true };
};

export const signOutAdmin = async (): Promise<void> => {
  if (!adminSupabase) {
    return;
  }
  try {
    await adminSupabase.auth.signOut();
  } catch (error) {
    console.warn('[admin-auth-service] signOutAdmin threw:', error);
  }
};

export const subscribeToAdminAuthChanges = (callback: (session: Session | null) => void): (() => void) => {
  if (!adminSupabase) {
    return () => {};
  }
  const { data } = adminSupabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
};

// The database, not this function, is the actual authority — this just reads the same
// self-row admin_users membership the RLS policy already scopes a caller to. 'unauthorized'
// covers both "signed in but no admin_users row" and "not signed in/not configured."
export const getAdminRole = async (): Promise<AdminRole> => {
  if (!adminSupabase) {
    return 'unauthorized';
  }
  const session = await getAdminSession();
  if (!session) {
    return 'unauthorized';
  }

  const { data, error } = await adminSupabase.from('admin_users').select('role').maybeSingle();
  if (error || !data) {
    return 'unauthorized';
  }
  return data.role === 'owner' ? 'owner' : 'editor';
};
