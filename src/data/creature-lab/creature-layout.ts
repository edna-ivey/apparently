import type { CreaturePartKey } from './creature-assets';

// THE single source of truth for creature slot geometry (Creature Lab R&D test only).
// Every number here is expressed as a fraction (0-1) of the BODY's own displayed box, since
// CreatureComposer always sizes the stage to the current body asset's own intrinsic aspect
// ratio -- so the body itself always exactly fills [0,1]x[0,1] with no letterboxing, and
// every other part is a rect within that same coordinate space. This is intentionally ONE
// shared config applied identically across all 8 families (per the test's own rule: prove
// whether a standardized framework works before reaching for per-trait exceptions).
//
// Each part is fit into its rect with `contentFit: contain`, preserving its own source
// aspect ratio and centering within the rect -- so the rect controls placement and maximum
// size, not a forced stretch/distortion of the approved art.
export type CreatureSlotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise. Omit unless an asset genuinely needs it -- none currently do. */
  rotation?: number;
  /** Paint order; also the CSS/RN zIndex applied to the layer. */
  zIndex: number;
};

export const CREATURE_LAYOUT: Record<CreaturePartKey, CreatureSlotRect> = {
  // The structural base. Always full-bleed by definition -- included here (rather than
  // hardcoded in the composer) only so the config literally matches the shape the task asked
  // for: one object with all seven keys.
  body: { x: 0, y: 0, width: 1, height: 1, zIndex: 3 },

  // Behind the body, spanning wide at shoulder height so the wing "shoulders" (where both
  // wings meet, near the top-center of the wings canvas) land roughly behind the body's
  // upper back/shoulder line.
  wings: { x: -0.08, y: 0.2, width: 1.16, height: 0.7, zIndex: 1 },

  // Asymmetric asset (base bottom-left of its own canvas, curling up-right) -- placed low and
  // to one side so the base sits behind the body's haunch and the curl peeks out beside it.
  tail: { x: -0.05, y: 0.5, width: 0.55, height: 0.55, zIndex: 2 },

  // Tall, wide-set asset meant to frame the head from above -- its own canvas has generous
  // headroom above the ear tips, so a negative y is expected/normal here, not a bug.
  ears: { x: 0.1, y: -0.18, width: 0.8, height: 0.65, zIndex: 4 },

  // Centered over the body's blank eye-socket band.
  eyes: { x: 0.18, y: 0.14, width: 0.64, height: 0.26, zIndex: 5 },

  // Centered on the torso/chest.
  chestCrest: { x: 0.33, y: 0.6, width: 0.34, height: 0.34, zIndex: 6 },

  // Sits on top of the head, above the ears in paint order (per the task's suggested order).
  headFeature: { x: 0.2, y: -0.14, width: 0.6, height: 0.38, zIndex: 7 },
};
