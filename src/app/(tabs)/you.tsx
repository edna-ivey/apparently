import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature, MAGNETIC_LOOP_SOURCE } from '@/components/brand-signature';
import { CreatureTestComposer, type CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { CardStyle, Elevation, PastelAccentRotation, Radius, Surface, Type } from '@/constants/design-system';
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import { buildCreatureIdentity, type CreatureIdentity } from '@/data/creature/creature-identity';
import { buildInitialAssetCorrections, buildInitialSlotDefaults } from '@/data/creature-test/creature-test-config';
import { getDemoPersonalityProfile, scorePersonalityProfile, type PersonalityProfile } from '@/data/personality';
import { getQuizDefinition } from '@/data/quizzes';
import { flushPendingQuizSubmissions } from '@/data/quizzes/pending-quiz-submissions';
import { hydrateQuizResults, useQuizResults } from '@/data/quizzes/results';
import { resolveResultDisplayTitle } from '@/data/quizzes/scoring';
import { selectRelicSlots, selectStrongestPrivateSignals, type PrivateSignalTrait, type RelicSlotAssignment } from '@/data/private-signals';
import { buildYourSignatureCards } from '@/data/you-profile-cards';
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

const CREATURE_REVEAL_ANSWER_THRESHOLD = 50;
const CREATURE_SLOT_DEFAULTS = buildInitialSlotDefaults();
const CREATURE_ASSET_CORRECTIONS = buildInitialAssetCorrections();

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

// The identity hero now renders the production 5-slot Creature once the user crosses the
// 50-answer reveal threshold AND has five qualifying Core traits. Before reveal, the existing
// Magnetic Loop remains the neutral placeholder. The Creature recipe and character name are
// derived from the same ranked Core list that powers Your Signature, so there is no second
// ranking or parallel identity calculation. The Relic remains structurally separate and keeps
// its existing Private-signal behavior.
function IdentityHero({
  isWide,
  resolvedRelicSlotCount,
  creatureIdentity,
  creatureRevealed,
}: {
  isWide: boolean;
  resolvedRelicSlotCount: number;
  creatureIdentity: CreatureIdentity | null;
  creatureRevealed: boolean;
}) {
  const outerOpacity = resolvedRelicSlotCount >= 1 ? 1 : 0.35;
  const innerOpacity = resolvedRelicSlotCount >= 3 ? 1 : resolvedRelicSlotCount >= 2 ? 0.5 : 0;
  const avatarSize = isWide ? 112 : 76;
  const shouldRenderCreature = creatureRevealed && creatureIdentity?.isComplete === true;
  const recipe = shouldRenderCreature ? (creatureIdentity.recipe as CreatureTestRecipe) : null;

  return (
    <View style={styles.heroRow}>
      <View style={[styles.avatarArea, isWide ? styles.avatarAreaWide : styles.avatarAreaNarrow]}>
        {recipe ? (
          <CreatureTestComposer
            recipe={recipe}
            slotDefaults={CREATURE_SLOT_DEFAULTS}
            assetCorrections={CREATURE_ASSET_CORRECTIONS}
            width={avatarSize}
          />
        ) : (
          <Image
            source={MAGNETIC_LOOP_SOURCE}
            resizeMode="contain"
            style={isWide ? styles.avatarImageWide : styles.avatarImageNarrow}
          />
        )}
      </View>
      <View style={styles.relicGroup}>
        <ThemedText
          style={[
            styles.characterNamePlaceholder,
            isWide ? styles.characterNamePlaceholderWide : styles.characterNamePlaceholderNarrow,
            shouldRenderCreature ? styles.characterNameRevealed : null,
          ]}>
          {shouldRenderCreature ? creatureIdentity?.name : 'CHARACTER NAME'}
        </ThemedText>
        <View style={[styles.relicShape, isWide ? styles.relicShapeWide : styles.relicShapeNarrow, { opacity: outerOpacity }]}>
          <View style={[isWide ? styles.relicShapeInnerWide : styles.relicShapeInnerNarrow, { opacity: innerOpacity }]} />
        </View>
      </View>
    </View>
  );
}

// "THE UNDERCURRENT" (Build 8 Pass 3; locked-state added for the Bible v1.4 identity-states
// pass) -- consumer-facing WORKING title for the deeper Private identity layer, confined to
// this UI component (never baked into private-signals.ts's own naming — that title isn't
// locked yet).
//
// Deliberately reads NO entitlement/subscription state at all -- only whether qualifying
// evidence exists (`signals`, already real/qualified/deterministic — see
// private-signals.ts). This is what makes every required identity state fall out correctly
// with no extra branching:
//   - a free user with zero earned Private evidence sees the locked state below;
//   - an active subscriber with zero evidence YET (hasn't engaged with Private content)
//     sees the exact same locked state -- and since that state contains no acquisition
//     language ("subscribe"/"unlock"/"free preview" never appear here), a subscriber is
//     never shown messaging meant for a non-subscriber, without needing to check who they are;
//   - a former subscriber whose entitlement has lapsed keeps seeing their real, already-earned
//     signals in the revealed state below, because this component was never gating on
//     entitlement to begin with -- canceling changes nothing here, by construction, not by a
//     special "preserve on cancel" code path that could be forgotten or bypassed elsewhere.
// 1-3 real cards when qualified evidence exists, never padded to a fixed count; a locked
// silhouette (no fabricated trait names, no fake numbers) otherwise.
function UndercurrentSection({ signals }: { signals: PrivateSignalTrait[] }) {
  const router = useRouter();

  if (signals.length === 0) {
    return (
      <>
        <ThemedText style={styles.sectionTitle}>THE UNDERCURRENT</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
          <View style={styles.lockedSlot} />
          <View style={styles.lockedSlot} />
          <View style={styles.lockedSlot} />
        </ScrollView>
        <View style={styles.undercurrentTeaser}>
          <ThemedText style={styles.undercurrentTeaserCopy}>
            Apparently Private learns what tends to show up underneath when things get personal.
          </ThemedText>
          <Pressable style={styles.undercurrentTeaserCta} onPress={() => router.push('/private')}>
            <ThemedText style={styles.undercurrentTeaserCtaText}>Enter Private →</ThemedText>
          </Pressable>
        </View>
      </>
    );
  }
  return (
    <>
      <ThemedText style={styles.sectionTitle}>THE UNDERCURRENT</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patternList}>
        {signals.map((signal, index) => (
          <View key={signal.dimension} style={[styles.pattern, styles.undercurrentPattern]}>
            <ThemedText style={styles.undercurrentPatternNumber}>0{index + 1}</ThemedText>
            <ThemedText style={styles.undercurrentPatternName}>{signal.label}</ThemedText>
            <ThemedText style={styles.undercurrentPatternStrength}>{signal.strengthLabel}</ThemedText>
          </View>
        ))}
      </ScrollView>
    </>
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
  // Real for the demo profile too (Build 8 Pass 3) -- the demo data happens to carry zero
  // Private-12 evidence, so this naturally selects nothing, exactly as it should when there's
  // no real signal. Never special-cased to force a demo Undercurrent into existing.
  const localPrivateSignals = useMemo(() => selectStrongestPrivateSignals(localPersonalityProfile), [localPersonalityProfile]);
  const localRelicSlots = useMemo(() => selectRelicSlots(localPrivateSignals), [localPrivateSignals]);
  const localResolvedRelicSlotCount = [localRelicSlots.relicTrait, localRelicSlots.colorTrait, localRelicSlots.effectTrait].filter(
    Boolean,
  ).length;

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

  // "YOUR SIGNATURE" (Bible v1.4 §16) — up to seven strongest qualifying Core trait poles,
  // never padded. Deliberately independent of profileAnswerCount/the 50-answer milestone:
  // that threshold gates the Creature reveal (Bible §17, not yet implemented in this
  // codebase — see buildYourSignatureCards' own header comment), never Your Signature
  // qualification. A user with 2 qualifying Core traits sees 2 immediately; crossing 50
  // answered questions neither adds nor removes a Your Signature card by itself.
  const localCreatureIdentity = useMemo(() => buildCreatureIdentity(localPersonalityProfile), [localPersonalityProfile]);
  const remoteCreatureIdentity = useMemo(
    () => (remoteState.status === 'ready' ? buildCreatureIdentity(remoteState.profile) : null),
    [remoteState],
  );
  const remoteCreatureRevealed =
    remoteState.status === 'ready' &&
    remoteState.counts.profileAnswerCount >= CREATURE_REVEAL_ANSWER_THRESHOLD &&
    remoteCreatureIdentity?.isComplete === true;

  const profileCards = useMemo(() => {
    if (remoteState.status !== 'ready') {
      return [];
    }
    return buildYourSignatureCards(remoteState.profile);
  }, [remoteState]);

  // The deeper Private identity layer (Build 8 Pass 3) — Private-12 dimensions only, real
  // evidence only, never fabricated to fill three slots. Evidence here may originate from
  // Private quiz/Daily content by an approved mapping; a Private answer that ALSO carries an
  // approved Core mapping already contributes to profileCards above through the exact same
  // profile.dimensions — both layers read the same underlying evidence, filtered by dimension
  // type, never by source. See src/data/private-signals.ts.
  const privateSignals = useMemo(
    () => (remoteState.status === 'ready' ? selectStrongestPrivateSignals(remoteState.profile) : []),
    [remoteState],
  );
  const relicSlots: RelicSlotAssignment = useMemo(() => selectRelicSlots(privateSignals), [privateSignals]);
  const resolvedRelicSlotCount = [relicSlots.relicTrait, relicSlots.colorTrait, relicSlots.effectTrait].filter(Boolean).length;

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

          <IdentityHero
            isWide={isWide}
            resolvedRelicSlotCount={isRemoteDailyEnabled ? resolvedRelicSlotCount : localResolvedRelicSlotCount}
            creatureIdentity={isRemoteDailyEnabled ? remoteCreatureIdentity : localCreatureIdentity}
            creatureRevealed={isRemoteDailyEnabled ? remoteCreatureRevealed : false}
          />

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
              <UndercurrentSection signals={localPrivateSignals} />
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

              <UndercurrentSection signals={privateSignals} />

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
        boxShadow: Elevation.shell,
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
  characterNameRevealed: { color: Brand.ink, opacity: 1 },
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

  // The Undercurrent's own cards (Build 8 Pass 3) — deep plum, distinct from Your Signature's
  // pastel rotation, echoing Private's own deeper surface identity (see private.tsx) without
  // making the whole You page dark. Never rendered with fewer than 1 or more than 3 real cards.
  undercurrentPattern: { backgroundColor: Brand.plum },
  undercurrentPatternNumber: { color: 'rgba(255,249,245,0.55)', fontSize: 12, fontWeight: '800' },
  undercurrentPatternName: { color: Brand.cream, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  undercurrentPatternStrength: { fontSize: 12, fontWeight: '800', color: Brand.coral, letterSpacing: 0.2 },

  // Locked Undercurrent state (no qualifying Private evidence yet) -- three concealed trait
  // positions (never fabricated labels/numbers, just reserved shape) plus a teaser + entry
  // point into Apparently Private. Same card footprint as a revealed card so the section reads
  // as "the same three slots, not yet filled" rather than a different layout entirely.
  lockedSlot: {
    width: 192,
    minHeight: 124,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Surface.hairline,
    backgroundColor: Surface.card,
    opacity: 0.7,
  },
  undercurrentTeaser: { ...CardStyle.tinted(Surface.card, Surface.hairline), gap: Spacing.three, alignItems: 'flex-start' },
  undercurrentTeaserCopy: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  undercurrentTeaserCta: { backgroundColor: Brand.plum, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  undercurrentTeaserCtaText: { color: Brand.cream, fontSize: 14, fontWeight: '800' },

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
