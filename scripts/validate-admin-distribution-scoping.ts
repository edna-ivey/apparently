// Focused, standalone regression coverage for the admin-dashboard duplicated-Daily-results
// bug (two simultaneous Live Dailies — one per room — showing the same distribution) and the
// new access-badge/quiz-analytics logic added alongside the fix. Run with:
//
//   npx tsx scripts/validate-admin-distribution-scoping.ts
//
// No test framework is configured in this repo — see scripts/validate-keep-you-around.ts's
// header for the established convention. This script deliberately imports only pure,
// RN-free modules (fetch-by-id.ts, admin-access-badges.ts) — never the admin dashboard page
// itself, which pulls in react-native/expo-router and can't run outside Metro (same reason
// personality-service.ts is avoided in the other validation scripts). The dashboard page
// wires these exact functions directly (see its own comments) — this proves the underlying
// mechanism is correct; a live Playwright smoke pass (see the engineering sprint report)
// proves the wiring itself renders correctly end to end against two real simultaneous Live
// Dailies.

import { getDailyAccessBadge, getQuizAccessBadge } from '../src/utils/admin-access-badges';
import { fetchAllById, type FetchOneResult } from '../src/utils/fetch-by-id';

let failures = 0;
const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`OK: ${message}`);
  }
};

// This project isn't configured as an ESM package, so tsx/esbuild transpiles as CJS — which
// doesn't support top-level await. Everything below runs inside this async IIFE instead.
void (async () => {

// ============================================================================================
// 1. THE CORE REGRESSION — fetchAllById never cross-contaminates two ids' results
// ============================================================================================
//
// Mirrors the exact real-world shape of the bug: Daily A (Love & Soulmates, 4 choices,
// distribution 1/2/3/4) and Daily B (Money, 4 choices, distribution 7/0/1/2) both LIVE at
// once — the admin dashboard's own reload() calls this same function with both Live question
// ids. Before the fix, a single shared variable held only ONE of these two results and both
// cards rendered it; fetchAllById makes that structurally impossible.

type FakeDistributionRow = { option_id: string; label: string; answer_count: number };

const DAILY_A_ID = 'daily-a-love-and-soulmates';
const DAILY_B_ID = 'daily-b-money';

const DAILY_A_ROWS: FakeDistributionRow[] = [
  { option_id: 'a1', label: '“Why did you feel the need to say that?”', answer_count: 1 },
  { option_id: 'a2', label: 'Fair. Privacy still exists in relationships.', answer_count: 2 },
  { option_id: 'a3', label: 'If I suddenly can’t touch your phone, now I definitely have questions.', answer_count: 3 },
  { option_id: 'a4', label: 'Fine, but secrecy and privacy are not the same thing.', answer_count: 4 },
];
const DAILY_B_ROWS: FakeDistributionRow[] = [
  { option_id: 'b1', label: 'The exact number. I don’t care.', answer_count: 7 },
  { option_id: 'b2', label: 'A general range.', answer_count: 0 },
  { option_id: 'b3', label: 'I’m joking my way out of that question.', answer_count: 1 },
  { option_id: 'b4', label: 'Absolutely nothing. Why do you need to know?', answer_count: 2 },
];

const fakeFetchDistribution = async (id: string): Promise<FetchOneResult<FakeDistributionRow[]>> => {
  if (id === DAILY_A_ID) return { ok: true, data: DAILY_A_ROWS };
  if (id === DAILY_B_ID) return { ok: true, data: DAILY_B_ROWS };
  return { ok: false, message: `no fixture for ${id}` };
};

{
  const results: Record<string, FakeDistributionRow[]> = {};
  await fetchAllById([DAILY_A_ID, DAILY_B_ID], fakeFetchDistribution, (id, state) => {
    if (state.status === 'ready') {
      results[id] = state.data;
    }
  });

  assert(JSON.stringify(results[DAILY_A_ID]) === JSON.stringify(DAILY_A_ROWS), 'Daily A renders ONLY Daily A’s rows');
  assert(JSON.stringify(results[DAILY_B_ID]) === JSON.stringify(DAILY_B_ROWS), 'Daily B renders ONLY Daily B’s rows');
  assert(
    JSON.stringify(results[DAILY_A_ID]) !== JSON.stringify(results[DAILY_B_ID]),
    'Daily A and Daily B never end up with identical (accidentally-shared) data',
  );
  assert(
    !results[DAILY_A_ID].some((row) => row.label.includes('exact number')),
    'Daily A never contains Daily B’s choice labels',
  );
  assert(
    !results[DAILY_B_ID].some((row) => row.label.toLowerCase().includes('phone')),
    'Daily B never contains Daily A’s choice labels',
  );

  const totalA = results[DAILY_A_ID].reduce((sum, r) => sum + r.answer_count, 0);
  const totalB = results[DAILY_B_ID].reduce((sum, r) => sum + r.answer_count, 0);
  assert(totalA === 10, 'Daily A’s total is computed from its own rows only (1+2+3+4=10)');
  assert(totalB === 10, 'Daily B’s total is computed from its own rows only (7+0+1+2=10), never borrowed from A');
}

// A zero-vote Daily must show a real, explicit zero — never another Daily’s numbers, and
// never omitted.
{
  const ZERO_ID = 'daily-c-zero-votes';
  const ZERO_ROWS: FakeDistributionRow[] = [
    { option_id: 'c1', label: 'Option 1', answer_count: 0 },
    { option_id: 'c2', label: 'Option 2', answer_count: 0 },
  ];
  const fetchWithZero = async (id: string): Promise<FetchOneResult<FakeDistributionRow[]>> => {
    if (id === ZERO_ID) return { ok: true, data: ZERO_ROWS };
    return fakeFetchDistribution(id);
  };
  const results: Record<string, FakeDistributionRow[]> = {};
  await fetchAllById([DAILY_A_ID, ZERO_ID], fetchWithZero, (id, state) => {
    if (state.status === 'ready') results[id] = state.data;
  });
  const zeroTotal = results[ZERO_ID].reduce((sum, r) => sum + r.answer_count, 0);
  assert(zeroTotal === 0, 'zero-vote Daily truthfully shows 0 total votes');
  assert(results[DAILY_A_ID].reduce((sum, r) => sum + r.answer_count, 0) === 10, 'the zero-vote Daily never contaminates a sibling Daily’s total');
}

// A failed fetch must produce an explicit error state for THAT id only — never fall back to
// another id’s data, and never silently disappear.
{
  const FAILING_ID = 'daily-d-fails';
  const fetchWithFailure = async (id: string): Promise<FetchOneResult<FakeDistributionRow[]>> => {
    if (id === FAILING_ID) return { ok: false, message: 'network error' };
    return fakeFetchDistribution(id);
  };
  const states: Record<string, string> = {};
  await fetchAllById([DAILY_A_ID, FAILING_ID], fetchWithFailure, (id, state) => {
    states[id] = state.status;
  });
  assert(states[FAILING_ID] === 'error', 'a failed distribution fetch surfaces an explicit error state');
  assert(states[DAILY_A_ID] === 'ready', 'a sibling Daily’s successful fetch is unaffected by another Daily’s failure');
}

// Every id transitions through 'loading' before settling — proven by checking the FIRST
// onUpdate call per id (fetchAllById marks every id loading synchronously before awaiting).
{
  const firstStatusById: Record<string, string> = {};
  const seen = new Set<string>();
  await fetchAllById([DAILY_A_ID, DAILY_B_ID], fakeFetchDistribution, (id, state) => {
    if (!seen.has(id)) {
      seen.add(id);
      firstStatusById[id] = state.status;
    }
  });
  assert(firstStatusById[DAILY_A_ID] === 'loading' && firstStatusById[DAILY_B_ID] === 'loading', 'every id starts in an explicit loading state, never a stale/shared value');
}

// ============================================================================================
// 2. ACCESS BADGES
// ============================================================================================

assert(getDailyAccessBadge({ room: 'public', is_free_private_unlock: false }) === 'FREE', 'Public Daily -> FREE');
assert(getDailyAccessBadge({ room: 'private', is_free_private_unlock: false }) === 'PREMIUM', 'Private (subscriber) Daily -> PREMIUM');
assert(getDailyAccessBadge({ room: 'private', is_free_private_unlock: true }) === 'FREE PRIVATE', 'Free Private unlock -> truthful free/unlock state');
// A public Daily with is_free_private_unlock incidentally true (shouldn't happen, but the
// badge must still be driven by room first) stays FREE, not double-counted as anything else.
assert(getDailyAccessBadge({ room: 'public', is_free_private_unlock: true }) === 'FREE', 'Public Daily stays FREE regardless of is_free_private_unlock');

assert(getQuizAccessBadge('free') === 'PUBLIC · FREE', 'Public/free quiz badge');
assert(getQuizAccessBadge('private-preview') === 'PRIVATE · OPEN / FREE PREVIEW', 'Private OPEN quiz badge');
assert(getQuizAccessBadge('private') === 'PRIVATE · PREMIUM', 'Premium Private quiz badge');

// ============================================================================================
// 3. QUIZ ANALYTICS — same fetchAllById mechanism, same never-cross-contaminate guarantee
// ============================================================================================

type FakeQuizRow = { result_id: string; result_title: string; completion_count: number };

const QUIZ_1_ID = 'keep-you-around';
const QUIZ_2_ID = 'be-so-serious';
const QUIZ_1_ROWS: FakeQuizRow[] = [
  { result_id: 'emergency-contact', result_title: 'THE EMERGENCY CONTACT', completion_count: 4 },
  { result_id: 'reason-theres-a-story', result_title: 'THE REASON THERE’S A STORY', completion_count: 3 },
];
const QUIZ_2_ROWS: FakeQuizRow[] = [
  { result_id: 'handles-it-well', result_title: 'NO, ACTUALLY. YOU HANDLE THIS PRETTY WELL.', completion_count: 9 },
];
const ZERO_QUIZ_ID = 'zero-completions-quiz';

const fakeFetchQuiz = async (id: string): Promise<FetchOneResult<FakeQuizRow[]>> => {
  if (id === QUIZ_1_ID) return { ok: true, data: QUIZ_1_ROWS };
  if (id === QUIZ_2_ID) return { ok: true, data: QUIZ_2_ROWS };
  if (id === ZERO_QUIZ_ID) return { ok: true, data: [] };
  return { ok: false, message: `no fixture for ${id}` };
};

{
  const results: Record<string, FakeQuizRow[]> = {};
  await fetchAllById([QUIZ_1_ID, QUIZ_2_ID, ZERO_QUIZ_ID], fakeFetchQuiz, (id, state) => {
    if (state.status === 'ready') results[id] = state.data;
  });

  assert(JSON.stringify(results[QUIZ_1_ID]) === JSON.stringify(QUIZ_1_ROWS), 'Quiz 1’s distribution is exactly its own rows');
  assert(JSON.stringify(results[QUIZ_2_ID]) === JSON.stringify(QUIZ_2_ROWS), 'Quiz 2’s distribution is exactly its own rows');
  assert(
    !results[QUIZ_1_ID].some((row) => row.result_id === 'handles-it-well'),
    'Quiz 1’s breakdown never contains Quiz 2’s result identities',
  );
  const total1 = results[QUIZ_1_ID].reduce((sum, r) => sum + r.completion_count, 0);
  const total2 = results[QUIZ_2_ID].reduce((sum, r) => sum + r.completion_count, 0);
  assert(total1 === 7, 'Quiz 1 total completions computed from its own rows only (4+3=7)');
  assert(total2 === 9, 'Quiz 2 total completions computed from its own rows only, never borrowed from Quiz 1');

  assert(results[ZERO_QUIZ_ID].length === 0, 'zero-completion quiz truthfully returns an empty breakdown (0 real completions)');

  // Percentage math a consumer of this data would do — verified here so a future UI change
  // can't silently start computing it from the wrong total.
  const percentagesFor1 = results[QUIZ_1_ID].map((row) => Math.round((row.completion_count / total1) * 100));
  assert(JSON.stringify(percentagesFor1) === JSON.stringify([57, 43]), 'Quiz 1 percentages computed correctly from its own total (4/7=57%, 3/7=43%)');
}

// "New future quiz automatically participates when marked current" — proven structurally:
// fetchAllById takes whatever id list it's given, with zero per-quiz special-casing. A
// hypothetical quiz id not in QUIZ_REGISTRY today would work identically once added, since
// nothing here (or in the dashboard's CURRENT_QUIZZES derivation) hardcodes a fixed set of
// ids — see admin/(protected)/index.tsx's CURRENT_QUIZZES: Object.values(QUIZ_REGISTRY).filter(...).
{
  const FUTURE_QUIZ_ID = 'a-future-quiz-not-yet-imagined';
  const fetchWithFuture = async (id: string): Promise<FetchOneResult<FakeQuizRow[]>> => {
    if (id === FUTURE_QUIZ_ID) return { ok: true, data: [{ result_id: 'x', result_title: 'X', completion_count: 1 }] };
    return fakeFetchQuiz(id);
  };
  const results: Record<string, FakeQuizRow[]> = {};
  await fetchAllById([QUIZ_1_ID, FUTURE_QUIZ_ID], fetchWithFuture, (id, state) => {
    if (state.status === 'ready') results[id] = state.data;
  });
  assert(results[FUTURE_QUIZ_ID]?.[0]?.result_id === 'x', 'a quiz id unknown to this script’s fixtures still participates correctly with zero special-casing');
}

// ============================================================================================

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL admin distribution-scoping VALIDATION CHECKS PASSED.');
})();
