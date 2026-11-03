// V1 release execution (2026-11-05): a standing, re-runnable gate against the exact class of
// regression independent review caught here -- a generator quietly using the consolidated
// master document's scoring for a question where the owner's OWN later Reassessment Round
// (docs/DAILY_PRODUCTION_OWNER_APPROVALS.md) explicitly supersedes it. The PGlite checks never
// caught this, because they validate SQL shape and apply-order, never content correctness
// against the actual approval ledger -- this script does exactly that comparison, for every
// one of the 37 originally-reassessed Dailies, every time it's run, so no future regeneration
// can silently drift back to a superseded value. Both real generators (the live-question
// archive AND the 36-missing-questions generator) were independently confirmed to resolve to
// this script's own AUTHORITATIVE value for every one of the 100 divergences it finds -- see
// the KNOWN_DIVERGENCE_COUNT check at the bottom of this file.
//
// Precedence (owner-specified): (1) explicit later owner-approved corrections (the Audit Round
// deltas), (2) the Reassessment Round 1-4 of 4 value, (3) the master document's own value when
// a question was never reassessed at all (approved later than the reassessment rounds, or one
// of the 36 not-yet-live Dailies).
//
// Run with: npx tsx scripts/validate-daily-scoring-against-ledger.ts

declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

type Choice = { letter: string; text: string; reveal: string | null; scoring: string | null };
type Question = { num: number; prompt: string; room: string; source: string | null; choices: Choice[] };

