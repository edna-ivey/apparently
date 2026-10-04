import type { ArchetypeQuizDefinition } from './types';
export const LOVE_READY_QUIZ: ArchetypeQuizDefinition = {
  id: 'love-soulmates-ready',
  scoringType: 'archetype',
  category: 'Love & Soulmates',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'Are you actually ready for love?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Wanting a relationship and being ready for one are not the same thing.'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR LOVE & SOULMATES MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q4', 'q5', 'q7', 'q8', 'q9', 'q10'],
  primaryTieWeight: 3,
  countPrimaryMatchesTieBreak: true,
  tieFallbackOrder: ['open', 'terms', 'walls', 'bae'],
  resultGates: {'bae': {'minSignals': 4, 'requiredAnyOf': [['q2-a', 'q5-b', 'q8-d', 'q10-b'], ['q3-a', 'q4-c', 'q7-a']]}, 'walls': {'minSignals': 3, 'requiredAnyOf': [['q3-d', 'q7-c', 'q9-c', 'q10-a']]}},
  archetypes: [
    {
      id: 'open',
      title: 'THE DOOR IS OPEN.',
      structuredRead: {
        theRead: ['Okayyyy, emotionally available. We see you. 👀', "You don't just want love. You actually seem prepared for what comes with it.", "You can let somebody get close without turning vulnerability into a hostage situation. You understand that a real relationship will occasionally inconvenience you, annoy you, require compromise, and force you to have conversations you'd rather postpone until 2047.", "And somehow... you're still in.", "You seem capable of loving somebody as an actual person, not just as the role they're supposed to play in your life.", 'You can communicate. Adjust. Apologize. Receive an apology. Give somebody room to be imperfect without immediately deciding the universe has sent you a sign to leave them.', 'Most importantly, you can be close to somebody without needing to control every possible way the relationship could go wrong.', 'Look at you.', 'Healthy-ish. 😂'],
        theCallOut: ["Don't get cocky.", "Being ready for love does not mean every person you're attracted to is ready for you.", "Your danger isn't necessarily running from intimacy.", "It may be wasting all this emotional availability on somebody whose favorite relationship status is “it's complicated.”", "Please don't."],
        theCost: [],
        tryThis: ['Stop grading people exclusively on chemistry.', 'Start asking:', 'Can this person actually meet me here?', 'Because apparently, you have a relationship to offer.', 'Make sure they do too.'],
      },
    },
    {
      id: 'terms',
      title: 'LOVE, WITH TERMS & CONDITIONS.',
      structuredRead: {
        theRead: ["Oh, you're ready.", "There's just paperwork. 😂", 'Love may enter the premises after providing identification, proof of consistency, emotional references, a security deposit, and approximately six to eight weeks for processing.', "You're not unavailable.", "You're careful.", 'And frankly, some of that is probably earned.', 'You can love deeply. You can commit. You can compromise. You can absolutely build something real with somebody.', 'But before you relax into it?', "You need to know we're good.", 'And then maybe know again.', 'And possibly one more time for quality assurance.', 'You probably have certain conditions that make love feel safe: consistency, communication, reassurance, loyalty, clarity, independence, predictability, effort.', 'None of that is inherently unreasonable.', "The problem starts when your partner doesn't just have to be trustworthy.", "They have to keep proving they're trustworthy."],
        theCallOut: ['Baby, at some point the background check has to end. 😭', 'If somebody has shown up consistently, communicated clearly, treated you well, and given you no meaningful reason to distrust them, you cannot keep putting them on emotional probation because somebody else failed the position.', 'Standards protect you.', 'Moving goalposts exhaust everybody.', "Know which one you're doing."],
        theCost: ['Too many terms and conditions can turn a perfectly healthy relationship into an endless audition.', "Eventually somebody may stop trying to convince you they're safe and go find somebody who actually believes them.", 'Oop.'],
        tryThis: ['Keep your standards.', 'Seriously.', 'But identify which rules protect your values and which ones protect your fear.', 'Those are not the same policies.'],
      },
    },
    {
      id: 'walls',
      title: 'YOUR HEART SAYS YES. YOUR WALLS SAY ABSOLUTELY NOT.',
      structuredRead: {
        theRead: ['This is awkward.', 'Because you really do want love.', 'Your defenses, however, appear to have missed the meeting. 😭', 'Your heart is somewhere making a Pinterest board called Our Future, while the rest of you is installing emotional barbed wire.', 'You want somebody who knows you.', 'But being known feels dangerous.', 'You want somebody dependable.', 'But depending on somebody feels dangerous.', 'You want somebody close.', "But once they're close enough to actually affect you?", '🚨 SECURITY BREACH. 🚨', 'So you may pull back.', 'Shut down.', 'Overthink.', 'Look for what could go wrong.', 'Keep part of yourself hidden.', 'Act less invested than you are.', 'Convince yourself you “just need space.”', 'Or suddenly discover seventeen things wrong with a person who was perfectly attractive three weeks ago.', 'Interesting timing.'],
        theCallOut: ["Here's the problem:", 'You cannot simultaneously say,', "“Why can't I find a deep connection?”", 'and', '“Absolutely nobody will be given the ability to hurt me.”', 'Pick a struggle. 😭', 'Deep intimacy requires access.', 'There is no premium subscription where you receive devotion, vulnerability, security, and soul-level connection while remaining completely untouchable.'],
        theCost: ['Your walls are very good at keeping heartbreak out.', 'Unfortunately, love keeps getting stopped at the same checkpoint.', 'And the really shady part?', 'You may occasionally blame other people for not getting close enough while quietly making closeness almost impossible.', '👀'],
        tryThis: ["The next time you feel yourself backing away from somebody good, don't immediately ask:", "“What's wrong with them?”", 'Ask:', '“Did something actually become unsafe... or did it just become real?”', 'Because those two things may feel suspiciously similar to you.'],
      },
    },
    {
      id: 'bae',
      title: 'YOU WANT A BAE, NOT A PARTNERSHIP.',
      structuredRead: {
        theRead: ['Oh.', 'So you want somebody.', "You just don't necessarily want all that... relationship happening. 😭", 'You want the good morning texts.', 'The dates.', 'The cuddling.', 'The sex.', 'The trips.', 'The inside jokes.', 'The attention.', 'The person who remembers your order.', 'The cute pictures.', 'The emergency contact.', "The “that's my man” or “that's my girl.”", 'Maybe even the ring.', 'Adorable.', 'Then this other human starts having needs.', "And suddenly we're experiencing technical difficulties.", 'You seem pretty interested in what a relationship could add to your life.', "We're less convinced you're equally excited about what a relationship will occasionally ask from you.", 'Compromise?', 'Hmm.', 'Changing plans because your partner needs you?', "Let's circle back.", "Having a difficult conversation when you'd rather enjoy your evening?", 'Unsubscribe.', "Making room for somebody else's priorities?", 'Why are they being so needy?', "Being accountable when you're the problem?", 'Now why would Apparently bring negativity into this? 😂'],
        theCallOut: ['You may not actually want a partner right now.', 'You may want a bae-shaped accessory.', "Someone loving enough to make you feel chosen, independent enough not to inconvenience you, available whenever you need them, low-maintenance when you don't, attractive, loyal, emotionally supportive, fun, sexually compatible, and preferably equipped with no complicated needs of their own.", 'So...', 'a very affectionate houseplant?', 'Because actual people are going to need stuff. 😭'],
        theCost: ["If every normal relationship demand starts feeling like somebody is disturbing your peace, eventually you have to consider the possibility that peace isn't being disturbed.", "You're being asked to participate.", "And if the only relationships that feel “easy” are the ones where you rarely have to compromise, sacrifice, repair, accommodate, or put somebody else's needs beside your own...", "That's not compatibility.", "That's convenience."],
        tryThis: ["Before asking whether you're ready to find your person, ask something less cute:", "“Am I willing to be somebody else's person too?”", "Not when it's romantic.", "Not when you're getting what you want.", "Not when they're easy.", "When they're tired.", "When they're annoying.", 'When they need something.', 'When you screwed up.', 'When love costs you a little comfort.', 'If the answer is currently “ehhh...”', "That's okay.", 'Being single is legal. 😂', "Just stop advertising for a position you don't actually want filled."],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You finally meet somebody you REALLY like.',
      choices: [
        { id: 'a', label: "Suddenly I'm noticing flaws I didn't care about before they liked me back. 👀", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -1}] },
        { id: 'b', label: "I'm enjoying it. Consistency is hot.", resultWeights: {'open': 2} },
        { id: 'c', label: "I'm happy, as long as this doesn't become an every free minute together situation.", resultWeights: {'bae': 2}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'd', label: "I like it, but I'm still watching. Let's see month nine.", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}] },
      ],
    },
    {
      id: 'q2',
      prompt: 'Saturday was supposed to be YOUR day.',
      choices: [
        { id: 'a', label: 'Define “need.” 😭', resultWeights: {'bae': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
        { id: 'b', label: "I'll go, but I'm already hoping this doesn't become a thing.", resultWeights: {'walls': 1}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
        { id: 'c', label: "I'm there. Lazy Saturday can wait.", resultWeights: {'open': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: 1}] },
        { id: 'd', label: "Damn, there goes my day. But I'm going.", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: 1}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your partner says:',
      choices: [
        { id: 'a', label: 'Why does everything need a conversation?', resultWeights: {'bae': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -1}] },
        { id: 'b', label: "I'll work on it, but I need space sometimes.", resultWeights: {'terms': 1}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'c', label: "Fair. I'll communicate when I need space.", resultWeights: {'open': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: 1}] },
        { id: 'd', label: "Letting people in when I'm upset is hard.", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -2}] },
      ],
    },
    {
      id: 'q4',
      prompt: 'Plot twist: you were WRONG wrong.',
      choices: [
        { id: 'a', label: 'I need time. Admitting it while defensive is HARD.', resultWeights: {'walls': 1}, traitSignals: [{dimension: 'accountability_defensiveness', value: -1}] },
        { id: 'b', label: 'I apologize. I hate it here. 😂', resultWeights: {'open': 3}, traitSignals: [{dimension: 'accountability_defensiveness', value: 2}] },
        { id: 'c', label: 'I said sorry. Are we fixing it or discussing it for three business days?', resultWeights: {'bae': 3}, traitSignals: [{dimension: 'accountability_defensiveness', value: -1}] },
        { id: 'd', label: "I'll apologize after one tiny presentation explaining myself.", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: -1}] },
      ],
    },
    {
      id: 'q5',
      prompt: "Six months in, your life isn't completely yours anymore.",
      choices: [
        { id: 'a', label: 'Fine, but some parts of my life stay mine.', resultWeights: {'terms': 2}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'b', label: 'Why does love come with this many obligations?', resultWeights: {'bae': 3}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'c', label: "I didn't realize how much I'd miss answering only to myself.", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'd', label: "That's partnership. Just don't lose yourself in it.", resultWeights: {'open': 2}, traitSignals: [{dimension: 'independent_collaborative', value: -1}] },
      ],
    },
    {
      id: 'q6',
      prompt: 'Your partner is clearly off.',
      choices: [
        { id: 'a', label: "I'm reviewing the last 72 hours for clues. 👀", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}] },
        { id: 'b', label: 'Fine? Great. Fine it is.', resultWeights: {'bae': 1} },
        { id: 'c', label: 'Ask once more, then give them space.', resultWeights: {'open': 2}, traitSignals: [{dimension: 'control_allowing', value: -1}] },
        { id: 'd', label: "Now I'm irritated. Don't make me drag it out of you.", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'control_allowing', value: 1}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone you love really lets you down.',
      choices: [
        { id: 'a', label: "I wouldn't be dealing with this if I were single.", resultWeights: {'bae': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
        { id: 'b', label: "I'm hurt. We need to talk.", resultWeights: {'open': 3}, traitSignals: [{dimension: 'repair_punishing', value: 1}] },
        { id: 'c', label: "This is why I don't like needing people.", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -2}] },
        { id: 'd', label: "I'll forgive it. I'll also remember it.", resultWeights: {'terms': 3}, traitSignals: [{dimension: 'forgiving_receipts', value: -2}] },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your partner gets their dream opportunity.',
      choices: [
        { id: 'a', label: "What if I rearrange my life and we don't even last?", resultWeights: {'walls': 2}, traitSignals: [{dimension: 'vulnerable_armored', value: -1}] },
        { id: 'b', label: "Let's figure out how both our dreams still matter.", resultWeights: {'open': 3}, traitSignals: [{dimension: 'independent_collaborative', value: -1}] },
        { id: 'c', label: "I support it. What's the plan, and for how long?", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'practical_idealistic', value: 1}] },
        { id: 'd', label: 'Why does your dream require my lifestyle change?', resultWeights: {'bae': 3}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'When somebody gets REALLY close to you...',
      choices: [
        { id: 'a', label: "I love it. Just keep reassuring me we're good. 😂", resultWeights: {'terms': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: -2}] },
        { id: 'b', label: "I like having a person. It's the expectations I could do without.", resultWeights: {'bae': 3}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'c', label: 'I start feeling exposed and finding reasons it might not work.', resultWeights: {'walls': 3}, traitSignals: [{dimension: 'vulnerable_armored', value: -2}] },
        { id: 'd', label: "I get more comfortable. That's the point.", resultWeights: {'open': 2}, traitSignals: [{dimension: 'private_open', value: -1}] },
      ],
    },
    {
      id: 'q10',
      prompt: 'Last one. 👀',
      choices: [
        { id: 'a', label: 'Yes... but that much vulnerability scares me.', resultWeights: {'walls': 3}, traitSignals: [{dimension: 'vulnerable_armored', value: -2}] },
        { id: 'b', label: 'Damn. Maybe I want somebody around more than I want an actual partnership.', resultWeights: {'bae': 3}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'c', label: 'Yes, with boundaries and equal effort.', resultWeights: {'terms': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: 1}] },
        { id: 'd', label: "Yes. That's partnership.", resultWeights: {'open': 3}, traitSignals: [{dimension: 'independent_collaborative', value: -1}] },
      ],
    },
  ],
};
