// Build 22 owner audit (2026-10-30), item 6: "The active evidence expiry function filters
// user_trait_evidence by created_at, but the table has no leading created_at index. Add an
// appropriate evidence-time lookup index and test query plans with realistic row counts.
// Examine batch behavior and simultaneous submission/expiry correctness."
//
// Proves, against the REAL migrations (20261030040000's new index, 20261030010000's real
// expire_stale_active_evidence()):
//   1. At a REALISTIC row count (~8,000 evidence rows across hundreds of users), the
//      watermark query's plan actually uses the new (created_at, user_id) index, not a
//      sequential scan.
//   2. Batch correctness: expiry correctly recomputes active totals for every one of
//      hundreds of affected users in a single run, with correct per-user per-trait sums.
//   3. Simultaneous-submission correctness: a late-arriving (backdated) evidence row whose
//      created_at falls BEFORE a watermark the expiry job already advanced past is still
//      correctly caught and expired on the job's NEXT run -- proving the watermark design
//      cannot silently skip a row that "arrives late" relative to its own timestamp.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };

// Build 22 owner audit (2026-10-31), item 5: the original version of this check used an INNER
// JOIN between user_trait_active_totals and an independently-aggregated evidence subquery --
// which silently IGNORES any row present on only one side (a totals row with no matching
// evidence at all -- an EXTRA row that should not exist -- or evidence with no matching
// totals row -- a MISSING row that should exist) and would have reported "0 mismatches" for
// either case, a false pass. Fixed: a FULL OUTER JOIN explicitly categorizes all three real
// failure modes -- extra rows, missing rows, and rows present on both sides with incorrect
// values -- and each is asserted separately so a failure names exactly which kind occurred.
const assertActiveTotalsFullyReconciled = async (label, cutoffIso) => {
  const result = (await db.query(
    `select
       count(*) filter (where e.user_id is null)::int as extra_rows,
       count(*) filter (where uat.user_id is null)::int as missing_rows,
       count(*) filter (
         where e.user_id is not null and uat.user_id is not null
           and (uat.lifetime_earned <> e.sum_earned or uat.max_available_total <> e.sum_max
                or uat.distinct_questions_with_earned <> e.distinct_earned
                or uat.distinct_questions_presented <> e.distinct_presented)
       )::int as incorrect_rows
     from public.user_trait_active_totals uat
     full outer join (
       select user_id, trait_id,
         sum(points_earned) sum_earned, sum(max_available) sum_max,
         count(*) filter (where points_earned > 0) as distinct_earned,
         count(*) as distinct_presented
       from public.user_trait_evidence
       where created_at >= $1
       group by user_id, trait_id
     ) e on e.user_id = uat.user_id and e.trait_id = uat.trait_id`,
    [cutoffIso],
  )).rows[0];
  check(`${label}: zero EXTRA user_trait_active_totals rows (present with no matching active evidence)`, result.extra_rows === 0, `extra=${result.extra_rows}`);
  check(`${label}: zero MISSING user_trait_active_totals rows (active evidence exists with no matching totals row)`, result.missing_rows === 0, `missing=${result.missing_rows}`);
  check(`${label}: zero INCORRECT user_trait_active_totals rows (present on both sides but with wrong values)`, result.incorrect_rows === 0, `incorrect=${result.incorrect_rows}`);
};
const run = async (p) => db.exec(readFileSync(p, 'utf8'));

