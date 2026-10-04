import type { ImageSourcePropType } from 'react-native';

// Relic Lab (R&D ONLY -- see src/app/dev/relic-lab.tsx's own header). Asset registry mapping
// the 24 approved Relic traits / 8 color families / 8 effects to the REAL SVG files that exist
// today under assets/relics/{relic,color,effect}/ -- every entry below was verified against the
// actual filenames on disk (via `ls`), never guessed. This is a compositing/calibration tool
// only: no production Relic reveal logic, no scoring, no personality mapping lives here.

// --- Base Relics (24) --------------------------------------------------------------------
//
// One mismatch found during asset QA, reported rather than silently worked around: the trait
// spec calls for "Self-referencing -> Portrait", but the only unmapped file left (after the
// other 23 matched by object name) is `apparently_you_relic_mirror.svg` -- a Mirror, not a
// Portrait. Counts match exactly (24 files, 24 traits), and a mirror is the only asset left
// for the only trait left, so it's used here as that trait's Relic -- but it is labeled by its
// REAL name (Mirror) everywhere in this tool, not silently relabeled "Portrait", and flagged
// here for whoever reviews this so the filename can be corrected/renamed upstream if the
// mismatch is real rather than an intentional substitution.
export type RelicTraitKey =
  | 'accountability'
  | 'defensiveness'
  | 'reflective'
  | 'reactive'
  | 'selfSecure'
  | 'reassuranceSeeking'
  | 'boundaryHolding'
  | 'approvalSeeking'
  | 'vulnerable'
  | 'armored'
  | 'repairOriented'
  | 'punishing'
  | 'tactful'
  | 'blunt'
  | 'dutyFirst'
  | 'selfPreserving'
  | 'supportive'
  | 'challenging'
  | 'givesFreely'
  | 'keepsScore'
  | 'perspectiveTaking'
  | 'selfReferencing'
  | 'initiating'
  | 'responsive';

export type RelicTraitEntry = {
  key: RelicTraitKey;
  traitLabel: string;
  objectLabel: string;
  /** True when the real filename's object name does not match the expected object label
   * (see the module comment above) -- surfaced in the Lab UI so it's impossible to miss. */
  filenameMismatch?: string;
  source: ImageSourcePropType;
};

export const RELIC_TRAITS: RelicTraitEntry[] = [
  { key: 'accountability', traitLabel: 'Accountability', objectLabel: 'Seal', source: require('../../../assets/relics/relic/apparently_you_relic_seal.svg') },
  { key: 'defensiveness', traitLabel: 'Defensiveness', objectLabel: 'Shield', source: require('../../../assets/relics/relic/apparently_you_relic_shield.svg') },
  { key: 'reflective', traitLabel: 'Reflective', objectLabel: 'Hourglass', source: require('../../../assets/relics/relic/apparently_you_relic_hourglass.svg') },
  { key: 'reactive', traitLabel: 'Reactive', objectLabel: 'Matchbox', source: require('../../../assets/relics/relic/reactive_matchbox.svg') },
  { key: 'selfSecure', traitLabel: 'Self-secure', objectLabel: 'Anchor', source: require('../../../assets/relics/relic/apparently_you_relic_anchor.svg') },
  { key: 'reassuranceSeeking', traitLabel: 'Reassurance-seeking', objectLabel: 'Bell', source: require('../../../assets/relics/relic/apparently_you_relic_bell.svg') },
  { key: 'boundaryHolding', traitLabel: 'Boundary-holding', objectLabel: 'Gate', source: require('../../../assets/relics/relic/apparently_you_relic_gate.svg') },
  { key: 'approvalSeeking', traitLabel: 'Approval-seeking', objectLabel: 'Crown', source: require('../../../assets/relics/relic/apparently_you_relic_crown.svg') },
  { key: 'vulnerable', traitLabel: 'Vulnerable', objectLabel: 'Locket', source: require('../../../assets/relics/relic/vulnerable_locket.svg') },
  { key: 'armored', traitLabel: 'Armored', objectLabel: 'Gauntlet', source: require('../../../assets/relics/relic/apparently_you_relic_gauntlet.svg') },
  { key: 'repairOriented', traitLabel: 'Repair-oriented', objectLabel: 'Needle & Thread', source: require('../../../assets/relics/relic/repair_oriented_needle_and_thread.svg') },
  { key: 'punishing', traitLabel: 'Punishing', objectLabel: 'Thorn', source: require('../../../assets/relics/relic/punishing_thorn.svg') },
  { key: 'tactful', traitLabel: 'Tactful', objectLabel: 'Fan', source: require('../../../assets/relics/relic/tactful_fan.svg') },
  { key: 'blunt', traitLabel: 'Blunt', objectLabel: 'Blade', source: require('../../../assets/relics/relic/blunt_blade.svg') },
  { key: 'dutyFirst', traitLabel: 'Duty-first', objectLabel: 'Lantern', source: require('../../../assets/relics/relic/duty_first_lantern.svg') },
  { key: 'selfPreserving', traitLabel: 'Self-preserving', objectLabel: 'Chalice', source: require('../../../assets/relics/relic/self_preserving_chalice.svg') },
  { key: 'supportive', traitLabel: 'Supportive', objectLabel: 'Torch', source: require('../../../assets/relics/relic/supportive_torch.svg') },
  { key: 'challenging', traitLabel: 'Challenging', objectLabel: 'Hammer', source: require('../../../assets/relics/relic/challenging_hammer.svg') },
  { key: 'givesFreely', traitLabel: 'Gives freely', objectLabel: 'Fountain', source: require('../../../assets/relics/relic/apparently_you_relic_fountain.svg') },
  { key: 'keepsScore', traitLabel: 'Keeps score', objectLabel: 'Ledger', source: require('../../../assets/relics/relic/apparently_you_relic_ledger.svg') },
  { key: 'perspectiveTaking', traitLabel: 'Perspective-taking', objectLabel: 'Prism', source: require('../../../assets/relics/relic/apparently_you_relic_prism.svg') },
  {
    key: 'selfReferencing',
    traitLabel: 'Self-referencing',
    objectLabel: 'Portrait',
    filenameMismatch: 'Expected object "Portrait" -- actual asset is apparently_you_relic_mirror.svg (a Mirror).',
    source: require('../../../assets/relics/relic/apparently_you_relic_mirror.svg'),
  },
  { key: 'initiating', traitLabel: 'Initiating', objectLabel: 'Spark', source: require('../../../assets/relics/relic/apparently_you_relic_spark.svg') },
  { key: 'responsive', traitLabel: 'Responsive', objectLabel: 'Moon', source: require('../../../assets/relics/relic/apparently_you_relic_moon.svg') },
];

