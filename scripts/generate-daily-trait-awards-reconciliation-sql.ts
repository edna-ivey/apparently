// Build 22 Daily mapping coverage fix (owner audit, 2026-10-30): the 60-option seed
// (20261028060000) only covers the ORIGINAL canonical option rows reviewed when it was
// authored. Every daily_questions row that is a RECURRENCE CLONE of one of those canonical
// questions (recurrence_source_id is not null) got its own, DIFFERENT option row ids when it
// was cloned -- including, confirmed directly against live Supabase, the CURRENT Live Public
// occurrence, whose canonical source IS in the seed but whose own live option ids are not.
// The CURRENT Live Private occurrence's canonical source has zero V1 personality_effects on
// any option (confirmed: genuinely ROOM_ONLY, never approved for any mapping) -- correctly
// excluded, not a gap.
//
// This script reconciles every EXISTING clone (historical or currently Live) of an approved
// canonical question by copying the canonical question's trait awards onto each clone's own
// option rows, matched by `position` (clones preserve their source's position/label exactly --
// see advance_daily_rotation's own INSERT...SELECT). This is reconstruction from the same
// approved mapping already reviewed for the canonical row, not a new content decision -- no
// mapping is invented for any canonical question that was never reviewed (i.e. has zero
// entries in the seed to begin with).
//
// Inputs: read-only `daily_questions`/`daily_options` query output (already fetched).
// NEVER connects to any database. Run with:
//   npx tsx scripts/generate-daily-trait-awards-reconciliation-sql.ts <questions.json> <options.json> <output-sql-path>

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void };
declare const process: { argv: string[]; exit: (code: number) => void };
const { readFileSync, writeFileSync } = require('fs');

import { readDailyOptionPoleAwards } from './lib/daily-pole-award-rows';
import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

type DailyQuestionRow = { id: string; recurrence_source_id: string | null; status: string; room: string };
type DailyOptionRow = { id: string; question_id: string; position: number; label: string };

const readJsonRows = <T>(path: string): T[] => {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).rows as T[];
};

const [, , questionsPath, optionsPath, outputSqlPath] = process.argv;
if (!questionsPath || !optionsPath || !outputSqlPath) {
  console.error('Usage: npx tsx scripts/generate-daily-trait-awards-reconciliation-sql.ts <questions.json> <options.json> <output-sql-path>');
  process.exit(1);
}

const questions = readJsonRows<DailyQuestionRow>(questionsPath);
const options = readJsonRows<DailyOptionRow>(optionsPath);
// Build 22 owner audit (2026-11-01), item 2: same ledger-backed, read-only resolution as
// every other generator -- never recomputed from PERSONALITY_DIMENSIONS array position.
const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

// Canonical awards by (canonical_question_id, position) -- derived from the already-seeded
// option ids, joined back to their question+position via the real options list.
const optionById = new Map(options.map((o) => [o.id, o] as const));
const seedAwardsByOption = new Map<string, { pole: string; points: number }[]>();
for (const row of readDailyOptionPoleAwards()) {
  seedAwardsByOption.set(row.optionId, row.awards);
}
const canonicalAwardsByPosition = new Map<string, { pole: string; points: number }[]>(); // key: `${questionId}::${position}`
for (const [optionId, awards] of seedAwardsByOption) {
  const option = optionById.get(optionId);
  if (!option) continue; // seeded option no longer exists live -- skip, not an error here.
  canonicalAwardsByPosition.set(`${option.question_id}::${option.position}`, awards);
}

// Canonical label by (canonical_question_id, position) -- owner audit, 2026-10-30: "verify
// cloned Daily choices match their canonical approved choices before inheriting mappings."
// Inheriting by position alone is only correct if the clone's option at that position is
// actually the SAME authored content as the canonical's -- if either was edited after the
// clone was made, position-matching would silently apply the wrong trait awards to
// different wording. Checked here, not assumed.
const canonicalLabelByPosition = new Map<string, string>();
for (const option of options) {
  canonicalLabelByPosition.set(`${option.question_id}::${option.position}`, option.label);
}

