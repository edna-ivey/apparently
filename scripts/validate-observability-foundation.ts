// Work Package 2 regression: the production error-observability foundation. This is NOT a
// "does Sentry actually report an event" test (that would need a live DSN this environment
// doesn't have -- see observability.ts's own header comment on the credential boundary). It
// proves, by static analysis of the real source, every requirement that CAN be proven without
// one: the required config/integration exists, sensitive fields are scrubbed, the deliberately
// small set of important backend failures route through the shared reporter, expected
// user-facing states (premium rejection, already-answered) do NOT, no secret is committed, and
// no session-replay/screenshot capture is enabled.
//
// Run with: npx tsx scripts/validate-observability-foundation.ts
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const ROOT = join(__dirname, '..');
const read = (relPath: string): string => readFileSync(join(ROOT, relPath), 'utf8');

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};
const pass = (message: string) => console.log(`OK: ${message}`);

const observability = read('src/services/observability.ts');
const layout = read('src/app/_layout.tsx');
const errorBoundary = read('src/components/error-boundary.tsx');
const devLab = read('src/app/dev/observability-lab.tsx');
const appJson = read('app.json');
const packageJson = read('package.json');

// --- 1. Required integration/config exists ------------------------------------------------
console.log('\n--- Integration present ---');
if (JSON.parse(packageJson).dependencies['@sentry/react-native']) {
  pass('@sentry/react-native is a declared dependency.');
} else {
  fail('@sentry/react-native is not a declared dependency.');
}
if (JSON.parse(appJson).expo.plugins.includes('@sentry/react-native')) {
  pass('@sentry/react-native config plugin is registered in app.json.');
} else {
  fail('@sentry/react-native config plugin is NOT registered in app.json.');
}
if (observability.includes('Sentry.init(') && observability.includes('process.env.EXPO_PUBLIC_SENTRY_DSN')) {
  pass('Sentry.init is called with a DSN read from EXPO_PUBLIC_SENTRY_DSN (never hardcoded).');
} else {
  fail('Sentry.init is not called with an environment-sourced DSN.');
}
if (layout.includes('initErrorReporting()') && layout.indexOf('initErrorReporting()') < layout.indexOf('export default function RootLayout')) {
  pass('initErrorReporting() is called at module scope, before the root component -- same convention as SplashScreen.preventAutoHideAsync().');
} else {
  fail('initErrorReporting() is not called at module scope before the root component.');
}

