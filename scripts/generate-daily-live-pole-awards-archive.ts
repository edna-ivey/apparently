// V1 release execution (2026-11-06), item 4: regenerates
// supabase/migrations_archive/20261021160000_daily_live_content_pole_awards.sql deterministically
// from scripts/lib/daily-content-spec.ts (the single authoritative scoring resolution) and
// docs/generated/live_daily_option_id_map.json (a committed, one-time snapshot of which real
// production option id corresponds to which approved question/letter -- derived from the real
// production backup taken 2026-11-03, see docs/generated/live_daily_option_id_map.json's own
// generation note).
//
// CLOSES A GAP from earlier this release cycle: the archive file's prior from-scratch rebuild
// (2026-11-05) was computed by a one-off, uncommitted Node script -- correct at the time, but
// not re-derivable by anyone re-running this engagement's own tooling, which is exactly the
// kind of silent-drift risk item 4 asks to eliminate. This script is that rebuild, made
// permanent and re-runnable: same authoritative spec, same live-option-id map, same output,
// every time.
//
// Only emits an UPDATE for an option whose authoritative scoring is non-NONE -- an option with
// no entry here has zero daily_option_trait_awards rows once the real seed migration
// (20261028060000, generated separately from this file) is regenerated, which is the correct
// representation of an intentional NONE answer (see item 3's own fix for why a merely-absent
// entry is not enough by itself -- pole_personality_effects must also explicitly read '[]' for
// any option this script does not touch, which is already true for every live option that was
// never set otherwise; this script only ever adds entries, never needs to clear one).
//
// Run with: npx tsx scripts/generate-daily-live-pole-awards-archive.ts

declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { buildAuthoritativeDailySpec } from './lib/daily-content-spec';

type LiveOptionMapEntry = {
  num: number;
  source: string | null;
  questionId: string;
  options: { letter: string; optionId: string; position: number; label: string }[];
};

const liveMap: LiveOptionMapEntry[] = JSON.parse(
  readFileSync(join(__dirname, '../docs/generated/live_daily_option_id_map.json'), 'utf8'),
).questions;

if (liveMap.length !== 26) {
  throw new Error(`Expected exactly 26 live questions in the option-id map, found ${liveMap.length} -- refusing to proceed.`);
}

const spec = buildAuthoritativeDailySpec();
const specByNum = new Map(spec.map((q) => [q.num, q]));

const lines: string[] = [];
lines.push('-- SUPERSEDED (Build 22, 2026-10-28). Never applied directly -- the jsonb string-pole');
lines.push('-- pole_personality_effects column this file populates is replaced by the numeric');
lines.push('-- daily_option_trait_awards relational table (20261028050000_daily_trait_identity_and_');
lines.push('-- rotation_fix.sql), which is what handle_daily_answer_trait_evidence actually reads at');
lines.push('-- answer time (confirmed by reading its real body, not assumed). This file is no longer');
lines.push('-- applied as a migration; it exists as the generated SOURCE');
lines.push('-- scripts/generate-daily-trait-awards-seed-sql.ts reads to produce the real seed migration');
lines.push('-- (20261028060000) -- edit the source documents + scripts/lib/daily-content-spec.ts, then');
lines.push('-- regenerate via scripts/generate-daily-live-pole-awards-archive.ts; never hand-edit this');
lines.push('-- file directly.');
lines.push('--');
lines.push('-- GENERATED (V1 release execution, 2026-11-06) by');
lines.push('-- scripts/generate-daily-live-pole-awards-archive.ts, from scripts/lib/daily-content-spec.ts');
lines.push('-- (the single authoritative scoring resolution, shared with the 36-missing-questions');
lines.push('-- generator and the content validator) and docs/generated/live_daily_option_id_map.json');
lines.push('-- (a committed snapshot of real production option ids). Replaces an earlier from-scratch');
lines.push('-- rebuild that used the identical precedence but was computed by a one-off, uncommitted');
lines.push('-- script -- this version is permanent and re-derivable by anyone, closing that gap.');
lines.push('--');
lines.push('-- Re-verifiable any time with: npx tsx scripts/validate-daily-content-against-specification.ts');
lines.push('');

let statementCount = 0;
for (const entry of liveMap) {
  const specQuestion = specByNum.get(entry.num);
  if (!specQuestion) {
    throw new Error(`Live question #${entry.num} (${entry.questionId}) has no corresponding specification entry -- aborting.`);
  }
  lines.push(`-- #${entry.num}: ${specQuestion.prompt.slice(0, 70).replace(/\n/g, ' ')}`);
  for (const opt of entry.options) {
    const choice = specQuestion.choices.find((c) => c.letter === opt.letter);
    if (!choice) {
      throw new Error(`Live question #${entry.num} option ${opt.letter} has no corresponding choice in the specification -- aborting.`);
    }
    if (choice.awards.length === 0) continue; // intentional NONE -- no UPDATE needed, see header.
    const poleJson = JSON.stringify(choice.awards.map((a) => ({ pole: a.pole, points: a.points })));
    lines.push(`update public.daily_options set pole_personality_effects = '${poleJson}'::jsonb where id = '${opt.optionId}';`);
    statementCount++;
  }
  lines.push('');
}

const outPath = join(__dirname, '../supabase/migrations_archive/20261021160000_daily_live_content_pole_awards.sql');
writeFileSync(outPath, lines.join('\n').replace(/\n+$/, '\n'));
console.log(`Wrote ${statementCount} UPDATE statements (of ${liveMap.reduce((s, e) => s + e.options.length, 0)} total live options) to ${outPath}`);
