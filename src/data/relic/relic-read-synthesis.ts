import { familyForTraitLabel, effectForFamily } from './relic-production-config';
import { resolveModifierStance, STANCE_BY_TRAIT, TRAIT_VOICE, type Stance } from './relic-read-content';
// Pure key/label metadata only (RELIC_TRAIT_META/COLOR_FAMILY_META/EFFECT_META) -- NOT
// relic-assets.ts, which transitively require()'s SVG sources that only resolve inside a
// Metro bundle. This module (and its pure-Node tests/scripts) never need the actual image
// source, only the human-readable labels, so it stays safe to import from plain Node/tsx —
// same convention relic-production-config.ts already established.
import { RELIC_TRAIT_META, COLOR_FAMILY_META, EFFECT_META, type RelicTraitKey } from './relic-trait-meta';
import type { RelicSlotAssignment } from '@/data/private-signals';

// =========================================================================================
// RELIC READ — deterministic synthesis. Pure functions only: same 3 ranked traits always
// produce the same Read. No LLM, no network, no randomness (the only "variation" mechanism
// is a deterministic hash of the trait keys themselves, so the SAME combination always picks
// the SAME phrasing variant forever).
// =========================================================================================

export type RelicReadSection = {
  theRead: string[];
  whyBase: { objectLabel: string; traitLabel: string; body: string };
  whyColor: { familyLabel: string; traitLabel: string; body: string } | null;
  whyEffect: { effectLabel: string; traitLabel: string; body: string } | null;
  theGift: string;
  theShade: string;
  theCost: string;
  tryThis: string;
};

// Pure key -> label lookups built once from relic-trait-meta.ts's own metadata (never a second
// hand-typed table that could drift from it).
const OBJECT_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(RELIC_TRAIT_META.map((t) => [t.key, t.objectLabel]));
const COLOR_FAMILY_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(COLOR_FAMILY_META.map((f) => [f.key, f.label]));
const EFFECT_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(EFFECT_META.map((e) => [e.key, e.label]));

// Deterministic, stable across runs/platforms -- NOT Math.random. Used only to pick among a
// small set of pre-authored phrasing variants, never to generate content.
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
function pick<T>(variants: readonly T[], seed: string): T {
  return variants[stableHash(seed) % variants.length];
}

const SAME_STANCE_CONNECTORS = [
  'That’s not a coincidence — those two instincts come from the same place.',
  'Those two tendencies reinforce each other more than most people realize.',
  'Those aren’t really two separate traits. They’re the same instinct, showing up twice.',
] as const;

const DIFFERENT_STANCE_CONNECTORS = [
  'Which creates an interesting tension.',
  'Which doesn’t always pull in the same direction.',
  'Those two don’t always agree with each other, and that’s exactly the interesting part.',
] as const;

// Generic "basically X, but Y" punch line, keyed by rank #1's stance -- intentionally generic
// (specificity comes from the identityCore sentences surrounding it), but distinct per stance.
const PUNCHLINE_BY_STANCE: Record<Stance, readonly string[]> = {
  steady: ['Basically, you’re not easily shaken. That doesn’t mean you’re easy. 😭', 'You don’t rattle. That’s not the same as being simple to deal with.'],
  assert: ['Basically, you don’t wait to be invited into the hard conversation. You start it.', 'You’re not loud. You’re just never the one who goes quiet first.'],
  connect: ['Basically, you show up. The question is what showing up is quietly costing you.', 'People feel carried by you. Whether that’s sustainable is a separate question.'],
  seek: ['Basically, you’re paying closer attention to the room than anyone realizes.', 'You notice everything. The question is what you do with what you notice.'],
};

const GROWTH_OPPOSITE_BY_STANCE: Record<Stance, string> = {
  steady: 'becoming less certain of yourself',
  assert: 'getting softer',
  connect: 'giving less',
  seek: 'caring less what people think',
};

// A short, ABSTRACT growth direction for The Read's closing line, keyed by modifier stance.
// Deliberately generic and distinct from Try This's concrete, trait-specific practice sentence
// below — The Read gestures at the shape of the growth; Try This is the actual exercise. Using
// the same text in both places would make the sections read as reruns of each other.
const GROWTH_ASK_BY_STANCE: Record<Stance, string> = {
  steady: 'learning when staying steady should give way to actually asking.',
  assert: 'learning when the point has already landed and doesn’t need saying twice.',
  connect: 'learning that care can come with a limit attached.',
  seek: 'learning to trust your own read before you go double-check it with someone else.',
};

