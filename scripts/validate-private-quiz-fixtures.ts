// Reachability + adversarial-gate validation for the seven approved premium Apparently Private
// quizzes. Run with:
//
//   npx tsx scripts/validate-private-quiz-fixtures.ts
//
// No test framework is configured in this repo (see package.json) — this is a plain script that
// asserts, logs every check, and exits non-zero if anything failed, exactly like
// scripts/validate-keep-you-around.ts and scripts/validate-be-so-serious.ts already do.
//
// Nothing here re-implements scoring. Every verdict asserted below is produced by the REAL
// production engine (computeQuizResult / scoreArchetypeQuiz in src/data/quizzes/scoring.ts) on
// the REAL registered QuizDefinitions, reached through QUIZ_REGISTRY the same way the runner
// screen (src/app/quiz/[quizId].tsx) reaches them. Expected results are transcribed from the
// approved spec docs under docs/private-quizzes/, never computed here.
//
// Two separate things are covered:
//
//   1. REACHABILITY — the 28 approved "reachability fixtures" (4 per quiz) from the five
//      approved spec docs. Each is an exact answer sequence the spec says must deterministically
//      produce one named result; each is asserted by RESULT ID, not by title text.
//
//   2. ADVERSARIAL GATES — for every gated/high-confidence result, prove the gate is real and
//      not decorative: find an answer sequence that satisfies every other scoring signal (the
//      gated result holds the strict highest RAW total) while deliberately failing the approved
//      gate requirement, then assert the real engine does NOT award that result.
//
//      The candidate answer sequence for each adversarial case is found by exhaustive search
//      over all 4^10 sequences. That search is a SEARCH ONLY — it reads the quiz definition's
//      own resultWeights/resultGates to decide which sequences are interesting to try, and then
//      hands each chosen sequence to the real engine, which alone decides the verdict being
//      asserted. Raw totals quoted in the output come from scoreArchetypeQuiz's own `totals`.
//
// Deliberately does NOT import anything from src/app or src/services — scoring.ts and its
// personality.ts/quiz-personality-awards.ts dependencies are React-Native-free, so this whole
// script runs under plain tsx. (The same reason validate-keep-you-around.ts avoids
// personality-service.ts, whose import chain reaches src/lib/supabase.ts.)

import { QUIZ_REGISTRY, getQuizDefinition } from '../src/data/quizzes/index';
import { computeQuizResult, scoreArchetypeQuiz } from '../src/data/quizzes/scoring';
import type { ArchetypeQuizDefinition } from '../src/data/quizzes/types';

let failures = 0;
let passes = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    passes += 1;
    console.log(`OK: ${message}`);
  }
};

// Answer sequences are written exactly as the spec docs write them ("1B, 2C, 3C, ...") so a
// reviewer can diff this file against the approved doc line by line without translating.
const parseAnswers = (sequence: string): Record<string, string> => {
  const answers: Record<string, string> = {};
  for (const token of sequence.split(',').map((part) => part.trim()).filter(Boolean)) {
    const match = /^(\d{1,2})([A-E])$/.exec(token);
    if (!match) {
      throw new Error(`Unparseable fixture token "${token}" in "${sequence}"`);
    }
    answers[`q${Number(match[1])}`] = match[2].toLowerCase();
  }
  return answers;
};

const archetypeQuiz = (quizId: string): ArchetypeQuizDefinition => {
  const definition = getQuizDefinition(quizId);
  if (!definition || definition.scoringType !== 'archetype') {
    throw new Error(`${quizId} is not a registered archetype quiz`);
  }
  return definition;
};

// The seven approved premium Private quizzes, with the spec doc each one's content is locked in.
const PREMIUM_QUIZZES: { quizId: string; doc: string }[] = [
  { quizId: 'love-soulmates-ready', doc: 'APPROVED_PRIVATE_QUIZZES.md §3' },
  { quizId: 'career-ambition-how-bad', doc: 'APPROVED_PRIVATE_QUIZZES.md §1' },
  { quizId: 'career-ambition-proving', doc: 'APPROVED_PRIVATE_QUIZZES.md §2' },
  { quizId: 'hidden-you-wrong', doc: 'APPROVED_HIDDEN_YOU.md' },
  { quizId: 'life-match-dream-life', doc: 'APPROVED_LIFE_MATCH.md' },
  { quizId: 'style-vibe-intimidating', doc: 'APPROVED_STYLE_VIBE.md' },
  { quizId: 'private-private-trouble', doc: 'APPROVED_PRIVATE_PRIVATE.md' },
];

