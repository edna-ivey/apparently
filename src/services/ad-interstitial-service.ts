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
// CORRECTED (Build 23 P0 stability review): "always resolves" was not actually true before
// this fix -- the load step had a timeout, but prepareAdsConsent (ads-consent-service.ts) and
// the "wait for CLOSED after show" step below did not. Both are now bounded too (the former
// inside ads-consent-service.ts itself; the latter via withTimeout below), so this function's
// own header comment is now actually enforced end to end, not just for the one step that had
// always been timed.
//
// WHY 120s for the show-wait specifically does NOT mean "the user waits 120s for their result":
// quiz/[quizId].tsx has its own SEPARATE 5-second safety timer that force-reveals the result
// content regardless of whether THIS function has resolved yet -- confirmed directly, not
// assumed (search that file for freshCompletionAdResolved). That timer is what actually bounds
// the user's perceived wait; this function's own 120s bound only governs when ITS OWN promise
// (session cap/cooldown bookkeeping, analytics) settles, and exists purely so that promise can
// never hang forever, never to gate what the user sees.
//
// Caller contract: call this ONLY after the caller's own useAdEligibility(placement).eligible
// is true -- this module does not re-check subscription status itself (ad-eligibility-service
// is the one place that does). This module owns exactly three things no eligibility check can:
// session-level frequency (cooldown + per-session cap, shared across placements), the actual
// SDK load/show lifecycle, and the result/analytics logging for that lifecycle.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

import { logAnalyticsEvent, type AdPlacementName } from '@/services/analytics-service';
import { withTimeout } from '@/services/with-timeout';
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

  // CORRECTED (Build 23 P0 stability review): this previously had no bound at all -- if the ad
  // showed but CLOSED never fired (a real, documented class of native event-delivery bug, not
  // hypothetical), this function hung forever, and so did every caller awaiting it (both
  // placements' result rendering). cleanup() is idempotent and shared by every exit path
  // (closed, show() rejecting, and now timeout) so listeners are released exactly once no
  // matter which path actually resolves first, and a late-arriving real CLOSED event after a
  // timeout can never double-resolve or re-fire analytics.
  let cleanup = () => {};
  const closedOrTimedOut = await withTimeout(
    new Promise<void>((resolve) => {
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
        cleanup();
        resolve();
      });
      let cleaned = false;
      cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        unsubscribeImpression();
        unsubscribePaid();
        unsubscribeClosed();
      };
      interstitial.show().catch(() => {
        cleanup();
        resolve();
      });
    }),
    AdsConfig.interstitialShowTimeoutMs,
  );
  if (closedOrTimedOut === 'timeout') {
    cleanup();
    // HONEST LIMITATION (Build 23 P0 review, correctly flagged): destroy() releases this app's
    // OWN JS-side reference, listeners, and internal presence tracking -- confirmed by reading
    // the installed SDK's real MobileAd.destroy() body, which calls the native module's own
    // destroy function. It does NOT, and cannot, force-dismiss an already-presented native
    // full-screen ad view: neither Google's iOS nor Android AdMob SDK expose a programmatic
    // "close this ad" API once show() has genuinely presented it -- only the user's own tap on
    // the ad's close control, or the ad finishing its own content, actually removes that native
    // view. This timeout exists so this function's own JS PROMISE (and therefore the result
    // screen awaiting it) can never hang forever -- it makes the REACT side of the app
    // recoverable once the real overlay situation resolves by whatever means, but if the ad is
    // genuinely stuck on-screen (the rare, real failure mode this guards against), the user may
    // still see it until they interact with it or background/foreground the app. There is no
    // code-level fix for that possible outcome; it is a platform constraint of this ad SDK.
    void interstitial.destroy();
    logAnalyticsEvent({ name: 'ad_failed', properties: { placement, error_code: 'show_timeout' } });
    // Deliberately does NOT count toward interstitialsShownThisSession/cooldown -- an ad that
    // never confirmed it closed was never confirmed to have actually shown to completion; the
    // existing session cap and cooldown both exist to protect the USER from too many ads, which
    // an ad this function gave up waiting on was not.
    return false;
  }

  interstitialsShownThisSession += 1;
  await setStoredLastShownAt(Date.now());
  logAnalyticsEvent({ name: 'ad_dismissed', properties: { placement } });
  return true;
};
