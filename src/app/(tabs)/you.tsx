import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature, MAGNETIC_LOOP_SOURCE } from '@/components/brand-signature';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { CardStyle, PastelAccentRotation, Radius, Surface, Type } from '@/constants/design-system';
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import { getDemoPersonalityProfile, scorePersonalityProfile, type PersonalityProfile } from '@/data/personality';
import { getQuizDefinition } from '@/data/quizzes';
import { flushPendingQuizSubmissions } from '@/data/quizzes/pending-quiz-submissions';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import { buildYouProfileCards, buildYourSevenCards } from '@/data/you-profile-cards';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { ensureAnonymousSession } from '@/services/auth-service';
import { syncLegacyQuizResultsToRemote } from '@/services/legacy-quiz-backfill-service';
import {
  computeProfileActivityCounts,
  getMyPersonalityEvidence,
  getMyQuizResults,
  groupEvidenceIntoAnswers,
  type ProfileActivityCounts,
} from '@/services/personality-service';

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

// The structural avatar/relic hero — a deliberate LOGIC/LAYOUT PROTOTYPE for the future avatar
// system, not final art. Avatar (left on wide, top on narrow) and the character-name+relic
// group (right on wide, below on narrow) are two structurally SEPARATE elements with a fixed
// generous gap between them by construction — the relic can never overlap or touch the avatar,
// on any viewport. Both use plain, simple placeholder geometry: the existing Magnetic Loop
// mark for the avatar (nothing new to invent there) and a bare rotated-square "gem" shape for
// the relic (no creature art, no trait-specific appearance mapping — those are later Build 8
// passes). The character name is reserved directly above the relic, per the approved future
// naming concept (first two core traits, e.g. Lumi + Fox -> Lumifox) — shown here as neutral
// placeholder copy since the real 40-syllable mapping doesn't exist yet.
//
// Approved Option B layout: avatar LEFT, relic RIGHT, always — this is a fixed left/right
// relationship, not something that collapses to a stacked column on narrow viewports. `isWide`
// only scales SIZE (avatar/relic dimensions, gap, character-name type size) between a
// comfortable desktop scale and a smaller one that still fits 375-390px without overflow; it
// never switches the row to a column. Two structurally separate sibling Views with a fixed
// horizontal gap mean the relic can never overlap or touch the avatar on any viewport.
function IdentityHero({ isWide }: { isWide: boolean }) {
  return (
    <View style={styles.heroRow}>
      <View style={[styles.avatarArea, isWide ? styles.avatarAreaWide : styles.avatarAreaNarrow]}>
        <Image
          source={MAGNETIC_LOOP_SOURCE}
          resizeMode="contain"
          style={isWide ? styles.avatarImageWide : styles.avatarImageNarrow}
        />
      </View>
      <View style={styles.relicGroup}>
        <ThemedText style={[styles.characterNamePlaceholder, isWide ? styles.characterNamePlaceholderWide : styles.characterNamePlaceholderNarrow]}>
          CHARACTER NAME
        </ThemedText>
        <View style={[styles.relicShape, isWide ? styles.relicShapeWide : styles.relicShapeNarrow]}>
          <View style={isWide ? styles.relicShapeInnerWide : styles.relicShapeInnerNarrow} />
        </View>
      </View>
    </View>
  );
}

