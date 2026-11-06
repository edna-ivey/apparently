// V1 release execution (2026-11-05): a standing, re-runnable diagnostic that documents, for a
// human reviewer, every place docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md's own compiled scoring
// disagrees with the owner's later, authoritative approval (a Reassessment Round value, or an
// Audit Round correction on top of it). Not the release gate itself -- that is
// scripts/validate-daily-content-against-specification.ts, which compares the ACTUAL generated
// SQL against scripts/lib/daily-content-spec.ts's resolution exactly (trait identities and
// points, not sums). This script answers a narrower, database-independent question: "does the
// master document itself still disagree with the ledger, and by how much" -- useful context
// when reviewing a diff to either source document, but it has no way to see what any generator
// actually emitted.
//
// CORRECTED (V1 release execution, 2026-11-06), item 4: previously duplicated its own copy of
// the master-doc parser, the Reassessment Round parser, and the Audit Round correction list --
// the exact kind of drift risk item 4 was raised to close. Now imports all of it from
// scripts/lib/daily-content-spec.ts, the one place this precedence is defined.
//
// Run with: npx tsx scripts/validate-daily-scoring-against-ledger.ts

import {
  parseMasterDoc,
  parseReassessmentRounds,
  resolveAuthoritativeScoring,
  normalizeScoringString,
  AUDIT_ROUND_FINAL,
} from './lib/daily-content-spec';

const master = parseMasterDoc();
const reassessment = parseReassessmentRounds();

let checked = 0;
let diverged = 0;
const divergences: string[] = [];
for (const q of master) {
  if (!q.source || !reassessment[q.source]) continue; // never reassessed -- master doc is authoritative here, nothing to cross-check
  for (const c of q.choices) {
    const key = `${q.num}:${c.letter}`;
    if (!(key in AUDIT_ROUND_FINAL) && reassessment[q.source][c.letter] === undefined) continue;
    const authoritative = resolveAuthoritativeScoring(q, c, reassessment);
    const masterNorm = normalizeScoringString(c.scoring);
    const authNorm = normalizeScoringString(authoritative);
    checked++;
    if (masterNorm !== authNorm) {
      diverged++;
      divergences.push(`#${q.num}${c.letter} (${q.source}): master="${masterNorm}" | AUTHORITATIVE="${authNorm}"`);
    }
  }
}

console.log(`Cross-checked ${checked} answer-level scoring entries (every question with a Reassessment Round entry) against the master document.`);
console.log(`DIVERGE count: ${diverged} -- the master document's own compiled scoring does NOT match the owner's later, authoritative approval for these answers:\n`);
for (const d of divergences) console.log('  ' + d);

// diverged === 0 is NOT the expected steady state and never will be. The master document
// itself is never going to be edited to match the Reassessment Rounds (the rounds corrected
// the LEDGER, not the document); every question that was ever reassessed will show up here,
// permanently, every time this script runs. That is fine -- it is a reading list for a human,
// never a database check -- as long as scripts/validate-daily-content-against-specification.ts
// (which DOES check the actual generated SQL) passes. A known, stable baseline count is
// tracked below specifically so a FUTURE run that finds a DIFFERENT count (a new reassessment
// entry added to the ledger, or one removed) gets flagged for a human to check against the
// real validator again.
const KNOWN_DIVERGENCE_COUNT = 100;
if (diverged === KNOWN_DIVERGENCE_COUNT) {
  console.log(`\n${diverged} divergences matches the known, already-accounted-for baseline (questions #3-#37, every originally-reassessed Daily -- #12 and #13 included in this count from the start, since this diagnostic compares by Source id regardless of live/not-yet-live status; what was actually missing for those two was the live archive's own UPDATE statements, a separate bug fixed in scripts/generate-daily-live-pole-awards-archive.ts, not something this diagnostic's count would ever reflect). scripts/validate-daily-content-against-specification.ts confirms both real generators resolve to the AUTHORITATIVE value, not the master document's, for every one of these -- this count itself is expected to stay nonzero forever and is not a failure on its own.`);
} else {
  console.log(`\nWARNING: divergence count ${diverged} does NOT match the known baseline of ${KNOWN_DIVERGENCE_COUNT}. Either docs/DAILY_PRODUCTION_OWNER_APPROVALS.md or docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md changed since this baseline was recorded. STOP and re-run scripts/validate-daily-content-against-specification.ts (the real gate) before trusting either real generator's output.`);
}
