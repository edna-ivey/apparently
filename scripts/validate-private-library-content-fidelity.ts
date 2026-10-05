// Content-fidelity regression for the ENTIRE approved Private quiz library — generalizes
// validate-love-ready-content-fidelity.ts (superseded/removed by this file) after the Build 12
// love-soulmates-ready audit found all 10 of its questions missing approved continuation lines,
// a defect neither the static layout validator nor the dynamic layout QA could ever have caught
// (see that audit's report for the full trace). This script closes the same gap across every
// OTHER currently playable Private quiz that has an independent approved source document.
//
// Independence is the entire point: every expected string here is parsed directly from
// docs/private-quizzes/*.md at run time. Nothing is copied from, derived from, or compared
// against the production *.ts files' own content -- the *.ts files are only ever the thing
// being CHECKED, never the source of what "correct" means. A future edit (human or LLM) that
// drops, shortens, or rewrites an approved line will fail this on content alone, independent of
// whether it renders fine.
//
// Run with: npx tsx scripts/validate-private-library-content-fidelity.ts
import { CAREER_HOW_BAD_QUIZ } from '../src/data/quizzes/career-how-bad';
import { CAREER_PROVING_QUIZ } from '../src/data/quizzes/career-proving';
import { HIDDEN_YOU_WRONG_QUIZ } from '../src/data/quizzes/hidden-you-wrong';
import { LIFE_MATCH_DREAM_LIFE_QUIZ } from '../src/data/quizzes/life-match-dream-life';
import { LOVE_READY_QUIZ } from '../src/data/quizzes/love-ready';
import { PRIVATE_PRIVATE_TROUBLE_QUIZ } from '../src/data/quizzes/private-private-trouble';
import { STYLE_VIBE_INTIMIDATING_QUIZ } from '../src/data/quizzes/style-vibe-intimidating';
import { BE_SO_SERIOUS_QUIZ } from '../src/data/quizzes/be-so-serious';
import { KEEP_YOU_AROUND_QUIZ } from '../src/data/quizzes/keep-you-around';
import type { QuizQuestion } from '../src/data/quizzes/types';

declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const DOCS_DIR = join(__dirname, '..', 'docs', 'private-quizzes');

let failures = 0;
let mismatchReports: string[] = [];
const fail = (message: string) => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};
const pass = (message: string) => console.log(`OK: ${message}`);
const note = (message: string) => console.log(`NOTE: ${message}`);

function stripMarkdownEmphasis(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

// Parses one quiz's "## Questions" (or "## Approved questions") subsection into
// { num -> fullPrompt } entries. A question's canonical prompt is every non-blank line from its
// "### N. <opening line>" heading up to (not including) the first "A. " choice line, stripped of
// markdown emphasis and joined with \n\n -- the exact convention already proven correct in
// production by be-so-serious.ts and (after the Build 12 fix) love-ready.ts.
function parseApprovedPrompts(docText: string): Map<number, string> {
  const headingLabel = docText.includes('## Approved questions') ? '## Approved questions' : '## Questions';
  const questionsStart = docText.indexOf(headingLabel);
  if (questionsStart === -1) {
    throw new Error(`Could not find "${headingLabel}" in the given doc section.`);
  }
  const questionsBlock = docText.slice(questionsStart);

  const results = new Map<number, string>();
  const headingPattern = /^### (\d+)\.\s?(.*)$/gm;
  const headingMatches = [...questionsBlock.matchAll(headingPattern)];

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const num = Number(match[1]);
    const openingLine = match[2].trim();
    const blockStart = match.index! + match[0].length;
    const blockEnd = i + 1 < headingMatches.length ? headingMatches[i + 1].index! : questionsBlock.length;
    const body = questionsBlock.slice(blockStart, blockEnd);

    const continuationLines: string[] = [];
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (line === '') continue;
      if (/^A\.\s/.test(line)) break;
      continuationLines.push(stripMarkdownEmphasis(line));
    }

    const fullPrompt = [stripMarkdownEmphasis(openingLine), ...continuationLines].join('\n\n');
    results.set(num, fullPrompt);
  }
  return results;
}

