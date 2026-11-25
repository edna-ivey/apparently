// Build 22 regression test (owner-required, 2026-10-30): proves numeric quiz/question/choice
// ids are TRULY frozen against the ledger (scripts/lib/content-id-ledger.ts), not merely
// "stable until someone inserts content in the middle of an array." Simulates adding a
// question to Petty in the worst-case position (inserted at the START of its questions
// array, not appended) and the literal case the owner asked for (appended at the end), and
// asserts EVERY existing quiz/question/choice id across the ENTIRE real catalog -- not just
// Petty -- is byte-identical before and after, while the new question/choices get fresh,
// never-before-used ids.
//
// Operates on an in-memory CLONE of the real, committed ledger -- never calls saveLedger,
// never touches the real scripts/lib/content-id-ledger.json file.
//
// Run with: npx tsx scripts/validate-frozen-content-ids.ts

import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import { WHATS_YOUR_TYPE_QUESTIONS } from '../src/data/quizzes/whats-your-type-content';
import { CANONICAL_QUIZ_ORDER } from './lib/canonical-quiz-order';
import { loadLedger, assignQuizId, assignQuestionId, assignChoiceId, type ContentIdLedger } from './lib/content-id-ledger';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const cloneLedger = (ledger: ContentIdLedger): ContentIdLedger => JSON.parse(JSON.stringify(ledger));

type ContentQuestion = { questionKey: string; choiceKeys: string[] };
const realContentByQuiz = new Map<string, ContentQuestion[]>();
for (const [quizKey, definition] of Object.entries(QUIZ_REGISTRY)) {
  realContentByQuiz.set(quizKey, definition.questions.map((q) => ({ questionKey: q.id, choiceKeys: q.choices.map((c) => c.id) })));
}
realContentByQuiz.set('whats-your-type', WHATS_YOUR_TYPE_QUESTIONS.map((q) => ({ questionKey: q.id, choiceKeys: q.choices.map((c) => c.id) })));

const assignAll = (ledger: ContentIdLedger, contentByQuiz: Map<string, ContentQuestion[]>) => {
  const quizIds = new Map<string, number>();
  const questionIds = new Map<string, number>();
  const choiceIds = new Map<string, number>();
  for (const quizKey of CANONICAL_QUIZ_ORDER) {
    const questions = contentByQuiz.get(quizKey) ?? [];
    quizIds.set(quizKey, assignQuizId(ledger, quizKey));
    for (const question of questions) {
      questionIds.set(`${quizKey}::${question.questionKey}`, assignQuestionId(ledger, quizKey, question.questionKey));
      for (const choiceKey of question.choiceKeys) {
        choiceIds.set(`${quizKey}::${question.questionKey}::${choiceKey}`, assignChoiceId(ledger, quizKey, question.questionKey, choiceKey));
      }
    }
  }
  return { quizIds, questionIds, choiceIds };
};

// Baseline: the real, already-committed ledger against the real, unmodified content.
const baselineLedger = loadLedger();
const baseline = assignAll(cloneLedger(baselineLedger), realContentByQuiz);
assert(baseline.questionIds.size > 0, `baseline ledger has real assignments (${baseline.questionIds.size} questions)`);

// ------------------------------------------------------------------------------------------
// Scenario 1: append a new question to the END of Petty's questions array (the literal case
// the owner asked for).
// ------------------------------------------------------------------------------------------
{
  const modified = new Map(realContentByQuiz);
  const pettyOriginal = realContentByQuiz.get('petty')!;
  modified.set('petty', [...pettyOriginal, { questionKey: 'q_new_appended', choiceKeys: ['a', 'b', 'c'] }]);

  const result = assignAll(cloneLedger(baselineLedger), modified);

  let unchanged = 0;
  for (const [key, id] of baseline.questionIds) {
    if (result.questionIds.get(key) !== id) {
      assert(false, `question id for '${key}' changed after appending to Petty (was ${id}, now ${result.questionIds.get(key)})`);
    } else {
      unchanged += 1;
    }
  }
  assert(unchanged === baseline.questionIds.size, `all ${unchanged} pre-existing question ids across the ENTIRE catalog are unchanged after appending to Petty`);
  for (const [key, id] of baseline.choiceIds) {
    assert(result.choiceIds.get(key) === id, `choice id for '${key}' unchanged`);
  }
  const newId = result.questionIds.get('petty::q_new_appended');
  const maxExistingId = Math.max(...baseline.questionIds.values());
  assert(newId !== undefined && newId > maxExistingId, `the newly appended question gets a fresh id greater than every existing id (new=${newId}, max existing=${maxExistingId})`);
}

// ------------------------------------------------------------------------------------------
// Scenario 2 (the actual bug the array-position approach had): INSERT a new question at the
// START of Petty's questions array -- the worst case for a naive position-based scheme.
// ------------------------------------------------------------------------------------------
{
  const modified = new Map(realContentByQuiz);
  const pettyOriginal = realContentByQuiz.get('petty')!;
  modified.set('petty', [{ questionKey: 'q_new_inserted_first', choiceKeys: ['a', 'b'] }, ...pettyOriginal]);

  const result = assignAll(cloneLedger(baselineLedger), modified);

  let mismatches = 0;
  for (const [key, id] of baseline.questionIds) {
    if (result.questionIds.get(key) !== id) mismatches += 1;
  }
  assert(mismatches === 0, `inserting a question at the START of Petty's array changes ZERO existing question ids anywhere in the catalog (mismatches=${mismatches})`);

  let choiceMismatches = 0;
  for (const [key, id] of baseline.choiceIds) {
    if (result.choiceIds.get(key) !== id) choiceMismatches += 1;
  }
  assert(choiceMismatches === 0, `inserting a question at the START of Petty's array changes ZERO existing choice ids anywhere in the catalog (mismatches=${choiceMismatches})`);

  const newId = result.questionIds.get('petty::q_new_inserted_first');
  const maxExistingId = Math.max(...baseline.questionIds.values());
  assert(newId !== undefined && newId > maxExistingId, `the inserted-first question STILL gets a fresh id, never reusing or shifting an existing one (new=${newId}, max existing=${maxExistingId})`);
}

// ------------------------------------------------------------------------------------------
// Scenario 3: insert a new CHOICE in the middle of an existing question's choices array.
// ------------------------------------------------------------------------------------------
{
  const modified = new Map(realContentByQuiz);
  const pettyOriginal = realContentByQuiz.get('petty')!;
  const firstQuestion = pettyOriginal[0];
  const modifiedFirstQuestion = { ...firstQuestion, choiceKeys: [firstQuestion.choiceKeys[0], 'z_new_choice', ...firstQuestion.choiceKeys.slice(1)] };
  modified.set('petty', [modifiedFirstQuestion, ...pettyOriginal.slice(1)]);

  const result = assignAll(cloneLedger(baselineLedger), modified);
  let mismatches = 0;
  for (const [key, id] of baseline.choiceIds) {
    if (result.choiceIds.get(key) !== id) mismatches += 1;
  }
  assert(mismatches === 0, `inserting a choice in the middle of an existing question's choices changes ZERO existing choice ids (mismatches=${mismatches})`);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL frozen-content-id (append to Petty, insert at start of Petty, insert mid-choice-list) VALIDATION CHECKS PASSED.');
