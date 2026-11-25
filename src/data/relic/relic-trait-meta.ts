// Pure Relic identity metadata -- keys and labels ONLY, no asset `require()` calls, no React
// Native import. Exists so logic that only needs to resolve labels/keys (the production
// trait->family->effect mapping in relic-production-config.ts, and its pure-Node validator)
// never has to pull in relic-assets.ts's require()'d SVG sources, which only resolve inside a
// Metro bundle. relic-assets.ts builds its full (key + labels + source) entries FROM this file,
// so this remains the single place the key/label data is authored.

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

export type RelicTraitMeta = { key: RelicTraitKey; traitLabel: string; objectLabel: string };

// "Self-referencing -> Mirror" is the approved mapping (confirmed directly -- do not change
// back to "Portrait"); the underlying asset filename already matched "Mirror".
export const RELIC_TRAIT_META: RelicTraitMeta[] = [
  { key: 'accountability', traitLabel: 'Accountability', objectLabel: 'Seal' },
  { key: 'defensiveness', traitLabel: 'Defensiveness', objectLabel: 'Shield' },
  { key: 'reflective', traitLabel: 'Reflective', objectLabel: 'Hourglass' },
  { key: 'reactive', traitLabel: 'Reactive', objectLabel: 'Matchbox' },
  { key: 'selfSecure', traitLabel: 'Self-secure', objectLabel: 'Anchor' },
  { key: 'reassuranceSeeking', traitLabel: 'Reassurance-seeking', objectLabel: 'Bell' },
  { key: 'boundaryHolding', traitLabel: 'Boundary-holding', objectLabel: 'Gate' },
  { key: 'approvalSeeking', traitLabel: 'Approval-seeking', objectLabel: 'Crown' },
  { key: 'vulnerable', traitLabel: 'Vulnerable', objectLabel: 'Locket' },
  { key: 'armored', traitLabel: 'Armored', objectLabel: 'Gauntlet' },
  { key: 'repairOriented', traitLabel: 'Repair-oriented', objectLabel: 'Needle & Thread' },
  { key: 'punishing', traitLabel: 'Punishing', objectLabel: 'Thorn' },
  { key: 'tactful', traitLabel: 'Tactful', objectLabel: 'Fan' },
  { key: 'blunt', traitLabel: 'Blunt', objectLabel: 'Blade' },
  { key: 'dutyFirst', traitLabel: 'Duty-first', objectLabel: 'Lantern' },
  { key: 'selfPreserving', traitLabel: 'Self-preserving', objectLabel: 'Chalice' },
  { key: 'supportive', traitLabel: 'Supportive', objectLabel: 'Torch' },
  { key: 'challenging', traitLabel: 'Challenging', objectLabel: 'Hammer' },
  { key: 'givesFreely', traitLabel: 'Gives freely', objectLabel: 'Fountain' },
  { key: 'keepsScore', traitLabel: 'Keeps score', objectLabel: 'Ledger' },
  { key: 'perspectiveTaking', traitLabel: 'Perspective-taking', objectLabel: 'Prism' },
  { key: 'selfReferencing', traitLabel: 'Self-referencing', objectLabel: 'Mirror' },
  { key: 'initiating', traitLabel: 'Initiating', objectLabel: 'Spark' },
  { key: 'responsive', traitLabel: 'Responsive', objectLabel: 'Moon' },
];

export type ColorFamilyKey =
  | 'protectionDefense'
  | 'recognitionSecurity'
  | 'reflectionPerspective'
  | 'repairConflict'
  | 'expressionDelivery'
  | 'careResponsibility'
  | 'standardsReciprocity'
  | 'initiationResponse';

export type ColorFamilyMeta = { key: ColorFamilyKey; label: string };

export const COLOR_FAMILY_META: ColorFamilyMeta[] = [
  { key: 'protectionDefense', label: 'Protection / Defense' },
  { key: 'recognitionSecurity', label: 'Recognition / Security' },
  { key: 'reflectionPerspective', label: 'Reflection / Perspective' },
  { key: 'repairConflict', label: 'Repair / Conflict' },
  { key: 'expressionDelivery', label: 'Expression / Delivery' },
  { key: 'careResponsibility', label: 'Care / Responsibility' },
  { key: 'standardsReciprocity', label: 'Standards / Reciprocity' },
  { key: 'initiationResponse', label: 'Initiation / Response' },
];

export type EffectKey = 'halo' | 'sparkle' | 'ribbon' | 'mist' | 'prismGlint' | 'orbit' | 'ripple' | 'beamburst';

export type EffectMeta = { key: EffectKey; label: string };

export const EFFECT_META: EffectMeta[] = [
  { key: 'halo', label: 'Halo' },
  { key: 'sparkle', label: 'Sparkle' },
  { key: 'ribbon', label: 'Ribbon' },
  { key: 'mist', label: 'Mist' },
  { key: 'prismGlint', label: 'Prism Glint' },
  { key: 'orbit', label: 'Orbit' },
  { key: 'ripple', label: 'Ripple' },
  { key: 'beamburst', label: 'Beamburst' },
];