// A short, generic nod to the Effect signal for The Read, keyed by the Effect trait's own
// stance. Deliberately distinct wording from `asEffect` (which Why Your Relic Looks Like This
// quotes in full) so the two sections don't repeat the same sentence.
const READ_EFFECT_NOD_BY_STANCE: Record<Stance, string> = {
  steady: 'And underneath all of it, running quiet: a settled, unhurried undercurrent.',
  assert: 'And underneath all of it, running quiet: a forward lean that rarely waits to be invited.',
  connect: 'And underneath all of it, running quiet: a pull toward whoever’s in the room with you.',
  seek: 'And underneath all of it, running quiet: one eye still checking how it’s landing.',
};

// Gift capability clause, keyed by (rank #1 stance, rank #2 stance) -- 16 cells. Reused across
// every trait pairing that shares that stance combination; specificity comes from the
// trait-specific `strength` sentence this clause always follows.
const GIFT_CAPABILITY: Record<Stance, Record<Stance, string>> = {
  steady: {
    steady: 'you become someone who doesn’t need to be managed — just trusted.',
    assert: 'you can say what needs to be said without being reckless about how you say it.',
    connect: 'you can be fully available to people without losing yourself in the process.',
    seek: 'you can hold your own center even while still caring what people think.',
  },
  assert: {
    steady: 'your push comes from a settled place, not a reactive one — it lands as conviction, not combat.',
    assert: 'you don’t back down and you don’t need the last word — the point gets made once, clearly.',
    connect: 'your directness comes wrapped in real care, which is rare. Most people have to pick one.',
    seek: 'you can push for what’s right while still reading whether the moment can actually hold it.',
  },
  connect: {
    steady: 'your care doesn’t come at the cost of your own footing — you can give without disappearing.',
    assert: 'you can be warm AND hold a standard, which means people feel cared for without feeling let off the hook.',
    connect: 'you become genuinely safe to need things from — reliable in a way people can actually lean on.',
    seek: 'your generosity is attentive, not performative — you notice the specific thing someone actually needed.',
  },
  seek: {
    steady: 'your attention to others comes with enough self-trust that it doesn’t tip into losing yourself.',
    assert: 'you can read a room AND still say the hard thing when it matters — tact with an actual spine.',
    connect: 'you make people feel truly seen, because you’re genuinely paying attention.',
    seek: 'you become finely tuned to what a moment actually needs — rarely the wrong read.',
  },
};

// Shadow's rank #3 ("delivery") addendum -- a second sentence appended when rank #3's stance
// differs from the modifier stance already used, so the Effect-source trait materially changes
// the Shadow too, not just the Gift/Cost/Try This.
const EFFECT_DELIVERY_CLAUSE: Record<Stance, string> = {
  steady: 'And because you carry it calmly, it can be easy for people to miss how little room there actually was to push back.',
  assert: 'And because you deliver it directly, there’s rarely any ambiguity about how final it already is.',
  connect: 'And because you deliver it warmly, it can take people a while to clock that the verdict was already final.',
  seek: 'And because part of you is still reading the reaction, the delivery can soften even while the verdict underneath stays fixed.',
};

