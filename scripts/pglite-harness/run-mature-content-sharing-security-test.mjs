// Build 22 final cleanup round (2026-11-02), item 5: "Complete mature-content security. Both
// 18+ quizzes must have server-side protection: private-private-trouble, private-private-proof.
// ...Never rely on UI hiding alone." Proves, against the REAL migrations (including the staged
// sharing-block migration applied on top), via the REAL create_quiz_share/get_shared_quiz_result
// RPCs directly (never the client's own isShareRestricted check, which this test deliberately
// never even imports):
//
// 1. An 18+-verified, entitled user who completes EITHER mature quiz cannot create a share for
//    it via a DIRECT RPC call (the exact "deep link / direct API bypass" scenario) -- rejected
//    with the real error, not merely hidden by the app's own Share button.
// 2. get_shared_quiz_result (the fully anonymous, no-session, public /s/[token] landing) returns
//    ZERO rows for a share row that predates the fix (the retroactive case), for either quiz.
// 3. Both mature quizzes require BOTH premium entitlement AND adult eligibility at the
//    submission layer -- an entitled-but-not-18+ user, and an 18+-but-unentitled user, are each
//    independently rejected by submit_quiz_completion before a share could even be attempted.
// 4. A completely ordinary, non-mature quiz (petty) is COMPLETELY UNAFFECTED -- still shareable,
//    still readable anonymously -- confirming the fix is scoped, not a blanket sharing outage.
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
const clearUser = async () => db.query(`select set_config('request.user_id', '', false)`);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
let userCounter = 0;
const newUser = async () => {
  userCounter += 1;
  const id = `00000000-0000-0000-0000-0000000005${String(userCounter).padStart(2, '0')}`;
  await db.query(`insert into auth.users (id) values ($1)`, [id]);
  return id;
};
const grantEntitlement = async (userId) => db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [userId]);
// The REAL is_adult_eligible() (20261018020000, loaded below) reads profiles.age_eligibility
// directly -- test_adult_eligible is a stub-only table other tests use with a different,
// simplified stand-in function, not applicable once the real migration is loaded here.
const grantAdult = async (userId) => db.query(
  `insert into profiles (user_id, age_eligibility) values ($1, '18plus')
   on conflict (user_id) do update set age_eligibility = '18plus'`,
  [userId],
);

