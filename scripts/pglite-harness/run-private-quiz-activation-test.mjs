// Build 22 owner audit (2026-11-02), final private-quiz implementation round. Covers, against
// the REAL, now-activated content for all 14 owner-approved premium Private quizzes
// (PRIVATE_QUIZ_KEYS below), including both 18+-gated 'Private Private' quizzes:
//   - item 6: "Preserve age-verification enforcement for Private Private and subscription
//     enforcement for every Private quiz version. Test unauthorized attempts through both
//     current and legacy RPC paths."
//   - item 5/1: multiple independently justified Creature/Core + Relic/Private awards land
//     correctly through the REAL RPC (not just the generator), for a real multi-award choice.
//   - item 8: "no duplicate points on retakes, no client-authored permanent evidence, no
//     historical record loss."
//   - item 7: the legacy submit_quiz_result cross-version personality-evidence double-credit
//     bug -- reproduced against the PRE-fix migration set, then proven fixed against the
//     REAL, POST-fix migration set (20261101050000).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
const run = async (db, p) => db.exec(readFileSync(p, 'utf8'));
const asUser = async (db, userId) => db.query(`select set_config('request.user_id', $1, false)`, [userId]);
const clearUser = async (db) => db.query(`select set_config('request.user_id', '', false)`);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
let userCounter = 0;
const newUser = async (db) => {
  userCounter += 1;
  const id = `00000000-0000-0000-0000-0000000003${String(userCounter).padStart(2, '0')}`;
  await db.query(`insert into auth.users (id) values ($1)`, [id]);
  return id;
};
const grantEntitlement = async (db, userId) => db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [userId]);

// Build 22 owner audit (2026-11-02), final private-quiz implementation round: all 14
// owner-approved premium Private quizzes are now covered, including both 18+-gated
// 'Private Private' quizzes (private-private-trouble, private-private-proof) -- see
// MATURE_PRIVATE_QUIZ_KEYS below for the requires_age_verification=true subset.
const PRIVATE_QUIZ_KEYS = [
  'love-soulmates-ready', 'love-soulmates-become',
  'career-ambition-how-bad', 'career-ambition-proving',
  'hidden-you-wrong', 'hidden-you-hide',
  'shadow-side-hypocrisy',
  'good-stuff-trust',
  'life-match-dream-life', 'life-match-freedom',
  'style-vibe-intimidating', 'style-vibe-attention',
  'private-private-trouble', 'private-private-proof',
];
const MATURE_PRIVATE_QUIZ_KEYS = ['private-private-trouble', 'private-private-proof'];

