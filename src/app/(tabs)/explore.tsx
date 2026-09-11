import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

const categories = ['Love', 'Friendship', 'Food', 'Money', 'Nostalgia', 'Ridiculous'];
// Only the petty quiz is wired to a real route in this pass — the other two stay
// placeholders (no `quizId`), same no-op onPress as before.
const quizzes = [
  { title: 'How petty are you actually?', meta: '8 questions · Be honest', color: '#FFE5EF', accent: Brand.pink, badge: 'Free', quizId: 'petty' },
  { title: 'Build your perfect Sunday', meta: '10 questions · Personality', color: '#E8E3FF', accent: Brand.violet, badge: 'Daily pick', quizId: null },
  { title: 'What kind of friend are you?', meta: '7 questions · Friendship', color: '#DDF5EE', accent: '#318F7D', badge: 'Free', quizId: null },
];

export default function ExploreScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

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
            {categories.map((category, index) => (
              <Pressable key={category} style={[styles.category, index === 0 && styles.categoryActive]} onPress={() => {}}>
                <ThemedText style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>{category}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.featured}>
            <View style={styles.featuredHeader}>
              <ThemedText style={styles.featuredEyebrow}>FEATURED QUIZ</ThemedText>
              <View style={styles.featuredBadge}>
                <ThemedText style={styles.featuredBadgeText}>Daily pick</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.featuredTitle}>Which version of you shows up in a crisis?</ThemedText>
            <ThemedText style={styles.featuredMeta}>12 questions · 3 min · Personality · Free</ThemedText>
            <Pressable style={styles.startButton} onPress={() => {}}>
              <ThemedText style={styles.startText}>Take the quiz →</ThemedText>
            </Pressable>
          </View>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Currently irresistible</ThemedText>
            <ThemedText style={styles.seeAll}>See all</ThemedText>
          </View>
          <View style={styles.quizList}>
            {quizzes.map((quiz) => (
              <Pressable
                key={quiz.title}
                style={[styles.quizCard, { backgroundColor: quiz.color }]}
                onPress={() => (quiz.quizId ? router.push(`/quiz/${quiz.quizId}`) : undefined)}>
                <View style={styles.quizHeader}>
                  <View style={[styles.quizDot, { backgroundColor: quiz.accent }]} />
                  <View style={styles.quizBadge}>
                    <ThemedText style={styles.quizBadgeText}>{quiz.badge}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.quizTitle}>{quiz.title}</ThemedText>
                <ThemedText style={styles.quizMeta}>{quiz.meta}</ThemedText>
              </Pressable>
            ))}
            {/* A clearly-labeled teaser, not a real purchasable quiz — the existing Explore
                data here is just a local static array (no backend/content pipeline behind
                it), so this doesn't need to register anywhere else. No-op onPress, same as
                every other quiz card above; "Locked" + the plum treatment is what signals
                this is a preview of a more exclusive layer, not that anything unlocks. */}
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
  startButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two },
  startText: { color: Brand.violet, fontSize: 14, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  sectionTitle: { color: Brand.ink, fontSize: 18, fontWeight: '800' },
  seeAll: { color: Brand.pink, fontSize: 13, fontWeight: '800' },
  quizList: { gap: Spacing.two },
  quizCard: { minHeight: 116, borderRadius: 20, padding: Spacing.three, justifyContent: 'space-between' },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  quizDot: { width: 12, height: 12, borderRadius: 6 },
  quizBadge: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  quizBadgeText: { color: '#1E1A26', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  quizTitle: { color: Brand.ink, fontSize: 18, lineHeight: 22, fontWeight: '800', maxWidth: 260 },
  quizMeta: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600' },
  // The plum premium surface — visibly a different room from the pastel free cards above it.
  privateQuizCard: { minHeight: 116, borderRadius: 20, padding: Spacing.three, justifyContent: 'space-between', backgroundColor: Brand.plum },
  privateQuizBadge: { color: Brand.coral, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  privateQuizLocked: { color: 'rgba(255,249,245,0.6)', fontSize: 11, fontWeight: '800' },
  privateQuizTitle: { color: Brand.cream, fontSize: 18, lineHeight: 22, fontWeight: '800', maxWidth: 260 },
  privateQuizMeta: { color: 'rgba(255,249,245,0.7)', fontSize: 12, fontWeight: '600' },
});
