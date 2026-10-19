import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free numericBand quiz "How fast do you catch the ick?"
// (src/data/quizzes/ick.ts, ICK_QUIZ). Free quiz -- only Core poles are ever awarded here,
// never Private poles. The quiz's own 0-3 `score` field measures ick-sensitivity for the
// result band; it is NOT used mechanically here to derive pole awards -- each choice's
// wording was read independently to decide which core behavior, if any, it actually
// demonstrates. See docs/personality-scoring-v2-design.md.
export const ICK_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'I listen. I like hearing them talk anyway.',
      awards: [{ pole: 'sentimental_thick_skinned:negative', points: 2 }],
      rationale: 'Reframing a potentially annoying habit as something enjoyable shows they are not easily bothered by it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Three minutes is ambitious, but I’ll survive.',
      awards: [{ pole: 'sentimental_thick_skinned:negative', points: 1 }],
      rationale: 'Mild complaint followed by shrugging it off shows modest thick-skinned tolerance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m already wondering why this needed chapters.',
      awards: [{ pole: 'emotional_intensity:positive', points: 1 }],
      rationale: 'Visible exasperation at a minor annoyance is modest evidence of reacting rather than staying even-keeled.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I watched the timer hit 3:00 and felt something leave my body.',
      awards: [{ pole: 'emotional_intensity:positive', points: 2 }],
      rationale: 'A strong, visceral reaction to a trivial annoyance is clear evidence of emotional reactivity over an even keel.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'I’m quietly asking them to turn it down.',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'Addressing the issue directly to the person, rather than stewing or complaining to others, is clear direct communication.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’m suddenly aware of everyone around us.',
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Becoming conscious of how the situation reads to everyone else shows clear attentiveness to the social room.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Oh no. I don’t know this person.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'A sudden, harsh re-evaluation of the whole person over one incident is clear evidence of an unforgiving reaction.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I barely notice.',
      awards: [{ pole: 'social_attunement:negative', points: 3 }],
      rationale: 'Explicitly barely registering a socially awkward public moment is strong, direct evidence of taking things at face value.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'The confidence is making this significantly worse.',
      awards: [],
      rationale: 'Explains why the irritation is compounding rather than describing a distinct chosen behavior, too indirect to defensibly map.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Attraction down. Immediately.',
      awards: [{ pole: 'curious_decisive:negative', points: 2 }],
      rationale: 'Reaching an immediate, final-sounding verdict with no deliberation is clear decisive behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Honestly, kind of funny.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 2 }],
      rationale: 'Reframing the mistake as funny rather than holding it against them is clear, readily forgiving behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m correcting them once and moving on.',
      awards: [
        { pole: 'direct_indirect:positive', points: 1 },
        { pole: 'forgiving_receipts:positive', points: 1 },
      ],
      rationale: 'Correcting the person directly is modest direct communication; dropping it afterward rather than dwelling on it is modest forgiveness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Great. Now I can suddenly see everything they meant.',
      awards: [{ pole: 'independent_collaborative:negative', points: 1 }],
      rationale: 'Instantly absorbing a friend\'s framing and reinterpreting their own prior read is modest evidence of not holding an independent judgment here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Good thing I’m dating them, not you.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Firmly dismissing a friend\'s outside opinion and standing by their own read is clear independent judgment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I ask why, but I’m making my own decision.',
      awards: [{ pole: 'independent_collaborative:positive', points: 3 }],
      rationale: 'Explicitly stating they will decide for themselves despite a friend\'s opinion is strong, direct evidence of independence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Now I’m replaying the entire night.',
      awards: [{ pole: 'emotional_intensity:positive', points: 1 }],
      rationale: 'Being preoccupied enough by someone else\'s comment to replay the night is modest evidence of heightened emotional reactivity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Why did that just change how I see you?',
      awards: [{ pole: 'forgiving_receipts:negative', points: 1 }],
      rationale: 'A harmless act immediately shifting their whole view of the person is modest evidence of an unforgiving reaction.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’m pretending we did not travel together.',
      awards: [{ pole: 'emotional_intensity:positive', points: 2 }],
      rationale: 'A strong embarrassment reaction to a harmless act is clear evidence of reacting intensely rather than staying even-keeled.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Let people be happy. 😂',
      awards: [{ pole: 'sentimental_thick_skinned:negative', points: 3 }],
      rationale: 'Explicitly refusing to let a harmless, happy act bother them is strong, direct thick-skinned evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I noticed. That is all I’m saying.',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Explicitly withholding further comment beyond noticing is clear evidence of keeping one\'s reaction private.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'I noticed, but I’m choosing peace.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 2 }],
      rationale: 'Explicitly choosing not to escalate over a minor slight is direct peacekeeping behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“K” feels unnecessarily hostile and I have questions.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Refusing to take a minimal text at face value and wanting to dig further is clear verify-first behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Suddenly I don’t even want to finish this conversation.',
      awards: [{ pole: 'emotional_intensity:positive', points: 2 }],
      rationale: 'A strong withdrawal reaction to one short text is clear evidence of reacting intensely to a small trigger.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'They’re probably busy.',
      awards: [{ pole: 'trust_verify:positive', points: 3 }],
      rationale: 'Defaulting to a generous, good-faith explanation for an ambiguous text is strong, direct trust-first evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Harmless does not mean attraction survives.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'Explicitly refusing to let harmlessness count in the other person\'s favor is clear unforgiving evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'If I like them, I can get over almost anything harmless.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Explicitly stating they can get past almost any harmless flaw is strong, direct forgiving evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I give it a minute. Sometimes the feeling passes.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Deliberately waiting to see if a feeling resolves on its own, rather than reacting right away, is clear patient behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I try to get over it, but my brain keeps bringing it back.',
      awards: [{ pole: 'emotional_intensity:positive', points: 1 }],
      rationale: 'A minor thing recurring in their mind despite trying to let it go is modest evidence of heightened reactivity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'By tomorrow I’ll probably forget about it.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Expecting to simply forget a tiny annoyance by the next day is strong, direct forgiving evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I watch to see if it was a one-time thing.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Waiting for a pattern to confirm before judging, rather than assuming the best or worst outright, is clear verify-first behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Unfortunately, I’m going to notice it every single time now.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'Deciding the small thing is now permanently flagged in their mind is clear unforgiving, receipt-holding evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'If I’m already asking myself whether I still like them, we may be finished.',
      awards: [{ pole: 'curious_decisive:negative', points: 2 }],
      rationale: 'Quickly moving from noticing a doubt to concluding the relationship may be over is clear decisive behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
