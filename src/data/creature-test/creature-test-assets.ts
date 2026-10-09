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
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_strong_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_strong_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_strong_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_strong_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_strong_eyes.png'),
  },
  sentimental: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_sentimental_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_sentimental_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_sentimental_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_sentimental_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_sentimental_eyes.png'),
  },
  grounded: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_grounded_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_grounded_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_grounded_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_grounded_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_grounded_eyes.png'),
  },
  curious: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_curious_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_curious_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_curious_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_curious_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_curious_eyes.png'),
  },
  playful: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_playful_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_playful_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_playful_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_playful_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_playful_eyes.png'),
  },
  visionary: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_visionary_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_visionary_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_visionary_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_visionary_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_visionary_eyes.png'),
  },
  bold: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_bold_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_bold_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_bold_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_bold_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_bold_eyes.png'),
  },
  harmonious: {
    body: require('../../../assets/creatures-test/apparently_you_8_base_bodies_svg/apparently_you_harmonious_base.png'),
    tail: require('../../../assets/creatures-test/apparently_you_8_tails_svg_v2/apparently_you_harmonious_tail_v2.png'),
    wings: require('../../../assets/creatures-test/apparently_you_8_wings_svg/apparently_you_harmonious_wings.png'),
    earsHorns: require('../../../assets/creatures-test/apparently_you_8_ears_horns_svg/apparently_you_harmonious_ears_horns.png'),
    eyes: require('../../../assets/creatures-test/apparently_you_8_eyes_svg/apparently_you_harmonious_eyes.png'),
  },
};

export const CREATURE_TEST_FILENAMES: Record<CreatureTestCategory, Record<CreatureTestSlot, string>> = Object.fromEntries(
  CREATURE_TEST_CATEGORIES.map((cat) => [
    cat,
    {
      body: `apparently_you_${cat}_base.png`,
      tail: `apparently_you_${cat}_tail_v2.png`,
      wings: `apparently_you_${cat}_wings.png`,
      earsHorns: `apparently_you_${cat}_ears_horns.png`,
      eyes: `apparently_you_${cat}_eyes.png`,
    },
  ]),
) as Record<CreatureTestCategory, Record<CreatureTestSlot, string>>;
