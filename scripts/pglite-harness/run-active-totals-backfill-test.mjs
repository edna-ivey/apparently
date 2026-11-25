// Build 22 CRITICAL fix verification (owner audit, 2026-10-30): the historical backfill must
// initialize BOTH user_trait_totals (lifetime) AND user_trait_active_totals (12-month window)
// -- the previous rebuild script only did the former, leaving every backfilled account with
// an empty active-ranking view even though You/Relic/Creature all read the active table.
//
// Dates are computed RELATIVE TO THE REAL CURRENT TIME when this test runs (never hardcoded
// absolute dates), so the test stays correct no matter when it's actually executed --
// "2 months ago" and "14 months ago" are always on the correct side of the 12-month boundary.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
const run = async (p) => db.exec(readFileSync(p, 'utf8'));

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
};

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  console.log('loaded: full schema through active evidence window');

  // Real petty content, varying the chosen choice across users so there's a real zero-earned
  // opportunity for whichever choices weren't picked.
  const petty = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`)).rows;
  const crisis = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='crisis' group by qq.question_key`)).rows;
  const pettyAnswers = Object.fromEntries(petty.map((q) => [q.question_key, q.choices[0]]));
  const crisisAnswers = Object.fromEntries(crisis.map((q) => [q.question_key, q.choices[0]]));

  const userX = '00000000-0000-0000-0000-00000000000x'.replace('x', '1'); // recent only
  const userY = '00000000-0000-0000-0000-000000000002'; // expired only
  const userZ = '00000000-0000-0000-0000-000000000003'; // mixed
  const userW = '00000000-0000-0000-0000-000000000004'; // unrecoverable (null answers)

  const fixture = {
    rows: [
      { id: 'a0000000-0000-0000-0000-000000000001', user_id: userX, quiz_id: 'petty', completed_at: monthsAgo(2), answers: pettyAnswers },
      { id: 'a0000000-0000-0000-0000-000000000002', user_id: userY, quiz_id: 'petty', completed_at: monthsAgo(14), answers: pettyAnswers },
      { id: 'a0000000-0000-0000-0000-000000000003', user_id: userZ, quiz_id: 'petty', completed_at: monthsAgo(14), answers: pettyAnswers },
      { id: 'a0000000-0000-0000-0000-000000000004', user_id: userZ, quiz_id: 'crisis', completed_at: monthsAgo(2), answers: crisisAnswers },
      { id: 'a0000000-0000-0000-0000-000000000005', user_id: userW, quiz_id: 'crisis', completed_at: monthsAgo(3), answers: null },
    ],
  };

  const tmpDir = mkdtempSync(join(tmpdir(), 'build22-active-backfill-'));
  const fixturePath = join(tmpDir, 'fixture.json');
  writeFileSync(fixturePath, JSON.stringify(fixture));

  for (const id of [userX, userY, userZ, userW]) {
    await db.query(`insert into auth.users (id) values ($1) on conflict do nothing`, [id]);
  }
  for (const r of fixture.rows) {
    await db.query(
      `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, answers) values ($1,$2,$3,$4,0,50,'r','R',$5)`,
      [r.id, r.user_id, r.quiz_id, r.completed_at, r.answers ? JSON.stringify(r.answers) : null],
    );
  }

  const backfillSqlPath = join(tmpDir, 'backfill.sql');
  execSync(`npx tsx ${join(root, 'scripts/backfill-quiz-pole-evidence.ts')} ${fixturePath} ${backfillSqlPath}`, { cwd: root, stdio: 'pipe' });
  const rebuildSqlPath = join(tmpDir, 'rebuild.sql');
  execSync(`npx tsx ${join(root, 'scripts/rebuild-user-trait-totals.ts')} ${rebuildSqlPath}`, { cwd: root, stdio: 'pipe' });

  await db.exec(readFileSync(backfillSqlPath, 'utf8'));
  await db.exec(readFileSync(rebuildSqlPath, 'utf8'));
  check('backfill + rebuild (lifetime AND active) applied without error', true);

  const sumFor = async (table, userId) => (await db.query(`select coalesce(sum(lifetime_earned),0)::int as n from ${table} where user_id = $1`, [userId])).rows[0].n;

  // --- User X: recent only ---
  const xLifetime = await sumFor('user_trait_totals', userX);
  const xActive = await sumFor('user_trait_active_totals', userX);
  check('User X (recent-only evidence): lifetime > 0', xLifetime > 0, `lifetime=${xLifetime}`);
  check('User X (recent-only evidence): active EQUALS lifetime (nothing has expired yet)', xActive === xLifetime, `active=${xActive} lifetime=${xLifetime}`);

  // --- User Y: expired only ---
  const yLifetime = await sumFor('user_trait_totals', userY);
  const yActive = await sumFor('user_trait_active_totals', userY);
  check('User Y (expired-only evidence): lifetime > 0 (permanent, never deleted)', yLifetime > 0, `lifetime=${yLifetime}`);
  check('User Y (expired-only evidence): active totals are ZERO (THE critical fix -- the historical backfill now correctly excludes expired evidence from active ranking)', yActive === 0, `active=${yActive}`);
  const yActiveRowCount = (await db.query(`select count(*)::int as n from user_trait_active_totals where user_id = $1`, [userY])).rows[0].n;
  check('User Y: zero ACTIVE TOTALS ROWS at all (not just zero-valued rows)', yActiveRowCount === 0, `rows=${yActiveRowCount}`);

  // --- User Z: mixed ---
  const zLifetime = await sumFor('user_trait_totals', userZ);
  const zActive = await sumFor('user_trait_active_totals', userZ);
  check('User Z (mixed recent+expired): lifetime includes BOTH quizzes\' evidence', zLifetime > 0, `lifetime=${zLifetime}`);
  check('User Z (mixed recent+expired): active is STRICTLY LESS than lifetime (the expired petty portion is excluded, the recent crisis portion is included)', zActive > 0 && zActive < zLifetime, `active=${zActive} lifetime=${zLifetime}`);
  const zActiveTraits = (await db.query(`select trait_id from user_trait_active_totals where user_id = $1`, [userZ])).rows;
  const zCrisisEvidenceTraits = (await db.query(`select distinct trait_id from user_trait_evidence e join user_quiz_answers a on a.id = e.source_answer_id join quizzes qz on qz.quiz_id = a.quiz_id where a.user_id = $1 and qz.quiz_key = 'crisis'`, [userZ])).rows;
  check('User Z: active totals trait set matches exactly the still-recent (crisis) evidence\'s trait set', JSON.stringify(zActiveTraits.map(r=>r.trait_id).sort()) === JSON.stringify(zCrisisEvidenceTraits.map(r=>r.trait_id).sort()), `active=${JSON.stringify(zActiveTraits)} crisis=${JSON.stringify(zCrisisEvidenceTraits)}`);

  // --- User W: unrecoverable (no original answers) ---
  const wCompletionCount = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1`, [userW])).rows[0].n;
  const wLifetime = await sumFor('user_trait_totals', userW);
  const wActive = await sumFor('user_trait_active_totals', userW);
  check('User W (unrecoverable): still seeded into user_quiz_completions (so a retake earns nothing)', wCompletionCount === 1, `count=${wCompletionCount}`);
  check('User W (unrecoverable): zero lifetime AND zero active evidence -- never fabricated', wLifetime === 0 && wActive === 0, `lifetime=${wLifetime} active=${wActive}`);

  // --- Zero-earned opportunity, both tables ---
  const zeroEarnedRow = (await db.query(`select * from user_trait_totals where user_id = $1 and lifetime_earned = 0 and max_available_total > 0 limit 1`, [userX])).rows[0];
  check('zero-earned trait opportunities (offered, not chosen) are preserved in LIFETIME totals as real denominator data', !!zeroEarnedRow, JSON.stringify(zeroEarnedRow));
  if (zeroEarnedRow) {
    const activeCounterpart = (await db.query(`select * from user_trait_active_totals where user_id = $1 and trait_id = $2`, [userX, zeroEarnedRow.trait_id])).rows[0];
    check('the SAME zero-earned trait also appears correctly in ACTIVE totals (recent evidence)', activeCounterpart && activeCounterpart.max_available_total === zeroEarnedRow.max_available_total, JSON.stringify(activeCounterpart));
  }

  // --- Idempotency ---
  const beforeLifetimeSum = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals`)).rows[0].n;
  const beforeActiveSum = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_active_totals`)).rows[0].n;
  await db.exec(readFileSync(backfillSqlPath, 'utf8'));
  await db.exec(readFileSync(rebuildSqlPath, 'utf8'));
  const afterLifetimeSum = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals`)).rows[0].n;
  const afterActiveSum = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_active_totals`)).rows[0].n;
  check('rerun: lifetime sum unchanged', beforeLifetimeSum === afterLifetimeSum, `before=${beforeLifetimeSum} after=${afterLifetimeSum}`);
  check('rerun: active sum unchanged', beforeActiveSum === afterActiveSum, `before=${beforeActiveSum} after=${afterActiveSum}`);

  // --- Original answers permanence (untouched by any of this) ---
  const originalAnswerStillThere = (await db.query(`select answers from quiz_results where id = $1`, [fixture.rows[0].id])).rows[0];
  check('original quiz_results.answers remain exactly as submitted, untouched by backfill/rebuild', JSON.stringify(originalAnswerStillThere.answers) === JSON.stringify(pettyAnswers), JSON.stringify(originalAnswerStillThere));

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
