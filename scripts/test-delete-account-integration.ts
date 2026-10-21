// Build 18 WP3 integration smoke test -- NOT a static validator, a REAL end-to-end test
// against the LIVE linked Supabase project. Do not run this until:
//   1. The owner has explicitly approved deploying supabase/functions/delete-account, AND
//   2. It has actually been deployed (npx supabase functions deploy delete-account), AND
//   3. 20261020010000_daily_option_effects_validation.sql and
//      20261021010000_admin_attribution_fk_set_null_on_delete.sql have been applied
//      (not required for this specific test to pass, but keeps the project in the reviewed
//      state before any live smoke test).
//
// Uses ONLY a disposable, throwaway anonymous account created by this script itself --
// never touches a real user. Creates one, writes one real row it owns (a profiles row, via
// the project's own anon key + that account's own session -- RLS-governed, not a privileged
// bypass), calls the deployed delete-account function as that account, then verifies via
// `supabase db query --linked` (project-admin CLI access, not the app's own service role key)
// that BOTH the auth.users row and the profiles row are gone. Never deletes anything it did
// not itself create in this same run.
//
// Run with: npx tsx scripts/test-delete-account-integration.ts
// Requires: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the environment
// (same ones the app itself uses -- see .env.local), and `supabase` CLI linked+logged in for
// the verification queries.

declare const process: { env: Record<string, string | undefined>; exit: (code: number) => void };
declare const require: (id: string) => { execSync: (cmd: string, opts?: Record<string, unknown>) => { toString: () => string } };
const { execSync } = require('child_process');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const runDbQuery = (sql: string): unknown => {
  const escaped = sql.replace(/"/g, '\\"');
  const output = execSync(`npx supabase db query --linked "${escaped}"`, { encoding: 'utf8' });
  const raw = output.toString();
  const start = raw.indexOf('{');
  return JSON.parse(raw.slice(start));
};

async function main() {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('FAIL: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set in the environment -- cannot run this live test.');
    process.exit(1);
    return;
  }

  // 1. Create a real, disposable anonymous account -- the exact same signInAnonymously the
  // app itself uses (ensureAnonymousSession), never a privileged/admin-created user.
  const signUpResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
    body: JSON.stringify({}),
  });
  const signUpData = (await signUpResponse.json()) as { access_token?: string; user?: { id?: string }; error_description?: string };
  assert(signUpResponse.ok && !!signUpData.access_token && !!signUpData.user?.id, `created a disposable anonymous test account (${signUpData.error_description ?? 'ok'})`);
  if (!signUpData.access_token || !signUpData.user?.id) {
    process.exit(1);
    return;
  }
  const testUserId = signUpData.user.id;
  const testAccessToken = signUpData.access_token;
  console.log(`  test user id: ${testUserId}`);

  // 2. Write one real row this account owns, through the normal RLS-governed REST path (the
  // exact same upsert profile-service.ts performs) -- proves the cascade deletes REAL data,
  // not just the auth.users row itself.
  const profileUpsertResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${testAccessToken}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ user_id: testUserId, preferred_name: 'Integration Test Disposable Account' }),
  });
  assert(profileUpsertResponse.ok, `wrote a real profiles row for the disposable test account (status ${profileUpsertResponse.status})`);

  const beforeRows = runDbQuery(`select count(*) as n from public.profiles where user_id = '${testUserId}';`) as { rows: { n: number }[] };
  assert(Number(beforeRows.rows?.[0]?.n) === 1, 'the profiles row genuinely exists before deletion is attempted');

  // 3. Call the deployed delete-account function AS this test account -- never as an admin,
  // never passing any "which user" parameter (there is none; see the function's own source).
  const deleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testAccessToken}`, apikey: ANON_KEY },
  });
  const deleteBody = (await deleteResponse.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  assert(deleteResponse.ok && deleteBody.ok === true, `delete-account returned a real ok:true (status ${deleteResponse.status}, body ${JSON.stringify(deleteBody)})`);

  // 4. Verify BOTH the auth.users row and the cascaded profiles row are actually gone --
  // via project-admin CLI access, independent of anything the function itself claimed.
  const afterAuthRows = runDbQuery(`select count(*) as n from auth.users where id = '${testUserId}';`) as { rows: { n: number }[] };
  assert(Number(afterAuthRows.rows?.[0]?.n) === 0, 'the auth.users row for the test account is genuinely gone after deletion');

  const afterProfileRows = runDbQuery(`select count(*) as n from public.profiles where user_id = '${testUserId}';`) as { rows: { n: number }[] };
  assert(Number(afterProfileRows.rows?.[0]?.n) === 0, 'the cascaded profiles row is genuinely gone too (real cascade, not just the auth row)');

  // 5. Negative test: calling delete-account again with the SAME (now-invalid) token must
  // fail cleanly, never report a second false success.
  const secondDeleteResponse = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testAccessToken}`, apikey: ANON_KEY },
  });
  assert(!secondDeleteResponse.ok, 'calling delete-account again with the now-invalid token fails honestly, never a fabricated second success');

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED.`);
    process.exit(1);
  }
  console.log('\nALL delete-account LIVE integration checks PASSED against a disposable test account only.');
}

void main();
