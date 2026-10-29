// Imperative full-screen interstitial flow -- shared by the quiz-result and Daily-reveal
// placements, since both are the same "load, show, wait for close, then proceed" shape and
// both must share ONE cooldown clock (task: "Coordinate frequency limits with other
// full-screen advertisements"). The exported function ALWAYS resolves, never throws or
// rejects -- a caller awaits it and then proceeds to render its real content regardless of
// whether an ad loaded, showed, failed, or was skipped by cooldown/cap. This is what makes
// "never lose, change, or delay access to an earned result because an ad fails" structurally
// true: there is no code path in this module that can prevent its own promise from resolving
// (every branch, including every error branch, reaches a `return`).
//
// Caller contract: call this ONLY after the caller's own useAdEligibility(placement).eligible
// is true -- this module does not re-check subscription status itself (ad-eligibility-service
// is the one place that does). This module owns exactly three things no eligibility check can:
// session-level frequency (cooldown + per-session cap, shared across placements), the actual
// SDK load/show lifecycle, and the result/analytics logging for that lifecycle.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

import { logAnalyticsEvent, type AdPlacementName } from '@/services/analytics-service';
import { AD_UNIT_IDS, AdsConfig } from '@/services/ads-config';
import { prepareAdsConsent } from '@/services/ads-consent-service';

const LAST_SHOWN_KEY = 'apparently:ads:last-interstitial-shown-at';

const getStoredLastShownAt = async (): Promise<number | null> => {
  try {
    const raw = typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage.getItem(LAST_SHOWN_KEY) : await AsyncStorage.getItem(LAST_SHOWN_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const setStoredLastShownAt = async (timestampMs: number): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(LAST_SHOWN_KEY, String(timestampMs));
      return;
    }
    await AsyncStorage.setItem(LAST_SHOWN_KEY, String(timestampMs));
  } catch {
    // Best-effort -- a cooldown that fails to persist just means the NEXT check reads null and
    // (correctly, conservatively) allows an ad rather than blocking one indefinitely.
  }
};

// In-memory only -- deliberately resets on cold start/relaunch, per AdsConfig.
// maxInterstitialsPerSession's own definition ("resets on cold start, never persisted").
let interstitialsShownThisSession = 0;

export const resetInterstitialSessionCapForTesting = (): void => {
  interstitialsShownThisSession = 0;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> =>
  Promise.race([promise, new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), ms))]);

// Resolves true only when the ad genuinely showed (reached CLOSED after a real impression
// opportunity) -- false for every skip/failure path (cap, cooldown, load timeout/error). The
// caller uses this for accurate "was an ad actually shown" analytics -- never assumes showing
// just because it was eligible/attempted.
export const showInterstitialIfDue = async (placement: AdPlacementName, underAgeOfConsent: boolean): Promise<boolean> => {
  if (interstitialsShownThisSession >= AdsConfig.maxInterstitialsPerSession) {
    return false;
  }

  const lastShownAt = await getStoredLastShownAt();
  if (lastShownAt !== null && Date.now() - lastShownAt < AdsConfig.interstitialCooldownSeconds * 1000) {
    return false;
  }

  logAnalyticsEvent({ name: 'ad_request', properties: { placement, ad_unit_id: AD_UNIT_IDS.interstitial } });
  const loadStartedAt = Date.now();

  const { requestNonPersonalizedAdsOnly } = await prepareAdsConsent({ underAgeOfConsent });

  const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, { requestNonPersonalizedAdsOnly });

  const loadResult = await withTimeout(
    new Promise<'loaded' | 'error'>((resolve) => {
      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        unsubscribeLoaded();
        unsubscribeError();
        resolve('loaded');
      });
      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
        unsubscribeLoaded();
        unsubscribeError();
        resolve('error');
      });
      interstitial.load();
    }),
    AdsConfig.adLoadTimeoutMs,
  );

  if (loadResult !== 'loaded') {
    logAnalyticsEvent({ name: 'ad_failed', properties: { placement, error_code: loadResult === 'timeout' ? 'load_timeout' : 'load_error' } });
    return false;
  }
  logAnalyticsEvent({ name: 'ad_loaded', properties: { placement, load_time_ms: Date.now() - loadStartedAt } });

  await new Promise<void>((resolve) => {
    const unsubscribeImpression = interstitial.addAdEventListener(AdEventType.IMPRESSION, () => {
      logAnalyticsEvent({ name: 'ad_impression', properties: { placement } });
    });
    const unsubscribePaid = interstitial.addAdEventListener(AdEventType.PAID, (payload) => {
      // valueMicros (an exact decimal string the SDK itself provides) is preferred over
      // deriving micros from the floating-point `value`, per the SDK's own documented
      // guidance on this payload shape.
      const estimatedRevenueMicros = payload.valueMicros ? Number(payload.valueMicros) : Math.round(payload.value * 1_000_000);
      logAnalyticsEvent({
        name: 'ad_revenue_paid',
        properties: {
          placement,
          estimated_revenue_micros: estimatedRevenueMicros,
          currency_code: payload.currency,
          precision: String(payload.precision),
        },
      });
    });
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeImpression();
      unsubscribePaid();
      unsubscribeClosed();
      resolve();
    });
    interstitial.show().catch(() => {
      unsubscribeImpression();
      unsubscribePaid();
      unsubscribeClosed();
      resolve();
    });
  });

  interstitialsShownThisSession += 1;
  await setStoredLastShownAt(Date.now());
  logAnalyticsEvent({ name: 'ad_dismissed', properties: { placement } });
  return true;
};
