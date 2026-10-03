import { PERSONALITY_DIMENSIONS, type PersonalityDimensionId, type SignatureTrait } from '@/data/personality';

// User-facing "personality read" copy for the Creature Read experience (Build 9, Part C).
// Every entry is grounded directly in the Bible's Core Trait Dictionary (docs/
// APPARENTLY_YOU_PRODUCT_CREATIVE_BIBLE.md §14A) -- `explanation` paraphrases that pole's own
// Bible definition in second person, never adding a claim the dictionary doesn't support;
// `apparentlyLine` is the one playful/observant/occasionally-shady "Apparently" line per the
// Bible's brand voice (§3-4) -- never clinical, never cruel for its own sake. Exactly 40
// entries: all 20 Core dimensions x both poles. Private-12 dimensions are deliberately absent
// -- the Creature is Core-only (Bible §17/§44); this module must never be reached for a
// Private trait.
//
// No technical language anywhere in this file's actual copy strings (never "slot"/"recipe"/
// "characteristic mapping"/"resolver"/"rank assignment") -- see creature-read.tsx, the only
// consumer, for the same rule applied to its own surrounding UI copy.

export type CreatureReadPoleCopy = {
  explanation: string;
  apparentlyLine: string;
};

export const CREATURE_READ_COPY: Partial<Record<PersonalityDimensionId, { positive: CreatureReadPoleCopy; negative: CreatureReadPoleCopy }>> = {
  planner_spontaneous: {
    positive: {
      explanation: 'You tend to think ahead and prefer having at least some idea of the plan before you move.',
      apparentlyLine: 'Apparently: you read the whole syllabus before the class starts.',
    },
    negative: {
      explanation: 'You tend to respond in the moment and feel comfortable deciding as things unfold.',
      apparentlyLine: 'Apparently: the plan is that there isn’t one, and somehow it keeps working out.',
    },
  },
  emotional_intensity: {
    positive: {
      explanation: 'You experience emotions with noticeable depth — excitement, anger, affection, all of it registers strongly.',
      apparentlyLine: 'Apparently: your feelings do not do "quiet mode."',
    },
    negative: {
      explanation: 'You tend to meet emotional situations with steadiness and less visible swing.',
      apparentlyLine: 'Apparently: the room is on fire and you are still finding your keys calmly.',
    },
  },
  direct_indirect: {
    positive: {
      explanation: 'You tend to state the point clearly and prefer your meaning to be easy to identify.',
      apparentlyLine: 'Apparently: subtlety occasionally files a missing-person report around you. 😂',
    },
    negative: {
      explanation: 'You tend to communicate through implication, softened wording, and context.',
      apparentlyLine: 'Apparently: there is a whole second conversation happening under the first one.',
    },
  },
  social_attunement: {
    positive: {
      explanation: 'You notice what changed in the room — tone, energy, what’s happening underneath what was said.',
      apparentlyLine: 'Apparently: "nothing’s wrong" has never once stopped your investigation.',
    },
    negative: {
      explanation: 'You tend to take what was actually said or done at face value.',
      apparentlyLine: 'Apparently: if it wasn’t said out loud, it didn’t happen.',
    },
  },
  protective_hands_off: {
    positive: {
      explanation: 'You tend to step in, defend, and actively look out for people you care about.',
      apparentlyLine: 'Apparently: you treat caring like a job description.',
    },
    negative: {
      explanation: 'You tend to give people room to handle their own situations.',
      apparentlyLine: 'Apparently: you trust people to figure out their own plot.',
    },
  },
  adventure_comfort: {
    positive: {
      explanation: 'You’re drawn toward new experiences, unfamiliar situations, and a reasonable amount of risk.',
      apparentlyLine: 'Apparently: "let’s just go" is a complete plan for you.',
    },
    negative: {
      explanation: 'You tend to value familiarity, ease, and experiences that feel known.',
      apparentlyLine: 'Apparently: you want the route, not the surprise.',
    },
  },
  independent_collaborative: {
    positive: {
      explanation: 'You tend to prefer handling things personally and relying on your own judgment.',
      apparentlyLine: 'Apparently: you believe in solo missions.',
    },
    negative: {
      explanation: 'You tend to prefer involving others and sharing responsibility for outcomes.',
      apparentlyLine: 'Apparently: you believe in the group chat.',
    },
  },
  control_allowing: {
    positive: {
      explanation: 'You feel more comfortable when you can shape the plan and influence the outcome.',
      apparentlyLine: 'Apparently: "let me handle it" is basically your resting state.',
    },
    negative: {
      explanation: 'You tend to be comfortable letting events and people develop without directing every part.',
      apparentlyLine: 'Apparently: you’re fine letting the outcome surprise you.',
    },
  },
  practical_idealistic: {
    positive: {
      explanation: 'You tend to evaluate choices by usefulness, feasibility, and what’s likely to actually work.',
      apparentlyLine: 'Apparently: "be for real" is basically your love language.',
    },
    negative: {
      explanation: 'You give real weight to possibility, principle, and how things could be.',
      apparentlyLine: 'Apparently: you’re already three steps into the "but what if" version.',
    },
  },
  sentimental_thick_skinned: {
    positive: {
      explanation: 'You tend to attach emotional meaning to memories, gestures, and milestones, and hold onto it.',
      apparentlyLine: 'Apparently: you’re keeping a memory box in your chest.',
    },
    negative: {
      explanation: 'You tend to be less affected by symbolic gestures or emotionally loaded moments.',
      apparentlyLine: 'Apparently: you’re built a little different, and you know it.',
    },
  },
  rules_bending: {
    positive: {
      explanation: 'You tend to respect established rules and standards unless there’s a real reason not to.',
      apparentlyLine: 'Apparently: you read the terms and conditions. All of them.',
    },
    negative: {
      explanation: 'You tend to see rules as flexible and adapt or work around them when the situation calls for it.',
      apparentlyLine: 'Apparently: the rules are more like strongly worded suggestions.',
    },
  },
  conflict_peacekeeping: {
    positive: {
      explanation: 'You tend to address tension directly rather than let an unresolved issue sit.',
      apparentlyLine: 'Apparently: you’d rather say it now than let it rot.',
    },
    negative: {
      explanation: 'You tend to reduce tension, preserve harmony, and choose your battles carefully.',
      apparentlyLine: 'Apparently: you’ve decided this particular hill isn’t worth it.',
    },
  },
  trust_verify: {
    positive: {
      explanation: 'You tend to begin by accepting good faith unless something gives you reason not to.',
      apparentlyLine: 'Apparently: you give people the benefit of the doubt first, questions later.',
    },
    negative: {
      explanation: 'You tend to want confirmation and consistency before fully accepting something as true.',
      apparentlyLine: 'Apparently: "show me the receipts" is basically your motto.',
    },
  },
  forgiving_receipts: {
    positive: {
      explanation: 'You tend to release past offenses more readily and let new behavior count for something.',
      apparentlyLine: 'Apparently: you’re genuinely willing to let it go.',
    },
    negative: {
      explanation: 'You tend to remember previous behavior and use that history as relevant evidence going forward.',
      apparentlyLine: 'Apparently: you remember everything, and you will bring it up eventually.',
    },
  },
  playful_serious: {
    positive: {
      explanation: 'You tend to use humor, teasing, and lightness as a natural part of relating to people.',
      apparentlyLine: 'Apparently: you make the room lighter without even trying.',
    },
    negative: {
      explanation: 'You tend to approach conversations and decisions with a more earnest, reserved tone.',
      apparentlyLine: 'Apparently: you’re not here to clown around, and that’s fine.',
    },
  },
  competitive_cooperative: {
    positive: {
      explanation: 'You tend to notice rankings, comparisons, and opportunities to outperform.',
      apparentlyLine: 'Apparently: you came to win, not to vibe.',
    },
    negative: {
      explanation: 'You tend to place more weight on mutual benefit and shared success.',
      apparentlyLine: 'Apparently: you’d rather everybody eat.',
    },
  },
  curious_decisive: {
    positive: {
      explanation: 'You tend to keep exploring alternatives and stay open to more information.',
      apparentlyLine: 'Apparently: one more tab open never hurt anybody. Allegedly.',
    },
    negative: {
      explanation: 'You tend to reach a conclusion and move forward once you have enough information.',
      apparentlyLine: 'Apparently: you’ve heard enough, and you’ve made the call.',
    },
  },
  private_open: {
    positive: {
      explanation: 'You tend to keep more of your internal world to yourself, sharing selectively.',
      apparentlyLine: 'Apparently: you’re a locked journal, not an open book.',
    },
    negative: {
      explanation: 'You tend to share your thoughts and feelings more readily with others.',
      apparentlyLine: 'Apparently: you just tell people the whole story, no filter.',
    },
  },
  patient_urgent: {
    positive: {
      explanation: 'You tend to tolerate waiting and slower progress without feeling pressure to speed it up.',
      apparentlyLine: 'Apparently: you can wait. Genuinely wait.',
    },
    negative: {
      explanation: 'You tend to want movement and resolution sooner, and feel restless when things stall.',
      apparentlyLine: 'Apparently: you can hear a clock in the room that nobody else can.',
    },
  },
  ambitious_content: {
    positive: {
      explanation: 'You’re drawn toward growth, achievement, and whatever comes next.',
      apparentlyLine: 'Apparently: "what’s next" is basically a full-time thought for you.',
    },
    negative: {
      explanation: 'You tend to place real value on appreciating and maintaining what’s already enough.',
      apparentlyLine: 'Apparently: you’re good right here, and you mean it.',
    },
  },
};

