// Validates the Relic production mapping/calibration consolidation: src/data/relic/
// relic-production-config.ts, relic-assets.ts, relic-transform.ts. Pure logic, no React
// Native/Supabase dependency -- run with `npx tsx scripts/validate-relic-production-mapping.ts`.

import {
  effectForFamily,
  familyForTraitLabel,
  resolveRelicIdentity,
  GLOBAL_BASE_OPACITY,
  GLOBAL_BASE_TRANSFORM,
  GLOBAL_COLOR_OPACITY,
  GLOBAL_COLOR_TRANSFORM,
  GLOBAL_EFFECT_OPACITY,
  GLOBAL_EFFECT_TRANSFORM,
  APPROVED_BASE_CORRECTIONS,
  APPROVED_COLOR_CORRECTIONS,
  APPROVED_EFFECT_CORRECTIONS,
} from '../src/data/relic/relic-production-config';
import { RELIC_TRAIT_META, COLOR_FAMILY_META, EFFECT_META, type RelicTraitKey, type ColorFamilyKey, type EffectKey } from '../src/data/relic/relic-trait-meta';
import { resolveTransform, resolveOpacity } from '../src/data/relic/relic-transform';
import type { PrivateSignalTrait } from '../src/data/private-signals';

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
}

// --- 1. Locked base-relic mapping: all 24 trait labels resolve to the exact approved object --
const EXPECTED_BASE: Record<string, string> = {
  Accountability: 'Seal',
  Defensiveness: 'Shield',
  Reflective: 'Hourglass',
  Reactive: 'Matchbox',
  'Self-secure': 'Anchor',
  'Reassurance-seeking': 'Bell',
  'Boundary-holding': 'Gate',
  'Approval-seeking': 'Crown',
  Vulnerable: 'Locket',
  Armored: 'Gauntlet',
  'Repair-oriented': 'Needle & Thread',
  Punishing: 'Thorn',
  Tactful: 'Fan',
  Blunt: 'Blade',
  'Duty-first': 'Lantern',
  'Self-preserving': 'Chalice',
  Supportive: 'Torch',
  Challenging: 'Hammer',
  'Gives freely': 'Fountain',
  'Keeps score': 'Ledger',
  'Perspective-taking': 'Prism',
  'Self-referencing': 'Mirror',
  Initiating: 'Spark',
  Responsive: 'Moon',
};
assert(Object.keys(EXPECTED_BASE).length === 24, 'expected-base fixture covers exactly 24 traits');
assert(RELIC_TRAIT_META.length === 24, 'RELIC_TRAIT_META has exactly 24 entries');

function fakeSignal(label: string): PrivateSignalTrait {
  return { dimension: 'accountability_defensiveness', label, strengthLabel: 'Strong signal', signatureStrength: 1, evidenceCount: 3 };
}

for (const [label, expectedObject] of Object.entries(EXPECTED_BASE)) {
  const identity = resolveRelicIdentity({ relicTrait: fakeSignal(label), colorTrait: null, effectTrait: null });
  const entry = identity.base ? RELIC_TRAIT_META.find((e) => e.key === identity.base) : undefined;
  assert(entry?.objectLabel === expectedObject, `base relic for "${label}" resolves to ${expectedObject} (got ${entry?.objectLabel ?? 'null'})`);
}

// Explicitly re-confirm the Mirror/Portrait decision.
const mirrorIdentity = resolveRelicIdentity({ relicTrait: fakeSignal('Self-referencing'), colorTrait: null, effectTrait: null });
const mirrorEntry = RELIC_TRAIT_META.find((e) => e.key === mirrorIdentity.base);
assert(mirrorEntry?.objectLabel === 'Mirror', 'Self-referencing -> Mirror (NOT Portrait) -- approved label used');

// --- 2. Locked trait -> family mapping: exactly the 24 traits given, no extras, no gaps -------
const EXPECTED_FAMILY: Record<string, ColorFamilyKey> = {
  Defensiveness: 'protectionDefense',
  Armored: 'protectionDefense',
  'Boundary-holding': 'protectionDefense',
  'Self-preserving': 'protectionDefense',
  'Approval-seeking': 'recognitionSecurity',
  'Reassurance-seeking': 'recognitionSecurity',
  'Self-secure': 'recognitionSecurity',
  Reflective: 'reflectionPerspective',
  'Perspective-taking': 'reflectionPerspective',
  'Self-referencing': 'reflectionPerspective',
  Accountability: 'repairConflict',
  'Repair-oriented': 'repairConflict',
  Punishing: 'repairConflict',
  Tactful: 'expressionDelivery',
  Blunt: 'expressionDelivery',
  Reactive: 'expressionDelivery',
  'Duty-first': 'careResponsibility',
  Supportive: 'careResponsibility',
  'Gives freely': 'careResponsibility',
  'Keeps score': 'standardsReciprocity',
  Challenging: 'standardsReciprocity',
  Initiating: 'initiationResponse',
  Responsive: 'initiationResponse',
  Vulnerable: 'initiationResponse',
};
assert(Object.keys(EXPECTED_FAMILY).length === 24, 'expected-family fixture covers exactly 24 traits');

