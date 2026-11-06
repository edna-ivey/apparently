import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand } from '@/constants/theme';

// Celestial restyle, Build 15 "Proposal A" revision: fixed brand colors, deliberately not
// device-theme-following (the brand does not have a separate system dark mode — this IS the
// one fixed brand appearance now). NativeTabs renders real native tab-bar chrome, so
// customization is limited to its own supported props — no arbitrary decoration (portal
// rings, gradients, floating/rounded shape) is possible here, unlike the custom-built web bar
// in app-tabs.web.tsx.
//
// IMPORTANT, found this pass: `indicatorColor` (the previous pink pill-highlight prop) is
// documented by expo-router's own NativeTabsProps type as Android/web ONLY — it has zero
// effect on iOS and was dead code here. The only real iOS levers for the selected state are
// `iconColor.selected` and `labelStyle.selected`; removed the dead prop rather than keep
// something that visibly does nothing. Selected tint moved from pink to gold — pink is
// already the app's own default CTA/action color everywhere else (Lock it in, confirm
// buttons, etc.), so a gold-selected tab reads as "special/premium," distinct from "press
// this to act," matching the brief's "restrained pink-gold" direction without competing with
// every other pink button on screen. `shadowColor` matched to the background removes the
// default system hairline between content and bar for a more seamless, glass-like edge.
// `minimizeBehavior="never"` is additive/safe (iOS 26+) — keeps the bar's presentation
// constant regardless of scroll direction, rather than risking yet another iOS 26 auto-
// behavior inconsistency.
//
// Icons: SF Symbols on iOS (`sf`), Material Symbols on Android (`md`) — both are built into
// the OS, so this is one cohesive, premium icon family with zero added dependencies. Each tab
// has its own icon, matched to what it actually is: Today gets the app's own "drop" language
// (SF `drop`/`drop.fill`, Android `water_drop`), Explore a 2x2 grid of quiz cards, Private an
// eye (matches the brand's own existing 👀 voice in its approved copy — "seeing more/deeper"
// rather than a padlock, which would read as a permissions error, not a premium destination),
// Compare two people (reads clearly differently from Explore's grid), You a single person.
//
// Private is the LOCKED center tab position (Today / Explore / Private / Compare / You) —
// same navigation for free users and subscribers; see src/app/(tabs)/private.tsx for the
// free/subscriber content branching. This bar itself never special-cases Private's own
// deeper-plum surface identity — the tab BAR stays one unified, neutral navigation system
// regardless of which screen is active, exactly as approved.
export default function AppTabs() {
  return (
    <NativeTabs
      // The actual root cause of the cross-screen inconsistency: iOS's UITabBar has TWO
      // separate appearance slots -- standardAppearance and scrollEdgeAppearance -- and by
      // default only switches to the solid standardAppearance once content is scrolled away
      // from the top; at the "scroll edge" (every tab's initial/resting position) it reverts
      // to a transparent appearance that composites over whatever that screen's own top
      // content looks like. blurEffect="none" alone only configures ONE of those two slots.
      // Verified directly in react-native-screens' own native source
      // (RNSTabBarAppearanceCoordinator.mm sets both standardAppearance and
      // scrollEdgeAppearance from separately-computed properties) and in expo-router's own
      // NativeTabsProps type/doc comment. Both props are real and already compiled into the
      // installed react-native-screens native pod -- a JS-only change, no native rebuild
      // needed. Now that every screen behind the bar is uniformly dark celestial, both slots
      // resolve to the same solid plum regardless, which is what finally made the bar read
      // consistently across all five tabs.
      blurEffect="none"
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
      backgroundColor={Brand.plum}
      shadowColor={Brand.plum}
      iconColor={{ default: 'rgba(255,249,245,0.5)', selected: Brand.gold }}
      labelStyle={{
        default: { color: 'rgba(255,249,245,0.5)', fontSize: 10.5, fontWeight: '600' },
        selected: { color: Brand.gold, fontSize: 10.5, fontWeight: '800' },
      }}>
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

      <NativeTabs.Trigger name="private">
        <NativeTabs.Trigger.Label>Private</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'eye', selected: 'eye.fill' }} md="visibility" />
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
