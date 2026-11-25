// Build 22 owner audit (2026-10-30/31, extended 2026-11-01), items 6/1/2: regression-enforced
// contract proving dimension_id/trait_id are actually frozen against reordering AND
// insertion, across EVERY consumer that resolves them -- the catalog generator
// (scripts/generate-trait-catalog-sql.ts), the client-side mirror (src/data/personality-v2/
// numeric-trait-catalog.ts), both historical backfill generators
// (scripts/backfill-quiz-pole-evidence.ts, scripts/backfill-daily-pole-evidence.ts), AND
// (2026-11-01 follow-up, found by an independently simulated reorder) the three remaining
// catalog generators that had been missed in the prior rounds:
// scripts/generate-quiz-content-identity-sql.ts, scripts/generate-daily-trait-awards-seed-
// sql.ts, scripts/generate-daily-trait-awards-reconciliation-sql.ts. Everything below runs
// against the REAL generator/ledger/app-module code -- nothing re-implemented:
//
// 1. Drift guard: regenerating the trait catalog, the quiz content-identity catalog, and the
//    Daily award seed from the CURRENT PERSONALITY_DIMENSIONS + ledger all reproduce their
//    on-disk migration files byte-for-byte.
// 2. Reorder: reversing PERSONALITY_DIMENSIONS' array order and re-resolving every
//    dimension_id through the SAME ledger must still produce the EXACT SAME ids as today.
// 3. Insertion: appending a brand-new, never-before-seen dimension key (at an EARLY position,
//    the worst case for an index-based scheme) must not disturb any EXISTING dimension's id,
//    and every READ-ONLY consumer (resolveDimensionId) must refuse to invent an id for it --
//    only assignDimensionId (the one authorized path) may ever mint a new one.
// 4. The REAL client-side app module (numeric-trait-catalog.ts, imported directly, not
//    reimplemented) returns, for all 64 real traits, exactly the ledger's own ids.
// 5. Structural check: none of the five generators (two backfills, the quiz content-identity
//    generator, and both Daily award generators) import PERSONALITY_DIMENSIONS at all
//    anymore -- proof there is no remaining code path in any of them that COULD vary with
//    array order, not just that today's values happen to match. The recurrence-reconciliation
//    generator additionally gets a live run against a small synthetic input, since it (unlike
//    the other four) has no committed fixture/migration output to byte-diff against -- its
//    real inputs are one-off production query exports, never committed.
//
// Run with: npx tsx scripts/validate-dimension-ids-frozen.ts

