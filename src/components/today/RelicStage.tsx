import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { RelicAvatar } from '@/components/relic/relic-avatar';
import type { TodayRelicConnection } from '@/data/relic/use-today-relic-connection';

// Shared Private Relic visual. Revealed renders the real RelicAvatar (same production
// renderer/calibration You itself uses) with the real identity from
// useTodayRelicConnection — progressive reveal preserved exactly (base alone is enough).
// Veiled renders a single centered gem motif, not three separate circles: a rotated diamond
// with a soft under-bloom and two sparkle glyphs, directly modeled on the real locked-Relic
// treatment in you.tsx's own RelicGlyph (same shape language — rotated square, glow fill,
// counter-rotated sparkle accents), recolored from You's light sand/gold to Private's rose/
// plum atmosphere rather than reusing You's literal light-surface colors.
export function RelicStage({ connection, size }: { connection: TodayRelicConnection; size: number }) {
  if (connection.status === 'revealed') {
    return (
      <View style={[styles.bloomOuter, { width: size * 1.6, height: size * 1.6, borderRadius: (size * 1.6) / 2 }]}>
        <View style={[styles.bloomInner, { width: size * 1.1, height: size * 1.1, borderRadius: (size * 1.1) / 2 }]} />
        <RelicAvatar identity={connection.identity} size={size} />
      </View>
    );
  }

  const gemSize = size * 0.78;
  return (
    <View style={[styles.bloomOuter, { width: size * 1.6, height: size * 1.6, borderRadius: (size * 1.6) / 2 }]}>
      <View style={[styles.bloomInner, { width: size * 1.1, height: size * 1.1, borderRadius: (size * 1.1) / 2 }]} />
      <View
        style={[
          styles.gem,
          { width: gemSize, height: gemSize, borderRadius: gemSize * 0.17, transform: [{ rotate: '45deg' }] },
        ]}>
        <View style={[styles.gemGlow, { borderRadius: gemSize * 0.11 }]} />
      </View>
      <ThemedText style={[styles.sparkleBig, { transform: [{ rotate: '-45deg' }] }]} accessibilityElementsHidden importantForAccessibility="no">
        ✦
      </ThemedText>
      <ThemedText
        style={[styles.sparkleSmall, { transform: [{ rotate: '-45deg' }] }]}
        accessibilityElementsHidden
        importantForAccessibility="no">
        ✦
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  bloomOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,158,214,0.1)',
  },
  bloomInner: {
    position: 'absolute',
    backgroundColor: 'rgba(255,158,214,0.16)',
  },
  gem: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,158,214,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  gemGlow: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    right: '15%',
    bottom: '15%',
    backgroundColor: 'rgba(255,158,214,0.22)',
  },
  sparkleBig: {
    position: 'absolute',
    fontSize: 22,
    color: '#FF9ED6',
    opacity: 0.6,
  },
  sparkleSmall: {
    position: 'absolute',
    fontSize: 12,
    color: '#F6B83F',
    opacity: 0.6,
    top: '28%',
    right: '26%',
  },
});
