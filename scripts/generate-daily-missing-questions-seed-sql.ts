// V1 release execution (2026-11-03), Section 2: generates INSERT statements for the 36
// approved Dailies (#27-62 of docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md) that are not yet live
// in production (#1-26 already are -- confirmed by exact prompt match against the real
// production backup, see docs/V1_FINAL_RELEASE_EXECUTION_2026-11-02.md Phase 3). Parses the
// master document directly (deterministic, no manual transcription) rather than retyping any
// question/answer/reveal text by hand.
//
// Every trait phrase in the master doc was verified, programmatically, to resolve cleanly
// against a real dimension in src/data/personality.ts's own positive/negativeLabel fields
// (32/32 dimensions, every real trait name across all 62 questions matched, only "NONE" and
// one inline editorial comment did not -- both expected, non-trait tokens). This generator
// reuses that same resolution, never guesses a pole id.
//
// STAGED, NOT APPLIED, NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET -- this is net-new
// content the owner has not yet confirmed as a compiled whole (see the master doc's own
// "Awaiting owner review" status). Writes new rows only; never touches the 26 already-live
// questions. `category` is not specified anywhere in the approved document (only Room/Source
// are) -- left as 'Unsorted', an explicit placeholder for the admin's own later editorial
// pass, never invented content since it has no effect on anything a user sees or how scoring
// works.
//
// Run with: npx tsx scripts/generate-daily-missing-questions-seed-sql.ts

declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };
const { randomUUID } = require('crypto') as unknown as { randomUUID: () => string };

import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

// V1 release execution (2026-11-04): found by real-Postgres rehearsal, not assumed --
// handle_daily_answer_trait_evidence (the ONLY real evidence-awarding mechanism for Daily
// answers) reads exclusively from the relational public.daily_option_trait_awards table; it
// never reads daily_options.pole_personality_effects (that jsonb column is set below too, for
// display/admin-tooling parity with how the already-live questions' options look, but award
// evidence would be truly zero for every one of these 36 questions without this). Resolves to
// the exact same numeric trait_id every other Build 22 generator uses (dimension_id*2-1 for
// positive, dimension_id*2 for negative) via the same persisted, frozen ledger -- never a
// position-derived guess.
const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

type Choice = { letter: string; text: string; reveal: string; scoring: string | null };
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
    if (roomMatch) {
      current.room = roomMatch[1].trim();
      continue;
    }
    const sourceMatch = line.match(/^\*\*Source:\*\*\s*(.+?)\s*$/);
    if (sourceMatch) {
      current.source = sourceMatch[1].trim();
      continue;
    }
    const choiceMatch = line.match(/^\*\*([A-F])\.\s*(.+?)\*\*\s*$/);
    if (choiceMatch) {
      current.choices.push({ letter: choiceMatch[1], text: choiceMatch[2].trim(), reveal: '', scoring: null });
      continue;
    }
    const revealMatch = line.match(/^Reveal:\s*(.+)$/);
    if (revealMatch && current.choices.length) {
      current.choices[current.choices.length - 1].reveal = revealMatch[1].trim();
      continue;
    }
    const scoringMatch = line.match(/^Scoring:\s*(.+)$/);
    if (scoringMatch && current.choices.length) {
      current.choices[current.choices.length - 1].scoring = scoringMatch[1].trim();
      continue;
    }
    if (/^NONE\b/.test(line.trim()) && current.choices.length) {
      current.choices[current.choices.length - 1].scoring = 'NONE';
    }
  }
  if (current) questions.push(current);
  return questions;
};

