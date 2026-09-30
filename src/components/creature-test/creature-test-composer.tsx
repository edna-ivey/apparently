import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import {
  CREATURE_TEST_ASSETS,
  CREATURE_TEST_CANVAS,
  type CreatureTestCategory,
  type CreatureTestSlot,
} from '@/data/creature-test/creature-test-assets';
import { ANCHORS, BODY_RIG, composeTransform, type CreatureCategoryConfig, type CreatureTransform } from '@/data/creature-test/creature-test-config';

export type CreatureTestRecipe = Record<CreatureTestSlot, CreatureTestCategory>;

// Default paint order, back to front. Exposed as a prop (not hardcoded) because the brief
// explicitly calls for this to be easy to adjust per-asset if a tail/wings needs partial
// overlap with the body.
export const DEFAULT_LAYER_ORDER: CreatureTestSlot[] = ['wings', 'tail', 'body', 'earsHorns', 'eyes'];

export type CreatureTestComposerProps = {
  recipe: CreatureTestRecipe;
  /** Per-category correction config (mutable in the Lab; identity = "use the shared anchor as-is"). */
  config: Record<CreatureTestCategory, CreatureCategoryConfig>;
  width: number;
  layerOrder?: CreatureTestSlot[];
  layerVisibility?: Partial<Record<CreatureTestSlot, boolean>>;
  showRig?: boolean;
  /** Slot currently being calibrated -- gets an always-on (independent of showRig) highlight
   * box that moves/scales/rotates WITH the layer, so a calibration change is unmistakable even
   * with Show Rig off. See the bug this was added to debug: width/height-based "scaling" could
   * silently fail to reflow on web; a wrapper transform can't silently no-op the same way. */
  highlightSlot?: CreatureTestSlot | null;
};

const CANVAS = CREATURE_TEST_CANVAS.width; // square, 1254

/**
 * Renders the 5 modular layers on one fixed 1254x1254 stage, scaled to `width` for display.
 * The body is always the locked master rig (BODY_RIG, identical for every category). Every
 * other slot's final transform is its shared ANCHOR composed with that category's own small
 * correction from `config` -- see creature-test-config.ts. No positioning logic lives here
 * beyond that composition; this component never adjusts anything per-category itself.
 *
 * Transform model (fixed after a real bug: recalculating width/height/left/top per scale value
 * did not reliably reflow on web with expo-image -- every rendered <img> always reported
 * style width/height 100%/left/top 0 regardless of what was passed in, so a changed `scale`
 * silently had no visible effect even though the underlying state update was correct). Every
 * layer is now a FIXED full-stage-size (0,0,stageWidth,stageWidth) positioning wrapper; the
 * actual x/y/scale/rotation is a `transform: [translateX, translateY, scale, rotate]` array on
 * an inner wrapper of that same fixed size. Both RN and CSS default an element's transform
 * origin to its own center, so this scales/rotates around the layer's own center with no extra
 * origin trick needed. The <Image> itself is always width:100%/height:100% and unchanged.
 */
export function CreatureTestComposer({
  recipe,
  config,
  width,
  layerOrder = DEFAULT_LAYER_ORDER,
  layerVisibility,
  showRig,
  highlightSlot,
}: CreatureTestComposerProps) {
  const height = width; // square stage

  return (
    <View style={[styles.stage, { width, height }]}>
      {layerOrder.map((slot) => {
        const visible = layerVisibility?.[slot] ?? true;
        if (!visible) return null;
        const category = recipe[slot];
        const source = CREATURE_TEST_ASSETS[category][slot];
        const highlighted = highlightSlot === slot;

        if (slot === 'body') {
          return (
            <TransformedLayer key={slot} source={source} transform={BODY_RIG} stageWidth={width} debugOutline={showRig} highlighted={highlighted} />
          );
        }

        const anchor = ANCHORS[slot];
        const correction = config[category][slot];
        const transform = composeTransform(anchor, correction);
        const spacingScale = slot === 'eyes' ? (correction as { spacingScale?: number }).spacingScale ?? 1 : 1;
        return (
          <TransformedLayer
            key={slot}
            source={source}
            transform={transform}
            spacingScaleX={spacingScale}
            stageWidth={width}
            debugOutline={showRig}
            highlighted={highlighted}
          />
        );
      })}
      {showRig ? <RigOverlay stageWidth={width} /> : null}
    </View>
  );
}

