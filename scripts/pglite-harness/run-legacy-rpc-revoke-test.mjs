import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
try {
  await db.exec(readFileSync(join(__dirname, '00-stub-foundation.sql'), 'utf8'));
  // Simulate the current LIVE state: function exists, granted to anon+authenticated (matching the real confirmed privileges).
  await db.exec(`
    create or replace function public.submit_quiz_pole_evidence(p_quiz_id text, p_source_id uuid, p_answers jsonb)
    returns void language plpgsql security definer as $$ begin end; $$;
    grant execute on function public.submit_quiz_pole_evidence(text, uuid, jsonb) to anon, authenticated;
  `);
  const before = (await db.query(`select grantee from information_schema.routine_privileges where routine_name = 'submit_quiz_pole_evidence' and grantee in ('anon','authenticated') order by grantee`)).rows;
  check('pre-migration: both anon and authenticated hold EXECUTE (matches live confirmed state)', before.length === 2, JSON.stringify(before));

  await db.exec(readFileSync(join(root, 'supabase/migrations/20261028080000_retire_legacy_pole_evidence_rpc.sql'), 'utf8'));

  const after = (await db.query(`select grantee from information_schema.routine_privileges where routine_name = 'submit_quiz_pole_evidence' and grantee in ('anon','authenticated','service_role','postgres')`)).rows;
  check('post-migration: neither anon nor authenticated hold EXECUTE', !after.some(r => r.grantee === 'anon' || r.grantee === 'authenticated'), JSON.stringify(after));

  let anonBlocked = false;
  try {
    await db.query(`set role anon`);
    await db.query(`select submit_quiz_pole_evidence('petty', gen_random_uuid(), '{}'::jsonb)`);
  } catch (e) { anonBlocked = true; } finally { await db.query(`reset role`); }
  check('anon role is actually blocked from calling the function post-migration', anonBlocked);

  console.log(`\nPASS: ${pass} FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} finally { await db.close(); }
