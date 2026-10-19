import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free "What kind of friend are you, actually?" quiz
// (src/data/quizzes/friendship.ts, registry id 'friendship'). Free quiz -> Core poles only,
// per the "Public/Free quizzes do not generate Private/Relic personality awards" policy.
// Mappings are calibrated from each choice's own wording, independent of which archetype it
// happens to score toward. Every question/choice has an entry; empty `awards` is a deliberate
// "no defensible Core evidence" call, not an omission.
export const FRIENDSHIP_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Do what you want. I’m on standby for the aftermath.',
      awards: [{ pole: 'protective_hands_off:negative', points: 2 }],
      rationale: 'Backs off from the friend’s decision rather than steering it, while staying available if it goes wrong.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Absolutely not. Open the screenshots. We’re reviewing history.',
      awards: [
        { pole: 'trust_verify:negative', points: 3 },
        { pole: 'direct_indirect:positive', points: 2 },
      ],
      rationale: 'Insists on reviewing actual evidence before weighing in, and states the objection flatly with no softening.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Okay. What do you actually miss about them?',
      awards: [],
      rationale: 'Exploring the friend’s underlying feelings is a Private perspective-taking behavior with no clear Core angle here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Show me the draft. If we’re doing this, we’re doing it right.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'playful_serious:positive', points: 1 },
      ],
      rationale: 'Takes charge of how the plan gets executed, with an enthusiastic, mischievous energy around a risky idea.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'We’re getting drinks. Then we’re plotting your comeback.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Responds to bad news by turning it into an energetic, half-playful plan rather than sitting with it seriously.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'What do you need today? Food? Ride? Money?',
      awards: [
        { pole: 'practical_idealistic:positive', points: 3 },
        { pole: 'protective_hands_off:positive', points: 2 },
      ],
      rationale: 'Offers concrete, tangible forms of help rather than abstract support, and steps in actively rather than staying hands-off.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Okay... what happened for real?',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Pushes past the surface version of events to get the real story before reacting.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'First question: are you okay?',
      awards: [],
      rationale: 'Leading with an emotional check-in is a Private supportive/perspective-taking behavior with no distinct Core angle in this wording.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Do you feel good in it?',
      awards: [],
      rationale: 'Redirecting to the friend’s own feeling instead of giving a direct opinion is a Private perspective-taking move with no clear Core angle.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Bad? No. We just haven’t committed hard enough yet.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Deflects with a joking reframe rather than answering plainly.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Come here. Let me fix what I can fix.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Jumps straight to a hands-on, practical fix rather than discussing the problem.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Yes. Change.',
      awards: [{ pole: 'direct_indirect:positive', points: 3 }],
      rationale: 'Two blunt words with zero softening, as plain and direct an answer as the prompt allows.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'You already know what I’m about to say.',
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: 'Implies the criticism rather than actually stating it, leaving the friend to infer the real message.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Forget my opinion. How do you feel around them?',
      awards: [],
      rationale: 'Setting aside one’s own judgment to explore the friend’s feelings is a Private perspective-taking behavior with no Core angle here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Can I present my concerns in PowerPoint form?',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Uses an exaggerated joke to raise real concerns, so the humor is doing the talking but the concerns still get voiced rather than withheld.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I don’t love it. I’m still here if it blows up.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'protective_hands_off:positive', points: 2 },
      ],
      rationale: 'States the disapproval plainly and separately commits to staying available if things go wrong.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Drop the address. I’m sending something.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Converts excitement into a concrete, tangible gesture rather than words alone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I knew it. You worked way too hard for this.',
      awards: [],
      rationale: 'A congratulatory observation about someone else’s effort, without wording specific enough to defensibly anchor to any one Core pole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Call me. I need to hear the happy scream.',
      awards: [],
      rationale: 'Wanting to share the moment live is an emotional-expression preference without wording that clearly maps to a specific Core behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Cancel tomorrow. We’re celebrating tonight.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Drops existing plans on short notice in favor of an impulsive celebration.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Wait. Sit down. I need snacks for this.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Treats the upcoming secret as fun, dramatic entertainment rather than a serious matter.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Okay. Do we need to do something?',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Immediately orients toward whether action is needed rather than sitting with the feeling of it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Fine. But if this is a bad idea, I’m saying so.',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'Commits upfront to stating an honest opinion plainly rather than staying quiet.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Okay. Tell me. I’m listening.',
      awards: [],
      rationale: 'Pure listening with no other stated behavior is a Private perspective-taking move with no Core angle here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Sit down. Cry first.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Explicitly makes room for the feeling to happen before moving to anything else, rather than rushing to resolve it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'We’re fixing the mascara. Then we’ll reassess.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Jumps to a concrete, immediate fix before anything else.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Grab your bag. We’re leaving.',
      awards: [
        { pole: 'protective_hands_off:positive', points: 3 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Takes immediate, decisive protective action to remove the friend from the situation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Okay, but what actually happened?',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Wants the actual facts before reacting rather than taking the situation at face value.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'No. And I have reasons.',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'States an unambiguous refusal and backs it with reasoning rather than hedging.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'What do you actually want underneath all this?',
      awards: [],
      rationale: 'Probing for the friend’s underlying want is a Private perspective-taking behavior with no Core angle here.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'How terrible? Some bad ideas become great stories.',
      awards: [
        { pole: 'adventure_comfort:positive', points: 2 },
        { pole: 'playful_serious:positive', points: 1 },
      ],
      rationale: 'Leans toward the risk rather than away from it, framing it as a fun story rather than a danger to avoid.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I have my shoes on. I’m coming over.',
      awards: [{ pole: 'protective_hands_off:positive', points: 3 }],
      rationale: 'Immediate, decisive action to physically show up rather than stepping back and letting it play out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