function TransformedLayer({
  source,
  transform,
  spacingScaleX = 1,
  stageWidth,
  debugOutline,
  highlighted,
}: {
  source: ImageSourcePropType;
  transform: CreatureTransform;
  spacingScaleX?: number;
  stageWidth: number;
  debugOutline?: boolean;
  highlighted?: boolean;
}) {
  const unit = stageWidth / CANVAS; // px per 1254-space unit at current display size

  const outerTransform = [
    { translateX: transform.x * unit },
    { translateY: transform.y * unit },
    { scale: transform.scale },
    { rotate: `${transform.rotation}deg` },
  ];

  const content =
    spacingScaleX !== 1 ? (
      // Inner wrapper carries ONLY the eye-spacing scaleX, nested inside the outer x/y/scale/
      // rotation wrapper -- the <Image> below is still rendered exactly once either way.
      <View style={[styles.fill, { transform: [{ scaleX: spacingScaleX }] }]}>
        <Image source={source} contentFit="contain" style={styles.fill} />
      </View>
    ) : (
      <Image source={source} contentFit="contain" style={styles.fill} />
    );

  return (
    // Fixed full-stage-size positioning wrapper -- never resized, only ever positioned at
    // (0,0,stageWidth,stageWidth). All actual positioning happens via `transform` below.
    <View style={[styles.layer, { left: 0, top: 0, width: stageWidth, height: stageWidth }]}>
      <View style={[styles.fill, { transform: outerTransform }]}>
        {content}
        {debugOutline ? <View pointerEvents="none" style={[styles.fill, styles.debugBox]} /> : null}
        {highlighted ? <View pointerEvents="none" style={[styles.fill, styles.highlightBox]} /> : null}
      </View>
    </View>
  );
}

// Approximate, illustrative reference points for visual debugging only -- NOT the transform
// math (which is purely anchor + correction, see above). These exist so "Show Rig" can point
// at roughly where each attachment conceptually lives on the master body, estimated from
// visual inspection of the approved artwork.
const DEBUG_REFERENCE_POINTS: { label: string; x: number; y: number; color: string }[] = [
  { label: 'eyes anchor', x: 627, y: 580, color: 'rgba(220,30,60,0.9)' },
  { label: 'ears/horns anchor', x: 627, y: 150, color: 'rgba(230,140,20,0.9)' },
  { label: 'left wing anchor', x: 350, y: 650, color: 'rgba(40,100,220,0.9)' },
  { label: 'right wing anchor', x: 900, y: 650, color: 'rgba(40,100,220,0.9)' },
  { label: 'tail anchor', x: 950, y: 950, color: 'rgba(150,90,200,0.9)' },
];

const DEBUG_BODY_BBOX = { x0: 230, y0: 15, x1: 1020, y1: 1215 };

function RigOverlay({ stageWidth }: { stageWidth: number }) {
  const unit = stageWidth / CANVAS;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* stage boundary */}
      <View style={[styles.rigBorder, { left: 0, top: 0, width: stageWidth, height: stageWidth }]} />
      {/* center lines */}
      <View style={[styles.rigLine, { left: stageWidth / 2, top: 0, width: 1, height: stageWidth }]} />
      <View style={[styles.rigLine, { left: 0, top: stageWidth / 2, width: stageWidth, height: 1 }]} />
      {/* body bounding box (approximate) */}
      <View
        style={[
          styles.rigDashedBox,
          {
            left: DEBUG_BODY_BBOX.x0 * unit,
            top: DEBUG_BODY_BBOX.y0 * unit,
            width: (DEBUG_BODY_BBOX.x1 - DEBUG_BODY_BBOX.x0) * unit,
            height: (DEBUG_BODY_BBOX.y1 - DEBUG_BODY_BBOX.y0) * unit,
          },
        ]}
      />
      {DEBUG_REFERENCE_POINTS.map((pt) => (
        <RigCrosshair key={pt.label} x={pt.x * unit} y={pt.y * unit} color={pt.color} />
      ))}
    </View>
  );
}

function RigCrosshair({ x, y, color }: { x: number; y: number; color: string }) {
  const size = 18;
  const thickness = 2;
  return (
    <>
      <View style={[styles.rigLine, { left: x - size / 2, top: y - thickness / 2, width: size, height: thickness, backgroundColor: color }]} />
      <View style={[styles.rigLine, { left: x - thickness / 2, top: y - size / 2, width: thickness, height: size, backgroundColor: color }]} />
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    overflow: 'visible',
  },
  layer: {
    position: 'absolute',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  debugBox: {
    borderWidth: 1,
    borderColor: 'rgba(0,150,255,0.6)',
    borderStyle: 'dashed',
  },
  highlightBox: {
    borderWidth: 3,
    borderColor: 'rgba(230,30,90,0.95)',
  },
  rigBorder: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  rigLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  rigDashedBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(0,180,90,0.8)',
    borderStyle: 'dashed',
  },
});
