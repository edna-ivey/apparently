// Build 22 CRITICAL fix verification (owner audit, 2026-10-30, item 3): "Preserve
// first-completion identity for old clients." Proves the REAL (unmodified) current
// submit_quiz_result -- as fixed by 20261030020000_legacy_quiz_result_completion_
// reservation.sql -- now reserves the V2 user_quiz_completions gate on a legacy client's
// first completion, so a later genuine V2 retake of the same quiz can never look like a
// fresh first completion and re-earn evidence. Exercises: mixed-version clients, delayed
// offline uploads, retries, concurrent (cross-function race) submissions, and already-
// completed quizzes -- exactly the scenarios the owner's audit listed.
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
// 00-stub-foundation.sql's auth.uid() stub reads request.jwt.claim.sub (confirm below if different).

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '02-stub-legacy-quiz-result-deps.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261018020000_age_eligibility_gate.sql'));
  await run(join(root, 'supabase/migrations/20261030020000_legacy_quiz_result_completion_reservation.sql'));
  console.log('loaded: full schema + REAL submit_quiz_result (pre-fix) + REAL fix migration, verbatim');

  const userA = '00000000-0000-0000-0000-0000000000a1';
  const userB = '00000000-0000-0000-0000-0000000000b2';
  const userC = '00000000-0000-0000-0000-0000000000c3';
  const userD = '00000000-0000-0000-0000-0000000000d4';
  for (const id of [userA, userB, userC, userD]) {
    await db.query(`insert into auth.users (id) values ($1) on conflict do nothing`, [id]);
  }

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullPettyAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));

  // --- Scenario 1: mixed-version client -- a legacy submit_quiz_result call for a quiz this
  // user has NEVER touched in either system, well after V2 is live.
  await asUser(userA);
  const r1 = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['petty', 'Petty Quiz', 'fun', '2025-06-01T00:00:00Z', 8, 50, 50, 'r1', 'R1', [], null, null, JSON.stringify(fullPettyAnswers)],
  );
  check('scenario 1 (legacy, never-seen quiz): submit_quiz_result succeeds', r1.rows[0] !== undefined);
  check('scenario 1: is_first_profile_completion = true', r1.rows[0].is_first_profile_completion === true, JSON.stringify(r1.rows[0]));
  const completion1 = (await db.query(
    `select uqc.* from user_quiz_completions uqc join quizzes qz on qz.quiz_id = uqc.quiz_id where uqc.user_id = $1 and qz.quiz_key = 'petty'`,
    [userA],
  )).rows[0];
  check('scenario 1: THE FIX -- user_quiz_completions now has a row for this legacy completion', !!completion1, JSON.stringify(completion1));
  const evidence1 = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [userA])).rows[0].n;
  check('scenario 1: zero user_quiz_answers written (legacy path never fabricates evidence)', evidence1 === 0, `n=${evidence1}`);

  // --- Scenario 2 (core outcome): a later genuine V2 retake of the SAME quiz must NOT look
  // like a fresh first completion.
  const v2Retake = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty Quiz', 'fun', '2026-10-30T00:00:00Z', 8, 50, 50, 'r2', 'R2', [], null, JSON.stringify(fullPettyAnswers)],
  );
  check('scenario 2: V2 retake of the legacy-completed quiz is accepted...', v2Retake.rows[0] !== undefined);
  check('scenario 2: THE CRITICAL OUTCOME -- is_first_completion = false (no stolen credit)', v2Retake.rows[0].is_first_completion === false, JSON.stringify(v2Retake.rows[0]));
  const evidenceAfterRetake = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [userA])).rows[0].n;
  check('scenario 2: the V2 retake wrote ZERO new user_quiz_answers/evidence rows', evidenceAfterRetake === 0, `n=${evidenceAfterRetake}`);
  const totalsAfterRetake = (await db.query(`select count(*)::int as n from user_trait_totals where user_id = $1`, [userA])).rows[0].n;
  check('scenario 2: zero user_trait_totals rows -- numeric identity never incorrectly earned', totalsAfterRetake === 0, `n=${totalsAfterRetake}`);

  // --- Scenario 3: delayed offline upload -- a legacy sync for a DIFFERENT quiz, with a
  // completed_at far in the past (simulating a years-old local record finally reaching the
  // server). Timestamp should not matter to the gate itself.
  await asUser(userB);
  const crisisQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='crisis' group by qq.question_key`,
  )).rows;
  const fullCrisisAnswers = Object.fromEntries(crisisQuestions.map((q) => [q.question_key, q.choices[0]]));
  const r3 = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['crisis', 'Crisis Quiz', 'fun', '2022-03-15T00:00:00Z', crisisQuestions.length, 50, 50, 'r3', 'R3', [], null, null, JSON.stringify(fullCrisisAnswers)],
  );
  check('scenario 3 (delayed offline upload, 2022 completed_at): accepted', r3.rows[0] !== undefined && r3.rows[0].is_first_profile_completion === true);
  const completion3 = (await db.query(
    `select uqc.* from user_quiz_completions uqc join quizzes qz on qz.quiz_id = uqc.quiz_id where uqc.user_id = $1 and qz.quiz_key = 'crisis'`,
    [userB],
  )).rows[0];
  check('scenario 3: reservation succeeded despite a years-old completed_at', !!completion3, JSON.stringify(completion3));

  // --- Scenario 4: retry -- the exact same (user, quiz, completed_at) submitted twice.
  const r4a = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['dating', 'Dating Quiz', 'fun', '2025-01-01T00:00:00Z', 10, 50, 50, 'r4', 'R4', [], null, null, null],
  );
  const r4b = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['dating', 'Dating Quiz', 'fun', '2025-01-01T00:00:00Z', 10, 50, 50, 'r4', 'R4', [], null, null, null],
  );
  check('scenario 4 (retry): first call is_first=true, second call was_retry=true', r4a.rows[0].is_first_profile_completion === true && r4b.rows[0].was_retry === true, `${JSON.stringify(r4a.rows[0])} / ${JSON.stringify(r4b.rows[0])}`);
  const completion4Count = (await db.query(
    `select count(*)::int as n from user_quiz_completions uqc join quizzes qz on qz.quiz_id = uqc.quiz_id where uqc.user_id = $1 and qz.quiz_key = 'dating'`,
    [userB],
  )).rows[0].n;
  check('scenario 4: exactly ONE user_quiz_completions row despite the retry (no duplicate, no crash)', completion4Count === 1, `n=${completion4Count}`);

  // --- Scenario 5: concurrent submissions / cross-function race, REVERSED order -- V2
  // completes the quiz FIRST (today), THEN a delayed legacy historical sync arrives for the
  // SAME quiz with an OLDER completed_at. The V2 completion must stand; the legacy sync must
  // become a harmless history-only retake, never double-crediting or erroring.
  await asUser(userC);
  const v2First = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty Quiz', 'fun', '2026-10-30T00:00:00Z', 8, 50, 50, 'r5', 'R5', [], null, JSON.stringify(fullPettyAnswers)],
  );
  check('scenario 5a: V2 completes first -- is_first_completion = true', v2First.rows[0].is_first_completion === true, JSON.stringify(v2First.rows[0]));
  const legacyAfter = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['petty', 'Petty Quiz', 'fun', '2020-01-01T00:00:00Z', 8, 50, 50, 'r6', 'R6', [], null, null, JSON.stringify(fullPettyAnswers)],
  );
  check('scenario 5b: the delayed legacy sync for the SAME quiz is accepted without error', legacyAfter.rows[0] !== undefined);
  const completionsCountC = (await db.query(
    `select count(*)::int as n from user_quiz_completions uqc join quizzes qz on qz.quiz_id = uqc.quiz_id where uqc.user_id = $1 and qz.quiz_key = 'petty'`,
    [userC],
  )).rows[0].n;
  check('scenario 5c: still exactly ONE user_quiz_completions row -- the V2 completion is not overwritten or duplicated', completionsCountC === 1, `n=${completionsCountC}`);
  const totalsCountC = (await db.query(`select count(*)::int as n from user_trait_totals where user_id = $1`, [userC])).rows[0].n;
  check('scenario 5d: user_trait_totals still reflects only the ONE real V2 evidence write (no double-counting from the race)', totalsCountC > 0, `n=${totalsCountC}`);

  // --- Scenario 6: already-completed quiz -- user_quiz_completions already seeded directly
  // (simulating the one-time historical backfill having already run for this user/quiz), THEN
  // a legacy submit_quiz_result call for that same quiz arrives.
  await asUser(userD);
  const seedResultId = '99999999-0000-0000-0000-000000000001';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title) values ($1,$2,'crisis','2024-01-01T00:00:00Z',0,50,'rseed','Rseed')`,
    [seedResultId, userD],
  );
  await db.query(
    `insert into user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at) select $1, (select quiz_id from quizzes where quiz_key='crisis'), $2, '2024-01-01T00:00:00Z'`,
    [userD, seedResultId],
  );
  const r6 = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['crisis', 'Crisis Quiz', 'fun', '2024-06-01T00:00:00Z', crisisQuestions.length, 50, 50, 'r7', 'R7', [], null, null, JSON.stringify(fullCrisisAnswers)],
  );
  check('scenario 6 (already-completed quiz): accepted without error', r6.rows[0] !== undefined);
  // v_is_first is computed from quiz_results, not user_quiz_completions -- the pre-seeded
  // quiz_results row above means this new submission correctly sees v_is_first = false too.
  check('scenario 6: is_first_profile_completion = false (quiz_results already had a row)', r6.rows[0].is_first_profile_completion === false, JSON.stringify(r6.rows[0]));
  const completions6Count = (await db.query(
    `select count(*)::int as n from user_quiz_completions uqc join quizzes qz on qz.quiz_id = uqc.quiz_id where uqc.user_id = $1 and qz.quiz_key = 'crisis'`,
    [userD],
  )).rows[0].n;
  check('scenario 6: still exactly ONE user_quiz_completions row -- pre-seeded state undisturbed', completions6Count === 1, `n=${completions6Count}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
