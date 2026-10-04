import type { ArchetypeQuizDefinition } from './types';
export const HIDDEN_YOU_WRONG_QUIZ: ArchetypeQuizDefinition = {
  id: 'hidden-you-wrong',
  scoringType: 'archetype',
  category: 'Hidden You',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'What do people keep getting wrong about you?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['People have a whole story about you. Cute. Let’s see if it’s accurate.'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR HIDDEN YOU MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q3', 'q5', 'q7', 'q9', 'q10'],
  primaryTieWeight: 3,
  finalTieQuestionId: 'q10',
  tieFallbackOrder: ['hidden-feeling', 'face', 'fine', 'attention'],
  resultGates: {'attention': {'minSignals': 3, 'requiredAnyOf': [['q3-a', 'q4-a', 'q5-a', 'q9-d', 'q10-d']]}, 'fine': {'minSignals': 3, 'requiredAnyOf': [['q2-a', 'q3-d', 'q7-b', 'q7-c', 'q9-a', 'q10-b']]}},
  archetypes: [
    {
      id: 'hidden-feeling',
      title: "THEY THINK YOU DON'T CARE.",
      structuredRead: {
        theRead: ['Oh, you care.', "That's actually the problem. 😂", "People see the quiet reactions. The short answers. The way you don't gush, chase, explain yourself to death, or immediately hand over every feeling you have.", "So naturally, they've concluded:", "“They don't care.”", 'Meanwhile, you have privately thought about the situation 47 times.', "You're selective with emotion.", "You don't necessarily believe every feeling needs an audience.", 'You can love somebody deeply without texting them a dissertation about it.', 'You can be hurt without announcing it.', 'You can miss somebody and still not call.', 'You can care and still decide:', "“I'm not about to do all that.”", "And because people can't see what you're not showing them, they sometimes mistake your privacy for indifference."],
        theCallOut: ['Okay, but babe...', 'How exactly were they supposed to know? 😭', "You cannot keep your feelings in a password-protected folder, give people read-only access to three documents, and then be offended that they haven't accurately assessed the entire database.", "Sometimes people aren't failing to understand you.", "You didn't tell them.", 'There is a difference.'],
        theCost: ['The people closest to you may occasionally feel less loved, needed, or important than they actually are.', "Not because you don't care.", "Because you've decided the feeling itself should somehow be sufficient communication.", 'Unfortunately, nobody else received the internal memo.'],
        tryThis: ['The next time you think:', '“They should know.”', 'Ask yourself:', '“Did I actually give them a reasonable way to know?”', 'Because yes, people misread you.', 'But apparently, you could occasionally include subtitles.'],
      },
    },
    {
      id: 'face',
      title: 'APPARENTLY, YOUR FACE HAS A REPUTATION.',
      structuredRead: {
        theRead: ['😭', 'You walked into the room.', "That's it.", 'That was the incident.', "Somebody has already decided you're intimidating, stuck-up, judging them, mad, unapproachable, or approximately three seconds away from asking to speak to management.", 'Meanwhile, you were thinking about tacos.', "You probably don't perform warmth automatically.", 'You may be direct.', 'Observant.', 'Self-contained.', 'Confident.', 'Quiet until you have something to say.', "And you don't necessarily feel responsible for making every person in the room immediately comfortable with you.", 'Fair.', "But people often interpret what you don't perform.", 'No nervous overexplaining?', 'Confident.', 'No automatic smile?', 'Mad.', 'Direct answer?', 'Intimidating.', 'Quietly observing?', 'Oh, apparently you hate everybody. 😂'],
        theCallOut: ['Now...', 'Are people projecting onto you?', 'Sometimes.', 'Are you completely innocent?', "Let's not get carried away.", 'Because sometimes you know EXACTLY what your face is doing.', '👀', 'And if multiple unrelated people have described you as intimidating, hard to read, or difficult to approach...', 'At some point we do have to acknowledge the common denominator has entered the chat.', "You don't need to shrink yourself.", "You don't need to fake sweetness.", "But “I'm just being myself” does not magically make your delivery invisible."],
        theCost: ["People may hesitate to approach you, ask for help, flirt with you, tell you something vulnerable, or include you because they're already bracing for a reaction you haven't even had yet.", "Which means sometimes you're being rejected by people who are actually just scared of being rejected by you first.", 'Well.', "That's annoying."],
        tryThis: ["Don't become more palatable.", 'Become more legible.', 'If you like somebody, show a little warmth.', "If you're interested, look interested.", "If you're not mad, perhaps inform your face. 😂", "You don't have to become bubbly.", 'Just stop making everybody solve an escape room to determine whether you like them.'],
      },
    },
    {
      id: 'fine',
      title: "EVERYBODY THINKS YOU'RE FINE.",
      structuredRead: {
        theRead: ['Of course they do.', 'Look at you.', 'Handling things.', 'Showing up.', 'Getting stuff done.', 'Making jokes.', "Answering “I'm good.”", 'Being useful.', 'Being responsible.', "Being the person everybody else calls when they're falling apart.", 'Very convincing performance.', '👏', "You're good at carrying things without making them everybody else's problem.", 'Stress.', 'Disappointment.', 'Fear.', 'Exhaustion.', 'Hurt.', 'Responsibilities you probably should have said no to three responsibilities ago.', 'You keep moving.', 'And because you keep moving, people assume the load must not be that heavy.', 'It is.', "You're just strong enough to carry it quietly."],
        theCallOut: ["But here's the irritating part.", 'You may have accidentally trained everybody.', '😭', "If every time somebody asks how you're doing you say:", "“I'm fine.”", 'If you rarely ask for help.', 'If you automatically handle things yourself.', "If you wait until you're completely overwhelmed before admitting you're overwhelmed...", 'People eventually believe the version of you that you keep presenting.', "Then one day you're thinking:", '“Does anybody ever think about what I need?”', 'And Apparently is sitting here like...', 'Did we submit a request?', 'Was there a ticket?', 'An email?', 'A smoke signal?', 'Anything? 👀'],
        theCost: ['Competence can become a trap.', 'The more capable you appear, the more people assume you can handle.', 'The more you handle, the less they think to offer.', 'And eventually you can become deeply loved...', 'while still feeling strangely uncared for.', 'Not because nobody cares.', "Because everybody thinks you've got it."],
        tryThis: ['Let somebody catch something before you drop it.', 'Ask for help while the problem is still a 4, not when it has become a 47.', 'And when somebody asks:', '“Are you okay?”', "Maybe don't automatically say yes because explaining the truth feels inconvenient.", 'Strong people are still allowed to require support.', 'Apparently, yours just needs better advertising.'],
      },
    },
    {
      id: 'attention',
      title: 'THEY CALL IT “TOO MUCH.” YOU CALL IT PAYING ATTENTION.',
      structuredRead: {
        theRead: ['Ohhh.', "You're difficult.", 'Interesting.', "Is that what we're calling noticing things now? 😂", 'Because you noticed the tone changed.', 'You noticed the effort dropped.', 'You noticed somebody said one thing and did another.', "You noticed the weird little comment everybody else pretended wasn't weird.", 'You noticed that “joke” had a little truth tucked inside it.', 'And unfortunately for everyone involved...', 'you are occasionally willing to say it out loud.', "You probably have a low tolerance for pretending everything is fine when it obviously isn't.", 'You notice patterns.', 'Contradictions.', 'Energy shifts.', 'Inconsistency.', 'Half-effort.', 'Things other people would happily sweep underneath a rug and then place furniture over.', 'And when something matters to you, you may want to deal with it rather than smile politely while resentment ferments in the basement.', 'This can make you seem intense.', 'Demanding.', 'Sensitive.', 'Dramatic.', '“Always making something a thing.”', 'Except...', 'sometimes it was a thing.', 'Everybody else just wanted it to remain conveniently unnamed.'],
        theCallOut: ['However.', '👀', 'Noticing everything does not mean everything requires a congressional hearing.', 'Sometimes the tone was weird.', 'Sometimes somebody was tired.', 'Sometimes the text really did just say “K.”', 'Sometimes there is no deeper meaning.', 'And sometimes your desire to address things immediately, thoroughly, and with supporting exhibits can turn a minor irritation into a season finale.', 'You may be right about what you noticed.', "That doesn't automatically mean your response was proportionate.", 'Oop.'],
        theCost: ['When you react to every signal with the same intensity, people stop knowing which things actually matter.', 'And worse?', "They may start dismissing legitimate concerns because they're exhausted from discussing every smaller one.", "That's how somebody who is genuinely perceptive ends up getting labeled “dramatic.”", 'Rude.', 'But occasionally preventable.'],
        tryThis: ['Before bringing something up, ask:', '“Is this a pattern, a problem, or just a moment?”', 'Patterns deserve attention.', 'Problems deserve conversation.', 'Moments?', 'Some of them deserve to die peacefully without a meeting. 😂', 'Keep noticing.', "That's one of your gifts.", "Just make sure every observation doesn't automatically become a case."],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You walk into a room where you barely know anybody. What happens?',
      choices: [
        { id: 'a', label: "I find one person I vibe with. That's enough.", resultWeights: {'hidden-feeling': 1}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'b', label: 'Apparently my neutral face has already offended somebody. 😂', resultWeights: {'face': 2} },
        { id: 'c', label: 'I seem totally fine. Internally, I would rather be anywhere else.', resultWeights: {'fine': 1}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'd', label: "I'm clocking the entire room before I've said five words.", resultWeights: {'attention': 2}, traitSignals: [{dimension: 'social_attunement', value: 1}] },
      ],
    },
    {
      id: 'q2',
      prompt: "Somebody you love asks, “Are you okay?” when you're very much NOT okay.",
      choices: [
        { id: 'a', label: "“Yeah, I'm good.” Automatic.", resultWeights: {'fine': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'b', label: 'I tell them. If you asked, buckle up. 😂', resultWeights: {'attention': 2}, traitSignals: [{dimension: 'private_open', value: -1}] },
        { id: 'c', label: '“Why? What did you notice?”', resultWeights: {'face': 1}, traitSignals: [{dimension: 'social_attunement', value: 1}] },
        { id: 'd', label: "“I'm fine.” And I genuinely expect them to know I'm not.", resultWeights: {'hidden-feeling': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which complaint have you heard some version of before?',
      choices: [
        { id: 'a', label: '“You make a big deal out of little things.”', resultWeights: {'attention': 2} },
        { id: 'b', label: "“I can never tell what you're thinking.”", resultWeights: {'hidden-feeling': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'c', label: "“I thought you didn't like me at first.”", resultWeights: {'face': 2} },
        { id: 'd', label: '“You never ask anybody for help.”', resultWeights: {'fine': 2}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
      ],
    },
    {
      id: 'q4',
      prompt: "Somebody's energy toward you suddenly changes.",
      choices: [
        { id: 'a', label: 'I notice immediately and probably say something.', resultWeights: {'attention': 2}, traitSignals: [{dimension: 'social_attunement', value: 2}] },
        { id: 'b', label: "I notice. I'm not chasing anybody for an explanation.", resultWeights: {'hidden-feeling': 2}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'c', label: 'I wonder if I did something, but wait for more evidence.', resultWeights: {'fine': 1}, traitSignals: [{dimension: 'trust_verify', value: -1}] },
        { id: 'd', label: "I have enough going on. If there's a problem, they can use words.", resultWeights: {'face': 1}, traitSignals: [{dimension: 'direct_indirect', value: 1}] },
      ],
    },
    {
      id: 'q5',
      prompt: "You're hurt by something somebody did. What's most like you?",
      choices: [
        { id: 'a', label: 'I address it. Possibly with exhibits. 😭', resultWeights: {'attention': 2}, traitSignals: [{dimension: 'direct_indirect', value: 2}] },
        { id: 'b', label: "I handle it myself. I don't want to need anything from them.", resultWeights: {'face': 1}, traitSignals: [{dimension: 'independent_collaborative', value: 2}] },
        { id: 'c', label: "I get quieter. If they know me, they'll notice.", resultWeights: {'hidden-feeling': 2}, traitSignals: [{dimension: 'direct_indirect', value: -2}] },
        { id: 'd', label: "I'll talk about it, but only after I've figured out exactly what I feel.", resultWeights: {'fine': 2}, traitSignals: [{dimension: 'reflective_reactive', value: 1}] },
      ],
    },
    {
      id: 'q6',
      prompt: "Someone tells you, “You're intimidating.”",
      choices: [
        { id: 'a', label: "“ME?!” I genuinely don't see it.", resultWeights: {'hidden-feeling': 1} },
        { id: 'b', label: "I laugh. I've heard this before.", resultWeights: {'face': 2} },
        { id: 'c', label: "Honestly, I'd rather be intimidating than easy to play with.", resultWeights: {'face': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -1}] },
        { id: 'd', label: 'I immediately wonder what I did that gave them that impression.', resultWeights: {'fine': 1}, traitSignals: [{dimension: 'perspective_taking_self_referencing', value: 1}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your week is an absolute dumpster fire. What can most people tell?',
      choices: [
        { id: 'a', label: 'Everything. My face has already issued a press release. 😂', resultWeights: {'face': 1}, traitSignals: [{dimension: 'private_open', value: -1}] },
        { id: 'b', label: "Something's off, but probably not how bad it really is.", resultWeights: {'fine': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'c', label: 'Almost nothing. Business as usual.', resultWeights: {'fine': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'd', label: 'Depends who they are. Very few people get the full version.', resultWeights: {'hidden-feeling': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
      ],
    },
    {
      id: 'q8',
      prompt: 'Somebody says something that feels just a LITTLE shady.',
      choices: [
        { id: 'a', label: "I file it away. Let's see if it becomes a pattern.", resultWeights: {'hidden-feeling': 1}, traitSignals: [{dimension: 'trust_verify', value: -2}] },
        { id: 'b', label: '“What did you mean by that?” 👀', resultWeights: {'attention': 2}, traitSignals: [{dimension: 'direct_indirect', value: 2}] },
        { id: 'c', label: "I probably noticed, but I'm not giving every comment my energy.", resultWeights: {'face': 1}, traitSignals: [{dimension: 'control_allowing', value: -1}] },
        { id: 'd', label: 'I replay it later and wonder whether I imagined the tone.', resultWeights: {'fine': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: -1}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which misunderstanding annoys you the MOST?',
      choices: [
        { id: 'a', label: "People assuming I'm okay because I'm handling it.", resultWeights: {'fine': 3} },
        { id: 'b', label: "People assuming I don't care because I don't show everything.", resultWeights: {'hidden-feeling': 3} },
        { id: 'c', label: "People assuming I'm mean because I'm not overly warm.", resultWeights: {'face': 3} },
        { id: 'd', label: "People calling me dramatic when I'm pointing out something real.", resultWeights: {'attention': 3} },
      ],
    },
    {
      id: 'q10',
      prompt: 'Be serious. Which one might be a tiny bit your fault? 👀',
      choices: [
        { id: 'a', label: "I expect people to notice feelings I haven't actually expressed.", resultWeights: {'hidden-feeling': 3}, traitSignals: [{dimension: 'direct_indirect', value: -2}] },
        { id: 'b', label: "I say “I'm fine” so convincingly people believe me.", resultWeights: {'fine': 3}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'c', label: 'My delivery occasionally has... edges. 😂', resultWeights: {'face': 3}, traitSignals: [{dimension: 'tactful_blunt', value: -1}] },
        { id: 'd', label: 'Once I notice something, I can have a hard time letting it go.', resultWeights: {'attention': 3}, traitSignals: [{dimension: 'forgiving_receipts', value: -1}] },
      ],
    },
  ],
};
