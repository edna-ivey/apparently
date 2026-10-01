import type { ImageSourcePropType } from 'react-native';

// Creature Lab (/creature-lab) asset registry -- production calibration tool, NOT the Core-
// trait Creature system under src/data/creature-lab/ (a separate, earlier R&D pass on a
// different asset library). This one points at assets/creatures-test/, a fresh 5-slot x
// 8-category modular set. Static requires only -- Metro needs literal strings, so this table
// cannot be generated from a loop at runtime.

export type CreatureTestSlot = 'body' | 'tail' | 'wings' | 'earsHorns' | 'eyes';

export type CreatureTestCategory = 'strong' | 'sentimental' | 'grounded' | 'curious' | 'playful' | 'visionary' | 'bold' | 'harmonious';

export const CREATURE_TEST_SLOTS: CreatureTestSlot[] = ['body', 'tail', 'wings', 'earsHorns', 'eyes'];

export const CREATURE_TEST_CATEGORIES: CreatureTestCategory[] = [
  'strong',
  'sentimental',
  'grounded',
  'curious',
  'playful',
  'visionary',
  'bold',
  'harmonious',
];

export const CREATURE_TEST_CATEGORY_LABEL: Record<CreatureTestCategory, string> = {
  strong: 'Strong',
  sentimental: 'Sentimental',
  grounded: 'Grounded',
  curious: 'Curious',
  playful: 'Playful',
  visionary: 'Visionary',
  bold: 'Bold',
  harmonious: 'Harmonious',
};

export const CREATURE_TEST_SLOT_LABEL: Record<CreatureTestSlot, string> = {
  body: 'Body',
  tail: 'Tail',
  wings: 'Wings',
  earsHorns: 'Ears / Horns',
  eyes: 'Eyes',
};

// Every file shares an identical 1254x1254 canvas (verified: all 40 files, no exceptions).
export const CREATURE_TEST_CANVAS = { width: 1254, height: 1254 };

export const CREATURE_TEST_KNOWN_ASSET_ISSUES: {
  category: CreatureTestCategory;
  slot: CreatureTestSlot;
  description: string;
}[] = [];

export const CREATURE_TEST_ASSETS: Record<CreatureTestCategory, Record<CreatureTestSlot, ImageSourcePropType>> = {
  strong: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_strong_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_strong_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_strong_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_strong_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_strong_eyes.svg'),
  },
  sentimental: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_sentimental_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_sentimental_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_sentimental_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_sentimental_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_sentimental_eyes.svg'),
  },
  grounded: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_grounded_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_grounded_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_grounded_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_grounded_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_grounded_eyes.svg'),
  },
  curious: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_curious_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_curious_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_curious_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_curious_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_curious_eyes.svg'),
  },
  playful: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_playful_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_playful_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_playful_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_playful_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_playful_eyes.svg'),
  },
  visionary: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_visionary_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_visionary_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_visionary_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_visionary_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_visionary_eyes.svg'),
  },
  bold: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_bold_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_bold_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_bold_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_bold_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_bold_eyes.svg'),
  },
  harmonious: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_harmonious_base.svg'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_harmonious_tail_v2.svg'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_harmonious_wings.svg'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_harmonious_ears_horns.svg'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_harmonious_eyes.svg'),
  },
};

export const CREATURE_TEST_FILENAMES: Record<CreatureTestCategory, Record<CreatureTestSlot, string>> = Object.fromEntries(
  CREATURE_TEST_CATEGORIES.map((cat) => [
    cat,
    {
      body: `apparently_you_${cat}_base.svg`,
      tail: `apparently_you_${cat}_tail_v2.svg`,
      wings: `apparently_you_${cat}_wings.svg`,
      earsHorns: `apparently_you_${cat}_ears_horns.svg`,
      eyes: `apparently_you_${cat}_eyes.svg`,
    },
  ]),
) as Record<CreatureTestCategory, Record<CreatureTestSlot, string>>;
