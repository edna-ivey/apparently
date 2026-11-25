import type { RelicSlotAssignment } from '@/data/private-signals';

import { RELIC_TRAIT_META, type ColorFamilyKey, type EffectKey, type RelicTraitKey } from './relic-trait-meta';
import type { RelicTransform } from './relic-transform';

// Deliberately does NOT import relic-assets.ts -- that module's require()'d SVG sources only
// resolve inside a real Metro bundle, and this config must also be importable from a plain-Node
// validator script (scripts/validate-relic-production-mapping.ts). Only relic-trait-meta.ts's
// pure key/label data is needed for the mapping logic below.

// Production Relic calibration + identity resolution -- the ONE source of truth every consumer
// Relic surface must use (see src/components/relic/relic-renderer.tsx and relic-avatar.tsx).
// Static TypeScript, never localStorage, never anything under src/app/dev/ or src/data/
// relic-lab/ -- this module has zero dependency on the Relic Lab or any dev-only/browser-only
// API, so it is safe to import from any production surface, including native.

// =========================================================================================
// GLOBAL PRODUCTION CALIBRATION -- LOCKED, confirmed directly. Provenance: the Relic Lab
// "Save Calibration" export below was captured while visually testing Lantern + Initiation/
// Response + Beamburst, but the approved values are NOT specific to that combination -- they
// are the single shared calibration for EVERY Relic object, EVERY color overlay, and EVERY
// effect overlay. Do not create a per-combination calibration matrix. Do not treat
// dutyFirst|initiationResponse|beamburst as a special-cased override anywhere.
//
//   {
//     "dutyFirst|initiationResponse|beamburst": {
//       "relic": "dutyFirst", "color": "initiationResponse", "effect": "beamburst",
//       "base": { "x": 0, "y": 0, "scale": 1, "rotation": 0 },
//       "colorLayer": { "x": 0, "y": 0, "scale": 1, "rotation": 0, "opacity": 0.5 },
//       "effectLayer": { "x": 0, "y": 0, "scale": 1.25, "rotation": 0, "opacity": 0.7 },
//       "savedAt": "2026-10-04T18:34:21.026Z"
//     }
//   }
//
// Base opacity is explicitly 1 here even though the provenance JSON above never serialized a
// base-opacity property (the Relic Lab's base layer has always rendered at a fixed 100% --
// there was nothing to export). This locked spec is authoritative regardless.
// =========================================================================================

export const GLOBAL_BASE_TRANSFORM: RelicTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
export const GLOBAL_BASE_OPACITY = 1;

export const GLOBAL_COLOR_TRANSFORM: RelicTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
export const GLOBAL_COLOR_OPACITY = 0.5;

export const GLOBAL_EFFECT_TRANSFORM: RelicTransform = { x: 0, y: 0, scale: 1.25, rotation: 0 };
export const GLOBAL_EFFECT_OPACITY = 0.7;

// --- Approved per-asset corrections -------------------------------------------------------
// Sparse, on top of the GLOBAL calibration above -- empty until Michelle explicitly approves a
// specific asset's correction. Never populated speculatively; see relic-renderer.tsx's own
// comment for how this composes with the global values.
export const APPROVED_BASE_CORRECTIONS: Partial<Record<RelicTraitKey, Partial<RelicTransform>>> = {};
export const APPROVED_COLOR_CORRECTIONS: Partial<Record<ColorFamilyKey, Partial<RelicTransform & { opacity: number }>>> = {};
export const APPROVED_EFFECT_CORRECTIONS: Partial<Record<EffectKey, Partial<RelicTransform & { opacity: number }>>> = {};

