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
// link. Reuses the exact same support address Settings already shows (SUPPORT_EMAIL), kept
// as its own constant here rather than imported cross-screen, since the two are small and
// independent (no shared behavior to drift out of sync, just one string).
const SUPPORT_EMAIL = 'support@apparentlyyou.com';

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
            <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              <ThemedText style={styles.emailLink}>{SUPPORT_EMAIL}</ThemedText>
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
  paragraph: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20 },
  emailLink: { color: Celestial.textPrimary, fontSize: 15, fontWeight: '700' },
});
