import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import {
  CREATURE_TEST_ASSETS,
  type CreatureTestCategory,
  type CreatureTestSlot,
} from '@/data/creature-test/creature-test-assets';
import {
  BODY_CANVAS_INSET,
  BODY_CANVAS_SIZE,
  BODY_RIG,
  COMPOSITION_CANVAS_SIZE,
  resolveEyeTransform,
  resolveTransform,
  type AssetCorrections,
  type CreatureTransform,
  type SlotDefaults,
} from '@/data/creature-test/creature-test-config';

export type CreatureTestRecipe = Record<CreatureTestSlot, CreatureTestCategory>;

// Default paint order, back to front. Exposed as a prop (not hardcoded) because the brief
// explicitly calls for this to be easy to adjust per-asset if a tail/wings needs partial
// overlap with the body.
export const DEFAULT_LAYER_ORDER: CreatureTestSlot[] = ['wings', 'tail', 'body', 'earsHorns', 'eyes'];

export type CreatureTestComposerProps = {
  recipe: CreatureTestRecipe;
  slotDefaults: SlotDefaults;
  assetCorrections: AssetCorrections;
  width: number;
  layerOrder?: CreatureTestSlot[];
  layerVisibility?: Partial<Record<CreatureTestSlot, boolean>>;
  showRig?: boolean;
  /** Slot currently being calibrated -- gets a highlight box that moves/scales/rotates WITH the
   * layer, so a calibration change is unmistakable. Independent of showRig; gated by
   * showSelectionBox below so it can be hidden while judging the creature visually without
   * affecting calibration itself. */
  highlightSlot?: CreatureTestSlot | null;
  /** Whether to actually render the highlightSlot box (default false). Purely a display toggle
   * -- calibration works identically whether this is on or off. */
  showSelectionBox?: boolean;
};

/**
 * Renders the 5 modular layers inside a fixed COMPOSITION_CANVAS_SIZE stage, scaled to `width`
 * for display. The original BODY_CANVAS_SIZE (1254x1254) master coordinate system -- the one
 * every x/y/scale/rotation value is measured in -- is centered inside that larger stage,
 * unchanged in size or position, purely to give dramatic ears/horns/wings/tails transparent
 * room to extend into without clipping. The body is always the locked master rig (BODY_RIG,
 * identical for every category, rendered at the body canvas's own position). Every other
 * slot's final transform is `slotDefaults[slot]` composed with that category's own optional
 * correction from `assetCorrections` (absent = identity = "use the slot default exactly") --
 * this is what makes swapping a category's asset change ONLY the artwork, never the socket.
 */
export function CreatureTestComposer({
  recipe,
  slotDefaults,
  assetCorrections,
  width,
  layerOrder = DEFAULT_LAYER_ORDER,
  layerVisibility,
  showRig,
  highlightSlot,
  showSelectionBox = false,
}: CreatureTestComposerProps) {
  const height = width; // square stage
  const unit = width / COMPOSITION_CANVAS_SIZE; // px per 1254-grid unit at current display size
  const bodyCanvasPx = BODY_CANVAS_SIZE * unit;
  const bodyOffsetPx = BODY_CANVAS_INSET * unit;

  return (
    <View style={[styles.stage, { width, height }]}>
      {layerOrder.map((slot) => {
        const visible = layerVisibility?.[slot] ?? true;
        if (!visible) return null;
        const category = recipe[slot];
        const source = CREATURE_TEST_ASSETS[category][slot];
        const highlighted = highlightSlot === slot && showSelectionBox;

        if (slot === 'body') {
          return (
            <TransformedLayer
              key={slot}
              source={source}
              transform={BODY_RIG}
              bodyCanvasPx={bodyCanvasPx}
              bodyOffsetPx={bodyOffsetPx}
              unit={unit}
              debugOutline={showRig}
              highlighted={highlighted}
            />
          );
        }

        const correction = assetCorrections[category]?.[slot];
        const isEyes = slot === 'eyes';
        const resolved = isEyes
          ? resolveEyeTransform(slotDefaults.eyes, correction as Partial<SlotDefaults['eyes']> | undefined)
          : resolveTransform(slotDefaults[slot], correction as Partial<CreatureTransform> | undefined);
        const spacingScale = isEyes ? (resolved as unknown as { spacingScale: number }).spacingScale : 1;

        return (
          <TransformedLayer
            key={slot}
            source={source}
            transform={resolved}
            spacingScaleX={spacingScale}
            bodyCanvasPx={bodyCanvasPx}
            bodyOffsetPx={bodyOffsetPx}
            unit={unit}
            debugOutline={showRig}
            highlighted={highlighted}
          />
        );
      })}
      {showRig ? <RigOverlay stageWidth={width} unit={unit} bodyCanvasPx={bodyCanvasPx} bodyOffsetPx={bodyOffsetPx} /> : null}
    </View>
  );
}

