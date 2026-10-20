import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

// Production error observability — Work Package 2. THE ONE place Sentry is ever imported or
// configured. Business/domain code never imports @sentry/react-native directly; it calls
// reportBackendFailure/reportUnexpectedError below, so the provider stays swappable and
// domain code stays untangled from it (see this module's own tests in
// scripts/validate-observability-foundation.ts).
//
// NOT product analytics. No funnels, no engagement tracking, no behavioral events, no session
// replay, no screenshots. This module answers exactly five questions: is the app crashing,
// where, are important Supabase/RPC operations failing, which one, and on which
// app/build/environment — never what a user answered or wrote.
//
// Credential boundary (explicit per Work Package 2's stop conditions): no Sentry DSN, org, or
// project exists in this environment. EXPO_PUBLIC_SENTRY_DSN is read from the environment and
// is REQUIRED to be supplied before this does anything in production — see this file's own
// initErrorReporting() for exactly what happens when it's absent (nothing is fabricated here;
// Sentry.init with no dsn is the SDK's own documented safe-no-op mode). The project/org fields
// for the Expo config plugin (app.json) are deliberately left unset too, for the same reason —
// see the Work Package 2 report for the exact env vars an EAS build needs to supply.

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';
const IOS_BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber ?? 'unknown';
// Matches the SAME env var isRemoteDailyEnabled-adjacent code already treats as "which
// environment" (src/lib/supabase.ts) — no second environment concept invented here.
const ENVIRONMENT = process.env.EXPO_PUBLIC_REMOTE_DAILY_ENABLED === 'true' ? 'production' : 'development';

let sentryReady = false;

// Called once, at module scope in src/app/_layout.tsx (same place/convention as
// SplashScreen.preventAutoHideAsync()) — never inside a component body, never conditionally.
export function initErrorReporting(): void {
  if (!SENTRY_DSN) {
    // No DSN supplied -- this is the expected state until a real Sentry project exists. Every
    // reportX function below degrades to a safe, silent (or dev-console-only) no-op; the app
    // must behave identically to today either way. Never throws, never blocks anything.
    if (__DEV__) {
      console.warn('[observability] EXPO_PUBLIC_SENTRY_DSN is not set -- error reporting is disabled (dev-console logging still works).');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `apparently-you@${APP_VERSION}+${IOS_BUILD_NUMBER}`,
    dist: IOS_BUILD_NUMBER,
    // Privacy guardrails (Work Package 2 §8) -- explicit, not relying on SDK defaults, so this
    // stays true even if a future SDK upgrade changes a default.
    sendDefaultPii: false, // never auto-attach IP address, device contacts, etc.
    attachScreenshot: false, // never attach a screenshot of whatever was on screen at crash time
    attachStacktrace: true, // stack traces are fine -- code locations, not user content
    enableAutoSessionTracking: true, // crash-free-session rate -- a count, not a recording
    // Deliberately NOT added: Sentry.mobileReplayIntegration() (session replay) and any
    // integration that captures request/response BODIES. The default HTTP breadcrumb
    // integration (method + URL + status only) is left on for "which operation was in flight
    // before a crash" context; beforeBreadcrumb below still scrubs it defensively.
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  });

  sentryReady = true;
}

// --- Scrubbing -----------------------------------------------------------------------------
// Defense in depth: reportBackendFailure/reportUnexpectedError below only ever construct
// events from an explicit allow-list of safe fields (see buildSafeContext), so in normal
// operation there is nothing sensitive for these hooks to catch. They exist for the cases
// outside this module's control -- the SDK's own automatic breadcrumbs (network requests,
// console logs, navigation) and any native-layer crash report -- which could otherwise carry
// an Authorization header, a Supabase apikey, or a response body containing real personality
// evidence.

const SENSITIVE_HEADER_KEYS = ['authorization', 'apikey', 'cookie', 'set-cookie', 'x-client-info'];

function redactHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== 'object') return headers;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    redacted[key] = SENSITIVE_HEADER_KEYS.includes(key.toLowerCase()) ? '[redacted]' : value;
  }
  return redacted;
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Automatic HTTP breadcrumbs (category 'xhr'/'fetch' or 'http') are the one thing that could
  // carry Supabase request/response data if a future SDK version starts attaching more than
  // method+url+status -- strip anything beyond that explicitly rather than trust it never will.
  if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch' || breadcrumb.category === 'http') {
    const safeData: Record<string, unknown> = {};
    if (breadcrumb.data) {
      if ('method' in breadcrumb.data) safeData.method = breadcrumb.data.method;
      if ('url' in breadcrumb.data) safeData.url = breadcrumb.data.url;
      if ('status_code' in breadcrumb.data) safeData.status_code = breadcrumb.data.status_code;
    }
    return { ...breadcrumb, data: safeData };
  }
  if (breadcrumb.data?.headers) {
    return { ...breadcrumb, data: { ...breadcrumb.data, headers: redactHeaders(breadcrumb.data.headers) } };
  }
  return breadcrumb;
}

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Strip request/response data wholesale -- this app never needs it, and it's the most
  // likely accidental carrier of auth tokens, Supabase keys, or raw RPC payloads (which can
  // legitimately include quiz answers/personality evidence).
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      event.request.headers = redactHeaders(event.request.headers) as Record<string, string>;
    }
  }
  return event;
}

