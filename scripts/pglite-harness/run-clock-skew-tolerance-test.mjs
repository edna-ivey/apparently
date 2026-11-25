// Build 22 owner audit (2026-10-31), item 5 (third round): "Check that an ordinary client's
// clock being slightly ahead does not unnecessarily prevent legitimate quiz submissions.
// Eligibility must remain server-controlled." Proves, against the REAL, unmodified
// 20261101020000 migration:
//   1. A client clock a couple of minutes fast is still accepted (within the 5-minute
//      tolerance) for BOTH submit_quiz_completion and submit_quiz_result.
//   2. A client claiming a wildly future date (the original 2099 exploit) is still rejected
//      outright on both -- the tolerance only absorbs ordinary drift, it does not reopen the
//      exploit.
//   3. Eligibility (user_quiz_completions.completed_at) remains server-controlled even for an
//      ACCEPTED slightly-ahead submission -- it is never the client's (slightly fast)
//      p_completed_at.
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
const minutesFromNow = (n) => new Date(Date.now() + n * 60 * 1000).toISOString();

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
  console.log('loaded: full schema + REAL clock-skew-tolerant submit_quiz_completion/submit_quiz_result');

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));
  const VALID_RESULT_ID = (await db.query(`select result_key from quiz_result_definitions where quiz_id = (select quiz_id from quizzes where quiz_key='petty') limit 1`)).rows[0].result_key;

  // === 1. submit_quiz_completion: a clock 2 minutes fast is ACCEPTED. ===
  const userA = '00000000-0000-0000-0000-0000000000b1';
  await db.query(`insert into auth.users (id) values ($1)`, [userA]);
  await asUser(userA);
  const slightlyAheadSubmission = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', minutesFromNow(2), pettyQuestions.length, 4, 33, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
  );
  check('1. submit_quiz_completion ACCEPTS a client clock 2 minutes fast (within the 5-minute tolerance)', slightlyAheadSubmission.rows[0] !== undefined && slightlyAheadSubmission.rows[0].is_first_completion === true, JSON.stringify(slightlyAheadSubmission.rows[0]));

  // Eligibility remains server-controlled: user_quiz_completions.completed_at must be close
  // to REAL now(), never the client's 2-minutes-ahead claim.
  const completionRow = (await db.query(`select completed_at from user_quiz_completions where user_id = $1`, [userA])).rows[0];
  const driftFromRealNowMs = Math.abs(Date.now() - new Date(completionRow.completed_at).getTime());
  check('1. eligibility (user_quiz_completions.completed_at) stayed server-controlled -- within seconds of REAL now(), not the client\'s 2-minutes-ahead claim', driftFromRealNowMs < 30_000, `drift_ms=${driftFromRealNowMs}`);

  // === 2. submit_quiz_completion: a WILDLY future date (the original exploit) is still
  // rejected outright -- the tolerance does not reopen it. ===
  const userB = '00000000-0000-0000-0000-0000000000b2';
  await db.query(`insert into auth.users (id) values ($1)`, [userB]);
  await asUser(userB);
  let wildFutureRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', '2099-01-01T00:00:00Z', pettyQuestions.length, 4, 33, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch {
    wildFutureRejected = true;
  }
  check('2. submit_quiz_completion still REJECTS a wildly future date (2099) -- the tolerance did not reopen the exploit', wildFutureRejected);

  // A date just OUTSIDE the tolerance (10 minutes ahead) must also be rejected -- confirming
  // the bound is a real, bounded window, not accidentally unlimited.
  let justOutsideToleranceRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', minutesFromNow(10), pettyQuestions.length, 4, 33, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch {
    justOutsideToleranceRejected = true;
  }
  check('2. a date 10 minutes ahead (outside the 5-minute tolerance) is still rejected', justOutsideToleranceRejected);
  await db.query(`select set_config('request.user_id', '', false)`);

  // === 3. submit_quiz_result (legacy path): same tolerance, same wild-future rejection,
  // without disturbing its deliberate old-date trust. ===
  const userC = '00000000-0000-0000-0000-0000000000b3';
  await db.query(`insert into auth.users (id) values ($1)`, [userC]);
  await asUser(userC);
  const legacySlightlyAhead = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['petty', 'Petty', 'fun', minutesFromNow(2), pettyQuestions.length, 4, 33, 'r1', 'R1', [], null, null, null],
  );
  check('3. submit_quiz_result ACCEPTS a client clock 2 minutes fast too', legacySlightlyAhead.rows[0] !== undefined && legacySlightlyAhead.rows[0].is_first_profile_completion === true, JSON.stringify(legacySlightlyAhead.rows[0]));

  let legacyWildFutureRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['crisis', 'Crisis', 'fun', '2099-01-01T00:00:00Z', 10, 4, 33, 'r2', 'R2', [], null, null, null],
    );
  } catch {
    legacyWildFutureRejected = true;
  }
  check('3. submit_quiz_result still REJECTS a wildly future date (2099)', legacyWildFutureRejected);

  // Old-date trust is UNCHANGED -- a genuinely old legacy date (20 months ago) is still fully
  // accepted and preserved, exactly as the prior round's design requires.
  const oldDate = (() => { const d = new Date(); d.setMonth(d.getMonth() - 20); return d.toISOString(); })();
  const legacyOldDate = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['dating', 'Dating', 'fun', oldDate, 10, 4, 33, 'r3', 'R3', [], null, null, null],
  );
  check('3. a genuinely old legacy date (20 months ago) remains fully accepted -- old-date trust unchanged', legacyOldDate.rows[0] !== undefined && legacyOldDate.rows[0].is_first_profile_completion === true, JSON.stringify(legacyOldDate.rows[0]));

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
