// Proves user_trait_totals correctly includes BOTH quiz and Daily evidence, regardless of
// which backfill runs first. Uses COMMITTED SYNTHETIC fixtures (owner audit, 2026-10-30) --
// reproducible on a clean checkout, no session-specific scratch path, no real production
// data. Runs the full sequence TWICE, in opposite orders, against two independent real
// Postgres instances, and asserts both end states are byte-identical and both include real
// contributions from both sources.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, mkdtempSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const FIXTURES = join(__dirname, 'fixtures');
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };

const tmpDir = mkdtempSync(join(tmpdir(), 'build22-order-test-'));
execSync(`npx tsx ${join(root, 'scripts/backfill-quiz-pole-evidence.ts')} ${join(FIXTURES, 'synthetic-quiz-results.json')} ${join(tmpDir, 'quiz.sql')}`, { cwd: root, stdio: 'pipe' });
execSync(`npx tsx ${join(root, 'scripts/backfill-daily-pole-evidence.ts')} ${join(FIXTURES, 'synthetic-daily-answers.json')} ${join(FIXTURES, 'synthetic-daily-option-question-map.json')} ${join(tmpDir, 'daily.sql')}`, { cwd: root, stdio: 'pipe' });
execSync(`npx tsx ${join(root, 'scripts/rebuild-user-trait-totals.ts')} ${join(tmpDir, 'rebuild.sql')}`, { cwd: root, stdio: 'pipe' });
const quizSql = readFileSync(join(tmpDir, 'quiz.sql'), 'utf8');
const dailySql = readFileSync(join(tmpDir, 'daily.sql'), 'utf8');
const rebuildSql = readFileSync(join(tmpDir, 'rebuild.sql'), 'utf8');

async function buildDb(order) {
  const db = new PGlite();
  const run = async (p) => db.exec(readFileSync(p, 'utf8'));
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261028050000_daily_trait_identity_and_rotation_fix.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));

  const qrRows = JSON.parse(readFileSync(join(FIXTURES, 'synthetic-quiz-results.json'), 'utf8')).rows;
  const daRows = JSON.parse(readFileSync(join(FIXTURES, 'synthetic-daily-answers.json'), 'utf8')).rows;
  const optMapRows = JSON.parse(readFileSync(join(FIXTURES, 'synthetic-daily-option-question-map.json'), 'utf8')).rows;

  const userIds = new Set([...qrRows.map((r) => r.user_id), ...daRows.map((r) => r.user_id)]);
  for (const id of userIds) {
    await db.query(`insert into auth.users (id) values ($1) on conflict do nothing`, [id]);
  }
  for (const r of qrRows) {
    await db.query(
      `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, answers) values ($1,$2,$3,$4,0,50,'r','R',$5)`,
      [r.id, r.user_id, r.quiz_id, r.completed_at, r.answers ? JSON.stringify(r.answers) : null],
    );
  }
  for (const o of optMapRows) {
    await db.query(`insert into daily_questions (id, prompt, category, status, room) values ($1, 'p', 'c', 'Archived', 'public') on conflict do nothing`, [o.question_id]);
    await db.query(`insert into daily_options (id, question_id, position, label) values ($1, $2, $3, 'l') on conflict do nothing`, [o.id, o.question_id, o.position]);
  }
  await db.query(`alter table daily_answers disable trigger daily_answers_after_insert_trait_evidence`);
  for (const a of daRows) {
    await db.query(`insert into daily_answers (id, user_id, question_id, option_id, created_at) values ($1,$2,$3,$4,$5) on conflict do nothing`, [a.id, a.user_id, a.question_id, a.option_id, a.created_at]);
  }
  await db.query(`alter table daily_answers enable trigger daily_answers_after_insert_trait_evidence`);

  if (order === 'quiz-then-daily') {
    await db.exec(quizSql);
    await db.exec(dailySql);
  } else {
    await db.exec(dailySql);
    await db.exec(quizSql);
  }
  await db.exec(rebuildSql);
  return db;
}

try {
  const dbA = await buildDb('quiz-then-daily');
  const totalsA = (await dbA.query(`select user_id, trait_id, lifetime_earned, max_available_total from user_trait_totals order by user_id, trait_id`)).rows;
  const quizEvidenceA = (await dbA.query(`select count(*)::int as n from user_trait_evidence where source_type='quiz_answer'`)).rows[0].n;
  const dailyEvidenceA = (await dbA.query(`select count(*)::int as n from user_trait_evidence where source_type='daily_answer'`)).rows[0].n;
  await dbA.close();

  const dbB = await buildDb('daily-then-quiz');
  const totalsB = (await dbB.query(`select user_id, trait_id, lifetime_earned, max_available_total from user_trait_totals order by user_id, trait_id`)).rows;
  await dbB.close();

  check('quiz evidence present', quizEvidenceA > 0, `n=${quizEvidenceA}`);
  check('Daily evidence present', dailyEvidenceA > 0, `n=${dailyEvidenceA}`);
  check('totals row count identical regardless of backfill order', totalsA.length === totalsB.length, `A=${totalsA.length} B=${totalsB.length}`);
  check('totals content byte-identical regardless of backfill order', JSON.stringify(totalsA) === JSON.stringify(totalsB));

  const dbD = await buildDb('quiz-then-daily');
  const activeCountD = (await dbD.query(`select count(*)::int as n from user_trait_active_totals`)).rows[0].n;
  const lifetimeCountD = (await dbD.query(`select count(*)::int as n from user_trait_totals`)).rows[0].n;
  check('historical backfill also populates user_trait_active_totals (not just lifetime)', activeCountD > 0, `active=${activeCountD}`);
  check('since this fixture\'s evidence is all recent, active row count matches lifetime row count', activeCountD === lifetimeCountD, `active=${activeCountD} lifetime=${lifetimeCountD}`);
  await dbD.close();

  const dbC = await buildDb('quiz-then-daily');
  const mixedUser = (await dbC.query(
    `select e.user_id, e.trait_id from user_trait_evidence e
     where exists (select 1 from user_trait_evidence e2 where e2.user_id = e.user_id and e2.trait_id = e.trait_id and e2.source_type = 'quiz_answer')
       and exists (select 1 from user_trait_evidence e2 where e2.user_id = e.user_id and e2.trait_id = e.trait_id and e2.source_type = 'daily_answer')
     limit 1`,
  )).rows[0];
  if (mixedUser) {
    const independentSum = (await dbC.query(`select sum(points_earned)::int as n from user_trait_evidence where user_id = $1 and trait_id = $2`, [mixedUser.user_id, mixedUser.trait_id])).rows[0].n;
    const totalRow = (await dbC.query(`select lifetime_earned from user_trait_totals where user_id = $1 and trait_id = $2`, [mixedUser.user_id, mixedUser.trait_id])).rows[0];
    check('a user with BOTH quiz and Daily evidence on the same trait has a total equal to the combined sum', totalRow.lifetime_earned === independentSum, `total=${totalRow.lifetime_earned} independent_sum=${independentSum}`);
  } else {
    console.log('(no synthetic user has overlapping quiz+Daily evidence on the same trait in this fixture -- the order-independence check above already covers the general case; this specific cross-check is opportunistic)');
  }
  await dbC.close();

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
}
