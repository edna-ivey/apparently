import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Panel } from '@/components/today/celestial';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { getQuizDefinition } from '@/data/quizzes';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';

// The real "All" featured quiz id, per src/app/(tabs)/explore.tsx's own
// FEATURED_QUIZ_ID['All'] = 'crisis'. Explore owns the authoritative per-category mapping;
// Today only ever shows the single "All" default, so this names that one id directly rather
// than importing Explore's full category-filtered map (Today has no category pills).
// If Explore's 'All' default ever changes, update this constant to match — it is
// intentionally a plain id, not a re-derivation of Explore's own logic.
const TODAY_FEATURED_QUIZ_ID = 'crisis';

export function FeaturedQuizCard() {
  const router = useRouter();

  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  const quizResults = useQuizResults();
  const definition = getQuizDefinition(TODAY_FEATURED_QUIZ_ID);

  const latestResult = useMemo(() => {
    if (quizResults === 'loading') {
      return null;
    }
    return quizResults.find((record) => record.quizId === TODAY_FEATURED_QUIZ_ID) ?? null;
  }, [quizResults]);

  if (!definition) {
    return null;
  }

  const completed = !!latestResult;
  const lastResultTitle = latestResult
    ? resolveResultDisplayTitle(definition, latestResult.resultId) ?? latestResult.resultTitle
    : null;

  return (
    <Pressable
      style={({ pressed }) => [Panel.shell, pressed && styles.pressed]}
      onPress={() => router.push(`/quiz/${TODAY_FEATURED_QUIZ_ID}`)}
      accessibilityRole="button">
      <View style={Panel.glow} pointerEvents="none" />
      <View style={styles.headerRow}>
        <ThemedText style={Panel.eyebrow}>Featured Quiz</ThemedText>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{completed ? 'COMPLETED' : 'FREE'}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.title}>&ldquo;{definition.title}&rdquo;</ThemedText>
      <ThemedText style={styles.meta}>
        {definition.questions.length} questions · {definition.category}
      </ThemedText>
      {completed && lastResultTitle ? <ThemedText style={styles.lastResult}>Last result: {lastResultTitle}</ThemedText> : null}
      <View style={styles.ctaRow}>
        <ThemedText style={styles.ctaText}>{completed ? 'Retake quiz →' : 'Take the quiz →'}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,249,245,0.8)',
  },
  title: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    marginTop: Spacing.three,
  },
  meta: {
    fontSize: 11.5,
    color: 'rgba(255,249,245,0.6)',
    marginTop: 6,
  },
  lastResult: {
    fontSize: 12,
    color: 'rgba(255,249,245,0.6)',
    marginTop: 6,
  },
  ctaRow: {
    marginTop: Spacing.three,
    alignItems: 'flex-end',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: Brand.gold,
  },
});
