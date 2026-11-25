// Build 22 owner audit (2026-10-30), item 5: "Correct activity counts and active history."
// Proves the REAL get_my_active_daily_answer_count()/get_my_active_quiz_completions() RPCs
// (20261030030000_active_profile_activity_counts.sql): ROOM_ONLY exclusion (existing rule,
// not invented), the 12-month active window, and "a retake never renews first-completion
// credit back into the window." Dates computed relative to the REAL current time, exactly
// like run-active-totals-backfill-test.mjs, so this stays correct whenever it runs.
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

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
};

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030030000_active_profile_activity_counts.sql'));
  console.log('loaded: full schema + REAL active activity-count RPCs');

  const userX = '00000000-0000-0000-0000-000000000011';
  await db.query(`insert into auth.users (id) values ($1)`, [userX]);

  // --- Daily side: one PROFILE question (recent), one PROFILE question (expired), one
  // ROOM_ONLY question (recent) -- only the first should count.
  const profileRecentQ = 'a0000000-0000-0000-0000-000000000001';
  const profileExpiredQ = 'a0000000-0000-0000-0000-000000000002';
  const roomOnlyQ = 'a0000000-0000-0000-0000-000000000003';
  for (const [id, mode] of [[profileRecentQ, 'profile'], [profileExpiredQ, 'profile'], [roomOnlyQ, 'room_only']]) {
    await db.query(`insert into daily_questions (id, prompt, category, status, room, daily_mode) values ($1,'p','c','Live','public',$2)`, [id, mode]);
  }
  const optA = 'b0000000-0000-0000-0000-000000000001';
  const optB = 'b0000000-0000-0000-0000-000000000002';
  const optC = 'b0000000-0000-0000-0000-000000000003';
  await db.query(`insert into daily_options (id, question_id, "position", label) values ($1,$2,1,'l')`, [optA, profileRecentQ]);
  await db.query(`insert into daily_options (id, question_id, "position", label) values ($1,$2,1,'l')`, [optB, profileExpiredQ]);
  await db.query(`insert into daily_options (id, question_id, "position", label) values ($1,$2,1,'l')`, [optC, roomOnlyQ]);

  await db.query(`insert into daily_answers (user_id, question_id, option_id, created_at) values ($1,$2,$3,$4)`, [userX, profileRecentQ, optA, monthsAgo(2)]);
  await db.query(`insert into daily_answers (user_id, question_id, option_id, created_at) values ($1,$2,$3,$4)`, [userX, profileExpiredQ, optB, monthsAgo(14)]);
  await db.query(`insert into daily_answers (user_id, question_id, option_id, created_at) values ($1,$2,$3,$4)`, [userX, roomOnlyQ, optC, monthsAgo(2)]);

  await asUser(userX);
  const dailyCount = (await db.query(`select get_my_active_daily_answer_count() as n`)).rows[0].n;
  check('active daily answer count = 1 (only the recent PROFILE-mode answer; expired PROFILE and recent ROOM_ONLY both excluded)', dailyCount === 1, `n=${dailyCount}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // --- Quiz side: 3 scenarios -- active completion, expired completion, expired completion
  // LATER RETAKEN (must NOT renew into the active window).
  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`,
  )).rows;
  const fullPettyAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));
  const crisisQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='crisis' group by qq.question_key`,
  )).rows;
  const fullCrisisAnswers = Object.fromEntries(crisisQuestions.map((q) => [q.question_key, q.choices[0]]));

  await asUser(userX);
  // petty: active (recent first completion).
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', monthsAgo(2), pettyQuestions.length, 50, 50, 'r1', 'R1', [], null, JSON.stringify(fullPettyAnswers)],
  );
  // crisis: expired first completion (13 months ago), inserted directly to control completed_at
  // precisely (submit_quiz_completion trusts p_completed_at only for display/dedup, exactly as
  // documented -- inserting directly here is equivalent and simpler for this test).
  const crisisResultId = 'c0000000-0000-0000-0000-000000000001';
  const crisisOriginalCompletedAt = monthsAgo(13);
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,'crisis',$3,50,50,'r2','R2',$4,$5)`,
    [crisisResultId, userX, crisisOriginalCompletedAt, crisisQuestions.length, JSON.stringify(fullCrisisAnswers)],
  );
  await db.query(
    `insert into user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at) select $1, (select quiz_id from quizzes where quiz_key='crisis'), $2, $3`,
    [userX, crisisResultId, crisisOriginalCompletedAt],
  );

  const beforeRetake = (await db.query(`select * from get_my_active_quiz_completions() order by quiz_key`)).rows;
  check('active quiz completions = [petty] only (crisis is 13 months old, expired)', JSON.stringify(beforeRetake.map((r) => r.quiz_key)) === JSON.stringify(['petty']), JSON.stringify(beforeRetake));

  // Now retake crisis TODAY -- quiz_results gets a fresh row, but user_quiz_completions'
  // completed_at (13 months ago) must NOT move, and zero new evidence should be written.
  const retake = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['crisis', 'Crisis', 'fun', new Date().toISOString(), crisisQuestions.length, 50, 50, 'r3', 'R3', [], null, JSON.stringify(fullCrisisAnswers)],
  );
  check('retake of the expired crisis quiz is accepted, is_first_completion = false', retake.rows[0].is_first_completion === false, JSON.stringify(retake.rows[0]));

  const afterRetake = (await db.query(`select * from get_my_active_quiz_completions() order by quiz_key`)).rows;
  check('THE CRITICAL OUTCOME: active quiz completions is STILL [petty] only -- the retake did NOT renew crisis back into the active window', JSON.stringify(afterRetake.map((r) => r.quiz_key)) === JSON.stringify(['petty']), JSON.stringify(afterRetake));

  const completedAtUnchanged = (await db.query(
    `select completed_at from user_quiz_completions uqc join quizzes qz on qz.quiz_id=uqc.quiz_id where uqc.user_id=$1 and qz.quiz_key='crisis'`,
    [userX],
  )).rows[0].completed_at;
  check('user_quiz_completions.completed_at for crisis is still the ORIGINAL 13-months-ago timestamp, untouched by the retake', new Date(completedAtUnchanged).getTime() === new Date(crisisOriginalCompletedAt).getTime(), `completed_at=${completedAtUnchanged}`);

  await db.query(`select set_config('request.user_id', '', false)`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