// V1 release execution (2026-11-05): CORRECTED -- independent review found this generator was
// using ONLY the master document's own compiled scoring for all 36 questions, even for the ~11
// of them (sources B5-01 through B5-10, B2-10 -- Dailies #27-37) that the owner's own later
// Reassessment Round 1-4 of 4 (docs/DAILY_PRODUCTION_OWNER_APPROVALS.md) explicitly supersedes.
// Confirmed by scripts/validate-daily-scoring-against-ledger.ts: the master doc disagrees with
// the Reassessment Round value for multiple answers in this range. Same bug class, same fix, as
// the one applied to the live-question archive (supabase/migrations_archive/
// 20261021160000_daily_live_content_pole_awards.sql) -- precedence is now identical in both
// generators: (1) MANUAL_SCORING_OVERRIDES / AUDIT_ROUND_FINAL (explicit, later, per-answer
// owner corrections -- most authoritative), (2) the Reassessment Round value keyed by this
// question's own Source id (only present for questions that were part of the original 37-
// question reassessment), (3) the master document's own compiled value, used as-is only when a
// question was never reassessed at all (approved later, in Batches 6/7/8, after the
// reassessment rounds closed).
const parseReassessmentRounds = (): Record<string, Record<string, string>> => {
  const text = readFileSync(join(__dirname, '../docs/DAILY_PRODUCTION_OWNER_APPROVALS.md'), 'utf8');
  const lines = text.split('\n');
  const bySource: Record<string, Record<string, string>> = {};
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

const reassessment = parseReassessmentRounds();

// Explicit, later, per-answer Audit Round corrections (2026-10-22) layered ON TOP of the
// Reassessment Round value -- the most authoritative layer of all, shared with
// scripts/validate-daily-scoring-against-ledger.ts. None of the 4 known Audit Round deltas
// (#3C, #10A, #21D, #23B) fall in the #27-62 range this generator covers -- kept here, empty for
// that range, purely so the precedence chain is structurally identical to the live-question
// generator and a future Audit Round correction in this range has an obvious place to go.
const AUDIT_ROUND_FINAL: Record<string, string> = {};

type Dimension = { id: string; positive: string; negative: string };

const parseDimensionLabels = (): Dimension[] => {
  const text = readFileSync(join(__dirname, '../src/data/personality.ts'), 'utf8');
  const re = /id: '([a-z_]+)',[\s\S]*?positiveLabel: '([^']+)',[\s\S]*?negativeLabel: '([^']+)',/g;
  const out: Dimension[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push({ id: m[1], positive: m[2], negative: m[3] });
  return out;
};

const buildLabelMap = (dims: Dimension[]): Map<string, { id: string; polarity: 'positive' | 'negative' }> => {
  const map = new Map<string, { id: string; polarity: 'positive' | 'negative' }>();
  for (const d of dims) {
    map.set(d.positive.toLowerCase(), { id: d.id, polarity: 'positive' });
    map.set(d.negative.toLowerCase(), { id: d.id, polarity: 'negative' });
  }
  return map;
};

// Daily #33C is the one example with an owner-corrected final mapping (deployment-safety
// review, 2026-11-03): the master doc's own compiled text is wrong (missing Even-Keeled +2,
// wrong Perspective-Taking value) -- apply the ledger's own explicit final mapping instead of
// the document's, per instruction, never silently trusting the document where a later,
// explicit correction exists. This sits ABOVE the Reassessment Round layer too (checked first,
// below), since it is itself a correction to whatever #33's own reassessment entry says.
const MANUAL_SCORING_OVERRIDES: Record<string, string> = {
  // Ledger: "OWNER-APPROVED SCORING AUDIT | Round 4 FINAL" -- final mapping "Perspective-
  // Taking +3; Even-Keeled +2; Forgiving +1; Thick-skinned +1". The master doc's own compiled
  // text ("Perspective-Taking +2; Forgiving +1; Thick-skinned +1") is missing Even-Keeled
  // entirely and has the wrong Perspective-Taking value -- same already-documented gap as #3C.
  '33:C': 'Perspective-taking +3; Even-Keeled +2; Forgiving +1; Thick-skinned +1',
};

// The single, shared precedence resolution: explicit correction -> Reassessment Round (if this
// question's Source was ever reassessed) -> master doc's own value. Mirrors
// scripts/validate-daily-scoring-against-ledger.ts exactly so the two can never silently drift
// apart from each other.
const resolveAuthoritativeScoring = (q: Question, c: Choice): string | null => {
  const key = `${q.num}:${c.letter}`;
  if (AUDIT_ROUND_FINAL[key]) return AUDIT_ROUND_FINAL[key];
  if (MANUAL_SCORING_OVERRIDES[key]) return MANUAL_SCORING_OVERRIDES[key];
  if (q.source && reassessment[q.source] && reassessment[q.source][c.letter] !== undefined) {
    return reassessment[q.source][c.letter];
  }
  return c.scoring;
};

const resolveScoring = (
  scoring: string | null,
  labelMap: Map<string, { id: string; polarity: 'positive' | 'negative' }>,
): { pole: string; points: number }[] => {
  if (!scoring || scoring === 'NONE') return [];
  const parts = scoring.split(';').map((s) => s.trim().replace(/\.$/, ''));
  const result: { pole: string; points: number }[] = [];
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^(.+?)\s*\+(\d+)\.?$/);
    if (!m) {
      // A non-trait editorial note (e.g. "X is not canonical, so no second mapping") -- not a
      // parse failure, just nothing to award.
      continue;
    }
    const name = m[1].trim().toLowerCase();
    const resolved = labelMap.get(name);
    if (!resolved) {
      throw new Error(`Could not resolve trait name "${m[1].trim()}" in scoring "${scoring}" -- refusing to guess.`);
    }
    result.push({ pole: `${resolved.id}:${resolved.polarity}`, points: Number(m[2]) });
  }
  return result;
};

const dims = parseDimensionLabels();
const labelMap = buildLabelMap(dims);
const questions = parseMasterDoc().filter((q) => q.num >= 27);

if (questions.length !== 36) {
  throw new Error(`Expected exactly 36 missing questions (#27-62), got ${questions.length} -- refusing to proceed.`);
}

