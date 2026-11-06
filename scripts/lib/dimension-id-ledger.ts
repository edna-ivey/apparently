// Build 22 owner audit (2026-10-30), item 6: trait/dimension numeric ids still depended on
// PERSONALITY_DIMENSIONS' own array position (scripts/generate-trait-catalog-sql.ts computed
// dimension_id as `index + 1` directly) -- exactly the same class of bug already fixed for
// quiz/question/choice ids in content-id-ledger.ts (see that file's own header). A dimension
// reordered, inserted in the middle, or removed from PERSONALITY_DIMENSIONS would silently
// reassign every dimension_id after the change point, and trait_id with it (trait_id is
// derived from dimension_id, see generate-trait-catalog-sql.ts) -- corrupting the meaning of
// every already-persisted user_trait_evidence/user_trait_totals/creature_published_recipes row
// that references the old ids, with no error anywhere.
//
// Real fix: the SAME persisted-ledger pattern as content-id-ledger.ts, applied to
// dimension_id only -- trait_id is safely frozen FOR FREE once dimension_id is, since trait_id
// = dimension_id*2-1 (positive pole) / dimension_id*2 (negative pole) can never collide across
// different dimension_ids (each dimension_id maps to exactly one disjoint pair of integers).
// This ledger (scripts/lib/dimension-id-ledger.json) is bootstrapped to EXACTLY the 32
// dimension_id values already live in the applied 20261028010000_personality_trait_catalog.sql
// migration, so regenerating today reproduces byte-identical SQL -- see
// scripts/validate-dimension-ids-frozen.ts, which asserts exactly that as a regression gate.
// A dimension_key seen for the first time gets a new id, strictly greater than every id ever
// assigned, regardless of where in the array it appears; an existing key always gets its
// already-recorded id back. Once created, this ledger file must always be committed and never
// deleted/regenerated from nothing -- the same discipline content-id-ledger.json already
// requires.

declare const require: (id: string) => { readFileSync: (p: string, e: string) => string; writeFileSync: (p: string, c: string) => void; existsSync: (p: string) => boolean };
declare const __dirname: string;
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const LEDGER_PATH = join(__dirname, 'dimension-id-ledger.json');

export type DimensionIdLedger = {
  nextDimensionId: number;
  dimensionIds: Record<string, number>; // dimensionKey -> dimension_id
};

// A migration that only makes sense AFTER this ledger exists -- if this file is present but
// the ledger is missing, the ledger was deleted/lost, not "never initialized." Same marker
// strategy as content-id-ledger.ts's FIRST_LEDGER_CONSUMING_MIGRATION.
const FIRST_LEDGER_CONSUMING_MIGRATION = join(__dirname, '../../supabase/migrations/20261028010000_personality_trait_catalog.sql');

const assertNoDuplicateIds = (table: Record<string, number>): void => {
  const ids = Object.values(table);
  const distinct = new Set(ids);
  if (distinct.size !== ids.length) {
    throw new Error(`Dimension-id ledger is CORRUPT: dimensionIds contains a duplicate id (${ids.length} entries, only ${distinct.size} distinct). Refusing to use a corrupt ledger -- restore it from version control rather than regenerating.`);
  }
};

const assertNextPointerAhead = (table: Record<string, number>, nextId: number): void => {
  const maxAssigned = Object.values(table).reduce((max, id) => Math.max(max, id), 0);
  if (nextId <= maxAssigned) {
    throw new Error(`Dimension-id ledger is CORRUPT: nextDimensionId (${nextId}) is not strictly greater than the highest already-assigned id (${maxAssigned}) -- a new assignment would REUSE an existing id. Refusing to proceed.`);
  }
};

