// Validates the Scoring V2 "activation" seam (src/data/personality-v2/activation.ts) --
// the real merge rule that connects V2's ranked output into the live Creature/Relic/Your
// Signature read paths without ever overriding or regressing an existing user's V1-derived
// identity. See that file's own header comment for the full rule; this proves it holds for
// concrete fixtures, not just by inspection.
//
// Run with: npx tsx scripts/validate-scoring-v2-activation.ts

import { mergeCoreTraitsWithV2Gaps, mergePrivateSignalsWithV2Gaps } from '../src/data/personality-v2/activation';
import type { RankedPole } from '../src/data/personality-v2/scoring-engine';
import { MAX_PRIVATE_SIGNALS, type PrivateSignalTrait } from '../src/data/private-signals';
import type { DimensionResult, PersonalityProfile, SignatureTrait } from '../src/data/personality';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// ------------------------------------------------------------------------------------------
// Fixtures -- minimal, just enough of PersonalityProfile/DimensionResult/RankedPole for the
// merge functions to read (evidenceCount only, for the dimension-coverage check).
// ------------------------------------------------------------------------------------------

const dim = (dimension: string, evidenceCount: number): DimensionResult =>
  ({ dimension, evidenceCount } as unknown as DimensionResult);

const coreTrait = (id: string, percent = 80): SignatureTrait => ({
  id: id as SignatureTrait['id'],
  name: id,
  displayName: id,
  percent,
  normalizedScore: percent / 100,
  signatureStrength: percent / 100,
  confidence: 1,
  breadth: 1,
  evidenceCount: 5,
});

const rankedPole = (poleId: string, rank: number, earnedPercent = 0.9): RankedPole => ({
  poleId: poleId as RankedPole['poleId'],
  rank,
  lifetimeEarned: 9,
  maxAvailableForUser: Math.round(9 / earnedPercent),
  distinctQuestionsWithEarnedPoints: 3,
  distinctQuestionsPresented: 3,
  earnedPercent,
  eligible: true,
});

// ------------------------------------------------------------------------------------------
// Core/Creature path
// ------------------------------------------------------------------------------------------

{
  // V1 already has evidence (even non-qualifying, evidenceCount > 0) for 'curious_decisive' --
  // a V2-ranked pole on that SAME dimension must never be appended.
  const v1Profile: PersonalityProfile = {
    dimensions: [dim('curious_decisive', 3), dim('playful_serious', 0)],
    topTraits: [coreTrait('curious_decisive')],
    totalEvidence: 3,
    answeredCount: 3,
  };
  const v2Ranked: RankedPole[] = [
    rankedPole('curious_decisive:negative', 1), // same dimension V1 already covers -- must be excluded
    rankedPole('playful_serious:positive', 2), // zero V1 evidence -- must be included
  ];
  const merged = mergeCoreTraitsWithV2Gaps(v1Profile, v2Ranked);
  assert(merged.length === 2, `V1 trait kept + exactly one V2 gap-fill appended (got ${merged.length})`);
  assert(merged[0].id === 'curious_decisive', 'the real V1 trait stays first, completely unchanged');
  assert(merged[1].id === 'playful_serious', 'V2 only fills the dimension V1 had zero evidence for');
  assert(
    !merged.some((t) => t.id === 'curious_decisive' && t !== merged[0]),
    'V2 never adds a second, competing entry for a dimension V1 already covers',
  );
}

{
  // V1 has zero evidence for everything -- a brand-new account with no V1 history at all.
  const emptyProfile: PersonalityProfile = { dimensions: [], topTraits: [], totalEvidence: 0, answeredCount: 0 };
  const v2Ranked: RankedPole[] = [rankedPole('direct_indirect:positive', 1)];
  const merged = mergeCoreTraitsWithV2Gaps(emptyProfile, v2Ranked);
  assert(merged.length === 1 && merged[0].id === 'direct_indirect', 'a brand-new (zero-evidence) profile is filled entirely from V2');
}

