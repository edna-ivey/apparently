import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Today</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="compare" href="/compare" asChild>
            <TabButton>Compare</TabButton>
          </TabTrigger>
          <TabTrigger name="you" href="/you" asChild>
            <TabButton>You</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// Fixed brand colors, deliberately not theme-following (ThemedView/ThemedText): this bar
// previously used `theme.backgroundElement`, which is a dark near-black in the device's
// dark color scheme — that's what showed up as a "black nav bar" in QA. The brand does not
// have a dark mode, so this shell always renders the same light/cream shell regardless of
// device theme.
export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButtonView, isFocused && styles.tabButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.tabButtonText, isFocused && styles.tabButtonTextActive]}>{children}</Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>apparently.</Text>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.two,
    // Narrower horizontal padding/gap than before — at a 375px-wide viewport, the original
    // Spacing.four/Spacing.two/Spacing.three values (here and on tabListContainer/
    // tabButtonView below) left too little room for "apparently." plus all 4 tab labels,
    // overflowing the page horizontally by tens of pixels (measured: the natural content
    // width of the bar exceeded the viewport, so the row pushed its last item off-screen
    // rather than shrinking — flexShrink alone doesn't shrink text/padding, only free space).
    // Discovered via QA once onboarding's redirect was bypassed for the first time — every
    // earlier visual QA pass on this project never actually reached this bar, since /you and
    // /compare always redirected to /onboarding first. iOS's native tab bar (app-tabs.tsx,
    // NativeTabs) is a completely different component and was never affected.
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    gap: Spacing.half,
    maxWidth: MaxContentWidth,
    boxShadow: '0 8px 24px rgba(23, 21, 29, 0.10)',
  },
  brandText: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#FFE5EF',
  },
  tabButtonText: {
    color: Brand.inkSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: Brand.pink,
    fontWeight: '800',
  },
});