// ============================================================================================
// 1. STRUCTURAL VALIDATION
// ============================================================================================

console.log('\n--- 1. STRUCTURAL ---');

for (const { quizId } of PREMIUM_QUIZZES) {
  assert(Object.prototype.hasOwnProperty.call(QUIZ_REGISTRY, quizId), `${quizId} is registered in QUIZ_REGISTRY`);
  const definition = archetypeQuiz(quizId);

  assert(definition.access === 'private', `${quizId} access is 'private' (paywalled by the runner's access gate)`);
  assert(definition.questions.length === 10, `${quizId} has exactly 10 questions`);
  assert(
    definition.questions.every((question, index) => question.id === `q${index + 1}`),
    `${quizId} question ids are q1..q10 in order`,
  );
  assert(
    definition.questions.every((question) => question.choices.map((choice) => choice.id).join('') === 'abcd'),
    `${quizId} every question has choices a,b,c,d in order`,
  );
  assert(definition.archetypes.length === 4, `${quizId} has exactly 4 results`);
  assert(
    definition.archetypes.every((archetype) => archetype.structuredRead !== undefined),
    `${quizId} every result carries a structuredRead (THE READ / THE CALL-OUT / THE COST / TRY THIS)`,
  );
  assert(
    definition.archetypes.every((archetype) => archetype.structuredRead!.theRead.length > 0 && archetype.structuredRead!.theCallOut.length > 0),
    `${quizId} every result has a non-empty THE READ and THE CALL-OUT`,
  );

  const resultIds = new Set(definition.archetypes.map((archetype) => archetype.id));
  assert(
    definition.questions.every((question) =>
      question.choices.every((choice) => Object.keys(choice.resultWeights ?? {}).every((key) => resultIds.has(key))),
    ),
    `${quizId} every resultWeights key references a real result id`,
  );
  assert(
    definition.questions.every((question) => question.choices.every((choice) => Object.keys(choice.resultWeights ?? {}).length > 0)),
    `${quizId} every answer carries at least one result weight`,
  );
  assert(
    (definition.tieFallbackOrder ?? []).every((id) => resultIds.has(id)) &&
      (definition.tieFallbackOrder ?? []).length === definition.archetypes.length,
    `${quizId} tieFallbackOrder covers every result id`,
  );
  assert(
    (definition.highSignalQuestionIds ?? []).every((id) => definition.questions.some((question) => question.id === id)) &&
      (definition.highSignalQuestionIds ?? []).length > 0,
    `${quizId} highSignalQuestionIds reference real questions`,
  );
  assert(definition.enableCloseSecond !== true, `${quizId} close-second is disabled (spec: do not enable a blended result)`);

  // A gate whose required answers don't exist, or don't actually award the gated result any
  // weight, would silently never be satisfiable — the gate would block its result forever.
  for (const [gatedId, gate] of Object.entries(definition.resultGates ?? {})) {
    assert(resultIds.has(gatedId), `${quizId} gate key "${gatedId}" is a real result id`);
    const requiredKeys = [...(gate.requiredAnyOf ?? []).flat(), ...(gate.requiredGroups ?? []).flatMap((group) => group.answers)];
    const allResolve = requiredKeys.every((key) => {
      const [questionId, choiceId] = key.split('-');
      const choice = definition.questions.find((question) => question.id === questionId)?.choices.find((candidate) => candidate.id === choiceId);
      return (choice?.resultWeights?.[gatedId] ?? 0) > 0;
    });
    assert(allResolve, `${quizId} every answer named in the "${gatedId}" gate exists and awards ${gatedId} positive weight`);
  }
}

