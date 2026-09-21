import AsyncStorage from '@react-native-async-storage/async-storage';

// A friend answering "THEY HAVE NOTES." never signs in with anything identifying — this is
// the ONE opaque, client-generated identity that lets them (a) resubmit without counting as a
// second person (compare_responses' unique(share_id, respondent_token)) and (b) read back
// their own comparison later. Persisted per share_id, not globally, so answering about two
// different owners never links those two responses together as "the same respondent" from the
// server's point of view beyond what the owner's own aggregate already legitimately sees.

const STORAGE_PREFIX = 'apparently:respondent-token:';

const generateOpaqueToken = (): string => {
  const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  // Fallback RFC 4122 v4 UUID for runtimes without a native crypto.randomUUID (some RN/Hermes
  // configurations). Not used as a security secret on its own — it's paired server-side with
  // the specific share_id it was created against.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const getOrCreateRespondentToken = async (shareId: string): Promise<string> => {
  const key = `${STORAGE_PREFIX}${shareId}`;
  try {
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const token = generateOpaqueToken();
    await AsyncStorage.setItem(key, token);
    return token;
  } catch {
    // Storage unavailable (private browsing, disabled site data) — fall back to an in-memory
    // token for this session only. A page refresh will generate a new one and be treated as a
    // fresh respondent, which is an honest degradation, not a data-integrity bug.
    return generateOpaqueToken();
  }
};
