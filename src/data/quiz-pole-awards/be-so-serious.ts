import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the "Be So Serious Right Now." quiz (src/data/quizzes/
// be-so-serious.ts, id 'be-so-serious'). access: 'private-preview' -- free to play, lives in
// the Private room, and (per product policy for the two private-preview quizzes) is allowed
// to award BOTH Core and Private poles when the wording genuinely supports it, unlike the
// plain free Explore quizzes. This quiz had no prior answer-level traitSignals, so every
// entry below is status: 'new'. Does not touch the quiz content file or its result-level
// profileSignals -- those are a separate reconciliation concern.
export const BE_SO_SERIOUS_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: `I ask what’s going on. Twice feels like a pattern, but I want the story before I decide what it means.`,
      awards: [{ pole: 'reflective_reactive:positive', points: 2 }],
      rationale: `Deliberately gathers information and holds off judgment rather than reacting to the pattern immediately. Clear pause-before-responding behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I say “It’s fine.” It is not fine. And I will remember this the next time they ask me for something. 😂`,
      awards: [
        { pole: 'forgiving_receipts:negative', points: 2 },
        { pole: 'gives_freely_keeps_score:negative', points: 2 },
      ],
      rationale: `Explicitly says they will remember and hold onto this rather than let it go, and ties that memory directly to future reciprocity when the other person needs something.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I stop making plans around them. I’m not arguing about it. I’m just adjusting their access to my time.`,
      awards: [{ pole: 'boundary_holding_approval_seeking:positive', points: 2 }],
      rationale: `Quietly limits their own time and access as a self-protective limit, without confrontation or retaliation. A clean boundary-setting action.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I tell them exactly why I’m annoyed. If you keep wasting my time, I’m going to say you keep wasting my time.`,
      awards: [{ pole: 'direct_indirect:positive', points: 2 }],
      rationale: `States the complaint plainly and explicitly, with no hedging or indirection about the actual issue.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I immediately start thinking about how to prevent this from happening again. Earlier confirmations, firmer plans, something.`,
      awards: [
        { pole: 'planner_spontaneous:positive', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: `Reaches for process and structure (confirmations, firmer plans) to prevent recurrence, which is planning behavior. The impulse to install firmer plans on someone else's behavior also shows a modest pull toward control.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: `“Okay. Tell me what part hurt you.”`,
      awards: [
        { pole: 'perspective_taking_self_referencing:positive', points: 2 },
        { pole: 'reflective_reactive:positive', points: 1 },
      ],
      rationale: `Asks to understand the other person's experience rather than defending or explaining first. The calm, curious first move also shows a modest pause before reacting.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `“That is absolutely not what I meant.”`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 3 }],
      rationale: `Immediately redirects to intent instead of acknowledging the impact described. Textbook reflexive denial.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `“Interesting, because you had no problem hurting MY feelings.”`,
      awards: [
        { pole: 'accountability_defensiveness:negative', points: 3 },
        { pole: 'gives_freely_keeps_score:negative', points: 2 },
      ],
      rationale: `Deflects the complaint with a counter-accusation instead of addressing it, and explicitly frames it as a tit-for-tat ledger between the two of them.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `“What did I even say that was so bad?”`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 2 }],
      rationale: `Minimizes the other person's hurt instead of engaging with it, a mild form of denial rather than ownership.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I immediately feel defensive, but I know enough not to let the first reaction drive the whole conversation.`,
      awards: [{ pole: 'reflective_reactive:positive', points: 3 }],
      rationale: `Explicitly names the gap between the first impulse and the response actually given, and chooses not to let the immediate reaction run the conversation. Strong, explicit self-regulation.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: `I ask once whether there’s room to reconsider. If the answer is still no, I leave it alone.`,
      awards: [{ pole: 'control_allowing:negative', points: 2 }],
      rationale: `Asks once and then accepts the other person's decision rather than continuing to push. Lets the outcome play out as decided.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I keep explaining because I genuinely think they’d agree if they understood the whole thing.`,
      awards: [{ pole: 'control_allowing:positive', points: 3 }],
      rationale: `Continues pushing a decision that belongs to someone else on the belief that enough explaining will change their mind. Strong, explicit evidence of trying to control an outcome that isn't theirs to decide.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Fine. I stop asking. But I’m probably noticeably colder afterward.`,
      awards: [
        { pole: 'repair_punishing:negative', points: 2 },
        { pole: 'direct_indirect:negative', points: 1 },
      ],
      rationale: `Stops arguing out loud but lets displeasure show through withdrawn warmth instead of words, a passive consequence rather than open communication.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I say okay, then go figure out another way to get what I wanted without involving them. 😂`,
      awards: [{ pole: 'independent_collaborative:positive', points: 2 }],
      rationale: `Accepts the no and solves the problem alone rather than continuing to negotiate with or route around the other person's involvement entirely.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I bring up all the times I said yes when THEY wanted something because suddenly reciprocity matters very much.`,
      awards: [{ pole: 'gives_freely_keeps_score:negative', points: 3 }],
      rationale: `Explicitly tallies past favors to leverage against the current no. Direct, strong evidence of transactional score-keeping.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: `I help if they need me. They already know. I don’t need to rub their face in it.`,
      awards: [
        { pole: 'repair_punishing:positive', points: 2 },
        { pole: 'forgiving_receipts:positive', points: 1 },
      ],
      rationale: `Chooses to help rather than use the moment to retaliate or gloat, prioritizing repair over punishment. Also lets the error go rather than dwelling on it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I help, but first I need one tiny moment to say, “Now... what did I tell you?” 😂`,
      awards: [{ pole: 'perspective_taking_self_referencing:negative', points: 1 }],
      rationale: `Still helps, but briefly centers their own vindication before attending to the other person's situation. Modest evidence since the help still comes through.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I’m honestly annoyed. If you ignored everything I said, why am I now being recruited to clean it up?`,
      awards: [{ pole: 'duty_first_self_preserving:negative', points: 1 }],
      rationale: `Questions whether they should have to clean up a mess someone else caused by ignoring advice, prioritizing fairness to themselves over automatic duty. Modest since the text does not state a refusal to help.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I am way too pleased that I was right. I may try to hide it. I may fail.`,
      awards: [{ pole: 'perspective_taking_self_referencing:negative', points: 2 }],
      rationale: `Response centers their own satisfaction at being right rather than the other person's situation. Clear self-referencing focus.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `Depends how bad the situation is. If this is serious, we handle it first. The lecture can wait.`,
      awards: [{ pole: 'duty_first_self_preserving:positive', points: 2 }],
      rationale: `Explicitly puts handling the real need ahead of the satisfaction of being right. A clear duty-first ordering of priorities.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: `I bring it up directly. “I know it may seem small to you, but it’s bothering me.”`,
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'vulnerable_armored:positive', points: 2 },
      ],
      rationale: `States the issue plainly and also openly admits it's bothering them, which is both direct communication and emotional openness rather than hiding the feeling.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I do not bring it up immediately. First I need to know who this person is, how long they’ve followed each other, and whether I should already know this name. 👀`,
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: `Delays any confrontation to first gather facts about the situation. Clear fact-finding-before-acting behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I start moving different. Less affectionate. Less available. If you’re paying attention, you’ll notice.`,
      awards: [
        { pole: 'repair_punishing:negative', points: 3 },
        { pole: 'direct_indirect:negative', points: 2 },
      ],
      rationale: `Explicitly withdraws affection and availability as a signal rather than naming the issue, a clear and strong example of indirect punishment.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Oh, I can like pictures too. We can all be supportive on Instagram. 😂`,
      awards: [
        { pole: 'repair_punishing:negative', points: 2 },
        { pole: 'gives_freely_keeps_score:negative', points: 2 },
      ],
      rationale: `Responds with a retaliatory, matching action instead of addressing the issue directly, which is both a punishing move and a reciprocity-based "two can play that game" behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I tell them to stop. I’m not interested in pretending I’m okay with something just because somebody else would be.`,
      awards: [
        { pole: 'boundary_holding_approval_seeking:positive', points: 3 },
        { pole: 'direct_indirect:positive', points: 1 },
      ],
      rationale: `States a clear limit on someone else's behavior and explicitly refuses to perform okay-ness to fit someone else's standard. Strong, explicit boundary-setting, delivered plainly.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: `I say it. “Okay. You’re right about that part.”\n\nPainful. Horrible. Character-building.`,
      awards: [{ pole: 'accountability_defensiveness:positive', points: 3 }],
      rationale: `Says out loud, mid-argument, that the other person is right. Strong, explicit admission despite describing it as painful.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I stop fighting that specific point, but I am absolutely not helping them turn one win into “therefore I was right about everything.”`,
      awards: [{ pole: 'accountability_defensiveness:positive', points: 2 }],
      rationale: `Concedes the specific point being argued, which is genuine ownership, though it's hedged by guarding against overgeneralization.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I start explaining WHY I did it because context still matters even if I was wrong.`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 2 }],
      rationale: `Leads with justifying the behavior rather than owning it outright. The admission is a subordinate clause to the explanation, so the dominant move is defensive context-giving.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `If they’re being smug about it, my ability to admit anything drops dramatically. 😂`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 2 }],
      rationale: `Admits their own willingness to own up is conditional on the other person's tone, a classic ego-protective defensive pattern.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I probably keep arguing a little longer, then come back later after my pride finishes dying.`,
      awards: [
        { pole: 'reflective_reactive:positive', points: 2 },
        { pole: 'accountability_defensiveness:positive', points: 1 },
      ],
      rationale: `Takes time away before returning to the conversation, which is a reflective pause. The return itself implies an eventual admission, though it isn't stated outright, so the accountability evidence is modest.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: `“No. I’m mad about what happened earlier. Can we talk?”`,
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'vulnerable_armored:positive', points: 1 },
      ],
      rationale: `Names the feeling and the cause plainly and invites a conversation. Also a modest open admission of being affected rather than hiding it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `“I’m fine.”\n\nYou are visibly not fine.\n\nNobody believes you.\n\n😂`,
      awards: [
        { pole: 'direct_indirect:negative', points: 2 },
        { pole: 'vulnerable_armored:negative', points: 2 },
      ],
      rationale: `Denies the true feeling despite it being visibly obvious to others, which is both indirect communication and emotional armoring.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `“I don’t want to talk yet. Give me a little time.”\n\nAnd I actually plan to come back to it.`,
      awards: [
        { pole: 'reflective_reactive:positive', points: 3 },
        { pole: 'boundary_holding_approval_seeking:positive', points: 1 },
      ],
      rationale: `Explicitly asks for space to process before responding, with a genuine intent to return to the conversation rather than avoid it. Clear pause-before-responding behavior, with a modest boundary in asking for the time itself.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I tell them exactly why I’m mad immediately, and depending on how mad I am, the delivery may be... energetic.`,
      awards: [
        { pole: 'reflective_reactive:negative', points: 2 },
        { pole: 'tactful_blunt:negative', points: 2 },
      ],
      rationale: `Responds immediately with no stated pause, and explicitly flags that the delivery itself can escalate rather than stay measured.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `Honestly? Sometimes I want them to figure it out. They were THERE.`,
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: `Prefers the other person to infer the problem rather than stating it, a clear instance of withholding direct communication.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: `“Do I?” I may hate hearing it, but if I trust them, I’m thinking about it.`,
      awards: [
        { pole: 'reflective_reactive:positive', points: 2 },
        { pole: 'accountability_defensiveness:positive', points: 1 },
      ],
      rationale: `Takes the criticism in and genuinely considers it rather than rejecting it outright, which is reflective and modestly non-defensive.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `“No. I just get tired of everything becoming harder because nobody listens until it goes wrong.”`,
      awards: [
        { pole: 'accountability_defensiveness:negative', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: `Flatly denies the characterization and reframes it as other people's failure to listen, which is denial rather than ownership, and reveals a control-oriented justification for the pattern.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `“Okay. Give me actual examples.”`,
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'accountability_defensiveness:positive', points: 1 },
      ],
      rationale: `Engages with the criticism rather than dismissing it, but wants concrete evidence first, which is a verify-before-accepting stance.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `“Funny how nobody complains about my way when my way works.” 😂`,
      awards: [
        { pole: 'accountability_defensiveness:negative', points: 2 },
        { pole: 'control_allowing:positive', points: 1 },
      ],
      rationale: `Deflects the complaint by pointing to outcomes instead of engaging with it, and implicitly justifies imposing their way because it "works."`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I start listing every time I compromised because apparently the historical record needs correcting.`,
      awards: [
        { pole: 'gives_freely_keeps_score:negative', points: 3 },
        { pole: 'accountability_defensiveness:negative', points: 2 },
      ],
      rationale: `Responds to criticism by producing a tally of past compromises, which is explicit score-keeping, and sidesteps the actual complaint in the process.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: `“Yep. That’s hypocritical. You got me.”\n\nI hate this conversation.\n\n😂`,
      awards: [{ pole: 'accountability_defensiveness:positive', points: 3 }],
      rationale: `Immediately and plainly admits the hypocrisy with no deflection, despite clearly disliking the moment. Strong, explicit accountability.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `Okay, yes, but the situations really are different, and I am going to explain exactly how.`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 2 }],
      rationale: `Pivots immediately from a nominal yes into justifying why it's different, using context as an escape from fully owning the behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I admit it, but if they start acting like this erases everything THEY did, now we have another problem.`,
      awards: [
        { pole: 'accountability_defensiveness:positive', points: 2 },
        { pole: 'boundary_holding_approval_seeking:positive', points: 1 },
      ],
      rationale: `Explicitly admits the hypocrisy, which is genuine ownership, while also setting a limit on how that admission can be weaponized against them.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I get defensive first. Later, after the irritation wears off, I usually know whether they were right.`,
      awards: [
        { pole: 'reflective_reactive:positive', points: 2 },
        { pole: 'accountability_defensiveness:positive', points: 1 },
      ],
      rationale: `Describes an initial defensive reaction giving way to genuine reconsideration once the irritation passes. The eventual reflective process is the clearer, more durable signal than the brief initial flare.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I make a joke because being publicly caught in my own hypocrisy is apparently my personal hell.`,
      awards: [{ pole: 'vulnerable_armored:negative', points: 1 }],
      rationale: `Uses humor to deflect the discomfort of being caught rather than addressing it directly. Modest evidence of using a classic defense (humor) instead of sitting with the exposure. Genuinely ambiguous: this could also just be a coping style with no durable personality evidence, and the joke-deflection reading of this specific choice should be reviewed.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: `“You do not have to manage everything.”`,
      awards: [{ pole: 'control_allowing:positive', points: 2 }],
      rationale: `Choosing this as something a loved one has wanted to say is a self-admission of over-managing, which is control-pole behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `“If you’re mad, just SAY you’re mad.”`,
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: `Self-admission that loved ones have had to push them to communicate anger directly, implying a pattern of indirect expression.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `“Being right did not require all of that.”\n\n😂`,
      awards: [{ pole: 'tactful_blunt:negative', points: 2 }],
      rationale: `Self-admission that proving a point has come with excess delivery, which points to bluntness rather than tact. "All of that" is vague, hence some contextual uncertainty.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `“Stop telling me what I did every time I’m trying to talk about what YOU did.”`,
      awards: [{ pole: 'accountability_defensiveness:negative', points: 2 }],
      rationale: `Self-admission of redirecting accountability conversations back onto the other person, a clear defensive pattern.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `“Not every disagreement needs a winner.”`,
      awards: [{ pole: 'competitive_cooperative:positive', points: 2 }],
      rationale: `Self-admission of treating disagreements as something to win, which is competitive rather than cooperative conflict behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
