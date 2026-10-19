import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AtmosphericGlow } from '@/components/creature/atmospheric-glow';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import { CreatureRevealOverlay } from '@/components/creature/creature-reveal-overlay';
import { Celestial, CelestialWash, PortalRings } from '@/components/today/celestial';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { Elevation, Radius, Type } from '@/constants/design-system';
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
import { rankPoles, type RankedPole } from '@/data/personality-v2/scoring-engine';
import { mergeCoreTraitsWithV2Gaps, mergePrivateSignalsWithV2Gaps } from '@/data/personality-v2/activation';
import { selectRelicSlots, selectStrongestPrivateSignals, type PrivateSignalTrait, type RelicSlotAssignment } from '@/data/private-signals';
import { resolveRelicIdentity, type ResolvedRelicIdentity } from '@/data/relic/relic-production-config';
import { RelicAvatar } from '@/components/relic/relic-avatar';
import { buildYourSignatureCards } from '@/data/you-profile-cards';
import { useResponsiveContentWidth, useResponsiveTopInset } from '@/hooks/use-responsive-content-width';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { ensureAnonymousSession } from '@/services/auth-service';
import { syncLegacyQuizResultsToRemote } from '@/services/legacy-quiz-backfill-service';
import { usePremiumStatus } from '@/services/purchases-service';
import {
  computeProfileActivityCounts,
  getMyCommonality,
  getMyPersonalityEvidence,
  getMyQuizResults,
  groupEvidenceIntoAnswers,
  type MyCommonalityRow,
  type ProfileActivityCounts,
} from '@/services/personality-service';
import { getMyPersonalityPoleEvidence, toEnginePoleEvidenceRows } from '@/services/personality-v2-service';

// Celestial redesign (Option B, approved without spotlight rays): the real, approved
// silhouette asset — same require() → Image path already established for Today's Creature
// surfaces (src/components/today/CreatureStage.tsx) — replaces the pre-reveal Magnetic Loop
// placeholder here. Not converted, recolored, or rasterized.
const CELESTIAL_SILHOUETTE_SOURCE = require('../../../assets/images/celestial_portal_creature_silhouette.svg');

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
  // Build 16: `profile` is V1's own PersonalityProfile with ONLY topTraits possibly extended
  // by Scoring V2 gap-filling (see activation.ts) -- profile.dimensions stays pure V1, so
  // every reader of .dimensions (selectStrongestPrivateSignals included) is completely
  // unaffected by this. `v2Ranked` is kept alongside so the separate Private/Relic merge
  // below (which operates on PrivateSignalTrait[], not .dimensions) can apply the same V2
  // gap-fill rule without a second fetch.
  | { status: 'ready'; profile: PersonalityProfile; counts: ProfileActivityCounts; v2Ranked: RankedPole[] };

