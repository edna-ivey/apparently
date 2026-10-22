import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "one-bite" quiz (ONE_BITE_QUIZ,
// src/data/quizzes/one-bite.ts). Free quiz -- Core poles only, per the Build 16/V2 rule that
// mirrors the old "Public/Free quizzes do not generate Private/Relic personality awards"
// policy. Several choices that superficially read as Private behavior (keeping score on who
// owes whom, giving away the last bite, sharing freely with a group) are deliberately left
// unmapped (awards: []) rather than forced onto a loosely-related Core pole -- see each
// rationale below.
export const ONE_BITE_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'I knew this was coming. Take some.',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Proactively offering food before being asked shows a collaborative, share-first orientation toward the plate.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Tell me exactly what you want before you start freelancing.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'A blunt, explicit demand for clarity is direct communication, and insisting the request happen before any action reflects a mild desire to control the process.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'We specifically discussed whether you were hungry.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'independent_collaborative:positive', points: 1 },
      ],
      rationale: 'Plainly invoking the prior agreement to defend the plate is direct, and the underlying motive is holding onto one’s own food rather than sharing.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m ordering you your own food.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'curious_decisive:negative', points: 1 },
      ],
      rationale: 'Solving the problem by keeping the plates separate is an independent approach, and doing it immediately rather than debating is modestly decisive.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: '“Ask first.” I’m still probably giving you some.',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'independent_collaborative:negative', points: 1 },
      ],
      rationale: 'Stating the rule outright is direct, and still intending to share despite the rule is a modest collaborative streak.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I move the fries. Instinctively.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'An automatic, non-negotiated move to protect the fries shows a default preference for keeping one’s own food rather than sharing.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Absolutely not. Those are assigned fries.',
      awards: [
        { pole: 'direct_indirect:positive', points: 3 },
        { pole: 'rules_bending:positive', points: 1 },
      ],
      rationale: 'The blunt refusal is strongly direct, and framing the fries as "assigned" shows a mild tendency to impose explicit ownership rules.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Go ahead. Fries are communal.',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Treating food as automatically shared with the group is a clear collaborative orientation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Fine, but I’m also ordering something that belongs to me.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Agreeing to the group plan while still carving out a dish that stays one’s own shows a preference for independence even inside a shared meal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I respect the concept from over here with my entrée.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Opting out of the communal plan in favor of a personal entree is a clear independent preference.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Perfect. I want to try everything.',
      awards: [
        { pole: 'adventure_comfort:positive', points: 2 },
        { pole: 'independent_collaborative:negative', points: 1 },
      ],
      rationale: 'Wanting to try everything on the table shows an exploratory, variety-seeking appetite, and embracing the family-style format itself is modestly collaborative.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m in, but we need enough food and a real plan.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Insisting on "a real plan" before agreeing is a planning-forward response, and the concern about having enough food is a practical, logistics-minded detail.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Why are we even discussing MY final bite?',
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'independent_collaborative:positive', points: 1 },
      ],
      rationale: 'The blunt pushback is direct, and the underlying stance is keeping the last bite for oneself rather than sharing it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'If somebody wants it, they can have it.',
      awards: [],
      rationale: 'Giving away the last bite is closer to the Private "Gives freely" pole; this free quiz cannot award Private poles and the wording supports no distinct Core angle.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Depends what I’m getting in return.',
      awards: [{ pole: 'practical_idealistic:positive', points: 1 }],
      rationale: 'Explicitly tracking reciprocation is closer to the Private "Keeps score" pole, which this free quiz cannot award; what remains defensible on the Core side is only a modest transactional, practical framing of the trade.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'There are several other bites available to you.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: 'Keeping the final bite is an independent, self-prioritizing choice, and redirecting rather than issuing a flat refusal is a softer, more indirect way of saying no.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I am way more upset than leftovers should legally make a person.',
      awards: [{ pole: 'emotional_intensity:positive', points: 2 }],
      rationale: 'Admitting an outsized emotional reaction to a minor loss is clear evidence of emotional intensity.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'This household will now be implementing labels.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Instituting a household labeling system is taking direct control of the situation, and it is also a forward-looking, preventive fix rather than a one-off reaction.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Honestly, I hope they enjoyed them.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 2 }],
      rationale: 'Choosing to feel glad for whoever ate the food, rather than annoyed, is a clear act of letting go without resentment.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I need to know who ate them and whether they knew they were mine.',
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: 'Insisting on finding out the facts before moving on is a clear verify-first response rather than letting it go.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'I’m making sure nobody kills one snack before everyone gets some.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Actively managing how the shared snacks get distributed is taking control of the situation rather than letting it play out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Certain snacks were clearly for me, and we all knew that.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Claiming specific snacks as one’s own is an independent, boundary-holding stance, stated plainly rather than hinted at.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Next trip everybody gets their own bag.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Proposing a system to prevent the same problem next time is forward planning, and it also puts a structure in place to control the outcome.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Everybody is eating everything. That’s why I brought it.',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Bringing snacks specifically to be shared with the group is a clear collaborative, communal intent.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'That sounds romantic for somebody else.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Declining the shared-entree idea for someone else entirely shows a clear preference for keeping one’s own food.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Sure. We can get appetizers too.',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Agreeing readily and adding more shareable food on top shows an easy, collaborative orientation toward the meal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Fine, but we need to agree on what we’re ordering.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Wanting the decision settled before anything is ordered is a planning-forward response to an otherwise spontaneous suggestion.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'We can taste each other’s food. I still want my own.',
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: 'Offering a compromise that still prioritizes having one’s own full dish reflects an independent streak even while meeting the other person partway.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'Everybody ordered separately and nobody let me taste anything.',
      awards: [{ pole: 'independent_collaborative:negative', points: 2 }],
      rationale: 'Being bothered by a meal with no shared tasting reveals a genuine preference for communal, collaborative eating.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'The bill got split evenly when some people ordered way more.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Caring that the bill matches what was actually ordered is a practical, accuracy-minded concern about the money itself, not a judgment about the food.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Somebody boxed up MY leftovers without asking.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Minding that someone handled food without permission is an independent, ownership-protective reaction, and it also reflects wanting a say over what happens to one’s own things.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'We spent half the meal passing plates around.',
      awards: [
        { pole: 'independent_collaborative:positive', points: 2 },
        { pole: 'patient_urgent:negative', points: 1 },
      ],
      rationale: 'Being irritated by constant plate-passing shows a preference for eating one’s own plate rather than a communal format, and the "half the meal" framing suggests mild impatience with the time it took.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
