// Build 11 Relic calibration — semantic evidence-mapping proposal. DIAGNOSIS/PROPOSAL ONLY: does
// NOT modify any production quiz file. Applies the proposed traitSignal additions/adjustments
// in-memory as a patch layer over the real quiz definitions, then reruns the exact same locked
// model (within-quiz threshold=3, ranked 3/2/1 award) used in production — so this measures
// "what would happen if these specific, semantically-justified changes were approved," never a
// different qualification rule.
//
// Run with: npx tsx scripts/simulate-proposed-evidence-mapping.ts
import { getQuizDefinition, QUIZ_REGISTRY } from '../src/data/quizzes';
import { isPrivateDimension, resolveActiveBoardPole, type DimensionEvidence, type PersonalityAnswerEvidence, type PersonalityDimensionId } from '../src/data/personality';
import { applyPermanentQuizAwards } from '../src/data/quiz-personality-awards';

// Individual answer-level traitSignals are intentionally restricted to -2|-1|1|2 (never 3 --
// only the computed rank-#1 ranked quiz award is ever ±3, never an authored per-answer value,
// per the Bible's RAW EVIDENCE SCALE rule). Typed narrowly here so TypeScript itself enforces
// that none of these proposals accidentally author a ±3 signal directly.
type Patch = { quizId: string; questionId: string; choiceId: string; dimension: PersonalityDimensionId; value: -2 | -1 | 1 | 2; mode: 'add' | 'adjust' };

// The proposed changes from the semantic audit (see the report) -- every one of these targets
// an EXISTING approved answer choice; none change prompt/label/resultWeights/gates/scoring.
const PROPOSED_PATCHES: Patch[] = [
  // --- Hidden You, Wrong (currently 100% zero-award; structurally incapable today) ---
  { quizId: 'hidden-you-wrong', questionId: 'q1', choiceId: 'c', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q2', choiceId: 'a', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q2', choiceId: 'b', dimension: 'vulnerable_armored', value: 1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q2', choiceId: 'd', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q5', choiceId: 'b', dimension: 'vulnerable_armored', value: -2, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q5', choiceId: 'c', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q6', choiceId: 'b', dimension: 'self_secure_reassurance', value: 1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q7', choiceId: 'c', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q9', choiceId: 'a', dimension: 'vulnerable_armored', value: -2, mode: 'add' },
  { quizId: 'hidden-you-wrong', questionId: 'q9', choiceId: 'b', dimension: 'vulnerable_armored', value: -2, mode: 'add' },
  // q9d tactful_blunt removed -- see report: this + hidden-you-wrong's removed q5a tactful_blunt
  // addition created a genuine real-world contradiction with style-vibe-intimidating's own
  // tactful_blunt signal for at least one real account; both were the weakest-justified
  // additions in this set (directness/thoroughness, not clearly BLUNT specifically) so they were
  // dropped on their own semantic merits, not to force a particular Relic outcome.

  // --- How Bad Do You Actually Want It? (currently 63.9% zero-award) ---
  { quizId: 'career-ambition-how-bad', questionId: 'q1', choiceId: 'b', dimension: 'boundary_holding_approval_seeking', value: -2, mode: 'adjust' },
  { quizId: 'career-ambition-how-bad', questionId: 'q1', choiceId: 'd', dimension: 'boundary_holding_approval_seeking', value: -2, mode: 'adjust' },
  { quizId: 'career-ambition-how-bad', questionId: 'q7', choiceId: 'd', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'career-ambition-how-bad', questionId: 'q10', choiceId: 'c', dimension: 'reflective_reactive', value: 2, mode: 'adjust' },

  // --- How Much Trouble Are You After Dark? (currently 53.3% zero-award) ---
  { quizId: 'private-private-trouble', questionId: 'q1', choiceId: 'a', dimension: 'initiating_responsive', value: -1, mode: 'add' },
  { quizId: 'private-private-trouble', questionId: 'q4', choiceId: 'b', dimension: 'vulnerable_armored', value: 1, mode: 'add' },
  { quizId: 'private-private-trouble', questionId: 'q4', choiceId: 'd', dimension: 'tactful_blunt', value: -1, mode: 'add' },
  { quizId: 'private-private-trouble', questionId: 'q5', choiceId: 'd', dimension: 'tactful_blunt', value: -2, mode: 'add' },
  { quizId: 'private-private-trouble', questionId: 'q9', choiceId: 'a', dimension: 'self_secure_reassurance', value: -1, mode: 'add' },
  { quizId: 'private-private-trouble', questionId: 'q9', choiceId: 'd', dimension: 'initiating_responsive', value: 1, mode: 'add' },

  // --- Is Your Vibe Actually Intimidating? (currently 54.4% zero-award) ---
  { quizId: 'style-vibe-intimidating', questionId: 'q5', choiceId: 'a', dimension: 'vulnerable_armored', value: -1, mode: 'add' },
  { quizId: 'style-vibe-intimidating', questionId: 'q5', choiceId: 'b', dimension: 'vulnerable_armored', value: 1, mode: 'add' },
  { quizId: 'style-vibe-intimidating', questionId: 'q10', choiceId: 'b', dimension: 'self_secure_reassurance', value: 1, mode: 'add' },
  { quizId: 'style-vibe-intimidating', questionId: 'q6', choiceId: 'c', dimension: 'tactful_blunt', value: 1, mode: 'add' },
  { quizId: 'style-vibe-intimidating', questionId: 'q8', choiceId: 'a', dimension: 'repair_punishing', value: 1, mode: 'add' },
  { quizId: 'style-vibe-intimidating', questionId: 'q8', choiceId: 'c', dimension: 'repair_punishing', value: -1, mode: 'add' },
];

