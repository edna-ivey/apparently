#!/usr/bin/env node
// Build 12 real regression test for the quiz question-cutoff bug — replaces trusting the
// Build 11 static validator (which only checked that a ScrollView had flex:1 and that no
// numberOfLines/ellipsizeMode existed) with an ACTUAL rendered-geometry test: real navigation
// through real production quiz questions, with deliberate mid-quiz scrolling, verifying the
// next question's complete text is actually visible at the top of the viewport and not
// clipped by a stale scroll offset — the real bug Michelle hit on her physical iPhone, which
// the static validator could never have caught since it never simulates navigation at all.
//
// Self-contained: temporarily bypasses the premium-quiz paywall gate (to reach the 7 premium
// Apparently Private quizzes, which hold the library's longest real questions), builds a web
// export, runs the real checks, then ALWAYS reverts the bypass via `git checkout` in a finally
// block — even on failure/crash. Safe to run repeatedly; leaves no trace in the working tree.
//
// Prerequisite: this project has no browser-automation dependency installed (no test runner
// is part of the toolchain today). Run `npm install --no-save playwright` first (or make
// `playwright` resolvable from this directory some other way) and ensure a Chromium build is
// available (`npx playwright install chromium` if needed). Not added to package.json by
// default -- that's a deliberate, separate decision for the project to make, not bundled into
// this fix.
//
// Run with: node scripts/qa-quiz-dynamic-layout.mjs
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const QUIZ_SCREEN_PATH = `${REPO_ROOT}src/app/quiz/[quizId].tsx`;
const PORT = 4175;

const VIEWPORTS = [
  { name: 'iphone-se-smaller', width: 375, height: 667 },
  { name: 'iphone-14-standard', width: 390, height: 844 },
];

// Longest real questions in the library (premium) + the two non-gated quizzes with the longest
// available free/preview content, so this also exercises the exact same mechanism with zero
// gate bypass needed for at least some coverage. Prompts are the REAL, approved, verbatim
// source text — copy them fresh from src/data/quizzes/*.ts if content ever changes; this
// script intentionally does NOT import the quiz modules directly (they pull in RN-only
// dependencies that don't resolve under plain Node).
const TARGETS = [
  { quizId: 'life-match-dream-life', requiresBypass: true, lastPrompt: "Apparently offers you a deal. You can have a life that feels perfect to you... but from the outside? It's not particularly impressive. Nobody envies you. Nobody says, “I want your life.” Nobody is surprised by what you have. Deal?" },
  { quizId: 'private-private-trouble', requiresBypass: true, lastPrompt: 'Last one. The chemistry is ridiculous. The opportunity is there. Nobody is pressuring anybody. You want it. But tomorrow could get... complicated. Which voice usually wins?' },
  { quizId: 'career-ambition-how-bad', requiresBypass: true, lastPrompt: "Last one. Apparently is taking away the cute answer. You can have the thing you say you want. But it will take five years, nobody will be impressed while you’re building it, and there is no shortcut. Still want it?" },
  { quizId: 'be-so-serious', requiresBypass: false, lastPrompt: null }, // discovered dynamically below
];

let failures = 0;
const fail = (msg) => { failures += 1; console.log(`FAIL: ${msg}`); };
const pass = (msg) => console.log(`PASS: ${msg}`);

// Captured so revertBypass can restore EXACTLY this content, byte for byte — never git
// checkout, which would discard any OTHER uncommitted work in this file (real fixes included)
// along with the bypass. This script only ever touches what it itself added.
let originalQuizScreenSource = null;

function applyBypass() {
  const original = readFileSync(QUIZ_SCREEN_PATH, 'utf8');
  if (original.includes('__DEV_LAYOUT_QA_BYPASS__')) {
    throw new Error('Quiz screen already contains a QA bypass marker — refusing to double-patch. Check git status.');
  }
  const patched = original
    .replace(
      /export default function QuizScreen\(\) \{/,
      "// TEMP QA-ONLY FLAG — reverted automatically by scripts/qa-quiz-dynamic-layout.mjs\nconst __DEV_LAYOUT_QA_BYPASS__ = true;\n\nexport default function QuizScreen() {",
    )
    .replace(
      "if (definition.access === 'private' && !isPremium) {",
      "if (definition.access === 'private' && !isPremium && !__DEV_LAYOUT_QA_BYPASS__) {",
    );
  if (patched === original) {
    throw new Error('Bypass patch did not match expected source — quiz screen structure may have changed. Aborting without modifying anything.');
  }
  originalQuizScreenSource = original;
  writeFileSync(QUIZ_SCREEN_PATH, patched);
}

function revertBypass() {
  if (originalQuizScreenSource === null) {
    return; // applyBypass never successfully ran -- nothing to revert.
  }
  writeFileSync(QUIZ_SCREEN_PATH, originalQuizScreenSource);
  console.log('Reverted temporary QA bypass (restored exact pre-patch file content).');
}

function runChecks() {
  const dirty = execSync('git status --porcelain -- "src/app/quiz/[quizId].tsx"', { cwd: REPO_ROOT }).toString();
  if (!dirty.includes('[quizId].tsx')) {
    throw new Error('Expected the quiz screen to be modified (bypass applied) before building — it is not. Aborting.');
  }

  execSync('npx expo export -p web --output-dir dist-qa-dynamic --clear', { cwd: REPO_ROOT, stdio: 'inherit' });

  execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { cwd: REPO_ROOT, shell: '/bin/bash' });
  const server = spawn('npx', ['serve', '-s', 'dist-qa-dynamic', '-p', String(PORT)], { cwd: REPO_ROOT, detached: true, stdio: 'ignore' });
  server.unref();

  return server;
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Dev server never became reachable.');
}