// The two free previews must stay free — a premium gate accidentally applied to them would
// paywall the only Private content a non-subscriber can reach.
for (const previewId of ['keep-you-around', 'be-so-serious']) {
  const definition = getQuizDefinition(previewId);
  assert(definition !== null, `${previewId} (free preview) is registered`);
  assert(definition?.access === 'private-preview', `${previewId} access is 'private-preview' (not paywalled)`);
}

// ============================================================================================
// 2. APPROVED REACHABILITY FIXTURES (28)
// ============================================================================================
//
// Transcribed verbatim from each quiz's "Reachability fixtures" / "Approved reachability
// fixtures" section. `label` is the doc's own name for the fixture; `resultId` is the internal
// id the doc's own result-id list assigns to it.

type Fixture = { quizId: string; label: string; resultId: string; sequence: string };

const FIXTURES: Fixture[] = [
  // docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md §1 "HOW BAD DO YOU ACTUALLY WANT IT?"
  { quizId: 'career-ambition-how-bad', label: 'YOU WANT IT FOR REAL', resultId: 'want-it-for-real', sequence: '1B, 2A, 3A, 4C, 5A, 6A, 7A, 8A, 9A, 10A' },
  { quizId: 'career-ambition-how-bad', label: 'YOU WANT IT, BUT COMFORT KEEPS WINNING', resultId: 'comfort-keeps-winning', sequence: '1A, 2C, 3C, 4D, 5B, 6D, 7D, 8A, 9C, 10B' },
  { quizId: 'career-ambition-how-bad', label: 'YOU TALK A GREAT GAME', resultId: 'talk-great-game', sequence: '1D, 2D, 3B, 4B, 5D, 6C, 7C, 8B, 9C, 10C' },
  { quizId: 'career-ambition-how-bad', label: 'LAZY. THERE, WE SAID IT.', resultId: 'lazy-there-we-said-it', sequence: '1A, 2D, 3D, 4A, 5C, 6D, 7C, 8D, 9D, 10D' },

  // docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md §2 "ARE YOU AMBITIOUS... OR PROVING SOMETHING?"
  { quizId: 'career-ambition-proving', label: 'CLAP', resultId: 'nobody-clapped', sequence: '1A, 2A, 3D, 4A, 5A, 6D, 7A, 8A, 9B, 10A' },
  { quizId: 'career-ambition-proving', label: 'SEEN', resultId: 'want-it-seen', sequence: '1B, 2B, 3C, 4C, 5B, 6C, 7B, 8B, 9C, 10B' },
  { quizId: 'career-ambition-proving', label: 'PROVE', resultId: 'proving-something', sequence: '1C, 2C, 3D, 4B, 5D, 6C, 7C, 8C, 9D, 10C' },
  { quizId: 'career-ambition-proving', label: 'PERFORM', resultId: 'performing-for', sequence: '1D, 2A, 3C, 4C, 5C, 6C, 7A, 8D, 9C, 10D' },

  // docs/private-quizzes/APPROVED_PRIVATE_QUIZZES.md §3 "ARE YOU ACTUALLY READY FOR LOVE?"
  { quizId: 'love-soulmates-ready', label: 'OPEN', resultId: 'open', sequence: '1B, 2C, 3C, 4B, 5D, 6C, 7B, 8B, 9D, 10D' },
  { quizId: 'love-soulmates-ready', label: 'TERMS', resultId: 'terms', sequence: '1D, 2D, 3B, 4D, 5A, 6D, 7D, 8C, 9A, 10C' },
  { quizId: 'love-soulmates-ready', label: 'WALLS', resultId: 'walls', sequence: '1A, 2B, 3D, 4A, 5C, 6A, 7C, 8A, 9C, 10A' },
  { quizId: 'love-soulmates-ready', label: 'BAE', resultId: 'bae', sequence: '1C, 2A, 3A, 4C, 5B, 6B, 7A, 8D, 9B, 10B' },

  // docs/private-quizzes/APPROVED_HIDDEN_YOU.md
  { quizId: 'hidden-you-wrong', label: 'HIDDEN_FEELING', resultId: 'hidden-feeling', sequence: '1A, 2D, 3B, 4B, 5C, 6A, 7D, 8A, 9B, 10A' },
  { quizId: 'hidden-you-wrong', label: 'FACE', resultId: 'face', sequence: '1B, 2C, 3C, 4D, 5B, 6B, 7A, 8C, 9C, 10C' },
  { quizId: 'hidden-you-wrong', label: 'FINE', resultId: 'fine', sequence: '1C, 2A, 3D, 4C, 5D, 6D, 7C, 8D, 9A, 10B' },
  { quizId: 'hidden-you-wrong', label: 'ATTENTION', resultId: 'attention', sequence: '1D, 2B, 3A, 4A, 5A, 6C, 7A, 8B, 9D, 10D' },

  // docs/private-quizzes/APPROVED_LIFE_MATCH.md
  { quizId: 'life-match-dream-life', label: 'FIT', resultId: 'fit', sequence: '1A, 2B, 3A, 4A, 5B, 6C, 7A, 8A, 9D, 10A' },
  { quizId: 'life-match-dream-life', label: 'LIFESTYLE', resultId: 'lifestyle', sequence: '1B, 2A, 3C, 4B, 5C, 6B, 7C, 8B, 9B, 10B' },
  { quizId: 'life-match-dream-life', label: 'RELIEF', resultId: 'relief', sequence: '1C, 2D, 3A, 4D, 5A, 6C, 7B, 8D, 9C, 10D' },
  { quizId: 'life-match-dream-life', label: 'BORROWED', resultId: 'borrowed', sequence: '1D, 2A, 3D, 4C, 5C, 6D, 7D, 8C, 9A, 10C' },

  // docs/private-quizzes/APPROVED_STYLE_VIBE.md
  { quizId: 'style-vibe-intimidating', label: 'APPROACHABLE', resultId: 'approachable', sequence: '1D, 2B, 3C, 4A, 5A, 6C, 7D, 8D, 9C, 10B' },
  { quizId: 'style-vibe-intimidating', label: 'FACE', resultId: 'face', sequence: '1C, 2D, 3A, 4B, 5B, 6A, 7A, 8A, 9A, 10A' },
  { quizId: 'style-vibe-intimidating', label: 'EVALUATIVE', resultId: 'evaluative', sequence: '1B, 2A, 3B, 4D, 5D, 6D, 7B, 8B, 9B, 10C' },
  { quizId: 'style-vibe-intimidating', label: 'INTIMIDATING', resultId: 'intimidating', sequence: '1B, 2C, 3D, 4C, 5C, 6B, 7C, 8C, 9D, 10D' },

  // docs/private-quizzes/APPROVED_PRIVATE_PRIVATE.md
  { quizId: 'private-private-trouble', label: 'HALO', resultId: 'halo', sequence: '1A, 2A, 3D, 4C, 5A, 6B, 7A, 8A, 9C, 10A' },
  { quizId: 'private-private-trouble', label: 'TENSION', resultId: 'tension', sequence: '1D, 2B, 3A, 4A, 5C, 6A, 7C, 8B, 9A, 10B' },
  { quizId: 'private-private-trouble', label: 'UNLOCKED', resultId: 'unlocked', sequence: '1B, 2C, 3B, 4B, 5B, 6C, 7B, 8C, 9B, 10C' },
  { quizId: 'private-private-trouble', label: 'BAD_DECISION', resultId: 'bad_decision', sequence: '1C, 2D, 3C, 4D, 5D, 6D, 7D, 8D, 9D, 10D' },
];

