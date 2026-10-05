// Build 11 Relic calibration pass — answers the CONTENT QUESTION: for users who finish all 7
// premium quizzes still incomplete under the CURRENT locked model (threshold=3), how close are
// they? If most are sitting at 2/3 signals, one more quiz plausibly tips most of them over. If
// most are sitting at 0-1, more content alone won't fix it -- the evidence-extraction mechanics
// would still be the bottleneck. DIAGNOSIS ONLY, no rule changes.
//
// Run with: npx tsx scripts/analyze-content-question.ts
import { getQuizDefinition } from '../src/data/quizzes';
import { applyPermanentQuizAwards } from '../src/data/quiz-personality-awards';
import { isPrivateDimension, resolveActiveBoardPole, type DimensionEvidence, type PersonalityAnswerEvidence, type PersonalityDimensionId } from '../src/data/personality';

const PREMIUM_QUIZ_IDS = [
  'career-ambition-how-bad', 'career-ambition-proving', 'hidden-you-wrong', 'life-match-dream-life',
  'love-soulmates-ready', 'private-private-trouble', 'style-vibe-intimidating',
] as const;
const N = 2000;
let seed = 2024;
function rand(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(a: T[]): T[] { const c=[...a]; for(let i=c.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[c[i],c[j]]=[c[j],c[i]];} return c; }

const finalCounts: number[] = [];
for (let u = 0; u < N; u++) {
  const order = shuffle([...PREMIUM_QUIZ_IDS]);
  const evidenceByDimension = new Map<PersonalityDimensionId, DimensionEvidence[]>();
  order.forEach((quizId, idx) => {
    const definition = getQuizDefinition(quizId)!;
    const answers: PersonalityAnswerEvidence[] = definition.questions.map((q) => {
      const choice = q.choices[Math.floor(rand() * q.choices.length)];
      return { question: q.prompt, category: definition.category, chosenAnswer: choice.label, effects: choice.traitSignals ?? [] };
    });
    const awards = applyPermanentQuizAwards(answers, 'private');
    awards.forEach((effect) => {
      const list = evidenceByDimension.get(effect.dimension) ?? [];
      list.push({ dimension: effect.dimension, question: '', category: '', chosenAnswer: '', effect: effect.value, normalized: 0, date: new Date(2026, 0, idx + 1).toISOString() });
      evidenceByDimension.set(effect.dimension, list);
    });
  });
  let qualified = 0;
  for (const [dim, ev] of evidenceByDimension) if (isPrivateDimension(dim) && resolveActiveBoardPole(ev).qualifies) qualified += 1;
  finalCounts.push(qualified);
}

console.log(`=== Distribution of qualified Private signal count AFTER ALL 7 premium quizzes (Model A, current locked, N=${N}) ===`);
for (let k = 0; k <= 6; k++) {
  const count = finalCounts.filter((c) => c === k).length;
  console.log(`  exactly ${k} qualified: ${count} users (${((count / N) * 100).toFixed(1)}%)`);
}
const incomplete = finalCounts.filter((c) => c < 3);
const oneAway = finalCounts.filter((c) => c === 2).length;
console.log(`\nIncomplete after all 7 quizzes: ${incomplete.length} users (${((incomplete.length / N) * 100).toFixed(1)}%)`);
console.log(`Of those, sitting at exactly 2/3 (one more qualifying quiz would likely complete them): ${oneAway} users (${((oneAway / incomplete.length) * 100).toFixed(1)}% of the incomplete group, ${((oneAway / N) * 100).toFixed(1)}% of all users)`);
console.log(`Sitting at 0 or 1 (would need 2+ more qualifying quizzes -- more content alone is a weaker lever for this group): ${incomplete.length - oneAway} users (${(((incomplete.length - oneAway) / incomplete.length) * 100).toFixed(1)}% of the incomplete group)`);
