// Build 22 totals-rebuild, as its OWN step. Rebuilds BOTH user_trait_totals (lifetime,
// permanent) AND user_trait_active_totals (Bible v1.4 §43's 12-month window) in the SAME
// transaction, from the SAME user_trait_evidence read.
//
// CORRECTED (owner audit, 2026-10-30, CRITICAL): the previous version of this script only
// rebuilt user_trait_totals. The You page reads user_trait_active_totals for ranking
// (personality-v2-service.ts's getMyTraitTotals) -- a historical backfill that never
// populates that table leaves every backfilled user with an EMPTY active-ranking view even
// though their lifetime totals are correct, which would make Your Signature/Creature
// eligibility look silently empty for every backfilled account until their next live answer
// happens to upsert a row. Fixed: one statement rebuilds user_trait_totals from ALL evidence
// (unfiltered), a second rebuilds user_trait_active_totals from evidence with
// created_at >= now() - interval '12 months' only -- using the SAME authoritative created_at
// values the backfill scripts already set to the real original observation time (never "now"
// for a historical row), so a 2-year-old backfilled answer is correctly treated as expired
// from the active window even though it is being inserted/recomputed today.
//
// Run with: npx tsx scripts/rebuild-user-trait-totals.ts <output-sql-path>

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void };
declare const process: { argv: string[]; exit: (code: number) => void };
const { writeFileSync } = require('fs');

const [, , outputSqlPath] = process.argv;
if (!outputSqlPath) {
  console.error('Usage: npx tsx scripts/rebuild-user-trait-totals.ts <output-sql-path>');
  process.exit(1);
}

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
-- PREREQUISITE: 20261030010000_active_evidence_window.sql (user_trait_active_totals) must be
-- applied before this is run.
--
-- Final, order-independent rebuild of BOTH user_trait_totals (lifetime) and
-- user_trait_active_totals (12-month active window) -- run this AFTER both the quiz backfill
-- and the Daily backfill SQL have been applied, in either order. Rebuilds totals for EVERY
-- user with any user_trait_evidence row, from ALL of it -- quiz_answer and daily_answer rows
-- summed together.
--
-- Idempotent AND lost-update-safe: a single INSERT ... ON CONFLICT DO UPDATE per row (never
-- DELETE-then-INSERT, which leaves a window where a row briefly does not exist), wrapped in
-- SERIALIZABLE isolation so Postgres DETECTS (and aborts, rather than silently losing) a
-- concurrent live write that commits between this statement's internal snapshot and its own
-- update landing on the same row -- the caller retries on a serialization_failure, safe to
-- retry since this whole rebuild is already proven idempotent.
-- ============================================================================================

begin transaction isolation level serializable;

-- 1. LIFETIME -- unfiltered, every evidence row ever recorded, regardless of age.
insert into public.user_trait_totals (user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at)
select
  user_id, trait_id,
  sum(points_earned), sum(max_available),
  count(*) filter (where points_earned > 0),
  count(*),
  now()
from public.user_trait_evidence
group by user_id, trait_id
on conflict (user_id, trait_id) do update set
  lifetime_earned = excluded.lifetime_earned,
  max_available_total = excluded.max_available_total,
  distinct_questions_with_earned = excluded.distinct_questions_with_earned,
  distinct_questions_presented = excluded.distinct_questions_presented,
  updated_at = excluded.updated_at;

delete from public.user_trait_totals
where not exists (select 1 from public.user_trait_evidence e where e.user_id = user_trait_totals.user_id and e.trait_id = user_trait_totals.trait_id);

-- 2. ACTIVE -- filtered to the trailing 12 months from each row's own real created_at (a
-- historical backfilled row's TRUE original timestamp, never the backfill's run time -- see
-- backfill-quiz-pole-evidence.ts/backfill-daily-pole-evidence.ts's own timestamp-trust
-- requirement). A user whose evidence is entirely older than 12 months correctly gets ZERO
-- rows here, not stale/incorrect ones.
insert into public.user_trait_active_totals (user_id, trait_id, lifetime_earned, max_available_total, distinct_questions_with_earned, distinct_questions_presented, updated_at)
select
  user_id, trait_id,
  sum(points_earned), sum(max_available),
  count(*) filter (where points_earned > 0),
  count(*),
  now()
from public.user_trait_evidence
where created_at >= now() - interval '12 months'
group by user_id, trait_id
on conflict (user_id, trait_id) do update set
  lifetime_earned = excluded.lifetime_earned,
  max_available_total = excluded.max_available_total,
  distinct_questions_with_earned = excluded.distinct_questions_with_earned,
  distinct_questions_presented = excluded.distinct_questions_presented,
  updated_at = excluded.updated_at;

delete from public.user_trait_active_totals
where not exists (
  select 1 from public.user_trait_evidence e
  where e.user_id = user_trait_active_totals.user_id and e.trait_id = user_trait_active_totals.trait_id
    and e.created_at >= now() - interval '12 months'
);

-- 3. Seed the expiry job's watermark so expire_stale_active_evidence's FIRST live run does
-- not redundantly recompute what this backfill already correctly built -- without this, the
-- job's "no watermark yet" first-run branch would re-scan every user with evidence older
-- than 12 months, which is correct but wasteful immediately after a backfill already did it.
insert into public.evidence_expiry_job_state (job_name, last_cutoff_processed)
values ('expire_stale_active_evidence', now() - interval '12 months')
on conflict (job_name) do update set last_cutoff_processed = greatest(evidence_expiry_job_state.last_cutoff_processed, excluded.last_cutoff_processed);

commit;
`;

writeFileSync(outputSqlPath, sql);
console.log(`Wrote order-independent lifetime + active totals rebuild SQL to ${outputSqlPath}`);
