import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, Radius, Surface, Type } from '@/constants/design-system';
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

const SUPPORT_EMAIL = 'edna.tyus@gmail.com';

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
  useEffect(() => {
    if (userProfile && userProfile !== 'loading') {
      setFirstNameDraft(userProfile.firstName);
      setCustomGenderDraft(userProfile.customGender ?? '');
    }
  }, [userProfile]);

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <BrandSignature variant="mark" />
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
                placeholderTextColor={Brand.inkSecondary}
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
                      placeholderTextColor={Brand.inkSecondary}
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
              {premium.status === 'premium' && managementUrl && Platform.OS !== 'web' && (
                <Pressable style={styles.inlineCta} onPress={() => void Linking.openURL(managementUrl)}>
                  <ThemedText style={styles.inlineCtaText}>Manage Subscription →</ThemedText>
                </Pressable>
              )}
              {premium.status !== 'premium' && (
                <Pressable style={styles.inlineCta} onPress={() => router.push('/paywall')}>
                  <ThemedText style={styles.inlineCtaText}>Subscribe →</ThemedText>
                </Pressable>
              )}
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
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <ThemedText style={styles.linkRow}>Contact Us</ThemedText>
              <ThemedText style={styles.linkRowSecondary}>{SUPPORT_EMAIL}</ThemedText>
            </Pressable>
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
  container: { flex: 1, backgroundColor: Surface.pageDeep },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Surface.page,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: Radius.xl, boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)', overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.two },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: Brand.inkSecondary, fontSize: 26, lineHeight: 26, fontWeight: '600' },
  pageTitle: { ...Type.display, marginTop: Spacing.two, marginBottom: Spacing.two },
  sectionEyebrow: { ...Type.eyebrow, marginTop: Spacing.three },
  card: { ...CardStyle.base, gap: Spacing.three },
  fieldGroup: { gap: Spacing.two },
  fieldLabel: { ...Type.caption, fontWeight: '700' },
  textInput: {
    borderWidth: 1,
    borderColor: Surface.hairline,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
    color: Brand.ink,
    backgroundColor: Surface.page,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: { borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, backgroundColor: Surface.page, borderWidth: 1, borderColor: Surface.hairline },
  pillSelected: { backgroundColor: Brand.violet, borderColor: Brand.violet },
  pillText: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '700' },
  pillTextSelected: { color: '#FFFFFF' },
  subscriptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  subscriptionStatus: { ...Type.heading },
  inlineCta: { backgroundColor: Brand.violet, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  inlineCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Surface.hairline },
  restoreText: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '700' },
  restoreMessage: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600', marginTop: Spacing.one },
  linkRow: { color: Brand.ink, fontSize: 15, fontWeight: '700' },
  linkRowSecondary: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600', marginTop: Spacing.half },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  aboutLabel: { ...Type.body },
  aboutValue: { color: Brand.ink, fontSize: 14, fontWeight: '700' },
});
