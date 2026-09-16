import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature, MAGNETIC_LOOP_SOURCE } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BottomTabInset, Spacing } from '@/constants/theme';
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import {
  getDemoPersonalityProfile,
  getSignatureStrengthLabel,
  PERSONALITY_DIMENSIONS,
  scorePersonalityProfile,
  type DimensionResult,
  type PersonalityProfile,
} from '@/data/personality';
import { getQuizDefinition } from '@/data/quizzes';
import { flushPendingQuizSubmissions } from '@/data/quizzes/pending-quiz-submissions';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { formatResultMetric, resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { ensureAnonymousSession } from '@/services/auth-service';
import {
  computeProfileActivityCounts,
  getMyPersonalityEvidence,
  getMyQuizResults,
  groupEvidenceIntoAnswers,
  type ProfileActivityCounts,
} from '@/services/personality-service';

// Real dimensions (evidenceCount >= 1) ranked for the "EARLY READS" fallback — used only
// when topTraits is empty (i.e. no dimension has yet reached the >=2 evidenceCount
// scorePersonalityProfile requires for a real signature trait). Rank: evidenceCount, then
// signatureStrength, then a fixed deterministic dimension order as the final tie-break, so
// two dimensions with identical real evidence never flicker order between renders.
const DIMENSION_ORDER = new Map(PERSONALITY_DIMENSIONS.map((dimension, index) => [dimension.id, index]));

const getEarlySignals = (dimensions: DimensionResult[]): DimensionResult[] =>
  dimensions
    .filter((dimension) => dimension.evidenceCount >= 1)
    .sort((a, b) => {
      if (b.evidenceCount !== a.evidenceCount) return b.evidenceCount - a.evidenceCount;
      if (b.signatureStrength !== a.signatureStrength) return b.signatureStrength - a.signatureStrength;
      return (DIMENSION_ORDER.get(a.dimension) ?? 0) - (DIMENSION_ORDER.get(b.dimension) ?? 0);
    })
    .slice(0, 5);

// Deliberately modest language for 1-2 real data points — never implies a defining trait.
const getEarlySignalLabel = (evidenceCount: number): string => (evidenceCount <= 1 ? 'First signal' : 'Early read');

// The section eyebrow above the pattern/early-read cards — staged by profileActivityCount
// (Dailies + distinct completed quizzes, NOT raw answer volume), matching the product's
// "the more I answer, the more Apparently You starts to know me" thesis: the label itself
// grows up as activity accumulates, independent of whether the scoring engine has actually
// matured any dimension yet at that stage. "Your Patterns" is reserved for 5+ activities AND
// a real scorePersonalityProfile().topTraits entry — the scoring engine's own mature-trait
// threshold is never bent just because activityCount crossed 5; short of that, this always
// falls back to the same honest Early Reads presentation used at every earlier stage.
const getSectionEyebrow = (activityCount: number, hasMatureTraits: boolean): string => {
  if (activityCount <= 1) {
    return 'FIRST SIGNALS';
  }
  if (activityCount <= 4) {
    return "WE'RE NOTICING...";
  }
  return hasMatureTraits ? 'YOUR PATTERNS' : 'EARLY READS';
};

// "1 answer shaping your read" / "11 answers shaping your read" — profileAnswerCount, never
// raw activity count (a 10-question quiz's first completion is 10 answers here, not 1).
const formatAnswersShapingRead = (profileAnswerCount: number): string =>
  `${profileAnswerCount} answer${profileAnswerCount === 1 ? '' : 's'} shaping your read`;

// "1 Daily · 0 quizzes" / "2 Dailies · 1 quiz" / "7 Dailies · 3 quizzes" — dailyAnswerCount and
// quizCompletionCount (distinct quizzes with >=1 completion; retakes don't add another).
const formatDailyQuizBreakdown = (dailyAnswerCount: number, quizCompletionCount: number): string => {
  const dailyWord = dailyAnswerCount === 1 ? 'Daily' : 'Dailies';
  const quizWord = quizCompletionCount === 1 ? 'quiz' : 'quizzes';
  return `${dailyAnswerCount} ${dailyWord} · ${quizCompletionCount} ${quizWord}`;
};

type RemoteYouState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: PersonalityProfile; counts: ProfileActivityCounts };

