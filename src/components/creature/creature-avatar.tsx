import { StyleSheet, View } from 'react-native';

import { CreatureTestComposer, type CreatureTestRecipe } from '@/components/creature-test/creature-test-composer';
import { buildInitialAssetCorrections, buildInitialSlotDefaults } from '@/data/creature-test/creature-test-config';

// Production-facing Creature renderer. Wraps CreatureTestComposer (the single compositing
// source of truth -- see that file's own header comment) to separate two concerns that used
// to live together in every call site: calibration/debug tooling vs. plain consumer display.
//
// This component:
//   - accepts an already-resolved recipe (e.g. from buildCreatureIdentity)
//   - applies the production calibration (slotDefaults/assetCorrections loaded once, below)
//   - renders at any consumer-chosen size, preserving the calibrated square aspect ratio
//   - never exposes layerOrder/layerVisibility/showRig/highlightSlot/showSelectionBox -- those
//     are Creature Lab (/creature-lab) calibration concerns only
//
// Computed once per app session (not per render) -- buildInitialSlotDefaults/
// buildInitialAssetCorrections read+parse assets/creatures-test/creature-config.json via
// require(), which only needs to happen once; every consumer of this component shares the
// same production calibration, which is the whole point of it being production calibration.
const PRODUCTION_SLOT_DEFAULTS = buildInitialSlotDefaults();
const PRODUCTION_ASSET_CORRECTIONS = buildInitialAssetCorrections();

export type CreatureAvatarProps = {
  /** A COMPLETE recipe (all 5 slots) -- callers must gate on CreatureIdentity.isComplete
   * themselves before rendering this; this component does not re-check completeness. */
  recipe: CreatureTestRecipe;
  /** Square render size in logical pixels. The full calibrated 1700x1700 composition scales
   * to exactly this width/height -- never cropped, never distorted, aspect ratio always 1:1. */
  size: number;
};

export function CreatureAvatar({ recipe, size }: CreatureAvatarProps) {
  return (
    <View style={styles.container}>
      <CreatureTestComposer
        recipe={recipe}
        slotDefaults={PRODUCTION_SLOT_DEFAULTS}
        assetCorrections={PRODUCTION_ASSET_CORRECTIONS}
        width={size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // overflow: visible -- the calibrated composition canvas already contains its own safe
  // margin for ears/wings/tail (see creature-test-config.ts's BODY_CANVAS_INSET); this
  // container must never re-clip what the composer already placed correctly.
  container: {
    overflow: 'visible',
  },
});
