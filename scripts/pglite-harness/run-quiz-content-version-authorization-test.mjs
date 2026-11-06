// Build 22 owner audit (2026-11-01), item 3: "Complete safe quiz content versioning and
// authorization." EXACT reproduction of the owner's own finding -- they independently added
// a synthetic 'love-soulmates-ready-v2' quiz to an isolated test database and confirmed a
// user WITHOUT any subscription or tester entitlement successfully submitted it, because the
// new key was absent from the hardcoded 7-id premium-gate list. This test reproduces the
// SAME synthetic scenario (a fake 'love-soulmates-ready-v2' row inserted directly into this
// isolated database, mirroring the owner's own method) against the REAL, fixed migrations --
// never wiring any real replacement content into QUIZ_REGISTRY, never touching the locked
// Love or Career-How-Bad replacement documents.
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
let userCounter = 0;
const newUser = async () => {
  userCounter += 1;
  const id = `00000000-0000-0000-0000-0000000002${String(userCounter).padStart(2, '0')}`;
  await db.query(`insert into auth.users (id) values ($1)`, [id]);
  return id;
};

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  await run(join(root, 'supabase/migrations/20261101030000_quiz_result_scoring_verification.sql'));
  await run(join(root, 'supabase/migrations/20261101040000_quiz_access_inheritance_and_content_versioning.sql'));
  console.log('loaded: full schema + REAL access-inheritance and content-versioning fix');

  // === Precondition: the REAL, existing love-soulmates-ready is correctly premium-gated via
  // the new data-driven columns (confirms the fix didn't regress the ORIGINAL quiz either). ===
  const originalRow = (await db.query(`select access_tier, requires_age_verification, logical_quiz_key from quizzes where quiz_key = 'love-soulmates-ready'`)).rows[0];
  check('precondition: the REAL love-soulmates-ready is access_tier=private, self-referencing logical_quiz_key', originalRow.access_tier === 'private' && originalRow.logical_quiz_key === 'love-soulmates-ready', JSON.stringify(originalRow));

  const userNoEnt = await newUser();
  await asUser(userNoEnt);
  let originalRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['love-soulmates-ready', 'Love', 'private', daysAgo(1), 4, 1, 25, 'fixer', 'x', [], null, JSON.stringify({ q1: 'a', q2: 'a', q3: 'a', q4: 'a' })],
    );
  } catch {
    originalRejected = true;
  }
  check('precondition: the REAL love-soulmates-ready still correctly rejects a user with no entitlement', originalRejected);
  await db.query(`select set_config('request.user_id', '', false)`);

  // ============================================================================================
  // THE EXACT REPRODUCTION: a synthetic 'love-soulmates-ready-v2' content version, inserted
  // directly (mirroring the owner's own isolated-test method, never touching QUIZ_REGISTRY or
  // any locked content file). Mirrors love-soulmates-ready's own real question/choice
  // structure (4 questions, 4 choices each, archetype scoring) purely as a mechanical
  // fixture -- no real replacement copy, mappings, or reveals are used or implied.
  // ============================================================================================
  const v2QuizId = 9001;
  const originalQuizId = (await db.query(`select quiz_id from quizzes where quiz_key = 'love-soulmates-ready'`)).rows[0].quiz_id;
  await db.query(
    `insert into quizzes (quiz_id, quiz_key, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key) values ($1, 'love-soulmates-ready-v2', 'archetype', null, 'private', false, 'love-soulmates-ready')`,
    [v2QuizId],
  );
  const v2QuestionIds = [9101, 9102, 9103, 9104];
  const v2ChoiceIdsByQuestion = {};
  for (let i = 0; i < v2QuestionIds.length; i++) {
    await db.query(`insert into quiz_questions (question_id, quiz_id, question_key, position, scoring_role) values ($1, $2, $3, $4, null)`, [v2QuestionIds[i], v2QuizId, `q${i + 1}`, i + 1]);
    const choiceIds = [];
    for (const letter of ['a', 'b', 'c', 'd']) {
      const choiceId = 9200 + v2QuestionIds[i] * 10 + 'abcd'.indexOf(letter);
      await db.query(`insert into quiz_choices (choice_id, question_id, choice_key, flavor_score) values ($1, $2, $3, null)`, [choiceId, v2QuestionIds[i], letter]);
      await db.query(`insert into quiz_choice_result_weights (choice_id, result_component_key, weight, weight_order) values ($1, 'fixer', 1, 1)`, [choiceId]);
      choiceIds.push(choiceId);
    }
    v2ChoiceIdsByQuestion[`q${i + 1}`] = choiceIds;
  }
  await db.query(`insert into quiz_result_definitions (quiz_id, result_key, result_title, result_order, min_score, max_score) values ($1, 'fixer', 'THE FIXER', 1, null, null)`, [v2QuizId]);
  const v2Answers = { q1: 'a', q2: 'a', q3: 'a', q4: 'a' };

  // --- 1. THE FIX: a user with NO entitlement must be REJECTED from the new v2 key too. ---
  const userAttacker = await newUser();
  await asUser(userAttacker);
  let v2Rejected = false;
  let v2Error = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['love-soulmates-ready-v2', 'Love v2', 'private', daysAgo(1), 4, 4, 100, 'fixer', 'x', [], null, JSON.stringify(v2Answers)],
    );
  } catch (e) {
    v2Rejected = true;
    v2Error = String(e.message || e);
  }
  check('1. THE FIX: a user with NO subscription/tester entitlement is REJECTED from the new love-soulmates-ready-v2 key (the exact reported hole)', v2Rejected, v2Error.slice(0, 200));
  check('1. the rejection is the real subscription-required error, not some unrelated failure', v2Error.includes('Apparently Private subscription'), v2Error);
  const v2ResultsAfterRejection = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [userAttacker])).rows[0].n;
  check('1. nothing was written for the rejected attempt', v2ResultsAfterRejection === 0, `n=${v2ResultsAfterRejection}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // --- 2. With entitlement, v2 is submittable, and age-gating independently still inherits
  // correctly too (sanity: v2 is NOT age-gated, since it is not private-private-trouble). ---
  const userEntitled = await newUser();
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [userEntitled]);
  await asUser(userEntitled);
  const v2Legit = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['love-soulmates-ready-v2', 'Love v2', 'private', daysAgo(1), 4, 4, 100, 'fixer', 'x', [], null, JSON.stringify(v2Answers)],
  );
  check('2. with a real entitlement, v2 is submittable and verifies correctly', v2Legit.rows[0] !== undefined && v2Legit.rows[0].is_first_completion === true, JSON.stringify(v2Legit.rows[0]));

  // --- 3. FIRST-COMPLETION IDENTITY CONTINUITY: a user who already completed the ORIGINAL
  // love-soulmates-ready must NOT get a fresh "first completion" on v2. ---
  const userBothVersions = await newUser();
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [userBothVersions]);
  await asUser(userBothVersions);
  const originalQuestions = (await db.query(`select question_key from quiz_questions where quiz_id = $1 order by position`, [originalQuizId])).rows.map((r) => r.question_key);
  const originalAnswers = Object.fromEntries(originalQuestions.map((k) => [k, 'a']));
  const originalResultKey = (await db.query(`select result_key from quiz_result_definitions where quiz_id = $1 limit 1`, [originalQuizId])).rows[0]?.result_key;
  // Use the REAL resolve_archetype_result to get the actually-correct metadata for the
  // original quiz, so this step itself passes item 1's own scoring verification.
  const originalReal = (await db.query(`select winner_key, winner_total, total_points from resolve_archetype_result($1, $2, null, 3)`, [originalQuizId, JSON.stringify(originalAnswers)])).rows[0];
  const originalPercent = originalReal.total_points > 0 ? Math.round((originalReal.winner_total / originalReal.total_points) * 100) : 0;
  const firstCompletion = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['love-soulmates-ready', 'Love', 'private', daysAgo(2), originalQuestions.length, originalReal.winner_total, originalPercent, originalReal.winner_key, 'x', [], null, JSON.stringify(originalAnswers)],
  );
  check('3. setup: completing the ORIGINAL love-soulmates-ready is a genuine first completion', firstCompletion.rows[0] !== undefined && firstCompletion.rows[0].is_first_completion === true, JSON.stringify(firstCompletion.rows[0]));
  // Build 22 owner audit (2026-11-01), V1 scope round: love-soulmates-ready was APPROVED and
  // ACTIVATED this round, so the ORIGINAL completion now legitimately earns real evidence
  // (it is no longer held/zero-award) -- captured here so the invariant below can be "the v2
  // retake adds NOTHING further," not the now-outdated "evidence stays at zero forever."
  const evidenceAfterOriginalOnly = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [userBothVersions])).rows[0].n;
  check('3. the ORIGINAL completion itself earns real evidence (love-soulmates-ready is activated this round, no longer held)', evidenceAfterOriginalOnly > 0, `n=${evidenceAfterOriginalOnly}`);

  const secondOnV2 = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['love-soulmates-ready-v2', 'Love v2', 'private', daysAgo(1), 4, 4, 100, 'fixer', 'x', [], null, JSON.stringify(v2Answers)],
  );
  check('3. THE FIX: submitting v2 AFTER already completing the original does NOT earn a fresh first completion', secondOnV2.rows[0] !== undefined && secondOnV2.rows[0].is_first_completion === false, JSON.stringify(secondOnV2.rows[0]));
  const v2CompletionRows = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1 and quiz_id = $2`, [userBothVersions, v2QuizId])).rows[0].n;
  check('3. no user_quiz_completions row was ever reserved for v2 itself -- the logical identity stays owned by the original', v2CompletionRows === 0, `n=${v2CompletionRows}`);
  const v2EvidenceRows = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [userBothVersions])).rows[0].n;
  check('3. the v2 retake adds ZERO additional evidence beyond the original completion -- first-completion identity (and its evidence) stays owned by the original, never duplicated', v2EvidenceRows === evidenceAfterOriginalOnly, `before_v2=${evidenceAfterOriginalOnly} after_v2=${v2EvidenceRows}`);
  const v2HistoryRows = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1 and quiz_id = 'love-soulmates-ready-v2'`, [userBothVersions])).rows[0].n;
  check('3. the v2 submission IS still recorded in quiz_results history (entertainment/sharing unaffected)', v2HistoryRows === 1, `n=${v2HistoryRows}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // --- 4. REGRESSION SAFETY: every EXISTING single-version quiz is completely unaffected --
  // spot-check a free quiz and the one age-gated quiz. ---
  const userRegression = await newUser();
  await asUser(userRegression);
  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const pettyAllA = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));
  const pettyResult = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), 8, 12, 50, 'selectively-petty', 'x', [], null, JSON.stringify(pettyAllA)],
  );
  check('4. REGRESSION SAFETY: the free Petty quiz is completely unaffected -- no entitlement required, succeeds normally', pettyResult.rows[0] !== undefined && pettyResult.rows[0].is_first_completion === true, JSON.stringify(pettyResult.rows[0]));

  // Grant entitlement first, so the age gate specifically (not the entitlement gate) is what
  // gets exercised -- same precondition the ORIGINAL (pre-item-3) test suite already used for
  // this exact quiz.
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [userRegression]);
  let ageGateStillWorks = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['private-private-trouble', 'PPT', 'private', daysAgo(1), 1, 1, 100, 'x', 'x', [], null, JSON.stringify({ q1: 'a' })],
    );
  } catch (e) {
    ageGateStillWorks = String(e.message).includes('age eligibility');
  }
  check('4. REGRESSION SAFETY: the one real age-gated quiz (private-private-trouble) still correctly rejects WITH entitlement but no age verification', ageGateStillWorks);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
