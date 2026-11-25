// V1 release execution (2026-11-07), item 1: the ONE authoritative, version-controlled source
// of which migration files belong to this release, in what order, and with what exact content
// -- supabase/release-manifest.json. Both scripts/verify-migration-allowlist.ts and
// scripts/safe-migration-push.sh read this file; neither hardcodes its own copy of the list any
// more (the exact drift risk an independent inspection found: safe-migration-push.sh's own
// hardcoded EXCLUDED_FILES/count had gone stale the moment a 22nd engineering migration was
// added, because nothing forced the two scripts' separate lists to agree).
//
// A sha256 of each listed file's current content is recorded alongside its name -- this is
// what lets the verify step detect a CHANGED file, not just a missing or extra one (a file
// could keep its name and position but have different content than what was last rehearsed;
// a count or filename-only check, which is all the previous script did, cannot catch that).
//
// Regenerate after any change to which migrations belong in a bucket, their order, or their
// content: npx tsx scripts/generate-migration-manifest.ts
// This intentionally does NOT update `lastRehearsedCommit` -- that field is set by hand, only
// after a real, complete rehearsal has actually passed against the new content (see this
// file's own README-equivalent note in supabase/release-manifest.json).

declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createHash } = require('crypto') as unknown as { createHash: (algo: string) => { update: (d: string) => any; digest: (enc: string) => string } };
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const REPO_ROOT = join(__dirname, '..');

type Bucket = 'engineeringCandidateSet' | 'independentReady' | 'explicitlyGated' | 'dailyContentOperations';

const FILES: Record<Bucket, { dir: string; files: string[] }> = {
  engineeringCandidateSet: {
    dir: 'supabase/migrations',
    files: [
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
      '20261106010000_admin_activate_approved_daily_for_rotation.sql',
    ],
  },
  independentReady: {
    dir: 'supabase/migrations',
    files: [
      '20261022010000_analytics_events.sql',
      '20261022020000_push_notifications_schema.sql',
      '20261022030000_creature_evolution_notification.sql',
      '20261022040000_schedule_push_notification_sends.sql',
    ],
  },
  explicitlyGated: {
    dir: 'supabase/migrations',
    files: ['20261028080000_retire_legacy_pole_evidence_rpc.sql'],
  },
  // The 5 staged Daily content operations (supabase/pending-owner-review/) -- data-ops, not
  // schema migrations, never picked up by `supabase db push`, but equally required to be
  // applied in exactly this tested order, after the engineering candidate set, before launch.
  dailyContentOperations: {
    dir: 'supabase/pending-owner-review',
    files: [
      '20261103000000_daily_missing_approved_questions_seed.sql',
      '20261103000001_daily_six_choice_constraint_and_missing_options.sql',
      '20261104000000_archive_superseded_political_daily.sql',
      '20261105000000_live_daily_reveal_corrections.sql',
      '20261106000000_activate_approved_dailies_for_rotation.sql',
    ],
  },
};

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

const manifestPath = join(REPO_ROOT, 'supabase/release-manifest.json');
const existing = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const buckets: Record<string, { file: string; sha256: string }[]> = {};
for (const [bucket, { dir, files }] of Object.entries(FILES)) {
  buckets[bucket] = files.map((file) => {
    const path = join(REPO_ROOT, dir, file);
    if (!existsSync(path)) {
      throw new Error(`Manifest entry references a file that does not exist: ${dir}/${file} -- refusing to generate a manifest pointing at nothing.`);
    }
    return { file, sha256: sha256(readFileSync(path, 'utf8')) };
  });
}

const manifest = {
  generatedBy: 'scripts/generate-migration-manifest.ts',
  generatedNote:
    'The one authoritative source of which migration/content-ops files belong to this release, in what order, and with what exact content (sha256 of each file at generation time). scripts/verify-migration-allowlist.ts and scripts/safe-migration-push.sh both read this file -- neither hardcodes its own copy. Regenerate with npx tsx scripts/generate-migration-manifest.ts after any change to bucket membership, order, or file content.',
  expectedProjectRef: existing.expectedProjectRef ?? 'rjslgjxlpsjljbrlxfet',
  // Set BY HAND, only after a real, complete rehearsal has passed against this exact content --
  // never updated automatically by this generator. A mismatch between this and the real `git
  // rev-parse HEAD` at push time is a WARNING (informational: "has this exact set been
  // re-rehearsed since this commit"), never a hard failure on its own -- the sha256 hashes
  // above are the hard gate.
  lastRehearsedCommit: existing.lastRehearsedCommit ?? null,
  buckets,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const totalFiles = Object.values(buckets).reduce((sum, b) => sum + b.length, 0);
console.log(`Wrote manifest with ${totalFiles} files across ${Object.keys(buckets).length} buckets to ${manifestPath}`);
if (!existing.lastRehearsedCommit) {
  console.log('NOTE: lastRehearsedCommit is not set. Set it by hand in supabase/release-manifest.json once a real rehearsal has passed against this exact content.');
}
