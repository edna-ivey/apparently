import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { ensureAnonymousSession, getCurrentUserId } from './auth-service';
import { isPrivateDailyTesterAccessEnabled, supabase } from '@/lib/supabase';

// The ONE place react-native-purchases is ever imported or called from. Every screen goes
// through this module's exported functions/hooks -- never `import Purchases from
// 'react-native-purchases'` anywhere else in the app.
//
// CRITICAL: the state this module exposes (usePremiumStatus/useEffectivePremium, built from
// the RevenueCat SDK's local CustomerInfo) is FOR UI RESPONSIVENESS ONLY -- dismissing the
// paywall, showing "Active"/"Free" on You, choosing which "why is this unlocked" label to
// show. It is NEVER the authorization boundary for paid server data. That boundary is
// server-side (Supabase user_entitlements, kept current by the sync-revenuecat-entitlement/
// revenuecat-webhook Edge Functions, checked inside get_private_daily/submit_private_daily_
// answer themselves) -- no RPC anywhere accepts a client-supplied "I'm premium" parameter.
// This module calls syncServerEntitlement() (below) at the points that actually change
// entitlement state (after purchase, after restore, on init, on stale foreground) so that
// server-side mirror stays current, but the client never needs to -- and structurally cannot
// -- assert premium status directly to a paid-content RPC.
//
// Native-only by construction: react-native-purchases requires a native StoreKit build (no
// Expo Go, no web) -- see isPurchasesPlatformSupported below. Every exported function here is
// safe to call unconditionally from any platform; each one checks platform/config itself and
// degrades to an honest "unavailable" result rather than crashing or importing the native
// module's side effects on an unsupported platform.
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';

// ---------------------------------------------------------------------------------------
// Stable identifiers -- approved names, not invented here. Keep these three in sync with
// whatever is actually configured in the RevenueCat dashboard and App Store Connect (see the
// engineering sprint report's external-setup checklist) -- a mismatch here means "offering
// unavailable" / "no monthly package," handled gracefully, never a crash.
// ---------------------------------------------------------------------------------------

export const APPARENTLY_PRIVATE_ENTITLEMENT_ID = 'apparently_private';
export const APPARENTLY_PRIVATE_OFFERING_ID = 'default';
export const APPARENTLY_PRIVATE_MONTHLY_PRODUCT_ID = 'apparently_private_monthly';

// ---------------------------------------------------------------------------------------
// Config detection -- same isXConfigured convention as isSupabaseConfigured
// (src/lib/supabase.ts). Both env AND platform must be real before this module ever touches
// the native module. RevenueCat's PUBLIC iOS SDK key is designed to ship inside the client
// binary (same trust model as Supabase's publishable key) -- never a secret key, never the
// RevenueCat dashboard/API secret.
// ---------------------------------------------------------------------------------------

const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

const isRealConfiguredValue = (value: string | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && !trimmed.toLowerCase().includes('your-');
};

export const isRevenueCatConfigured = isRealConfiguredValue(revenueCatIosApiKey);

// StoreKit/RevenueCat's native purchase APIs only exist on a real native iOS build -- never
// Expo Go, never web (react-native-purchases ships its own web module backed by RevenueCat's
// separate Web Billing product, which this app does NOT use -- see the WEB BEHAVIOR section
// of the engineering sprint report). This is the single gate every exported function below
// checks first; nothing here ever imports/executes native purchase functionality on web.
export const isPurchasesPlatformSupported = Platform.OS === 'ios' || Platform.OS === 'android';

if (__DEV__ && !isRevenueCatConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[purchases-service] EXPO_PUBLIC_REVENUECAT_IOS_API_KEY is not set. Purchases are disabled; ' +
      'premium status will always resolve to "free" (tester override, if enabled, still applies). ' +
      'See the engineering sprint report for the exact RevenueCat setup checklist.',
  );
}

// ---------------------------------------------------------------------------------------
// Premium state -- one reactive store, useSyncExternalStore, same pattern as
// src/data/onboarding.ts's useOnboardingState/useUserProfile. Every subscriber (paywall,
// You's subscription status card, any future gated screen) reads the exact same snapshot;
// no screen holds its own copy of "am I premium."
// ---------------------------------------------------------------------------------------

export type PremiumStatus = 'loading' | 'free' | 'premium' | 'error';

export type PremiumSnapshot = {
  status: PremiumStatus;
  // Only meaningful when status === 'error' -- a human-readable, non-technical reason.
  message?: string;
  // The real RevenueCat CustomerInfo behind a 'premium'/'free' status, once loaded -- used for
  // the subscription status surface (managementURL, renewal info) and restore/purchase
  // confirmation. Never fabricated; always either a real SDK response or undefined.
  customerInfo?: CustomerInfo;
};

