import {
  CREATURE_SLOT_BY_RANK,
  type CreatureCharacteristic,
  type CreatureIdentity,
  type CreatureRecipe,
  type FirstFormIdentity,
} from '@/data/creature/creature-identity';
import type { CreatureTestSlot } from '@/data/creature-test/creature-test-assets';

export const FIRST_FORM_ANSWER_THRESHOLD = 8;
export const FIRST_MIXED_FORM_ANSWER_THRESHOLD = 50;

export type CreatureSnapshotTrait = {
  rank: number;
  part: CreatureTestSlot;
  traitName: string;
  characteristic: CreatureCharacteristic;
};

export type RevealedMixedCreatureSnapshot = {
  name: string;
  recipe: CreatureRecipe;
  traits: CreatureSnapshotTrait[];
  firstMixedRevealedAt: string;
  firstMixedRevealedLocalDate: string;
  lastCheckedEvolutionDate: string | null;
};

export type CreatureChange = {
  part: CreatureTestSlot | 'name';
  message: string;
};

export type WeeklyEvolutionResult = {
  outcome: 'changed' | 'unchanged';
  snapshot: RevealedMixedCreatureSnapshot;
  changes: CreatureChange[];
};

const PART_COPY: Record<CreatureTestSlot, string> = {
  eyes: 'Your eyes',
  earsHorns: 'Your ears and horns',
  wings: 'Your wings',
  body: 'Your shape',
  tail: 'Your tail',
};

const padDatePart = (value: number): string => String(value).padStart(2, '0');

/** A YYYY-MM-DD key built only from the device's local calendar fields. */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

const localCalendarDate = (date: Date): Date =>
  // Noon avoids crossing a date boundary during DST transitions when days are added/subtracted.
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);

export function getLatestFridayCheckpointKey(date: Date): string {
  const local = localCalendarDate(date);
  const daysSinceFriday = (local.getDay() - 5 + 7) % 7;
  local.setDate(local.getDate() - daysSinceFriday);
  return toLocalDateKey(local);
}

/** The next Friday strictly after the supplied local calendar day. */
export function getNextFridayCheckpointKey(date: Date): string {
  const local = localCalendarDate(date);
  const daysUntilFriday = (5 - local.getDay() + 7) % 7 || 7;
  local.setDate(local.getDate() + daysUntilFriday);
  return toLocalDateKey(local);
}

export function formatEvolutionDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const local = new Date(year, month - 1, day, 12, 0, 0, 0);
  return local.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function isFirstFormEligible(
  profileAnswerCount: number,
  firstForm: FirstFormIdentity | null,
): boolean {
  return profileAnswerCount >= FIRST_FORM_ANSWER_THRESHOLD && firstForm !== null;
}

export function isFirstMixedFormEligible(
  profileAnswerCount: number,
  candidate: CreatureIdentity | null,
): candidate is CreatureIdentity & { name: string; recipe: CreatureRecipe } {
  return (
    profileAnswerCount >= FIRST_MIXED_FORM_ANSWER_THRESHOLD &&
    candidate?.isComplete === true &&
    candidate.name !== null
  );
}

export function createMixedCreatureSnapshot(
  candidate: CreatureIdentity & { name: string; recipe: CreatureRecipe },
  revealedAt: Date,
): RevealedMixedCreatureSnapshot {
  return {
    name: candidate.name,
    recipe: { ...candidate.recipe },
    traits: candidate.assignments.map((assignment) => ({
      rank: assignment.rank,
      part: assignment.slot,
      traitName: assignment.trait.name,
      characteristic: assignment.characteristic,
    })),
    firstMixedRevealedAt: revealedAt.toISOString(),
    firstMixedRevealedLocalDate: toLocalDateKey(revealedAt),
    lastCheckedEvolutionDate: null,
  };
}

export function getPendingEvolutionCheckpointKey(
  now: Date,
  snapshot: RevealedMixedCreatureSnapshot,
): string | null {
  const latestCheckpoint = getLatestFridayCheckpointKey(now);

  // A first mixed form revealed on a Friday cannot check that same Friday. Lexical ordering
  // is safe because every key is zero-padded ISO calendar order (YYYY-MM-DD).
  if (latestCheckpoint <= snapshot.firstMixedRevealedLocalDate) {
    return null;
  }
  if (
    snapshot.lastCheckedEvolutionDate !== null &&
    latestCheckpoint <= snapshot.lastCheckedEvolutionDate
  ) {
    return null;
  }
  return latestCheckpoint;
}

const traitsByPart = (traits: CreatureSnapshotTrait[]) =>
  new Map(traits.map((trait) => [trait.part, trait] as const));

export function checkWeeklyEvolution(
  current: RevealedMixedCreatureSnapshot,
  candidate: CreatureIdentity & { name: string; recipe: CreatureRecipe },
  checkpointDate: string,
): WeeklyEvolutionResult {
  const candidateSnapshot = createMixedCreatureSnapshot(candidate, new Date(current.firstMixedRevealedAt));
  const oldTraits = traitsByPart(current.traits);
  const newTraits = traitsByPart(candidateSnapshot.traits);
  const changes: CreatureChange[] = [];

  if (current.name !== candidateSnapshot.name) {
    changes.push({
      part: 'name',
      message: `Your name changed from ${current.name} to ${candidateSnapshot.name}.`,
    });
  }

  for (const part of CREATURE_SLOT_BY_RANK) {
    if (current.recipe[part] === candidateSnapshot.recipe[part]) {
      continue;
    }
    const previousTrait = oldTraits.get(part)?.traitName;
    const nextTrait = newTraits.get(part)?.traitName;
    const detail = previousTrait && nextTrait ? ` — now ${nextTrait}, previously ${previousTrait}.` : '.';
    changes.push({ part, message: `${PART_COPY[part]} changed${detail}` });
  }

  if (changes.length === 0) {
    return {
      outcome: 'unchanged',
      changes,
      snapshot: { ...current, lastCheckedEvolutionDate: checkpointDate },
    };
  }

  return {
    outcome: 'changed',
    changes,
    snapshot: {
      ...candidateSnapshot,
      firstMixedRevealedAt: current.firstMixedRevealedAt,
      firstMixedRevealedLocalDate: current.firstMixedRevealedLocalDate,
      lastCheckedEvolutionDate: checkpointDate,
    },
  };
}
