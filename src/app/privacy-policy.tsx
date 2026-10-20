import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

// Build 18: a real, accessible in-app page (not a link to an external URL that may not exist
// yet) -- satisfies Apple's requirement to make the Privacy Policy reachable from the app
// itself regardless of whether a public web page has been published. Content is the exact
// text of docs/app-store/PRIVACY_POLICY_DRAFT_2026-10-20.md, kept in sync with that file by
// hand (single short source, not worth a build-time content pipeline for this). That source
// is explicitly a PRE-PUBLICATION DRAFT -- still true here, shown honestly via the banner
// below -- pending the owner confirming legal business identity/contact and live data
// practices (see that file's own header). This screen must never claim to be a finalized
// policy it isn't.
const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Information we process',
    paragraphs: [
      'Profile information you choose to provide, which may include display name, age range, gender selection and optional custom gender.',
      'Quiz and Daily responses, results, personality traits/evidence, Creature and Relic progression, and participation in comparison/sharing features.',
      'Anonymous account identifiers used to associate saved responses, app state and purchases with an installation/account.',
      'Subscription status and purchase entitlement records from Apple and RevenueCat. Payment details are processed by Apple, not entered into the app.',
      'Technical diagnostic information when error monitoring is enabled, potentially including app version, device context and crash/error metadata. We aim not to transmit quiz answer text in diagnostic events.',
    ],
  },
  {
    heading: 'Why we process it',
    paragraphs: [
      'To provide the app, personalize your results, preserve progress, support comparison and sharing, enforce age restrictions and subscription access, troubleshoot errors, prevent abuse, and meet legal obligations.',
    ],
  },
  {
    heading: 'Services and recipients',
    paragraphs: [
      'Supabase: account authentication and application data storage.',
      'Apple App Store: payments and subscription management.',
      'RevenueCat: subscription status and entitlement synchronization.',
      'Sentry: diagnostic/error monitoring, where enabled.',
      'Expo/EAS and Vercel: build/deployment and website infrastructure, where applicable.',
    ],
  },
  {
    heading: 'Sharing and visibility',
    paragraphs: [
      'When you explicitly share a comparison or Creature image, recipients may see the content you choose to share.',
    ],
  },
  {
    heading: 'Retention and deletion',
    paragraphs: [
      'We retain data while needed to provide the service and as required by law. You can request account deletion using Settings → Delete Account. Deletion removes your account-associated personal data unless retention is legally required.',
      'Deleting your account does not cancel an Apple subscription. Manage or cancel it in iOS Settings or at apps.apple.com/account/subscriptions.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: ['You can change some profile fields in Settings, manage your Apple subscription, and request account deletion.'],
  },
  {
    heading: 'Age and children',
    paragraphs: [
      'The app offers a 13–17 demographic choice and separate age-eligibility controls restricting adult-oriented Private experiences.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: ['We use authentication and access controls intended to limit unauthorized access. No service can guarantee absolute security.'],
  },
  {
    heading: 'Changes',
    paragraphs: ['We may update this policy as the service changes. The effective date will be updated when material changes are made.'],
  },
];

export default function PrivacyPolicyScreen() {
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

          <ThemedText style={styles.pageTitle}>Privacy Policy</ThemedText>
          <View style={styles.draftBanner}>
            <ThemedText style={styles.draftBannerText}>
              Pre-publication draft, last updated October 20, 2026. Final legal business identity and contact details are pending owner
              confirmation.
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
