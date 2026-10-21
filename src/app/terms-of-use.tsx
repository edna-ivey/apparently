import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

// Build 19 finalization (2026-10-21): pricing cross-checked against the real, locked values in
// src/services/purchases-service.ts and the paywall (never hardcoded there either -- every
// displayed price comes from the live StoreKit product); account-deletion/subscription
// interaction cross-checked against supabase/functions/delete-account and settings.tsx.
// Governing-law/dispute-resolution jurisdiction is deliberately not named -- that would require
// inventing the LLC's formation state, which isn't evidenced anywhere in this repo; add a
// specific clause once that's provided, rather than publish an invented one. Content mirrors
// docs/app-store/TERMS_OF_USE_DRAFT_2026-10-20.md, kept in sync by hand.
const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Who operates this app',
    paragraphs: ['These Terms are between you and Super Great Ventures LLC ("we", "us"), the operator of Apparently You. Contact: support@apparentlyyou.com.'],
  },
  {
    heading: 'What Apparently You is',
    paragraphs: [
      'Apparently You provides entertainment-oriented quizzes, personality reflections, comparisons and collectible visual identities. Results are interpretive, not medical, psychological, employment, legal or financial assessments, and should not be treated as factual diagnoses or guarantees.',
    ],
  },
  {
    heading: 'Acceptable use',
    paragraphs: [
      'You agree not to misuse the app, attempt unauthorized access, harass other users, exploit shared links, or submit unlawful content. The app’s creative materials and trademarks remain owned by their respective rights holders. You retain rights in content you lawfully provide, while granting permissions reasonably necessary to operate the features you use.',
    ],
  },
  {
    heading: 'Subscriptions',
    paragraphs: [
      'Apparently Private is offered at $3.99/month, $29.99/year, or a limited Founding Member introductory annual price of $19.99 for the first year, automatically renewing at $29.99/year thereafter. The Founding Member price is only ever shown when Apple confirms you are actually eligible for it; otherwise the standard annual price is shown. The price and terms shown in the Apple purchase sheet at the moment of purchase always govern.',
      'Payment is charged through your Apple account; subscriptions automatically renew unless canceled according to Apple’s rules. Manage or cancel at apps.apple.com/account/subscriptions, or from Settings → Apparently Private → Manage Subscription. Deleting your Apparently You account does not automatically cancel an Apple subscription — cancel it separately through Apple. Restore Purchases is available in Settings and on the subscription screen.',
    ],
  },
  {
    heading: 'Account deletion',
    paragraphs: [
      'You may permanently delete your Apparently You account at any time from Settings → Delete Account. This immediately and permanently removes your account and the data tied to it, and cannot be undone. It does not cancel an active Apple subscription — see "Subscriptions" above.',
    ],
  },
  {
    heading: 'Service changes and availability',
    paragraphs: ['Features and content may change. We may suspend access for security or misuse, subject to applicable law.'],
  },
  {
    heading: 'Disclaimer and limitation of liability',
    paragraphs: [
      'The app is provided "as is" and "as available," without warranties of any kind, to the fullest extent permitted by law. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the app. Nothing here limits any liability that cannot lawfully be limited.',
    ],
  },
  {
    heading: 'Privacy',
    paragraphs: ['See the Privacy Policy, available in Settings.'],
  },
  {
    heading: 'Apple standard terms',
    paragraphs: ['This app is also subject to Apple’s Standard Licensed Application End User License Agreement.'],
  },
  {
    heading: 'Contact',
    paragraphs: ['Super Great Ventures LLC — support@apparentlyyou.com'],
  },
];

export default function TermsOfUseScreen() {
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

          <ThemedText style={styles.pageTitle}>Terms of Use</ThemedText>
          <ThemedText style={styles.lastUpdated}>Effective: October 21, 2026</ThemedText>

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
  lastUpdated: { color: Celestial.textMuted, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: Celestial.glassFill, borderWidth: 1, borderColor: Celestial.glassBorder, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.two },
  sectionHeading: { ...Type.heading, color: Celestial.textPrimary },
  paragraph: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20 },
});