for (const [label, expectedFamily] of Object.entries(EXPECTED_FAMILY)) {
  const actual = familyForTraitLabel(label);
  assert(actual === expectedFamily, `family for "${label}" is ${expectedFamily} (got ${actual})`);
}

// Every RELIC_TRAIT_META traitLabel must have a family -- no trait silently falls through to null.
for (const entry of RELIC_TRAIT_META) {
  assert(familyForTraitLabel(entry.traitLabel) !== null, `"${entry.traitLabel}" (base object ${entry.objectLabel}) has a family mapping`);
}

// --- 3. Locked family -> effect mapping: exactly 8 families, 8 distinct effects, no reuse -----
const EXPECTED_FAMILY_EFFECT: Record<ColorFamilyKey, EffectKey> = {
  protectionDefense: 'prismGlint',
  recognitionSecurity: 'sparkle',
  reflectionPerspective: 'orbit',
  repairConflict: 'mist',
  expressionDelivery: 'beamburst',
  careResponsibility: 'ribbon',
  standardsReciprocity: 'ripple',
  initiationResponse: 'halo',
};
assert(COLOR_FAMILY_META.length === 8, 'COLOR_FAMILY_META has exactly 8 entries');
assert(EFFECT_META.length === 8, 'EFFECT_META has exactly 8 entries');

for (const [family, expectedEffect] of Object.entries(EXPECTED_FAMILY_EFFECT) as [ColorFamilyKey, EffectKey][]) {
  assert(effectForFamily(family) === expectedEffect, `effect for family "${family}" is ${expectedEffect} (got ${effectForFamily(family)})`);
}
const usedEffects = new Set(Object.values(EXPECTED_FAMILY_EFFECT));
assert(usedEffects.size === 8, 'all 8 effects are used exactly once across the 8 families (no reuse, no gap)');

// --- 4. Full rank#1/#2/#3 resolution (the real production call shape) -------------------------
const fullIdentity = resolveRelicIdentity({
  relicTrait: fakeSignal('Defensiveness'),
  colorTrait: fakeSignal('Reflective'),
  effectTrait: fakeSignal('Keeps score'),
});
assert(fullIdentity.base === 'defensiveness', 'rank#1 Defensiveness -> base key "defensiveness"');
assert(fullIdentity.color === 'reflectionPerspective', 'rank#2 Reflective -> family "reflectionPerspective"');
assert(fullIdentity.effect === 'ripple', 'rank#3 Keeps score -> family standardsReciprocity -> effect "ripple"');

// Reference QA combinations named in the brief -- sanity-check the family/effect pairing is
// internally consistent (NOT asserting these are a real user's rank#1/2/3, just that if a user's
// rank#2/#3 happened to land in these families, the effect comes out right).
assert(effectForFamily('reflectionPerspective') === 'orbit', 'Reflection/Perspective -> Orbit');
assert(effectForFamily('recognitionSecurity') === 'sparkle', 'Recognition/Security -> Sparkle');
assert(effectForFamily('repairConflict') === 'mist', 'Repair/Conflict -> Mist');
assert(effectForFamily('initiationResponse') === 'halo', 'Initiation/Response -> Halo');
assert(effectForFamily('careResponsibility') === 'ribbon', 'Care/Responsibility -> Ribbon');
assert(effectForFamily('expressionDelivery') === 'beamburst', 'Expression/Delivery -> Beamburst');
assert(effectForFamily('protectionDefense') === 'prismGlint', 'a Protection/Defense third-rank trait -> Prism Glint');
assert(effectForFamily('standardsReciprocity') === 'ripple', 'a Standards/Reciprocity third-rank trait -> Ripple');

// --- 5. Insufficient qualification -> locked identity, never invented ------------------------
const partial = resolveRelicIdentity({ relicTrait: fakeSignal('Blunt'), colorTrait: null, effectTrait: null });
assert(partial.base !== null && partial.color === null && partial.effect === null, 'rank#1 only -> base resolves, color/effect stay null (never invented)');
const none = resolveRelicIdentity({ relicTrait: null, colorTrait: null, effectTrait: null });
assert(none.base === null && none.color === null && none.effect === null, 'no qualifying ranks -> fully null identity');

