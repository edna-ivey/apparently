// End-to-end validation for the Build 16 combined Creature Read assembler (src/data/creature/
// creature-combined-read-copy.ts) against the locked Build 16 brief: exactly 40 authored
// records (20 Core dimensions x both poles), the fixed header/paragraph assembly formula, the
// first trait's shade never leaking into the Read, and the full 1,520-ordered-combination
// space assembling without error. Run with:
//
//   npx tsx scripts/validate-combined-creature-read.ts

import {
  buildCombinedCreatureRead,
  buildCombinedCreatureReadByLabel,
  buildParagraph1,
  buildParagraph2,
  CREATURE_COMBINED_READ_COPY,
  getCombinedReadComponents,
  type CombinedReadComponents,
} from '../src/data/creature/creature-combined-read-copy';
import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId, type SignatureTrait } from '../src/data/personality';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const CORE_20: PersonalityDimensionId[] = PERSONALITY_DIMENSIONS.filter((d) => d.type === 'core').map((d) => d.id);
assert(CORE_20.length === 20, `exactly 20 Core dimensions in PERSONALITY_DIMENSIONS (got ${CORE_20.length})`);

// ============================================================================================
// All 40 approved records exist, each with exactly four nonempty components.
// ============================================================================================

for (const id of CORE_20) {
  const entry = CREATURE_COMBINED_READ_COPY[id];
  assert(entry !== undefined, `combined Read copy exists for Core dimension "${id}"`);
  if (!entry) continue;
  for (const pole of ['positive', 'negative'] as const) {
    const components = entry[pole];
    assert(components !== undefined, `"${id}" has ${pole} combined Read components`);
    if (!components) continue;
    (['header', 'openingFragment', 'supportingCopy', 'shade'] as const).forEach((field) => {
      assert(typeof components[field] === 'string' && components[field].trim().length > 0, `"${id}".${pole}.${field} is a nonempty string`);
    });
  }
}

const totalRecords = CORE_20.reduce((count, id) => {
  const entry = CREATURE_COMBINED_READ_COPY[id];
  return count + (entry ? 2 : 0);
}, 0);
assert(totalRecords === 40, `exactly 40 authored combined Read records total (got ${totalRecords})`);
assert(Object.keys(CREATURE_COMBINED_READ_COPY).length === 20, `CREATURE_COMBINED_READ_COPY has exactly 20 dimension keys (got ${Object.keys(CREATURE_COMBINED_READ_COPY).length})`);

// ============================================================================================
// A synthetic SignatureTrait builder for every (dimension, pole) -- used to drive the full
// combination sweep without needing a real scored profile.
// ============================================================================================

const traitFor = (id: PersonalityDimensionId, pole: 'positive' | 'negative'): SignatureTrait => {
  const dimension = PERSONALITY_DIMENSIONS.find((d) => d.id === id);
  if (!dimension) throw new Error(`no dimension for ${id}`);
  const name = pole === 'positive' ? dimension.positiveLabel : dimension.negativeLabel;
  return { id, name, displayName: dimension.positivePole, percent: 50, normalizedScore: 0, signatureStrength: 0, confidence: 0, breadth: 0, evidenceCount: 0 };
};

// ============================================================================================
// All 1,520 valid ordered trait-pole combinations (20 x 19 distinct-dimension orderings x 2 x 2
// poles) assemble successfully, by both the live-SignatureTrait path and the persisted-label
// path creature-read.tsx actually calls.
// ============================================================================================

let combinationCount = 0;
for (const firstId of CORE_20) {
  for (const secondId of CORE_20) {
    if (firstId === secondId) continue;
    for (const firstPole of ['positive', 'negative'] as const) {
      for (const secondPole of ['positive', 'negative'] as const) {
        combinationCount += 1;
        const first = traitFor(firstId, firstPole);
        const second = traitFor(secondId, secondPole);
        const read = buildCombinedCreatureRead(first, second);
        const readByLabel = buildCombinedCreatureReadByLabel(first.name, second.name);
        if (
          !read.headline || !read.paragraph1 || !read.paragraph2 ||
          read.headline !== readByLabel.headline || read.paragraph1 !== readByLabel.paragraph1 || read.paragraph2 !== readByLabel.paragraph2
        ) {
          failures += 1;
          console.error(`FAIL: combination ${first.name} + ${second.name} did not assemble consistently between the trait-based and label-based paths`);
        }
      }
    }
  }
}
assert(combinationCount === 1520, `swept exactly 1,520 ordered trait-pole combinations (got ${combinationCount})`);
console.log(`OK: all ${combinationCount} ordered combinations assembled without error via both buildCombinedCreatureRead and buildCombinedCreatureReadByLabel`);