const optionsByQuestion = new Map<string, DailyOptionRow[]>();
for (const o of options) {
  const list = optionsByQuestion.get(o.question_id) ?? [];
  list.push(o);
  optionsByQuestion.set(o.question_id, list);
}

const rows: { optionId: string; traitId: number; points: number }[] = [];
let reconciledQuestions = 0;
let skippedAlreadySeeded = 0;
let skippedUnmappedCanonical = 0;
let skippedLabelMismatch = 0;

for (const question of questions) {
  // Skip the canonical rows themselves -- already in the original seed (20261028060000);
  // this script only reconciles CLONES (recurrence_source_id is not null).
  if (question.recurrence_source_id === null) continue;

  const canonicalId = question.recurrence_source_id;
  const cloneOptions = optionsByQuestion.get(question.id) ?? [];
  let anyMapped = false;
  for (const option of cloneOptions) {
    const canonicalAwards = canonicalAwardsByPosition.get(`${canonicalId}::${option.position}`);
    if (!canonicalAwards || canonicalAwards.length === 0) continue;
    if (seedAwardsByOption.has(option.id)) continue; // already directly seeded -- do not double up.

    const canonicalLabel = canonicalLabelByPosition.get(`${canonicalId}::${option.position}`);
    if (canonicalLabel !== undefined && canonicalLabel !== option.label) {
      // The clone's wording at this position no longer matches its canonical source --
      // content was edited after cloning. Inheriting by position would silently attach the
      // WRONG trait awards to different wording. Skip, never guess.
      skippedLabelMismatch += 1;
      continue;
    }

    anyMapped = true;
    for (const award of canonicalAwards) {
      rows.push({ optionId: option.id, traitId: traitIdForPoleKey(award.pole), points: award.points });
    }
  }
  if (anyMapped) reconciledQuestions += 1;
  else if (seedAwardsByOption.has(cloneOptions[0]?.id)) skippedAlreadySeeded += 1;
  else skippedUnmappedCanonical += 1;
}

if (rows.length === 0) {
  throw new Error('No reconciliation rows produced -- refusing to write an empty file.');
}

const escapeLiteral = (v: string) => v.replace(/'/g, "''");
const valuesSql = rows.map((r) => `('${escapeLiteral(r.optionId)}', ${r.traitId}, ${r.points})`).join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
-- PREREQUISITE: 20261028010000 (trait catalog), 20261028050000 (daily_option_trait_awards
-- table), and 20261028060000 (original 60-option canonical seed) must all be applied first.
--
-- Daily mapping COVERAGE reconciliation (owner audit, 2026-10-30): carries each already-
-- approved canonical question's trait awards onto every historical/current recurrence CLONE
-- of it (matched by position, which clones always preserve) -- including the CURRENT Live
-- Public occurrence, confirmed directly against live Supabase to need exactly this. Produces
-- ${rows.length} rows across ${reconciledQuestions} reconciled clone questions. ${skippedUnmappedCanonical} clone question(s)
-- skipped because their canonical source has no approved mapping at all (confirmed: the
-- current Live Private occurrence's canonical source has zero V1 personality_effects on any
-- option -- genuinely ROOM_ONLY, never invented a mapping for it).
--
-- Idempotent: ON CONFLICT DO NOTHING (option_id, trait_id is the table's own PK).
-- ============================================================================================

insert into public.daily_option_trait_awards (option_id, trait_id, points) values
  ${valuesSql}
on conflict (option_id, trait_id) do nothing;
`;

writeFileSync(outputSqlPath, sql);
console.log(`Reconciled ${reconciledQuestions} clone questions (${rows.length} rows); ${skippedAlreadySeeded} already directly seeded; ${skippedUnmappedCanonical} skipped (canonical source genuinely unmapped); ${skippedLabelMismatch} skipped (clone's wording no longer matches its canonical source -- content edited since cloning, never guessed).`);
