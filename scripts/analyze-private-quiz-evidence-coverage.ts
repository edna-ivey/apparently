// Build 11 Relic calibration pass — DIAGNOSIS ONLY, no rule changes. Audits the 7 premium
// Apparently Private quizzes' real per-choice traitSignals (not hand-read, not guessed) to
// understand WHY a completed quiz can produce zero qualifying Private trait under the current
// (locked, unchanged by this script) within-quiz 3-raw-point threshold.
//
// Run with: npx tsx scripts/analyze-private-quiz-evidence-coverage.ts
import { getQuizDefinition } from '../src/data/quizzes';
import { resolveWithinQuizQualification, WITHIN_QUIZ_QUALIFICATION_THRESHOLD } from '../src/data/quiz-personality-awards';
import { isPrivateDimension, isCoreDimension, PERSONALITY_DIMENSIONS, type PersonalityAnswerEvidence, type PersonalityDimensionId } from '../src/data/personality';

const PREMIUM_QUIZZES = [
  { id: 'career-ambition-how-bad', title: 'How Bad Do You Actually Want It?' },
  { id: 'career-ambition-proving', title: "Are You Actually Proving Something, Or Did You Just Want The Life?" },
  { id: 'hidden-you-wrong', title: 'What Do People Keep Getting Wrong About You?' },
  { id: 'life-match-dream-life', title: 'Is Your Dream Life Actually Your Dream Life?' },
  { id: 'love-soulmates-ready', title: 'Are You Actually Ready for Love?' },
  { id: 'private-private-trouble', title: 'How Much Trouble Are You After Dark?' },
  { id: 'style-vibe-intimidating', title: 'Is Your Vibe Actually Intimidating?' },
] as const;

let seed = 1337;
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const N = 2000;

console.log('='.repeat(100));
console.log('PER-QUIZ STRUCTURAL + SIMULATION AUDIT');
console.log('='.repeat(100));

type QuizAudit = {
  id: string;
  title: string;
  questionCount: number;
  privateDimFrequency: Map<PersonalityDimensionId, number>; // # of CHOICES (across all questions) referencing this Private dim
  privateDimRange: Map<PersonalityDimensionId, { minPositive: number; maxPositive: number; minNegative: number; maxNegative: number }>;
  coreOnlyQuestionCount: number;
  dimensionCancellationQuestions: Map<PersonalityDimensionId, number>; // # questions where a Private dim has BOTH + and - choices available
  zeroPrivateAwardRate: number;
  atLeast1Rate: number;
  atLeast2Rate: number;
  atLeast3Rate: number;
};

const allAudits: QuizAudit[] = [];
const libraryWideFrequency = new Map<PersonalityDimensionId, number>();

for (const { id, title } of PREMIUM_QUIZZES) {
  const definition = getQuizDefinition(id)!;
  const privateDimFrequency = new Map<PersonalityDimensionId, number>();
  const perDimPerQuestionSigns = new Map<PersonalityDimensionId, Set<1 | -1>[]>();
  let coreOnlyQuestionCount = 0;

  definition.questions.forEach((question) => {
    let questionHasPrivate = false;
    const signsThisQuestion = new Map<PersonalityDimensionId, Set<1 | -1>>();
    question.choices.forEach((choice) => {
      (choice.traitSignals ?? []).forEach((effect) => {
        if (isPrivateDimension(effect.dimension)) {
          questionHasPrivate = true;
          privateDimFrequency.set(effect.dimension, (privateDimFrequency.get(effect.dimension) ?? 0) + 1);
          libraryWideFrequency.set(effect.dimension, (libraryWideFrequency.get(effect.dimension) ?? 0) + 1);
          const set = signsThisQuestion.get(effect.dimension) ?? new Set<1 | -1>();
          set.add(Math.sign(effect.value) as 1 | -1);
          signsThisQuestion.set(effect.dimension, set);
        }
      });
    });
    if (!questionHasPrivate) coreOnlyQuestionCount += 1;
    signsThisQuestion.forEach((set, dim) => {
      const arr = perDimPerQuestionSigns.get(dim) ?? [];
      arr.push(set);
      perDimPerQuestionSigns.set(dim, arr);
    });
  });

  // Possible raw evidence range per dimension: the max a pole could reach if a hypothetical
  // user picked, on every question, whichever choice gives that pole its biggest push (and the
  // min if they always avoided/opposed it). This is a per-question greedy bound, not a real
  // "optimal path" search, but since each question contributes independently to a dimension's
  // total (no cross-question interaction), greedy-per-question IS the true max/min.
  const privateDimRange = new Map<PersonalityDimensionId, { minPositive: number; maxPositive: number; minNegative: number; maxNegative: number }>();
  definition.questions.forEach((question) => {
    const perDimThisQuestion = new Map<PersonalityDimensionId, { pos: number; neg: number }>();
    question.choices.forEach((choice) => {
      (choice.traitSignals ?? []).forEach((effect) => {
        if (!isPrivateDimension(effect.dimension)) return;
        const entry = perDimThisQuestion.get(effect.dimension) ?? { pos: 0, neg: 0 };
        if (effect.value > 0) entry.pos = Math.max(entry.pos, effect.value);
        else entry.neg = Math.max(entry.neg, Math.abs(effect.value));
        perDimThisQuestion.set(effect.dimension, entry);
      });
    });
    perDimThisQuestion.forEach((v, dim) => {
      const r = privateDimRange.get(dim) ?? { minPositive: 0, maxPositive: 0, minNegative: 0, maxNegative: 0 };
      r.maxPositive += v.pos;
      r.maxNegative += v.neg;
      privateDimRange.set(dim, r);
    });
  });

  const dimensionCancellationQuestions = new Map<PersonalityDimensionId, number>();
  perDimPerQuestionSigns.forEach((arr, dim) => {
    // A dimension "fragments" across a quiz if, looking across the questions that reference it,
    // SOME questions only offer its positive pole and others only offer its negative pole (an
    // answer pattern can therefore easily split evidence between both poles instead of building
    // one winning pole) -- count questions offering the pole opposite to the dimension's
    // library-wide more common pole as a rough proxy, reported as "# questions touching this
    // dimension where only one pole is available" vs "# questions where both poles are
    // available on different choices (genuine within-question tension)".
    const bothPoleQuestions = arr.filter((set) => set.size === 1).length; // single-pole-per-question is normal; just report raw question count touching this dim
    dimensionCancellationQuestions.set(dim, arr.length);
  });

  // Simulation: N uniform-random completions of THIS quiz alone.
  let zero = 0, atLeast1 = 0, atLeast2 = 0, atLeast3 = 0;
  for (let i = 0; i < N; i++) {
    const answers: PersonalityAnswerEvidence[] = definition.questions.map((q) => {
      const choice = q.choices[Math.floor(rand() * q.choices.length)];
      return { question: q.prompt, category: definition.category, chosenAnswer: choice.label, effects: choice.traitSignals ?? [] };
    });
    const qualified = resolveWithinQuizQualification(answers).filter((t) => isPrivateDimension(t.dimension));
    if (qualified.length === 0) zero += 1;
    if (qualified.length >= 1) atLeast1 += 1;
    if (qualified.length >= 2) atLeast2 += 1;
    if (qualified.length >= 3) atLeast3 += 1;
  }

  allAudits.push({
    id,
    title,
    questionCount: definition.questions.length,
    privateDimFrequency,
    privateDimRange,
    coreOnlyQuestionCount,
    dimensionCancellationQuestions,
    zeroPrivateAwardRate: (zero / N) * 100,
    atLeast1Rate: (atLeast1 / N) * 100,
    atLeast2Rate: (atLeast2 / N) * 100,
    atLeast3Rate: (atLeast3 / N) * 100,
  });
}

