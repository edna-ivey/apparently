import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getAdminRole, getAdminSession, signInAdmin, signOutAdmin } from '@/services/admin-auth-service';

// Sign-in only — there is no "Create account" anywhere on this screen and never will be. The
// only way an account gets admin_users membership is controlled database administration
// outside this app (see the Sprint 1C-A migration).
//
// Deliberately a plain sibling of the (protected) route group (src/app/admin/(protected)/),
// not nested inside it — this screen owns its own tiny "already signed in?" check instead of
// being gated by that group's layout, which avoids a real navigation oscillation bug that
// showed up when a shared layout tried to both redirect signed-out users TO this screen and
// decide whether THIS screen itself should redirect away (see that layout's own comment).
type ViewState = { kind: 'checking' } | { kind: 'form' } | { kind: 'unauthorized' } | { kind: 'authorized' };

export default function AdminLoginScreen() {
  const [view, setView] = useState<ViewState>({ kind: 'checking' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getAdminSession();
      if (cancelled) return;
      if (!session) {
        setView({ kind: 'form' });
        return;
      }
      const role = await getAdminRole();
      if (cancelled) return;
      setView(role === 'unauthorized' ? { kind: 'unauthorized' } : { kind: 'authorized' });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await signInAdmin(email.trim(), password);
    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }
    const role = await getAdminRole();
    setView(role === 'unauthorized' ? { kind: 'unauthorized' } : { kind: 'authorized' });
    setIsSubmitting(false);
  };

  if (view.kind === 'checking') {
    return <ThemedView style={styles.container} />;
  }

  if (view.kind === 'authorized') {
    return <Redirect href="/admin" />;
  }

  if (view.kind === 'unauthorized') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <BrandSignature variant="full" />
            <View style={styles.card}>
              <ThemedText style={styles.eyebrow}>OWNER CONTROL ROOM</ThemedText>
              <ThemedText style={styles.unauthorizedHeading}>This account is not authorized for Admin.</ThemedText>
              <Pressable
                style={styles.signOutButton}
                onPress={() => void signOutAdmin().then(() => setView({ kind: 'form' }))}>
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

            <View style={styles.field}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Brand.inkSecondary}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Brand.inkSecondary}
              />
            </View>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              style={[styles.signInButton, (isSubmitting || !email.trim() || !password) && styles.signInButtonDisabled]}
              disabled={isSubmitting || !email.trim() || !password}
              onPress={() => void handleSignIn()}>
              <ThemedText style={styles.signInButtonText}>{isSubmitting ? 'Signing in…' : 'Sign in →'}</ThemedText>
            </Pressable>

            <ThemedText style={styles.supportText}>Editorial access only.</ThemedText>
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
  signInButton: {
    backgroundColor: Brand.pink,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  signInButtonDisabled: {
    opacity: 0.4,
  },
  signInButtonText: {
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
  unauthorizedHeading: {
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
    alignSelf: 'center',
    marginTop: Spacing.one,
  },
  signOutText: {
    color: '#9E2E4F',
    fontSize: 13,
    fontWeight: '800',
  },
});
