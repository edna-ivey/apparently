import { useWindowDimensions } from 'react-native';

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

const MOBILE_TOP_INSET = 20;
const DESKTOP_TOP_INSET = 28;

// The single source of truth for the gap between the floating nav pill and the first
// piece of page content on every consumer screen — centralized here so no screen has to
// carry its own guess at how much room the nav needs. Shares the same tablet breakpoint
// as useResponsiveContentWidth (tablet gets the desktop-range value; the spec only calls
// out mobile vs desktop explicitly).
export const useResponsiveTopInset = (): number => {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT ? DESKTOP_TOP_INSET : MOBILE_TOP_INSET;
};