// --- Operation classification --------------------------------------------------------------
// Every backend-failure report is tagged with ONE of these — lets Sentry's own issue grouping
// and any future alerting split cleanly by subsystem without inventing a second taxonomy.
export type BackendOperation =
  | 'submit_quiz_result'
  | 'get_private_daily'
  | 'submit_private_daily_answer'
  | 'commit_daily_answer'
  | 'sync_revenuecat_entitlement'
  | 'initialize_purchases'
  | 'get_my_personality_evidence'
  | 'get_my_quiz_results'
  | 'submit_compare_response'
  | 'get_compare_result'
  | 'ensure_anonymous_session'
  | 'get_my_personality_pole_evidence'
  | 'submit_quiz_pole_evidence'
  | 'delete_account';

export type BackendFailureContext = {
  operation: BackendOperation;
  // Supabase/Postgres error code when available (e.g. '23505', 'PGRST116') -- structural, not
  // content. Lets Sentry group/triage by failure TYPE, not just by operation name.
  errorCode?: string;
  // Whether the caller already has a recovery path for this (a queued retry, a reconciled
  // "already done" state) -- informational only, never used to suppress reporting (an
  // operation that's "recoverable" can still indicate a real, worth-knowing-about problem if
  // it keeps happening).
  recoverable?: boolean;
  // High-level screen/surface only (e.g. 'quiz-runner', 'you-screen') -- never a full route
  // with params, which could embed a quiz result id/token.
  screen?: string;
};

// The allow-list every reportBackendFailure call is built from — see buildSafeContext. Adding
// a field here is a deliberate decision each time, not an accident.
function buildSafeContext(ctx: BackendFailureContext): Record<string, string | boolean> {
  const safe: Record<string, string | boolean> = { operation: ctx.operation };
  if (ctx.errorCode) safe.errorCode = ctx.errorCode;
  if (ctx.recoverable !== undefined) safe.recoverable = ctx.recoverable;
  if (ctx.screen) safe.screen = ctx.screen;
  return safe;
}

// Reports a backend/RPC operation failure that the app could not recover from cleanly, or that
// can break identity/progression/purchases if it keeps happening. NOT every Supabase call --
// see the call sites that use this (quiz-result-service.ts, daily-service.ts,
// purchases-service.ts, personality-service.ts, compare-service.ts, auth-service.ts) for the
// deliberately small set this was judged worth instrumenting.
//
// `error` is logged locally exactly as every existing console.warn already does (this
// function wraps that pattern, it doesn't replace the message) -- only `errorMessage` (never
// the raw error OBJECT, which for a thrown JS exception can carry request config objects) is
// forwarded to Sentry, and only alongside the allow-listed context above. Supabase/Postgres
// error messages in this schema are structural ("duplicate key value violates unique
// constraint", "Unknown personality dimension: %") -- never raw answer/result text, verified
// against every RPC this module instruments.
export function reportBackendFailure(ctx: BackendFailureContext, error: { message?: string } | unknown): void {
  const message = (error as { message?: string })?.message ?? String(error);
  if (__DEV__) {
    console.warn(`[observability] ${ctx.operation} failed:`, message, ctx.errorCode ? `(${ctx.errorCode})` : '');
  }
  if (!sentryReady) return;
  try {
    Sentry.withScope((scope) => {
      const safeContext = buildSafeContext(ctx);
      scope.setTag('operation', ctx.operation);
      scope.setContext('backend_operation', safeContext);
      scope.setLevel('warning');
      Sentry.captureMessage(`Backend operation failed: ${ctx.operation} -- ${message}`, 'warning');
    });
  } catch {
    // Reporting must never be the reason the app breaks further -- see this module's header.
  }
}

// Reports a genuinely unexpected error -- an uncaught render error (via ErrorBoundary) or any
// other truly-not-a-known-state failure. Distinct from reportBackendFailure: this is for "the
// app did something it was never supposed to do," not "a known backend call failed."
export function reportUnexpectedError(error: unknown, context?: { screen?: string; boundary?: string }): void {
  if (__DEV__) {
    console.error('[observability] Unexpected error:', error, context);
  }
  if (!sentryReady) return;
  try {
    Sentry.withScope((scope) => {
      if (context?.screen) scope.setTag('screen', context.screen);
      if (context?.boundary) scope.setTag('boundary', context.boundary);
      scope.setLevel('error');
      Sentry.captureException(error);
    });
  } catch {
    // Same guarantee as reportBackendFailure above.
  }
}

// Dev-only intentional test error. Gated by __DEV__ at the call site's own route (see
// src/app/dev/observability-lab.tsx, which — like every other screen under src/app/dev/ —
// redirects away entirely when !__DEV__), never reachable as a normal consumer action in any
// production build.
export function triggerTestError(kind: 'reported' | 'thrown'): void {
  if (!__DEV__) return;
  if (kind === 'reported') {
    reportUnexpectedError(new Error('[observability] Intentional test error (reported path) from the dev lab.'), { screen: 'dev-observability-lab' });
    return;
  }
  throw new Error('[observability] Intentional test error (thrown path) from the dev lab -- should be caught by ErrorBoundary.');
}

export const isErrorReportingReady = (): boolean => sentryReady;