console.log('\n--- 2. APPROVED REACHABILITY FIXTURES ---');

assert(FIXTURES.length === 28, `exactly 28 approved reachability fixtures are under test (found ${FIXTURES.length})`);
for (const { quizId } of PREMIUM_QUIZZES) {
  const count = FIXTURES.filter((fixture) => fixture.quizId === quizId).length;
  assert(count === 4, `${quizId} contributes 4 reachability fixtures (found ${count})`);
}

let reachabilityPass = 0;
let reachabilityFail = 0;
const reachabilityFailures: string[] = [];

for (const fixture of FIXTURES) {
  const definition = archetypeQuiz(fixture.quizId);
  const answers = parseAnswers(fixture.sequence);

  // Every fixture must name a result the quiz actually has — a typo'd spec id would otherwise
  // read as an engine failure.
  const targetExists = definition.archetypes.some((archetype) => archetype.id === fixture.resultId);
  assert(targetExists, `${fixture.quizId} / ${fixture.label}: result id "${fixture.resultId}" exists on the definition`);

  // Answers are passed through the REAL production entry point the runner screen uses.
  const result = computeQuizResult(definition, answers);
  const hit = result.resultId === fixture.resultId;
  if (hit) {
    reachabilityPass += 1;
  } else {
    reachabilityFail += 1;
    const { totals } = scoreArchetypeQuiz(definition, answers);
    reachabilityFailures.push(
      `${fixture.quizId} / ${fixture.label}: expected "${fixture.resultId}", engine returned "${result.resultId}" — raw totals ${JSON.stringify(totals)}`,
    );
  }
  assert(hit, `${fixture.quizId} / ${fixture.label} (${fixture.sequence}) -> ${fixture.resultId}`);

  // A fixture must also be a single, fully-answered run that never produces a blended result.
  assert(Object.keys(answers).length === 10, `${fixture.quizId} / ${fixture.label}: fixture answers all 10 questions`);
  assert(result.secondaryResult === null, `${fixture.quizId} / ${fixture.label}: no close-second result is produced`);
}

