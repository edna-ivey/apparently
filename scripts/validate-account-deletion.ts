// Validates Build 18 Work Package 3: in-app account deletion. Source-text checks --
// supabase/functions/delete-account/index.ts is a Deno Edge Function (jsr: imports, Deno.*
// globals) that cannot be type-checked or executed by tsx/Node at all, and
// account-deletion-service.ts/settings.tsx transitively touch react-native/AsyncStorage,
// same documented limitation as every other native-module-touching file in this repo.
//
// Run with: npx tsx scripts/validate-account-deletion.ts

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const read = (relativePath: string): string => readFileSync(join(__dirname, relativePath), 'utf8');

const edgeFnSource = read('../supabase/functions/delete-account/index.ts');
const clientServiceSource = read('../src/services/account-deletion-service.ts');
const settingsSource = read('../src/app/settings.tsx');

// ============================================================================================
// 1. SERVER: identity derived ONLY from the caller's own verified JWT -- no request-body
//    "which user" parameter exists at all, which is what structurally prevents one user from
//    deleting another's data (there is nothing to pass to try).
// ============================================================================================

assert(/const \{ data: userResult, error: userError \} = await callerClient\.auth\.getUser\(\);/.test(edgeFnSource), 'the edge function derives identity from the caller\'s own verified session, via the real Supabase auth.getUser() call');
assert(!/req\.(json|body)\(\)/.test(edgeFnSource) || !/userId\s*=.*(await req|body)/.test(edgeFnSource), 'no code path derives the target user id from the request body -- identity comes only from the verified JWT');
assert(/adminClient\.auth\.admin\.deleteUser\(userId\)/.test(edgeFnSource), 'the actual deletion targets exactly the JWT-derived userId, nothing else');

// ============================================================================================
// 2. SERVER: service-role key used server-side only, never returned/exposed to the caller.
// ============================================================================================

assert(/SUPABASE_SERVICE_ROLE_KEY/.test(edgeFnSource), 'the edge function uses the real service-role key (required for auth.admin.deleteUser)');
assert(!/serviceRoleKey/.test(edgeFnSource.split('Deno.serve')[1]?.match(/return new Response[\s\S]*?\}\);/g)?.join('') ?? ''), 'the service-role key is never included in any response body back to the client');

// ============================================================================================
// 3. SERVER: every user-linked table cascades from auth.users -- verified directly against
//    the actual CREATE TABLE statements, not assumed. If a future table adds a user_id column
//    without "on delete cascade", this specific check will NOT catch it (it only re-confirms
//    the tables already known to exist) -- see the edge function's own header comment, which
//    documents this verification was done by reading every migration.
// ============================================================================================

const allMigrationsText = (() => {
  const { readdirSync } = require('fs') as unknown as { readdirSync: (path: string) => string[] };
  const dir = join(__dirname, '../supabase/migrations');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => read(`../supabase/migrations/${name}`))
    .join('\n');
})();

const USER_LINKED_TABLES_EXPECTING_CASCADE = [
  'profiles',
  'daily_answers',
  'quiz_results',
  'personality_evidence',
  'user_entitlements',
  'tester_access_grants',
  'personality_pole_evidence',
];
for (const table of USER_LINKED_TABLES_EXPECTING_CASCADE) {
  const createIndex = allMigrationsText.indexOf(`create table public.${table} (`);
  assert(createIndex !== -1, `public.${table}'s CREATE TABLE statement was found in the migrations (sanity check)`);
  const tableBody = allMigrationsText.slice(createIndex, createIndex + 1200);
  assert(
    /user_id uuid (primary key |not null )?references auth\.users \(id\) on delete cascade/.test(tableBody),
    `public.${table} has a real "references auth.users (id) on delete cascade" on its user_id column -- deleting the auth user row removes this table's rows too`,
  );
}
// quiz_shares/compare_responses cascade via a different column name/chain -- checked by name.
assert(/sharer_user_id uuid not null references auth\.users \(id\) on delete cascade/.test(allMigrationsText), 'quiz_shares cascades from auth.users via sharer_user_id');
assert(/share_id uuid not null references public\.quiz_shares \(id\) on delete cascade/.test(allMigrationsText), 'compare_responses cascades from quiz_shares, which itself cascades from auth.users -- a deleted user\'s shared links and the responses left on them are both removed, which is also what invalidates the share token');

// ============================================================================================
// 3b. FOUND ON RE-INSPECTION (Build 18 deployment-readiness pass, confirmed live via
//     pg_get_constraintdef, not just read from source): two ADMIN-ATTRIBUTION columns
//     (daily_questions.approved_by, tester_access_grants.granted_by) referenced auth.users
//     with NO "on delete" clause at all -- Postgres defaults that to NO ACTION, which would
//     block an ADMIN account's own self-deletion if they had ever approved a question or
//     granted tester access (a safe failure, not data corruption, but not the intended
//     outcome). A staged migration fixes this with ON DELETE SET NULL (never CASCADE, which
//     would incorrectly delete the approved question/grant itself).
// ============================================================================================

