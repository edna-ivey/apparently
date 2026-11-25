// Build 22 owner audit (2026-10-31, extended 2026-11-01), items 3: "Validate saved result
// metadata" / "Finish server-side result integrity." The owner first reproduced
// submit_quiz_completion accepting a fabricated result_id/result_title/score; that round's
// fix rejected an UNKNOWN result_id. The owner's follow-up reproduction showed that was not
// enough: 8 valid Petty answers (real score 12/24, real result "selectively-petty") were
// saved with a claimed score=24/result_id="mostly-unbothered" -- a KNOWN but WRONG result_id
// was accepted outright, because nothing checked whether the submitted answers actually
// produce that result.
//
// This generator now ALSO emits min_score/max_score (numericBand bands) and result_order (the
// result's own 1-based authored-array position) alongside the existing result_title --
// min_score/max_score let submit_quiz_completion look up the REAL band for a REAL computed
// score directly; result_order reproduces scoring.ts's own tie-break/fallback rule ("the tied
// result that appears earliest in the quiz's own authored array") exactly, never alphabetical
// or insertion-order-of-a-different-structure.
//
// result_key reuses each result's own authored id/combination-key verbatim (band.id/
// archetype.id/the "dimA:dimB" combination key) -- the SAME value computeQuizResult already
// sends as resultId for a legitimate completion, so no existing client payload shape changes.
//
// STAGED, NOT APPLIED. Run with: npx tsx scripts/generate-quiz-result-catalog-sql.ts

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void };
declare const __dirname: string;
const { writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import { COMBINATION_RESULTS } from '../src/data/quizzes/whats-your-type-results';
import { CANONICAL_QUIZ_ORDER } from './lib/canonical-quiz-order';
import { loadLedger } from './lib/content-id-ledger';

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

type ResultRow = { quizKey: string; resultKey: string; resultTitle: string; resultOrder: number; minScore: number | null; maxScore: number | null };
const resultRows: ResultRow[] = [];

for (const [quizKey, definition] of Object.entries(QUIZ_REGISTRY)) {
  if (definition.scoringType === 'numericBand') {
    definition.resultBands.forEach((band, index) => {
      resultRows.push({ quizKey, resultKey: band.id, resultTitle: band.title, resultOrder: index + 1, minScore: band.minScore, maxScore: band.maxScore });
    });
  } else if (definition.scoringType === 'archetype') {
    definition.archetypes.forEach((archetype, index) => {
      resultRows.push({ quizKey, resultKey: archetype.id, resultTitle: archetype.title, resultOrder: index + 1, minScore: null, maxScore: null });
    });
  } else {
    throw new Error(`Quiz '${quizKey}' has an unhandled scoringType -- this generator must cover every real scoring type or refuse to proceed.`);
  }
}

Object.entries(COMBINATION_RESULTS).forEach(([combinationKey, result], index) => {
  resultRows.push({ quizKey: 'whats-your-type', resultKey: combinationKey, resultTitle: (result as { title: string }).title, resultOrder: index + 1, minScore: null, maxScore: null });
});

const distinctQuizKeysWithResults = new Set(resultRows.map((r) => r.quizKey));
const missing = CANONICAL_QUIZ_ORDER.filter((k) => !distinctQuizKeysWithResults.has(k));
if (missing.length > 0) {
  throw new Error(`Quizzes with zero result rows generated: ${missing.join(', ')} -- refusing to proceed with an incomplete result catalog.`);
}

// Resolve quiz_id from the SAME content-id-ledger the content-identity generator already
// froze -- never re-derived, never a second numbering.
const ledger = loadLedger();
const valuesSql = resultRows
  .map((r) => {
    const quizId = ledger.quizIds[r.quizKey];
    if (quizId === undefined) {
      throw new Error(`No ledger quiz_id for quiz_key '${r.quizKey}' -- run scripts/generate-quiz-content-identity-sql.ts first.`);
    }
    const min = r.minScore === null ? 'null' : r.minScore;
    const max = r.maxScore === null ? 'null' : r.maxScore;
    return `(${quizId}, '${escapeLiteral(r.resultKey)}', '${escapeLiteral(r.resultTitle)}', ${r.resultOrder}, ${min}, ${max})`;
  })
  .join(',\n  ');

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
--
-- Build 22 owner audit (2026-10-31, extended 2026-11-01), item 3: real, approved (quiz,
-- result_id, result_title) catalog, mechanically derived from QUIZ_REGISTRY's own
-- resultBands/archetypes and whats-your-type's own COMBINATION_RESULTS -- ${resultRows.length} rows across
-- ${CANONICAL_QUIZ_ORDER.length} quizzes. Lets submit_quiz_completion reject an unknown result_id outright and
-- always use THIS table's own result_title for quiz_results/Compare/analytics, never a
-- client-reported one. min_score/max_score (numericBand only) and result_order (every type --
-- the result's own 1-based authored-array position) let submit_quiz_completion verify a
-- submitted result_id was actually PRODUCED by the submitted answers, not merely that it
-- exists -- see 20261101030000.
-- ============================================================================================

create table public.quiz_result_definitions (
  quiz_id smallint not null references public.quizzes (quiz_id),
  result_key text not null,
  result_title text not null,
  -- 1-based authored-array position (resultBands[]/archetypes[]/combination insertion order)
  -- -- reproduces scoring.ts's own "tied result that appears earliest in the quiz's own
  -- array" fallback rule exactly.
  result_order smallint not null,
  -- numericBand only -- the inclusive score range this result covers. Null for archetype/
  -- dualDimension, which have no single numeric band per result.
  min_score integer,
  max_score integer,
  primary key (quiz_id, result_key)
);

comment on table public.quiz_result_definitions is 'Real, approved (quiz, result_id, result_title, result_order, min_score, max_score) catalog -- ${resultRows.length} rows, mechanically derived from QUIZ_REGISTRY resultBands/archetypes and whats-your-type COMBINATION_RESULTS. submit_quiz_completion joins on (quiz_id, result_key) to reject an unknown result_id, reads min_score/max_score to verify a numericBand result against a REAL computed score, and reads result_order to reproduce scoring.ts''s own tie-break fallback exactly.';

alter table public.quiz_result_definitions enable row level security;
create policy "quiz_result_definitions_select_all" on public.quiz_result_definitions for select to authenticated using (true);

insert into public.quiz_result_definitions (quiz_id, result_key, result_title, result_order, min_score, max_score) values
  ${valuesSql};
`;

const outputPath = join(__dirname, '..', 'supabase', 'migrations', '20261101010000_quiz_result_definitions_catalog.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${resultRows.length} result rows across ${distinctQuizKeysWithResults.size} quizzes to ${outputPath}`);
