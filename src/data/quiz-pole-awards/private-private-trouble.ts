import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for 'private-private-trouble'. Independently recalibrated
// from the choice wording in src/data/quizzes/private-private-trouble.ts -- the authored
// traitSignals on that file are a reference input only, not copied forward. Per the brief,
// this quiz's mature/18+ framing is scored for the underlying personality behavior exactly as
// any other quiz; the framing itself is never treated as evidence. See
// docs/personality-scoring-v2-design.md.
export const PRIVATE_PRIVATE_TROUBLE_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Probably them. I need a little confirmation before I start risking dignity. 😂',
      awards: [
        { pole: 'initiating_responsive:negative', points: 2 },
        { pole: 'self_secure_reassurance:negative', points: 1 },
      ],
      rationale: 'Waiting for the other person to move first is clear responsive behavior, and needing confirmation before acting is modest reassurance-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "Either of us. If the moment is right, I'm not scared.",
      awards: [
        { pole: 'initiating_responsive:positive', points: 1 },
        { pole: 'self_secure_reassurance:positive', points: 1 },
      ],
      rationale: 'Comfort initiating when the moment calls for it is modest evidence for initiating, and "not scared" is modest evidence of self-assurance.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Me, potentially. Why are we wasting perfectly good chemistry?',
      awards: [
        { pole: 'initiating_responsive:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Naming oneself as the likely mover is clear initiating evidence, with modest directness in the rhetorical push to act rather than wait.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“Real” move? No. But I may create several excellent opportunities. 👀',
      awards: [
        { pole: 'direct_indirect:negative', points: 2 },
        { pole: 'playful_serious:positive', points: 1 },
      ],
      rationale: 'Creating openings rather than making an overt move is clear indirect behavior, with a modest playful, teasing tone.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'Read. Stare. Lock phone. We are not ruining our life tonight. 😭',
      awards: [
        { pole: 'duty_first_self_preserving:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Deliberately protecting oneself from a risky decision is clear self-preserving evidence, and choosing not to act on impulse is modest planning evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Why?” Because apparently I enjoy standing near cliffs.',
      awards: [{ pole: 'adventure_comfort:positive', points: 2 }],
      rationale: 'The cliff metaphor is about enjoying risk and danger, which fits seeking thrill more precisely than the curiosity-versus-decisiveness axis.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Depends who sent it. There are people whose names would immediately change this answer.',
      awards: [],
      rationale: 'Conditioning the response on who sent it is ordinary selectivity and does not clearly demonstrate any particular pole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "Oh, I'm responding. Whether that's wise is a separate department.",
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Acting on impulse while explicitly acknowledging it may not be wise is clear spontaneous, impulse-driven behavior over deliberate planning.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: "Realizing somebody wants me when they haven't said it yet",
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Picking up on unspoken desire is clear evidence of reading social and emotional vibes rather than taking things at face value.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "Finally getting comfortable enough to show somebody the side of me everybody doesn't get",
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Describing a guarded private side that requires earned comfort to reveal is clear evidence of selective disclosure.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Knowing exactly what I want and watching them realize it too',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Being certain about one’s own desire reflects modest internal directness, though the choice describes clarity of knowing rather than explicit communication.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Feeling safe, wanted, and genuinely connected without all the games',
      awards: [{ pole: 'sentimental_thick_skinned:positive', points: 1 }],
      rationale: 'Valuing genuine emotional connection over games reflects a modest sentimental, connection-oriented preference.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Oh, I have some idea. 😏',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'self_secure_reassurance:positive', points: 1 },
      ],
      rationale: 'A confident, teasing comeback is clear playful evidence, and the underlying confidence in one’s own appeal is modest self-secure evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Welp. There goes the rest of my ability to behave normally.',
      awards: [
        { pole: 'vulnerable_armored:positive', points: 2 },
        { pole: 'planner_spontaneous:negative', points: 1 },
      ],
      rationale: 'Admitting that attraction visibly disrupts composure is clear evidence of allowing oneself to be affected rather than staying guarded, and losing deliberate control is modest spontaneity evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "I like hearing it, but I'm still deciding what happens next.",
      awards: [{ pole: 'planner_spontaneous:positive', points: 1 }],
      rationale: 'Deliberately weighing next steps rather than acting on impulse is modest planning evidence, a better fit than self-preservation here.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“Then tell me.” 👀',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'tactful_blunt:negative', points: 1 },
      ],
      rationale: 'Directly demanding clarity rather than circling the subject is clear directness, and pushing past the other person’s hint is modestly blunt.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: '“I had fun tonight 😊”',
      awards: [{ pole: 'tactful_blunt:positive', points: 1 }],
      rationale: 'A warm, low-pressure, non-presumptuous message reflects a modestly tactful communication style.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“So... are we just pretending that didn\'t happen?”',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Naming the unspoken tension directly, even while hedging with "so...", shows a modest pull toward directness over leaving things unaddressed.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“You need to stop.” (They do not need to stop.) 😭',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: 'Saying the opposite of what is meant is clear playful, teasing behavior, and modestly indirect about the actual desire underneath.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“Come over.”',
      awards: [
        { pole: 'direct_indirect:positive', points: 3 },
        { pole: 'initiating_responsive:positive', points: 2 },
        { pole: 'tactful_blunt:negative', points: 2 },
      ],
      rationale: 'A two-word command with no hedging is strong, explicit directness and clearly blunt, and it clearly initiates rather than waits for the other person.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Knowing they wanted me too. Honestly, that can be enough.',
      awards: [{ pole: 'self_secure_reassurance:negative', points: 1 }],
      rationale: 'Finding satisfaction specifically in confirmation of being desired is modest reassurance-seeking evidence in a romantic context.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: "Them finally making the move I've been quietly waiting for",
      awards: [{ pole: 'initiating_responsive:negative', points: 2 }],
      rationale: 'Finding satisfaction in waiting for the other person to make the move is clear responsive, non-initiating behavior.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Getting somewhere private enough that I can stop being quite so well-behaved 👀',
      awards: [{ pole: 'private_open:positive', points: 1 }],
      rationale: 'Needing privacy as the condition for letting a different side show is modest evidence for selective, situational disclosure.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "Me deciding we've done enough talking.",
      awards: [{ pole: 'initiating_responsive:positive', points: 2 }],
      rationale: 'Taking charge of ending the buildup and moving things forward is clear initiating behavior.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Not very. Public me and private me are pretty consistent.',
      awards: [{ pole: 'private_open:negative', points: 1 }],
      rationale: 'Describing consistency between public and private self is modest evidence of an open, non-compartmentalized self-presentation.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Extremely. Certain information is on a need-to-know basis. 😭',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Explicitly compartmentalizing information on a need-to-know basis is clear evidence of the private pole.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: "Maybe. I'm not advertising everything, but I'm not exactly innocent either.",
      awards: [{ pole: 'private_open:positive', points: 1 }],
      rationale: 'Modest selective disclosure, "not advertising everything," is defensible but mild evidence for the private pole.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "They'd be surprised by the details, not by the fact that I have details. 😂",
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Comfortably owning having a private side, without defensiveness, reflects modest self-security.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: "I need them to make it obvious enough that I know I'm not misreading things.",
      awards: [
        { pole: 'trust_verify:negative', points: 1 },
        { pole: 'initiating_responsive:negative', points: 2 },
      ],
      rationale: 'Needing extra confirmation before trusting the signal is modest verify-first evidence, and waiting for the other person to make it obvious is clear responsive behavior.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I let the tension build. Why would I rush the best part?',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Deliberately prolonging anticipation for enjoyment is clear playful, tension-savoring behavior.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Once I feel safe with them, my shy/reserved setting may mysteriously disappear.',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Describing a guarded default that only lifts once safety is established is clear evidence of the private pole.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "At some point I'm going to make this situation less hypothetical.",
      awards: [
        { pole: 'initiating_responsive:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Deciding to act rather than wait is clear initiating evidence, with modest directness tempered by the euphemistic phrasing.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: '“You enjoy being wanted almost as much as you enjoy getting what you want.”',
      awards: [{ pole: 'self_secure_reassurance:negative', points: 1 }],
      rationale: 'Enjoying being wanted ties modestly to needing external validation of desirability, tempered by also enjoying "getting what you want" for its own sake.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“People who only know your daytime personality are missing several chapters.”',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Describing a compartmentalized, "chaptered" self that is not fully shared is clear evidence of the private pole.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“You have talked yourself OUT of things you absolutely wanted because the consequences weren\'t worth it.”',
      awards: [
        { pole: 'duty_first_self_preserving:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Weighing consequences and protecting oneself from fallout is clear self-preserving evidence, with modest deliberate restraint fitting the planner side.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: "“Once you've decided you want something, your ability to produce excellent reasons for doing it becomes suspiciously impressive.” 😭",
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'initiating_responsive:positive', points: 1 },
      ],
      rationale: 'Rationalizing in service of desire, overriding planning or restraint, is clear spontaneous impulse evidence, and acting once decided is modest initiating evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: 'Tomorrow me has to live here too. Behave. 😇',
      awards: [
        { pole: 'duty_first_self_preserving:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Protecting one’s future self from fallout is clear self-preserving evidence, with modest future-oriented restraint fitting the planner side.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'We can flirt with the idea without actually doing anything. 😏',
      awards: [{ pole: 'playful_serious:positive', points: 1 }],
      rationale: 'Enjoying the flirtatious tease without acting on it is modest playful evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'If I trust this person enough to let that side of me out, tomorrow is part of the calculation. 😈',
      awards: [
        { pole: 'trust_verify:negative', points: 1 },
        { pole: 'private_open:positive', points: 1 },
      ],
      rationale: 'Requiring established trust before letting a private side out is modest verify-first evidence, and the conditional, guarded disclosure is modest private-pole evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Tomorrow has had plenty of nights. Tonight gets one. 🔥',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Prioritizing the present moment over future consequence planning is clear spontaneous, impulse-driven evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
};
