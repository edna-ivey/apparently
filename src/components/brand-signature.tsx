import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';

// The approved final Magnetic Loop brand mark (glossy fluid coral/pink/orchid loop on dark
// plum), 1024x1024. Both BrandSignature and the You screen's temporary avatar read this same
// constant, so the icon is wired up in exactly one place rather than per screen.
export const MAGNETIC_LOOP_SOURCE: ImageSourcePropType = require('@/assets/images/brand/magnetic-loop.png');

export type BrandSignatureVariant = 'full' | 'mark' | 'hero';

type BrandSignatureProps = {
  // 'full' — icon + "apparently you." wordmark, for a screen's top-level signature (Today,
  // onboarding's basic-info screen). Clearly branded, still a signature, not a page title.
  // 'mark' — icon alone, sized as a subtle signature on regular consumer pages (Explore,
  // Compare, You).
  // 'hero' — icon alone, larger — a standalone brand moment for onboarding's transition and
  // final screens, which have no other branding on-screen to lean on.
  variant?: BrandSignatureVariant;
  style?: StyleProp<ViewStyle>;
};

// Sizing lives here, once, rather than as per-screen image dimensions — every screen picks a
// variant and gets a consistent icon (and, for 'full', wordmark) size for that role.
const ICON_SIZE: Record<BrandSignatureVariant, number> = {
  full: 28,
  mark: 22,
  hero: 48,
};

// The single reusable consumer brand signature: Magnetic Loop icon, optionally paired with
// the lowercase "apparently you." wordmark. Used at the top of every consumer screen instead
// of a page-specific brand hack, so the treatment (and the eventual icon swap-in) stays in
// exactly one place.
export function BrandSignature({ variant = 'full', style }: BrandSignatureProps) {
  const size = ICON_SIZE[variant];

  return (
    <View style={[styles.row, style]}>
      <Image source={MAGNETIC_LOOP_SOURCE} resizeMode="contain" style={{ width: size, height: size }} />
      {variant === 'full' ? (
        <ThemedText style={styles.wordmarkFull}>apparently you.</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmarkFull: {
    color: Brand.ink,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
