import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { CREATURE_LAYOUT, type CreatureSlotRect } from '@/data/creature-lab/creature-layout';
import type { CreaturePartKey, CreaturePartSet } from '@/data/creature-lab/creature-assets';

const SLOT_ORDER: CreaturePartKey[] = ['wings', 'tail', 'ears', 'eyes', 'chestCrest', 'headFeature'];

// Stress-test-only escape hatch (see the Extreme Silhouette / Tail Scale / Wings Scale
// sections in the Creature Lab screen): a slot can optionally carry a fixed scaleMultiplier
// alongside its source instead of a bare source. It is deterministic test-config data, never
// computed from a user, never randomized, and never hand-tuned per finished creature -- see
// creature-layout.ts's own comment for why per-instance x/y overrides are deliberately NOT
// part of this. A bare ImageSourcePropType (every existing recipe -- Tests A-D) is still valid
// and behaves exactly as before (scaleMultiplier defaults to 1).
export type CreaturePartInput = ImageSourcePropType | { source: ImageSourcePropType; scaleMultiplier: number };

export type CreatureRecipe = {
  body: ImageSourcePropType;
} & Record<Exclude<CreaturePartKey, 'body'>, CreaturePartInput>;

function normalizePartInput(input: CreaturePartInput): { source: ImageSourcePropType; scaleMultiplier: number } {
  if (typeof input === 'object' && input !== null && 'source' in input) {
    return { source: input.source, scaleMultiplier: input.scaleMultiplier };
  }
  return { source: input, scaleMultiplier: 1 };
}

export type CreatureComposerProps = {
  /** All seven approved trait assets for this creature. Six attachment slots may optionally carry a scaleMultiplier. */
  recipe: CreatureRecipe | CreaturePartSet;
  /** Rendered stage width in px; height is derived from bodyAspect. */
  width: number;
  /**
   * The body asset's own width/height ratio (e.g. 1086/1448). Passed explicitly rather than
   * resolved at runtime because react-native-web's <Image> has no Image.resolveAssetSource,
   * unlike native -- see CREATURE_BODY_DIMENSIONS in creature-assets.ts.
   */
  bodyAspect: number;
  /** Dev-only: outline every slot's bounding rect. Never enabled in production. */
  showSlotBounds?: boolean;
};

/**
 * Layers the seven approved trait assets onto the body using CREATURE_LAYOUT -- the one
 * shared slot config -- with no per-instance positioning. Same recipe + same layout config
 * must always render identically (see Test D in the Creature Lab screen).
 */
export function CreatureComposer({ recipe, width, bodyAspect, showSlotBounds }: CreatureComposerProps) {
  const height = width / bodyAspect;

  return (
    <View style={{ width, height }}>
      <Image source={recipe.body} contentFit="contain" style={[styles.layer, { left: 0, top: 0, width, height, zIndex: CREATURE_LAYOUT.body.zIndex }]} />
      {SLOT_ORDER.map((key) => (
        <SlotLayer key={key} input={recipe[key]} rect={CREATURE_LAYOUT[key]} stageWidth={width} stageHeight={height} debug={showSlotBounds} />
      ))}
    </View>
  );
}

function SlotLayer({
  input,
  rect,
  stageWidth,
  stageHeight,
  debug,
}: {
  input: CreaturePartInput;
  rect: CreatureSlotRect;
  stageWidth: number;
  stageHeight: number;
  debug?: boolean;
}) {
  const { source, scaleMultiplier } = normalizePartInput(input);

  // Scale grows/shrinks from the slot rect's own center, so a scaleMultiplier changes size
  // only -- the anchor point stays exactly where the shared CREATURE_LAYOUT rect puts it. No
  // per-render x/y is introduced. contentFit="contain" below preserves the asset's own aspect
  // ratio regardless of scale, so this can never distort the art.
  const baseWidth = rect.width * stageWidth;
  const baseHeight = rect.height * stageHeight;
  const width = baseWidth * scaleMultiplier;
  const height = baseHeight * scaleMultiplier;
  const left = rect.x * stageWidth + (baseWidth - width) / 2;
  const top = rect.y * stageHeight + (baseHeight - height) / 2;
  const transform = rect.rotation ? [{ rotate: `${rect.rotation}deg` }] : undefined;

  return (
    <>
      <Image source={source} contentFit="contain" style={[styles.layer, { left, top, width, height, zIndex: rect.zIndex, transform }]} />
      {debug ? (
        // Bounds only -- no text over the creature. Slot->filename labels live outside the
        // stage (see the Creature Lab screen's debug legend).
        <View pointerEvents="none" style={[styles.layer, styles.debugOutline, { left, top, width, height, zIndex: 1000 + rect.zIndex }]} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
  debugOutline: {
    borderWidth: 1,
    borderColor: 'rgba(230, 30, 90, 0.85)',
  },
});
