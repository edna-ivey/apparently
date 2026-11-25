// Build 22 owner audit (2026-10-31), item 3 (third round): EXACT reproduction of the owner's
// own finding -- "I submitted eight valid Petty answers while reporting: question_count=1,
// score=90000, percent=100, a fabricated result_id, and a fabricated result_title.
// submit_quiz_completion accepted and saved all of them." Proves the fix in
// 20261101010000_quiz_result_definitions_catalog.sql + 20261101020000_quiz_completion_
// metadata_validation_and_clock_skew.sql against the REAL, unmodified migrations.
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
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  console.log('loaded: full schema + REAL quiz_result_definitions catalog + REAL metadata-validated submit_quiz_completion');

  const resultCatalogCount = (await db.query(`select count(*)::int as n from quiz_result_definitions`)).rows[0].n;
  // Row count grows every round a quiz is added/revised (now 162, across the final 17-quiz
  // Private catalog plus every free/dualDimension quiz) -- this precondition only needs "the
  // catalog is really populated," never an exact frozen count that would go stale every round.
  check('precondition: quiz_result_definitions is populated with real content', resultCatalogCount > 0, `n=${resultCatalogCount}`);

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));
  const VALID_RESULT_ID = (await db.query(`select result_key from quiz_result_definitions where quiz_id = (select quiz_id from quizzes where quiz_key='petty') limit 1`)).rows[0].result_key;

  const user = '00000000-0000-0000-0000-0000000000a1';
  await db.query(`insert into auth.users (id) values ($1)`, [user]);
  await asUser(user);

  // === THE EXACT REPRODUCTION: 8 valid Petty answers, fabricated metadata. ===
  let rejected = false;
  let errorMessage = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), 1 /* fabricated question_count */, 90000 /* fabricated score */, 100, 'totally-fake-result-id', 'Fabricated Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch (e) {
    rejected = true;
    errorMessage = String(e.message || e);
  }
  check('THE FIX: the exact reproduction (question_count=1, score=90000, fake result_id/title) is now REJECTED', rejected, errorMessage.slice(0, 200));
  const resultsAfterRejection = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [user])).rows[0].n;
  check('THE FIX: nothing was written at all -- not quiz_results, not evidence', resultsAfterRejection === 0, `n=${resultsAfterRejection}`);

  // === Isolate WHICH validation catches it -- question_count alone, with an otherwise-valid
  // real result_id/score, must also be rejected (proving the question_count check isn't
  // merely incidental to the other fabrications).
  let questionCountRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), 1, 4, 33, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch (e) {
    questionCountRejected = true;
    errorMessage = String(e.message || e);
  }
  check('question_count=1 alone (otherwise valid result_id/score) is rejected', questionCountRejected, errorMessage.slice(0, 200));
  check('the rejection message names question_count specifically', errorMessage.toLowerCase().includes('question_count'), errorMessage);

  // === score alone, with a correct question_count/result_id, must be rejected. ===
  let scoreRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, 90000, 100, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch (e) {
    scoreRejected = true;
    errorMessage = String(e.message || e);
  }
  check('score=90000 alone (otherwise valid question_count/result_id) is rejected', scoreRejected, errorMessage.slice(0, 200));
  check('the rejection message names the score bound specifically', errorMessage.toLowerCase().includes('score'), errorMessage);
  // Sanity: the legitimate maximum (questionCount*3 = 24 for Petty's 8 questions) is NOT
  // itself rejected -- the bound must not be off-by-one too strict. A DIFFERENT user, so this
  // probe's own (necessarily successful) first-completion never collides with the dedicated
  // "legitimate submission" check below.
  const sanityUser = '00000000-0000-0000-0000-0000000000a2';
  await db.query(`insert into auth.users (id) values ($1)`, [sanityUser]);
  await asUser(sanityUser);
  let legitimateMaxRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, pettyQuestions.length * 3, 100, VALID_RESULT_ID, 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch {
    legitimateMaxRejected = true;
  }
  check('the legitimate maximum possible score (questionCount*3) is correctly ACCEPTED, not rejected', !legitimateMaxRejected);
  await asUser(user);

  // === result_id alone, with correct question_count/score, must be rejected. ===
  let resultIdRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, 4, 33, 'totally-fake-result-id', 'Real Title', [], null, JSON.stringify(fullAnswers)],
    );
  } catch (e) {
    resultIdRejected = true;
    errorMessage = String(e.message || e);
  }
  check('an unknown result_id alone (otherwise valid question_count/score) is rejected', resultIdRejected, errorMessage.slice(0, 200));
  check('the rejection message names the unknown result_id', errorMessage.includes('totally-fake-result-id'), errorMessage);

  // === A LEGITIMATE submission with all-real metadata must succeed, and the stored title
  // must be the CATALOG's real title, not whatever the client happened to send (even if the
  // client's title is technically correct -- it is still never trusted for storage).
  const realTitleRow = (await db.query(`select result_title from quiz_result_definitions where result_key = $1 and quiz_id = (select quiz_id from quizzes where quiz_key='petty')`, [VALID_RESULT_ID])).rows[0];
  const legit = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, 4, 33, VALID_RESULT_ID, 'this exact client title must never be stored', [], null, JSON.stringify(fullAnswers)],
  );
  check('a fully legitimate submission is accepted', legit.rows[0] !== undefined && legit.rows[0].is_first_completion === true, JSON.stringify(legit.rows[0]));
  const storedResult = (await db.query(`select result_title, question_count, score from quiz_results where id = $1`, [legit.rows[0].quiz_result_id])).rows[0];
  check('THE FIX: the stored result_title is the CATALOG\'s real title, never the client-sent one', storedResult.result_title === realTitleRow.result_title && storedResult.result_title !== 'this exact client title must never be stored', JSON.stringify(storedResult));
  check('the legitimate question_count/score were stored correctly, unaffected by the validation', storedResult.question_count === pettyQuestions.length && storedResult.score === 4, JSON.stringify(storedResult));

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
