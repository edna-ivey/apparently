import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { CelestialType } from '@/components/today/celestial';
import { dismissTodayWelcome, useTodayWelcomeDismissed } from '@/data/today-welcome-state';

// Build 15: replaces the old permanent inline TodayWelcomeCard. The same message no longer
// occupies a fixed slot in Today's normal layout -- it is now a one-time overlay, shown once
// per device (same persisted `apparently:today-welcome-dismissed` flag, same dismissal
// semantics as before -- this is a presentation change only, not a new persistence mechanism).
// Renders nothing until the persisted flag has actually loaded (never flashes) and nothing
// once dismissed. Critically: this is a Modal rendered ALONGSIDE Today's real content, not
// something Today's own JSX waits on -- both Dailies mount and load underneath it immediately,
// so dismissing the modal never gates or delays either Daily's own independent loading.
export function TodayWelcomeModal() {
  const dismissed = useTodayWelcomeDismissed();

  if (dismissed !== false) {
    return null;
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={dismissTodayWelcome} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissTodayWelcome}
          accessibilityLabel="Dismiss welcome message"
          accessibilityRole="button"
        />
        <View style={styles.card}>
          <View pointerEvents="none" style={styles.glow} />
          <Pressable
            onPress={dismissTodayWelcome}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeButton}>
            <ThemedText style={styles.closeText}>✕</ThemedText>
          </Pressable>
          <ThemedText style={styles.sparkle} accessibilityElementsHidden importantForAccessibility="no">
            ✦
          </ThemedText>
          <ThemedText style={styles.eyebrow}>APPARENTLY YOU</ThemedText>
          <ThemedText style={styles.line}>
            We&apos;re already forming an opinion.{'\n'}Answer a little. Reveal a lot.
          </ThemedText>
          <ThemedText style={styles.sub}>Your choices shape the Creature that becomes unmistakably yours.</ThemedText>
          <Pressable onPress={dismissTodayWelcome} accessibilityRole="button" style={styles.gotItButton}>
            <ThemedText style={styles.gotItText}>Got it →</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,3,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(246,184,63,0.3)',
    backgroundColor: '#260020',
    padding: Spacing.five,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -70,
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(246,184,63,0.14)',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 11,
    color: 'rgba(255,249,245,0.6)',
  },
  sparkle: {
    fontSize: 20,
    color: Brand.gold,
    marginBottom: Spacing.two,
  },
  eyebrow: {
    ...CelestialType.eyebrow,
    marginBottom: Spacing.two,
  },
  line: {
    ...CelestialType.question,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  sub: {
    ...CelestialType.body,
    textAlign: 'center',
    marginTop: Spacing.two,
    maxWidth: 280,
  },
  gotItButton: {
    marginTop: Spacing.four,
    backgroundColor: Brand.gold,
    borderRadius: 999,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  gotItText: {
    ...CelestialType.button,
    color: Brand.plum,
  },
});
