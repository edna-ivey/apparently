import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free "How hard are you to date?" quiz
// (src/data/quizzes/dating.ts, registry id 'dating'). Free quiz -> Core poles only, per the
// "Public/Free quizzes do not generate Private/Relic personality awards" policy. Every
// question/choice has an entry; empty `awards` is a deliberate "no defensible Core evidence"
// call, not an omission.
export const DATING_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Nothing. They’re busy.',
      awards: [{ pole: 'trust_verify:positive', points: 2 }],
      rationale: 'Assumes a benign explanation without needing proof, a clear first-instinct-to-trust response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I notice, but I wait.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Explicitly notices the delay but chooses to wait rather than act on it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m sending another text. Now I’m annoyed.',
      awards: [
        { pole: 'patient_urgent:negative', points: 2 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Follows up unprompted out of impatience, and names a rising feeling rather than just acting.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’ve called twice, sent “wow,” and I’m one bad decision from driving over there.',
      awards: [
        { pole: 'patient_urgent:negative', points: 3 },
        { pole: 'emotional_intensity:positive', points: 3 },
      ],
      rationale: 'Multiple escalating contact attempts and near-impulsive action show both urgency and a strong emotional reaction, not just an intense tone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'I may accidentally create a problem because this is way too quiet.',
      awards: [{ pole: 'conflict_peacekeeping:positive', points: 2 }],
      rationale: 'Describes actively stirring up an issue rather than letting calm stand, hedged by "may accidentally".',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Good. Peace is the goal.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 3 }],
      rationale: 'States outright that preserving harmony is the explicit goal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I wouldn’t mind a little extra attention.',
      awards: [],
      rationale: 'Wanting more attention mainly points to a reassurance-seeking need, which is a Private trait with no clear Core angle in this wording, so left unmapped on this free quiz.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m starting to wonder if something’s off.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Develops suspicion from an absence of evidence rather than extending benefit of the doubt.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: '“I’m fine.” They should know I’m not.',
      awards: [{ pole: 'direct_indirect:negative', points: 3 }],
      rationale: 'Says the opposite of what is felt and expects the other person to infer the real message, textbook indirect communication.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“I’m good.” Meanwhile the entire room is on punishment.',
      awards: [{ pole: 'direct_indirect:negative', points: 3 }],
      rationale: 'Verbally denies anything is wrong while the real reaction plays out through behavior instead of words.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I tell them what’s wrong.',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'Explicitly states the problem out loud rather than hinting at it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I need a minute. Then I’ll talk.',
      awards: [
        { pole: 'patient_urgent:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Takes a deliberate pause before responding, and the plan is still to say the actual thing once ready, just delayed rather than avoided.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'I’m hurt. I say that.',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'States the hurt feeling plainly and out loud instead of masking it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I say it’s fine. I am taking notes.',
      awards: [
        { pole: 'direct_indirect:negative', points: 2 },
        { pole: 'forgiving_receipts:negative', points: 3 },
      ],
      rationale: 'Outwardly claims it is fine while privately keeping a mental tally, an indirect front over an explicit record-keeping habit.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Oh, they will remember this forever.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 3 }],
      rationale: 'Frames the slip as something that will be held onto indefinitely rather than let go.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Annoying, but one miss isn’t a crisis.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Explicitly minimizes a single lapse and moves past it rather than filing it away.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Great. I have a life of my own.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 3 },
        { pole: 'protective_hands_off:negative', points: 2 },
      ],
      rationale: 'States an independent life as the reason this is fine, and reacts to the partner wanting solo time with no worry at all.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Fine. Check in later.',
      awards: [{ pole: 'protective_hands_off:negative', points: 2 }],
      rationale: 'Grants the space asked for, though the later check-in tempers how fully hands-off it is.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I say okay, then wonder what’s wrong.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Agrees on the surface but privately doubts the partner’s intentions with no actual evidence of a problem.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Alone from me? Interesting.',
      awards: [{ pole: 'trust_verify:negative', points: 3 }],
      rationale: 'Reads a request for solo time as suspicious rather than taking it at face value.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'I send the screenshot with “???”',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'Confronts the partner right away with the evidence rather than sitting on it or hinting.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'A like is not a federal case.',
      awards: [{ pole: 'emotional_intensity:negative', points: 2 }],
      rationale: 'Actively downplays a minor trigger instead of escalating over it, a behavioral sign of staying even-keeled.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I clock it and keep scrolling.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 1 }],
      rationale: 'Notes the moment mentally rather than addressing or releasing it, a mild filing-away-for-later behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'We’re discussing your thumb choices tonight.',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Plans to raise it directly, just deferred to later rather than avoided altogether.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'I pivot to the part where I was still right.',
      awards: [],
      rationale: 'Deflecting from being wrong is primarily a defensiveness pattern, which is a Private trait; the wording does not give clear enough independent Core evidence to map here. Flagged as a borderline case.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'This argument is now about your tone.',
      awards: [],
      rationale: 'Redirecting blame instead of owning the mistake is again mainly a Private defensiveness pattern with no solid Core angle in this wording. Flagged as a borderline case.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Ugh. Fine. I was wrong.',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'The act of admitting fault itself is Private (Accountability) and skipped here, but the delivery is plain and unhedged, which is modest evidence of direct communication style.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I admit it, but explain myself first.',
      awards: [],
      rationale: 'Mixes an admission (Private: Accountability) with self-justification (Private: self-referencing); no distinct Core behavior is clearly evidenced here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'I notice. Deeply.',
      awards: [{ pole: 'emotional_intensity:positive', points: 1 }],
      rationale: 'Explicitly names a strong internal reaction, though the wording stays vague about what happens next.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Wow. So you listen to nothing I say?”',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'States the grievance straight to their face rather than letting it go unspoken, even if sarcastically.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'If I said it twice, I expected permanent storage.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'Frames the repeated forgetting as something that should have stuck, implying it is being tracked against them.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I remind them and move on.',
      awards: [
        { pole: 'forgiving_receipts:positive', points: 3 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Explicitly lets the lapse go after a simple fix, a direct, practical response rather than one that holds a grudge.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: 'I’ve made a plan in my head. Keep up.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 3 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Already has a plan ready to go, and "keep up" shows a modest lean toward taking charge of how the day goes.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Perfect. We’ll wing it.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 3 }],
      rationale: 'Explicitly embraces improvising with no plan at all.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’d like a plan, but okay.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 1 }],
      rationale: 'States a mild preference for having a plan while still going along without one.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'The uncertainty is already irritating me.',
      awards: [
        { pole: 'patient_urgent:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Open irritation at ambiguity shows low tolerance for delay, and the discomfort with no plan is modest evidence of preferring to have one.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: '“That sucks. Rain check?”',
      awards: [{ pole: 'forgiving_receipts:positive', points: 2 }],
      rationale: 'Accepts the cancellation and moves straight to rescheduling rather than dwelling on it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I need a minute before I answer.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Explicitly delays reacting rather than responding immediately.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“No worries ❤️” Then I’m unavailable until Tuesday.',
      awards: [{ pole: 'direct_indirect:negative', points: 3 }],
      rationale: 'Says everything is fine while the real reaction is expressed through silent withdrawal instead of words.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Okay. Life happens.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Accepts the cancellation at face value with no lingering resentment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
