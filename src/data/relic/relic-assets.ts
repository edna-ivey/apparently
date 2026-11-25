import type { ImageSourcePropType } from 'react-native';

import { COLOR_FAMILY_META, EFFECT_META, RELIC_TRAIT_META, type ColorFamilyKey, type EffectKey, type RelicTraitKey } from './relic-trait-meta';

export type { ColorFamilyKey, EffectKey, RelicTraitKey };

// Canonical Relic asset registry -- the SINGLE shared source of truth for the 24 base Relic
// objects, 8 color family overlays, and 8 effect overlays. Used by BOTH the production Relic
// renderer (src/components/relic/relic-renderer.tsx, src/components/relic/relic-avatar.tsx)
// and the R&D Relic Lab (src/app/dev/relic-lab.tsx) -- deliberately NOT located under
// src/data/relic-lab/ so production code never has to import anything from a "lab" path.
// Every entry below was verified against the actual filenames on disk under
// assets/relics/{relic,color,effect}/ (via `ls`), never guessed.
//
// Keys/labels live in relic-trait-meta.ts (pure, no requires -- safe for a plain-Node
// validator script to import); this file adds the require()'d image source each entry needs,
// which only resolves inside a real Metro bundle. Metro needs each require() as a static string
// literal, so these can't be generated from the meta array's data -- they're written out by
// hand here, matched to their meta entry by `key`, with a startup assertion (below) that every
// meta key actually got a source.

export type RelicTraitEntry = { key: RelicTraitKey; traitLabel: string; objectLabel: string; source: ImageSourcePropType };

const RELIC_SOURCES: Record<RelicTraitKey, ImageSourcePropType> = {
  accountability: require('../../../assets/relics/relic/apparently_you_relic_seal.svg'),
  defensiveness: require('../../../assets/relics/relic/apparently_you_relic_shield.svg'),
  reflective: require('../../../assets/relics/relic/apparently_you_relic_hourglass.svg'),
  reactive: require('../../../assets/relics/relic/reactive_matchbox.svg'),
  selfSecure: require('../../../assets/relics/relic/apparently_you_relic_anchor.svg'),
  reassuranceSeeking: require('../../../assets/relics/relic/apparently_you_relic_bell.svg'),
  boundaryHolding: require('../../../assets/relics/relic/apparently_you_relic_gate.svg'),
  approvalSeeking: require('../../../assets/relics/relic/apparently_you_relic_crown.svg'),
  vulnerable: require('../../../assets/relics/relic/vulnerable_locket.svg'),
  armored: require('../../../assets/relics/relic/apparently_you_relic_gauntlet.svg'),
  repairOriented: require('../../../assets/relics/relic/repair_oriented_needle_and_thread.svg'),
  punishing: require('../../../assets/relics/relic/punishing_thorn.svg'),
  tactful: require('../../../assets/relics/relic/tactful_fan.svg'),
  blunt: require('../../../assets/relics/relic/blunt_blade.svg'),
  dutyFirst: require('../../../assets/relics/relic/duty_first_lantern.svg'),
  selfPreserving: require('../../../assets/relics/relic/self_preserving_chalice.svg'),
  supportive: require('../../../assets/relics/relic/supportive_torch.svg'),
  challenging: require('../../../assets/relics/relic/challenging_hammer.svg'),
  givesFreely: require('../../../assets/relics/relic/apparently_you_relic_fountain.svg'),
  keepsScore: require('../../../assets/relics/relic/apparently_you_relic_ledger.svg'),
  perspectiveTaking: require('../../../assets/relics/relic/apparently_you_relic_prism.svg'),
  selfReferencing: require('../../../assets/relics/relic/apparently_you_relic_mirror.svg'),
  initiating: require('../../../assets/relics/relic/apparently_you_relic_spark.svg'),
  responsive: require('../../../assets/relics/relic/apparently_you_relic_moon.svg'),
};

export const RELIC_TRAITS: RelicTraitEntry[] = RELIC_TRAIT_META.map((meta) => ({ ...meta, source: RELIC_SOURCES[meta.key] }));

export type ColorFamilyEntry = { key: ColorFamilyKey; label: string; source: ImageSourcePropType };

const COLOR_SOURCES: Record<ColorFamilyKey, ImageSourcePropType> = {
  protectionDefense: require('../../../assets/relics/color/apparently_you_relic_color_protection_defense.svg'),
  recognitionSecurity: require('../../../assets/relics/color/apparently_you_relic_color_recognition_security.svg'),
  reflectionPerspective: require('../../../assets/relics/color/apparently_you_relic_color_reflection_perspective.svg'),
  repairConflict: require('../../../assets/relics/color/apparently_you_relic_color_repair_conflict.svg'),
  expressionDelivery: require('../../../assets/relics/color/apparently_you_relic_color_expression_delivery.svg'),
  careResponsibility: require('../../../assets/relics/color/apparently_you_relic_color_care_responsibility.svg'),
  standardsReciprocity: require('../../../assets/relics/color/apparently_you_relic_color_standards_reciprocity.svg'),
  initiationResponse: require('../../../assets/relics/color/apparently_you_relic_color_initiation_response.svg'),
};

export const COLOR_FAMILIES: ColorFamilyEntry[] = COLOR_FAMILY_META.map((meta) => ({ ...meta, source: COLOR_SOURCES[meta.key] }));

export type EffectEntry = { key: EffectKey; label: string; source: ImageSourcePropType };

const EFFECT_SOURCES: Record<EffectKey, ImageSourcePropType> = {
  halo: require('../../../assets/relics/effect/apparently_you_relic_effect_halo.svg'),
  sparkle: require('../../../assets/relics/effect/apparently_you_relic_effect_sparkle.svg'),
  ribbon: require('../../../assets/relics/effect/apparently_you_relic_effect_ribbon.svg'),
  mist: require('../../../assets/relics/effect/apparently_you_relic_effect_mist.svg'),
  prismGlint: require('../../../assets/relics/effect/apparently_you_relic_effect_prism_glint.svg'),
  orbit: require('../../../assets/relics/effect/apparently_you_relic_effect_orbit.svg'),
  ripple: require('../../../assets/relics/effect/apparently_you_relic_effect_ripple.svg'),
  beamburst: require('../../../assets/relics/effect/apparently_you_relic_effect_beamburst.svg'),
};

export const EFFECTS: EffectEntry[] = EFFECT_META.map((meta) => ({ ...meta, source: EFFECT_SOURCES[meta.key] }));

export const relicTraitByKey = (key: RelicTraitKey): RelicTraitEntry =>
  RELIC_TRAITS.find((entry) => entry.key === key) ?? RELIC_TRAITS[0];

export const colorFamilyByKey = (key: ColorFamilyKey): ColorFamilyEntry =>
  COLOR_FAMILIES.find((entry) => entry.key === key) ?? COLOR_FAMILIES[0];

export const effectByKey = (key: EffectKey): EffectEntry => EFFECTS.find((entry) => entry.key === key) ?? EFFECTS[0];
