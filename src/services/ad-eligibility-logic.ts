// Pure ad-eligibility decision logic -- zero imports of any kind, so this is directly
// importable from a plain tsx/Node test (scripts/validate-ad-eligibility-logic.ts) without
// needing to mock React, react-native, or any RN-native-module package. ad-eligibility-
// service.ts (which DOES have those dependencies, since it reads the real reactive
// usePremiumStatus/useAgeEligibility hooks) is a thin wrapper around this.

export type PremiumStatus = 'loading' | 'free' | 'premium' | 'error';

export type AdEligibility = {
  // True only when: ads are globally enabled, this specific placement is enabled, and the
  // caller's subscription status is server-verified 'free' (never 'loading'/'error'/'premium').
  eligible: boolean;
  // True while subscription status is still resolving -- the conservative, always-correct
  // choice every call site in this app makes is to treat this exactly like ineligible.
  statusUncertain: boolean;
  // Per GDPR-K / Google's own under-13 and "age of consent" guidance: any account that has
  // not confirmed 18+ gets non-personalized ads only, regardless of ATT/consent answers.
  personalizedAdsAllowed: boolean;
};

export const computeAdEligibility = (params: {
  premiumStatus: PremiumStatus;
  placementEnabled: boolean;
  globalEnabled: boolean;
  isAdultEligible: boolean;
}): AdEligibility => {
  const statusUncertain = params.premiumStatus === 'loading' || params.premiumStatus === 'error';
  const isFree = params.premiumStatus === 'free';

  return {
    eligible: params.globalEnabled && params.placementEnabled && isFree && !statusUncertain,
    statusUncertain,
    personalizedAdsAllowed: params.isAdultEligible,
  };
};

// The consent decision (ads-consent-service.ts's own final combination rule) -- also pure,
// also worth testing exhaustively on its own, separated here for the same reason.
export const computeRequestNonPersonalizedAdsOnly = (params: {
  underAgeOfConsent: boolean;
  consentObtainedOrNotRequired: boolean;
  attGranted: boolean;
}): boolean => params.underAgeOfConsent || !params.consentObtainedOrNotRequired || !params.attGranted;
