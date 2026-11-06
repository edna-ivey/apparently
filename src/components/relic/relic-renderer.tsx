import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import type { RelicTransform } from '@/data/relic/relic-transform';

// The ONE production Relic compositing primitive. One shared square canvas; EFFECT paints on
// top, COLOR beneath it, BASE RELIC solid at the back -- the locked layer stack. Never
// flattened into one image: three independent <Image> layers, each with its own transform
// (and, for color/effect, its own opacity), composited live every render. Pure and
// presentation-only -- takes fully-resolved values, has no opinion about where they came from,
// no localStorage, no dev-only/browser-only API. Both the production RelicAvatar
// (relic-avatar.tsx, applies the locked global calibration) and the R&D Relic Lab
// (src/app/dev/relic-lab.tsx, applies whatever the lab's own calibration controls produce) wrap
// THIS SAME component -- there is no second, parallel rendering path.
// colorSource/effectSource are nullable (Build 11 progressive Relic reveal): a Relic with only
// a qualified base signal renders base alone; with base+color qualified it renders those two
// layers; the effect layer only ever appears once a third signal has genuinely qualified. This
// is the SAME compositing math and the SAME locked calibration for every stage -- a null source
// simply skips that layer's <RelicLayer>, never a separate rendering path, never a placeholder
// layer. See RelicAvatar for how a ResolvedRelicIdentity's null color/effect reaches here.
export type RelicRendererProps = {
  width: number;
  baseSource: ImageSourcePropType;
  baseTransform: RelicTransform;
  baseOpacity: number;
  colorSource: ImageSourcePropType | null;
  colorTransform: RelicTransform;
  colorOpacity: number;
  effectSource: ImageSourcePropType | null;
  effectTransform: RelicTransform;
  effectOpacity: number;
  backgroundColor?: string;
};

export function RelicRenderer({
  width,
  baseSource,
  baseTransform,
  baseOpacity,
  colorSource,
  colorTransform,
  colorOpacity,
  effectSource,
  effectTransform,
  effectOpacity,
  backgroundColor,
}: RelicRendererProps) {
  return (
    <View style={[styles.stage, { width, height: width, backgroundColor: backgroundColor ?? 'transparent' }]}>
      <RelicLayer source={baseSource} transform={baseTransform} opacity={baseOpacity} />
      <RelicLayer source={colorSource} transform={colorTransform} opacity={colorOpacity} />
      <RelicLayer source={effectSource} transform={effectTransform} opacity={effectOpacity} />
    </View>
  );
}

function RelicLayer({ source, transform, opacity }: { source: ImageSourcePropType | null; transform: RelicTransform; opacity: number }) {
  if (!source) {
    return null;
  }
  const outerTransform = [
    { translateX: transform.x },
    { translateY: transform.y },
    { scale: transform.scale },
    { rotate: `${transform.rotation}deg` },
  ];
  return (
    <View style={[styles.fill, { transform: outerTransform, opacity }]}>
      <Image source={source} contentFit="contain" style={styles.fill} />
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow 'visible' -- a layer pushed past the canvas via a correction should stay visible
  // rather than silently clipping into what could look like a broken/missing asset.
  stage: { position: 'relative', overflow: 'visible', borderRadius: 16 },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
});
