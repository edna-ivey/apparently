import type { CreatureTestCategory } from './creature-test-assets';

// Calibration data ONLY -- never baked into the source SVGs (assets/creatures-test/ is never
// written to by this file or by the Creature Lab tool at runtime). See creature-lab.tsx's
// "Save Calibration" for how edits made live in the tool get back into a file: it downloads
// a creature-config.json a person then places at assets/creatures-test/creature-config.json,
// which (if present) this module tries to load and merge over these defaults on the next run.
//
// Transform model: for a given (category, slot), the FINAL transform is the shared anchor for
// that slot composed with a small per-category correction:
//   x = anchor.x + correction.x
//   y = anchor.y + correction.y
//   scale = anchor.scale * correction.scale
//   rotation = anchor.rotation + correction.rotation
// The body slot has no anchor/correction split -- it is the single locked master rig, fixed
// identically for every category (never moved to accommodate other parts).

export type CreatureTransform = { x: number; y: number; scale: number; rotation: number };

export const IDENTITY_TRANSFORM: CreatureTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

// The single locked body rig. Every category's body renders at exactly this transform --
// never adjusted per category.
export const BODY_RIG: CreatureTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

// Shared attachment anchors -- one per non-body slot, applied to every category before that
// category's own small correction. Derived by inspecting the actual approved artwork (see the
// session notes): eyes/ears-horns/tail all sit correctly on the shared 1254x1254 canvas at
// their native (identity) position across every category spot-checked (Strong, Playful,
// Visionary). Wings needed one shared adjustment -- at native position they sit almost exactly
// where ears/horns sits, so ears/horns (painted on top) hides nearly all of them; shifting the
// wings anchor down 120px (toward shoulder height) and scaling 1.4x makes them read as the
// dramatic, clearly-visible feature the spec calls for, verified visually across all three
// spot-checked categories.
export const ANCHORS: Record<'eyes' | 'earsHorns' | 'wings' | 'tail', CreatureTransform> = {
  eyes: { x: 0, y: 0, scale: 1, rotation: 0 },
  earsHorns: { x: 0, y: 0, scale: 1, rotation: 0 },
  wings: { x: 0, y: 120, scale: 1.4, rotation: 0 },
  tail: { x: 0, y: 0, scale: 1, rotation: 0 },
};

export type EyeCorrection = CreatureTransform & { spacingScale: number };

export type CreatureCategoryConfig = {
  tail: CreatureTransform;
  wings: CreatureTransform;
  earsHorns: CreatureTransform;
  eyes: EyeCorrection;
};

const DEFAULT_EYE_CORRECTION: EyeCorrection = { ...IDENTITY_TRANSFORM, spacingScale: 1 };

function defaultCategoryConfig(): CreatureCategoryConfig {
  return {
    tail: { ...IDENTITY_TRANSFORM },
    wings: { ...IDENTITY_TRANSFORM },
    earsHorns: { ...IDENTITY_TRANSFORM },
    eyes: { ...DEFAULT_EYE_CORRECTION },
  };
}

// Every category starts with an identity correction (i.e. "use the shared anchor as-is") --
// verified as a good starting point for Strong, Playful, and Visionary by visual composite
// review. The other 5 categories use the same shared system and are expected to need at most
// small per-category nudges, made live in the tool rather than guessed here.
export const DEFAULT_CREATURE_ASSET_CONFIG: Record<CreatureTestCategory, CreatureCategoryConfig> = {
  strong: defaultCategoryConfig(),
  sentimental: defaultCategoryConfig(),
  grounded: defaultCategoryConfig(),
  curious: defaultCategoryConfig(),
  playful: defaultCategoryConfig(),
  visionary: defaultCategoryConfig(),
  bold: defaultCategoryConfig(),
  harmonious: defaultCategoryConfig(),
};

// On startup, try to load a saved creature-config.json (written by a person after using this
// tool's "Save Calibration" download) and merge it over the defaults above. Absent file = use
// defaults; Metro's require of a possibly-missing JSON would throw, so this is guarded by
// requiring a file that's always present (a placeholder) and treating an empty object as "no
// saved overrides yet".
// eslint-disable-next-line @typescript-eslint/no-var-requires
let savedOverrides: Partial<Record<CreatureTestCategory, Partial<CreatureCategoryConfig>>> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  savedOverrides = require('../../../assets/creatures-test/creature-config.json');
} catch {
  savedOverrides = {};
}

function mergeTransform(base: CreatureTransform, override?: Partial<CreatureTransform>): CreatureTransform {
  return { ...base, ...(override ?? {}) };
}

export function buildInitialConfig(): Record<CreatureTestCategory, CreatureCategoryConfig> {
  const result = {} as Record<CreatureTestCategory, CreatureCategoryConfig>;
  for (const cat of Object.keys(DEFAULT_CREATURE_ASSET_CONFIG) as CreatureTestCategory[]) {
    const base = DEFAULT_CREATURE_ASSET_CONFIG[cat];
    const override = savedOverrides[cat];
    result[cat] = {
      tail: mergeTransform(base.tail, override?.tail),
      wings: mergeTransform(base.wings, override?.wings),
      earsHorns: mergeTransform(base.earsHorns, override?.earsHorns),
      eyes: { ...base.eyes, ...(override?.eyes ?? {}) },
    };
  }
  return result;
}

export function composeTransform(anchor: CreatureTransform, correction: CreatureTransform): CreatureTransform {
  return {
    x: anchor.x + correction.x,
    y: anchor.y + correction.y,
    scale: anchor.scale * correction.scale,
    rotation: anchor.rotation + correction.rotation,
  };
}
