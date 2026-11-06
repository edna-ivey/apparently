// Build 22 owner audit (2026-10-31), item 2 (second round) + item 1 (third round): EXACT
// reproduction of the owner's own findings --
//   Second round: "Existing historical quiz_results rows: 1 / New user_quiz_completions rows:
//   0 / Submit a retake through submit_quiz_completion / Result incorrectly reports
//   is_first_completion=true / 59 new personality evidence rows are created."
//   Third round: "Existing quiz_results completion: August 1, 2025 / No corresponding
//   user_quiz_completions row / A retake arrives October 31, 2026 / Your new RPC correctly
//   blocks fresh trait evidence / But the retroactively created user_quiz_completions.
//   completed_at is October 31, 2026 / get_my_active_quiz_completions() incorrectly counts
//   the old quiz as active again."
// Proves both fixes against the REAL, unmodified 20261101020000 migration (which supersedes
// 20261031010000's retroactive-reservation timestamp -- now preserving the historical row's
// REAL completed_at instead of now()).
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

// A real, approved result for 'petty' (from quiz_result_definitions) -- score 4 is within
// its [0,6] band and well within the questionCount*3=24 bound item 3 (this round) now
// enforces. Every submit_quiz_completion call below uses these real, valid values so the new
// metadata validation (a SEPARATE fix, same migration) never interferes with this test.
const VALID_RESULT_ID = 'mostly-unbothered';
const VALID_SCORE = 4;

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261030030000_active_profile_activity_counts.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  console.log('loaded: full schema + REAL fixed submit_quiz_completion (latest)');

  const user = '00000000-0000-0000-0000-00000000006f';
  await db.query(`insert into auth.users (id) values ($1)`, [user]);

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));

  // --- Reproduce the exact precondition: 1 historical quiz_results row, 0 user_quiz_completions
  // rows -- a missed backfill record, inserted directly (as a real missed migration would
  // leave the database), never through any RPC.
  const historicalResultId = 'aaaaaaaa-0000-0000-0000-000000000001';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'petty',$3,4,33,$4,'RH',$5,$6)`,
    [historicalResultId, user, '2024-01-01T00:00:00Z', VALID_RESULT_ID, pettyQuestions.length, JSON.stringify(fullAnswers)],
  );
  const preconditionResults = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [user])).rows[0].n;
  const preconditionCompletions = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1`, [user])).rows[0].n;
  check('precondition: exactly 1 existing quiz_results row', preconditionResults === 1, `n=${preconditionResults}`);
  check('precondition: exactly 0 user_quiz_completions rows (the missed record)', preconditionCompletions === 0, `n=${preconditionCompletions}`);

  // --- Submit a retake through submit_quiz_completion. Dates are computed relative to the
  // real current time (never a hardcoded future-looking literal), since the future-date
  // rejection means a fixed date can silently become "in the future" relative to whenever
  // this test actually runs.
  await asUser(user);
  const retake = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(2), pettyQuestions.length, VALID_SCORE, 33, VALID_RESULT_ID, 'client-claimed title (must be ignored)', [], null, JSON.stringify(fullAnswers)],
  );
  check('submission accepted without error', retake.rows[0] !== undefined);
  check('THE FIX: is_first_completion = false (no longer incorrectly true)', retake.rows[0].is_first_completion === false, JSON.stringify(retake.rows[0]));

  const evidenceCount = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('THE FIX: zero new personality/trait evidence rows created (not 59)', evidenceCount === 0, `n=${evidenceCount}`);

  const answersCount = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [user])).rows[0].n;
  check('zero user_quiz_answers rows created for this retake', answersCount === 0, `n=${answersCount}`);

  const completionsAfter = (await db.query(`select * from user_quiz_completions where user_id = $1`, [user])).rows;
  check('exactly ONE user_quiz_completions row now exists (retroactively reserved)', completionsAfter.length === 1, JSON.stringify(completionsAfter));
  check('the reserved completion points at the ORIGINAL historical quiz_results row, never the new retake', completionsAfter[0]?.quiz_result_id === historicalResultId, JSON.stringify(completionsAfter[0]));

  const resultsAfter = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [user])).rows[0].n;
  check('both quiz_results rows (original + retake) still present in history', resultsAfter === 2, `n=${resultsAfter}`);

  // --- A SECOND retake must also be correctly blocked, with the SAME reserved completion.
  const retake2 = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), pettyQuestions.length, VALID_SCORE, 33, VALID_RESULT_ID, 'client-claimed title (must be ignored)', [], null, JSON.stringify(fullAnswers)],
  );
  check('a second retake is also correctly blocked (is_first_completion = false)', retake2.rows[0].is_first_completion === false, JSON.stringify(retake2.rows[0]));
  const completionsAfter2 = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1`, [user])).rows[0].n;
  check('still exactly ONE user_quiz_completions row after the second retake', completionsAfter2 === 1, `n=${completionsAfter2}`);
  const evidenceAfter2 = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('still zero evidence rows after the second retake', evidenceAfter2 === 0, `n=${evidenceAfter2}`);

  // --- Multiple missed historical rows: the EARLIEST one must win the retroactive reservation.
  const user2 = '00000000-0000-0000-0000-000000000070';
  await db.query(`insert into auth.users (id) values ($1)`, [user2]);
  const earlyHistoricalId = 'aaaaaaaa-0000-0000-0000-000000000002';
  const laterHistoricalId = 'aaaaaaaa-0000-0000-0000-000000000003';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'petty','2023-01-01T00:00:00Z',4,33,$3,'RE1',$4,$5)`,
    [earlyHistoricalId, user2, VALID_RESULT_ID, pettyQuestions.length, JSON.stringify(fullAnswers)],
  );
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'petty','2024-06-01T00:00:00Z',4,33,$3,'RE2',$4,$5)`,
    [laterHistoricalId, user2, VALID_RESULT_ID, pettyQuestions.length, JSON.stringify(fullAnswers)],
  );
  await asUser(user2);
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(3), pettyQuestions.length, VALID_SCORE, 33, VALID_RESULT_ID, 'x', [], null, JSON.stringify(fullAnswers)],
  );
  const user2Completion = (await db.query(`select quiz_result_id, completed_at from user_quiz_completions where user_id = $1`, [user2])).rows[0];
  check('with TWO missed historical rows, the EARLIEST one wins the retroactive reservation', user2Completion?.quiz_result_id === earlyHistoricalId, JSON.stringify(user2Completion));
  check('THE FIX (item 1, third round): the reserved completed_at is the EARLIEST row\'s REAL 2023-01-01 date, not now()', new Date(user2Completion.completed_at).getTime() === new Date('2023-01-01T00:00:00Z').getTime(), JSON.stringify(user2Completion));

  // === THE EXACT THIRD-ROUND REPRODUCTION: August 1 2025 completion, retake October 31 2026 ===
  const user3 = '00000000-0000-0000-0000-000000000075';
  await db.query(`insert into auth.users (id) values ($1)`, [user3]);
  const augustCompletedAt = '2025-08-01T00:00:00Z';
  const augustResultId = 'aaaaaaaa-0000-0000-0000-000000000004';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'petty',$3,4,33,$4,'August completion',$5,$6)`,
    [augustResultId, user3, augustCompletedAt, VALID_RESULT_ID, pettyQuestions.length, JSON.stringify(fullAnswers)],
  );
  await asUser(user3);
  // "A retake arrives October 31, 2026" -- real wall-clock today, per the owner's own report.
  const retakeNow = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', new Date().toISOString(), pettyQuestions.length, VALID_SCORE, 33, VALID_RESULT_ID, 'x', [], null, JSON.stringify(fullAnswers)],
  );
  check('the October 2026 retake of the August 2025 missed completion is accepted, correctly NOT first', retakeNow.rows[0].is_first_completion === false, JSON.stringify(retakeNow.rows[0]));
  const user3Completion = (await db.query(`select quiz_result_id, completed_at from user_quiz_completions where user_id = $1`, [user3])).rows[0];
  check('THE FIX: the reserved completed_at is the REAL August 1, 2025 date, never the October 2026 retake date', new Date(user3Completion.completed_at).getTime() === new Date(augustCompletedAt).getTime(), JSON.stringify(user3Completion));
  check('THE FIX: the reserved completion points at the August quiz_results row, never the October retake', user3Completion.quiz_result_id === augustResultId, JSON.stringify(user3Completion));

  // THE CORE OF THE THIRD-ROUND COMPLAINT: get_my_active_quiz_completions() must correctly
  // EXCLUDE this quiz -- August 2025 to October 2026 is 14+ months, well outside the 12-month
  // active window.
  const activeForUser3 = (await db.query(`select quiz_key from get_my_active_quiz_completions()`)).rows;
  check('THE FIX: get_my_active_quiz_completions() correctly excludes the 14-month-old quiz -- it is NOT wrongly reborn "active today"', !activeForUser3.some((r) => r.quiz_key === 'petty'), JSON.stringify(activeForUser3));

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