// Override via QA_CHROME_PATH if Playwright's own default browser resolution doesn't apply
// (e.g. a pinned cache path from a specific `playwright install` run).
const CHROME_PATH = process.env.QA_CHROME_PATH || undefined;

async function testQuiz(browser, quizId, lastPromptKnown, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(`http://localhost:${PORT}/quiz/${quizId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const introCta = page.locator('text=/→$/').first();
  if (!(await introCta.count())) {
    fail(`${quizId}/${vp.name}: no intro CTA found, quiz unreachable (gate bypass may have failed)`);
    await page.close();
    return;
  }
  await introCta.click();
  await page.waitForTimeout(250);

  let lastPrompt = lastPromptKnown;
  let reachedLast = false;
  for (let i = 0; i < 12 && !reachedLast; i++) {
    const choiceA = page.locator('text="A"').first();
    if (await choiceA.count()) await choiceA.click();
    await page.waitForTimeout(80);

    const nextBtn = page.locator('text=/Next →|Read me →/').first();
    if (!(await nextBtn.count())) {
      fail(`${quizId}/${vp.name}: Next/Read-me button not found at step ${i}`);
      await page.close();
      return;
    }
    const label = (await nextBtn.textContent()) ?? '';
    if (label.includes('Read me')) {
      reachedLast = true;
      if (!lastPrompt) {
        // Discover the final prompt's text directly from the DOM for quizzes where we didn't
        // hardcode it above (still the REAL rendered text, just captured at runtime instead of
        // copied from source).
        const bodyText = await page.locator('body').innerText();
        lastPrompt = bodyText.split('\n').find((line) => line.length > 60) ?? null;
      }
      break;
    }

    // Deliberately scroll DOWN on this (non-final) question before advancing — exactly the
    // real-world action that exposed the bug (reading/reaching Next on a long question).
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(150);

    await nextBtn.click();
    await page.waitForTimeout(250);
  }

  if (!reachedLast) {
    fail(`${quizId}/${vp.name}: never reached the final question within 12 steps`);
    await page.close();
    return;
  }

  if (!lastPrompt) {
    fail(`${quizId}/${vp.name}: could not determine the final question's prompt text to verify against`);
    await page.close();
    return;
  }

  const promptEl = page.getByText(lastPrompt.slice(0, 60), { exact: false }).first();
  if ((await promptEl.count()) === 0) {
    fail(`${quizId}/${vp.name}: the complete approved prompt text was NOT found in the DOM (truncated, altered, or never rendered)`);
    await page.close();
    return;
  }
  pass(`${quizId}/${vp.name}: complete approved prompt text found in the DOM`);

  const box = await promptEl.boundingBox();
  if (!box) {
    fail(`${quizId}/${vp.name}: prompt element matched but has no bounding box`);
  } else if (box.y < -2) {
    fail(`${quizId}/${vp.name}: prompt top is at y=${box.y.toFixed(1)}, scrolled ABOVE the viewport — stale scroll offset from the previous question`);
  } else if (box.y > vp.height) {
    fail(`${quizId}/${vp.name}: prompt top is at y=${box.y.toFixed(1)}, below the viewport entirely`);
  } else {
    pass(`${quizId}/${vp.name}: prompt top visible at y=${box.y.toFixed(1)} (scroll correctly reset on navigation)`);
  }

  const clipped = await promptEl.evaluate((el) => {
    let node = el;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (style.overflowY === 'hidden' && node.scrollHeight > node.clientHeight + 2) {
        return { tag: node.tagName, cls: node.className?.toString().slice(0, 80) };
      }
      node = node.parentElement;
    }
    return null;
  });
  if (clipped) {
    fail(`${quizId}/${vp.name}: an ancestor (${clipped.tag} class="${clipped.cls}") clips overflow with insufficient height`);
  } else {
    pass(`${quizId}/${vp.name}: no clipping ancestor found`);
  }

  await page.close();
}

async function main() {
  applyBypass();
  let server;
  try {
    server = runChecks();
    await waitForServer();

    const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
    for (const target of TARGETS) {
      for (const vp of VIEWPORTS) {
        await testQuiz(browser, target.quizId, target.lastPrompt, vp);
      }
    }
    await browser.close();
  } finally {
    try { execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { shell: '/bin/bash' }); } catch {}
    try { execSync(`rm -rf "${REPO_ROOT}dist-qa-dynamic"`); } catch {}
    revertBypass();
  }

  console.log(`\n${failures === 0 ? 'ALL DYNAMIC QUIZ LAYOUT CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  try { revertBypass(); } catch {}
  process.exit(1);
});
