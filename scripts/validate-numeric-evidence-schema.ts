// Validates the Build 22 numeric evidence schema's core invariants with synthetic fixtures --
// independent of the real-data dry runs in backfill-quiz-pole-evidence.ts (which prove the
// real content behaves correctly; this proves the ALGORITHM is correct on constructed edge
// cases, including the exact case that caused the confirmed collision bug).
//
// This is a pure TypeScript simulation of what submit_quiz_completion's plpgsql body does --
// there is no local/staging Postgres available in this environment (no Docker/Podman) to
// execute the real SQL function, so this is the strongest verification available here. It is
// NOT a substitute for running the real migration against a staging database before
// production use -- flagged explicitly in the Phase 2 report as a remaining blocker.
//
// Run with: npx tsx scripts/validate-numeric-evidence-schema.ts

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

type Award = { choiceKey: string; traitId: number; points: number };
type Answer = { userId: string; quizId: string; questionKey: string; choiceKey: string; completedAt: string };
type EvidenceRow = { answerKey: string; traitId: number; pointsEarned: number; maxAvailable: number };

// Simulates submit_quiz_completion's per-question loop: ON CONFLICT (user, quiz, question) DO
// NOTHING for user_quiz_answers, then trait evidence only for rows that actually inserted.
function simulateSubmission(
  answersInOrder: Answer[],
  awardsByQuestion: Map<string, Award[]>,
): { creditedAnswerKeys: Set<string>; evidence: EvidenceRow[] } {
  const creditedAnswerKeys = new Set<string>(); // (user, quiz, question) already first-answered
  const evidence: EvidenceRow[] = [];

  for (const answer of answersInOrder) {
    const answerKey = `${answer.userId}::${answer.quizId}::${answer.questionKey}`;
    if (creditedAnswerKeys.has(answerKey)) {
      continue; // ON CONFLICT DO NOTHING -- retake, zero evidence, exactly like the real RPC.
    }
    creditedAnswerKeys.add(answerKey);

    const awards = awardsByQuestion.get(`${answer.quizId}::${answer.questionKey}`) ?? [];
    const maxByTrait = new Map<number, number>();
    const earnedByTrait = new Map<number, number>();
    for (const award of awards) {
      maxByTrait.set(award.traitId, Math.max(maxByTrait.get(award.traitId) ?? 0, award.points));
      if (award.choiceKey === answer.choiceKey) {
        earnedByTrait.set(award.traitId, Math.max(earnedByTrait.get(award.traitId) ?? 0, award.points));
      }
    }
    for (const [traitId, maxAvailable] of maxByTrait) {
      evidence.push({ answerKey, traitId, pointsEarned: earnedByTrait.get(traitId) ?? 0, maxAvailable });
    }
  }
  return { creditedAnswerKeys, evidence };
}

// ------------------------------------------------------------------------------------------
// THE confirmed bug this schema fixes: two DIFFERENT questions of one quiz completion both
// award the same trait. Under the old (user, source_type, source_id, pole_id) key this
// collapsed to one row; under (source_answer_id, trait_id) it must never collide.
// ------------------------------------------------------------------------------------------
{
  const awardsByQuestion = new Map<string, Award[]>([
    ['petty::q1', [{ choiceKey: 'a', traitId: 5, points: 2 }]],
    ['petty::q2', [{ choiceKey: 'a', traitId: 5, points: 3 }]], // SAME trait_id=5, different question
  ]);
  const answers: Answer[] = [
    { userId: 'u1', quizId: 'petty', questionKey: 'q1', choiceKey: 'a', completedAt: '2026-01-01T00:00:00Z' },
    { userId: 'u1', quizId: 'petty', questionKey: 'q2', choiceKey: 'a', completedAt: '2026-01-01T00:00:00Z' },
  ];
  const { evidence } = simulateSubmission(answers, awardsByQuestion);
  const keys = evidence.map((e) => `${e.answerKey}::${e.traitId}`);
  assert(evidence.length === 2, `two questions awarding the same trait produce TWO evidence rows, not one collapsed row (got ${evidence.length})`);
  assert(new Set(keys).size === keys.length, 'the two rows have distinct (answer, trait) keys -- no collision');
  assert(evidence[0].pointsEarned === 2 && evidence[1].pointsEarned === 3, "both questions' real, independent point values are preserved -- neither overwrites the other");
}

