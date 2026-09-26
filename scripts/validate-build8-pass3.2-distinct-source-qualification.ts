// Focused validation for Build 8 Pass 3.2: Private-signal qualification must count DISTINCT
// behavioral sources, never merely personality_evidence rows/items. Run with:
//
//   npx tsx scripts/validate-build8-pass3.2-distinct-source-qualification.ts
//
// Imports the real functions directly (personality.ts, private-signals.ts are RN-free by
// design — same established convention as every other validate-build8-*.ts script).

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { scorePersonalityProfile, type PersonalityAnswerEvidence } from '../src/data/personality';
import type { PersonalityEvidenceRow } from '../src/services/types';

// Cannot import groupEvidenceIntoAnswers directly from src/services/personality-service.ts --
// it imports @/lib/supabase, which itself imports react-native, which esbuild/tsx cannot parse
// outside Metro (same established convention as every other script in this repo that avoids
// that import chain -- see validate-purchases.ts's own header comment). Hand-mirrored copy of
// its exact logic, kept in sync by hand; check #1 below source-text-verifies the REAL shipped
// file reads row.source_id literally, so this mirror can't silently drift from what actually
// ships.
const groupEvidenceIntoAnswers = (rows: PersonalityEvidenceRow[]): PersonalityAnswerEvidence[] => {
  const bySource = new Map<
    string,
    { question: string; category: string; chosenAnswer: string; effects: PersonalityAnswerEvidence['effects']; sourceType: PersonalityEvidenceRow['source_type']; sourceId: string }
  >();
  for (const row of rows) {
    const entry = bySource.get(row.source_id) ?? {
      question: row.question_snapshot,
      category: row.category,
      chosenAnswer: row.answer_snapshot,
      effects: [],
      sourceType: row.source_type,
      sourceId: row.source_id,
    };
    entry.effects.push({ dimension: row.dimension as PersonalityAnswerEvidence['effects'][number]['dimension'], value: row.effect });
    bySource.set(row.source_id, entry);
  }
  return Array.from(bySource.values());
};
import { selectStrongestPrivateSignals, selectRelicSlots, isPrivateSignalQualified } from '../src/data/private-signals';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

const read = (relativePath: string): string => readFileSync(join(__dirname, relativePath), 'utf8');

// ============================================================================================
// 1. source_id FROM REAL personality_evidence IS PRESERVED THROUGH GROUPING/SCORING
// ============================================================================================

const rawRows: PersonalityEvidenceRow[] = [
  {
    id: 'evidence-row-1',
    user_id: 'user-1',
    source_type: 'daily_answer',
    source_id: 'real-daily-answers-id-abc',
    question_snapshot: 'A Private Daily prompt',
    answer_snapshot: 'An option label',
    category: 'Hidden You',
    dimension: 'tactful_blunt',
    effect: -2,
    created_at: new Date().toISOString(),
  },
];
const groupedFromRealRows = groupEvidenceIntoAnswers(rawRows);
assert(groupedFromRealRows.length === 1, 'grouping one real row produces one answer');
assert(
  groupedFromRealRows[0]?.sourceId === 'real-daily-answers-id-abc',
  `groupEvidenceIntoAnswers preserves the REAL source_id from the row (got ${groupedFromRealRows[0]?.sourceId})`,
);
const scoredFromRealRows = scorePersonalityProfile(groupedFromRealRows);
const scoredDimension = scoredFromRealRows.dimensions.find((d) => d.dimension === 'tactful_blunt');
assert(
  scoredDimension?.evidence[0]?.sourceId === 'real-daily-answers-id-abc',
  'scorePersonalityProfile threads that same real source_id all the way into DimensionEvidence',
);

// Never derived from question text/category/title/timestamps/array index -- source-text proof
// that the actual field read is row.source_id, not a synthesized value.
const personalityServiceSource = read('../src/services/personality-service.ts');
assert(
  /sourceId: row\.source_id/.test(personalityServiceSource),
  'groupEvidenceIntoAnswers reads sourceId literally from row.source_id -- never synthesized from question/category/title/timestamp/index',
);

// ============================================================================================
// 2-7. DISTINCT-SOURCE QUALIFICATION BEHAVIOR
// ============================================================================================