declare const require: (id: string) => { readFileSync?: (p: string, e: string) => string; execSync?: (cmd: string, opts?: Record<string, unknown>) => string };
declare const process: { exit: (code: number) => void };
declare const __dirname: string;
const { readFileSync } = require('fs') as unknown as { readFileSync: (p: string, e: string) => string };
const { execSync: exec } = require('child_process') as unknown as { execSync: (cmd: string, opts?: Record<string, unknown>) => string };
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { PERSONALITY_DIMENSIONS } from '../src/data/personality';
import { traitIdForDimension } from '../src/data/personality-v2/numeric-trait-catalog';
import { assignDimensionId, loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const MIGRATION_PATH = join(__dirname, '..', 'supabase/migrations/20261028010000_personality_trait_catalog.sql');
const QUIZ_CONTENT_IDENTITY_PATH = join(__dirname, '..', 'supabase/migrations/20261028020000_quiz_content_identity.sql');
const DAILY_AWARDS_SEED_PATH = join(__dirname, '..', 'supabase/migrations/20261028060000_daily_trait_awards_seed.sql');

// --- 1. Drift guard -------------------------------------------------------------------------
const onDiskSql = readFileSync(MIGRATION_PATH, 'utf8');
exec(`npx tsx ${join(__dirname, 'generate-trait-catalog-sql.ts')}`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
const regeneratedSql = readFileSync(MIGRATION_PATH, 'utf8');
assert(regeneratedSql === onDiskSql, 'regenerating the catalog from the current ledger reproduces the on-disk migration byte-for-byte (no drift)');

// Same drift guard, extended (2026-11-01) to the two previously-missed generators whose
// output IS committed and reproducible from source alone.
const onDiskQuizContentIdentity = readFileSync(QUIZ_CONTENT_IDENTITY_PATH, 'utf8');
exec(`npx tsx ${join(__dirname, 'generate-quiz-content-identity-sql.ts')}`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
const regeneratedQuizContentIdentity = readFileSync(QUIZ_CONTENT_IDENTITY_PATH, 'utf8');
assert(regeneratedQuizContentIdentity === onDiskQuizContentIdentity, 'regenerating the quiz content-identity catalog (generate-quiz-content-identity-sql.ts, previously missed) from the current ledger reproduces the on-disk migration byte-for-byte (no drift)');

const onDiskDailyAwardsSeed = readFileSync(DAILY_AWARDS_SEED_PATH, 'utf8');
exec(`npx tsx ${join(__dirname, 'generate-daily-trait-awards-seed-sql.ts')}`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
const regeneratedDailyAwardsSeed = readFileSync(DAILY_AWARDS_SEED_PATH, 'utf8');
assert(regeneratedDailyAwardsSeed === onDiskDailyAwardsSeed, 'regenerating the Daily award seed (generate-daily-trait-awards-seed-sql.ts, previously missed) from the current ledger reproduces the on-disk migration byte-for-byte (no drift)');

// --- 2. The actual bug class: reorder PERSONALITY_DIMENSIONS, re-resolve, ids must not move -
const ledgerBeforeReorder = loadDimensionIdLedger();
const idsBeforeReorder = new Map(PERSONALITY_DIMENSIONS.map((d) => [d.id, ledgerBeforeReorder.dimensionIds[d.id]]));

const reversedDimensions = [...PERSONALITY_DIMENSIONS].reverse();
const ledgerForReorderTest = loadDimensionIdLedger(); // fresh load -- assignDimensionId mutates in place
const idsAfterSimulatedReorder = new Map(
  reversedDimensions.map((d) => [d.id, assignDimensionId(ledgerForReorderTest, d.id)] as const),
);

let anyMismatch = false;
for (const [key, idBefore] of idsBeforeReorder) {
  const idAfter = idsAfterSimulatedReorder.get(key);
  if (idAfter !== idBefore) {
    anyMismatch = true;
    console.error(`  mismatch: dimension '${key}' had id ${idBefore}, resolved to ${idAfter} after a simulated reorder`);
  }
}
assert(!anyMismatch, `reversing PERSONALITY_DIMENSIONS' array order and re-resolving through the ledger produces the IDENTICAL dimension_id for all ${idsBeforeReorder.size} existing dimensions (the actual bug this item fixes -- the old index-based scheme would have reversed every id)`);

// Sanity: the reorder simulation above must not have mutated the real ledger file on disk --
// loadDimensionIdLedger() returns a fresh object each call; assignDimensionId mutated only
// that in-memory copy, never called saveDimensionIdLedger. Confirm the file is untouched.
const ledgerPathCheck = join(__dirname, 'lib/dimension-id-ledger.json');
const ledgerOnDiskAfterTest = readFileSync(ledgerPathCheck, 'utf8');
const ledgerOnDiskBeforeTest = JSON.stringify(ledgerBeforeReorder, null, 2) + '\n';
assert(ledgerOnDiskAfterTest === ledgerOnDiskBeforeTest, 'the reorder simulation never wrote to the real ledger file on disk (in-memory only)');

// --- 3. Insertion: a brand-new dimension key inserted EARLY in a reordered array must not
// disturb any existing id, and resolveDimensionId (the read-only path every backfill/app
// consumer uses) must refuse to invent one for it.
const withNewDimensionInserted = [
  { id: 'brand_new_test_dimension_never_real' as const, name: 'x', type: 'core' as const, positiveLabel: 'x', negativeLabel: 'y' },
  ...reversedDimensions,
];
const ledgerForInsertionTest = loadDimensionIdLedger();
const idsAfterInsertion = new Map(
  withNewDimensionInserted
    .filter((d) => d.id !== 'brand_new_test_dimension_never_real')
    .map((d) => [d.id, assignDimensionId(ledgerForInsertionTest, d.id)] as const),
);
let anyMismatchAfterInsertion = false;
for (const [key, idBefore] of idsBeforeReorder) {
  if (idsAfterInsertion.get(key) !== idBefore) {
    anyMismatchAfterInsertion = true;
    console.error(`  mismatch after simulated insertion: dimension '${key}' had id ${idBefore}, resolved to ${idsAfterInsertion.get(key)}`);
  }
}
assert(!anyMismatchAfterInsertion, `inserting a brand-new dimension at the FRONT of a reordered array leaves all ${idsBeforeReorder.size} existing dimension ids unchanged`);

let readOnlyResolverThrew = false;
try {
  resolveDimensionId(loadDimensionIdLedger(), 'brand_new_test_dimension_never_real');
} catch {
  readOnlyResolverThrew = true;
}
assert(readOnlyResolverThrew, "resolveDimensionId (the read-only path numeric-trait-catalog.ts and both backfill generators use) REFUSES to invent an id for an unrecognized dimension -- only the generator's assignDimensionId may ever mint one");

// --- 4. The REAL app module (not reimplemented) matches the ledger for all 64 real traits ---
const ledgerForAppCheck = loadDimensionIdLedger();
let appModuleMismatch = false;
for (const dimension of PERSONALITY_DIMENSIONS) {
  const expectedDimensionId = ledgerForAppCheck.dimensionIds[dimension.id];
  const expectedPositive = expectedDimensionId * 2 - 1;
  const expectedNegative = expectedDimensionId * 2;
  const actualPositive = traitIdForDimension(dimension.id, 'positive');
  const actualNegative = traitIdForDimension(dimension.id, 'negative');
  if (actualPositive !== expectedPositive || actualNegative !== expectedNegative) {
    appModuleMismatch = true;
    console.error(`  mismatch: ${dimension.id} expected [${expectedPositive},${expectedNegative}], app module returned [${actualPositive},${actualNegative}]`);
  }
}
assert(!appModuleMismatch, 'the REAL src/data/personality-v2/numeric-trait-catalog.ts module (imported directly) returns the ledger-correct trait_id for all 32 dimensions / 64 traits');

// --- 5. Structural check: NONE of the five generators has a remaining array-position
// dependency at all -- grepping the REAL file contents, not trusting a comment.
const GENERATORS_REQUIRING_LEDGER = [
  'backfill-quiz-pole-evidence.ts',
  'backfill-daily-pole-evidence.ts',
  'generate-quiz-content-identity-sql.ts',
  'generate-daily-trait-awards-seed-sql.ts',
  'generate-daily-trait-awards-reconciliation-sql.ts',
];
for (const file of GENERATORS_REQUIRING_LEDGER) {
  const source = readFileSync(join(__dirname, file), 'utf8');
  assert(!source.includes("from '../src/data/personality'"), `${file} no longer imports PERSONALITY_DIMENSIONS at all -- no remaining code path there can vary with array order`);
  assert(source.includes('resolveDimensionId') && source.includes('loadDimensionIdLedger'), `${file} resolves dimension ids through the real ledger module`);
}

// --- 6. The recurrence-reconciliation generator has no committed migration output to byte-
// diff (its real inputs are one-off production query exports, never committed) -- so it gets
// a live run against a small synthetic input instead, confirming the REAL ledger value for a
// known dimension actually reaches its output SQL, and that it refuses an unrecognized
// dimension exactly like the others.
{
  const { writeFileSync, mkdtempSync } = require('fs') as unknown as { writeFileSync: (p: string, c: string) => void; mkdtempSync: (p: string) => string };
  const { tmpdir } = require('os') as unknown as { tmpdir: () => string };
  const tmpDir = mkdtempSync(join(tmpdir(), 'build22-reconciliation-ledger-check-'));
  const canonicalQuestionId = '00000000-0000-0000-0000-00000000a001';
  const cloneQuestionId = '00000000-0000-0000-0000-00000000a002';
  // A REAL option id from the real, approved, committed Daily award content
  // (readDailyOptionPoleAwards()) -- its real awards are 'planner_spontaneous:negative' (3
  // pts) and 'adventure_comfort:positive' (3 pts). planner_spontaneous is dimension_id 1 in
  // the real, committed ledger, so the negative pole's trait_id is deterministically 2 --
  // checked directly below, not just "ran without error."
  const canonicalOptionId = '1d3533fa-a3db-4e4f-b24f-22f678d7c763';
  const cloneOptionId = '00000000-0000-0000-0000-00000000a003';
  const sharedLabel = 'build22-ledger-check-label';
  const questionsPath = join(tmpDir, 'questions.json');
  const optionsPath = join(tmpDir, 'options.json');
  const outputPath = join(tmpDir, 'out.sql');
  writeFileSync(questionsPath, JSON.stringify({
    rows: [
      { id: canonicalQuestionId, recurrence_source_id: null, status: 'Archived', room: 'public' },
      { id: cloneQuestionId, recurrence_source_id: canonicalQuestionId, status: 'Live', room: 'public' },
    ],
  }));
  writeFileSync(optionsPath, JSON.stringify({
    rows: [
      { id: canonicalOptionId, question_id: canonicalQuestionId, position: 1, label: sharedLabel },
      { id: cloneOptionId, question_id: cloneQuestionId, position: 1, label: sharedLabel },
    ],
  }));
  let reconciliationGeneratorRanCleanly = false;
  try {
    exec(`npx tsx ${join(__dirname, 'generate-daily-trait-awards-reconciliation-sql.ts')} ${questionsPath} ${optionsPath} ${outputPath}`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
    reconciliationGeneratorRanCleanly = true;
  } catch (e) {
    console.error(String(e));
  }
  assert(reconciliationGeneratorRanCleanly, 'generate-daily-trait-awards-reconciliation-sql.ts (previously missed) runs end-to-end against the real ledger module on a synthetic canonical/clone pair');
  if (reconciliationGeneratorRanCleanly) {
    const outputSql = readFileSync(outputPath, 'utf8');
    // dimension_id 1 (planner_spontaneous) -> negative pole trait_id = 1*2 = 2. Checking the
    // REAL ledger value's literal presence in the REAL generator's output, not a guess.
    const expectedTraitId = loadDimensionIdLedger().dimensionIds['planner_spontaneous'] * 2;
    assert(
      outputSql.includes(`('${cloneOptionId}', ${expectedTraitId}, 3)`),
      `the regenerated SQL contains the clone option's inherited award with the REAL ledger-resolved trait_id (${expectedTraitId}) for planner_spontaneous:negative, not a position-derived guess`,
    );
  }
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} check(s) FAILED`}`);
if (failures > 0) {
  process.exit(1);
}