// ------------------------------------------------------------------------------------------
// First-completion permanence: a retake of an already-answered question earns nothing,
// regardless of what it would have scored.
// ------------------------------------------------------------------------------------------
{
  const awardsByQuestion = new Map<string, Award[]>([
    ['crisis::q1', [
      { choiceKey: 'a', traitId: 10, points: 1 },
      { choiceKey: 'b', traitId: 10, points: 3 },
    ]],
  ]);
  const answers: Answer[] = [
    { userId: 'u1', quizId: 'crisis', questionKey: 'q1', choiceKey: 'a', completedAt: '2026-01-01T00:00:00Z' }, // first completion, weak choice
    { userId: 'u1', quizId: 'crisis', questionKey: 'q1', choiceKey: 'b', completedAt: '2026-01-05T00:00:00Z' }, // retake, deliberately stronger choice
  ];
  const { evidence } = simulateSubmission(answers, awardsByQuestion);
  assert(evidence.length === 1, `only the FIRST completion's answer earns evidence -- the retake earns nothing (got ${evidence.length} rows)`);
  assert(evidence[0].pointsEarned === 1, `the preserved evidence reflects the ORIGINAL (weaker) answer, not the retake's stronger one (got ${evidence[0].pointsEarned})`);
}

// ------------------------------------------------------------------------------------------
// Idempotency: replaying the exact same submission sequence twice produces the identical
// end state, never a duplicate or a second credit.
// ------------------------------------------------------------------------------------------
{
  const awardsByQuestion = new Map<string, Award[]>([['dating::q1', [{ choiceKey: 'a', traitId: 3, points: 2 }]]]);
  const answers: Answer[] = [{ userId: 'u1', quizId: 'dating', questionKey: 'q1', choiceKey: 'a', completedAt: '2026-01-01T00:00:00Z' }];
  const first = simulateSubmission(answers, awardsByQuestion);
  const second = simulateSubmission([...answers, ...answers], awardsByQuestion); // same answer submitted twice
  assert(first.evidence.length === 1, 'single submission produces exactly one evidence row');
  assert(second.evidence.length === 1, 'submitting the identical answer twice still produces exactly one evidence row -- the second attempt is a true no-op');
  assert(JSON.stringify(first.evidence) === JSON.stringify(second.evidence), 'replaying the same input twice produces byte-identical evidence, not a duplicate');
}

// ------------------------------------------------------------------------------------------
// Zero-earned-opportunity preservation: a question offering a trait the user did NOT choose
// still produces a real row (earned=0), the denominator data V2 ranking depends on.
// ------------------------------------------------------------------------------------------
{
  const awardsByQuestion = new Map<string, Award[]>([
    ['ick::q1', [
      { choiceKey: 'a', traitId: 7, points: 2 },
      { choiceKey: 'b', traitId: 8, points: 2 },
    ]],
  ]);
  const answers: Answer[] = [{ userId: 'u1', quizId: 'ick', questionKey: 'q1', choiceKey: 'a', completedAt: '2026-01-01T00:00:00Z' }];
  const { evidence } = simulateSubmission(answers, awardsByQuestion);
  const traitEight = evidence.find((e) => e.traitId === 8);
  assert(traitEight !== undefined && traitEight.pointsEarned === 0 && traitEight.maxAvailable === 2, `trait 8 (offered by the unchosen choice 'b') gets a real earned=0 row, never omitted (got ${JSON.stringify(traitEight)})`);
  assert(evidence.every((e) => e.pointsEarned <= e.maxAvailable), 'every row satisfies points_earned <= max_available');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL numeric evidence schema invariant (collision-impossibility, first-completion permanence, idempotency, zero-earned preservation) VALIDATION CHECKS PASSED.');
console.log('\nNOTE: this validates the ALGORITHM via a TypeScript simulation. The real submit_quiz_completion SQL function has not been executed against any database -- no local/staging Postgres is available in this environment (confirmed: no Docker/Podman). This is a documented remaining blocker, not a substitute for real integration testing.');
