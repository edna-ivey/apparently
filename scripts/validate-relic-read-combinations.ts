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
import { synthesizeRelicRead } from '../src/data/relic/relic-read-synthesis';
import { TRAIT_VOICE } from '../src/data/relic/relic-read-content';
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
  const a = read('selfSecure', 'challenging', 'tactful'); // Michelle's real combination
  const b = read('selfSecure', 'supportive', 'reactive'); // the approved counter-example

  const fields: (keyof typeof a)[] = ['theGift', 'theShade', 'theCost', 'tryThis'];
  for (const field of fields) {
    const av = a[field];
    const bv = b[field];
    if (av === bv) {
      fail(`Same Base (Self-secure) with different Color/Effect produced IDENTICAL ${field}: "${av}"`);
    } else {
      pass(`${field} genuinely differs between Self-secure+Challenging+Tactful and Self-secure+Supportive+Reactive`);
    }
  }
  if (a.theRead.join(' ') === b.theRead.join(' ')) {
    fail('The Read is identical between the two same-Base combinations.');
  } else {
    pass('The Read genuinely differs between the two same-Base combinations.');
  }

  // A second same-Base pair, to confirm this isn't a one-off coincidence of the first pair.
  const c = read('blunt', 'armored', 'initiating');
  const d = read('blunt', 'supportive', 'perspectiveTaking');
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
    const voice = TRAIT_VOICE[baseKey];
    const validVariants = new Set(Object.values(voice.practiceByModifier));
    for (const colorKey of ALL_KEYS) {
      if (colorKey === baseKey) continue;
      const result = read(baseKey, colorKey, null);
      if (!validVariants.has(result.tryThis)) {
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
      theGift: r.theGift,
      theShade: r.theShade,
      theCost: r.theCost,
      tryThis: r.tryThis,
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
      if (!r1.theGift || !r1.theShade || !r1.theCost || !r1.tryThis || r1.theRead.length === 0) {
        fail(`${key} as Base produced an incomplete Read.`);
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
