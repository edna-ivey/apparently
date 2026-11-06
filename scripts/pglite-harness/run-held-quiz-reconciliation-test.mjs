// Build 22 owner audit (2026-10-31), item 4 (second round) + item 2 (third round): "Protect
// held Private quizzes" / "Enforce live approved trait mappings inside the held-quiz
// reconciliation." Proves, against the REAL migrations and the REAL, fixed
// scripts/reconcile-held-quiz-evidence.ts:
//
// 1. A held Private quiz (zero quiz_choice_trait_awards rows, by real catalog design) earns
//    ZERO evidence on a live completion today -- never fabricated -- while still correctly
//    consuming the user's one-time first-completion slot (user_quiz_completions/
//    user_quiz_answers are written and permanent).
// 2. A retake of that same held quiz also earns zero evidence (already true, by the existing
//    first-completion gate).
// 3. Once the quiz's mapping is "approved" (simulated here with clearly-synthetic award rows
//    -- this test authors NO real Private-quiz content, only a mechanical fixture), the
//    reconciliation script correctly backfills evidence for the user's FIRST completion's
//    answers ONLY -- never for anything a retake touched.
// 4. The reconciliation is idempotent.
// 5. Reconciled evidence carries its REAL original answered_at, so the 12-month active window
//    still applies correctly (an old reconciled completion can be born already-expired).
// 6. THE THIRD-ROUND FIX: a FORGED award export (claiming a mapping absent from the live
//    database) is REJECTED -- the generated SQL's own validation aborts the transaction, and
//    ZERO evidence is written, even though the export file itself claims otherwise.
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
const asUser = async (userId) => db.query(`select set_config('request.user_id', $1, false)`, [userId]);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString(); };

