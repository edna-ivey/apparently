import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getQuizDefinition } from '@/data/quizzes';
import { PRIVATE_CATEGORIES, PRIVATE_LOCKED_CATALOG, type PrivateCatalogEntry } from '@/data/quizzes/private-catalog';
import type { PrivateQuizCategory } from '@/data/quizzes/types';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';

type CategoryFilter = 'All' | PrivateQuizCategory;

const CATEGORY_PILLS: CategoryFilter[] = ['All', ...PRIVATE_CATEGORIES];

// Apparently Private — a deliberately different room from free Explore. The ONE playable
// quiz here (secretly-love, access: 'private-preview') is a real QuizDefinition and runs
// through the exact same generic quiz/[quizId].tsx runner as every free quiz — no special
// casing. Everything else on this page is locked teaser metadata (private-catalog.ts) with no
// questions/scoring behind it yet; tapping one never navigates into the quiz runner, never
// pretends a purchase happened, and never shows a price — see the locked-info modal below.
export default function PrivateScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [lockedInfoEntry, setLockedInfoEntry] = useState<PrivateCatalogEntry | null>(null);

  const previewDefinition = getQuizDefinition('secretly-love');

  const previewMatchesCategory = selectedCategory === 'All' || selectedCategory === 'The Good Stuff';

  const visibleLockedEntries = useMemo(
    () => PRIVATE_LOCKED_CATALOG.filter((entry) => selectedCategory === 'All' || entry.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button" style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          <BrandSignature variant="mark" />

          <View style={styles.headingGroup}>
            <ThemedText style={styles.heading}>apparently private.</ThemedText>
            <ThemedText style={styles.headingSupport}>The questions get a little more personal in here.</ThemedText>
            <ThemedText style={styles.headingNote}>One preview is on us. The rest are staying mysterious for now.</ThemedText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORY_PILLS.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  style={[styles.category, isActive && styles.categoryActive]}
                  onPress={() => setSelectedCategory(category)}>
                  <ThemedText style={[styles.categoryText, isActive && styles.categoryTextActive]}>{category}</ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {previewMatchesCategory && previewDefinition && (
            <Pressable style={styles.previewCard} onPress={() => router.push('/quiz/secretly-love')}>
              <View style={styles.previewHeader}>
                <ThemedText style={styles.previewEyebrow}>THE GOOD STUFF</ThemedText>
                <View style={styles.previewBadge}>
                  <ThemedText style={styles.previewBadgeText}>FREE PREVIEW</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.previewTitle}>{previewDefinition.title}</ThemedText>
              <ThemedText style={styles.previewMeta}>{previewDefinition.meta} · Apparently Private</ThemedText>
              <View style={styles.previewCta}>
                <ThemedText style={styles.previewCtaText}>Take the preview →</ThemedText>
              </View>
            </Pressable>
          )}

          <View style={styles.lockedList}>
            {visibleLockedEntries.map((entry) => (
              <Pressable key={entry.id} style={styles.lockedCard} onPress={() => setLockedInfoEntry(entry)}>
                <View style={styles.lockedHeader}>
                  <ThemedText style={styles.lockedCategory}>{entry.category.toUpperCase()}</ThemedText>
                  <View style={styles.lockedBadgeRow}>
                    <ThemedText style={styles.lockedBadge}>PRIVATE</ThemedText>
                    <ThemedText style={styles.lockedBadgeDot}>·</ThemedText>
                    <ThemedText style={styles.lockedBadge}>LOCKED</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.lockedTitle}>{entry.title}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={lockedInfoEntry !== null} transparent animationType="fade" onRequestClose={() => setLockedInfoEntry(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLockedInfoEntry(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ThemedText style={styles.modalEyebrow}>PRIVATE</ThemedText>
            <ThemedText style={styles.modalTitle}>You&apos;re early.</ThemedText>
            <ThemedText style={styles.modalBody}>
              This one stays locked for now.{'\n'}More personal reads are coming.
            </ThemedText>
            <Pressable style={styles.modalCta} onPress={() => setLockedInfoEntry(null)}>
              <ThemedText style={styles.modalCtaText}>Back to Private →</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.plum },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Brand.plum,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: 28, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.four },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: 28 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { color: 'rgba(255,249,245,0.7)', fontSize: 26, lineHeight: 26, fontWeight: '600' },
  headingGroup: { gap: Spacing.one },
  heading: { color: Brand.cream, fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -0.7 },
  headingSupport: { color: 'rgba(255,249,245,0.8)', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  headingNote: { color: 'rgba(255,249,245,0.55)', fontSize: 12, fontWeight: '600', marginTop: Spacing.one },
  categoryList: { gap: Spacing.two, paddingVertical: Spacing.one },
  category: { backgroundColor: 'rgba(255,249,245,0.08)', borderRadius: 99, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  categoryActive: { backgroundColor: Brand.coral, borderColor: Brand.coral },
  categoryText: { color: 'rgba(255,249,245,0.85)', fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: Brand.cream },
  // The hero card — visually the strongest thing on the page, matching a "gateway quiz" job.
  previewCard: { backgroundColor: Brand.coral, borderRadius: 26, padding: Spacing.four, gap: Spacing.two },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  previewEyebrow: { color: 'rgba(36,1,31,0.65)', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  previewBadge: { backgroundColor: 'rgba(36,1,31,0.18)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  previewBadgeText: { color: Brand.plum, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  previewTitle: { color: Brand.plum, fontSize: 25, lineHeight: 30, fontWeight: '800' },
  previewMeta: { color: 'rgba(36,1,31,0.65)', fontSize: 13, fontWeight: '600' },
  previewCta: { alignSelf: 'flex-start', backgroundColor: Brand.plum, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  previewCtaText: { color: Brand.cream, fontSize: 14, fontWeight: '800' },
  lockedList: { gap: Spacing.two },
  // Premium plum/violet variations, never grey — locked should look tempting, not disabled.
  lockedCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 20, padding: Spacing.three, gap: Spacing.one, borderWidth: 1, borderColor: 'rgba(255,249,245,0.12)' },
  lockedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  lockedCategory: { color: Brand.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, flexShrink: 1 },
  lockedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  lockedBadge: { color: 'rgba(255,249,245,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  lockedBadgeDot: { color: 'rgba(255,249,245,0.35)', fontSize: 10, fontWeight: '800' },
  lockedTitle: { color: Brand.cream, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(23,21,29,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  modalCard: { backgroundColor: Brand.plum, borderRadius: 24, padding: Spacing.five, gap: Spacing.one, maxWidth: 360, width: '100%', borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  modalEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  modalTitle: { color: Brand.cream, fontSize: 24, fontWeight: '800', marginTop: Spacing.one },
  modalBody: { color: 'rgba(255,249,245,0.75)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: Spacing.one },
  modalCta: { alignSelf: 'flex-start', backgroundColor: Brand.coral, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.three },
  modalCtaText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
});
