// Shared helper for the Build 22 historical backfill scripts (quiz + Daily). Converts a flat
// list of calibration rows -- shaped exactly like public.quiz_choice_pole_awards
// (choice_id, pole_id, points) for ONE question, every choice included, not just the chosen
// one -- into the PresentedChoice[] shape scoring-engine.ts's buildPoleEvidenceForPresentedQuestion
// already expects. The backfill scripts call that SAME live function with this converted
// input, rather than re-deriving points_earned/max_available with separate logic -- this is
// what guarantees a backfilled row is byte-identical to what the live trigger/RPC would have
// written for the same (question, choices, chosen answer), by construction, not by a second
// implementation that could silently drift from the first.

import type { PresentedChoice } from '../../src/data/personality-v2/scoring-engine';
import type { PersonalityPoleId } from '../../src/data/personality-v2/pole-ids';

export type AwardRow = { choiceId: string; poleId: string; points: number };

export const presentedChoicesFromAwardRows = (awardRows: readonly AwardRow[]): PresentedChoice[] => {
  const byChoice = new Map<string, PresentedChoice>();
  for (const row of awardRows) {
    const existing = byChoice.get(row.choiceId) ?? { choiceId: row.choiceId, awards: [] };
    existing.awards.push({ pole: row.poleId as PersonalityPoleId, points: row.points as 1 | 2 | 3 });
    byChoice.set(row.choiceId, existing);
  }
  return [...byChoice.values()];
};
