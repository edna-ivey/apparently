// V1 release execution (2026-11-06), item 4: ONE authoritative, machine-readable resolution of
// all 62 owner-approved Dailies, shared by every generator and by the validator that checks
// them -- replacing the previous state where the live-question archive was rebuilt by a
// one-off, uncommitted script and the missing-questions generator carried its own separate
// (and, for a while, inconsistent) copy of this same precedence logic.
//
// Precedence, lowest to highest authority -- applied uniformly to every one of the 62
// questions, never hand-picked per question:
//   1. The master document's own compiled value (docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md) --
//      authoritative ONLY for a question that was never part of the Reassessment Rounds (i.e.
//      approved in a batch after the rounds closed) and REVEAL TEXT for every question (the
//      Reassessment Rounds' own header states "questions, answers and reveals remain
//      unchanged" -- reveals were never in scope for the rescoring).
//   2. The owner's October 21 "Reassessment Round 1-4 of 4" value
//      (docs/DAILY_PRODUCTION_OWNER_APPROVALS.md), keyed by this question's own Source id --
//      supersedes the master document's SCORING for the 37 originally-reassessed Dailies.
//   3. Explicit, later, per-answer Audit Round corrections (2026-10-22 and 2026-11-03) --
//      supersedes everything else for the 5 specific answers they name.
//
// Run the generator (scripts/generate-daily-content-specification.ts) after editing either
// source document to refresh docs/generated/DAILY_V1_CONTENT_SPECIFICATION.json.

declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { loadDimensionIdLedger, resolveDimensionId } from './dimension-id-ledger';

export type Award = { pole: string; traitId: number; points: number };
export type SpecChoice = {
  letter: string;
  text: string;
  reveal: string;
  rawScoring: string | null; // the resolved, authoritative scoring string -- 'NONE' or 'Trait +N; ...'
  isNone: boolean;
  awards: Award[];
};
export type SpecQuestion = {
  num: number;
  prompt: string;
  room: 'Free' | 'Apparently Private' | string;
  source: string | null;
  choices: SpecChoice[];
};

type RawChoice = { letter: string; text: string; reveal: string; scoring: string | null };
type RawQuestion = { num: number; prompt: string; room: string; source: string | null; choices: RawChoice[] };

export const parseMasterDoc = (): RawQuestion[] => {
  const text = readFileSync(join(__dirname, '../../docs/DAILY_MASTER_CONSOLIDATED_REVIEW.md'), 'utf8');
  const lines = text.split('\n');
  const questions: RawQuestion[] = [];
  let current: RawQuestion | null = null;
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
    if (choiceMatch) { current.choices.push({ letter: choiceMatch[1], text: choiceMatch[2].trim(), reveal: '', scoring: null }); continue; }
    const revealMatch = line.match(/^Reveal:\s*(.+)$/);
    if (revealMatch && current.choices.length) { current.choices[current.choices.length - 1].reveal = revealMatch[1].trim(); continue; }
    const scoringMatch = line.match(/^Scoring:\s*(.+)$/);
    if (scoringMatch && current.choices.length) { current.choices[current.choices.length - 1].scoring = scoringMatch[1].trim(); continue; }
    if (/^NONE\b/.test(line.trim()) && current.choices.length) current.choices[current.choices.length - 1].scoring = 'NONE';
  }
  if (current) questions.push(current);
  return questions;
};

export type ReassessmentMap = Record<string, Record<string, string>>;