try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261030040000_user_trait_evidence_created_at_index.sql'));
  console.log('loaded: full schema + REAL expiry function + REAL new created_at index');

  const indexExists = (await db.query(
    `select indexname, indexdef from pg_indexes where tablename = 'user_trait_evidence' and indexname = 'user_trait_evidence_created_at_user_id_idx'`,
  )).rows[0];
  check('the new (created_at, user_id) index exists on user_trait_evidence', !!indexExists, JSON.stringify(indexExists));

  // --- Realistic batch: 400 users x ~20 evidence rows each = 8,000 rows, spread across a
  // 20-month range so a real mix lands on both sides of a 12-month cutoff.
  const userCount = 400;
  const rowsPerUser = 20;
  await db.exec(`
    insert into auth.users (id)
    select gen_random_uuid() from generate_series(1, ${userCount});
  `);
  await db.exec(`
    create temporary table tmp_test_users as select id from auth.users;
    insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at)
    select
      u.id,
      'quiz_answer',
      gen_random_uuid(),
      1 + (floor(random() * 64))::int,
      (floor(random() * 4))::int,
      3,
      now() - (random() * interval '20 months')
    from tmp_test_users u, generate_series(1, ${rowsPerUser});
  `);
  // A handful of DETERMINISTICALLY fully-aged-out users (every row >20 months old) -- the
  // random spread above makes this combination astronomically unlikely to occur on its own
  // with 20 rows/user, so this edge case needs its own explicit fixture rather than relying on
  // chance.
  const fullyExpiredUserId = (await db.query(`insert into auth.users (id) values (gen_random_uuid()) returning id`)).rows[0].id;
  await db.query(
    `insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at)
     select $1, 'quiz_answer', gen_random_uuid(), 1 + (s % 64), 1, 3, now() - interval '20 months' - (s || ' days')::interval
     from generate_series(1, 10) s`,
    [fullyExpiredUserId],
  );

  const totalRows = (await db.query(`select count(*)::int as n from user_trait_evidence`)).rows[0].n;
  check(`inserted a realistic batch (${userCount} users x ${rowsPerUser} rows + 1 deterministically-expired user = ${userCount * rowsPerUser + 10} evidence rows)`, totalRows === userCount * rowsPerUser + 10, `n=${totalRows}`);

  await db.exec('analyze user_trait_evidence;');

  // --- 1. Query plan check: the exact shape expire_stale_active_evidence() runs, on a
  // REALISTIC (narrow, selective) watermark-to-cutoff window -- a daily run only ever
  // examines evidence that crossed the boundary since yesterday, a tiny fraction of the whole
  // table, which is exactly the case a leading created_at index should matter for (unlike the
  // job's rare, one-time '-infinity' cold-start catch-up, which legitimately scans most of the
  // table and where a sequential scan is the CORRECT planner choice regardless of the index).
  const narrowWatermark = new Date(Date.now() - 20 * 30.44 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000).toISOString();
  const narrowCutoff = new Date(Date.now() - 20 * 30.44 * 24 * 60 * 60 * 1000).toISOString();
  const explain = await db.query(
    `explain (format json) select distinct user_id from public.user_trait_evidence where created_at >= $1 and created_at < $2`,
    [narrowWatermark, narrowCutoff],
  );
  const planJson = explain.rows[0]['QUERY PLAN'];
  const planText = JSON.stringify(planJson);
  const usesSeqScan = planText.includes('"Node Type":"Seq Scan"') || planText.includes('"Node Type": "Seq Scan"');
  const usesNewIndex = planText.includes('user_trait_evidence_created_at_user_id_idx');
  check('a realistic (narrow, selective) watermark-range query plan uses the new created_at index, not a sequential scan', usesNewIndex && !usesSeqScan, planText.slice(0, 500));

  // --- 2. Batch correctness: run expiry, confirm active totals are correctly recomputed for
  // every user whose evidence crosses the boundary, matching an independent aggregation.
  await db.query(`select public.expire_stale_active_evidence()`);

  const cutoff = (await db.query(`select now() - interval '12 months' as c`)).rows[0].c;
  await assertActiveTotalsFullyReconciled('after batch expiry', cutoff);

  const activeRowsExist = (await db.query(`select count(*)::int as n from user_trait_active_totals`)).rows[0].n;
  const usersWithOnlyOldEvidence = (await db.query(
    `select count(distinct user_id)::int as n from public.user_trait_evidence e
     where not exists (select 1 from public.user_trait_evidence e2 where e2.user_id = e.user_id and e2.created_at >= $1)`,
    [cutoff],
  )).rows[0].n;
  check('batch produced a nonzero number of active-total rows (the 20-month spread genuinely exercised both sides of the cutoff)', activeRowsExist > 0, `active_rows=${activeRowsExist}`);
  check('at least one user in this batch has ZERO still-active evidence (fully aged out) -- a real edge case this batch size is expected to produce', usersWithOnlyOldEvidence > 0, `n=${usersWithOnlyOldEvidence}`);
  for (const uid of (await db.query(`select distinct user_id from public.user_trait_evidence e where not exists (select 1 from public.user_trait_evidence e2 where e2.user_id = e.user_id and e2.created_at >= $1) limit 1`, [cutoff])).rows) {
    const rowsForFullyExpiredUser = (await db.query(`select count(*)::int as n from user_trait_active_totals where user_id = $1`, [uid.user_id])).rows[0].n;
    check(`a fully-aged-out user (${uid.user_id.slice(0, 8)}...) has ZERO user_trait_active_totals rows after batch expiry`, rowsForFullyExpiredUser === 0, `rows=${rowsForFullyExpiredUser}`);
  }

  // --- 3. Simultaneous-submission correctness: a backdated row arriving AFTER the watermark
  // has already advanced past its own timestamp must still be caught on the NEXT run.
  const watermarkAfterFirstRun = (await db.query(`select last_cutoff_processed from evidence_expiry_job_state where job_name = 'expire_stale_active_evidence'`)).rows[0].last_cutoff_processed;
  const lateUserId = (await db.query(`select id from tmp_test_users limit 1`)).rows[0].id;
  const lateUserPriorActiveRow = (await db.query(`select lifetime_earned, max_available_total from user_trait_active_totals where user_id = $1 and trait_id = 1`, [lateUserId])).rows[0] ?? { lifetime_earned: 0, max_available_total: 0 };
  // This row's created_at is BEFORE watermarkAfterFirstRun, which itself already equals
  // now()-12mo AT THE TIME OF THE FIRST RUN -- so this backdated row is DETERMINISTICALLY
  // just past the 12-month boundary (older than the cutoff), simulating a delayed/offline-
  // queued submission whose real evidence timestamp predates when the expiry job already
  // swept past that point in time. Expected outcome is therefore KNOWN, not merely "whatever
  // happens is fine": this row must NOT count as active, so trait 1's active total for this
  // user must be UNCHANGED by it.
  const backdatedTimestamp = new Date(new Date(watermarkAfterFirstRun).getTime() - 24 * 60 * 60 * 1000).toISOString();
  await db.query(
    `insert into public.user_trait_evidence (user_id, source_type, source_answer_id, trait_id, points_earned, max_available, created_at) values ($1,'quiz_answer',gen_random_uuid(),1,2,3,$2)`,
    [lateUserId, backdatedTimestamp],
  );
  await db.query(`select public.expire_stale_active_evidence()`);

  const cutoffAfterSecondRun = (await db.query(`select now() - interval '12 months' as c`)).rows[0].c;
  // THE DETERMINISTIC EXPECTATION, checked explicitly (never "pass if the row is merely
  // absent"): the backdated row is outside the window, so trait 1's active total for this
  // user must be BYTE-IDENTICAL to its value before the backdated insert.
  const lateUserActiveRowAfter = (await db.query(`select lifetime_earned, max_available_total from user_trait_active_totals where user_id = $1 and trait_id = 1`, [lateUserId])).rows[0] ?? { lifetime_earned: 0, max_available_total: 0 };
  check(
    'the watermark-outside backdated row did NOT change this user\'s active total for trait 1 (correctly excluded, not silently included)',
    lateUserActiveRowAfter.lifetime_earned === lateUserPriorActiveRow.lifetime_earned && lateUserActiveRowAfter.max_available_total === lateUserPriorActiveRow.max_available_total,
    `before=${JSON.stringify(lateUserPriorActiveRow)} after=${JSON.stringify(lateUserActiveRowAfter)}`,
  );
  // And a full reconciliation pass across the WHOLE table, not just this one user/trait --
  // proves the watermark's "catch up on what crossed the boundary since last run" logic
  // didn't corrupt anything else either, using the same full-comparison helper as check #2.
  await assertActiveTotalsFullyReconciled('after the second expiry run (post backdated-row insert)', cutoffAfterSecondRun);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
