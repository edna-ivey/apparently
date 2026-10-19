import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RelicAvatar } from '@/components/relic/relic-avatar';
import { Celestial, CelestialWash, PortalRings } from '@/components/today/celestial';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { Radius } from '@/constants/design-system';
import { scorePersonalityProfile, type PersonalityProfile } from '@/data/personality';
import { selectRelicSlots, selectStrongestPrivateSignals } from '@/data/private-signals';
import { resolveRelicIdentity, type ResolvedRelicIdentity } from '@/data/relic/relic-production-config';
import { synthesizeRelicRead, type RelicReadSection } from '@/data/relic/relic-read-synthesis';
import { useResponsiveContentWidth } from '@/hooks/use-responsive-content-width';
import { ensureAnonymousSession } from '@/services/auth-service';
import { getMyPersonalityEvidence, groupEvidenceIntoAnswers } from '@/services/personality-service';

// The dedicated Relic Read -- reached by tapping the Relic on You (src/app/(tabs)/you.tsx).
// Loads its own copy of the user's evidence (same pattern as creature-read.tsx) rather than
// taking props, since it's a standalone route. Renders through the SAME production
// renderer/calibration You uses (RelicAvatar) -- there is no second rendering implementation --
// and the SAME locked content hierarchy/synthesis engine (relic-read-synthesis.ts) regardless
// of how many of the three Relic slots have resolved so far.
const RELIC_READ_AVATAR_SIZE = 220;

type ReadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  // Genuinely no qualified Private signal yet -- an honest state, never a fabricated read.
  | { kind: 'locked' }
  | { kind: 'resolved'; identity: ResolvedRelicIdentity; read: RelicReadSection; slotCount: number };

export default function RelicReadScreen() {
  const router = useRouter();
  const contentWidth = useResponsiveContentWidth();
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    await ensureAnonymousSession();
    const evidenceResult = await getMyPersonalityEvidence();
    if (!evidenceResult.ok) {
      setLoadError(evidenceResult.message);
      return;
    }
    const answers = groupEvidenceIntoAnswers(evidenceResult.data);
    setProfile(scorePersonalityProfile(answers));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const readState = useMemo<ReadState>((): ReadState => {
    if (loadError) {
      return { kind: 'error', message: loadError };
    }
    if (!profile) {
      return { kind: 'loading' };
    }

    const signals = selectStrongestPrivateSignals(profile);
    const slots = selectRelicSlots(signals);
    const read = synthesizeRelicRead(slots);
    if (!read) {
      return { kind: 'locked' };
    }
    return {
      kind: 'resolved',
      identity: resolveRelicIdentity(slots),
      read,
      slotCount: [slots.relicTrait, slots.colorTrait, slots.effectTrait].filter(Boolean).length,
    };
  }, [loadError, profile]);

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
              <ThemedText style={styles.stateText}>Reading your Relic…</ThemedText>
            </View>
          )}

          {readState.kind === 'error' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.stateText}>We couldn’t load your Relic Read right now.</ThemedText>
              <Pressable style={styles.retryButton} onPress={() => void load()}>
                <ThemedText style={styles.retryButtonText}>Retry →</ThemedText>
              </Pressable>
            </View>
          )}

          {readState.kind === 'locked' && (
            <View style={styles.stateCard}>
              <ThemedText style={styles.eyebrow}>YOUR RELIC</ThemedText>
              <ThemedText style={styles.stateText}>
                Your Relic hasn’t taken shape yet. Keep engaging with Apparently Private — a read appears the moment a real pattern qualifies.
              </ThemedText>
            </View>
          )}

          {readState.kind === 'resolved' && <ResolvedRelicRead identity={readState.identity} read={readState.read} slotCount={readState.slotCount} />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ResolvedRelicRead({ identity, read, slotCount }: { identity: ResolvedRelicIdentity; read: RelicReadSection; slotCount: number }) {
  return (
    <>
      <View style={styles.avatarStage}>
        {identity.base && <RelicAvatar identity={{ base: identity.base, color: identity.color, effect: identity.effect }} size={RELIC_READ_AVATAR_SIZE} />}
      </View>
      {slotCount < 3 && (
        <ThemedText style={styles.formingNote}>
          Your Relic is still forming — {slotCount === 1 ? 'one signal has' : 'two signals have'} qualified so far. The rest fills in as more of your pattern holds.
        </ThemedText>
      )}

      <ThemedText style={styles.sectionEyebrow}>THE READ</ThemedText>
      <View style={styles.readCard}>
        {read.theRead.map((line, index) => (
          <ThemedText key={index} style={styles.readLine}>
            {line}
          </ThemedText>
        ))}
      </View>

      <ThemedText style={styles.sectionEyebrow}>WHY YOUR RELIC LOOKS LIKE THIS</ThemedText>
      <View style={styles.whyGroup}>
        <WhySubsection kicker={`BASE · ${read.whyBase.objectLabel}`} fromLabel={read.whyBase.traitLabel} body={read.whyBase.body} />
        {read.whyColor && <WhySubsection kicker={`COLOR · ${read.whyColor.familyLabel}`} fromLabel={read.whyColor.traitLabel} body={read.whyColor.body} />}
        {read.whyEffect && <WhySubsection kicker={`EFFECT · ${read.whyEffect.effectLabel}`} fromLabel={read.whyEffect.traitLabel} body={read.whyEffect.body} />}
      </View>

      <ThemedText style={styles.sectionEyebrow}>THE GIFT</ThemedText>
      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionBody}>{read.theGift}</ThemedText>
      </View>

      <ThemedText style={styles.sectionEyebrow}>THE SHADE 😈</ThemedText>
      <View style={[styles.sectionCard, styles.shadeCard]}>
        <ThemedText style={styles.sectionBody}>{read.theShade}</ThemedText>
      </View>

      <ThemedText style={styles.sectionEyebrow}>THE COST</ThemedText>
      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionBody}>{read.theCost}</ThemedText>
      </View>

      <ThemedText style={styles.sectionEyebrow}>TRY THIS</ThemedText>
      <View style={[styles.sectionCard, styles.tryThisCard]}>
        <ThemedText style={styles.sectionBody}>{read.tryThis}</ThemedText>
      </View>
    </>
  );
}

