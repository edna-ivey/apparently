// Build 22 owner audit (2026-10-30/31), items 8 and 5: "Produce a clean, executable staging
// deployment manifest with no unapproved or gated migration. Run migrations in isolated
// staging." / "Do not call the [...] list production-authorized. It is an engineering
// candidate set, not owner approval."
//
// RENAMED from run-full-authorized-set-apply-test.mjs (owner audit, 2026-10-31, item 5): the
// old name and its internal AUTHORIZED_FOR_THIS_DEPLOYMENT constant implied owner/production
// sign-off that was never given. This file (and the matching ENGINEERING_CANDIDATE_SET name
// in scripts/verify-migration-allowlist.ts) now says plainly what it actually is: this
// engagement's own engineering determination of which migrations belong together and in what
// order -- never a statement that the owner has approved pushing them.
//
// This is the closest thing to a staging proof this environment can actually provide: a
// FRESH PGlite instance (a real, isolated Postgres engine, never touched by any other test or
// production data) seeded with a stub mirror of the already-APPLIED production schema this
// engagement has been using throughout, then the REAL, UNMODIFIED file contents of every
// migration in the candidate set below -- in that exact chronological order, with the
// EXPLICITLY GATED migration deliberately left out -- applied one at a time, confirming each
// applies cleanly before moving to the next.
//
// Honest limits, stated plainly rather than glossed over:
//   - This is NOT a literal clone of the real linked production database -- this environment
//     has no credentials to provision or clone a separate real Supabase project. It IS a
//     genuine, from-scratch application of the exact ordered SQL this deployment would run,
//     proving the set composes together without error, in order, as one unit.
//   - The two Daily-content award-SEED migrations below reference real daily_options.id
//     values that only exist in the REAL target database as pre-existing, already-published
//     content. This test manufactures PLACEHOLDER daily_questions/daily_options rows for
//     exactly those option_ids so the full set can apply end-to-end here too -- this is a
//     LOCAL SMOKE TEST of referential integrity (do these migrations apply without a foreign-
//     key error, given SOME row exists at each referenced id), nothing more. It is NOT proof
//     that the real production Daily content at those ids is itself correct, complete, or
//     unchanged -- that can only be verified against the real database.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };

// Exactly verify-migration-allowlist.ts's ENGINEERING_CANDIDATE_SET, in chronological
// filename order -- copied, not re-derived, so this test and the allowlist verifier can never
// silently drift apart without a visible diff in review.
const ENGINEERING_CANDIDATE_SET = [
  '20261021150000_block_private_private_trouble_sharing.sql',
  '20261028010000_personality_trait_catalog.sql',
  '20261028020000_quiz_content_identity.sql',
  '20261028040000_user_quiz_evidence_schema.sql',
  '20261028050000_daily_trait_identity_and_rotation_fix.sql',
  '20261028060000_daily_trait_awards_seed.sql',
  '20261028070000_creature_published_recipes.sql',
  '20261028090000_daily_trait_awards_recurrence_reconciliation.sql',
  '20261030010000_active_evidence_window.sql',
  '20261030020000_legacy_quiz_result_completion_reservation.sql',
  '20261030030000_active_profile_activity_counts.sql',
  '20261030040000_user_trait_evidence_created_at_index.sql',
  '20261031010000_quiz_completion_historical_reservation_and_timestamp_trust.sql',
  '20261101010000_quiz_result_definitions_catalog.sql',
  '20261101020000_quiz_completion_metadata_validation_and_clock_skew.sql',
  '20261101030000_quiz_result_scoring_verification.sql',
  '20261101040000_quiz_access_inheritance_and_content_versioning.sql',
  '20261101050000_configurable_scoring_engine_and_private_quiz_activation.sql',
  '20261102010000_archetype_fallback_result_and_tie_chain.sql',
  '20261102020000_final_scoring_cleanup_and_v1_reset.sql',
  '20261102040000_submit_quiz_result_version_guard.sql',
];

if (JSON.stringify([...ENGINEERING_CANDIDATE_SET].sort()) !== JSON.stringify(ENGINEERING_CANDIDATE_SET)) {
  throw new Error('ENGINEERING_CANDIDATE_SET is not in chronological order -- fix before relying on this test.');
}

const EXPLICITLY_GATED = '20261028080000_retire_legacy_pole_evidence_rpc.sql';