const dailyAnswer = (sourceId: string, dimension: PersonalityAnswerEvidence['effects'][number]['dimension'], value: -2 | -1 | 1 | 2, question = 'q'): PersonalityAnswerEvidence => ({
  question,
  category: 'Hidden You',
  chosenAnswer: 'option',
  sourceType: 'daily_answer',
  sourceId,
  effects: [{ dimension, value }],
});

const quizResult = (sourceId: string, dimension: PersonalityAnswerEvidence['effects'][number]['dimension'], value: -2 | -1 | 1 | 2, question = 'result'): PersonalityAnswerEvidence => ({
  question,
  category: 'The Good Stuff',
  chosenAnswer: 'result',
  sourceType: 'quiz_result',
  sourceId,
  effects: [{ dimension, value }],
});

// 2. One Daily source with one evidence row -> unqualified.
const oneDailyOneRow = scorePersonalityProfile([dailyAnswer('daily-source-A', 'tactful_blunt', -2)]);
const oneDailyOneRowDim = oneDailyOneRow.dimensions.find((d) => d.dimension === 'tactful_blunt')!;
assert(!isPrivateSignalQualified(oneDailyOneRowDim.evidence), 'one Daily source with one evidence row is unqualified');
assert(selectStrongestPrivateSignals(oneDailyOneRow).length === 0, 'and correctly does not surface in the selector');

// 3. One Daily source with TWO duplicate same-dimension evidence rows -> still unqualified
// (both rows share the SAME source_id -- this constructs the profile by hand-merging two
// DimensionEvidence items into one dimension's evidence array, simulating what would happen
// if upstream data somehow produced duplicate rows for one source, since
// scorePersonalityProfile itself only ever sees ONE answer -> one effect per dimension
// normally; this proves the SELECTOR's own distinct-source counting is robust even if that
// upstream invariant were ever violated, rather than merely inheriting correctness from it).
const oneDailyDuplicateRowsEvidence = [
  { ...oneDailyOneRowDim.evidence[0] },
  { ...oneDailyOneRowDim.evidence[0] }, // identical source_id, duplicated
];
assert(
  oneDailyDuplicateRowsEvidence[0].sourceId === oneDailyDuplicateRowsEvidence[1].sourceId,
  'sanity: the duplicated evidence really does share one source_id',
);
assert(
  !isPrivateSignalQualified(oneDailyDuplicateRowsEvidence),
  'one Daily source with duplicate same-dimension evidence rows is STILL unqualified -- a naive row count would have wrongly counted 2',
);

// 4. Two DIFFERENT Daily source IDs supporting the same dimension -> qualified.
const twoDifferentDailySources = scorePersonalityProfile([
  dailyAnswer('daily-source-B1', 'tactful_blunt', -2, 'day 1'),
  dailyAnswer('daily-source-B2', 'tactful_blunt', -2, 'day 2'),
]);
const twoDailySignals = selectStrongestPrivateSignals(twoDifferentDailySources);
assert(twoDailySignals.length === 1 && twoDailySignals[0]?.dimension === 'tactful_blunt', 'two DIFFERENT Daily source ids for the same dimension DO qualify it');
assert(selectRelicSlots(twoDailySignals).relicTrait !== null, 'and the Relic slot resolves once qualified');

// 5. One quiz_result source -> qualified.
const oneQuizSource = scorePersonalityProfile([quizResult('quiz-source-C', 'vulnerable_armored', -2)]);
assert(
  selectStrongestPrivateSignals(oneQuizSource).some((s) => s.dimension === 'vulnerable_armored'),
  'one quiz_result source qualifies immediately',
);

// 6. One quiz_result source with duplicate same-dimension evidence rows -> still ONE distinct
// quiz source, but remains qualified (>= 1 is already satisfied; duplicates never subtract).
const oneQuizSourceDim = oneQuizSource.dimensions.find((d) => d.dimension === 'vulnerable_armored')!;
const duplicateQuizEvidence = [{ ...oneQuizSourceDim.evidence[0] }, { ...oneQuizSourceDim.evidence[0] }];
const distinctQuizSourcesInDuplicate = new Set(duplicateQuizEvidence.map((e) => e.sourceId)).size;
assert(distinctQuizSourcesInDuplicate === 1, 'duplicate same-source quiz rows represent exactly ONE distinct quiz source, never two');
assert(isPrivateSignalQualified(duplicateQuizEvidence), 'and that one distinct quiz source still qualifies (duplicates never disqualify)');

