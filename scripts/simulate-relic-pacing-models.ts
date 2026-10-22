// Build 11 Relic calibration pass — DIAGNOSIS ONLY. Compares qualification models against the
// SAME 2000-user deterministic simulation, using the real 7 premium quizzes' real traitSignals.
// Nothing here changes the shipped (locked) WITHIN_QUIZ_QUALIFICATION_THRESHOLD or ranked-award
// magnitudes in src/data/quiz-personality-awards.ts — this file reimplements the qualification
// step with a configurable threshold/rule purely for comparison, so the locked production code
// is never touched by this analysis pass.
//
// Run with: npx tsx scripts/simulate-relic-pacing-models.ts
import { getQuizDefinition } from '../src/data/quizzes';
import {
  isPrivateDimension,
  resolveActiveBoardPole,
  ACTIVE_BOARD_QUALIFICATION_THRESHOLD,
  type DimensionEvidence,
  type PersonalityDimensionId,
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

// --- deterministic PRNG, isolated per simulation run so model comparisons use the SAME
// underlying random draws (fair comparison, not different luck across models) ---
function makeRand(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type RawItem = { dimension: PersonalityDimensionId; value: number };
type ChosenAnswer = { items: RawItem[] };

// Mirrors resolveWithinQuizQualification's exact pole-resolution math (same tie-break rules)
// but with a PARAMETERIZED threshold and an optional relative-confidence rule, for comparison
// only -- see quiz-personality-awards.ts for the real, unchanged, locked implementation.
function resolveQuizQualification(
  answers: ChosenAnswer[],
  opts: { absoluteThreshold: number; relativeMargin?: number },
): { dimension: PersonalityDimensionId; winningSign: 1 | -1; winningRawPoints: number }[] {
  const byDimension = new Map<PersonalityDimensionId, { order: number; value: number }[]>();
  answers.forEach((answer, order) => {
    answer.items.forEach((item) => {
      const list = byDimension.get(item.dimension) ?? [];
      list.push({ order, value: item.value });
      byDimension.set(item.dimension, list);
    });
  });

  const resolved: { dimension: PersonalityDimensionId; winningSign: 1 | -1; winningRawPoints: number; firstReachedOrder: number }[] = [];
  byDimension.forEach((items, dimension) => {
    const bySign = (sign: 1 | -1) => items.filter((i) => Math.sign(i.value) === sign);
    const totalOf = (xs: { value: number }[]) => xs.reduce((s, i) => s + Math.abs(i.value), 0);
    const pos = bySign(1), neg = bySign(-1);
    const posTotal = totalOf(pos), negTotal = totalOf(neg);
    let winningSign: 1 | -1;
    if (posTotal !== negTotal) winningSign = posTotal > negTotal ? 1 : -1;
    else if (posTotal === 0) winningSign = 1;
    else winningSign = (pos[0]?.order ?? Infinity) <= (neg[0]?.order ?? Infinity) ? 1 : -1;
    const winningRawPoints = winningSign === 1 ? posTotal : negTotal;
    const losingRawPoints = winningSign === 1 ? negTotal : posTotal;

    let qualifies = winningRawPoints >= opts.absoluteThreshold;
    if (opts.relativeMargin !== undefined) {
      // Relative-confidence variant: qualifies if it clears a MODEST absolute floor (2) AND
      // dominates its own opposite pole by the given margin (e.g. winning >= losing + margin) --
      // a genuinely "clearly dominant" pole, never a trait that's merely the least-contested of
      // a wash. Floor of 2 (not 1) so a single lightweight +1/-1 answer still can never qualify
      // alone, preserving the Bible's "one answer alone can never qualify a trait" rule.
      qualifies = winningRawPoints >= 2 && (winningRawPoints - losingRawPoints) >= opts.relativeMargin;
    }

    if (qualifies) {
      resolved.push({ dimension, winningSign, winningRawPoints, firstReachedOrder: Math.min(...items.map((i) => i.order)) });
    }
  });

  resolved.sort((a, b) => b.winningRawPoints - a.winningRawPoints || a.firstReachedOrder - b.firstReachedOrder);
  return resolved.map(({ dimension, winningSign, winningRawPoints }) => ({ dimension, winningSign, winningRawPoints }));
}

const RANK_MAGNITUDES = [3, 2, 1];
function awardsFor(qualified: { dimension: PersonalityDimensionId; winningSign: 1 | -1 }[]): { dimension: PersonalityDimensionId; value: number }[] {
  return qualified.slice(0, 3).map((t, i) => ({ dimension: t.dimension, value: t.winningSign * RANK_MAGNITUDES[i] }));
}

function answerQuizRandomly(quizId: string, rand: () => number): ChosenAnswer[] {
  const definition = getQuizDefinition(quizId)!;
  return definition.questions.map((q) => {
    const choice = q.choices[Math.floor(rand() * q.choices.length)];
    return { items: (choice.traitSignals ?? []).filter((e) => isPrivateDimension(e.dimension)) };
  });
}

// --- Correlated/personality-consistent respondent model -----------------------------------
// Each simulated user draws ONE persistent "lean" value in [-1, 1] per Private dimension once,
// up front (their underlying tendency on that trait, same across every quiz they take -- a
// real person doesn't re-roll their personality per quiz). When answering a question, each
// choice gets a fit score = sum over its traitSignals of lean[dim] * sign(value) * |value| --
// how well that choice's signals align with the user's own leans, weighted by signal strength.
// Choices are then sampled via softmax(fit / temperature), so a strongly-leaning user picks
// on-persona choices MOST of the time but not always (still noisy/human), and a question whose
// choices don't touch any dimension the user leans on resolves close to uniform-random (fit
// scores all ~0) -- this never forces qualification, it just makes answers internally
// consistent the way a real respondent's would be.
const TEMPERATURE = 0.8;
function buildPersona(rand: () => number): Map<PersonalityDimensionId, number> {
  const persona = new Map<PersonalityDimensionId, number>();
  // Only need leans for dimensions that actually appear in the library -- computed lazily below
  // via a shared pool, but simplest is to just draw a lean for every Private dimension id.
  const ALL_PRIVATE: PersonalityDimensionId[] = [
    'accountability_defensiveness', 'reflective_reactive', 'self_secure_reassurance', 'boundary_holding_approval_seeking',
    'vulnerable_armored', 'repair_punishing', 'tactful_blunt', 'duty_first_self_preserving', 'supportive_challenging',
    'gives_freely_keeps_score', 'perspective_taking_self_referencing', 'initiating_responsive',
  ];
  ALL_PRIVATE.forEach((dim) => persona.set(dim, rand() * 2 - 1));
  return persona;
}

function answerQuizAsPersona(quizId: string, persona: Map<PersonalityDimensionId, number>, rand: () => number): ChosenAnswer[] {
  const definition = getQuizDefinition(quizId)!;
  return definition.questions.map((q) => {
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
    for (let i = 0; i < fits.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = fits[i]; break; }
    }
    return { items: chosen.signals };
  });
}

function runCrossQuizSimulation(
  label: string,
  answerFn: (quizId: string, rand: () => number, persona?: Map<PersonalityDimensionId, number>) => ChosenAnswer[],
  qualOpts: { absoluteThreshold: number; relativeMargin?: number },
  seed: number,
  correlated: boolean,
) {
  const rand = makeRand(seed);
  const resultsByQuizCount: number[][] = Array.from({ length: PREMIUM_QUIZ_IDS.length }, () => []);

  for (let u = 0; u < SIMULATED_USERS; u++) {
    const order = shuffle([...PREMIUM_QUIZ_IDS], rand);
    const persona = correlated ? buildPersona(rand) : undefined;
    const evidenceByDimension = new Map<PersonalityDimensionId, DimensionEvidence[]>();
    order.forEach((quizId, quizIndex) => {
      const answers = correlated ? answerQuizAsPersona(quizId, persona!, rand) : answerFn(quizId, rand);
      const qualified = resolveQuizQualification(answers, qualOpts).filter((t) => isPrivateDimension(t.dimension));
      const awards = awardsFor(qualified);
      awards.forEach((effect) => {
        const list = evidenceByDimension.get(effect.dimension) ?? [];
        list.push({ dimension: effect.dimension, question: '', category: '', chosenAnswer: '', effect: effect.value as any, normalized: 0, date: new Date(2026, 0, quizIndex + 1).toISOString() });
        evidenceByDimension.set(effect.dimension, list);
      });
      let qualifiedCount = 0;
      for (const [dim, ev] of evidenceByDimension) {
        if (isPrivateDimension(dim) && resolveActiveBoardPole(ev).qualifies) qualifiedCount += 1;
      }
      resultsByQuizCount[quizIndex].push(qualifiedCount);
    });
  }

  console.log(`\n=== ${label} (active-board threshold unchanged at ${ACTIVE_BOARD_QUALIFICATION_THRESHOLD}) ===`);
  console.log('Quizzes | avg qualified | % base(>=1) | % base+color(>=2) | % COMPLETE(>=3)');
  resultsByQuizCount.forEach((counts, index) => {
    const n = counts.length;
    const avg = counts.reduce((a, b) => a + b, 0) / n;
    const pct = (k: number) => ((counts.filter((c) => c >= k).length / n) * 100).toFixed(1);
    console.log(`   ${index + 1}    |     ${avg.toFixed(2)}     |    ${pct(1)}%    |      ${pct(2)}%        |     ${pct(3)}%`);
  });
  const after3 = resultsByQuizCount[2], after5 = resultsByQuizCount[4], after7 = resultsByQuizCount[6];
  const completePct = (arr: number[]) => ((arr.filter((c) => c >= 3).length / arr.length) * 100).toFixed(1);
  console.log(`Complete-Relic %: after 3 quizzes=${completePct(after3)}%  after 5=${completePct(after5)}%  after 7=${completePct(after7)}%`);
  return { after3: completePct(after3), after5: completePct(after5), after7: completePct(after7) };
}

const SEED = 777;

console.log('#'.repeat(100));
console.log('MODEL COMPARISON — uniform-random answers');
console.log('#'.repeat(100));
runCrossQuizSimulation('MODEL A (current, locked): within-quiz threshold=3, ranked 3/2/1', answerQuizRandomly, { absoluteThreshold: 3 }, SEED, false);
runCrossQuizSimulation('MODEL B: within-quiz threshold=2, ranked 3/2/1 (comparison only)', answerQuizRandomly, { absoluteThreshold: 2 }, SEED, false);
runCrossQuizSimulation('MODEL C: relative-confidence (floor=2, must lead opposite pole by >=2), ranked 3/2/1', answerQuizRandomly, { absoluteThreshold: 2, relativeMargin: 2 }, SEED, false);

console.log('\n' + '#'.repeat(100));
console.log('MODEL A UNDER CORRELATED / PERSONALITY-CONSISTENT RESPONDENTS');
console.log('#'.repeat(100));
runCrossQuizSimulation('MODEL A, correlated personas (softmax temp=0.8)', answerQuizRandomly, { absoluteThreshold: 3 }, SEED, true);

console.log('\n' + '#'.repeat(100));
console.log('MODEL B UNDER CORRELATED / PERSONALITY-CONSISTENT RESPONDENTS');
console.log('#'.repeat(100));
runCrossQuizSimulation('MODEL B, correlated personas (threshold=2)', answerQuizRandomly, { absoluteThreshold: 2 }, SEED, true);
