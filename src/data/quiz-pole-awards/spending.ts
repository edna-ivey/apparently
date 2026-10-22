import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "spending" quiz (SPENDING_QUIZ,
// src/data/quizzes/spending.ts). Free quiz -- Core poles only, per the Build 16/V2 rule
// mirroring the old "Public/Free quizzes do not generate Private/Relic personality awards"
// policy. No choice in this quiz reads as Private-only, so every choice carries at least one
// award here.
export const SPENDING_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Designer. If I’m carrying it every day, I want the good one.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Prioritizing quality and feel over the lowest-cost option for a daily-use item is an idealistic, quality-first way of spending.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Cheapest one with solid reviews. It holds stuff.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Reducing the decision to pure function and price is strong, explicit practical evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m comparing price, quality, and how long I’ll use it.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'trust_verify:negative', points: 1 },
      ],
      rationale: 'Deliberately weighing several factors before buying is planner behavior, and comparing across options is a modest verify-first habit.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Whichever one makes me go “ooooh.” That’s the one.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 3 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Deciding purely on an in-the-moment reaction is strong, explicit spontaneity, and the reaction itself is emotionally driven.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'That one looks fun. Book it.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 3 },
        { pole: 'adventure_comfort:positive', points: 1 },
      ],
      rationale: 'Booking immediately off a single impression is strong, explicit spontaneity, and choosing for "fun" is a mild adventure-seeking signal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Give me the nicest one I can reasonably justify.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Reaching for the nicest option rather than the cheapest adequate one is an idealistic, quality-first instinct, even with some self-imposed limit.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Clean, safe, cheapest. I’m sleeping there.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 3 },
        { pole: 'adventure_comfort:negative', points: 1 },
      ],
      rationale: 'Naming only the bare functional requirements is strong, explicit practicality, and the explicit mention of "safe" is a genuine, if modest, security concern.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m comparing location, reviews, price, and cancellation policy.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Checking multiple sources and terms before committing is a clear verify-first habit, done as part of a broader deliberate approach to the purchase.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'I’m comparing materials, reviews, and warranty.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Checking materials, reviews, and warranty before deciding is a clear verify-first habit as part of a considered purchase.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Honestly? Whichever one I like more right now.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 3 }],
      rationale: 'Explicitly deciding based on the present moment rather than any comparison is strong, direct evidence of spontaneity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I want the real one.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Choosing the brand-name version despite an equivalent cheaper option is valuing authenticity and feel over pure function, an idealistic preference.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'If the dupe works, why am I funding the logo?',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Explicitly refusing to pay extra for a brand name when function is equal is strong, explicit practicality.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Keep most of it. Maybe find something cheap on sale.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Defaulting to holding onto the money and only considering a cheap purchase is a practical, low-spend instinct.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Decide where it goes before touching it.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 3 }],
      rationale: 'Explicitly deciding an allocation before spending any of it is strong, direct planner behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'This feels like free money, which is dangerous.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Recognizing the money feels "dangerous" is self-aware acknowledgment of a pull toward unplanned spending.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Put it toward the nice thing I’ve been wanting.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Steering the windfall toward a wanted quality item rather than saving or a purely functional use is an idealistic spending instinct.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I want the one I’ll love wearing for years.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Choosing based on how much the coat will be loved, not just its function, is an idealistic, feel-first way of spending.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Warmest one at the best price.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Optimizing purely for function and price is strong, explicit practicality.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m researching warmth, durability, and cost.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Actively researching several factors before buying is a clear verify-first habit within a deliberate purchase process.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'The one I put on and immediately want.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 3 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Deciding the instant a want is felt is strong, explicit spontaneity, driven by an immediate emotional pull.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'The fun pair I noticed from across the store.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 3 },
        { pole: 'playful_serious:positive', points: 1 },
      ],
      rationale: 'Deciding on an unplanned pair noticed in passing is strong, explicit spontaneity, chosen specifically for being "fun."',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Designer. They’re on my face all summer.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Justifying the designer choice through daily use still prioritizes quality and feel over the cheaper functional option, an idealistic instinct.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Twenty bucks and actual UV protection. Done.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 3 },
        { pole: 'curious_decisive:negative', points: 1 },
      ],
      rationale: 'Naming only the bare functional spec and price is strong, explicit practicality, and closing the decision immediately ("Done") is modestly decisive.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Midrange. Good lenses. Good reviews. Reasonable price.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Weighing lenses, reviews, and price together before settling on a middle option is a clear verify-first, considered approach.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'I’ll upgrade when the numbers and timing make sense.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 3 },
        { pole: 'patient_urgent:positive', points: 1 },
      ],
      rationale: 'Explicitly waiting for the right numbers and timing is strong, direct planner behavior, and the willingness to wait is a modest patience signal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I watched the launch. Unfortunately, now I want it.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'A working phone being replaced by a sudden want after watching the launch is a clear case of desire overriding planning, expressed as an emotional pull ("unfortunately").',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Newest Pro. If I’m upgrading, I’m upgrading.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Going straight for the top-tier model rather than a functional-need justification is an idealistic, all-or-nothing preference.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Mine works. Call me when it dies.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 3 },
        { pole: 'ambitious_content:negative', points: 2 },
      ],
      rationale: 'Refusing to upgrade a working phone is strong, explicit practicality, and the flat dismissal of the new release is clear, explicit satisfaction with what one already has.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'Remove half immediately.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 2 },
        { pole: 'curious_decisive:negative', points: 1 },
      ],
      rationale: 'Cutting the cart down right away is a practical response to an unexpected total, done quickly and decisively rather than deliberated over.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Review the cart line by line.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Going through the cart item by item before deciding what to do is a clear, methodical verify-first response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Apple Pay before I rethink my life.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 3 }],
      rationale: 'Deliberately rushing past the moment of reconsideration to finish the purchase is strong, explicit spontaneity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'If I love everything, I expected quality to cost.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'Accepting a higher total because the items are loved, rather than cutting the cart, is an idealistic, quality-over-cost stance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
