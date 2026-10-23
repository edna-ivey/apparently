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

export type AdPlacement = keyof typeof AdsConfig.placements;

export type AdEligibility = {
  // True only when: ads are globally enabled, this specific placement is enabled, and the
  // caller's subscription status is server-verified 'free' (never 'loading'/'error'/'premium').
  eligible: boolean;
  // True while subscription status is still resolving -- a placement should neither show nor
  // permanently give up yet; it should wait (or treat this exactly like ineligible, which is
  // the conservative, always-correct choice every call site in this app makes).
  statusUncertain: boolean;
  // Per GDPR-K / Google's own under-13 and "age of consent" guidance: any account that has not
  // confirmed 18+ (age_eligibility is '13to17' or null/never-asked) gets non-personalized ads
  // only, regardless of ATT/consent answers -- see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_
  // 2026-10-22.md for the full reasoning. This reuses the SAME existing, already-approved
  // age-eligibility signal the 18+ Private gate reads (src/data/age-eligibility.ts) -- no new
  // age question is ever asked for this purpose.
  personalizedAdsAllowed: boolean;
};

export const useAdEligibility = (placement: AdPlacement): AdEligibility => {
  const premium = usePremiumStatus();
  const ageEligibility = useAgeEligibility();

  const statusUncertain = premium.status === 'loading' || premium.status === 'error';
  const isFree = premium.status === 'free';
  const placementEnabled = AdsConfig.globalEnabled && AdsConfig.placements[placement];

  return {
    eligible: placementEnabled && isFree && !statusUncertain,
    statusUncertain,
    personalizedAdsAllowed: isAdultEligible(ageEligibility),
  };
};

export const resolveAdVariant = resolveQuizAdVariant;
