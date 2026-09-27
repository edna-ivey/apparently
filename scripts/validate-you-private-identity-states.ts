// Focused validation for the Apparently Private identity states on You (free / active
// subscriber / former subscriber), per Product + Creative Bible v1.4. Run with:
//
//   npx tsx scripts/validate-you-private-identity-states.ts
//
// Source-text checks against the actual shipped you.tsx (react-native import chain, same
// established convention as every other validate-build8-*.ts script that can't import it
// directly) plus real, direct calls into the pure selector functions for the data-layer half
// of each scenario.

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { scorePersonalityProfile } from '../src/data/personality';
import { selectStrongestPrivateSignals, selectRelicSlots } from '../src/data/private-signals';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const read = (relativePath: string): string => readFileSync(join(__dirname, relativePath), 'utf8');
const stripLineComments = (source: string): string =>
  source.split('\n').map((line) => line.replace(/\/\/.*$/, '')).join('\n');

const youSource = read('../src/app/(tabs)/you.tsx');
const youCode = stripLineComments(youSource);

// ============================================================================================
// STRUCTURAL: UndercurrentSection never checks entitlement -- this is WHY former-subscriber
// identity persistence and "no acquisition messaging for subscribers" both hold by
// construction, not by a special-cased "preserve on cancel" branch that could be forgotten.
// ============================================================================================

const undercurrentSectionMatch = youCode.match(/function UndercurrentSection[\s\S]*?\n}\n/);
assert(undercurrentSectionMatch !== null, 'UndercurrentSection function exists in you.tsx');
const undercurrentSectionCode = undercurrentSectionMatch?.[0] ?? '';

assert(
  !/usePremiumStatus|useEffectivePremium|premium\.status|isPremium/.test(undercurrentSectionCode),
  'UndercurrentSection reads no entitlement/subscription state at all -- rendering is evidence-only, so canceling a subscription cannot relock already-earned content and an active subscriber can never see free-user acquisition copy',
);

// ============================================================================================
// STATE 1 — free / no earned Private identity: locked state, no fabrication, no acquisition
// language that would be wrong for a SUBSCRIBER seeing the same zero-evidence branch, real
// entry point into Apparently Private.
// ============================================================================================

assert(!/return null/.test(undercurrentSectionCode), 'the Undercurrent section no longer disappears entirely at zero evidence -- it always renders something (Bible v1.4: "Apparently Private must remain visibly represented")');
assert(/signals\.length === 0/.test(undercurrentSectionCode), 'a distinct locked-state branch exists for zero qualifying evidence');
assert(/lockedSlot/.test(undercurrentSectionCode), 'the locked state renders concealed trait-position placeholders');
assert(
  !/lockedSlot[\s\S]{0,200}(01|02|03)/.test(undercurrentSectionCode.replace(/\n/g, ' ')),
  'locked trait-position slots carry no numbering/labels that could read as a real ranked trait',
);
assert(
  /Apparently Private learns what tends to show up underneath when things get personal/.test(youSource),
  'the approved teaser line is present verbatim',
);
assert(/router\.push\('\/private'\)/.test(undercurrentSectionCode), "the locked state's entry point navigates to /private (the primary premium discovery/subscription surface)");

const FORBIDDEN_ACQUISITION_PHRASES = [
  /free preview/i,
  /subscribe to unlock/i,
  /one preview is on us/i,
  /unlock what you already/i,
];
for (const phrase of FORBIDDEN_ACQUISITION_PHRASES) {
  assert(!phrase.test(undercurrentSectionCode), `UndercurrentSection never contains the forbidden acquisition phrase /${phrase.source}/`);
}

// ============================================================================================
// STATE 2 — active subscriber: up to 3 qualifying traits, never padded; Relic silhouette until
// 3 qualify (unchanged Pass 3 logic, re-confirmed here since this pass touches the same file).
// ============================================================================================

