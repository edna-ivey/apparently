// Web-only stand-in for ads-consent-service.ts -- see ads-config.web.ts's header comment for
// why this split exists. No ad SDK, UMP consent flow, or ATT prompt exists on web at all, so
// there is nothing to gather/initialize here -- this resolves immediately with the safest
// possible default (non-personalized) rather than importing react-native-google-mobile-ads or
// expo-tracking-transparency for a platform where no ad request this value would gate ever
// actually happens (every web ad placement already no-ops via its own .web counterpart).

export type AdsConsentResult = { requestNonPersonalizedAdsOnly: boolean };

export const prepareAdsConsent = async (_options: { underAgeOfConsent: boolean }): Promise<AdsConsentResult> => ({
  requestNonPersonalizedAdsOnly: true,
});
