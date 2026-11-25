// Generates permanent numeric quiz/question/choice identity + the numeric quiz_choice_trait_
// awards mapping -- Build 22 data-integrity correction, REWRITTEN per confirmed audit finding:
// the previous version derived question/choice identity ONLY from award mappings
// (readAllQuizPoleAwardRows), silently omitting every choice that legitimately offers zero
// personality points (a valid answer, not an error) and omitting whats-your-type questions
// q1-q5 entirely (zero Core awards by design -- the Attraction axis never contributes to
// Core, see that quiz's own coreAwards: [] on every Q1-5 choice). A user selecting any of
// those real, submittable answers would have made submit_quiz_completion reject the entire
// completion. Fixed: identity is now derived from the REAL AUTHORED CONTENT (QUIZ_REGISTRY's
// own QuizDefinition.questions/choices, and WHATS_YOUR_TYPE_QUESTIONS) -- award mappings are
// used ONLY to populate quiz_choice_trait_awards, never to decide what counts as a valid
// question/choice.
//
// EXTENDED (owner audit, 2026-11-01), item 1: "Finish server-side result integrity." The
// owner reproduced submit_quiz_completion accepting a saved result (score/percent/result_id)
// that CONTRADICTS the actual submitted answers (Petty q1-q8 all A genuinely scores 12/24 ->
// "selectively-petty", but the RPC accepted a claimed 24/100%/"mostly-unbothered" anyway) --
// the prior round's fix only checked that the claimed result_id EXISTS for the quiz, never
// that it's the result THESE answers actually produce. Closing that requires the server to
// recompute the real result from the real scoring data, which this migration had never
// stored. This generator now ALSO emits:
//   - quizzes.scoring_type / quizzes.max_score -- QuizDefinition.scoringType/maxScore verbatim.
//   - quiz_questions.position -- 1-based authored-array position (NEVER the numeric
//     question_id, which is ledger-frozen and can drift from array order by design -- the
//     tie-break algorithms below need the quiz's OWN authored order, not id order).
//   - quiz_questions.scoring_role -- 'dimensionA'/'dimensionB' for whats-your-type's own
//     dimension split (null for every other quiz).
//   - quiz_choices.flavor_score -- QuizChoice.score verbatim (numericBand only, null
//     otherwise) -- the per-choice point value numericBand quizzes sum for their total score.
//   - quiz_choice_result_weights -- QuizChoice.resultWeights verbatim (archetype/
//     dualDimension only) -- what archetype-style scoring sums per candidate result.
// All mechanically derived from the SAME real content this file already reads -- nothing
// hand-typed, nothing re-authored. See 20261101030000 for the submit_quiz_completion rewrite
// that actually uses this data to verify (not merely validate the existence of) a submitted
// result.
//
// Numbering is FROZEN (scripts/lib/canonical-quiz-order.ts) -- quiz_id by that list's fixed
// order; within each quiz, question_id/choice_id by the quiz's own AUTHORED array order
// (QuizDefinition.questions[], QuizQuestion.choices[] -- already stable source-file order,
// never re-sorted here). Appending a new quiz/question/choice gets a new id at the end;
// nothing already assigned ever changes.
//
// STAGED, NOT APPLIED. Run with: npx tsx scripts/generate-quiz-content-identity-sql.ts

