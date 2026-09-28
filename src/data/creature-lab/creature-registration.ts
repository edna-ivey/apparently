// Creature Registration Template (R&D proposal only -- see the "Canonical Registration
// Template" section of src/app/dev/creature-lab.tsx). Nothing here is production, nothing here
// is Bible-approved, and no existing asset in assets/creatures/ has been converted to this
// canvas. Two versions are kept side by side for comparison:
//
//   v0 -- fits Planner's WHOLE native canvas to the canonical canvas height, centered both
//         ways. Rejected as too restrictive: the body's own source canvas ends up consuming
//         the entire canonical height, leaving no headroom for large ears/wings/head-features.
//   v1 -- fits the body to a fixed STANDARD_BODY_RENDER_HEIGHT and positions it so the paw
//         baseline lands at a deliberately chosen canonical Y (not simply vertically centered),
//         leaving most of the leftover vertical space as headroom above the head.
//
// Every native-space number below (the ANCHOR POSITIONS themselves) is defined exactly ONCE,
// in Planner's own native 1122x1402 pixel space, and is shared by both v0 and v1 -- only the
// CANVAS AROUND THE BODY changes between versions, never the body skeleton's own measurements.
// That's the whole point of the v1 request: recalculate the projection, not the anchors.
//
// IMPORTANT: not everything below is equally certain. Split per Michelle's instruction:
//
//   MEASURED / STRONGLY GROUNDED -- read directly off Planner's own pixels (luminance
//   thresholding for the eye sockets, row-by-row opaque-width tracing for the body silhouette).
//   These are facts about the existing art, not judgment calls.
//
//   PROPOSED ATTACHMENT ANCHORS -- ear/wing/tail/head-feature/chest-crest roots, plus the wing
//   and tail bleed zones. These were sensibly derived from the same silhouette geometry (e.g.
//   "ear root = head's upper-side edge at eye height") but are placement JUDGMENT CALLS, not
//   measurements -- there is no blank ear socket in the art the way there's a blank eye socket.
//   Michelle still needs to visually approve these before they're treated as final.

export type RegistrationVersion = 'v0' | 'v1' | 'v2';

// Planner's own native SVG canvas (its declared viewBox), before placement. Shared by both
// versions -- this is a fact about the file, not a template choice.
export const PLANNER_NATIVE_CANVAS = { width: 1122, height: 1402 };

// --- Native-space measurements (Planner's own 1122x1402 pixel space) -----------------------
// Defined once. See the comment blocks above each group for how they were derived; unchanged
// from the v0 pass -- this refactor only adds v1's projection and the measured/proposed split,
// it does not re-measure or move anything.

const MEASURED_POINTS_NATIVE = {
  leftEyeCenter: { x: 430, y: 318.5 },
  rightEyeCenter: { x: 690, y: 318.5 },
  noseMouth: { x: 560, y: 430 },
};

const MEASURED_BOXES_NATIVE = {
  eyeRegion: { x0: 370, y0: 242, x1: 750, y1: 395 },
  leftEyeSocket: { x0: 370, y0: 242, x1: 490, y1: 395 },
  rightEyeSocket: { x0: 630, y0: 242, x1: 750, y1: 395 },
  plannerBounds: { x0: 0, y0: 0, x1: PLANNER_NATIVE_CANVAS.width, y1: PLANNER_NATIVE_CANVAS.height },
  // Full opaque-pixel bounding box (alpha > 30), row/column-scanned directly.
  plannerOpaqueBounds: { x0: 204, y0: 56, x1: 916, y1: 1349 },
};

// Body centerline and paw baseline are direct readouts of the opaque bbox above (measured),
// not independent judgment calls.
const MEASURED_BODY_CENTERLINE_X_NATIVE = 560; // (204+916)/2
const MEASURED_PAW_BASELINE_Y_NATIVE = 1349; // opaque bbox bottom (max y)