// ============================================================================================
// 3. ADVERSARIAL GATE TESTS
// ============================================================================================
//
// For each gated result: search every possible answer sequence for the WORST CASE for the gate
// — one where the gated result holds the strict highest RAW total (so nothing but the gate
// could stop it) while failing its approved gate requirement. Then assert the real engine
// refuses to award it, and assert the matching control case (gate satisfied) DOES award it, so
// the test can never pass vacuously because the result is simply unreachable.

// Mirrors eligibleArchetypeIds' own definition of a "signal" (see scoring.ts): a question whose
// chosen answer awards the gated result positive weight, keyed "<questionId>-<choiceId>". Used
// ONLY to steer the search below toward interesting sequences; never to decide a verdict.
const gateSatisfied = (definition: ArchetypeQuizDefinition, resultId: string, answers: Record<string, string>): boolean => {
  const gate = definition.resultGates?.[resultId];
  if (!gate) return true;
  const signals = definition.questions
    .filter((question) => {
      const choice = question.choices.find((candidate) => candidate.id === answers[question.id]);
      return (choice?.resultWeights?.[resultId] ?? 0) > 0;
    })
    .map((question) => `${question.id}-${answers[question.id]}`);
  if (signals.length < gate.minSignals) return false;
  if (!(gate.requiredAnyOf ?? []).every((group) => group.some((key) => signals.includes(key)))) return false;
  if (!(gate.requiredGroups ?? []).every((group) => group.answers.filter((key) => signals.includes(key)).length >= group.min)) return false;
  return true;
};

type SearchHit = { answers: Record<string, string>; margin: number; total: number };

