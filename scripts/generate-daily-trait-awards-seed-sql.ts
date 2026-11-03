// Generates the actual numeric daily_option_trait_awards SEED (not just the table/trigger
// infrastructure, which 20261028050000 provides) -- Build 22 item 6: "the new
// daily_option_trait_awards table currently has no initial mapping seed." Source: the
// already-reviewed 60 option->award mappings hand-authored in
// supabase/migrations/20261021160000_daily_live_content_pole_awards.sql (real production
// option ids, cross-checked against live personality_effects when originally written -- see
// that file's own header). Resolves each string pole key to its numeric trait_id via the
// same deterministic formula every other Build 22 generator uses.
//
// STAGED, NOT APPLIED. Run with: npx tsx scripts/generate-daily-trait-awards-seed-sql.ts

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void };
declare const __dirname: string;
const { writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { readDailyOptionPoleAwards } from './lib/daily-pole-award-rows';
import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

// Build 22 owner audit (2026-11-01), item 2: dimension_id must come from the SAME persisted
// ledger every other generator uses -- never recomputed from PERSONALITY_DIMENSIONS array
// position. resolveDimensionId is READ-ONLY: a dimension missing from the ledger here means
// the ledger is stale, not a license to mint a new id in a Daily-award generator.
const dimensionIdLedger = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedger, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

const optionAwards = readDailyOptionPoleAwards();
const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

const rows: { optionId: string; traitId: number; points: number }[] = [];
for (const option of optionAwards) {
  for (const award of option.awards) {
    rows.push({ optionId: option.optionId, traitId: traitIdForPoleKey(award.pole), points: award.points });
  }
}
if (rows.length === 0) {
  throw new Error('No Daily award rows parsed -- refusing to write an empty seed.');
}

const valuesSql = rows.map((r) => `('${escapeLiteral(r.optionId)}', ${r.traitId}, ${r.points})`).join(',\n  ');
const distinctOptions = new Set(rows.map((r) => r.optionId)).size;

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
-- PREREQUISITE: 20261028010000 (trait catalog) and 20261028050000 (daily_option_trait_awards
-- table) must both be applied first.
--
-- Numeric Daily trait-award SEED -- ${rows.length} rows across ${distinctOptions} real, live
-- daily_options rows. Source: supabase/migrations/20261021160000_daily_live_content_pole_
-- awards.sql's already-reviewed hand-authored mapping (never applied as jsonb; transcribed
-- here numerically). Resolves each string pole key to its numeric trait_id via the same
-- deterministic dimension-order formula every other Build 22 generator uses.
--
-- Generated mechanically by scripts/generate-daily-trait-awards-seed-sql.ts -- do not hand-
-- edit; regenerate if the source mapping changes.
--
-- VERIFICATION GUARD: raises if the actual row count inserted does not match ${rows.length} --
-- protects against applying this against a database where any of these specific option ids
-- no longer exist (same guard pattern 20261021160000 itself already used).
-- ============================================================================================

do $$
declare
  v_inserted integer;
begin
  with inserted as (
    insert into public.daily_option_trait_awards (option_id, trait_id, points)
    values
      ${valuesSql}
    on conflict (option_id, trait_id) do nothing
    returning 1
  )
  select count(*) into v_inserted from inserted;

  if v_inserted <> ${rows.length} then
    raise exception 'Expected to insert exactly ${rows.length} daily_option_trait_awards rows, inserted %. Aborting -- do not partially apply.', v_inserted;
  end if;
end $$;
`;

const outputPath = join(__dirname, '..', 'supabase', 'migrations', '20261028060000_daily_trait_awards_seed.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${rows.length} daily_option_trait_awards rows (${distinctOptions} options) to ${outputPath}`);
