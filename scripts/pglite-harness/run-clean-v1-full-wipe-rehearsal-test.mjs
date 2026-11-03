// V1 release execution (2026-11-03), "Clean V1 Launch Directive": the owner's final decision
// supersedes the earlier, beta-preserving reset -- rehearses
// supabase/manual_operations/20261103020000_clean_v1_full_prelaunch_wipe.sql (full consumer/
// tester wipe, preserving exactly one admin identity) against an isolated PGlite instance,
// seeded with representative pre-wipe data across every affected table plus a real admin.
//
// This supersedes run-clean-v1-reset-rehearsal-test.mjs, which rehearsed the now-archived,
// selective-preserve reset (supabase/migrations_archive/
// 20261102030000_clean_v1_prelaunch_data_reset.sql) -- kept for historical record, no longer
// the staged plan.
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
const count = async (sql, params = []) => (await db.query(sql, params)).rows[0].n;

try {
  // --- Same isolated staging baseline as the full candidate-set apply test ---
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'));
  await run(join(__dirname, '02-stub-legacy-quiz-result-deps.sql'));
  await run(join(root, 'supabase/migrations/20261018020000_age_eligibility_gate.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028020000_quiz_content_identity.sql'));
  await db.exec(`
    create table public.quiz_shares (
      id uuid primary key default gen_random_uuid(),
      sharer_user_id uuid not null references auth.users (id) on delete cascade,
      quiz_id text not null, result_id text not null,
      quiz_result_id uuid not null references public.quiz_results (id) on delete cascade,
      sharer_display_name text, created_at timestamptz not null default now()
    );
    create table public.compare_responses (
      id uuid primary key default gen_random_uuid(),
      share_id uuid not null references public.quiz_shares (id) on delete cascade,
      respondent_token uuid not null, respondent_nickname text not null,
      answers jsonb not null, primary_result_id text not null, secondary_result_id text, note text,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      viewed_at timestamptz, unique (share_id, respondent_token)
    );
    create table public.user_entitlements (
      user_id uuid not null references auth.users (id) on delete cascade,
      entitlement_id text not null, is_active boolean not null default false,
      expires_at timestamptz, product_id text, environment text,
      last_verified_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      primary key (user_id, entitlement_id)
    );
    create table public.tester_access_grants (
      user_id uuid primary key references auth.users (id) on delete cascade,
      granted_by uuid references auth.users (id), note text, created_at timestamptz not null default now()
    );
    create table public.personality_pole_evidence (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      source_type text not null, source_id text not null, question_stable_id text not null,
      choice_stable_id text not null, pole_id text not null, points_earned smallint not null,
      max_available smallint not null, scoring_version text not null, created_at timestamptz not null default now()
    );
    create table public.creature_published_recipes (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      cycle_week text not null, slot text not null check (slot in ('eyes','earsHorns','wings','body','tail')),
      trait_id smallint not null references public.personality_traits (trait_id),
      published_at timestamptz not null default now(), unique (user_id, cycle_week, slot)
    );
    create table public.creature_evolution_cycle_markers (
      user_id uuid not null references auth.users (id) on delete cascade,
      cycle_week text not null, evaluated_at timestamptz not null default now(),
      primary key (user_id, cycle_week)
    );
    create table public.admin_users (
      user_id uuid primary key references auth.users (id) on delete cascade,
      role text not null check (role in ('owner', 'editor')),
      created_at timestamptz not null default now()
    );
  `);
  await run(join(root, 'supabase/migrations/20261028040000_user_quiz_evidence_schema.sql'));
  await run(join(root, 'supabase/migrations/20261030010000_active_evidence_window.sql'));
  await run(join(root, 'supabase/migrations/20261030030000_active_profile_activity_counts.sql'));
  await run(join(root, 'supabase/migrations/20261030040000_user_trait_evidence_created_at_index.sql'));
  await run(join(root, 'supabase/migrations/20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql'));
  await run(join(root, 'supabase/migrations/20261101010000_quiz_result_definitions_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql'));
  await run(join(root, 'supabase/migrations/20261101030000_quiz_result_scoring_verification.sql'));
  await run(join(root, 'supabase/migrations/20261101040000_quiz_access_inheritance_and_content_versioning.sql'));
  await run(join(root, 'supabase/migrations/20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql'));
  await run(join(root, 'supabase/migrations/20261102010000_archetype_fallback_result_and_tie_chain.sql'));
  await run(join(root, 'supabase/migrations/20261102020000_final_scoring_cleanup_and_v1_reset.sql'));
  await run(join(root, 'supabase/migrations/20261102040000_submit_quiz_result_version_guard.sql'));
  check('isolated staging rehearsal environment seeded', true);

  // ==========================================================================================
  // SEED: one real admin, two real consumers with representative pre-wipe data
  // ==========================================================================================
  const adminId = '00000000-0000-0000-0000-0000000000ad';
  const testerA = '00000000-0000-0000-0000-0000000000a1';
  const testerB = '00000000-0000-0000-0000-0000000000a2';
  await db.query(`insert into auth.users (id) values ($1)`, [adminId]);
  await db.query(`insert into public.admin_users (user_id, role) values ($1, 'owner')`, [adminId]);
  for (const id of [testerA, testerB]) {
    await db.query(`insert into auth.users (id) values ($1)`, [id]);
    await db.query(`insert into public.profiles (user_id) values ($1)`, [id]);
  }

  const pettyQuestions = (await db.query(
    `select qq.question_key, min(qc.choice_key) as first_choice
     from quiz_questions qq join quiz_choices qc on qc.question_id = qq.question_id
     join quizzes qz on qz.quiz_id = qq.quiz_id where qz.quiz_key = 'petty' group by qq.question_key`,
  )).rows;
  const pettyAnswers = Object.fromEntries(pettyQuestions.map((q) => [q.question_key, q.first_choice]));
  await asUser(testerA);
  const completion = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(10), pettyQuestions.length, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', [], null, JSON.stringify(pettyAnswers)],
  );
  const pettyResultId = completion.rows[0].quiz_result_id;

  const dailyQuestionId = '00000000-0000-0000-0000-0000000d0001';
  const dailyOptionId = '00000000-0000-0000-0000-0000000d0002';
  await db.query(`insert into daily_questions (id, prompt, category, status, room, daily_mode) values ($1, 'A representative Daily prompt', 'test', 'Live', 'public', 'standard')`, [dailyQuestionId]);
  await db.query(`insert into daily_options (id, question_id, position, label) values ($1, $2, 1, 'A representative option')`, [dailyOptionId, dailyQuestionId]);
  await db.query(`insert into daily_answers (id, user_id, question_id, option_id, created_at) values (gen_random_uuid(), $1, $2, $3, $4)`, [testerA, dailyQuestionId, dailyOptionId, daysAgo(5)]);

  const shareRow = await db.query(
    `insert into quiz_shares (sharer_user_id, quiz_id, result_id, quiz_result_id, sharer_display_name) values ($1, 'petty', 'selectively-petty', $2, 'Tester A') returning id`,
    [testerA, pettyResultId],
  );
  await db.query(
    `insert into compare_responses (share_id, respondent_token, respondent_nickname, answers, primary_result_id) values ($1, gen_random_uuid(), 'Tester B', $2, 'selectively-petty')`,
    [shareRow.rows[0].id, JSON.stringify(pettyAnswers)],
  );
  await db.query(`insert into public.user_entitlements (user_id, entitlement_id, is_active, environment, product_id) values ($1, 'apparently_private', true, 'SANDBOX', 'apparently_private_monthly')`, [testerA]);
  await db.query(`insert into public.tester_access_grants (user_id, note) values ($1, 'QA tester, pre-launch')`, [testerB]);
  await db.query(
    `insert into public.personality_pole_evidence (user_id, source_type, source_id, question_stable_id, choice_stable_id, pole_id, points_earned, max_available, scoring_version) values ($1, 'quiz', 'legacy-source', 'petty:q1', 'petty:q1:a', 'trust_verify:positive', 1, 1, 'v2.0')`,
    [testerA],
  );
  // Admin also has unrelated-to-wipe-decision content it approved (approved_by SET NULL check).
  await db.query(`update daily_questions set approved_by = $1 where id = $2`, [adminId, dailyQuestionId]);

  const quizCatalogCountBefore = await count(`select count(*)::int as n from quizzes`);
  const dailyQuestionsCatalogBefore = await count(`select count(*)::int as n from daily_questions`);
  await db.query(`select set_config('request.user_id', '', false)`);
  check('seed: 3 auth.users rows exist pre-wipe (1 admin, 2 consumers)', await count(`select count(*)::int as n from auth.users`) === 3);
  check('seed: representative consumer data exists across every affected table', (await count(`select count(*)::int as n from quiz_results`)) > 0 && (await count(`select count(*)::int as n from daily_answers`)) > 0 && (await count(`select count(*)::int as n from user_entitlements`)) > 0);

  // ==========================================================================================
  // APPLY THE FULL WIPE
  // ==========================================================================================
  await run(join(root, 'supabase/manual_operations/20261103020000_clean_v1_full_prelaunch_wipe.sql'));
  check('the full wipe migration applies cleanly against representative seeded data', true);

  check('exactly 1 auth.users row remains (the admin)', await count(`select count(*)::int as n from auth.users`) === 1);
  check('the remaining auth.users row IS the admin, not a consumer', (await db.query(`select id from auth.users`)).rows[0].id === adminId);
  check('exactly 1 admin_users row remains, role owner', JSON.stringify((await db.query(`select user_id, role from admin_users`)).rows) === JSON.stringify([{ user_id: adminId, role: 'owner' }]));
  check('0 profiles remain', await count(`select count(*)::int as n from profiles`) === 0);
  check('0 quiz_results remain', await count(`select count(*)::int as n from quiz_results`) === 0);
  check('0 quiz_shares remain (cascaded)', await count(`select count(*)::int as n from quiz_shares`) === 0);
  check('0 compare_responses remain (cascaded)', await count(`select count(*)::int as n from compare_responses`) === 0);
  check('0 daily_answers remain -- the owner explicitly changed this from the superseded reset, which preserved Daily history', await count(`select count(*)::int as n from daily_answers`) === 0);
  check('0 user_trait_evidence remain', await count(`select count(*)::int as n from user_trait_evidence`) === 0);
  check('0 personality_evidence remain', await count(`select count(*)::int as n from personality_evidence`) === 0);
  check('0 personality_pole_evidence remain', await count(`select count(*)::int as n from personality_pole_evidence`) === 0);
  check('0 user_entitlements remain', await count(`select count(*)::int as n from user_entitlements`) === 0);
  check('0 tester_access_grants remain', await count(`select count(*)::int as n from tester_access_grants`) === 0);
  check('quiz catalog completely unchanged', await count(`select count(*)::int as n from quizzes`) === quizCatalogCountBefore);
  check('Daily catalog completely unchanged', await count(`select count(*)::int as n from daily_questions`) === dailyQuestionsCatalogBefore);
  check('the Daily question the admin approved survives, with approved_by preserved (ON DELETE SET NULL would only fire if the admin itself were deleted, which it was not)', (await db.query(`select approved_by from daily_questions where id = $1`, [dailyQuestionId])).rows[0]?.approved_by === adminId);

  // --- A brand-new consumer after the wipe starts with zero history and can complete a quiz. ---
  const freshUserId = '00000000-0000-0000-0000-00000000f123';
  await db.query(`insert into auth.users (id) values ($1)`, [freshUserId]);
  check('a brand-new consumer identity can be created post-wipe with zero FK conflicts', true);
  check('the brand-new consumer starts with zero trait evidence', await count(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [freshUserId]) === 0);
  await asUser(freshUserId);
  const freshCompletion = await db.query(
    `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    ['petty', 'Petty', 'Ridiculous', daysAgo(0), pettyQuestions.length, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', [], null, JSON.stringify(pettyAnswers)],
  );
  check('a fresh post-wipe quiz completion succeeds and is a genuine first completion', freshCompletion.rows[0]?.is_first_completion === true, JSON.stringify(freshCompletion.rows[0]));
  const freshEvidence = await count(`select count(*)::int as n from user_trait_evidence where user_id = $1`, [freshUserId]);
  check('fresh evidence is awarded for the new user', freshEvidence > 0, `n=${freshEvidence}`);

  // --- An old session for a now-deleted consumer cannot write anything (FK rejects it). ---
  await asUser(testerA);
  let oldSessionWriteRejected = false;
  try {
    await db.query(
      `select * from submit_quiz_completion($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      ['petty', 'Petty', 'Ridiculous', daysAgo(0), pettyQuestions.length, 12, 50, 'selectively-petty', 'SELECTIVELY PETTY', [], null, JSON.stringify(pettyAnswers)],
    );
  } catch (e) {
    oldSessionWriteRejected = /foreign key|violates/i.test(String(e));
  }
  check('a still-valid (not-yet-expired) session for a now-deleted consumer is rejected at the database level, not silently accepted', oldSessionWriteRejected);
  await db.query(`select set_config('request.user_id', '', false)`);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
} finally {
  await db.close();
}