// Exhaustive sweep of all 4^10 answer sequences for one quiz, collecting three cases for one
// gated result:
//   blocked     — largest strict raw-total lead among sequences that FAIL the gate (the worst
//                 case for the gate: nothing but the gate could stop this result).
//   control     — largest strict raw-total lead among sequences that SATISFY the gate (proves
//                 the gate is not a permanent lockout).
//   bestFailing — the strongest gate-failing sequence by the gated result's own raw total, then
//                 by margin. Used when `blocked` is null, i.e. when the arithmetic alone makes
//                 it impossible to be the raw winner while failing the gate.
const searchGateCases = (
  definition: ArchetypeQuizDefinition,
  resultId: string,
): { blocked: SearchHit | null; control: SearchHit | null; bestFailing: SearchHit | null } => {
  const questions = definition.questions;
  const resultIdList = definition.archetypes.map((archetype) => archetype.id);
  const choiceIds = questions.map((question) => question.choices.map((choice) => choice.id));
  const weightVectors = questions.map((question) =>
    question.choices.map((choice) => resultIdList.map((id) => choice.resultWeights?.[id] ?? 0)),
  );
  const targetIndex = resultIdList.indexOf(resultId);

  let blocked: SearchHit | null = null;
  let control: SearchHit | null = null;
  let bestFailing: SearchHit | null = null;

  const picks = new Array<number>(questions.length).fill(0);
  const totals = new Array<number>(resultIdList.length).fill(0);

  const visit = (depth: number): void => {
    if (depth === questions.length) {
      const targetTotal = totals[targetIndex];
      let best = -Infinity;
      for (let i = 0; i < totals.length; i += 1) {
        if (i !== targetIndex && totals[i] > best) best = totals[i];
      }
      const margin = targetTotal - best;
      const materialize = (): Record<string, string> => {
        const answers: Record<string, string> = {};
        questions.forEach((question, index) => {
          answers[question.id] = choiceIds[index][picks[index]];
        });
        return answers;
      };
      if (margin > 0) {
        const answers = materialize();
        if (gateSatisfied(definition, resultId, answers)) {
          if (!control || margin > control.margin) control = { answers, margin, total: targetTotal };
        } else if (!blocked || margin > blocked.margin) {
          blocked = { answers, margin, total: targetTotal };
        }
      }
      if (!bestFailing || targetTotal > bestFailing.total || (targetTotal === bestFailing.total && margin > bestFailing.margin)) {
        const answers = materialize();
        if (!gateSatisfied(definition, resultId, answers)) {
          bestFailing = { answers, margin, total: targetTotal };
        }
      }
      return;
    }
    const vectors = weightVectors[depth];
    for (let choice = 0; choice < vectors.length; choice += 1) {
      picks[depth] = choice;
      const vector = vectors[choice];
      for (let i = 0; i < totals.length; i += 1) totals[i] += vector[i];
      visit(depth + 1);
      for (let i = 0; i < totals.length; i += 1) totals[i] -= vector[i];
    }
  };

  visit(0);
  return { blocked, control, bestFailing };
};

const describe = (answers: Record<string, string>): string =>
  Object.keys(answers)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((questionId) => `${questionId.slice(1)}${answers[questionId].toUpperCase()}`)
    .join(', ');

// The explicitly named gated/high-confidence results under test. `name` is the doc's stylized
// name; `resultId` is the quiz file's actual id.
const GATED_RESULTS: { name: string; quizId: string; resultId: string }[] = [
  { name: 'BAE', quizId: 'love-soulmates-ready', resultId: 'bae' },
  { name: 'WALLS', quizId: 'love-soulmates-ready', resultId: 'walls' },
  { name: 'LAZY', quizId: 'career-ambition-how-bad', resultId: 'lazy-there-we-said-it' },
  { name: 'PERFORMING', quizId: 'career-ambition-proving', resultId: 'performing-for' },
  { name: 'ATTENTION', quizId: 'hidden-you-wrong', resultId: 'attention' },
  { name: 'FINE', quizId: 'hidden-you-wrong', resultId: 'fine' },
  { name: 'BORROWED', quizId: 'life-match-dream-life', resultId: 'borrowed' },
  { name: 'RELIEF', quizId: 'life-match-dream-life', resultId: 'relief' },
  { name: 'INTIMIDATING', quizId: 'style-vibe-intimidating', resultId: 'intimidating' },
  { name: 'FACE (Style & Vibe confidence rule)', quizId: 'style-vibe-intimidating', resultId: 'face' },
  { name: 'BAD DECISION', quizId: 'private-private-trouble', resultId: 'bad_decision' },
  { name: 'UNLOCKED', quizId: 'private-private-trouble', resultId: 'unlocked' },
];

console.log('\n--- 3. ADVERSARIAL GATE TESTS ---');

type GateReport = { name: string; resultId: string; verdict: string; detail: string };
const gateReports: GateReport[] = [];

