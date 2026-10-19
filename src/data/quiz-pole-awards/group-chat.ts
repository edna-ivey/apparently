import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the free archetype quiz "Who are you in the group chat?"
// (src/data/quizzes/group-chat.ts, GROUP_CHAT_QUIZ). Free quiz -- only Core poles are ever
// awarded here, never Private poles, even where a choice's wording superficially resembles a
// Private-type behavior (e.g. checking on someone privately, taking initiative). See
// docs/personality-scoring-v2-design.md.
export const GROUP_CHAT_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Start from the beginning. I need context.',
      awards: [],
      rationale: 'Wanting full context before replying is too mild and generic to defensibly demonstrate any one of the 32 core poles on its own.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Scroll until I find out who is upset.',
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Actively scanning the chat for who is upset is a direct act of reading the room\'s emotional undercurrent.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Skip to the bottom and respond to the funniest part.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Prioritizing the funniest part over catching up on substance shows a playful default mode of engagement.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“Can somebody summarize this meeting?”',
      awards: [],
      rationale: 'A joke about delegating the catch-up work does not clearly demonstrate a specific core trait beyond humor.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: '“Are you okay?”',
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: 'Immediately checking on someone\'s wellbeing from one ambiguous message is a clear vibe-checking response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I already have the reaction GIF ready.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Defaulting to a prepared joke/reaction rather than concern or curiosity is a playful response style.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“WHO DID IT?”',
      awards: [{ pole: 'direct_indirect:positive', points: 1 }],
      rationale: 'Bluntly demanding to know who is responsible, rather than probing gently, is a modestly direct communication style.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m reading immediately.',
      awards: [{ pole: 'patient_urgent:negative', points: 1 }],
      rationale: 'Choosing to read right away rather than letting the message sit shows a modest pull toward urgency over patience.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'I’m making jokes about how we’ll still be deciding Friday night.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Responding to group indecision with jokes rather than trying to resolve it is a playful default.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I pick the place. Democracy had its chance.',
      awards: [{ pole: 'control_allowing:positive', points: 3 }],
      rationale: 'Explicitly overriding the group\'s stalled process and unilaterally deciding is strong, explicit evidence of taking control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’ll go wherever everyone lands. Just tell me when.',
      awards: [{ pole: 'control_allowing:negative', points: 2 }],
      rationale: 'Explicitly deferring to wherever the group ends up, with no attempt to steer the outcome, is clear evidence of letting things play out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m trying to find the option everybody can live with.',
      awards: [{ pole: 'competitive_cooperative:positive', points: 2 }],
      rationale: 'Actively working toward a consensus option everyone can accept is clear cooperative behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'I need somebody who saw it to report immediately.',
      awards: [{ pole: 'patient_urgent:negative', points: 2 }],
      rationale: 'Demanding an immediate report rather than letting the moment pass is clear evidence of urgency.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I noticed. I will be watching quietly.',
      awards: [{ pole: 'patient_urgent:positive', points: 2 }],
      rationale: 'Choosing to watch quietly rather than push for information right away is a patient, unhurried response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'If they wanted to say it, they’ll say it when they’re ready.',
      awards: [{ pole: 'protective_hands_off:negative', points: 2 }],
      rationale: 'Explicitly respecting the other person\'s own timing and not pressing the issue is a hands-off response.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“OH NOW WHAT DID YOU DELETE???”',
      awards: [{ pole: 'patient_urgent:negative', points: 2 }],
      rationale: 'An immediate, insistent demand to know what was deleted is clear evidence of urgency rather than patience.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I send something I know will make them respond.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Deliberately engineering a message to force a response is taking active control of the social situation rather than waiting it out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I ask the group if anybody has heard from them.',
      awards: [{ pole: 'protective_hands_off:positive', points: 2 }],
      rationale: 'Rallying the group\'s attention to check on someone\'s wellbeing is a protective response to their silence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I notice, but I’ll give them space.',
      awards: [{ pole: 'protective_hands_off:negative', points: 3 }],
      rationale: 'Explicitly choosing to give someone space rather than intervene is strong, direct evidence of a hands-off approach.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I check on them privately.',
      awards: [{ pole: 'private_open:positive', points: 2 }],
      rationale: 'Choosing to reach out privately rather than publicly in the chat is a clear preference for discretion over openness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'I’m checking on both of them separately.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 2 }],
      rationale: 'Reaching out to each side privately rather than engaging the public argument is a de-escalating, peacekeeping move.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’m trying to stop this from becoming a congressional hearing.',
      awards: [{ pole: 'conflict_peacekeeping:negative', points: 2 }],
      rationale: 'Actively trying to keep the argument from escalating further is clear peacekeeping intent, even delivered with a joke.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Okay, enough. Let’s actually deal with what happened.',
      awards: [{ pole: 'conflict_peacekeeping:positive', points: 3 }],
      rationale: 'Explicitly calling for the conflict to be addressed head-on rather than smoothed over or avoided is strong, direct conflict-forward evidence.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I’m watching. I’m not getting drafted into this.',
      awards: [{ pole: 'protective_hands_off:negative', points: 2 }],
      rationale: 'Deliberately refusing to get pulled into someone else\'s conflict is a clear hands-off stance.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'Somehow I’m now coordinating dinner, cake, and reservations.',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 2 },
      ],
      rationale: 'Unprompted takeover of the event is control; the actual activity described (coordinating dinner, cake, reservations) is independently also organizing/planning.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I know. I’ve known. I simply haven’t said anything.',
      awards: [{ pole: 'private_open:positive', points: 3 }],
      rationale: 'Explicitly holding onto known information and choosing not to disclose it is strong, direct evidence of privacy over openness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I remember the little thing they mentioned wanting months ago.',
      awards: [{ pole: 'sentimental_thick_skinned:positive', points: 2 }],
      rationale: 'Holding onto a small detail someone mentioned in passing, months later, shows sentimental attentiveness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'They’re getting the funniest birthday post of their life.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Marking the occasion with humor rather than sentiment or logistics is a playful default.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'Nobody knows who saw what.',
      awards: [],
      rationale: 'Describes a passive side effect of the person\'s absence rather than a specific chosen behavior, too indirect to defensibly assign a trait.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Somebody realizes no one is checking on everybody.',
      awards: [{ pole: 'protective_hands_off:positive', points: 3 }],
      rationale: 'States directly that this person is the one who routinely checks on everyone\'s wellbeing, strong explicit evidence of protectiveness.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'The chat becomes painfully unfunny.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Identifies the person as the chat\'s source of humor, clear evidence of a playful role.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'They are still discussing Saturday plans on Sunday.',
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: 'Implies that without this person taking charge, the group never actually lands on a decision, evidence of a controlling/decisive role in group plans.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