// ============================================================================================
// Invalid same-dimension pairs are rejected (both opposite-pole and identical-pole shape).
// ============================================================================================

{
  let threw = false;
  try {
    buildCombinedCreatureRead(traitFor('direct_indirect', 'positive'), traitFor('direct_indirect', 'negative'));
  } catch {
    threw = true;
  }
  assert(threw, 'buildCombinedCreatureRead rejects two opposite poles of the SAME dimension as rank 1 + rank 2');
}
{
  let threw = false;
  try {
    buildCombinedCreatureReadByLabel('Direct', 'Indirect');
  } catch {
    threw = true;
  }
  assert(threw, 'buildCombinedCreatureReadByLabel rejects two opposite poles of the SAME dimension as rank 1 + rank 2');
}

// ============================================================================================
// First/second order is preserved (swapping ranks changes the Read -- never symmetric).
// ============================================================================================

{
  const direct = traitFor('direct_indirect', 'positive');
  const vibeChecker = traitFor('social_attunement', 'positive');
  const forward = buildCombinedCreatureRead(direct, vibeChecker);
  const reversed = buildCombinedCreatureRead(vibeChecker, direct);
  assert(forward.headline !== reversed.headline, 'swapping rank 1 / rank 2 changes the headline (order is not symmetric)');
  assert(forward.paragraph1 !== reversed.paragraph1, 'swapping rank 1 / rank 2 changes paragraph 1 (order is not symmetric)');
}

// ============================================================================================
// Header capitalization: second header's leading letter is lowercased, first header's case is
// untouched.
// ============================================================================================

{
  const direct = getCombinedReadComponents(traitFor('direct_indirect', 'positive'));
  const vibeChecker = getCombinedReadComponents(traitFor('social_attunement', 'positive'));
  const read = buildCombinedCreatureRead(traitFor('direct_indirect', 'positive'), traitFor('social_attunement', 'positive'));
  assert(read.headline.startsWith(direct.header), 'headline begins with the first trait\'s header, case unchanged');
  assert(read.headline === `${direct.header}, and ${vibeChecker.header[0].toLowerCase()}${vibeChecker.header.slice(1)}.`, 'headline is exactly "[Header 1], and [lowercased header 2]."');
}

// ============================================================================================
// Paragraph shape: paragraph 1 is built only from the first trait's opening + support (never
// its shade); paragraph 2 carries the second trait's opening + support + shade.
// ============================================================================================

{
  const allIds = CORE_20;
  for (const firstId of allIds) {
    for (const secondId of allIds) {
      if (firstId === secondId) continue;
      for (const firstPole of ['positive', 'negative'] as const) {
        for (const secondPole of ['positive', 'negative'] as const) {
          const first = traitFor(firstId, firstPole);
          const second = traitFor(secondId, secondPole);
          const firstComponents = getCombinedReadComponents(first);
          const secondComponents = getCombinedReadComponents(second);
          const read = buildCombinedCreatureRead(first, second);

          // Build 19: paragraph 1 may now fold supportingCopy's first sentence into the
          // opening fragment via "and" (see buildParagraph1's own comment), so it no longer
          // always contains firstComponents.supportingCopy verbatim -- it must always equal
          // buildParagraph1(firstComponents) exactly, which IS the real implementation (not a
          // re-derivation of it), and must always contain the opening fragment.
          if (!read.paragraph1.includes(firstComponents.openingFragment)) {
            failures += 1;
            console.error(`FAIL: paragraph 1 for ${first.name}+${second.name} is missing the first trait's opening fragment`);
          }
          if (read.paragraph1 !== buildParagraph1(firstComponents)) {
            failures += 1;
            console.error(`FAIL: paragraph 1 for ${first.name}+${second.name} does not match buildParagraph1(firstComponents) exactly`);
          }
          if (read.paragraph1.includes(firstComponents.shade)) {
            failures += 1;
            console.error(`FAIL: paragraph 1 for ${first.name}+${second.name} leaks the FIRST trait's shade -- it must never appear`);
          }
          // Build 19: paragraph 2 may fold "Apparently," into supportingCopy's last sentence
          // (see buildParagraph2's own comment) when the shade doesn't already open with it,
          // so it no longer always contains secondComponents.supportingCopy verbatim either --
          // same exact-match-against-the-real-formula approach as paragraph 1 above. The shade
          // itself is never rewritten, so it must always still appear verbatim.
          if (!read.paragraph2.includes(secondComponents.openingFragment) || !read.paragraph2.includes(secondComponents.shade)) {
            failures += 1;
            console.error(`FAIL: paragraph 2 for ${first.name}+${second.name} is missing the second trait's opening fragment or shade`);
          }
          if (read.paragraph2 !== buildParagraph2(secondComponents)) {
            failures += 1;
            console.error(`FAIL: paragraph 2 for ${first.name}+${second.name} does not match buildParagraph2(secondComponents) exactly`);
          }
          if ((read.paragraph2.match(/Apparently,/g) ?? []).length > 1) {
            failures += 1;
            console.error(`FAIL: paragraph 2 for ${first.name}+${second.name} contains "Apparently," more than once`);
          }
          if (/ {2,}/.test(read.paragraph1) || / {2,}/.test(read.paragraph2)) {
            failures += 1;
            console.error(`FAIL: paragraph for ${first.name}+${second.name} contains a double space`);
          }
        }
      }
    }
  }
  console.log('OK: across all 1,520 combinations, paragraph 1 never contains the first trait\'s shade, and paragraph 2 always carries the second trait\'s shade');
}