// --- Color families (8) -------------------------------------------------------------------

export type ColorFamilyKey =
  | 'protectionDefense'
  | 'recognitionSecurity'
  | 'reflectionPerspective'
  | 'repairConflict'
  | 'expressionDelivery'
  | 'careResponsibility'
  | 'standardsReciprocity'
  | 'initiationResponse';

export type ColorFamilyEntry = { key: ColorFamilyKey; label: string; source: ImageSourcePropType };

export const COLOR_FAMILIES: ColorFamilyEntry[] = [
  { key: 'protectionDefense', label: 'Protection / Defense', source: require('../../../assets/relics/color/apparently_you_relic_color_protection_defense.svg') },
  { key: 'recognitionSecurity', label: 'Recognition / Security', source: require('../../../assets/relics/color/apparently_you_relic_color_recognition_security.svg') },
  { key: 'reflectionPerspective', label: 'Reflection / Perspective', source: require('../../../assets/relics/color/apparently_you_relic_color_reflection_perspective.svg') },
  { key: 'repairConflict', label: 'Repair / Conflict', source: require('../../../assets/relics/color/apparently_you_relic_color_repair_conflict.svg') },
  { key: 'expressionDelivery', label: 'Expression / Delivery', source: require('../../../assets/relics/color/apparently_you_relic_color_expression_delivery.svg') },
  { key: 'careResponsibility', label: 'Care / Responsibility', source: require('../../../assets/relics/color/apparently_you_relic_color_care_responsibility.svg') },
  { key: 'standardsReciprocity', label: 'Standards / Reciprocity', source: require('../../../assets/relics/color/apparently_you_relic_color_standards_reciprocity.svg') },
  { key: 'initiationResponse', label: 'Initiation / Response', source: require('../../../assets/relics/color/apparently_you_relic_color_initiation_response.svg') },
];

// --- Effects (8) ---------------------------------------------------------------------------

export type EffectKey = 'halo' | 'sparkle' | 'ribbon' | 'mist' | 'prismGlint' | 'orbit' | 'ripple' | 'beamburst';

export type EffectEntry = { key: EffectKey; label: string; source: ImageSourcePropType };

export const EFFECTS: EffectEntry[] = [
  { key: 'halo', label: 'Halo', source: require('../../../assets/relics/effect/apparently_you_relic_effect_halo.svg') },
  { key: 'sparkle', label: 'Sparkle', source: require('../../../assets/relics/effect/apparently_you_relic_effect_sparkle.svg') },
  { key: 'ribbon', label: 'Ribbon', source: require('../../../assets/relics/effect/apparently_you_relic_effect_ribbon.svg') },
  { key: 'mist', label: 'Mist', source: require('../../../assets/relics/effect/apparently_you_relic_effect_mist.svg') },
  { key: 'prismGlint', label: 'Prism Glint', source: require('../../../assets/relics/effect/apparently_you_relic_effect_prism_glint.svg') },
  { key: 'orbit', label: 'Orbit', source: require('../../../assets/relics/effect/apparently_you_relic_effect_orbit.svg') },
  { key: 'ripple', label: 'Ripple', source: require('../../../assets/relics/effect/apparently_you_relic_effect_ripple.svg') },
  { key: 'beamburst', label: 'Beamburst', source: require('../../../assets/relics/effect/apparently_you_relic_effect_beamburst.svg') },
];

export const relicTraitByKey = (key: RelicTraitKey): RelicTraitEntry =>
  RELIC_TRAITS.find((entry) => entry.key === key) ?? RELIC_TRAITS[0];

export const colorFamilyByKey = (key: ColorFamilyKey): ColorFamilyEntry =>
  COLOR_FAMILIES.find((entry) => entry.key === key) ?? COLOR_FAMILIES[0];

export const effectByKey = (key: EffectKey): EffectEntry => EFFECTS.find((entry) => entry.key === key) ?? EFFECTS[0];
