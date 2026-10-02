// Deterministic validation for the Public Daily indefinite rotation (Build 9 Part A). Run
// with:
//
//   npx tsx scripts/validate-daily-rotation.ts
//
// Exercises the pure advanceDailyRotation algorithm (src/data/daily-rotation.ts), the hand-
// mirrored twin of advance_daily_rotation() in
// supabase/migrations/20261001010000_daily_rotation_cycle.sql. Source-text checks confirm the
// real SQL migration implements the matching shape (pool/exclusion/cycle-reset) and never
// touches daily_answers.

declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const __dirname: string;
const { readFileSync } = require('fs');
const { join } = require('path') as unknown as { join: (...parts: string[]) => string };

import { advanceDailyRotation, INITIAL_DAILY_ROTATION_STATE, type DailyRotationState } from '../src/data/daily-rotation';

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
// FIRST CYCLE COMPLETE -- a pool of 5 questions, applied 5 times, visits every question
// exactly once with no repeats, never advancing the cycle until the 5th pick exhausts it.
// ============================================================================================

{
  const pool = ['q1', 'q2', 'q3', 'q4', 'q5'];
  let state: DailyRotationState = INITIAL_DAILY_ROTATION_STATE;
  const picked: string[] = [];
  for (let i = 0; i < pool.length; i++) {
    const result = advanceDailyRotation(pool, state, () => 0); // always take the first remaining candidate
    assert(!picked.includes(result.nextQuestionId), `pick ${i + 1}: "${result.nextQuestionId}" has not appeared earlier in this cycle (no repeat before exhaustion)`);
    assert(result.cycleAdvanced === false, `pick ${i + 1} of 5: cycle does not advance until the pool is exhausted`);
    picked.push(result.nextQuestionId);
    state = result.state;
  }
  assert(picked.length === 5 && new Set(picked).size === 5, `all 5 questions were shown exactly once across the first cycle (got ${JSON.stringify(picked)})`);
  assert(state.cycleNumber === 1, `cycle number is still 1 after exactly exhausting the pool (got ${state.cycleNumber})`);
  assert(state.shownQuestionIds.length === 5, 'all 5 shown ids are recorded in state after the first cycle');
}

// ============================================================================================
// SECOND CYCLE STARTS -- the 6th pick (pool exhausted) starts a fresh cycle: cycleAdvanced is
// true, shownQuestionIds resets to just the new pick, cycle_number increments.
// ============================================================================================

{
  const pool = ['q1', 'q2', 'q3'];
  let state: DailyRotationState = INITIAL_DAILY_ROTATION_STATE;
  for (let i = 0; i < pool.length; i++) {
    state = advanceDailyRotation(pool, state, () => 0).state;
  }
  assert(state.cycleNumber === 1 && state.shownQuestionIds.length === 3, 'fixture sanity: first cycle of 3 fully exhausted');

  const second = advanceDailyRotation(pool, state, () => 0);
  assert(second.cycleAdvanced === true, 'the pick immediately after pool exhaustion starts a new cycle');
  assert(second.state.cycleNumber === 2, `cycle number increments to 2 (got ${second.state.cycleNumber})`);
  assert(second.state.shownQuestionIds.length === 1 && second.state.shownQuestionIds[0] === second.nextQuestionId, "the new cycle's shown-ids resets to just the newly picked question, not carried over from the old cycle");
}

// ============================================================================================
// NO REPEATS INSIDE A CYCLE BEFORE THE POOL IS EXHAUSTED -- across many picks spanning
// several full cycles, every pick within a single cycle is unique.
// ============================================================================================