function TransformedLayer({
  source,
  transform,
  spacingScaleX = 1,
  bodyCanvasPx,
  bodyOffsetPx,
  unit,
  debugOutline,
  highlighted,
}: {
  source: ImageSourcePropType;
  transform: CreatureTransform;
  spacingScaleX?: number;
  bodyCanvasPx: number;
  bodyOffsetPx: number;
  unit: number;
  debugOutline?: boolean;
  highlighted?: boolean;
}) {
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
    // Fixed positioning wrapper matching the ORIGINAL 1254 body-canvas region, centered inside
    // the larger composition stage -- never resized, only ever positioned here. All actual
    // positioning happens via `transform` below, which is free to visibly extend past this
    // wrapper's own box (overflow: visible throughout) into the surrounding safe area.
    <View style={[styles.layer, { left: bodyOffsetPx, top: bodyOffsetPx, width: bodyCanvasPx, height: bodyCanvasPx }]}>
      <View style={[styles.fill, { transform: outerTransform }]}>
        {content}
        {debugOutline ? <View pointerEvents="none" style={[styles.fill, styles.debugBox]} /> : null}
        {highlighted ? <View pointerEvents="none" style={[styles.fill, styles.highlightBox]} /> : null}
      </View>
    </View>
  );
}

// Approximate, illustrative reference points for visual debugging only -- NOT the transform
// math (which is purely slotDefault + correction, see above). Expressed in the original
// 1254-unit body-canvas system; RigOverlay offsets them by bodyOffsetPx to place them correctly
// inside the larger composition stage.
const DEBUG_REFERENCE_POINTS: { label: string; x: number; y: number; color: string }[] = [
  { label: 'eyes anchor', x: 627, y: 580, color: 'rgba(220,30,60,0.9)' },
  { label: 'ears/horns anchor', x: 627, y: 150, color: 'rgba(230,140,20,0.9)' },
  { label: 'left wing anchor', x: 350, y: 650, color: 'rgba(40,100,220,0.9)' },
  { label: 'right wing anchor', x: 900, y: 650, color: 'rgba(40,100,220,0.9)' },
  { label: 'tail anchor', x: 950, y: 950, color: 'rgba(150,90,200,0.9)' },
];

const DEBUG_BODY_BBOX = { x0: 230, y0: 15, x1: 1020, y1: 1215 };

function RigOverlay({ stageWidth, unit, bodyCanvasPx, bodyOffsetPx }: { stageWidth: number; unit: number; bodyCanvasPx: number; bodyOffsetPx: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* FULL COMPOSITION BOUNDS -- the entire safe-area canvas */}
      <View style={[styles.compositionBorder, { left: 0, top: 0, width: stageWidth, height: stageWidth }]} />
      <Text style={[styles.rigLabel, { left: 4, top: 4, color: 'rgba(40,100,220,0.9)' }]}>FULL COMPOSITION BOUNDS</Text>

      {/* BODY CANVAS -- the original, unchanged 1254x1254 master coordinate system */}
      <View style={[styles.bodyCanvasBorder, { left: bodyOffsetPx, top: bodyOffsetPx, width: bodyCanvasPx, height: bodyCanvasPx }]} />
      <Text style={[styles.rigLabel, { left: bodyOffsetPx + 4, top: bodyOffsetPx + 4, color: 'rgba(0,0,0,0.7)' }]}>BODY CANVAS</Text>

      {/* center lines (of the body canvas, since that's the coordinate system everything is calibrated against) */}
      <View style={[styles.rigLine, { left: bodyOffsetPx + bodyCanvasPx / 2, top: bodyOffsetPx, width: 1, height: bodyCanvasPx }]} />
      <View style={[styles.rigLine, { left: bodyOffsetPx, top: bodyOffsetPx + bodyCanvasPx / 2, width: bodyCanvasPx, height: 1 }]} />

      {/* body bounding box (approximate) */}
      <View
        style={[
          styles.rigDashedBox,
          {
            left: bodyOffsetPx + DEBUG_BODY_BBOX.x0 * unit,
            top: bodyOffsetPx + DEBUG_BODY_BBOX.y0 * unit,
            width: (DEBUG_BODY_BBOX.x1 - DEBUG_BODY_BBOX.x0) * unit,
            height: (DEBUG_BODY_BBOX.y1 - DEBUG_BODY_BBOX.y0) * unit,
          },
        ]}
      />
      {DEBUG_REFERENCE_POINTS.map((pt) => (
        <RigCrosshair key={pt.label} x={bodyOffsetPx + pt.x * unit} y={bodyOffsetPx + pt.y * unit} color={pt.color} />
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
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
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
  compositionBorder: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(40,100,220,0.55)',
    borderStyle: 'dashed',
  },
  bodyCanvasBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.55)',
  },
  rigLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
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
