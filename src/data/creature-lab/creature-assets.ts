import type { ImageSourcePropType } from 'react-native';

// Creature Lab (R&D compositing test only -- see src/app/dev/creature-lab.tsx).
// This registry does NOT decide which trait controls which Creature part for real users;
// see personality.ts's getCoreCreatureInputTraits comment -- that mapping is still
// unapproved and unauthored. This file only points at the seven already-approved SVGs per
// personality-pole "family" so the compositing test harness can load them.

export type CreaturePartKey = 'body' | 'eyes' | 'ears' | 'wings' | 'tail' | 'headFeature' | 'chestCrest';

export type CreatureFamilyId =
  | 'independent'
  | 'collaborative'
  | 'control'
  | 'letItPlayOut'
  | 'practical'
  | 'idealistic'
  | 'sentimental'
  | 'thickSkinned';

export type CreaturePartSet = Record<CreaturePartKey, ImageSourcePropType>;

export const CREATURE_FAMILY_LABEL: Record<CreatureFamilyId, string> = {
  independent: 'Independent',
  collaborative: 'Collaborative',
  control: 'Control',
  letItPlayOut: 'Let It Play Out',
  practical: 'Practical',
  idealistic: 'Idealistic',
  sentimental: 'Sentimental',
  thickSkinned: 'Thick-Skinned',
};

// Filenames tracked alongside the requires (rather than derived from the require paths)
// so debug mode can print the exact approved filename per slot without reverse-engineering
// it from a bundler module id.
export const CREATURE_ASSET_FILENAMES: Record<CreatureFamilyId, Record<CreaturePartKey, string>> = {
  independent: {
    body: 'independent-body-master-v2.svg',
    eyes: 'independent-eyes-master-v2.svg',
    ears: 'independent-ears-master-v2.svg',
    wings: 'independent-wings-master-v2.svg',
    tail: 'independent-tail-master-v2.svg',
    headFeature: 'independent-head-feature-master-v2.svg',
    chestCrest: 'independent-chest-crest-master-v2.svg',
  },
  collaborative: {
    body: 'collaborative-body-master-v1.svg',
    eyes: 'collaborative-eyes-master-v1.svg',
    ears: 'collaborative-ears-master-v1.svg',
    wings: 'collaborative-wings-master-v1.svg',
    tail: 'collaborative-tail-master-v1.svg',
    headFeature: 'collaborative-head-feature-master-v1.svg',
    chestCrest: 'collaborative-chest-crest-master-v1.svg',
  },
  control: {
    body: 'control-body-master-v1.svg',
    eyes: 'control-eyes-master-v1.svg',
    ears: 'control-ears-master-v1.svg',
    wings: 'control-wings-master-v1.svg',
    tail: 'control-tail-master-v1.svg',
    headFeature: 'control-head-feature-master-v1.svg',
    chestCrest: 'control-chest-crest-master-v1.svg',
  },
  letItPlayOut: {
    body: 'let-it-play-out-body-master-v1.svg',
    eyes: 'let-it-play-out-eyes-master-v1.svg',
    ears: 'let-it-play-out-ears-master-v1.svg',
    wings: 'let-it-play-out-wings-master-v1.svg',
    tail: 'let-it-play-out-tail-master-v1.svg',
    headFeature: 'let-it-play-out-head-feature-master-v1.svg',
    chestCrest: 'let-it-play-out-chest-crest-master-v1.svg',
  },
  practical: {
    body: 'practical-body-master-v1.svg',
    eyes: 'practical-eyes-master-v1.svg',
    ears: 'practical-ears-master-v1.svg',
    wings: 'practical-wings-master-v1.svg',
    tail: 'practical-tail-master-v1.svg',
    headFeature: 'practical-head-feature-master-v1.svg',
    chestCrest: 'practical-chest-crest-master-v1.svg',
  },
  idealistic: {
    body: 'idealistic-body-master-v1.svg',
    eyes: 'idealistic-eyes-master-v1.svg',
    ears: 'idealistic-ears-master-v1.svg',
    wings: 'idealistic-wings-master-v1.svg',
    tail: 'idealistic-tail-master-v1.svg',
    headFeature: 'idealistic-head-feature-master-v1.svg',
    chestCrest: 'idealistic-chest-crest-master-v1.svg',
  },
  sentimental: {
    // IMPORTANT: corrected body v2, not v1 -- see task brief.
    body: 'sentimental-body-master-v2.svg',
    eyes: 'sentimental-eyes-master-v1.svg',
    ears: 'sentimental-ears-master-v1.svg',
    wings: 'sentimental-wings-master-v1.svg',
    tail: 'sentimental-tail-master-v1.svg',
    headFeature: 'sentimental-head-feature-master-v1.svg',
    chestCrest: 'sentimental-chest-crest-master-v1.svg',
  },
  thickSkinned: {
    body: 'thick-skinned-body-master-v1.svg',
    eyes: 'thick-skinned-eyes-master-v1.svg',
    ears: 'thick-skinned-ears-master-v1.svg',
    wings: 'thick-skinned-wings-master-v1.svg',
    tail: 'thick-skinned-tail-master-v1.svg',
    headFeature: 'thick-skinned-head-feature-master-v1.svg',
    chestCrest: 'thick-skinned-chest-crest-master-v1.svg',
  },
};

