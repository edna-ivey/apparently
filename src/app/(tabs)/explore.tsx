import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { getQuizDefinition, type QuizCategory } from '@/data/quizzes';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

type CategoryFilter = 'All' | QuizCategory;

// "All" first and selected by default, per spec.
const CATEGORY_PILLS: CategoryFilter[] = ['All', 'Love', 'Friendship', 'Food', 'Money', 'Nostalgia', 'Ridiculous'];

// One card style per real, registered quiz — title/category/question count are read from the
// quiz's own definition below (single source of truth, no duplicated copy); this array only
// supplies the visual, card-only bits the definitions don't carry.
const QUIZ_CARD_STYLE: { id: string; color: string; accent: string }[] = [
  { id: 'petty', color: '#FFE5EF', accent: Brand.pink },
  { id: 'dating', color: '#FFE3E8', accent: '#E0527A' },
  { id: 'friendship', color: '#DDF5EE', accent: '#318F7D' },
  { id: 'food-order', color: '#FFF0D2', accent: '#C97A2E' },
  { id: 'spending', color: '#E8F1FF', accent: '#3B6FB6' },
  { id: 'era', color: '#F3E8FF', accent: '#7C4DBE' },
  { id: 'crisis', color: '#E8E3FF', accent: Brand.violet },
];

// The one Featured quiz per category pill, per the approved mapping.
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
  category: QuizCategory;
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
          category: definition.category,
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
      style={[styles.quizCard, { backgroundColor: quiz.color }]}
      onPress={() => router.push(`/quiz/${quiz.id}`)}>
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
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <BrandSignature variant="mark" />
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
          <View style={styles.featured}>
            <View style={styles.featuredHeader}>
              <ThemedText style={styles.featuredEyebrow}>{featuredEyebrow}</ThemedText>
              <View style={styles.featuredBadge}>
                <ThemedText style={styles.featuredBadgeText}>{featuredQuiz.completed ? 'COMPLETED' : 'FREE'}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.featuredTitle}>{featuredQuiz.title}</ThemedText>
            <ThemedText style={styles.featuredMeta}>{featuredDefinition.meta} · Personality · Free</ThemedText>
            {featuredQuiz.completed && featuredQuiz.lastResultTitle ? (
              <ThemedText style={styles.featuredLastResult}>Last result: {featuredQuiz.lastResultTitle}</ThemedText>
            ) : null}
            <Pressable style={styles.startButton} onPress={() => router.push(`/quiz/${featuredQuizId}`)}>
              <ThemedText style={styles.startText}>{featuredQuiz.completed ? 'Retake quiz →' : 'Take the quiz →'}</ThemedText>
            </Pressable>
          </View>
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
            {/* A clearly-labeled teaser, not a real purchasable quiz — stays visible regardless
                of category, same as before. No-op onPress; "Locked" + the plum treatment signals
                a preview of a more exclusive layer, not that anything unlocks. */}
            <Pressable style={styles.privateQuizCard} onPress={() => {}}>
              <View style={styles.quizHeader}>
                <ThemedText style={styles.privateQuizBadge}>PRIVATE</ThemedText>
                <ThemedText style={styles.privateQuizLocked}>Locked</ThemedText>
              </View>
              <ThemedText style={styles.privateQuizTitle}>How emotionally expensive are you?</ThemedText>
              <ThemedText style={styles.privateQuizMeta}>9 questions · Private</ThemedText>
            </Pressable>
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
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.three },
  headingGroup: { gap: Spacing.one },
  heading: { color: Brand.ink, fontSize: 35, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  headingSupport: { color: Brand.inkSecondary, fontSize: 15, fontWeight: '600' },
  categoryList: { gap: Spacing.two, paddingVertical: Spacing.one },
  category: { backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8' },
  categoryActive: { backgroundColor: Brand.pink, borderColor: Brand.pink },
  categoryText: { color: Brand.ink, fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: '#FFFFFF' },
  featured: { backgroundColor: Brand.violet, borderRadius: 26, padding: Spacing.four, gap: Spacing.two },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  featuredEyebrow: { color: '#DCD6FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  featuredBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  featuredTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '800' },
  featuredMeta: { color: '#DCD6FF', fontSize: 13, fontWeight: '600' },
  featuredLastResult: { color: '#F1EEFF', fontSize: 12, fontWeight: '700' },
  startButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  startText: { color: Brand.violet, fontSize: 14, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  sectionTitle: { color: Brand.ink, fontSize: 18, fontWeight: '800' },
  quizList: { gap: Spacing.two },
  quizCard: { minHeight: 116, borderRadius: 20, padding: Spacing.three, justifyContent: 'space-between' },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  quizDot: { width: 12, height: 12, borderRadius: 6 },
  quizBadge: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  quizBadgeCompleted: { backgroundColor: Brand.ink },
  quizBadgeText: { color: '#1E1A26', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  quizBadgeTextCompleted: { color: '#FFFFFF' },
  quizTitle: { color: Brand.ink, fontSize: 18, lineHeight: 22, fontWeight: '800', maxWidth: 260 },
  quizMeta: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600' },
  quizLastResult: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '700' },
  // The plum premium surface — visibly a different room from the pastel free cards above it.
  privateQuizCard: { minHeight: 116, borderRadius: 20, padding: Spacing.three, justifyContent: 'space-between', backgroundColor: Brand.plum },
  privateQuizBadge: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  privateQuizLocked: { color: 'rgba(255,249,245,0.6)', fontSize: 11, fontWeight: '800' },
  privateQuizTitle: { color: Brand.cream, fontSize: 18, lineHeight: 22, fontWeight: '800', maxWidth: 260 },
  privateQuizMeta: { color: 'rgba(255,249,245,0.7)', fontSize: 12, fontWeight: '600' },
});
