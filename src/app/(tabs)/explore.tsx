import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

const categories = ['Love', 'Friendship', 'Food', 'Money', 'Nostalgia', 'Ridiculous'];
const quizzes = [
  { title: 'How petty are you actually?', meta: '8 questions · Be honest', color: '#FFE5EF', accent: Brand.pink, badge: 'Approved' },
  { title: 'Build your perfect Sunday', meta: '10 questions · Personality', color: '#E8E3FF', accent: Brand.violet, badge: 'Daily pick' },
  { title: 'What kind of friend are you?', meta: '7 questions · Friendship', color: '#DDF5EE', accent: '#318F7D', badge: 'Approved' },
];

export default function ExploreScreen() {
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.heading}>A little quiz for every side of you.</ThemedText>
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
            <ThemedText style={styles.featuredMeta}>12 questions · 3 min · Personality · Approved</ThemedText>
            <Pressable style={styles.startButton} onPress={() => {}}>
              <ThemedText style={styles.startText}>Take the quiz →</ThemedText>
            </Pressable>
          </View>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Popular right now</ThemedText>
            <ThemedText style={styles.seeAll}>See all</ThemedText>
          </View>
          <View style={styles.quizList}>
            {quizzes.map((quiz) => (
              <Pressable key={quiz.title} style={[styles.quizCard, { backgroundColor: quiz.color }]} onPress={() => {}}>
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
  heading: { color: Brand.ink, fontSize: 35, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
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
});