assert(/signals\.map\(\(signal, index\) =>/.test(undercurrentSectionCode), 'the revealed state maps directly over real qualifying signals -- never pads to a fixed count');
assert(/MAX_PRIVATE_SIGNALS = 3/.test(read('../src/data/private-signals.ts')), 'the selector itself still caps at 3, unchanged');

// Real functional proof: 1, 2, and 3 qualifying signals render exactly that many cards' worth
// of data, and the Relic only fully resolves at 3 -- the exact underlying data this pass's UI
// consumes, unchanged from Pass 3/3.1/3.2.
const oneSignalProfile = scorePersonalityProfile([
  { question: 'q', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-1', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
]);
const oneSignals = selectStrongestPrivateSignals(oneSignalProfile);
assert(oneSignals.length === 1, 'active subscriber with 1 qualifying trait: selector returns exactly 1');
assert(selectRelicSlots(oneSignals).colorTrait === null, 'with <3 qualifying traits, the Relic stays a silhouette (color/effect slots unresolved)');

const threeSignalProfile = scorePersonalityProfile([
  { question: 'q1', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-2', effects: [{ dimension: 'tactful_blunt', value: -2 }] },
  { question: 'q2', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-3', effects: [{ dimension: 'vulnerable_armored', value: -2 }] },
  { question: 'q3', category: 'c', chosenAnswer: 'a', sourceType: 'quiz_result', sourceId: 'quiz-4', effects: [{ dimension: 'repair_punishing', value: -2 }] },
]);
const threeSignals = selectStrongestPrivateSignals(threeSignalProfile);
assert(threeSignals.length === 3, 'active subscriber with 3 qualifying traits: selector returns exactly 3');
const threeSlots = selectRelicSlots(threeSignals);
assert(
  threeSlots.relicTrait !== null && threeSlots.colorTrait !== null && threeSlots.effectTrait !== null,
  'with 3 qualifying traits, the Relic fully resolves: #1 -> relic slot, #2 -> color slot, #3 -> effect slot',
);
assert(threeSlots.relicTrait?.dimension === threeSignals[0].dimension, 'slot #1 is the strongest signal specifically');

// ============================================================================================
// STATE 3 — former subscriber: identity persistence is architectural (see the "no entitlement
// read at all" check above). This section re-confirms the Relic-hero itself also never gates
// on entitlement, so a previously revealed Relic cannot be relocked on cancellation either.
// ============================================================================================

const identityHeroMatch = youCode.match(/function IdentityHero[\s\S]*?\n}\n/);
assert(identityHeroMatch !== null, 'IdentityHero function exists in you.tsx');
assert(
  !/usePremiumStatus|useEffectivePremium|premium\.status|isPremium/.test(identityHeroMatch?.[0] ?? ''),
  'IdentityHero (the Relic-bearing hero) also reads no entitlement state -- resolvedRelicSlotCount comes only from real qualified evidence, so a lapsed subscription cannot relock an already-revealed Relic',
);

// ============================================================================================
// IDENTITY HERO LAYOUT — Bible v1.4: creature left, character name large on the right, Relic
// smaller below the character name.
// ============================================================================================

assert(/heroRow.*flexDirection: 'row'/.test(youCode) || /flexDirection: 'row'/.test(youCode.match(/heroRow: \{[^}]*\}/)?.[0] ?? ''), 'the hero is a row layout');
const heroJsxMatch = youCode.match(/<View style=\{styles\.heroRow\}>[\s\S]*?<\/View>\s*\);\s*\n}/);
const heroJsx = heroJsxMatch?.[0] ?? '';
const avatarIndex = heroJsx.indexOf('avatarArea');
const relicGroupIndex = heroJsx.indexOf('relicGroup');
const nameIndex = heroJsx.indexOf('characterNamePlaceholder');
const relicShapeIndex = heroJsx.indexOf('styles.relicShape,');
assert(avatarIndex !== -1 && avatarIndex < relicGroupIndex, 'the avatar (creature) renders BEFORE the relic group in source order -- avatar on the left');
assert(nameIndex !== -1 && relicShapeIndex !== -1 && nameIndex < relicShapeIndex, 'within the relic group, the character name renders ABOVE the relic shape -- name large on top, Relic smaller below it');

// ============================================================================================
// Settings remains reachable only from You (gear), never a primary tab -- unchanged by this
// pass; re-confirmed since it's an explicit Bible v1.4 requirement repeated in this task.
// ============================================================================================

assert(/router\.push\('\/settings'\)/.test(youCode), 'You still opens Settings via the gear icon');
const webTabsSource = read('../src/components/app-tabs.web.tsx');
const nativeTabsSource = read('../src/components/app-tabs.tsx');
assert(!/name="settings"/.test(webTabsSource) && !/name="settings"/.test(nativeTabsSource), 'Settings is still not registered as a primary tab in either tab bar');

// ============================================================================================
// NO CHANGE TO THE IDENTITY ARCHITECTURE ITSELF -- this pass is presentation-only.
// ============================================================================================

const privateSignalsSource = read('../src/data/private-signals.ts');
const personalitySource = read('../src/data/personality.ts');
assert(!/isPrivateSignalQualified/.test(personalitySource), 'the Private qualification gate still lives only in private-signals.ts, not in Core scoring');
assert(/MAX_PRIVATE_SIGNALS = 3/.test(privateSignalsSource), 'the 3-slot Relic/Undercurrent cap is unchanged');
assert(/CORE_DIMENSION_IDS\.length === 20/.test(read('./validate-build8-pass3-identity-architecture.ts')), 'the Core-20/Private-12 split validation still exists and still asserts the exact counts (re-run separately for its own full result)');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL You-page Apparently Private identity-states VALIDATION CHECKS PASSED.');