try {
  await db.exec(readFileSync(join(__dirname, '00-stub-foundation.sql'), 'utf8'));
  // 00-stub-foundation.sql's daily_mode enum predates the real profile/room_only split (see
  // 03-stub-daily-mode-profile-room-only.sql's own header) -- item 5's new RPCs need the real
  // values, so this isolated staging stub needs the same correction every other affected test
  // already applies.
  await db.exec(readFileSync(join(__dirname, '03-stub-daily-mode-profile-room-only.sql'), 'utf8'));
  await db.exec(readFileSync(join(__dirname, '02-stub-legacy-quiz-result-deps.sql'), 'utf8'));
  await db.exec(readFileSync(join(root, 'supabase/migrations/20261018020000_age_eligibility_gate.sql'), 'utf8'));
  // quiz_shares: not part of the lightweight stub baseline above (00-stub-foundation.sql has
  // no sharing table), but 20261021150000 (now correctly part of this candidate set -- see
  // deployment-safety review, 2026-11-03, item 1) CREATE OR REPLACEs functions that reference
  // it. Hand-written schema-accurate stub, same convention as the other stub files in this
  // directory, rather than the real historical 20260919010000 migration (whose own ALTER
  // TABLE quiz_results statement collides with this modern stub's already-current shape).
  await db.exec(`
    create table public.quiz_shares (
      id uuid primary key default gen_random_uuid(),
      sharer_user_id uuid not null references auth.users (id) on delete cascade,
      quiz_id text not null,
      result_id text not null,
      quiz_result_id uuid not null references public.quiz_results (id) on delete cascade,
      sharer_display_name text,
      created_at timestamptz not null default now()
    );
  `);
  check('isolated staging-equivalent seeded (stub mirror of already-applied production schema)', true);

  // LOCAL SMOKE TEST ONLY -- see this file's header. These placeholder rows satisfy a foreign
  // key so the apply sequence can be proven end-to-end; they are NOT, and must never be
  // reported as, proof that real production Daily content at these ids is correct.
  const DAILY_CONTENT_SEED_FILES = new Set([
    '20261028060000_daily_trait_awards_seed.sql',
    '20261028090000_daily_trait_awards_recurrence_reconciliation.sql',
  ]);
  const seededOptionIds = new Set();

  for (const file of ENGINEERING_CANDIDATE_SET) {
    const sql = readFileSync(join(root, 'supabase/migrations', file), 'utf8');
    if (DAILY_CONTENT_SEED_FILES.has(file)) {
      const optionIdRe = /\('([0-9a-f-]{36})',\s*\d+,\s*\d+\)/g;
      const referenced = new Set();
      let m;
      while ((m = optionIdRe.exec(sql))) referenced.add(m[1]);
      const toSeed = [...referenced].filter((id) => !seededOptionIds.has(id));
      for (const optionId of toSeed) {
        const questionId = optionId; // 1 placeholder question per placeholder option -- an FK-satisfaction scaffold only, never real content shape.
        await db.query(
          `insert into daily_questions (id, prompt, category, status, room, daily_mode) values ($1, 'placeholder', 'placeholder', 'Live', 'public', 'standard') on conflict do nothing`,
          [questionId],
        );
        await db.query(
          `insert into daily_options (id, question_id, "position", label) values ($1, $2, 1, 'placeholder') on conflict do nothing`,
          [optionId, questionId],
        );
        seededOptionIds.add(optionId);
      }
      check(`LOCAL SMOKE TEST ONLY (not proof of real content correctness): placeholder daily_questions/daily_options scaffolded for ${file} (${toSeed.length} new option_ids, ${referenced.size} referenced total)`, true);
    }
    try {
      await db.exec(sql);
      check(`applied cleanly, in order: ${file}`, true);
    } catch (e) {
      check(`applied cleanly, in order: ${file}`, false, String(e).slice(0, 300));
      throw e;
    }
  }

  const gatedContent = readFileSync(join(root, 'supabase/migrations', EXPLICITLY_GATED), 'utf8');
  check(`the gated migration (${EXPLICITLY_GATED}) was never read into this apply sequence`, !ENGINEERING_CANDIDATE_SET.includes(EXPLICITLY_GATED) && gatedContent.length > 0);

  // Smoke-check: the real objects every item's fix depends on all actually exist after this
  // from-scratch, in-order apply -- not an exhaustive re-run of every other harness's
  // assertions (those already run independently), just confirming the FULL SET, applied
  // together as staging would apply it, leaves every expected surface in place.
  const expectedTables = [
    'personality_dimensions', 'personality_traits', 'quizzes', 'quiz_questions', 'quiz_choices',
    'quiz_choice_trait_awards', 'user_quiz_completions', 'user_quiz_answers', 'user_trait_evidence',
    'user_trait_totals', 'user_trait_active_totals', 'evidence_expiry_job_state',
    'daily_option_trait_awards', 'creature_published_recipes', 'creature_evolution_cycle_markers',
    'quiz_result_definitions', 'quiz_choice_result_weights',
  ];
  for (const table of expectedTables) {
    const exists = (await db.query(`select 1 from information_schema.tables where table_schema='public' and table_name=$1`, [table])).rows.length > 0;
    check(`table exists after full apply: ${table}`, exists);
  }

  const expectedFunctions = [
    'submit_quiz_completion', 'submit_quiz_result', 'get_my_active_daily_answer_count',
    'get_my_active_quiz_completions', 'expire_stale_active_evidence', 'handle_daily_answer_trait_evidence',
    'resolve_archetype_result',
  ];
  for (const fn of expectedFunctions) {
    const exists = (await db.query(`select 1 from pg_proc where proname = $1`, [fn])).rows.length > 0;
    check(`function exists after full apply: ${fn}`, exists);
  }

  const createdAtIndex = (await db.query(
    `select 1 from pg_indexes where tablename='user_trait_evidence' and indexname='user_trait_evidence_created_at_user_id_idx'`,
  )).rows.length > 0;
  check('the new created_at index exists after full apply', createdAtIndex);

  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} catch (e) {
  console.error('HARNESS ERROR (migration sequence failed):', e);
  process.exit(1);
} finally {
  await db.close();
}
