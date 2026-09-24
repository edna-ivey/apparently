// Standalone validation for "shared links must open the app first" (Apple Universal Links).
// Run with:
//
//   npx tsx scripts/validate-universal-links.ts
//
// Covers everything verifiable WITHOUT a live network call against the production domain
// (app config, the AASA file(s) actually committed to this repo, source-text checks on the
// share screen). The production-endpoint checks (200, no redirect, correct Content-Type,
// valid JSON) are run separately, live, AFTER this pass's commits are pushed and Vercel has
// redeployed -- see the engineering sprint report for that live result. This script can still
// be re-run any time as a static sanity check on its own.

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

const REAL_APPLE_TEAM_ID = '8JC3XDUJ5A';
const BUNDLE_ID = 'com.supergreatventures.apparently';
const APP_ID = `${REAL_APPLE_TEAM_ID}.${BUNDLE_ID}`;

// ============================================================================================
// 1. APP CONFIG — associatedDomains entitlement
// ============================================================================================

const appJson = JSON.parse(readFileSync(join(__dirname, '../app.json'), 'utf8'));
const associatedDomains: string[] = appJson.expo?.ios?.associatedDomains ?? [];
assert(associatedDomains.includes('applinks:apparentlyyou.com'), `app.json declares applinks:apparentlyyou.com (got ${JSON.stringify(associatedDomains)})`);
assert(appJson.expo?.ios?.bundleIdentifier === BUNDLE_ID, `app.json's iOS bundle identifier is exactly ${BUNDLE_ID}`);
// APP_URL must stay the canonical https://apparentlyyou.com -- this fix must never change it.
const appConstantsSource = readFileSync(join(__dirname, '../src/constants/app.ts'), 'utf8');
assert(/APP_URL\s*=\s*['"]https:\/\/apparentlyyou\.com['"]/.test(appConstantsSource), 'APP_URL remains exactly https://apparentlyyou.com (unchanged canonical share domain)');

// ============================================================================================
// 2. AASA FILE(S) — real Team ID + bundle id, /s/* allowed, valid JSON, both locations
// ============================================================================================

for (const relativePath of ['../public/.well-known/apple-app-site-association', '../public/apple-app-site-association']) {
  const raw = readFileSync(join(__dirname, relativePath), 'utf8');
  let parsed: unknown;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  assert(parseError === null, `${relativePath}: is valid JSON (${parseError ?? 'ok'})`);
  if (parsed && typeof parsed === 'object') {
    const details = (parsed as { applinks?: { details?: { appID?: string; paths?: string[] }[] } }).applinks?.details ?? [];
    assert(details.length > 0, `${relativePath}: applinks.details has at least one entry`);
    const entry = details[0];
    assert(entry?.appID === APP_ID, `${relativePath}: appID is exactly "${APP_ID}" (real Team ID + bundle id, got "${entry?.appID}")`);
    assert(Array.isArray(entry?.paths) && entry.paths.includes('/s/*'), `${relativePath}: paths includes "/s/*" (got ${JSON.stringify(entry?.paths)})`);
  }
  assert(!relativePath.endsWith('.json'), `${relativePath}: filename has no .json extension (Apple requirement)`);
}

// ============================================================================================
// 3. VERCEL CONFIG — correct Content-Type headers for both AASA paths, existing /s/:token
//    rewrite untouched
// ============================================================================================

const vercelConfig = JSON.parse(readFileSync(join(__dirname, '../vercel.json'), 'utf8'));
const headerRules: { source: string; headers: { key: string; value: string }[] }[] = vercelConfig.headers ?? [];
for (const path of ['/.well-known/apple-app-site-association', '/apple-app-site-association']) {
  const rule = headerRules.find((r) => r.source === path);
  assert(!!rule, `vercel.json has a headers rule for ${path}`);
  const contentType = rule?.headers.find((h) => h.key === 'Content-Type')?.value;
  assert(contentType === 'application/json', `vercel.json sets Content-Type: application/json for ${path} (got "${contentType}")`);
}
const rewrites: { source: string; destination: string }[] = vercelConfig.rewrites ?? [];
assert(
  rewrites.some((r) => r.source === '/s/:token' && r.destination === '/s/%5Btoken%5D'),
  'the existing /s/:token -> Expo Router dynamic share page rewrite is unchanged',
);

// ============================================================================================
// 4. SHARE SCREEN — Open in Apparently You fallback exists, is user-initiated (not automatic),
//    and share links stay HTTPS (never a custom-scheme-only link sent through Share.share)
// ============================================================================================

const shareScreenSource = readFileSync(join(__dirname, '../src/app/s/[token].tsx'), 'utf8');
assert(/isIOSWebVisitor/.test(shareScreenSource), 's/[token].tsx has an iOS-web-visitor detector for the Universal Link fallback banner');
assert(/apparently:\/\/s\/\$\{token\}/.test(shareScreenSource), 'the fallback banner opens the custom-scheme apparently://s/<token> URL, preserving the token');
assert(/mode=compare/.test(shareScreenSource) && /showCompare \? '\?mode=compare'/.test(shareScreenSource), 'the fallback banner preserves mode=compare when applicable');
// "Manual button tap only" -- confirm this lives inside a Pressable's onPress, never a bare
// top-level useEffect that would auto-trigger Linking.openURL on page load.
const autoOpenPattern = /useEffect\(\(\) => \{[^}]*Linking\.openURL/s;
assert(!autoOpenPattern.test(shareScreenSource), 'Linking.openURL is never called from an automatic useEffect (no auto-redirect loop/trap)');

const quizResultServiceSource = readFileSync(join(__dirname, '../src/app/quiz/[quizId].tsx'), 'utf8');
assert(/Share\.share\(\{\s*\n?\s*message:\s*`I got/.test(quizResultServiceSource) || /shareUrl = `\$\{APP_URL\}/.test(quizResultServiceSource), 'the native Share.share message is built from APP_URL (a real https:// URL), never a bare custom-scheme link');
assert(!/Share\.share\(\{[^}]*apparently:\/\//s.test(quizResultServiceSource), 'no custom-scheme-only link is ever passed to Share.share (always the real https://apparentlyyou.com/s/<token> URL)');

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Universal Link (static) VALIDATION CHECKS PASSED.');
console.log('Live production AASA endpoint checks are run separately after deploy -- see the engineering sprint report.');