// Build a patched copy of every question's choices -> traitSignals (deep clone, never mutates
// the real imported definitions).
function getPatchedQuestions(quizId: string) {
  const def = getQuizDefinition(quizId)!;
  return def.questions.map((q) => ({
    ...q,
    choices: q.choices.map((c) => {
      const applicable = PROPOSED_PATCHES.filter((p) => p.quizId === quizId && p.questionId === q.id && p.choiceId === c.id);
      if (applicable.length === 0) return c;
      let signals = [...(c.traitSignals ?? [])];
      for (const patch of applicable) {
        if (patch.mode === 'adjust') {
          signals = signals.map((s) => (s.dimension === patch.dimension ? { ...s, value: patch.value } : s));
        } else {
          signals = [...signals, { dimension: patch.dimension, value: patch.value }];
        }
      }
      return { ...c, traitSignals: signals };
    }),
  }));
}

const PREMIUM_QUIZ_IDS = Object.keys(QUIZ_REGISTRY).filter((id) => getQuizDefinition(id)?.access === 'private');

function makeRand(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(a: T[], rand: () => number): T[] { const c=[...a]; for(let i=c.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[c[i],c[j]]=[c[j],c[i]];} return c; }

const N = 2000;

console.log('='.repeat(100));
console.log('PER-QUIZ ZERO-AWARD RATE: BEFORE vs AFTER proposed mapping (threshold=3, locked 3/2/1, uniform-random)');
console.log('='.repeat(100));
for (const quizId of ['hidden-you-wrong', 'career-ambition-how-bad', 'private-private-trouble', 'style-vibe-intimidating']) {
  const category = getQuizDefinition(quizId)!.category;
  const patchedQuestions = getPatchedQuestions(quizId);
  const rand = makeRand(99);
  let zeroBefore = 0, zeroAfter = 0;
  for (let i = 0; i < N; i++) {
    const beforeAnswers: PersonalityAnswerEvidence[] = getQuizDefinition(quizId)!.questions.map((q) => {
      const idx = Math.floor(rand() * q.choices.length);
      return { question: q.prompt, category, chosenAnswer: '', effects: q.choices[idx].traitSignals ?? [] };
    });
    // NOTE: re-seed per quiz so before/after use identical random picks by index.
    zeroBefore += applyPermanentQuizAwards(beforeAnswers, 'private').filter((e) => isPrivateDimension(e.dimension)).length === 0 ? 1 : 0;
  }
  const rand2 = makeRand(99);
  for (let i = 0; i < N; i++) {
    const afterAnswers: PersonalityAnswerEvidence[] = patchedQuestions.map((q) => {
      const idx = Math.floor(rand2() * q.choices.length);
      return { question: q.prompt, category, chosenAnswer: '', effects: q.choices[idx].traitSignals ?? [] };
    });
    zeroAfter += applyPermanentQuizAwards(afterAnswers, 'private').filter((e) => isPrivateDimension(e.dimension)).length === 0 ? 1 : 0;
  }
  console.log(`${quizId}: zero-award BEFORE=${((zeroBefore / N) * 100).toFixed(1)}%  ->  AFTER=${((zeroAfter / N) * 100).toFixed(1)}%`);
}

function answerQuizRandomly(quizId: string, rand: () => number, patched: boolean): PersonalityAnswerEvidence[] {
  const def = getQuizDefinition(quizId)!;
  const questions = patched ? getPatchedQuestions(quizId) : def.questions;
  return questions.map((q) => {
    const choice = q.choices[Math.floor(rand() * q.choices.length)];
    return { question: q.prompt, category: def.category, chosenAnswer: choice.label, effects: choice.traitSignals ?? [] };
  });
}

function buildPersona(rand: () => number): Map<PersonalityDimensionId, number> {
  const persona = new Map<PersonalityDimensionId, number>();
  const ALL_PRIVATE: PersonalityDimensionId[] = [
    'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance', 'boundary_holding_approval_seeking',
    'vulnerable_armored', 'repair_punishing', 'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
    'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive',
  ];
  ALL_PRIVATE.forEach((dim) => persona.set(dim, rand() * 2 - 1));
  return persona;
}
const TEMPERATURE = 0.8;
function answerQuizAsPersona(quizId: string, persona: Map<PersonalityDimensionId, number>, rand: () => number, patched: boolean): PersonalityAnswerEvidence[] {
  const def = getQuizDefinition(quizId)!;
  const questions = patched ? getPatchedQuestions(quizId) : def.questions;
  return questions.map((q) => {
    const fits = q.choices.map((choice) => {
      const signals = (choice.traitSignals ?? []).filter((e) => isPrivateDimension(e.dimension));
      const fit = signals.reduce((sum, e) => sum + (persona.get(e.dimension) ?? 0) * Math.sign(e.value) * Math.abs(e.value), 0);
      return { choice, fit, signals };
    });
    const maxFit = Math.max(...fits.map((f) => f.fit));
    const weights = fits.map((f) => Math.exp((f.fit - maxFit) / TEMPERATURE));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    let chosen = fits[fits.length - 1];
    for (let i = 0; i < fits.length; i++) { r -= weights[i]; if (r <= 0) { chosen = fits[i]; break; } }
    return { question: q.prompt, category: def.category, chosenAnswer: chosen.choice.label, effects: chosen.choice.traitSignals ?? [] };
  });
}

function runCrossQuiz(label: string, patched: boolean, correlated: boolean, seed: number) {
  const rand = makeRand(seed);
  const resultsByQuizCount: number[][] = Array.from({ length: PREMIUM_QUIZ_IDS.length }, () => []);
  for (let u = 0; u < N; u++) {
    const order = shuffle([...PREMIUM_QUIZ_IDS], rand);
    const persona = correlated ? buildPersona(rand) : undefined;
    const evidenceByDimension = new Map<PersonalityDimensionId, DimensionEvidence[]>();
    order.forEach((quizId, idx) => {
      const answers = correlated ? answerQuizAsPersona(quizId, persona!, rand, patched) : answerQuizRandomly(quizId, rand, patched);
      const awards = applyPermanentQuizAwards(answers, 'private');
      awards.forEach((effect) => {
        const list = evidenceByDimension.get(effect.dimension) ?? [];
        list.push({ dimension: effect.dimension, question: '', category: '', chosenAnswer: '', effect: effect.value, normalized: 0, date: new Date(2026, 0, idx + 1).toISOString() });
        evidenceByDimension.set(effect.dimension, list);
      });
      let qualifiedCount = 0;
      for (const [dim, ev] of evidenceByDimension) if (isPrivateDimension(dim) && resolveActiveBoardPole(ev).qualifies) qualifiedCount += 1;
      resultsByQuizCount[idx].push(qualifiedCount);
    });
  }
  console.log(`\n=== ${label} ===`);
  const after3 = resultsByQuizCount[2], after5 = resultsByQuizCount[4], after7 = resultsByQuizCount[6];
  const completePct = (arr: number[]) => ((arr.filter((c) => c >= 3).length / arr.length) * 100).toFixed(1);
  console.log(`Complete-Relic %: after 3=${completePct(after3)}%  after 5=${completePct(after5)}%  after 7=${completePct(after7)}%`);
}

console.log('\n' + '='.repeat(100));
console.log('CROSS-QUIZ SIMULATION: locked model (threshold=3, ranked 3/2/1) -- BEFORE vs AFTER proposed mapping');
console.log('='.repeat(100));
runCrossQuiz('BEFORE (current production mappings), uniform-random', false, false, 777);
runCrossQuiz('AFTER (proposed mappings), uniform-random', true, false, 777);
runCrossQuiz('BEFORE (current production mappings), correlated personas', false, true, 777);
runCrossQuiz('AFTER (proposed mappings), correlated personas', true, true, 777);

console.log('\n' + '='.repeat(100));
console.log('LIBRARY-WIDE DIMENSION COVERAGE: BEFORE vs AFTER');
console.log('='.repeat(100));
function coverage(patched: boolean) {
  const freq = new Map<PersonalityDimensionId, number>();
  for (const quizId of PREMIUM_QUIZ_IDS) {
    const questions = patched ? getPatchedQuestions(quizId) : getQuizDefinition(quizId)!.questions;
    questions.forEach((q) => q.choices.forEach((c) => (c.traitSignals ?? []).forEach((e) => {
      if (isPrivateDimension(e.dimension)) freq.set(e.dimension, (freq.get(e.dimension) ?? 0) + 1);
    })));
  }
  return freq;
}
const before = coverage(false), after = coverage(true);
const allDims: PersonalityDimensionId[] = [
  'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance', 'boundary_holding_approval_seeking',
  'vulnerable_armored', 'repair_punishing', 'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
  'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive',
];
allDims.sort((a, b) => (after.get(b) ?? 0) - (after.get(a) ?? 0)).forEach((dim) => {
  console.log(`  ${dim}: ${before.get(dim) ?? 0}  ->  ${after.get(dim) ?? 0}`);
});
