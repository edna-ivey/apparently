// Build 22 migration safety gate. Runs the real, read-only `supabase db push --linked
// --dry-run` (never applies anything) and categorizes every migration it would push into
// exactly one of three explicit buckets -- it never says "the pending set is safe to push,"
// only ever "here is what it contains and which bucket each one falls into."
//
// CORRECTED (owner audit, 2026-10-30): the first version of this script required a trailing
// JSON summary line that this CLI version (2.122.0) happens to print but, confirmed directly
// by the owner's own run, an installed CLI elsewhere does not -- it only prints the
// human-readable `-- supabase/migrations/...` bulleted list under "Would push these
// migrations:". That bulleted list is the one thing both CLI output shapes share, so it is
// now the PRIMARY, required parse target; the JSON line (when present) is used only as an
// optional cross-check, never as the only path to a result.
//
// RENAMED (owner audit, 2026-10-31, item 5): what this file previously called
// AUTHORIZED_FOR_THIS_DEPLOYMENT is renamed to ENGINEERING_CANDIDATE_SET throughout. That list
// is this engagement's own determination of "which migrations belong together and in what
// order, as engineering work" -- it is explicitly NOT owner/production approval to push
// anything. Every message this script prints says "candidate," never "authorized," so running
// this script can never be mistaken for a sign-off.
//
// Run with: npx tsx scripts/verify-migration-allowlist.ts

declare const process: { exit: (code: number) => void };
declare const require: (id: string) => { execSync: (cmd: string, opts?: Record<string, unknown>) => string };
const { execSync } = require('child_process');

// Independent, unrelated, already-ready migrations -- not part of Build 22, not blocked by
// anything in it, but still require their own explicit sign-off before an apply.
//
// CORRECTED (deployment-safety review, 2026-11-03), item 1: 20261021150000 (the mature-
// content sharing block) was WRONGLY listed here as "independent, unrelated" -- it is in fact
// a hard prerequisite for this specific release (both quizzes it protects,
// private-private-trouble and private-private-proof, are fully playable in the candidate set
// below). Moved into ENGINEERING_CANDIDATE_SET itself, at the front in its correct
// chronological position, so this script's own categorization can never again say "do not
// bundle" about something the release actually depends on.
const INDEPENDENT_READY = [
  '20261022010000_analytics_events.sql',
  '20261022020000_push_notifications_schema.sql',
  '20261022030000_creature_evolution_notification.sql',
  '20261022040000_schedule_push_notification_sends.sql',
];

// Build 22's ENGINEERING CANDIDATE SET, in chronological filename order (never reordered --
// Supabase's own migration history is keyed on this order, and `supabase db push` applies
// strictly by filename). This is NOT owner/production approval -- it is this engagement's own
// determination of which migrations belong together and in what sequence, ready for the
// owner's separate, explicit review and sign-off before any push.
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
  throw new Error('ENGINEERING_CANDIDATE_SET is not in chronological (lexicographic filename) order -- Supabase migration history and `supabase db push` both depend on this exact order; fix the list before relying on this script.');
}

// Build 22, EXPLICITLY BLOCKED/GATED -- present locally, must NOT be applied in this
// deployment under any circumstance this script can pass. Revoking the legacy RPC before the
// client cutover is verified on real devices would silently stop V2 evidence writes for any
// client still on the old build (see item 3's compatibility mechanism, still open).
// Build 22 final cleanup round (2026-11-02): 20261102030000 is a ONE-TIME DATA reset (not a
// schema change) requiring its own separate, explicit owner authorization -- see its own file
// header and docs/BUILD_22_V1_RESET_INVENTORY.md. It must never be bundled into a normal
// schema-migration push alongside the engineering candidate set above.
const EXPLICITLY_GATED = [
  '20261028080000_retire_legacy_pole_evidence_rpc.sql',
];
// CORRECTED (deployment-safety review, 2026-11-03), item 1: the clean V1 prelaunch data reset
// (previously listed here as 20261102030000_clean_v1_prelaunch_data_reset.sql) is no longer
// an entry in this file's bookkeeping at all -- it was MOVED out of supabase/migrations/ into
// supabase/manual_operations/, which `supabase db push` never scans. An informational
// "gated" list is advisory only (a human or a future script edit could still get it wrong);
// physical absence from the directory the CLI actually reads is a mechanical guarantee that
// doesn't depend on this file staying correct. See scripts/verify-reset-isolation.ts for the
// proof and supabase/manual_operations/README.md for the rationale.

const ALL_KNOWN = new Set([...INDEPENDENT_READY, ...ENGINEERING_CANDIDATE_SET, ...EXPLICITLY_GATED]);