{
  // A private pole in v2Ranked must never leak into the CORE merge.
  const v1Profile: PersonalityProfile = { dimensions: [], topTraits: [], totalEvidence: 0, answeredCount: 0 };
  const v2Ranked: RankedPole[] = [rankedPole('vulnerable_armored:positive', 1)]; // vulnerable_armored is a Private dimension
  const merged = mergeCoreTraitsWithV2Gaps(v1Profile, v2Ranked);
  assert(merged.length === 0, 'a Private-dimension V2 pole is never appended to the Core/Creature trait list');
}

// ------------------------------------------------------------------------------------------
// Private/Relic path
// ------------------------------------------------------------------------------------------

{
  const v1Signals: PrivateSignalTrait[] = [
    { dimension: 'vulnerable_armored', label: 'Armored', strengthLabel: 'Strong signal', signatureStrength: 0.9, evidenceCount: 4 },
  ];
  const v1Profile: PersonalityProfile = {
    dimensions: [dim('vulnerable_armored', 4)],
    topTraits: [],
    totalEvidence: 4,
    answeredCount: 4,
  };
  const v2Ranked: RankedPole[] = [
    rankedPole('vulnerable_armored:negative', 1), // same dimension as the real V1 signal -- excluded
    rankedPole('tactful_blunt:positive', 2), // zero V1 evidence -- included
  ];
  const merged = mergePrivateSignalsWithV2Gaps(v1Signals, v1Profile, v2Ranked);
  assert(merged.length === 2, `real V1 signal kept + one V2 gap-fill (got ${merged.length})`);
  assert(merged[0] === v1Signals[0], 'the real V1 Relic signal is untouched and stays first');
  assert(merged[1]?.dimension === 'tactful_blunt', 'V2 only fills a dimension with zero V1 evidence');
}

{
  // V1 already fills all MAX_PRIVATE_SIGNALS slots with REAL evidence -- V2 must never displace
  // or append past the cap. This is the exact "no existing user regresses" guarantee.
  const realPrivateDimensionIds = ['vulnerable_armored', 'tactful_blunt', 'repair_punishing'] as const;
  const v1Signals: PrivateSignalTrait[] = realPrivateDimensionIds.slice(0, MAX_PRIVATE_SIGNALS).map((dimension) => ({
    dimension,
    label: dimension,
    strengthLabel: 'Strong signal',
    signatureStrength: 0.9,
    evidenceCount: 4,
  }));
  const v1Profile: PersonalityProfile = {
    dimensions: v1Signals.map((s) => dim(s.dimension, 4)),
    topTraits: [],
    totalEvidence: 12,
    answeredCount: 12,
  };
  const v2Ranked: RankedPole[] = [rankedPole('vulnerable_armored:positive', 1)];
  const merged = mergePrivateSignalsWithV2Gaps(v1Signals, v1Profile, v2Ranked);
  assert(merged.length === MAX_PRIVATE_SIGNALS, `a fully-qualified V1 Relic (${MAX_PRIVATE_SIGNALS} real slots) is returned completely unchanged`);
  assert(merged.every((s, i) => s === v1Signals[i]), 'every existing real V1 signal/slot assignment is byte-identical, never reordered or replaced');
}

{
  // A Core-dimension V2 pole must never leak into the PRIVATE merge.
  const v1Profile: PersonalityProfile = { dimensions: [], topTraits: [], totalEvidence: 0, answeredCount: 0 };
  const v2Ranked: RankedPole[] = [rankedPole('planner_spontaneous:positive', 1)]; // Core dimension
  const merged = mergePrivateSignalsWithV2Gaps([], v1Profile, v2Ranked);
  assert(merged.length === 0, 'a Core-dimension V2 pole is never appended to the Private/Relic signal list');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Scoring V2 activation (Core/Creature gap-fill, Private/Relic gap-fill, cross-type exclusion, zero-regression-on-full-V1) VALIDATION CHECKS PASSED.');
