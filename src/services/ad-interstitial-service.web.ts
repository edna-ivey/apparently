// Web-only stand-in for ad-interstitial-service.ts -- see ads-config.web.ts's header comment
// for why this split exists. No interstitial ad is ever shown on web (react-native-google-
// mobile-ads is native-only); showInterstitialIfDue resolves false immediately, matching its
// real counterpart's own documented contract ("ALWAYS resolves... caller proceeds to render
// its real content regardless"), so every caller (index.tsx, quiz/[quizId].tsx) behaves
// correctly with zero changes on this platform.

export const resetInterstitialSessionCapForTesting = (): void => {};

export const showInterstitialIfDue = async (_placement: string, _underAgeOfConsent: boolean): Promise<boolean> => false;