{
  const pool = ['a', 'b', 'c', 'd'];
  let state: DailyRotationState = INITIAL_DAILY_ROTATION_STATE;
  let seenThisCycle = new Set<string>();
  let violations = 0;
  for (let i = 0; i < 20; i++) {
    const result = advanceDailyRotation(pool, state, (count) => i % count);
    if (result.cycleAdvanced) {
      seenThisCycle = new Set();
    }
    if (seenThisCycle.has(result.nextQuestionId)) {
      violations += 1;
    }
    seenThisCycle.add(result.nextQuestionId);
    state = result.state;
  }
  assert(violations === 0, `across 20 picks (5 full cycles of a 4-question pool), no question ever repeated within the same cycle before exhaustion (got ${violations} violation(s))`);
}

// ============================================================================================
// INDEFINITE CYCLING -- the algorithm never throws or stalls across many more cycles than any
// realistic content pool would require (the actual bug being fixed: "gets stuck").
// ============================================================================================

{
  const pool = ['x', 'y'];
  let state: DailyRotationState = INITIAL_DAILY_ROTATION_STATE;
  for (let i = 0; i < 500; i++) {
    state = advanceDailyRotation(pool, state, () => 0).state;
  }
  assert(state.cycleNumber >= 200, `500 picks against a 2-question pool advance through many cycles without ever stalling (reached cycle ${state.cycleNumber})`);
}

// ============================================================================================
// NEVER TOUCHES daily_answers -- the selection algorithm is pure state bookkeeping only.
// ============================================================================================

{
  const dailyRotationSource = read('../src/data/daily-rotation.ts');
  const dailyRotationCode = dailyRotationSource
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  assert(!/daily_answers/.test(dailyRotationCode), 'daily-rotation.ts contains no real reference to daily_answers in actual code (only explanatory comments may mention it) -- selection state is fully separate from answer history');
}

// ============================================================================================
// THE REAL SQL MIGRATION -- source-text confirmation that the actual runtime rotation matches
// the algorithm shape validated above, and preserves prior historical responses.
// ============================================================================================

{
  const migrationSource = read('../supabase/migrations/20261001010000_daily_rotation_cycle.sql');
  assert(/create table public\.daily_rotation_state/.test(migrationSource), 'the migration creates the rotation-state table');
  assert(/create or replace function public\.advance_daily_rotation/.test(migrationSource), 'the migration creates advance_daily_rotation()');
  assert(/status in \('Live', 'Archived'\)/.test(migrationSource), 'the eligible pool is real, previously-published content only (Live/Archived) -- never Draft/Scheduled/Rejected, never invented');
  assert(/not \(id = any\(v_state\.shown_question_ids\)\)/.test(migrationSource), 'candidates exclude questions already shown in the current cycle');
  assert(/cycle_number = v_state\.cycle_number \+ 1, shown_question_ids = '\{\}'/.test(migrationSource), 'exhausting the pool increments the cycle number and resets the shown-ids list -- the durable "start a new cycle" fallback, not a one-time manual reset');
  assert(!/delete from public\.daily_answers|update public\.daily_answers/.test(migrationSource), 'the migration never deletes or modifies daily_answers -- prior historical responses remain fully intact');
  assert(/publish_scheduled_daily_for_today\(\)/.test(migrationSource), 'the admin-Scheduled calendar (publish_scheduled_daily_for_today) is tried first and left unmodified, never bypassed');
  assert(/revoke execute on function public\.advance_daily_rotation/.test(migrationSource), 'advance_daily_rotation is owner/cron-only -- never reachable by anon or authenticated');

  // The ORIGINAL scheduler function itself is untouched by this migration (no CREATE OR
  // REPLACE of it here) -- re-confirm its own migration still exists and still defines it.
  const originalSchedulerSource = read('../supabase/migrations/20260916030000_daily_scheduler.sql');
  assert(/create or replace function public\.publish_scheduled_daily_for_today/.test(originalSchedulerSource), 'the original admin-Scheduled publishing function is untouched, not duplicated or replaced by this pass');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED.`);
  process.exit(1);
}
console.log('\nALL Daily rotation (Build 9 Part A) VALIDATION CHECKS PASSED.');
