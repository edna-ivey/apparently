import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AtmosphericGlow } from '@/components/creature/atmospheric-glow';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import type { CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { Brand, Spacing } from '@/constants/theme';
import { Radius, Surface, Type } from '@/constants/design-system';

// Shared presentation for First Form, first mixed form, and Friday evolution results. The You
// screen decides which moment to present; this component only renders it. Soft editorial /
// magical collectible direction: warm cream card, gentle depth, rounded corners, no fantasy-
// RPG chrome. Entrance uses one short FadeIn/FadeInDown pair, never a multi-step forced
// sequence. The user can dismiss immediately; nothing here gates navigation.
//
// User-facing language only: no slot names, no characteristic/category codes framed as
// technical labels, no "resolver"/"recipe" language. Makes no diagnostic or fixed-personality-
// truth claim -- the supporting line frames this as a reflection of current patterns, not a
// verdict.
export type CreatureRevealKind = 'first-form' | 'first-mixed' | 'evolved' | 'unchanged';

export type CreatureRevealPresentation = {
  name: string;
  recipe: CreatureTestRecipe;
  traitNames: string[];
};

export type CreatureRevealOverlayProps = {
  kind: CreatureRevealKind;
  creature: CreatureRevealPresentation;
  changes?: string[];
  onDismiss: () => void;
};

const REVEAL_COPY: Record<CreatureRevealKind, { eyebrow: string; supporting: string; cta: string }> = {
  'first-form': {
    eyebrow: 'YOUR FIRST FORM',
    supporting: 'One strong pattern is already taking shape. Apparently has been paying attention.',
    cta: 'Meet your Creature →',
  },
  'first-mixed': {
    eyebrow: 'You evolved.',
    supporting: 'Your strongest patterns have come together in a form that is unmistakably yours.',
    cta: 'Continue →',
  },
  evolved: {
    eyebrow: 'You evolved.',
    supporting: 'Your answers shifted the patterns showing up most strongly.',
    cta: 'See the new you →',
  },
  unchanged: {
    eyebrow: 'Still you.',
    supporting: 'Your strongest patterns held steady this week.',
    cta: 'Continue →',
  },
};

const GLOW_SIZE = 300;
const CREATURE_SIZE = 224;

export function CreatureRevealOverlay({ kind, creature, changes = [], onDismiss }: CreatureRevealOverlayProps) {
  const copy = REVEAL_COPY[kind];

  return (
    // Plum-tinted, not flat black -- "Apparently just revealed something personal about me,"
    // not a generic system modal. The backdrop itself carries the brand's own premium/
    // authority surface color (see Brand.plum's own comment in theme.ts).
    <Animated.View entering={FadeIn.duration(260)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
        <ThemedText style={styles.eyebrow}>{copy.eyebrow}</ThemedText>
        <View style={styles.stage}>
          <AtmosphericGlow size={GLOW_SIZE} />
          <CreatureAvatar recipe={creature.recipe} size={CREATURE_SIZE} />
        </View>
        <ThemedText style={styles.name}>{creature.name}</ThemedText>
        <ThemedText style={styles.supportingLine}>{copy.supporting}</ThemedText>
        <View style={styles.traitRow}>
          {creature.traitNames.map((name, index) => (
            <View key={`${name}-${index}`} style={styles.traitChip}>
              <ThemedText style={styles.traitChipText}>{name}</ThemedText>
            </View>
          ))}
        </View>
        {changes.length > 0 ? (
          <View style={styles.changeList}>
            {changes.map((change) => (
              <ThemedText key={change} style={styles.changeText}>• {change}</ThemedText>
            ))}
          </View>
        ) : null}
        <Pressable
          style={styles.continueButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={copy.cta.replace(' →', '')}>
          <ThemedText style={styles.continueButtonText}>{copy.cta}</ThemedText>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 1, 31, 0.72)',
    paddingHorizontal: Spacing.four,
    zIndex: 20,
  },
  // No hairline border, no flat cream box -- a deeper shadow and a taller radius so this reads
  // as a floating premium surface rather than a bounded "modal with an image" (direct user
  // feedback on the prior pass). The Creature's own atmosphere (AtmosphericGlow) is the
  // dominant visual event inside the card, not a decorative extra.
  card: {
    backgroundColor: Surface.page,
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    boxShadow: '0 32px 64px rgba(23, 21, 29, 0.38)',
  },
  stage: { width: GLOW_SIZE, height: GLOW_SIZE, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Brand.plum,
    textAlign: 'center',
  },
  name: {
    ...Type.display,
    fontSize: 34,
    lineHeight: 38,
    textAlign: 'center',
    color: Brand.ink,
  },
  supportingLine: {
    textAlign: 'center',
    color: Brand.inkSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  // Pill, not a bordered square chip -- matches the Signature pill direction the user
  // explicitly wants preserved, so the trait badge reads as "secondary and consistent," not a
  // different, boxier visual language inside the same app.
  traitChip: {
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(36, 1, 31, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  traitChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.plum,
    letterSpacing: 0.2,
  },
  changeList: {
    width: '100%',
    gap: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Surface.hairline,
    paddingTop: Spacing.three,
  },
  changeText: {
    color: Brand.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  continueButton: {
    marginTop: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Brand.plum,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
    boxShadow: '0 10px 24px rgba(36, 1, 31, 0.28)',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
