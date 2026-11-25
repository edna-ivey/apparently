// Build 12 Relic Read combination tests — validates the deterministic synthesis engine
// (relic-read-synthesis.ts) genuinely produces combination-aware content, not rank-#1-only
// content with rank-#2/#3 appended. Five required proofs (see the approved Build 12 spec):
//   1. Same Base, different Color/Effect -> meaningfully different Read/Gift/Shade/Cost/TryThis
//   2. Different Bases, similar secondary signals -> still sound different
//   3. No combination produces contradictory advice
//   4. No combination repeats essentially the same sentence across multiple sections
//   5. Every one of the 24 traits safely works as Base, Color-source, and Effect-source
//
// Run with: npx tsx scripts/validate-relic-read-combinations.ts
//
// selfSecure (Anchor) is a special case throughout this file: it is the one trait with a
// LOCKED Read override (see relic-locked-reads.ts/ANCHOR_LOCKED_READ_V4) -- its Gift/Shade/
// Cost/Try This are null by design (the approved copy was authored as one atomic headline +
// body, not the combination-aware shape every other trait uses), and its Read/Base label never
// changes regardless of Color/Effect. Every assertion below that loops over "every trait" or
// asserts combination-awareness explicitly excludes or special-cases selfSecure for this
// reason -- see section 6 for selfSecure's own dedicated proof.
import { synthesizeRelicRead } from '../src/data/relic/relic-read-synthesis';
import { TRAIT_VOICE } from '../src/data/relic/relic-read-content';
import { ANCHOR_LOCKED_READ_V4 } from '../src/data/relic/relic-locked-reads';
import type { PrivateSignalTrait } from '../src/data/private-signals';
import type { RelicTraitKey } from '../src/data/relic/relic-trait-meta';

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};
const pass = (message: string) => console.log(`OK: ${message}`);

const ALL_KEYS = Object.keys(TRAIT_VOICE) as RelicTraitKey[];

function sig(key: RelicTraitKey): PrivateSignalTrait {
  const voice = TRAIT_VOICE[key];
  return { dimension: 'self_secure_reassurance' as any, label: voice.label, strengthLabel: '', signatureStrength: 0.2, evidenceCount: 2 };
}

function read(base: RelicTraitKey, color: RelicTraitKey | null, effect: RelicTraitKey | null) {
  const result = synthesizeRelicRead({
    relicTrait: sig(base),
    colorTrait: color ? sig(color) : null,
    effectTrait: effect ? sig(effect) : null,
  });
  if (!result) throw new Error(`synthesizeRelicRead returned null for base=${base}`);
  return result;
}

// ============================================================================================
// 1. SAME BASE, DIFFERENT COLOR/EFFECT -> materially different downstream sections
// ============================================================================================
console.log('\n--- 1. Same Base, different Color/Effect ---');
{
  // selfSecure (Anchor) is the locked exception: Michelle's real combination and the approved
  // counter-example MUST produce the identical locked Read regardless of Color/Effect -- see
  // section 6 for the full proof; this just confirms section 1's own combination-awareness
  // claim doesn't accidentally apply to the one trait that's intentionally exempt from it.
  const a = read('selfSecure', 'challenging', 'tactful'); // Michelle's real combination
  const b = read('selfSecure', 'supportive', 'reactive'); // the approved counter-example
  if (a.theRead.join(' ') !== b.theRead.join(' ') || a.theGift !== null || b.theGift !== null) {
    fail('selfSecure (Anchor, locked) unexpectedly varied by Color/Effect, or populated a Gift/Shade/Cost/TryThis field it should leave null.');
  } else {
    pass('selfSecure (Anchor, locked) correctly ignores Color/Effect and leaves Gift/Shade/Cost/TryThis null.');
  }

  // A second same-Base pair, using a NON-locked trait, to confirm genuine combination-awareness
  // still holds for every other trait.
  const c = read('blunt', 'armored', 'initiating');
  const d = read('blunt', 'supportive', 'perspectiveTaking');
  const fields: (keyof typeof c)[] = ['theGift', 'theShade', 'theCost', 'tryThis'];
  for (const field of fields) {
    if (c[field] === d[field]) {
      fail(`Same Base (Blunt) with different Color/Effect produced IDENTICAL ${field}.`);
    }
  }
  pass('Second same-Base pair (Blunt + two different secondary sets) also diverges on Gift/Shade/Cost/TryThis.');
}

// ============================================================================================
// 2. DIFFERENT BASES, SIMILAR SECONDARY SIGNALS -> still sound different
// ============================================================================================
console.log('\n--- 2. Different Bases, similar secondary signals ---');
{
  const a = read('selfSecure', 'challenging', 'tactful');
  const b = read('blunt', 'challenging', 'tactful'); // same Color+Effect, different Base
  if (a.theGift === b.theGift || a.theShade === b.theShade || a.tryThis === b.tryThis) {
    fail('Different Base with identical Color/Effect produced identical Gift/Shade/TryThis -- Base is not actually driving content.');
  } else {
    pass('Different Base (Self-secure vs Blunt) with the SAME Color+Effect still produces different Gift/Shade/TryThis.');
  }
  if (a.whyBase.objectLabel === b.whyBase.objectLabel) {
    fail('Different Base traits resolved to the same object label.');
  } else {
    pass(`Base object labels differ correctly (${a.whyBase.objectLabel} vs ${b.whyBase.objectLabel}).`);
  }
}

