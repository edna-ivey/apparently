import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature, MAGNETIC_LOOP_SOURCE } from '@/components/brand-signature';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import { CreatureRevealOverlay } from '@/components/creature/creature-reveal-overlay';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { CardStyle, Elevation, PastelAccentRotation, Radius, Surface, Type } from '@/constants/design-system';
import { hydrateUserProfile, useUserProfile } from '@/data/onboarding';
import {
  buildCreatureIdentity,
  buildFirstFormIdentity,
  type CreatureIdentity,
  type CreatureRecipe,
} from '@/data/creature/creature-identity';
import {
  checkWeeklyEvolution,
  createMixedCreatureSnapshot,
  formatEvolutionDate,
  getNextFridayCheckpointKey,
  getPendingEvolutionCheckpointKey,
  isFirstFormEligible,
  isFirstMixedFormEligible,
} from '@/data/creature/creature-progression';
import {
  loadCreatureEvolutionState,
  saveCreatureEvolutionState,
  type CreatureEvolutionState,
} from '@/data/creature/creature-reveal-state';
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

type VisibleCreature = {
  name: string;
  recipe: CreatureRecipe;
  traitNames: string[];
};

type RevealMoment = {
  kind: 'first-form' | 'first-mixed' | 'evolved' | 'unchanged';
  creature: VisibleCreature;
  changes?: string[];
};

