import type { ImageSourcePropType } from 'react-native';

import type { CreaturePartKey } from './creature-assets';

// v2 registration proof (Michelle-review pass, R&D only). All files below are temporary,
// dev-only, generated copies under assets/creatures-dev-registered/v2/ -- originals in
// assets/creatures/ are completely untouched. Generated the same way as the v1 proof
// (creature-registered-control.ts): resize + paste the ORIGINAL approved artwork onto its own
// full 1800x2000 v2 canvas (see creature-registration.ts's REGISTRATION_TEMPLATE_V2) so its
// functional attachment point(s) land on the v2 anchors. No redrawing, no regeneration -- the
// only part-level art CHANGE anywhere in this pass is the body-base eye-socket softening
// (creature-assets.ts's CONTROL_BODY_BASE_CLEAN_V2_ASSET), which is a separate, explicit step
// applied before this registration math, not something this file does.
//
// Three families were registered (not all 8): control, sentimental, thickSkinned -- enough to
// build the mixed-trait proofs this pass asks for without re-normalizing the full library
// (still explicitly out of scope). One extra body (protective) was registered on its own via
// the generic body-fit rule, for the extreme-silhouette check.
//
// EAR CLAMP: every family's ears needed a scale cap to avoid off-canvas clipping (the tall ear
// asset's own vertical span vs. the available headroom above its root anchor -- see the
// clamp math in creature-registration.ts's v2 comment). Capped ears land narrower/smaller than
// the nominal head-width anchor target as a direct, visible, deliberate consequence -- not
// hidden. See REGISTERED_V2_EAR_CLAMPS below for exactly how much each family was capped.

export type RegisteredV2Family = 'control' | 'sentimental' | 'thickSkinned';
export type RegisteredV2AttachmentKey = Exclude<CreaturePartKey, 'body'>;

const ATTACHMENT_KEYS: RegisteredV2AttachmentKey[] = ['eyes', 'ears', 'wings', 'tail', 'headFeature', 'chestCrest'];

export const REGISTERED_V2_PARTS: Record<RegisteredV2Family, Record<RegisteredV2AttachmentKey, ImageSourcePropType>> = {
  control: {
    eyes: require('../../../assets/creatures-dev-registered/v2/control/control-eyes-registered-v2.svg'),
    ears: require('../../../assets/creatures-dev-registered/v2/control/control-ears-registered-v2.svg'),
    wings: require('../../../assets/creatures-dev-registered/v2/control/control-wings-registered-v2.svg'),
    tail: require('../../../assets/creatures-dev-registered/v2/control/control-tail-registered-v2.svg'),
    headFeature: require('../../../assets/creatures-dev-registered/v2/control/control-headFeature-registered-v2.svg'),
    chestCrest: require('../../../assets/creatures-dev-registered/v2/control/control-chestCrest-registered-v2.svg'),
  },
  sentimental: {
    eyes: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-eyes-registered-v2.svg'),
    ears: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-ears-registered-v2.svg'),
    wings: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-wings-registered-v2.svg'),
    tail: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-tail-registered-v2.svg'),
    headFeature: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-headFeature-registered-v2.svg'),
    chestCrest: require('../../../assets/creatures-dev-registered/v2/sentimental/sentimental-chestCrest-registered-v2.svg'),
  },
  thickSkinned: {
    eyes: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-eyes-registered-v2.svg'),
    ears: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-ears-registered-v2.svg'),
    wings: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-wings-registered-v2.svg'),
    tail: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-tail-registered-v2.svg'),
    headFeature: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-headFeature-registered-v2.svg'),
    chestCrest: require('../../../assets/creatures-dev-registered/v2/thickSkinned/thickSkinned-chestCrest-registered-v2.svg'),
  },
};

export const REGISTERED_V2_FILENAMES: Record<RegisteredV2Family, Record<RegisteredV2AttachmentKey, string>> = {
  control: {
    eyes: 'control-eyes-registered-v2.svg',
    ears: 'control-ears-registered-v2.svg',
    wings: 'control-wings-registered-v2.svg',
    tail: 'control-tail-registered-v2.svg',
    headFeature: 'control-headFeature-registered-v2.svg',
    chestCrest: 'control-chestCrest-registered-v2.svg',
  },
  sentimental: {
    eyes: 'sentimental-eyes-registered-v2.svg',
    ears: 'sentimental-ears-registered-v2.svg',
    wings: 'sentimental-wings-registered-v2.svg',
    tail: 'sentimental-tail-registered-v2.svg',
    headFeature: 'sentimental-headFeature-registered-v2.svg',
    chestCrest: 'sentimental-chestCrest-registered-v2.svg',
  },
  thickSkinned: {
    eyes: 'thickSkinned-eyes-registered-v2.svg',
    ears: 'thickSkinned-ears-registered-v2.svg',
    wings: 'thickSkinned-wings-registered-v2.svg',
    tail: 'thickSkinned-tail-registered-v2.svg',
    headFeature: 'thickSkinned-headFeature-registered-v2.svg',
    chestCrest: 'thickSkinned-chestCrest-registered-v2.svg',
  },
};

// Revised (softened eye-socket) Control body, registered onto the v2 canvas via the same
// generic body-fit rule used for Planner in creature-registration.ts.
export const REGISTERED_V2_CONTROL_BODY: ImageSourcePropType = require('../../../assets/creatures-dev-registered/v2/control/control-body-registered-v2.svg');
export const REGISTERED_V2_CONTROL_BODY_FILENAME = 'control-body-registered-v2.svg (softened eye-socket prototype)';

// Original (unmodified) Protective body, registered onto the v2 canvas via the same generic
// rule -- used only for the extreme-silhouette stress check, not the eye-socket comparison.
export const REGISTERED_V2_PROTECTIVE_BODY: ImageSourcePropType = require('../../../assets/creatures-dev-registered/v2/protective/protective-body-registered-v2.svg');
export const REGISTERED_V2_PROTECTIVE_BODY_FILENAME = 'protective-body-registered-v2.svg';

// Original (unmodified) Control body registered onto the v2 canvas via the identical
// scale/offset used for the revised body above -- exists ONLY so the "Body-base cleanup
// comparison" section can show old vs. new under the exact same registration, same eyes
// overlaid. Never used in any of the composed recipes.
export const REGISTERED_V2_CONTROL_BODY_ORIGINAL: ImageSourcePropType = require('../../../assets/creatures-dev-registered/v2/control/control-body-ORIGINAL-registered-v2.svg');

// Exact clamp amounts applied per family's ears (nominal head-width-matched scale vs. the
// capped scale actually used) -- see creature-registration.ts's v2 comment for why.
export const REGISTERED_V2_EAR_CLAMPS: Record<RegisteredV2Family, { nominalScale: number; cappedScale: number }> = {
  control: { nominalScale: 0.857, cappedScale: 0.3522 },
  sentimental: { nominalScale: 1.1393, cappedScale: 0.3883 },
  thickSkinned: { nominalScale: 0.7497, cappedScale: 0.4243 },
};

export { ATTACHMENT_KEYS as REGISTERED_V2_ATTACHMENT_KEYS };
