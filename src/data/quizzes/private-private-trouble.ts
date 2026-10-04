import type { ArchetypeQuizDefinition } from './types';
export const PRIVATE_PRIVATE_TROUBLE_QUIZ: ArchetypeQuizDefinition = {
  id: 'private-private-trouble',
  scoringType: 'archetype',
  category: 'Private Private. 😈',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'How much trouble are you after dark?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Everybody has a private side. Apparently would like to see yours.'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR PRIVATE PRIVATE. 😈 MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q7', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['halo', 'tension', 'unlocked', 'bad_decision'],
  resultGates: {'bad_decision': {'minSignals': 4, 'requiredAnyOf': [['q1-c', 'q4-d', 'q5-d', 'q6-d', 'q8-d'], ['q2-d', 'q9-d', 'q10-d']]}, 'unlocked': {'minSignals': 3, 'requiredAnyOf': [['q3-b', 'q7-b', 'q8-c', 'q9-b', 'q10-c']]}},
  archetypes: [
    {
      id: 'halo',
      title: '😇 THE HALO STAYS ON. MOSTLY.',
      structuredRead: {
        theRead: ['Oh.', 'You clicked Private Private 😈 with a lot of confidence for somebody this well-behaved.', '😭', "You're not a prude.", "Let's establish that immediately.", 'You understand attraction.', 'You enjoy chemistry.', 'You can flirt.', 'You can appreciate somebody looking extremely... appreciable.', '👀', 'But when Apparently went looking for the scandal?', 'We mostly found self-control.', 'You tend to know where your line is.', "And unlike certain people we're about to discuss, knowing where the line is does not immediately make you wonder what would happen if you stepped over it.", 'You can want somebody without losing your damn mind.', 'You can enjoy being wanted without immediately turning it into an event.', 'You might flirt.', 'You might entertain a thought.', 'You might even surprise somebody occasionally.', 'But generally?', 'Your private life has adult supervision.', 'Unfortunately, the adult is you.', '😂'],
        theCallOut: ['Now...', "There may be a tiny part of you that enjoys thinking you're naughtier than the evidence suggests.", 'You picked the devil.', 'You answered the questions.', 'You waited for Apparently to uncover your secret life.', 'And Apparently returned holding...', 'a very organized folder.', '😭', "That's okay.", 'Being selective is not boring.', 'Having standards is not boring.', 'Knowing that something would be hot and deciding “absolutely not” is sometimes its own kind of power.', "But please stop acting like one spicy text from 2023 means you're living a double life.", 'We checked.'],
        theCost: ['Sometimes control can become predictability.', 'You can be so focused on avoiding regret, awkwardness, vulnerability, or looking foolish that you also avoid a little harmless risk.', 'Not reckless risk.', 'Not violating your own boundaries.', 'Just the kind where you let somebody know:', 'Yes. I noticed you too.', "You don't always have to know exactly where something is going before you're allowed to enjoy where it is."],
        tryThis: ['The next time you genuinely want to flirt?', 'Flirt.', "Don't conduct a feasibility study.", "Don't wait for a notarized declaration of mutual attraction.", "Don't make the other person do every bit of the revealing first.", 'Give them something.', 'A look.', 'A compliment.', 'A little extra eye contact.', 'A text that has absolutely no business containing that emoji.', '👀', "Apparently isn't asking you to lose the halo.", "We're just saying...", 'it comes off.'],
      },
    },
    {
      id: 'tension',
      title: '😏 YOU LIKE THE TENSION MORE THAN THE TROUBLE.',
      structuredRead: {
        theRead: ['Ohhhh.', "You're one of those.", '😂', "You don't necessarily need anything to happen.", 'You need to know that it could.', "That's different.", 'The eye contact that lasted slightly too long.', 'The compliment that was technically innocent if anyone asks.', 'The joke with a perfectly respectable first meaning...', "and a second meaning that is absolutely none of Apparently's business.", 'The pause.', 'The smirk.', 'The text you reread before sending because:', '“Is this too much?”', '...', 'Send.', '😭', 'You like chemistry with a little suspense.', 'You like the moment before somebody says what both of you already know.', 'And sometimes?', 'The buildup is hotter than the actual outcome.', 'Because once something happens, the question disappears.', 'And apparently you were having a wonderful time with the question.'],
        theCallOut: ["Let's discuss your favorite legal defense:", "“I didn't do anything.”", 'Correct.', 'Technically.', '😂', "You didn't say it.", 'You implied it.', "You didn't make a move.", 'You made it extremely easy for somebody else to make one.', "You didn't cross the line.", 'You stood directly beside it, looked across, and made eye contact.', "Ma'am.", 'Apparently recognizes plausible deniability when we see it.', 'You enjoy being desired.', 'And you may especially enjoy watching somebody try to figure out whether you desire them back.', 'Which is fun.', "Until you're doing it to somebody who actually needs words."],
        theCost: ['If you live in the tension too long, people can mistake mystery for disinterest.', "Or worse, you can keep chemistry alive with somebody you don't actually intend to choose.", 'Because attention feels good.', 'Flirting feels good.', 'Being wanted feels good.', "And sometimes it's easier to keep somebody in the delicious little maybe than decide whether you actually want the reality.", '👀'],
        tryThis: ['Ask yourself:', "“Do I want this person, or do I want this person's attention?”", 'Oof.', 'We know.', 'Rude question.', 'But if the answer is the person?', 'At some point, stop hiding behind the smirk and give them something real.', 'And if the answer is the attention?', 'Enjoy your little ego snack responsibly.', '😂', "Apparently isn't taking away your flirting privileges.", "We're just putting them under observation."],
      },
    },
    {
      id: 'unlocked',
      title: '😈 YOU HAVE A SIDE PEOPLE HAVE TO UNLOCK.',
      structuredRead: {
        theRead: ['Well, well, well.', 'There she is.', '👀', 'Public you is real.', 'Daytime you is real.', 'Responsible you is real.', 'The version people meet at work, school pickup, dinner, the grocery store, wherever?', 'Completely legitimate person.', "She's just...", 'not the entire menu.', '😭', 'Because with the right combination of attraction, trust, privacy, chemistry, and feeling safe enough to stop monitoring yourself?', 'A different side comes out.', 'Bolder.', 'More sensual.', 'More playful.', 'More adventurous.', 'More willing to say what you want.', 'More willing to show somebody exactly how much you want them.', 'Maybe even a little shocking to someone who thought they had you completely figured out.', "And that's the key.", "This version of you isn't public property.", 'Access is earned.'],
        theCallOut: ['You may secretly enjoy the contrast.', '👀', "There's something delicious about somebody assuming you're one way...", 'and then getting enough access to discover:', 'Oh.', '😂', "And because this side isn't available to everybody, it probably feels more intimate when someone gets it.", "They're not just seeing you flirt.", "They're seeing a version of you that requires trust.", 'Which means somebody who only knows daytime-you could hear a story about private-you and reasonably respond:', '“HER?!”', 'Yes.', 'Her.', 'Please lower your voice.'],
        theCost: ["The locked-door thing is hot until the person you actually want can't find the key.", '😭', 'Because if you require a lot of safety before revealing desire, but you also wait for the other person to create all of that safety...', 'you can accidentally look much less interested than you are.', 'You may be sitting there with an entire private universe happening internally while the other person is thinking:', "“I don't think she's into me.”", 'Tragic.'],
        tryThis: ["You don't have to give everybody access.", "Please don't.", 'Exclusivity is clearly part of what makes this side feel like you.', 'But when somebody has earned it?', 'Let them know the door actually opens.', 'Initiate sometimes.', 'Say what you want.', "Let yourself be seen wanting something before you're 100% certain it's safe to want it.", "Because Apparently doesn't think you need to become more adventurous.", 'We think somebody occasionally needs directions to the adventure.', '😈'],
      },
    },
    {
      id: 'bad_decision',
      title: '🔥 YOU ARE THE BAD DECISION.',
      structuredRead: {
        theRead: ['Oh.', 'Apparently owes several people an apology.', 'We were looking for the trouble.', "It's you.", '😭', 'You are not merely responsive to chemistry.', 'You are occasionally an active ingredient.', "You notice attraction and you're not always interested in pretending you didn't.", 'You can make the first move.', 'You can turn up the flirting.', 'You can send the text.', 'You can say the thing.', 'You can create the moment everybody else was politely waiting to see if somebody would create.', 'And when you really want somebody?', 'Your definition of subtle may become extremely generous.', '😂', "This does not necessarily mean you're reckless.", "It doesn't mean you'll do anything with anybody.", 'It means that when attraction, opportunity, and desire line up?', "You are considerably less interested in standing there pretending to be confused about what's happening.", 'Sometimes somebody talks you into trouble.', 'And sometimes?', 'You are standing there looking perfectly innocent while inventing it.'],
        theCallOut: ['We need to discuss this sentence:', "“What? I didn't do anything.”", 'Technically?', 'Maybe not.', 'Spiritually?', "Ma'am.", '😭', "Because you may know exactly what you're doing with the look.", 'The text.', 'The proximity.', 'The joke.', 'The outfit.', 'The little challenge.', 'The “come here.”', 'The completely unnecessary late-night message that could absolutely have waited until morning.', 'You understand that attraction can be played with.', 'And sometimes you enjoy being the one holding the match.'],
        theCost: ['Here is where fun can get expensive.', 'Being bold is sexy.', 'Being impulsive can be exciting.', 'Knowing what you want is attractive.', 'But chemistry has a remarkable ability to make tomorrow feel like a problem for somebody else.', 'Unfortunately?', 'Tomorrow-you has filed several complaints.', '😂', "The danger isn't that you're secretly some uncontrollable menace.", "It's that when you really want something, you may become extremely talented at explaining why the normal rules don't quite apply this time.", 'And occasionally...', 'they did.'],
        tryThis: ['Before you turn the temperature up, ask one deeply unsexy question:', '“Will I still like this decision tomorrow?”', 'Not:', 'Will I survive it?', 'Not:', 'Can I justify it?', 'Not:', 'Would this make an incredible story?', '😭', 'Will you actually feel good about it?', 'If yes?', 'Apparently has completed its administrative duties.', 'Carry on.', '😈', "Because the truth is, you don't need help becoming bolder.", 'You need exactly enough judgment to make sure your favorite bad decisions remain the kind you remember with a smile...', 'instead of the kind you have to block.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You're VERY attracted to somebody and you're pretty sure it's mutual. Who's most likely to make the first real move?",
      choices: [
        { id: 'a', label: 'Probably them. I need a little confirmation before I start risking dignity. 😂', resultWeights: {'halo': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: -1}] },
        { id: 'b', label: "Either of us. If the moment is right, I'm not scared.", resultWeights: {'unlocked': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: 1}] },
        { id: 'c', label: 'Me, potentially. Why are we wasting perfectly good chemistry?', resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'direct_indirect', value: 1}, {dimension: 'initiating_responsive', value: 2}] },
        { id: 'd', label: '“Real” move? No. But I may create several excellent opportunities. 👀', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'direct_indirect', value: -1}, {dimension: 'playful_serious', value: 1}] },
      ],
    },
    {
      id: 'q2',
      prompt: 'You get a text late at night from somebody you absolutely should NOT be entertaining: “You up?” Be serious.',
      choices: [
        { id: 'a', label: 'Read. Stare. Lock phone. We are not ruining our life tonight. 😭', resultWeights: {'halo': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'b', label: '“Why?” Because apparently I enjoy standing near cliffs.', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'curious_decisive', value: 1}] },
        { id: 'c', label: 'Depends who sent it. There are people whose names would immediately change this answer.', resultWeights: {'unlocked': 2} },
        { id: 'd', label: "Oh, I'm responding. Whether that's wise is a separate department.", resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: -2}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which part of attraction is the MOST fun?',
      choices: [
        { id: 'a', label: "Realizing somebody wants me when they haven't said it yet", resultWeights: {'tension': 2}, traitSignals: [{dimension: 'playful_serious', value: 1}] },
        { id: 'b', label: "Finally getting comfortable enough to show somebody the side of me everybody doesn't get", resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'c', label: 'Knowing exactly what I want and watching them realize it too', resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'direct_indirect', value: 1}] },
        { id: 'd', label: 'Feeling safe, wanted, and genuinely connected without all the games', resultWeights: {'halo': 2}, traitSignals: [{dimension: 'sentimental_thick_skinned', value: 1}] },
      ],
    },
    {
      id: 'q4',
      prompt: "Somebody you're into leans in and quietly says: “You have no idea what you do to me.” Your most honest internal reaction?",
      choices: [
        { id: 'a', label: 'Oh, I have some idea. 😏', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'playful_serious', value: 2}] },
        { id: 'b', label: 'Welp. There goes the rest of my ability to behave normally.', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: -1}] },
        { id: 'c', label: "I like hearing it, but I'm still deciding what happens next.", resultWeights: {'halo': 1}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
        { id: 'd', label: '“Then tell me.” 👀', resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'direct_indirect', value: 2}] },
      ],
    },
    {
      id: 'q5',
      prompt: "Pick the text you're MOST capable of sending when the chemistry is chemistry-ing.",
      choices: [
        { id: 'a', label: '“I had fun tonight 😊”', resultWeights: {'halo': 2}, traitSignals: [{dimension: 'tactful_blunt', value: 1}] },
        { id: 'b', label: "“So... are we just pretending that didn't happen?”", resultWeights: {'unlocked': 1}, traitSignals: [{dimension: 'direct_indirect', value: 1}] },
        { id: 'c', label: '“You need to stop.” (They do not need to stop.) 😭', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'playful_serious', value: 2}, {dimension: 'direct_indirect', value: -1}] },
        { id: 'd', label: '“Come over.”', resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'direct_indirect', value: 2}, {dimension: 'initiating_responsive', value: 2}] },
      ],
    },
    {
      id: 'q6',
      prompt: "You've been flirting with somebody all night. Nothing has technically happened. What would make the night feel the MOST satisfying?",
      choices: [
        { id: 'a', label: 'Knowing they wanted me too. Honestly, that can be enough.', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: -1}] },
        { id: 'b', label: "Them finally making the move I've been quietly waiting for", resultWeights: {'halo': 1}, traitSignals: [{dimension: 'initiating_responsive', value: -1}] },
        { id: 'c', label: 'Getting somewhere private enough that I can stop being quite so well-behaved 👀', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'd', label: "Me deciding we've done enough talking.", resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'initiating_responsive', value: 2}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone who knows your public personality accidentally learns a VERY private detail about you. Their reaction is: “YOU?!” How believable is that scenario?',
      choices: [
        { id: 'a', label: 'Not very. Public me and private me are pretty consistent.', resultWeights: {'halo': 2}, traitSignals: [{dimension: 'private_open', value: -1}] },
        { id: 'b', label: 'Extremely. Certain information is on a need-to-know basis. 😭', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'c', label: "Maybe. I'm not advertising everything, but I'm not exactly innocent either.", resultWeights: {'unlocked': 1}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'd', label: "They'd be surprised by the details, not by the fact that I have details. 😂", resultWeights: {'bad_decision': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: 1}] },
      ],
    },
    {
      id: 'q8',
      prompt: "You're with somebody you really want. They clearly want you too. But neither of you has actually said it. What usually happens?",
      choices: [
        { id: 'a', label: "I need them to make it obvious enough that I know I'm not misreading things.", resultWeights: {'halo': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}, {dimension: 'initiating_responsive', value: -1}] },
        { id: 'b', label: 'I let the tension build. Why would I rush the best part?', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'playful_serious', value: 2}] },
        { id: 'c', label: 'Once I feel safe with them, my shy/reserved setting may mysteriously disappear.', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'd', label: "At some point I'm going to make this situation less hypothetical.", resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'initiating_responsive', value: 2}, {dimension: 'direct_indirect', value: 1}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'Be honest. Which sentence could Apparently MOST reasonably use against you?',
      choices: [
        { id: 'a', label: '“You enjoy being wanted almost as much as you enjoy getting what you want.”', resultWeights: {'tension': 2} },
        { id: 'b', label: '“People who only know your daytime personality are missing several chapters.”', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'private_open', value: 2}] },
        { id: 'c', label: "“You have talked yourself OUT of things you absolutely wanted because the consequences weren't worth it.”", resultWeights: {'halo': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'd', label: "“Once you've decided you want something, your ability to produce excellent reasons for doing it becomes suspiciously impressive.” 😭", resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: -1}] },
      ],
    },
    {
      id: 'q10',
      prompt: 'Last one. The chemistry is ridiculous. The opportunity is there. Nobody is pressuring anybody. You want it. But tomorrow could get... complicated. Which voice usually wins?',
      choices: [
        { id: 'a', label: 'Tomorrow me has to live here too. Behave. 😇', resultWeights: {'halo': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'b', label: 'We can flirt with the idea without actually doing anything. 😏', resultWeights: {'tension': 2}, traitSignals: [{dimension: 'playful_serious', value: 1}] },
        { id: 'c', label: 'If I trust this person enough to let that side of me out, tomorrow is part of the calculation. 😈', resultWeights: {'unlocked': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}, {dimension: 'private_open', value: 1}] },
        { id: 'd', label: 'Tomorrow has had plenty of nights. Tonight gets one. 🔥', resultWeights: {'bad_decision': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: -2}] },
      ],
    },
  ],
};