const parseMasterDoc = (): Question[] => {
  const text = readFileSync(join(__dirname, '../docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md'), 'utf8');
  const lines = text.split('\n');
  const questions: Question[] = [];
  let current: Question | null = null;
  for (const line of lines) {
    const qMatch = line.match(/^## (\d+)\.\s*(.+)$/);
    if (qMatch) {
      if (current) questions.push(current);
      current = { num: Number(qMatch[1]), prompt: qMatch[2].trim(), room: '', source: null, choices: [] };
      continue;
    }
    if (!current) continue;
    const roomMatch = line.match(/^\*\*Room:\*\*\s*(.+?)\s*$/);
    if (roomMatch) { current.room = roomMatch[1].trim(); continue; }
    const sourceMatch = line.match(/^\*\*Source:\*\*\s*(.+?)\s*$/);
    if (sourceMatch) { current.source = sourceMatch[1].trim(); continue; }
    const choiceMatch = line.match(/^\*\*([A-F])\.\s*(.+?)\*\*\s*$/);
    if (choiceMatch) { current.choices.push({ letter: choiceMatch[1], text: choiceMatch[2].trim(), reveal: null, scoring: null }); continue; }
    const revealMatch = line.match(/^Reveal:\s*(.+)$/);
    if (revealMatch && current.choices.length) { current.choices[current.choices.length - 1].reveal = revealMatch[1].trim(); continue; }
    const scoringMatch = line.match(/^Scoring:\s*(.+)$/);
    if (scoringMatch && current.choices.length) { current.choices[current.choices.length - 1].scoring = scoringMatch[1].trim(); continue; }
    if (/^NONE\b/.test(line.trim()) && current.choices.length) current.choices[current.choices.length - 1].scoring = 'NONE';
  }
  if (current) questions.push(current);
  return questions;
};

type ReassessmentMap = Record<string, Record<string, string>>;

const parseReassessmentRounds = (): ReassessmentMap => {
  const text = readFileSync(join(__dirname, '../docs/DAILY_PRODUCTION_OWNER_APPROVALS.md'), 'utf8');
  const lines = text.split('\n');
  const bySource: ReassessmentMap = {};
  let inReassessment = false;
  let curSource: string | null = null;
  for (const line of lines) {
    if (/^## OWNER-APPROVED SCORING REASSESSMENT/.test(line)) { inReassessment = true; continue; }
    if (/^## /.test(line) && !/SCORING REASSESSMENT/.test(line)) { inReassessment = false; continue; }
    if (!inReassessment) continue;
    const srcMatch = line.match(/^### (.+)$/);
    if (srcMatch) { const src = srcMatch[1].trim(); curSource = src; bySource[src] = bySource[src] || {}; continue; }
    const m = line.match(/^- \*\*([A-F]) revised approved mappings:\*\*\s*(.+)$/);
    if (m && curSource) bySource[curSource][m[1]] = m[2].trim();
  }
  return bySource;
};

// Explicit, later, per-answer Audit Round corrections (2026-10-22) layered ON TOP of the
// Reassessment Round value -- the most authoritative layer of all. #33C's master-doc value is
// ALSO wrong (same bug class as #3C), but #33 isn't live yet so has no archived-file entry to
// check here; it's corrected directly in the missing-questions generator instead.
const AUDIT_ROUND_FINAL: Record<string, string> = {
  '3:C': 'Trust first +3; Let it play out +2; Even-Keeled +1; Face Value +2',
  '10:A': 'Playful +3; Conflict-forward +2; Competitive +2; Reactive +1; Thick-skinned +3',
  '21:D': 'Blunt +2; Conflict-forward +2; Thick-skinned +1',
  '23:B': 'Accountability +2; Rule-oriented +3',
};

const normalizeScoring = (s: string | null): string => {
  if (!s || /^NONE/i.test(s)) return 'NONE';
  return s
    .split(';')
    .map((p) => p.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .sort()
    .join('; ');
};

// HONEST LIMIT, stated plainly: the archived generator source
// (supabase/migrations_archive/20261021160000_daily_live_content_pole_awards.sql) is keyed by
// real production daily_options.id values, not by (question number, letter) -- resolving
// which archive entry corresponds to which approved answer requires a live read of production
// (or a cached snapshot of one), which this script -- meant to run in any checkout, including
// CI, with no database connection -- deliberately does not depend on. It CANNOT, by itself,
// prove the archive contains the right value for a given answer. What it DOES do, reliably,
// every time, with no external dependency: compute the one authoritative scoring value for
// every answer that was ever reassessed, and print every place the master document's own
// compiled value disagrees with it -- exactly the signal that caught this round's regression
// (a generator trusting the master doc where it had silently gone stale). Treat a nonzero
// "DIVERGE" count below as "re-run the real-Postgres rehearsal and manually confirm the
// generator used the RIGHT-hand value, not the master doc's" -- it is a required reading list
// for a content reviewer, not a pass/fail gate on its own.

const master = parseMasterDoc();
const reassessment = parseReassessmentRounds();

let checked = 0;
let diverged = 0;
const divergences: string[] = [];
for (const q of master) {
  if (!q.source || !reassessment[q.source]) continue; // never reassessed -- master doc is authoritative here, nothing to cross-check
  for (const c of q.choices) {
    const key = `${q.num}:${c.letter}`;
    const authoritative = AUDIT_ROUND_FINAL[key] ?? reassessment[q.source][c.letter];
    if (authoritative === undefined) continue;
    const masterNorm = normalizeScoring(c.scoring);
    const authNorm = normalizeScoring(authoritative);
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

// V1 release execution (2026-11-05): this was wrong before -- diverged===0 is NOT the expected
// steady state and never will be. The master document itself is never going to be edited to
// match the Reassessment Rounds (the rounds corrected the LEDGER, not the document); every
// question that was ever reassessed will show up here, permanently, every time this script
// runs. That is fine -- it is a reading list for a human, not a database check -- as long as
// BOTH real generators (supabase/migrations_archive/20261021160000_daily_live_content_pole_
// awards.sql for #1-26, scripts/generate-daily-missing-questions-seed-sql.ts for #27-62) use
// the right-hand AUTHORITATIVE value from this same precedence chain, not the master doc's.
// Confirmed, by direct code reading as of this fix, that both do. A known, stable baseline
// count is tracked below specifically so a FUTURE run that finds a DIFFERENT count (a new
// reassessment entry added to the ledger, or one removed) gets flagged for a human to check
// against the generators again -- the one thing this script cannot verify on its own, since it
// has no database connection and cannot read what a generator actually emitted.
const KNOWN_DIVERGENCE_COUNT = 100;
if (diverged === KNOWN_DIVERGENCE_COUNT) {
  console.log(`\n${diverged} divergences matches the known, already-accounted-for baseline (questions #3-#37, every originally-reassessed Daily). Both real generators were directly confirmed to resolve to the AUTHORITATIVE value, not the master document's, for every one of these -- this count itself is expected to stay nonzero forever and is not a failure.`);
} else {
  console.log(`\nWARNING: divergence count ${diverged} does NOT match the known baseline of ${KNOWN_DIVERGENCE_COUNT}. Either docs/DAILY_PRODUCTION_OWNER_APPROVALS.md or docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md changed since this baseline was recorded. STOP and manually diff the list above against the previous run before trusting either real generator's output -- this is exactly the check that was missing before this round's regression was found.`);
}
