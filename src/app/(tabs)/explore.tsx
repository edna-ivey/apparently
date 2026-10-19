import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { Elevation, Radius } from '@/constants/design-system';
import { Celestial, CelestialType, CelestialWash, Panel, PortalRings } from '@/components/today/celestial';
import { getQuizDefinition, type FreeQuizCategory } from '@/data/quizzes';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

// FreeQuizCategory specifically — NOT the general QuizCategory union — so an Apparently
// Private category (e.g. "Love & Soulmates") can never accidentally leak into this pill row.
type CategoryFilter = 'All' | FreeQuizCategory;

// "All" first and selected by default, per spec.
const CATEGORY_PILLS: CategoryFilter[] = ['All', 'Love', 'Friendship', 'Food', 'Money', 'Nostalgia', 'Ridiculous'];

// One card style per real, registered FREE quiz — title/category/question count are read from
// the quiz's own definition below (single source of truth, no duplicated copy); this array
// only supplies the visual, card-only bits the definitions don't carry. secretly-love is
// deliberately excluded — it lives in Apparently Private (see private.tsx), never here.
const QUIZ_CARD_STYLE: { id: string; color: string; accent: string }[] = [
  { id: 'petty', color: '#FFE5EF', accent: Brand.pink },
  { id: 'dating', color: '#FFE3E8', accent: '#E0527A' },
  { id: 'ick', color: '#FFE9E3', accent: '#D9603C' },
  { id: 'friendship', color: '#DDF5EE', accent: '#318F7D' },
  { id: 'group-chat', color: '#E1F7EF', accent: '#1F9E82' },
  { id: 'food-order', color: '#FFF0D2', accent: '#C97A2E' },
  { id: 'one-bite', color: '#FFF6DE', accent: '#B8860B' },
  { id: 'spending', color: '#E8F1FF', accent: '#3B6FB6' },
  { id: 'unexpected-money', color: '#E3ECFF', accent: '#2F53A6' },
  { id: 'era', color: '#F3E8FF', accent: '#7C4DBE' },
  { id: 'kid-you', color: '#F7EAFF', accent: '#9256C9' },
  { id: 'crisis', color: '#E8E3FF', accent: Brand.violet },
];

// The one Featured quiz per category pill, per the approved mapping — still one quiz each,
// the second quiz in every category surfaces in the library below instead.
const FEATURED_QUIZ_ID: Record<CategoryFilter, string> = {
  All: 'crisis',
  Love: 'dating',
  Friendship: 'friendship',
  Food: 'food-order',
  Money: 'spending',
  Nostalgia: 'era',
  Ridiculous: 'petty',
};

type QuizCard = {
  id: string;
  title: string;
  category: FreeQuizCategory;
  meta: string;
  color: string;
  accent: string;
  completed: boolean;
  lastResultTitle: string | null;
};