declare const require: (id: string) => { writeFileSync: (p: string, c: string) => void };
declare const __dirname: string;
const { writeFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { QUIZ_REGISTRY } from '../src/data/quizzes/index';
import { WHATS_YOUR_TYPE_DEFINITION } from '../src/data/quizzes/whats-your-type-results';
import { readAllApprovedQuizPoleAwardRows, APPROVED_QUIZ_IDS_WITH_AWARDS } from './lib/quiz-pole-award-rows';
import { CANONICAL_QUIZ_ORDER } from './lib/canonical-quiz-order';
import { loadLedger, saveLedger, assignQuizId, assignQuestionId, assignChoiceId } from './lib/content-id-ledger';
import { assertContentFingerprintUnchanged, computeQuizContentFingerprint, loadContentFingerprints, saveContentFingerprints } from './lib/quiz-content-fingerprint';
import { loadDimensionIdLedger, resolveDimensionId } from './lib/dimension-id-ledger';

const escapeLiteral = (value: string): string => value.replace(/'/g, "''");

// Build 22 owner audit (2026-11-01), item 2: dimension_id must come from the SAME persisted
// ledger scripts/generate-trait-catalog-sql.ts uses -- never recomputed from
// PERSONALITY_DIMENSIONS array position. This generator had been missed in the prior round's
// otherwise-complete fix (it only covered the two backfill generators and the client-side
// app module) -- an independently simulated dimension reorder confirmed this file's award
// rows would still have silently renumbered. resolveDimensionId is READ-ONLY here: a
// dimension missing from the ledger means the ledger is stale, not a license to mint one.
const dimensionIdLedgerForAwards = loadDimensionIdLedger();
const traitIdForPoleKey = (poleKey: string): number => {
  const [dimensionKey, polarity] = poleKey.split(':');
  const dimensionId = resolveDimensionId(dimensionIdLedgerForAwards, dimensionKey);
  return polarity === 'positive' ? dimensionId * 2 - 1 : dimensionId * 2;
};

// Real content shape per quiz: ordered question keys, each with its real ordered choice keys
// -- never derived from awards. prompt/label feed the content-fingerprint guard (item 4);
// flavorScore/resultWeights/scoringRole feed the NEW server-side scoring-verification catalog
// (item 1, this round) -- id assignment itself still only ever uses the keys.
type ContentChoice = { choiceKey: string; label: string; flavorScore: number | null; resultWeights: Record<string, number> };
type ContentQuestion = { questionKey: string; prompt: string; scoringRole: 'dimensionA' | 'dimensionB' | null; choices: ContentChoice[] };
const contentByQuiz = new Map<string, ContentQuestion[]>();
const scoringTypeByQuiz = new Map<string, 'numericBand' | 'archetype' | 'dualDimension'>();
const maxScoreByQuiz = new Map<string, number | null>();
// Build 22 owner audit (2026-11-01), item 2 ("Build a reusable, versioned scoring
// configuration representation rather than hardcoding each quiz into a separate SQL
// function"): every opt-in tie-break/gate field scoring.ts's ArchetypeQuizDefinition already
// supports (highSignalQuestionIds, resultGates, tieFallbackOrder, primaryTieWeight,
// finalTieQuestionId, countPrimaryMatchesTieBreak), mirrored verbatim into one JSON blob per
// quiz. null for every numericBand/dualDimension quiz and every archetype quiz that sets none
// of these fields (every quiz before this round) -- resolve_archetype_result (see
// 20261101050000) treats a null/empty config as exactly today's unconfigured generic
// tie-break, so this is additive, not a behavior change for any existing quiz.
const scoringConfigByQuiz = new Map<string, Record<string, unknown> | null>();
// Item 3 (2026-11-01): access_tier/requires_age_verification/logical_quiz_key -- ALL derived
// directly from each quiz's own already-authored QuizDefinition.access/category/
// contentVersionOf, never a second, separately-maintained classification. This is what lets
// submit_quiz_completion/submit_quiz_result check real catalog data instead of a hardcoded
// quiz-key list -- any quiz (including a future content-version replacement) is correctly
// classified automatically, from the SAME content decision that already has to be made
// (setting .access/.category when authoring the quiz), with nothing extra to remember.
const accessTierByQuiz = new Map<string, 'free' | 'private-preview' | 'private'>();
const requiresAgeVerificationByQuiz = new Map<string, boolean>();
const logicalQuizKeyByQuiz = new Map<string, string>();

for (const [quizKey, definition] of Object.entries(QUIZ_REGISTRY)) {
  scoringTypeByQuiz.set(quizKey, definition.scoringType);
  maxScoreByQuiz.set(quizKey, definition.scoringType === 'numericBand' ? definition.maxScore : null);
  if (definition.scoringType === 'archetype') {
    const {
      highSignalQuestionIds, resultGates, tieFallbackOrder, primaryTieWeight, finalTieQuestionId, countPrimaryMatchesTieBreak,
    } = definition;
    const hasConfig = Boolean(
      (highSignalQuestionIds && highSignalQuestionIds.length > 0) || resultGates || tieFallbackOrder || primaryTieWeight !== undefined ||
      finalTieQuestionId || countPrimaryMatchesTieBreak,
    );
    scoringConfigByQuiz.set(
      quizKey,
      hasConfig
        ? {
            ...(highSignalQuestionIds && highSignalQuestionIds.length > 0 ? { highSignalQuestionIds } : {}),
            ...(resultGates ? { resultGates } : {}),
            ...(tieFallbackOrder ? { tieFallbackOrder } : {}),
            ...(primaryTieWeight !== undefined ? { primaryTieWeight } : {}),
            ...(finalTieQuestionId ? { finalTieQuestionId } : {}),
            ...(countPrimaryMatchesTieBreak ? { countPrimaryMatchesTieBreak } : {}),
          }
        : null,
    );
  } else {
    scoringConfigByQuiz.set(quizKey, null);
  }
  accessTierByQuiz.set(quizKey, definition.access);
  requiresAgeVerificationByQuiz.set(quizKey, definition.category === 'Private Private. 😈');
  logicalQuizKeyByQuiz.set(quizKey, definition.contentVersionOf ?? quizKey);
  contentByQuiz.set(
    quizKey,
    definition.questions.map((q) => ({
      questionKey: q.id,
      prompt: q.prompt,
      scoringRole: null,
      choices: q.choices.map((c) => ({
        choiceKey: c.id,
        label: c.label,
        flavorScore: definition.scoringType === 'numericBand' ? (c.score ?? 0) : null,
        resultWeights: definition.scoringType === 'archetype' ? (c.resultWeights ?? {}) : {},
      })),
    })),
  );
}

scoringTypeByQuiz.set('whats-your-type', WHATS_YOUR_TYPE_DEFINITION.scoringType);
maxScoreByQuiz.set('whats-your-type', null);
scoringConfigByQuiz.set('whats-your-type', null);
accessTierByQuiz.set('whats-your-type', WHATS_YOUR_TYPE_DEFINITION.access);
requiresAgeVerificationByQuiz.set('whats-your-type', WHATS_YOUR_TYPE_DEFINITION.category === 'Private Private. 😈');
logicalQuizKeyByQuiz.set('whats-your-type', WHATS_YOUR_TYPE_DEFINITION.contentVersionOf ?? 'whats-your-type');
const dimensionAQuestionIds = new Set(WHATS_YOUR_TYPE_DEFINITION.dimensionAQuestionIds);
const dimensionBQuestionIds = new Set(WHATS_YOUR_TYPE_DEFINITION.dimensionBQuestionIds);
const unassignedWhatsYourTypeQuestions = WHATS_YOUR_TYPE_DEFINITION.questions.filter(
  (q) => !dimensionAQuestionIds.has(q.id) && !dimensionBQuestionIds.has(q.id),
);
if (unassignedWhatsYourTypeQuestions.length > 0) {
  throw new Error(
    `whats-your-type has ${unassignedWhatsYourTypeQuestions.length} question(s) in neither dimensionAQuestionIds nor dimensionBQuestionIds: ${unassignedWhatsYourTypeQuestions.map((q) => q.id).join(', ')} -- scoring_role would be ambiguous. Refusing to proceed.`,
  );
}
contentByQuiz.set(
  'whats-your-type',
  // WHATS_YOUR_TYPE_DEFINITION.questions (not the raw WHATS_YOUR_TYPE_QUESTIONS content
  // array) -- the standard QuizQuestion/QuizChoice shape this quiz's own definition already
  // builds, with real resultWeights ({[archetypeId]: 3} per choice, see whats-your-type-
  // results.ts), the same shape every other quiz in this generator already reads.
  WHATS_YOUR_TYPE_DEFINITION.questions.map((q) => ({
    questionKey: q.id,
    prompt: q.prompt,
    scoringRole: dimensionAQuestionIds.has(q.id) ? ('dimensionA' as const) : ('dimensionB' as const),
    choices: q.choices.map((c) => ({ choiceKey: c.id, label: c.label, flavorScore: null, resultWeights: c.resultWeights ?? {} })),
  })),
);

const registryKeys = Object.keys(QUIZ_REGISTRY);
const allRealQuizKeys = new Set([...registryKeys, 'whats-your-type']);
const missingFromCanonicalOrder = [...allRealQuizKeys].filter((k) => !CANONICAL_QUIZ_ORDER.includes(k));
const extraInCanonicalOrder = CANONICAL_QUIZ_ORDER.filter((k) => !allRealQuizKeys.has(k));
if (missingFromCanonicalOrder.length > 0) {
  throw new Error(`Real quizzes missing from CANONICAL_QUIZ_ORDER (append them, never reorder existing entries): ${missingFromCanonicalOrder.join(', ')}`);
}
if (extraInCanonicalOrder.length > 0) {
  throw new Error(`CANONICAL_QUIZ_ORDER references quizzes that no longer exist in real content: ${extraInCanonicalOrder.join(', ')}`);
}

// Item 3 (2026-11-01) safety net: logical_quiz_key must point at a REAL quiz_key, and every
// quiz_key sharing one logical group must agree on access_tier/requires_age_verification --
// a content-version replacement silently authored with a WEAKER access tier than the
// original it replaces (the exact risk a hardcoded gate list previously couldn't catch
// automatically) is refused here, forcing an explicit decision rather than a silent gap.
for (const [quizKey, logicalKey] of logicalQuizKeyByQuiz) {
  if (!allRealQuizKeys.has(logicalKey)) {
    throw new Error(`Quiz '${quizKey}' declares contentVersionOf '${logicalKey}', which does not exist in real content -- refusing to proceed.`);
  }
}
const quizKeysByLogicalGroup = new Map<string, string[]>();
for (const [quizKey, logicalKey] of logicalQuizKeyByQuiz) {
  const group = quizKeysByLogicalGroup.get(logicalKey) ?? [];
  group.push(quizKey);
  quizKeysByLogicalGroup.set(logicalKey, group);
}
for (const [logicalKey, members] of quizKeysByLogicalGroup) {
  if (members.length < 2) continue;
  const accessTiers = new Set(members.map((k) => accessTierByQuiz.get(k)));
  const ageFlags = new Set(members.map((k) => requiresAgeVerificationByQuiz.get(k)));
  if (accessTiers.size > 1 || ageFlags.size > 1) {
    throw new Error(
      `Logical quiz group '${logicalKey}' has inconsistent access classification across its content versions (${members.join(', ')}): access_tier=${JSON.stringify([...accessTiers])}, requires_age_verification=${JSON.stringify([...ageFlags])}. Every content version of the same logical quiz must share the SAME access/age classification -- refusing to proceed with a version that could silently weaken the gate.`,
    );
  }
}

// TRUE freezing (owner audit, 2026-10-30): ids come from the persisted ledger
// (scripts/lib/content-id-ledger.json), never from array position. A key already in the
// ledger ALWAYS gets its existing id back, regardless of where it now sits in any source
// array; only a key never seen before gets a new id, strictly greater than every id ever
// assigned. CANONICAL_QUIZ_ORDER still controls the traversal order used ONLY the very first
// time a key is seen (i.e. only matters for the very first generation, before the ledger
// file exists) -- once a ledger file is committed, this script's output is determined by the
// ledger's own contents, not by this traversal order. `position` below is DELIBERATELY
// array-order-derived (1-based, never ledger-frozen) -- it exists specifically to capture the
// quiz's own authored order for scoring tie-breaks, independent of the frozen numeric id.
const ledger = loadLedger();
const contentFingerprints = loadContentFingerprints();
const quizIdByKey = new Map<string, number>();
const questionIdByPair = new Map<string, number>();
const questionPositionByPair = new Map<string, number>();
const questionScoringRoleByPair = new Map<string, 'dimensionA' | 'dimensionB' | null>();
const choiceIdByTriple = new Map<string, number>();
const choiceFlavorScoreByTriple = new Map<string, number | null>();
const choiceResultWeightsByTriple = new Map<string, Record<string, number>>();

for (const quizKey of CANONICAL_QUIZ_ORDER) {
  const questions = contentByQuiz.get(quizKey) ?? [];
  if (questions.length === 0) {
    throw new Error(`Quiz '${quizKey}' has zero questions in its real authored content -- refusing to proceed.`);
  }
  // Item 4: refuse to (re)assign ids under this quiz_key if its content's MEANING has
  // changed since ids were first assigned here -- see quiz-content-fingerprint.ts's header.
  assertContentFingerprintUnchanged(
    contentFingerprints,
    quizKey,
    computeQuizContentFingerprint(questions.map((q) => ({ questionKey: q.questionKey, prompt: q.prompt, choices: q.choices.map((c) => ({ choiceKey: c.choiceKey, label: c.label })) }))),
  );
  quizIdByKey.set(quizKey, assignQuizId(ledger, quizKey));
  questions.forEach((question, questionIndex) => {
    const pairKey = `${quizKey}::${question.questionKey}`;
    questionIdByPair.set(pairKey, assignQuestionId(ledger, quizKey, question.questionKey));
    questionPositionByPair.set(pairKey, questionIndex + 1);
    questionScoringRoleByPair.set(pairKey, question.scoringRole);
    if (question.choices.length === 0) {
      throw new Error(`Question '${pairKey}' has zero choices in its real authored content -- refusing to proceed.`);
    }
    for (const choice of question.choices) {
      const tripleKey = `${quizKey}::${question.questionKey}::${choice.choiceKey}`;
      choiceIdByTriple.set(tripleKey, assignChoiceId(ledger, quizKey, question.questionKey, choice.choiceKey));
      choiceFlavorScoreByTriple.set(tripleKey, choice.flavorScore);
      choiceResultWeightsByTriple.set(tripleKey, choice.resultWeights);
    }
  });
}
saveLedger(ledger);
saveContentFingerprints(contentFingerprints);

const sqlJsonbLiteral = (value: Record<string, unknown> | null): string =>
  value === null ? 'null' : `'${escapeLiteral(JSON.stringify(value))}'::jsonb`;

const quizValuesSql = CANONICAL_QUIZ_ORDER.map((key) => {
  const maxScore = maxScoreByQuiz.get(key);
  return `(${quizIdByKey.get(key)}, '${escapeLiteral(key)}', '${scoringTypeByQuiz.get(key)}', ${maxScore === null || maxScore === undefined ? 'null' : maxScore}, '${escapeLiteral(accessTierByQuiz.get(key)!)}', ${requiresAgeVerificationByQuiz.get(key)}, '${escapeLiteral(logicalQuizKeyByQuiz.get(key)!)}', ${sqlJsonbLiteral(scoringConfigByQuiz.get(key) ?? null)})`;
}).join(',\n  ');

const questionValuesSql = [...questionIdByPair.entries()]
  .map(([pair, id]) => {
    const [quizKey, questionKey] = pair.split('::');
    const role = questionScoringRoleByPair.get(pair);
    return `(${id}, ${quizIdByKey.get(quizKey)}, '${escapeLiteral(questionKey)}', ${questionPositionByPair.get(pair)}, ${role ? `'${role}'` : 'null'})`;
  })
  .join(',\n  ');

const choiceValuesSql = [...choiceIdByTriple.entries()]
  .map(([triple, id]) => {
    const [quizKey, questionKey] = triple.split('::');
    const questionId = questionIdByPair.get(`${quizKey}::${questionKey}`);
    const choiceKey = triple.slice(triple.lastIndexOf('::') + 2);
    const flavorScore = choiceFlavorScoreByTriple.get(triple);
    return `(${id}, ${questionId}, '${escapeLiteral(choiceKey)}', ${flavorScore === null || flavorScore === undefined ? 'null' : flavorScore})`;
  })
  .join(',\n  ');

// quiz_choice_result_weights: EVERY (choice, result_component_key, weight) entry across every
// quiz's real resultWeights -- archetype quizzes key these by their own archetype id;
// whats-your-type keys them by whichever dimension's archetype id the choice belongs to
// (never the final combination key -- that lookup happens separately, see
// quiz_result_definitions). Held/unapproved archetype quizzes get rows here too (this table
// mirrors REAL authored content exactly, same "every real choice has real identity" principle
// as quiz_choices itself) -- it is NOT gated by APPROVED_QUIZ_IDS_WITH_AWARDS, unlike
// quiz_choice_trait_awards, since result-identity verification must work for every quiz a
// user can actually complete, approved or held.
// weightOrder: the 1-based position of this entry within its OWN choice's authored
// resultWeights object (Object.entries preserves JS string-key insertion order) -- needed so
// the generic SQL tie-break (resolve_archetype_result, see 20261101050000) can reproduce
// scoring.ts's primaryWeightEntry exactly when a single choice carries more than one
// resultWeights entry (the "blended weights" this round's approved Private quizzes introduce,
// e.g. Love Q3A "BAE +1; TERMS +1" -- a tie between two entries on the SAME choice must always
// resolve to whichever was authored first, never an arbitrary row order). Every quiz before
// this round has exactly one entry per choice, so weightOrder is always 1 for them --
// byte-identical behavior, nothing to verify against old fixtures.
const resultWeightRows: { choiceId: number; resultComponentKey: string; weight: number; weightOrder: number }[] = [];
for (const [triple, weights] of choiceResultWeightsByTriple) {
  const choiceId = choiceIdByTriple.get(triple)!;
  let weightOrder = 0;
  for (const [resultComponentKey, weight] of Object.entries(weights)) {
    weightOrder += 1;
    if (weight > 0) {
      resultWeightRows.push({ choiceId, resultComponentKey, weight, weightOrder });
    }
  }
}
const resultWeightValuesSql = resultWeightRows
  .map((r) => `(${r.choiceId}, '${escapeLiteral(r.resultComponentKey)}', ${r.weight}, ${r.weightOrder})`)
  .join(',\n  ');

// Award rows: resolved ONLY against the real content identity above (choiceIdByTriple) -- any
// award row whose (quiz,question,choice) isn't real authored content is a data-integrity
// error worth failing loudly on, not silently dropping.
const allAwardRows = readAllApprovedQuizPoleAwardRows();
const approvedAwardRows = allAwardRows.filter((r) => (APPROVED_QUIZ_IDS_WITH_AWARDS as readonly string[]).includes(r.quizId));
const unresolvedAwardRows = approvedAwardRows.filter((r) => !choiceIdByTriple.has(`${r.quizId}::${r.questionId}::${r.choiceId}`));
if (unresolvedAwardRows.length > 0) {
  throw new Error(
    `${unresolvedAwardRows.length} approved award row(s) reference a (quiz,question,choice) not found in real authored content -- e.g. ${JSON.stringify(unresolvedAwardRows[0])}. Refusing to proceed with an inconsistent catalog.`,
  );
}
const awardValuesSql = approvedAwardRows
  .map((row) => `(${choiceIdByTriple.get(`${row.quizId}::${row.questionId}::${row.choiceId}`)}, ${traitIdForPoleKey(row.poleId)}, ${row.points})`)
  .join(',\n  ');

const heldQuizIds = CANONICAL_QUIZ_ORDER.filter((key) => !(APPROVED_QUIZ_IDS_WITH_AWARDS as readonly string[]).includes(key));
const totalChoices = [...choiceIdByTriple.keys()].length;
const choicesWithNoAward = totalChoices - approvedAwardRows.reduce((set, r) => {
  set.add(`${r.quizId}::${r.questionId}::${r.choiceId}`);
  return set;
}, new Set<string>()).size;

const sql = `-- ============================================================================================
-- STAGED, NOT APPLIED. Requires explicit owner authorization before \`supabase db push\`.
--
-- Permanent numeric quiz/question/choice identity, derived from REAL AUTHORED CONTENT
-- (QUIZ_REGISTRY + whats-your-type-content.ts), not from award mappings -- fixes the
-- confirmed bug where a choice with zero personality points (a valid answer) or a question
-- with zero Core awards (whats-your-type q1-q5, by design) had no identity at all and would
-- have caused submit_quiz_completion to reject the entire completion.
--
-- EXTENDED (owner audit, 2026-11-01), item 1: quizzes.scoring_type/max_score, quiz_questions.
-- position/scoring_role, quiz_choices.flavor_score, and the new quiz_choice_result_weights
-- table -- all mechanically derived from the SAME real content, feeding server-side result
-- verification in submit_quiz_completion (see 20261101030000). position is deliberately
-- array-order-derived (never ledger-frozen) -- it captures the quiz's own authored order for
-- scoring tie-breaks, independent of the frozen numeric id.
--
-- ${CANONICAL_QUIZ_ORDER.length} quizzes, ${questionIdByPair.size} questions, ${totalChoices} choices -- full coverage of every
-- real authored question/choice across every quiz, confirmed by generation-time validation
-- (every quiz must have >=1 question, every question >=1 choice, or this script refuses to
-- write anything). ${choicesWithNoAward} of those ${totalChoices} choices have zero quiz_choice_trait_awards rows
-- (legitimately offer no personality points, OR belong to a held/unapproved quiz) -- they
-- still have a real, permanent numeric identity, since they are still valid user answers.
--
-- Content identity exists for ALL ${CANONICAL_QUIZ_ORDER.length} quizzes (including the ${heldQuizIds.length} held
-- quizzes: ${heldQuizIds.join(', ')}). Award rows exist ONLY for the ${APPROVED_QUIZ_IDS_WITH_AWARDS.length} approved quizzes --
-- quiz_choice_result_weights, unlike quiz_choice_trait_awards, exists for EVERY quiz
-- regardless of approval status, since display-result verification must work even for held
-- quizzes a user can still complete today.
--
-- IDs are FROZEN per scripts/lib/canonical-quiz-order.ts -- regenerating this file with
-- unchanged source content reproduces the exact same ids; appending new content only ever
-- adds higher ids, never renumbers existing ones.
-- ============================================================================================

create table public.quizzes (
  quiz_id smallint primary key,
  quiz_key text not null unique,
  scoring_type text not null check (scoring_type in ('numericBand', 'archetype', 'dualDimension')),
  -- numericBand only (QuizDefinition.maxScore) -- null for archetype/dualDimension, which have
  -- no single fixed maximum in the same sense.
  max_score integer,
  -- Mirrors QuizDefinition.access verbatim -- the real, already-authored source of truth for
  -- whether an active Apparently Private entitlement is required. Never a hardcoded
  -- quiz-key list: submit_quiz_completion/submit_quiz_result check THIS column.
  access_tier text not null check (access_tier in ('free', 'private-preview', 'private')),
  -- True only when QuizDefinition.category = 'Private Private. 😈' -- the real,
  -- already-authored source of truth for the 18+ gate. Never a hardcoded quiz-key check.
  requires_age_verification boolean not null,
  -- The quiz_key this content version shares a first-completion identity with -- its OWN
  -- quiz_key for every quiz that is not itself a content-version replacement of another
  -- (every quiz today). Set via QuizDefinition.contentVersionOf when a genuine replacement
  -- ships. A self-reference by design when there is no replacement relationship.
  logical_quiz_key text not null references public.quizzes (quiz_key),
  -- Mirrors ArchetypeQuizDefinition's own opt-in tie-break/gate fields verbatim
  -- (highSignalQuestionIds, resultGates, tieFallbackOrder, primaryTieWeight,
  -- finalTieQuestionId, countPrimaryMatchesTieBreak) -- null for numericBand/dualDimension and
  -- for any archetype quiz that sets none of them (every quiz before this round). The ONE
  -- versioned scoring-configuration representation resolve_archetype_result reads, instead of
  -- a hardcoded SQL function per quiz.
  scoring_config jsonb
);

create table public.quiz_questions (
  question_id integer primary key,
  quiz_id smallint not null references public.quizzes (quiz_id),
  question_key text not null,
  -- 1-based AUTHORED array position -- deliberately independent of question_id (which is
  -- ledger-frozen and can drift from array order by design). Scoring tie-breaks need the
  -- quiz's own authored order, never id order.
  position smallint not null,
  -- 'dimensionA' / 'dimensionB' for whats-your-type's own dimension split; null for every
  -- other quiz (which has no such split).
  scoring_role text check (scoring_role in ('dimensionA', 'dimensionB')),
  unique (quiz_id, question_key),
  -- Required so user_quiz_answers can FK against (question_id, quiz_id) together, enforcing
  -- "this question actually belongs to this quiz" -- declared here, at table-creation time.
  unique (question_id, quiz_id)
);

create table public.quiz_choices (
  choice_id integer primary key,
  question_id integer not null references public.quiz_questions (question_id),
  choice_key text not null,
  -- numericBand only (QuizChoice.score) -- null for archetype/dualDimension choices, which
  -- are scored via quiz_choice_result_weights instead.
  flavor_score smallint,
  unique (question_id, choice_key),
  -- Required so user_quiz_answers can FK against (choice_id, question_id) together --
  -- declared here, at table-creation time, so no later migration can reference it before it
  -- exists (the exact DDL-ordering bug found in the previous pass's separate ALTER TABLE).
  unique (choice_id, question_id)
);

create table public.quiz_choice_trait_awards (
  choice_id integer not null references public.quiz_choices (choice_id),
  trait_id smallint not null references public.personality_traits (trait_id),
  points smallint not null check (points between 1 and 3),
  primary key (choice_id, trait_id)
);

create table public.quiz_choice_result_weights (
  choice_id integer not null references public.quiz_choices (choice_id),
  -- An archetype's own id (archetype quizzes), or one of whats-your-type's own per-dimension
  -- archetype ids (dualDimension) -- never the final combination result_id, which is resolved
  -- separately (see quiz_result_definitions).
  result_component_key text not null,
  weight smallint not null check (weight > 0),
  -- 1-based position of this entry within its own choice's AUTHORED resultWeights object --
  -- lets resolve_archetype_result break a same-choice, same-value tie (e.g. "BAE +1; TERMS
  -- +1") the same deterministic way scoring.ts's primaryWeightEntry does (first-authored wins).
  weight_order smallint not null,
  primary key (choice_id, result_component_key)
);

comment on table public.quizzes is 'Numeric quiz catalog, FROZEN order (scripts/lib/canonical-quiz-order.ts). quiz_key is the existing client-side slug -- no client rewrite required. scoring_type/max_score mirror QuizDefinition verbatim, feeding server-side result verification. access_tier/requires_age_verification mirror QuizDefinition.access/category verbatim -- submit_quiz_completion/submit_quiz_result gate on these columns, never a hardcoded quiz-key list. logical_quiz_key preserves one first-completion identity across content-version replacements (self-referencing when there is no replacement relationship, i.e. every quiz today).';
comment on table public.quiz_questions is 'Numeric question catalog -- EVERY question of EVERY quiz''s real authored content, not just scored ones. position is the quiz''s own authored order (never the ledger-frozen question_id); scoring_role marks whats-your-type''s dimension split.';
comment on table public.quiz_choices is 'Numeric choice catalog -- EVERY choice of EVERY question''s real authored content, including choices that legitimately award zero personality points. flavor_score mirrors QuizChoice.score for numericBand quizzes.';
comment on table public.quiz_choice_trait_awards is 'Server-side authoritative numeric scoring data -- one row per (choice, awarded trait). A choice legitimately has zero rows here if it offers no personality points, or if its quiz is held/unapproved.';
comment on table public.quiz_choice_result_weights is 'Mirrors QuizChoice.resultWeights verbatim for every archetype/dualDimension quiz, held or approved -- what submit_quiz_completion sums per candidate result to verify a submitted result_id was actually produced by the submitted answers.';

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_choices enable row level security;
alter table public.quiz_choice_trait_awards enable row level security;
alter table public.quiz_choice_result_weights enable row level security;

create policy "quizzes_select_all" on public.quizzes for select to authenticated using (true);
create policy "quiz_questions_select_all" on public.quiz_questions for select to authenticated using (true);
create policy "quiz_choices_select_all" on public.quiz_choices for select to authenticated using (true);
create policy "quiz_choice_trait_awards_select_all" on public.quiz_choice_trait_awards for select to authenticated using (true);
create policy "quiz_choice_result_weights_select_all" on public.quiz_choice_result_weights for select to authenticated using (true);

insert into public.quizzes (quiz_id, quiz_key, scoring_type, max_score, access_tier, requires_age_verification, logical_quiz_key, scoring_config) values
  ${quizValuesSql};

insert into public.quiz_questions (question_id, quiz_id, question_key, position, scoring_role) values
  ${questionValuesSql};

insert into public.quiz_choices (choice_id, question_id, choice_key, flavor_score) values
  ${choiceValuesSql};

insert into public.quiz_choice_trait_awards (choice_id, trait_id, points) values
  ${awardValuesSql};

insert into public.quiz_choice_result_weights (choice_id, result_component_key, weight, weight_order) values
  ${resultWeightValuesSql};
`;

const outputPath = join(__dirname, '..', 'supabase', 'migrations', '20261028020000_quiz_content_identity.sql');
writeFileSync(outputPath, sql);
console.log(`Wrote ${CANONICAL_QUIZ_ORDER.length} quizzes, ${questionIdByPair.size} questions, ${totalChoices} choices (${choicesWithNoAward} with zero awards), ${approvedAwardRows.length} award rows, ${resultWeightRows.length} result-weight rows to ${outputPath}`);
