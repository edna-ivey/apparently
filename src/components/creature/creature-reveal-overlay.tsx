import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { CreatureAvatar } from '@/components/creature/creature-avatar';
import type { CreatureIdentity } from '@/data/creature/creature-identity';
import type { CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { Brand, Spacing } from '@/constants/theme';
import { CardStyle, Radius, Surface, Type } from '@/constants/design-system';

// The one-time "Apparently, this is you." moment -- plays once per device the first time the
// Creature reveal conditions are met (see src/data/creature/creature-reveal-state.ts; the You
// screen decides WHEN to mount this, this component only presents it). Soft editorial/magical
// collectible direction: warm cream card, gentle depth, rounded corners, no fantasy-RPG
// chrome. Entrance uses react-native-reanimated's existing FadeIn/FadeInDown (already used
// elsewhere in this app -- see src/components/ui/collapsible.tsx) -- a short, single,
// non-blocking fade, never a multi-step forced sequence. The user can dismiss immediately;
// nothing here gates navigation.
//
// User-facing language only: no slot names, no characteristic/category codes framed as
// technical labels, no "resolver"/"recipe" language. Makes no diagnostic or fixed-personality-
// truth claim -- the supporting line frames this as a reflection of current patterns, not a
// verdict.
export type CreatureRevealOverlayProps = {
  identity: CreatureIdentity;
  onDismiss: () => void;
};

export function CreatureRevealOverlay({ identity, onDismiss }: CreatureRevealOverlayProps) {
  if (!identity.recipe || identity.name === null) {
    return null;
  }
  const recipe = identity.recipe as CreatureTestRecipe;
  // The 5 contributing patterns, strongest first -- the same real trait labels already shown
  // in "YOUR SIGNATURE" elsewhere on You, never a technical slot/category code.
  const contributingTraitNames = identity.assignments.map((assignment) => assignment.trait.name);

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss" accessibilityRole="button" />
      <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
        <ThemedText style={styles.eyebrow}>APPARENTLY, THIS IS YOU.</ThemedText>
        <CreatureAvatar recipe={recipe} size={168} />
        <ThemedText style={styles.name}>{identity.name}</ThemedText>
        <ThemedText style={styles.supportingLine}>
          Built from the patterns showing up most strongly in your answers.
        </ThemedText>
        <View style={styles.traitRow}>
          {contributingTraitNames.map((name) => (
            <View key={name} style={styles.traitChip}>
              <ThemedText style={styles.traitChipText}>{name}</ThemedText>
            </View>
          ))}
        </View>
        <Pressable style={styles.continueButton} onPress={onDismiss}>
          <ThemedText style={styles.continueButtonText}>Continue →</ThemedText>
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
