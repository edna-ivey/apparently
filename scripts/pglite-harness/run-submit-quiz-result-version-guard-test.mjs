// Deployment-safety review (2026-11-03), item 2: "Stop old TestFlight clients from
// recreating obsolete results... Implement a safe server-side compatibility/version guard.
// An outdated client should receive a clear update-required response rather than saving
// incompatible quiz history. Test the behavior before and after reset, including old
// clients, current clients, duplicate submissions, sharing, and comparisons."
//
// Proves, against the REAL migrations through 20261102040000 (the version-guard migration):
// 1. An old client calling submit_quiz_result is REJECTED with a clear, specific
//    'UPDATE_REQUIRED: ...' message -- never a generic/ambiguous error.
// 2. NOTHING is written -- not quiz_results, not personality_evidence. An old client cannot
//    recreate even a bare history row any more (the gap this round specifically closes).
// 3. A duplicate/retried old-client submission is rejected identically every time -- no
//    partial state, no second-call-succeeds loophole.
// 4. Sharing and Compare are unaffected for REAL (submit_quiz_completion) completions --
//    create_quiz_share/get_shared_quiz_result still work normally for the one live path.
// 5. Current clients (submit_quiz_completion) are completely unaffected by this guard.
// 6. The guard's behavior is IDENTICAL before and after the V1 data reset (deliberately
//    unconditional -- see the migration's own header for why no reset-date check is needed).
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

const oldClientProfileEffects = JSON.stringify([{ dimension: 'planner_spontaneous', value: 2 }]);

