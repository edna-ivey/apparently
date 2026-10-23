// Centralized AdMob configuration -- the ONE place every ad placement reads its ad-unit id,
// enabled/disabled flag, cooldown, cap, spacing, or A/B variant from. No placement component
// ever reads an env var or hardcodes an id directly; everything routes through this module so
// a single owner-facing change (an env var, or a value here) controls every placement at once.
//
// SAFE-BY-DEFAULT: every ad-unit id below defaults to one of Google's own official, publicly
// documented TEST ad units (https://developers.google.com/admob/ios/test-ads) when the
// corresponding EXPO_PUBLIC_ADMOB_* env var is unset -- exactly the same "placeholder means
// safe fallback behavior, never a crash or a real charge" pattern isRevenueCatConfigured
// already uses for RevenueCat. The native iOS AdMob APP id (app.json's
// react-native-google-mobile-ads plugin config) is ALSO still Google's public test app id
// today -- see docs/ADVERTISING_AND_NOTIFICATIONS_SETUP_2026-10-22.md for exactly what the
// owner needs to create in their own AdMob account and where to paste the real ids before any
// production ad can ever serve. Nothing here is a secret; ad-unit ids are not credentials
// (they identify a placement, not an account) -- the real secret-adjacent value, the AdMob
// account itself, never appears in this app's code at all.

import { TestIds } from 'react-native-google-mobile-ads';

const isRealConfiguredValue = (value: string | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && !trimmed.toLowerCase().includes('your-');
};

const envInterstitial = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID;
const envNative = process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID;

// TestIds.* are read from the SDK's own exported constants (never hand-typed) -- always
// Google's current official test ad units, see https://developers.google.com/admob/ios/test-ads.
export const AD_UNIT_IDS = {
  interstitial: isRealConfiguredValue(envInterstitial) ? (envInterstitial as string) : TestIds.INTERSTITIAL,
  native: isRealConfiguredValue(envNative) ? (envNative as string) : TestIds.NATIVE,
};

// True only when a REAL (non-test, non-placeholder) ad-unit id has been supplied via env var --
// lets the app/owner know at a glance whether it is still running in Google's test sandbox.
export const isUsingRealAdUnits = isRealConfiguredValue(envInterstitial) && isRealConfiguredValue(envNative);

export type AdPlacementVariant = 'pre-reveal' | 'mid-quiz';

// Every knob the task's "Ad controls and configuration" section named explicitly. Plain
// exported constants, not a remote-config system -- this app has no feature-flagging backend
// (confirmed: no LaunchDarkly/Statsig/etc. anywhere in this codebase), so "configurable" here
// means "change one value in this file and ship a build," matching how every other
// product constant in this app (e.g. Spacing, MAX_PRIVATE_SIGNALS) already works. If a true
// remote-config system is ever added, this is the one file that would read from it instead.
export const AdsConfig = {
  // Global kill switch. False disables every ad placement everywhere, instantly, regardless of
  // subscription status -- the one flag that overrides all the per-placement ones below.
  globalEnabled: true,

  placements: {
    quizInterstitial: true,
    exploreNative: true,
    dailyInterstitial: true,
  },

  // Minimum real time between two quiz/Daily interstitials, regardless of source -- prevents
  // "finish quiz, immediately start and finish another" from showing back-to-back full-screen
  // ads. Shared across quiz AND Daily interstitials (task: "Coordinate frequency limits with
  // other full-screen advertisements") -- both read the SAME cooldown clock, see
  // ad-interstitial-service.ts.
  interstitialCooldownSeconds: 90,

  // Hard ceiling on full-screen interstitials in one app session (resets on cold start, never
  // persisted) -- a safety net independent of the cooldown, so a long single session (many
  // quizzes back to back, cooldown satisfied each time) still cannot show an unbounded number.
  maxInterstitialsPerSession: 4,

  // Every Nth card in the Explore feed is a native sponsored card instead of a real quiz card.
  // Conservative default per the task's own instruction ("keep ad density conservative").
  nativeAdCardSpacing: 6,

  // Default placement for the quiz interstitial, per the task's explicit instruction ("support
  // experimentation... but default to pre-reveal"). See resolveQuizAdVariant below for how an
  // experiment would actually assign a user to 'mid-quiz' without touching this default.
  defaultQuizAdVariant: 'pre-reveal' as AdPlacementVariant,

  // How long an ad is allowed to attempt loading before this app gives up and proceeds without
  // it. Applies to both interstitial and native loads -- never blocks the user's own content
  // past this window, no matter what the SDK is doing.
  adLoadTimeoutMs: 4000,
} as const;

// Deterministic, non-random A/B assignment -- the SAME user always lands in the SAME variant
// for the life of their install (no flicker between pre-reveal and mid-quiz run to run), without
// needing a server-side experiment-assignment table. A simple, stable string hash of the
// user's own id, mod 2. Returns the CONFIGURED default when experimentation isn't active (the
// normal case today -- AdsConfig.defaultQuizAdVariant alone decides) so flipping an experiment
// on/off later is additive, never a behavior change to existing default-variant users.
export const resolveQuizAdVariant = (userId: string | null, experimentActive: boolean): AdPlacementVariant => {
  if (!experimentActive || !userId) {
    return AdsConfig.defaultQuizAdVariant;
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? 'pre-reveal' : 'mid-quiz';
};
