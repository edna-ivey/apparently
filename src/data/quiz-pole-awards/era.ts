import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "era" quiz (src/data/quizzes/era.ts).
// Calibrated independently from the exact choice wording; see docs/
// personality-scoring-v2-design.md and src/data/quiz-pole-awards/types.ts for the shape and
// rationale behind this file. Free quiz -- only CORE poles are ever awarded here, per product
// policy that free/public quizzes do not generate Private/Relic personality evidence.
export const ERA_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Face to face. Sit down with me.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Insisting on a face-to-face sit-down for something important shows a preference for direct, deliberately arranged conversation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Call me. Let’s actually talk.',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Wanting to actually talk by phone rather than text shows a modest preference for direct, real-time conversation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Text me the whole story. Receipts included.',
      awards: [{ pole: 'forgiving_receipts:negative', points: 2 }],
      rationale: 'Wanting the whole story in writing with receipts included shows a documented, record-keeping approach to important conversations.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Voice note me now. I need tone and speed.',
      awards: [
        { pole: 'patient_urgent:negative', points: 2 },
        { pole: 'social_attunement:positive', points: 2 },
      ],
      rationale: 'Needing a voice note right now, specifically for tone, shows both urgency and a strong attentiveness to emotional nuance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'Send the pin, your ETA, and your location.',
      awards: [
        { pole: 'patient_urgent:negative', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Wanting the pin, ETA, and location sent shows a need for immediate, precise information rather than waiting to find out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'We made the plan. I’ll see you at 7.',
      awards: [
        { pole: 'trust_verify:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Trusting that the existing plan will hold without needing updates shows confidence in the plan rather than a need to verify.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Call me if anything changes.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Only wanting a call if something changes shows a low-maintenance, independent approach to coordination.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'The group chat will somehow produce 73 messages first.',
      awards: [],
      rationale: 'This describes an expected group chat pattern rather than the chooser’s own behavior, so there is no defensible trait to map.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Thirty-seven photos, captions, and inside jokes.',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'sentimental_thick_skinned:positive', points: 1 },
      ],
      rationale: 'Captions and inside jokes across dozens of photos show a playful approach, paired with a wish to hold onto the memory in detail.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Best ones edited and posted before bed.',
      awards: [{ pole: 'patient_urgent:negative', points: 2 }],
      rationale: 'Needing the best photos edited and posted before bed shows an urgency to share immediately rather than let it wait.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'One good photo. Everybody looking at the camera.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Settling for one deliberate, posed photo instead of many shows a controlled, intentional approach rather than a spontaneous one.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'A few candids. Then back to the night.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Taking a few candids and then returning attention to the night itself shows a spontaneous preference for living the moment over documenting it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Turn it up. I don’t need a playlist strategy.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Explicitly rejecting a playlist strategy in favor of just turning it up shows a spontaneous, unstructured approach.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’m making a playlist with a dramatic name.',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Giving the playlist a dramatic name shows playful self-expression, while building a playlist at all shows some organizing instinct.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'The algorithm already queued my next obsession.',
      awards: [{ pole: 'patient_urgent:negative', points: 1 }],
      rationale: 'Relying on the algorithm to already have the next obsession queued shows a modest preference for frictionless, immediate continuation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Put on the whole album and let it play.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Letting a whole album play out instead of skipping ahead shows patience rather than needing the next thing immediately.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Ask me out face to face. Pick a time.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Asking someone out face to face and picking a specific time shows directness paired with deliberate planning.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Call me. Make a plan.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Wanting a call that results in an actual plan shows a preference for arranging things ahead of time.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Long texts, inside jokes, light profile stalking.',
      awards: [
        { pole: 'playful_serious:positive', points: 2 },
        { pole: 'curious_decisive:positive', points: 2 },
      ],
      rationale: 'Inside jokes and light profile stalking show both playful engagement and genuine curiosity about the other person.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Screenshots are already in the group chat.',
      awards: [{ pole: 'private_open:negative', points: 2 }],
      rationale: 'Immediately sharing screenshots from dating with the group chat shows an open, less private approach to personal matters.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'GPS, live traffic, ETA sent.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 2 },
        { pole: 'private_open:negative', points: 1 },
      ],
      rationale: 'Using live GPS and traffic tools shows a practical, efficiency-first approach, and sending the ETA shows openness about one’s whereabouts.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Give me the address and directions before I leave.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 3 }],
      rationale: 'Needing the address and directions before even leaving is strong, explicit evidence of preparing ahead of time.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’ll figure it out. Call if I get lost.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'planner_spontaneous:negative', points: 2 },
      ],
      rationale: 'Figuring it out alone and only calling if lost shows both independence and comfort navigating without a prepared plan.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I printed directions and somehow still missed a turn.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 1 }],
      rationale: 'Printing directions in advance shows an attempt at preparation, even though the follow-through did not fully succeed.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'I’m on fan pages, quotes, and episode recaps now.',
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: 'Diving into fan pages, quotes, and recaps shows a curious instinct to explore a new interest in depth.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Whole season tonight. Sleep has been canceled.',
      awards: [{ pole: 'patient_urgent:negative', points: 2 }],
      rationale: 'Watching the whole season in one night at the expense of sleep shows an urgency to consume it immediately rather than wait.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'One episode a week. I like having something to look forward to.',
      awards: [{ pole: 'patient_urgent:positive', points: 3 }],
      rationale: 'Deliberately pacing one episode a week to have something to look forward to is strong, explicit patience.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'If it’s on, I’m watching. No homework.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'curious_decisive:negative', points: 1 },
      ],
      rationale: 'Watching casually with "no homework" shows a spontaneous, low-prep approach rather than digging in further.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'You can disappear for hours and nobody launches an investigation.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'private_open:positive', points: 1 },
      ],
      rationale: 'Valuing a world where disappearing for hours draws no investigation shows a preference for autonomy and not being tracked.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Custom profiles, away messages, ridiculous ringtones.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Enjoying custom profiles, away messages, and ridiculous ringtones shows a playful, expressive disposition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Same-day delivery, live locations, and answers instantly.',
      awards: [{ pole: 'patient_urgent:negative', points: 2 }],
      rationale: 'Preferring same-day delivery, live locations, and instant answers shows a strong preference for immediacy over waiting.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'People dress up, host, and make real plans.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Valuing a world of dressing up, hosting, and making real plans shows a preference for structured, intentional occasions.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
