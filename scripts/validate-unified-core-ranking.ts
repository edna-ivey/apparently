// Validates the Build 22 unified ranking seam (src/data/personality-v2/activation.ts +
// scoring-engine.ts's collapseToOnePerDimension) -- V2 is now the sole, authoritative ranking
// engine for both Your Signature/the Creature (Core) and The Undercurrent/Relic (Private).
// Replaces scripts/validate-scoring-v2-activation.ts, which tested the retired V1 gap-fill
// rule (mergeCoreTraitsWithV2Gaps/mergePrivateSignalsWithV2Gaps) -- that rule no longer exists,
// so that script no longer compiles and is superseded by this one.
//
// Run with: npx tsx scripts/validate-unified-core-ranking.ts

import { rankCoreSignatureTraits, rankPrivateSignalTraits, MAX_CORE_SIGNATURE_TRAITS } from '../src/data/personality-v2/activation';
import { collapseToOnePerDimension } from '../src/data/personality-v2/scoring-engine';
import type { RankedPole } from '../src/data/personality-v2/scoring-engine';
import { MAX_PRIVATE_SIGNALS } from '../src/data/private-signals';
import { poleIsCore, poleIsPrivate } from '../src/data/personality-v2/pole-ids';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// rankPoles' own output is always pre-sorted strongest-first; these fixtures are constructed
// already in that order (as the real engine would hand them to the collapse step), with each
// RankedPole's `rank` matching its position -- exactly what collapseToOnePerDimension assumes.
const rankedPole = (poleId: string, rank: number, earnedPercent = 0.9, evidenceCount = 3): RankedPole => ({
  poleId: poleId as RankedPole['poleId'],
  rank,
  lifetimeEarned: Math.round(earnedPercent * 9),
  maxAvailableForUser: 9,
  distinctQuestionsWithEarnedPoints: evidenceCount,
  distinctQuestionsPresented: evidenceCount,
  earnedPercent,
  eligible: true,
});

// ------------------------------------------------------------------------------------------
// Opposing-pole collapse -- the one new correctness property this pass introduces: ranking by
// POLE (not dimension) means both poles of one dimension could independently qualify; the
// collapse step must keep only the higher-ranked one, never both.
// ------------------------------------------------------------------------------------------

{
  const ranked: RankedPole[] = [
    rankedPole('forgiving_receipts:negative', 1, 0.95), // higher-ranked pole of this dimension
    rankedPole('forgiving_receipts:positive', 2, 0.40), // weaker pole, SAME dimension -- must be dropped
    rankedPole('direct_indirect:positive', 3, 0.80),
  ];
  const collapsed = collapseToOnePerDimension(ranked, poleIsCore);
  assert(collapsed.length === 2, `opposing poles of one dimension collapse to exactly one entry (got ${collapsed.length})`);
  assert(collapsed[0]?.poleId === 'forgiving_receipts:negative', 'the HIGHER-ranked pole of the dimension survives, not the first-listed or positive one by default');
  assert(!collapsed.some((p) => p.poleId === 'forgiving_receipts:positive'), 'the weaker opposing pole never survives the collapse');
}

// ------------------------------------------------------------------------------------------
// Core vs. Private cross-type exclusion -- unchanged correctness bar from the old gap-fill
// rule, now re-verified against the new collapse-based implementation.
// ------------------------------------------------------------------------------------------

{
  const ranked: RankedPole[] = [
    rankedPole('direct_indirect:positive', 1), // Core
    rankedPole('vulnerable_armored:positive', 2), // Private
  ];
  const coreTraits = rankCoreSignatureTraits(ranked);
  const privateSignals = rankPrivateSignalTraits(ranked);
  assert(coreTraits.length === 1 && coreTraits[0].id === 'direct_indirect', 'Your Signature/Creature ranking includes only the Core pole');
  assert(privateSignals.length === 1 && privateSignals[0].dimension === 'vulnerable_armored', 'The Undercurrent/Relic ranking includes only the Private pole');
  assert(!coreTraits.some((t) => t.id === 'vulnerable_armored'), 'a Private pole never leaks into the Core/Signature list');
  assert(!privateSignals.some((s) => s.dimension === 'direct_indirect'), 'a Core pole never leaks into the Private/Relic list');
}

// ------------------------------------------------------------------------------------------
// Caps -- Your Signature stops at 7 (Bible v1.4 §16); The Undercurrent stops at
// MAX_PRIVATE_SIGNALS (3). Fewer than the cap qualifying -> fewer shown, never padded.
// ------------------------------------------------------------------------------------------

{
  const tenCoreDimensions = [
    'planner_spontaneous', 'emotional_intensity', 'direct_indirect', 'social_attunement', 'protective_hands_off',
    'adventure_comfort', 'independent_collaborative', 'control_allowing', 'practical_idealistic', 'sentimental_thick_skinned',
  ];
  const ranked: RankedPole[] = tenCoreDimensions.map((dimension, index) =>
    rankedPole(`${dimension}:positive`, index + 1, 0.9 - index * 0.01),
  );
  const coreTraits = rankCoreSignatureTraits(ranked);
  assert(coreTraits.length === MAX_CORE_SIGNATURE_TRAITS, `10 independently-qualified Core dimensions are capped at exactly ${MAX_CORE_SIGNATURE_TRAITS} (got ${coreTraits.length})`);
  assert(coreTraits[0].id === 'planner_spontaneous', 'the cap keeps the strongest-ranked traits, not an arbitrary subset');
}

{
  const ranked: RankedPole[] = [rankedPole('direct_indirect:positive', 1)];
  const coreTraits = rankCoreSignatureTraits(ranked);
  assert(coreTraits.length === 1, 'fewer than 7 qualifying traits shows exactly that many -- never padded to fill the cap');
}

{
  const fiveLivateDimensions = ['vulnerable_armored', 'tactful_blunt', 'repair_punishing', 'reflective_reactive', 'self_secure_reassurance'];
  const ranked: RankedPole[] = fiveLivateDimensions.map((dimension, index) => rankedPole(`${dimension}:positive`, index + 1, 0.9 - index * 0.01));
  const privateSignals = rankPrivateSignalTraits(ranked);
  assert(privateSignals.length === MAX_PRIVATE_SIGNALS, `5 independently-qualified Private dimensions are capped at exactly ${MAX_PRIVATE_SIGNALS} (got ${privateSignals.length})`);
}

// ------------------------------------------------------------------------------------------
// Empty input -- a brand-new/zero-evidence account shows nothing, never fabricated.
// ------------------------------------------------------------------------------------------

{
  assert(rankCoreSignatureTraits([]).length === 0, 'zero V2 evidence produces an empty Signature, never a fabricated entry');
  assert(rankPrivateSignalTraits([]).length === 0, 'zero V2 evidence produces an empty Private signal list, never a fabricated entry');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL unified core ranking (opposing-pole collapse, Core/Private cross-type exclusion, 7/3 caps, no padding) VALIDATION CHECKS PASSED.');