// Static requires -- Metro needs literal string paths, so this table cannot be generated
// from CREATURE_ASSET_FILENAMES above at runtime.
export const CREATURE_ASSETS: Record<CreatureFamilyId, CreaturePartSet> = {
  independent: {
    body: require('../../../assets/creatures/body/independent-body-master-v2.svg'),
    eyes: require('../../../assets/creatures/eyes/independent-eyes-master-v2.svg'),
    ears: require('../../../assets/creatures/ears/independent-ears-master-v2.svg'),
    wings: require('../../../assets/creatures/wings/independent-wings-master-v2.svg'),
    tail: require('../../../assets/creatures/tail/independent-tail-master-v2.svg'),
    headFeature: require('../../../assets/creatures/headpiece/independent-head-feature-master-v2.svg'),
    chestCrest: require('../../../assets/creatures/chest/independent-chest-crest-master-v2.svg'),
  },
  collaborative: {
    body: require('../../../assets/creatures/body/collaborative-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/collaborative-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/collaborative-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/collaborative-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/collaborative-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/collaborative-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/collaborative-chest-crest-master-v1.svg'),
  },
  control: {
    body: require('../../../assets/creatures/body/control-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/control-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/control-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/control-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/control-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/control-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/control-chest-crest-master-v1.svg'),
  },
  letItPlayOut: {
    body: require('../../../assets/creatures/body/let-it-play-out-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/let-it-play-out-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/let-it-play-out-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/let-it-play-out-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/let-it-play-out-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/let-it-play-out-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/let-it-play-out-chest-crest-master-v1.svg'),
  },
  practical: {
    body: require('../../../assets/creatures/body/practical-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/practical-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/practical-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/practical-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/practical-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/practical-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/practical-chest-crest-master-v1.svg'),
  },
  idealistic: {
    body: require('../../../assets/creatures/body/idealistic-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/idealistic-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/idealistic-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/idealistic-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/idealistic-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/idealistic-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/idealistic-chest-crest-master-v1.svg'),
  },
  sentimental: {
    body: require('../../../assets/creatures/body/sentimental-body-master-v2.svg'),
    eyes: require('../../../assets/creatures/eyes/sentimental-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/sentimental-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/sentimental-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/sentimental-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/sentimental-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/sentimental-chest-crest-master-v1.svg'),
  },
  thickSkinned: {
    body: require('../../../assets/creatures/body/thick-skinned-body-master-v1.svg'),
    eyes: require('../../../assets/creatures/eyes/thick-skinned-eyes-master-v1.svg'),
    ears: require('../../../assets/creatures/ears/thick-skinned-ears-master-v1.svg'),
    wings: require('../../../assets/creatures/wings/thick-skinned-wings-master-v1.svg'),
    tail: require('../../../assets/creatures/tail/thick-skinned-tail-master-v1.svg'),
    headFeature: require('../../../assets/creatures/headpiece/thick-skinned-head-feature-master-v1.svg'),
    chestCrest: require('../../../assets/creatures/chest/thick-skinned-chest-crest-master-v1.svg'),
  },
};

// None of the 7 approved "full creature" reference SVGs named in the task brief
// (e.g. control-creature-master-v1.svg, sentimental-creature-master-v1.svg) exist anywhere
// in this repo as of this test -- verified by a full-tree search, not just assets/creatures.
// Every entry is therefore null; the Creature Lab screen renders a labeled "reference file
// not found" placeholder instead of fabricating one. Flagged to Michelle/product before
// building; do not silently populate this once real files show up without re-confirming
// they are the intended flattened masters.
export const CREATURE_FULL_REFERENCE: Record<CreatureFamilyId, ImageSourcePropType | null> = {
  independent: null,
  collaborative: null,
  control: null,
  letItPlayOut: null,
  practical: null,
  idealistic: null,
  sentimental: null,
  thickSkinned: null,
};

// Each body SVG's own declared viewBox (width x height), read directly from the files rather
// than resolved at runtime -- react-native-web's <Image> does not implement
// Image.resolveAssetSource (unlike native), so CreatureComposer needs the body's aspect ratio
// handed to it explicitly to size the stage. See the "two body canvas variants" note in the
// test's written assessment: control/independent use 1086x1448; every other family here uses
// 1122x1402 (the corrected sentimental v2 body included).
export const CREATURE_BODY_DIMENSIONS: Record<CreatureFamilyId, { width: number; height: number }> = {
  independent: { width: 1086, height: 1448 },
  collaborative: { width: 1122, height: 1402 },
  control: { width: 1086, height: 1448 },
  letItPlayOut: { width: 1122, height: 1402 },
  practical: { width: 1122, height: 1402 },
  idealistic: { width: 1122, height: 1402 },
  sentimental: { width: 1122, height: 1402 },
  thickSkinned: { width: 1122, height: 1402 },
};