const realAllFirstChoiceSubmission = async (quizKey) => {
  const quizId = (await db.query(`select quiz_id from quizzes where quiz_key = $1`, [quizKey])).rows[0].quiz_id;
  const questions = (await db.query(
    `select qq.question_key, min(qc.choice_key) as first_choice
     from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id
     where qq.quiz_id = $1 group by qq.question_key`,
    [quizId],
  )).rows;
  const answers = Object.fromEntries(questions.map((q) => [q.question_key, q.first_choice]));
  const real = (await db.query(`select winner_key, winner_total, total_points from resolve_archetype_result($1, $2, null, 3)`, [quizId, JSON.stringify(answers)])).rows[0];
  const percent = real.total_points > 0 ? Math.round((real.winner_total / real.total_points) * 100) : 0;
  return { quizId, answers, questionCount: questions.length, resultKey: real.winner_key, score: real.winner_total, percent };
};

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(join(__dirname, '02-stub-legacy-quiz-result-deps.sql'));
  await run(join(root, 'supabase/migrations/20260919010000_quiz_result_sharing.sql'));
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
  // THE STAGED FIX ITSELF -- applied on top, same as it would be in a real push.
  await run(join(root, 'supabase/migrations/20261021150000_block_private_private_trouble_sharing.sql'));
  console.log('loaded: full schema through the final scoring cleanup, PLUS the staged sharing-block migration\n');

  const MATURE_QUIZ_KEYS = ['private-private-trouble', 'private-private-proof'];

  for (const quizKey of MATURE_QUIZ_KEYS) {
    const row = (await db.query(`select access_tier, requires_age_verification from quizzes where quiz_key = $1`, [quizKey])).rows[0];
    check(`${quizKey}: real catalog row requires both premium ('private') and 18+ verification`, row.access_tier === 'private' && row.requires_age_verification === true, JSON.stringify(row));

    // --- 3a. entitled but NOT 18+ -- rejected before a share could ever be attempted. ---
    const userNotAdult = await newUser();
    await grantEntitlement(userNotAdult);
    const sub = await realAllFirstChoiceSubmission(quizKey);
    await asUser(userNotAdult);
    let ageRejected = false;
    try {
      await db.query(
        `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
      );
    } catch { ageRejected = true; }
    check(`3. ${quizKey}: entitled-but-not-18+ user is rejected at submission (entitlement never substitutes for age)`, ageRejected);
    await clearUser();

    // --- 3b. 18+ but NOT entitled -- also rejected before a share could ever be attempted. ---
    const userNotEntitled = await newUser();
    await grantAdult(userNotEntitled);
    await asUser(userNotEntitled);
    let entitlementRejected = false;
    try {
      await db.query(
        `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
      );
    } catch { entitlementRejected = true; }
    check(`3. ${quizKey}: 18+-but-unentitled user is rejected at submission (age never substitutes for entitlement)`, entitlementRejected);
    await clearUser();

    // --- A real, legitimate completion (entitled AND 18+), then attack its share path directly. ---
    const legitUser = await newUser();
    await grantEntitlement(legitUser);
    await grantAdult(legitUser);
    await asUser(legitUser);
    const legit = await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
    );
    check(`${quizKey}: a genuinely entitled + 18+ user completes it successfully`, legit.rows[0] !== undefined, JSON.stringify(legit.rows[0]));

    // --- 1. DIRECT RPC attack: call create_quiz_share directly, bypassing the app's own
    // isShareRestricted UI check entirely (which this test never even touches). ---
    let shareRejected = false, shareError = '';
    try {
      await db.query(`select * from create_quiz_share($1, $2)`, [quizKey, 'Attacker']);
    } catch (e) { shareRejected = true; shareError = String(e.message || e); }
    check(`1. ${quizKey}: DIRECT create_quiz_share RPC call is REJECTED, even for the legitimate completion owner`, shareRejected, shareError.slice(0, 150));
    const shareRowCount = (await db.query(`select count(*)::int as n from quiz_shares where sharer_user_id = $1`, [legitUser])).rows[0].n;
    check(`1. ${quizKey}: no quiz_shares row was created despite the attempt`, shareRowCount === 0, `n=${shareRowCount}`);
    await clearUser();

    // --- 2. RETROACTIVE case: a share row that predates this fix (inserted directly, as if
    // created before the migration existed) must also be unreadable via the fully anonymous
    // get_shared_quiz_result path. ---
    const preexistingResultId = (await db.query(`select id from quiz_results where user_id = $1 and quiz_id = $2 order by completed_at desc limit 1`, [legitUser, quizKey])).rows[0].id;
    const preexistingShare = await db.query(
      `insert into quiz_shares (sharer_user_id, quiz_id, result_id, quiz_result_id, sharer_display_name) values ($1, $2, $3, $4, 'Pre-fix share') returning id`,
      [legitUser, quizKey, sub.resultKey, preexistingResultId],
    );
    const preexistingShareId = preexistingShare.rows[0].id;
    const anonymousRead = (await db.query(`select * from get_shared_quiz_result($1)`, [preexistingShareId])).rows;
    check(`2. ${quizKey}: a PRE-EXISTING share row (predating the fix) is unreadable via the fully anonymous landing`, anonymousRead.length === 0, `rows=${anonymousRead.length}`);
  }

  // --- 4. An ordinary, non-mature quiz is completely unaffected. ---
  // Petty is numericBand, not archetype -- resolve_archetype_result doesn't apply. Real,
  // server-verified metadata for all-first-choice Petty answers (same fixture several other
  // harness tests already use).
  const ordinaryUser = await newUser();
  const pettyQuestions = (await db.query(
    `select qq.question_key, min(qc.choice_key) as first_choice
     from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id
     join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = 'petty' group by qq.question_key`,
  )).rows;
  const pettyAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.first_choice]));
  await asUser(ordinaryUser);
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'petty', 'Ridiculous', daysAgo(1), pettyQuestions.length, 12, 50, 'selectively-petty', 'x', [], null, JSON.stringify(pettyAnswers)],
  );
  const ordinaryShare = await db.query(`select * from create_quiz_share($1, $2)`, ['petty', 'Ordinary User']);
  check('4. an ordinary (non-mature) quiz can still be shared normally', ordinaryShare.rows[0]?.share_id !== undefined, JSON.stringify(ordinaryShare.rows[0]));
  await clearUser();
  const ordinaryAnonymousRead = (await db.query(`select * from get_shared_quiz_result($1)`, [ordinaryShare.rows[0].share_id])).rows;
  check('4. ...and is still readable via the fully anonymous landing', ordinaryAnonymousRead.length === 1, `rows=${ordinaryAnonymousRead.length}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
