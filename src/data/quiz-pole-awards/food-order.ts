import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free "What does your food order say about you?" quiz
// (src/data/quizzes/food-order.ts, registry id 'food-order'). Free quiz -> Core poles only,
// per the "Public/Free quizzes do not generate Private/Relic personality awards" policy.
// Mappings are calibrated from each choice's own wording, independent of which archetype it
// happens to score toward. Every question/choice has an entry; empty `awards` is a deliberate
// "no defensible Core evidence" call, not an omission.
export const FOOD_ORDER_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Where’s the thing I already know I’ll like?',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Explicitly seeks out the known favorite rather than anything new.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'What are they actually known for?',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Wants to confirm the restaurant’s actual reputation before committing to an order.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'What is everybody getting? Are we sharing?',
      awards: [{ pole: 'independent_collaborative:negative', points: 3 }],
      rationale: 'Orients the decision around the whole table rather than deciding alone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'What’s the weirdest thing on here?',
      awards: [
        { pole: 'adventure_comfort:positive', points: 3 },
        { pole: 'curious_decisive:positive', points: 1 },
      ],
      rationale: 'Deliberately seeks out the most unfamiliar option, with a modest curiosity component in scanning the menu for it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'Perfect. Bring it.',
      awards: [{ pole: 'adventure_comfort:positive', points: 3 }],
      rationale: 'Accepts an unexplainable dish with zero hesitation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'What’s it similar to?',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Needs to anchor the unfamiliar dish to something familiar before accepting it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'How is it prepared?',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Wants concrete detail about the dish before deciding rather than taking the server’s word for it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Can the table split it?',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Turns an individual decision into a shared, group one.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Does anybody else want fresh fries too?',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Checks with the group before acting on the personal annoyance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Hot sauce. Problem solved.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Picks a quick, workable fix over sending the food back or dwelling on it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'They’re still fries. I’m eating them.',
      awards: [{ pole: 'patient_urgent:positive', points: 1 }],
      rationale: 'Tolerates a minor imperfection without making a fuss or taking action over it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Fresh fries, please. Fries have one job.',
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: 'States the request for a fix plainly and immediately rather than letting it slide.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Let me taste mine first.',
      awards: [],
      rationale: 'A food-quality check on one’s own order before sharing; the wording does not give clear evidence toward any of the 64 Core poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Take some. Want more?',
      awards: [],
      rationale: 'Sharing food generously is the Private "Gives freely" pattern per the free-quiz calibration guidance, and the wording offers no distinct Core angle beyond that.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Yes, but we’re trading.',
      awards: [{ pole: 'playful_serious:positive', points: 1 }],
      rationale: 'Turns the exchange into a lighthearted negotiation rather than a plain yes or no, modest evidence of playful framing independent of the underlying reciprocity instinct (which is Private).',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'One bite. Be respectful.',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'States the limit plainly and specifically rather than hinting at a boundary.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Absolutely not. Let’s go to my usual place.',
      awards: [
        { pole: 'adventure_comfort:negative', points: 2 },
        { pole: 'patient_urgent:negative', points: 1 },
      ],
      rationale: 'Retreats to the familiar option rather than risk the wait, with a modest unwillingness to tolerate the delay at all.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'If it’s actually worth 90 minutes, I’ll wait.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'patient_urgent:positive', points: 1 },
      ],
      rationale: 'Makes the wait conditional on evidence it is justified, and is willing to tolerate the delay once that condition is met.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'What does everybody want to do?',
      awards: [{ pole: 'independent_collaborative:negative', points: 3 }],
      rationale: 'Defers the decision to the group rather than deciding unilaterally.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Random place nearby. Let’s risk it.',
      awards: [
        { pole: 'adventure_comfort:positive', points: 3 },
        { pole: 'planner_spontaneous:negative', points: 2 },
      ],
      rationale: 'Explicitly chooses risk over the known plan, and does so on the spot with no research.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'That tiny place with no menu online. There.',
      awards: [{ pole: 'adventure_comfort:positive', points: 3 }],
      rationale: 'Deliberately picks the most unknown, unverifiable option for an important meal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Give me something I know I’ll love.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Explicitly prioritizes a guaranteed favorite over any unknown.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Best-rated place. I’m not wasting the final meal.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Leans on ratings as evidence before committing rather than taking a chance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Where will everybody be happy?',
      awards: [{ pole: 'independent_collaborative:negative', points: 3 }],
      rationale: 'Makes the group’s satisfaction the explicit deciding factor.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Anybody else want it before I take it?',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Checks with the group before claiming the leftovers for oneself.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Leftovers? Bold assumption.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 1 }],
      rationale: 'Dismisses the idea of planning ahead for the food, a mild present-focused, unplanned stance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Box it. Tomorrow-me is eating this.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Actively plans ahead for a future meal rather than deciding in the moment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Only if it’ll actually reheat well.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Makes the decision conditional on confirming the outcome will actually hold up.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'I need reviews before I commit.',
      awards: [{ pole: 'trust_verify:negative', points: 3 }],
      rationale: 'Explicitly requires outside evidence before committing to the choice.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Does anyone in the group know the place?',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Leans on the group’s collective knowledge rather than deciding alone.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Even better. Surprise me.',
      awards: [{ pole: 'adventure_comfort:positive', points: 3 }],
      rationale: 'Explicitly welcomes the unknown as a positive rather than a risk to manage.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'That feels unnecessarily risky.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'States outright that the lack of information makes this too risky to be worth it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
