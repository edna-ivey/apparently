#!/usr/bin/env node
/**
 * Report-only invariant check, run manually: `node scripts/check-four-answer-invariant.mjs`.
 * Not wired into any build/CI step — that's a separate process decision, not part of
 * implementing the Today screen.
 *
 * Rule (explicitly confirmed by product):
 *   - Free Daily questions and free-access quizzes (access: 'free'): exactly 4 choices.
 *   - Private Daily and private-access quizzes (access !== 'free'): 4 or 5 choices, per
 *     question — both are real, already-shipped counts (e.g. the private-preview quizzes
 *     be-so-serious / keep-you-around use 5).
 *
 * Deliberately a plain text/bracket-depth parse of the real source files rather than
 * importing/transpiling the actual TypeScript modules at runtime — this repo has no
 * ts-node/tsx and the quiz/daily-questions files use `@/...` path aliases that plain Node
 * can't resolve, so a real import would need new tooling. This script reads exactly the same
 * real content (verbatim choice/option blocks) without adding any dependency.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function findMatchingBracket(text, openIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === openChar) depth += 1;
    else if (text[i] === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function countTopLevelObjects(text) {
  let depth = 0;
  let count = 0;
  for (const ch of text) {
    if (ch === '{') {
      if (depth === 0) count += 1;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
    }
  }
  return count;
}

let violations = 0;

// --- Quizzes --------------------------------------------------------------------------
const quizzesDir = path.join(repoRoot, 'src/data/quizzes');
const skipFiles = new Set([
  'types.ts',
  'index.ts',
  'results.ts',
  'scoring.ts',
  'pending-quiz-submissions.ts',
  'private-catalog.ts',
  'friend-adaptations.ts', // real file, but a share-template data shape, not a QuizDefinition
  // (it reuses the field name `choices` for something unrelated) — verified by hand before
  // this script was written; excluded by name rather than re-detected heuristically.
]);

for (const fname of readdirSync(quizzesDir).sort()) {
  if (!fname.endsWith('.ts') || skipFiles.has(fname)) continue;
  const content = readFileSync(path.join(quizzesDir, fname), 'utf8');

  const accessMatch = content.match(/access:\s*'([^']+)'/);
  const access = accessMatch ? accessMatch[1] : 'unknown';
  const isFree = access === 'free';

  const re = /choices:\s*\[/g;
  let match;
  let questionIndex = 0;
  while ((match = re.exec(content)) !== null) {
    questionIndex += 1;
    const openIndex = match.index + match[0].length - 1;
    const closeIndex = findMatchingBracket(content, openIndex, '[', ']');
    if (closeIndex === -1) {
      violations += 1;
      console.error(`[quiz] ${fname} question ${questionIndex}: could not parse choices array.`);
      continue;
    }
    const inner = content.slice(openIndex + 1, closeIndex);
    const count = countTopLevelObjects(inner);
    const ok = isFree ? count === 4 : count === 4 || count === 5;
    if (!ok) {
      violations += 1;
      console.error(`[quiz] ${fname} (access: ${access}) question ${questionIndex}: ${count} choices — expected ${isFree ? '4' : '4 or 5'}.`);
    }
  }
}

// --- Free Daily -------------------------------------------------------------------------
const dailyPath = path.join(repoRoot, 'src/data/daily-questions.ts');
const dailyContent = readFileSync(dailyPath, 'utf8');
const seedMatch = dailyContent.match(/const rawInitialQuestions: SeedQuestion\[\] = \[/);
if (!seedMatch) {
  violations += 1;
  console.error('[daily] could not locate rawInitialQuestions array — check src/data/daily-questions.ts has not been restructured.');
} else {
  const openIndex = seedMatch.index + seedMatch[0].length - 1;
  const closeIndex = findMatchingBracket(dailyContent, openIndex, '[', ']');
  const seedBlock = dailyContent.slice(openIndex + 1, closeIndex);
  // Within the seed array, find each question's own `options: [...]` block.
  const optRe = /options:\s*\[/g;
  let optMatch;
  let qIndex = 0;
  while ((optMatch = optRe.exec(seedBlock)) !== null) {
    qIndex += 1;
    const oOpen = optMatch.index + optMatch[0].length - 1;
    const oClose = findMatchingBracket(seedBlock, oOpen, '[', ']');
    const inner = seedBlock.slice(oOpen + 1, oClose);
    const count = countTopLevelObjects(inner);
    if (count !== 4) {
      violations += 1;
      console.error(`[daily] seed question ${qIndex}: ${count} options — expected 4.`);
    }
  }
}

if (violations === 0) {
  console.log('Four-answer invariant: OK — all Free Daily/quiz content has exactly 4 choices, all Private content has 4 or 5.');
  process.exit(0);
} else {
  console.error(`Four-answer invariant: ${violations} violation(s) found.`);
  process.exit(1);
}
