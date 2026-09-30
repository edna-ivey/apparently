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
};

const CANVAS = CREATURE_TEST_CANVAS.width; // square, 1254

/**
 * Renders the 5 modular layers on one fixed 1254x1254 stage, scaled to `width` for display.
 * The body is always the locked master rig (BODY_RIG, identical for every category). Every
 * other slot's final transform is its shared ANCHOR composed with that category's own small
 * correction from `config` -- see creature-test-config.ts. No positioning logic lives here
 * beyond that composition; this component never adjusts anything per-category itself.
 */
export function CreatureTestComposer({ recipe, config, width, layerOrder = DEFAULT_LAYER_ORDER, layerVisibility, showRig }: CreatureTestComposerProps) {
  const height = width; // square stage

  return (
    <View style={[styles.stage, { width, height }]}>
      {layerOrder.map((slot) => {
        const visible = layerVisibility?.[slot] ?? true;
        if (!visible) return null;
        const category = recipe[slot];
        const source = CREATURE_TEST_ASSETS[category][slot];

        if (slot === 'body') {
          return <TransformedLayer key={slot} source={source} transform={BODY_RIG} stageWidth={width} debugLabel={showRig ? 'body' : undefined} />;
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
            debugLabel={showRig ? slot : undefined}
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
  debugLabel,
}: {
  source: ImageSourcePropType;
  transform: CreatureTransform;
  spacingScaleX?: number;
  stageWidth: number;
  debugLabel?: string;
}) {
  const unit = stageWidth / CANVAS; // px per 1254-space unit at current display size
  const scaledSize = stageWidth * transform.scale;
  const baseOffset = (stageWidth - scaledSize) / 2;
  const left = baseOffset + transform.x * unit;
  const top = baseOffset + transform.y * unit;

  const rotateTransform = transform.rotation ? [{ rotate: `${transform.rotation}deg` }] : undefined;
  // Horizontal-only spacing adjustment for eyes: a separate scaleX applied on top of the
  // uniform scale above, so "spacing" and "overall scale" stay independent controls as the
  // brief asks for, without needing to split the paired eyes asset into two images yet.
  const spacingTransform = spacingScaleX !== 1 ? [{ scaleX: spacingScaleX }] : undefined;

  return (
    <>
      <Image
        source={source}
        contentFit="contain"
        style={[styles.layer, { left, top, width: scaledSize, height: scaledSize, transform: rotateTransform }]}
      />
      {spacingTransform ? (
        // scaleX needs its own transformed element since RN merges transform arrays in order;
        // applying it on the same node as rotate above would compound unpredictably for
        // non-zero rotation, so eyes with spacing adjustment render through this wrapper
        // instead when spacing != 1. Kept as a separate branch to keep the common case (no
        // spacing adjustment) simple.
        <View pointerEvents="none" style={[styles.layer, { left, top, width: scaledSize, height: scaledSize, transform: spacingTransform }]}>
          <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      {debugLabel ? (
        <View pointerEvents="none" style={[styles.layer, styles.debugBox, { left, top, width: scaledSize, height: scaledSize }]} />
      ) : null}
    </>
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
  debugBox: {
    borderWidth: 1,
    borderColor: 'rgba(0,150,255,0.6)',
    borderStyle: 'dashed',
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
