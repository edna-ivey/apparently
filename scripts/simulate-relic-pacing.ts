// Build 11 §16 "SIMULATE RELIC PACING" — runs many simulated users through the REAL quiz
// content (actual question/choice traitSignals, actual applyPermanentQuizAwards with the new
// LOCKED 3/2/1 ranked Private award) to check whether the new weighting hits the target pacing:
// most engaged users should have a forming Relic by ~2-3 Private quizzes and a complete one by
// ~5-7, evidence-driven (never padded). Each simulated user picks one choice per question
// uniformly at random, independently per question — a simple, content-agnostic stand-in for
// "diverse plausible answer patterns" that doesn't hand-pick favorable answers. Quiz order per
// user is randomized too, so "after N quizzes" means N quizzes drawn without replacement from
// the 7-quiz premium library, not always the same N.
//
// Run with: npx tsx scripts/simulate-relic-pacing.ts
import { getQuizDefinition } from '../src/data/quizzes';
import { applyPermanentQuizAwards } from '../src/data/quiz-personality-awards';
import {
  isPrivateDimension,
  resolveActiveBoardPole,
  type DimensionEvidence,
  type PersonalityAnswerEvidence,
  type PersonalityDimensionId,
  type PersonalityEffect,
} from '../src/data/personality';

const PREMIUM_QUIZ_IDS = [
  'career-ambition-how-bad',
  'career-ambition-proving',
  'hidden-you-wrong',
  'life-match-dream-life',
  'love-soulmates-ready',
  'private-private-trouble',
  'style-vibe-intimidating',
] as const;

const SIMULATED_USERS = 2000;
let seed = 42;
// Deterministic PRNG (mulberry32) so this simulation's results are reproducible across runs,
// not a different answer pattern every time the script is invoked.
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function answerQuizRandomly(quizId: string): PersonalityAnswerEvidence[] {
  const definition = getQuizDefinition(quizId);
  if (!definition) throw new Error(`Unknown quiz: ${quizId}`);
  return definition.questions.map((question) => {
    const choice = question.choices[Math.floor(rand() * question.choices.length)];
    return { question: question.prompt, category: definition.category, chosenAnswer: choice.label, effects: choice.traitSignals ?? [] };
  });
}

// Builds this user's full raw-evidence ledger (one DimensionEvidence per awarded effect,
// across however many quizzes they've completed so far) and reports, at each quiz count,
// how many Private dimensions are activeBoardQualified -- the SAME real threshold/function
// Undercurrent and Relic slot selection both actually use.
function simulateOneUser(quizOrder: readonly string[]): number[] /* qualifiedPrivateCount after each quiz, 1-indexed */ {
  const evidenceByDimension = new Map<PersonalityDimensionId, DimensionEvidence[]>();
  const qualifiedCountAfterEachQuiz: number[] = [];

  quizOrder.forEach((quizId, quizIndex) => {
    const answers = answerQuizRandomly(quizId);
    const awards: PersonalityEffect[] = applyPermanentQuizAwards(answers, 'private');
    awards.forEach((effect) => {
      const list = evidenceByDimension.get(effect.dimension) ?? [];
      list.push({
        dimension: effect.dimension,
        question: '',
        category: '',
        chosenAnswer: '',
        effect: effect.value,
        normalized: 0,
        date: new Date(2026, 0, quizIndex + 1).toISOString(),
      });
      evidenceByDimension.set(effect.dimension, list);
    });

    let qualifiedPrivateCount = 0;
    for (const [dimension, evidence] of evidenceByDimension) {
      if (!isPrivateDimension(dimension)) continue;
      if (resolveActiveBoardPole(evidence).qualifies) qualifiedPrivateCount += 1;
    }
    qualifiedCountAfterEachQuiz.push(qualifiedPrivateCount);
  });

  return qualifiedCountAfterEachQuiz;
}

const resultsByQuizCount: number[][] = Array.from({ length: PREMIUM_QUIZ_IDS.length }, () => []);

for (let u = 0; u < SIMULATED_USERS; u++) {
  const order = shuffle([...PREMIUM_QUIZ_IDS]);
  const perQuiz = simulateOneUser(order);
  perQuiz.forEach((qualifiedCount, index) => {
    resultsByQuizCount[index].push(qualifiedCount);
  });
}

console.log(`=== Relic pacing simulation: ${SIMULATED_USERS} simulated users, uniform-random answers, randomized quiz order ===\n`);
console.log('Quizzes | avg qualified Private signals | % with base (>=1) | % with base+color (>=2) | % with COMPLETE Relic (>=3)');
resultsByQuizCount.forEach((counts, index) => {
  const n = counts.length;
  const avg = counts.reduce((a, b) => a + b, 0) / n;
  const pctAtLeast = (k: number) => ((counts.filter((c) => c >= k).length / n) * 100).toFixed(1);
  console.log(`   ${index + 1}    |            ${avg.toFixed(2)}             |       ${pctAtLeast(1)}%        |         ${pctAtLeast(2)}%          |          ${pctAtLeast(3)}%`);
});

const after5 = resultsByQuizCount[4];
const after7 = resultsByQuizCount[6];
console.log(`\n% with COMPLETE Relic after 5 quizzes: ${((after5.filter((c) => c >= 3).length / after5.length) * 100).toFixed(1)}%`);
console.log(`% with COMPLETE Relic after 7 quizzes (all premium quizzes): ${((after7.filter((c) => c >= 3).length / after7.length) * 100).toFixed(1)}%`);

// Pathological pattern check: users who picked the SAME letter every time (e.g. always "A") --
// a common real behavior (speed-running a quiz) worth checking doesn't trap people locked.
function simulateSameLetterUser(quizOrder: readonly string[], letterIndex: number): number {
  const evidenceByDimension = new Map<PersonalityDimensionId, DimensionEvidence[]>();
  quizOrder.forEach((quizId) => {
    const definition = getQuizDefinition(quizId)!;
    const answers: PersonalityAnswerEvidence[] = definition.questions.map((question) => {
      const choice = question.choices[Math.min(letterIndex, question.choices.length - 1)];
      return { question: question.prompt, category: definition.category, chosenAnswer: choice.label, effects: choice.traitSignals ?? [] };
    });
    const awards = applyPermanentQuizAwards(answers, 'private');
    awards.forEach((effect) => {
      const list = evidenceByDimension.get(effect.dimension) ?? [];
      list.push({ dimension: effect.dimension, question: '', category: '', chosenAnswer: '', effect: effect.value, normalized: 0, date: new Date().toISOString() });
      evidenceByDimension.set(effect.dimension, list);
    });
  });
  let qualified = 0;
  for (const [dimension, evidence] of evidenceByDimension) {
    if (isPrivateDimension(dimension) && resolveActiveBoardPole(evidence).qualifies) qualified += 1;
  }
  return qualified;
}

console.log('\n=== Pathological pattern: always picking the same letter (A/B/C/D) across all 7 quizzes ===');
['A', 'B', 'C', 'D'].forEach((letter, index) => {
  const qualified = simulateSameLetterUser(PREMIUM_QUIZ_IDS, index);
  console.log(`  Always "${letter}": ${qualified} qualified Private signals after all 7 quizzes -> ${qualified >= 3 ? 'COMPLETE Relic' : qualified >= 1 ? 'PARTIAL Relic' : 'still locked'}`);
});
