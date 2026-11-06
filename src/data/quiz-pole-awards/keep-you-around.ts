import type { QuizPoleAwardMap } from './types';

// V2 answer-level calibration for the "So why do people keep you around?" quiz
// (src/data/quizzes/keep-you-around.ts, id 'keep-you-around'). access: 'private-preview' --
// free to play, lives in the Private room, and (per product policy for the two
// private-preview quizzes) is allowed to award BOTH Core and Private poles when the wording
// genuinely supports it, unlike the plain free Explore quizzes. This quiz had no prior
// answer-level traitSignals, so every entry below is status: 'new'. Does not touch the quiz
// content file or its result-level profileSignals -- those are a separate reconciliation
// concern.
export const KEEP_YOU_AROUND_POLE_AWARDS: QuizPoleAwardMap = {
  q1: {
    a: {
      wording: `I tell them exactly what I don't like about this person. Once. After that, they're grown.`,
      awards: [
        { pole: 'supportive_challenging:negative', points: 2 },
        { pole: 'protective_hands_off:negative', points: 2 },
      ],
      rationale: `Gives the honest, uncomfortable feedback once, then explicitly backs off and lets the friend make their own call. Both the critical honesty and the deliberate hands-off follow-through are clearly supported.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `If it blows up, they can call me without hearing "I told you so." I’ll save that thought for my own head. 😂`,
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: `Commits to being available without judgment even if proven right later, which is supportive, non-conditional care.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Their relationship does not get every weekend now. I'm still making plans, inviting my friend out, and keeping our friendship fun.`,
      awards: [{ pole: 'initiating_responsive:positive', points: 2 }],
      rationale: `Actively keeps making and proposing plans rather than waiting to be included, a clear initiating pattern.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I have already clocked three things about this person my friend hasn't noticed yet. I'm not saying all of it unless asked.`,
      awards: [
        { pole: 'social_attunement:positive', points: 2 },
        { pole: 'private_open:positive', points: 1 },
      ],
      rationale: `Notices details about the situation others have missed, which is attunement to the vibe, and chooses to hold most of it rather than volunteer it. Genuinely ambiguous whether the withholding here is closer to tact/restraint or to a private disposition; flagged for review.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `If my friend is happy, I'm still hyping THEM. Their relationship does not get to swallow their whole identity.`,
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: `Actively keeps encouraging and celebrating the friend as an individual, clear supportive behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q2: {
    a: {
      wording: `I congratulate them and let myself be jealous later. Their win is not something they did to me.`,
      awards: [
        { pole: 'perspective_taking_self_referencing:positive', points: 2 },
        { pole: 'reflective_reactive:positive', points: 1 },
      ],
      rationale: `Explicitly reframes the friend's win as not being about them, which is perspective-taking, and deliberately sequences their own reaction for later rather than acting on it immediately.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `Oh, we’re celebrating. My jealousy can sit in the car. 😂`,
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: `Chooses to celebrate the friend despite their own sting of jealousy, clear supportive behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I need details. How did it happen? What did they do differently? What can I learn?`,
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: `Responds to the sting with genuine curiosity and a desire to learn from it rather than react emotionally.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I'm making their win feel HUGE. I know what it took for them to get there.`,
      awards: [
        { pole: 'supportive_challenging:positive', points: 2 },
        { pole: 'perspective_taking_self_referencing:positive', points: 1 },
      ],
      rationale: `Amplifies the friend's win, which is strong supportive hype, and explicitly recognizes what the friend's own journey took to get there.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I’m probably going to admit it: "I’m happy for you and a little sick for me." 😂 Then I’m still showing up.`,
      awards: [
        { pole: 'vulnerable_armored:positive', points: 2 },
        { pole: 'duty_first_self_preserving:positive', points: 1 },
      ],
      rationale: `Openly admits the mixed, uncomfortable feeling rather than hiding it, which is vulnerability, and still shows up for the friend despite that discomfort.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q3: {
    a: {
      wording: `The hotter one. If we're being petty, let's at least be excellent at it.`,
      awards: [{ pole: 'playful_serious:positive', points: 1 }],
      rationale: `Leans into the lighthearted pettiness of the moment rather than steering away from it. Modest evidence given how low-stakes and joke-framed the choice is.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `Neither. If the whole point is making your ex react, they already have way too much power.`,
      awards: [
        { pole: 'supportive_challenging:negative', points: 2 },
        { pole: 'perspective_taking_self_referencing:positive', points: 1 },
      ],
      rationale: `Pushes back on the friend's actual motive instead of just complying, which is uncomfortable but useful feedback, and reframes the situation around what's actually healthy for the friend.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Wait. Their ex hard-launched WHO? Send me the post.`,
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: `Immediately chases the detail out of genuine curiosity about what happened.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Whichever one makes YOU feel hottest. If the ex sees it, cute. They're not the audience.`,
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: `Redirects the friend's choice away from the ex and toward the friend's own confidence, a clear supportive reframe.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `Pick one if you want, post it, then give me the phone. We are not refreshing views all night.`,
      awards: [{ pole: 'boundary_holding_approval_seeking:positive', points: 2 }],
      rationale: `Sets a firm, practical limit on the obsessive refreshing rather than indulging it indefinitely.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q4: {
    a: {
      wording: `I need to see exactly what was sent and whether they opened it. Details matter.`,
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: `Wants the exact facts of what happened before reacting or advising, a clear verify-first instinct.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I am completely useless for the first 30 seconds because I'm laughing too hard.`,
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: `Leads with laughter at the mishap rather than treating it with gravity, clear playful response.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `If the screenshot was cruel, I'm saying that. The problem isn't only that they got caught.`,
      awards: [{ pole: 'supportive_challenging:negative', points: 3 }],
      rationale: `Explicitly delivers an uncomfortable truth to the friend regardless of how the friend wants to feel about the situation. Strong, direct evidence of giving necessary pushback.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Okay. What fixes this fastest? Call? Apology? Own it? Let's handle the damage.`,
      awards: [
        { pole: 'practical_idealistic:positive', points: 2 },
        { pole: 'duty_first_self_preserving:positive', points: 1 },
      ],
      rationale: `Goes straight to concrete, practical fixes rather than dwelling on the mishap, and steps into helping with the cleanup.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `They did something dumb. They did not commit a federal crime. Own it, fix what you can, and please stop planning your move to another state. 😂`,
      awards: [
        { pole: 'supportive_challenging:positive', points: 2 },
        { pole: 'practical_idealistic:positive', points: 1 },
      ],
      rationale: `Talks the friend down from catastrophizing while still pointing them toward fixing what's fixable, which is reassuring and grounded at once.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q5: {
    a: {
      wording: `If that's my person, then I guess we're both iced out. I'm not leaving them standing there alone.`,
      awards: [{ pole: 'duty_first_self_preserving:positive', points: 3 }],
      rationale: `Explicitly accepts a social cost to stand by the friend rather than protecting their own standing in the room. Strong, explicit duty-first behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I’m saying something. "Are we going to talk about the problem or keep doing this weird middle-school silent treatment all night?"`,
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: `Names the unspoken conflict out loud in the room rather than letting it simmer, which is both direct and willing to surface conflict rather than avoid it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I already know why this is happening. This beef started before tonight.`,
      awards: [{ pole: 'social_attunement:positive', points: 2 }],
      rationale: `Has already tracked the social history and context behind the moment, clear vibe-reading behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Oh, we’re about to have the BEST time in the room. Dancing. Pictures. People around us. If they wanted my friend to look bothered, unfortunate. 😂`,
      awards: [{ pole: 'protective_hands_off:positive', points: 2 }],
      rationale: `Actively shields the friend from the social slight by changing the moment around them rather than leaving them exposed to it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I’m in my friend’s ear like, "Head up. Do NOT start shrinking because they’re acting weird." Then we’re walking right back in.`,
      awards: [{ pole: 'supportive_challenging:positive', points: 3 }],
      rationale: `Directly encourages and reassures the friend in the moment and physically backs it up by walking back in with them. Strong, explicit supportive behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q6: {
    a: {
      wording: `If they're really going, I'm helping them make an actual plan. Job, money, housing, and a way home if this thing crashes and burns.`,
      awards: [
        { pole: 'protective_hands_off:negative', points: 2 },
        { pole: 'practical_idealistic:positive', points: 2 },
      ],
      rationale: `Supports the friend's decision without trying to talk them out of it, while focusing on concrete logistics rather than abstract concerns.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `Do it. Seriously. Worst case, you come home with character development and an insane story. 😂`,
      awards: [{ pole: 'adventure_comfort:positive', points: 2 }],
      rationale: `Encourages the friend to take the big, uncertain leap rather than play it safe.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Give me their full name and the city. I just want to look at a few things. 👀`,
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'protective_hands_off:positive', points: 1 },
      ],
      rationale: `Wants to verify who this person is before trusting the situation, and the impulse to check up on them comes from a protective instinct toward the friend.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Four months?! Be serious. You are changing ZIP codes for somebody you haven’t even seen through all four seasons.`,
      awards: [{ pole: 'supportive_challenging:negative', points: 3 }],
      rationale: `Directly pushes back on the plan with an uncomfortable but genuinely useful reality check. Strong, explicit challenging feedback.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I’m asking one thing: "If that person disappeared tomorrow, would you still want that life?" If yes, I’m all for it!`,
      awards: [
        { pole: 'perspective_taking_self_referencing:positive', points: 2 },
        { pole: 'protective_hands_off:negative', points: 1 },
      ],
      rationale: `Helps the friend separate their own desires from the relationship itself, and ultimately defers to whatever the friend's own answer turns out to be.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q7: {
    a: {
      wording: `We're talking about it. I cannot walk around doing fake-normal while everybody knows something is wrong.`,
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'conflict_peacekeeping:positive', points: 2 },
      ],
      rationale: `Insists on addressing the issue directly and immediately rather than pretending things are fine, which is both plain communication and a willingness to engage conflict head-on.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `I leave it alone until I cool down. Angry-me has excellent vocabulary and terrible judgment.`,
      awards: [{ pole: 'reflective_reactive:positive', points: 3 }],
      rationale: `Explicitly delays responding until able to think clearly, naming the risk of reacting in anger. Strong, explicit pause-before-responding behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I'm mad as hell, but if they call me with a real emergency tonight, I'm still answering. Unfortunately, that's my person.`,
      awards: [{ pole: 'duty_first_self_preserving:positive', points: 3 }],
      rationale: `Explicitly shows up for someone despite active anger at them. Strong, explicit duty-first behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `I'm calling the ONE person who already knows the entire backstory and presenting my case.`,
      awards: [{ pole: 'direct_indirect:negative', points: 2 }],
      rationale: `Routes the anger through a third party rather than addressing the person they're actually upset with, an indirect move.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `Sometimes I get quiet on purpose. Part of me wants them to feel the distance before I explain it.`,
      awards: [
        { pole: 'repair_punishing:negative', points: 3 },
        { pole: 'direct_indirect:negative', points: 2 },
      ],
      rationale: `Explicitly uses deliberate silence to make the other person feel the consequence before any explanation is given. Strong, explicit punishing-through-withdrawal behavior.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q8: {
    a: {
      wording: `I need more context now. What else don't I know?`,
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: `Wants to confirm the fuller picture before settling on how they feel about it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `If this changes my opinion of what they did, I'm telling them. I'm not giving them the reaction they came hoping to get.`,
      awards: [
        { pole: 'direct_indirect:positive', points: 2 },
        { pole: 'supportive_challenging:negative', points: 2 },
      ],
      rationale: `Commits to stating their honest, changed reaction rather than the comforting one the friend wants, which is both direct and willing to give uncomfortable feedback.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Whatever I think about it, it stays with me. They told me, not the group chat.`,
      awards: [{ pole: 'private_open:positive', points: 3 }],
      rationale: `Explicitly keeps the secret to themselves rather than sharing it further. Strong, explicit discretion.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `There is a very high chance I make one wildly inappropriate joke because this conversation desperately needs oxygen.`,
      awards: [{ pole: 'playful_serious:positive', points: 2 }],
      rationale: `Defaults to humor to cut the tension of a heavy moment rather than staying fully solemn.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I may look at them differently for a minute, but I'm not letting them turn one confession into "I'm a terrible person forever." Own it. Fix what you can. Keep moving.`,
      awards: [
        { pole: 'forgiving_receipts:positive', points: 3 },
        { pole: 'supportive_challenging:positive', points: 1 },
      ],
      rationale: `Explicitly refuses to let one revealed mistake become a permanent indictment, choosing to move forward rather than hold onto it. Strong, explicit forgiving behavior, with a modest reassuring note alongside it.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q9: {
    a: {
      wording: `If somebody actually needs me, I'm coming. If this is FOMO bait, goodnight.`,
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: `Withholds action until the real need is confirmed rather than taking the message at face value.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `Where are we going? I can be dressed in 12 minutes.`,
      awards: [
        { pole: 'planner_spontaneous:negative', points: 2 },
        { pole: 'adventure_comfort:positive', points: 2 },
      ],
      rationale: `Drops a settled evening at home to go out on short notice with no plan in place, which is both spontaneous and oriented toward the unplanned over the comfortable.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `Who said "we need you" and WHY? That wording is suspicious.`,
      awards: [{ pole: 'trust_verify:negative', points: 2 }],
      rationale: `Treats the message's wording as something to interrogate before trusting it at face value.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `If "we need you" means somebody wants me to pick a side before I know what happened, absolutely not. Give me the story first.`,
      awards: [
        { pole: 'trust_verify:negative', points: 2 },
        { pole: 'boundary_holding_approval_seeking:positive', points: 1 },
      ],
      rationale: `Refuses to commit to a side without the full story first, which is a verify-before-acting stance, and also sets a limit on being pulled into a conflict blind.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `Fine. But if I'm coming, we are not sitting around miserable. I'm turning this night around.`,
      awards: [{ pole: 'initiating_responsive:positive', points: 2 }],
      rationale: `Takes charge of shaping the night's direction rather than passively going along with whatever happens once there.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
  q10: {
    a: {
      wording: `You are not everybody’s emergency contact.`,
      awards: [{ pole: 'duty_first_self_preserving:positive', points: 2 }],
      rationale: `Choosing this as something a loved one has said is a self-admission of over-extending duty to others, consistent with a strong duty-first pattern.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    b: {
      wording: `This was supposed to be ONE drink.`,
      awards: [{ pole: 'planner_spontaneous:negative', points: 2 }],
      rationale: `Self-admission of a pattern of plans escalating well past the original, modest intention, consistent with spontaneity overriding the original plan.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    c: {
      wording: `I didn’t ask if it was true. I asked you not to SAY it.`,
      awards: [{ pole: 'supportive_challenging:negative', points: 2 }],
      rationale: `Self-admission of a pattern of saying hard truths that others wished had stayed unsaid, consistent with a challenging rather than purely comforting style.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    d: {
      wording: `Why do you have screenshots from February?`,
      awards: [{ pole: 'curious_decisive:positive', points: 2 }],
      rationale: `Self-admission of habitually holding onto detailed information out of sustained curiosity about what's going on with people.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
    e: {
      wording: `I just wanted to complain. I did not ask for a motivational speech.`,
      awards: [{ pole: 'supportive_challenging:positive', points: 2 }],
      rationale: `Self-admission of a habitual pattern of giving encouragement and pep talks, even when unsolicited, consistent with a strong supportive default.`,
      status: 'new',
      scoringVersion: 'v2.0',
    },
  },
};