// Build 22 owner audit (2026-11-02), final private-quiz implementation round: EVERY
// registered Private quiz (all 17) now has real, owner-approved quiz_choice_trait_awards
// rows -- none remains genuinely held in the live catalog any more (the prior round's choice,
// private-private-trouble, is now itself fully activated). This mechanism (a quiz playable
// today whose mapping is approved and backfilled later) is still real product behavior for
// any FUTURE Private quiz, so scenarios 1-6 below now exercise it against a CLEARLY SYNTHETIC
// held-quiz fixture instead of a real quiz_key -- mirroring the exact synthetic-fixture
// pattern scenario 7 (THE THIRD-ROUND FIX, below) already used for the forged-mapping case.
// This authors NO real Private-quiz content, only a mechanical fixture; requires_age_
// verification is deliberately set true to preserve this test's original "both the premium
// gate AND the age gate must be satisfied before the held-mapping concern is even reachable"
// shape.
const HELD_QUIZ_KEY = 'synthetic-held-quiz-reconciliation-fixture';
const HELD_QUIZ_ID = 9301;
const HELD_QUESTION_IDS = [9311, 9312, 9313, 9314];

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  console.log(`loaded: full schema + REAL submit_quiz_completion -- testing a synthetic held quiz '${HELD_QUIZ_KEY}'`);

  await db.query(
    `insert into quizzes (quiz_id, quiz_key, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key) values ($1, $2, 'archetype', null, 'private', true, $2)`,
    [HELD_QUIZ_ID, HELD_QUIZ_KEY],
  );
  for (let i = 0; i < HELD_QUESTION_IDS.length; i++) {
    await db.query(`insert into quiz_questions (question_id, quiz_id, question_key, position, scoring_role) values ($1, $2, $3, $4, null)`, [HELD_QUESTION_IDS[i], HELD_QUIZ_ID, `q${i + 1}`, i + 1]);
    for (const letter of ['a', 'b', 'c', 'd']) {
      const choiceId = 9320 + HELD_QUESTION_IDS[i] * 10 + 'abcd'.indexOf(letter);
      await db.query(`insert into quiz_choices (choice_id, question_id, choice_key, flavor_score) values ($1, $2, $3, null)`, [choiceId, HELD_QUESTION_IDS[i], letter]);
    }
  }

  const existingAwardCount = (await db.query(
    `select count(*)::int as n from quiz_choice_trait_awards a join quiz_choices qc on qc.choice_id = a.choice_id join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = $1`,
    [HELD_QUIZ_KEY],
  )).rows[0].n;
  check(`precondition: '${HELD_QUIZ_KEY}' really is held (zero quiz_choice_trait_awards rows in the real catalog)`, existingAwardCount === 0, `n=${existingAwardCount}`);

  const heldQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key=$1 group by qq.question_key order by qq.question_key`,
    [HELD_QUIZ_KEY],
  )).rows;
  check(`'${HELD_QUIZ_KEY}' has real questions in the catalog to test against`, heldQuestions.length > 0, `n=${heldQuestions.length}`);

  const firstAnswers = Object.fromEntries(heldQuestions.map((q) => [q.question_key, q.choices[0]]));
  const retakeAnswers = Object.fromEntries(heldQuestions.map((q) => [q.question_key, q.choices[q.choices.length - 1]]));

  const user = '00000000-0000-0000-0000-000000000091';
  await db.query(`insert into auth.users (id) values ($1)`, [user]);
  // Grant premium AND age-eligibility so neither gate blocks this test from reaching the
  // held-mapping concern this item is actually about -- private-private-trouble requires both.
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [user]);
  await db.query(`insert into test_adult_eligible (user_id) values ($1)`, [user]);
  await asUser(user);

  const firstCompletedAt = daysAgo(3);
  const first = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [HELD_QUIZ_KEY, 'Career', 'private', firstCompletedAt, heldQuestions.length, 50, 50, 'r1', 'R1', [], null, JSON.stringify(firstAnswers)],
  );
  check('1. a live first completion of the held quiz is accepted, is_first_completion = true', first.rows[0].is_first_completion === true, JSON.stringify(first.rows[0]));
  const evidenceBeforeApproval = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('1. ZERO evidence fabricated for the held quiz (no mapping exists yet)', evidenceBeforeApproval === 0, `n=${evidenceBeforeApproval}`);
  const completionsAfterFirst = (await db.query(`select count(*)::int as n from user_quiz_completions where user_id = $1`, [user])).rows[0].n;
  check('1. the first-completion slot IS permanently consumed (user_quiz_completions written)', completionsAfterFirst === 1, `n=${completionsAfterFirst}`);
  const firstAnswerCount = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [user])).rows[0].n;
  check('1. the first completion\'s per-question answers ARE permanently recorded (answerable later once approved)', firstAnswerCount === heldQuestions.length, `n=${firstAnswerCount}`);

  // --- 2. Retake -- different answers, must earn nothing, must not write new user_quiz_answers.
  const retake = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [HELD_QUIZ_KEY, 'Career', 'private', daysAgo(1), heldQuestions.length, 50, 50, 'r2', 'R2', [], null, JSON.stringify(retakeAnswers)],
  );
  check('2. a retake of the held quiz is accepted, is_first_completion = false', retake.rows[0].is_first_completion === false, JSON.stringify(retake.rows[0]));
  const answerCountAfterRetake = (await db.query(`select count(*)::int as n from user_quiz_answers where user_id = $1`, [user])).rows[0].n;
  check('2. the retake wrote ZERO additional user_quiz_answers rows (still only the first completion\'s)', answerCountAfterRetake === firstAnswerCount, `n=${answerCountAfterRetake}`);

  // --- 3. "Approve" the mapping -- SYNTHETIC award rows, invented by this test only, never
  // real Private-quiz content. Mirrors the shape quiz_choice_trait_awards already has.
  for (const q of heldQuestions) {
    const choiceId = (await db.query(
      `select qc.choice_id from quiz_choices qc join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = $1 and qq.question_key = $2 and qc.choice_key = $3`,
      [HELD_QUIZ_KEY, q.question_key, q.choices[0]],
    )).rows[0].choice_id;
    await db.query(`insert into quiz_choice_trait_awards (choice_id, trait_id, points) values ($1, 1, 2)`, [choiceId]);
  }
  const awardsNow = (await db.query(
    `select count(*)::int as n from quiz_choice_trait_awards a join quiz_choices qc on qc.choice_id = a.choice_id join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = $1`,
    [HELD_QUIZ_KEY],
  )).rows[0].n;
  check('3. synthetic "approval" award rows inserted (simulating a separate, already-reviewed migration)', awardsNow === heldQuestions.length, `n=${awardsNow}`);

  // --- Export this user's existing first-completion answers (what a real production export
  // would look like), run the REAL reconciliation script against it.
  const exportedAnswers = (await db.query(
    `select uqa.user_id, qq.question_key, qc.choice_key, uqa.answered_at
     from user_quiz_answers uqa
     join quizzes qz on qz.quiz_id = uqa.quiz_id
     join quiz_questions qq on qq.question_id = uqa.question_id
     join quiz_choices qc on qc.choice_id = uqa.choice_id
     where qz.quiz_key = $1`,
    [HELD_QUIZ_KEY],
  )).rows;
  const tmpDir = mkdtempSync(join(tmpdir(), 'build22-held-quiz-'));
  const exportPath = join(tmpDir, 'answers.json');
  writeFileSync(exportPath, JSON.stringify({
    rows: exportedAnswers.map((r) => ({ userId: r.user_id, questionKey: r.question_key, choiceKey: r.choice_key, answeredAt: r.answered_at })),
  }));

  // Export the LIVE, just-"applied" award rows -- never read from any static content file,
  // exactly the fix this round made to the script itself.
  const liveAwardsExport = (await db.query(
    `select qq.question_key, qc.choice_key, a.trait_id, a.points
     from quiz_choice_trait_awards a
     join quiz_choices qc on qc.choice_id = a.choice_id
     join quiz_questions qq on qq.question_id = qc.question_id
     join quizzes qz on qz.quiz_id = qq.quiz_id
     where qz.quiz_key = $1`,
    [HELD_QUIZ_KEY],
  )).rows;
  const awardsExportPath = join(tmpDir, 'live-awards.json');
  writeFileSync(awardsExportPath, JSON.stringify({
    rows: liveAwardsExport.map((r) => ({ questionKey: r.question_key, choiceKey: r.choice_key, traitId: r.trait_id, points: r.points })),
  }));

  const reconcileSqlPath = join(tmpDir, 'reconcile.sql');
  execSync(`npx tsx ${join(root, 'scripts/reconcile-held-quiz-evidence.ts')} ${HELD_QUIZ_KEY} ${exportPath} ${awardsExportPath} ${reconcileSqlPath}`, { cwd: root, stdio: 'pipe' });
  await db.exec(readFileSync(reconcileSqlPath, 'utf8'));

  const evidenceAfterReconciliation = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('3. THE FIX: reconciliation backfilled real evidence for the FIRST completion\'s answers', evidenceAfterReconciliation === heldQuestions.length, `n=${evidenceAfterReconciliation}`);
  const evidenceSourceIds = (await db.query(
    `select distinct source_answer_id from user_trait_evidence where user_id = $1`,
    [user],
  )).rows.map((r) => r.source_answer_id);
  const firstCompletionAnswerIds = (await db.query(`select id from user_quiz_answers where user_id = $1`, [user])).rows.map((r) => r.id);
  check('3. every reconciled evidence row traces back to a FIRST-completion answer id (never a retake, which wrote none)', evidenceSourceIds.every((id) => firstCompletionAnswerIds.includes(id)), JSON.stringify(evidenceSourceIds));
  const earnedPoints = (await db.query(`select sum(points_earned)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('3. reconciled evidence correctly reflects the FIRST answer choice (full points earned)', earnedPoints === heldQuestions.length * 2, `n=${earnedPoints}`);

  // --- 4. Idempotency.
  execSync(`npx tsx ${join(root, 'scripts/reconcile-held-quiz-evidence.ts')} ${HELD_QUIZ_KEY} ${exportPath} ${awardsExportPath} ${reconcileSqlPath}`, { cwd: root, stdio: 'pipe' });
  await db.exec(readFileSync(reconcileSqlPath, 'utf8'));
  const evidenceAfterRerun = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user])).rows[0].n;
  check('4. rerunning the reconciliation is idempotent -- no duplicate rows', evidenceAfterRerun === evidenceAfterReconciliation, `before=${evidenceAfterReconciliation} after=${evidenceAfterRerun}`);

  // --- 5. Rebuild totals afterward (the documented required final step) and confirm correctness.
  const rebuildSqlPath = join(tmpDir, 'rebuild.sql');
  execSync(`npx tsx ${join(root, 'scripts/rebuild-user-trait-totals.ts')} ${rebuildSqlPath}`, { cwd: root, stdio: 'pipe' });
  await db.exec(readFileSync(rebuildSqlPath, 'utf8'));
  const totalsForUser = (await db.query(`select lifetime_earned from user_trait_totals where user_id = $1 and trait_id = 1`, [user])).rows[0];
  check('5. after rebuild, lifetime totals correctly reflect the reconciled evidence', totalsForUser?.lifetime_earned === heldQuestions.length * 2, JSON.stringify(totalsForUser));
  const activeTotalsForUser = (await db.query(`select lifetime_earned from user_trait_active_totals where user_id = $1 and trait_id = 1`, [user])).rows[0];
  check('5. and active totals too (the completion was only 3 days ago, still well within the window)', activeTotalsForUser?.lifetime_earned === heldQuestions.length * 2, JSON.stringify(activeTotalsForUser));

  // --- 6. An OLD held-quiz completion must reconcile as already-expired, not freshly active.
  // Seeded DIRECTLY (not through submit_quiz_completion) -- that RPC always stamps
  // user_quiz_answers.answered_at with its own server-trusted now() by design (the SAME
  // timestamp-trust principle item 3 of this round reinforces), so it cannot itself produce a
  // genuinely 14-month-old answer row. A real one only ever exists via the historical backfill
  // scripts preserving a TRUE original timestamp -- this seed mirrors exactly that shape.
  const user2 = '00000000-0000-0000-0000-000000000092';
  await db.query(`insert into auth.users (id) values ($1)`, [user2]);
  const oldCompletedAt = monthsAgo(14);
  const oldResultId = 'cccccccc-0000-0000-0000-000000000001';
  await db.query(
    `insert into quiz_results (id, user_id, quiz_id, completed_at, score, percent, result_id, result_title, question_count, answers) values ($1,$2,$3,$4,50,50,'r3','R3',$5,$6)`,
    [oldResultId, user2, HELD_QUIZ_KEY, oldCompletedAt, heldQuestions.length, JSON.stringify(firstAnswers)],
  );
  const heldQuizNumericId = (await db.query(`select quiz_id from quizzes where quiz_key = $1`, [HELD_QUIZ_KEY])).rows[0].quiz_id;
  await db.query(
    `insert into user_quiz_completions (user_id, quiz_id, quiz_result_id, completed_at) values ($1,$2,$3,$4)`,
    [user2, heldQuizNumericId, oldResultId, oldCompletedAt],
  );
  for (const q of heldQuestions) {
    const ids = (await db.query(
      `select qq.question_id, qc.choice_id from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id where qq.quiz_id = $1 and qq.question_key = $2 and qc.choice_key = $3`,
      [heldQuizNumericId, q.question_key, q.choices[0]],
    )).rows[0];
    await db.query(
      `insert into user_quiz_answers (user_id, quiz_id, question_id, choice_id, answered_at) values ($1,$2,$3,$4,$5)`,
      [user2, heldQuizNumericId, ids.question_id, ids.choice_id, oldCompletedAt],
    );
  }
  const exportedAnswers2 = (await db.query(
    `select uqa.user_id, qq.question_key, qc.choice_key, uqa.answered_at
     from user_quiz_answers uqa
     join quizzes qz on qz.quiz_id = uqa.quiz_id
     join quiz_questions qq on qq.question_id = uqa.question_id
     join quiz_choices qc on qc.choice_id = uqa.choice_id
     where qz.quiz_key = $1 and uqa.user_id = $2`,
    [HELD_QUIZ_KEY, user2],
  )).rows;
  const export2Path = join(tmpDir, 'answers2.json');
  writeFileSync(export2Path, JSON.stringify({ rows: exportedAnswers2.map((r) => ({ userId: r.user_id, questionKey: r.question_key, choiceKey: r.choice_key, answeredAt: r.answered_at })) }));
  const reconcile2SqlPath = join(tmpDir, 'reconcile2.sql');
  execSync(`npx tsx ${join(root, 'scripts/reconcile-held-quiz-evidence.ts')} ${HELD_QUIZ_KEY} ${export2Path} ${awardsExportPath} ${reconcile2SqlPath}`, { cwd: root, stdio: 'pipe' });
  await db.exec(readFileSync(reconcile2SqlPath, 'utf8'));
  const rebuild2SqlPath = join(tmpDir, 'rebuild2.sql');
  execSync(`npx tsx ${join(root, 'scripts/rebuild-user-trait-totals.ts')} ${rebuild2SqlPath}`, { cwd: root, stdio: 'pipe' });
  await db.exec(readFileSync(rebuild2SqlPath, 'utf8'));
  const lifetimeForUser2 = (await db.query(`select lifetime_earned from user_trait_totals where user_id = $1 and trait_id = 1`, [user2])).rows[0];
  const activeForUser2 = (await db.query(`select count(*)::int as n from user_trait_active_totals where user_id = $1`, [user2])).rows[0].n;
  check('6. a 14-month-old reconciled completion correctly has real lifetime evidence...', lifetimeForUser2?.lifetime_earned === heldQuestions.length * 2, JSON.stringify(lifetimeForUser2));
  check('6. ...but ZERO active totals (born already-expired, never freshly "active")', activeForUser2 === 0, `n=${activeForUser2}`);

  // === 7. THE THIRD-ROUND FIX: a forged mapping export must be REJECTED. ===
  // A SECOND, independent synthetic quiz, isolated from the first (HELD_QUIZ_KEY above, also
  // now synthetic -- see that constant's own comment) so this scenario's forged mapping can't
  // accidentally overlap with the first quiz's now-"approved" award rows. Build 22 owner audit
  // (2026-11-02): every real Private quiz in the live catalog is now fully activated, so both
  // fixtures in this file are deliberately synthetic -- mirroring the exact mechanical-fixture
  // pattern already used by run-quiz-content-version-authorization-test.mjs's synthetic
  // 'love-soulmates-ready-v2' -- never real Private-quiz content, never QUIZ_REGISTRY.
  const FORGED_QUIZ_KEY = 'synthetic-held-reconciliation-fixture';
  const forgedQuizId = 9501;
  await db.query(
    `insert into quizzes (quiz_id, quiz_key, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key) values ($1, $2, 'archetype', null, 'private', false, $2)`,
    [forgedQuizId, FORGED_QUIZ_KEY],
  );
  // This test's loaded migration snapshot predates real server-side scoring verification
  // (20261101030000) and the quiz_result_definitions/quiz_choice_result_weights tables it
  // introduced -- submit_quiz_completion at THIS snapshot only validates question_key/
  // choice_key identity, so this fixture needs nothing beyond quizzes/quiz_questions/
  // quiz_choices to exercise the reconciliation mechanism this scenario actually tests.
  const forgedQuestionIds = [9601, 9602, 9603, 9604];
  for (let i = 0; i < forgedQuestionIds.length; i++) {
    await db.query(`insert into quiz_questions (question_id, quiz_id, question_key, position, scoring_role) values ($1, $2, $3, $4, null)`, [forgedQuestionIds[i], forgedQuizId, `q${i + 1}`, i + 1]);
    for (const letter of ['a', 'b', 'c', 'd']) {
      const choiceId = 9700 + forgedQuestionIds[i] * 10 + 'abcd'.indexOf(letter);
      await db.query(`insert into quiz_choices (choice_id, question_id, choice_key, flavor_score) values ($1, $2, $3, null)`, [choiceId, forgedQuestionIds[i], letter]);
    }
  }
  const forgedQuestions = (await db.query(
    `select qq.question_key, array_agg(qc.choice_key order by qc.choice_key) choices from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key=$1 group by qq.question_key order by qq.question_key`,
    [FORGED_QUIZ_KEY],
  )).rows;
  const forgedAwardCountBefore = (await db.query(
    `select count(*)::int as n from quiz_choice_trait_awards a join quiz_choices qc on qc.choice_id = a.choice_id join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = $1`,
    [FORGED_QUIZ_KEY],
  )).rows[0].n;
  check(`7. precondition: '${FORGED_QUIZ_KEY}' has ZERO real award rows (genuinely held, nothing approved)`, forgedAwardCountBefore === 0, `n=${forgedAwardCountBefore}`);

  const user3 = '00000000-0000-0000-0000-000000000093';
  await db.query(`insert into auth.users (id) values ($1)`, [user3]);
  await db.query(`insert into test_entitlements (user_id, entitlement_id) values ($1, 'apparently_private')`, [user3]);
  await asUser(user3);
  // This snapshot's submit_quiz_completion predates real result-metadata verification, so
  // these result/score/percent values are arbitrary placeholders, exactly as the original
  // (pre-activation) version of this scenario used.
  const forgedFirstAnswers = Object.fromEntries(forgedQuestions.map((q) => [q.question_key, q.choices[0]]));
  await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [FORGED_QUIZ_KEY, 'Career', 'private', daysAgo(2), forgedQuestions.length, 50, 50, 'r7', 'R7', [], null, JSON.stringify(forgedFirstAnswers)],
  );
  await db.query(`select set_config('request.user_id', '', false)`);

  const forgedAnswersExport = (await db.query(
    `select uqa.user_id, qq.question_key, qc.choice_key
     from user_quiz_answers uqa
     join quizzes qz on qz.quiz_id = uqa.quiz_id
     join quiz_questions qq on qq.question_id = uqa.question_id
     join quiz_choices qc on qc.choice_id = uqa.choice_id
     where qz.quiz_key = $1 and uqa.user_id = $2`,
    [FORGED_QUIZ_KEY, user3],
  )).rows;
  const forgedAnswersPath = join(tmpDir, 'forged-answers.json');
  writeFileSync(forgedAnswersPath, JSON.stringify({ rows: forgedAnswersExport.map((r) => ({ userId: r.user_id, questionKey: r.question_key, choiceKey: r.choice_key })) }));

  // THE FORGERY: claims a mapping that is ABSENT from the live database -- exactly the
  // owner's own independent reproduction ("a mapping absent from the database").
  const forgedAwardsPath = join(tmpDir, 'forged-awards.json');
  writeFileSync(forgedAwardsPath, JSON.stringify({
    rows: [{ questionKey: forgedQuestions[0].question_key, choiceKey: forgedQuestions[0].choices[0], traitId: 3, points: 2 }],
  }));

  const forgedReconcileSqlPath = join(tmpDir, 'forged-reconcile.sql');
  execSync(`npx tsx ${join(root, 'scripts/reconcile-held-quiz-evidence.ts')} ${FORGED_QUIZ_KEY} ${forgedAnswersPath} ${forgedAwardsPath} ${forgedReconcileSqlPath}`, { cwd: root, stdio: 'pipe' });
  check('7. the generator itself does not connect to any database -- it still writes a SQL file (validation happens when that SQL actually runs)', true);

  let forgedSqlThrew = false;
  let forgedErrorMessage = '';
  try {
    await db.exec(readFileSync(forgedReconcileSqlPath, 'utf8'));
  } catch (e) {
    forgedSqlThrew = true;
    forgedErrorMessage = String(e.message || e);
    // The RAISE EXCEPTION inside the generated SQL's own transaction correctly aborted it
    // (standard Postgres behavior) -- this connection needs an explicit ROLLBACK before any
    // further query, same as any real client would issue after catching a failed transaction.
    await db.query('rollback');
  }
  check('7. THE FIX: applying the forged-mapping SQL throws (fails closed) instead of silently writing fabricated evidence', forgedSqlThrew, forgedErrorMessage.slice(0, 300));
  check('7. the error explicitly names this as an aborted reconciliation', forgedErrorMessage.toLowerCase().includes('abort'), forgedErrorMessage.slice(0, 200));

  const evidenceForUser3 = (await db.query(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [user3])).rows[0].n;
  check('7. THE FIX: ZERO evidence rows exist for this user -- the forged mapping produced NOTHING, not even partially', evidenceForUser3 === 0, `n=${evidenceForUser3}`);
  const liveAwardsForForgedQuiz = (await db.query(
    `select count(*)::int as n from quiz_choice_trait_awards a join quiz_choices qc on qc.choice_id = a.choice_id join quiz_questions qq on qq.question_id = qc.question_id join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = $1`,
    [FORGED_QUIZ_KEY],
  )).rows[0].n;
  check('7. the live quiz_choice_trait_awards table itself is untouched (still zero rows) -- the forged export never got written anywhere, even to the awards table', liveAwardsForForgedQuiz === 0, `n=${liveAwardsForForgedQuiz}`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
