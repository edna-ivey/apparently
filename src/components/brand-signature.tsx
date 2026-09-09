import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';

// The approved final Magnetic Loop brand mark (glossy fluid coral/pink/orchid loop on dark
// plum), 1024x1024. Both BrandSignature and the You screen's temporary avatar read this same
// constant, so the icon is wired up in exactly one place rather than per screen.
export const MAGNETIC_LOOP_SOURCE: ImageSourcePropType = require('@/assets/images/brand/magnetic-loop.png');

export type BrandSignatureVariant = 'full' | 'mark';

type BrandSignatureProps = {
  // 'full' — icon + "apparently you." wordmark, for the Today screen's top-level signature.
  // 'mark' — icon alone (the wordmark is dropped once the icon is available, so the other
  // consumer screens carry a small signature rather than repeating the full wordmark).
  variant?: BrandSignatureVariant;
  style?: StyleProp<ViewStyle>;
};

// The single reusable consumer brand signature: small Magnetic Loop icon + lowercase
// "apparently you." wordmark. Used at the top of every consumer screen instead of a
// page-specific brand hack, so the treatment (and the eventual icon swap-in) stays in
// exactly one place.
export function BrandSignature({ variant = 'full', style }: BrandSignatureProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={MAGNETIC_LOOP_SOURCE}
        resizeMode="contain"
        style={variant === 'full' ? styles.iconFull : styles.iconMark}
      />
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
    gap: 6,
  },
  iconFull: {
    width: 20,
    height: 20,
  },
  iconMark: {
    width: 16,
    height: 16,
  },
  wordmarkFull: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