// --- 6. LOCKED global production calibration ---------------------------------------------------
assert(
  GLOBAL_BASE_TRANSFORM.x === 0 && GLOBAL_BASE_TRANSFORM.y === 0 && GLOBAL_BASE_TRANSFORM.scale === 1 && GLOBAL_BASE_TRANSFORM.rotation === 0,
  'GLOBAL base transform is x0/y0/scale1/rotation0',
);
assert(GLOBAL_BASE_OPACITY === 1, 'GLOBAL base opacity is 1 (explicitly represented, not inferred)');
assert(
  GLOBAL_COLOR_TRANSFORM.x === 0 && GLOBAL_COLOR_TRANSFORM.y === 0 && GLOBAL_COLOR_TRANSFORM.scale === 1 && GLOBAL_COLOR_TRANSFORM.rotation === 0,
  'GLOBAL color transform is x0/y0/scale1/rotation0',
);
assert(GLOBAL_COLOR_OPACITY === 0.5, 'GLOBAL color opacity is 0.5');
assert(
  GLOBAL_EFFECT_TRANSFORM.x === 0 && GLOBAL_EFFECT_TRANSFORM.y === 0 && GLOBAL_EFFECT_TRANSFORM.scale === 1.25 && GLOBAL_EFFECT_TRANSFORM.rotation === 0,
  'GLOBAL effect transform is x0/y0/scale1.25/rotation0',
);
assert(GLOBAL_EFFECT_OPACITY === 0.7, 'GLOBAL effect opacity is 0.7');

// --- 7. No per-combination override: dutyFirst|initiationResponse|beamburst gets the SAME
//        resolved calibration as every other combination, and no approved correction exists
//        for it or for anything else (corrections are empty until Michelle approves one). -----
assert(Object.keys(APPROVED_BASE_CORRECTIONS).length === 0, 'no approved base corrections exist (none invented)');
assert(Object.keys(APPROVED_COLOR_CORRECTIONS).length === 0, 'no approved color corrections exist (none invented)');
assert(Object.keys(APPROVED_EFFECT_CORRECTIONS).length === 0, 'no approved effect corrections exist (none invented)');

const dutyFirstResolved = resolveTransform(GLOBAL_BASE_TRANSFORM, APPROVED_BASE_CORRECTIONS['dutyFirst' as RelicTraitKey]);
const shieldResolved = resolveTransform(GLOBAL_BASE_TRANSFORM, APPROVED_BASE_CORRECTIONS['defensiveness' as RelicTraitKey]);
assert(JSON.stringify(dutyFirstResolved) === JSON.stringify(shieldResolved), 'dutyFirst and defensiveness (Shield) resolve to IDENTICAL calibration -- no special override');

const beamburstOpacity = resolveOpacity(GLOBAL_EFFECT_OPACITY, APPROVED_EFFECT_CORRECTIONS['beamburst' as EffectKey]?.opacity);
const haloOpacity = resolveOpacity(GLOBAL_EFFECT_OPACITY, APPROVED_EFFECT_CORRECTIONS['halo' as EffectKey]?.opacity);
assert(beamburstOpacity === 0.7 && beamburstOpacity === haloOpacity, 'beamburst effect opacity (0.7) is identical to every other effect -- no dutyFirst|initiationResponse|beamburst override');

// --- 8. All 24 base x 8 color x 8 effect combinations resolve without throwing (no missing
//        asset lookups) -- proves there is no 24x8x8 special-case matrix silently required. ----
let combosCrashed = 0;
for (const base of RELIC_TRAIT_META) {
  for (const color of COLOR_FAMILY_META) {
    for (const effect of EFFECT_META) {
      try {
        resolveTransform(GLOBAL_BASE_TRANSFORM, APPROVED_BASE_CORRECTIONS[base.key]);
        resolveTransform(GLOBAL_COLOR_TRANSFORM, APPROVED_COLOR_CORRECTIONS[color.key]);
        resolveTransform(GLOBAL_EFFECT_TRANSFORM, APPROVED_EFFECT_CORRECTIONS[effect.key]);
      } catch {
        combosCrashed++;
      }
    }
  }
}
assert(combosCrashed === 0, `all ${RELIC_TRAIT_META.length * COLOR_FAMILY_META.length * EFFECT_META.length} base x color x effect combinations resolve calibration without error`);

console.log(failures === 0 ? '\nALL RELIC PRODUCTION MAPPING CHECKS PASSED.' : `\n${failures} CHECK(S) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
