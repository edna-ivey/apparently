import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PLANNER_BODY_ASSET } from '@/data/creature-lab/creature-assets';
import type { CreatureRegistrationTemplate } from '@/data/creature-lab/creature-registration';

type NormPoint = { normalized: { x: number; y: number } };
type NormBox = { normalized: { x0: number; y0: number; x1: number; y1: number } };

// Dev-only visual guides for the Creature Registration Template. Measured anchors render solid;
// proposed (judgment-call) anchors render dashed/hollow -- see creature-registration.ts for
// which is which. Exact coordinates are surfaced as text beside the diagram (RegistrationCoordinateList
// in the Creature Lab screen), never as large text over the art. Nothing here ships to consumers.
export function RegistrationTemplateView({ template, width, showLabels }: { template: CreatureRegistrationTemplate; width: number; showLabels?: boolean }) {
  const canvasAspect = template.canvas.width / template.canvas.height;
  const canvasHeight = width / canvasAspect;

  const topMargin = showLabels ? 116 : 0;
  const bottomMargin = showLabels ? 60 : 0;
  const containerHeight = topMargin + canvasHeight + bottomMargin;

  const px = (nx: number) => nx * width;
  const py = (ny: number) => topMargin + ny * canvasHeight;

  const m = template.measured;
  const p = template.proposed;

  return (
    <View style={{ width, height: containerHeight }}>
      <View style={[styles.canvasArea, { top: topMargin, width, height: canvasHeight }]}>
        <Image source={PLANNER_BODY_ASSET} contentFit="contain" style={StyleSheet.absoluteFill} />

        {/* Proposed bleed areas -- very subtle, drawn first */}
        <BoxOverlay box={p.maxWingBleedArea as NormBox} px={px} py={py} color="rgba(70,130,220,0.55)" dashed subtle />
        <BoxOverlay box={p.maxTailBleedArea as NormBox} px={px} py={py} color="rgba(150,90,200,0.55)" dashed subtle />

        {/* Proposed safe zones */}
        <BoxOverlay box={p.boxes.headSafeZone} px={px} py={py} color="rgba(120,120,120,0.7)" dashed />
        <BoxOverlay box={p.boxes.bodySafeZone} px={px} py={py} color="rgba(120,120,120,0.45)" dashed />

        {/* Measured eye region */}
        <BoxOverlay box={m.boxes.eyeRegion} px={px} py={py} color="rgba(220,30,60,0.9)" />

        {/* Measured centerline + paw baseline -- solid */}
        <View pointerEvents="none" style={[styles.line, { left: px(m.bodyCenterlineX), top: topMargin, width: 2, height: canvasHeight, backgroundColor: 'rgba(200,0,200,0.8)' }]} />
        <View pointerEvents="none" style={[styles.line, { left: 0, top: py(m.pawBaselineY), width, height: 2, backgroundColor: 'rgba(120,80,40,0.8)' }]} />

        {/* Measured eye crosshairs -- solid */}
        <Crosshair x={px(m.points.leftEyeCenter.normalized.x)} y={py(m.points.leftEyeCenter.normalized.y)} color="rgba(220,30,60,1)" />
        <Crosshair x={px(m.points.rightEyeCenter.normalized.x)} y={py(m.points.rightEyeCenter.normalized.y)} color="rgba(220,30,60,1)" />
        <Crosshair x={px(m.points.noseMouth.normalized.x)} y={py(m.points.noseMouth.normalized.y)} color="rgba(90,60,30,1)" small />

        {/* Proposed attachment anchors -- hollow/dashed ring to read as "not yet approved" */}
        <AnchorDot x={px(p.points.leftEarRoot.normalized.x)} y={py(p.points.leftEarRoot.normalized.y)} color="rgba(230,140,20,1)" proposed />
        <AnchorDot x={px(p.points.rightEarRoot.normalized.x)} y={py(p.points.rightEarRoot.normalized.y)} color="rgba(230,140,20,1)" proposed />
        <AnchorDot x={px(p.points.leftWingRoot.normalized.x)} y={py(p.points.leftWingRoot.normalized.y)} color="rgba(40,100,220,1)" proposed />
        <AnchorDot x={px(p.points.rightWingRoot.normalized.x)} y={py(p.points.rightWingRoot.normalized.y)} color="rgba(40,100,220,1)" proposed />
        <AnchorDot x={px(p.points.tailRoot.normalized.x)} y={py(p.points.tailRoot.normalized.y)} color="rgba(150,90,200,1)" proposed />
        <AnchorDot x={px(p.points.headFeatureAnchor.normalized.x)} y={py(p.points.headFeatureAnchor.normalized.y)} color="rgba(40,160,90,1)" proposed />
        <AnchorDot x={px(p.points.chestCrestAnchor.normalized.x)} y={py(p.points.chestCrestAnchor.normalized.y)} color="rgba(20,150,150,1)" proposed />
      </View>

      {showLabels ? (
        <>
          {TOP_LABELS.map(({ key, text, row, get }) => {
            const anchor = get(template);
            const x = px(anchor.x);
            const labelY = topMargin - (row + 1) * 18 - 10;
            return <Leader key={key} x={x} labelY={labelY} lineTop={labelY + 12} lineBottom={py(anchor.y)} text={text} align="bottom" />;
          })}
          {BOTTOM_LABELS.map(({ key, text, row, get }) => {
            const anchor = get(template);
            const x = px(anchor.x);
            const anchorPy = py(anchor.y);
            const labelY = topMargin + canvasHeight + row * 18 + 4;
            return <Leader key={key} x={x} labelY={labelY} lineTop={anchorPy} lineBottom={labelY} text={text} align="top" />;
          })}
        </>
      ) : null}
    </View>
  );
}