let snapshot: PremiumSnapshot = { status: isPurchasesPlatformSupported && isRevenueCatConfigured ? 'loading' : 'free' };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const setSnapshot = (next: PremiumSnapshot) => {
  snapshot = next;
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

// The real RevenueCat entitlement truth ONLY -- deliberately independent of the tester
// override (see useEffectivePremium below). This is what the subscription status surface and
// paywall show, so a tester on the TestFlight tester-access build profile can still see and
// test the REAL subscribe/restore/cancel flow honestly, instead of always reading "Active"
// because content happens to already be unlocked by the tester flag.
export const usePremiumStatus = (): PremiumSnapshot => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const deriveSnapshotFromCustomerInfo = (customerInfo: CustomerInfo): PremiumSnapshot => ({
  status: customerInfo.entitlements.active[APPARENTLY_PRIVATE_ENTITLEMENT_ID]?.isActive ? 'premium' : 'free',
  customerInfo,
});

// ---------------------------------------------------------------------------------------
// Tester override -- REUSES the existing isPrivateDailyTesterAccessEnabled build flag
// (src/lib/supabase.ts), never a second/competing tester concept. That flag is already
// scoped to the dedicated EAS "testflight" build profile's env only (never production/web).
//
// CORRECTED in Build 8 (see the "delayed Private Daily unlock" investigation): this flag is
// deliberately NO LONGER OR'd into useEffectivePremium below. It used to be -- "premium =
// RevenueCat entitlement active OR tester override" -- which is exactly what caused a real,
// confirmed bug: on the TestFlight build (where this flag is always true), useEffectivePremium
// already returned true BEFORE a purchase, so a successful purchase's status transition
// ('free' -> 'premium') never changed useEffectivePremium's OUTPUT value (true || true is
// still just true). usePrivateDailyExperience's load() is a useCallback keyed on that output
// value, so its useEffect never saw a dependency change and never refetched -- Private Daily
// stayed locked until a force-close+relaunch remounted the hook from scratch. A client build
// flag must never be able to mask a real entitlement transition like this; real paid
// entitlement now drives every consumer premium surface unconditionally. The flag itself is
// kept (still real, still exported) purely for "why is this unlocked" display copy in the
// spots that already show it explicitly (e.g. the Today Private Drop badge) -- never again for
// gating/gating-adjacent booleans like useEffectivePremium.
// ---------------------------------------------------------------------------------------

export const isTesterOverrideEnabled = isPrivateDailyTesterAccessEnabled;

// The one function content-gating call sites should use: "can this device see premium
// content right now." Real RevenueCat entitlement ONLY -- see the correction above. Returns
// false while status is still 'loading'/'error' -- content stays gated (never optimistically
// unlocked) until a real answer is known. Server-side authorization was always independent of
// this value (see get_private_daily/submit_private_daily_answer's own tester_access_grants
// check) -- this change affects client display/reactivity only, never security.
export const useEffectivePremium = (): boolean => {
  const { status } = usePremiumStatus();
  return status === 'premium';
};

// ---------------------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------------------

let configuredOnce = false;
let customerInfoListenerRegistered = false;

// Identity strategy: RevenueCat's appUserID is set to the SAME stable anonymous Supabase
// auth.uid() this app already establishes for every other remote feature (ensureAnonymousSession,
// the same identity quiz_results/personality_evidence/compare_responses already key off of).
// This requires no new login/signup UX, exposes no raw UID in any user-visible copy (it is
// only ever passed as an opaque SDK parameter), and keeps one consistent identity concept
// across the app rather than inventing a second one for purchases.
//
// Reinstall/relaunch safety: a fresh install gets a NEW anonymous Supabase session (and so a
// new RevenueCat appUserID) -- exactly like every other anonymous-first feature in this app.
// This does NOT lose a real purchase: Restore Purchases (restorePurchases() below) resolves
// against the App Store account's actual receipt/transaction history, which RevenueCat
// correctly re-associates with whatever appUserID calls restore, independent of which
// appUserID originally made the purchase. This is RevenueCat's own documented transfer
// behavior for exactly this scenario -- not something this app has to implement itself.
export const initializePurchases = async (): Promise<void> => {
  if (!isPurchasesPlatformSupported || !isRevenueCatConfigured) {
    setSnapshot({ status: 'free' });
    return;
  }
  if (configuredOnce) {
    return;
  }
  configuredOnce = true;

  try {
    const session = await ensureAnonymousSession();
    const appUserID = session?.user.id ?? (await getCurrentUserId()) ?? undefined;

    Purchases.configure({ apiKey: revenueCatIosApiKey as string, appUserID });
    if (__DEV__) {
      void Purchases.setLogLevel(LOG_LEVEL.WARN);
    }

    if (!customerInfoListenerRegistered) {
      customerInfoListenerRegistered = true;
      // Fires on every entitlement change RevenueCat becomes aware of -- a fresh purchase,
      // a restore, a renewal, an expiration detected on relaunch -- so the premium state
      // this module exposes is never a one-shot snapshot that goes stale while the app stays
      // open. This is what avoids "premium flashes locked" and stale-boolean problems.
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        setSnapshot(deriveSnapshotFromCustomerInfo(customerInfo));
      });
    }

    await refreshCustomerInfo();
    void syncServerEntitlement();
  } catch (error) {
    configuredOnce = false;
    setSnapshot({ status: 'error', message: 'Could not connect to Apparently Private right now.' });
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] initializePurchases failed:', error);
    }
  }
};

