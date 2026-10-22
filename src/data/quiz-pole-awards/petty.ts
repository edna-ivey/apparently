import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "petty" quiz (src/data/quizzes/petty.ts).
// Calibrated independently from the exact choice wording, scoring the underlying behavior
// rather than the comedic tone -- see docs/personality-scoring-v2-design.md and
// src/data/quiz-pole-awards/types.ts for the shape and rationale behind this file. Petty's
// `score` field (its own internal 0-3 spectrum) and any existing `traitSignals` are unrelated
// to this calibration and were ignored. Free quiz -- only CORE poles are ever awarded here,
// per product policy that free/public quizzes do not generate Private/Relic personality
// evidence.
export const PETTY_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'They’re probably busy.',
      awards: [
        { pole: 'forgiving_receipts:positive', points: 2 },
        { pole: 'trust_verify:positive', points: 1 },
      ],
      rationale: 'Assuming the person is just busy rather than reading into it shows forgiveness and a default to good faith.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Oh, we’re doing tone? Bet.',
      awards: [
        { pole: 'conflict_peacekeeping:positive', points: 2 },
        { pole: 'social_attunement:positive', points: 1 },
      ],
      rationale: 'Picking up on the terse tone and gearing up to respond in kind shows a willingness to confront rather than let it slide, plus attentiveness to tone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m sending “??” because what was THAT?',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'social_attunement:positive', points: 1 },
      ],
      rationale: 'Immediately asking "??" is a direct reaction to a noticed shift in tone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I notice. One eyebrow definitely goes up.',
      awards: [
        { pole: 'social_attunement:positive', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: 'Noticing the slight but keeping the reaction to a raised eyebrow shows attunement to tone without voicing it directly.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'I pause long enough to be suspicious.',
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: 'A suspicious pause before answering shows lingering annoyance coloring the response rather than a clean slate, without saying so outright.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I tell the truth with unnecessary detail.',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'Telling the truth with unnecessary detail is strong, explicit blunt directness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I find one nice thing to say.',
      awards: [
        { pole: 'direct_indirect:negative', points: 2 },
        { pole: 'conflict_peacekeeping:negative', points: 1 },
      ],
      rationale: 'Softening the answer to one nice thing shows an indirect, peace-preserving response despite the annoyance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Their outfit is unrelated to their crimes.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 2 }],
      rationale: 'Separating the outfit question from the person’s other behavior shows judging this moment fairly without letting a grudge bleed over.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'I clock it. Quietly.',
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'social_attunement:positive', points: 1 },
      ],
      rationale: 'Quietly clocking the brunch post shows noticing and privately keeping track rather than forgetting about the debt.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Brunch with my money is wild.',
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: 'Remarking on the brunch as "wild" shows the debt is not forgotten, voiced as an aside rather than directly to the person.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“Cute. Now Cash App me.”',
      awards: [
        { pole: 'direct_indirect:positive', points: 3 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: 'Directly demanding repayment in response to the post is strong, explicit confrontational directness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I keep scrolling.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 2 }],
      rationale: 'Scrolling past without comment shows avoiding the confrontation entirely.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Let it go. I have somewhere to be.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 2 }],
      rationale: 'Letting the line-cutting go to get where they are going shows a preference for avoiding confrontation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Excuse me. The line starts back there.”',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: 'Directly telling the person the line starts elsewhere is confrontational, direct pushback in the moment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'My face says everything.',
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: 'Letting a look do the talking instead of saying anything shows an indirect way of registering displeasure.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Congratulations. The entire line now knows what you did.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: 'Loudly calling out the line-cutter in front of everyone shows taking control of the moment through public confrontation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Noted.',
      awards: [{ pole: 'social_attunement:positive', points: 1 }],
      rationale: 'Registering that the ex’s new person watched the story shows some attentiveness to social dynamics, though the reaction itself is minimal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I probably wouldn’t notice.',
      awards: [{ pole: 'social_attunement:negative', points: 2 }],
      rationale: 'Not even noticing this kind of social cue shows a face-value, less socially tracking disposition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Oh, you came to LOOK? Hold on.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'conflict_peacekeeping:positive', points: 1 },
      ],
      rationale: 'Calling out the watcher directly shows taking control of the interaction rather than ignoring it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Suddenly my next story needs better lighting.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Deliberately upgrading the next story’s presentation in response shows actively managing one’s own image in reaction to being watched.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Cool. I’m unavailable for the next 24 business hours.',
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'control_allowing:positive', points: 2 },
      ],
      rationale: 'Declaring a 24-hour unavailability in response to being ignored shows holding onto the slight and controlling one’s own response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Rude. Anyway.',
      awards: [{ pole: 'emotional_intensity:negative', points: 2 }],
      rationale: 'A brief "rude, anyway" acknowledges the slight without dwelling on it, showing a low-intensity reaction.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I genuinely do not care.',
      awards: [
        { pole: 'emotional_intensity:negative', points: 2 },
        { pole: 'forgiving_receipts:positive', points: 1 },
      ],
      rationale: 'Claiming genuine indifference shows letting the slight go emotionally rather than reacting.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m not repeating myself. Scroll up.',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'Bluntly refusing to repeat the message shows a direct, no-nonsense response to being ignored.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Congrats. Borrowing privileges revoked.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'forgiving_receipts:negative', points: 2 },
      ],
      rationale: 'Unilaterally revoking borrowing privileges shows taking control of future access and not letting the damage slide.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I mention it.',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Simply mentioning the damage rather than letting it go unaddressed shows a modest, direct acknowledgment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Stuff happens.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Shrugging it off as "stuff happens" is strong, explicit easy forgiveness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m sending photos and replacement links.',
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'trust_verify:negative', points: 2 },
      ],
      rationale: 'Sending photos and replacement links shows documenting the damage and wanting it verified and addressed rather than trusting it will resolve itself.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: '...who? Be specific.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 3 }],
      rationale: 'Asking "who, be specific" implies tracking multiple grievances precisely, strong explicit evidence of holding onto receipts.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '...pretty easily.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 3 }],
      rationale: 'Forgiving pretty easily is strong, explicit evidence of a forgiving disposition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '...but the screenshot lives forever.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 3 }],
      rationale: 'Claiming to forgive while keeping the screenshot forever shows holding onto proof despite nominal forgiveness, strong explicit evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '...eventually.',
      awards: [
        { pole: 'forgiving_receipts:positive', points: 2 },
        { pole: 'patient_urgent:positive', points: 1 },
      ],
      rationale: 'Forgiving eventually shows forgiveness that takes time rather than immediate reactivity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