type CommonalityState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: MyCommonalityRow };

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
// second ranking.
//
// Layout: on wide viewports, the approved left/right relationship holds (Creature left, name
// right) -- it has room to. On narrow phone widths, the large centerpiece Creature and the
// name column no longer fit side by side without cropping or squeezing either, so narrow
// stacks them vertically instead. CreatureAvatar itself is always rendered at a literal
// square (size === size), so the full calibrated 1700x1700 composition scales uniformly with
// no cropping and no distortion at any size here.
//
// Build 15: the Relic is no longer part of this hero at all -- see RelicSection below, now
// its own compact section after Undercurrent, per the explicit new hierarchy ("Make the
// Creature big again. Make the unrevealed Relic significantly smaller.").
function IdentityHero({
  isWide,
  creature,
  onGetYourRead,
}: {
  isWide: boolean;
  creature: VisibleCreature | null;
  onGetYourRead: (() => void) | null;
}) {
  // Celestial redesign (approved Option B): "large Creature as the primary visual focal
  // point," restored here at Build 15's own explicit final direction -- the Creature is the
  // star of Apparently You and must be the largest, most visually exciting element on the
  // page. Back to 380/300 (the approved size). The previous round's shrink to 320/250 was a
  // response to "Your Signature is buried too far down" -- that reachability problem is now
  // solved differently: the Relic has been pulled OUT of this hero entirely (see
  // YouScreen's own RelicTeaser section, rendered after Undercurrent instead of beside the
  // Creature), which recovers far more vertical space than shrinking the Creature ever did.
  // This only changes the SIZE this real, unmodified CreatureAvatar/silhouette renders at --
  // CreatureAvatar scales its full calibrated composition uniformly at any size (see its own
  // header comment), so this is not a change to scale/composition/calibration in the
  // protected sense. The silhouette renders at the same size as the real Creature (no
  // separate smaller "placeholder" frame), so pre-reveal and revealed occupy the same footprint.
  const creatureSize = isWide ? 380 : 300;
  const recipe = creature?.recipe ?? null;
  // Tightened from the original 1.3x multiplier -- same glow treatment, just not an
  // oversized halo that reintroduces the "excessive blank space" problem on its own.
  const glowSize = creatureSize * 1.2;
  // A small presentation-only upward shift -- purely how the Creature sits within its own
  // atmosphere, never a change to the locked composition calibration itself (see
  // CreatureAvatar/CreatureTestComposer, untouched). Visually checked against real renders:
  // most trait combinations carry more silhouette mass upward (ears/horns/wings fanning out)
  // than downward (feet/tail resting near the bottom), so a literal mathematical center reads
  // as slightly low. This nudges the optical center up without touching the asset itself.
  const creatureOpticalShift = -creatureSize * 0.03;

  const avatar = (
    <View style={[styles.heroStage, { width: glowSize, height: glowSize }]}>
      {recipe && <AtmosphericGlow size={glowSize} />}
      {recipe ? (
        <View style={{ transform: [{ translateY: creatureOpticalShift }] }}>
          <CreatureAvatar recipe={recipe} size={creatureSize} />
        </View>
      ) : (
        // The real approved silhouette, unframed -- floating directly over the portal-ring
        // atmosphere like the revealed Creature does, not boxed in a placeholder disc (the
        // exact "looks pasted on, like an avatar icon" feedback this file's own history
        // already resolved for the revealed state now applies the same fix here).
        <Image
          source={CELESTIAL_SILHOUETTE_SOURCE}
          contentFit="contain"
          style={{ width: creatureSize * 0.74, height: creatureSize * 0.74, opacity: 0.9 }}
        />
      )}
    </View>
  );

  const nameGroup = (
    <View style={[styles.relicGroup, !isWide ? styles.relicGroupNarrow : null]}>
      {creature ? (
        <View style={styles.characterNameRow}>
          <ThemedText style={styles.characterNameOrnament} accessibilityElementsHidden importantForAccessibility="no">
            &#10022;
          </ThemedText>
          <ThemedText style={[styles.characterNameRevealed, isWide ? styles.characterNameRevealedWide : styles.characterNameRevealedNarrow]}>
            {creature.name}
          </ThemedText>
          <ThemedText style={styles.characterNameOrnament} accessibilityElementsHidden importantForAccessibility="no">
            &#10022;
          </ThemedText>
        </View>
      ) : (
        <ThemedText style={[styles.characterNameMystery, isWide ? styles.characterNameMysteryWide : styles.characterNameMysteryNarrow]}>
          Not Yet Named
        </ThemedText>
      )}
      {creature && onGetYourRead && (
        <Pressable style={styles.getYourReadButton} onPress={onGetYourRead} accessibilityRole="button">
          <ThemedText style={styles.getYourReadButtonText}>GET YOUR READ →</ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (isWide) {
    return (
      <View style={styles.heroRow}>
        {avatar}
        {nameGroup}
      </View>
    );
  }

  return (
    <View style={styles.heroColumn}>
      {avatar}
      {nameGroup}
    </View>
  );
}

// Build 15 "Make the Creature big again. Make the unrevealed Relic significantly smaller.":
// the Relic is no longer part of the Creature hero at all -- it moved to its own compact
// section, rendered after Undercurrent (see YouScreen's JSX), per the explicit new hierarchy.
// Three real states:
//   - identity.base set (>=1 qualifying Private signal; "forming" through "complete") -- the
//     real approved RelicAvatar artwork, at a visually balanced (not hero-sized) presentation.
//   - locked + non-subscriber -- a compact, ~90pt-tall teaser: a miniature of the existing
//     approved locked-gem placeholder (same shapes as before, just much smaller), a short
//     heading, one enticing line, and a real "Discover Private" action.
//   - locked + subscriber (no qualifying signal YET) -- the same compact footprint, honest
//     progress copy, deliberately NO subscription upsell (they're already subscribed).
function RelicSection({
  isWide,
  isSubscriber,
  resolvedSlotCount,
  identity,
  onTapRelic,
  onDiscoverPrivate,
}: {
  isWide: boolean;
  isSubscriber: boolean;
  resolvedSlotCount: number;
  identity: ResolvedRelicIdentity;
  // Null in local/offline demo mode, same convention as IdentityHero's onGetYourRead.
  onTapRelic: (() => void) | null;
  onDiscoverPrivate: (() => void) | null;
}) {
  if (identity.base) {
    const revealedSize = isWide ? 96 : 84;
    const statusLabel = resolvedSlotCount >= 3 ? 'Your Relic' : 'Still forming';
    return (
      <>
        <ThemedText style={styles.sectionTitle}>YOUR RELIC</ThemedText>
        <Pressable
          style={styles.relicRevealedRow}
          onPress={onTapRelic ?? undefined}
          disabled={!onTapRelic}
          accessibilityRole="button"
          accessibilityLabel="Open your Relic Read">
          <View style={[styles.relicRevealedWrap, { width: revealedSize, height: revealedSize }]}>
            <RelicAvatar identity={{ base: identity.base, color: identity.color, effect: identity.effect }} size={revealedSize} />
          </View>
          <View style={styles.relicRevealedTextGroup}>
            <ThemedText style={styles.relicRevealedLabel}>{statusLabel}</ThemedText>
            <ThemedText style={styles.relicRevealedSub}>
              {resolvedSlotCount >= 3 ? 'Tap to read →' : `${resolvedSlotCount} of 3 signals qualified · Tap to read →`}
            </ThemedText>
          </View>
        </Pressable>
      </>
    );
  }

  // Compact placeholder -- a small miniature of the existing approved locked-gem shape
  // (same geometry/colors RelicGlyph always used, just rendered far smaller: 40pt vs. the old
  // 94-130pt bloom), never an oversized portal or a placeholder that looks like a finished
  // collectible.
  const iconSize = 40;
  return (
    <>
      <ThemedText style={styles.sectionTitle}>YOUR RELIC</ThemedText>
      <View style={styles.relicTeaser}>
        <View style={[styles.relicTeaserIconWrap, { width: iconSize, height: iconSize }]}>
          <View style={[StyleSheet.absoluteFill, styles.relicTeaserIconGlow]} />
          <View style={styles.relicTeaserIconGem}>
            <ThemedText style={styles.relicTeaserSparkle} accessibilityElementsHidden importantForAccessibility="no">
              ✦
            </ThemedText>
          </View>
        </View>
        <View style={styles.relicTeaserTextGroup}>
          {isSubscriber ? (
            <>
              <ThemedText style={styles.relicTeaserHeading}>Still forming</ThemedText>
              <ThemedText style={styles.relicTeaserCopy}>
                Apparently is waiting for one real pattern to qualify.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.relicTeaserHeading}>Your Relic is waiting</ThemedText>
              <ThemedText style={styles.relicTeaserCopy}>in Apparently Private.</ThemedText>
              {onDiscoverPrivate && (
                <Pressable onPress={onDiscoverPrivate} accessibilityRole="button" hitSlop={6}>
                  <ThemedText style={styles.relicTeaserCta}>Discover Private →</ThemedText>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </>
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
    // Build 9 correction: the original three dashed, hollow outline pills read as "missing
    // content" (the user's own words) rather than an intentional mystery. Replaced with three
    // VEILED pills -- same filled-plum footprint as a revealed Undercurrent pill (so the shape
    // itself already reads as "the same section, just not open yet"), each carrying a small
    // sparkle glyph instead of being empty. Still zero fabricated labels/numbers -- the glyph
    // is decorative, never a stand-in trait name.
    return (
      <>
        <ThemedText style={styles.sectionTitle}>THE UNDERCURRENT</ThemedText>
        <ThemedText style={styles.undercurrentLockedEyebrow}>PRIVATE IS STILL LEARNING YOU</ThemedText>
        <View style={styles.patternList}>
          <View style={styles.lockedSlot}>
            <ThemedText style={styles.lockedSlotGlyph}>✦</ThemedText>
          </View>
          <View style={styles.lockedSlot}>
            <ThemedText style={styles.lockedSlotGlyph}>✦</ThemedText>
          </View>
          <View style={styles.lockedSlot}>
            <ThemedText style={styles.lockedSlotGlyph}>✦</ThemedText>
          </View>
        </View>
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
      <View style={styles.patternList}>
        {signals.map((signal, index) => (
          <View key={signal.dimension} style={[styles.pattern, styles.undercurrentPattern]}>
            <ThemedText style={[styles.patternNumber, styles.undercurrentPatternNumber]}>{index + 1}</ThemedText>
            <View style={styles.patternTextGroup}>
              <ThemedText style={styles.undercurrentPatternName}>{signal.label}</ThemedText>
              <ThemedText style={styles.undercurrentPatternStrength}>{signal.strengthLabel}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// "YOUR COMMONALITY" (Build 9) — real respondent-compared data only (Bible v1.4 §25). Moved
// here from Today, where it never actually existed as real logic -- the "37%"/"06 rare picks"
// previously visible on Today were hardcoded demo literals in that screen's local-prototype
// branch (experience.source === 'local'), never real data; see get_my_commonality() in
// supabase/migrations/20261002020000_add_commonality_rpc.sql for the actual calculation this
// now reads. Honest building state (never a fabricated percentage) whenever the user has
// fewer than 10 Commonality-eligible answered questions -- exactly the Bible's own "STILL
// LEARNING THE ROOM" fallback.
function CommonalitySection({ state }: { state: CommonalityState }) {
  if (state.status === 'loading') {
    return null;
  }
  if (state.status === 'error') {
    // A failed Commonality read is never shown as a broken card on an otherwise-working You
    // page -- it simply doesn't render this section this time (the next focus/retry of You
    // tries again via loadCommonality).
    return null;
  }

  const { eligible_answer_count: eligibleCount, average_percent: percent, rare_pick_count: rareCount } = state.data;

  if (percent === null || eligibleCount < 10) {
    // Final-polish pass: its own quieter card (not the vibrant seafoam "real data" tint --
    // this is a waiting state, not an achievement) with a touch more depth and a small
    // decorative accent glyph, rather than reusing commonalityCard verbatim. Copy/thresholds
    // unchanged.
    return (
      <>
        <ThemedText style={styles.sectionTitle}>YOUR COMMONALITY</ThemedText>
        <View style={styles.commonalityBuildingCard}>
          <ThemedText style={styles.commonalityBuildingGlyph} accessibilityElementsHidden importantForAccessibility="no">
            ✦
          </ThemedText>
          <ThemedText style={styles.commonalityBuildingEyebrow}>STILL LEARNING THE ROOM</ThemedText>
          <ThemedText style={styles.commonalityBuildingCopy}>
            Answer a few more Dailies the room has also answered, and we’ll start comparing notes.
          </ThemedText>
        </View>
      </>
    );
  }

  const tagline =
    percent >= 60
      ? 'You tend to see it the way the room does.'
      : percent >= 40
        ? 'You land right in the middle of the room.'
        : 'You don’t exactly move with the crowd.';

  return (
    <>
      <ThemedText style={styles.sectionTitle}>YOUR COMMONALITY</ThemedText>
      <View style={styles.commonalityCard}>
        <ThemedText style={styles.commonalityPercent}>{percent}%</ThemedText>
        <ThemedText style={styles.commonalityTagline}>{tagline}</ThemedText>
        <ThemedText style={styles.commonalityExplainer}>
          Across the questions we can compare, your choices were shared by about {percent}% of the room.
        </ThemedText>
        <ThemedText style={styles.commonalityFootnote}>
          {eligibleCount} comparable answer{eligibleCount === 1 ? '' : 's'} · {rareCount} rare pick{rareCount === 1 ? '' : 's'}
        </ThemedText>
      </View>
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
  // Real RevenueCat entitlement only (never the client tester-access build flag) -- used
  // exclusively by the compact Relic section below to decide between an honest "still
  // forming" progress message (subscriber, no qualifying signal yet) and a "Discover
  // Private" invitation (free user). Undercurrent/the Relic's own qualification logic
  // deliberately still never reads this -- only this one piece of copy does.
  const premium = usePremiumStatus();
  const isSubscriber = premium.status === 'premium';

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
  const localRelicIdentity = useMemo(() => resolveRelicIdentity(localRelicSlots), [localRelicSlots]);

  // Real remote path — Michelle's/a real tester's own personality_evidence, never demo data.
  // Uses the SAME consumer anonymous identity Today already established (ensureAnonymousSession
  // is idempotent/concurrent-safe — see auth-service.ts); never creates a second identity,
  // never touches Admin auth.
  const [remoteState, setRemoteState] = useState<RemoteYouState>({ status: 'loading' });
  // Kept independent of remoteState (Build 9) -- a real Commonality read failing must never
  // block the rest of You (Signature/Undercurrent/Creature all have nothing to do with
  // Commonality data). See get_my_commonality() in
  // supabase/migrations/20261002020000_add_commonality_rpc.sql for the real calculation.
  const [commonalityState, setCommonalityState] = useState<CommonalityState>({ status: 'loading' });

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
    const v1Profile = scorePersonalityProfile(answers);
    const counts = computeProfileActivityCounts(evidenceResult.data, quizResultsResult.data);

    // Build 16: Scoring V2 gap-fill, additive only -- see activation.ts's own header comment.
    // A V2 fetch failure (or simply zero V2 evidence yet) falls back to v1Profile completely
    // unchanged -- never blocks or degrades the existing V1-only read.
    const poleEvidenceResult = await getMyPersonalityPoleEvidence();
    const v2Ranked = poleEvidenceResult.ok ? rankPoles(toEnginePoleEvidenceRows(poleEvidenceResult.data)) : [];
    const profile: PersonalityProfile = poleEvidenceResult.ok
      ? { ...v1Profile, topTraits: mergeCoreTraitsWithV2Gaps(v1Profile, v2Ranked) }
      : v1Profile;

    setRemoteState({ status: 'ready', profile, counts, v2Ranked });
  }, []);

  const loadCommonality = useCallback(async () => {
    setCommonalityState({ status: 'loading' });
    const result = await getMyCommonality();
    setCommonalityState(result.ok ? { status: 'ready', data: result.data } : { status: 'error', message: result.message });
  }, []);

  useFocusEffect(useCallback(() => {
    if (isRemoteDailyEnabled) {
      setCalendarNow(new Date());
      void loadRemote();
      void loadCommonality();
    }
  }, [loadRemote, loadCommonality]));

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
  const privateSignals = useMemo(() => {
    if (remoteState.status !== 'ready') {
      return [];
    }
    const v1Signals = selectStrongestPrivateSignals(remoteState.profile);
    // Build 16: same V2 gap-fill rule as profileCards/the Creature above, applied here to the
    // simpler PrivateSignalTrait[] shape Relic's own slot selection reads -- see activation.ts.
    return mergePrivateSignalsWithV2Gaps(v1Signals, remoteState.profile, remoteState.v2Ranked);
  }, [remoteState]);
  const relicSlots: RelicSlotAssignment = useMemo(() => selectRelicSlots(privateSignals), [privateSignals]);
  const resolvedRelicSlotCount = [relicSlots.relicTrait, relicSlots.colorTrait, relicSlots.effectTrait].filter(Boolean).length;
  // Real Private -> Relic identity resolution (production consolidation pass) -- base object
  // from rank #1's pole, color family from rank #2's pole, effect from rank #3's pole's family.
  // null until a given rank is itself qualified; IdentityHero/RelicGlyph only render the real
  // RelicAvatar once all three are non-null, matching the Bible's locked-silhouette-until-3
  // rule exactly (see relic-production-config.ts).
  const relicIdentity = useMemo(() => resolveRelicIdentity(relicSlots), [relicSlots]);

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
        <PortalRings />
        <CelestialWash />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            {/* BrandSignature's 'mark' variant renders magnetic-loop.png, which has a baked-in
                cream background (confirmed: plain RGB, no alpha channel) -- invisible on the
                app's old light pages, a visible white square on this dark one. The approved
                preview's top bar is the wordmark alone, matching Today's own top bar exactly. */}
            <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              style={styles.gearButton}>
              <ThemedText style={styles.gearIcon}>⚙</ThemedText>
            </Pressable>
          </View>

          {/* Visual-redesign pass: Creature, pre-reveal copy, Evolution chip, and the "Meki,
              apparently." identity line are wrapped as ONE cluster with its own tight internal
              gap -- separate from the uniform Spacing.four rhythm `content` uses between major
              sections below -- so they read as one composed hero scene instead of stacked,
              evenly-spaced modules (direct user feedback: "feel disconnected"). */}
          <View style={styles.heroCluster}>
            <IdentityHero
              isWide={isWide}
              creature={isRemoteDailyEnabled ? visibleCreature : null}
              onGetYourRead={isRemoteDailyEnabled ? () => router.push('/creature-read') : null}
            />

            {isRemoteDailyEnabled && creaturePreRevealCopy && (
              <ThemedText style={styles.creaturePreRevealCopy}>{creaturePreRevealCopy}</ThemedText>
            )}

            {isRemoteDailyEnabled && remoteState.status === 'ready' && (
              <View style={styles.evolutionDateChipRow}>
                <View style={styles.evolutionDateChip}>
                  <ThemedText style={styles.evolutionDateChipText}>
                    {mixedSnapshot
                      ? pendingEvolutionDate
                        ? `Evolution Day · ${formatEvolutionDate(pendingEvolutionDate)}`
                        : `Next evolution · ${formatEvolutionDate(nextEvolutionDate)}`
                      : 'Evolution Day · Friday'}
                  </ThemedText>
                </View>
              </View>
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
          </View>

          {!isRemoteDailyEnabled && (
            <>
              <ThemedText style={styles.sectionTitle}>YOUR SIGNATURE</ThemedText>
              <View style={styles.patternList}>
                {localTopPatterns.map((pattern, index) => (
                  <View key={pattern.id} style={styles.pattern}>
                    <ThemedText style={styles.patternNumber}>{index + 1}</ThemedText>
                    <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
                  </View>
                ))}
              </View>
              <UndercurrentSection signals={localPrivateSignals} />
              <RelicSection
                isWide={isWide}
                isSubscriber={false}
                resolvedSlotCount={localResolvedRelicSlotCount}
                identity={localRelicIdentity}
                onTapRelic={null}
                onDiscoverPrivate={null}
              />
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
              {/* Build 15 correction: this section previously rendered NOTHING -- not even its
                  own "YOUR SIGNATURE" heading -- whenever the user had real activity but no
                  Core trait had yet crossed the active-board qualification threshold
                  (buildYourSignatureCards returning []). Every sibling section below
                  (Undercurrent, Commonality) already has an honest "still building" fallback
                  for exactly this situation; Your Signature was the one section silently
                  disappearing instead. Always render the heading once there is real activity;
                  show the real cards once >=1 trait has qualified, otherwise an honest
                  building state -- never a fabricated trait or fake progress bar. */}
              <ThemedText style={styles.sectionTitle}>YOUR SIGNATURE</ThemedText>
              {profileCards.length > 0 ? (
                <View style={styles.patternList}>
                  {profileCards.map((card, index) => (
                    <View key={card.dimension} style={styles.pattern}>
                      <ThemedText style={styles.patternNumber}>{index + 1}</ThemedText>
                      <View style={styles.patternTextGroup}>
                        <ThemedText style={styles.patternName}>{card.label}</ThemedText>
                        <ThemedText style={styles.patternStrength}>{card.strengthLabel}</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.signatureBuildingCard}>
                  <ThemedText style={styles.signatureBuildingGlyph} accessibilityElementsHidden importantForAccessibility="no">
                    ✦
                  </ThemedText>
                  <ThemedText style={styles.signatureBuildingEyebrow}>STILL TAKING SHAPE</ThemedText>
                  <ThemedText style={styles.signatureBuildingCopy}>
                    Answer a few more Dailies and quizzes — your Signature appears once a real pattern qualifies.
                  </ThemedText>
                </View>
              )}

              <UndercurrentSection signals={privateSignals} />

              <RelicSection
                isWide={isWide}
                isSubscriber={isSubscriber}
                resolvedSlotCount={resolvedRelicSlotCount}
                identity={relicIdentity}
                onTapRelic={() => router.push('/relic-read')}
                onDiscoverPrivate={() => router.push('/private')}
              />

              <CommonalitySection state={commonalityState} />

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
    // Celestial redesign (approved Option B) -- same outer wrapper tone as Today/onboarding
    // (src/app/(tabs)/index.tsx), replacing the old light cream Surface.pageDeep.
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
  content: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.five, gap: Spacing.four },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  gearButton: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 22, color: Celestial.textSecondary },

  // Hero cluster -- no card chrome at all now (matching the approved preview's floating
  // Creature, same "no more rectangles" direction as Today's Free Daily): the pink glass wash
  // this used to have is gone; PortalRings/CelestialWash (rendered once, behind the whole
  // page) carry the atmosphere instead.
  // Build 15: paddingVertical tightened from Spacing.four -- real personality information
  // (Your Signature etc.) was buried too far down; the Creature stays the unambiguous hero
  // but no longer claims more vertical space than its own content needs.
  heroCluster: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },

  // --- Identity hero (the Creature centerpiece + name/Relic) ------------------------------
  // Wide: a ROW — Creature left, name+Relic right (the approved left/right layout, which has
  // room to hold at this size on a wide viewport). Narrow: a COLUMN — the centerpiece Creature
  // is too large to sit beside the name+Relic without cropping or squeezing either on a phone
  // width, so narrow stacks them instead (see IdentityHero's own comment for why).
  // Visual-redesign pass: wide tightened from Spacing.five to Spacing.four, and heroColumn's
  // gap shrunk, so the Creature/name/Relic/CTA read as one composed scene rather than
  // separately-spaced widgets (direct user feedback: "feel disconnected").
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  heroColumn: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  // The Creature's own "stage" -- centers the avatar/placeholder over its glow atmosphere.
  // Sized off glowSize (computed in IdentityHero) so the footprint never jumps between the
  // placeholder and the real Creature. overflow 'visible' is deliberate -- AtmosphericGlow's
  // outer rings are intentionally larger than this box so the atmosphere bleeds outward rather
  // than terminating in a visible edge at the stage boundary.
  heroStage: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  // Shared regardless of width — only the character-name type size and relic size below
  // scale; the group's own alignment/gap stays constant. `maxWidth` + `flexShrink` let the
  // placeholder name wrap onto a second line rather than force horizontal overflow if a
  // future real character name is ever longer than this one. gap tightened (Spacing.two ->
  // Spacing.one) so name/Relic/CTA read as one connected stack, not separated modules.
  relicGroup: { alignItems: 'center', gap: Spacing.one, flexShrink: 1, maxWidth: 240 },
  // On narrow, the group no longer sits beside the avatar in a row with its own flexShrink
  // context, so it gets a plain, centered, non-shrinking width instead.
  relicGroupNarrow: { maxWidth: 280 },
  // Pre-reveal mystery label ("Not Yet Named") -- a quiet tracked-uppercase line, intentional
  // rather than a literal placeholder string.
  characterNameMystery: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: 'rgba(255,249,245,0.55)',
    textAlign: 'center',
  },
  characterNameMysteryWide: {},
  characterNameMysteryNarrow: {},
  characterNameRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  characterNameOrnament: { color: Brand.gold, fontSize: 13, opacity: 0.75 },
  // Revealed name -- the same serif-italic "major identity moment" treatment as Today/Read's
  // own prompt/quote text (Fonts.serif, italic, weight 500), matching the approved preview
  // exactly rather than the shared Type.display token (which several other untouched screens
  // also consume -- see the equivalent note in onboarding.tsx for why this isn't shared there
  // either).
  characterNameRevealed: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  characterNameRevealedWide: { fontSize: 40, lineHeight: 46, letterSpacing: -0.3 },
  characterNameRevealedNarrow: { fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  // Build 15 compact Relic section — rendered after Undercurrent, not beside the Creature.
  // "Revealed/forming" row: real RelicAvatar artwork (untouched) at a small, balanced size
  // next to a short status line — reads as a secondary collectible beneath the personality
  // information, never competing with the Creature hero above.
  relicRevealedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  relicRevealedWrap: { alignItems: 'center', justifyContent: 'center' },
  relicRevealedTextGroup: { flex: 1, gap: 2 },
  relicRevealedLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  relicRevealedSub: { color: Brand.gold, fontSize: 12.5, fontWeight: '700' },
  // Locked/compact teaser — explicitly small (~80-120pt tall total with heading+title), a
  // miniature of the same gem-silhouette language the old large placeholder used (rotated
  // square, gold glow, sparkle), just at icon scale (40pt) rather than a 94-130pt "finished
  // collectible." No portal, no oversized decorative background.
  relicTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.25)',
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  relicTeaserIconWrap: { alignItems: 'center', justifyContent: 'center' },
  relicTeaserIconGlow: { borderRadius: 999, backgroundColor: 'rgba(246,184,63,0.16)' },
  relicTeaserIconGem: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.45)',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  relicTeaserSparkle: { color: Brand.gold, fontSize: 11, transform: [{ rotate: '-45deg' }] },
  relicTeaserTextGroup: { flex: 1, gap: 2 },
  relicTeaserHeading: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  relicTeaserCopy: { color: Celestial.textSecondary, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
  relicTeaserCta: { color: Brand.gold, fontSize: 12.5, fontWeight: '800', marginTop: 2 },
  // Premium gold CTA (matches Today/Read's "View Your Read" treatment) -- was a plum pill,
  // which read fine against the old light cream page but would nearly disappear against this
  // page's own dark plum background.
  getYourReadButton: {
    marginTop: Spacing.two,
    minHeight: 44,
    borderRadius: Radius.pill,
    backgroundColor: Brand.gold,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
  },
  getYourReadButtonText: { color: Brand.plum, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },

  creaturePreRevealCopy: {
    textAlign: 'center',
    color: Celestial.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: Spacing.four,
  },
  // Build 9: a quiet collectible-status chip, not a headline -- Evolution Day is a background
  // fact about the Creature, not the thing the page is shouting about.
  evolutionDateChipRow: { alignItems: 'center' },
  evolutionDateChip: {
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
  },
  evolutionDateChipText: {
    color: Celestial.textPrimary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  evolutionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  evolutionPromptCopy: { flex: 1, gap: Spacing.one },
  evolutionPromptTitle: { ...Type.heading, color: Celestial.textPrimary },
  evolutionPromptSupporting: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 18 },
  evolutionPromptButton: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  evolutionPromptButtonText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
  identityHeader: { alignItems: 'center', gap: Spacing.one },
  displayName: { ...Type.display, color: Celestial.textPrimary, textAlign: 'center' },
  subline: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '600' },
  sublineSecondary: { color: Celestial.textSecondary, fontSize: 12, fontWeight: '600', opacity: 0.75, marginTop: 1 },

  eyebrow: { ...Type.eyebrow, color: Brand.gold },
  sectionTitle: { ...Type.heading, color: Celestial.textPrimary, letterSpacing: 0.6 },

  // Horizontal scroll + a card wide enough that even the longest single-word dimension
  // label (e.g. "Collaborative", "Peacekeeping" — 12-13 characters, no space or hyphen to
  // wrap on) fits on one line at this font size. `gap` (not `justifyContent: 'space-between'`)
  // guarantees a fixed minimum gap between the number/name/strength rows regardless of
  // whether the name renders as one line or two.
  // Build 9: refined compact pills, replacing the old 192x124 boxy cards -- auto-width, a
  // small rank badge beside the trait name, strength as a quiet caption underneath. Readable
  // at a glance, not a dashboard tile.
  patternList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingVertical: Spacing.one },
  // Visual-redesign pass: a quiet lift (Elevation.soft) added -- same compact pill shape the
  // user explicitly wants kept, just with a touch of the rest of the page's premium shadow
  // language so it doesn't read as flat color chips next to the richer hero above it.
  // Fixed celestial card fill -- replaces the old per-index PastelAccentRotation (a
  // light-page-only palette) with the same single dark-glass treatment the rest of this page
  // and Today both already use, consistent with the approved preview's uniform Your Signature
  // cards.
  pattern: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  patternNumber: {
    color: Brand.gold,
    fontSize: 11,
    fontWeight: '800',
    width: 18,
    height: 18,
    lineHeight: 18,
    textAlign: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(246,184,63,0.18)',
    overflow: 'hidden',
  },
  patternTextGroup: { gap: 1 },
  patternName: { color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '800' },
  patternStrength: { fontSize: 11, fontWeight: '700', color: Celestial.textSecondary, letterSpacing: 0.2 },

  // The Undercurrent's own pills (Build 8 Pass 3; pill treatment Build 9) — a rose/pink tint
  // (Private's own established accent, matching the Read modal's Private treatment) instead
  // of solid Brand.plum, which would nearly disappear against this page's own dark plum
  // background. Never rendered with fewer than 1 or more than 3 real cards.
  undercurrentPattern: { backgroundColor: 'rgba(255,158,214,0.14)', borderWidth: 1, borderColor: 'rgba(255,158,214,0.3)' },
  undercurrentPatternNumber: { color: '#FF9ED6', backgroundColor: 'rgba(255,255,255,0.14)' },
  undercurrentPatternName: { color: '#FFFFFF', fontSize: 14, lineHeight: 17, fontWeight: '800' },
  undercurrentPatternStrength: { fontSize: 11, fontWeight: '700', color: '#FF9ED6', letterSpacing: 0.2 },

  // Locked Undercurrent state (no qualifying Private evidence yet) -- Build 9 correction: three
  // VEILED pills, not hollow dashed outlines (the prior treatment read as "missing content,"
  // per direct user feedback on the real preview). Same light-glass fill as every other card
  // on this now-dark page (the old translucent-plum fill was tuned for a light page and would
  // read as near-invisible dark-on-dark here) -- the shape itself still communicates "the same
  // section, sealed" rather than "empty." Each carries a small sparkle glyph -- purely
  // decorative, never a fabricated trait label.
  undercurrentLockedEyebrow: { ...Type.eyebrow, color: '#FF9ED6', opacity: 0.9, marginTop: -Spacing.one },
  lockedSlot: {
    width: 104,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedSlotGlyph: { color: 'rgba(255,158,214,0.7)', fontSize: 15, opacity: 0.9 },
  undercurrentTeaser: {
    gap: Spacing.three,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  undercurrentTeaserCopy: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  undercurrentTeaserCta: { backgroundColor: Brand.gold, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  undercurrentTeaserCtaText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },

  // "YOUR COMMONALITY" (Build 9) -- one elegant editorial card, real data only. Same dark-glass
  // card language as the rest of this page now, in place of the light seafoam/lavender washes
  // tuned for the old page -- "real data" vs. "waiting" stays distinguished by a gold vs.
  // violet accent instead of by two different light tints.
  commonalityCard: {
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(246,184,63,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.25)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  commonalityPercent: { ...Type.display, color: '#FFFFFF', fontSize: 40, lineHeight: 44 },
  commonalityTagline: { ...Type.body, color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  commonalityExplainer: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: Spacing.half },
  commonalityFootnote: { color: Celestial.textSecondary, fontSize: 12, fontWeight: '700', opacity: 0.75, marginTop: Spacing.one },
  signatureBuildingCard: {
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: 'rgba(246,184,63,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.28)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  signatureBuildingGlyph: { color: Brand.gold, fontSize: 18, opacity: 0.85, marginBottom: 2 },
  signatureBuildingEyebrow: { ...Type.eyebrow, color: Celestial.textSecondary },
  signatureBuildingCopy: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: Spacing.one },
  commonalityBuildingCard: {
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: 'rgba(147,110,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(147,110,255,0.25)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  commonalityBuildingGlyph: { color: Brand.violet, fontSize: 18, opacity: 0.8, marginBottom: 2 },
  commonalityBuildingEyebrow: { ...Type.eyebrow, color: Celestial.textSecondary },
  commonalityBuildingCopy: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: Spacing.one },

  // Additive quiz-completion card — same dark-glass card language, distinct via a gold accent.
  recentReadCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  recentReadQuizTitle: { color: Celestial.textSecondary, fontSize: 13, fontWeight: '600' },
  recentReadResultTitle: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: Spacing.half },
  recentReadCta: { color: Brand.gold, fontSize: 14, fontWeight: '800', marginTop: Spacing.one },

  // Remote-only loading/error/empty states — never demo data behind any of these.
  stateCard: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  stateText: { color: Celestial.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  retryButton: { backgroundColor: Brand.gold, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryButtonText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
  emptyStateCard: {
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  emptyStateCopy: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
});
