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

type Choice = { letter: string; text: string; reveal: string; scoring: string | null };
type Question = { num: number; prompt: string; room: string; choices: Choice[] };

const parseMasterDoc = (): Question[] => {
  const text = readFileSync(join(__dirname, '../docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md'), 'utf8');
  const lines = text.split('\n');
  const questions: Question[] = [];
  let current: Question | null = null;
  for (const line of lines) {
    const qMatch = line.match(/^## (\d+)\.\s*(.+)$/);
    if (qMatch) {
      if (current) questions.push(current);
      current = { num: Number(qMatch[1]), prompt: qMatch[2].trim(), room: '', choices: [] };
      continue;
    }
    if (!current) continue;
    const roomMatch = line.match(/^\*\*Room:\*\*\s*(.+?)\s*$/);
    if (roomMatch) {
      current.room = roomMatch[1].trim();
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
// explicit correction exists.
const MANUAL_SCORING_OVERRIDES: Record<string, string> = {
  // Ledger: "OWNER-APPROVED SCORING AUDIT | Round 4 FINAL" -- final mapping "Perspective-
  // Taking +3; Even-Keeled +2; Forgiving +1; Thick-skinned +1". The master doc's own compiled
  // text ("Perspective-Taking +2; Forgiving +1; Thick-skinned +1") is missing Even-Keeled
  // entirely and has the wrong Perspective-Taking value -- same already-documented gap as #3C.
  '33:C': 'Perspective-taking +3; Even-Keeled +2; Forgiving +1; Thick-skinned +1',
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
    const awards = resolveScoring(MANUAL_SCORING_OVERRIDES[`${q.num}:${c.letter}`] ?? c.scoring, labelMap);
    const poleJson = JSON.stringify(awards.map((a) => ({ pole: a.pole, points: a.points })));
    lines.push(
      `insert into public.daily_options (id, question_id, "position", label, apparently_feedback, pole_personality_effects) values ('${randomUUID()}', '${questionId}', ${position}, '${labelEsc}', '${feedbackEsc}', '${poleJson}'::jsonb);`,
    );
    position++;
    totalOptionRows++;
  }
  lines.push('');
}

lines.push(`-- Expect exactly ${totalOptionRows} daily_options rows inserted above across 36 daily_questions rows.`);
lines.push('commit;');

const outDir = join(__dirname, '../supabase/pending-owner-review');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, '20261103000000_daily_missing_approved_questions_seed.sql');
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote ${questions.length} questions / ${totalOptionRows} options to ${outPath}`);
