// Build 22 owner audit (2026-11-01): "Do not assign contradictory poles of the same dimension
// in one answer" / "Each award must have a stable numeric trait ID" / "There is no arbitrary
// two-trait, three-trait, or four-trait cap per choice." Independent structural validation of
// the hand-transcribed scripts/lib/private-quiz-trait-awards.ts against the real frozen
// dimension-id ledger -- catches a transcription mistake (a typo'd trait_id, or accidentally
// awarding both poles of one dimension on the same choice) that would otherwise only surface
// as a subtle, hard-to-notice scoring bug.
//
// Run with: npx tsx scripts/validate-private-quiz-trait-awards.ts
import { PRIVATE_QUIZ_TRAIT_AWARDS } from './lib/private-quiz-trait-awards';
import { loadDimensionIdLedger } from './lib/dimension-id-ledger';
import { QUIZ_REGISTRY } from '../src/data/quizzes/index';

let pass = 0;
let fail = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${label}${detail ? ` -- ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const ledger = loadDimensionIdLedger();
const maxDimensionId = Math.max(...Object.values(ledger.dimensionIds));
const maxTraitId = maxDimensionId * 2;

check(`${PRIVATE_QUIZ_TRAIT_AWARDS.length} award rows loaded`, PRIVATE_QUIZ_TRAIT_AWARDS.length > 0);

const outOfRange = PRIVATE_QUIZ_TRAIT_AWARDS.filter((r) => r.traitId < 1 || r.traitId > maxTraitId || !Number.isInteger(r.traitId));
check(`every trait_id is an integer in [1, ${maxTraitId}] (the real frozen catalog range)`, outOfRange.length === 0, outOfRange.length > 0 ? JSON.stringify(outOfRange[0]) : undefined);

const badPoints = PRIVATE_QUIZ_TRAIT_AWARDS.filter((r) => !Number.isInteger(r.points) || r.points < 1 || r.points > 3);
check('every points value is an integer in [1, 3] (positive-only evidence, never a penalty)', badPoints.length === 0, badPoints.length > 0 ? JSON.stringify(badPoints[0]) : undefined);

// No duplicate (quiz, question, choice, trait) rows -- a copy/paste duplicate would silently
// double an award's point value.
const seenRowKeys = new Set<string>();
const duplicateRows: string[] = [];
for (const r of PRIVATE_QUIZ_TRAIT_AWARDS) {
  const key = `${r.quizId}::${r.questionId}::${r.choiceId}::${r.traitId}`;
  if (seenRowKeys.has(key)) duplicateRows.push(key);
  seenRowKeys.add(key);
}
check('no duplicate (quiz, question, choice, trait) award rows', duplicateRows.length === 0, duplicateRows[0]);

// No choice awards both poles (positive AND negative) of the SAME dimension -- "contradictory
// poles" per the item-5 instruction. dimension_id = ceil(trait_id / 2).
const byChoice = new Map<string, number[]>();
for (const r of PRIVATE_QUIZ_TRAIT_AWARDS) {
  const choiceKey = `${r.quizId}::${r.questionId}::${r.choiceId}`;
  const list = byChoice.get(choiceKey) ?? [];
  list.push(r.traitId);
  byChoice.set(choiceKey, list);
}
const contradictoryChoices: string[] = [];
for (const [choiceKey, traitIds] of byChoice) {
  const dimensionIds = traitIds.map((t) => Math.ceil(t / 2));
  const seenDims = new Set<number>();
  for (const d of dimensionIds) {
    if (seenDims.has(d)) contradictoryChoices.push(choiceKey);
    seenDims.add(d);
  }
}
check('no choice awards both poles of the same dimension (no contradictory poles)', contradictoryChoices.length === 0, contradictoryChoices[0]);

// No per-choice award-count cap -- confirm the data itself actually exercises more than 2 and
// more than 3 awards on at least one real choice (proving no cap was silently reintroduced),
// alongside confirming some choices legitimately have zero (sparse mappings are intentional).
const countsPerChoice = [...byChoice.values()].map((list) => list.length);
check('at least one choice carries 3 awards (no 2-award cap)', countsPerChoice.some((c) => c === 3));
check('at least one choice carries 4 awards (no 3-award cap)', countsPerChoice.some((c) => c >= 4));
// Real total choice count per covered quiz, read from the actual registry content -- these
// quizzes no longer share a uniform 10-question/4-choice shape (secretly-love has 8
// questions; several new quizzes have 5 choices per question), so a fixed formula would be
// wrong. MX-style zero-weight fallback archetypes never appear here (they're not choices).
const quizKeys = new Set(PRIVATE_QUIZ_TRAIT_AWARDS.map((r) => r.quizId));
let totalRealChoices = 0;
for (const quizId of quizKeys) {
  const definition = QUIZ_REGISTRY[quizId];
  if (!definition) {
    check(`${quizId} exists in QUIZ_REGISTRY (every quizId in the award data must be real)`, false);
    continue;
  }
  totalRealChoices += definition.questions.reduce((sum, q) => sum + q.choices.length, 0);
}
const choicesWithZero = totalRealChoices - byChoice.size;
check('at least one choice legitimately carries zero awards (sparse mappings preserved, not padded)', choicesWithZero > 0 || [...byChoice.values()].some((l) => l.length === 0), `${choicesWithZero} choices have zero rows`);

console.log(`\nPASS: ${pass}  FAIL: ${fail}`);
if (fail > 0) process.exit(1);
console.log('ALL CHECKS PASSED');
