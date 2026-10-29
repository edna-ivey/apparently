import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ColorFamilyKey, EffectKey, RelicTraitKey } from '@/data/relic/relic-assets';
import type { RelicTransform as RelicLabTransform } from '@/data/relic/relic-transform';

// Relic Lab -- explicit, intentional "Save Calibration" workflow (R&D ONLY, same scope as the
// rest of this tool). Separate from the general layer-defaults/asset-corrections calibration
// in relic-lab-config.ts: THAT is "how does this layer/asset behave by default everywhere it's
// used"; THIS is "I tuned Shield + Reflection/Perspective + Orbit specifically and want to come
// back to exactly that look" -- one saved visual state per exact relic+color+effect
// combination, never overwriting another combination's save. Its own dedicated storage key,
// never Creature Lab's and never relic-lab-config.ts's own key.

export type SavedCombination = {
  relic: RelicTraitKey;
  color: ColorFamilyKey;
  effect: EffectKey;
  base: RelicLabTransform;
  colorLayer: RelicLabTransform & { opacity: number };
  effectLayer: RelicLabTransform & { opacity: number };
  savedAt: string;
};

export type SavedCombinationsMap = Record<string, SavedCombination>;

export function buildCombinationKey(relic: RelicTraitKey, color: ColorFamilyKey, effect: EffectKey): string {
  return `${relic}|${color}|${effect}`;
}

const STORAGE_KEY = 'apparently:relic-lab:saved-combinations:v1';

// Same dual web/native storage shim pattern as relic-lab-config.ts -- kept local to this module
// rather than shared, same reasoning as that file's own comment.
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore storage errors -- worst case a save doesn't persist this session
    }
  },
};

export async function loadSavedCombinations(): Promise<SavedCombinationsMap> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as SavedCombinationsMap) : {};
  } catch {
    // Corrupt JSON -- fail safe to "no saves" rather than throwing.
    return {};
  }
}

async function writeSavedCombinations(map: SavedCombinationsMap): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// Saves (or overwrites) exactly ONE combination's entry -- reads the current full map first so
// a save for one combination can never clobber any other combination's save.
export async function saveCombination(key: string, combination: SavedCombination): Promise<SavedCombinationsMap> {
  const current = await loadSavedCombinations();
  const next = { ...current, [key]: combination };
  await writeSavedCombinations(next);
  return next;
}

// Deletes exactly ONE combination's entry, leaving every other saved combination untouched.
export async function clearSavedCombination(key: string): Promise<SavedCombinationsMap> {
  const current = await loadSavedCombinations();
  if (!(key in current)) return current;
  const next = { ...current };
  delete next[key];
  await writeSavedCombinations(next);
  return next;
}

// Import replaces the WHOLE saved-combinations map (the paired "Export Saved Calibrations"
// round-trips the same full-map JSON shape) -- validated just enough to refuse obviously
// malformed input rather than silently corrupting storage with garbage.
export async function importSavedCombinations(json: string): Promise<SavedCombinationsMap> {
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object of "<relic>|<color>|<effect>": {...} entries.');
  }
  await writeSavedCombinations(parsed as SavedCombinationsMap);
  return parsed as SavedCombinationsMap;
}
