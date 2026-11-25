import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the PREMIUM "Apparently Private" quiz
// "Are you ambitious... or proving something?" (src/data/quizzes/career-proving.ts, registry
// id 'career-ambition-proving'). access: 'private' -- both Core and Private poles are in play
// when genuinely supported. Every question/choice has an entry; empty `awards` is a
// deliberate "no defensible evidence" call, not an omission. Existing `traitSignals` on the
// source quiz were reviewed as one input but independently recalibrated against the new
// positive-only 1/2/3 standard -- see the brief in docs/personality-scoring-v2-design.md.
export const CAREER_PROVING_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: 'Not really. I still have the thing I wanted.',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 3 }],
      rationale: 'Explicitly stating the win is unchanged by whether anyone ever hears about it is strong, direct self-secure evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'A little. I’m not proud of it, but part of the fantasy included them knowing.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Admitting the fantasy itself included other people knowing is fairly clear evidence that external perception is part of the motivation, even while disliking that fact.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Depends who “they” are. There are definitely one or two people I would like informed. 😂',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Naming specific people whose awareness still matters is fairly clear evidence that certain others’ opinions carry real weight.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'A lot, actually. If nobody knows I made it, something about it feels less satisfying.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'Directly stating satisfaction depends on others knowing is strong, explicit approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: '“Good for them.” Then I go back to my own life.',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 2 }],
      rationale: 'A quick, clean return to one’s own life with no lingering comparison is fairly clear evidence of security that does not depend on measuring against others.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Immediate comparison. Then I have to talk myself back down.',
      awards: [{ pole: 'reflective_reactive:positive', points: 2 }],
      rationale: 'The behavior that lands is the active self-regulation after the initial spike, which is fairly clear reflective evidence; dropped the competitiveness reading since the comparison itself is framed as something to manage, not fuel.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Motivation spike. Oh, we’re doing things now.',
      awards: [
        { pole: 'competitive_cooperative:positive', points: 3 },
        { pole: 'ambitious_content:positive', points: 1 },
      ],
      rationale: 'Someone else’s win directly flipping on "we’re doing things now" is strong, explicit competitive activation, with a modest secondary ambition signal in the activated drive itself.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I start mentally listing all the reasons their win does not count the same as mine would. 👀',
      awards: [{ pole: 'perspective_taking_self_referencing:negative', points: 3 }],
      rationale: 'Actively building a case for why the comparison does not apply is strong, explicit self-referencing rather than a genuine competitive drive, so this was corrected off the competitiveness pole.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: 'Excellent work, good money, almost no public recognition',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 2 }],
      rationale: 'Choosing substance over recognition when forced to trade them off is fairly clear evidence that validation is not the driver.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Freedom, even if the job itself is not impressive',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Prioritizing freedom over how impressive the work looks is modest evidence of not needing external validation.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'A title or accomplishment people immediately respect',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'Explicitly choosing the option defined by others’ immediate respect, over all three alternatives, is strong approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Building something difficult enough that I know I earned it',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'self_secure_reassurance:positive', points: 2 },
      ],
      rationale: 'Wanting difficulty is fairly clear ambition, and "I know I earned it" is fairly clear evidence the validation is internal rather than borrowed from an audience.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: '“I knew you could do it.”',
      awards: [{ pole: 'self_secure_reassurance:negative', points: 1 }],
      rationale: 'Finding a line of belief/affirmation the most emotionally charged is modest evidence that external reassurance carries real weight.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: '“I didn’t think you had it in you.”',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'A specific doubter’s reversal carrying the most charge is fairly clear evidence that changing someone’s prior opinion matters.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: '“You’re doing really well for yourself.”',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 1 }],
      rationale: 'General approval landing as the most charged line is modest evidence that outside validation registers.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: '“Wow. I was wrong about you.”',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'The explicit "proving a doubter wrong" line landing as most charged is strong approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: 'Sold. My actual life matters more than the résumé line.',
      awards: [
        { pole: 'self_secure_reassurance:positive', points: 3 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: 'The immediate, unconditional "sold" explicitly prioritizing real life over how it reads to others is strong self-secure evidence, with a modest practical lean toward substance over image.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Probably yes, but I’d need to get over the fact that it sounds boring.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 1 }],
      rationale: 'Willing to do it but naming "sounding boring" as a real hurdle is modest evidence that how it reads to others matters somewhat.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I don’t know. Part of success to me is being proud to tell people what I do.',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 2 }],
      rationale: 'Defining part of success as being proud to tell people is fairly clear evidence that the social telling matters, not just the outcome.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'No. If I’m going to work that hard, I want something that feels significant too.',
      awards: [{ pole: 'ambitious_content:positive', points: 1 }],
      rationale: 'Wanting the effort to feel significant, not just successful, is modest evidence of ambition tied to meaning rather than ease.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: 'Waking up and actually liking what my everyday life looks like',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 1 }],
      rationale: 'Valuing daily lived satisfaction over an external marker of "making it" is modest evidence that validation is internally sourced.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Having the money and freedom to do what I want',
      awards: [],
      rationale: 'Money and freedom are generic goods here and do not point at a specific one of the 64 poles.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'People seeing what I accomplished and knowing I really did it',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'Naming other people seeing and knowing as the best part of success is strong, explicit approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Knowing I became genuinely great at something',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'self_secure_reassurance:positive', points: 1 },
      ],
      rationale: 'Mastery as its own reward is fairly clear ambition evidence, with "knowing" rather than "being told" as a modest self-secure signal.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: 'I help them. Life moved on.',
      awards: [{ pole: 'forgiving_receipts:positive', points: 2 }],
      rationale: 'Explicitly stating the past is settled ("life moved on") before helping is fairly clear evidence of letting go rather than holding the old slight.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'I help them, but I would be lying if I said the irony does nothing for me. 😂',
      awards: [{ pole: 'forgiving_receipts:positive', points: 1 }],
      rationale: 'Still helps despite admitting the reversal feels satisfying, so the behavior leans forgiving even though the feeling has not fully faded; dropped the reflective signal as not clearly supported by this wording.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Oh, I am helping beautifully. They are also going to understand exactly who they asked.',
      awards: [{ pole: 'gives_freely_keeps_score:negative', points: 3 }],
      rationale: 'Pairing the help with making sure the other person "understands exactly who they asked" is strong, explicit evidence the help is being used to settle a score.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'I don’t really want to help. They can figure it out like I had to.',
      awards: [
        { pole: 'gives_freely_keeps_score:negative', points: 3 },
        { pole: 'repair_punishing:negative', points: 1 },
      ],
      rationale: 'Explicitly refusing help by invoking "like I had to" is strong, direct score-keeping, with a modest secondary punishing lean in withholding help as the response.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: 'Me. I genuinely like growth and challenge.',
      awards: [{ pole: 'ambitious_content:positive', points: 3 }],
      rationale: 'A direct, unqualified statement of genuinely liking growth and challenge is strong ambition evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Me, but sometimes I wonder whether I know how to enjoy anything.',
      awards: [
        { pole: 'reflective_reactive:positive', points: 2 },
        { pole: 'ambitious_content:positive', points: 1 },
      ],
      rationale: 'Stopping to question the pattern itself is fairly clear reflective evidence, alongside the modest underlying ambition the pattern describes.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'Definitely me. Standing still feels a little too much like falling behind.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'patient_urgent:negative', points: 1 },
      ],
      rationale: 'Restless escalation toward bigger goals is fairly clear ambition, and framing standing still as "falling behind" is a modest, separate signal of low tolerance for stillness.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'That sounds exhausting. I actually want to arrive somewhere eventually.',
      awards: [{ pole: 'ambitious_content:negative', points: 2 }],
      rationale: 'Explicitly wanting an endpoint rather than endless escalation is fairly clear evidence of favoring contentment/arrival over perpetual striving.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: 'Knowing I could have done more but didn’t',
      awards: [{ pole: 'accountability_defensiveness:positive', points: 1 }],
      rationale: 'Self-directed regret about effort rather than blaming circumstance is modest ownership evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'Failing at something I deeply cared about',
      awards: [],
      rationale: 'Minding failure at something deeply cared about most is a near-universal reaction and does not point at a specific pole.',
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'People seeing me fail after I talked about it',
      awards: [{ pole: 'boundary_holding_approval_seeking:negative', points: 3 }],
      rationale: 'The combination of public failure plus having announced it beforehand is strong, explicit approval-seeking evidence.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'Watching somebody I considered my peer pass me',
      awards: [
        { pole: 'competitive_cooperative:positive', points: 2 },
        { pole: 'perspective_taking_self_referencing:negative', points: 1 },
      ],
      rationale: 'Minding being passed by a peer specifically is fairly clear competitive evidence, with a modest self-referencing lean in how the comparison is framed around status.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: 'It would sting, but it would not change what I built.',
      awards: [{ pole: 'self_secure_reassurance:positive', points: 2 }],
      rationale: 'Naming the sting honestly while still holding that it would not change the outcome is fairly clear, balanced self-secure evidence.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: 'That would hurt more than I want to admit.',
      awards: [{ pole: 'self_secure_reassurance:negative', points: 3 }],
      rationale: 'Admitting the silence would hurt more than they want to acknowledge is strong, direct reassurance-seeking evidence; dropped the separate approval-seeking pole since it is the same underlying need for this one person’s validation.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: 'I would immediately want to achieve something even harder.',
      awards: [
        { pole: 'ambitious_content:positive', points: 2 },
        { pole: 'boundary_holding_approval_seeking:negative', points: 1 },
      ],
      rationale: 'Escalating to a harder goal is fairly clear ambition, and doing so specifically in response to unmet approval is a modest, separate approval-seeking signal.',
      status: 'unchanged-from-authored-signal',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: 'If I’m being real, part of me would wonder what the point was.',
      awards: [
        { pole: 'self_secure_reassurance:negative', points: 3 },
        { pole: 'boundary_holding_approval_seeking:negative', points: 2 },
      ],
      rationale: 'The entire goal losing its meaning without that one person’s reaction is strong reassurance-seeking evidence, with a fairly clear secondary approval-seeking signal in how much weight is placed on their response specifically.',
      status: 'corrected',
      scoringVersion: 'v2.0',
    },
  },
};