// Ear roots: head silhouette's upper-side edge, traced from row-by-row opaque width (head
// widest ~y=350 at x[317,803]; at y~160 the edge is x~[364,766]). PROPOSED: there is no visible
// ear socket in the art the way there's a blank eye socket -- this is "where an ear would
// plausibly attach," not a measured feature.
//
// Wing roots: outer shoulder edge, at the neck-to-shoulder transition (neck narrowest
// ~y=480-500 at x[441,678]; shoulders re-widen by y~535 to roughly x[434,686]). PROPOSED.
//
// Tail root: left haunch edge in the seat/hip bulge (widest ~y=1100 at x[205,915]); placed
// inboard of the silhouette edge, mid-haunch-height. PROPOSED.
//
// Head-feature anchor: top of head silhouette (topmost opaque point y=56), offset down
// slightly to where the head is already a few hundred px wide. PROPOSED.
//
// Chest-crest anchor: torso centerline, roughly mid-height between the neck (~490) and the
// haunch bulge (~950). PROPOSED.
const PROPOSED_POINTS_NATIVE = {
  leftEarRoot: { x: 370, y: 160 },
  rightEarRoot: { x: 750, y: 160 },
  leftWingRoot: { x: 434, y: 535 },
  rightWingRoot: { x: 686, y: 535 },
  tailRoot: { x: 270, y: 1150 },
  headFeatureAnchor: { x: 560, y: 90 },
  chestCrestAnchor: { x: 560, y: 720 },
};

// Safe zones: measured silhouette bbox (head: topmost point to neck narrowing; body: full
// opaque bbox) plus a flat ~25-30px native-space margin. Classified PROPOSED because the
// *margin amount* is a judgment call even though the underlying silhouette is measured.
const PROPOSED_BOXES_NATIVE = {
  headSafeZone: { x0: 300, y0: 40, x1: 820, y1: 500 },
  bodySafeZone: { x0: 180, y0: 40, x1: 940, y1: 1370 },
};

// Bleed areas are proposed directly in canonical-canvas fractions (not native-space), since a
// bleed allowance isn't a property of one body -- sized against what the Extreme Silhouette /
// Tail & Wings Scale stress tests showed dramatic assets actually use. Same fractions reused
// for both v0 and v1 (deliberately -- v1 doesn't change the answer to "what fraction of the
// canvas should a wing be allowed to use," only how much canvas exists around the body).
const PROPOSED_BLEED_FRACTIONS = {
  maxWingBleedArea: { x0: 0, y0: 0.19, x1: 1, y1: 0.64 },
  maxTailBleedArea: { x0: 0, y0: 0.47, x1: 0.63, y1: 1 },
};

// --- Projection: native Planner-space -> a given canvas ------------------------------------

type Placement = { scale: number; offsetX: number; offsetY: number; renderedWidth: number; renderedHeight: number };

function projectPoint(p: { x: number; y: number }, canvas: { width: number; height: number }, placement: Placement) {
  const canonical = { x: placement.offsetX + p.x * placement.scale, y: placement.offsetY + p.y * placement.scale };
  return { native: p, canonical, normalized: { x: canonical.x / canvas.width, y: canonical.y / canvas.height } };
}

function projectBox(b: { x0: number; y0: number; x1: number; y1: number }, canvas: { width: number; height: number }, placement: Placement) {
  const c0 = projectPoint({ x: b.x0, y: b.y0 }, canvas, placement).canonical;
  const c1 = projectPoint({ x: b.x1, y: b.y1 }, canvas, placement).canonical;
  return {
    native: b,
    canonical: { x0: c0.x, y0: c0.y, x1: c1.x, y1: c1.y },
    normalized: { x0: c0.x / canvas.width, y0: c0.y / canvas.height, x1: c1.x / canvas.width, y1: c1.y / canvas.height },
  };
}