export function synthesizeRelicRead(slots: RelicSlotAssignment): RelicReadSection | null {
  const base = slots.relicTrait;
  if (!base) return null; // Base must exist for anything to render -- never a partial Read.

  const baseKey = traitLabelToKey(base.label);
  if (!baseKey) return null;
  const baseVoice = TRAIT_VOICE[baseKey];

  const colorKey = slots.colorTrait ? traitLabelToKey(slots.colorTrait.label) : null;
  const effectKey = slots.effectTrait ? traitLabelToKey(slots.effectTrait.label) : null;
  const colorVoice = colorKey ? TRAIT_VOICE[colorKey] : null;
  const effectVoice = effectKey ? TRAIT_VOICE[effectKey] : null;

  // --- THE READ -------------------------------------------------------------------------
  const readLines: string[] = [];
  if (colorVoice) {
    const sameStance = STANCE_BY_TRAIT[baseKey] === STANCE_BY_TRAIT[colorVoice.key];
    const connector = pick(sameStance ? SAME_STANCE_CONNECTORS : DIFFERENT_STANCE_CONNECTORS, `${baseKey}|${colorVoice.key}`);
    readLines.push(`${baseVoice.identityCore} ${colorVoice.identityCore} ${connector}`);
  } else {
    readLines.push(baseVoice.identityCore);
  }
  readLines.push(pick(PUNCHLINE_BY_STANCE[STANCE_BY_TRAIT[baseKey]], `${baseKey}|punch`));
  if (effectVoice) {
    readLines.push(READ_EFFECT_NOD_BY_STANCE[STANCE_BY_TRAIT[effectVoice.key]]);
  }
  const modifierStance = colorKey ? resolveModifierStance(baseKey, colorKey, effectKey) : STANCE_BY_TRAIT[baseKey];
  readLines.push(`Your growth isn’t ${GROWTH_OPPOSITE_BY_STANCE[STANCE_BY_TRAIT[baseKey]]}. It’s this: ${GROWTH_ASK_BY_STANCE[modifierStance]}`);

  // --- WHY YOUR RELIC LOOKS LIKE THIS -----------------------------------------------------
  const whyBase = { objectLabel: OBJECT_LABEL_BY_KEY[baseKey], traitLabel: baseVoice.label, body: baseVoice.asBase };
  const whyColor = colorVoice && slots.colorTrait
    ? { familyLabel: COLOR_FAMILY_LABEL_BY_KEY[familyKeyFor(colorVoice.key)], traitLabel: colorVoice.label, body: colorVoice.asColor }
    : null;
  const whyEffect = effectVoice && slots.effectTrait
    ? { effectLabel: EFFECT_LABEL_BY_KEY[effectKeyFor(effectVoice.key)], traitLabel: effectVoice.label, body: effectVoice.asEffect }
    : null;

  // --- THE GIFT, THE SHADE, THE COST, TRY THIS (combination-aware) -----------------------
  let theGift = baseVoice.strength;
  if (colorVoice) {
    const capability = GIFT_CAPABILITY[STANCE_BY_TRAIT[baseKey]][STANCE_BY_TRAIT[colorVoice.key]];
    theGift = `${baseVoice.strength} Add ${colorVoice.label} to that, and ${capability}`;
  }

  let theShade = baseVoice.shadowByModifier[modifierStance];
  if (effectVoice) {
    const effectStance = STANCE_BY_TRAIT[effectVoice.key];
    if (effectStance !== modifierStance) {
      theShade = `${theShade} ${EFFECT_DELIVERY_CLAUSE[effectStance]}`;
    }
  }

  const theCost = baseVoice.costByModifier[modifierStance];
  const tryThis = baseVoice.practiceByModifier[modifierStance];

  return {
    theRead: readLines,
    whyBase,
    whyColor,
    whyEffect,
    theGift,
    theShade,
    theCost,
    tryThis,
  };
}

// Reverse lookup: PrivateSignalTrait.label -> RelicTraitKey, matching the same join key
// relic-production-config.ts's resolveRelicIdentity already uses. Built once at module load
// (same convention as relic-production-config.ts's own RELIC_TRAIT_LABEL_INDEX) rather than a
// linear scan per call.
const TRAIT_LABEL_INDEX: Record<string, RelicTraitKey> = Object.fromEntries(
  Object.values(TRAIT_VOICE).map((voice) => [voice.label, voice.key]),
);
function traitLabelToKey(label: string): RelicTraitKey | null {
  return TRAIT_LABEL_INDEX[label] ?? null;
}

// Re-derives the SAME locked mapping relic-production-config.ts owns (never a second copy of
// the mapping decision) -- relic-production-config.ts itself has no dependency on Read
// content, so this direction of import has no circularity.
function familyKeyFor(key: RelicTraitKey) {
  return familyForTraitLabel(TRAIT_VOICE[key].label)!;
}
function effectKeyFor(key: RelicTraitKey) {
  const family = familyForTraitLabel(TRAIT_VOICE[key].label)!;
  return effectForFamily(family);
}