// =========================================================================================
// LOCKED: Private trait pole -> Relic family (confirmed directly). Keyed by the pole's exact
// display label (personality.ts's positiveLabel/negativeLabel strings) -- the same join key
// RELIC_TRAITS in relic-assets.ts already uses for the base-object mapping, so one ranked
// PrivateSignalTrait.label resolves consistently across all three Relic layers.
// =========================================================================================
const TRAIT_LABEL_TO_FAMILY: Record<string, ColorFamilyKey> = {
  // PROTECTION / DEFENSE
  Defensiveness: 'protectionDefense',
  Armored: 'protectionDefense',
  'Boundary-holding': 'protectionDefense',
  'Self-preserving': 'protectionDefense',
  // RECOGNITION / SECURITY
  'Approval-seeking': 'recognitionSecurity',
  'Reassurance-seeking': 'recognitionSecurity',
  'Self-secure': 'recognitionSecurity',
  // REFLECTION / PERSPECTIVE
  Reflective: 'reflectionPerspective',
  'Perspective-taking': 'reflectionPerspective',
  'Self-referencing': 'reflectionPerspective',
  // REPAIR / CONFLICT
  Accountability: 'repairConflict',
  'Repair-oriented': 'repairConflict',
  Punishing: 'repairConflict',
  // EXPRESSION / DELIVERY
  Tactful: 'expressionDelivery',
  Blunt: 'expressionDelivery',
  Reactive: 'expressionDelivery',
  // CARE / RESPONSIBILITY
  'Duty-first': 'careResponsibility',
  Supportive: 'careResponsibility',
  'Gives freely': 'careResponsibility',
  // STANDARDS / RECIPROCITY
  'Keeps score': 'standardsReciprocity',
  Challenging: 'standardsReciprocity',
  // INITIATION / RESPONSE
  Initiating: 'initiationResponse',
  Responsive: 'initiationResponse',
  Vulnerable: 'initiationResponse',
};

// LOCKED: Relic family -> effect (confirmed directly). Deterministic, one effect per family --
// never random, never derived from a quiz result title, never per-quiz.
const FAMILY_TO_EFFECT: Record<ColorFamilyKey, EffectKey> = {
  protectionDefense: 'prismGlint',
  recognitionSecurity: 'sparkle',
  reflectionPerspective: 'orbit',
  repairConflict: 'mist',
  expressionDelivery: 'beamburst',
  careResponsibility: 'ribbon',
  standardsReciprocity: 'ripple',
  initiationResponse: 'halo',
};

export function familyForTraitLabel(traitLabel: string): ColorFamilyKey | null {
  return TRAIT_LABEL_TO_FAMILY[traitLabel] ?? null;
}

export function effectForFamily(family: ColorFamilyKey): EffectKey {
  return FAMILY_TO_EFFECT[family];
}

// =========================================================================================
// Private -> Relic identity resolution. Takes the already-ranked RelicSlotAssignment
// (src/data/private-signals.ts's selectRelicSlots -- rank #1/#2/#3 of real, QUALIFIED Private
// signals only) and resolves it to real Relic asset keys. Returns null for any slot that isn't
// qualified yet -- never invents a trait to complete the Relic. A fully-resolved identity
// (all three non-null) is what the Bible's "Relic Reveal" rule requires before showing the
// real Relic instead of the locked silhouette.
// =========================================================================================

export type ResolvedRelicIdentity = {
  base: RelicTraitKey | null;
  color: ColorFamilyKey | null;
  effect: EffectKey | null;
};

export function resolveRelicIdentity(slots: RelicSlotAssignment): ResolvedRelicIdentity {
  const colorFamily = slots.colorTrait ? familyForTraitLabel(slots.colorTrait.label) : null;
  const effectFamily = slots.effectTrait ? familyForTraitLabel(slots.effectTrait.label) : null;
  return {
    base: slots.relicTrait ? relicTraitKeyForLabel(slots.relicTrait.label) : null,
    color: colorFamily,
    effect: effectFamily ? effectForFamily(effectFamily) : null,
  };
}

// Built once from relic-trait-meta.ts's own RELIC_TRAIT_META list (traitLabel -> key), rather
// than a second hand-typed table that could drift from the real registry.
const RELIC_TRAIT_LABEL_INDEX: Record<string, RelicTraitKey> = Object.fromEntries(
  RELIC_TRAIT_META.map((entry) => [entry.traitLabel, entry.key]),
);

function relicTraitKeyForLabel(traitLabel: string): RelicTraitKey | null {
  return RELIC_TRAIT_LABEL_INDEX[traitLabel] ?? null;
}
