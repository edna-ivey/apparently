import type { ImageSourcePropType } from 'react-native';

// FROZEN canonical factory system (autonomous production pass). Canvas 1600x1800; see
// scripts/creature-factory/canonical-geometry.ts for the anchor set and the one documented
// deviation (ear-root Y). Manifest: scripts/creature-factory/manifest.json (280 rows; run
// `npx tsx scripts/creature-factory/generate-manifest.ts` to refresh). These are DERIVED,
// registered copies under assets/creatures-canonical/v0/ -- originals in assets/creatures/
// are untouched.
export type CanonicalV0Slot = 'body' | 'eyes' | 'ears' | 'wings' | 'tail' | 'headFeature' | 'chestCrest';
export type CanonicalV0Family = 'independent' | 'collaborative' | 'control' | 'letItPlayOut' | 'practical' | 'idealistic' | 'sentimental' | 'thickSkinned';

export const CANONICAL_V0_CANVAS = { width: 1600, height: 1800 };

export const CANONICAL_V0_GOLD_STANDARD: CanonicalV0Family = 'independent';

export const CANONICAL_V0_PARTS: Record<CanonicalV0Family, Record<CanonicalV0Slot, ImageSourcePropType>> = {
  independent: {
    body: require('../../../assets/creatures-canonical/v0/independent/independent-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/independent/independent-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/independent/independent-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/independent/independent-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/independent/independent-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/independent/independent-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/independent/independent-chestCrest-canonical-v0.svg'),
  },
  collaborative: {
    body: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/collaborative/collaborative-chestCrest-canonical-v0.svg'),
  },
  control: {
    body: require('../../../assets/creatures-canonical/v0/control/control-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/control/control-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/control/control-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/control/control-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/control/control-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/control/control-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/control/control-chestCrest-canonical-v0.svg'),
  },
  letItPlayOut: {
    body: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/letItPlayOut/letItPlayOut-chestCrest-canonical-v0.svg'),
  },
  practical: {
    body: require('../../../assets/creatures-canonical/v0/practical/practical-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/practical/practical-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/practical/practical-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/practical/practical-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/practical/practical-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/practical/practical-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/practical/practical-chestCrest-canonical-v0.svg'),
  },
  idealistic: {
    body: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/idealistic/idealistic-chestCrest-canonical-v0.svg'),
  },
  sentimental: {
    body: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/sentimental/sentimental-chestCrest-canonical-v0.svg'),
  },
  thickSkinned: {
    body: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-body-canonical-v0.svg'),
    eyes: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-eyes-canonical-v0.svg'),
    ears: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-ears-canonical-v0.svg'),
    wings: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-wings-canonical-v0.svg'),
    tail: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-tail-canonical-v0.svg'),
    headFeature: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-headFeature-canonical-v0.svg'),
    chestCrest: require('../../../assets/creatures-canonical/v0/thickSkinned/thickSkinned-chestCrest-canonical-v0.svg'),
  },
};

export const CANONICAL_V0_FAMILY_LABEL: Record<CanonicalV0Family, string> = {
  independent: 'Independent (gold standard)',
  collaborative: 'Collaborative',
  control: 'Control',
  letItPlayOut: 'Let It Play Out',
  practical: 'Practical',
  idealistic: 'Idealistic',
  sentimental: 'Sentimental',
  thickSkinned: 'Thick-Skinned',
};

export const CANONICAL_V0_SLOT_ORDER: CanonicalV0Slot[] = ['wings', 'tail', 'body', 'ears', 'eyes', 'chestCrest', 'headFeature'];

// The two "difficult mix" QA composites built this pass (every slot a different family; a
// bulky body + landscape-canvas wings + multiple other families), as static recipes.
export const CANONICAL_V0_QA_MIX_1: Record<CanonicalV0Slot, CanonicalV0Family> = {
  body: 'control', eyes: 'independent', ears: 'sentimental', wings: 'thickSkinned',
  tail: 'practical', headFeature: 'collaborative', chestCrest: 'idealistic',
};
export const CANONICAL_V0_QA_MIX_2: Record<CanonicalV0Slot, CanonicalV0Family> = {
  body: 'thickSkinned', eyes: 'sentimental', ears: 'letItPlayOut', wings: 'control',
  tail: 'sentimental', headFeature: 'thickSkinned', chestCrest: 'practical',
};