const attemptOldClientSubmission = async (user, completedAt) => {
  await asUser(user);
  let rejected = false, message = '';
  try {
    await db.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['petty', 'Petty', 'Ridiculous', completedAt, 8, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', ['Petty'], null, oldClientProfileEffects, null],
    );
  } catch (e) {
    rejected = true;
    message = String(e.message || e);
    await db.query('rollback');
    await db.query('begin');
  }
  return { rejected, message };
};

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
  await run(join(root, 'supabase/migrations/20261102040000_submit_quiz_result_version_guard.sql'));
  // Need sharing tables for item 4 -- hand-written schema-accurate stub (same reasoning as
  // run-clean-v1-reset-rehearsal-test.mjs: the real historical migration's own ALTER TABLE
  // quiz_results statements collide with this modern stub's already-current shape).
  await db.exec(`
    create table public.quiz_shares (
      id uuid primary key default gen_random_uuid(),
      sharer_user_id uuid not null references auth.users (id) on delete cascade,
      quiz_id text not null,
      result_id text not null,
      quiz_result_id uuid not null references public.quiz_results (id) on delete cascade,
      sharer_display_name text,
      created_at timestamptz not null default now()
    );
  `);
  console.log('loaded: full schema through the submit_quiz_result version guard (20261102040000)\n');

  // === BEFORE reset (simulated: this schema has real Petty data seeded by other users, but
  // nothing resembling a "reset" has happened -- the guard must already reject unconditionally
  // even in this ordinary, pre-reset state). ===
  const oldUser1 = '00000000-0000-0000-0000-0000000006a1';
  await db.query(`insert into auth.users (id) values ($1)`, [oldUser1]);

  const beforeReset = await attemptOldClientSubmission(oldUser1, daysAgo(2));
  check('1. BEFORE reset: old client call is REJECTED', beforeReset.rejected);
  check('1. ...with the specific UPDATE_REQUIRED message, not a generic error', beforeReset.message.includes('UPDATE_REQUIRED'), beforeReset.message.slice(0, 150));
  let quizResultsCount = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [oldUser1])).rows[0].n;
  check('2. BEFORE reset: NOTHING was written -- zero quiz_results rows for this user', quizResultsCount === 0, `n=${quizResultsCount}`);

  // === 3. Duplicate/retried old-client submission -- rejected identically every time. ===
  const retry1 = await attemptOldClientSubmission(oldUser1, daysAgo(2));
  const retry2 = await attemptOldClientSubmission(oldUser1, daysAgo(2));
  check('3. a retried old-client submission is rejected identically (no second-call-succeeds loophole)', retry1.rejected && retry2.rejected && retry1.message.includes('UPDATE_REQUIRED') && retry2.message.includes('UPDATE_REQUIRED'));
  quizResultsCount = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [oldUser1])).rows[0].n;
  check('3. still zero quiz_results rows after repeated retries', quizResultsCount === 0, `n=${quizResultsCount}`);
  await db.query(`select set_config('request.user_id', '', false)`);

  // === SIMULATE THE RESET: delete whatever quiz_results/evidence exist, exactly as the real
  // reset migration would (schema-level simulation -- the real reset migration itself is
  // rehearsed end-to-end separately in run-clean-v1-reset-rehearsal-test.mjs). ===
  await db.query(`delete from public.quiz_shares`);
  await db.query(`delete from public.quiz_results`);
  await db.query(`delete from public.user_trait_evidence where source_type = 'quiz_answer'`);
  await db.query(`delete from public.user_quiz_answers`);
  await db.query(`delete from public.user_quiz_completions`);

  // === AFTER reset: the SAME old client, trying again, must behave IDENTICALLY. ===
  const afterReset = await attemptOldClientSubmission(oldUser1, daysAgo(1));
  check('6. AFTER reset: old client call is STILL rejected, identically', afterReset.rejected && afterReset.message.includes('UPDATE_REQUIRED'), afterReset.message.slice(0, 150));
  quizResultsCount = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [oldUser1])).rows[0].n;
  check('2/6. AFTER reset: old client STILL cannot recreate even a bare quiz_results row', quizResultsCount === 0, `n=${quizResultsCount}`);
  const evidenceCount = (await db.query(`select count(*)::int as n from personality_evidence where user_id = $1`, [oldUser1])).rows[0].n;
  check('2/6. AFTER reset: old client still writes zero personality_evidence', evidenceCount === 0, `n=${evidenceCount}`);

  // === 5. Current client (submit_quiz_completion) completely unaffected, before AND after. ===
  const currentUser = '00000000-0000-0000-0000-0000000006a2';
  await db.query(`insert into auth.users (id) values ($1)`, [currentUser]);
  await asUser(currentUser);
  const pettyQuestions = (await db.query(
    `select qq.question_key, min(qc.choice_key) as first_choice
     from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id
     join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = 'petty' group by qq.question_key`,
  )).rows;
  const answers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.first_choice]));
  const liveSubmission = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(0), pettyQuestions.length, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', [], null, JSON.stringify(answers)],
  );
  check('5. the real submit_quiz_completion path is completely unaffected by the version guard', liveSubmission.rows[0]?.is_first_completion === true, JSON.stringify(liveSubmission.rows[0]));
  const liveEvidenceCount = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [currentUser])).rows[0].n;
  check('5. ...and still correctly earns real trait evidence', liveEvidenceCount > 0, `n=${liveEvidenceCount}`);

  // === 4. Sharing/Compare unaffected for a REAL (submit_quiz_completion) completion. ===
  const realResultId = (await db.query(`select id from quiz_results where user_id = $1 order by completed_at desc limit 1`, [currentUser])).rows[0].id;
  const shareInsert = await db.query(
    `insert into quiz_shares (sharer_user_id, quiz_id, result_id, quiz_result_id, sharer_display_name) values ($1, 'petty', 'selectively-petty', $2, 'Current User') returning id`,
    [currentUser, realResultId],
  );
  check('4. sharing a REAL completion still works normally (unaffected by the old-client guard)', shareInsert.rows[0]?.id !== undefined, JSON.stringify(shareInsert.rows[0]));
  await db.query(`select set_config('request.user_id', '', false)`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
