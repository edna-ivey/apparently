// Security regression for Build 13 Work Package 1: submit_quiz_result must server-authorize
// the 7 premium Apparently Private quizzes before writing anything, using the SAME
// has_active_entitlement/has_tester_access primitives already proven in production for Private
// Daily (supabase/migrations/20260924010000_secure_entitlement_authorization.sql) -- never a
// client-supplied boolean.
//
// IMPORTANT, read before trusting this file's PASS lines: this environment has no local
// Postgres/Docker (confirmed: `docker --version` fails, no supabase/config.toml exists), so
// NONE of this is proven by actually executing the SQL against a database. Every check below is
// PROVEN BY STATIC CONTRACT -- structural/textual analysis of the migration SQL and a live,
// independent re-derivation of the canonical quiz-id lists from src/data/quizzes/*.ts (never
// copied from the migration itself, so this can't rubber-stamp a wrong id list the same way the
// old dynamic-layout QA script's hand-copied strings could never have caught a content bug).
// See the work package's final report for which of the 10 required cases this does and does not
// cover, and why.
//
// Run with: npx tsx scripts/validate-premium-quiz-entitlement-gate.ts
declare const __dirname: string;
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const REPO_ROOT = join(__dirname, '..');
const QUIZZES_DIR = join(REPO_ROOT, 'src', 'data', 'quizzes');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase', 'migrations');
const NEW_MIGRATION = '20261006010000_secure_premium_quiz_submission.sql';
const PRIOR_MIGRATION = '20261004120000_widen_personality_effect_range_for_ranked_private_award.sql';
const QUIZ_SCREEN_PATH = join(REPO_ROOT, 'src', 'app', 'quiz', '[quizId].tsx');

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};
const pass = (message: string) => console.log(`OK [STATIC CONTRACT]: ${message}`);
const info = (message: string) => console.log(`INFO: ${message}`);

// --- Step 1: independently derive the canonical quiz-id/access inventory straight from the
// production quiz source files -- never from the migration under test, never hand-copied. ---
type QuizRecord = { file: string; id: string; access: string };
function deriveQuizInventory(): QuizRecord[] {
  const files = readdirSync(QUIZZES_DIR).filter((f: string) => f.endsWith('.ts') && f !== 'types.ts' && f !== 'index.ts' && f !== 'scoring.ts' && f !== 'results.ts' && f !== 'friend-adaptations.ts' && f !== 'private-catalog.ts' && f !== 'pending-quiz-submissions.ts');
  const records: QuizRecord[] = [];
  for (const file of files) {
    const source = readFileSync(join(QUIZZES_DIR, file), 'utf8');
    const idMatch = source.match(/^\s*id:\s*'([^']+)'/m);
    const accessMatch = source.match(/^\s*access:\s*'([^']+)'/m);
    if (idMatch && accessMatch) {
      records.push({ file, id: idMatch[1], access: accessMatch[1] });
    }
  }
  return records;
}

const inventory = deriveQuizInventory();
const premiumIds = inventory.filter((q) => q.access === 'private').map((q) => q.id).sort();
const nonPremiumIds = inventory.filter((q) => q.access !== 'private').map((q) => q.id).sort();

info(`Derived ${inventory.length} real quiz definitions from src/data/quizzes/*.ts.`);
info(`Premium (access:'private'): ${premiumIds.join(', ')}`);
info(`Non-premium (free + private-preview): ${nonPremiumIds.length} ids.`);

if (premiumIds.length !== 7) {
  fail(`Expected exactly 7 premium quiz ids derived from source, found ${premiumIds.length}: ${premiumIds.join(', ')}`);
} else {
  pass('Exactly 7 quizzes have access:\'private\' in the real production source.');
}

// --- Step 2: read the new migration and confirm the gate list matches that derived set exactly
// (no premium id missing, no non-premium id wrongly included). ---
const newMigrationSource = readFileSync(join(MIGRATIONS_DIR, NEW_MIGRATION), 'utf8');

