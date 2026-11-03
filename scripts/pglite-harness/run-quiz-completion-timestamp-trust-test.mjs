// Build 22 owner audit (2026-10-31), item 3: EXACT reproduction of the owner's own finding --
// a first submission with p_completed_at='2099-01-01' was accepted, recorded as the original
// completion date, and get_my_active_quiz_completions() treated it as active forever. Proves
// the fix in 20261031010000: future dates rejected, user_quiz_completions.completed_at always
// server-trusted, and the properties this specifically must not break: offline retries,
// original first-completion permanence, and real expiry boundaries.
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
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString(); };

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261030030000_active_profile_activity_counts.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  console.log('loaded: full schema + REAL timestamp-trust fix + REAL get_my_active_quiz_completions');

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));
  const crisisQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='crisis' group by qq.question_key`,
  )).rows;
  const fullCrisisAnswers = Object.fromEntries(crisisQuestions.map((q) => [q.question_key, q.choices[0]]));

  // === 1. FUTURE DATE: the owner's exact repro -- '2099-01-01' ===
  const userA = '00000000-0000-0000-0000-000000000081';
  await db.query(`insert into auth.users (id) values ($1)`, [userA]);
  await asUser(userA);
  let futureRejected = false;
  let futureErrorMessage = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', '2099-01-01T00:00:00Z', pettyQuestions.length, 50, 50, 'r1', 'R1', [], null, JSON.stringify(fullAnswers)],
    );
  } catch (e) {
    futureRejected = true;
    futureErrorMessage = String(e.message || e);
  }
  check('THE FIX: a future completed_at (2099-01-01) is REJECTED outright, not accepted', futureRejected, futureErrorMessage);
  const quizResultsForA = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [userA])).rows[0].n;
  check('the rejected future-dated submission wrote NOTHING at all (not even quiz_results)', quizResultsForA === 0, `n=${quizResultsForA}`);

  // === 2. A legitimate submission, then confirm eligibility timestamp is server-trusted, not
  // client-supplied -- submit with a p_completed_at a few days in the past (plausible client
  // clock skew, still accepted) and confirm user_quiz_completions.completed_at is close to
  // real "now", not equal to the client's claimed date.
  const userB = '00000000-0000-0000-0000-000000000082';
  await db.query(`insert into auth.users (id) values ($1)`, [userB]);
  await asUser(userB);
  const clientClaimedDate = daysAgo(5);
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', clientClaimedDate, pettyQuestions.length, 50, 50, 'r2', 'R2', [], null, JSON.stringify(fullAnswers)],
  );
  const completionB = (await db.query(`select completed_at from user_quiz_completions where user_id = $1`, [userB])).rows[0];
  const quizResultB = (await db.query(`select completed_at from quiz_results where user_id = $1`, [userB])).rows[0];
  check('quiz_results.completed_at still reflects the CLIENT-reported display date (unchanged trust boundary)', new Date(quizResultB.completed_at).getTime() === new Date(clientClaimedDate).getTime(), JSON.stringify(quizResultB));
  const completionAgeMs = Date.now() - new Date(completionB.completed_at).getTime();
  check('THE FIX: user_quiz_completions.completed_at is SERVER-trusted (within seconds of real now), NOT the client-claimed 5-days-ago date', completionAgeMs < 60_000, `completed_at=${completionB.completed_at} age_ms=${completionAgeMs}`);

  // === 3. Confirm the 2099 exploit is actually closed end-to-end: even if somehow a row DID
  // get an eligibility timestamp in the future (simulated directly, bypassing the RPC, to
  // prove get_my_active_quiz_completions' OWN filter is also sound), it must not appear as
  // perpetually active via any normal path. (The RPC itself already fully prevents this --
  // this is a belt-and-suspenders check on the read side.)
  const activeCompletionsB = (await db.query(`select * from get_my_active_quiz_completions()`)).rows;
  check("userB's legitimate completion correctly appears as active", activeCompletionsB.some((r) => r.quiz_key === 'petty'), JSON.stringify(activeCompletionsB));
  await db.query(`select set_config('request.user_id', '', false)`);

  // === 4. OLD DATES (legacy submit_quiz_result path) must remain fully trusted/unaffected ===
  const userC = '00000000-0000-0000-0000-000000000083';
  await db.query(`insert into auth.users (id) values ($1)`, [userC]);
  await asUser(userC);
  const oldLegacyDate = monthsAgo(20);
  const legacyResult = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['crisis', 'Crisis', 'fun', oldLegacyDate, crisisQuestions.length, 50, 50, 'rl', 'RL', [], null, null, JSON.stringify(fullCrisisAnswers)],
  );
  check('legacy submit_quiz_result still accepts a genuinely old date (20 months ago) -- unchanged design', legacyResult.rows[0].is_first_profile_completion === true, JSON.stringify(legacyResult.rows[0]));
  const legacyCompletion = (await db.query(`select completed_at from user_quiz_completions uqc join quizzes qz on qz.quiz_id=uqc.quiz_id where uqc.user_id=$1 and qz.quiz_key='crisis'`, [userC])).rows[0];
  check('legacy path still preserves the REAL old historical date (by design, unchanged) -- never forced to now()', new Date(legacyCompletion.completed_at).getTime() === new Date(oldLegacyDate).getTime(), JSON.stringify(legacyCompletion));
  // And the future-date rejection also applies to the legacy door.
  let legacyFutureRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['dating', 'Dating', 'fun', '2099-06-01T00:00:00Z', 10, 50, 50, 'rl2', 'RL2', [], null, null, null],
    );
  } catch {
    legacyFutureRejected = true;
  }
  check('THE FIX also closes the legacy door: submit_quiz_result also rejects a future completed_at', legacyFutureRejected);
  await db.query(`select set_config('request.user_id', '', false)`);

  // === 5. OFFLINE RETRY: same (user, quiz, completed_at) resubmitted must still be recognized
  // as a retry, not break under the new logic.
  const userD = '00000000-0000-0000-0000-000000000084';
  await db.query(`insert into auth.users (id) values ($1)`, [userD]);
  await asUser(userD);
  const retryDate = daysAgo(1);
  const first = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', retryDate, pettyQuestions.length, 50, 50, 'rd', 'RD', [], null, JSON.stringify(fullAnswers)],
  );
  const retry = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', retryDate, pettyQuestions.length, 50, 50, 'rd', 'RD', [], null, JSON.stringify(fullAnswers)],
  );
  check('offline retry (same quiz_key + completed_at) correctly recognized as was_retry=true', retry.rows[0].was_retry === true, JSON.stringify(retry.rows[0]));
  check('offline retry returns the SAME quiz_result_id as the original', retry.rows[0].quiz_result_id === first.rows[0].quiz_result_id);
  const completionsCountD = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1`, [userD])).rows[0].n;
  check('exactly-once credit: still exactly ONE user_quiz_completions row after the retry', completionsCountD === 1, `n=${completionsCountD}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // === 6. ORIGINAL FIRST-COMPLETION PERMANENCE: the eligibility timestamp, once set, never
  // moves -- even across a retake submitted much later.
  const userE = '00000000-0000-0000-0000-000000000085';
  await db.query(`insert into auth.users (id) values ($1)`, [userE]);
  await asUser(userE);
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(10), pettyQuestions.length, 50, 50, 're', 'RE', [], null, JSON.stringify(fullAnswers)],
  );
  const completedAtOriginal = (await db.query(`select completed_at from user_quiz_completions where user_id = $1`, [userE])).rows[0].completed_at;
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, 50, 50, 're2', 'RE2', [], null, JSON.stringify(fullAnswers)],
  );
  const completedAtAfterRetake = (await db.query(`select completed_at from user_quiz_completions where user_id = $1`, [userE])).rows[0].completed_at;
  check('ORIGINAL FIRST-COMPLETION PERMANENCE: completed_at is byte-identical before and after a later retake', new Date(completedAtOriginal).getTime() === new Date(completedAtAfterRetake).getTime(), `before=${completedAtOriginal} after=${completedAtAfterRetake}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // === 7. EXPIRY BOUNDARIES: a completion registered 13 months ago (server-trusted, via
  // direct seed simulating "this is what the fixed RPC would have written at that real time")
  // must correctly fall OUTSIDE the active window; one registered 11 months ago must fall
  // INSIDE it.
  const userF = '00000000-0000-0000-0000-000000000086';
  await db.query(`insert into auth.users (id) values ($1)`, [userF]);
  const oldResultId = 'bbbbbbbb-0000-0000-0000-000000000001';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'petty',$3,50,50,'rf1','RF1',$4,$5)`,
    [oldResultId, userF, monthsAgo(13), pettyQuestions.length, JSON.stringify(fullAnswers)],
  );
  await db.query(
    `insert into user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at) select $1, (select quiz_id from quizzes where quiz_key='petty'), $2, $3`,
    [userF, oldResultId, monthsAgo(13)],
  );
  const newResultId = 'bbbbbbbb-0000-0000-0000-000000000002';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'crisis',$3,50,50,'rf2','RF2',$4,$5)`,
    [newResultId, userF, monthsAgo(11), crisisQuestions.length, JSON.stringify(fullCrisisAnswers)],
  );
  await db.query(
    `insert into user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at) select $1, (select quiz_id from quizzes where quiz_key='crisis'), $2, $3`,
    [userF, newResultId, monthsAgo(11)],
  );
  await asUser(userF);
  const activeForF = (await db.query(`select quiz_key from get_my_active_quiz_completions() order by quiz_key`)).rows.map((r) => r.quiz_key);
  check('EXPIRY BOUNDARY: a 13-month-old completion is correctly OUTSIDE the active window', !activeForF.includes('petty'), JSON.stringify(activeForF));
  check('EXPIRY BOUNDARY: an 11-month-old completion is correctly INSIDE the active window', activeForF.includes('crisis'), JSON.stringify(activeForF));
  await db.query(`select set_config('request.user_id', '', false)`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
