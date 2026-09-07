import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

// This is the ONLY thing that decides which top-level branch of the route tree renders:
// the (tabs) group (consumer screens, wrapped in AppTabs) or admin/* (internal editorial
// screens, no consumer tabs). Rendering AppTabs directly here — as this file used to —
// made the tab navigator the entire app's router, so any URL outside its four known tab
// routes (e.g. /admin) silently fell back to the tab navigator's default tab instead of
// reaching the actual matching screen. A plain Stack lets every route in the file-based
// tree resolve on its own.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
