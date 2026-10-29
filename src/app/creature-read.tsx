import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { AtmosphericGlow } from '@/components/creature/atmospheric-glow';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import { Celestial, CelestialWash, PortalRings } from '@/components/today/celestial';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { buildCombinedCreatureReadByLabel, type CombinedCreatureRead } from '@/data/creature/creature-combined-read-copy';
import { buildFirstFormIdentity, CREATURE_SLOT_BY_RANK, type CreatureRecipe } from '@/data/creature/creature-identity';
import { getCreatureReadCopyByLabel, getCreatureReadPoleCopy } from '@/data/creature/creature-read-copy';
import { loadCreatureEvolutionState, type CreatureEvolutionState } from '@/data/creature/creature-reveal-state';
import { isFirstFormEligible } from '@/data/creature/creature-progression';
import { scorePersonalityProfile, type PersonalityProfile } from '@/data/personality';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { ensureAnonymousSession } from '@/services/auth-service';
import { computeProfileActivityCounts, getMyPersonalityEvidence, getMyQuizResults, groupEvidenceIntoAnswers } from '@/services/personality-service';
import {
  isSaveCreatureImageSupported,
  isShareCreatureImageSupported,
  saveCreatureImageFromRef,
  shareCreatureImageFromRef,
} from '@/services/save-creature-image';

const AVATAR_SIZE = 180;
const AVATAR_STAGE_SIZE = 240;
// The combined Read's own premium frame (CombinedReadReveal below) is a more compact,
// text-forward composition than the full-width First Form moment above -- the Creature sits
// alongside a name, headline, and two paragraphs within one frame, so a slightly smaller
// avatar keeps the whole frame comfortable on an SE-width phone without crowding the text that
// follows it. Same CreatureAvatar/AtmosphericGlow components, same real calibrated recipe --
// only the display size differs.
const COMBINED_AVATAR_SIZE = 148;
const COMBINED_AVATAR_STAGE_SIZE = 196;

// Celestial accent rotation for the mixed Creature's five part-cards — same role the old
// PastelAccentRotation played (visually distinguish each of the five parts), rebuilt from the
// real Brand tokens already used across the dark system rather than the light-only pastels.
const CELESTIAL_ACCENT_ROTATION = [Brand.gold, Brand.coral, Brand.pink, Brand.violet, Brand.mint];

const CREATURE_TEST_SLOT_LABEL: Record<(typeof CREATURE_SLOT_BY_RANK)[number], string> = {
  eyes: 'THE EYES',
  earsHorns: 'THE EARS / HORNS',
  wings: 'THE WINGS',
  body: 'THE SHAPE',
  tail: 'THE TAIL',
};

type ReadEntry = {
  slotLabel: string;
  traitName: string;
  explanation: string;
  apparentlyLine: string;
};

type ReadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  // Genuinely no Creature yet (below First Form) -- an honest state, never a fabricated read.
  | { kind: 'not-yet' }
  | { kind: 'first-form'; name: string; recipe: CreatureRecipe; entry: ReadEntry }
  | { kind: 'mixed'; name: string; recipe: CreatureRecipe; entries: ReadEntry[]; combinedRead: CombinedCreatureRead | null };