export const parseReassessmentRounds = (): ReassessmentMap => {
  const text = readFileSync(join(__dirname, '../../docs/DAILY_PRODUCTION_OWNER_APPROVALS.md'), 'utf8');
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

// The single, shared list of explicit, later, per-answer owner corrections -- the most
// authoritative layer of all. Each one was independently confirmed (by direct code/ledger
// reading, not assumed) to supersede both the master document AND that answer's own
// Reassessment Round value. Previously duplicated between the archive-rebuild and the missing-
// questions generator; this is now the one place either is defined.
export const AUDIT_ROUND_FINAL: Record<string, string> = {
  // "OWNER-APPROVED SCORING AUDIT | Round 4 FINAL" (2026-10-22).
  '3:C': 'Trust first +3; Let it play out +2; Even-Keeled +1; Face Value +2',
  '10:A': 'Playful +3; Conflict-forward +2; Competitive +2; Reactive +1; Thick-skinned +3',
  '21:D': 'Blunt +2; Conflict-forward +2; Thick-skinned +1',
  '23:B': 'Accountability +2; Rule-oriented +3',
  // Deployment-safety review (2026-11-03): the master document's own compiled text for #33C is
  // missing "Even-Keeled +2" entirely and has the wrong Perspective-Taking value -- same gap
  // class as #3C, same fix.
  '33:C': 'Perspective-taking +3; Even-Keeled +2; Forgiving +1; Thick-skinned +1',
};

export const normalizeScoringString = (s: string | null): string => {
  if (!s || /^NONE/i.test(s)) return 'NONE';
  return s
    .split(';')
    .map((p) => p.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .sort()
    .join('; ');
};

// Resolves the one authoritative scoring string for a given question/letter, per the precedence
// documented at the top of this file. Pure, deterministic, no I/O beyond what the caller
// already loaded.
export const resolveAuthoritativeScoring = (
  q: Pick<RawQuestion, 'num' | 'source'>,
  c: Pick<RawChoice, 'letter' | 'scoring'>,
  reassessment: ReassessmentMap,
): string | null => {
  const key = `${q.num}:${c.letter}`;
  if (AUDIT_ROUND_FINAL[key]) return AUDIT_ROUND_FINAL[key];
  if (q.source && reassessment[q.source] && reassessment[q.source][c.letter] !== undefined) {
    return reassessment[q.source][c.letter];
  }
  return c.scoring;
};

type Dimension = { id: string; positive: string; negative: string };

const parseDimensionLabels = (): Dimension[] => {
  const text = readFileSync(join(__dirname, '../../src/data/personality.ts'), 'utf8');
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

const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

export const resolveAwards = (
  scoring: string | null,
  labelMap: Map<string, { id: string; polarity: 'positive' | 'negative' }>,
): Award[] => {
  if (!scoring || /^NONE/i.test(scoring)) return [];
  const parts = scoring.split(';').map((s) => s.trim().replace(/\.$/, ''));
  const result: Award[] = [];
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^(.+?)\s*\+(\d+)\.?$/);
    if (!m) continue; // a non-trait editorial note -- nothing to award.
    const name = m[1].trim().toLowerCase();
    const resolved = labelMap.get(name);
    if (!resolved) {
      throw new Error(`Could not resolve trait name "${m[1].trim()}" in scoring "${scoring}" -- refusing to guess.`);
    }
    const pole = `${resolved.id}:${resolved.polarity}`;
    result.push({ pole, traitId: traitIdForPoleKey(pole), points: Number(m[2]) });
  }
  return result;
};

// Builds the complete, resolved specification for all 62 approved Dailies. Deterministic: same
// two source documents in, same specification out, every time.
export const buildAuthoritativeDailySpec = (): SpecQuestion[] => {
  const master = parseMasterDoc();
  const reassessment = parseReassessmentRounds();
  const labelMap = buildLabelMap(parseDimensionLabels());

  if (master.length !== 62) {
    throw new Error(`Expected exactly 62 questions in the master document, found ${master.length} -- refusing to build a specification from an unexpected shape.`);
  }

  return master.map((q) => ({
    num: q.num,
    prompt: q.prompt,
    room: q.room,
    source: q.source,
    choices: q.choices.map((c) => {
      const rawScoring = resolveAuthoritativeScoring(q, c, reassessment);
      const isNone = normalizeScoringString(rawScoring) === 'NONE';
      return {
        letter: c.letter,
        text: c.text,
        reveal: c.reveal,
        rawScoring,
        isNone,
        awards: resolveAwards(rawScoring, labelMap),
      };
    }),
  }));
};
