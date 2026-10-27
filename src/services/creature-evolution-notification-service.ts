// Detects a genuine Creature-identity change using the real, already-computed topTraits
// output from scorePersonalityProfile/the V2 gap-fill merge (the one approved, LOCKED engine).
// CORRECTION (owner security/correctness pass, 2026-10-23): this used to track "which traits
// has this DEVICE already seen" in local AsyncStorage/localStorage -- broken for "account-
// specific and persistent across devices... prevent duplicate notifications on sign-out,
// switch accounts, reinstall, or change devices" (see the migration this now calls for the
// full writeup of exactly how the old design failed each of those cases). This module now
// holds NO local state of its own at all -- it only ever reports the account's real, current
// trait set to the server (sync_creature_traits, account-scoped by auth.uid(), idempotent via
// a real unique constraint) and lets the server decide what counts as newly qualified.

import { supabase } from '@/lib/supabase';
import type { SignatureTrait } from '@/data/personality';
import { traitKey } from '@/services/creature-evolution-trait-key';

// Call every time You successfully reloads a real profile. Safe to call every time, from
// every device, as often as the profile reloads -- the server-side unique constraint on
// (user_id, trait_key) makes a repeat report of an already-known trait set a true no-op
// (zero rows inserted, zero notifications), so this never needs its own caller-side
// debouncing or "did I already call this" tracking.
export const checkAndNotifyCreatureEvolution = async (topTraits: readonly SignatureTrait[]): Promise<void> => {
  if (!supabase || topTraits.length === 0) {
    return;
  }
  await supabase.rpc('sync_creature_traits', { p_trait_keys: topTraits.map(traitKey) });
};