console.log('Running read-only `supabase db push --linked --dry-run` (applies nothing)...');
// CORRECTED (owner audit, 2026-10-30, found while fixing the reported failure): the CLI
// prints its human-readable "Would push these migrations:" bulleted list to STDERR and only
// the final machine-readable summary to STDOUT -- a plain execSync() call captures stdout
// ONLY, so the bulleted list was never actually in `output` here either, regardless of CLI
// version; this environment's run only ever "worked" because its CLI happens to also put a
// JSON line on stdout. `2>&1` merges both streams so the bulleted list (present on every CLI
// version this engagement has seen) is reliably captured no matter which stream either piece
// of output lands on.
const output = execSync('npx supabase db push --linked --dry-run 2>&1', { encoding: 'utf8' });

// PRIMARY parse target: the bulleted human-readable list under "Would push these migrations:"
// -- present in every CLI version this engagement has seen, unlike the trailing JSON line.
const bulletMatches = [...output.matchAll(/•\s+(\S+\.sql)/g)].map((m) => m[1]);
if (bulletMatches.length === 0 && !/up to date/i.test(output)) {
  console.error('FAIL: could not find the bulleted migration list in `supabase db push --dry-run` output, and the output does not say the project is up to date either -- CLI output format may have changed again. Raw output:');
  console.error(output);
  process.exit(1);
}
const wouldPush = new Set(bulletMatches);

// Optional cross-check only -- never required. If this CLI version also prints the JSON
// summary line, confirm it agrees with the bulleted list; if it's absent, skip silently.
const jsonLine = output.trim().split('\n').find((line: string) => line.trim().startsWith('{"'));
if (jsonLine) {
  try {
    const parsed = JSON.parse(jsonLine) as { migrations: string[] };
    const jsonSet = new Set(parsed.migrations);
    const disagreement = [...wouldPush].filter((m) => !jsonSet.has(m)).concat([...jsonSet].filter((m) => !wouldPush.has(m)));
    if (disagreement.length > 0) {
      console.error(`FAIL: the bulleted list and the JSON summary line disagree on: ${JSON.stringify(disagreement)} -- treating this as a parse problem, not picking one arbitrarily.`);
      process.exit(1);
    }
    console.log('(optional cross-check: JSON summary line present and agrees with the bulleted list)');
  } catch {
    console.log('(optional cross-check: a line starting with \'{"\' was present but did not parse as the expected JSON shape -- ignored, the bulleted list is authoritative)');
  }
} else {
  console.log('(optional cross-check: this CLI version does not print the JSON summary line -- expected on some installs, not required)');
}

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const unknown = [...wouldPush].filter((m) => !ALL_KNOWN.has(m));
assert(unknown.length === 0, `no UNKNOWN migration would be pushed (found: ${JSON.stringify(unknown)}) -- anything pending must be one of this file's three explicit buckets`);

const gatedButPending = EXPLICITLY_GATED.filter((m) => wouldPush.has(m));
const candidatePending = ENGINEERING_CANDIDATE_SET.filter((m) => wouldPush.has(m));
const independentPending = INDEPENDENT_READY.filter((m) => wouldPush.has(m));

console.log('\n=== Categorized result -- this is a report, never a statement of owner/production approval ===');
console.log(`ENGINEERING CANDIDATE SET for this body of work -- NOT owner-authorized, requires explicit separate sign-off before any push (${candidatePending.length}/${ENGINEERING_CANDIDATE_SET.length} pending): ${JSON.stringify(candidatePending)}`);
console.log(`EXPLICITLY GATED, must NOT be applied with this deployment (${gatedButPending.length} pending): ${JSON.stringify(gatedButPending)}`);
console.log(`INDEPENDENT, unrelated, awaiting their own separate sign-off (${independentPending.length} pending): ${JSON.stringify(independentPending)}`);

if (gatedButPending.length !== EXPLICITLY_GATED.length) {
  console.log(`NOTE: ${EXPLICITLY_GATED.length - gatedButPending.length} gated migration(s) are not currently pending (already applied, or removed) -- re-verify this file's EXPLICITLY_GATED list is still accurate.`);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED. Do not push anything.`);
  process.exit(1);
}

console.log(
  '\nALL checks PASSED: every currently-pending migration is accounted for in one of the three explicit buckets above. ' +
  'This is an ENGINEERING CANDIDATE SET, not owner or production approval -- it does not authorize pushing anything. ' +
  'If and when the owner separately approves a push, apply ONLY the candidate list above, in that exact chronological ' +
  'order, never an unrestricted `supabase db push`. The GATED and INDEPENDENT migrations require their own separate, ' +
  'later owner review before they are ever applied.',
);
