// Regression guard for the Build 10 "quiz questions cut off" bug: on native iOS, a
// ScrollView needs an explicit bounded `style` (not just `contentContainerStyle`) to clip
// to the screen and let overflow content scroll — without it, the ScrollView's own frame
// can grow to match its content and long questions/answers render past the bottom edge
// with no way to reach them. This never reproduced in the web preview, which is exactly why
// it shipped undetected — so this check is static (reads the source directly) rather than
// relying on a renderer that wouldn't catch the native-only failure mode either.
//
// Run with: npx tsx scripts/validate-quiz-question-layout.ts
import { QUIZ_REGISTRY } from '../src/data/quizzes';

declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

const SCREEN_PATH = join(__dirname, '..', 'src', 'app', 'quiz', '[quizId].tsx');
const source = readFileSync(SCREEN_PATH, 'utf8');

let failures = 0;
const fail = (message: string) => {
  failures += 1;
  console.error(`FAIL: ${message}`);
};
const pass = (message: string) => console.log(`PASS: ${message}`);

// 1. The ScrollView wrapping question/answer content must have an explicit bounding style
// (flex: 1), not rely on contentContainerStyle's flexGrow alone — this is the exact root
// cause of the Build 10 bug.
const scrollViewMatch = source.match(/<ScrollView\s+([^>]*)>/);
if (!scrollViewMatch) {
  fail('Could not find a <ScrollView> tag in the quiz screen — has it been renamed/restructured?');
} else {
  const props = scrollViewMatch[1];
  if (!/style=\{styles\.(\w+)\}/.test(props)) {
    fail('<ScrollView> has no bounding `style` prop (only contentContainerStyle) — this is the Build 10 cut-off regression.');
  } else {
    const styleName = props.match(/style=\{styles\.(\w+)\}/)![1];
    const styleBlockMatch = source.match(new RegExp(`${styleName}:\\s*\\{([^}]*)\\}`));
    if (!styleBlockMatch || !/flex:\s*1/.test(styleBlockMatch[1])) {
      fail(`<ScrollView style={styles.${styleName}}> does not set flex: 1 — the ScrollView won't be bounded to the screen on native iOS.`);
    } else {
      pass(`<ScrollView> has a bounded style (styles.${styleName} includes flex: 1).`);
    }
  }
}

// 2. None of the text-truncation footguns the bug report explicitly called out should ever
// reappear on the question/choice rendering path.
const forbiddenPatterns: { name: string; pattern: RegExp }[] = [
  { name: 'numberOfLines', pattern: /numberOfLines/ },
  { name: 'ellipsizeMode', pattern: /ellipsizeMode/ },
  { name: 'maxHeight', pattern: /maxHeight/ },
];
for (const { name, pattern } of forbiddenPatterns) {
  if (pattern.test(source)) {
    fail(`Found "${name}" in the quiz screen — this truncates/clips text and must not be used on question or answer copy.`);
  } else {
    pass(`No "${name}" present in the quiz screen.`);
  }
}

// 3. Sanity ceiling on real approved copy length — not a hard limit (long copy is allowed
// and expected to grow/scroll), just an early-warning marker so a drastic future outlier
// gets a deliberate look rather than silently shipping.
const PROMPT_SOFT_CEILING = 400;
const CHOICE_SOFT_CEILING = 300;
let longestPrompt = { len: 0, quizId: '', questionId: '' };
let longestChoice = { len: 0, quizId: '', questionId: '', choiceId: '' };

for (const [quizId, def] of Object.entries(QUIZ_REGISTRY)) {
  for (const q of def.questions) {
    if (q.prompt.length > longestPrompt.len) {
      longestPrompt = { len: q.prompt.length, quizId, questionId: q.id };
    }
    for (const c of q.choices) {
      if (c.label.length > longestChoice.len) {
        longestChoice = { len: c.label.length, quizId, questionId: q.id, choiceId: c.id };
      }
    }
  }
}

if (longestPrompt.len > PROMPT_SOFT_CEILING) {
  fail(
    `Longest question prompt is ${longestPrompt.len} chars (${longestPrompt.quizId}/${longestPrompt.questionId}), over the ${PROMPT_SOFT_CEILING}-char soft ceiling — give it a manual layout look on a small device before shipping.`,
  );
} else {
  pass(`Longest question prompt is ${longestPrompt.len} chars (${longestPrompt.quizId}/${longestPrompt.questionId}), within the ${PROMPT_SOFT_CEILING}-char soft ceiling.`);
}

if (longestChoice.len > CHOICE_SOFT_CEILING) {
  fail(
    `Longest answer choice is ${longestChoice.len} chars (${longestChoice.quizId}/${longestChoice.questionId}/${longestChoice.choiceId}), over the ${CHOICE_SOFT_CEILING}-char soft ceiling — give it a manual layout look on a small device before shipping.`,
  );
} else {
  pass(`Longest answer choice is ${longestChoice.len} chars (${longestChoice.quizId}/${longestChoice.questionId}/${longestChoice.choiceId}), within the ${CHOICE_SOFT_CEILING}-char soft ceiling.`);
}

console.log('');
if (failures > 0) {
  console.error(`${failures} CHECK(S) FAILED.`);
  process.exit(1);
} else {
  console.log('ALL QUIZ QUESTION LAYOUT CHECKS PASSED.');
}
