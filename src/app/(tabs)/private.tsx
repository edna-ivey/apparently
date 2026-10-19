import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { Celestial, CelestialType, Panel } from '@/components/today/celestial';
import { isAdultEligible, useAgeEligibility } from '@/data/age-eligibility';
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
const PREMIUM_PRIVATE_QUIZ_IDS = [
  'love-soulmates-ready',
  'career-ambition-how-bad',
  'career-ambition-proving',
  'hidden-you-wrong',
  'life-match-dream-life',
  'style-vibe-intimidating',
  'private-private-trouble',
];

type OpenQuizCard = {
  id: string;
  definition: QuizDefinition;
  completed: boolean;
  lastResultTitle: string | null;
};

// Build 15 fix: the landing copy previously hardcoded "One preview is on us" while
// OPEN_PRIVATE_QUIZ_IDS actually lists two free-preview quizzes, both rendered with their own
// "FREE PREVIEW" badge below — a real mismatch between copy and actual entitlement, not a
// stylistic choice. Derives the real count from the same array every card below reads from,
// so the two can never drift out of sync again; the access rules themselves (which quizzes are
// open) are completely unchanged.
const OPEN_PREVIEW_COPY =
  OPEN_PRIVATE_QUIZ_IDS.length === 1
    ? 'One preview is on us. The rest are staying mysterious for now.'
    : `${OPEN_PRIVATE_QUIZ_IDS.length} previews are on us. The rest are staying mysterious for now.`;

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

  // Build 16: premium entitlement never substitutes for the 18+ gate on the one 'Private
  // Private. 😈' category quiz -- a subscriber who isn't confirmed 18+ still doesn't get it
  // listed as playable here (the quiz runner's own gate, backed by the server-side
  // is_adult_eligible() check, is the real authorization either way -- this only controls
  // what this screen shows).
  const ageEligibility = useAgeEligibility();
  const canAccessPrivatePrivate = isSubscriber && isAdultEligible(ageEligibility);

  // Same persisted quiz history Explore already reads from — no second completion system.
  // One useQuizResults() call (a hook, so it can't live inside the loop below) feeds every
  // open quiz card's own independent completion state; reactive, so finishing a preview and
  // landing back on Private in the same session shows it as completed immediately.
  const quizResults = useQuizResults();
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  const openQuizCards: OpenQuizCard[] = useMemo(() => {
    const premiumIds = isSubscriber ? PREMIUM_PRIVATE_QUIZ_IDS.filter((id) => id !== 'private-private-trouble' || canAccessPrivatePrivate) : [];
    const playableIds = [...OPEN_PRIVATE_QUIZ_IDS, ...premiumIds];
    return playableIds.map((id) => {
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
  }, [quizResults, isSubscriber, canAccessPrivatePrivate]);

  const visibleQuizCards = useMemo(
    () => openQuizCards.filter((card) => selectedCategory === 'All' || card.definition.category === selectedCategory),
    [openQuizCards, selectedCategory],
  );

  // Build 16: the "Private Private. 😈" filter pill itself never appears for a non-adult-
  // eligible device -- a 13-17 year old shouldn't be able to discover the category even via
  // its own filter chip once every entry inside it is already hidden above.
  const visibleCategoryPills = useMemo(
    () => CATEGORY_PILLS.filter((category) => category !== 'Private Private. 😈' || isAdultEligible(ageEligibility)),
    [ageEligibility],
  );

  const visibleLockedEntries = useMemo(
    () =>
      PRIVATE_LOCKED_CATALOG.filter(
        (entry) =>
          (!isSubscriber || !PREMIUM_PRIVATE_QUIZ_IDS.includes(entry.id)) &&
          // Build 16: every 'Private Private. 😈' teaser (not just the one real quiz behind
          // it, 'private-private-trouble') is hidden from a non-adult-eligible device -- a
          // 13-17 year old never sees so much as a locked tease for this category.
          (entry.category !== 'Private Private. 😈' || isAdultEligible(ageEligibility)) &&
          (selectedCategory === 'All' || entry.category === selectedCategory),
      ),
    [selectedCategory, isSubscriber, ageEligibility],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.wordmark}>apparently you.</ThemedText>

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
                <ThemedText style={styles.headingNote}>{OPEN_PREVIEW_COPY}</ThemedText>
              </>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {visibleCategoryPills.map((category) => {
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

          <View style={styles.previewList}>
            {visibleQuizCards.map((card) => (
              <Pressable
                key={card.id}
                style={[Panel.shell, styles.previewCard]}
                onPress={() =>
                  router.push({ pathname: '/quiz/[quizId]', params: card.completed ? { quizId: card.id, view: 'result' } : { quizId: card.id } })
                }>
                <View style={[Panel.glow, styles.previewGlow]} />
                <View style={styles.previewHeader}>
                  <ThemedText style={[Panel.eyebrow, styles.previewEyebrow]}>{card.definition.category.toUpperCase()}</ThemedText>
                  {/* A subscriber already has full access — this was never a "free preview" FOR
                      THEM, so the badge only appears for a completed result or for a
                      non-subscriber (preserving today's free-tier semantics unchanged). */}
                  {(card.completed || !isSubscriber) && (
                    <View style={styles.previewBadge}>
                      <ThemedText style={styles.previewBadgeText}>{card.completed ? 'COMPLETED' : 'FREE PREVIEW'}</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.previewTitle}>&ldquo;{card.definition.title}&rdquo;</ThemedText>
                <ThemedText style={styles.previewMeta}>{card.definition.meta} · Apparently Private</ThemedText>
                {card.completed && card.lastResultTitle ? (
                  <ThemedText style={styles.previewLastResult}>Your result: {card.lastResultTitle}</ThemedText>
                ) : null}
                {card.completed ? (
                  <View style={styles.previewCtaRow}>
                    <View style={[styles.previewCta, styles.previewCtaInRow]}>
                      <ThemedText style={styles.previewCtaText}>See result →</ThemedText>
                    </View>
                    <Pressable
                      style={styles.previewCtaSecondary}
                      onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: card.id } })}>
                      <ThemedText style={styles.previewCtaSecondaryText}>Retake →</ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.previewCta}>
                    {/* A subscriber already has full access — this was never a "preview" FOR
                        THEM (it just happens to also be free for everyone else). */}
                    <ThemedText style={styles.previewCtaText}>{isSubscriber ? 'Take the quiz →' : 'Take the preview →'}</ThemedText>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

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
  // Already the approved darker-plum Apparently Private identity — unchanged value
  // (Celestial.background === Brand.plum), only switched to the shared token for consistency
  // with every other screen's container/safeArea convention.
  container: { flex: 1, backgroundColor: Celestial.background },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: { marginVertical: 28, borderRadius: Radius.xl, overflow: 'hidden' },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  headingGroup: { gap: 2 },
  // Build 15: serif italic editorial treatment, matching the unified type scale -- "apparently
  // private." reads as an intriguing invitation, not a bold app-store listing title.
  heading: { ...CelestialType.editorialHeadline, fontSize: 30, lineHeight: 35 },
  headingSupport: { ...CelestialType.body, marginTop: 2 },
  headingNote: { ...CelestialType.caption, marginTop: 2 },
  categoryList: { gap: Spacing.two, paddingVertical: Spacing.one },
  category: { backgroundColor: 'rgba(255,249,245,0.06)', borderRadius: 99, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderColor: 'rgba(255,249,245,0.12)' },
  categoryActive: { backgroundColor: 'rgba(255,121,95,0.22)', borderColor: Brand.coral },
  categoryText: { color: 'rgba(255,249,245,0.7)', fontSize: 12.5, fontWeight: '800' },
  categoryTextActive: { color: Brand.coral },
  previewList: { gap: Spacing.two },
  // Build 15: replaces the solid-coral rectangle with the same dark-glass Panel shell every
  // other celestial card uses -- coral stays a soft accent glow + border tint, not the whole
  // fill, so it reads as "intimate, sophisticated" rather than a loud flat slab.
  previewCard: { gap: Spacing.one, borderColor: 'rgba(255,121,95,0.32)' },
  previewGlow: { backgroundColor: 'rgba(255,121,95,0.22)' },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  previewEyebrow: { color: Brand.coral },
  previewBadge: { backgroundColor: 'rgba(255,121,95,0.18)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  previewBadgeText: { color: Brand.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  previewTitle: { ...CelestialType.question, fontSize: 20, lineHeight: 26, marginTop: 2 },
  previewMeta: { ...CelestialType.caption },
  previewLastResult: { color: 'rgba(255,249,245,0.65)', fontSize: 13, fontWeight: '700' },
  previewCtaRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  previewCta: { alignSelf: 'flex-start', backgroundColor: Brand.coral, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  previewCtaInRow: { marginTop: 0 },
  previewCtaText: { ...CelestialType.button, color: Brand.plum },
  previewCtaSecondary: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  previewCtaSecondaryText: { ...CelestialType.button, color: Celestial.textPrimary },
  lockedList: { gap: Spacing.two },
  // Premium plum/violet variations, never grey — locked should look tempting, not disabled.
  lockedCard: {
    backgroundColor: 'rgba(255,249,245,0.045)',
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: 'rgba(255,249,245,0.1)',
  },
  lockedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  lockedCategory: { color: 'rgba(255,158,214,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, flexShrink: 1 },
  lockedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  lockedBadge: { color: 'rgba(255,249,245,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  lockedBadgeDot: { color: 'rgba(255,249,245,0.3)', fontSize: 10, fontWeight: '800' },
  lockedTitle: { ...CelestialType.question, fontSize: 17, lineHeight: 22 },
  lockedSubtitle: { ...CelestialType.caption },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(23,21,29,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  modalCard: { backgroundColor: Brand.plum, borderRadius: 24, padding: Spacing.five, gap: Spacing.one, maxWidth: 360, width: '100%', borderWidth: 1, borderColor: 'rgba(255,249,245,0.14)' },
  modalEyebrow: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  modalTitle: { color: Brand.cream, fontSize: 24, fontWeight: '800', marginTop: Spacing.one },
  modalBody: { color: 'rgba(255,249,245,0.75)', fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: Spacing.one },
  modalCta: { alignSelf: 'flex-start', backgroundColor: Brand.coral, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.three },
  modalCtaText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
});
