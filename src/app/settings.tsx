import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import {
  AGE_RANGES,
  GENDER_IDENTITIES,
  hydrateUserProfile,
  updateUserProfile,
  useUserProfile,
  type AgeRange,
  type GenderIdentity,
} from '@/data/onboarding';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { getSubscriptionManagementUrl, restorePurchases, usePremiumStatus } from '@/services/purchases-service';
import { deleteAccount } from '@/services/account-deletion-service';
import { confirmAction } from '@/utils/confirm-action';

// Build 18: owner-confirmed real Zoho alias (docs/app-store/OWNER_APP_STORE_ACTIONS.md item 1)
// -- replaces the earlier temporary edna.tyus@gmail.com placeholder now that the real
// support@apparentlyyou.com mailbox is configured and tested.
const SUPPORT_EMAIL = 'support@apparentlyyou.com';

export default function SettingsScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();

  // The SAME reactive profile store You reads (useUserProfile) — every edit here goes through
  // updateUserProfile, which writes the same apparently:user-profile storage AND updates the
  // shared snapshot immediately, so "[Name], apparently." on You reflects a name change without
  // a restart. This never reruns onboarding and never touches the separate self-perception
  // snapshot (see onboarding.ts's own header comment) — only the three basic profile fields.
  const userProfile = useUserProfile();
  useEffect(() => {
    void hydrateUserProfile();
  }, []);

  const [firstNameDraft, setFirstNameDraft] = useState('');
  const [customGenderDraft, setCustomGenderDraft] = useState('');
  // React's documented "adjusting state when a prop changes" pattern (setState during render,
  // not in an effect) -- same trigger condition the effect this replaced had ([userProfile]):
  // reseed the drafts only when the userProfile snapshot reference actually changes.
  const [prevUserProfile, setPrevUserProfile] = useState(userProfile);
  if (userProfile !== prevUserProfile) {
    setPrevUserProfile(userProfile);
    if (userProfile && userProfile !== 'loading') {
      setFirstNameDraft(userProfile.firstName);
      setCustomGenderDraft(userProfile.customGender ?? '');
    }
  }

  const commitFirstName = () => {
    const trimmed = firstNameDraft.trim();
    if (trimmed.length > 0) {
      void updateUserProfile({ firstName: trimmed });
    } else if (userProfile && userProfile !== 'loading') {
      // Never persist an emptied-out name — revert the draft to the last real value.
      setFirstNameDraft(userProfile.firstName);
    }
  };

  const commitCustomGender = () => {
    void updateUserProfile({ customGender: customGenderDraft.trim() || undefined });
  };

  const selectAgeRange = (range: AgeRange) => void updateUserProfile({ ageRange: range });
  const selectGender = (gender: GenderIdentity) => void updateUserProfile({ gender });

  // Real RevenueCat entitlement truth only — same source You's own subscription surface used
  // (usePremiumStatus, never masked by the client tester-access build flag).
  const premium = usePremiumStatus();
  const managementUrl = getSubscriptionManagementUrl();
  const [restoreState, setRestoreState] = useState<{ phase: 'idle' | 'restoring' | 'done'; message?: string }>({ phase: 'idle' });
  const handleRestore = async () => {
    setRestoreState({ phase: 'restoring' });
    const result = await restorePurchases();
    setRestoreState({
      phase: 'done',
      message: result.ok
        ? result.restored
          ? 'Apparently Private is active on this account.'
          : 'No active Apparently Private subscription was found.'
        : result.message,
    });
  };

  const appVersion = Constants.expoConfig?.version ?? '—';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? '—';

  // Build 18: in-app account deletion. 'deleting'/'error' only -- there is no local success
  // state to show, because a successful deletion immediately clears local data/session and
  // the (tabs) layout's own existing onboarding-incomplete guard takes the user back to
  // onboarding (see src/app/(tabs)/_layout.tsx) -- the navigation away IS the success state.
  const [deleteState, setDeleteState] = useState<{ phase: 'idle' | 'deleting' | 'error'; message?: string }>({ phase: 'idle' });

  const handleDeleteAccount = async () => {
    setDeleteState({ phase: 'deleting' });
    const result = await deleteAccount();
    if (!result.ok) {
      setDeleteState({ phase: 'error', message: result.message });
      return;
    }
    router.replace('/');
  };

  const confirmDeleteAccount = () => {
    confirmAction(
      'This permanently deletes your Apparently account and everything saved to it — quiz results, Daily history, personality evidence, and your Creature and Relic progress. This cannot be undone.\n\nThis does NOT cancel an active Apple subscription. Manage or cancel that separately before or after deleting your account.',
      () => void handleDeleteAccount(),
      { title: 'Delete your account?', confirmLabel: 'Delete Account' },
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button" style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.pageTitle}>Settings</ThemedText>

          {/* --- PROFILE --- */}
          <ThemedText style={styles.sectionEyebrow}>PROFILE</ThemedText>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>First name</ThemedText>
              <TextInput
                value={firstNameDraft}
                onChangeText={setFirstNameDraft}
                onBlur={commitFirstName}
                onSubmitEditing={commitFirstName}
                placeholder="First name"
                placeholderTextColor={Celestial.textMuted}
                style={styles.textInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>

            {userProfile && userProfile !== 'loading' && (
              <>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Age range</ThemedText>
                  <View style={styles.pillWrap}>
                    {AGE_RANGES.map((range) => {
                      const isSelected = userProfile.ageRange === range;
                      return (
                        <Pressable key={range} onPress={() => selectAgeRange(range)} style={[styles.pill, isSelected && styles.pillSelected]}>
                          <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>{range}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
                  <View style={styles.pillWrap}>
                    {GENDER_IDENTITIES.map((option) => {
                      const isSelected = userProfile.gender === option;
                      return (
                        <Pressable key={option} onPress={() => selectGender(option)} style={[styles.pill, isSelected && styles.pillSelected]}>
                          <ThemedText style={[styles.pillText, isSelected && styles.pillTextSelected]}>{option}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {userProfile.gender === 'Another identity' && (
                    <TextInput
                      value={customGenderDraft}
                      onChangeText={setCustomGenderDraft}
                      onBlur={commitCustomGender}
                      onSubmitEditing={commitCustomGender}
                      placeholder="Optional — describe it your way"
                      placeholderTextColor={Celestial.textMuted}
                      style={styles.textInput}
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  )}
                </View>
              </>
            )}
          </View>

          {/* --- APPARENTLY PRIVATE --- */}
          <ThemedText style={styles.sectionEyebrow}>APPARENTLY PRIVATE</ThemedText>
          <View style={styles.card}>
            <View style={styles.subscriptionRow}>
              <ThemedText style={styles.subscriptionStatus}>{premium.status === 'premium' ? 'Active' : 'Free'}</ThemedText>
              <View style={styles.subscriptionActions}>
                {/* Active subscribers previously had no way to see plan pricing from Settings
                    at all -- only Manage Subscription, which leaves the app entirely for
                    Apple's management page. "View Plans" opens the SAME real paywall every
                    visitor sees (now pre-expanded via ?view=plans -- see paywall.tsx) without
                    requiring anyone to cancel or delete anything first. */}
                {premium.status === 'premium' && managementUrl && Platform.OS !== 'web' && (
                  <Pressable style={styles.inlineCta} onPress={() => void Linking.openURL(managementUrl)}>
                    <ThemedText style={styles.inlineCtaText}>Manage Subscription →</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.inlineCta, premium.status === 'premium' && styles.inlineCtaSecondary]}
                  onPress={() => router.push(premium.status === 'premium' ? '/paywall?view=plans' : '/paywall')}>
                  <ThemedText style={[styles.inlineCtaText, premium.status === 'premium' && styles.inlineCtaTextSecondary]}>
                    View Plans →
                  </ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <Pressable disabled={restoreState.phase === 'restoring'} onPress={() => void handleRestore()}>
              <ThemedText style={styles.restoreText}>{restoreState.phase === 'restoring' ? 'Restoring…' : 'Restore Purchases'}</ThemedText>
            </Pressable>
            {restoreState.phase === 'done' && restoreState.message && <ThemedText style={styles.restoreMessage}>{restoreState.message}</ThemedText>}
          </View>

          {/* --- SUPPORT --- */}
          <ThemedText style={styles.sectionEyebrow}>SUPPORT</ThemedText>
          <View style={styles.card}>
            {/* Build 19: links to the real /support page (troubleshooting, subscription
                management, Restore Purchases, and account-deletion guidance -- see
                support.tsx) -- previously Settings only offered a bare mailto link with none
                of that. "Contact Us" below stays as a quick-email shortcut alongside it. */}
            <Pressable onPress={() => router.push('/support')}>
              <ThemedText style={styles.linkRow}>Help & Support</ThemedText>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <ThemedText style={styles.linkRow}>Contact Us</ThemedText>
              <ThemedText style={styles.linkRowSecondary}>{SUPPORT_EMAIL}</ThemedText>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => router.push('/privacy-policy')}>
              <ThemedText style={styles.linkRow}>Privacy Policy</ThemedText>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={() => router.push('/terms-of-use')}>
              <ThemedText style={styles.linkRow}>Terms of Use</ThemedText>
            </Pressable>
          </View>

          {/* --- ACCOUNT --- */}
          <ThemedText style={styles.sectionEyebrow}>ACCOUNT</ThemedText>
          <View style={styles.card}>
            <ThemedText style={styles.dangerExplainer}>
              Deleting your account permanently removes everything saved to it — quiz results, Daily history, personality evidence, and your
              Creature and Relic progress. This can&apos;t be undone.
            </ThemedText>
            {premium.status === 'premium' && (
              <ThemedText style={styles.dangerExplainer}>
                Deleting your account does not cancel your Apple subscription.{' '}
                {managementUrl && Platform.OS !== 'web' ? (
                  <ThemedText style={styles.inlineLink} onPress={() => void Linking.openURL(managementUrl)}>
                    Manage it here
                  </ThemedText>
                ) : (
                  'Manage or cancel it in iOS Settings.'
                )}
                {' '}before or after deleting your account.
              </ThemedText>
            )}
            <Pressable
              disabled={deleteState.phase === 'deleting'}
              onPress={confirmDeleteAccount}
              style={[styles.dangerButton, deleteState.phase === 'deleting' && styles.dangerButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Delete Account">
              <ThemedText style={styles.dangerButtonText}>{deleteState.phase === 'deleting' ? 'Deleting…' : 'Delete Account'}</ThemedText>
            </Pressable>
            {deleteState.phase === 'error' && deleteState.message && <ThemedText style={styles.errorText}>{deleteState.message}</ThemedText>}
          </View>

          {/* --- ABOUT --- */}
          <ThemedText style={styles.sectionEyebrow}>ABOUT</ThemedText>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <ThemedText style={styles.aboutLabel}>Version</ThemedText>
              <ThemedText style={styles.aboutValue}>{appVersion}</ThemedText>
            </View>
            <View style={styles.aboutRow}>
              <ThemedText style={styles.aboutLabel}>Build</ThemedText>
              <ThemedText style={styles.aboutValue}>{buildNumber}</ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17000F' },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: Radius.xl, boxShadow: Elevation.shell, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.two },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: Celestial.textSecondary, fontSize: 26, lineHeight: 26, fontWeight: '600' },
  // Quiet/clean per the Bible's Settings direction — same celestial token family as every
  // other screen (no PortalRings/CelestialWash decoration here; this surface doesn't need to
  // compete visually), just dark glass cards instead of the old light Surface/CardStyle ones.
  pageTitle: { ...Type.display, color: Celestial.textPrimary, marginTop: Spacing.two, marginBottom: Spacing.two },
  sectionEyebrow: { ...Type.eyebrow, color: Brand.gold, marginTop: Spacing.three },
  card: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  fieldGroup: { gap: Spacing.two },
  fieldLabel: { ...Type.caption, color: Celestial.textSecondary, fontWeight: '700' },
  textInput: {
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
    color: Celestial.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  pillSelected: { backgroundColor: Brand.pink, borderColor: Brand.pink },
  pillText: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '700' },
  pillTextSelected: { color: '#FFFFFF' },
  subscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  subscriptionStatus: { ...Type.heading, color: Celestial.textPrimary },
  subscriptionActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  inlineCta: { backgroundColor: Brand.gold, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  inlineCtaText: { color: Brand.plum, fontSize: 13, fontWeight: '800' },
  // Active subscribers see Manage Subscription (the primary action) and View Plans side by
  // side -- View Plans renders as the secondary/outline style here so it doesn't visually
  // compete with Manage Subscription; a free visitor's single View Plans action stays the
  // solid primary style above.
  inlineCtaSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Brand.gold },
  inlineCtaTextSecondary: { color: Brand.gold },
  divider: { height: 1, backgroundColor: Celestial.glassBorder },
  restoreText: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '700' },
  restoreMessage: { color: Celestial.textMuted, fontSize: 12, fontWeight: '600', marginTop: Spacing.one },
  linkRow: { color: Celestial.textPrimary, fontSize: 15, fontWeight: '700' },
  linkRowSecondary: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '600', marginTop: Spacing.half },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  aboutLabel: { ...Type.body, color: Celestial.textSecondary },
  aboutValue: { color: Celestial.textPrimary, fontSize: 14, fontWeight: '700' },
  dangerExplainer: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 19 },
  inlineLink: { color: Brand.gold, fontWeight: '700' },
  dangerButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255,80,80,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.4)',
  },
  dangerButtonDisabled: { opacity: 0.6 },
  dangerButtonText: { color: '#FF6B6B', fontSize: 14, fontWeight: '800' },
  errorText: { color: '#FF6B6B', fontSize: 13, fontWeight: '600' },
});
