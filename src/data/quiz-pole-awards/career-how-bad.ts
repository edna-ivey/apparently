import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the PREMIUM "Apparently Private" quiz
// "How bad do you actually want it?" (src/data/quizzes/career-how-bad.ts, registry id
// 'career-ambition-how-bad'). access: 'private' -- both Core and Private poles are in play
// when genuinely supported. Every question/choice has an entry; empty `awards` is a
// deliberate "no defensible evidence" call, not an omission. Existing `traitSignals` on the
// source quiz were reviewed as one input but independently recalibrated against the new
// positive-only 1/2/3 standard -- see the brief in docs/personality-scoring-v2-design.md.
export const CAREER_HOW_BAD_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Giving up a chunk of my free time',
      awards: [{ pole: 'adventure_comfort:negative', points: 1 }],
      rationale: 'Naming lost free time as the biggest hesitation points modestly toward preferring comfort and ease over stretching.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Being visibly bad at something before I get good',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Hesitating most at being seen as incompetent shows the behavior is gated by how it will look to others, a fairly clear approval-seeking signal. Genuinely ambiguous against vulnerable_armored (protecting against embarrassment); we kept approval-seeking since the discomfort is explicitly about an audience watching, not about exposing a soft feeling.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Doing boring, repetitive work with no guarantee it pays off',
      awards: [{ pole: 'adventure_comfort:negative', points: 1 }],
      rationale: 'Monotony and uncertain payoff being the sticking point reads as a mild preference for comfort over tolerating an unglamorous grind.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Having people watch me try and possibly fail',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Same audience-visibility concern as option b, just framed around possible failure rather than visible incompetence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'Taking it. I asked for the destination, not the aesthetic.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Explicitly subordinates image/comfort to the actual goal, which is clear ambition; the destination-over-aesthetic framing is also a modest practical lean.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Taking it… while quietly being mad that this is apparently how we’re getting there.',
      awards: [{ pole: 'ambitious_content:positive', points: 1 }],
      rationale: 'Still follows through on the opportunity despite irritation, which is modest evidence of goal-directed persistence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Hesitating. Part of what I wanted was the version I imagined.',
      awards: [{ pole: 'practical_idealistic:negative', points: 2 }],
      rationale: 'The hesitation is explicitly about losing the imagined version, not about avoiding discomfort, so this is attachment to an ideal rather than comfort-seeking. Corrected the pole from comfort-seeking to idealistic.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Honestly? If it looks this miserable, I’m reconsidering the whole dream.',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Willingness to abandon the entire goal over how unpleasant the path looks is fairly clear evidence of prioritizing comfort over the destination.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: '“I haven’t told anybody yet. I want to see if I can actually pull it off first.”',
      awards: [
        { pole: 'ambitious_content:positive', points: 1 },
        { pole: 'private_open:positive', points: 2 },
      ],
      rationale: 'Wanting to prove it to themselves first is modest ambition evidence; deliberately not telling anyone until it is real is a fairly clear, independent instance of keeping things private rather than open.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Okay, hear me out. I have ANOTHER idea.”',
      awards: [{ pole: 'curious_decisive:positive', points: 1 }],
      rationale: 'Getting pulled toward a new idea instead of sticking with the current one is modest evidence of being drawn to novelty over settling on one path.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“I know what I need to do. I just need to get myself to do it.”',
      awards: [{ pole: 'accountability_defensiveness:positive', points: 2 }],
      rationale: 'Naming the gap as "getting myself to do it" rather than blaming circumstances is a fairly clear ownership statement. Dropped the ambition signal since the line is really about a stalled follow-through, not drive.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“At this point, I’m tired. I’ll figure it out later.”',
      awards: [{ pole: 'adventure_comfort:negative', points: 1 }],
      rationale: 'Deferring effort in favor of rest when tired is modest evidence of leaning toward ease over pushing through.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'All that effort for nothing.',
      awards: [],
      rationale: 'Minding wasted effort most is a near-universal reaction to a flop and does not point at any specific one of the 64 poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Everybody seeing me fail.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'What hurts most being that others witnessed the failure is fairly clear evidence that the behavior is shaped by audience perception.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Realizing I might have chosen the wrong strategy.',
      awards: [
        { pole: 'reflective_reactive:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Analyzing the strategy itself rather than the emotional sting is a fairly clear reflective move, with a modest practical lean toward evaluating what actually works.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Having to start all over again.',
      awards: [],
      rationale: 'Minding the redo most is a generic reaction to setbacks and does not cleanly map to a specific pole on its own.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Absolutely. Now I can do it without worrying about money.',
      awards: [{ pole: 'ambitious_content:positive', points: 3 }],
      rationale: 'Unconditionally affirming the dream survives, with money framed only as a removed obstacle, is strong explicit evidence of intrinsic drive.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Yes, but I’m definitely doing it at a much more relaxed pace.',
      awards: [
        { pole: 'ambitious_content:positive', points: 1 },
        { pole: 'adventure_comfort:negative', points: 1 },
      ],
      rationale: 'Still wanting the goal is modest ambition evidence, while explicitly easing the pace once pressure is removed is a separate, modest comfort-seeking signal.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Maybe not. Apparently the money was doing more heavy lifting than I thought.',
      awards: [{ pole: 'ambitious_content:negative', points: 1 }],
      rationale: 'Self-aware admission that financial necessity, not the goal itself, was the real driver is modest evidence the underlying drive was more contentment-with-the-status-quo than true ambition for this particular dream.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Depends on the dream. Some things I want because of what they would prove.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Admitting some goals exist to prove something is fairly clear evidence the goal is at least partly in service of others’ perception.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Knowing I built something difficult',
      awards: [{ pole: 'ambitious_content:positive', points: 2 }],
      rationale: 'Taking the most satisfaction from the difficulty itself is fairly clear intrinsic-mastery evidence of ambition.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Freedom',
      awards: [],
      rationale: 'A single-word preference for "freedom" is too generic to defensibly point at any one of the 64 poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Being recognized as successful',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'Naming external recognition itself as the favorite part of success is strong, explicit approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'The lifestyle that comes with it',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Valuing the resulting lifestyle over the achievement or recognition itself is fairly clear evidence the real draw is comfort and ease.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: '“Damn. Good for them. What are they doing that I’m not?”',
      awards: [
        { pole: 'accountability_defensiveness:positive', points: 3 },
        { pole: 'reflective_reactive:positive', points: 2 },
      ],
      rationale: 'Turning straight to "what are they doing that I’m not" instead of any excuse is strong, explicit ownership, paired with a clear instinct to analyze the gap rather than just react to it. Dropped the practicality signal as not independently supported by this specific wording.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Oh, now I’m pissed. Move.”',
      awards: [{ pole: 'competitive_cooperative:positive', points: 3 }],
      rationale: 'An immediate, explicit competitive charge at being overtaken is strong evidence of a win-oriented drive.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“Well, they had advantages I didn’t have.”',
      awards: [{ pole: 'accountability_defensiveness:negative', points: 3 }],
      rationale: 'Immediately externalizing the gap to circumstance rather than examining their own behavior is strong, explicit defensiveness.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“I’m happy for them.”  …followed approximately eight seconds later by emotional damage. 😭',
      awards: [{ pole: 'emotional_intensity:positive', points: 1 }],
      rationale: 'The stated happiness quickly giving way to a strong felt reaction is modest evidence of an intense emotional response, not of successfully hiding it, so this was corrected away from an "armored" reading.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'How much time I had that I swore I didn’t have',
      awards: [{ pole: 'accountability_defensiveness:negative', points: 1 }],
      rationale: 'Being nervous that the data would disprove a "didn’t have time" claim suggests that claim gets used as cover, a mild defensiveness tell. Genuinely ambiguous: this could instead read as anticipatory honesty/accountability about to be demonstrated; we went with the mild defensiveness reading since the nervousness implies the excuse is already in active use, flipping the pole from the original signal.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'How many things I started',
      awards: [{ pole: 'curious_decisive:positive', points: 1 }],
      rationale: 'Being most nervous about a tally of started-but-unfinished things is modest evidence of chasing new things over settling into one.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'How much I actually got done',
      awards: [],
      rationale: 'Low output alone is a generic worry that does not point at a specific one of the 64 poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'How often I chose something easier after saying this mattered more',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Explicitly naming a repeated pattern of choosing ease over a stated priority is strong, direct comfort-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: 'Routine. I don’t need to be excited anymore.',
      awards: [
        { pole: 'patient_urgent:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Explicitly not needing stimulation to keep going is fairly clear patience with a flat stretch, and leaning on routine is a modest structure/planning signal.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Seeing progress. If I can tell it’s working, I’m good.',
      awards: [{ pole: 'ambitious_content:positive', points: 1 }],
      rationale: 'Being sustained by visible progress markers is modest evidence of goal-directed motivation.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I probably need something to reignite me.',
      awards: [{ pole: 'patient_urgent:negative', points: 1 }],
      rationale: 'Needing an external spark to keep going through a flat stretch is modest evidence of low tolerance for the lack of stimulation, i.e. some urgency for things to feel alive again.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Month seven?? You have a lot of confidence in me.',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Self-deprecating doubt about sustaining a long, unglamorous stretch is fairly clear evidence of struggling against the grind in favor of easier ground.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: 'Yes. Five years is going to pass anyway.',
      awards: [
        { pole: 'patient_urgent:positive', points: 3 },
        { pole: 'ambitious_content:positive', points: 2 },
      ],
      rationale: 'The time-passes-anyway reasoning is strong, explicit patience with a long unglamorous timeline, plus a clear unconditional "yes" to the goal.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Yes… but that timeline definitely changes how hard I’m willing to push.',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Still wanting it but explicitly dialing down effort once the real cost is named is fairly clear comfort-seeking.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I need to think about whether I want that thing or just what I thought it would give me.',
      awards: [{ pole: 'reflective_reactive:positive', points: 3 }],
      rationale: 'Explicitly pausing to examine the real motive behind the goal before answering is strong, direct reflective evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Five years with no shortcut? Whew. We may need a new dream.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Dropping the goal outright once the real timeline and lack of shortcuts are named is strong, explicit comfort-seeking.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
};
