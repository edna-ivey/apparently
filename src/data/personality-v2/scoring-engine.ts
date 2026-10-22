import { ALL_POLE_IDS, comparePoleOrder, type PersonalityPoleId } from './pole-ids';

// Positive-only, independent-pole scoring engine (V2). Pure functions only -- no Supabase
// import, no React, no app-level types -- so this can be unit tested in isolation and, later,
// imported by both the client (for local/offline display) and reused as the reference
// implementation a server-side equivalent is checked against. See docs/
// personality-scoring-v2-design.md for the full product rules this implements and why it is
// a PARALLEL system (nothing here is wired into any live screen or into personality.ts's
// scorePersonalityProfile yet -- see that doc's "Rollout" section for the explicit, flagged
// decision this depends on).

export const ELIGIBILITY_THRESHOLD = 9;
export const MAX_POINTS_PER_QUESTION_PER_POLE = 3;
export const SCORING_VERSION = 'v2.0';

export type PoleEvidenceSourceType = 'daily_answer' | 'quiz_result';

// One row = one (presented question, pole) observation for one user. Mirrors the proposed
// personality_pole_evidence table 1:1 (see the design doc's schema section) -- this is
// deliberately NOT the same shape as personality.ts's DimensionEvidence (signed, dimension-
// keyed); a pole can have MULTIPLE independent rows across many questions, and a single
// question can produce rows for several different poles (possibly including both poles of
// the SAME dimension, if the question's content genuinely supports that -- see
// buildPoleEvidenceForPresentedQuestion below for why that's structurally possible here in a
// way it never was under the old signed model).
export type PoleEvidenceRow = {
  userId: string;
  sourceType: PoleEvidenceSourceType;
  // The one real completion event this row came from (a daily_answers.id or quiz_results.id,
  // as text) -- same source_id convention personality.ts's PersonalityAnswerEvidence already
  // uses. Distinct from questionStableId below: sourceId identifies WHEN/WHICH submission;
  // questionStableId identifies WHICH QUESTION, independent of how many times it's been
  // presented (a quiz retake reuses the same questionStableId under a new sourceId).
  sourceId: string;
  questionStableId: string;
  choiceStableId: string;
  poleId: PersonalityPoleId;
  pointsEarned: 0 | 1 | 2 | 3;
  maxAvailable: 0 | 1 | 2 | 3;
  scoringVersion: string;
  occurredAt: string;
};

export type ChoicePoleAward = { pole: PersonalityPoleId; points: 1 | 2 | 3 };

// One presented question's full choice set, as actually shown to the user -- the raw material
// buildPoleEvidenceForPresentedQuestion needs to compute a user-specific per-pole denominator
// ("the maximum available points for a pole are the highest points offered by any one mutually
// exclusive answer choice" -- never summed across choices the user could not select together).
export type PresentedChoice = { choiceId: string; awards: ChoicePoleAward[] };

// Builds every PoleEvidenceRow for ONE presented question, covering every pole ANY choice of
// this question could have awarded -- not just the poles the CHOSEN choice happened to award.
// This is what makes "zero-earned opportunities" real: a pole offered by an unselected choice
// still gets a row here (pointsEarned: 0, maxAvailable: whatever the best choice offered),
// which is exactly the denominator data the earned-percentage ranking needs and personality.ts
// never tracked (the old model only ever recorded evidence for poles that actually fired).
export const buildPoleEvidenceForPresentedQuestion = (params: {
  userId: string;
  sourceType: PoleEvidenceSourceType;
  sourceId: string;
  questionStableId: string;
  choices: PresentedChoice[];
  chosenChoiceId: string;
  occurredAt: string;
  scoringVersion?: string;
}): PoleEvidenceRow[] => {
  const { userId, sourceType, sourceId, questionStableId, choices, chosenChoiceId, occurredAt } = params;
  const scoringVersion = params.scoringVersion ?? SCORING_VERSION;

  const maxByPole = new Map<PersonalityPoleId, 0 | 1 | 2 | 3>();
  for (const choice of choices) {
    for (const award of choice.awards) {
      const current = maxByPole.get(award.pole) ?? 0;
      if (award.points > current) {
        maxByPole.set(award.pole, award.points);
      }
    }
  }

  const chosen = choices.find((choice) => choice.choiceId === chosenChoiceId);
  const earnedByPole = new Map<PersonalityPoleId, 0 | 1 | 2 | 3>();
  for (const award of chosen?.awards ?? []) {
    earnedByPole.set(award.pole, award.points);
  }

  return [...maxByPole.entries()].map(([poleId, maxAvailable]) => ({
    userId,
    sourceType,
    sourceId,
    questionStableId,
    choiceStableId: chosenChoiceId,
    poleId,
    pointsEarned: earnedByPole.get(poleId) ?? 0,
    maxAvailable,
    scoringVersion,
    occurredAt,
  }));
};

