import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free archetype quiz "What kind of kid were you when
// adults weren't looking?" (src/data/quizzes/kid-you.ts, KID_YOU_QUIZ). Free quiz -- only
// Core poles are ever awarded here, never Private poles. No candidate mappings were supplied
// for this quiz; every mapping below was derived independently from the exact choice wording.
// See docs/personality-scoring-v2-design.md.
export const KID_YOU_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'I’m somehow deciding what all the cousins are doing.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Unprompted takeover of what the other kids do is clear evidence of taking control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Excellent. Now we can do the thing we were told not to do.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Eagerly seizing the chance to break an explicit instruction is clear rule-bending behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m listening closely to the grown-folks conversation from a safe distance.',
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Actively attending closely to the adults\' conversation is clear evidence of reading the social room.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I am still technically behaving. Technically.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Finding the technicality that lets them comply in letter but not spirit is clear rule-bending via loophole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'My first thought is, “What do they know?”',
      awards: [],
      rationale: 'A guarded internal reaction to being summoned is too indirect to defensibly demonstrate a specific chosen behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I mentally replay the last hour before answering.',
      awards: [{ pole: 'patient_urgent:positive', points: 1 }],
      rationale: 'Pausing to review before reacting, rather than answering immediately, is modest evidence of patience over urgency.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I go right away. Looking innocent is part of the strategy.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Explicitly managing their appearance as a strategy suggests a pattern of bending rules while avoiding the consequences.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I immediately start preparing my explanation.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 2 }],
      rationale: 'Proactively preparing an explanation ahead of the confrontation is clear planning behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'I’m happy to watch until I decide whether this is worth joining.',
      awards: [{ pole: 'curious_decisive:positive', points: 1 }],
      rationale: 'Taking time to evaluate before committing, rather than jumping in or deciding quickly, is modest exploratory behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I participate, but I am absolutely getting home before the streetlights come on.',
      awards: [{ pole: 'rules_bending:positive', points: 2 }],
      rationale: 'Explicitly holding to a known boundary (curfew) while still participating is clear rule-oriented behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I invent a game and somehow end up in charge.',
      awards: [{ pole: 'control_allowing:positive', points: 3 }],
      rationale: 'Creating the activity and ending up in charge of it is strong, direct evidence of taking control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Whatever we choose will eventually violate at least one rule.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Treating rule violation as the expected default outcome is clear rule-bending disposition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'I will tell the truth... strategically.',
      awards: [{ pole: 'rules_bending:negative', points: 1 }],
      rationale: 'Managing disclosure strategically rather than plainly is modest evidence of bending norms rather than following them outright.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'First, we need a plan.',
      awards: [{ pole: 'planner_spontaneous:positive', points: 3 }],
      rationale: 'Explicitly calling for a plan before acting is strong, direct planning behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m probably involved enough that silence is my best option.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Admitting likely involvement in what broke and choosing silence over disclosure is clear rule-bending behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I know exactly who did it. Nobody asked me yet.',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Holding known information back and waiting to be asked is clear evidence of keeping things private.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I’m still awake because this is when everybody starts telling the good stories.',
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: 'Staying up specifically out of interest in hearing what comes out late at night is clear curiosity-driven behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’ve been behaving all night. The adults going to sleep changes things slightly.',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Explicitly shifting behavior once supervision lifts is clear rule-bending behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’ve somehow created an activity with rules and assigned roles.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Unprompted creation and organization of an activity, assigning roles to others, is clear evidence of taking control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'This is when all our worst ideas become excellent ideas.',
      awards: [{ pole: 'adventure_comfort:positive', points: 2 }],
      rationale: 'Embracing risky, unconventional ideas rather than playing it safe is clear adventurous behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'That object has now become the most interesting thing in the room.',
      awards: [{ pole: 'curious_decisive:positive', points: 1 }],
      rationale: 'A prohibition sharply increasing their interest in the object shows modest evidence of curiosity being pulled toward the unknown.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’m watching somebody else touch it first.',
      awards: [{ pole: 'adventure_comfort:negative', points: 2 }],
      rationale: 'Letting someone else take the risk while they hold back is clear comfort-seeking, risk-averse behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m not touching it. I would simply like to clarify what counts as “touching.”',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Seeking a loophole in the wording of the rule while technically complying is clear rule-bending behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I need to know why before I agree to anything.',
      awards: [
        { pole: 'curious_decisive:positive', points: 1 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Wanting the reasoning first is modest curiosity; making agreement conditional on getting it is modest evidence of asserting control over the terms.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: '“Such a good child.”',
      awards: [{ pole: 'rules_bending:positive', points: 2 }],
      rationale: 'Being remembered by adults as consistently good/compliant is clear, if secondhand, rule-oriented evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“You always want to be in charge.”',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Being remembered specifically for always wanting to be in charge is clear, if secondhand, control-seeking evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“Why are YOU always involved?”',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'A reputation for habitually turning up in incidents is clear, if secondhand, rule-bending evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“You’re so quiet.”',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'A reputation for quietness is clear, if secondhand, evidence of a private rather than open disposition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: '“They had a plan for EVERYTHING.”',
      awards: [{ pole: 'planner_spontaneous:positive', points: 3 }],
      rationale: 'Being described by a close friend as having a plan for everything is strong, direct planning evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Do not let the innocent face fool you.”',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Maintaining a misleadingly innocent appearance while actually bending rules is clear, if secondhand, rule-bending evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“They knew everybody’s business and never said a word.”',
      awards: [
        { pole: 'social_attunement:positive', points: 2 },
        { pole: 'private_open:positive', points: 2 },
      ],
      rationale: 'Knowing everybody\'s business shows clear social attunement; never saying a word about it is independently clear evidence of keeping things private.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“The adults thought they were an angel. That’s all I’m saying.”',
      awards: [{ pole: 'rules_bending:negative', points: 2 }],
      rationale: 'Successfully maintaining a misleading reputation with adults is clear, if secondhand, rule-bending evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