function WhySubsection({ kicker, fromLabel, body }: { kicker: string; fromLabel: string; body: string }) {
  return (
    <View style={styles.whySubsection}>
      <ThemedText style={styles.whyKicker}>{kicker}</ThemedText>
      <ThemedText style={styles.whyFrom}>From: {fromLabel}</ThemedText>
      <ThemedText style={styles.whyBody}>{body}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#17000F' },
  safeArea: { flex: 1, width: '100%', alignSelf: 'center', backgroundColor: Celestial.background },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  wordmark: { color: Celestial.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  closeButton: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  closeText: { fontSize: 26, lineHeight: 26, fontWeight: '600', color: Celestial.textSecondary },

  avatarStage: {
    width: RELIC_READ_AVATAR_SIZE,
    height: RELIC_READ_AVATAR_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  formingNote: { color: Celestial.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center', paddingHorizontal: Spacing.two },

  sectionEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: Brand.gold, marginTop: Spacing.one },
  readCard: {
    backgroundColor: 'rgba(121,100,232,0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(121,100,232,0.35)',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  readLine: { color: Celestial.textPrimary, fontSize: 16, lineHeight: 24, fontWeight: '600' },

  whyGroup: { gap: Spacing.two },
  whySubsection: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: 4,
  },
  whyKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, color: Brand.gold },
  whyFrom: { color: Celestial.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  whyBody: { color: Celestial.textPrimary, fontSize: 14, lineHeight: 20, marginTop: Spacing.one },

  sectionCard: {
    backgroundColor: Celestial.glassFill,
    borderWidth: 1,
    borderColor: Celestial.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  sectionBody: { color: Celestial.textPrimary, fontSize: 15, lineHeight: 22 },
  shadeCard: { backgroundColor: 'rgba(255,121,95,0.1)', borderColor: 'rgba(255,121,95,0.3)' },
  tryThisCard: { backgroundColor: 'rgba(121,100,232,0.12)', borderColor: 'rgba(121,100,232,0.35)' },

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
