// Detects a genuine Creature-identity change using the real, already-computed topTraits
// output from scorePersonalityProfile/the V2 gap-fill merge (the one approved, LOCKED engine --
// see the migration this calls into for why this detection deliberately lives here, in TS,
// rather than re-derived in SQL). Compares against the last-known trait set this device has
// already seen; enqueues a real notification only for a trait that is NEW to the set, never on
// every reload/recalculation (task requirement: "do not notify on every minor recalculation").

import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import type { SignatureTrait } from '@/data/personality';

const SEEN_TRAITS_KEY = 'apparently:notifications:seen-creature-traits';

const readSeenTraitIds = async (): Promise<Set<string>> => {
  try {
    const raw = typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage.getItem(SEEN_TRAITS_KEY) : await AsyncStorage.getItem(SEEN_TRAITS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const writeSeenTraitIds = async (ids: Set<string>): Promise<void> => {
  try {
    const value = JSON.stringify([...ids]);
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(SEEN_TRAITS_KEY, value);
      return;
    }
    await AsyncStorage.setItem(SEEN_TRAITS_KEY, value);
  } catch {
    // Best-effort -- worst case a trait notifies again after a storage failure, never worse
    // than that (no data integrity depends on this cache).
  }
};

// Call every time You successfully reloads a real profile. A device's FIRST ever read (no
// seen-traits cache yet) seeds the cache silently -- it never fires a flood of "new trait"
// notifications for traits that were simply never checked before, only for ones that appear
// AFTER a real baseline is established.
export const checkAndNotifyCreatureEvolution = async (topTraits: readonly SignatureTrait[]): Promise<void> => {
  const seen = await readSeenTraitIds();
  const isFirstEverCheck = seen.size === 0;
  const currentIds = topTraits.map((trait) => `${trait.id}:${trait.name}`);

  if (!isFirstEverCheck && supabase) {
    const newlyQualified = topTraits.filter((trait) => !seen.has(`${trait.id}:${trait.name}`));
    for (const trait of newlyQualified) {
      await supabase.rpc('enqueue_creature_evolution_notification', { p_trait_display_name: trait.displayName });
    }
  }

  await writeSeenTraitIds(new Set(currentIds));
};