export const loadDimensionIdLedger = (): DimensionIdLedger => {
  if (!existsSync(LEDGER_PATH)) {
    if (existsSync(FIRST_LEDGER_CONSUMING_MIGRATION)) {
      throw new Error(
        `Dimension-id ledger is MISSING (${LEDGER_PATH}) but ${FIRST_LEDGER_CONSUMING_MIGRATION} already exists -- this is a lost/deleted ledger, not a fresh project. Restore scripts/lib/dimension-id-ledger.json from version control. Refusing to silently start a new ledger at id 1, which would collide with every dimension_id already committed and already live.`,
      );
    }
    return { nextDimensionId: 1, dimensionIds: {} };
  }
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as DimensionIdLedger;
  assertNoDuplicateIds(ledger.dimensionIds);
  assertNextPointerAhead(ledger.dimensionIds, ledger.nextDimensionId);
  return ledger;
};

export const saveDimensionIdLedger = (ledger: DimensionIdLedger): void => {
  assertNoDuplicateIds(ledger.dimensionIds);
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n');
};

// Existing keys ALWAYS get their already-recorded id back, regardless of iteration order --
// this is the entire fix. A genuinely new dimensionKey gets the next strictly-increasing id.
export const assignDimensionId = (ledger: DimensionIdLedger, dimensionKey: string): number => {
  const existing = ledger.dimensionIds[dimensionKey];
  if (existing !== undefined) return existing;
  const id = ledger.nextDimensionId;
  ledger.dimensionIds[dimensionKey] = id;
  ledger.nextDimensionId = id + 1;
  return id;
};

// Build 22 owner audit (2026-10-31), item 1: READ-ONLY resolution for every consumer that
// must NEVER mint a new id -- the historical backfill generators (scripts/backfill-quiz-pole-
// evidence.ts, scripts/backfill-daily-pole-evidence.ts) and the client-side mirror
// (src/data/personality-v2/numeric-trait-catalog.ts, via a static import of this ledger's own
// JSON file). Only scripts/generate-trait-catalog-sql.ts -- the one authorized path that can
// introduce a genuinely new dimension -- uses assignDimensionId above. Throwing here on a
// missing key (rather than silently assigning one, as assignDimensionId would) is the whole
// point: a backfill script or the app encountering an unrecognized dimension means the ledger
// is stale relative to PERSONALITY_DIMENSIONS, which must be fixed by running the generator
// (the authorized assignment path) first, never by this read path inventing an id.
export const resolveDimensionId = (ledger: DimensionIdLedger, dimensionKey: string): number => {
  const id = ledger.dimensionIds[dimensionKey];
  if (id === undefined) {
    throw new Error(
      `No ledger entry for dimension '${dimensionKey}' -- scripts/lib/dimension-id-ledger.json is stale relative to PERSONALITY_DIMENSIONS. Run scripts/generate-trait-catalog-sql.ts first (the one authorized path that assigns a new dimension_id) before using this ledger from a read-only consumer.`,
    );
  }
  return id;
};

// Refuses when a dimension that was PREVIOUSLY assigned an id has disappeared from the
// current dimensionKeys list entirely (a removal from PERSONALITY_DIMENSIONS) -- surfacing
// that for a human decision (retire the id on purpose? restore the dimension?) rather than
// silently leaving a stale, now-unreachable ledger entry with no comment explaining why.
export const assertNoRemovedDimensions = (ledger: DimensionIdLedger, currentDimensionKeys: string[]): void => {
  const currentSet = new Set(currentDimensionKeys);
  const removed = Object.keys(ledger.dimensionIds).filter((key) => !currentSet.has(key));
  if (removed.length > 0) {
    throw new Error(
      `Dimension-id ledger has ${removed.length} previously-assigned dimension(s) no longer present in PERSONALITY_DIMENSIONS: ${JSON.stringify(removed)}. Their ids (${removed.map((k) => ledger.dimensionIds[k]).join(', ')}) must never be silently dropped or reassigned -- resolve this explicitly (restore the dimension, or deliberately retire its id with its own reviewed migration) before regenerating.`,
    );
  }
};
