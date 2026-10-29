// The ONE place ad eligibility is decided. Every ad placement component calls useAdEligibility()
// instead of reading usePremiumStatus/AdsConfig itself -- so "zero ads for a subscriber" and
// "withhold ads while uncertain" are each enforced in exactly one function, not
// re-implemented per placement.
//
// FAIL-SAFE RULE (explicit task requirement): 'loading' and 'error' from usePremiumStatus both
// resolve to NOT eligible. Only a server-verified 'free' status (RevenueCat-backed, the same
// authoritative source Apparently Private's own paywall gate reads -- see purchases-service.ts)
// makes a user ad-eligible. This never "assumes free" from a missing/cached value; it assumes
// the safer default (no ads) until the real entitlement is known. Reactive: usePremiumStatus is
// a useSyncExternalStore-backed snapshot that already updates immediately on purchase,
// restore, and expiration (see purchases-service.ts's own subscribe/notify) -- useAdEligibility
// inherits that for free, with no separate cache of its own to go stale.

import { isAdultEligible, useAgeEligibility } from '@/data/age-eligibility';
import { AdsConfig, resolveQuizAdVariant } from '@/services/ads-config';
import { usePremiumStatus } from '@/services/purchases-service';
import { computeAdEligibility, type AdEligibility } from '@/services/ad-eligibility-logic';

export type AdPlacement = keyof typeof AdsConfig.placements;
export type { AdEligibility };

export const useAdEligibility = (placement: AdPlacement): AdEligibility => {
  const premium = usePremiumStatus();
  const ageEligibility = useAgeEligibility();

  return computeAdEligibility({
    premiumStatus: premium.status,
    placementEnabled: AdsConfig.placements[placement],
    globalEnabled: AdsConfig.globalEnabled,
    isAdultEligible: isAdultEligible(ageEligibility),
  });
};

export const resolveAdVariant = resolveQuizAdVariant;
