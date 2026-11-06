// One-off visual QA for the new src/app/relic-read.tsx screen's RESOLVED state (3/3 Relic
// slots). Temporarily patches the screen to skip the real network load and instead run the
// REAL resolveRelicIdentity()/synthesizeRelicRead() functions against a literal, already-
// approved RelicSlotAssignment (Self-secure/Challenging/Tactful -- Michelle's real combination)
// so the actual production content/renderer can be screenshotted without touching any real
// backend data. Captures the original file content and writes it back directly afterward --
// never `git checkout` (see scripts/qa-quiz-dynamic-layout.mjs's header comment for why).
//
// Prerequisite: playwright must be resolvable (npm install --no-save playwright; npx playwright
// install chromium), same as scripts/qa-quiz-dynamic-layout.mjs.
//
// Run with: node scripts/qa-relic-read-visual.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SCREEN_PATH = join(ROOT, 'src', 'app', 'relic-read.tsx');
const EXPORT_DIR = join(ROOT, 'dist-qa-relic-read');
const PORT = 4178;

let originalScreenSource = null;

function applyBypass() {
  const source = readFileSync(SCREEN_PATH, 'utf8');
  if (source.includes('__DEV_RELIC_READ_QA_BYPASS__')) {
    throw new Error('Bypass marker already present -- refusing to double-patch.');
  }
  originalScreenSource = source;

  const marker = 'export default function RelicReadScreen() {';
  if (!source.includes(marker)) {
    throw new Error('Could not find RelicReadScreen function signature -- screen structure changed.');
  }

  const patched = source.replace(
    marker,
    [
      'const __DEV_RELIC_READ_QA_BYPASS__ = true;',
      marker,
    ].join('\n'),
  ).replace(
    'const load = useCallback(async () => {',
    [
      'const load = useCallback(async () => {',
      '    if (__DEV_RELIC_READ_QA_BYPASS__) {',
      "      const { selectRelicSlots } = await import('@/data/private-signals');",
      "      const fakeSignal = (label) => ({ dimension: 'self_secure_reassurance', label, strengthLabel: '', signatureStrength: 0.2, evidenceCount: 2 });",
      '      const slots = selectRelicSlots([fakeSignal("Self-secure"), fakeSignal("Challenging"), fakeSignal("Tactful")]);',
      '      setProfile({ dimensions: [], __qaBypassSlots: slots });',
      '      return;',
      '    }',
    ].join('\n'),
  );

  if (patched === source) {
    throw new Error('Patch had no effect -- load() structure changed.');
  }
  writeFileSync(SCREEN_PATH, patched, 'utf8');
}

function revertBypass() {
  if (originalScreenSource !== null) {
    writeFileSync(SCREEN_PATH, originalScreenSource, 'utf8');
    console.log('Reverted relic-read.tsx to its original content.');
  }
}

process.on('exit', revertBypass);
process.on('SIGINT', () => process.exit(1));

try {
  applyBypass();

  // The bypass above stuffs __qaBypassSlots into the profile object, but readState's real
  // useMemo calls selectStrongestPrivateSignals(profile) -- which expects profile.dimensions,
  // not a pre-built slot assignment. Patch readState too, so the bypass path is used end to end.
  const afterFirstPatch = readFileSync(SCREEN_PATH, 'utf8');
  const readStateMarker = 'const signals = selectStrongestPrivateSignals(profile);\n    const slots = selectRelicSlots(signals);';
  if (!afterFirstPatch.includes(readStateMarker)) {
    throw new Error('Could not find readState signal-selection lines -- screen structure changed.');
  }
  const fullyPatched = afterFirstPatch.replace(
    readStateMarker,
    [
      '// @ts-expect-error -- QA bypass only, reverted after this script runs.',
      'const slots = profile.__qaBypassSlots ?? selectRelicSlots(selectStrongestPrivateSignals(profile));',
    ].join('\n    '),
  );
  if (fullyPatched === afterFirstPatch) {
    throw new Error('Second patch had no effect.');
  }
  writeFileSync(SCREEN_PATH, fullyPatched, 'utf8');

  console.log('Bypass applied. Exporting web build...');
  execSync(`npx expo export -p web --output-dir ${EXPORT_DIR} --clear`, { cwd: ROOT, stdio: 'inherit' });

  execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { cwd: ROOT, shell: '/bin/bash' });
  const serveProc = execSync(`(npx serve -s ${EXPORT_DIR} -p ${PORT} > /tmp/qa-relic-read-serve.log 2>&1 &) && sleep 2 && echo started`, {
    cwd: ROOT,
    shell: '/bin/bash',
  });
  console.log(serveProc.toString());

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    window.localStorage.setItem('apparently:onboarding', JSON.stringify({ completed: true, completedAt: new Date().toISOString() }));
  });

  await page.goto(`http://localhost:${PORT}/relic-read`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const outPath = join(ROOT, 'relic-read-resolved-qa.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Screenshot saved to', outPath);

  const bodyText = await page.locator('body').innerText();
  console.log('--- page text ---');
  console.log(bodyText);

  await browser.close();
  execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { cwd: ROOT, shell: '/bin/bash' });
} finally {
  revertBypass();
}
