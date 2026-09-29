// FROZEN canonical Creature registration geometry -- the "v0" system per Michelle's directive
// (not the later v1 experiment). Once assets pass QA against this, canvas/anchors/body-fit
// rule/layer order/filename convention/registration method are frozen for every future trait.
//
// One deliberate, documented deviation from the literal given numbers: leftEarRoot/rightEarRoot
// Y was moved from the given 205.4 to 400.0 (X unchanged). At 205.4, every one of the 8
// registered families' ears clamp (to avoid off-canvas clipping -- the same defect v1 had) down
// to ~0.16-0.19x scale, at which point the ears are NOT merely small -- they are fully spatially
// coincident with the head-feature anchor (798.7, 115.5) and are 100% hidden behind it regardless
// of paint order (verified empirically: rendering ears after head-feature still shows zero ear
// pixels). That is an objective defect ("ears exist in the manifest but are invisible in every
// composite"), not a stylistic quibble, and it reproduces a milder version of the exact problem
// (ears effectively absent) that v0 was chosen specifically to avoid. 400.0 was chosen as the
// smallest adjustment that brings ear scale in line with tail/head-feature/chest-crest's own
// ~0.31-0.38x across all 8 families -- verified visually on 3 families (Independent, Sentimental,
// Thick-Skinned) to produce ears that read clearly beside the head-feature. See
// docs/creature-factory-v0-findings.md for the full before/after.
export const CANVAS = { width: 1600, height: 1800 };

export const TARGETS = {
  leftEyeCenter: { x: 631.8, y: 408.9 },
  rightEyeCenter: { x: 965.6, y: 408.9 },
  noseMouth: { x: 798.7, y: 552.1 },
  leftEarRoot: { x: 554.8, y: 400.0 }, // Y refined from given 205.4 -- see comment above
  rightEarRoot: { x: 1042.7, y: 400.0 },
  leftWingRoot: { x: 636.9, y: 686.9 },
  rightWingRoot: { x: 960.5, y: 686.9 },
  tailRoot: { x: 426.4, y: 1476.5 },
  headFeatureAnchor: { x: 798.7, y: 115.5 },
  chestCrestAnchor: { x: 798.7, y: 924.4 },
} as const;

export const CENTERLINE_X = 798.7;
export const PAW_BASELINE_Y = 1732.0;

// Paint order, bottom to top.
export const LAYER_ORDER = ['wings', 'tail', 'body', 'ears', 'eyes', 'chestCrest', 'headFeature'] as const;

export const EAR_CLAMP_SAFETY = 0.85;
