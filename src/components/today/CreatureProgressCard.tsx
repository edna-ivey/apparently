import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Panel } from '@/components/today/celestial';
import { CreatureStage } from '@/components/today/CreatureStage';
import { useTodayCreatureConnection } from '@/data/creature/use-today-creature-connection';
import { Brand, Fonts, Spacing } from '@/constants/theme';

// Today's "Your Creature" panel — shares FeaturedQuizCard's exact shell (Panel.shell/glow/
// eyebrow from celestial.tsx) so the two read as one cohesive family instead of two
// differently-weighted stacked cards. Content itself stays real and honest either way: see
// useTodayCreatureConnection's own header comment for exactly what "revealed" does and does
// not mean here (a persisted Mixed Form snapshot only — never a guess, never the intermediate
// First Form, which this card deliberately does not attempt to re-derive).
export function CreatureProgressCard() {
  const router = useRouter();
  const connection = useTodayCreatureConnection();
  const revealed = connection.status === 'revealed';

  return (
    <Pressable
      style={({ pressed }) => [Panel.shell, styles.row, pressed && styles.pressed]}
      onPress={() => router.push('/you')}
      accessibilityRole="button"
      accessibilityLabel="See your Creature">
      <View style={Panel.glow} pointerEvents="none" />
      <View style={styles.thumbWrap}>
        <CreatureStage connection={connection} size={56} />
      </View>
      <View style={styles.textCol}>
        <ThemedText style={Panel.eyebrow}>Your Creature</ThemedText>
        <ThemedText style={styles.title}>{revealed ? connection.name : 'Still listening…'}</ThemedText>
        <ThemedText style={styles.body}>
          {revealed
            ? 'Every answer still adds to the pattern.'
            : 'A First Form appears when a real pattern starts to hold.'}
        </ThemedText>
        <View style={styles.ctaRow}>
          <ThemedText style={styles.cta}>See your Creature →</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
  thumbWrap: {
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  body: {
    fontSize: 11.5,
    color: 'rgba(255,249,245,0.65)',
    lineHeight: 16,
    marginTop: 4,
  },
  ctaRow: {
    marginTop: Spacing.two,
    alignItems: 'flex-end',
  },
  cta: {
    fontSize: 12,
    fontWeight: '800',
    color: Brand.gold,
  },
});
