import { StyleSheet, View } from 'react-native';

import {
  APPROVED_BASE_CORRECTIONS,
  APPROVED_COLOR_CORRECTIONS,
  APPROVED_EFFECT_CORRECTIONS,
  GLOBAL_BASE_OPACITY,
  GLOBAL_BASE_TRANSFORM,
  GLOBAL_COLOR_OPACITY,
  GLOBAL_COLOR_TRANSFORM,
  GLOBAL_EFFECT_OPACITY,
  GLOBAL_EFFECT_TRANSFORM,
  type ResolvedRelicIdentity,
} from '@/data/relic/relic-production-config';
import { colorFamilyByKey, effectByKey, relicTraitByKey } from '@/data/relic/relic-assets';
import { resolveOpacity, resolveTransform } from '@/data/relic/relic-transform';
import { RelicRenderer } from './relic-renderer';

export type RelicAvatarProps = {
  /** A FULLY resolved identity -- callers must gate on all three fields being non-null
   * themselves before rendering this (the Bible's locked-silhouette rule lives in the caller,
   * e.g. You's existing RelicGlyph, not here) -- this component does not re-check completeness. */
  identity: { base: NonNullable<ResolvedRelicIdentity['base']>; color: NonNullable<ResolvedRelicIdentity['color']>; effect: NonNullable<ResolvedRelicIdentity['effect']> };
  /** Square render size in logical pixels. */
  size: number;
};

// Production Relic renderer -- the ONE place every consumer surface (You today, any future
// Relic reveal/result surface) resolves a Relic identity to pixels. Applies the LOCKED global
// calibration (relic-production-config.ts) plus any explicitly approved per-asset correction
// (empty today) -- never Relic Lab state, never localStorage. Mirrors CreatureAvatar's own
// shape exactly (src/components/creature/creature-avatar.tsx): a thin, reusable wrapper that
// resolves production calibration once and renders through the shared compositing primitive.
export function RelicAvatar({ identity, size }: RelicAvatarProps) {
  const base = relicTraitByKey(identity.base);
  const color = colorFamilyByKey(identity.color);
  const effect = effectByKey(identity.effect);

  const baseCorrection = APPROVED_BASE_CORRECTIONS[identity.base];
  const colorCorrection = APPROVED_COLOR_CORRECTIONS[identity.color];
  const effectCorrection = APPROVED_EFFECT_CORRECTIONS[identity.effect];

  return (
    <View style={styles.container}>
      <RelicRenderer
        width={size}
        baseSource={base.source}
        baseTransform={resolveTransform(GLOBAL_BASE_TRANSFORM, baseCorrection)}
        baseOpacity={GLOBAL_BASE_OPACITY}
        colorSource={color.source}
        colorTransform={resolveTransform(GLOBAL_COLOR_TRANSFORM, colorCorrection)}
        colorOpacity={resolveOpacity(GLOBAL_COLOR_OPACITY, colorCorrection?.opacity)}
        effectSource={effect.source}
        effectTransform={resolveTransform(GLOBAL_EFFECT_TRANSFORM, effectCorrection)}
        effectOpacity={resolveOpacity(GLOBAL_EFFECT_OPACITY, effectCorrection?.opacity)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'visible' },
});