for (const gated of GATED_RESULTS) {
  const definition = archetypeQuiz(gated.quizId);
  const gate = definition.resultGates?.[gated.resultId];
  assert(gate !== undefined, `${gated.name}: a resultGate is configured for "${gated.resultId}"`);
  if (!gate) continue;

  const { blocked, control, bestFailing } = searchGateCases(definition, gated.resultId);

  // Control: the gated result must still be winnable when its gate IS satisfied. Without this,
  // "the gate blocked it" would be indistinguishable from "this result can never be awarded".
  assert(control !== null, `${gated.name}: at least one answer sequence satisfies the gate AND wins on raw score (gate is not a permanent lockout)`);
  if (control) {
    const controlResult = computeQuizResult(definition, control.answers);
    assert(
      controlResult.resultId === gated.resultId,
      `${gated.name}: control sequence (gate satisfied, raw lead +${control.margin}) -> "${controlResult.resultId}"`,
    );
  }

  if (blocked) {
    const blockedResult = computeQuizResult(definition, blocked.answers);
    const { totals } = scoreArchetypeQuiz(definition, blocked.answers);
    const didBlock = blockedResult.resultId !== gated.resultId;
    assert(
      didBlock,
      `${gated.name}: adversarial sequence (${describe(blocked.answers)}) holds the strict top raw total ` +
        `(${gated.resultId}=${totals[gated.resultId]}, lead +${blocked.margin}) but FAILS its gate -> engine awarded ` +
        `"${blockedResult.resultId}" instead of "${gated.resultId}"`,
    );
    gateReports.push({
      name: gated.name,
      resultId: gated.resultId,
      verdict: didBlock ? 'GATE BLOCKS (raw winner suppressed)' : 'GATE DID NOT BLOCK',
      detail: `adversarial ${describe(blocked.answers)} | raw ${gated.resultId}=${totals[gated.resultId]} lead +${blocked.margin} -> "${blockedResult.resultId}"`,
    });
  } else {
    // No sequence can make this result the strict raw winner while failing its gate — the
    // arithmetic needed to win at all already implies the gate's requirements. That is a
    // STRONGER property than "the gate blocks a raw winner", but it means the raw-max
    // adversarial form has no witness, so assert the best available gate-failing case instead:
    // the sequence that maximizes the gated result's own raw total while still failing the gate
    // must not award it.
    assert(bestFailing !== null, `${gated.name}: at least one answer sequence fails the gate (the gate is satisfiable AND falsifiable)`);
    if (!bestFailing) continue;

    const failingResult = computeQuizResult(definition, bestFailing.answers);
    const { totals } = scoreArchetypeQuiz(definition, bestFailing.answers);
    const didBlock = failingResult.resultId !== gated.resultId;
    assert(
      didBlock,
      `${gated.name}: strongest gate-failing sequence (${describe(bestFailing.answers)}) scores ` +
        `${gated.resultId}=${totals[gated.resultId]} (margin ${bestFailing.margin >= 0 ? '+' : ''}${bestFailing.margin}) ` +
        `-> engine awarded "${failingResult.resultId}" instead of "${gated.resultId}"`,
    );
    gateReports.push({
      name: gated.name,
      resultId: gated.resultId,
      verdict: didBlock
        ? 'GATE BLOCKS (no sequence can even reach raw-winner status while failing the gate — stronger than required)'
        : 'GATE DID NOT BLOCK',
      detail:
        `strongest gate-failing ${describe(bestFailing.answers)} | raw ${gated.resultId}=${totals[gated.resultId]} ` +
        `margin ${bestFailing.margin >= 0 ? '+' : ''}${bestFailing.margin} -> "${failingResult.resultId}"`,
    });
  }
}

// ============================================================================================
// 4. SUMMARY
// ============================================================================================

console.log('\n--- 4. SUMMARY ---');
console.log(`Reachability fixtures: ${reachabilityPass}/${FIXTURES.length} passed, ${reachabilityFail} failed`);
for (const line of reachabilityFailures) {
  console.log(`  FIXTURE FAILURE: ${line}`);
}
console.log('\nAdversarial gate results:');
for (const report of gateReports) {
  console.log(`  ${report.name} (${report.resultId}): ${report.verdict}`);
  console.log(`      ${report.detail}`);
}
console.log(`\nAssertions: ${passes} passed, ${failures} failed`);

if (failures > 0) {
  console.error(`\nvalidate-private-quiz-fixtures: ${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nvalidate-private-quiz-fixtures: all checks passed.');
