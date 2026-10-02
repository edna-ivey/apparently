import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only "has this device already seen the Creature reveal celebration" flag. Deliberately
// NOT part of CreatureIdentity/buildCreatureIdentity (src/data/creature/creature-identity.ts)
// and never sent anywhere -- it answers a presentation question ("should the one-time reveal
// moment play right now?"), never an identity question ("what is the user's Creature?"). The
// Creature itself stays fully derived from the live personality profile every time (see
// creature-identity.ts's own header comment on why no recipe is persisted) -- this flag cannot
// change what Creature renders, only whether the celebratory reveal sequence plays again.
//
// EXTENSION POINT (Build 8 Creature v1 polish pass): a future "Your Creature evolved" moment
// would follow the same shape -- persist the previously-seen CreatureIdentity (name + recipe
// only, not raw evidence) locally or remotely, and on each resolve compare it against the
// freshly-computed one from current profile data. CreatureIdentity's recipe/name fields are
// already structured for exactly that diff. That comparison is NOT implemented here; this
// module only tracks whether the FIRST reveal has played.

const CREATURE_REVEAL_SEEN_KEY = 'apparently:creature-reveal-seen';

export const hasSeenCreatureReveal = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(CREATURE_REVEAL_SEEN_KEY);
    return value === 'true';
  } catch {
    // Storage read failure -- fail toward showing the reveal again rather than silently
    // skipping a moment the user may never have actually seen.
    return false;
  }
};

export const markCreatureRevealSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CREATURE_REVEAL_SEEN_KEY, 'true');
  } catch {
    // Best-effort only -- a failed write just means the reveal may play again next time,
    // never a crash.
  }
};
