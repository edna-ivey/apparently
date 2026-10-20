import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

// Build 18: same rationale as privacy-policy.tsx -- a real, accessible in-app page rather
// than a link to an external URL that may not exist yet. Content mirrors
// docs/app-store/TERMS_OF_USE_DRAFT_2026-10-20.md, which is explicitly a PRE-PUBLICATION
// DRAFT pending legal entity/contact confirmation and counsel review -- shown honestly here
// via the same banner pattern, never presented as finalized terms.
const SECTIONS: { heading: string; paragraphs: string[] }[] = [
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
      'Apparently Private may be offered at $3.99/month, $29.99/year, or a limited Founding Member introductory annual price of $19.99 for the first year, automatically renewing at $29.99/year thereafter. These are planned US prices, not a representation of live availability — the actual price and terms shown in the Apple purchase sheet always govern.',
      'Payment is charged through your Apple account; subscriptions automatically renew unless canceled according to Apple’s rules. Manage or cancel at apps.apple.com/account/subscriptions. Deleting an Apparently You account does not automatically cancel an Apple subscription. Restore Purchases is available in Settings.',
    ],
  },
  {
    heading: 'Service changes and availability',
    paragraphs: ['Features and content may change. We may suspend access for security or misuse, subject to applicable law.'],
  },
  {
    heading: 'Privacy',
    paragraphs: ['See the Privacy Policy, available in Settings.'],
  },
  {
    heading: 'Apple standard terms',
    paragraphs: ['This app is also subject to Apple’s Standard Licensed Application End User License Agreement where applicable.'],
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
          <View style={styles.draftBanner}>
            <ThemedText style={styles.draftBannerText}>
              Pre-publication draft. Final legal entity, contact details and counsel review are pending owner confirmation.
            </ThemedText>
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
  draftBanner: { backgroundColor: 'rgba(246,184,63,0.12)', borderWidth: 1, borderColor: 'rgba(246,184,63,0.3)', borderRadius: Radius.sm, padding: Spacing.three },
  draftBannerText: { color: Brand.gold, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  card: { backgroundColor: Celestial.glassFill, borderWidth: 1, borderColor: Celestial.glassBorder, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.two },
  sectionHeading: { ...Type.heading, color: Celestial.textPrimary },
  paragraph: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20 },
});
