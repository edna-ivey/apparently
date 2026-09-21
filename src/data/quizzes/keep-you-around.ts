import type { ArchetypeQuizDefinition } from './types';

// Apparently Private's active OPEN preview quiz — approved content, transcribed exactly as
// given (see the engineering sprint report for the approval reference). Do not rewrite,
// polish, shorten, or substitute any question/choice/Read text here; do not invent additional
// Private content beyond what's specified.
//
// This is a MATERIAL creative replacement for the previous preview (secretly-love), but is
// registered under its own stable id rather than overwriting secretly-love's definition —
// secretly-love stays fully registered/unchanged so historical completions, "See result",
// and old shared-result links keep resolving exactly as before. Only src/app/private.tsx's
// active preview pointer moves to this quiz; nothing about secretly-love's own file changes.
//
// contributesToProfile: true — Michelle and Forge approved this quiz's five results' mapping
// to canonical You-profile dimensions (result-level only, max 3 signals each, see each
// archetype's own profileSignals below). Only a FIRST completion of this quiz writes
// personality_evidence (see submit_quiz_result's is_first_profile_completion logic) — retakes
// never re-add or stack additional evidence for the same quiz.
//
// highSignalQuestionIds / enableCloseSecond: this quiz's own approved tie-break and "close
// second" rules (see scoring.ts's pickPrimaryArchetypeByHighSignal/pickCloseSecond) — opt-in,
// so every other registered archetype quiz keeps its existing generic behavior untouched.
export const KEEP_YOU_AROUND_QUIZ: ArchetypeQuizDefinition = {
  id: 'keep-you-around',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private-preview',
  contributesToProfile: true,
  title: 'So why do people keep you around?',
  eyebrow: 'APPARENTLY PRIVATE · FREE PREVIEW',
  introSupport: [
    "People don't only love you for your best behavior.",
    'Sometimes the thing they love most about you is attached to the exact thing that drives them insane.',
    "Let's see what they're putting up with. 😂",
  ],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR GOOD STUFF MIX',
  recentReadMetricLabel: 'of what people put up with',
  highSignalQuestionIds: ['q1', 'q3', 'q5', 'q6', 'q8'],
  enableCloseSecond: true,
  archetypes: [
    {
      id: 'emergency-contact',
      title: 'THE EMERGENCY CONTACT',
      structuredRead: {
        theRead: [
          'When life gets real, people call you.',
          "Not because you always know exactly what to say. Because you show up.",
          "You remember the appointment. You figure out the ride. You bring what everyone forgot. You answer the phone even when you're still mad. When somebody says, \"I don't know what to do,\" you're already figuring out what can actually be done.",
          "People feel safer when you're around because your care usually comes with action.",
        ],
        theCallOut: [
          "Here's where that gets tricky.",
          'You can make yourself so useful that eventually everybody assumes you’ll handle it.',
          'Then you get irritated that everybody assumes you’ll handle it. 👀',
          "And sometimes you step in before anybody even asks because watching people struggle is harder for you than letting them figure it out themselves.",
          "That's loving.",
          'Sometimes it’s also control wearing a helpful little outfit.',
        ],
        theCost: [
          "If you're always the capable one, other people can become passive while you become exhausted.",
          'Then you get even more proof for:',
          '"See? If I don’t do it, nobody will."',
          'Meanwhile, everybody learned you were probably going to take over anyway.',
        ],
        tryThis: [
          'Before jumping in, ask:',
          '"Do you want help, advice, or do you just need me here?"',
          'Then actually let their answer decide what you do next.',
          "Apparently, you're the person people put down on the form.",
          'That is a bigger compliment than it sounds.',
        ],
      },
      // Approved result-level You-profile mapping (Michelle/Forge, see engineering sprint
      // report) -- max 3, result-level only, never per-answer. Sign convention: positive pole
      // of each dimension gets the positive value.
      profileSignals: [
        { dimension: 'duty_first_self_preserving', value: 2 },
        { dimension: 'protective_hands_off', value: 1 },
        { dimension: 'practical_idealistic', value: 1 },
      ],
    },
    {
      id: 'reason-theres-a-story',
      title: "THE REASON THERE'S A STORY",
      structuredRead: {
        theRead: [
          'There are people who make life comfortable.',
          'And then there are people who make everybody say:',
          '"Do you remember that night when..."',
          "That's you. 😂",
          'You give regular life a little plot.',
          'One drink becomes somewhere after. A boring event gets good. A friend who was about to stay home somehow ends up dressed and outside. You make people loosen up, laugh harder, stop overthinking for five minutes, and actually have something to talk about later.',
          "People don't just invite you because they like you.",
          'Sometimes they invite you because they know something might happen.',
        ],
        theCallOut: [
          'And sometimes something happens because you made absolutely sure it would. 😂',
          'You can treat boredom like an emergency.',
          'You may stir the pot, encourage the questionable idea, turn petty into performance art, or keep a night going three decisions past where sensible people would have stopped.',
          'And if everyone else is being dramatic?',
          'You are not always the person de-escalating.',
          'Sometimes you’re getting better lighting.',
        ],
        theCost: [
          'Fun can become avoidance when every uncomfortable feeling gets converted into another plan, another joke, another distraction, another night out.',
          'And your people may occasionally go along with your energy even when they’re actually ready to stop.',
        ],
        tryThis: [
          'Every now and then, ask:',
          '"Are we having fun... or am I refusing to let this moment be boring, awkward, or sad?"',
          'If everybody is genuinely having fun?',
          'Carry on, menace. 😂',
          'Apparently, you’re a core memory with questionable influence.',
        ],
      },
      profileSignals: [
        { dimension: 'adventure_comfort', value: 2 },
        { dimension: 'planner_spontaneous', value: -1 },
        { dimension: 'playful_serious', value: 1 },
      ],
    },
    {
      id: 'human-bullshit-detector',
      title: 'THE HUMAN BULLSHIT DETECTOR',
      structuredRead: {
        theRead: [
          'People do not come to you for:',
          '"Whatever makes you happy!"',
          'They come to you when they actually want to know.',
          'You notice the excuse hiding inside the explanation.',
          'You can hear when somebody’s story and behavior are not matching.',
          'You can love someone deeply and still say:',
          '"No. You were wrong."',
          "And because your praise isn't automatic, people believe you when you give it.",
          'Your approval means something because everybody knows you were perfectly willing to disapprove. 😂',
        ],
        theCallOut: [
          "But let's retire one myth:",
          '"I’m just honest" is not a lifetime exemption from being an asshole.',
          'Sometimes brutal honesty is honesty.',
          'Sometimes it is brutality with excellent PR.',
          'If part of you enjoys being the person who sees through everyone, wins the argument, delivers the devastating line, or gets to say "I told you so," that is not all integrity.',
          'Some of that is ego.',
        ],
        theCost: [
          'If every half-formed thought gets cross-examined, people eventually stop bringing you the messy version.',
          'They wait until the story is polished enough to survive you.',
          'Then the person who values truth most starts getting less of it.',
        ],
        tryThis: [
          'Before saying the hard thing, ask:',
          'Is it true?',
          'Is it useful?',
          'Is this the moment?',
          'Three yeses?',
          'Proceed. 😂',
          'Apparently, when you say, "Do you want me to be honest?" everybody braces a little.',
        ],
      },
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'social_attunement', value: 1 },
        { dimension: 'supportive_challenging', value: -1 },
      ],
    },
    {
      id: 'hype-department',
      title: 'THE HYPE DEPARTMENT',
      structuredRead: {
        theRead: [
          'You have an irritating habit of seeing people bigger than they currently see themselves.',
          '😂',
          'You notice the talent they keep minimizing.',
          "The thing they're scared to try.",
          "The win they're pretending wasn't a big deal.",
          'And you refuse to let your people shrink in peace.',
          'You celebrate loudly. You remind people who they are. You make them feel hotter, smarter, braver, more capable, and occasionally much more qualified than they felt five minutes before talking to you.',
          'People leave you standing a little taller.',
          'That is real.',
        ],
        theCallOut: [
          'But sometimes someone says:',
          '"I’m tired."',
          'And you hear:',
          '"Please remind me of my potential."',
          '😂',
          'Not every low moment needs a comeback story.',
          "Sometimes encouragement turns into pressure because you are more attached to what somebody could be doing than they are.",
        ],
        theCost: [
          "People may start hiding doubt from you because they don't want another motivational speech.",
          "Or worse, because they feel like being uncertain is disappointing the version of them that you believe in.",
          'And sometimes:',
          '"You can do this"',
          'skips right over:',
          '"Do you even want this?"',
        ],
        tryThis: [
          'Ask:',
          '"Do you want me to hype you, help you think it through, or just let you complain?"',
          'Then give them the one they actually asked for.',
          "Apparently, you're emotional pre-workout.",
          'Extremely effective. Not appropriate before bedtime.',
          '😂',
        ],
      },
      // Approved with exactly ONE signal -- do not add filler signals to reach 3.
      profileSignals: [{ dimension: 'supportive_challenging', value: 2 }],
    },
    {
      id: 'one-who-knows-too-much',
      title: 'THE ONE WHO KNOWS TOO MUCH',
      structuredRead: {
        theRead: [
          "You don't gossip.",
          'You maintain an aggressively detailed social database.',
          '😂',
          'You notice things.',
          'A weird pause. A changed tone. Somebody suddenly not sitting next to somebody. The friend who said "I’m fine" in an entirely different font than usual.',
          'You remember what people tell you.',
          'You connect dots.',
          'You notice patterns before anybody officially announces there is a pattern.',
          'And honestly, that makes you incredibly good at reading rooms and reading people.',
          'Your people feel seen because you often notice what they were hoping somebody would notice.',
        ],
        theCallOut: [
          'And yes.',
          'Sometimes you are nosy.',
          "We're not dressing that up. 😂",
          'There is a difference between being perceptive and conducting an investigation nobody commissioned.',
          "If somebody didn't give you the story, you are not automatically entitled to reconstruct it from screenshots, mutual friends, old posts, and a suspicious Venmo transaction.",
        ],
        theCost: [
          'Knowing everybody’s business comes with a hidden job description.',
          'Now you’re the bone collector.',
          'The context provider.',
          'The person both sides call.',
          'The keeper of screenshots from February.',
          'Eventually you can find yourself emotionally employed by situations that have absolutely nothing to do with you.',
          'And if people start believing everything said near you gets permanently indexed, they may stop telling you things.',
        ],
        tryThis: [
          'Before following the thread, ask:',
          'Is this mine to know?',
          'Is this mine to repeat?',
          'Is this mine to fix?',
          'Three noes?',
          'Close the tab, Detective.',
          '😂',
          'Apparently, you noticed the vibe change before the vibe knew it changed.',
        ],
      },
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'curious_decisive', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your friend is dating somebody you cannot stand. What are you actually doing?',
      choices: [
        {
          id: 'a',
          label: "I tell them exactly what I don't like about this person. Once. After that, they're grown.",
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'b',
          label: 'If it blows up, they can call me without hearing "I told you so." I’ll save that thought for my own head. 😂',
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'c',
          label: "Their relationship does not get every weekend now. I'm still making plans, inviting my friend out, and keeping our friendship fun.",
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'd',
          label: "I have already clocked three things about this person my friend hasn't noticed yet. I'm not saying all of it unless asked.",
          resultWeights: { 'one-who-knows-too-much': 2, 'human-bullshit-detector': 1 },
        },
        {
          id: 'e',
          label: "If my friend is happy, I'm still hyping THEM. Their relationship does not get to swallow their whole identity.",
          resultWeights: { 'hype-department': 2, 'emergency-contact': 1 },
        },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend gets something you really wanted too. Be honest, it stings.',
      choices: [
        {
          id: 'a',
          label: 'I congratulate them and let myself be jealous later. Their win is not something they did to me.',
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'b',
          label: 'Oh, we’re celebrating. My jealousy can sit in the car. 😂',
          resultWeights: { 'reason-theres-a-story': 2, 'hype-department': 1 },
        },
        {
          id: 'c',
          label: 'I need details. How did it happen? What did they do differently? What can I learn?',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'd',
          label: "I'm making their win feel HUGE. I know what it took for them to get there.",
          resultWeights: { 'hype-department': 2, 'reason-theres-a-story': 1 },
        },
        {
          id: 'e',
          label: 'I’m probably going to admit it: "I’m happy for you and a little sick for me." 😂 Then I’m still showing up.',
          resultWeights: { 'human-bullshit-detector': 2, 'emergency-contact': 1 },
        },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your friend sends you two thirst traps and says, "Which one should I post? My ex just hard-launched somebody."',
      choices: [
        {
          id: 'a',
          label: "The hotter one. If we're being petty, let's at least be excellent at it.",
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'b',
          label: "Neither. If the whole point is making your ex react, they already have way too much power.",
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'c',
          label: 'Wait. Their ex hard-launched WHO? Send me the post.',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'd',
          label: "Whichever one makes YOU feel hottest. If the ex sees it, cute. They're not the audience.",
          resultWeights: { 'hype-department': 2 },
        },
        {
          id: 'e',
          label: 'Pick one if you want, post it, then give me the phone. We are not refreshing views all night.',
          resultWeights: { 'emergency-contact': 2, 'human-bullshit-detector': 1 },
        },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your friend accidentally sends a screenshot ABOUT somebody TO the exact person it was about.',
      choices: [
        {
          id: 'a',
          label: 'I need to see exactly what was sent and whether they opened it. Details matter.',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'b',
          label: "I am completely useless for the first 30 seconds because I'm laughing too hard.",
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'c',
          label: "If the screenshot was cruel, I'm saying that. The problem isn't only that they got caught.",
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'd',
          label: "Okay. What fixes this fastest? Call? Apology? Own it? Let's handle the damage.",
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'e',
          label: "They did something dumb. They did not commit a federal crime. Own it, fix what you can, and please stop planning your move to another state. 😂",
          resultWeights: { 'hype-department': 2, 'human-bullshit-detector': 1 },
        },
      ],
    },
    {
      id: 'q5',
      prompt: 'At a party, one of your closest friends is very obviously being iced out by people you both know.',
      choices: [
        {
          id: 'a',
          label: "If that's my person, then I guess we're both iced out. I'm not leaving them standing there alone.",
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'b',
          label: 'I’m saying something. "Are we going to talk about the problem or keep doing this weird middle-school silent treatment all night?"',
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'c',
          label: 'I already know why this is happening. This beef started before tonight.',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'd',
          label: 'Oh, we’re about to have the BEST time in the room. Dancing. Pictures. People around us. If they wanted my friend to look bothered, unfortunate. 😂',
          resultWeights: { 'reason-theres-a-story': 2, 'hype-department': 1 },
        },
        {
          id: 'e',
          label: 'I’m in my friend’s ear like, "Head up. Do NOT start shrinking because they’re acting weird." Then we’re walking right back in.',
          resultWeights: { 'hype-department': 2, 'emergency-contact': 1 },
        },
      ],
    },
    {
      id: 'q6',
      prompt: "Your friend tells you they're thinking about moving across the country for somebody they've been dating for four months.",
      choices: [
        {
          id: 'a',
          label: "If they're really going, I'm helping them make an actual plan. Job, money, housing, and a way home if this thing crashes and burns.",
          resultWeights: { 'emergency-contact': 2, 'human-bullshit-detector': 1 },
        },
        {
          id: 'b',
          label: 'Do it. Seriously. Worst case, you come home with character development and an insane story. 😂',
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'c',
          label: 'Give me their full name and the city. I just want to look at a few things. 👀',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'd',
          label: 'Four months?! Be serious. You are changing ZIP codes for somebody you haven’t even seen through all four seasons.',
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'e',
          label: 'I’m asking one thing: "If that person disappeared tomorrow, would you still want that life?" If yes, I’m all for it!',
          resultWeights: { 'hype-department': 2, 'human-bullshit-detector': 1 },
        },
      ],
    },
    {
      id: 'q7',
      prompt: "You're furious with somebody you love, and you have a legitimate reason. What do you actually do first?",
      choices: [
        {
          id: 'a',
          label: "We're talking about it. I cannot walk around doing fake-normal while everybody knows something is wrong.",
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'b',
          label: 'I leave it alone until I cool down. Angry-me has excellent vocabulary and terrible judgment.',
          resultWeights: { 'emergency-contact': 1 },
        },
        {
          id: 'c',
          label: "I'm mad as hell, but if they call me with a real emergency tonight, I'm still answering. Unfortunately, that's my person.",
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'd',
          label: "I'm calling the ONE person who already knows the entire backstory and presenting my case.",
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'e',
          label: 'Sometimes I get quiet on purpose. Part of me wants them to feel the distance before I explain it.',
          resultWeights: { 'reason-theres-a-story': 1 },
        },
      ],
    },
    {
      id: 'q8',
      prompt: 'A friend tells you a secret that completely changes how you see something they did.',
      choices: [
        {
          id: 'a',
          label: "I need more context now. What else don't I know?",
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'b',
          label: "If this changes my opinion of what they did, I'm telling them. I'm not giving them the reaction they came hoping to get.",
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'c',
          label: 'Whatever I think about it, it stays with me. They told me, not the group chat.',
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'd',
          label: 'There is a very high chance I make one wildly inappropriate joke because this conversation desperately needs oxygen.',
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'e',
          label: "I may look at them differently for a minute, but I'm not letting them turn one confession into \"I'm a terrible person forever.\" Own it. Fix what you can. Keep moving.",
          resultWeights: { 'hype-department': 2 },
        },
      ],
    },
    {
      id: 'q9',
      prompt: "It's 9:07 PM. You're home. The group chat suddenly says: \"We need you. Come out.\"",
      choices: [
        {
          id: 'a',
          label: "If somebody actually needs me, I'm coming. If this is FOMO bait, goodnight.",
          resultWeights: { 'emergency-contact': 2 },
        },
        {
          id: 'b',
          label: 'Where are we going? I can be dressed in 12 minutes.',
          resultWeights: { 'reason-theres-a-story': 2 },
        },
        {
          id: 'c',
          label: 'Who said "we need you" and WHY? That wording is suspicious.',
          resultWeights: { 'one-who-knows-too-much': 2 },
        },
        {
          id: 'd',
          label: 'If "we need you" means somebody wants me to pick a side before I know what happened, absolutely not. Give me the story first.',
          resultWeights: { 'human-bullshit-detector': 2 },
        },
        {
          id: 'e',
          label: "Fine. But if I'm coming, we are not sitting around miserable. I'm turning this night around.",
          resultWeights: { 'hype-department': 2 },
        },
      ],
    },
    {
      id: 'q10',
      prompt: 'Which sentence has somebody who loves you said to you with a completely straight face?',
      choices: [
        {
          id: 'a',
          label: 'You are not everybody’s emergency contact.',
          resultWeights: { 'emergency-contact': 1 },
        },
        {
          id: 'b',
          label: 'This was supposed to be ONE drink.',
          resultWeights: { 'reason-theres-a-story': 1 },
        },
        {
          id: 'c',
          label: 'I didn’t ask if it was true. I asked you not to SAY it.',
          resultWeights: { 'human-bullshit-detector': 1 },
        },
        {
          id: 'd',
          label: 'Why do you have screenshots from February?',
          resultWeights: { 'one-who-knows-too-much': 1 },
        },
        {
          id: 'e',
          label: 'I just wanted to complain. I did not ask for a motivational speech.',
          resultWeights: { 'hype-department': 1 },
        },
      ],
    },
  ],
};