// Extracts one "# N. TITLE" ... next "# " section's text from a multi-quiz doc
// (APPROVED_PRIVATE_QUIZZES.md bundles 3 quizzes in one file). Bounded by ANY next top-level
// "# " heading -- not just a numbered one -- since that file also contains an unnumbered
// "# Existing approved/playable Private quizzes already preserved in master" section between
// quiz 2 and quiz 3 that must never leak into either quiz's parsed content.
function extractSection(fullDocText: string, startAnchor: string): string {
  const start = fullDocText.indexOf(startAnchor);
  if (start === -1) {
    throw new Error(`Could not find "${startAnchor}" in the doc.`);
  }
  const afterStart = start + startAnchor.length;
  const nextHeadingIndex = fullDocText.slice(afterStart).search(/\n# /);
  const end = nextHeadingIndex === -1 ? fullDocText.length : afterStart + nextHeadingIndex;
  return fullDocText.slice(start, end);
}

type LibraryEntry = {
  quizId: string;
  questions: QuizQuestion[];
  docFile: string | null;
  sectionAnchor: string | null; // null = whole file is this quiz's doc (single-quiz file)
};

const LIBRARY: LibraryEntry[] = [
  { quizId: 'career-ambition-how-bad', questions: CAREER_HOW_BAD_QUIZ.questions, docFile: 'APPROVED_PRIVATE_QUIZZES.md', sectionAnchor: '# 1. HOW BAD DO YOU ACTUALLY WANT IT?' },
  { quizId: 'career-ambition-proving', questions: CAREER_PROVING_QUIZ.questions, docFile: 'APPROVED_PRIVATE_QUIZZES.md', sectionAnchor: '# 2. ARE YOU AMBITIOUS... OR PROVING SOMETHING?' },
  { quizId: 'love-soulmates-ready', questions: LOVE_READY_QUIZ.questions, docFile: 'APPROVED_PRIVATE_QUIZZES.md', sectionAnchor: '# 3. ARE YOU ACTUALLY READY FOR LOVE?' },
  { quizId: 'hidden-you-wrong', questions: HIDDEN_YOU_WRONG_QUIZ.questions, docFile: 'APPROVED_HIDDEN_YOU.md', sectionAnchor: null },
  { quizId: 'life-match-dream-life', questions: LIFE_MATCH_DREAM_LIFE_QUIZ.questions, docFile: 'APPROVED_LIFE_MATCH.md', sectionAnchor: null },
  { quizId: 'private-private-trouble', questions: PRIVATE_PRIVATE_TROUBLE_QUIZ.questions, docFile: 'APPROVED_PRIVATE_PRIVATE.md', sectionAnchor: null },
  { quizId: 'style-vibe-intimidating', questions: STYLE_VIBE_INTIMIDATING_QUIZ.questions, docFile: 'APPROVED_STYLE_VIBE.md', sectionAnchor: null },
  // No independent approved doc exists for these two -- APPROVED_PRIVATE_QUIZZES.md explicitly
  // notes them as "already implemented... not duplicated here." There is currently nothing in
  // the repo to parse an independent canonical prompt from, so they CANNOT be content-fidelity
  // checked by this script. Listed explicitly (docFile: null) so that gap is visible in the
  // report rather than silently absent from coverage.
  { quizId: 'be-so-serious', questions: BE_SO_SERIOUS_QUIZ.questions, docFile: null, sectionAnchor: null },
  { quizId: 'keep-you-around', questions: KEEP_YOU_AROUND_QUIZ.questions, docFile: null, sectionAnchor: null },
];

let totalChecked = 0;
let totalMatched = 0;
let quizzesWithNoDoc = 0;

for (const entry of LIBRARY) {
  console.log(`\n--- ${entry.quizId} ---`);

  if (!entry.docFile) {
    quizzesWithNoDoc += 1;
    note(`${entry.quizId}: NO independent approved doc exists in docs/private-quizzes/ -- content fidelity CANNOT be verified by this script. (Not a pass, not a fail -- a coverage gap.)`);
    continue;
  }

  const fullDocText = readFileSync(join(DOCS_DIR, entry.docFile), 'utf8');
  const docSection = entry.sectionAnchor ? extractSection(fullDocText, entry.sectionAnchor) : fullDocText;
  const approved = parseApprovedPrompts(docSection);

  if (approved.size !== entry.questions.length) {
    fail(`${entry.quizId}: parsed ${approved.size} approved questions from ${entry.docFile}, but production has ${entry.questions.length} questions.`);
  }

  for (let i = 0; i < entry.questions.length; i++) {
    const num = i + 1;
    const production = entry.questions[i].prompt;
    const canonical = approved.get(num);
    totalChecked += 1;

    if (canonical === undefined) {
      fail(`${entry.quizId} Q${num}: no approved canonical text was parsed from the doc to compare against.`);
      continue;
    }

    if (production === canonical) {
      totalMatched += 1;
      pass(`${entry.quizId} Q${num}: production prompt matches the approved canonical content exactly.`);
    } else {
      fail(`${entry.quizId} Q${num}: production prompt does NOT match the approved canonical content.`);
      const minLen = Math.min(production.length, canonical.length);
      let divergeAt = minLen;
      for (let c = 0; c < minLen; c++) {
        if (production[c] !== canonical[c]) {
          divergeAt = c;
          break;
        }
      }
      const report = [
        `\n=== MISMATCH: ${entry.quizId} Q${num} ===`,
        `CANONICAL (approved, len ${canonical.length}):`,
        JSON.stringify(canonical),
        `PRODUCTION (${entry.quizId}.ts, len ${production.length}):`,
        JSON.stringify(production),
        `First difference at character ${divergeAt}:`,
        `  CANONICAL  context: ...${JSON.stringify(canonical.slice(Math.max(0, divergeAt - 25), divergeAt + 25))}...`,
        `  PRODUCTION context: ...${JSON.stringify(production.slice(Math.max(0, divergeAt - 25), divergeAt + 25))}...`,
      ].join('\n');
      mismatchReports.push(report);
      console.error(report);
    }
  }
}

console.log('\n=====================================================');
console.log(`Content fidelity: ${totalMatched}/${totalChecked} production prompts (across doc-backed quizzes) exactly match independently parsed approved content.`);
console.log(`Quizzes with NO independent doc (unverifiable by this script): ${quizzesWithNoDoc} (be-so-serious, keep-you-around).`);
console.log('=====================================================');

if (failures > 0) {
  console.error(`\n${failures} CHECK(S) FAILED -- ${mismatchReports.length} content mismatch(es) found. STOPPING without modifying any production content.`);
  process.exit(1);
} else {
  console.log('\nALL PRIVATE LIBRARY CONTENT FIDELITY CHECKS PASSED.');
}