type LabelSpec = { key: string; text: string; row: number; get: (t: CreatureRegistrationTemplate) => { x: number; y: number } };

const TOP_LABELS: LabelSpec[] = [
  { key: 'head', text: 'HEAD FEATURE', row: 0, get: (t) => t.proposed.points.headFeatureAnchor.normalized },
  { key: 'earL', text: 'L EAR ROOT', row: 1, get: (t) => t.proposed.points.leftEarRoot.normalized },
  { key: 'earR', text: 'R EAR ROOT', row: 1, get: (t) => t.proposed.points.rightEarRoot.normalized },
  { key: 'eyeL', text: 'LEFT EYE', row: 2, get: (t) => t.measured.points.leftEyeCenter.normalized },
  { key: 'eyeR', text: 'RIGHT EYE', row: 2, get: (t) => t.measured.points.rightEyeCenter.normalized },
  { key: 'wingL', text: 'L WING ROOT', row: 3, get: (t) => t.proposed.points.leftWingRoot.normalized },
  { key: 'wingR', text: 'R WING ROOT', row: 3, get: (t) => t.proposed.points.rightWingRoot.normalized },
];

const BOTTOM_LABELS: LabelSpec[] = [
  { key: 'tail', text: 'TAIL ROOT', row: 0, get: (t) => t.proposed.points.tailRoot.normalized },
  { key: 'chest', text: 'CHEST CREST', row: 0, get: (t) => t.proposed.points.chestCrestAnchor.normalized },
  { key: 'paw', text: 'PAW BASELINE', row: 1, get: (t) => ({ x: t.measured.bodyCenterlineX + 0.22, y: t.measured.pawBaselineY }) },
];

function Leader({ x, labelY, lineTop, lineBottom, text, align }: { x: number; labelY: number; lineTop: number; lineBottom: number; text: string; align: 'top' | 'bottom' }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.leaderLine, { left: x, top: Math.min(lineTop, lineBottom), height: Math.max(1, Math.abs(lineBottom - lineTop)) }]} />
      <Text pointerEvents="none" style={[styles.leaderLabel, { left: x - 42, top: align === 'bottom' ? labelY - 12 : labelY, width: 84 }]} numberOfLines={1}>
        {text}
      </Text>
    </>
  );
}

function BoxOverlay({ box, px, py, color, dashed, subtle }: { box: NormBox; px: (n: number) => number; py: (n: number) => number; color: string; dashed?: boolean; subtle?: boolean }) {
  const b = box.normalized;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.box,
        {
          left: px(b.x0),
          top: py(b.y0),
          width: px(b.x1 - b.x0),
          height: py(b.y1) - py(b.y0),
          borderColor: color,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderWidth: subtle ? 1 : 2,
        },
      ]}
    />
  );
}

function Crosshair({ x, y, color, small }: { x: number; y: number; color: string; small?: boolean }) {
  const size = small ? 14 : 22;
  const thickness = 2;
  return (
    <>
      <View pointerEvents="none" style={[styles.crosshairArm, { left: x - size / 2, top: y - thickness / 2, width: size, height: thickness, backgroundColor: color }]} />
      <View pointerEvents="none" style={[styles.crosshairArm, { left: x - thickness / 2, top: y - size / 2, width: thickness, height: size, backgroundColor: color }]} />
    </>
  );
}

// `proposed` renders as a hollow dashed ring (vs. measured anchors' solid crosshair) so the
// diagram itself communicates "not yet approved" without relying on a color legend alone.
function AnchorDot({ x, y, color, proposed }: { x: number; y: number; color: string; proposed?: boolean }) {
  const size = 16;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchorDot,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderColor: color,
          borderStyle: proposed ? 'dashed' : 'solid',
        },
      ]}
    >
      <View style={[styles.anchorDotCenter, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvasArea: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  box: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
  },
  crosshairArm: {
    position: 'absolute',
  },
  anchorDot: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorDotCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  leaderLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  leaderLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    color: 'rgba(0,0,0,0.75)',
  },
});
