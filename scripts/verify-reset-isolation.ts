// Deployment-safety review (2026-11-03), item 1: "Move the destructive reset out of the
// normal auto-deployment migration path... Demonstrate with an actual dry-run that the
// proposed schema deployment cannot accidentally execute the reset or unrelated migrations."
//
// CORRECTED (resumed session, 2026-11-03): the original version of this comment claimed no
// `supabase` CLI was reachable here (`which supabase` does fail -- there is no global install)
// -- but `npx supabase` DOES work, and this environment's project IS linked to a real
// production project (`apparently-you`, ref rjslgjxlpsjljbrlxfet). A genuine, read-only
// `npx supabase migration list --linked` / `npx supabase db push --linked --dry-run` was run
// against it and confirms the same conclusion this script reaches by filesystem inspection: the
// reset file is absent from the remote comparison entirely. That real check is the authoritative
// proof going forward -- see docs/BUILD_22_V1_RESET_INVENTORY.md and
// docs/BUILD_22_STAGING_DEPLOYMENT_MANIFEST.md (§1). This script remains useful as a fast,
// offline, zero-network sanity check that reproduces the EXACT rule the Supabase CLI itself
// uses to decide what a push would touch -- every `*.sql` file directly inside
// supabase/migrations/, nothing from any sibling directory. If the reset (or anything else
// that should never auto-apply) were ever moved back into supabase/migrations/, this check
// fails immediately, without needing network/CLI access at all.
//
// Run with: npx tsx scripts/verify-reset-isolation.ts
declare const require: (id: string) => { readdirSync: (path: string) => string[]; existsSync: (path: string) => boolean; statSync: (path: string) => { isDirectory: () => boolean } };
declare const __dirname: string;
declare const process: { exit: (code: number) => void };
const { readdirSync, existsSync, statSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const root = join(__dirname, '..');
const MIGRATIONS_DIR = join(root, 'supabase', 'migrations');
const MANUAL_OPS_DIR = join(root, 'supabase', 'manual_operations');

let failures = 0;
let passes = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    passes += 1;
    console.log(`OK: ${message}`);
  }
};

// The exact pattern `supabase db push` uses to recognize a migration file: a 14-digit
// timestamp prefix, an underscore, a name, and `.sql` -- directly inside supabase/migrations/,
// never recursing into subdirectories.
const MIGRATION_FILENAME_PATTERN = /^\d{14}_[a-zA-Z0-9_]+\.sql$/;

const migrationDirFiles = readdirSync(MIGRATIONS_DIR).filter((f: string) => !statSync(join(MIGRATIONS_DIR, f)).isDirectory());
const wouldBePushed = migrationDirFiles.filter((f: string) => MIGRATION_FILENAME_PATTERN.test(f));

assert(wouldBePushed.length === migrationDirFiles.length, `every file directly inside supabase/migrations/ matches the real migration filename pattern (no stray non-migration file sitting where a push would find it) -- ${wouldBePushed.length}/${migrationDirFiles.length}`);

const RESET_FILENAME = '20261102030000_clean_v1_prelaunch_data_reset.sql';
assert(!wouldBePushed.includes(RESET_FILENAME), `THE FIX: ${RESET_FILENAME} is NOT among the files a real \`supabase db push\` would find in supabase/migrations/ -- structurally absent, not merely excluded by a bookkeeping list`);

assert(existsSync(join(MANUAL_OPS_DIR, RESET_FILENAME)), `${RESET_FILENAME} exists instead under supabase/manual_operations/ (outside the CLI's scan path entirely)`);

assert(existsSync(join(MANUAL_OPS_DIR, 'README.md')), 'supabase/manual_operations/README.md exists, documenting why this directory is excluded and how to apply a file from it manually');

// The mature-content sharing-block migration must be a real, chronologically-ordered member
// of supabase/migrations/ (i.e. a real push WOULD include it) -- deployment-safety review
// item 1's second finding: it was previously bucketed as "independent, do not bundle" despite
// being a hard prerequisite for this release. It must now be an ordinary migration file,
// picked up by the same push as everything else, never a manual_operations file (it is a
// normal, idempotent CREATE OR REPLACE, not a destructive one-time data operation).
const SHARING_BLOCK_FILENAME = '20261021150000_block_private_private_trouble_sharing.sql';
assert(wouldBePushed.includes(SHARING_BLOCK_FILENAME), `${SHARING_BLOCK_FILENAME} (mature-content sharing block) IS among the files a real \`supabase db push\` would find -- confirmed included in the real push path, not sitting in an "independent/do not bundle" bucket while actually being a release prerequisite`);

// The version-guard migration (item 2) must also be a real, ordinary migration file.
const VERSION_GUARD_FILENAME = '20261102040000_submit_quiz_result_version_guard.sql';
assert(wouldBePushed.includes(VERSION_GUARD_FILENAME), `${VERSION_GUARD_FILENAME} (old-client version guard) IS among the files a real \`supabase db push\` would find`);

console.log(`\n--- "Dry-run" result: exactly what a real \`supabase db push\` would apply from supabase/migrations/, in chronological order ---`);
for (const f of [...wouldBePushed].sort()) {
  console.log(`  would push: ${f}`);
}
console.log(`\n--- Confirmed NEVER reachable by that same push ---`);
console.log(`  manual_operations only: ${RESET_FILENAME}`);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED, ${passes} passed.`);
  process.exit(1);
}
console.log(`\nALL ${passes} reset-isolation checks passed.`);
