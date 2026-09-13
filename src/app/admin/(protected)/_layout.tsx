import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { type AdminRole, getAdminRole, getAdminSession, signOutAdmin, subscribeToAdminAuthChanges } from '@/services/admin-auth-service';

// The gate for every route inside this (protected) group — /admin (the dashboard) and
// /admin/review/[id]. /admin/login deliberately lives OUTSIDE this group (a plain sibling
// under src/app/admin/), so it is never itself subject to this gate and this component never
// has to compare against the current path to avoid redirecting to itself — that pathname-
// comparison approach was tried first and produced a real navigation oscillation on web
// static export (Slot vs Redirect flip-flopping); route-group separation avoids the whole
// category of bug rather than working around it. login.tsx owns its own tiny "already
// authorized? redirect to /admin" check instead.
//
// Directly typing apparentlyyou.com/admin must still require authorization — this is the
// client-side half of that; admin_users' own RLS policy and every admin_* RPC's
// is_admin()/is_owner() check (see the Sprint 1C-A migration) are the half that holds even if
// this UI gate is somehow bypassed entirely.
type GateState = { kind: 'loading' } | { kind: 'signed-out' } | { kind: 'unauthorized' } | { kind: 'authorized'; role: AdminRole };

export default function AdminProtectedLayout() {
  const [state, setState] = useState<GateState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const session = await getAdminSession();
      if (cancelled) return;
      if (!session) {
        setState({ kind: 'signed-out' });
        return;
      }
      const role = await getAdminRole();
      if (cancelled) return;
      setState(role === 'unauthorized' ? { kind: 'unauthorized' } : { kind: 'authorized', role });
    };

    void resolve();
    const unsubscribe = subscribeToAdminAuthChanges(() => void resolve());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (state.kind === 'loading') {
    return <ThemedView style={styles.blank} />;
  }

  if (state.kind === 'signed-out') {
    return <Redirect href="/admin/login" />;
  }

  if (state.kind === 'unauthorized') {
    return <UnauthorizedScreen />;
  }

  return <Slot />;
}

const UnauthorizedScreen = () => (
  <ThemedView style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <ThemedText style={styles.eyebrow}>OWNER CONTROL ROOM</ThemedText>
        <ThemedText style={styles.heading}>This account is not authorized for Admin.</ThemedText>
        <Pressable style={styles.signOutButton} onPress={() => void signOutAdmin()}>
          <ThemedText style={styles.signOutText}>Sign out</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  </ThemedView>
);

const styles = StyleSheet.create({
  blank: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: 380,
    width: '100%',
    alignItems: 'center',
  },
  eyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  heading: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#FCE9ED',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  signOutText: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '800',
  },
});