export default function CreatureReadScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  // Measured here, OUTSIDE any <Modal> -- react-native-safe-area-context's automatic Modal
  // handling is a known rough edge on iOS: a <SafeAreaView>/useSafeAreaInsets() call made
  // FROM INSIDE a Modal's own subtree (as CreaturePreviewModal's close button previously
  // relied on exclusively) can read stale or zero insets depending on RN/iOS version, which
  // is exactly what put the close button almost under the status bar/notch/Dynamic Island.
  // Insets measured on this always-mounted parent screen are reliably correct (this app is
  // portrait-locked, so they don't change mid-session) and are passed down as a plain prop
  // instead of trusting a second hook call inside the modal.
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [profileAnswerCount, setProfileAnswerCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [evolutionState, setEvolutionState] = useState<CreatureEvolutionState | null>(null);
  // One shared preview modal for both First Form and mixed Creatures -- opened by tapping the
  // single primary avatar below, never a second always-visible Creature render.
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    await ensureAnonymousSession();
    const [evidenceResult, quizResultsResult] = await Promise.all([getMyPersonalityEvidence(), getMyQuizResults()]);
    if (!evidenceResult.ok) {
      setLoadError(evidenceResult.message);
      return;
    }
    if (!quizResultsResult.ok) {
      setLoadError(quizResultsResult.message);
      return;
    }
    const answers = groupEvidenceIntoAnswers(evidenceResult.data);
    setProfile(scorePersonalityProfile(answers));
    setProfileAnswerCount(computeProfileActivityCounts(evidenceResult.data, quizResultsResult.data).profileAnswerCount);
  }, []);

  useEffect(() => {
    // Fetching data on mount is one of the canonical, documented uses of an effect -- there is
    // no render-time equivalent for "go fetch this from the network." Scoped to this one line.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

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

  // Reads the SAME persisted mixed-Creature snapshot the You page displays, rather than
  // recomputing a fresh candidate -- what the user sees here must always match what they see
  // as their "current" Creature on You, even if their live profile has drifted further since
  // their last Friday evolution check (see creature-progression.ts's own header comment on
  // why the mixed snapshot is the stable, presented identity).
  const readState = useMemo<ReadState>((): ReadState => {
    if (loadError) {
      return { kind: 'error', message: loadError };
    }
    if (!profile || evolutionState === null) {
      return { kind: 'loading' };
    }

    const mixedSnapshot = evolutionState.mixedSnapshot;
    if (mixedSnapshot) {
      const sortedTraits = [...mixedSnapshot.traits].sort((a, b) => a.rank - b.rank);
      const entries: ReadEntry[] = sortedTraits.map((trait) => {
        const copy = getCreatureReadCopyByLabel(trait.traitName);
        return {
          slotLabel: CREATURE_TEST_SLOT_LABEL[trait.part],
          traitName: trait.traitName,
          explanation: copy.explanation,
          apparentlyLine: copy.apparentlyLine,
        };
      });
      // The combined Read is authored per exact rank-1/rank-2 trait pair (creature-
      // combined-read-copy.ts), never derived from the five part cards' explanation/
      // apparentlyLine copy above. Only null if a mixed snapshot somehow has fewer than two
      // ranked traits, which isComplete already guarantees cannot happen for a real snapshot.
      const combinedRead =
        sortedTraits.length >= 2
          ? buildCombinedCreatureReadByLabel(sortedTraits[0].traitName, sortedTraits[1].traitName)
          : null;
      return {
        kind: 'mixed',
        name: mixedSnapshot.name,
        recipe: mixedSnapshot.recipe,
        entries,
        combinedRead,
      };
    }

    const firstForm = buildFirstFormIdentity(profile);
    if (isFirstFormEligible(profileAnswerCount, firstForm) && firstForm) {
      const copy = getCreatureReadPoleCopy(firstForm.trait);
      return {
        kind: 'first-form',
        name: firstForm.name,
        recipe: firstForm.recipe,
        entry: {
          slotLabel: 'YOUR FIRST FORM',
          traitName: firstForm.trait.name,
          explanation: copy.explanation,
          apparentlyLine: copy.apparentlyLine,
        },
      };
    }

    return { kind: 'not-yet' };
  }, [evolutionState, loadError, profile, profileAnswerCount]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, contentWidth ? { maxWidth: contentWidth } : null]}>
        <PortalRings />
        <CelestialWash />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <ThemedText style={styles.wordmark}>apparently you.</ThemedText>
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button" style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          {readState.kind === 'loading' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>Reading your patterns…</ThemedText>
            </View>
          )}

          {readState.kind === 'error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>We couldn’t load your read right now.</ThemedText>
              <Pressable style={styles.retryButton} onPress={() => void load()}>
                <ThemedText style={styles.retryButtonText}>Retry →</ThemedText>
              </Pressable>
            </View>
          )}

          {readState.kind === 'not-yet' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.eyebrow}>YOUR READ</ThemedText>
              <ThemedText style={styles.stateText}>
                Your Creature hasn’t taken shape yet. Keep answering — a read appears once a real pattern starts to hold.
              </ThemedText>
            </View>
          )}

          {readState.kind === 'first-form' && (
            <>
              <TappableCreatureAvatar recipe={readState.recipe} onPress={() => setPreviewOpen(true)} />
              <ThemedText style={styles.pageEyebrow}>{readState.name.toUpperCase()}</ThemedText>
              <ThemedText style={styles.pageIntro}>
                Your Creature is still in its First Form — built entirely from the single pattern showing up strongest right now.
              </ThemedText>
              <ReadCard entry={readState.entry} />
            </>
          )}

          {readState.kind === 'mixed' && (
            <>
              {/* Premium visual redesign (Build 19): the Creature, its name, and the combined
                  Read now sit inside ONE framed reveal rather than a floating avatar above a
                  separate text card -- see CombinedReadReveal below. Copy/wording, trait
                  mapping, and the avatar's real calibrated recipe are all unchanged; only the
                  presentation around them changed. */}
              <CombinedReadReveal
                name={readState.name}
                recipe={readState.recipe}
                combinedRead={readState.combinedRead}
                onAvatarPress={() => setPreviewOpen(true)}
              />
              <ThemedText style={styles.partsEyebrow}>THE FIVE PARTS</ThemedText>
              {readState.entries.map((entry, index) => (
                <ReadCard key={entry.slotLabel} entry={entry} accent={CELESTIAL_ACCENT_ROTATION[index % CELESTIAL_ACCENT_ROTATION.length]} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {(readState.kind === 'first-form' || readState.kind === 'mixed') && (
        <CreaturePreviewModal
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          name={readState.name}
          recipe={readState.recipe}
          insets={insets}
        />
      )}
    </ThemedView>
  );
}

// The ONE visible Creature on Your Read -- tappable, with a subtle cue. Opens the preview
// modal rather than rendering a second avatar inline (the Build 16 duplicate-Creature bug came
// from a second, always-visible export card rendered directly beneath this exact stage).
// size/stageSize default to the First Form stage's own dimensions; CombinedReadReveal below
// passes its own smaller sizes for its more compact, text-forward frame -- same
// CreatureAvatar/AtmosphericGlow components and real calibrated recipe either way, only the
// display size differs.
function TappableCreatureAvatar({
  recipe,
  onPress,
  size = AVATAR_SIZE,
  stageSize = AVATAR_STAGE_SIZE,
}: {
  recipe: CreatureRecipe;
  onPress: () => void;
  size?: number;
  stageSize?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View your Creature"
      hitSlop={8}
      style={({ pressed }) => [styles.avatarTapTarget, pressed && styles.avatarTapTargetPressed]}
    >
      <View style={[styles.avatarStage, { width: stageSize, height: stageSize }]}>
        <AtmosphericGlow size={stageSize} />
        <CreatureAvatar recipe={recipe} size={size} />
      </View>
      <ThemedText style={styles.tapCue}>Tap to view your Creature</ThemedText>
    </Pressable>
  );
}

// Premium visual redesign (Build 19, "Option A" direction): the mixed Creature's name, its
// real assembled avatar, and the combined Read's headline/paragraphs now present as ONE
// framed editorial reveal -- a portrait, not a development-style text block. Built entirely
// from existing tokens (Brand/Celestial/Radius/Fonts) and the same plain-View/rgba-layering
// technique already used by PortalRings/CelestialWash/AtmosphericGlow elsewhere in this app
// (see celestial.tsx's own header comment on why: no gradient/blur library, works identically
// on native and web). No new copy, no changed trait mapping, no changed avatar calibration --
// this component only arranges the same real data (name/recipe/combinedRead) differently.
function CombinedReadReveal({
  name,
  recipe,
  combinedRead,
  onAvatarPress,
}: {
  name: string;
  recipe: CreatureRecipe;
  combinedRead: CombinedCreatureRead | null;
  onAvatarPress: () => void;
}) {
  return (
    <View style={styles.revealFrame}>
      {/* Decorative corner washes only -- absolutely positioned, pointerEvents none, clipped
          by the frame's own overflow:hidden. Violet echoes the page's own CelestialWash;
          coral is a restrained second accent, never competing with the gold hairline frame. */}
      <View pointerEvents="none" style={styles.revealGlowTopLeft} />
      <View pointerEvents="none" style={styles.revealGlowBottomRight} />

      <View style={styles.revealInner}>
        <View style={styles.revealEyebrowRow}>
          <ThemedText style={styles.revealSparkle} accessibilityElementsHidden importantForAccessibility="no">
            ✦
          </ThemedText>
          <ThemedText style={styles.combinedEyebrow}>YOUR READ, COMBINED</ThemedText>
          <ThemedText style={styles.revealSparkle} accessibilityElementsHidden importantForAccessibility="no">
            ✦
          </ThemedText>
        </View>

        <ThemedText style={styles.combinedName}>{name}</ThemedText>

        <TappableCreatureAvatar
          recipe={recipe}
          onPress={onAvatarPress}
          size={COMBINED_AVATAR_SIZE}
          stageSize={COMBINED_AVATAR_STAGE_SIZE}
        />

        {combinedRead && (
          <>
            <View style={styles.revealDivider}>
              <View style={styles.revealDividerLine} />
              <ThemedText style={styles.revealSparkle} accessibilityElementsHidden importantForAccessibility="no">
                ✦
              </ThemedText>
              <View style={styles.revealDividerLine} />
            </View>

            <ThemedText style={styles.combinedHeadline}>{combinedRead.headline}</ThemedText>

            <View style={styles.combinedParagraphGroup}>
              <ThemedText style={styles.combinedParagraph}>{combinedRead.paragraph1}</ThemedText>
              <ThemedText style={styles.combinedParagraph}>{combinedRead.paragraph2}</ThemedText>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// accent (optional) -- Build 9 visual-redesign pass: a mixed Creature's five cards previously
// all rendered as identical plain white cards. A per-slot pastel wash (the same
// PastelAccentRotation Your Signature's pills already use) visually distinguishes each of the
// five parts, per the request to make the mixed read "feel collectible/editorial." First
// Form's single card stays plain white (no accent passed) since there is nothing to
// distinguish it from.
function ReadCard({ entry, accent }: { entry: ReadEntry; accent?: string }) {
  return (
    <View style={[styles.readCard, accent ? { borderColor: `${accent}55` } : null]}>
      <ThemedText style={[styles.readCardEyebrow, accent ? { color: accent } : null]}>{entry.slotLabel}</ThemedText>
      <ThemedText style={styles.readCardTraitName}>{entry.traitName}</ThemedText>
      <ThemedText style={styles.readCardExplanation}>{entry.explanation}</ThemedText>
      <ThemedText style={styles.readCardApparently}>{entry.apparentlyLine}</ThemedText>
    </View>
  );
}

// Creature Preview (Build 17) -- an immersive, full-screen modal: dark plum celestial
// background (matching this screen's own PortalRings/CelestialWash), the Creature large and
// centered, its real name, a visible close button, and the two actions. The capture target
// (exportCard below) is a dedicated, self-contained subtree -- celestial background, the
// Creature's own calibrated avatar at its real recipe, its name, a small brand mark -- rendered
// INSIDE this modal but never including the close button or the two action buttons (those live
// as siblings, outside the ref'd view), so a saved/shared image can never pick up modal chrome.
type ActionState =
  | { phase: 'idle' }
  | { phase: 'saving' }
  | { phase: 'save-done' }
  | { phase: 'save-error'; message: string }
  | { phase: 'sharing' }
  | { phase: 'share-error'; message: string };

function CreaturePreviewModal({
  visible,
  onClose,
  name,
  recipe,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  name: string;
  recipe: CreatureRecipe;
  // Measured by the parent screen, outside this Modal -- see CreatureReadScreen's own comment
  // on why this is passed in rather than calling useSafeAreaInsets()/relying on SafeAreaView
  // again from inside the modal's own subtree.
  insets: EdgeInsets;
}) {
  const exportCardRef = useRef<View>(null);
  const [actionState, setActionState] = useState<ActionState>({ phase: 'idle' });
  const { width, height } = useWindowDimensions();

  // Build 19 "make the Creature the star" pass: the card used to be a hardcoded 300px wide
  // box regardless of screen size, with a 260px avatar cap inside it -- on a 390-430px-wide
  // phone that left most of the width unused. The card now fills nearly the full available
  // width (capped for tablet/web); the avatar is sized off that real card width instead of a
  // flat multiplier.
  //
  // "85-90% of usable width" means the real VISIBLE Creature art, not CreatureAvatar's own
  // `size` prop -- `size` is the full calibrated composition square, which includes the built-
  // in safe margin for wide wings/ears/tail (creature-identity.ts's BODY_CANVAS_INSET). On the
  // approved Zorafox fixture this was measured directly (a dedicated flat-background render,
  // pixel-scanned for the real non-background bounding box): the wings alone already reach
  // ~100-108% of the nominal square's width, 84% of its height. Targeting 85% of the card's
  // inner width for `size` itself (not 85% of `size` for the art) keeps real headroom for any
  // recipe's wingspan before it could ever approach the card's own border -- avoiding exactly
  // the "clipping/stretching/distortion" the brief prohibits -- while still reliably landing
  // the real visible artwork in the requested 85-90% range for a typical recipe.
  const cardOuterMargin = Spacing.three;
  const cardWidth = Math.min(width - cardOuterMargin * 2, 480);
  const cardInnerPadding = Spacing.three;
  const cardInnerWidth = cardWidth - cardInnerPadding * 2;
  const creatureSizeByWidth = cardInnerWidth * 0.85;

  // Close button fix: a 48x48 touch target (the brief's preferred size, up from the previous
  // 44x44 minimum) with an EXPLICIT top offset of insets.top + a comfortable fixed gap --
  // computed here once and reused both for this height math and the actual style below, so
  // the two can never drift apart. See this component's own JSX comment on why the top offset
  // is explicit rather than left to SafeAreaView alone.
  const closeButtonSize = 48;
  const topRowGap = Spacing.three;
  const topRowHeight = insets.top + topRowGap + closeButtonSize;

  // Also bounded by real available vertical space -- topRow (close button) + the card's own
  // vertical padding/name/brand-mark text + the action row (Share/Save buttons) below, using
  // this screen's own real style values, not a guess, plus the device's actual safe-area
  // insets (smaller iPhones and devices with a different notch/home-indicator inset both covered).
  const actionRowHeight = 36 + Spacing.five + 20; // button (~36) + paddingBottom(32) + room for an error line
  const cardTextBlockHeight = 31 + Spacing.one + 18 + Spacing.one; // exportName + its marginTop + exportMark + its marginTop
  const cardVerticalPadding = Spacing.five * 2; // exportCard's own paddingVertical, top+bottom
  const availableHeight = height - topRowHeight - insets.bottom - actionRowHeight;
  const creatureSizeByHeight = availableHeight - cardVerticalPadding - cardTextBlockHeight - Spacing.one * 2;

  const creatureSize = Math.max(140, Math.min(creatureSizeByWidth, creatureSizeByHeight));
  const glowSize = creatureSize * 1.15;

  // React's documented "adjusting state when a prop changes" pattern (setState during render,
  // not in an effect) -- a stale "Saved ✓"/error from a previous open must never greet the
  // user on reopen, and this fires exactly once per real open/close transition.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setActionState({ phase: 'idle' });
  }

  // Reverts "Saved ✓" back to the normal button after a moment -- a real timer, which has no
  // render-time equivalent (synchronizing with the passage of time is exactly what an effect
  // is for).
  useEffect(() => {
    if (actionState.phase !== 'save-done') {
      return;
    }
    const timeout = setTimeout(() => setActionState({ phase: 'idle' }), 2500);
    return () => clearTimeout(timeout);
  }, [actionState.phase]);

  const busy = actionState.phase === 'saving' || actionState.phase === 'sharing';

  const handleSave = async () => {
    if (busy) {
      return;
    }
    setActionState({ phase: 'saving' });
    const result = await saveCreatureImageFromRef(exportCardRef);
    setActionState(result.ok ? { phase: 'save-done' } : { phase: 'save-error', message: result.message });
  };

  const handleShare = async () => {
    if (busy) {
      return;
    }
    setActionState({ phase: 'sharing' });
    const result = await shareCreatureImageFromRef(exportCardRef);
    setActionState(result.ok ? { phase: 'idle' } : { phase: 'share-error', message: result.message });
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={styles.previewContainer}>
        {/* edges excludes 'top': the real top inset is applied explicitly below via the
            insets PROP (measured outside this Modal, see this component's own header
            comment) rather than a second time by SafeAreaView's own top handling, which
            would double it up. left/right/bottom still come from SafeAreaView normally --
            nothing about the close-button bug concerned those edges. */}
        <SafeAreaView style={styles.previewSafeArea} edges={['left', 'right', 'bottom']}>
          <PortalRings />
          <CelestialWash />

          <View style={[styles.previewTopRow, { paddingTop: insets.top + topRowGap }]}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={[styles.previewCloseButton, { width: closeButtonSize, height: closeButtonSize }]}
            >
              <ThemedText style={styles.previewCloseText}>×</ThemedText>
            </Pressable>
          </View>

          <View style={styles.previewCenter}>
            <View ref={exportCardRef} collapsable={false} style={[styles.exportCard, { width: cardWidth, paddingHorizontal: cardInnerPadding }]}>
              <View style={[styles.exportGlowStage, { width: glowSize, height: glowSize }]}>
                <AtmosphericGlow size={glowSize} />
                <CreatureAvatar recipe={recipe} size={creatureSize} />
              </View>
              <ThemedText style={styles.exportName}>{name}</ThemedText>
              <ThemedText style={styles.exportMark}>apparently you.</ThemedText>
            </View>
          </View>

          <View style={styles.previewActionRow}>
            {isShareCreatureImageSupported() && (
              <View style={styles.previewActionColumn}>
                <Pressable
                  style={[styles.previewActionButton, styles.previewActionSecondary, busy && styles.previewActionDisabled]}
                  onPress={() => void handleShare()}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Share Creature"
                >
                  <ThemedText style={styles.previewActionSecondaryText}>
                    {actionState.phase === 'sharing' ? 'Preparing…' : 'Share Creature'}
                  </ThemedText>
                </Pressable>
                {actionState.phase === 'share-error' && <ThemedText style={styles.previewErrorText}>{actionState.message}</ThemedText>}
              </View>
            )}

            {isSaveCreatureImageSupported() && (
              <View style={styles.previewActionColumn}>
                <Pressable
                  style={[styles.previewActionButton, busy && styles.previewActionDisabled]}
                  onPress={() => void handleSave()}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Save Creature to Photos"
                >
                  <ThemedText style={styles.previewActionText}>
                    {actionState.phase === 'saving' ? 'Saving…' : actionState.phase === 'save-done' ? 'Saved ✓' : 'Save to Photos'}
                  </ThemedText>
                </Pressable>
                {actionState.phase === 'save-error' && <ThemedText style={styles.previewErrorText}>{actionState.message}</ThemedText>}
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // The exact capture target (react-native-view-shot) -- solid background (never relies on the
  // screen's own PortalRings/CelestialWash decorations, which wouldn't be included in this
  // narrow capture region), the Creature's real calibrated avatar, its name, a small brand
  // mark. Nothing else -- no nav, no buttons, no debug UI. Rendered inside CreaturePreviewModal
  // only -- never a second, always-visible copy on the main scroll (that was the Build 16 bug).
  // width/paddingHorizontal are computed per-device in CreaturePreviewModal (real screen
  // width, not a flat number) and passed as an inline override -- see that component's own
  // comment on why a hardcoded 300px card left most of a 390-430px-wide phone unused.
  exportCard: {
    alignItems: 'center',
    backgroundColor: Celestial.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    paddingVertical: Spacing.five,
    gap: Spacing.one,
  },
  exportGlowStage: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  exportName: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 26,
    lineHeight: 31,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  exportMark: { color: Celestial.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: -0.2, marginTop: Spacing.one },

  // Creature Preview modal -- full-bleed dark plum celestial background, matching this
  // screen's own container/safeArea treatment exactly.
  previewContainer: { flex: 1, backgroundColor: '#17000F' },
  previewSafeArea: { flex: 1, backgroundColor: Celestial.background },
  // paddingTop is applied inline (insets.top + topRowGap) -- see CreaturePreviewModal's own
  // comment; no static fallback here since it's always provided.
  previewTopRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.four },
  // width/height are applied inline (closeButtonSize, 48) -- alignItems/justifyContent both
  // 'center' so the × glyph sits in the exact middle of its touch target, not pushed to one
  // edge (the previous alignItems:'flex-end' here was a bug: it visually offset the glyph
  // toward the button's own right edge instead of centering it).
  previewCloseButton: { alignItems: 'center', justifyContent: 'center' },
  previewCloseText: { fontSize: 30, lineHeight: 30, fontWeight: '600', color: Celestial.textSecondary },
  previewCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  previewActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  previewActionColumn: { alignItems: 'center', gap: Spacing.one, flex: 1, maxWidth: 200 },
  previewActionButton: {
    backgroundColor: Brand.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  // Share sits beside Save as a secondary (glass) action -- two equally-sized, non-overlapping
  // buttons, Save kept visually primary (solid gold) since it's the more common action.
  previewActionSecondary: { backgroundColor: 'rgba(255,249,245,0.1)', borderWidth: 1, borderColor: Celestial.glassBorder },
  previewActionDisabled: { opacity: 0.6 },
  previewActionText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
  previewActionSecondaryText: { color: Celestial.textPrimary, fontSize: 14, fontWeight: '800' },
  previewErrorText: { color: Celestial.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center' },

  // The tappable primary avatar on Your Read -- a faint press feedback plus the "Tap to view"
  // cue directly beneath it.
  avatarTapTarget: { alignItems: 'center', gap: Spacing.one },
  avatarTapTargetPressed: { opacity: 0.85 },
  tapCue: { color: Celestial.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  container: { flex: 1, backgroundColor: '#17000F' },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Celestial.background,
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { fontSize: 26, lineHeight: 26, fontWeight: '600', color: Celestial.textSecondary },

  // Same atmospheric treatment as You's hero and the reveal overlay -- the Creature is the
  // editorial lede of this screen too, not a small thumbnail above a text block (the First
  // Form case previously showed no Creature art at all).
  avatarStage: {
    width: AVATAR_STAGE_SIZE,
    height: AVATAR_STAGE_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pageEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: Brand.gold,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  pageIntro: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: Spacing.two },

  // Build 19 premium visual redesign ("Option A"): the mixed Creature's name, its real
  // avatar, and the combined Read now present as one framed editorial reveal -- a portrait,
  // not a development-style text block. revealFrame is the outer card (soft violet/coral
  // corner washes, a gold hairline edge); revealInner is a second, inset gold hairline a few
  // pixels in from the outer edge, giving the "refined decorative border" a layered,
  // foil-edge feel rather than a single flat outline. Both washes and both borders are built
  // from existing Brand tokens only -- no gradient/blur library, no new dependency (same
  // technique as PortalRings/CelestialWash/AtmosphericGlow above).
  revealFrame: {
    position: 'relative',
    borderRadius: Radius.xl + 4,
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.32)',
    backgroundColor: 'rgba(121,100,232,0.10)',
    overflow: 'hidden',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  revealGlowTopLeft: {
    position: 'absolute',
    top: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(121,100,232,0.22)',
  },
  revealGlowBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,121,95,0.12)',
  },
  revealInner: {
    margin: 6,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.2)',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  revealEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // Restrained sparkle accents flanking the eyebrow and marking the avatar/text divider --
  // static (no animation), low-key gold, same glyph AtmosphericGlow already uses elsewhere on
  // this exact screen, never more than one at a time here.
  revealSparkle: { color: 'rgba(246,184,63,0.55)', fontSize: 11 },
  revealDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, width: '55%', marginTop: Spacing.one },
  revealDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(246,184,63,0.25)' },
  combinedEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: Brand.gold,
    textAlign: 'center',
  },
  combinedName: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    textAlign: 'center',
  },
  // The headline is the star of the card (per the design brief) -- elegant serif italic,
  // noticeably larger and more considered than plain bold sans, echoing CelestialType's own
  // "verdict" treatment used for other reveal moments across the app.
  combinedHeadline: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '600',
    color: Celestial.textPrimary,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  // Body copy deliberately smaller and quieter than the headline above it -- clear hierarchy,
  // comfortable reading line-height, left-aligned (more readable for multi-line prose than
  // centered), while the group itself still sits centered as a block within the frame.
  combinedParagraphGroup: { alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.one },
  combinedParagraph: { color: Celestial.textSecondary, fontSize: 14.5, lineHeight: 22, fontWeight: '400', textAlign: 'left' },
  // A quiet divider label -- makes "the overall read" and "the five contributing parts" read
  // as two clearly separate sections rather than one continuous list of cards.
  partsEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Celestial.textMuted, marginTop: Spacing.two },

  readCard: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  readCardEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.gold },
  readCardTraitName: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  readCardExplanation: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, marginTop: Spacing.one },
  readCardApparently: { color: Brand.gold, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: Spacing.one },

  stateCard: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  stateText: { color: Celestial.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.gold },
  retryButton: { backgroundColor: Brand.gold, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryButtonText: { color: Brand.plum, fontSize: 14, fontWeight: '800' },
});