// ============================================================================================
// Zorafox (Direct + Vibe Checker) uses the standard formula and matches the exact approved
// example text from the Build 16 brief -- no special-case copy path.
// ============================================================================================

{
  const zorafoxRead = buildCombinedCreatureReadByLabel('Direct', 'Vibe checker');
  const expectedHeadline = "You say what you mean, and you hear what everyone else doesn't.";
  // Build 19 editorial pass: paragraph 1 now folds supportingCopy's first sentence into the
  // opening fragment via "and" (owner-approved example, task brief "Build 19 | Subscription
  // Access + Creature Read Polish"); paragraph 2 now works "Apparently," into the closing
  // thought since social_attunement's shade doesn't already open with it.
  const expectedParagraph1 =
    "You're direct enough to make your point clear and you don't make people decode your intention. When something needs to be said, you say it.";
  const expectedParagraph2 =
    "You're also perceptive enough to catch what people leave unsaid. A shift in tone? Noticed. A change in energy? Clocked. Apparently, you don't just listen to words. You read the room they're spoken in.";
  assert(zorafoxRead.headline === expectedHeadline, `Zorafox headline matches the approved copy exactly (got "${zorafoxRead.headline}")`);
  assert(zorafoxRead.paragraph1 === expectedParagraph1, `Zorafox paragraph 1 matches the approved copy exactly (got "${zorafoxRead.paragraph1}")`);
  assert(zorafoxRead.paragraph2 === expectedParagraph2, `Zorafox paragraph 2 matches the approved copy exactly (got "${zorafoxRead.paragraph2}")`);
}

// ============================================================================================
// Build 19: dedicated fixture tests for buildParagraph1/buildParagraph2's join/fallback and
// inject/no-inject branches, independent of which real dimensions happen to exercise them --
// pins the actual grammar rule the brief asked for, not just today's data shape.
// ============================================================================================

{
  // Joinable first sentence ("ends with .") folds into the opening fragment via "and".
  const joinable: CombinedReadComponents = {
    header: 'H',
    openingFragment: 'direct enough to make your point clear',
    supportingCopy: "You don't make people decode your intention. When something needs to be said, you say it.",
    shade: 'unused',
  };
  assert(
    buildParagraph1(joinable) ===
      "You're direct enough to make your point clear and you don't make people decode your intention. When something needs to be said, you say it.",
    'buildParagraph1 folds a joinable (".")-ending first sentence into the opening fragment via "and", keeping remaining sentences unchanged',
  );

  // A first sentence ending in "?" (a rhythm fragment) is never forced after "and" -- falls
  // back to the original period-separated join instead of producing dangling grammar.
  const fragment: CombinedReadComponents = {
    header: 'H',
    openingFragment: 'perceptive enough to catch what people leave unsaid',
    supportingCopy: "A shift in tone? Noticed. A change in energy? Clocked. You don't just listen to words.",
    shade: 'unused',
  };
  assert(
    buildParagraph1(fragment) ===
      "You're perceptive enough to catch what people leave unsaid. A shift in tone? Noticed. A change in energy? Clocked. You don't just listen to words.",
    'buildParagraph1 never joins a "?"/"!" rhythm-fragment first sentence with "and" -- falls back to the plain period-separated join',
  );

  // Single-sentence supportingCopy: the whole sentence folds in via "and", with nothing left
  // to append afterward.
  const singleSentence: CombinedReadComponents = {
    header: 'H',
    openingFragment: 'organized enough to make a plan before making a move',
    supportingCopy: 'You think ahead and feel better when the important details are handled.',
    shade: 'unused',
  };
  assert(
    buildParagraph1(singleSentence) ===
      "You're organized enough to make a plan before making a move and you think ahead and feel better when the important details are handled.",
    'buildParagraph1 folds a single-sentence supportingCopy in fully via "and", with no leftover sentence',
  );
}

