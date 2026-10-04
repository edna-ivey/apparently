import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import type { RelicLabTransform } from '@/data/relic-lab/relic-lab-config';

// Relic Lab's 3-layer compositor (R&D ONLY). One shared square canvas; EFFECT paints on top,
// COLOR beneath it, BASE RELIC solid at the back -- exactly the stack order specified for this
// tool. Never flattened into one image: three independent <Image> layers, each with its own
// transform (and, for color/effect, its own opacity), composited live every render. Structurally
// mirrors Creature Lab's TransformedLayer (src/components/creature-test/creature-test-composer.tsx)
// as a PATTERN only -- no shared state, config, or production logic.
export type RelicLabComposerProps = {
  width: number;
  baseSource: ImageSourcePropType;
  baseTransform: RelicLabTransform;
  colorSource: ImageSourcePropType;
  colorTransform: RelicLabTransform;
  colorOpacity: number;
  effectSource: ImageSourcePropType;
  effectTransform: RelicLabTransform;
  effectOpacity: number;
  backgroundColor: string;
  /** Transparent/checkerboard background renders a checker pattern underneath instead of a
   * flat fill -- backgroundColor is ignored when this is true. */
  checkerboard?: boolean;
};

export function RelicLabComposer({
  width,
  baseSource,
  baseTransform,
  colorSource,
  colorTransform,
  colorOpacity,
  effectSource,
  effectTransform,
  effectOpacity,
  backgroundColor,
  checkerboard,
}: RelicLabComposerProps) {
  return (
    <View style={[styles.stage, { width, height: width, backgroundColor: checkerboard ? 'transparent' : backgroundColor }]}>
      {checkerboard && <CheckerboardBackground size={width} />}
      {/* BASE RELIC -- solid, always 100% opacity by default, the visual anchor. Painted first
          (back of the stack). */}
      <RelicLayer source={baseSource} transform={baseTransform} opacity={1} />
      {/* COLOR -- sits above the base, tints/adds atmosphere without replacing the object. */}
      <RelicLayer source={colorSource} transform={colorTransform} opacity={colorOpacity} />
      {/* EFFECT -- most forward, light enough to stay secondary to the Relic object itself. */}
      <RelicLayer source={effectSource} transform={effectTransform} opacity={effectOpacity} />
    </View>
  );
}

function RelicLayer({ source, transform, opacity }: { source: ImageSourcePropType; transform: RelicLabTransform; opacity: number }) {
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

function CheckerboardBackground({ size }: { size: number }) {
  const cell = 24;
  const cols = Math.ceil(size / cell);
  const rows = Math.ceil(size / cell);
  const squares: { left: number; top: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 0) {
        squares.push({ left: col * cell, top: row * cell });
      }
    }
  }
  return (
    <View pointerEvents="none" style={[styles.fill, { backgroundColor: '#FFFFFF' }]}>
      {squares.map((sq) => (
        <View key={`${sq.left}-${sq.top}`} style={{ position: 'absolute', left: sq.left, top: sq.top, width: cell, height: cell, backgroundColor: '#E3DCD2' }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow 'visible' (not 'hidden') -- deliberately matches Creature Lab's own composer: a
  // layer pushed past the canvas via x/y/scale during calibration should stay visible outside
  // the frame rather than silently vanishing behind a clip, so it's obvious it needs pulling
  // back rather than looking like a broken/missing asset.
  stage: { position: 'relative', overflow: 'visible', borderRadius: 16 },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
});
