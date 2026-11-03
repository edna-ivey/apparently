// Real execution of the generated backfill SQL (scripts/backfill-quiz-pole-evidence.ts's
// output) against a real Postgres engine, seeded with COMMITTED SYNTHETIC fixtures (owner
// audit, 2026-10-30: this suite must be reproducible on a clean checkout with no dependency
// on a session-specific scratch path or real production data). Fixtures reference real
// quiz content (petty/crisis/dating question and choice keys -- public, non-sensitive, the
// same content this whole app ships) with entirely synthetic user ids and completion ids --
// no real user ever existed with these ids. Separately, this same script was ALSO run once
// against real, read-only-queried historical production data as part of this engagement's
// one-off reconciliation report (see the final report for those actual numbers) -- that run
// is not part of this repo's tracked, repeatable regression suite, by design.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const FIXTURES = join(__dirname, 'fixtures');
const db = new PGlite();

let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
const run = async (p) => db.exec(readFileSync(p, 'utf8'));

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  console.log('loaded: trait catalog + quiz content identity + user quiz evidence schema + active evidence window');

  const fixture = JSON.parse(readFileSync(join(FIXTURES, 'synthetic-quiz-results.json'), 'utf8'));
  const rows = fixture.rows;
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  for (const id of userIds) {
    await db.query(`insert into auth.users (id) values ($1) on conflict do nothing`, [id]);
  }
  for (const r of rows) {
    await db.query(
      `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, answers) values ($1,$2,$3,$4,0,50,'r','R',$5)`,
      [r.id, r.user_id, r.quiz_id, r.completed_at, r.answers ? JSON.stringify(r.answers) : null],
    );
  }
  console.log(`loaded: ${rows.length} synthetic quiz_results rows, ${userIds.length} synthetic users`);

  // Generate the backfill SQL into a temp file via the real generator script -- exercises
  // the real script, not a re-implementation, same as production usage, just against the
  // fixture file instead of a real query export.
  const tmpSqlPath = join(mkdtempSync(join(tmpdir(), 'build22-test-')), 'backfill.sql');
  execSync(`npx tsx ${join(root, 'scripts/backfill-quiz-pole-evidence.ts')} ${join(FIXTURES, 'synthetic-quiz-results.json')} ${tmpSqlPath}`, { cwd: root, stdio: 'pipe' });
  const backfillSql = readFileSync(tmpSqlPath, 'utf8');

  const rebuildSqlPath = join(dirname(tmpSqlPath), 'rebuild.sql');
  execSync(`npx tsx ${join(root, 'scripts/rebuild-user-trait-totals.ts')} ${rebuildSqlPath}`, { cwd: root, stdio: 'pipe' });
  const rebuildSql = readFileSync(rebuildSqlPath, 'utf8');

  await db.exec(backfillSql);
  await db.exec(rebuildSql);
  check('generated backfill SQL executed without error against synthetic fixture data', true);

  const completionCount1 = (await db.query(`select count(*)::int as n from user_quiz_completions`)).rows[0].n;
  const evidenceCount1 = (await db.query(`select count(*)::int as n from user_trait_evidence`)).rows[0].n;
  const totalsCount1 = (await db.query(`select count(*)::int as n from user_trait_totals`)).rows[0].n;
  // 3 (user,quiz) pairs: a1+petty, a1+crisis, b2+dating.
  check('user_quiz_completions seeded for every (user,quiz) pair', completionCount1 === 3, `count=${completionCount1}`);
  console.log(`evidence rows: ${evidenceCount1}, totals rows: ${totalsCount1}`);

  // Build 22 owner audit (2026-10-31), item 5: an INNER JOIN here would silently ignore a
  // user_trait_totals row with no matching evidence at all (an extra row that shouldn't
  // exist) or evidence with no matching totals row (a missing row that should exist) --
  // either would report "0 mismatches," a false pass. FULL OUTER JOIN categorizes all three
  // real failure modes explicitly.
  const crossCheck = (await db.query(
    `select
       count(*) filter (where e.user_id is null)::int as extra_rows,
       count(*) filter (where t.user_id is null)::int as missing_rows,
       count(*) filter (
         where e.user_id is not null and t.user_id is not null
           and (t.lifetime_earned <> e.sum_earned or t.max_available_total <> e.sum_max)
       )::int as incorrect_rows
     from user_trait_totals t
     full outer join (select user_id, trait_id, sum(points_earned) sum_earned, sum(max_available) sum_max from user_trait_evidence group by user_id, trait_id) e
       on e.user_id = t.user_id and e.trait_id = t.trait_id`,
  )).rows[0];
  check('user_trait_totals has zero EXTRA rows vs. an independent aggregation over user_trait_evidence', crossCheck.extra_rows === 0, `extra=${crossCheck.extra_rows}`);
  check('user_trait_totals has zero MISSING rows vs. an independent aggregation over user_trait_evidence', crossCheck.missing_rows === 0, `missing=${crossCheck.missing_rows}`);
  check('user_trait_totals has zero INCORRECT rows vs. an independent aggregation over user_trait_evidence', crossCheck.incorrect_rows === 0, `incorrect=${crossCheck.incorrect_rows}`);

  // User A1's crisis completion has null answers -- the unrecoverable-historical-completion case.
  const unrecoverableAnswerCount = (await db.query(
    `select count(*)::int as n from user_quiz_answers uqa
     join quizzes qz on qz.quiz_id = uqa.quiz_id
     where uqa.user_id = '00000000-0000-0000-0000-0000000000a1' and qz.quiz_key = 'crisis'`,
  )).rows[0].n;
  check('the unrecoverable (null-answers) completion got zero user_quiz_answers rows -- never fabricated', unrecoverableAnswerCount === 0, `count=${unrecoverableAnswerCount}`);

  await db.query(`select set_config('request.user_id', '00000000-0000-0000-0000-0000000000a1', false)`);
  const crisisQuestions = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id = qq.quiz_id join quiz_choices qc on qc.question_id = qq.question_id where qz.quiz_key = 'crisis' group by qq.question_key`)).rows;
  const crisisFullAnswers = Object.fromEntries(crisisQuestions.map((q) => [q.question_key, q.choices[0]]));
  const retakeResult = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['crisis', 'C', 'c', '2026-11-01T00:00:00Z', crisisQuestions.length, 50, 50, 'r2', 'R2', [], null, JSON.stringify(crisisFullAnswers)],
  );
  check('a retake of the historically-unrecoverable crisis completion is accepted...', retakeResult.rows[0] !== undefined);
  check('...but is NOT first-completion (the seeded historical completion correctly blocks it)', retakeResult.rows[0].is_first_completion === false, JSON.stringify(retakeResult.rows[0]));
  await db.query(`select set_config('request.user_id', '', false)`);

  // Idempotency: rerun the exact same backfill + rebuild SQL again.
  await db.exec(backfillSql);
  await db.exec(rebuildSql);
  const completionCount2 = (await db.query(`select count(*)::int as n from user_quiz_completions`)).rows[0].n;
  const evidenceCount2 = (await db.query(`select count(*)::int as n from user_trait_evidence`)).rows[0].n;
  const totalsCount2 = (await db.query(`select count(*)::int as n from user_trait_totals`)).rows[0].n;
  const sumEarned1 = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals`)).rows[0].n;
  check('rerun: user_quiz_completions count unchanged', completionCount1 === completionCount2, `before=${completionCount1} after=${completionCount2}`);
  check('rerun: user_trait_evidence count unchanged (no double-counting)', evidenceCount1 === evidenceCount2, `before=${evidenceCount1} after=${evidenceCount2}`);
  check('rerun: user_trait_totals count unchanged', totalsCount1 === totalsCount2, `before=${totalsCount1} after=${totalsCount2}`);
  const sumEarned2 = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals`)).rows[0].n;
  check('rerun: sum of lifetime_earned unchanged (rebuild, not accumulation)', sumEarned1 === sumEarned2, `before=${sumEarned1} after=${sumEarned2}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
