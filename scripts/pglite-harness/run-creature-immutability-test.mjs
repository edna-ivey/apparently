import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const db = new PGlite();
const run = async (p) => db.exec(readFileSync(p, 'utf8'));
let pass = 0, fail = 0;
const check = (label, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ' -- ' + detail : ''}`); ok ? pass++ : fail++; };
try {
  await run(join(__dirname, '00-stub-foundation.sql'));
  await run(join(root, 'supabase/migrations/20261028010000_personality_trait_catalog.sql'));
  await run(join(root, 'supabase/migrations/20261028070000_creature_published_recipes.sql'));
  const u1 = (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
  await db.query(`insert into creature_published_recipes (user_id, cycle_week, slot, trait_id) values ($1, '2026-W44', 'eyes', 5)`, [u1]);
  // Attempt as superuser (table owner) -- the case a mere GRANT omission cannot stop.
  let updateRejected = false;
  try { await db.query(`update creature_published_recipes set trait_id = 6 where user_id = $1`, [u1]); } catch (e) { updateRejected = true; }
  check('UPDATE rejected even as table owner/superuser (true DB-level enforcement, not a grant)', updateRejected);
  let deleteRejected = false;
  try { await db.query(`delete from creature_published_recipes where user_id = $1`, [u1]); } catch (e) { deleteRejected = true; }
  check('DELETE rejected even as table owner/superuser', deleteRejected);
  const stillThere = (await db.query(`select count(*)::int as n from creature_published_recipes where user_id = $1`, [u1])).rows[0].n;
  check('row still present, unchanged, after both rejected attempts', stillThere === 1);
  console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
  if (fail > 0) process.exit(1);
} finally { await db.close(); }
