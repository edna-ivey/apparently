import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { CreatureAvatar } from '@/components/creature/creature-avatar';
import type { TodayCreatureConnection } from '@/data/creature/use-today-creature-connection';

// The real approved silhouette asset — same require() → expo-image path already established
// for Today's Creature card (see CreatureProgressCard's own header comment). Not converted,
// recolored, or rasterized.
const CREATURE_SILHOUETTE_SOURCE = require('../../../assets/images/celestial_portal_creature_silhouette.svg');

// Shared Creature visual — unrevealed renders the real silhouette; revealed renders the real
// CreatureAvatar (the exact same component/calibration You itself uses) with the real,
// persisted recipe from useTodayCreatureConnection. Used both in Today's compact "Your
// Creature" panel and inside the Free Daily Read modal, at different sizes.
export function CreatureStage({ connection, size }: { connection: TodayCreatureConnection; size: number }) {
  return (
    <View style={[styles.glow, { width: size * 1.3, height: size * 1.3, borderRadius: (size * 1.3) / 2 }]}>
      {connection.status === 'revealed' ? (
        <CreatureAvatar recipe={connection.recipe} size={size} />
      ) : (
        <Image
          source={CREATURE_SILHOUETTE_SOURCE}
          contentFit="contain"
          style={{ width: size * 0.82, height: size * 0.82, opacity: 0.92 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(121,100,232,0.12)',
  },
});