// Resolves which pole's copy applies for a real, already-qualified trait -- mirrors
// resolveTraitCharacteristic's own positiveLabel/negativeLabel check in creature-identity.ts
// exactly (SignatureTrait.name carries the real pole label; .displayName is the unrelated
// ALL-CAPS tagline -- see that function's own comment for why using .displayName here would
// be the same bug). Kept as its own small lookup rather than importing resolveTraitCharacteristic
// directly so this copy module has no dependency on the Creature slot/rank machinery at all --
// it only ever needs "which pole is this trait," nothing about ranks or slots.
export function getCreatureReadPoleCopy(trait: SignatureTrait): CreatureReadPoleCopy {
  const dimension = PERSONALITY_DIMENSIONS.find((d) => d.id === trait.id);
  const entry = CREATURE_READ_COPY[trait.id];
  if (!dimension || !entry) {
    throw new Error(`No Creature Read copy for Core trait dimension: ${trait.id}`);
  }
  if (trait.name === dimension.positiveLabel) {
    return entry.positive;
  }
  if (trait.name === dimension.negativeLabel) {
    return entry.negative;
  }
  throw new Error(`Creature Read copy pole could not be resolved for ${trait.id}: "${trait.name}"`);
}

// Fallback lookup for the persisted mixed-Creature snapshot shape (CreatureSnapshotTrait in
// creature-progression.ts), which stores only the pole LABEL string (e.g. "Direct"), not the
// dimension id -- unlike a live SignatureTrait, which already carries .id. Pole labels are
// globally unique across all 32 canonical dimensions (verified: 64 labels, 64 unique), so this
// reverse lookup is unambiguous. Core dimensions only, matching the Creature's own Core-only
// scope.
export function getCreatureReadCopyByLabel(traitLabel: string): CreatureReadPoleCopy {
  for (const dimension of PERSONALITY_DIMENSIONS) {
    if (dimension.type !== 'core') {
      continue;
    }
    const entry = CREATURE_READ_COPY[dimension.id];
    if (!entry) {
      continue;
    }
    if (dimension.positiveLabel === traitLabel) {
      return entry.positive;
    }
    if (dimension.negativeLabel === traitLabel) {
      return entry.negative;
    }
  }
  throw new Error(`No Creature Read copy found for trait label: "${traitLabel}"`);
}
