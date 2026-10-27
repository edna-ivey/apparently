// Web-only stand-in for ads-config.ts. No ad ever renders on web (every placement's own
// web counterpart below resolves to "no ad" without touching react-native-google-mobile-ads
// at all) -- this file exists ONLY so every other module that imports AD_UNIT_IDS/AdsConfig/
// resolveQuizAdVariant (e.g. ad-eligibility-service.ts, used by explore.tsx on every platform)
// keeps resolving on web, without Metro ever bundling the native-only SDK for a web build (see
// "Importing native-only module ... on web from react-native-google-mobile-ads" -- the exact
// failure this split fixes). Metro/Expo picks this file over ads-config.ts automatically for
// any web bundle; native builds are completely unaffected and keep using the real ads-config.ts.
//
// AD_UNIT_IDS values below are never actually sent to any ad request on web -- nothing in the
// web build ever calls an AdMob API -- they exist only to satisfy the same type shape.

export const AD_UNIT_IDS = {
  interstitial: 'unused-on-web',
  native: 'unused-on-web',
};

export const isUsingRealAdUnits = false;

export type AdPlacementVariant = 'pre-reveal' | 'mid-quiz';

export const AdsConfig = {
  globalEnabled: true,
  placements: {
    quizInterstitial: true,
    exploreNative: true,
    dailyInterstitial: true,
  },
  interstitialCooldownSeconds: 90,
  maxInterstitialsPerSession: 4,
  nativeAdCardSpacing: 6,
  defaultQuizAdVariant: 'pre-reveal' as AdPlacementVariant,
  adLoadTimeoutMs: 4000,
} as const;

export const resolveQuizAdVariant = (_userId: string | null, _experimentActive: boolean): AdPlacementVariant => AdsConfig.defaultQuizAdVariant;
