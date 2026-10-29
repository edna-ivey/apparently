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
  /** Base must be resolved (a Relic never renders at all before its strongest signal
   * qualifies -- callers gate on that, e.g. You's RelicGlyph). Color/effect are genuinely
   * nullable (Build 11 progressive reveal): a Relic with only its base signal qualified
   * renders base alone; this component renders exactly as many layers as have real,
   * evidence-qualified identities behind them -- it never invents a color/effect to complete
   * the picture, and never has a separate rendering path for a partial vs. complete Relic. */
  identity: { base: NonNullable<ResolvedRelicIdentity['base']>; color: ResolvedRelicIdentity['color']; effect: ResolvedRelicIdentity['effect'] };
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
  const color = identity.color ? colorFamilyByKey(identity.color) : null;
  const effect = identity.effect ? effectByKey(identity.effect) : null;

  const baseCorrection = APPROVED_BASE_CORRECTIONS[identity.base];
  const colorCorrection = identity.color ? APPROVED_COLOR_CORRECTIONS[identity.color] : undefined;
  const effectCorrection = identity.effect ? APPROVED_EFFECT_CORRECTIONS[identity.effect] : undefined;

  return (
    <View style={styles.container}>
      <RelicRenderer
        width={size}
        baseSource={base.source}
        baseTransform={resolveTransform(GLOBAL_BASE_TRANSFORM, baseCorrection)}
        baseOpacity={GLOBAL_BASE_OPACITY}
        colorSource={color?.source ?? null}
        colorTransform={resolveTransform(GLOBAL_COLOR_TRANSFORM, colorCorrection)}
        colorOpacity={color ? resolveOpacity(GLOBAL_COLOR_OPACITY, colorCorrection?.opacity) : 0}
        effectSource={effect?.source ?? null}
        effectTransform={resolveTransform(GLOBAL_EFFECT_TRANSFORM, effectCorrection)}
        effectOpacity={effect ? resolveOpacity(GLOBAL_EFFECT_OPACITY, effectCorrection?.opacity) : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'visible' },
});
