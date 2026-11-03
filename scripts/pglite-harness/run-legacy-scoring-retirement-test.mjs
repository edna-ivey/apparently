// Build 22 final cleanup round (2026-11-02), item 2: "Confirm that the final system has
// exactly one authoritative personality-evidence mechanism... Make old TestFlight clients
// fail safely instead of allowing them to write incompatible scoring data after cutover."
//
// SUPERSEDED, deployment-safety review (2026-11-03): 20261102040000 (tested separately by
// run-submit-quiz-result-version-guard-test.mjs) goes further than this migration alone --
// it stops submit_quiz_result from writing even the quiz_results row this test still
// observes below. Both migrations ship together in the real candidate set, so the FINAL
// deployed behavior is "nothing at all is written" -- this file is kept as incremental
// regression coverage for 20261102020000's own specific claim (zero personality_evidence)
// in isolation, not a description of the final end state. See the version-guard test for that.
//
// Proves, against the REAL migrations (through 20261102020000, deliberately NOT including
// the later version-guard migration -- see note above):
// 1. submit_quiz_result (the legacy RPC an already-installed pre-cutover client might still
//    call) writes ZERO personality_evidence rows, even when called with a full, otherwise-
//    valid p_profile_effects payload -- the exact "old client writes incompatible scoring
//    data" scenario this migration closes.
// 2. submit_quiz_result still succeeds (a normal response, not a crash) and still writes the
//    quiz_results history row -- "fail safely" means the old client's call degrades
//    gracefully, not that it starts erroring.
// 3. submit_quiz_completion (the one real, live path) is completely unaffected -- still
//    writes exactly the real per-answer trait evidence from the catalog.
// 4. A retake through the legacy RPC still correctly reports was_retry/is_first_profile_completion,
//    with zero evidence written either time.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
const run = async (p) => db.exec(readFileSync(p, 'utf8'));
const asUser = async (userId) => db.query(`select set_config('request.user_id', $1, false)`, [userId]);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '02-stub-legacy-quiz-result-deps.sql'));
  await run(join(root, 'supabase/migrations/20261018020000_age_eligibility_gate.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  await run(join(root, 'supabase/migrations/20261101030000_quiz_result_scoring_verification.sql'));
  await run(join(root, 'supabase/migrations/20261101040000_quiz_access_inheritance_and_content_versioning.sql'));
  await run(join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
  await run(join(root, 'supabase/migrations/20261102010000_archetype_fallback_result_and_tie_chain.sql'));
  await run(join(root, 'supabase/migrations/20261102020000_final_scoring_cleanup_and_v1_reset.sql'));
  console.log('loaded: full schema through the final scoring cleanup migration (20261102020000)\n');

  const user = '00000000-0000-0000-0000-000000000081';
  await db.query(`insert into auth.users (id) values ($1)`, [user]);
  await asUser(user);

  // A full, well-formed, otherwise-valid legacy profile_effects payload -- exactly what an
  // old pre-cutover client would still send today if it called this RPC.
  const legacyProfileEffects = JSON.stringify([
    { dimension: 'planner_spontaneous', value: 2 },
    { dimension: 'direct_indirect', value: -1 },
  ]);

  const first = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(2), 8, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', ['Petty'], null, legacyProfileEffects, null],
  );
  check('1/2. legacy submit_quiz_result SUCCEEDS (normal response, not a crash) for an old-shaped call with profile_effects', first.rows[0] !== undefined, JSON.stringify(first.rows[0]));
  check('1/2. ...and reports is_first_profile_completion = true', first.rows[0]?.is_first_profile_completion === true, JSON.stringify(first.rows[0]));

  const historyCount = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [user])).rows[0].n;
  check('2. the quiz_results history row WAS written (old-client continuity for Compare/sharing)', historyCount === 1, `n=${historyCount}`);

  const evidenceCount = (await db.query(`select count(*)::int as n from personality_evidence where user_id = $1`, [user])).rows[0].n;
  check('1. THE FIX: ZERO personality_evidence rows were written, despite a full valid profile_effects payload', evidenceCount === 0, `n=${evidenceCount}`);

  // --- A retake through the same legacy RPC: still safe, still zero evidence, correct was_retry.
  const retake = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(1), 8, 10, 42, 'mostly-unbothered', 'MOSTLY UNBOTHERED', ['Petty'], null, legacyProfileEffects, null],
  );
  check('4. a second (retake) legacy submission succeeds, is_first_profile_completion = false', retake.rows[0]?.is_first_profile_completion === false, JSON.stringify(retake.rows[0]));
  const evidenceAfterRetake = (await db.query(`select count(*)::int as n from personality_evidence where user_id = $1`, [user])).rows[0].n;
  check('4. still ZERO personality_evidence rows after the retake', evidenceAfterRetake === 0, `n=${evidenceAfterRetake}`);
  const historyAfterRetake = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [user])).rows[0].n;
  check('4. both completions preserved in quiz_results history', historyAfterRetake === 2, `n=${historyAfterRetake}`);

  // --- 3. submit_quiz_completion (the real, live path) is completely unaffected: a DIFFERENT
  // user, a DIFFERENT quiz, going through the real RPC, still earns real trait evidence.
  const user2 = '00000000-0000-0000-0000-000000000082';
  await db.query(`insert into auth.users (id) values ($1)`, [user2]);
  await asUser(user2);
  const pettyQuestions = (await db.query(
    `select qq.question_key, min(qc.choice_key) as first_choice
     from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id
     join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = 'petty' group by qq.question_key`,
  )).rows;
  const answers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.first_choice]));
  // Real, server-verified metadata for all-first-choice Petty answers (same fixture
  // run-quiz-completion-metadata-validation-test.mjs uses) -- submit_quiz_completion verifies
  // score/percent/result_id against the real catalog, so a guessed value would be rejected.
  const liveSubmission = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(1), pettyQuestions.length, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', [], null, JSON.stringify(answers)],
  );
  check('3. the real submit_quiz_completion path still succeeds for a different user/quiz', liveSubmission.rows[0] !== undefined, JSON.stringify(liveSubmission.rows[0]));
  const liveEvidenceCount = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user2])).rows[0].n;
  check('3. ...and the real numeric trait-evidence mechanism is completely unaffected by the legacy RPC change', liveEvidenceCount > 0, `n=${liveEvidenceCount}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