{
  // Shade already opens with "Apparently," -- the shade itself IS the closing thought, so
  // nothing is injected into supportingCopy's last sentence (would otherwise double it).
  const shadeHasApparently: CombinedReadComponents = {
    header: 'H',
    openingFragment: 'organized enough to make a plan before making a move',
    supportingCopy: 'You think ahead and feel better when the important details are handled.',
    shade: "Apparently, 'we'll figure it out' is not the reassuring statement people think it is.",
  };
  assert(
    buildParagraph2(shadeHasApparently) ===
      "You're also organized enough to make a plan before making a move. You think ahead and feel better when the important details are handled. Apparently, 'we'll figure it out' is not the reassuring statement people think it is.",
    'buildParagraph2 does not inject "Apparently," when the shade already opens with it',
  );

  // Shade does NOT open with "Apparently," -- it gets worked into supportingCopy's last
  // ("."-ending) sentence instead, immediately before the shade.
  const shadeLacksApparently: CombinedReadComponents = {
    header: 'H',
    openingFragment: 'perceptive enough to catch what people leave unsaid',
    supportingCopy: "A shift in tone? Noticed. A change in energy? Clocked. You don't just listen to words.",
    shade: "You read the room they're spoken in.",
  };
  assert(
    buildParagraph2(shadeLacksApparently) ===
      "You're also perceptive enough to catch what people leave unsaid. A shift in tone? Noticed. A change in energy? Clocked. Apparently, you don't just listen to words. You read the room they're spoken in.",
    'buildParagraph2 works "Apparently," into supportingCopy\'s last sentence when the shade does not already open with it',
  );
}

// ============================================================================================
// No combination anywhere ever produces a doubled "Apparently," or a double space -- swept
// across the full 1,520-combination space (Build 19 regression guard for the injection logic).
// ============================================================================================

{
  let doubleApparentlyCount = 0;
  let doubleSpaceCount = 0;
  for (const firstId of CORE_20) {
    for (const secondId of CORE_20) {
      if (firstId === secondId) continue;
      for (const firstPole of ['positive', 'negative'] as const) {
        for (const secondPole of ['positive', 'negative'] as const) {
          const read = buildCombinedCreatureRead(traitFor(firstId, firstPole), traitFor(secondId, secondPole));
          if ((read.paragraph2.match(/Apparently,/g) ?? []).length > 1) doubleApparentlyCount += 1;
          if (/ {2,}/.test(read.paragraph1) || / {2,}/.test(read.paragraph2)) doubleSpaceCount += 1;
        }
      }
    }
  }
  assert(doubleApparentlyCount === 0, `no combination doubles "Apparently," in paragraph 2 (found ${doubleApparentlyCount})`);
  assert(doubleSpaceCount === 0, `no combination produces a double space in paragraph 1 or 2 (found ${doubleSpaceCount})`);
}

// ============================================================================================
// No em dashes anywhere in the authored copy (user-facing writing constraint from the brief).
// ============================================================================================

{
  for (const id of CORE_20) {
    const entry = CREATURE_COMBINED_READ_COPY[id];
    if (!entry) continue;
    for (const pole of ['positive', 'negative'] as const) {
      const components = entry[pole] as CombinedReadComponents;
      for (const field of ['header', 'openingFragment', 'supportingCopy', 'shade'] as const) {
        assert(!components[field].includes('—'), `"${id}".${pole}.${field} contains no em dash`);
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL combined Creature Read (40 records, 1,520 combinations, Zorafox fixture, shade-isolation, order-sensitivity) VALIDATION CHECKS PASSED.');
