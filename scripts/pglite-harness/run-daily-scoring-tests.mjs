// Real execution of the Build 22 Daily migrations + the real, already-applied Daily RLS
// policy / submit_private_daily_answer RPC, against a real Postgres engine.
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
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`);
  results[results.length - 1].checks.push({ label, pass, detail });
};
async function runFile(path, label) {
  await db.exec(readFileSync(path, 'utf8'));
  console.log(`loaded: ${label}`);
}
async function asUser(userId, roleName, fn) {
  await db.query(`set role ${roleName}`);
  await db.query(`select set_config('request.user_id', $1, false)`, [userId]);
  try {
    return await fn();
  } finally {
    await db.query(`select set_config('request.user_id', '', false)`);
    await db.query(`reset role`);
  }
}

try {
  section('Load stub foundation + real Daily migrations');
  await runFile(join(__dirname, '00-stub-foundation.sql'), 'stub foundation');
  await runFile(join(__dirname, '01-stub-daily-security.sql'), 'stub Daily security (real RLS + submit_private_daily_answer)');
  await runFile(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'), 'trait catalog');
  await runFile(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'), 'quiz content identity (dependency: user_trait_evidence/totals live in the next file)');
  await runFile(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'), 'user_trait_evidence/user_trait_totals schema');
  await runFile(join(root, 'supabase/migrations/20261028050000_daily_trait_identity_and_rotation_fix.sql'), 'Daily trait identity + rotation fix');
  check('Daily schema/trigger/rotation-fix migration applied without error', true);

  // 20261028060000 (the real Daily seed) is NOT loaded here on purpose: it targets 60 real,
  // specific production daily_options row ids (its own VERIFICATION GUARD raises if any of
  // them don't exist, exactly as designed) -- a fresh synthetic test database has no such
  // rows by construction, so loading it here would only ever prove the guard fires, not
  // anything about the seed's own correctness. Verified instead by static structural checks:
  const seedSql = readFileSync(join(root, 'supabase/migrations/20261028060000_daily_trait_awards_seed.sql'), 'utf8');
  const seedRowMatches = [...seedSql.matchAll(/\('[0-9a-f-]{36}', \d+, \d+\)/g)];
  check('Daily seed file contains the expected 118 numeric award rows', seedRowMatches.length === 118, `found=${seedRowMatches.length}`);
  check('Daily seed file has a verification guard checking the exact inserted row count', seedSql.includes('Expected to insert exactly 118'), 'guard text present');
  const u1 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;

  const publicLive = (await db.query(
    `insert into daily_questions (prompt, category, status, room) values ('Test prompt', 'test', 'Live', 'public') returning id`,
  )).rows[0].id;
  const opt1 = (await db.query(`insert into daily_options (question_id, position, label) values ($1, 1, 'A') returning id`, [publicLive])).rows[0].id;
  const opt2 = (await db.query(`insert into daily_options (question_id, position, label) values ($1, 2, 'B') returning id`, [publicLive])).rows[0].id;
  await db.query(`insert into daily_option_trait_awards (option_id, trait_id, points) values ($1, 5, 2), ($2, 5, 1)`, [opt1, opt2]);

  section('Scenario: public Daily answer earns trait evidence via the real RLS + trigger path');
  const ins1 = await asUser(u1, 'authenticated', () => db.query(`insert into daily_answers (user_id, question_id, option_id) values ($1,$2,$3) returning id`, [u1, publicLive, opt1]));
  check('direct insert succeeds for a Live public question under real RLS', ins1.rows.length === 1);
  const ev1 = (await db.query(`select * from user_trait_evidence where source_answer_id = $1`, [ins1.rows[0].id])).rows;
  check('trigger wrote trait evidence with earned/max from both options (zero-earned preserved)', ev1.length === 1 && ev1[0].points_earned === 2 && ev1[0].max_available === 2, JSON.stringify(ev1));

  section('Scenario: archived Daily submission attack');
  await db.query(`update daily_questions set status = 'Archived' where id = $1`, [publicLive]);
  const u2 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  let archivedRejected = false;
  try {
    await asUser(u2, 'authenticated', () => db.query(`insert into daily_answers (user_id, question_id, option_id) values ($1,$2,$3)`, [u2, publicLive, opt1]));
  } catch (e) { archivedRejected = true; }
  check('direct insert into an ARCHIVED question is rejected by RLS', archivedRejected);

  section('Scenario: cross-room submission attack (private question via public direct-insert path)');
  const privateLive = (await db.query(`insert into daily_questions (prompt, category, status, room, is_free_private_unlock) values ('Private test', 'test', 'Live', 'private', false) returning id`)).rows[0].id;
  const privOpt = (await db.query(`insert into daily_options (question_id, position, label) values ($1, 1, 'A') returning id`, [privateLive])).rows[0].id;
  let crossRoomRejected = false;
  try {
    await asUser(u2, 'authenticated', () => db.query(`insert into daily_answers (user_id, question_id, option_id) values ($1,$2,$3)`, [u2, privateLive, privOpt]));
  } catch (e) { crossRoomRejected = true; }
  check('direct insert into a PRIVATE room question via the public path is rejected by RLS', crossRoomRejected);

  section('Scenario: Private Daily access attacks (locked / entitlement)');
  let lockedRejected = false;
  try {
    await asUser(u2, 'authenticated', () => db.query(`select * from submit_private_daily_answer($1, $2)`, [privateLive, privOpt]));
  } catch (e) { lockedRejected = true; }
  check('submit_private_daily_answer REJECTS a locked (no entitlement, no tester access) Private Daily -- real current (uuid,uuid) signature, server-side-only authorization', lockedRejected);
  await db.query(`insert into test_tester_access (user_id) values ($1)`, [u2]);
  const unlockedResult = await asUser(u2, 'authenticated', () => db.query(`select * from submit_private_daily_answer($1, $2)`, [privateLive, privOpt]));
  check('submit_private_daily_answer SUCCEEDS once has_tester_access is true server-side (no client-supplied flag)', unlockedResult.rows.length === 1);

  section('Scenario: duplicate Daily requests (idempotent retry)');
  let duplicateRejected = false;
  try {
    await asUser(u1, 'authenticated', () => db.query(`insert into daily_answers (user_id, question_id, option_id) values ($1,$2,$3)`, [u1, publicLive, opt2]));
  } catch (e) { duplicateRejected = true; }
  check('a second answer attempt for an already-answered occurrence is rejected (one answer per occurrence, ever)', duplicateRejected);
  const evCountU1 = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [u1])).rows[0].n;
  check('no duplicate evidence was created by the rejected duplicate attempt', evCountU1 === 1, `count=${evCountU1}`);

  section('Scenario: Daily recurrence mapping continuity (advance_daily_rotation carries awards forward)');
  await db.query(`update daily_rotation_state set shown_question_ids = '{}' where room = 'public'`);
  await db.query(`update daily_questions set status = 'Archived' where room = 'public'`);
  const canonicalId = publicLive;
  await db.query(`select advance_daily_rotation('public')`);
  const newOccurrence = (await db.query(`select id from daily_questions where recurrence_source_id = $1 order by created_at desc limit 1`, [canonicalId])).rows[0];
  check('a new occurrence was created from the canonical source', !!newOccurrence);
  if (newOccurrence) {
    const clonedOptions = (await db.query(`select id from daily_options where question_id = $1`, [newOccurrence.id])).rows;
    const clonedAwardCount = (await db.query(
      `select count(*)::int as n from daily_option_trait_awards where option_id in (select id from daily_options where question_id = $1)`,
      [newOccurrence.id],
    )).rows[0].n;
    check('cloned occurrence has its own options', clonedOptions.length === 2, `count=${clonedOptions.length}`);
    check('cloned occurrence\'s trait awards were carried forward (the confirmed gap, now fixed)', clonedAwardCount === 2, `count=${clonedAwardCount}`);

    // New occurrence = new evidence (not deduplicated by fingerprint/wording).
    const newOpt = clonedOptions[0].id;
    const u3 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
    const insNew = await asUser(u3, 'authenticated', () => db.query(`insert into daily_answers (user_id, question_id, option_id) values ($1,$2,$3) returning id`, [u3, newOccurrence.id, newOpt]));
    const evNew = (await db.query(`select * from user_trait_evidence where source_answer_id = $1`, [insNew.rows[0].id])).rows;
    check('answering the recycled occurrence earns fresh evidence (new occurrence = new evidence, no fingerprint dedup)', evNew.length === 1, JSON.stringify(evNew));
  }

  console.log('\n\n=== SUMMARY ===');
  let totalPass = 0, totalFail = 0;
  for (const s of results) for (const c of s.checks) (c.pass ? totalPass++ : totalFail++);
  console.log(`PASS: ${totalPass}  FAIL: ${totalFail}`);
  if (totalFail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
