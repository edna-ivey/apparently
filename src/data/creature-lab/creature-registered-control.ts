import type { ImageSourcePropType } from 'react-native';

import type { CreaturePartKey } from './creature-assets';

// One-family registration proof (R&D test only -- see "Control Registered Composite" in the
// Creature Lab screen). These 7 files are TEMPORARY, dev-only, generated copies -- the
// originals in assets/creatures/ are completely untouched. Each was produced by resizing the
// original approved Control artwork (no redrawing, no regeneration -- standard image resampling
// only) and pasting it onto its own full 1800x2000 v1 canonical canvas so its own functional
// attachment point(s) land on the v1 registration anchors in creature-registration.ts.
// Generation script + full transform math: see the session's scratchpad
// (registration_transforms.json / v1_targets.json) -- not checked into the repo, reproducible
// from creature-registration.ts's v1 anchors plus the per-part scale/offset documented below.
//
// Per-part registration method:
//   body: Control's own native 1086x1448 canvas fit via the same general v1 rule used for
//         Planner (scale = 1600/nativeHeight, centered horizontally, offsetY = 380 from the
//         same fixed bottom-margin policy) -- NOT matched to Control's own eye sockets.
//   eyes/ears/wings: 2-point similarity transform (uniform scale + translate, no rotation) --
//         both left/right native points mapped as closely as possible to both left/right v1
//         anchors. Landed within 0.6px of target for all three.
//   tail/headFeature/chestCrest: single anchor point, so scale can't be derived the same way --
//         used the AVERAGE of the independently-derived eyes and ears scales (0.632) as a
//         stand-in "shared trait-canvas scale," then translated to hit the one target point
//         exactly. This is the least-grounded part of the proof; see the written assessment.
//
// KNOWN ISSUE, not fixed here: the ears registration clips -- the scale needed to hit the
// proposed ear-root anchor spacing (0.797x) pushes the ear tips ~384px (38% of the resized
// ear's own height) above the v1 canvas's top edge. Rendered and shown as-is rather than
// silently patched; flagged for Michelle's review of the ear-root anchor and/or canvas headroom.
export const REGISTERED_CONTROL_FILENAMES: Record<CreaturePartKey, string> = {
  body: 'control-body-registered.svg',
  eyes: 'control-eyes-registered.svg',
  ears: 'control-ears-registered.svg',
  wings: 'control-wings-registered.svg',
  tail: 'control-tail-registered.svg',
  headFeature: 'control-headFeature-registered.svg',
  chestCrest: 'control-chestCrest-registered.svg',
};

export const REGISTERED_CONTROL_PARTS: Record<CreaturePartKey, ImageSourcePropType> = {
  body: require('../../../assets/creatures-dev-registered/control/control-body-registered.svg'),
  eyes: require('../../../assets/creatures-dev-registered/control/control-eyes-registered.svg'),
  ears: require('../../../assets/creatures-dev-registered/control/control-ears-registered.svg'),
  wings: require('../../../assets/creatures-dev-registered/control/control-wings-registered.svg'),
  tail: require('../../../assets/creatures-dev-registered/control/control-tail-registered.svg'),
  headFeature: require('../../../assets/creatures-dev-registered/control/control-headFeature-registered.svg'),
  chestCrest: require('../../../assets/creatures-dev-registered/control/control-chestCrest-registered.svg'),
};

// Per-part scale/offset actually used to generate the files above (px, on the 1800x2000 v1
// canvas). Kept here as a readable record rather than only in the generation script.
export const REGISTERED_CONTROL_TRANSFORMS: Record<CreaturePartKey, { scale: number; offsetX: number; offsetY: number }> = {
  body: { scale: 1.10497, offsetX: 300.0, offsetY: 380.0 },
  eyes: { scale: 0.46727, offsetX: 604.24, offsetY: 453.54 },
  ears: { scale: 0.79718, offsetX: 399.03, offsetY: -383.66 },
  wings: { scale: 1.16905, offsetX: 52.47, offsetY: 605.35 },
  tail: { scale: 0.63223, offsetX: 311.22, offsetY: 1067.14 },
  headFeature: { scale: 0.63223, offsetX: 502.45, offsetY: 83.78 },
  chestCrest: { scale: 0.63223, offsetX: 502.45, offsetY: 810.97 },
};