// ============================================================================================
// 3. NO CONTRADICTORY ADVICE -- structural proof: tryThis is ALWAYS exactly one of the base
// trait's own 4 pre-authored, individually-coherent variants, never a synthesized blend of
// multiple pieces of advice that could contradict each other.
// ============================================================================================
console.log('\n--- 3. No contradictory advice (structural) ---');
{
  let checked = 0;
  for (const baseKey of ALL_KEYS) {
    if (baseKey === 'selfSecure') continue; // locked override: tryThis is null by design, not one of practiceByModifier's variants -- see section 6.
    const voice = TRAIT_VOICE[baseKey];
    const validVariants = new Set(Object.values(voice.practiceByModifier));
    for (const colorKey of ALL_KEYS) {
      if (colorKey === baseKey) continue;
      const result = read(baseKey, colorKey, null);
      if (!result.tryThis || !validVariants.has(result.tryThis)) {
        fail(`${baseKey} + ${colorKey}: Try This ("${result.tryThis}") is not one of ${baseKey}'s own authored variants -- possible synthesis bug.`);
      }
      checked += 1;
    }
  }
  pass(`All ${checked} base+color pairings produce a Try This that is exactly one pre-authored, individually-coherent variant (never a blended/synthesized sentence that could self-contradict).`);
}

