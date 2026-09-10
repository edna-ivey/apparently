import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ThemedView } from '@/components/themed-view';
import { useOnboardingState } from '@/data/onboarding';

// Authoritative consumer-onboarding gate. Every route inside this layout IS a consumer tab
// route by definition, so this is the one correct place to decide "is this device allowed to
// see the consumer tabs yet" — unlike a segment-string check at the app root, a <Redirect/>
// rendered as part of THIS layout's own output has no native-navigator-mounting race (see
// the comment in src/app/_layout.tsx for why the root-level version of this was unreliable
// on physical iOS).
//
// Because useOnboardingState() is a reactive store (useSyncExternalStore), this also means a
// dev-only reset (globalThis.__resetApparentlyOnboarding()) while sitting on Today redirects
// immediately on the next render — no app reload required.
export default function ConsumerTabsLayout() {
  const onboardingState = useOnboardingState();

  if (onboardingState === 'loading') {
    // Web: keep rendering the normal tab shell during the initial server/loading render, so
    // every consumer route's static HTML is preserved exactly as before. Native: there is no
    // static HTML to preserve, and rendering AppTabs before onboarding status is known is
    // exactly the "Today flashes before onboarding" bug this gate exists to prevent — hold on
    // a minimal, themed blank view instead until hydration resolves (typically a few ms).
    return Platform.OS === 'web' ? <AppTabs /> : <ThemedView style={{ flex: 1 }} />;
  }

  if (!onboardingState.completed) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