export default function ExploreScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  // Local UI state — no navigation param or backend needed for a same-screen filter toggle.
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Reads the SAME persisted quiz-results history the quiz runner writes to — no second
  // completion store. Reactive, so finishing a quiz and landing back on Explore in the same
  // session shows it as completed immediately, no restart needed.
  const quizResults = useQuizResults();
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  // A quiz is "completed" if history contains at least one record for its id. Records are
  // appended in completion order, so iterating forward and overwriting per quizId naturally
  // leaves each quiz's LATEST completion as the final map entry — no sort/reverse needed.
  const latestResultByQuizId = useMemo(() => {
    const map = new Map<string, { resultId: string; resultTitle: string }>();
    if (quizResults !== 'loading') {
      quizResults.forEach((record) => map.set(record.quizId, record));
    }
    return map;
  }, [quizResults]);

  const quizCards: QuizCard[] = useMemo(
    () =>
      QUIZ_CARD_STYLE.map((style) => {
        const definition = getQuizDefinition(style.id)!;
        const latest = latestResultByQuizId.get(style.id);
        const lastResultTitle = latest ? resolveResultDisplayTitle(definition, latest.resultId) ?? latest.resultTitle : null;
        return {
          id: style.id,
          title: definition.title,
          // Safe: QUIZ_CARD_STYLE only ever lists free-access quiz ids (asserted, not
          // user input) — Apparently Private's secretly-love is deliberately excluded above.
          category: definition.category as FreeQuizCategory,
          meta: `${definition.questions.length} questions · ${definition.category}`,
          color: style.color,
          accent: style.accent,
          completed: !!latest,
          lastResultTitle,
        };
      }),
    [latestResultByQuizId],
  );

  const featuredQuizId = FEATURED_QUIZ_ID[selectedCategory];
  const featuredQuiz = quizCards.find((quiz) => quiz.id === featuredQuizId)!;
  const featuredDefinition = getQuizDefinition(featuredQuizId)!;
  const featuredEyebrow = selectedCategory === 'All' ? 'FEATURED QUIZ' : `FEATURED IN ${selectedCategory.toUpperCase()}`;

  // Never repeats the Featured quiz below, and never shows a quiz from an unrelated category —
  // "All" is the only pill that shows the rest of the full library. A category with only its
  // Featured quiz (Love, Friendship, Food, Money, Nostalgia today) simply renders nothing here,
  // which is expected rather than backfilled with unrelated quizzes. The Featured card itself
  // stays put regardless of completion — completing it never hides or archives it.
  const regularQuizzes = quizCards.filter(
    (quiz) => quiz.id !== featuredQuizId && (selectedCategory === 'All' || quiz.category === selectedCategory),
  );

  // Only the "All" tab splits into two sections; category tabs render one combined list (see
  // the empty-heading handling below for what happens when that list is empty).
  const incompleteQuizzes = selectedCategory === 'All' ? regularQuizzes.filter((quiz) => !quiz.completed) : regularQuizzes;
  const completedQuizzes = selectedCategory === 'All' ? regularQuizzes.filter((quiz) => quiz.completed) : [];
  // "All" keeps its existing heading; every category pill gets its own "More in <Category>"
  // heading instead — only rendered at all when incompleteQuizzes is non-empty (see below).
  const incompleteSectionTitle = selectedCategory === 'All' ? 'Currently irresistible' : `More in ${selectedCategory}`;

  const renderQuizCard = (quiz: QuizCard) => (
    <Pressable
      key={quiz.id}
      style={[styles.quizCard, { borderColor: `${quiz.accent}55` }]}
      onPress={() => router.push(`/quiz/${quiz.id}`)}>
      <View style={[styles.quizGlow, { backgroundColor: quiz.color }]} />
      <View style={styles.quizHeader}>
        <View style={[styles.quizDot, { backgroundColor: quiz.accent }]} />
        <View style={[styles.quizBadge, quiz.completed && styles.quizBadgeCompleted]}>
          <ThemedText style={[styles.quizBadgeText, quiz.completed && styles.quizBadgeTextCompleted]}>
            {quiz.completed ? 'COMPLETED' : 'Free'}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.quizTitle}>{quiz.title}</ThemedText>
      <ThemedText style={styles.quizMeta}>{quiz.meta}</ThemedText>
      {quiz.completed && quiz.lastResultTitle ? (
        <ThemedText style={styles.quizLastResult}>Last result: {quiz.lastResultTitle}</ThemedText>
      ) : null}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <PortalRings />
        <CelestialWash />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          {/* BrandSignature's 'mark' variant renders magnetic-loop.png, which has a baked-in
              cream/white background (no alpha channel) -- a visible white square on this dark
              celestial page. Plain wordmark text instead, matching Today/You's own fix. */}
          <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
          <View style={styles.headingGroup}>
            <ThemedText style={styles.heading}>You weren&apos;t stopping at one.</ThemedText>
            <ThemedText style={styles.headingSupport}>Good. Neither were we.</ThemedText>
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
          <Pressable style={[Panel.shell, styles.featured]} onPress={() => router.push(`/quiz/${featuredQuizId}`)}>
            <View style={[Panel.glow, styles.featuredGlow]} />
            <View style={styles.featuredHeader}>
              <ThemedText style={[Panel.eyebrow, styles.featuredEyebrow]}>{featuredEyebrow}</ThemedText>
              <View style={styles.featuredBadge}>
                <ThemedText style={styles.featuredBadgeText}>{featuredQuiz.completed ? 'COMPLETED' : 'FREE'}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.featuredTitle}>&ldquo;{featuredQuiz.title}&rdquo;</ThemedText>
            <ThemedText style={styles.featuredMeta}>{featuredDefinition.meta} · Personality · Free</ThemedText>
            {featuredQuiz.completed && featuredQuiz.lastResultTitle ? (
              <ThemedText style={styles.featuredLastResult}>Last result: {featuredQuiz.lastResultTitle}</ThemedText>
            ) : null}
            <View style={styles.startButton}>
              <ThemedText style={styles.startText}>{featuredQuiz.completed ? 'Retake quiz →' : 'Take the quiz →'}</ThemedText>
            </View>
          </Pressable>
          <Pressable style={[Panel.shell, styles.privatePortal]} onPress={() => router.push('/private')}>
            <View style={Panel.glow} />
            <ThemedText style={[Panel.eyebrow, styles.privatePortalEyebrow]}>APPARENTLY PRIVATE</ThemedText>
            <ThemedText style={styles.privatePortalTitle}>The questions get a little more personal in here.</ThemedText>
            <ThemedText style={styles.privatePortalSupport}>One preview unlocked.</ThemedText>
            <View style={styles.privatePortalCta}>
              <ThemedText style={styles.privatePortalCtaText}>Enter Private →</ThemedText>
            </View>
          </Pressable>
          <View style={styles.quizList}>
            {incompleteQuizzes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>{incompleteSectionTitle}</ThemedText>
                </View>
                {incompleteQuizzes.map(renderQuizCard)}
              </>
            )}
            {completedQuizzes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Completed</ThemedText>
                </View>
                {completedQuizzes.map(renderQuizCard)}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Same celestial-deeper-than-plum role index.tsx uses for its own container — a touch
    // darker than Celestial.background so the app column reads as a deliberate object on wide
    // web viewports. Invisible on native.
    backgroundColor: '#17000F',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: Radius.xl,
        boxShadow: Elevation.shell,
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  // Build 15: the opening line is a witty editorial headline ("You weren't stopping at
  // one.") -- serif italic per the unified type scale, noticeably smaller than the old
  // 35px bold-sans heading so it reads as a considered voice, not a shouted banner.
  headingGroup: { gap: 2 },
  heading: CelestialType.editorialHeadline,
  headingSupport: { ...CelestialType.body, marginTop: 2 },
  categoryList: { gap: Spacing.two, paddingVertical: Spacing.one },
  category: {
    backgroundColor: Celestial.glassFill,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
  },
  categoryActive: { backgroundColor: Brand.pink, borderColor: Brand.pink },
  categoryText: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: '#FFFFFF' },
  // Build 15: replaces the old solid-violet rectangle -- the same dark-glass Panel shell every
  // other celestial card uses, with violet as a soft accent glow rather than the whole fill.
  // Still visually the most important card on the page (the Panel.glow + violet-tinted border
  // give it real presence) without reading as a giant flat color slab.
  featured: { gap: Spacing.two, borderColor: 'rgba(121,100,232,0.35)' },
  featuredGlow: { backgroundColor: 'rgba(121,100,232,0.22)' },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  featuredEyebrow: { color: '#C9BFFF' },
  featuredBadge: { backgroundColor: 'rgba(121,100,232,0.22)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  featuredBadgeText: { color: '#C9BFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  featuredTitle: { ...CelestialType.question, fontSize: 21, lineHeight: 27, marginTop: 2 },
  featuredMeta: { ...CelestialType.caption, color: 'rgba(201,191,255,0.8)' },
  featuredLastResult: { color: '#F1EEFF', fontSize: 12, fontWeight: '700' },
  startButton: { alignSelf: 'flex-start', backgroundColor: Brand.violet, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  startText: { ...CelestialType.button, color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  sectionTitle: CelestialType.heading,
  quizList: { gap: Spacing.two },
  // Dark glass card, same language as every other celestial card — each quiz keeps its own
  // identity via a low-opacity color wash (quizGlow) and a solid accent dot/border tint,
  // rather than a solid pastel fill that would fight the dark ground.
  quizCard: {
    position: 'relative',
    minHeight: 116,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
    backgroundColor: Celestial.glassFill,
    overflow: 'hidden',
  },
  quizGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.16,
  },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  quizDot: { width: 12, height: 12, borderRadius: 6 },
  quizBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  quizBadgeCompleted: { backgroundColor: Brand.gold },
  quizBadgeText: { color: Celestial.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  quizBadgeTextCompleted: { color: Brand.plum },
  quizTitle: { color: Celestial.textPrimary, fontSize: 18, lineHeight: 22, fontWeight: '800', maxWidth: 260 },
  quizMeta: { color: Celestial.textSecondary, fontSize: 12, fontWeight: '600' },
  quizLastResult: { color: Celestial.textMuted, fontSize: 12, fontWeight: '700' },
  // The Private portal teaser — same Panel shell Today's Featured Quiz/Creature cards use, so
  // it reads as a continuation of the same family rather than a different component, with its
  // own coral accent (matching Private's own identity) instead of the shared gold.
  privatePortal: { gap: Spacing.one, borderColor: 'rgba(255,121,95,0.3)' },
  privatePortalEyebrow: { color: Brand.coral },
  privatePortalTitle: { color: Celestial.textPrimary, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: Spacing.one },
  privatePortalSupport: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '600' },
  privatePortalCta: { alignSelf: 'flex-start', backgroundColor: Brand.coral, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  privatePortalCtaText: { color: Brand.cream, fontSize: 14, fontWeight: '800' },
});