// ============================================================================================
// 4. NO COMBINATION REPEATS ESSENTIALLY THE SAME SENTENCE ACROSS MULTIPLE SECTIONS
// ============================================================================================
console.log('\n--- 4. No repeated sentences across sections within one Read ---');
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase().replace(/[“”"]/g, ''))
    .filter((s) => s.length > 25);
}
{
  const samples: [RelicTraitKey, RelicTraitKey, RelicTraitKey][] = [
    ['selfSecure', 'challenging', 'tactful'],
    ['blunt', 'armored', 'initiating'],
    ['supportive', 'approvalSeeking', 'selfReferencing'],
    ['vulnerable', 'punishing', 'defensiveness'],
    ['keepsScore', 'reflective', 'responsive'],
  ];
  let dupesFound = 0;
  for (const [base, color, effect] of samples) {
    const r = read(base, color, effect);
    const sectionTexts: Record<string, string> = {
      theRead: r.theRead.join(' '),
      whyBase: r.whyBase.body,
      whyColor: r.whyColor?.body ?? '',
      whyEffect: r.whyEffect?.body ?? '',
      // null for the selfSecure sample (locked override, see section 6) -- coalesced to empty
      // string so the duplicate-sentence scan still runs over its other sections.
      theGift: r.theGift ?? '',
      theShade: r.theShade ?? '',
      theCost: r.theCost ?? '',
      tryThis: r.tryThis ?? '',
    };
    const seen = new Map<string, string>();
    for (const [sectionName, text] of Object.entries(sectionTexts)) {
      for (const sentence of splitSentences(text)) {
        const priorSection = seen.get(sentence);
        if (priorSection && priorSection !== sectionName) {
          fail(`${base}+${color}+${effect}: sentence repeated verbatim in both ${priorSection} and ${sectionName}: "${sentence}"`);
          dupesFound += 1;
        }
        seen.set(sentence, sectionName);
      }
    }
  }
  if (dupesFound === 0) {
    pass(`No verbatim sentence repeats across sections in any of ${samples.length} sampled combinations.`);
  }
}

// ============================================================================================
// 5. EVERY ONE OF THE 24 TRAITS SAFELY WORKS AS BASE, COLOR-SOURCE, AND EFFECT-SOURCE
// ============================================================================================
console.log('\n--- 5. Every trait works in every role ---');
{
  let roleFailures = 0;
  for (const key of ALL_KEYS) {
    // As Base, paired with two different (arbitrary but valid) secondary traits.
    const otherKeys = ALL_KEYS.filter((k) => k !== key);
    try {
      const r1 = read(key, otherKeys[0], otherKeys[1]);
      // selfSecure (Anchor, locked, see section 6): Gift/Shade/Cost/TryThis are null BY
      // DESIGN -- only theRead (the locked headline+body) is required to be present.
      const requiresFullSections = key !== 'selfSecure';
      const hasFullSections = r1.theGift && r1.theShade && r1.theCost && r1.tryThis;
      if (r1.theRead.length === 0 || (requiresFullSections && !hasFullSections) || (!requiresFullSections && hasFullSections)) {
        fail(`${key} as Base produced an incomplete Read (or, for the locked selfSecure case, unexpectedly populated a section it should leave null).`);
        roleFailures += 1;
      }
    } catch (err) {
      fail(`${key} as Base threw: ${(err as Error).message}`);
      roleFailures += 1;
    }
    // As Color-source.
    try {
      const baseFor = otherKeys[0];
      const r2 = read(baseFor, key, otherKeys[1]);
      if (!r2.whyColor || r2.whyColor.traitLabel !== TRAIT_VOICE[key].label) {
        fail(`${key} as Color-source did not resolve correctly.`);
        roleFailures += 1;
      }
    } catch (err) {
      fail(`${key} as Color-source threw: ${(err as Error).message}`);
      roleFailures += 1;
    }
    // As Effect-source.
    try {
      const baseFor = otherKeys[0];
      const colorFor = otherKeys[1];
      const r3 = read(baseFor, colorFor, key);
      if (!r3.whyEffect || r3.whyEffect.traitLabel !== TRAIT_VOICE[key].label) {
        fail(`${key} as Effect-source did not resolve correctly.`);
        roleFailures += 1;
      }
    } catch (err) {
      fail(`${key} as Effect-source threw: ${(err as Error).message}`);
      roleFailures += 1;
    }
  }
  if (roleFailures === 0) {
    pass(`All 24 traits safely produce a complete Read as Base, Color-source, and Effect-source (72 role checks).`);
  }
}

// ============================================================================================
// 6. LOCKED ANCHOR V4 OVERRIDE -- the approved copy renders exactly, for every Color/Effect
// pairing, and every other trait's content is completely unaffected by its existence.
// ============================================================================================
console.log('\n--- 6. Locked Anchor (selfSecure) Read V4 override ---');
{
  const pairings: [RelicTraitKey | null, RelicTraitKey | null][] = [
    ['challenging', 'tactful'], // Michelle's real combination
    ['supportive', 'reactive'], // the approved counter-example
    [null, null], // base-only
  ];
  let mismatches = 0;
  for (const [color, effect] of pairings) {
    const result = read('selfSecure', color, effect);
    const expectedRead = [ANCHOR_LOCKED_READ_V4.headline, ...ANCHOR_LOCKED_READ_V4.body];
    if (JSON.stringify(result.theRead) !== JSON.stringify(expectedRead)) {
      fail(`selfSecure + ${color}/${effect}: theRead does not exactly match the approved Anchor V4 headline+body.`);
      mismatches += 1;
    }
    if (result.theGift !== null || result.theShade !== null || result.theCost !== null || result.tryThis !== null) {
      fail(`selfSecure + ${color}/${effect}: Gift/Shade/Cost/TryThis should be null for the locked override, but at least one was populated.`);
      mismatches += 1;
    }
    if (result.whyBase.objectLabel !== 'Anchor') {
      fail(`selfSecure's whyBase.objectLabel should still be "Anchor" (the mechanical why-section is untouched by the override), got "${result.whyBase.objectLabel}".`);
      mismatches += 1;
    }
  }
  if (mismatches === 0) {
    pass('selfSecure (Anchor) renders the exact approved V4 headline+body for every Color/Effect pairing tested, including base-only, with Gift/Shade/Cost/TryThis correctly left null and the mechanical why-section untouched.');
  }

  // Every other trait's own content must be byte-for-byte unaffected by the override existing.
  let otherTraitMismatches = 0;
  for (const baseKey of ALL_KEYS) {
    if (baseKey === 'selfSecure') continue;
    const r = read(baseKey, 'selfSecure', null); // selfSecure as Color-source, not Base -- should NOT trigger the override.
    if (!r.theGift || !r.theShade || !r.theCost || !r.tryThis) {
      fail(`${baseKey} with selfSecure as Color-source unexpectedly lost its own Gift/Shade/Cost/TryThis -- the override may be leaking into non-Base roles.`);
      otherTraitMismatches += 1;
    }
  }
  if (otherTraitMismatches === 0) {
    pass('selfSecure as Color-source (never as Base) never triggers the locked override -- every other trait keeps its own normal combination-aware content.');
  }
}

// ============================================================================================
// Bonus: partial Relics (1 or 2 signals only) never crash and never fabricate a missing layer.
// ============================================================================================
console.log('\n--- Bonus: partial Relics ---');
{
  const baseOnly = synthesizeRelicRead({ relicTrait: sig('selfSecure'), colorTrait: null, effectTrait: null });
  if (!baseOnly) {
    fail('Base-only Relic (1 signal) returned null -- it should render a partial Read.');
  } else if (baseOnly.whyColor !== null || baseOnly.whyEffect !== null) {
    fail('Base-only Relic fabricated a Color or Effect section that should not exist yet.');
  } else {
    pass('Base-only Relic (1 signal) renders a valid partial Read with no fabricated Color/Effect.');
  }

  const noSignals = synthesizeRelicRead({ relicTrait: null, colorTrait: null, effectTrait: null });
  if (noSignals !== null) {
    fail('Zero-signal Relic should return null (nothing to read yet), but got a result.');
  } else {
    pass('Zero-signal Relic correctly returns null.');
  }
}

console.log('');
if (failures > 0) {
  console.error(`${failures} CHECK(S) FAILED.`);
  process.exit(1);
} else {
  console.log('ALL RELIC READ COMBINATION CHECKS PASSED.');
}