function buildTemplate(version: RegistrationVersion, canvas: { width: number; height: number }, placement: Placement, notes: string) {
  const point = (p: { x: number; y: number }) => projectPoint(p, canvas, placement);
  const box = (b: { x0: number; y0: number; x1: number; y1: number }) => projectBox(b, canvas, placement);
  const bleedBox = (b: { x0: number; y0: number; x1: number; y1: number }) => ({
    normalized: b,
    canonical: { x0: b.x0 * canvas.width, y0: b.y0 * canvas.height, x1: b.x1 * canvas.width, y1: b.y1 * canvas.height },
  });

  return {
    version,
    notes,
    canvas,
    plannerNativeCanvas: PLANNER_NATIVE_CANVAS,
    plannerPlacement: placement,
    measured: {
      points: {
        leftEyeCenter: point(MEASURED_POINTS_NATIVE.leftEyeCenter),
        rightEyeCenter: point(MEASURED_POINTS_NATIVE.rightEyeCenter),
        noseMouth: point(MEASURED_POINTS_NATIVE.noseMouth),
      },
      boxes: {
        eyeRegion: box(MEASURED_BOXES_NATIVE.eyeRegion),
        leftEyeSocket: box(MEASURED_BOXES_NATIVE.leftEyeSocket),
        rightEyeSocket: box(MEASURED_BOXES_NATIVE.rightEyeSocket),
        plannerBounds: box(MEASURED_BOXES_NATIVE.plannerBounds),
        plannerOpaqueBounds: box(MEASURED_BOXES_NATIVE.plannerOpaqueBounds),
      },
      bodyCenterlineX: point({ x: MEASURED_BODY_CENTERLINE_X_NATIVE, y: 0 }).normalized.x,
      pawBaselineY: point({ x: 0, y: MEASURED_PAW_BASELINE_Y_NATIVE }).normalized.y,
    },
    proposed: {
      points: {
        leftEarRoot: point(PROPOSED_POINTS_NATIVE.leftEarRoot),
        rightEarRoot: point(PROPOSED_POINTS_NATIVE.rightEarRoot),
        leftWingRoot: point(PROPOSED_POINTS_NATIVE.leftWingRoot),
        rightWingRoot: point(PROPOSED_POINTS_NATIVE.rightWingRoot),
        tailRoot: point(PROPOSED_POINTS_NATIVE.tailRoot),
        headFeatureAnchor: point(PROPOSED_POINTS_NATIVE.headFeatureAnchor),
        chestCrestAnchor: point(PROPOSED_POINTS_NATIVE.chestCrestAnchor),
      },
      boxes: {
        headSafeZone: box(PROPOSED_BOXES_NATIVE.headSafeZone),
        bodySafeZone: box(PROPOSED_BOXES_NATIVE.bodySafeZone),
      },
      maxWingBleedArea: bleedBox(PROPOSED_BLEED_FRACTIONS.maxWingBleedArea),
      maxTailBleedArea: bleedBox(PROPOSED_BLEED_FRACTIONS.maxTailBleedArea),
    },
  };
}

// === v0 ======================================================================================
// Fits Planner's whole native canvas to the canonical canvas height, centered both ways.
const V0_CANVAS = { width: 1600, height: 1800 };
const v0Scale = V0_CANVAS.height / PLANNER_NATIVE_CANVAS.height;
const v0RenderedWidth = PLANNER_NATIVE_CANVAS.width * v0Scale;
const v0RenderedHeight = PLANNER_NATIVE_CANVAS.height * v0Scale;
const V0_PLACEMENT: Placement = {
  scale: v0Scale,
  offsetX: (V0_CANVAS.width - v0RenderedWidth) / 2,
  offsetY: (V0_CANVAS.height - v0RenderedHeight) / 2,
  renderedWidth: v0RenderedWidth,
  renderedHeight: v0RenderedHeight,
};
export const REGISTRATION_TEMPLATE_V0 = buildTemplate(
  'v0',
  V0_CANVAS,
  V0_PLACEMENT,
  'Whole native canvas fit to canvas height, centered. Rejected as final: consumes the full canonical height, no headroom for dramatic traits.',
);

// === v1 ======================================================================================
// Fits the body to STANDARD_BODY_RENDER_HEIGHT and positions it so the paw baseline sits at a
// deliberately chosen canonical Y -- NOT vertically centered, which would make the baseline an
// arbitrary byproduct of how much native canvas margin happens to exist below the paws.
const V1_CANVAS = { width: 1800, height: 2000 };
const STANDARD_BODY_RENDER_HEIGHT = 1600;
// PROPOSED policy, not measured: how much canonical space to leave below the body's native
// canvas bottom edge (paws already have ~53px of native margin below them within the art
// itself; this is additional canvas margin beyond that). Kept small on purpose so nearly all of
// the 400px leftover vertical space (canvas height minus render height) becomes headroom above
// the head instead of being split evenly top/bottom.
const V1_BOTTOM_MARGIN = 20;
const v1Scale = STANDARD_BODY_RENDER_HEIGHT / PLANNER_NATIVE_CANVAS.height;
const v1RenderedWidth = PLANNER_NATIVE_CANVAS.width * v1Scale;
const V1_PLACEMENT: Placement = {
  scale: v1Scale,
  offsetX: (V1_CANVAS.width - v1RenderedWidth) / 2,
  offsetY: V1_CANVAS.height - STANDARD_BODY_RENDER_HEIGHT - V1_BOTTOM_MARGIN,
  renderedWidth: v1RenderedWidth,
  renderedHeight: STANDARD_BODY_RENDER_HEIGHT,
};
export const REGISTRATION_TEMPLATE_V1 = buildTemplate(
  'v1',
  V1_CANVAS,
  V1_PLACEMENT,
  `Body fit to a standard ${STANDARD_BODY_RENDER_HEIGHT}px render height; paw baseline fixed via a ${V1_BOTTOM_MARGIN}px canonical bottom margin, not centering -- leaves most of the canvas's leftover vertical space as headroom above the head.`,
);