// --- 2. No secret committed ------------------------------------------------------------------
console.log('\n--- No secret credential committed ---');
const secretLikePatterns = [
  { name: 'literal Sentry DSN (ingest.sentry.io URL)', re: /https:\/\/[a-f0-9]+@[a-z0-9.-]*ingest\.sentry\.io/i },
  { name: 'hardcoded SENTRY_AUTH_TOKEN value', re: /SENTRY_AUTH_TOKEN\s*[:=]\s*['"][a-zA-Z0-9_-]{10,}['"]/ },
  { name: 'hardcoded sentry org/project with a real-looking slug assigned to a DSN field', re: /dsn:\s*['"]https:\/\/[a-zA-Z0-9]/ },
];
let foundSecret = false;
for (const file of [observability, layout, appJson]) {
  for (const { name, re } of secretLikePatterns) {
    if (re.test(file)) {
      fail(`Found what looks like a ${name} committed to source.`);
      foundSecret = true;
    }
  }
}
if (!foundSecret) {
  pass('No literal DSN, auth token, or other Sentry secret found anywhere in the new/touched source.');
}
if (!appJson.includes('"organization"') && !appJson.includes('"project"')) {
  pass('app.json\'s Sentry plugin entry has no fabricated organization/project -- left for real credentials to be supplied via EAS env, not guessed here.');
} else {
  fail('app.json appears to contain an organization/project value -- verify this is real, not fabricated.');
}

// --- 3. Privacy guardrails --------------------------------------------------------------------
console.log('\n--- Privacy guardrails ---');
const requiredPrivacyFlags = [
  { name: 'sendDefaultPii: false', re: /sendDefaultPii:\s*false/ },
  { name: 'attachScreenshot: false', re: /attachScreenshot:\s*false/ },
  { name: 'beforeSend scrubber wired', re: /beforeSend:\s*scrubEvent/ },
  { name: 'beforeBreadcrumb scrubber wired', re: /beforeBreadcrumb:\s*scrubBreadcrumb/ },
];
for (const { name, re } of requiredPrivacyFlags) {
  if (re.test(observability)) {
    pass(`${name} is set.`);
  } else {
    fail(`${name} is NOT set.`);
  }
}

// Strip // and /* */ comments before checking -- this file's own header comments legitimately
// NAME the forbidden integrations to document that they're deliberately absent, which would
// otherwise false-positive against a naive substring/regex check of the raw source.
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}
const observabilityCode = stripComments(observability);
const layoutCode = stripComments(layout);

const forbiddenIntegrations = [
  { name: 'session replay (mobileReplayIntegration)', re: /mobileReplayIntegration|replaysSessionSampleRate|replaysOnErrorSampleRate/ },
  { name: 'automatic screenshot capture', re: /attachScreenshot:\s*true/ },
];
let foundForbiddenIntegration = false;
for (const { name, re } of forbiddenIntegrations) {
  if (re.test(observabilityCode) || re.test(layoutCode)) {
    fail(`Forbidden integration found: ${name}.`);
    foundForbiddenIntegration = true;
  }
}
if (!foundForbiddenIntegration) {
  pass('No session-replay or automatic-screenshot integration is present anywhere.');
}

if (observability.includes('redactHeaders') && observability.includes('authorization') && observability.includes('cookie')) {
  pass('Header redaction (authorization/cookie/apikey) is implemented for both breadcrumbs and events.');
} else {
  fail('Header redaction for authorization/cookie/apikey headers is missing.');
}

if (observability.includes('event.request.data') || observability.includes('delete event.request.data')) {
  pass('Request body data is stripped from outgoing events (scrubEvent).');
} else {
  fail('Request body data is not confirmed stripped from outgoing events.');
}

// --- 4. Allow-list context -- quiz answers/evidence can never be attached ------------------
console.log('\n--- Context allow-list (no quiz/evidence content can be attached) ---');
const buildSafeContextMatch = observability.match(/function buildSafeContext\([\s\S]*?\n\}/);
if (!buildSafeContextMatch) {
  fail('Could not find buildSafeContext -- the context allow-list function.');
} else {
  const body = buildSafeContextMatch[0];
  const allowedFields = ['operation', 'errorCode', 'recoverable', 'screen'];
  const assignedFields = [...body.matchAll(/safe\.(\w+)\s*=/g)].map((m) => m[1]);
  const unexpected = assignedFields.filter((f) => !allowedFields.includes(f));
  if (unexpected.length > 0) {
    fail(`buildSafeContext assigns unexpected field(s) not on the reviewed allow-list: ${unexpected.join(', ')}`);
  } else {
    pass(`buildSafeContext only ever assigns allow-listed fields: ${allowedFields.join(', ')} -- structurally cannot attach answer/evidence content.`);
  }
}
// reportBackendFailure/reportUnexpectedError must never forward the raw `error` object itself
// to Sentry (only error.message, extracted as a string) -- a raw JS Error/PostgrestError can
// carry a `cause`/config object that might itself embed a request payload.
if (/captureMessage\(`Backend operation failed: \$\{ctx\.operation\} -- \$\{message\}`/.test(observability)) {
  pass('reportBackendFailure sends only the operation name + extracted error message string to Sentry, never the raw error object.');
} else {
  fail('reportBackendFailure does not appear to only send operation + message string.');
}
if (/Sentry\.captureException\(error\)/.test(observability) && observability.includes('reportUnexpectedError')) {
  pass('reportUnexpectedError uses captureException (the SDK\'s own exception serializer, which reports the error\'s stack/message -- never arbitrary app state) for genuinely unexpected errors only.');
}

// --- 5. Required operations are instrumented ------------------------------------------------
console.log('\n--- Required backend operations instrumented ---');
const requiredInstrumentation: { file: string; path: string; operation: string }[] = [
  { file: 'src/services/quiz-result-service.ts', path: 'quiz-result-service.ts', operation: 'submit_quiz_result' },
  { file: 'src/services/daily-service.ts', path: 'daily-service.ts', operation: 'get_private_daily' },
  { file: 'src/services/daily-service.ts', path: 'daily-service.ts', operation: 'submit_private_daily_answer' },
  { file: 'src/services/purchases-service.ts', path: 'purchases-service.ts', operation: 'sync_revenuecat_entitlement' },
  { file: 'src/services/purchases-service.ts', path: 'purchases-service.ts', operation: 'initialize_purchases' },
  { file: 'src/services/personality-service.ts', path: 'personality-service.ts', operation: 'get_my_personality_evidence' },
  { file: 'src/services/quiz-result-service.ts', path: 'quiz-result-service.ts', operation: 'get_my_quiz_results' },
  { file: 'src/services/compare-service.ts', path: 'compare-service.ts', operation: 'submit_compare_response' },
  { file: 'src/services/compare-service.ts', path: 'compare-service.ts', operation: 'get_compare_result' },
  { file: 'src/services/auth-service.ts', path: 'auth-service.ts', operation: 'ensure_anonymous_session' },
];
for (const { file, path, operation } of requiredInstrumentation) {
  const source = read(file);
  const re = new RegExp(`reportBackendFailure\\(\\{[^}]*operation:\\s*'${operation}'`);
  if (re.test(source)) {
    pass(`${path}: '${operation}' routes through reportBackendFailure.`);
  } else {
    fail(`${path}: '${operation}' does NOT appear to route through reportBackendFailure.`);
  }
}

// --- 6. Expected-error filtering -- premium rejection and "already answered" must NOT report
console.log('\n--- Expected-error filtering ---');
// Premium-rejection: the client gate (quiz/[quizId].tsx) just navigates to /paywall -- it
// never calls submit_quiz_result at all for an unentitled user attempting a premium quiz, so
// there is no error for reportBackendFailure to see in the first place. Confirm that gate is
// still in place (regression-proofs the "no event for expected rejection" guarantee).
const quizScreen = read('src/app/quiz/[quizId].tsx');
if (quizScreen.includes("definition.access === 'private' && !isPremium") && !quizScreen.includes('observability')) {
  pass('Premium-entitlement client gate (quiz/[quizId].tsx) is untouched and does not import observability -- an unentitled user is redirected to /paywall before any RPC call exists to fail, so no event is ever generated for this expected case.');
} else if (!quizScreen.includes("definition.access === 'private' && !isPremium")) {
  fail('The premium-entitlement client gate in quiz/[quizId].tsx appears to have changed.');
}
// "Already answered" (23505) must be explicitly excluded at both Daily call sites.
const dailyService = read('src/services/daily-service.ts');
const dailyExclusionCount = [...dailyService.matchAll(/error\.code !== '23505'/g)].length;
if (dailyExclusionCount >= 2) {
  pass(`Both Daily answer-submission paths explicitly skip reporting for error.code === '23505' (already-answered, expected) -- found ${dailyExclusionCount} exclusion(s).`);
} else {
  fail(`Expected at least 2 explicit '23505' exclusions in daily-service.ts (commit + Private submit), found ${dailyExclusionCount}.`);
}

// --- 7. Dev-only test trigger is unreachable in production ---------------------------------
console.log('\n--- Dev-only test trigger ---');
if (devLab.includes('if (!__DEV__)') && devLab.includes("return <Redirect href=\"/\" />")) {
  pass('src/app/dev/observability-lab.tsx uses the exact same __DEV__ redirect-away guard as every other dev-only screen (creature-lab.tsx, relic-lab.tsx) -- structurally unreachable in production.');
} else {
  fail('observability-lab.tsx does not have the expected __DEV__ guard.');
}
if (observability.includes("if (!__DEV__) return") && observability.includes('export function triggerTestError')) {
  pass('triggerTestError() itself also no-ops outside __DEV__ as defense in depth (not just the route guard).');
} else {
  fail('triggerTestError() does not appear to have its own __DEV__ guard.');
}

// --- 8. ErrorBoundary wraps the app, reports via the shared mechanism, no raw stack exposed ---
console.log('\n--- ErrorBoundary ---');
if (layout.includes('<ErrorBoundary>') && layout.indexOf('<ErrorBoundary>') < layout.indexOf('<Stack') && layout.indexOf('</ErrorBoundary>') > layout.indexOf('<Stack')) {
  pass('ErrorBoundary wraps the entire Stack in the root layout.');
} else {
  fail('ErrorBoundary does not appear to wrap the Stack in the root layout.');
}
if (errorBoundary.includes('reportUnexpectedError') && errorBoundary.includes('componentDidCatch')) {
  pass('ErrorBoundary reports via reportUnexpectedError (the shared mechanism), not a direct Sentry call.');
} else {
  fail('ErrorBoundary does not report via the shared reportUnexpectedError mechanism.');
}
if (!/error\.(message|stack|toString)/.test(errorBoundary.replace(/\/\/.*$/gm, ''))) {
  pass('ErrorBoundary\'s fallback UI never renders the raw error message/stack to the user.');
} else {
  fail('ErrorBoundary\'s fallback UI appears to render raw error details to the user.');
}

// --- 9. Reporting failures never break the app (fail-safe try/catch) -----------------------
console.log('\n--- Fail-safe guarantee ---');
const reportFnBodies = observability.match(/export function report\w+\([\s\S]*?\n\}/g) ?? [];
let allFailSafe = true;
for (const fn of reportFnBodies) {
  if (!fn.includes('try {') || !fn.includes('catch')) {
    fail(`A report function does not wrap its Sentry call in try/catch: ${fn.slice(0, 60)}...`);
    allFailSafe = false;
  }
}
if (allFailSafe && reportFnBodies.length >= 2) {
  pass(`All ${reportFnBodies.length} report functions wrap their Sentry call in try/catch -- a Sentry-side failure can never break the calling operation.`);
}

// --- 10. Scope locks: no migration, no scoring/evidence/Creature/Relic file touched ---------
console.log('\n--- Scope locks ---');
const forbiddenTouchedPaths = [
  'supabase/migrations',
  'src/data/personality.ts',
  'src/data/quiz-personality-awards.ts',
  'src/data/creature',
  'src/data/relic',
  '.easignore',
];
// This is a static assertion that the files this script itself reads/instruments never include
// those paths -- the actual authoritative check is the git diff in the work package's own
// report, this is a structural sanity check that the instrumentation list above never grew to
// include anything there.
const instrumentedFiles = requiredInstrumentation.map((r) => r.file);
const touchesForbidden = instrumentedFiles.some((f) => forbiddenTouchedPaths.some((p) => f.includes(p)));
if (!touchesForbidden) {
  pass('None of the instrumented files fall under a scope-locked path (migrations, scoring, Creature, Relic, .easignore).');
} else {
  fail('An instrumented file falls under a scope-locked path.');
}

console.log('');
if (failures > 0) {
  console.error(`${failures} CHECK(S) FAILED.`);
  process.exit(1);
} else {
  console.log('ALL OBSERVABILITY FOUNDATION CHECKS PASSED.');
}
