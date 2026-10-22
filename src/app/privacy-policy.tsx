import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
import { Celestial } from '@/components/today/celestial';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

// Build 19 finalization (2026-10-21): the owner-stated facts and operator identity
// (Super Great Ventures LLC) are now cross-checked against the live app and infrastructure --
// not re-published from the earlier PRE-PUBLICATION DRAFT unchanged. Specifically verified
// this pass, not assumed: account deletion is implemented and its real cascade behavior read
// directly from supabase/functions/delete-account/index.ts; Sentry's actual production
// config read from src/services/observability.ts (sendDefaultPii/attachScreenshot/session-
// replay/scrubbing); the full list of third-party services cross-checked against package.json
// (no analytics/tracking SDK exists beyond what's listed below); share-link behavior checked
// against the real schema (no manual revoke exists; a share is only invalidated by the
// sharer's own account deletion, which cascades it away); the under-13 age gate confirmed in
// onboarding.tsx (blocks immediately, no profile/session ever created). Governing-law/dispute
// jurisdiction is deliberately not named here (would require inventing the LLC's formation
// state, which isn't evidenced anywhere in this repo) -- everything else reflects the real,
// current app. Content mirrors docs/app-store/PRIVACY_POLICY_DRAFT_2026-10-20.md, kept in
// sync with that file by hand (single short source, not worth a build-time content pipeline
// for this).
const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Who operates this app',
    paragraphs: [
      'Apparently You is operated by Super Great Ventures LLC ("we", "us"). You can reach us at privacy@apparentlyyou.com for any privacy question, or to request access, correction, or deletion of your data.',
    ],
  },
  {
    heading: 'Information we process',
    paragraphs: [
      'Profile information you choose to provide: display name, age range, gender selection and optional custom gender.',
      'Quiz and Daily responses, results, personality traits and evidence, Creature and Relic progression, and content you choose to share through comparison/sharing features.',
      'An anonymous account identifier (not tied to an email or phone number at signup) used to associate your saved responses, app state and purchases with your installation.',
      'Subscription status and purchase entitlement records from Apple and RevenueCat. We never see or store your payment card details — those are processed entirely by Apple.',
      'Technical diagnostic information, only when our error-monitoring service (Sentry) is active: app version, build number, environment, which backend operation failed, a structural error code, and a stack trace. We do not transmit quiz answer text, personality results, screenshots, session recordings, or your raw device IP address in these events — our Sentry configuration explicitly disables default PII collection, screenshot capture and session replay, and strips authorization headers and request bodies before anything is sent.',
    ],
  },
  {
    heading: 'Why we process it',
    paragraphs: [
      'To provide the app, personalize your results, preserve your progress, support comparison and sharing, enforce age restrictions and subscription access, troubleshoot errors, prevent abuse, and meet legal obligations.',
    ],
  },
  {
    heading: 'Services and recipients',
    paragraphs: [
      'Supabase: account authentication and application data storage. Our Supabase project is hosted in the United States (US West).',
      'Apple App Store: payments and subscription management.',
      'RevenueCat: subscription status and entitlement synchronization. RevenueCat identifies you only by the same anonymous account identifier described above — never your name or email.',
      'Sentry: diagnostic/error monitoring, configured as described above, active in production builds.',
      'Expo/EAS and Vercel: app build/deployment and website hosting infrastructure.',
      'We do not use any advertising, analytics, or behavioral-tracking SDK. No other third party receives your data.',
    ],
  },
  {
    heading: 'Sharing and visibility',
    paragraphs: [
      'When you explicitly create a share link for a comparison result, anyone with that link can view the comparison content you chose to share. A shared page does not display your profile name or other account details — only the result content itself.',
      'There is currently no separate control to manually revoke a share link; a share link stops working once the account that created it is deleted (see "Retention and deletion" below).',
    ],
  },
  {
    heading: 'Retention and deletion',
    paragraphs: [
      'We retain your data while your account exists and as needed to provide the service. You can permanently delete your account at any time from Settings → Delete Account.',
      'Deletion is immediate and permanent: it removes your authentication record and, through that, every row tied to your account — your profile, Daily and quiz answers, personality evidence, Creature and Relic progress, tester-access records, and any share links you created. This cannot be undone.',
      'A few things are not controlled by this deletion, and we want to be upfront about them: your subscription and purchase history remain with Apple and RevenueCat as required for their own recordkeeping (deleting your Apparently You account does not cancel an Apple subscription — manage or cancel it directly in iOS Settings or at apps.apple.com/account/subscriptions); any diagnostic error events already sent to Sentry before deletion persist under Sentry\'s own retention policy; and a routine database backup taken before your deletion may still contain your data until that backup itself ages out of our backup retention window.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'You can change your profile fields in Settings, manage or cancel your Apple subscription at any time, restore a prior purchase, and request account deletion — all from Settings. For any other request about your data, contact privacy@apparentlyyou.com.',
    ],
  },
  {
    heading: 'Age and children',
    paragraphs: [
      'Apparently You is not intended for children under 13. The app asks for an age confirmation during onboarding and never creates an account or collects further information from anyone who indicates they are under 13.',
      'Separately, the app offers a 13–17 demographic choice (for personalization only) and a distinct 18+ age-eligibility gate that restricts access to mature "Private Private" content regardless of the demographic choice above.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'We use authentication and access controls intended to limit unauthorized access to your data. No service can guarantee absolute security.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: ['We may update this policy as the service changes. The "Last updated" date below reflects the most recent material change.'],
  },
  {
    heading: 'Contact',
    paragraphs: ['Super Great Ventures LLC — privacy@apparentlyyou.com'],
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
          <ThemedText style={styles.lastUpdated}>Last updated: October 21, 2026</ThemedText>

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
