import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RevealedMixedCreatureSnapshot } from '@/data/creature/creature-progression';
import {
  CHARACTERISTIC_NAMING_ROOTS,
  CREATURE_SLOT_BY_RANK,
  type CreatureRecipe,
} from '@/data/creature/creature-identity';

export const CREATURE_EVOLUTION_STORAGE_KEY = 'apparently:creature-evolution:v1';
export const CREATURE_EVOLUTION_SCHEMA_VERSION = 1 as const;

export type CreatureEvolutionState = {
  version: typeof CREATURE_EVOLUTION_SCHEMA_VERSION;
  firstFormRevealSeen: boolean;
  mixedSnapshot: RevealedMixedCreatureSnapshot | null;
};

export const EMPTY_CREATURE_EVOLUTION_STATE: CreatureEvolutionState = {
  version: CREATURE_EVOLUTION_SCHEMA_VERSION,
  firstFormRevealSeen: false,
  mixedSnapshot: null,
};

const storage = {
  getItem: async (key: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // Presentation persistence is best-effort. The live personality profile remains truth.
    }
  },
};

const isString = (value: unknown): value is string => typeof value === 'string';
const isNullableDateKey = (value: unknown): value is string | null =>
  value === null || (isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value));

const isCompleteRecipe = (value: unknown): value is CreatureRecipe => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return CREATURE_SLOT_BY_RANK.every(
    (part) => isString(record[part]) && record[part] in CHARACTERISTIC_NAMING_ROOTS,
  );
};

const isValidSnapshot = (value: unknown): value is RevealedMixedCreatureSnapshot => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    isString(candidate.name) &&
    isCompleteRecipe(candidate.recipe) &&
    Array.isArray(candidate.traits) &&
    candidate.traits.length === CREATURE_SLOT_BY_RANK.length &&
    candidate.traits.every((trait) => {
      if (!trait || typeof trait !== 'object' || Array.isArray(trait)) return false;
      const item = trait as Record<string, unknown>;
      return (
        typeof item.rank === 'number' &&
        isString(item.part) &&
        CREATURE_SLOT_BY_RANK.includes(item.part as (typeof CREATURE_SLOT_BY_RANK)[number]) &&
        isString(item.traitName) &&
        isString(item.characteristic) &&
        item.characteristic in CHARACTERISTIC_NAMING_ROOTS
      );
    }) &&
    isString(candidate.firstMixedRevealedAt) &&
    isString(candidate.firstMixedRevealedLocalDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.firstMixedRevealedLocalDate) &&
    isNullableDateKey(candidate.lastCheckedEvolutionDate)
  );
};

export function parseCreatureEvolutionState(value: unknown): CreatureEvolutionState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (
    candidate.version !== CREATURE_EVOLUTION_SCHEMA_VERSION ||
    typeof candidate.firstFormRevealSeen !== 'boolean' ||
    (candidate.mixedSnapshot !== null && !isValidSnapshot(candidate.mixedSnapshot))
  ) {
    return null;
  }
  const mixedSnapshot = candidate.mixedSnapshot as RevealedMixedCreatureSnapshot | null;
  return {
    version: CREATURE_EVOLUTION_SCHEMA_VERSION,
    firstFormRevealSeen: candidate.firstFormRevealSeen,
    mixedSnapshot: mixedSnapshot
      ? {
          name: mixedSnapshot.name,
          recipe: { ...mixedSnapshot.recipe },
          traits: mixedSnapshot.traits.map((trait) => ({ ...trait })),
          firstMixedRevealedAt: mixedSnapshot.firstMixedRevealedAt,
          firstMixedRevealedLocalDate: mixedSnapshot.firstMixedRevealedLocalDate,
          lastCheckedEvolutionDate: mixedSnapshot.lastCheckedEvolutionDate,
        }
      : null,
  };
}

export async function loadCreatureEvolutionState(): Promise<CreatureEvolutionState> {
  const stored = await storage.getItem(CREATURE_EVOLUTION_STORAGE_KEY);
  if (!stored) {
    return { ...EMPTY_CREATURE_EVOLUTION_STATE };
  }
  try {
    return parseCreatureEvolutionState(JSON.parse(stored)) ?? { ...EMPTY_CREATURE_EVOLUTION_STATE };
  } catch {
    return { ...EMPTY_CREATURE_EVOLUTION_STATE };
  }
}

export async function saveCreatureEvolutionState(state: CreatureEvolutionState): Promise<void> {
  await storage.setItem(CREATURE_EVOLUTION_STORAGE_KEY, JSON.stringify(state));
}