// === v2 (PROPOSED, replaces v1 as the working candidate) ===================================
// Michelle's review of v1 found two SEPARATE problems, confirmed by inspection, not assumed:
//
//   1. Eyes read "low, almost sitting on the chest." Measured cause: the eye's position
//      RELATIVE TO THE BODY is identical in v0 and v1 (native fraction 318.5/1402 = 0.2272 in
//      both) -- the body art and the anchor measurement are not at fault. What changed is pure
//      canvas framing: v1 added 380px of headroom ABOVE an unchanged body, which pushes the eye
//      from 22.7% down the v0 canvas to 37.2% down the v1 canvas -- a 14.5-point drift with
//      nothing to do with the face itself. v2 is a registration-only fix for this.
//
//   2. The body art's own eye-socket shading is a strong, pre-committed dark shape that fights
//      modular eye assets (see EXPECT for the softened body-base -- creature-assets.ts's
//      PLANNER_BODY_ASSET is unchanged; the softened version is a separate prototype file,
//      not a v2 registration concern). Orthogonal to (1); fixed at the art layer, not here.
//
// v2 keeps v1's canvas (1800x2000, same lateral wing room) but reduces how much of it is spent
// as pure top headroom: body render height 1720 (was 1600) with a 25px bottom margin (was 20)
// puts the eye at 32.8% down the canvas -- roughly halfway back to v0's 22.7%, not all the way,
// because the SAME 3 canonical families' ear assets (see creature-registered-v2 generation)
// need real vertical room above their root anchor to avoid clipping, and every px reclaimed
// from headroom for face-alignment is a px no longer available there. This is a genuine,
// documented tradeoff -- v2 does not "solve" both goals for free, it is the best compromise
// point found between them for this specific tall ear asset.
const V2_CANVAS = { width: 1800, height: 2000 };
const V2_STANDARD_BODY_RENDER_HEIGHT = 1720;
const V2_BOTTOM_MARGIN = 25;
const v2Scale = V2_STANDARD_BODY_RENDER_HEIGHT / PLANNER_NATIVE_CANVAS.height;
const v2RenderedWidth = PLANNER_NATIVE_CANVAS.width * v2Scale;
const V2_PLACEMENT: Placement = {
  scale: v2Scale,
  offsetX: (V2_CANVAS.width - v2RenderedWidth) / 2,
  offsetY: V2_CANVAS.height - V2_STANDARD_BODY_RENDER_HEIGHT - V2_BOTTOM_MARGIN,
  renderedWidth: v2RenderedWidth,
  renderedHeight: V2_STANDARD_BODY_RENDER_HEIGHT,
};
export const REGISTRATION_TEMPLATE_V2 = buildTemplate(
  'v2',
  V2_CANVAS,
  V2_PLACEMENT,
  `PROPOSED replacement for v1. Same 1800x2000 canvas; body render height raised to ${V2_STANDARD_BODY_RENDER_HEIGHT}px (was 1600) and bottom margin to ${V2_BOTTOM_MARGIN}px (was 20) so the eye lands at ~33% down the canvas instead of v1's 37% (v0 was 23%) -- a deliberate partial correction, not a full return to v0, traded against ear headroom. See creature-registered-v2 generation notes for the ear-scale clamp this still requires.`,
);

export type CreatureRegistrationTemplate = typeof REGISTRATION_TEMPLATE_V1;
