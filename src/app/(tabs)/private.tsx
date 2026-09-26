import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { getQuizDefinition } from '@/data/quizzes';
import { PRIVATE_CATEGORIES, PRIVATE_LOCKED_CATALOG, type PrivateCatalogEntry } from '@/data/quizzes/private-catalog';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import type { PrivateQuizCategory, QuizDefinition } from '@/data/quizzes/types';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { usePremiumStatus } from '@/services/purchases-service';

// Build 8 Pass 2: Private became the LOCKED-position center primary tab (Today / Explore /
// Private / Compare / You), replacing what used to be a modal-style push destination at the
// same /private URL (src/app/private.tsx, now removed — see that removal's own commit message
// for the route-collision proof this migration is based on). Moving the file here is what
// changes the URL's underlying screen; because Expo Router resolves a route group's file to
// the SAME pathless URL either way, /private itself is unchanged, so every existing
// router.push('/private') call site (Today's Private Drop card, Explore's private portal,
// the quiz runner's onBackToPrivate) keeps working with zero changes needed there — the same
// already-proven pattern this app already uses for router.push('/you')/('/explore').
//
// Structural adaptation only: the old top-row "×" dismiss button is gone (a persistent tab has
// no "close" action — you simply tap another tab, exactly like Today/Explore/Compare/You never
// had one), and top/bottom spacing now follows the same useResponsiveTopInset()/BottomTabInset
// convention every other tab already uses, so Private clears the floating web nav and native
// bottom tab bar identically to its siblings. Every other line of Pass 1 logic/copy below is
// unchanged: the free/subscriber branching, the open-quiz cards, the locked catalog, and the
// coming-soon modal are byte-for-byte the same behavior as Pass 1, just inside a tab shell.

type CategoryFilter = 'All' | PrivateQuizCategory;

const CATEGORY_PILLS: CategoryFilter[] = ['All', ...PRIVATE_CATEGORIES];

// The current OPEN/FREE PREVIEW quizzes on Apparently Private's landing — data-driven and
// ordered, so adding a future one is a one-line change here, never a new hardcoded card block.
// Each is a real QuizDefinition and runs through the exact same generic quiz/[quizId].tsx
// runner as every free quiz — no special casing. Everything else on this page is locked
// teaser metadata (private-catalog.ts) with no questions/scoring behind it yet; tapping one
// never navigates into the quiz runner, never pretends a purchase happened, and never shows a
// price — see the locked-info modal below.
//
// secretly-love was an earlier active preview; it's no longer listed here but stays fully
// registered (see quizzes/index.ts) so its own historical completions, "See result", and old
// shared-result links keep working exactly as before — removing an id from this array never
// touches that quiz's own definition or history.
const OPEN_PRIVATE_QUIZ_IDS = ['keep-you-around', 'be-so-serious'];

type OpenQuizCard = {
  id: string;
  definition: QuizDefinition;
  completed: boolean;
  lastResultTitle: string | null;
};

