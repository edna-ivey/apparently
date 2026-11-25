// Build 23 P0 stability investigation: a owner-only, build-gated way to compare Ads ON/OFF x
// Notifications ON/OFF on ONE installed TestFlight build, so the freeze investigation can
// isolate which subsystem (if either) actually contributes -- per the explicit instruction that
// "these diagnostic controls must never become public-user feature switches or permanently
// disable monetization."
//
// SAFETY, by construction, not by convention:
//   1. isDiagnosticBuild reads EXPO_PUBLIC_DIAGNOSTIC_BUILD, an env var set ONLY on the new
//      `diagnostic` EAS build profile (eas.json) -- the real `production`/`testflight` profiles
//      never set it, so this module is INERT (both overrides permanently false, no UI rendered
//      anywhere) in every build that will ever reach a real user or the App Store.
//   2. Even within a diagnostic build, the override is additive -- every real call site ANDs
//      this with the existing config/eligibility check (AdsConfig.globalEnabled, placement
//      enablement, premium/free status, age/consent gating), never replaces or bypasses any of
//      them. A diagnostic build with ads "on" still behaves EXACTLY like production; flipping
//      "off" can only ever suppress an ad that would otherwise have been shown, never grant one
//      that real eligibility rules would have denied (e.g. to a subscriber).
//   3. Resets to ON/ON (normal) on a fresh install of the diagnostic build -- a tester cannot
//      accidentally carry a stale "off" setting across builds, and nothing here ever reaches a
//      production build's storage key (different AsyncStorage key, never read by one).
//
// HONEST LIMITATION (Build 23 P0 review, item 3): Ads-OFF prevents any NEW ad request, native
// ad mount, or interstitial show from this point forward in the running process -- confirmed by
// reading every real call site (ad-eligibility-service.ts's useAdEligibility, which every
// placement component already gates on before ever touching the AdMob SDK). It CANNOT undo
// MobileAds().initialize() or any native AdMob SDK state already established earlier in the
// SAME process if the user reached an ad placement before flipping this off -- there is no
// supported "un-initialize" API in this SDK family. A test comparing configurations therefore
// requires a FULL APP RESTART (kill the app, not just background it, then relaunch) between
// each configuration change -- toggling this switch while the app keeps running only isolates
// behavior GOING FORWARD in that same process, not a clean-room comparison. See the Build 23
// report's own test procedure for the exact steps.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export const isDiagnosticBuild = process.env.EXPO_PUBLIC_DIAGNOSTIC_BUILD === 'true';

export type DiagnosticControls = {
  adsDisabled: boolean;
  notificationsDisabled: boolean;
};

const STORAGE_KEY = 'apparently:diagnostic:controls';
const DEFAULT_CONTROLS: DiagnosticControls = { adsDisabled: false, notificationsDisabled: false };

let snapshot: DiagnosticControls = DEFAULT_CONTROLS;
let hydrated = false;
// The IN-FLIGHT promise itself, not just a boolean -- a second concurrent caller must await
// the SAME read completing, not just see a "hydration started" flag and resolve immediately
// against still-default data. This is exactly the race item 2 of the Build 23 review named:
// a cold-launch startup effect calling this before AsyncStorage has actually resolved must get
// the REAL persisted value, never a premature default.
let hydrationPromise: Promise<DiagnosticControls> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => snapshot;

// Resolves once the real persisted toggle state (if any) has been read -- awaiting this twice
// concurrently, or after it already completed, is always safe and always returns the current
// real snapshot. Outside the diagnostic build this resolves immediately with the fixed, inert
// default; callers never need their own build check first.
export const ensureDiagnosticControlsHydrated = async (): Promise<DiagnosticControls> => {
  if (!isDiagnosticBuild) return DEFAULT_CONTROLS;
  if (hydrated) return snapshot;
  if (!hydrationPromise) {
    hydrationPromise = (async (): Promise<DiagnosticControls> => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          snapshot = { ...DEFAULT_CONTROLS, ...JSON.parse(raw) };
        }
      } catch {
        // Best-effort -- a diagnostic build that fails to restore its last toggle state simply
        // starts from ON/ON (normal), same as a fresh install.
      }
      hydrated = true;
      notify();
      return snapshot;
    })();
  }
  return hydrationPromise;
};

// On the first render, a diagnostic build must NEVER initiate an ad before the persisted
// Ads-OFF flag is read. Consumers can use this reactive readiness hook to fail closed.
const getHydratedSnapshot = () => hydrated;
export const useDiagnosticControlsReady = (): boolean => {
  const ready = useSyncExternalStore(subscribe, getHydratedSnapshot);
  if (isDiagnosticBuild && !ready) {
    void ensureDiagnosticControlsHydrated();
  }
  return !isDiagnosticBuild || ready;
};

// Read-only everywhere except the diagnostic build's own hidden Settings section (below).
// Returns the fixed, inert default immediately when !isDiagnosticBuild -- callers never need
// their own build check before reading this. For the FIRST render of a diagnostic build before
// hydration completes, this still returns the ON/ON default (React's own render must return
// something synchronously) -- any startup effect that must not race ahead of the real value
// should await ensureDiagnosticControlsHydrated() directly instead of reading this hook's first
// render result, which is exactly how _layout.tsx's own notification-startup block does it.
export const useDiagnosticControls = (): DiagnosticControls => {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  if (isDiagnosticBuild && !hydrated) {
    void ensureDiagnosticControlsHydrated();
  }
  return isDiagnosticBuild ? current : DEFAULT_CONTROLS;
};

// No-op outside a diagnostic build -- defensive even though the only call site (the hidden
// Settings section) already never renders unless isDiagnosticBuild is true.
export const setDiagnosticControl = (key: keyof DiagnosticControls, value: boolean): void => {
  if (!isDiagnosticBuild) return;
  hydrated = true; // an explicit user toggle is definitionally the current real value
  snapshot = { ...snapshot, [key]: value };
  notify();
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
};
