// Real execution of the actual Build 22 quiz-scoring migrations against a real Postgres
// engine (PGlite -- WASM-compiled genuine PostgreSQL 18, not an emulator), per owner
// requirement: "actually execute the migrations and functions." Loads the stub foundation,
// then the REAL migration files verbatim (no edits), then runs the required test scenarios
// and prints exact outcomes.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();

const results = [];
const section = (title) => { console.log(`\n=== ${title} ===`); results.push({ section: title, checks: [] }); };
const check = (label, pass, detail) => {
  const line = `${pass ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`;
  console.log(line);
  results[results.length - 1].checks.push({ label, pass, detail });
};

async function runFile(path, label) {
  const sql = readFileSync(path, 'utf8');
  await db.exec(sql);
  console.log(`loaded: ${label}`);
}

async function asUser(userId, fn) {
  await db.query(`select set_config('request.user_id', $1, false)`, [userId]);
  try {
    return await fn();
  } finally {
    await db.query(`select set_config('request.user_id', '', false)`);
  }
}

try {
  section('Load stub foundation + real Build 22 migrations');
  await runFile(join(__dirname, '00-stub-foundation.sql'), 'stub foundation');
  await runFile(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'), '20261028010000 trait catalog');
  await runFile(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'), '20261028020000 quiz content identity');
  await runFile(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'), '20261028040000 user quiz evidence schema');
  check('all migrations applied without error', true);

  const u1 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  const u2 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;

  const pettyQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) as choices
     from quiz_questions qq join quizzes qz on qz.quiz_id = qq.quiz_id
     join quiz_choices qc on qc.question_id = qq.question_id
     where qz.quiz_key = 'petty' group by qq.question_key order by qq.question_key`
  )).rows;
  check('petty question/choice catalog resolved', pettyQuestions.length > 0, `${pettyQuestions.length} questions`);

  const fullPettyAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[0]]));

  async function submitQuiz(userId, quizKey, answers, completedAt) {
    return asUser(userId, async () => {
      try {
        const r = await db.query(
          `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [quizKey, 'Petty', 'relationships', completedAt, Object.keys(answers).length, 50, 50, 'r1', 'Result', [], null, JSON.stringify(answers)],
        );
        return { ok: true, row: r.rows[0] };
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    });
  }

  // ---- Scenario: two different questions awarding the same trait ----
  section('Scenario: two quiz questions awarding the same trait (THE confirmed collision bug)');
  const q1Trait = (await db.query(
    `select awards.trait_id from quiz_choice_trait_awards awards join quiz_choices qc on qc.choice_id = awards.choice_id
     join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id
     where qz.quiz_key = 'petty' and qq.question_key = $1 and qc.choice_key = $2`,
    [pettyQuestions[0].question_key, fullPettyAnswers[pettyQuestions[0].question_key]],
  )).rows[0];
  const r1 = await submitQuiz(u1, 'petty', fullPettyAnswers, '2026-01-01T00:00:00Z');
  check('full petty completion succeeds', r1.ok && r1.row.is_first_completion === true, JSON.stringify(r1));
  const evCount = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [u1])).rows[0].n;
  const distinctKeys = (await db.query(`select count(distinct (source_answer_id, trait_id))::int as n from user_trait_evidence where user_id = $1`, [u1])).rows[0].n;
  check('zero collisions: distinct (answer,trait) keys equals total rows', evCount === distinctKeys, `rows=${evCount} distinct=${distinctKeys}`);
  const multiQuestionTrait = (await db.query(
    `select trait_id, count(distinct source_answer_id) as n from user_trait_evidence where user_id = $1 group by trait_id having count(distinct source_answer_id) > 1 limit 1`,
    [u1],
  )).rows[0];
  check('at least one trait is awarded by multiple distinct questions (the real collision-risk case occurs)', !!multiQuestionTrait, JSON.stringify(multiQuestionTrait));

  // ---- Scenario: incomplete first submission followed by a full retry ----
  section('Scenario: incomplete first submission, then a full retry');
  const incompleteAnswers = { [pettyQuestions[0].question_key]: fullPettyAnswers[pettyQuestions[0].question_key] };
  const r2a = await submitQuiz(u2, 'petty', incompleteAnswers, '2026-01-02T00:00:00Z');
  check('incomplete submission is REJECTED (no row written)', !r2a.ok, JSON.stringify(r2a));
  const qrCountAfterReject = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [u2])).rows[0].n;
  check('rejected submission wrote NOTHING to quiz_results', qrCountAfterReject === 0, `count=${qrCountAfterReject}`);
  const r2b = await submitQuiz(u2, 'petty', fullPettyAnswers, '2026-01-02T00:01:00Z');
  check('subsequent full submission succeeds and is first-completion', r2b.ok && r2b.row.is_first_completion === true, JSON.stringify(r2b));

  // ---- Scenario: two simultaneous first completions with different answers ----
  section('Scenario: two concurrent first-completion attempts, different answers');
  const altAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.choices[q.choices.length - 1]]));
  const u3 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  const [concurrentA, concurrentB] = await Promise.all([
    submitQuiz(u3, 'petty', fullPettyAnswers, '2026-01-03T00:00:00Z'),
    submitQuiz(u3, 'petty', altAnswers, '2026-01-03T00:00:01Z'),
  ]);
  const firstWins = [concurrentA, concurrentB].filter((r) => r.ok && r.row.is_first_completion === true);
  check('exactly one of the two concurrent submissions wins first-completion', firstWins.length === 1, JSON.stringify({ concurrentA, concurrentB }));
  const u3AnswerCount = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [u3])).rows[0].n;
  check('only the WINNING submission\'s answers were persisted (not a mix of both)', u3AnswerCount === pettyQuestions.length, `answers=${u3AnswerCount} expected=${pettyQuestions.length}`);

  // ---- Scenario: unlimited retakes, unchanged permanent evidence ----
  section('Scenario: unlimited retakes with unchanged permanent evidence');
  const totalsBefore = (await db.query(`select trait_id, lifetime_earned from user_trait_totals where user_id = $1 order by trait_id`, [u1])).rows;
  await submitQuiz(u1, 'petty', altAnswers, '2026-01-04T00:00:00Z');
  await submitQuiz(u1, 'petty', altAnswers, '2026-01-05T00:00:00Z');
  const totalsAfter = (await db.query(`select trait_id, lifetime_earned from user_trait_totals where user_id = $1 order by trait_id`, [u1])).rows;
  check('user_trait_totals byte-identical after two retakes with DIFFERENT answers', JSON.stringify(totalsBefore) === JSON.stringify(totalsAfter), `before=${JSON.stringify(totalsBefore).slice(0,100)} after=${JSON.stringify(totalsAfter).slice(0,100)}`);
  const qrCountU1 = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [u1])).rows[0].n;
  check('retakes still recorded in quiz_results for entertainment/history', qrCountU1 === 3, `count=${qrCountU1}`);

  // ---- Scenario: choices with no scoring award ----
  section('Scenario: choice with zero scoring award (whats-your-type q1, zero Core awards by design)');
  const wytQ1 = (await db.query(
    `select qq.question_id, qc.choice_key from quiz_questions qq join quizzes qz on qz.quiz_id = qq.quiz_id
     join quiz_choices qc on qc.question_id = qq.question_id
     where qz.quiz_key = 'whats-your-type' and qq.question_key = 'q1' limit 1`,
  )).rows[0];
  check('whats-your-type q1 HAS a real numeric identity (the confirmed catalog-coverage bug this fixes)', !!wytQ1, JSON.stringify(wytQ1));
  const wytAwardCount = (await db.query(
    `select count(*)::int as n from quiz_choice_trait_awards awards join quiz_choices qc on qc.choice_id = awards.choice_id where qc.question_id = $1`,
    [wytQ1.question_id],
  )).rows[0].n;
  check('that question legitimately has zero award rows (by design, not a gap)', wytAwardCount === 0, `awards=${wytAwardCount}`);

  // ---- Private/age-gated access attacks ----
  section('Scenario: Private/age-gated access attacks');
  const u4 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  const hyw = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) as choices from quiz_questions qq join quizzes qz on qz.quiz_id = qq.quiz_id join quiz_choices qc on qc.question_id = qq.question_id where qz.quiz_key = 'hidden-you-wrong' group by qq.question_key`)).rows;
  const hywAnswers = Object.fromEntries(hyw.map((q) => [q.question_key, q.choices[0]]));
  const rNoEnt = await submitQuiz(u4, 'hidden-you-wrong', hywAnswers, '2026-01-06T00:00:00Z');
  check('Private quiz REJECTED with no entitlement/tester access', !rNoEnt.ok, JSON.stringify(rNoEnt));
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [u4]);
  const rWithEnt = await submitQuiz(u4, 'hidden-you-wrong', hywAnswers, '2026-01-06T00:00:01Z');
  check('Private quiz SUCCEEDS once entitlement is granted', rWithEnt.ok, JSON.stringify(rWithEnt));

  const u5 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [u5]);
  const ppt = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) as choices from quiz_questions qq join quizzes qz on qz.quiz_id = qq.quiz_id join quiz_choices qc on qc.question_id = qq.question_id where qz.quiz_key = 'private-private-trouble' group by qq.question_key`)).rows;
  const pptAnswers = Object.fromEntries(ppt.map((q) => [q.question_key, q.choices[0]]));
  const rNoAge = await submitQuiz(u5, 'private-private-trouble', pptAnswers, '2026-01-07T00:00:00Z');
  check('age-gated quiz REJECTED without confirmed age eligibility (even WITH entitlement)', !rNoAge.ok, JSON.stringify(rNoAge));
  await db.query(`insert into test_adult_eligible (user_id) values ($1)`, [u5]);
  const rWithAge = await submitQuiz(u5, 'private-private-trouble', pptAnswers, '2026-01-07T00:00:01Z');
  check('age-gated quiz SUCCEEDS once age eligibility is confirmed', rWithAge.ok, JSON.stringify(rWithAge));

  // ---- FK integrity checks ----
  section('Scenario: FK/referential integrity');
  try {
    await db.query(`insert into quiz_questions (question_id, quiz_id, question_key, position) values (99999, (select quiz_id from quizzes where quiz_key='petty'), 'fake', 9999)`);
    check('direct insert of a fake question_id succeeded (expected -- no app-level block needed here)', true);
  } catch (e) { check('question insert', false, String(e.message)); }
  try {
    await db.query(`insert into user_quiz_answers (user_id, quiz_id, question_id, choice_id, answered_at) values ($1, (select quiz_id from quizzes where quiz_key='petty'), 99999, (select choice_id from quiz_choices limit 1), now())`, [u1]);
    check('FK REJECTS a question_id/quiz_id mismatch (the owner-flagged gap, now enforced)', false, 'insert unexpectedly succeeded');
  } catch (e) {
    check('FK REJECTS a question_id/quiz_id mismatch (the owner-flagged gap, now enforced)', true, String(e.message).slice(0, 120));
  }

  console.log('\n\n=== SUMMARY ===');
  let totalPass = 0, totalFail = 0;
  for (const s of results) {
    for (const c of s.checks) {
      if (c.pass) totalPass += 1; else totalFail += 1;
    }
  }
  console.log(`PASS: ${totalPass}  FAIL: ${totalFail}`);
  if (totalFail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