// Re-fetches CustomerInfo and updates the shared snapshot. Safe to call anytime (cold start,
// returning foreground, after a purchase/restore) -- RevenueCat itself caches CustomerInfo
// locally, so this resolves fast/offline-safe on a warm start rather than always hitting the
// network, and still reflects the last known real entitlement state rather than a stale local
// boolean this app invented itself.
export const refreshCustomerInfo = async (): Promise<void> => {
  if (!isPurchasesPlatformSupported || !isRevenueCatConfigured) {
    setSnapshot({ status: 'free' });
    return;
  }
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    setSnapshot(deriveSnapshotFromCustomerInfo(customerInfo));
  } catch (error) {
    setSnapshot({ status: 'error', message: 'Could not check your subscription status right now.' });
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] refreshCustomerInfo failed:', error);
    }
  }
};

// ---------------------------------------------------------------------------------------
// Server entitlement sync -- invokes the sync-revenuecat-entitlement Edge Function, which
// derives the caller's identity from their own Supabase JWT (never trusts anything this
// module sends it) and re-queries RevenueCat's server API directly, then upserts the real
// result into user_entitlements. This is what makes the server-side authorization boundary
// (see the header comment above) actually stay current -- without this, a purchase would be
// locally visible via CustomerInfo but never actually unlock server-checked content.
// Deliberately fire-and-forget/best-effort from every call site below: a transient failure
// here never blocks the local purchase/restore UI (which already reflects the SDK's own
// truth), and self-heals on the next foreground/app-open sync.
// ---------------------------------------------------------------------------------------

const SERVER_SYNC_STALE_MS = 5 * 60 * 1000; // 5 minutes
let lastServerSyncAt = 0;

export const syncServerEntitlement = async (): Promise<void> => {
  if (!isPurchasesPlatformSupported || !isRevenueCatConfigured || !supabase) {
    return;
  }
  try {
    const { error } = await supabase.functions.invoke('sync-revenuecat-entitlement', { method: 'POST' });
    if (error && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] syncServerEntitlement failed:', error);
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] syncServerEntitlement threw:', error);
    }
  } finally {
    lastServerSyncAt = Date.now();
  }
};

const syncServerEntitlementIfStale = async (): Promise<void> => {
  if (Date.now() - lastServerSyncAt < SERVER_SYNC_STALE_MS) {
    return;
  }
  await syncServerEntitlement();
};

// ---------------------------------------------------------------------------------------
// Offering / package lookup
// ---------------------------------------------------------------------------------------

export type MonthlyOfferingResult =
  | { ok: true; package: PurchasesPackage }
  | { ok: false; reason: 'unsupported-platform' | 'not-configured' | 'offering-unavailable' | 'package-unavailable' | 'error'; message: string };

// Resolves the real monthly package to purchase, from the live RevenueCat offering --
// NEVER a hardcoded price/product client-side. Looks up the configured "default" offering's
// predefined `monthly` package slot first (the standard RevenueCat convention for a single
// monthly plan), falling back to scanning availablePackages for PACKAGE_TYPE.MONTHLY or the
// literal identifier "monthly" in case the dashboard attaches it as a custom package instead
// -- either way, this never invents a package that doesn't really exist in the Store.
export const getMonthlyOffering = async (): Promise<MonthlyOfferingResult> => {
  if (!isPurchasesPlatformSupported) {
    return { ok: false, reason: 'unsupported-platform', message: 'Subscribing is only available in the iOS app.' };
  }
  if (!isRevenueCatConfigured) {
    return { ok: false, reason: 'not-configured', message: 'Apparently Private isn’t available right now.' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.all[APPARENTLY_PRIVATE_OFFERING_ID] ?? offerings.current;
    if (!offering) {
      return { ok: false, reason: 'offering-unavailable', message: 'Apparently Private isn’t available right now.' };
    }
    const monthlyPackage =
      offering.monthly ??
      offering.availablePackages.find(
        (candidate) => candidate.packageType === PACKAGE_TYPE.MONTHLY || candidate.identifier === 'monthly',
      ) ??
      null;
    if (!monthlyPackage) {
      return { ok: false, reason: 'package-unavailable', message: 'Apparently Private isn’t available right now.' };
    }
    return { ok: true, package: monthlyPackage };
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] getMonthlyOffering failed:', error);
    }
    return { ok: false, reason: 'error', message: 'Could not load Apparently Private right now.' };
  }
};

