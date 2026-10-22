import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorBoundary } from '@/components/error-boundary';
import { hydrateOnboardingState, useOnboardingState } from '@/data/onboarding';
import { flushPendingQuizSubmissions } from '@/data/quizzes/pending-quiz-submissions';
import { isRemoteDailyEnabled } from '@/lib/supabase';
import { ensureAnonymousSession } from '@/services/auth-service';
import { syncLegacyQuizResultsToRemote } from '@/services/legacy-quiz-backfill-service';
import { initErrorReporting } from '@/services/observability';
import { initializePurchases } from '@/services/purchases-service';
import { syncLocalProfileToRemote } from '@/services/profile-backfill-service';

SplashScreen.preventAutoHideAsync();
// Work Package 2: same "call once, at module scope, before anything else" convention as
// SplashScreen.preventAutoHideAsync() above — must run before any render, so a crash during
// the FIRST paint is still reportable. No-ops safely with no DSN configured (see
// observability.ts's own header comment).
initErrorReporting();

// This is the ONLY thing that decides which top-level branch of the route tree renders:
// the (tabs) group (consumer screens, wrapped in AppTabs) or admin/* (internal editorial
// screens, no consumer tabs). Rendering AppTabs directly here — as this file used to —
// made the tab navigator the entire app's router, so any URL outside its four known tab
// routes (e.g. /admin) silently fell back to the tab navigator's default tab instead of
// reaching the actual matching screen. A plain Stack lets every route in the file-based
// tree resolve on its own.
//
// This file deliberately does NOT decide whether a consumer tab route is allowed — an
// earlier version tried to gate it here via useSegments() (checking segments[0] === '(tabs)')
// plus an imperative router.replace() in a useEffect. That worked on web but was unreliable
// on physical iOS: an effect at the ROOT layout can fire before the native navigator beneath
// it has finished mounting its initial screen, so the replace() could silently no-op. Onboarding
// hydration is still kicked off from here (one centralized trigger for the whole app's
// lifetime), but the actual gate now lives in (tabs)/_layout.tsx — see that file's comment —
// because every route inside that layout IS a consumer tab route by definition, so a
// <Redirect/> rendered as part of ITS OWN output has no such mounting race.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const onboardingState = useOnboardingState();
  const onboardingComplete = onboardingState !== 'loading' && onboardingState.completed;

  useEffect(() => {
    void hydrateOnboardingState();
    // Backend-foundation bootstrap (additive only): begins establishing an anonymous
    // Supabase identity once, in the background — but ONLY when a feature that actually
    // needs it is turned on (today: remote Daily). Gating on isRemoteDailyEnabled rather
    // than the broader isSupabaseConfigured matters: Supabase can be fully configured in an
    // environment (e.g. apparentlyyou.com, once real credentials land there) while remote
    // Daily itself stays deliberately off — in that state, no ordinary visitor should get a
    // real anonymous auth.users row created just from loading the app. Never blocks
    // rendering, never shows a splash for it, never redirects. Onboarding's own hydration
    // above is completely unaffected either way. The remote Daily adapter
    // (src/data/consumer-daily.ts) also calls ensureAnonymousSession() itself when remote
    // Daily is enabled — that's intentionally redundant with this call and safe, since
    // ensureAnonymousSession() is idempotent/concurrent-safe (see auth-service.ts).
    //
    // Sprint 1C-A: also skip this entirely on /admin/* routes. Admin has its own completely
    // separate auth client/session (src/lib/admin-supabase.ts) and never needs a consumer
    // anonymous identity — someone visiting /admin/login directly should never cause a
    // throwaway consumer signup just from loading that page. This is a plain read of the
    // current segments inside an effect (a side-effecting decision, not a render/redirect),
    // so it has none of the native-navigator-mounting race a conditional <Redirect/> at this
    // root level would — see the comment above this component for why THAT kind of gating
    // was deliberately moved out of the root layout.
    //
    // App Privacy audit (2026-10-21): also require onboardingState.completed. Without this,
    // this effect fired on EVERY launch regardless of route or onboarding progress — including
    // the very first launch, before the age-gate step (onboarding.tsx) had even rendered —
    // which created a real anonymous auth.users row ahead of the user ever answering "under
    // 13." (tabs)/_layout.tsx already blocks every consumer tab screen until onboarding
    // completes, so this root effect was the ONE path that could establish a session before
    // age verification. completeOnboarding() (data/onboarding.ts) establishes the session
    // itself at the moment onboarding actually finishes — this effect no longer needs to (or
    // should) race ahead of that. A device that already completed onboarding in a prior
    // session is unaffected: onboardingState.completed is true from the first render after
    // hydration, so this still fires on every normal relaunch exactly as before.
    const isAdminRoute = segments[0] === 'admin';
    if (isRemoteDailyEnabled && !isAdminRoute && onboardingComplete) {
      void ensureAnonymousSession().then(() => {
        // Opportunistic retry for any quiz completion that failed to reach the server
        // earlier (see pending-quiz-submissions.ts) — "app/session initializes again" is
        // exactly the moment the spec calls for, alongside You opening (you.tsx's own
        // loadRemote). A no-op fast path when the queue is empty, same idempotent-safe
        // shape as ensureAnonymousSession itself.
        void flushPendingQuizSubmissions();
        // One-time (per consumer user id, via its own local marker) resync of any quiz
        // history from an older TestFlight build that predates remote quiz submission — see
        // legacy-quiz-backfill-service.ts. Session-established + local-history-hydrated is
        // exactly this moment; it also safely retries when You opens (you.tsx's loadRemote).
        void syncLegacyQuizResultsToRemote();
        // Recovers a local onboarding/profile record with no public.profiles row yet --
        // either a pre-fix historical device, or a completion/edit write that succeeded
        // locally but failed to reach Supabase. See profile-backfill-service.ts.
        void syncLocalProfileToRemote();
        // Establishes the RevenueCat identity (same anonymous Supabase auth.uid(), see
        // purchases-service.ts's own comment) and loads real CustomerInfo once a session
        // exists -- same "app/session initializes" moment as everything else in this block.
        // No-op on web/unconfigured builds; never blocks rendering, never shows a splash.
        void initializePurchases();
      });
    }
  }, [segments, onboardingComplete]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
