/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#17151D',
    background: '#FFF9F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFE5EF',
    textSecondary: '#746D79',
  },
  dark: {
    text: '#FFF9F5',
    background: '#211B24',
    backgroundElement: '#302733',
    backgroundSelected: '#573343',
    textSecondary: '#C7B9C4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// The consumer nav (src/components/app-tabs.web.tsx) is a web-only floating pill —
// position:'absolute' on top of the page content, not a normal document-flow header — so
// screens must reserve enough top space to clear it. Measured directly against the
// rendered nav's own styles, top-to-bottom: outer pill padding (Spacing.three, 16px) +
// inner pill vertical padding (Spacing.two, 8px) + a tab button's own vertical padding
// (Spacing.one, 4px) + its text line height (20px, the browser default for the nav's
// 14px font — the nav sets no explicit lineHeight). 16 + 8 + 4 + 20 + 4 + 8 + 16 = 76.
// This is the single source of truth useResponsiveTopInset uses to clear the nav; native
// doesn't need it at all (expo-router's NativeTabs renders as a normal bottom tab bar via
// app-tabs.tsx, which is why BottomTabInset above exists instead) — re-measure and update
// this constant if the nav's padding or font size ever changes.
export const ConsumerNavHeight = 76;
// Consumer screens now compute a responsive width themselves (see useResponsiveContentWidth)
// — this is kept only as the historical top-end cap some layout math still references.
export const MaxContentWidth = 800;
// Admin/Review Studio are internal editorial tools, not the consumer mobile column — they
// get a wider fixed desktop workspace. Still full-width on mobile via the same Platform gate
// pattern used on the consumer screens.
export const AdminMaxContentWidth = 960;

export const Brand = {
  pink: '#F33C83',
  violet: '#7964E8',
  coral: '#FF795F',
  gold: '#F6B83F',
  mint: '#65C7B1',
  ink: '#17151D',
  // Secondary/supporting text on light or pastel card backgrounds. The bespoke consumer
  // screens hardcode their own light/pastel backgrounds rather than following the
  // device color scheme, so their text must stay fixed too — using ThemedText's
  // theme-following `textSecondary` color here goes near-white on a device set to dark
  // mode while the background stays pale, which is what made this text unreadable.
  // #5D5571 is also already used ad hoc for this purpose elsewhere in these screens.
  inkSecondary: '#5D5571',
} as const;
