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
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => snapshot;

const hydrate = async (): Promise<void> => {
  if (hydrated || !isDiagnosticBuild) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      snapshot = { ...DEFAULT_CONTROLS, ...JSON.parse(raw) };
      notify();
    }
  } catch {
    // Best-effort -- a diagnostic build that fails to restore its last toggle state simply
    // starts from ON/ON (normal), same as a fresh install.
  }
};

// Read-only everywhere except the diagnostic build's own hidden Settings section (below).
// Returns the fixed, inert default immediately when !isDiagnosticBuild -- callers never need
// their own build check before reading this.
export const useDiagnosticControls = (): DiagnosticControls => {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  if (isDiagnosticBuild && !hydrated) {
    void hydrate();
  }
  return isDiagnosticBuild ? current : DEFAULT_CONTROLS;
};

// No-op outside a diagnostic build -- defensive even though the only call site (the hidden
// Settings section) already never renders unless isDiagnosticBuild is true.
export const setDiagnosticControl = (key: keyof DiagnosticControls, value: boolean): void => {
  if (!isDiagnosticBuild) return;
  snapshot = { ...snapshot, [key]: value };
  notify();
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
};
