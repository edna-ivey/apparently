// Generates the numeric personality trait catalog migration -- Build 22 data-integrity
// correction: scoring/evidence tables must use numeric dimension_id/trait_id, never the old
// string poleId ('forgiving_receipts:positive').
//
// CORRECTED (owner audit, 2026-10-30, item 6, CRITICAL): dimension_id was previously assigned
// from PERSONALITY_DIMENSIONS' own array POSITION (`index + 1`) -- stable only as long as
// nothing is ever reordered, inserted in the middle, or removed. A real content edit doing any
// of those would silently reassign every dimension_id (and trait_id, derived from it) after
// the change point, corrupting the meaning of every already-persisted user_trait_evidence/
// user_trait_totals/creature_published_recipes row with no error anywhere. Fixed: dimension_id
// is now resolved through a PERSISTED LEDGER (scripts/lib/dimension-id-ledger.ts/.json, same
// pattern already proven for quiz/question/choice ids in content-id-ledger.ts) -- an existing
// dimension always gets its already-recorded id back regardless of array position; only a
// genuinely new dimension gets a new, strictly-increasing id. trait_id stays a pure function
// of dimension_id (dimension_id*2-1 positive / dimension_id*2 negative) -- safely frozen for
// free once dimension_id is, since that formula can never collide across different
// dimension_ids.
//
// STAGED, NOT APPLIED. Run with: npx tsx scripts/generate-trait-catalog-sql.ts

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void };
declare const __dirname: string;
const { writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { PERSONALITY_DIMENSIONS } from '../src/data/personality';
import { assertNoRemovedDimensions, assignDimensionId, loadDimensionIdLedger, saveDimensionIdLedger } from './lib/dimension-id-ledger';

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

const ledger = loadDimensionIdLedger();
assertNoRemovedDimensions(ledger, PERSONALITY_DIMENSIONS.map((d) => d.id));
const dimensionIdByKey = new Map(PERSONALITY_DIMENSIONS.map((dimension) => [dimension.id, assignDimensionId(ledger, dimension.id)] as const));
saveDimensionIdLedger(ledger);

const dimensionRows = PERSONALITY_DIMENSIONS.map((dimension) => ({
  dimensionId: dimensionIdByKey.get(dimension.id)!,
  dimensionKey: dimension.id,
  name: dimension.name,
  type: dimension.type,
})).sort((a, b) => a.dimensionId - b.dimensionId);

const traitRows = PERSONALITY_DIMENSIONS.flatMap((dimension) => {
  const dimensionId = dimensionIdByKey.get(dimension.id)!;
  return [
    { traitId: dimensionId * 2 - 1, dimensionId, polarity: 'positive', traitKey: `${dimension.id}:positive`, label: dimension.positiveLabel },
    { traitId: dimensionId * 2, dimensionId, polarity: 'negative', traitKey: `${dimension.id}:negative`, label: dimension.negativeLabel },
  ];
}).sort((a, b) => a.traitId - b.traitId);

if (dimensionRows.length !== 32 || traitRows.length !== 64) {
  throw new Error(`Expected 32 dimensions / 64 traits, got ${dimensionRows.length}/${traitRows.length} -- refusing to write a catalog that doesn't match the known canonical count.`);
}

const dimensionValuesSql = dimensionRows
  .map((r) => `(${r.dimensionId}, '${escapeLiteral(r.dimensionKey)}', '${escapeLiteral(r.name)}', '${r.type}')`)
  .join(',\n  ');

const traitValuesSql = traitRows
  .map((r) => `(${r.traitId}, ${r.dimensionId}, '${r.polarity}', '${escapeLiteral(r.traitKey)}', '${escapeLiteral(r.label)}')`)
  .join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
--
-- Numeric personality trait catalog -- Build 22 data-integrity correction. Replaces the never-
-- applied string-keyed design in 20261018010000_personality_scoring_v2_schema.sql (superseded,
-- see that file's own now-added header note) with numeric dimension_id/trait_id, matching the
-- locked architecture decision: no 'forgiving_receipts:positive'-style strings in any scoring
-- or evidence table. dimension_key/trait_key below are retained ONLY as a human-readable,
-- UNIQUE audit/debug column -- never read by any scoring query, which always joins on the
-- numeric id.
--
-- Generated mechanically by scripts/generate-trait-catalog-sql.ts -- do not hand-edit;
-- regenerate if a dimension is ever added. dimension_id is resolved through a PERSISTED
-- LEDGER (scripts/lib/dimension-id-ledger.json), never from src/data/personality.ts's
-- PERSONALITY_DIMENSIONS array position -- an existing dimension keeps its id forever
-- regardless of reordering, insertion, or any other edit to that array; only a genuinely new
-- dimension_key ever receives a new id. trait_id = dimension_id*2-1 (positive pole) /
-- dimension_id*2 (negative pole), frozen for free once dimension_id is.
-- ============================================================================================

create table public.personality_dimensions (
  dimension_id smallint primary key,
  dimension_key text not null unique,
  name text not null,
  type text not null check (type in ('core', 'private'))
);

comment on table public.personality_dimensions is
  'Numeric dimension catalog -- 32 rows, ids 1-32, stable per scripts/generate-trait-catalog-sql.ts. dimension_key is a human-readable audit column only, matching src/data/personality.ts PersonalityDimensionId strings -- scoring/evidence tables join on dimension_id, never dimension_key.';

create table public.personality_traits (
  trait_id smallint primary key,
  dimension_id smallint not null references public.personality_dimensions (dimension_id),
  polarity text not null check (polarity in ('positive', 'negative')),
  trait_key text not null unique,
  label text not null,
  unique (dimension_id, polarity)
);

comment on table public.personality_traits is
  'Numeric trait (= one pole of one dimension) catalog -- 64 rows, ids 1-64. Every persisted scoring/evidence row (quiz_choice_trait_awards, user_trait_evidence, user_trait_totals, creature_published_recipes) references trait_id, never a string. trait_key is a human-readable audit column only (matches the old "dimension:polarity" string format for cross-reference during this migration, e.g. verifying against the pre-numeric data), never joined on by scoring logic.';

insert into public.personality_dimensions (dimension_id, dimension_key, name, type) values
  ${dimensionValuesSql};

insert into public.personality_traits (trait_id, dimension_id, polarity, trait_key, label) values
  ${traitValuesSql};

-- RLS: content, not user data -- readable by every authenticated client, writable only by a
-- reviewed migration (same trust model as quiz_choice_pole_awards/daily_options content).
alter table public.personality_dimensions enable row level security;
alter table public.personality_traits enable row level security;

create policy "personality_dimensions_select_all" on public.personality_dimensions for select to authenticated using (true);
create policy "personality_traits_select_all" on public.personality_traits for select to authenticated using (true);
`;

const outputPath = join(__dirname, '..', 'supabase', 'migrations', '20261028010000_personality_trait_catalog.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${dimensionRows.length} dimensions, ${traitRows.length} traits to ${outputPath}`);
