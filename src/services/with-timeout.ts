// Shared by every ad-SDK interaction that must provably resolve within a known bounded time --
// Build 23 P0 stability fix. Previously ad-interstitial-service.ts had its own private copy of
// this exact helper, used only for the ad LOAD step; ads-consent-service.ts (UMP consent, ATT,
// MobileAds().initialize()) and the interstitial's own "wait for CLOSED after show" step had no
// equivalent bound at all -- any one of those hanging (a real, documented failure mode on some
// SDK/OS combinations, not hypothetical) left the calling await pending indefinitely, which is
// exactly the "load step has a timeout but the service as a whole does not" gap found by
// independent review. One shared implementation now, so every bounded wait behaves identically
// and no future addition can silently reintroduce an unbounded await.

export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> =>
  Promise.race([promise, new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms))]);
