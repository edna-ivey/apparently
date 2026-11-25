// Build 22 owner audit (2026-11-01): "Build a reusable, versioned scoring configuration
// representation... Test exact app/server result parity with coherent winning paths,
// gate-failure paths, ties, boundary cases, and randomized answer sets."
//
// Fuzz-tests the rewritten resolve_archetype_result (20261101050000) against the REAL,
// unmodified app-side scoring.ts engine -- for every real archetype quiz in QUIZ_REGISTRY
// (the 9 already-approved quizzes, confirming zero regression, plus the 4 newly approved
// Private quizzes, whose gates/high-signal ties are genuinely new scope) and the one
// dualDimension quiz (whats-your-type), via thousands of independently generated random
// answer sets per quiz. Any SQL/TS mismatch is printed with the exact answers that produced
// it, so a real disagreement is directly reproducible, not just "N failed."
//
// Run with: npx tsx scripts/pglite-harness/run-configurable-scoring-engine-fuzz-test.ts
import { PGlite } from '@electric-sql/pglite';

import { QUIZ_REGISTRY } from '../../src/data/quizzes/index';
import { WHATS_YOUR_TYPE_DEFINITION } from '../../src/data/quizzes/whats-your-type-results';
import { scoreArchetypeQuiz, scoreDualDimensionQuiz } from '../../src/data/quizzes/scoring';
import type { ArchetypeQuizDefinition } from '../../src/data/quizzes/types';

// Node builtins via `declare const require`, matching every other scripts/*.ts file in this
// repo (e.g. generate-quiz-content-identity-sql.ts) -- this project's tsconfig does not
// include @types/node for the scripts/ tree, so a plain ESM `import ... from 'fs'` fails
// tsc --noEmit even though tsx itself runs it fine.
declare const require: (id: string) => { readFileSync: (p: string, e: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const __dirname_ = __dirname;
const root = join(__dirname_, '..', '..');
const db = new PGlite();

let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` -- ${detail}` : ''}`);
  ok ? pass++ : fail++;
};
const run = async (p: string) => db.exec(readFileSync(p, 'utf8'));

const randomAnswers = (definition: ArchetypeQuizDefinition): Record<string, string> => {
  const answers: Record<string, string> = {};
  for (const q of definition.questions) {
    const choice = q.choices[Math.floor(Math.random() * q.choices.length)];
    answers[q.id] = choice.id;
  }
  return answers;
};

async function main() {
  await run(join(__dirname_, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
  await run(join(root, 'supabase/migrations/20261102010000_archetype_fallback_result_and_tie_chain.sql'));
  console.log('loaded: content identity + result catalog + the configurable scoring engine (through the fallback-result/tie-chain fix)\n');

  const archetypeQuizzes = Object.entries(QUIZ_REGISTRY).filter(
    ([, def]) => def.scoringType === 'archetype',
  ) as [string, ArchetypeQuizDefinition][];

  const TRIALS_PER_QUIZ = 3000;

  for (const [quizKey, definition] of archetypeQuizzes) {
    const quizIdRow = await db.query<{ quiz_id: number }>(`select quiz_id from quizzes where quiz_key = $1`, [quizKey]);
    const quizId = quizIdRow.rows[0]?.quiz_id;
    if (quizId === undefined) {
      check(`${quizKey}: quiz_id resolved`, false, 'not found in quizzes table');
      continue;
    }

    let mismatches = 0;
    let firstMismatch: string | null = null;
    for (let trial = 0; trial < TRIALS_PER_QUIZ; trial += 1) {
      const answers = randomAnswers(definition);
      const expected = scoreArchetypeQuiz(definition, answers);
      const sqlResult = await db.query<{ winner_key: string; winner_total: number; total_points: number }>(
        `select * from resolve_archetype_result($1, $2, null, 3)`,
        [quizId, JSON.stringify(answers)],
      );
      const actual = sqlResult.rows[0];
      const expectedTotal = expected.totals[expected.primary.id] ?? 0;
      const expectedTotalPoints = Object.values(expected.totals).reduce((s, v) => s + v, 0);
      const ok =
        actual !== undefined &&
        actual.winner_key === expected.primary.id &&
        actual.winner_total === expectedTotal &&
        actual.total_points === expectedTotalPoints;
      if (!ok) {
        mismatches += 1;
        if (!firstMismatch) {
          firstMismatch = `answers=${JSON.stringify(answers)} expected=${JSON.stringify({ winner: expected.primary.id, total: expectedTotal, totalPoints: expectedTotalPoints })} actual=${JSON.stringify(actual)}`;
        }
      }
    }
    check(`${quizKey}: ${TRIALS_PER_QUIZ} random answer sets, SQL winner/total/total_points === TS scoreArchetypeQuiz`, mismatches === 0, mismatches > 0 ? `${mismatches} mismatches; first: ${firstMismatch}` : undefined);
  }

  // ============================================================================================
  // dualDimension (whats-your-type): both dimension winners independently, same fuzz approach.
  // ============================================================================================
  const wytQuizIdRow = await db.query<{ quiz_id: number }>(`select quiz_id from quizzes where quiz_key = 'whats-your-type'`);
  const wytQuizId = wytQuizIdRow.rows[0]?.quiz_id;
  if (wytQuizId === undefined) {
    check('whats-your-type: quiz_id resolved', false);
  } else {
    let mismatches = 0;
    let firstMismatch: string | null = null;
    const def = WHATS_YOUR_TYPE_DEFINITION;
    for (let trial = 0; trial < TRIALS_PER_QUIZ; trial += 1) {
      const answers: Record<string, string> = {};
      for (const q of def.questions) {
        const choice = q.choices[Math.floor(Math.random() * q.choices.length)];
        answers[q.id] = choice.id;
      }
      const expected = scoreDualDimensionQuiz(def, answers);
      const dimARow = await db.query<{ winner_key: string }>(`select * from resolve_archetype_result($1, $2, 'dimensionA', null)`, [wytQuizId, JSON.stringify(answers)]);
      const dimBRow = await db.query<{ winner_key: string }>(`select * from resolve_archetype_result($1, $2, 'dimensionB', null)`, [wytQuizId, JSON.stringify(answers)]);
      const ok = dimARow.rows[0]?.winner_key === expected.dimensionA.archetypeId && dimBRow.rows[0]?.winner_key === expected.dimensionB.archetypeId;
      if (!ok) {
        mismatches += 1;
        if (!firstMismatch) {
          firstMismatch = `answers=${JSON.stringify(answers)} expected=${JSON.stringify({ a: expected.dimensionA.archetypeId, b: expected.dimensionB.archetypeId })} actual=${JSON.stringify({ a: dimARow.rows[0]?.winner_key, b: dimBRow.rows[0]?.winner_key })}`;
        }
      }
    }
    check(`whats-your-type: ${TRIALS_PER_QUIZ} random answer sets, both dimension winners === TS scoreDualDimensionQuiz`, mismatches === 0, mismatches > 0 ? `${mismatches} mismatches; first: ${firstMismatch}` : undefined);
  }

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exitCode = 1;
  else console.log('ALL CHECKS PASSED');
}

main()
  .catch((e) => {
    console.error('HARNESS ERROR:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