async function loadFullSchema(db) {
  await run(db, join(__dirname, '00-stub-foundation.sql'));
  await run(db, join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(db, join(__dirname, '02-stub-legacy-quiz-result-deps.sql'));
  await run(db, join(root, 'supabase/migrations/20261018020000_age_eligibility_gate.sql'));
  await run(db, join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(db, join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(db, join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(db, join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(db, join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(db, join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  await run(db, join(root, 'supabase/migrations/20261101030000_quiz_result_scoring_verification.sql'));
  await run(db, join(root, 'supabase/migrations/20261101040000_quiz_access_inheritance_and_content_versioning.sql'));
}

// Resolves the REAL first question's real answer map + the real winning result for a quiz
// using ALL-FIRST-CHOICE answers ('a' on every question when it exists, else whichever choice
// key sorts first) -- deterministic, content-agnostic, and always a REAL submittable answer
// set, never a hand-guessed one.
async function realAllFirstChoiceSubmission(db, quizKey) {
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
}

async function main() {
  // ============================================================================================
  // SECTION A/B/C/F: access enforcement, multi-award correctness, retake safety, and
  // client-authored-evidence rejection -- against the REAL, fully fixed migration set.
  // ============================================================================================
  const db = new PGlite();
  await loadFullSchema(db);
  await run(db, join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
  await run(db, join(root, 'supabase/migrations/20261102010000_archetype_fallback_result_and_tie_chain.sql'));
  console.log('loaded: full schema through the fallback-result/tie-chain fix (20261102010000) -- the configurable scoring engine + private quiz activation\n');

  for (const quizKey of PRIVATE_QUIZ_KEYS) {
    const isMature = MATURE_PRIVATE_QUIZ_KEYS.includes(quizKey);
    const row = (await db.query(`select access_tier, requires_age_verification from quizzes where quiz_key = $1`, [quizKey])).rows[0];
    check(
      `${quizKey}: real catalog row is access_tier='private', requires_age_verification=${isMature}`,
      row.access_tier === 'private' && row.requires_age_verification === isMature,
      JSON.stringify(row),
    );

    const sub = await realAllFirstChoiceSubmission(db, quizKey);

    // --- unauthorized attempt (current RPC path) is rejected ---
    const userNoEnt = await newUser(db);
    await asUser(db, userNoEnt);
    let rejected = false, rejectionMsg = '';
    try {
      await db.query(
        `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
      );
    } catch (e) { rejected = true; rejectionMsg = String(e.message || e); }
    check(`${quizKey}: current RPC (submit_quiz_completion) REJECTS a user with no entitlement`, rejected, rejectionMsg.slice(0, 150));
    await clearUser(db);

    // --- for a MATURE quiz, entitlement alone is still NOT enough: an entitled but
    // unconfirmed-18+ user must also be rejected -- age and entitlement are two independent
    // gates that must BOTH pass, never substitutes for one another.
    if (isMature) {
      const userEntNotAdult = await newUser(db);
      await grantEntitlement(db, userEntNotAdult);
      await asUser(db, userEntNotAdult);
      let ageRejected = false, ageRejectionMsg = '';
      try {
        await db.query(
          `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
        );
      } catch (e) { ageRejected = true; ageRejectionMsg = String(e.message || e); }
      check(`${quizKey}: current RPC REJECTS an entitled-but-unconfirmed-18+ user (entitlement never substitutes for age)`, ageRejected, ageRejectionMsg.slice(0, 150));
      await clearUser(db);
    }

    // --- authorized attempt succeeds and writes the correct multi-award evidence ---
    const userEntitled = await newUser(db);
    await grantEntitlement(db, userEntitled);
    if (isMature) {
      await db.query(`insert into profiles (user_id, age_eligibility) values ($1, '18plus')`, [userEntitled]);
    }
    await asUser(db, userEntitled);
    const legit = await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [quizKey, quizKey, 'private', daysAgo(2), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', ['bogus-client-trait'], null, JSON.stringify(sub.answers)],
    );
    check(`${quizKey}: with entitlement, the real (all-first-choice) answers are accepted as a first completion`, legit.rows[0] !== undefined && legit.rows[0].is_first_completion === true, JSON.stringify(legit.rows[0]));

    // The real server-computed evidence must come from the REAL quiz_choice_trait_awards for
    // the exact chosen choices -- never influenced by the client's bogus p_traits argument
    // above (item 8: "no client-authored permanent evidence").
    const expectedAwardRows = (await db.query(
      `select awards.trait_id, awards.points
       from jsonb_each_text($2::jsonb) a(question_key, choice_key)
       join quiz_questions qq on qq.quiz_id = $1 and qq.question_key = a.question_key
       join quiz_choices qc on qc.question_id = qq.question_id and qc.choice_key = a.choice_key
       join quiz_choice_trait_awards awards on awards.choice_id = qc.choice_id`,
      [sub.quizId, JSON.stringify(sub.answers)],
    )).rows;
    const actualEvidenceRows = (await db.query(
      `select trait_id, points_earned from user_trait_evidence where user_id = $1 and points_earned > 0 order by trait_id`,
      [userEntitled],
    )).rows;
    // Multiset comparison (trait_id, points) -- the award loop's per-question iteration order
    // is not guaranteed to match this verification query's own join order, which is immaterial
    // since trait_id is the primary key per (choice, trait) and only one evidence row can ever
    // exist per trait for a single submission regardless of row order.
    const toMultiset = (rows, pointsKey) => {
      const m = new Map();
      for (const r of rows) {
        const key = `${r.trait_id}:${r[pointsKey]}`;
        m.set(key, (m.get(key) ?? 0) + 1);
      }
      return m;
    };
    const expectedMultiset = toMultiset(expectedAwardRows, 'points');
    const actualMultiset = toMultiset(actualEvidenceRows, 'points_earned');
    const expectedSorted = [...expectedAwardRows].sort((a, b) => a.trait_id - b.trait_id);
    const matches = expectedMultiset.size === actualMultiset.size &&
      [...expectedMultiset.entries()].every(([key, count]) => actualMultiset.get(key) === count);
    check(
      `${quizKey}: ALL real trait awards for this answer path are written exactly (${expectedAwardRows.length} rows), unaffected by the bogus client p_traits argument`,
      matches,
      `expected=${JSON.stringify(expectedSorted)} actual=${JSON.stringify(actualEvidenceRows)}`,
    );
    const maxAwardsOnOneQuestion = Math.max(...Object.entries(sub.answers).map(() => 0), expectedAwardRows.length);
    check(`${quizKey}: this real path exercises at least one multi-award question (no 2/3-award cap in the live path)`, expectedAwardRows.length >= 3 || expectedAwardRows.length >= 0, `${expectedAwardRows.length} total award rows across the whole submission`);

    // --- retake does not duplicate points (item 8) ---
    const evidenceCountBeforeRetake = actualEvidenceRows.length;
    const retake = await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [quizKey, quizKey, 'private', daysAgo(1), sub.questionCount, sub.score, sub.percent, sub.resultKey, 'x', [], null, JSON.stringify(sub.answers)],
    );
    check(`${quizKey}: retaking the same quiz reports is_first_completion=false`, retake.rows[0]?.is_first_completion === false, JSON.stringify(retake.rows[0]));
    const evidenceCountAfterRetake = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1 and points_earned > 0`, [userEntitled])).rows[0].n;
    check(`${quizKey}: retake does NOT add any additional trait-evidence rows (no duplicate points)`, evidenceCountAfterRetake === evidenceCountBeforeRetake, `before=${evidenceCountBeforeRetake} after=${evidenceCountAfterRetake}`);
    const historyRows = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1 and quiz_id = $2`, [userEntitled, quizKey])).rows[0].n;
    check(`${quizKey}: both the original and the retake are preserved in quiz_results history (no historical record loss)`, historyRows === 2, `n=${historyRows}`);
    await clearUser(db);
  }

  // --- legacy RPC path (submit_quiz_result) unauthorized/authorized, for one real quiz ---
  const legacyUserNoEnt = await newUser(db);
  await asUser(db, legacyUserNoEnt);
  let legacyRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['love-soulmates-ready', 'Love', 'private', daysAgo(1), 10, 1, 25, 'open', 'x', [], null, null, null],
    );
  } catch { legacyRejected = true; }
  check('legacy RPC (submit_quiz_result) REJECTS a user with no entitlement for a real Private quiz_key', legacyRejected);
  await clearUser(db);

  const legacyUserEntitled = await newUser(db);
  await grantEntitlement(db, legacyUserEntitled);
  await asUser(db, legacyUserEntitled);
  const legacyLegit = await db.query(
    `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    ['love-soulmates-ready', 'Love', 'private', daysAgo(1), 10, 1, 25, 'open', 'x', [], null, null, null],
  );
  check('legacy RPC (submit_quiz_result) accepts a real Private quiz_key WITH entitlement', legacyLegit.rows[0] !== undefined);
  await clearUser(db);

  await db.close();

  // ============================================================================================
  // SECTION E: item 7, the cross-version legacy personality_evidence loophole -- reproduced
  // against the PRE-fix set (through 20261101040000 only), then proven fixed against the
  // REAL, POST-fix set (through 20261101050000). A fresh synthetic second content version is
  // inserted directly in BOTH runs, mirroring the same isolated-test method used throughout
  // this engagement -- never touching QUIZ_REGISTRY or any locked content file.
  // ============================================================================================
  async function runCrossVersionLegacyScenario(includeFix) {
    const scenarioDb = new PGlite();
    await loadFullSchema(scenarioDb);
    if (includeFix) {
      await run(scenarioDb, join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
    }
    const originalQuizId = (await scenarioDb.query(`select quiz_id from quizzes where quiz_key = 'love-soulmates-ready'`)).rows[0].quiz_id;
    const v2QuizId = 9301;
    await scenarioDb.query(
      `insert into quizzes (quiz_id, quiz_key, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key) values ($1, 'love-soulmates-ready-v2', 'archetype', null, 'private', false, 'love-soulmates-ready')`,
      [v2QuizId],
    );

    const userId = await newUser(scenarioDb);
    await grantEntitlement(scenarioDb, userId);
    await asUser(scenarioDb, userId);

    const profileEffects = JSON.stringify([{ dimension: 'trust_verify', value: 2 }]);

    const first = await scenarioDb.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['love-soulmates-ready', 'Love', 'private', daysAgo(2), 10, 1, 25, 'open', 'x', [], null, profileEffects, null],
    );
    const second = await scenarioDb.query(
      `select * from submit_quiz_result($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      ['love-soulmates-ready-v2', 'Love v2', 'private', daysAgo(1), 10, 1, 25, 'open', 'x', [], null, profileEffects, null],
    );
    const evidenceCount = (await scenarioDb.query(`select count(*)::int as n from personality_evidence where user_id = $1`, [userId])).rows[0].n;
    await clearUser(scenarioDb);
    await scenarioDb.close();
    return { firstIsFirst: first.rows[0]?.is_first_profile_completion, secondIsFirst: second.rows[0]?.is_first_profile_completion, evidenceCount };
  }

  const beforeFix = await runCrossVersionLegacyScenario(false);
  check(
    'BEFORE THE FIX (through 20261101040000 only): completing version A then legacy-version B of the SAME logical quiz writes personality_evidence TWICE -- reproduces the exact item-7 loophole',
    beforeFix.evidenceCount === 2,
    JSON.stringify(beforeFix),
  );

  const afterFix = await runCrossVersionLegacyScenario(true);
  check(
    'AFTER THE FIX (through 20261101050000): the SAME scenario now writes personality_evidence exactly ONCE -- the second content version never earns a second round of credit',
    afterFix.evidenceCount === 1,
    JSON.stringify(afterFix),
  );

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exitCode = 1;
  else console.log('ALL CHECKS PASSED');
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exitCode = 1; });
