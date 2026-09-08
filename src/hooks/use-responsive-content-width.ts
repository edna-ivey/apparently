import { Platform, useWindowDimensions } from 'react-native';

import { ConsumerNavHeight } from '@/constants/theme';

// Mobile: no cap — content uses the device width with the screen's own padding.
// Tablet: comfortably wider than a phone, still narrow enough to feel like an app.
// Desktop: centered, roomy, but nowhere near a dashboard-width column.
const TABLET_BREAKPOINT = 600;
const DESKTOP_BREAKPOINT = 1024;
const TABLET_WIDTH = 640;
const DESKTOP_WIDTH = 760;

// Drives the consumer shell's responsive width: full-bleed on a phone, a comfortably wider
// centered column on tablet, and a deliberate ~760px app column on desktop — so the web
// experience scales instead of staying pinned to one width regardless of viewport.
export const useResponsiveContentWidth = (): number | undefined => {
  const { width } = useWindowDimensions();

  if (width >= DESKTOP_BREAKPOINT) {
    return DESKTOP_WIDTH;
  }
  if (width >= TABLET_BREAKPOINT) {
    return TABLET_WIDTH;
  }
  return undefined;
};

// The VISUAL gap desired strictly below the nav — not the full top offset. The previous
// version of this hook treated this alone as the entire top offset, which is what made
// content look tucked underneath the nav: the nav floats (position:'absolute') on top of
// the page, so a screen needs to clear its full height first, THEN add this gap.
const MOBILE_GAP = 20;
const DESKTOP_GAP = 24;

// The single source of truth for consumer screens' top offset:
//   CONSUMER CONTENT TOP OFFSET = ConsumerNavHeight (theme.ts) + responsive gap
// On web, the nav is a floating overlay, so screens must reserve its full measured height
// before the visual gap even starts. On native, expo-router's NativeTabs renders as a
// normal OS bottom tab bar (see BottomTabInset in theme.ts) — it never overlays the top of
// the screen, so there's nothing to clear there; native just gets the plain gap as
// ordinary top breathing room.
export const useResponsiveTopInset = (): number => {
  const { width } = useWindowDimensions();
  const gap = width >= TABLET_BREAKPOINT ? DESKTOP_GAP : MOBILE_GAP;

  if (Platform.OS !== 'web') {
    return gap;
  }

  return ConsumerNavHeight + gap;
};