export default function PrivateScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [lockedInfoEntry, setLockedInfoEntry] = useState<PrivateCatalogEntry | null>(null);

  // Real RevenueCat entitlement truth only (never the client tester-access build flag — see
  // purchases-service.ts's useEffectivePremium correction). The pre-subscription sales pitch
  // ("One preview is on us...") must never show to someone who already subscribed; a
  // real-money subscriber reading their own paywall pitch back at them reads as broken, not
  // reassuring.
  const premium = usePremiumStatus();
  const isSubscriber = premium.status === 'premium';

  // Same persisted quiz history Explore already reads from — no second completion system.
  // One useQuizResults() call (a hook, so it can't live inside the loop below) feeds every
  // open quiz card's own independent completion state; reactive, so finishing a preview and
  // landing back on Private in the same session shows it as completed immediately.
  const quizResults = useQuizResults();
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  const openQuizCards: OpenQuizCard[] = useMemo(() => {
    return OPEN_PRIVATE_QUIZ_IDS.map((id) => {
      const definition = getQuizDefinition(id);
      if (!definition) {
        return null;
      }
      // Mirrors useLatestQuizResult's own logic exactly (results are appended in completion
      // order, so the last match for this quizId is always the latest) — just computed once
      // per quiz id from the single quizResults array above instead of one hook call each.
      const matches = quizResults === 'loading' ? [] : quizResults.filter((record) => record.quizId === id);
      const latest = matches.length > 0 ? matches[matches.length - 1] : null;
      const completed = latest !== null;
      const lastResultTitle = completed ? resolveResultDisplayTitle(definition, latest.resultId) ?? latest.resultTitle : null;
      return { id, definition, completed, lastResultTitle };
    }).filter((card): card is OpenQuizCard => card !== null);
  }, [quizResults]);

  const visibleQuizCards = useMemo(
    () => openQuizCards.filter((card) => selectedCategory === 'All' || card.definition.category === selectedCategory),
    [openQuizCards, selectedCategory],
  );

  const visibleLockedEntries = useMemo(
    () => PRIVATE_LOCKED_CATALOG.filter((entry) => selectedCategory === 'All' || entry.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          <BrandSignature variant="mark" />

          <View style={styles.headingGroup}>
            <ThemedText style={styles.heading}>apparently private.</ThemedText>
            {isSubscriber ? (
              <>
                {/* Approved core positioning (also used on paywall.tsx) — a subscriber never
                    sees the pre-subscription sales pitch below read back at them. */}
                <ThemedText style={styles.headingSupport}>The questions stop being polite in here.</ThemedText>
                <ThemedText style={styles.headingNote}>
                  Some will gas you up. Some will clock you. Some might have you staring at the ceiling for a minute. {'\u{1F440}'}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.headingSupport}>The questions get a little more personal in here.</ThemedText>
                <ThemedText style={styles.headingNote}>One preview is on us. The rest are staying mysterious for now.</ThemedText>
              </>
            )}
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

          {visibleQuizCards.map((card) => (
            <View key={card.id} style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <ThemedText style={styles.previewEyebrow}>{card.definition.category.toUpperCase()}</ThemedText>
                {/* A subscriber already has full access — this was never a "free preview" FOR
                    THEM, so the badge only appears for a completed result or for a
                    non-subscriber (preserving today's free-tier semantics unchanged). */}
                {(card.completed || !isSubscriber) && (
                  <View style={styles.previewBadge}>
                    <ThemedText style={styles.previewBadgeText}>{card.completed ? 'COMPLETED' : 'FREE PREVIEW'}</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={styles.previewTitle}>{card.definition.title}</ThemedText>
              <ThemedText style={styles.previewMeta}>{card.definition.meta} · Apparently Private</ThemedText>
              {card.completed && card.lastResultTitle ? (
                <ThemedText style={styles.previewLastResult}>Your result: {card.lastResultTitle}</ThemedText>
              ) : null}
              {card.completed ? (
                <View style={styles.previewCtaRow}>
                  <Pressable
                    style={[styles.previewCta, styles.previewCtaInRow]}
                    onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: card.id, view: 'result' } })}>
                    <ThemedText style={styles.previewCtaText}>See result →</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.previewCtaSecondary}
                    onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: card.id } })}>
                    <ThemedText style={styles.previewCtaSecondaryText}>Retake →</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.previewCta}
                  onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: card.id } })}>
                  {/* A subscriber already has full access — this was never a "preview" FOR
                      THEM (it just happens to also be free for everyone else). */}
                  <ThemedText style={styles.previewCtaText}>{isSubscriber ? 'Take the quiz →' : 'Take the preview →'}</ThemedText>
                </Pressable>
              )}
            </View>
          ))}

          <View style={styles.lockedList}>
            {visibleLockedEntries.map((entry) => (
              <Pressable key={entry.id} style={styles.lockedCard} onPress={() => setLockedInfoEntry(entry)}>
                <View style={styles.lockedHeader}>
                  <ThemedText style={styles.lockedCategory}>{entry.category.toUpperCase()}</ThemedText>
                  {/* A subscriber's paid access didn't fail to unlock this — it simply isn't
                      built yet. "LOCKED" (implying a subscription problem) is only accurate
                      for a non-subscriber; a subscriber sees "COMING SOON" instead. */}
                  {isSubscriber ? (
                    <ThemedText style={styles.lockedBadge}>COMING SOON</ThemedText>
                  ) : (
                    <View style={styles.lockedBadgeRow}>
                      <ThemedText style={styles.lockedBadge}>PRIVATE</ThemedText>
                      <ThemedText style={styles.lockedBadgeDot}>·</ThemedText>
                      <ThemedText style={styles.lockedBadge}>LOCKED</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.lockedTitle}>{entry.title}</ThemedText>
                <ThemedText style={styles.lockedSubtitle}>{entry.subtitle}</ThemedText>
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
            {/* A subscriber's paid access didn't fail here — this simply isn't built yet.
                "stays locked" wrongly implies a subscription problem for someone who already
                pays; a subscriber gets the honest "not live yet" framing instead. */}
            <ThemedText style={styles.modalBody}>
              {isSubscriber ? (
                <>This one isn&apos;t live yet.{'\n'}More Private reads are coming.</>
              ) : (
                <>This one stays locked for now.{'\n'}More personal reads are coming.</>
              )}
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
      web: { marginVertical: 28, borderRadius: Radius.xl, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.four },
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
  previewLastResult: { color: 'rgba(36,1,31,0.75)', fontSize: 13, fontWeight: '700', marginTop: -Spacing.one },
  previewCtaRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  previewCta: { alignSelf: 'flex-start', backgroundColor: Brand.plum, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  previewCtaInRow: { marginTop: 0 },
  previewCtaText: { color: Brand.cream, fontSize: 14, fontWeight: '800' },
  previewCtaSecondary: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(36,1,31,0.14)',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  previewCtaSecondaryText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
  lockedList: { gap: Spacing.two },
  // Premium plum/violet variations, never grey — locked should look tempting, not disabled.
  lockedCard: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 20, padding: Spacing.three, gap: Spacing.one, borderWidth: 1, borderColor: 'rgba(255,249,245,0.12)' },
  lockedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  lockedCategory: { color: Brand.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, flexShrink: 1 },
  lockedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  lockedBadge: { color: 'rgba(255,249,245,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  lockedBadgeDot: { color: 'rgba(255,249,245,0.35)', fontSize: 10, fontWeight: '800' },
  lockedTitle: { color: Brand.cream, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  lockedSubtitle: { color: 'rgba(255,249,245,0.6)', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(23,21,29,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  modalCard: { backgroundColor: Brand.plum, borderRadius: 24, padding: Spacing.five, gap: Spacing.one, maxWidth: 360, width: '100%', borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  modalEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  modalTitle: { color: Brand.cream, fontSize: 24, fontWeight: '800', marginTop: Spacing.one },
  modalBody: { color: 'rgba(255,249,245,0.75)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: Spacing.one },
  modalCta: { alignSelf: 'flex-start', backgroundColor: Brand.coral, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.three },
  modalCtaText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
});
