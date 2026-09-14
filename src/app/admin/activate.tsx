import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { adminSupabase } from '@/lib/admin-supabase';
import { getAdminRole, signOutAdmin } from '@/services/admin-auth-service';

// Owner/editor activation — reached ONLY via the confirmation link Supabase emails after
// admin_users bootstrap (see docs/backend-setup.md). Deliberately a plain sibling of the
// (protected) route group (src/app/admin/(protected)/), not nested inside it, for the exact
// same reason /admin/login is: this page is reached before any normal Admin session exists,
// so it owns its own session/membership resolution instead of being gated by that group's
// layout. Uses ONLY the dedicated Admin Supabase client — never the consumer client — so
// completing activation can never touch/replace a visitor's own consumer session.
const MIN_PASSWORD_LENGTH = 12;

type ActivateState =
  | { kind: 'resolving' }
  | { kind: 'invalid' }
  | { kind: 'unauthorized' }
  | { kind: 'ready' }
  | { kind: 'done' };

export default function AdminActivateScreen() {
  const router = useRouter();
  const [state, setState] = useState<ActivateState>({ kind: 'resolving' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!adminSupabase) {
        setState({ kind: 'invalid' });
        return;
      }

      // Web-only: the confirmation link's session material arrives either as a `?code=`
      // query param (PKCE) or an `#access_token=...&refresh_token=...` hash fragment
      // (implicit flow) — which one Supabase actually sends is a project-level Auth
      // setting, not something this app controls, so both are handled rather than assumed.
      // Neither client has detectSessionInUrl enabled (deliberately, so no OTHER admin page
      // ever silently adopts a stray token from its own URL) — this is the one page that
      // explicitly opts in to reading it.
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error: exchangeError } = await adminSupabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, '', '/admin/activate');
          if (exchangeError) {
            if (!cancelled) setState({ kind: 'invalid' });
            return;
          }
        } else if (accessToken && refreshToken) {
          const { error: setError } = await adminSupabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState({}, '', '/admin/activate');
          if (setError) {
            if (!cancelled) setState({ kind: 'invalid' });
            return;
          }
        }
        // Neither present: fall through and check for an already-restored session below
        // (e.g. the admin client auto-restored a previously-set session on reload) rather
        // than assuming failure outright.
      }

      const { data, error: sessionError } = await adminSupabase.auth.getSession();
      if (cancelled) return;
      if (sessionError || !data.session) {
        setState({ kind: 'invalid' });
        return;
      }

      const role = await getAdminRole();
      if (cancelled) return;
      setState(role === 'unauthorized' ? { kind: 'unauthorized' } : { kind: 'ready' });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleActivate = async () => {
    if (isSubmitting || !adminSupabase) {
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    // Password goes ONLY to the Admin Supabase client, over its own request — never logged,
    // never written anywhere else (no AsyncStorage/localStorage, no URL/query parameter).
    const { error: updateError } = await adminSupabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError('That did not go through. Try again.');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setState({ kind: 'done' });
    router.replace('/admin');
  };

  if (state.kind === 'resolving' || state.kind === 'done') {
    return <ThemedView style={styles.container} />;
  }

  if (state.kind === 'invalid') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <BrandSignature variant="full" />
            <View style={styles.card}>
              <ThemedText style={styles.eyebrow}>OWNER CONTROL ROOM</ThemedText>
              <ThemedText style={styles.heading}>This activation link is invalid or has expired.</ThemedText>
              <ThemedText style={styles.supportText}>Ask for a new confirmation email and try again.</ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (state.kind === 'unauthorized') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <BrandSignature variant="full" />
            <View style={styles.card}>
              <ThemedText style={styles.eyebrow}>OWNER CONTROL ROOM</ThemedText>
              <ThemedText style={styles.heading}>This account is not authorized for Admin.</ThemedText>
              <Pressable style={styles.signOutButton} onPress={() => void signOutAdmin()}>
                <ThemedText style={styles.signOutText}>Sign out</ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <BrandSignature variant="full" />

          <View style={styles.card}>
            <ThemedText style={styles.eyebrow}>OWNER CONTROL ROOM</ThemedText>
            <ThemedText style={styles.heading}>Set your Admin password</ThemedText>

            <View style={styles.field}>
              <ThemedText style={styles.label}>New password</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={Brand.inkSecondary}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Confirm password</ThemedText>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={Brand.inkSecondary}
              />
            </View>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              style={[styles.activateButton, (isSubmitting || !password || !confirmPassword) && styles.activateButtonDisabled]}
              disabled={isSubmitting || !password || !confirmPassword}
              onPress={() => void handleActivate()}>
              <ThemedText style={styles.activateButtonText}>{isSubmitting ? 'Activating…' : 'Activate Admin →'}</ThemedText>
            </Pressable>

            <ThemedText style={styles.supportText}>This password is for Apparently You editorial access.</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E8DD',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E6E8',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  eyebrow: {
    color: Brand.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  heading: {
    color: Brand.ink,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    color: Brand.violet,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    color: Brand.ink,
    backgroundColor: '#F6F2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2FF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '700',
  },
  activateButton: {
    backgroundColor: Brand.pink,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  activateButtonDisabled: {
    opacity: 0.4,
  },
  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  supportText: {
    color: Brand.inkSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#FCE9ED',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignSelf: 'center',
    marginTop: Spacing.one,
  },
  signOutText: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '800',
  },
});