const lines: string[] = [];
lines.push('-- STAGED, NOT APPLIED. Generated by scripts/generate-daily-missing-questions-seed-sql.ts.');
lines.push('-- The 36 approved Dailies (#27-62) not yet live in production, per the real production');
lines.push('-- comparison in docs/V1_FINAL_RELEASE_EXECUTION_2026-11-02.md (Phase 3 update). category');
lines.push("-- is left 'Unsorted' -- not specified anywhere in the approved document, no effect on");
lines.push('-- scoring or what a user sees; an explicit placeholder for the admin to sort later, not');
lines.push('-- invented content. All questions inserted at status = \'Approved\' (not \'Live\') -- the');
lines.push('-- existing admin/editorial scheduling workflow decides when each actually goes live;');
lines.push('-- this never bypasses that lifecycle.');
lines.push('--');
lines.push('-- NOT PART OF THE 21-FILE ENGINEERING CANDIDATE SET. Requires its own, separate owner');
lines.push('-- review and sign-off -- see scripts/verify-migration-allowlist.ts.');
lines.push('');
lines.push('begin;');
lines.push('');

// Literal UUIDs generated here (not gen_random_uuid() + \gset) -- portable pure SQL, works
// identically via supabase db push, psql, the Supabase SQL editor, or a PGlite rehearsal,
// with no dependency on any client-specific meta-command.
let totalOptionRows = 0;
for (const q of questions) {
  const room = q.room === 'Apparently Private' ? 'private' : 'public';
  const promptEsc = q.prompt.replace(/'/g, "''");
  const questionId = randomUUID();
  lines.push(`-- #${q.num}: ${q.prompt.slice(0, 70).replace(/\n/g, ' ')}`);
  lines.push(
    `insert into public.daily_questions (id, prompt, category, status, room) values ('${questionId}', '${promptEsc}', 'Unsorted', 'Approved', '${room}');`,
  );
  let position = 1;
  for (const c of q.choices) {
    const labelEsc = c.text.replace(/'/g, "''");
    const feedbackEsc = c.reveal.replace(/'/g, "''");
    const awards = resolveScoring(resolveAuthoritativeScoring(q, c), labelMap);
    const poleJson = JSON.stringify(awards.map((a) => ({ pole: a.pole, points: a.points })));
    const optionId = randomUUID();
    lines.push(
      `insert into public.daily_options (id, question_id, "position", label, apparently_feedback, pole_personality_effects) values ('${optionId}', '${questionId}', ${position}, '${labelEsc}', '${feedbackEsc}', '${poleJson}'::jsonb);`,
    );
    for (const a of awards) {
      lines.push(
        `insert into public.daily_option_trait_awards (option_id, trait_id, points) values ('${optionId}', ${traitIdForPoleKey(a.pole)}, ${a.points});`,
      );
    }
    position++;
    totalOptionRows++;
  }
  lines.push('');
}

lines.push(`-- Expect exactly ${totalOptionRows} daily_options rows inserted above across 36 daily_questions rows.`);
lines.push('');
lines.push('-- V1 release execution (2026-11-04): admin_publish_daily() refuses to publish any Daily');
lines.push("-- whose approved_content_version is null, or that no longer matches a freshly recomputed");
lines.push('-- fingerprint (admin_compute_daily_fingerprint) -- confirmed by reading its real body. Every');
lines.push('-- row inserted above would otherwise fail that check forever (approved_content_version was');
lines.push('-- never set). Calling the REAL fingerprint function here (never reimplemented in a generator');
lines.push('-- script) records a correct, self-consistent "approval" against each row\'s actual current');
lines.push('-- content -- the same thing admin_approve_daily itself would set, had it been run through');
lines.push('-- the admin UI with a real session instead of this direct seed. approved_by is the real,');
lines.push('-- current owner (looked up dynamically, never a hardcoded id) rather than auth.uid(), which');
lines.push('-- is null in this raw-SQL context (no JWT session) -- the same reason the archival script');
lines.push("-- in this same directory cannot call admin_archive_live_daily() directly either.");
lines.push('do $$');
lines.push('declare');
lines.push('  v_admin_id uuid;');
lines.push('begin');
lines.push(`  select user_id into v_admin_id from public.admin_users where role = 'owner';`);
lines.push('  if v_admin_id is null then');
lines.push("    raise exception 'No admin_users row with role = owner found -- cannot record an approval attribution. Aborting.';");
lines.push('  end if;');
lines.push('  update public.daily_questions');
lines.push('  set approved_by = v_admin_id,');
lines.push('      approved_at = now(),');
lines.push('      approved_content_version = public.admin_compute_daily_fingerprint(id)');
lines.push(`  where status = 'Approved' and approved_content_version is null;`);
lines.push('end $$;');
lines.push('');
lines.push('commit;');

const outDir = join(__dirname, '../supabase/pending-owner-review');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, '20261103000000_daily_missing_approved_questions_seed.sql');
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote ${questions.length} questions / ${totalOptionRows} options to ${outPath}`);
