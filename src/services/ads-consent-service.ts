// Consent + ATT orchestration for advertising. The ONE place that calls Google's User Messaging
// Platform (UMP, via AdsConsent) and Apple's App Tracking Transparency (via
// expo-tracking-transparency) -- never called from a placement component directly, and never
// called at all for a subscriber (ads-config/ad-eligibility-service already keep every
// placement component from ever reaching this for a premium user).
//
// SEQUENCING (Google's own recommended order): gather UMP consent first (this call is a no-op
// prompt-wise for a user outside a regulated region -- the task's own instruction is "do not
// assume ATT permission is required for every ad request," and the SAME is true of the GDPR
// form itself, which this SDK already does not show unless the user's own detected region
// requires it), THEN request ATT (only if the OS reports it as genuinely undetermined -- never
// re-prompt a user who already answered), THEN initialize the Google Mobile Ads SDK. Called
// lazily, once, the first time a free user actually reaches an ad placement -- never at app
// launch, and never for a subscriber.
//
// UNDER-18 RULE: the caller passes underAgeOfConsent (from the existing, already-approved
// age-eligibility signal -- see ad-eligibility-service.ts's personalizedAdsAllowed). When true,
// this is passed to UMP as tagForUnderAgeOfConsent, and this service independently forces
// requestNonPersonalizedAdsOnly regardless of what UMP/ATT report -- a 13-17 (or never-asked)
// account can never end up with personalized ads through any code path.

import { Platform } from 'react-native';
import { AdsConsent, AdsConsentStatus, MobileAds } from 'react-native-google-mobile-ads';
import * as TrackingTransparency from 'expo-tracking-transparency';

export type AdsConsentResult = { requestNonPersonalizedAdsOnly: boolean };

let preparePromise: Promise<AdsConsentResult> | null = null;

export const prepareAdsConsent = async (options: { underAgeOfConsent: boolean }): Promise<AdsConsentResult> => {
  if (preparePromise) {
    return preparePromise;
  }

  preparePromise = (async (): Promise<AdsConsentResult> => {
    let consentObtainedOrNotRequired = false;
    try {
      const consentInfo = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: options.underAgeOfConsent });
      consentObtainedOrNotRequired = consentInfo.status === AdsConsentStatus.OBTAINED || consentInfo.status === AdsConsentStatus.NOT_REQUIRED;
    } catch {
      // Fail safe: any UMP error is treated as consent NOT obtained (never assumed granted).
      consentObtainedOrNotRequired = false;
    }

    let attGranted = true; // Non-iOS platforms have no ATT concept; never withhold for that reason alone.
    if (Platform.OS === 'ios') {
      try {
        const current = await TrackingTransparency.getTrackingPermissionsAsync();
        // Only request if the OS itself reports this was never asked -- never re-prompt a user
        // who already answered, and never request for a reason other than genuinely needing
        // the answer (the task's own "do not ask unnecessarily" instruction).
        const resolved = current.status === 'undetermined' ? await TrackingTransparency.requestTrackingPermissionsAsync() : current;
        attGranted = resolved.status === 'granted';
      } catch {
        attGranted = false;
      }
    }

    try {
      await MobileAds().initialize();
    } catch {
      // Ad placements already handle a failed/timed-out load independently of this -- a failed
      // SDK init simply means every subsequent load attempt also fails, handled the same way.
    }

    const requestNonPersonalizedAdsOnly = options.underAgeOfConsent || !consentObtainedOrNotRequired || !attGranted;
    return { requestNonPersonalizedAdsOnly };
  })();

  return preparePromise;
};
