import { useRouter } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

// Build 18: a real, accessible in-app + web page at /support (Expo Router serves this route
// natively at that exact path, both in the app and on apparentlyyou.com once deployed) --
// satisfies App Store Connect's Support URL field needing a real page, not a bare mailto
// link. Build 19 finalization (2026-10-21): expanded from a single email link to cover
// everything Apple review and real users actually need here -- support/privacy contact,
// troubleshooting, subscription management, Restore Purchases, account deletion, and the
// explicit "deleting your account does not cancel an Apple subscription" disclosure --
// cross-checked against the real Settings/paywall behavior (settings.tsx, paywall.tsx,
// supabase/functions/delete-account), not invented.
const SUPPORT_EMAIL = 'support@apparentlyyou.com';
const PRIVACY_EMAIL = 'privacy@apparentlyyou.com';

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Troubleshooting',
    paragraphs: [
      'Most display or loading issues are resolved by closing and reopening the app, or by checking your internet connection — Apparently You needs one to save your progress and load Daily content.',
      'If a specific screen won’t load or looks wrong, try updating to the latest version of Apparently You from the App Store first. If the problem continues, email us below with your device model and iOS version and a short description of what happened — screenshots help a lot.',
    ],
  },
  {
    heading: 'Managing your subscription',
    paragraphs: [
      'Apparently Private subscriptions are billed and managed entirely through your Apple ID, not through Apparently You directly. To view, change, or cancel your subscription, open Settings → Apparently Private → Manage Subscription in the app (this opens Apple’s own subscription management page), or go to Settings on your iPhone → your name → Subscriptions, or visit apps.apple.com/account/subscriptions.',
      'Subscriptions renew automatically at the price shown at purchase unless canceled at least 24 hours before the current period ends, per Apple’s standard subscription rules.',
    ],
  },
  {
    heading: 'Restore Purchases',
    paragraphs: [
      'If you reinstalled the app, switched devices, or your subscription isn’t showing as active, use Restore Purchases from Settings → Apparently Private, or from the subscription screen. This checks your Apple account for a prior purchase and reinstates it — no new charge is made.',
    ],
  },
  {
    heading: 'Deleting your account',
    paragraphs: [
      'You can permanently delete your Apparently You account from Settings → Delete Account. This immediately and permanently removes your profile, quiz and Daily history, personality evidence, and Creature and Relic progress. This cannot be undone.',
      'Important: deleting your Apparently You account does NOT cancel an active Apple subscription. Apple billing and your Apparently You account are separate — if you have an active subscription, cancel it separately (see "Managing your subscription" above) before or after deleting your account, or you will continue to be charged by Apple even though your in-app data is gone.',
    ],
  },
  {
    heading: 'Privacy questions',
    paragraphs: [
      'For questions about what data Apparently You collects or how it’s used, see the Privacy Policy (available in Settings and at apparentlyyou.com/privacy), or email us directly below.',
    ],
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();

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

          <ThemedText style={styles.pageTitle}>Support</ThemedText>
          <View style={styles.card}>
            <ThemedText style={styles.paragraph}>
              Questions, feedback, or something not working the way it should? We&apos;d like to hear about it.
            </ThemedText>
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} accessibilityRole="link" accessibilityLabel={`Email ${SUPPORT_EMAIL}`}>
              <ThemedText style={styles.emailLink}>{SUPPORT_EMAIL}</ThemedText>
            </Pressable>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.heading} style={styles.card}>
              <ThemedText style={styles.sectionHeading}>{section.heading}</ThemedText>
              {section.paragraphs.map((paragraph) => (
                <ThemedText key={paragraph} style={styles.paragraph}>
                  {paragraph}
                </ThemedText>
              ))}
            </View>
          ))}

          <View style={styles.card}>
            <ThemedText style={styles.sectionHeading}>Contact</ThemedText>
            <ThemedText style={styles.paragraph}>Super Great Ventures LLC</ThemedText>
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} accessibilityRole="link" accessibilityLabel={`Email ${SUPPORT_EMAIL}`}>
              <ThemedText style={styles.emailLink}>Support: {SUPPORT_EMAIL}</ThemedText>
            </Pressable>
            <Pressable onPress={() => void Linking.openURL(`mailto:${PRIVACY_EMAIL}`)} accessibilityRole="link" accessibilityLabel={`Email ${PRIVACY_EMAIL}`}>
              <ThemedText style={styles.emailLink}>Privacy: {PRIVACY_EMAIL}</ThemedText>
            </Pressable>
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
    ...Platform.select({ web: { marginVertical: 28, borderRadius: Radius.xl, boxShadow: Elevation.shell, overflow: 'hidden' }, default: {} }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: Celestial.textSecondary, fontSize: 26, lineHeight: 26, fontWeight: '600' },
  pageTitle: { ...Type.display, color: Celestial.textPrimary, marginTop: Spacing.two },
  card: { backgroundColor: Celestial.glassFill, borderWidth: 1, borderColor: Celestial.glassBorder, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.two },
  sectionHeading: { ...Type.heading, color: Celestial.textPrimary },
  paragraph: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20 },
  emailLink: { color: Celestial.textPrimary, fontSize: 15, fontWeight: '700' },
});
