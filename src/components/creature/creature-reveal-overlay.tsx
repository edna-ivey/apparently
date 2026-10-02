import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import type { CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, Radius, Surface, Type } from '@/constants/design-system';

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

export function CreatureRevealOverlay({ kind, creature, changes = [], onDismiss }: CreatureRevealOverlayProps) {
  const copy = REVEAL_COPY[kind];

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
        <ThemedText style={styles.eyebrow}>{copy.eyebrow}</ThemedText>
        <CreatureAvatar recipe={creature.recipe} size={168} />
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
    backgroundColor: 'rgba(23, 21, 29, 0.42)',
    paddingHorizontal: Spacing.four,
    zIndex: 20,
  },
  card: {
    ...CardStyle.tinted(Surface.page, Surface.hairline),
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    boxShadow: '0 24px 48px rgba(23, 21, 29, 0.24)',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Brand.plum,
    textAlign: 'center',
  },
  name: {
    ...Type.display,
    fontSize: 28,
    lineHeight: 32,
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
    gap: Spacing.two,
  },
  traitChip: {
    borderRadius: Radius.sm,
    backgroundColor: Surface.sand,
    borderWidth: 1,
    borderColor: Surface.hairline,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  traitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.ink,
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
    borderRadius: Radius.lg,
    backgroundColor: Brand.plum,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
