import type { QuizPoleAwardMap } from './types';

// V2 answer-level pole calibration for the free "unexpected-money" quiz
// (UNEXPECTED_MONEY_QUIZ, src/data/quizzes/unexpected-money.ts). Free quiz -- Core poles
// only, per the Build 16/V2 rule mirroring the old "Public/Free quizzes do not generate
// Private/Relic personality awards" policy. No choice in this quiz reads as Private-only, so
// every choice carries at least one award here.
export const UNEXPECTED_MONEY_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'That just made me feel a lot safer.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Explicitly naming the feeling as safety, rather than excitement or opportunity, is strong, direct evidence of a security-first, comfort-seeking reaction.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Oh, I can finally do something fun without feeling guilty.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'playful_serious:positive', points: 1 },
      ],
      rationale: 'Treating the windfall as permission to spend on fun right away, rather than deferring it, is a clear spontaneous instinct, with a mild playful streak.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'What could I use this for that improves my life or income?',
      awards: [
        { pole: 'ambitious_content:positive', points: 3 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'The first instinct being self-improvement or income growth is strong, explicit ambition, framed in practical, outcome-oriented terms.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Where does this fit into the bigger plan?',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 3 },
        { pole: 'ambitious_content:positive', points: 1 },
      ],
      rationale: 'Immediately slotting the money into an existing plan is strong, explicit planner behavior, done in service of a larger goal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: 'A week? I’m clearly overthinking this.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Finding a week of deliberation excessive reveals a natural pull toward acting quickly rather than planning it out.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’ve been researching what would make it most useful.',
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'ambitious_content:positive', points: 1 },
      ],
      rationale: 'Spending the week researching the best use of the money is a clear verify-first habit, aimed at getting the most value or growth from it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I’ve already decided where every dollar is going.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 3 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Having a complete allocation decided for every dollar is strong, explicit planner behavior, and the totality of the plan reflects wanting full control of the outcome.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'That actually feels good.',
      awards: [
        { pole: 'patient_urgent:positive', points: 2 },
        { pole: 'adventure_comfort:negative', points: 1 },
      ],
      rationale: 'Feeling good about leaving the money untouched for a week is a clear sign of comfort with waiting, and the untouched balance itself is a mild security comfort.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'A course, equipment, business idea, or something that could open a door.',
      awards: [
        { pole: 'ambitious_content:positive', points: 3 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Secretly imagining self-investment items like a course or business idea is strong, explicit ambition, framed around tangible, practical tools.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Knocking out a goal faster than I expected.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Imagining the money accelerating an existing goal is clear ambition, and having a goal already in motion to accelerate implies some prior planning.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Watching my savings number go up.',
      awards: [
        { pole: 'adventure_comfort:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'The secret fantasy being a bigger savings balance is a clear security-and-comfort preference, maintained through disciplined, planned saving.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'A trip, dinner, purchase, something I normally talk myself out of.',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Secretly wanting to finally do something usually talked out of is a clear pull toward spontaneous indulgence over restraint, with an emotional undertone of desire.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: 'Fun can absolutely have a percentage.',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: 'Even allowing for fun, carving out a defined percentage rather than spending freely is a planning instinct, and setting that boundary is a mild act of control.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I’d rather feel secure than treated.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Explicitly choosing security over being treated is strong, direct evidence of a comfort-and-safety-first orientation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Thank you. Finally someone understands me.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 1 }],
      rationale: 'Relief at being given permission to enjoy the money suggests an enjoyment-first leaning, though the line itself describes a feeling rather than a concrete action, so the evidence is modest.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I enjoy things that keep paying me back.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'Preferring purchases with an ongoing return is clear ambition about making money work further, framed in practical terms.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'I spent it on something that added nothing to my life.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'The worst outcome being a purchase with no lasting value shows that growth or improvement, not just enjoyment, is the real measure of a good spend.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I let the opportunity pass without moving anything forward.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Dreading a missed chance to make progress is clear ambition, and "moving anything forward" implies measuring the money against a goal already in mind.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'An emergency happens and I wish I had saved it.',
      awards: [
        { pole: 'adventure_comfort:negative', points: 3 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'The worst-case fear being an unprotected emergency is strong, explicit evidence of a security-first mindset, paired with the foresight to have saved for it.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I saved every penny and didn’t enjoy any of it.',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Regretting total restraint rather than any emergency or missed opportunity shows a genuine, clear preference for spontaneous enjoyment over pure saving.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Finally doing the thing I keep saying is “too expensive.”',
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: 'Overriding a usual self-imposed spending limit is a clear move toward spontaneous indulgence over restraint.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Funding something that could make me better, faster, or more valuable.',
      awards: [{ pole: 'ambitious_content:positive', points: 3 }],
      rationale: 'Naming self-improvement and increased value as the most satisfying use of the money is strong, explicit ambition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Making a meaningful dent in one of my bigger goals.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Finding progress on a bigger goal most satisfying is clear ambition, and the existence of a tracked goal implies some prior planning.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Knowing an unexpected bill wouldn’t scare me anymore.',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'Finding relief from financial fear most satisfying is strong, explicit evidence of a security-first, comfort-seeking priority.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: '“It helped me get ahead.”',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Describing the money in terms of getting ahead is clear ambition, applied with enough follow-through to still be tracking the outcome six months later.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“Most of it’s still there.”',
      awards: [
        { pole: 'adventure_comfort:negative', points: 2 },
        { pole: 'planner_spontaneous:positive', points: 1 },
      ],
      rationale: 'Still holding onto most of the money six months later is a clear security-oriented, comfort-seeking outcome, sustained by consistent restraint.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“Gone. Worth it.”',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'ambitious_content:negative', points: 1 },
      ],
      rationale: 'Spending it all with no regret is clear spontaneous, enjoyment-first behavior, and the explicit "worth it" verdict is a modest sign of contentment with the outcome.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“It turned into something I use to grow.”',
      awards: [{ pole: 'ambitious_content:positive', points: 3 }],
      rationale: 'Describing the money as having become an ongoing tool for growth is strong, explicit ambition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: '“I don’t have to worry about that anymore.”',
      awards: [{ pole: 'adventure_comfort:negative', points: 3 }],
      rationale: 'The best-feeling outcome being the removal of a worry is strong, explicit evidence of a security-first, comfort-seeking priority.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“I’m so glad I actually let myself enjoy that.”',
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'emotional_intensity:positive', points: 1 },
      ],
      rationale: 'Feeling best about having given oneself permission to enjoy the money is a clear enjoyment-first, spontaneous preference, expressed with genuine emotional warmth.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“That ended up opening a door for me.”',
      awards: [{ pole: 'ambitious_content:positive', points: 3 }],
      rationale: 'Feeling best about an opportunity the money created is strong, explicit ambition.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“That moved me months ahead.”',
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'ambitious_content:positive', points: 1 },
      ],
      rationale: 'Measuring the money by how far it advanced a timeline is planner behavior, done in service of making progress on a goal.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