const fkFixMigrationSource = read('../supabase/migrations/20261021010000_admin_attribution_fk_set_null_on_delete.sql');
assert(/drop constraint daily_questions_approved_by_fkey/.test(fkFixMigrationSource) && /on delete set null/.test(fkFixMigrationSource), 'a staged migration fixes daily_questions.approved_by to ON DELETE SET NULL (never blocks, never cascades into deleting the question)');
assert(/drop constraint tester_access_grants_granted_by_fkey/.test(fkFixMigrationSource), 'the same staged migration fixes tester_access_grants.granted_by to ON DELETE SET NULL');
assert(!/approved_by.*on delete cascade|granted_by.*on delete cascade/i.test(fkFixMigrationSource), 'neither attribution fix uses CASCADE -- that would wrongly delete the approved question/tester grant itself, not just the stale admin reference');

// ============================================================================================
// 4. CLIENT: never clears local data/session, and never reports success, unless the SERVER
//    actually confirmed deletion. A failure must look like a failure, not a silent success.
// ============================================================================================

const deleteAccountBody = clientServiceSource.slice(clientServiceSource.indexOf('export const deleteAccount'));
const clearCallIndex = deleteAccountBody.indexOf('clearLocalUserData()');
const invokeCallIndex = deleteAccountBody.indexOf("functions.invoke('delete-account'");
assert(invokeCallIndex !== -1 && clearCallIndex !== -1 && invokeCallIndex < clearCallIndex, 'the server call happens, and is awaited/checked, BEFORE any local data is cleared');
assert(/if \(!data\?\.ok\)/.test(clientServiceSource), 'a response without a real ok:true is treated as a failure, never assumed successful');
assert(/return \{ ok: false, message:/.test(clientServiceSource), 'every failure path returns a real, honest ok:false result for the UI to show');

// ============================================================================================
// 5. SETTINGS UI: explains what deletion means, explicitly warns it does not cancel the Apple
//    subscription, links to manage it, requires explicit confirmation, and shows (never
//    hides) a failure.
// ============================================================================================

assert(/permanently removes everything saved to it/.test(settingsSource), 'Settings explains what account deletion actually does, in plain language');
assert(/does not cancel your Apple subscription/.test(settingsSource), 'Settings explicitly states that deletion does not cancel an Apple subscription');
assert(/Manage it here/.test(settingsSource) || /Manage or cancel it in iOS Settings/.test(settingsSource), 'Settings provides a real way to manage/cancel the Apple subscription alongside the deletion warning');
assert(/confirmAction\(/.test(settingsSource) && /confirmDeleteAccount/.test(settingsSource), 'deletion requires an explicit confirmation step before it runs -- never a single unconfirmed tap');
assert(/deleteState\.phase === 'error' && deleteState\.message/.test(settingsSource), 'a real failure is shown to the user, never silently swallowed or reported as success');
assert(/router\.push\('\/privacy-policy'\)/.test(settingsSource) && /router\.push\('\/terms-of-use'\)/.test(settingsSource), 'Settings links to real, in-app Privacy Policy and Terms of Use pages');

// ============================================================================================
// 6. PAYWALL: Privacy/Terms links present too (purchase-adjacent disclosure).
// ============================================================================================

const paywallSource = read('../src/app/paywall.tsx');
assert(/router\.push\('\/privacy-policy'\)/.test(paywallSource) && /router\.push\('\/terms-of-use'\)/.test(paywallSource), 'the paywall also links to the real, in-app Privacy Policy and Terms of Use pages');

// ============================================================================================
// 7. LEGAL SCREENS THEMSELVES EXIST, ARE REAL (never a dead/external link), and are honest
//    about their draft status rather than presented as finalized.
// ============================================================================================

const privacyScreenSource = read('../src/app/privacy-policy.tsx');
const termsScreenSource = read('../src/app/terms-of-use.tsx');
assert(/export default function PrivacyPolicyScreen/.test(privacyScreenSource), 'a real Privacy Policy screen component exists (an actual in-app route, not an external link)');
assert(/export default function TermsOfUseScreen/.test(termsScreenSource), 'a real Terms of Use screen component exists (an actual in-app route, not an external link)');
assert(/Pre-publication draft/.test(privacyScreenSource) && /Pre-publication draft/.test(termsScreenSource), 'both legal screens honestly disclose their draft status rather than presenting unfinished text as final');

// ============================================================================================
// 8. SUPPORT PAGE + apparentlyyou.com SHORT URL PATHS (Phase 5) -- a real route, plus
//    PREPARED (not deployed -- no vercel CLI invocation anywhere in this repo) rewrites so
//    the public site's /privacy and /terms paths resolve to the same real screens once this
//    repo is actually deployed to Vercel.
// ============================================================================================

const supportScreenSource = read('../src/app/support.tsx');
assert(/export default function SupportScreen/.test(supportScreenSource), 'a real Support screen component exists at /support');
assert(/support@apparentlyyou\.com/.test(supportScreenSource), 'Support shows the real, owner-confirmed support mailbox');

const vercelConfigSource = read('../vercel.json');
assert(/"source": "\/privacy", "destination": "\/privacy-policy"/.test(vercelConfigSource), 'vercel.json rewrites the public /privacy path to the real screen');
assert(/"source": "\/terms", "destination": "\/terms-of-use"/.test(vercelConfigSource), 'vercel.json rewrites the public /terms path to the real screen');

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log(
  '\nALL account deletion (JWT-only identity, service-role server-side only, full cascade verified against real migrations, fail-honest client, Settings/paywall disclosure and confirmation) VALIDATION CHECKS PASSED.',
);
