import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

export default function CompareScreen() {
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <BrandSignature variant="mark" />
          <ThemedText style={styles.heading}>Find out where you two line up.</ThemedText>
          <View style={styles.hero}>
            <ThemedText style={styles.heroEmoji}>✦ + ✦</ThemedText>
            <ThemedText style={styles.heroTitle}>You + someone else. This should be interesting.</ThemedText>
            <ThemedText style={styles.heroCopy}>
              Send a link. They answer a few questions. We&apos;ll reveal the chemistry and the chaos.
            </ThemedText>
            <Pressable style={styles.button} onPress={() => {}}>
              <ThemedText style={styles.buttonText}>Start a comparison</ThemedText>
            </Pressable>
          </View>
          <View style={styles.recent}>
            <ThemedText style={styles.sectionTitle}>Recent comparisons</ThemedText>
            <View style={styles.emptyRow}>
              <ThemedText style={styles.emptyIcon}>?</ThemedText>
              <View style={styles.emptyCopy}>
                <ThemedText style={styles.emptyTitle}>Your first one is waiting.</ThemedText>
                <ThemedText style={styles.emptyText}>Compare answers, not relationship futures.</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Slightly deeper than the app's own cream so the app column reads as a deliberate
    // object sitting on a page, instead of blending edge-to-edge on wide web viewports.
    // Invisible on native, where safeArea always fills the container exactly.
    backgroundColor: '#F0E8DD',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFF9F5',
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: 28,
        boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.two },
  heading: { color: Brand.ink, fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  hero: { backgroundColor: Brand.coral, borderRadius: 28, padding: Spacing.four, gap: Spacing.two, marginTop: Spacing.three },
  heroEmoji: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  heroCopy: { color: 'rgba(255,255,255,0.84)', fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: Spacing.two, alignItems: 'center', marginTop: Spacing.two },
  buttonText: { color: Brand.coral, fontSize: 14, fontWeight: '800' },
  recent: { gap: Spacing.two, marginTop: Spacing.three },
  sectionTitle: { color: Brand.ink, fontSize: 18, fontWeight: '800' },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: '#FFFFFF', borderRadius: 20, padding: Spacing.three },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, textAlign: 'center', paddingTop: 8, color: Brand.violet, backgroundColor: '#EEEAFE', fontSize: 20, fontWeight: '800' },
  emptyCopy: { flex: 1, gap: Spacing.one },
  emptyTitle: { color: Brand.ink, fontSize: 15, fontWeight: '800' },
  emptyText: { color: Brand.inkSecondary, fontSize: 13, lineHeight: 18 },
});