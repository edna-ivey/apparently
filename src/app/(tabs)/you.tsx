import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature, MAGNETIC_LOOP_SOURCE } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import { getDemoPersonalityProfile, getSignatureStrengthLabel } from '@/data/personality';
import { getQuizDefinition } from '@/data/quizzes';
import { hydrateQuizResults, useLatestQuizResult } from '@/data/quizzes/results';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';

const toTitleCase = (value: string) => value.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());

export default function YouScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  const personalityProfile = useMemo(() => getDemoPersonalityProfile(), []);
  const topPatterns = personalityProfile.topTraits;
  const answersCount = personalityProfile.answeredCount;
  const remainingToReveal = Math.max(0, 50 - answersCount);

  // Additive only — reads the same persisted quiz-results store the quiz runner writes to
  // (apparently:quiz-results), does not touch Daily/Commonality/pattern data at all. Reactive
  // for the same reason useUserProfile is: completing a quiz and landing straight on You in
  // the same session must not require a restart to show up.
  const pettyQuizDefinition = getQuizDefinition('petty');
  const latestPettyResult = useLatestQuizResult('petty');
  useEffect(() => {
    void hydrateQuizResults();
  }, []);

  // Reactive, not a one-shot read: if this screen mounted (or was kept mounted by the tab
  // navigator) around the same time onboarding completed, a one-shot effect could capture a
  // snapshot from just before the profile was written and never update. useUserProfile
  // re-renders this screen the moment completeOnboarding() actually saves the name — no
  // app restart needed. Same underlying storage/key as before, via the same module.
  const userProfile = useUserProfile();
  useEffect(() => {
    void hydrateUserProfile();
  }, []);
  const firstName = userProfile === 'loading' ? null : userProfile?.firstName ?? null;
  const displayName = firstName && firstName.trim().length > 0 ? firstName : 'You';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <BrandSignature variant="mark" />
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Image source={MAGNETIC_LOOP_SOURCE} resizeMode="contain" style={styles.avatarImage} />
            </View>
            <ThemedText style={styles.name}>{displayName}, apparently.</ThemedText>
            <ThemedText style={styles.subline}>43 answers · 7 day streak</ThemedText>
          </View>
          <View style={styles.scoreCard}>
            <ThemedText style={styles.eyebrow}>YOUR COMMONALITY</ThemedText>
            <ThemedText style={styles.score}>37%</ThemedText>
            <ThemedText style={styles.scoreLabel}>Uncommon</ThemedText>
            <ThemedText style={styles.copy}>You tend to zig when the room zags. Respectfully.</ThemedText>
          </View>
          <ThemedText style={styles.sectionTitle}>Your patterns</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.patternList}>
            {topPatterns.map((pattern, index) => (
              <View key={pattern.id} style={[styles.pattern, { backgroundColor: [Brand.pink, '#DDF5EE', '#FFF0D2', '#E8F1FF', '#FDE9D2'][index % 5] }]}>
                <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                {/* Not pattern.percent: that number clamps to 88 for nearly every top trait
                    at this evidence scale, which is what made five cards show identical,
                    fake-looking values — signatureStrength is the real, already-computed
                    ranking signal, just read qualitatively instead of as a raw percent. */}
                <ThemedText style={styles.patternStrength}>
                  {getSignatureStrengthLabel(pattern.signatureStrength)}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
          {pettyQuizDefinition && latestPettyResult && latestPettyResult !== 'loading' && (
            <Pressable
              onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: 'petty', view: 'result' } })}
              style={styles.recentReadCard}>
              <ThemedText style={styles.eyebrow}>RECENT READ</ThemedText>
              <ThemedText style={styles.recentReadQuizTitle}>{pettyQuizDefinition.title}</ThemedText>
              <ThemedText style={styles.recentReadResultTitle}>{toTitleCase(latestPettyResult.resultTitle)}</ThemedText>
              <ThemedText style={styles.recentReadMeter}>
                {latestPettyResult.percent}% {pettyQuizDefinition.scoreLabel} meter
              </ThemedText>
              <ThemedText style={styles.recentReadCta}>See result →</ThemedText>
            </Pressable>
          )}
          <View style={styles.progressCard}>
            <View style={styles.progressTop}><ThemedText style={styles.eyebrow}>YOUR 7</ThemedText><ThemedText style={styles.progressCount}>{answersCount} / 50</ThemedText></View>
            <ThemedText style={styles.progressTitle}>{remainingToReveal > 0 ? `${remainingToReveal} more answers until Your 7.` : 'Your 7 is live.'}</ThemedText>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, (answersCount / 50) * 100)}%` }]} /></View>
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
  profileHeader: { alignItems: 'center', gap: Spacing.one, paddingBottom: Spacing.three },
  // A tight circle with a solid fill was built around the old letter avatar; the Magnetic
  // Loop mark already carries its own rounded-square shape and background, so a matching
  // soft rounded-square frame (rather than forcing it into a circle) is what lets the mark
  // read cleanly instead of looking like an icon awkwardly stuffed into a different shape.
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 21, 29, 0.08)',
    boxShadow: '0 8px 20px rgba(23, 21, 29, 0.14)',
    overflow: 'hidden',
  },
  avatarImage: { width: 92, height: 92 },
  name: { color: Brand.ink, fontSize: 22, fontWeight: '800' },
  subline: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600' },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.one, borderWidth: 1, borderColor: '#F0E6E8' },
  eyebrow: { color: Brand.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  score: { color: Brand.ink, fontSize: 54, lineHeight: 58, fontWeight: '900' },
  scoreLabel: { color: Brand.violet, fontSize: 16, fontWeight: '800' },
  copy: { color: Brand.inkSecondary, fontSize: 13, lineHeight: 19, marginTop: Spacing.one },
  sectionTitle: { color: Brand.ink, fontSize: 18, fontWeight: '800' },
  // Horizontal scroll + a fixed, generous card width — five equal-flex cards crammed into
  // one row is what made trait names like "Planner"/"Protective" break mid-word on an
  // iPhone; a wider card gives every name room to sit on one line (or wrap on a real word
  // boundary) instead.
  patternList: { gap: Spacing.two, paddingVertical: Spacing.one, paddingRight: Spacing.two },
  pattern: { width: 136, minHeight: 112, borderRadius: 18, padding: Spacing.three, justifyContent: 'space-between' },
  patternNumber: { color: 'rgba(23,21,29,0.55)', fontSize: 12, fontWeight: '800' },
  patternName: { color: Brand.ink, fontSize: 17, lineHeight: 21, fontWeight: '800' },
  patternStrength: { fontSize: 12, fontWeight: '800', color: 'rgba(23,21,29,0.65)', letterSpacing: 0.2 },
  // Additive quiz-completion card — same violet family as the pattern cards, distinct enough
  // from the pink Commonality/progress cards to read as "a different kind of result."
  recentReadCard: { backgroundColor: '#F7F3FF', borderRadius: 24, padding: Spacing.four, gap: Spacing.half, borderWidth: 1, borderColor: '#EAE2FF' },
  recentReadQuizTitle: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600' },
  recentReadResultTitle: { color: Brand.ink, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: Spacing.half },
  recentReadMeter: { color: Brand.violet, fontSize: 13, fontWeight: '800' },
  recentReadCta: { color: Brand.pink, fontSize: 14, fontWeight: '800', marginTop: Spacing.one },
  progressCard: { backgroundColor: '#FFE5EF', borderRadius: 24, padding: Spacing.four, gap: Spacing.two },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressCount: { color: Brand.pink, fontSize: 13, fontWeight: '800' },
  progressTitle: { color: Brand.ink, fontSize: 18, fontWeight: '800' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  fill: { width: '86%', height: '100%', backgroundColor: Brand.pink },
});