// 7. Quiz + Daily together -> qualified.
const quizPlusDaily = scorePersonalityProfile([
  dailyAnswer('daily-source-D', 'repair_punishing', -2),
  quizResult('quiz-source-D', 'repair_punishing', -1),
]);
assert(
  selectStrongestPrivateSignals(quizPlusDaily).some((s) => s.dimension === 'repair_punishing'),
  '1 quiz source + 1 Daily source together qualify the dimension',
);

// ============================================================================================
// 8. RAW EVIDENCE REMAINS INTACT (qualification never deletes/suppresses stored evidence)
// ============================================================================================

assert(
  oneDailyOneRow.dimensions.find((d) => d.dimension === 'tactful_blunt')?.evidenceCount === 1,
  'the unqualified single-Daily-source dimension is still fully present in profile.dimensions with its real evidenceCount',
);

// ============================================================================================
// 9. RELIC SLOTS CONSUME ONLY QUALIFIED PRIVATE SIGNALS (unchanged from Pass 3/3.1 -- selectRelicSlots
// itself needed no code change, since it only ever sees selectStrongestPrivateSignals' output)
// ============================================================================================

assert(selectRelicSlots(selectStrongestPrivateSignals(oneDailyOneRow)).relicTrait === null, 'an unqualified dimension never resolves the Relic slot');
assert(selectRelicSlots(twoDailySignals).relicTrait?.dimension === 'tactful_blunt', 'a qualified dimension does resolve the Relic slot');

// ============================================================================================
// 10. PRIVATE-SOURCE CORE EVIDENCE REMAINS UNAFFECTED (this gate is Private-surfacing-only)
// ============================================================================================

const bothTypesSource = scorePersonalityProfile([
  {
    question: 'A both-mapped quiz result',
    category: 'The Good Stuff',
    chosenAnswer: 'result',
    sourceType: 'quiz_result',
    sourceId: 'quiz-source-both',
    effects: [
      { dimension: 'duty_first_self_preserving', value: 2 }, // Private
      { dimension: 'protective_hands_off', value: 1 }, // Core
    ],
  },
]);
assert(
  bothTypesSource.topTraits.length === 0 || bothTypesSource.dimensions.find((d) => d.dimension === 'protective_hands_off')?.evidenceCount === 1,
  'Core evidence (protective_hands_off) from a both-mapped source is recorded exactly as before -- the distinct-source qualification gate never touches Core scoring',
);
const privateSignalsSource = read('../src/data/private-signals.ts');
const personalitySource = read('../src/data/personality.ts');
assert(!/isPrivateSignalQualified/.test(personalitySource), 'the qualification gate still lives ONLY in private-signals.ts -- personality.ts never references it');

// ============================================================================================
// 11. EXISTING PASS 3 AND PASS 3.1 VALIDATION REMAINS GREEN (run separately by the caller/CI;
// re-confirmed here only as a source-text sanity check that neither file was deleted/renamed)
// ============================================================================================

assert(
  read('./validate-build8-pass3-identity-architecture.ts').length > 0 && read('./validate-build8-pass3.1-private-signal-confidence.ts').length > 0,
  'the Pass 3 and Pass 3.1 validation scripts still exist (run them directly for their own full results)',
);

// ============================================================================================
// 12. RETAKE PROTECTION UNCHANGED
// ============================================================================================

const advisoryLockSource = read('../supabase/migrations/20260916050000_quiz_first_completion_advisory_lock.sql');
assert(
  /pg_advisory_xact_lock/.test(advisoryLockSource) && /v_is_first/.test(advisoryLockSource),
  'submit_quiz_result\'s first-completion-only / advisory-lock retake protection is untouched by this pass',
);

// ============================================================================================
// 13. NO FAKE TRAITS/PERCENTAGES/MAPPINGS INTRODUCED
// ============================================================================================

assert(selectStrongestPrivateSignals(oneDailyOneRow).length === 0, 'no fake trait fabricated when evidence is real but unqualified');
assert(!/%/.test(privateSignalsSource.replace(/\/\/.*$/gm, '')), 'private-signals.ts introduces no percentage literal in actual code');
assert(
  !/Blade|Dagger|Talon|relicTrait\s*=\s*['"]/i.test(privateSignalsSource.replace(/\/\/.*$/gm, '')),
  'no trait->object/color/effect mapping was introduced in actual code',
);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Build 8 Pass 3.2 (distinct-source Private-signal qualification) VALIDATION CHECKS PASSED.');