export default function YouScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const topInset = useResponsiveTopInset();
  // Same signal useResponsiveContentWidth already uses internally to decide whether to cap
  // width (undefined below its tablet breakpoint) — reused here rather than re-deriving a
  // second breakpoint, so "wide enough for a side-by-side hero" and "wide enough for a capped
  // content column" always agree.
  const isWide = contentWidth !== undefined;

  // Local prototype path — completely unchanged, still built from the same demo data. Only
  // ever rendered when isRemoteDailyEnabled is false (see the branch in the JSX below). The
  // internal seven-trait selection (topTraits) still exists and still feeds the avatar-
  // building logic later — this screen just stops surfacing it as its own progress UI.
  const localPersonalityProfile = useMemo(() => getDemoPersonalityProfile(), []);
  const localTopPatterns = localPersonalityProfile.topTraits;

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
    // Same idea for any local quiz history from an older TestFlight build that hasn't made it
    // to Supabase yet (see legacy-quiz-backfill-service.ts) — a no-op once its own per-user
    // marker is set.
    await syncLegacyQuizResultsToRemote();

    const [evidenceResult, quizResultsResult] = await Promise.all([getMyPersonalityEvidence(), getMyQuizResults()]);
    // Both reads must succeed — a quiz-history fetch failure is NEVER treated as "zero
    // quizzes completed" (that would silently under-report profileAnswerCount/the internal
    // seven-trait threshold even though real quiz personality evidence already exists). Never
    // falls back to demo data on either error — the same small retryable state either way.
    if (!evidenceResult.ok) {
      setRemoteState({ status: 'error', message: evidenceResult.message });
      return;
    }
    if (!quizResultsResult.ok) {
      setRemoteState({ status: 'error', message: quizResultsResult.message });
      return;
    }
    const answers = groupEvidenceIntoAnswers(evidenceResult.data);
    const profile = scorePersonalityProfile(answers);
    const counts = computeProfileActivityCounts(evidenceResult.data, quizResultsResult.data);
    setRemoteState({ status: 'ready', profile, counts });
  }, []);

  useEffect(() => {
    if (isRemoteDailyEnabled) {
      void loadRemote();
    }
  }, [loadRemote]);

  // Below the 50-profile-answer milestone: the existing, unchanged up-to-5-card progressive
  // experience. At/above it: up to 7 real evidenced dimensions, never silently capped back
  // down to 5 by reusing the mature-only topTraits-based selector. This selection logic is
  // UNCHANGED from Build 7 — this pass only changes how the result is presented (see
  // "YOUR SIGNATURE" below), never the underlying ranking/threshold.
  const profileCards = useMemo(() => {
    if (remoteState.status !== 'ready') {
      return [];
    }
    return remoteState.counts.profileAnswerCount >= 50
      ? buildYourSevenCards(remoteState.profile)
      : buildYouProfileCards(remoteState.profile);
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
  // navigator) around the same time onboarding completed (or a Settings edit just landed),
  // a one-shot effect could capture a stale snapshot. useUserProfile re-renders this screen
  // the moment the profile actually changes — no app restart needed.
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
      <ThemedText style={styles.recentReadCta}>See result →</ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <BrandSignature variant="mark" />
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              style={styles.gearButton}>
              <ThemedText style={styles.gearIcon}>⚙</ThemedText>
            </Pressable>
          </View>

          <IdentityHero isWide={isWide} />

          <View style={styles.identityHeader}>
            <ThemedText style={styles.displayName}>{displayName}, apparently.</ThemedText>
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
              <ThemedText style={styles.sectionTitle}>YOUR SIGNATURE</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
                {localTopPatterns.map((pattern, index) => (
                  <View key={pattern.id} style={[styles.pattern, { backgroundColor: PastelAccentRotation[index % PastelAccentRotation.length] }]}>
                    <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                    <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                  </View>
                ))}
              </ScrollView>
              {recentReadCard}
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
              {profileCards.length > 0 && (
                <>
                  <ThemedText style={styles.sectionTitle}>YOUR SIGNATURE</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
                    {profileCards.map((card, index) => (
                      <View
                        key={card.dimension}
                        style={[styles.pattern, { backgroundColor: PastelAccentRotation[index % PastelAccentRotation.length] }]}>
                        <ThemedText style={styles.patternNumber}>0{index + 1}</ThemedText>
                        <ThemedText style={styles.patternName}>{card.label}</ThemedText>
                        <ThemedText style={styles.patternStrength}>{card.strengthLabel}</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}

              {recentReadCard}
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
    backgroundColor: Surface.pageDeep,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Surface.page,
    ...Platform.select({
      web: {
        marginVertical: 28,
        borderRadius: Radius.xl,
        boxShadow: '0 24px 64px rgba(23, 21, 29, 0.10)',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.four },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gearButton: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 22, color: Brand.inkSecondary },

  // --- Identity hero (avatar/relic prototype) ---------------------------------------------
  // Always a ROW — avatar left, relic right — on every viewport (approved Option B layout).
  // isWide only changes the gap/element sizes below, never the row-vs-column direction, so
  // the left/right relationship holds at 375x812 and 390x844 exactly as it does on desktop.
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: Spacing.four },
  avatarArea: {
    borderRadius: Radius.lg,
    backgroundColor: Surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Surface.hairline,
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(23, 21, 29, 0.14)',
  },
  avatarAreaWide: { width: 112, height: 112 },
  avatarAreaNarrow: { width: 76, height: 76 },
  avatarImageWide: { width: 112, height: 112 },
  avatarImageNarrow: { width: 76, height: 76 },
  // Shared regardless of width — only the character-name type size and relic size below
  // scale; the group's own alignment/gap stays constant. `maxWidth` + `flexShrink` let the
  // placeholder name wrap onto a second line rather than force horizontal overflow if a
  // future real character name is ever longer than this one.
  relicGroup: { alignItems: 'center', gap: Spacing.two, flexShrink: 1, maxWidth: 160 },
  characterNamePlaceholder: {
    ...Type.display,
    color: Brand.inkSecondary,
    opacity: 0.55,
    textAlign: 'center',
  },
  characterNamePlaceholderWide: { fontSize: 20, lineHeight: 24, letterSpacing: 1.5 },
  characterNamePlaceholderNarrow: { fontSize: 14, lineHeight: 17, letterSpacing: 0.8 },
  // A deliberately bare rotated-square "gem" — placeholder geometry only, not final relic
  // art. Structurally separate from avatarArea by construction (its own sibling View, in the
  // same row, with a fixed gap), never overlapping or touching it on any viewport.
  relicShape: {
    borderRadius: Radius.sm,
    backgroundColor: Surface.sand,
    borderWidth: 1,
    borderColor: 'rgba(23, 21, 29, 0.10)',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(23, 21, 29, 0.12)',
  },
  relicShapeWide: { width: 72, height: 72 },
  relicShapeNarrow: { width: 52, height: 52 },
  relicShapeInnerWide: { width: 28, height: 28, borderRadius: 6, backgroundColor: Brand.gold, opacity: 0.5 },
  relicShapeInnerNarrow: { width: 20, height: 20, borderRadius: 5, backgroundColor: Brand.gold, opacity: 0.5 },

  identityHeader: { alignItems: 'center', gap: Spacing.one },
  displayName: { ...Type.display, textAlign: 'center' },
  subline: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600' },
  sublineSecondary: { color: Brand.inkSecondary, fontSize: 12, fontWeight: '600', opacity: 0.75, marginTop: 1 },

  eyebrow: { ...Type.eyebrow },
  sectionTitle: { ...Type.heading, letterSpacing: 0.6 },

  // Horizontal scroll + a card wide enough that even the longest single-word dimension
  // label (e.g. "Collaborative", "Peacekeeping" — 12-13 characters, no space or hyphen to
  // wrap on) fits on one line at this font size. `gap` (not `justifyContent: 'space-between'`)
  // guarantees a fixed minimum gap between the number/name/strength rows regardless of
  // whether the name renders as one line or two.
  patternList: { gap: Spacing.two, paddingVertical: Spacing.one, paddingRight: Spacing.two },
  pattern: { width: 192, minHeight: 124, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
  patternNumber: { color: 'rgba(23,21,29,0.55)', fontSize: 12, fontWeight: '800' },
  patternName: { color: Brand.ink, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  patternStrength: { fontSize: 12, fontWeight: '800', color: 'rgba(23,21,29,0.65)', letterSpacing: 0.2 },

  // Additive quiz-completion card — lavender wash, distinct enough from the pastel signature
  // cards to read as "a different kind of result."
  recentReadCard: CardStyle.tinted(Surface.lavender, '#EAE2FF'),
  recentReadQuizTitle: { color: Brand.inkSecondary, fontSize: 13, fontWeight: '600' },
  recentReadResultTitle: { color: Brand.ink, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: Spacing.half },
  recentReadCta: { color: Brand.pink, fontSize: 14, fontWeight: '800', marginTop: Spacing.one },

  // Remote-only loading/error/empty states — never demo data behind any of these.
  stateCard: { ...CardStyle.base, alignItems: 'center', gap: Spacing.two },
  stateText: { color: Brand.inkSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  retryButton: { backgroundColor: Brand.pink, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyStateCard: { ...CardStyle.base, alignItems: 'center', gap: Spacing.two },
  emptyStateCopy: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
});
