import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
              <View style={styles.avatarStage}>
                <AtmosphericGlow size={AVATAR_STAGE_SIZE} />
                <CreatureAvatar recipe={readState.recipe} size={AVATAR_SIZE} />
              </View>
              <ThemedText style={styles.pageEyebrow}>{readState.name.toUpperCase()}</ThemedText>
              <ThemedText style={styles.pageIntro}>
                Your Creature is still in its First Form — built entirely from the single pattern showing up strongest right now.
              </ThemedText>
              <ReadCard entry={readState.entry} />
            </>
          )}

          {readState.kind === 'mixed' && (
            <>
              <View style={styles.avatarStage}>
                <AtmosphericGlow size={AVATAR_STAGE_SIZE} />
                <CreatureAvatar recipe={readState.recipe} size={AVATAR_SIZE} />
              </View>
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
    </ThemedView>
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

const styles = StyleSheet.create({
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
