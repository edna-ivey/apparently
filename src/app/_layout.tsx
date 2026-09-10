import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { hydrateOnboardingState } from '@/data/onboarding';

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    void hydrateOnboardingState();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