// Wings is the one part that is NOT on the shared 1254x1254 trait canvas every other
// non-body part uses across all 8 families -- control and independent's wings SVGs declare a
// 1448x1086 landscape canvas instead. This is a fact about the source art, not a positioning
// hack: CreatureComposer fits every part with `contentFit: contain` inside one shared wings
// slot rect regardless, so this list only exists to document the discrepancy for the test
// report (see the Creature Lab screen's assessment section) rather than to branch layout
// logic on it.
export const WINGS_LANDSCAPE_CANVAS_FAMILIES: CreatureFamilyId[] = ['control', 'independent'];

// ---------------------------------------------------------------------------------------
// Extreme Silhouette Test (stress test only) -- four BODY-only assets outside the 8 approved
// personality-pole families above. These are not paired with their own eyes/ears/wings/tail/
// head-feature/chest-crest kits; the Extreme Silhouette Test in the Creature Lab screen pairs
// each one with parts borrowed from the 8 families that do have full kits. Chosen because they
// are the most visually extreme seated-creature bodies that already exist in the repo (wide
// fluffy silhouettes, oversized heads/eye sockets, dramatic fur), per the brief's stress-test
// request -- not because they're approved for any production pairing.
export type ExtremeBodyId = 'adventurous' | 'comfortSeeking' | 'emotionallyIntense' | 'protective';

export const EXTREME_BODY_LABEL: Record<ExtremeBodyId, string> = {
  adventurous: 'Adventurous',
  comfortSeeking: 'Comfort-Seeking',
  emotionallyIntense: 'Emotionally Intense',
  protective: 'Protective',
};

export const EXTREME_BODY_FILENAMES: Record<ExtremeBodyId, string> = {
  adventurous: 'adventurous-body-master-v1.svg',
  comfortSeeking: 'comfort-seeking-body-master-v1.svg',
  emotionallyIntense: 'emotionally-intense-body-master-v1.svg',
  protective: 'protective-body-master-v1.svg',
};

export const EXTREME_BODY_ASSETS: Record<ExtremeBodyId, ImageSourcePropType> = {
  adventurous: require('../../../assets/creatures/body/adventurous-body-master-v1.svg'),
  comfortSeeking: require('../../../assets/creatures/body/comfort-seeking-body-master-v1.svg'),
  emotionallyIntense: require('../../../assets/creatures/body/emotionally-intense-body-master-v1.svg'),
  protective: require('../../../assets/creatures/body/protective-body-master-v1.svg'),
};

// Own declared viewBox per body, same reasoning as CREATURE_BODY_DIMENSIONS above. Notably a
// THIRD body canvas size shows up here (1024x1536, aspect ~0.667) alongside the two already
// seen across the 8 families (1086x1448 and 1122x1402) -- see the written assessment.
export const EXTREME_BODY_DIMENSIONS: Record<ExtremeBodyId, { width: number; height: number }> = {
  adventurous: { width: 1024, height: 1536 },
  comfortSeeking: { width: 1024, height: 1536 },
  emotionallyIntense: { width: 1122, height: 1402 },
  protective: { width: 1024, height: 1536 },
};

// Which existing tail/wings asset is "most visually dramatic" was determined objectively
// (opaque-pixel coverage of the asset's own 1254x1254 canvas), not by eye -- see the written
// assessment for the full comparison across all 8 families. Independent's tail (48.4% opaque
// coverage) and Thick-Skinned's wings (48.4% opaque coverage) were the largest of their kind.
export const MOST_DRAMATIC_TAIL_FAMILY: CreatureFamilyId = 'independent';
export const MOST_DRAMATIC_WINGS_FAMILY: CreatureFamilyId = 'thickSkinned';

// ---------------------------------------------------------------------------------------
// Canonical Registration Template v0 (see creature-registration.ts and the "Canonical
// Registration Template" section of the Creature Lab screen). Planner was named as the
// INITIAL STRUCTURAL REFERENCE -- the standard seated-creature format the shared slot system
// was originally tuned against -- not modified in any way, just displayed and measured.
export const PLANNER_BODY_FILENAME = 'planner-body-master-v1.svg';
export const PLANNER_BODY_ASSET: ImageSourcePropType = require('../../../assets/creatures/body/planner-body-master-v1.svg');

// ---------------------------------------------------------------------------------------
// Body-base cleanup prototype (Michelle-review pass): a derived, NOT-approved copy of
// Control's body with its eye-socket shading softened (~60% reduced shadow depth, feathered,
// nose/mouth untouched) so modular eye assets stop fighting a pre-committed dark socket shape.
// The original assets/creatures/body/control-body-master-v1.svg is completely untouched --
// this lives in a clearly separate assets/creatures-dev-prototype/ tree. See the "Body-base
// cleanup comparison" section of the Creature Lab screen for the before/after.
export const CONTROL_BODY_BASE_CLEAN_V2_FILENAME = 'control-body-base-clean-v2.svg';
export const CONTROL_BODY_BASE_CLEAN_V2_ASSET: ImageSourcePropType = require('../../../assets/creatures-dev-prototype/control-body-base-clean-v2.svg');
