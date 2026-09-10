import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand } from '@/constants/theme';

// Fixed brand colors, deliberately not device-theme-following: the brand does not have a
// dark mode, so this bar always renders the same light/cream shell with a pink active
// state regardless of the device's color scheme.
//
// Icons: SF Symbols on iOS (`sf`), Material Symbols on Android (`md`) — both are built into
// the OS, so this is one cohesive, premium icon family with zero added dependencies. Every
// icon previously reused the same two boilerplate PNGs (Today/You shared "home", Explore/
// Compare shared "explore"), which is why they read as inconsistent placeholders; each tab
// now has its own icon, matched to what it actually is: Today gets the app's own "drop"
// language (SF `drop`/`drop.fill`, Android `water_drop`), Explore a 2x2 grid of quiz cards,
// Compare two people (reads clearly differently from Explore's grid), You a single person.
// `iconColor` here is the single place tinting is set for all four — inactive Brand.ink,
// active Brand.pink — replacing the unconfigured system default (iOS's stock blue).
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      indicatorColor="#FFE5EF"
      iconColor={{ default: Brand.ink, selected: Brand.pink }}
      labelStyle={{ selected: { color: Brand.pink } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'drop', selected: 'drop.fill' }} md="water_drop" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="grid_view"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="compare">
        <NativeTabs.Trigger.Label>Compare</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="people" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