// The identity centerpiece. It renders the pure five-part First Form at 8 real profile answers
// plus one qualifying Core trait, then the last revealed mixed snapshot after the 50-answer /
// five-trait gate. Before First Form, the Magnetic Loop remains the neutral placeholder. Both
// forms derive from the same ranked Core list that powers Your Signature, so there is no
// second ranking. The Relic remains structurally separate and unchanged.
//
// Layout: on wide viewports, the approved left/right relationship holds (Creature left,
// name+Relic right) -- it has room to. On narrow phone widths, a large centerpiece Creature
// plus the name+Relic column no longer fit side by side without cropping or squeezing either
// element, so narrow stacks them vertically instead (Creature centered on top, name below it,
// Relic below the name) -- composition over forcing a row that would clip. CreatureAvatar
// itself is always rendered at a literal square (size === size), so the full calibrated
// 1700x1700 composition scales uniformly with no cropping and no distortion at any size here.
function IdentityHero({
  isWide,
  resolvedRelicSlotCount,
  creature,
}: {
  isWide: boolean;
  resolvedRelicSlotCount: number;
  creature: VisibleCreature | null;
}) {
  const outerOpacity = resolvedRelicSlotCount >= 1 ? 1 : 0.35;
  const innerOpacity = resolvedRelicSlotCount >= 3 ? 1 : resolvedRelicSlotCount >= 2 ? 0.5 : 0;
  const creatureSize = isWide ? 240 : 196;
  const placeholderSize = isWide ? 112 : 76;
  const recipe = creature?.recipe ?? null;

  const avatar = recipe ? (
    <CreatureAvatar recipe={recipe} size={creatureSize} />
  ) : (
    <View style={[styles.avatarArea, { width: placeholderSize, height: placeholderSize }]}>
      <Image source={MAGNETIC_LOOP_SOURCE} resizeMode="contain" style={{ width: placeholderSize, height: placeholderSize }} />
    </View>
  );

  const nameAndRelic = (
    <View style={[styles.relicGroup, !isWide ? styles.relicGroupNarrow : null]}>
      <ThemedText
        style={[
          styles.characterNamePlaceholder,
          isWide ? styles.characterNamePlaceholderWide : styles.characterNamePlaceholderNarrow,
          creature ? styles.characterNameRevealed : null,
        ]}>
        {creature?.name ?? 'CHARACTER NAME'}
      </ThemedText>
      <View style={[styles.relicShape, isWide ? styles.relicShapeWide : styles.relicShapeNarrow, { opacity: outerOpacity }]}>
        <View style={[isWide ? styles.relicShapeInnerWide : styles.relicShapeInnerNarrow, { opacity: innerOpacity }]} />
      </View>
    </View>
  );

  if (isWide) {
    return (
      <View style={styles.heroRow}>
        {avatar}
        {nameAndRelic}
      </View>
    );
  }

  return (
    <View style={styles.heroColumn}>
      {avatar}
      {nameAndRelic}
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
  const [calendarNow, setCalendarNow] = useState(() => new Date());

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

  useFocusEffect(useCallback(() => {
    if (isRemoteDailyEnabled) {
      setCalendarNow(new Date());
      void loadRemote();
    }
  }, [loadRemote]));

  // The live profile always derives the current candidates. Only the mixed presentation
  // snapshot below is persisted, so the app can keep the last revealed Creature stable while
  // the profile continues learning between global Friday checks.
  const remoteCreatureIdentity = useMemo(
    () => (remoteState.status === 'ready' ? buildCreatureIdentity(remoteState.profile) : null),
    [remoteState],
  );
  const remoteFirstFormIdentity = useMemo(
    () => (remoteState.status === 'ready' ? buildFirstFormIdentity(remoteState.profile) : null),
    [remoteState],
  );
  const [evolutionState, setEvolutionState] = useState<CreatureEvolutionState | null>(null);
  const [revealMoment, setRevealMoment] = useState<RevealMoment | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadCreatureEvolutionState().then((state) => {
      if (!cancelled) {
        setEvolutionState(state);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;
    const scheduleNextLocalDay = () => {
      const now = new Date();
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      midnightTimer = setTimeout(() => {
        setCalendarNow(new Date());
        scheduleNextLocalDay();
      }, nextDay.getTime() - now.getTime());
    };
    scheduleNextLocalDay();
    return () => clearTimeout(midnightTimer);
  }, []);

  const persistEvolutionState = useCallback((nextState: CreatureEvolutionState) => {
    setEvolutionState(nextState);
    void saveCreatureEvolutionState(nextState);
  }, []);

  const profileAnswerCount = remoteState.status === 'ready' ? remoteState.counts.profileAnswerCount : 0;
  const firstFormEligible = isFirstFormEligible(profileAnswerCount, remoteFirstFormIdentity);
  const firstMixedEligible = isFirstMixedFormEligible(profileAnswerCount, remoteCreatureIdentity);

  useEffect(() => {
    if (evolutionState === null || revealMoment !== null || remoteState.status !== 'ready') {
      return;
    }

    if (evolutionState.mixedSnapshot === null && firstMixedEligible) {
      const snapshot = createMixedCreatureSnapshot(remoteCreatureIdentity, new Date());
      // This effect synchronizes two independently hydrated external sources (the remote
      // profile and local presentation storage). The state update is the synchronization
      // result, not React-derived state that could be calculated during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      persistEvolutionState({ ...evolutionState, mixedSnapshot: snapshot });
      setRevealMoment({
        kind: 'first-mixed',
        creature: {
          name: snapshot.name,
          recipe: snapshot.recipe,
          traitNames: snapshot.traits.map((trait) => trait.traitName),
        },
      });
      return;
    }

    if (
      evolutionState.mixedSnapshot === null &&
      firstFormEligible &&
      !evolutionState.firstFormRevealSeen &&
      remoteFirstFormIdentity
    ) {
      setRevealMoment({
        kind: 'first-form',
        creature: {
          name: remoteFirstFormIdentity.name,
          recipe: remoteFirstFormIdentity.recipe,
          traitNames: [remoteFirstFormIdentity.trait.name],
        },
      });
    }
  }, [
    evolutionState,
    firstFormEligible,
    firstMixedEligible,
    persistEvolutionState,
    remoteCreatureIdentity,
    remoteFirstFormIdentity,
    remoteState.status,
    revealMoment,
  ]);

  const mixedSnapshot = evolutionState?.mixedSnapshot ?? null;
  const visibleCreature = useMemo<VisibleCreature | null>(() => {
    if (mixedSnapshot) {
      return {
        name: mixedSnapshot.name,
        recipe: mixedSnapshot.recipe,
        traitNames: mixedSnapshot.traits.map((trait) => trait.traitName),
      };
    }
    if (firstFormEligible && remoteFirstFormIdentity) {
      return {
        name: remoteFirstFormIdentity.name,
        recipe: remoteFirstFormIdentity.recipe,
        traitNames: [remoteFirstFormIdentity.trait.name],
      };
    }
    return null;
  }, [firstFormEligible, mixedSnapshot, remoteFirstFormIdentity]);

  const pendingEvolutionDate = mixedSnapshot
    ? getPendingEvolutionCheckpointKey(calendarNow, mixedSnapshot)
    : null;
  const nextEvolutionDate = getNextFridayCheckpointKey(calendarNow);

  const dismissCreatureReveal = useCallback(() => {
    if (revealMoment?.kind === 'first-form' && evolutionState) {
      persistEvolutionState({ ...evolutionState, firstFormRevealSeen: true });
    }
    setRevealMoment(null);
  }, [evolutionState, persistEvolutionState, revealMoment]);

  const checkEvolution = useCallback(() => {
    if (!pendingEvolutionDate || !mixedSnapshot || !evolutionState) {
      return;
    }

    if (
      remoteCreatureIdentity?.isComplete !== true ||
      remoteCreatureIdentity.name === null
    ) {
      const heldSnapshot = { ...mixedSnapshot, lastCheckedEvolutionDate: pendingEvolutionDate };
      persistEvolutionState({ ...evolutionState, mixedSnapshot: heldSnapshot });
      setRevealMoment({
        kind: 'unchanged',
        creature: {
          name: heldSnapshot.name,
          recipe: heldSnapshot.recipe,
          traitNames: heldSnapshot.traits.map((trait) => trait.traitName),
        },
      });
      return;
    }

    const result = checkWeeklyEvolution(
      mixedSnapshot,
      remoteCreatureIdentity as CreatureIdentity & { name: string; recipe: CreatureRecipe },
      pendingEvolutionDate,
    );
    persistEvolutionState({ ...evolutionState, mixedSnapshot: result.snapshot });
    const changeMessages = result.changes.map((change) => change.message);
    setRevealMoment({
      kind: result.outcome === 'changed' ? 'evolved' : 'unchanged',
      creature: {
        name: result.snapshot.name,
        recipe: result.snapshot.recipe,
        traitNames: result.snapshot.traits.map((trait) => trait.traitName),
      },
      changes:
        changeMessages.length > 3
          ? [...changeMessages.slice(0, 3), `${changeMessages.length - 3} other details shifted too.`]
          : changeMessages,
    });
  }, [
    evolutionState,
    mixedSnapshot,
    pendingEvolutionDate,
    persistEvolutionState,
    remoteCreatureIdentity,
  ]);

  // Intentional pre-First-Form copy, followed by gentle learning copy while a pure First Form
  // is visible. There is no fake progress bar or promise that one more answer causes a change.
  const creaturePreRevealCopy = useMemo(() => {
    if (remoteState.status !== 'ready' || mixedSnapshot) {
      return null;
    }
    if (!firstFormEligible) {
      return profileAnswerCount < 8
        ? 'Your Creature is listening. A First Form appears when a real pattern starts to hold.'
        : 'Apparently is still waiting for one strong enough pattern to take shape.';
    }
    return firstMixedEligible
      ? null
      : 'Your First Form reflects what is strongest right now. Keep answering; every real pattern matters.';
  }, [firstFormEligible, firstMixedEligible, mixedSnapshot, profileAnswerCount, remoteState.status]);

  // "YOUR SIGNATURE" (Bible v1.4 §16) — up to seven strongest qualifying Core trait poles,
  // never padded. Deliberately independent of profileAnswerCount/the 50-answer milestone:
  // that threshold gates the Creature reveal above, never Your Signature qualification. A
  // user with 2 qualifying Core traits sees 2 immediately; crossing 50 answered questions
  // neither adds nor removes a Your Signature card by itself.
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
            creature={isRemoteDailyEnabled ? visibleCreature : null}
          />

          {isRemoteDailyEnabled && creaturePreRevealCopy && (
            <ThemedText style={styles.creaturePreRevealCopy}>{creaturePreRevealCopy}</ThemedText>
          )}

          {isRemoteDailyEnabled && remoteState.status === 'ready' && (
            <ThemedText style={styles.evolutionDateCopy}>
              {mixedSnapshot
                ? pendingEvolutionDate
                  ? `Evolution Day: ${formatEvolutionDate(pendingEvolutionDate)}`
                  : `Next Evolution Day: ${formatEvolutionDate(nextEvolutionDate)}`
                : 'Evolution Day: Friday'}
            </ThemedText>
          )}

          {isRemoteDailyEnabled && pendingEvolutionDate && mixedSnapshot && (
            <View style={styles.evolutionPrompt}>
              <View style={styles.evolutionPromptCopy}>
                <ThemedText style={styles.evolutionPromptTitle}>Did you evolve?</ThemedText>
                <ThemedText style={styles.evolutionPromptSupporting}>
                  Apparently has been paying attention since your last reveal.
                </ThemedText>
              </View>
              <Pressable
                style={styles.evolutionPromptButton}
                onPress={checkEvolution}
                accessibilityRole="button"
                accessibilityLabel="Find out whether your Creature evolved">
                <ThemedText style={styles.evolutionPromptButtonText}>Find out</ThemedText>
              </Pressable>
            </View>
          )}

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
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setRemoteState({ status: 'loading' });
                  void loadRemote();
                }}>
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
      {revealMoment ? (
        <CreatureRevealOverlay
          kind={revealMoment.kind}
          creature={revealMoment.creature}
          changes={revealMoment.changes}
          onDismiss={dismissCreatureReveal}
        />
      ) : null}
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

  // --- Identity hero (the Creature centerpiece + name/Relic) ------------------------------
  // Wide: a ROW — Creature left, name+Relic right (the approved left/right layout, which has
  // room to hold at this size on a wide viewport). Narrow: a COLUMN — the centerpiece Creature
  // is too large to sit beside the name+Relic without cropping or squeezing either on a phone
  // width, so narrow stacks them instead (see IdentityHero's own comment for why).
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.five },
  heroColumn: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  // Placeholder-only frame (the pre-reveal Magnetic Loop mark benefits from a bounded card;
  // the real revealed Creature renders through CreatureAvatar instead, unframed, so it reads
  // as a floating hero illustration rather than a boxed icon).
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
  // Shared regardless of width — only the character-name type size and relic size below
  // scale; the group's own alignment/gap stays constant. `maxWidth` + `flexShrink` let the
  // placeholder name wrap onto a second line rather than force horizontal overflow if a
  // future real character name is ever longer than this one.
  relicGroup: { alignItems: 'center', gap: Spacing.two, flexShrink: 1, maxWidth: 160 },
  // On narrow, the group no longer sits beside the avatar in a row with its own flexShrink
  // context, so it gets a plain, centered, non-shrinking width instead.
  relicGroupNarrow: { maxWidth: 260 },
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

  creaturePreRevealCopy: {
    textAlign: 'center',
    color: Brand.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: Spacing.four,
  },
  evolutionDateCopy: {
    textAlign: 'center',
    color: Brand.plum,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  evolutionPrompt: {
    ...CardStyle.tinted(Surface.lavender, '#E4D8FF'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  evolutionPromptCopy: { flex: 1, gap: Spacing.one },
  evolutionPromptTitle: { ...Type.heading, color: Brand.ink },
  evolutionPromptSupporting: { color: Brand.inkSecondary, fontSize: 13, lineHeight: 18 },
  evolutionPromptButton: {
    backgroundColor: Brand.plum,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  evolutionPromptButtonText: { color: Brand.cream, fontSize: 14, fontWeight: '800' },
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
