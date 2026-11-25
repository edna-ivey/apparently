import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the PREMIUM "Apparently Private" quiz
// "What do people keep getting wrong about you?" (src/data/quizzes/hidden-you-wrong.ts,
// registry id 'hidden-you-wrong'). access: 'private' -- both Core and Private poles are in
// play when genuinely supported. Every question/choice has an entry; empty `awards` is a
// deliberate "no defensible evidence" call, not an omission. Existing `traitSignals` on the
// source quiz were reviewed as one input but independently recalibrated against the new
// positive-only 1/2/3 standard -- see the brief in docs/personality-scoring-v2-design.md.
export const HIDDEN_YOU_WRONG_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: "I find one person I vibe with. That's enough.",
      awards: [{ pole: 'private_open:positive', points: 1 }],
      rationale: 'Preferring one deep connection over working the whole room is modest evidence of keeping social exposure smaller and more selective.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Apparently my neutral face has already offended somebody. 😂',
      awards: [],
      rationale: 'This describes how others misread a resting expression, not a behavior the person chose, so it does not cleanly point at a specific pole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I seem totally fine. Internally, I would rather be anywhere else.',
      awards: [
        { pole: 'private_open:positive', points: 2 },
        { pole: 'vulnerable_armored:negative', points: 2 },
      ],
      rationale: 'Actively presenting as fine while privately uncomfortable is fairly clear evidence of both keeping the real feeling private and protecting it behind a composed exterior.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I'm clocking the entire room before I've said five words.",
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Describing active, fast scanning of the whole room is fairly clear evidence of reading social environments closely.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: "“Yeah, I'm good.” Automatic.",
      awards: [
        { pole: 'private_open:positive', points: 2 },
        { pole: 'vulnerable_armored:negative', points: 2 },
      ],
      rationale: 'An automatic, reflexive deflection when directly asked is fairly clear evidence of both habitual concealment and protecting the real feeling.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I tell them. If you asked, buckle up. 😂',
      awards: [
        { pole: 'private_open:negative', points: 2 },
        { pole: 'vulnerable_armored:positive', points: 2 },
      ],
      rationale: 'Fully answering the question when asked is fairly clear evidence of openness, and doing so with the real feeling intact rather than softened is fairly clear vulnerability.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“Why? What did you notice?”',
      awards: [{ pole: 'social_attunement:positive', points: 1 }],
      rationale: 'Turning the question into curiosity about what tipped the other person off is modest evidence of attentiveness to one’s own social tells.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "“I'm fine.” And I genuinely expect them to know I'm not.",
      awards: [
        { pole: 'private_open:positive', points: 3 },
        { pole: 'direct_indirect:negative', points: 2 },
      ],
      rationale: 'Saying the opposite of what is felt while expecting it to be inferred anyway is strong evidence of keeping feelings hidden, and is also a textbook instance of indirect communication.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: "“You make a big deal out of little things.”",
      awards: [{ pole: 'emotional_intensity:positive', points: 2 }],
      rationale: 'Recognizing this as a complaint actually heard is fairly clear self-report evidence of reacting strongly to small things.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "“I can never tell what you're thinking.”",
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Recognizing this as a recurring complaint is fairly clear self-report evidence of keeping one’s inner state hard to read.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "“I thought you didn't like me at first.”",
      awards: [{ pole: 'vulnerable_armored:negative', points: 1 }],
      rationale: 'Being repeatedly read as cold or unapproachable before anyone gets to know them is modest evidence of a guarded default exterior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "“You never ask anybody for help.”",
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Recognizing this as a recurring complaint is fairly clear self-report evidence of consistently handling things alone.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'I notice immediately and probably say something.',
      awards: [
        { pole: 'social_attunement:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 2 },
      ],
      rationale: 'Immediately picking up on the shift is fairly clear social attunement, and choosing to name it out loud is a separate, fairly clear direct-communication signal.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I notice. I'm not chasing anybody for an explanation.",
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Explicitly refusing to chase someone else down for resolution is fairly clear evidence of handling the discomfort independently rather than needing it resolved with them.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I wonder if I did something, but wait for more evidence.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Explicitly waiting for more evidence before drawing a conclusion is fairly clear evidence of a verify-first default.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I have enough going on. If there's a problem, they can use words.",
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'duty_first_self_preserving:negative', points: 1 },
      ],
      rationale: 'Wanting the other person to just say the problem out loud is a fairly clear preference for direct communication, with a modest, separate signal in protecting their own bandwidth ("I have enough going on") rather than taking it on.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I address it. Possibly with exhibits. 😭',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'Directly addressing the hurt, down to assembling supporting "exhibits," is strong, explicit direct-communication evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I handle it myself. I don't want to need anything from them.",
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'vulnerable_armored:negative', points: 3 },
      ],
      rationale: 'Handling it alone is fairly clear independence, and explicitly refusing to need anything from the person who hurt them is strong, direct evidence of protecting that soft spot rather than exposing it.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I get quieter. If they know me, they'll notice.",
      awards: [
        { pole: 'direct_indirect:negative', points: 3 },
        { pole: 'vulnerable_armored:negative', points: 1 },
      ],
      rationale: 'Withdrawing and expecting the hurt to be inferred rather than stated is strong, explicit indirect communication, with a modest additional sign of guarding the feeling rather than voicing it.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "I'll talk about it, but only after I've figured out exactly what I feel.",
      awards: [{ pole: 'reflective_reactive:positive', points: 2 }],
      rationale: 'Explicitly delaying the conversation until the feeling is fully worked out first is fairly clear reflective evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: "“ME?!” I genuinely don't see it.",
      awards: [],
      rationale: 'Genuine surprise at being called intimidating reflects a lack of self-awareness about one’s impact rather than a demonstrated behavior, and does not cleanly map to one of the 64 poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I laugh. I've heard this before.",
      awards: [{ pole: 'self_secure_reassurance:positive', points: 2 }],
      rationale: 'Being unbothered by repeated feedback like this is fairly clear evidence of security that does not need to resolve or soften what others think.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "Honestly, I'd rather be intimidating than easy to play with.",
      awards: [{ pole: 'vulnerable_armored:negative', points: 2 }],
      rationale: 'Explicitly preferring a guarded, harder-to-get-to-close-to posture over being seen as soft or exploitable is fairly clear armoring.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I immediately wonder what I did that gave them that impression.',
      awards: [{ pole: 'perspective_taking_self_referencing:positive', points: 2 }],
      rationale: 'Immediately trying to understand how one’s own behavior landed on the other person is fairly clear evidence of staying with their experience rather than dismissing the feedback.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Everything. My face has already issued a press release. 😂',
      awards: [{ pole: 'private_open:negative', points: 2 }],
      rationale: 'Internal state being fully visible to most people is fairly clear evidence of leaking rather than containing how things really are.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "Something's off, but probably not how bad it really is.",
      awards: [{ pole: 'private_open:positive', points: 1 }],
      rationale: 'Letting a little show while keeping the real severity hidden is modest evidence of partial concealment.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Almost nothing. Business as usual.',
      awards: [
        { pole: 'private_open:positive', points: 3 },
        { pole: 'vulnerable_armored:negative', points: 2 },
      ],
      rationale: 'Showing almost nothing during a genuinely bad week is strong evidence of keeping the real state private, with a fairly clear secondary signal of maintaining a composed front rather than letting the strain show.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Depends who they are. Very few people get the full version.',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Explicitly rationing the full truth to a small circle is fairly clear, deliberate selectivity about disclosure.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: "I file it away. Let's see if it becomes a pattern.",
      awards: [{ pole: 'trust_verify:negative', points: 3 }],
      rationale: 'Explicitly withholding judgment until a pattern forms is strong, direct verify-first evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“What did you mean by that?” 👀',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'Confronting the comment head-on in the moment is strong, explicit direct-communication evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I probably noticed, but I'm not giving every comment my energy.",
      awards: [{ pole: 'control_allowing:negative', points: 2 }],
      rationale: 'Explicitly deciding not to engage with every small provocation is fairly clear evidence of letting things play out rather than needing to address each one.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I replay it later and wonder whether I imagined the tone.',
      awards: [{ pole: 'self_secure_reassurance:negative', points: 2 }],
      rationale: 'Replaying the moment and doubting one’s own read of it is fairly clear evidence of needing more certainty than an internal read alone provides.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: "People assuming I'm okay because I'm handling it.",
      awards: [{ pole: 'vulnerable_armored:negative', points: 3 }],
      rationale: 'Naming this specific misread as the most annoying, on a high-signal question, is strong evidence that competence is being used to keep real strain hidden.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "People assuming I don't care because I don't show everything.",
      awards: [
        { pole: 'private_open:positive', points: 3 },
        { pole: 'vulnerable_armored:negative', points: 2 },
      ],
      rationale: 'Minding this misread most is strong, direct evidence of deliberately not showing everything, with a fairly clear secondary signal that the specific feelings being withheld are the vulnerable ones.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "People assuming I'm mean because I'm not overly warm.",
      awards: [{ pole: 'vulnerable_armored:negative', points: 2 }],
      rationale: 'Not performing warmth by default, and minding being misread for it, is fairly clear evidence of a guarded rather than openly soft default presentation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "People calling me dramatic when I'm pointing out something real.",
      awards: [
        { pole: 'social_attunement:positive', points: 2 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Defending the accuracy of what was noticed is fairly clear evidence of picking up on real signals others miss, with a modest secondary signal in being read as "dramatic" for how it was expressed.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: "I expect people to notice feelings I haven't actually expressed.",
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: 'A hedged but explicit admission of expecting unstated feelings to be read is fairly clear indirect-communication evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "I say “I'm fine” so convincingly people believe me.",
      awards: [{ pole: 'private_open:positive', points: 3 }],
      rationale: 'Self-identifying, on the question explicitly about one’s own fault, that the "fine" act is convincing is strong, direct concealment evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'My delivery occasionally has... edges. 😂',
      awards: [{ pole: 'tactful_blunt:negative', points: 2 }],
      rationale: 'A self-aware admission that delivery can cut is fairly clear bluntness evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Once I notice something, I can have a hard time letting it go.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'A self-aware admission of difficulty releasing something once noticed is fairly clear evidence of holding on rather than letting it go.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
};