export default function YouScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();

  // Local prototype path — completely unchanged, still built from the same demo data. Only
  // ever rendered when isRemoteDailyEnabled is false (see the branch in the JSX below).
  const localPersonalityProfile = useMemo(() => getDemoPersonalityProfile(), []);
  const localTopPatterns = localPersonalityProfile.topTraits;
  const localAnswersCount = localPersonalityProfile.answeredCount;
  const localRemainingToReveal = Math.max(0, 50 - localAnswersCount);

  // Real remote path — Michelle's/a real tester's own personality_evidence, never demo data.
  // Uses the SAME consumer anonymous identity Today already established (ensureAnonymousSession
  // is idempotent/concurrent-safe — see auth-service.ts); never creates a second identity,
  // never touches Admin auth.
  const [remoteState, setRemoteState] = useState<RemoteYouState>({ status: 'loading' });

  const loadRemote = useCallback(async () => {
    setRemoteState({ status: 'loading' });
    await ensureAnonymousSession();
    // Opportunistic retry point for any quiz completion that failed to reach the server
    // earlier (see pending-quiz-submissions.ts) — "You opening" is exactly the moment the
    // spec calls for. Never blocks the read below even if it itself fails; a submission that
    // still can't go through just stays queued for the next opportunity.
    await flushPendingQuizSubmissions();

    const [evidenceResult, quizResults] = await Promise.all([getMyPersonalityEvidence(), getMyQuizResults()]);
    if (!evidenceResult.ok) {
      // Never fall back to demo data on error — a small retryable state instead.
      setRemoteState({ status: 'error', message: evidenceResult.message });
      return;
    }
    const answers = groupEvidenceIntoAnswers(evidenceResult.data);
    const profile = scorePersonalityProfile(answers);
    const counts = computeProfileActivityCounts(evidenceResult.data, quizResults);
    setRemoteState({ status: 'ready', profile, counts });
  }, []);

  useEffect(() => {
    if (isRemoteDailyEnabled) {
      void loadRemote();
    }
  }, [loadRemote]);

  const remoteEarlySignals = useMemo(() => {
    if (remoteState.status !== 'ready' || remoteState.profile.topTraits.length > 0) {
      return [];
    }
    return getEarlySignals(remoteState.profile.dimensions);
  }, [remoteState]);

  // Additive only — reads the same persisted quiz-results store the quiz runner writes to
  // (apparently:quiz-results), does not touch Daily/Commonality/pattern data at all. Reactive
  // for the same reason useUserProfile is: completing a quiz and landing straight on You in
  // the same session must not require a restart to show up. Real local data, used identically
  // in both local and remote mode — untouched by this sprint's remote-truth cleanup.
  //
  // Generic across every quiz, not hardcoded to Petty: Recent Read is whichever quiz was
  // completed most recently (results are appended in completion order, so the last entry in
  // the full history is always the newest — across all quizzes, not just one).
  const quizResults = useQuizResults();
  useEffect(() => {
    void hydrateQuizResults();
  }, []);
  const latestResult = quizResults !== 'loading' && quizResults.length > 0 ? quizResults[quizResults.length - 1] : null;
  const latestQuizDefinition = latestResult ? getQuizDefinition(latestResult.quizId) : null;

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

  const recentReadCard = latestQuizDefinition && latestResult && (
    <Pressable
      onPress={() => router.push({ pathname: '/quiz/[quizId]', params: { quizId: latestResult.quizId, view: 'result' } })}
      style={styles.recentReadCard}>
      <ThemedText style={styles.eyebrow}>RECENT READ</ThemedText>
      <ThemedText style={styles.recentReadQuizTitle}>{latestQuizDefinition.title}</ThemedText>
      <ThemedText style={styles.recentReadResultTitle}>
        {resolveResultDisplayTitle(latestQuizDefinition, latestResult.resultId) ?? latestResult.resultTitle}
      </ThemedText>
      <ThemedText style={styles.recentReadMeter}>{formatResultMetric(latestQuizDefinition, latestResult)}</ThemedText>
      <ThemedText style={styles.recentReadCta}>See result →</ThemedText>
    </Pressable>
  );

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
            {isRemoteDailyEnabled ? (
              remoteState.status === 'ready' && (
                <>
                  <ThemedText style={styles.subline}>{formatAnswersShapingRead(remoteState.counts.profileAnswerCount)}</ThemedText>
                  <ThemedText style={styles.sublineSecondary}>
                    {formatDailyQuizBreakdown(remoteState.counts.dailyAnswerCount, remoteState.counts.quizCompletionCount)}
                  </ThemedText>
                </>
              )
            ) : (
              <ThemedText style={styles.subline}>43 answers · 7 day streak</ThemedText>
            )}
          </View>

          {!isRemoteDailyEnabled && (
            <>
              <View style={styles.scoreCard}>
                <ThemedText style={styles.eyebrow}>YOUR COMMONALITY</ThemedText>
                <ThemedText style={styles.score}>37%</ThemedText>
                <ThemedText style={styles.scoreLabel}>Uncommon</ThemedText>
                <ThemedText style={styles.copy}>You tend to zig when the room zags. Respectfully.</ThemedText>
              </View>
              <ThemedText style={styles.sectionTitle}>Your patterns</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
                {localTopPatterns.map((pattern, index) => (
                  <View key={pattern.id} style={[styles.pattern, { backgroundColor: [Brand.pink, '#DDF5EE', '#FFF0D2', '#E8F1FF', '#FDE9D2'][index % 5] }]}>
                    <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                    <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                    {/* Not pattern.percent: that number clamps to 88 for nearly every top
                        trait at this evidence scale, which is what made five cards show
                        identical, fake-looking values — signatureStrength is the real,
                        already-computed ranking signal, just read qualitatively instead of
                        as a raw percent. */}
                    <ThemedText style={styles.patternStrength}>{getSignatureStrengthLabel(pattern.signatureStrength)}</ThemedText>
                  </View>
                ))}
              </ScrollView>
              {recentReadCard}
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <ThemedText style={styles.eyebrow}>YOUR 7</ThemedText>
                  <ThemedText style={styles.progressCount}>{localAnswersCount} / 50</ThemedText>
                </View>
                <ThemedText style={styles.progressTitle}>
                  {localRemainingToReveal > 0 ? `${localRemainingToReveal} more answers until Your 7.` : 'Your 7 is live.'}
                </ThemedText>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(100, (localAnswersCount / 50) * 100)}%` }]} />
                </View>
              </View>
            </>
          )}

          {isRemoteDailyEnabled && remoteState.status === 'loading' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Loading your read…</ThemedText>
            </View>
          )}

          {isRemoteDailyEnabled && remoteState.status === 'error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>We couldn&apos;t load your read right now.</ThemedText>
              <Pressable style={styles.retryButton} onPress={() => void loadRemote()}>
                <ThemedText style={styles.retryButtonText}>Retry →</ThemedText>
              </Pressable>
            </View>
          )}

          {isRemoteDailyEnabled && remoteState.status === 'ready' && remoteState.counts.profileActivityCount === 0 && (
            <View style={styles.emptyStateCard}>
              <ThemedText style={styles.eyebrow}>YOUR STORY STARTS HERE</ThemedText>
              <ThemedText style={styles.emptyStateCopy}>Answer today&apos;s Daily or take a quiz. We&apos;ll start noticing the patterns.</ThemedText>
              <Pressable style={styles.retryButton} onPress={() => router.push('/')}>
                <ThemedText style={styles.retryButtonText}>Answer today&apos;s drop →</ThemedText>
              </Pressable>
            </View>
          )}

          {isRemoteDailyEnabled && remoteState.status === 'ready' && remoteState.counts.profileActivityCount > 0 && (
            <>
              {remoteState.profile.topTraits.length > 0 ? (
                <>
                  <ThemedText style={styles.sectionTitle}>
                    {getSectionEyebrow(remoteState.counts.profileActivityCount, true)}
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
                    {remoteState.profile.topTraits.map((pattern, index) => (
                      <View key={pattern.id} style={[styles.pattern, { backgroundColor: [Brand.pink, '#DDF5EE', '#FFF0D2', '#E8F1FF', '#FDE9D2'][index % 5] }]}>
                        <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                        <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                        <ThemedText style={styles.patternStrength}>{getSignatureStrengthLabel(pattern.signatureStrength)}</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : (
                remoteEarlySignals.length > 0 && (
                  <>
                    <ThemedText style={styles.sectionTitle}>
                      {getSectionEyebrow(remoteState.counts.profileActivityCount, false)}
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
                      {remoteEarlySignals.map((dimension, index) => (
                        <View
                          key={dimension.dimension}
                          style={[styles.pattern, { backgroundColor: [Brand.pink, '#DDF5EE', '#FFF0D2', '#E8F1FF', '#FDE9D2'][index % 5] }]}>
                          <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                          <ThemedText style={styles.patternName}>{dimension.displayName}</ThemedText>
                          <ThemedText style={styles.patternStrength}>{getEarlySignalLabel(dimension.evidenceCount)}</ThemedText>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )
              )}

              {recentReadCard}

              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <ThemedText style={styles.eyebrow}>YOUR 7</ThemedText>
                  <ThemedText style={styles.progressCount}>{remoteState.counts.profileAnswerCount} / 50</ThemedText>
                </View>
                <ThemedText style={styles.progressTitle}>
                  {remoteState.counts.profileAnswerCount < 50
                    ? `${50 - remoteState.counts.profileAnswerCount} more answers until Your 7.`
                    : 'Your 7 is ready.'}
                </ThemedText>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(100, (remoteState.counts.profileAnswerCount / 50) * 100)}%` }]} />
                </View>
              </View>
            </>
          )}

          {isRemoteDailyEnabled && remoteState.status !== 'ready' && recentReadCard}
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
  sublineSecondary: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600', opacity: 0.75, marginTop: 1 },
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
  // Remote-only loading/error/empty states — never demo data behind any of these.
  stateCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8', alignItems: 'center' },
  stateText: { color: Brand.inkSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  retryButton: { backgroundColor: Brand.pink, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyStateCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, borderWidth: 1, borderColor: '#F0E6E8', alignItems: 'center' },
  emptyStateCopy: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
});
