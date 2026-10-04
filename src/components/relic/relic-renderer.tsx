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
export type RelicRendererProps = {
  width: number;
  baseSource: ImageSourcePropType;
  baseTransform: RelicTransform;
  baseOpacity: number;
  colorSource: ImageSourcePropType;
  colorTransform: RelicTransform;
  colorOpacity: number;
  effectSource: ImageSourcePropType;
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

function RelicLayer({ source, transform, opacity }: { source: ImageSourcePropType; transform: RelicTransform; opacity: number }) {
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
