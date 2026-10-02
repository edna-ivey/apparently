// Pure mirror of advance_daily_rotation() in
// supabase/migrations/20261001010000_daily_rotation_cycle.sql -- the REAL runtime rotation
// (Public Daily indefinite cycling, Build 9) runs entirely in Postgres via pg_cron; nothing
// here executes at runtime. This module exists only so the CYCLE ALGORITHM itself (exclude
// already-shown questions this cycle; once every eligible question has appeared, start a
// fresh cycle rather than getting stuck) can be deterministically unit-tested without a
// database -- see scripts/validate-daily-rotation.ts. Keep this in sync by hand with the SQL
// function's logic, same established convention as other SQL-mirrored validations in this
// repo (e.g. groupEvidenceIntoAnswers' hand-mirrored copy in
// scripts/validate-build8-pass3.2-distinct-source-qualification.ts).
//
// Deliberately never touches/references daily_answers or personality evidence in any way --
// this is pure selection-state bookkeeping, nothing else. The real SQL function doesn't touch
// either table either.

export type DailyRotationState = {
  cycleNumber: number;
  shownQuestionIds: string[];
};

export const INITIAL_DAILY_ROTATION_STATE: DailyRotationState = {
  cycleNumber: 1,
  shownQuestionIds: [],
};

export type DailyRotationResult = {
  nextQuestionId: string;
  state: DailyRotationState;
  cycleAdvanced: boolean;
};

// `pickIndex` stands in for the SQL function's `order by random() limit 1` -- the real
// rotation is genuinely random; this pure function takes the random choice as an injected
// parameter so its own cycle/exclusion logic can be exercised deterministically in tests.
export const advanceDailyRotation = (
  pool: string[],
  state: DailyRotationState,
  pickIndex: (candidateCount: number) => number,
): DailyRotationResult => {
  if (pool.length === 0) {
    throw new Error('advanceDailyRotation: pool must not be empty.');
  }

  let candidates = pool.filter((id) => !state.shownQuestionIds.includes(id));
  let cycleNumber = state.cycleNumber;
  let cycleAdvanced = false;

  if (candidates.length === 0) {
    cycleNumber += 1;
    cycleAdvanced = true;
    candidates = [...pool];
  }

  const index = pickIndex(candidates.length);
  const nextQuestionId = candidates[index];
  const shownQuestionIds = cycleAdvanced ? [nextQuestionId] : [...state.shownQuestionIds, nextQuestionId];

  return {
    nextQuestionId,
    state: { cycleNumber, shownQuestionIds },
    cycleAdvanced,
  };
};
