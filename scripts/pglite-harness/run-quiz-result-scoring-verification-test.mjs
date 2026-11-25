// Build 22 owner audit (2026-11-01), item 1: "Finish server-side result integrity." EXACT
// reproduction of the owner's own finding --
//   Quiz: Petty. Answers: q1-q8 all A. Correct score 12/24. Correct percent 50%. Correct
//   result: selectively-petty / SELECTIVELY PETTY.
//   Submitted instead: score=24, percent=100, result_id=mostly-unbothered, arbitrary traits.
//   The RPC accepted the submission as a first completion and saved the contradictory
//   metadata.
// Proves the fix in 20261101030000_quiz_result_scoring_verification.sql against the REAL,
// unmodified migrations, for all three scoring types: numericBand (Petty), archetype
// (crisis, including a genuine tie resolved by the generic tie-break), and dualDimension
// (whats-your-type).
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
let userCounter = 0;
const newUser = async () => {
  userCounter += 1;
  const id = `00000000-0000-0000-0000-0000000001${String(userCounter).padStart(2, '0')}`;
  await db.query(`insert into auth.users (id) values ($1)`, [id]);
  return id;
};

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  await run(join(root, 'supabase/migrations/20261101030000_quiz_result_scoring_verification.sql'));
  await run(join(root, 'supabase/migrations/20261101040000_quiz_access_inheritance_and_content_versioning.sql'));
  await run(join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
  await run(join(root, 'supabase/migrations/20261102010000_archetype_fallback_result_and_tie_chain.sql'));
  console.log('loaded: full schema + REAL server-side scoring verification + the configurable scoring engine through the fallback-result/tie-chain fix (20261102010000) -- regression check: every assertion below predates these migrations and must still pass byte-identically against the new generic resolve_archetype_result.');

  // ============================================================================================
  // 1. NUMERIC BAND (Petty) -- the owner's exact reproduction.
  // ============================================================================================
  const pettyAllA = { q1: 'a', q2: 'a', q3: 'a', q4: 'a', q5: 'a', q6: 'a', q7: 'a', q8: 'a' };

  const userA = await newUser();
  await asUser(userA);
  let repro1Rejected = false;
  let repro1Error = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), 8, 24, 100, 'mostly-unbothered', 'Fabricated Title', [], null, JSON.stringify(pettyAllA)],
    );
  } catch (e) {
    repro1Rejected = true;
    repro1Error = String(e.message || e);
  }
  check('1a. THE EXACT REPRODUCTION: q1-q8 all A with claimed score=24/result=mostly-unbothered is REJECTED', repro1Rejected, repro1Error.slice(0, 250));
  check('1a. the rejection names the REAL result (selectively-petty), not just "invalid"', repro1Error.includes('selectively-petty'), repro1Error);
  const resultsAfterRepro1 = (await db.query(`select count(*)::int as n from quiz_results where user_id = $1`, [userA])).rows[0].n;
  check('1a. nothing was written at all for the rejected submission', resultsAfterRepro1 === 0, `n=${resultsAfterRepro1}`);

  // The CORRECT metadata for this exact answer set must be accepted.
  const legit1 = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), 8, 12, 50, 'selectively-petty', 'client title (ignored, catalog title wins)', [], null, JSON.stringify(pettyAllA)],
  );
  check('1b. the REAL metadata for q1-q8 all A (score=12, percent=50, result=selectively-petty) is ACCEPTED', legit1.rows[0] !== undefined && legit1.rows[0].is_first_completion === true, JSON.stringify(legit1.rows[0]));
  const storedResult1 = (await db.query(`select result_title, score, percent, result_id from quiz_results where id = $1`, [legit1.rows[0].quiz_result_id])).rows[0];
  check('1b. stored result_title is the real catalog title (SELECTIVELY PETTY), never the client\'s', storedResult1.result_title === 'SELECTIVELY PETTY', JSON.stringify(storedResult1));

  // Manipulating ONLY the score (keeping the real result_id/percent) must also be rejected --
  // proves the check is on the real computed score, not merely "is result_id known."
  const userB = await newUser();
  await asUser(userB);
  let scoreOnlyRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'fun', daysAgo(1), 8, 13, 50, 'selectively-petty', 'x', [], null, JSON.stringify(pettyAllA)],
    );
  } catch (e) {
    scoreOnlyRejected = true;
  }
  check('1c. manipulating ONLY the score (13 instead of the real 12), with the otherwise-correct result_id, is rejected', scoreOnlyRejected);

  // A DIFFERENT real answer combination (not all-A) must ALSO verify correctly -- proves this
  // isn't special-cased to one example.
  const userC = await newUser();
  await asUser(userC);
  const pettyAllB = { q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b', q6: 'b', q7: 'b', q8: 'b' };
  // Real Petty content (confirmed earlier in this engagement): q1 b=3,q2 b=3,q3 b=3,q4 b=1,
  // q5 b=1,q6 b=1,q7 b=1,q8 b=1 -- varies per question, not a fixed per-letter score. Compute
  // the real total directly from the catalog rather than assuming a pattern.
  const pettyBTotal = (await db.query(
    `select sum(qc.flavor_score)::int as n from quiz_questions qq join quizzes qz on qz.quiz_id=qq.quiz_id join quiz_choices qc on qc.question_id=qq.question_id where qz.quiz_key='petty' and qc.choice_key='b'`,
  )).rows[0].n;
  const pettyBand = (await db.query(
    `select result_key, result_title from quiz_result_definitions where quiz_id = (select quiz_id from quizzes where quiz_key='petty') and $1 between min_score and max_score`,
    [pettyBTotal],
  )).rows[0];
  const pettyBPercent = Math.round((pettyBTotal / 24) * 100);
  const legitB = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'fun', daysAgo(1), 8, pettyBTotal, pettyBPercent, pettyBand.result_key, 'x', [], null, JSON.stringify(pettyAllB)],
  );
  check('1d. a SECOND, different real answer combination (all B) also verifies and is accepted', legitB.rows[0] !== undefined && legitB.rows[0].is_first_completion === true, JSON.stringify({ pettyBTotal, pettyBand, legit: legitB.rows[0] }));

  // ============================================================================================
  // 2. ARCHETYPE (crisis) -- a clean win, a manipulated result, and a genuine TIE resolved by
  // the generic tie-break (last 3 questions' own winner, most recent first).
  // ============================================================================================
  // Every choice contributing to 'commander' across all 8 real crisis questions (verified
  // directly against real content): q1=c,q2=b,q3=c,q4=d,q5=a,q6=d,q7=a,q8=b.
  const crisisAllCommander = { q1: 'c', q2: 'b', q3: 'c', q4: 'd', q5: 'a', q6: 'd', q7: 'a', q8: 'b' };
  const userD = await newUser();
  await asUser(userD);
  const legitCrisis = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['crisis', 'Crisis', 'fun', daysAgo(1), 8, 8, 100, 'commander', 'x', [], null, JSON.stringify(crisisAllCommander)],
  );
  check('2a. a clean (non-tied) archetype win -- all 8 answers favor "commander" -- verifies score=8/percent=100/result=commander', legitCrisis.rows[0] !== undefined && legitCrisis.rows[0].is_first_completion === true, JSON.stringify(legitCrisis.rows[0]));

  const userE = await newUser();
  await asUser(userE);
  let crisisManipulatedRejected = false;
  let crisisManipulatedError = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['crisis', 'Crisis', 'fun', daysAgo(1), 8, 8, 100, 'fixer', 'x', [], null, JSON.stringify(crisisAllCommander)],
    );
  } catch (e) {
    crisisManipulatedRejected = true;
    crisisManipulatedError = String(e.message || e);
  }
  check('2b. the SAME all-commander answers with a manipulated result_id ("fixer" instead) are rejected', crisisManipulatedRejected, crisisManipulatedError.slice(0, 200));
  check('2b. the rejection names the real result (commander)', crisisManipulatedError.includes('commander'), crisisManipulatedError);

  // A genuine tie: commander and fixer each get exactly 4 points; fixer wins because it is
  // the winner of q8, the MOST RECENT of the last 3 questions -- hand-verified against the
  // real content and scoring.ts's own generic tie-break rule (pickPrimaryArchetypeGeneric).
  const crisisTied = { q1: 'c', q2: 'b', q3: 'c', q4: 'd', q5: 'b', q6: 'b', q7: 'c', q8: 'd' };
  const userF = await newUser();
  await asUser(userF);
  const tiedResult = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['crisis', 'Crisis', 'fun', daysAgo(1), 8, 4, 50, 'fixer', 'x', [], null, JSON.stringify(crisisTied)],
  );
  check('2c. THE GENERIC TIE-BREAK: commander and fixer tie at 4 points each -- fixer correctly wins (most recent of the last 3 questions)', tiedResult.rows[0] !== undefined && tiedResult.rows[0].is_first_completion === true, JSON.stringify(tiedResult.rows[0]));
  // Sanity: confirm this really was a tie by checking commander would NOT have been accepted.
  const userG = await newUser();
  await asUser(userG);
  let tieWrongWinnerRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['crisis', 'Crisis', 'fun', daysAgo(1), 8, 4, 50, 'commander', 'x', [], null, JSON.stringify(crisisTied)],
    );
  } catch {
    tieWrongWinnerRejected = true;
  }
  check('2c. ...and claiming "commander" (the OTHER tied candidate) for the SAME tied answers is rejected -- the tie-break result is exact, not merely "one of the tied set"', tieWrongWinnerRejected);

  // ============================================================================================
  // 3. DUAL DIMENSION (whats-your-type) -- both dimension winners verified independently, and
  // the combination key.
  // ============================================================================================
  // Every choice contributing to 'walking-green-flag' (dimension A, q1-5) and 'thoughtful-one'
  // (dimension B, q6-10) -- verified directly against real content.
  const whatsYourTypeAnswers = { q1: 'e', q2: 'e', q3: 'a', q4: 'e', q5: 'f', q6: 'e', q7: 'c', q8: 'f', q9: 'c', q10: 'f' };
  const userH = await newUser();
  await asUser(userH);
  const legitDualDim = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['whats-your-type', "What's Your Type", 'fun', daysAgo(1), 10, 10, 100, 'walking-green-flag:thoughtful-one', 'x', [], null, JSON.stringify(whatsYourTypeAnswers)],
  );
  check('3a. a clean dualDimension win on both axes verifies the real "walking-green-flag:thoughtful-one" combination', legitDualDim.rows[0] !== undefined && legitDualDim.rows[0].is_first_completion === true, JSON.stringify(legitDualDim.rows[0]));

  const userI = await newUser();
  await asUser(userI);
  let dualDimManipulatedRejected = false;
  let dualDimManipulatedError = '';
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['whats-your-type', "What's Your Type", 'fun', daysAgo(1), 10, 10, 100, 'charming-menace:thoughtful-one', 'x', [], null, JSON.stringify(whatsYourTypeAnswers)],
    );
  } catch (e) {
    dualDimManipulatedRejected = true;
    dualDimManipulatedError = String(e.message || e);
  }
  check('3b. the SAME answers with a manipulated dimension-A result ("charming-menace" instead of the real "walking-green-flag") are rejected', dualDimManipulatedRejected, dualDimManipulatedError.slice(0, 200));
  check('3b. the rejection names the REAL combination', dualDimManipulatedError.includes('walking-green-flag:thoughtful-one'), dualDimManipulatedError);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
