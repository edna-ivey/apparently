import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ColorFamilyKey, EffectKey, RelicTraitKey } from '@/data/relic/relic-assets';
import { IDENTITY_TRANSFORM, resolveOpacity, resolveTransform, type RelicTransform } from '@/data/relic/relic-transform';

// Relic Lab calibration model (R&D ONLY). Three independent layers -- BASE RELIC, COLOR,
// EFFECT -- each with its own default transform; COLOR and EFFECT also carry their own
// opacity. finalTransform = layerDefault + perAssetCorrection (correction optional, defaults
// to identity), the exact same "default + sparse correction" shape Creature Lab already
// established (see creature-test-config.ts) -- reused as a PATTERN only. No state, storage
// key, or saved values are shared with Creature Lab.
//
// The transform type/math and the asset registry are the SAME canonical modules production
// uses (@/data/relic/relic-transform, @/data/relic/relic-assets) -- re-exported here under
// their original Relic-Lab-only names (RelicLabTransform, etc.) purely so this lab's own UI
// code doesn't need a sweeping rename. There is still only one transform implementation.

export type RelicLabTransform = RelicTransform;
export { IDENTITY_TRANSFORM, resolveOpacity, resolveTransform };

export type RelicLayerDefaults = {
  base: RelicLabTransform;
  color: RelicLabTransform & { opacity: number };
  effect: RelicLabTransform & { opacity: number };
};

// Starting calibration values ONLY (per the brief) -- not an inferred production answer. (The
// REAL approved production calibration lives in @/data/relic/relic-production-config.ts, not
// here -- this lab default is just where a fresh /dev/relic-lab session starts from.)
export const DEFAULT_LAYER_DEFAULTS: RelicLayerDefaults = {
  base: { ...IDENTITY_TRANSFORM },
  color: { ...IDENTITY_TRANSFORM, opacity: 0.6 },
  effect: { ...IDENTITY_TRANSFORM, opacity: 0.3 },
};

// --- Per-asset corrections -------------------------------------------------------------
// Optional, sparse, per-individual-asset adjustment on top of its layer's shared default --
// e.g. one specific Relic sitting slightly off-center at the shared default scale. Keyed by
// the asset's own key (RelicTraitKey / ColorFamilyKey / EffectKey) so switching which asset is
// selected within a layer never has to touch the other two layers' corrections.

export type RelicAssetCorrections = {
  base: Partial<Record<RelicTraitKey, Partial<RelicLabTransform>>>;
  color: Partial<Record<ColorFamilyKey, Partial<RelicLabTransform & { opacity: number }>>>;
  effect: Partial<Record<EffectKey, Partial<RelicLabTransform & { opacity: number }>>>;
};

export const EMPTY_ASSET_CORRECTIONS: RelicAssetCorrections = { base: {}, color: {}, effect: {} };

// --- Persistence (dedicated Relic Lab key -- never Creature Lab's) ----------------------
// Same dual web/native storage shim pattern already used elsewhere in this app (e.g.
// src/data/onboarding.ts), kept local to this module rather than shared, exactly as that
// file's own comment explains for itself.

const STORAGE_KEY = 'apparently:relic-lab:v1';

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
      // ignore storage errors -- worst case calibration doesn't persist this session
    }
  },
};

export type RelicLabCalibration = {
  layerDefaults: RelicLayerDefaults;
  assetCorrections: RelicAssetCorrections;
};

export async function loadRelicLabCalibration(): Promise<RelicLabCalibration> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (!raw) {
    return { layerDefaults: { ...DEFAULT_LAYER_DEFAULTS }, assetCorrections: { ...EMPTY_ASSET_CORRECTIONS } };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<RelicLabCalibration>;
    return {
      layerDefaults: {
        base: { ...DEFAULT_LAYER_DEFAULTS.base, ...(parsed.layerDefaults?.base ?? {}) },
        color: { ...DEFAULT_LAYER_DEFAULTS.color, ...(parsed.layerDefaults?.color ?? {}) },
        effect: { ...DEFAULT_LAYER_DEFAULTS.effect, ...(parsed.layerDefaults?.effect ?? {}) },
      },
      assetCorrections: {
        base: parsed.assetCorrections?.base ?? {},
        color: parsed.assetCorrections?.color ?? {},
        effect: parsed.assetCorrections?.effect ?? {},
      },
    };
  } catch {
    // Corrupt JSON -- fail safe to defaults rather than throwing.
    return { layerDefaults: { ...DEFAULT_LAYER_DEFAULTS }, assetCorrections: { ...EMPTY_ASSET_CORRECTIONS } };
  }
}

export async function saveRelicLabCalibration(calibration: RelicLabCalibration): Promise<void> {
  await storage.setItem(STORAGE_KEY, JSON.stringify(calibration));
}
