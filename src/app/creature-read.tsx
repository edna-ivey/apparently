import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
              <TappableCreatureAvatar recipe={readState.recipe} onPress={() => setPreviewOpen(true)} />
              {/* Final-polish pass: the combined read is the editorial lede of this screen --
                  a real display-size name (not the small tracked-out eyebrow used elsewhere),
                  more breathing room, and a richer, more elevated surface than the five
                  individual cards below it, so it visually outranks them rather than reading
                  as just the first card in the same list. */}
              <ThemedText style={styles.combinedEyebrow}>YOUR READ, COMBINED</ThemedText>
              <ThemedText style={styles.combinedName}>{readState.name}</ThemedText>
              {readState.combinedRead && (
                <View style={styles.combinedCard}>
                  <ThemedText style={styles.combinedHeadline}>{readState.combinedRead.headline}</ThemedText>
                  <ThemedText style={styles.combinedParagraph}>{readState.combinedRead.paragraph1}</ThemedText>
                  <ThemedText style={styles.combinedParagraph}>{readState.combinedRead.paragraph2}</ThemedText>
                </View>
              )}
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
        />
      )}
    </ThemedView>
  );
}

// The ONE visible Creature on Your Read -- tappable, with a subtle cue. Opens the preview
// modal rather than rendering a second avatar inline (the Build 16 duplicate-Creature bug came
// from a second, always-visible export card rendered directly beneath this exact stage).
function TappableCreatureAvatar({ recipe, onPress }: { recipe: CreatureRecipe; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View your Creature"
      hitSlop={8}
      style={({ pressed }) => [styles.avatarTapTarget, pressed && styles.avatarTapTargetPressed]}
    >
      <View style={styles.avatarStage}>
        <AtmosphericGlow size={AVATAR_STAGE_SIZE} />
        <CreatureAvatar recipe={recipe} size={AVATAR_SIZE} />
      </View>
      <ThemedText style={styles.tapCue}>Tap to view your Creature</ThemedText>
    </Pressable>
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
}: {
  visible: boolean;
  onClose: () => void;
  name: string;
  recipe: CreatureRecipe;
}) {
  const exportCardRef = useRef<View>(null);
  const [actionState, setActionState] = useState<ActionState>({ phase: 'idle' });
  const { width, height } = useWindowDimensions();

  // Scales with the smaller iPhones in mind (e.g. SE-width ~375) while staying generous on
  // larger screens -- never so large it risks clipping against the close button/action row.
  const creatureSize = Math.min(Math.min(width, height) * 0.52, 260);
  const glowSize = creatureSize * 1.3;

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
        <SafeAreaView style={styles.previewSafeArea}>
          <PortalRings />
          <CelestialWash />

          <View style={styles.previewTopRow}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={styles.previewCloseButton}
            >
              <ThemedText style={styles.previewCloseText}>×</ThemedText>
            </Pressable>
          </View>

          <View style={styles.previewCenter}>
            <View ref={exportCardRef} collapsable={false} style={styles.exportCard}>
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
  exportCard: {
    width: 300,
    alignItems: 'center',
    backgroundColor: Celestial.background,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
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
  previewTopRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.four, paddingTop: Spacing.two, minHeight: 44 },
  previewCloseButton: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
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

  // Final-polish pass: the mixed Creature's combined-read name/card outrank the five part
  // cards below -- a real serif display name, a dedicated "YOUR READ, COMBINED" label, and a
  // deeper, more elevated, more spacious card than the five below it.
  combinedEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: Brand.gold,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  combinedName: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    color: Celestial.textPrimary,
    fontSize: 32,
    lineHeight: 37,
    textAlign: 'center',
    marginTop: 2,
  },
  combinedCard: {
    backgroundColor: 'rgba(121,100,232,0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(121,100,232,0.35)',
    padding: Spacing.five,
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
    gap: Spacing.three,
  },
  combinedHeadline: { color: Celestial.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  combinedParagraph: { color: Celestial.textPrimary, fontSize: 16, lineHeight: 24, fontWeight: '400' },
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
