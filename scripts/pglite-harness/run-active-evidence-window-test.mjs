// Real execution of the Bible v1.4 §43 12-month active evidence window (20261030010000)
// against a real Postgres engine. Synthetic fixtures only.
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

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  console.log('loaded: trait catalog + quiz content identity + user quiz evidence schema + active evidence window');

  const u1 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  const petty = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' group by qq.question_key`)).rows;
  const answers = Object.fromEntries(petty.map((q) => [q.question_key, q.choices[0]]));

  await db.query(`select set_config('request.user_id', $1, false)`, [u1]);
  await db.query(`select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, ['petty', 'P', 'c', '2026-01-01T00:00:00Z', petty.length, 50, 50, 'r1', 'R1', [], null, JSON.stringify(answers)]);
  await db.query(`select set_config('request.user_id', '', false)`);

  const lifetimeRows1 = (await db.query(`select count(*)::int as n from user_trait_totals where user_id = $1`, [u1])).rows[0].n;
  const activeRows1 = (await db.query(`select count(*)::int as n from user_trait_active_totals where user_id = $1`, [u1])).rows[0].n;
  check('a new live answer writes BOTH lifetime and active totals identically', lifetimeRows1 > 0 && lifetimeRows1 === activeRows1, `lifetime=${lifetimeRows1} active=${activeRows1}`);

  const lifetimeSum1 = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals where user_id = $1`, [u1])).rows[0].n;
  const activeSum1 = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_active_totals where user_id = $1`, [u1])).rows[0].n;
  check('lifetime and active sums match exactly right after submission', lifetimeSum1 === activeSum1, `lifetime=${lifetimeSum1} active=${activeSum1}`);

  // Simulate time passing: backdate this user's evidence to 13 months ago (past the window),
  // directly -- the real RPC always uses now(), this models evidence that has since aged out.
  await db.query(`update user_trait_evidence set created_at = now() - interval '13 months' where user_id = $1`, [u1]);

  // Add a SECOND, fresh answer for a different quiz -- still within the window -- so we can
  // prove the expiry job removes ONLY the stale contribution, not everything.
  const u1crisis = (await db.query(`select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='crisis' group by qq.question_key`)).rows;
  const crisisAnswers = Object.fromEntries(u1crisis.map((q) => [q.question_key, q.choices[0]]));
  await db.query(`select set_config('request.user_id', $1, false)`, [u1]);
  await db.query(`select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, ['crisis', 'C', 'c', '2026-01-02T00:00:00Z', u1crisis.length, 50, 50, 'r2', 'R2', [], null, JSON.stringify(crisisAnswers)]);
  await db.query(`select set_config('request.user_id', '', false)`);

  const lifetimeSumBeforeExpiry = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals where user_id = $1`, [u1])).rows[0].n;

  await db.query(`select expire_stale_active_evidence()`);

  const activeSumAfterExpiry = (await db.query(`select coalesce(sum(lifetime_earned),0)::int as n from user_trait_active_totals where user_id = $1`, [u1])).rows[0].n;
  const lifetimeSumAfterExpiry = (await db.query(`select sum(lifetime_earned)::int as n from user_trait_totals where user_id = $1`, [u1])).rows[0].n;
  const evidenceRowCountAfterExpiry = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [u1])).rows[0].n;

  check('lifetime totals are COMPLETELY UNCHANGED by expiry (permanent, never touched)', lifetimeSumBeforeExpiry === lifetimeSumAfterExpiry, `before=${lifetimeSumBeforeExpiry} after=${lifetimeSumAfterExpiry}`);
  check('raw evidence rows are NOT deleted by expiry -- only active totals are recomputed', evidenceRowCountAfterExpiry > 0, `count=${evidenceRowCountAfterExpiry}`);
  check('active totals now reflect ONLY the still-fresh (crisis) evidence, not the expired (petty) evidence', activeSumAfterExpiry > 0 && activeSumAfterExpiry < lifetimeSumAfterExpiry, `active=${activeSumAfterExpiry} lifetime=${lifetimeSumAfterExpiry}`);

  // Idempotency: running expiry twice in a row produces the same result.
  await db.query(`select expire_stale_active_evidence()`);
  const activeSumRerun = (await db.query(`select coalesce(sum(lifetime_earned),0)::int as n from user_trait_active_totals where user_id = $1`, [u1])).rows[0].n;
  check('rerunning expiry produces the identical active total (idempotent)', activeSumRerun === activeSumAfterExpiry, `before=${activeSumAfterExpiry} after=${activeSumRerun}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
