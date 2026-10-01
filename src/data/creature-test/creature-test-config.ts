import type { CreatureTestCategory } from './creature-test-assets';

// Calibration data ONLY -- never baked into the source SVGs (assets/creatures-test/ is never
// written to by this file or by the Creature Lab tool at runtime).
//
// Transform model (v2 -- slot-primary, per Michelle's direction):
//   finalTransform = slotDefault[slot] + assetCorrection[category]?.[slot]  (correction optional, defaults to identity)
// The body slot has no default/correction split -- it is the single locked master rig, fixed
// identically for every category (never moved to accommodate other parts). Every non-body slot
// has ONE shared production transform (`SLOT_DEFAULTS`) that every category renders at unless
// that specific category has an explicit small correction on top (`AssetCorrections`, sparse --
// absent = identity = "use the slot default exactly"). This is what makes categories genuinely
// swappable into the same socket: switching category changes only which artwork renders, never
// where/how large it renders, unless that category has its own correction recorded.

export type CreatureTransform = { x: number; y: number; scale: number; rotation: number };

export const IDENTITY_TRANSFORM: CreatureTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

export type EyeTransform = CreatureTransform & { spacingScale: number };

export const IDENTITY_EYE_TRANSFORM: EyeTransform = { ...IDENTITY_TRANSFORM, spacingScale: 1 };

export type NonBodySlot = 'tail' | 'wings' | 'earsHorns' | 'eyes';

export type SlotDefaults = {
  tail: CreatureTransform;
  wings: CreatureTransform;
  earsHorns: CreatureTransform;
  eyes: EyeTransform;
};

// The single locked body rig. Every category's body renders at exactly this transform --
// never adjusted per category, never affected by slot-default/correction calibration.
export const BODY_RIG: CreatureTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

// --- Composition workspace -------------------------------------------------------------
// The body's own native art is authored on a 1254x1254 canvas -- that canvas is the fixed
// coordinate system every x/y/scale value above is measured in, and it must never change size
// or move. But dramatic ears/horns/wings/tails can extend beyond it, and the original 1254
// square left no room for that before clipping. The fix is NOT to shrink those assets to fit;
// it's to render everything inside a larger, purely-transparent composition canvas with the
// original 1254 body canvas centered inside it, unchanged. All x/y/scale/rotation values are
// still expressed in the ORIGINAL 1254-unit system -- BODY_CANVAS_INSET is the only new number,
// and it's a rendering/export concern, not a calibration one.
export const BODY_CANVAS_SIZE = 1254;
export const COMPOSITION_CANVAS_SIZE = 1700;
export const BODY_CANVAS_INSET = (COMPOSITION_CANVAS_SIZE - BODY_CANVAS_SIZE) / 2; // 223, centered

// --- Shared slot defaults (the primary calibration surface) -----------------------------
// tail/wings preserved EXACTLY as they were validated in the prior pass (tail: identity;
// wings: y+120, scale 1.4x -- both confirmed visually across Strong/Playful/Visionary). Eyes
// set to the value chosen visually in the live tool. earsHorns: the value calibrated live in
// the tool during this same session was never written to any file (Save Calibration downloads
// to the browser's Downloads folder; nothing was placed back into
// assets/creatures-test/creature-config.json), so it is NOT recoverable from disk -- rather
// than guess a replacement, this starts at identity and is flagged in the Lab UI as
// "needs recalibration" until someone sets it via SET AS SLOT DEFAULT.
export const INITIAL_SLOT_DEFAULTS: SlotDefaults = {
  tail: { ...IDENTITY_TRANSFORM },
  wings: { x: 0, y: 120, scale: 1.4, rotation: 0 },
  earsHorns: { ...IDENTITY_TRANSFORM }, // NOT RECOVERED -- see comment above; recalibrate and click "Set as Slot Default"
  eyes: { x: 40, y: -205, scale: 0.25, rotation: 0, spacingScale: 0.8 },
};

export type AssetCorrections = Partial<Record<CreatureTestCategory, Partial<SlotDefaults>>>;

export const EMPTY_ASSET_CORRECTIONS: AssetCorrections = {};

// --- Composition helpers -----------------------------------------------------------------

export function resolveTransform(base: CreatureTransform, correction?: Partial<CreatureTransform>): CreatureTransform {
  const c = { ...IDENTITY_TRANSFORM, ...(correction ?? {}) };
  return {
    x: base.x + c.x,
    y: base.y + c.y,
    scale: base.scale * c.scale,
    rotation: base.rotation + c.rotation,
  };
}

export function resolveEyeTransform(base: EyeTransform, correction?: Partial<EyeTransform>): EyeTransform {
  const resolved = resolveTransform(base, correction);
  const spacing = base.spacingScale * (correction?.spacingScale ?? 1);
  return { ...resolved, spacingScale: spacing };
}

export function getCorrection<S extends NonBodySlot>(
  corrections: AssetCorrections,
  category: CreatureTestCategory,
  slot: S,
): SlotDefaults[S] | undefined {
  return corrections[category]?.[slot] as SlotDefaults[S] | undefined;
}

export function setCorrection<S extends NonBodySlot>(
  corrections: AssetCorrections,
  category: CreatureTestCategory,
  slot: S,
  value: SlotDefaults[S],
): AssetCorrections {
  return {
    ...corrections,
    [category]: {
      ...corrections[category],
      [slot]: value,
    },
  };
}

export function clearCorrection(corrections: AssetCorrections, category: CreatureTestCategory, slot: NonBodySlot): AssetCorrections {
  const next = { ...corrections };
  if (next[category]) {
    const catNext = { ...next[category] };
    delete catNext[slot];
    next[category] = catNext;
  }
  return next;
}

// --- Load-on-startup: merge a saved creature-config.json (from "Save Calibration") over the
// coded defaults above. Absent file/fields = use defaults; Metro's require of a possibly-empty
// JSON is guarded by requiring a file that's always present (a committed placeholder) rather
// than a truly optional path, since Metro resolves requires statically at bundle time.
type SavedCalibration = { slotDefaults?: Partial<SlotDefaults>; assetCorrections?: AssetCorrections };

let saved: SavedCalibration = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  saved = require('../../../assets/creatures-test/creature-config.json');
} catch {
  saved = {};
}

export function buildInitialSlotDefaults(): SlotDefaults {
  const s = saved.slotDefaults ?? {};
  return {
    tail: { ...INITIAL_SLOT_DEFAULTS.tail, ...(s.tail ?? {}) },
    wings: { ...INITIAL_SLOT_DEFAULTS.wings, ...(s.wings ?? {}) },
    earsHorns: { ...INITIAL_SLOT_DEFAULTS.earsHorns, ...(s.earsHorns ?? {}) },
    eyes: { ...INITIAL_SLOT_DEFAULTS.eyes, ...(s.eyes ?? {}) },
  };
}

export function buildInitialAssetCorrections(): AssetCorrections {
  return saved.assetCorrections ?? {};
}
