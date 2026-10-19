import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "crisis" quiz (src/data/quizzes/crisis.ts).
// Calibrated independently from the exact choice wording; see docs/
// personality-scoring-v2-design.md and src/data/quiz-pole-awards/types.ts for the shape and
// rationale behind this file. Free quiz -- only CORE poles are ever awarded here, per product
// policy that free/public quizzes do not generate Private/Relic personality evidence.
export const CRISIS_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Hood’s up. I’m figuring out what’s wrong.',
      awards: [{ pole: 'practical_idealistic:positive', points: 2 }],
      rationale: 'Jumping straight into hands-on diagnosis of the problem is clear evidence of a practical, fix-it orientation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Everybody breathe. The car is broken, not the trip.',
      awards: [{ pole: 'emotional_intensity:negative', points: 2 }],
      rationale: 'Actively calming the group and reframing the setback as minor shows an even-keeled response to stress.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'You call roadside. You call the hotel. I’ll handle the rest.',
      awards: [
        { pole: 'control_allowing:positive', points: 3 },
        { pole: 'direct_indirect:positive', points: 2 },
      ],
      rationale: 'Assigning tasks and issuing clear instructions to the group is strong evidence of taking control, delivered directly.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Uber, rental car, stranger with jumper cables. New plan.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Pivoting instantly to a new plan without missing a beat shows a spontaneous, improvisational style.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'Fine. Drinks somewhere else. Dinner just became an adventure.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'adventure_comfort:positive', points: 2 },
      ],
      rationale: 'Treating a ruined dinner plan as a fun detour shows comfort with improvising and a taste for turning disruption into adventure.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I need the manager. Now. We had a reservation.',
      awards: [
        { pole: 'direct_indirect:positive', points: 3 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: 'Demanding the manager immediately is blunt, confrontational advocacy rather than letting the slight go.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’m checking every restaurant nearby before anybody finishes complaining.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 2 },
        { pole: 'patient_urgent:negative', points: 2 },
      ],
      rationale: 'Racing to solve the problem before anyone finishes complaining shows both practical problem-solving and urgency.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Nobody be rude to the hostess. We are still eating tonight.',
      awards: [
        { pole: 'protective_hands_off:positive', points: 2 },
        { pole: 'conflict_peacekeeping:negative', points: 2 },
      ],
      rationale: 'Shielding the hostess from the group’s frustration while still pushing to get dinner sorted shows a protective, de-escalating instinct.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Are you safe? Okay. I’m here.',
      awards: [
        { pole: 'protective_hands_off:positive', points: 3 },
        { pole: 'emotional_intensity:negative', points: 2 },
      ],
      rationale: 'Leading with safety and a calm "I’m here" before any other question is strong, explicit protective and even-keeled behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Is this “oops” bad or “come get me” bad?',
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: 'Asking a clarifying triage question before reacting shows an information-seeking, curious instinct rather than jumping to conclusions.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Where are you? Who’s with you?',
      awards: [
        { pole: 'control_allowing:positive', points: 2 },
        { pole: 'protective_hands_off:positive', points: 1 },
      ],
      rationale: 'Rapid-fire logistics questions show an instinct to take charge of the situation while checking on who is with the friend.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Start at the beginning. I need facts.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Insisting on the full story before reacting shows a want to verify the facts rather than take the dramatic framing at face value.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'I’m checking every flight, airport, and route within 200 miles.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 3 },
        { pole: 'patient_urgent:negative', points: 1 },
      ],
      rationale: 'Exhaustively checking every flight, airport, and route is strong evidence of a practical, solution-first instinct, pursued without delay.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Everybody relax. Worst case, we stay another night.',
      awards: [
        { pole: 'emotional_intensity:negative', points: 3 },
        { pole: 'patient_urgent:positive', points: 2 },
      ],
      rationale: 'Telling everyone to relax and accepting an extra night as a fine worst case is strong, explicit even-keeled and patient behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Bonus vacation day. Where are we eating?',
      awards: [
        { pole: 'ambitious_content:negative', points: 2 },
        { pole: 'planner_spontaneous:negative', points: 1 },
      ],
      rationale: 'Treating the cancellation as a bonus day and moving straight to where to eat shows contentment with how things turn out rather than striving to fix it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Everybody stay here. I’m going to the desk.',
      awards: [
        { pole: 'control_allowing:positive', points: 3 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Telling everyone to stay put while personally handling the desk is strong, explicit evidence of taking charge.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Nobody moves. You check there. I’ll check here.',
      awards: [
        { pole: 'control_allowing:positive', points: 3 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Organizing a systematic search and assigning who checks where is strong evidence of taking control of the situation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Find My iPhone. Call it. Lock it. Done.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Running through the practical recovery steps in order (locate, call, lock) is strong, explicit practical problem-solving.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Okay. It’s a phone. You’re safe. One thing at a time.',
      awards: [
        { pole: 'emotional_intensity:negative', points: 3 },
        { pole: 'protective_hands_off:positive', points: 1 },
      ],
      rationale: 'Downplaying the material loss and reassuring the other person’s safety is strong, explicit even-keeled, protective behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Well... apparently I’m off-grid now.',
      awards: [
        { pole: 'ambitious_content:negative', points: 2 },
        { pole: 'planner_spontaneous:negative', points: 1 },
      ],
      rationale: 'Shrugging off the loss as unplanned off-grid time shows contentment with the outcome rather than fighting it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Candles. Snacks. We live like pioneers now.',
      awards: [{ pole: 'adventure_comfort:positive', points: 2 }],
      rationale: 'Reframing a power outage as a fun pioneer scenario shows a willingness to lean into disruption rather than just endure it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Flashlights. Chargers. Breaker. I’m checking everything.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Methodically running through flashlights, chargers, and the breaker is strong, explicit practical problem-solving.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Everybody okay? Good. We’re fine.',
      awards: [
        { pole: 'emotional_intensity:negative', points: 2 },
        { pole: 'protective_hands_off:positive', points: 2 },
      ],
      rationale: 'Checking that everyone is okay and declaring things fine shows a calm, protective check-in rather than panic.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Nobody open the fridge. Phones on low power.',
      awards: [
        { pole: 'control_allowing:positive', points: 3 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Issuing household rules about the fridge and phones is strong, explicit evidence of taking charge of the situation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'You grab towels. You move that. I’m shutting the water.',
      awards: [
        { pole: 'control_allowing:positive', points: 3 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: 'Assigning specific tasks to others while personally shutting off the water is strong, explicit evidence of taking control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Bucket underneath. Temporary fix. Tomorrow problem.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'patient_urgent:positive', points: 1 },
      ],
      rationale: 'Opting for a quick stopgap and deferring the real fix to tomorrow shows a spontaneous, unhurried approach.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Find the shutoff valve. Towels. Plumber.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Methodically working the shutoff valve, towels, then plumber is strong, explicit practical problem-solving.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Get everybody out of the kitchen. Nobody panic.',
      awards: [
        { pole: 'protective_hands_off:positive', points: 3 },
        { pole: 'emotional_intensity:negative', points: 2 },
      ],
      rationale: 'Clearing people out of the danger zone and telling them not to panic is strong, explicit protective and even-keeled behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'Checking on everybody one more time.',
      awards: [{ pole: 'protective_hands_off:positive', points: 3 }],
      rationale: 'Doing one more check on everyone after the crisis has passed is strong, explicit protective behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Reviewing what went wrong so this never happens again.',
      awards: [
        { pole: 'practical_idealistic:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Reviewing what went wrong to prevent a repeat shows a practical, root-cause mindset focused on controlling future outcomes.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Telling the story like it was hilarious.',
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: 'Turning the ordeal into an entertaining story afterward shows a playful orientation toward the experience.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Fixing the last thing nobody noticed.',
      awards: [{ pole: 'practical_idealistic:positive', points: 3 }],
      rationale: 'Quietly finishing an unnoticed task is strong, explicit practical follow-through behavior.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