// ---------------------------------------------------------------------------------------
// Purchase / restore
// ---------------------------------------------------------------------------------------

export type SubscribeResult =
  | { ok: true; status: 'purchased' | 'cancelled' }
  | { ok: false; message: string };

// Purchases whatever real monthly package getMonthlyOffering() resolved. Cancellation is a
// clean, non-error outcome (the user stays free, no scary UI) -- distinguished via
// PurchasesError.userCancelled, RevenueCat's own documented field for exactly this, never a
// guess based on message text. A real failure gets a short, nontechnical message; premium
// state is NEVER set locally here -- it's only ever derived from the CustomerInfo the SDK
// itself returns (via the customerInfo update listener triggered by a real purchase), so a
// successful local optimistic flip that later turns out to be wrong can never happen.
export const subscribeMonthly = async (pkg: PurchasesPackage): Promise<SubscribeResult> => {
  if (!isPurchasesPlatformSupported || !isRevenueCatConfigured) {
    return { ok: false, message: 'Subscribing is only available in the iOS app.' };
  }
  try {
    const result = await Purchases.purchasePackage(pkg);
    setSnapshot(deriveSnapshotFromCustomerInfo(result.customerInfo));
    // Best-effort: waits for the server mirror to catch up (usually well under a second) so
    // paid-content RPCs are already correctly authorized by the time the paywall dismisses,
    // but a slow/failed sync never turns a real, successful purchase into a reported failure.
    await syncServerEntitlement();
    return { ok: true, status: 'purchased' };
  } catch (error) {
    const purchasesError = error as PurchasesError;
    if (purchasesError?.userCancelled) {
      return { ok: true, status: 'cancelled' };
    }
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] subscribeMonthly failed:', error);
    }
    return { ok: false, message: 'That didn’t go through. Please try again.' };
  }
};

export type RestoreResult =
  | { ok: true; restored: boolean }
  | { ok: false; message: string };

// Executes the real RevenueCat restore, refreshes the shared premium snapshot from whatever
// it actually returns, and reports whether an active entitlement was found -- never assumes
// success just because the call didn't throw (a restore with no active purchase history is a
// normal, non-error outcome: `restored: false`, not an error).
export const restorePurchases = async (): Promise<RestoreResult> => {
  if (!isPurchasesPlatformSupported || !isRevenueCatConfigured) {
    return { ok: false, message: 'Restore Purchases is only available in the iOS app.' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    setSnapshot(deriveSnapshotFromCustomerInfo(customerInfo));
    // Same best-effort server-sync wait as subscribeMonthly above.
    await syncServerEntitlement();
    return { ok: true, restored: Boolean(customerInfo.entitlements.active[APPARENTLY_PRIVATE_ENTITLEMENT_ID]?.isActive) };
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases-service] restorePurchases failed:', error);
    }
    return { ok: false, message: 'Restore didn’t go through. Please try again.' };
  }
};

// Apple's own subscription management surface -- never a custom in-app cancellation flow.
// Only ever populated from a real CustomerInfo.managementURL (null if there's no active
// subscription for this identity to manage yet).
export const getSubscriptionManagementUrl = (): string | null => snapshot.customerInfo?.managementURL ?? null;

// ---------------------------------------------------------------------------------------
// Foreground refresh -- "returning foreground" from the persistence/cold-start requirements.
// RevenueCat's own SDK already re-syncs on relaunch/foreground internally, but this makes
// the app's OWN displayed state (this module's snapshot) re-check too, so a subscription
// that lapsed/renewed while backgrounded is reflected promptly rather than only on the next
// full app restart. Same globalThis-stashed-listener pattern as src/lib/supabase.ts's own
// AppState subscription, for the same reason: Metro Fast Refresh re-evaluates this module's
// top-level code on every edit during development, which would otherwise stack a fresh
// listener each time without ever removing the previous one.
// ---------------------------------------------------------------------------------------

type GlobalWithPurchasesAppStateSubscription = typeof globalThis & {
  __apparentlyPurchasesAppStateSubscription?: { remove: () => void };
};

const globalScope = globalThis as GlobalWithPurchasesAppStateSubscription;

globalScope.__apparentlyPurchasesAppStateSubscription?.remove();
globalScope.__apparentlyPurchasesAppStateSubscription = undefined;

if (isPurchasesPlatformSupported) {
  globalScope.__apparentlyPurchasesAppStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active' && configuredOnce) {
      void refreshCustomerInfo();
      void syncServerEntitlementIfStale();
    }
  });
}
