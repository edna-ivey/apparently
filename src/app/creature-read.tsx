import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandSignature } from '@/components/brand-signature';
import { AtmosphericGlow } from '@/components/creature/atmospheric-glow';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, PastelAccentRotation, Radius, Surface, Type } from '@/constants/design-system';
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
  | { kind: 'mixed'; name: string; recipe: CreatureRecipe; entries: ReadEntry[]; combinedRead: string };

// Combines the top-two contributing families into one short synthesis line -- never a third-
// trait claim, never a diagnosis. Each clause traces directly back to that pole's own Bible-
// grounded explanation (see creature-read-copy.ts); this only joins two already-approved
// sentences, it does not invent new meaning between them.
const buildCombinedRead = (name: string, entries: ReadEntry[]): string => {
  if (entries.length < 2) {
    return `${name} is still coming together — check back as more of your answers settle in.`;
  }
  const [first, second] = entries;
  return `${name} leads with ${first.traitName.toLowerCase()} and ${second.traitName.toLowerCase()} showing up the strongest — ${first.explanation[0].toLowerCase()}${first.explanation.slice(1)} And ${second.explanation[0].toLowerCase()}${second.explanation.slice(1)}`;
};

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
      const entries: ReadEntry[] = [...mixedSnapshot.traits]
        .sort((a, b) => a.rank - b.rank)
        .map((trait) => {
          const copy = getCreatureReadCopyByLabel(trait.traitName);
          return {
            slotLabel: CREATURE_TEST_SLOT_LABEL[trait.part],
            traitName: trait.traitName,
            explanation: copy.explanation,
            apparentlyLine: copy.apparentlyLine,
          };
        });
      return {
        kind: 'mixed',
        name: mixedSnapshot.name,
        recipe: mixedSnapshot.recipe,
        entries,
        combinedRead: buildCombinedRead(mixedSnapshot.name, entries),
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <BrandSignature variant="mark" />
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
              <ThemedText style={styles.pageEyebrow}>{readState.name.toUpperCase()}</ThemedText>
              <View style={styles.combinedCard}>
                <ThemedText style={styles.combinedReadText}>{readState.combinedRead}</ThemedText>
              </View>
              {readState.entries.map((entry, index) => (
                <ReadCard key={entry.slotLabel} entry={entry} accent={PastelAccentRotation[index % PastelAccentRotation.length]} />
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
    <View style={[styles.readCard, accent ? { backgroundColor: accent, borderColor: 'transparent' } : null]}>
      <ThemedText style={styles.readCardEyebrow}>{entry.slotLabel}</ThemedText>
      <ThemedText style={styles.readCardTraitName}>{entry.traitName}</ThemedText>
      <ThemedText style={styles.readCardExplanation}>{entry.explanation}</ThemedText>
      <ThemedText style={styles.readCardApparently}>{entry.apparentlyLine}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Surface.pageDeep },
  safeArea: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Surface.page,
  },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { fontSize: 24, color: Brand.inkSecondary },

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
  pageEyebrow: { ...Type.eyebrow, textAlign: 'center', marginTop: Spacing.one },
  pageIntro: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: Spacing.two },

  combinedCard: {
    ...CardStyle.tinted(Surface.lavender, Surface.hairline),
    marginBottom: Spacing.two,
  },
  combinedReadText: { ...Type.body, color: Brand.ink, fontSize: 15, lineHeight: 22 },

  readCard: {
    ...CardStyle.base,
    gap: Spacing.one,
  },
  readCardEyebrow: { ...Type.eyebrow, color: Brand.pink },
  readCardTraitName: { ...Type.displaySmall, marginTop: 2 },
  readCardExplanation: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, marginTop: Spacing.one },
  readCardApparently: { color: Brand.plum, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: Spacing.one },

  stateCard: { ...CardStyle.base, alignItems: 'center', gap: Spacing.two, marginTop: Spacing.five },
  stateText: { color: Brand.inkSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  eyebrow: { ...Type.eyebrow },
  retryButton: { backgroundColor: Brand.pink, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