for (const audit of allAudits) {
  console.log(`\n--- ${audit.id} ("${audit.title}") ---`);
  console.log(`  questions: ${audit.questionCount}`);
  console.log(`  Core-only questions (no Private signal on ANY choice): ${audit.coreOnlyQuestionCount}`);
  console.log(`  distinct Private dimensions touched: ${audit.privateDimFrequency.size}`);
  console.log('  Private dimension frequency (# choices across the quiz referencing it) + max possible raw points toward either pole:');
  [...audit.privateDimFrequency.entries()].sort((a, b) => b[1] - a[1]).forEach(([dim, freq]) => {
    const range = audit.privateDimRange.get(dim)!;
    console.log(`    ${dim}: ${freq} choice(s) across ${audit.dimensionCancellationQuestions.get(dim)} question(s) | max toward positive pole=${range.maxPositive}, max toward negative pole=${range.maxNegative}`);
  });
  console.log(`  Simulated (${N} uniform-random completions of THIS quiz alone):`);
  console.log(`    0 qualifying Private traits: ${audit.zeroPrivateAwardRate.toFixed(1)}%`);
  console.log(`    >=1 qualifying: ${audit.atLeast1Rate.toFixed(1)}%  |  >=2 qualifying: ${audit.atLeast2Rate.toFixed(1)}%  |  >=3 qualifying: ${audit.atLeast3Rate.toFixed(1)}%`);
}

console.log('\n' + '='.repeat(100));
console.log('LIBRARY-WIDE PRIVATE DIMENSION COVERAGE (all 7 premium quizzes combined)');
console.log('='.repeat(100));
const allPrivateDims = PERSONALITY_DIMENSIONS.filter((d) => d.type === 'private').map((d) => d.id);
const sorted = allPrivateDims.map((dim) => ({ dim, freq: libraryWideFrequency.get(dim) ?? 0 })).sort((a, b) => b.freq - a.freq);
sorted.forEach(({ dim, freq }) => {
  const quizzesTouching = allAudits.filter((a) => a.privateDimFrequency.has(dim)).length;
  console.log(`  ${dim}: ${freq} total choice-references across ${quizzesTouching}/7 quizzes`);
});

const totalPrivateChoiceRefs = sorted.reduce((s, x) => s + x.freq, 0);
console.log(`\nTotal Private choice-references across the library: ${totalPrivateChoiceRefs}`);
console.log(`Average per dimension if evenly spread across all 12 Private dimensions: ${(totalPrivateChoiceRefs / 12).toFixed(1)}`);
console.log(`Dimensions with ZERO coverage anywhere in the 7-quiz library: ${sorted.filter((x) => x.freq === 0).map((x) => x.dim).join(', ') || '(none)'}`);