// Canonicalization policy for replays/duplicated questions (Bible-equivalent rule for V2 --
// see the design doc's "Replay and correction policy" section for the full rationale):
// for RANKING purposes, only the EARLIEST row for a given (questionStableId, poleId) pair
// counts. Every row is still kept forever in the underlying table/history (never deleted,
// never overwritten) -- this function only decides which rows a ranking computation reads,
// never what gets persisted. A quiz retake, or the same Daily scenario resurrected under a
// new database question id, produces a new sourceId/occurredAt for the SAME questionStableId;
// the later occurrence is excluded here so it can never inflate lifetime earned points or the
// user's denominator, exactly as required.
const dedupeForRanking = (rows: readonly PoleEvidenceRow[]): PoleEvidenceRow[] => {
  const firstByKey = new Map<string, PoleEvidenceRow>();
  for (const row of rows) {
    const key = `${row.questionStableId}::${row.poleId}`;
    const existing = firstByKey.get(key);
    if (!existing) {
      firstByKey.set(key, row);
      continue;
    }
    const existingTime = new Date(existing.occurredAt).getTime();
    const rowTime = new Date(row.occurredAt).getTime();
    if (rowTime < existingTime || (rowTime === existingTime && row.sourceId < existing.sourceId)) {
      firstByKey.set(key, row);
    }
  }
  return [...firstByKey.values()];
};

export type PoleStats = {
  poleId: PersonalityPoleId;
  lifetimeEarned: number;
  maxAvailableForUser: number;
  distinctQuestionsWithEarnedPoints: number;
  distinctQuestionsPresented: number;
  earnedPercent: number;
  eligible: boolean;
};

// One pole's full standing from a user's (already deduped) evidence rows. earnedPercent's
// denominator is the MAXIMUM AVAILABLE ACROSS QUESTIONS ACTUALLY PRESENTED TO THIS USER --
// never the app-catalog-wide maximum -- exactly the user-specific denominator the product
// rules require. A pole with zero presented opportunities has earnedPercent 0 (never NaN/
// Infinity) and is never eligible, matching "no defensible evidence" rather than a fabricated
// rate.
export const computePoleStats = (poleId: PersonalityPoleId, dedupedRowsForPole: readonly PoleEvidenceRow[]): PoleStats => {
  const lifetimeEarned = dedupedRowsForPole.reduce((sum, row) => sum + row.pointsEarned, 0);
  const maxAvailableForUser = dedupedRowsForPole.reduce((sum, row) => sum + row.maxAvailable, 0);
  const distinctQuestionsWithEarnedPoints = dedupedRowsForPole.filter((row) => row.pointsEarned > 0).length;

  return {
    poleId,
    lifetimeEarned,
    maxAvailableForUser,
    distinctQuestionsWithEarnedPoints,
    distinctQuestionsPresented: dedupedRowsForPole.length,
    earnedPercent: maxAvailableForUser > 0 ? lifetimeEarned / maxAvailableForUser : 0,
    eligible: lifetimeEarned >= ELIGIBILITY_THRESHOLD,
  };
};

export type RankedPole = PoleStats & { rank: number };

// Full ranking pass over a user's raw evidence rows (any order, any mix of sources/poles) --
// Step 1: dedupe per the replay/canonicalization policy above. Step 2: compute per-pole stats
// across all 64 poles (a pole with zero rows is simply ineligible, never omitted from the
// stats map). Step 3: keep only eligible poles, sorted by earned percentage (highest first),
// ties broken by raw lifetime earned points, and any STILL-tied poles broken by the fixed
// canonical pole order (comparePoleOrder) -- never random, never insertion-order-dependent.
export const rankPoles = (rawRows: readonly PoleEvidenceRow[]): RankedPole[] => {
  const deduped = dedupeForRanking(rawRows);
  const byPole = new Map<PersonalityPoleId, PoleEvidenceRow[]>();
  for (const poleId of ALL_POLE_IDS) {
    byPole.set(poleId, []);
  }
  for (const row of deduped) {
    byPole.get(row.poleId)?.push(row);
  }

  const eligible = ALL_POLE_IDS.map((poleId) => computePoleStats(poleId, byPole.get(poleId) ?? [])).filter((stats) => stats.eligible);

  eligible.sort((a, b) => {
    if (b.earnedPercent !== a.earnedPercent) {
      return b.earnedPercent - a.earnedPercent;
    }
    if (b.lifetimeEarned !== a.lifetimeEarned) {
      return b.lifetimeEarned - a.lifetimeEarned;
    }
    return comparePoleOrder(a.poleId, b.poleId);
  });

  return eligible.map((stats, index) => ({ ...stats, rank: index + 1 }));
};

// Every pole's stats, eligible or not -- what the post-fix coverage/fairness audit needs
// (section 12 of the Build 16/V2 brief asks for every pole's standing, not just the ones that
// currently qualify). Same dedupe/compute pipeline as rankPoles, just unfiltered and
// unsorted (callers that want ranking order should use rankPoles instead).
export const computeAllPoleStats = (rawRows: readonly PoleEvidenceRow[]): PoleStats[] => {
  const deduped = dedupeForRanking(rawRows);
  const byPole = new Map<PersonalityPoleId, PoleEvidenceRow[]>();
  for (const poleId of ALL_POLE_IDS) {
    byPole.set(poleId, []);
  }
  for (const row of deduped) {
    byPole.get(row.poleId)?.push(row);
  }
  return ALL_POLE_IDS.map((poleId) => computePoleStats(poleId, byPole.get(poleId) ?? []));
};