const gateBlockMatch = newMigrationSource.match(/if p_quiz_id in \(([\s\S]*?)\)\s*then/);
if (!gateBlockMatch) {
  fail('Could not find the "if p_quiz_id in (...)" gate block in the new migration.');
} else {
  const gateIds = [...gateBlockMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  const missing = premiumIds.filter((id) => !gateIds.includes(id));
  const extra = gateIds.filter((id) => !premiumIds.includes(id));
  if (missing.length > 0) {
    fail(`Gate list is missing premium quiz id(s): ${missing.join(', ')}`);
  } else {
    pass('Every premium quiz id derived from source is present in the SQL gate list.');
  }
  if (extra.length > 0) {
    fail(`Gate list wrongly includes non-premium id(s): ${extra.join(', ')}`);
  } else {
    pass('The SQL gate list contains ONLY premium quiz ids -- no free or private-preview id is gated.');
  }
  // Explicit, named confirmation for the quizzes the task called out by name.
  for (const mustStayFree of ['be-so-serious', 'keep-you-around', 'secretly-love']) {
    if (gateIds.includes(mustStayFree)) {
      fail(`${mustStayFree} (private-preview) was found inside the premium gate list -- this would wrongly block an approved free preview quiz.`);
    } else {
      pass(`${mustStayFree} is confirmed absent from the gate list -- remains playable without premium entitlement.`);
    }
  }
}

// --- Step 3: confirm NO client-supplied boolean parameter exists anywhere in the new function
// signature or body -- the only authorization inputs may be the two internal, zero-client-grant
// functions already proven for Daily. ---
const forbiddenClientParams = ['p_premium', 'p_is_premium', 'p_tester_access', 'p_has_entitlement', 'p_entitled', 'premium boolean', 'tester_access boolean'];
let foundForbidden = false;
for (const term of forbiddenClientParams) {
  if (newMigrationSource.includes(term)) {
    fail(`Forbidden client-supplied authorization term "${term}" found in the new migration -- this would reintroduce the exact vulnerability class already fixed for Daily.`);
    foundForbidden = true;
  }
}
if (!foundForbidden) {
  pass('No client-supplied premium/tester/entitlement boolean parameter exists anywhere in the new migration.');
}

if (newMigrationSource.includes('public.has_active_entitlement(v_user_id, \'apparently_private\')') && newMigrationSource.includes('public.has_tester_access(v_user_id)')) {
  pass('The gate calls has_active_entitlement(\'apparently_private\') and has_tester_access -- the exact same internal, zero-client-grant primitives already live in production for Private Daily (not a new/second entitlement source).');
} else {
  fail('The gate does not call both has_active_entitlement(\'apparently_private\', ...) and has_tester_access(...) as expected.');
}

// --- Step 4: confirm the function SIGNATURE is byte-for-byte identical to the prior migration
// (proves no new parameter -- client or otherwise -- was added to the public RPC surface). ---
function extractSignature(source: string): string {
  const match = source.match(/create or replace function public\.submit_quiz_result\(([\s\S]*?)\)\nreturns/);
  if (!match) throw new Error('Could not extract function signature.');
  return match[1].trim();
}
const priorMigrationSource = readFileSync(join(MIGRATIONS_DIR, PRIOR_MIGRATION), 'utf8');
const priorSignature = extractSignature(priorMigrationSource);
const newSignature = extractSignature(newMigrationSource);
if (priorSignature === newSignature) {
  pass('submit_quiz_result\'s parameter signature is byte-for-byte unchanged from the prior migration -- no new parameter of any kind was added to the public RPC.');
} else {
  fail('submit_quiz_result\'s parameter signature CHANGED -- this needs manual review.');
  console.error('  PRIOR:', JSON.stringify(priorSignature));
  console.error('  NEW:  ', JSON.stringify(newSignature));
}

// --- Step 5: confirm the gate runs BEFORE the advisory lock and BEFORE the quiz_results
// insert -- i.e. authorization happens before any write is possible. ---
function bodyOf(source: string): string {
  const match = source.match(/create or replace function public\.submit_quiz_result[\s\S]*?\nas \$\$([\s\S]*?)\n\$\$;/);
  if (!match) throw new Error('Could not extract function body.');
  return match[1];
}
const newBody = bodyOf(newMigrationSource);
const gateIndex = newBody.indexOf("if p_quiz_id in (");
const lockIndex = newBody.indexOf('pg_advisory_xact_lock');
const insertIndex = newBody.indexOf('insert into public.quiz_results');
if (gateIndex === -1 || lockIndex === -1 || insertIndex === -1) {
  fail('Could not locate the gate, advisory lock, or insert statement to verify ordering.');
} else if (gateIndex < lockIndex && gateIndex < insertIndex) {
  pass(`Authorization gate (char ${gateIndex}) runs before both the advisory lock (char ${lockIndex}) and the quiz_results insert (char ${insertIndex}) -- an unauthorized caller is rejected before any write is possible.`);
} else {
  fail('Authorization gate does NOT run before the advisory lock / insert -- a write could happen before rejection.');
}

// --- Step 6: diff the full function body against the prior migration's -- the ONLY difference
// permitted is the inserted gate block itself. Proves every other system (advisory lock,
// first-completion gating, retry/idempotency, the 6-cap/32-dimension/±3-range validation, the
// ranked Private evidence insert) is untouched, not just "looks untouched." ---
const priorBody = bodyOf(priorMigrationSource);
const newBodyWithoutGate = newBody.replace(
  /\n  -- Server-authoritative premium gate[\s\S]*?\n  end if;\n/,
  '\n',
);
// Collapse runs of blank lines before comparing -- the regex strip above can leave a doubled
// blank line where the gate block's own leading/trailing newline meets the surrounding file's;
// that's an artifact of string-splicing the comparison, not a meaningful content difference, so
// it must not mask (or be mistaken for) a REAL line-level change elsewhere in the function.
const normalize = (s: string) => s.trim().replace(/\n{2,}/g, '\n\n');
if (normalize(newBodyWithoutGate) === normalize(priorBody)) {
  pass('With the new gate block removed, the function body is IDENTICAL to the prior migration\'s -- every other system (advisory lock, first-completion/retry handling, profile_effects validation, ranked evidence insert) is provably untouched, not just assumed untouched.');
} else {
  fail('Function body differs from the prior migration in more than just the new gate block -- unexpected change detected, needs manual review.');
}

// --- Step 7: confirm this migration does not redefine has_active_entitlement/has_tester_access/
// user_entitlements/tester_access_grants (reuses, never re-creates the trust primitives) and
// never references the client-side tester-display build flag. ---
const mustNotRedefine = [
  'create or replace function public.has_active_entitlement',
  'create or replace function public.has_tester_access',
  'create table public.user_entitlements',
  'create table public.tester_access_grants',
];
let redefinedSomething = false;
for (const term of mustNotRedefine) {
  if (newMigrationSource.toLowerCase().includes(term.toLowerCase())) {
    fail(`New migration redefines "${term}" -- it should only CALL the existing primitives, never redefine them.`);
    redefinedSomething = true;
  }
}
if (!redefinedSomething) {
  pass('The new migration reuses has_active_entitlement/has_tester_access/user_entitlements/tester_access_grants exactly as they already exist -- defines no second entitlement source.');
}
if (newMigrationSource.includes('EXPO_PUBLIC_PRIVATE_DAILY_TESTER_ACCESS') || newMigrationSource.includes('isPrivateDailyTesterAccessEnabled')) {
  fail('New migration references the client-side TestFlight display-only flag -- this must never become a DB authorization source.');
} else {
  pass('The client-side TestFlight tester-display flag is not referenced anywhere in the new migration (structurally impossible for SQL to read a client env var, confirmed absent anyway).');
}

// --- Step 8: confirm the client gate file (quiz/[quizId].tsx) was not modified by this work
// package -- the fix is server-side only, per the task's explicit scope. ---
const quizScreenSource = readFileSync(QUIZ_SCREEN_PATH, 'utf8');
if (quizScreenSource.includes("definition.access === 'private' && !isPremium")) {
  pass('src/app/quiz/[quizId].tsx\'s client-side UX gate is unchanged -- useEffectivePremium() still drives navigation/paywall redirect only, never the security boundary.');
} else {
  fail('The expected client-side UX gate pattern was not found in quiz/[quizId].tsx -- has it changed?');
}

// =========================================================================================
// Required test cases -- mapped explicitly to what's proven here vs. what would require a
// live database this environment does not have.
// =========================================================================================
console.log('\n--- Required case coverage ---');
console.log('CASE 1 (free user, free quiz, allowed):              PROVEN BY STATIC CONTRACT -- free quiz ids are absent from the gate list (Step 2), so the function\'s pre-existing unconditional behavior is preserved.');
console.log('CASE 2 (free user, keep-you-around, allowed):        PROVEN BY STATIC CONTRACT -- confirmed absent from the gate list by name (Step 2).');
console.log('CASE 3 (free user, be-so-serious, allowed):          PROVEN BY STATIC CONTRACT -- confirmed absent from the gate list by name (Step 2).');
console.log('CASE 4 (free user, all 7 premium quizzes, rejected): PROVEN BY STATIC CONTRACT -- all 7 ids are in the gate list (Step 2), the gate raises BEFORE any write (Step 5), and the function body is otherwise provably unchanged so a rejection is a clean exception with zero prior writes (Step 6). NOT executed against a live DB.');
console.log('CASE 5 (premium user, premium quiz, allowed):        PROVEN BY STATIC CONTRACT ONLY -- the gate\'s boolean condition is a direct reuse of the exact has_active_entitlement(\'apparently_private\') call already live and working for Private Daily (Step 3). NOT executed against a live DB with a real user_entitlements row.');
console.log('CASE 6 (tester, premium quiz, allowed):              PROVEN BY STATIC CONTRACT ONLY -- same reasoning, via has_tester_access reuse. NOT executed.');
console.log('CASE 7 (client claims premium with no server record): PROVEN BY STATIC CONTRACT -- impossible by construction: the function signature (Step 4) has no parameter through which a client could assert this at all.');
console.log('CASE 8 (expired/inactive entitlement, rejected):      PROVEN BY STATIC CONTRACT ONLY -- has_active_entitlement\'s own definition (20260924010000) already checks is_active=true AND (expires_at is null or expires_at > now()); this migration does not alter that function. NOT executed against a live DB with an expired row.');
console.log('CASE 9 (same-version premium retake, no dup evidence): PROVEN BY STATIC CONTRACT -- the first-completion (v_is_first) and retry ((user_id,quiz_id,completed_at) match) logic is confirmed byte-for-byte unchanged (Step 6), so Build 13\'s already-validated retake behavior is structurally preserved.');
console.log('CASE 10 (concurrent/retried authorized submission):   PROVEN BY STATIC CONTRACT -- the advisory lock and unique_violation retry handling are confirmed byte-for-byte unchanged (Step 6) and confirmed to run AFTER authorization (Step 5), so existing idempotency guarantees are structurally preserved.');
console.log('\nCases 4-6, 8 in particular are NOT proven by execution in this environment (no local Postgres/Docker available). They rest on (a) the gate being structurally correct and ordered before any write, and (b) reusing, unmodified, the exact has_active_entitlement/has_tester_access functions already running in production for Private Daily. A live-database pass of these specific cases is recommended before relying on this as the final word.');

console.log('');
if (failures > 0) {
  console.error(`${failures} CHECK(S) FAILED.`);
  process.exit(1);
} else {
  console.log('ALL PREMIUM QUIZ ENTITLEMENT GATE STATIC-CONTRACT CHECKS PASSED.');
}
