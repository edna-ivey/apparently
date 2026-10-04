import type { ArchetypeQuizDefinition } from './types';
export const STYLE_VIBE_INTIMIDATING_QUIZ: ArchetypeQuizDefinition = {
  id: 'style-vibe-intimidating',
  scoringType: 'archetype',
  category: 'Style & Vibe',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'Are you actually intimidating?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['People keep saying it. Let’s find out whether they’re scared of you... or just scared of your face. 😂'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR STYLE & VIBE MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q4', 'q6', 'q7', 'q9', 'q10'],
  tieFallbackOrder: ['approachable', 'face', 'evaluative', 'intimidating'],
  resultGates: {'intimidating': {'minSignals': 4, 'requiredAnyOf': [['q2-c', 'q3-d', 'q4-c', 'q5-c', 'q6-b', 'q8-c'], ['q7-c', 'q9-d', 'q10-d']]}, 'face': {'minSignals': 3, 'requiredAnyOf': [['q2-d', 'q5-b', 'q7-a', 'q9-a', 'q10-a']]}},
  archetypes: [
    {
      id: 'approachable',
      title: 'BABE. NOBODY IS SCARED OF YOU. 😂',
      structuredRead: {
        theRead: ['We have reviewed the allegations.', 'Apparently finds insufficient evidence of intimidation.', 'You might be confident.', 'You might be opinionated.', 'You might even have moments where you feel intimidating.', 'But your overall energy?', "People can probably tell you're a person.", '😂', "You're readable enough that people don't spend the first twenty minutes trying to determine whether you hate them.", 'You react.', 'You laugh.', 'You engage.', 'You give people something to work with.', "Even when you're direct, there's enough warmth, humor, openness, or general human activity happening around it that most people aren't sitting there thinking:", '“I need to be extremely careful around this person.”', "And if you've been privately telling yourself people are intimidated by you?", 'We should perhaps explore the possibility that they are simply...', 'busy.', '😭'],
        theCallOut: ["There is a tiny chance you've been using “I'm intimidating” to explain situations where somebody just didn't approach you, agree with you, flirt with you, invite you, or respond the way you expected.", 'Listen.', 'Sometimes people are intimidated.', 'And sometimes?', "They just didn't come over.", 'Apparently cannot let you turn every unanswered social mystery into evidence of your overwhelming presence.', '😂'],
        theCost: ["If you convince yourself people are scared of you when they aren't, you can accidentally become more guarded than the situation requires.", 'Then eventually?', 'Congratulations.', 'You actually will become intimidating.', 'Self-fulfilling prophecy achieved.'],
        tryThis: ["Assume you're approachable until someone gives you actual evidence otherwise.", "You don't need to shrink.", "You don't need to perform extra friendliness.", 'Just stop entering rooms with an invisible documentary narrator saying:', '“They fear her.”', "They probably don't.", "Apparently, you're delightful.", 'Relax.'],
      },
    },
    {
      id: 'face',
      title: "IT'S THE FACE. THE FACE IS DOING A LOT.",
      structuredRead: {
        theRead: ['Okay.', 'So...', 'We have located the problem.', '😂', 'You may be perfectly nice.', 'Unfortunately, nobody informed your face.', "Before you've said anything, people may already be receiving:", 'Do not disturb.', 'This better be important.', 'You have thirty seconds.', "I'm listening, but I'm disappointed.", 'Meanwhile, internally?', 'You could literally be wondering whether you left clothes in the washing machine.', '😭', 'Your intimidation factor seems to live heavily in presentation.', 'Your neutral expression.', 'Your posture.', 'How quietly you enter a room.', 'How long you observe before jumping in.', 'Your eye contact.', 'Your confidence.', 'Your lack of nervous social filler.', 'Maybe even the way you say a completely ordinary sentence like:', '“Okay.”', 'Apparently, your “okay” has lore.'],
        theCallOut: ['Now.', 'Before you start screaming:', "“THAT'S JUST MY FACE!”", 'We know.', '😂', 'But if multiple unrelated people keep independently reaching the same conclusion...', 'your face has apparently been conducting unauthorized public relations on your behalf.', "You don't have to change it.", 'You do, however, lose the right to be completely shocked every single time somebody says:', "“I thought you didn't like me at first.”", "Ma'am.", 'There is precedent.'],
        theCost: ['People may hesitate before giving you a chance to actually reject them.', "That's the weird part.", "You aren't necessarily pushing people away.", "Sometimes they're leaving before you've done anything at all.", 'That can mean fewer spontaneous conversations, fewer people approaching you, and people being unusually careful around you until they realize:', "Oh. She's actually cool.", 'Which is flattering...', 'eventually.'],
        tryThis: ['You do not need to become bubbly.', "Please don't start aggressively smiling at strangers because Apparently said something.", '😭', 'Just become slightly more legible when you want connection.', 'Say hello first.', 'Let the laugh out.', 'Ask the question.', 'Give the tiny signal that says:', '“You may approach the exhibit.”', "Because apparently you're not nearly as scary as your face has been advertising."],
      },
    },
    {
      id: 'evaluative',
      title: "YOU'RE NOT INTIMIDATING. YOU'RE HARD TO IMPRESS.",
      structuredRead: {
        theRead: ['Ahhh.', 'There it is.', '👀', "People aren't necessarily afraid you're going to be mean.", "They're afraid you're going to notice.", 'You pay attention.', 'Effort.', 'Competence.', 'Consistency.', 'Details.', "Whether somebody actually knows what they're talking about.", 'Whether the story makes sense.', 'Whether the work is good.', 'Whether the apology matches the behavior.', 'Whether somebody is doing what they said they were going to do.', 'And apparently?', 'People can feel that.', 'You may not even say anything.', "Sometimes all you've contributed is:", '“Hmm.”', 'And suddenly somebody is explaining themselves in significantly more detail than you requested.', '😂', 'Your presence can make people want to bring their A game.', "Not because you're walking around terrorizing everybody.", "Because your approval doesn't feel automatic."],
        theCallOut: ["Let's not make this entirely flattering.", 'Because being discerning and being chronically unimpressed are not the same thing.', '👀', 'There are moments when your standards may quietly turn into a test nobody knew they were taking.', 'Somebody does something well.', 'You notice what could have been better.', 'Somebody makes progress.', "You notice what's unfinished.", 'Somebody tells a story.', "You're checking whether the details line up.", "And sometimes the person in front of you isn't nervous because you're powerful.", "They're nervous because being around you can feel like submitting something for review.", 'Apparently has comments.', '😭'],
        theCost: ['People may start showing you only their polished version.', 'Their best work.', 'Their strongest argument.', 'Their least embarrassing opinion.', 'Which sounds great until you realize:', "You may be getting fewer people's real selves.", 'If someone constantly feels evaluated, eventually they stop experimenting around you.', 'They stop being messy.', "They stop admitting they don't know.", 'They stop bringing you unfinished thoughts.', 'And intimacy, friendship, creativity, and trust require a surprising amount of unfinished material.'],
        tryThis: ['Keep your standards.', "Just occasionally let people know when they've already cleared them.", 'Say:', '“That was good.”', '“You handled that well.”', '“I trust your judgment.”', "“I don't agree, but I get why you think that.”", "Because people shouldn't have to study your face like they're waiting for SAT scores.", "Apparently, approval doesn't become less valuable because you actually give some out."],
      },
    },
    {
      id: 'intimidating',
      title: 'OH. YOU ACTUALLY ARE INTIMIDATING.',
      structuredRead: {
        theRead: ['Well.', 'This is awkward.', '😂', 'Apparently conducted the investigation expecting to tell you everybody was exaggerating.', 'They were not.', 'You actually have some intimidating habits.', 'You say what you think.', 'You ask the question other people were politely planning to avoid.', "You don't seem particularly desperate to be liked.", "If something doesn't make sense, your face may say so before your mouth catches up.", 'And then sometimes your mouth catches up too.', '😭', 'You may challenge people.', 'Correct things.', 'Hold your ground.', 'Expect competence.', 'Maintain eye contact.', 'Say no without submitting a supporting essay.', 'And when someone brings nonsense into your vicinity?', 'Your instinct is not always:', '“How can I make this interaction feel comfortable?”', "Sometimes it's:", '“Why are we doing this?”', 'That will, in fact, intimidate some people.'],
        theCallOut: ["Now don't get excited.", '😂', 'Because intimidating is not automatically a compliment.', "There is a version of this that's confidence.", "There's a version that's leadership.", "There's a version that's boundaries.", "There's a version that's refusing to make yourself smaller so everybody else feels bigger.", 'Great.', "There is also a version where people can't relax around you.", 'Where disagreement feels expensive.', 'Where people rehearse conversations before bringing you something.', 'Where someone makes a minor mistake and immediately prepares a legal defense.', 'If that version sounds familiar?', "That's not everybody else being weak.", "That's feedback."],
        theCost: ['The strongest person in the room can accidentally become the person nobody tells the truth to.', "That's the danger.", 'People may respect you and still withhold things from you.', 'They may admire you and still avoid bringing you problems.', 'They may want your approval so badly that they tell you what they think you want to hear.', 'And then your strength starts costing you information.', "That's a terrible trade."],
        tryThis: ["Don't become smaller.", 'Become safer.', "There's a difference.", 'You can be direct and still make disagreement survivable.', 'You can have standards and still let people learn in front of you.', 'You can say no without making somebody regret asking.', 'You can be powerful without requiring everybody around you to brace for impact.', 'Because yes.', 'Apparently, you are intimidating.', "The question isn't whether you should stop.", "It's whether the people you actually care about know they don't have to be afraid of getting it wrong around you.", "And if you're reading this thinking:", "“They're not afraid of me.”", '...', 'Maybe ask them.', '👀'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You're in a room full of people you don't know. Someone catches your eye. What happens?",
      choices: [
        { id: 'a', label: "Little smile or nod. We're strangers, not enemies. 😂", resultWeights: {'approachable': 1}, traitSignals: [{dimension: 'tactful_blunt', value: 1}] },
        { id: 'b', label: 'I hold eye contact for a second, then go back to what I was doing.', resultWeights: {'face': 1}, traitSignals: [{dimension: 'self_secure_reassurance', value: 1}] },
        { id: 'c', label: "Honestly? Probably nothing. I don't think about what my face is doing.", resultWeights: {'face': 2}, traitSignals: [{dimension: 'private_open', value: 1}] },
        { id: 'd', label: "I usually say something first if there's an opening.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'private_open', value: -1}] },
      ],
    },
    {
      id: 'q2',
      prompt: "Somebody is explaining something to you and you realize... they have absolutely no idea what they're talking about.",
      choices: [
        { id: 'a', label: 'I ask a question that gives them a chance to realize it themselves.', resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'tactful_blunt', value: 2}, {dimension: 'supportive_challenging', value: -1}] },
        { id: 'b', label: "I let them finish. This isn't important enough to embarrass anybody over.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'tactful_blunt', value: 1}] },
        { id: 'c', label: "“That's not right.” We can skip the ceremony.", resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'direct_indirect', value: 2}, {dimension: 'tactful_blunt', value: -1}] },
        { id: 'd', label: "I don't even have to say anything. Apparently my face has entered the conversation. 😭", resultWeights: {'face': 2} },
      ],
    },
    {
      id: 'q3',
      prompt: "A coworker/friend says: “I was nervous to tell you because I thought you'd be mad.” Your FIRST thought?",
      choices: [
        { id: 'a', label: "“Why would you think I'd be mad?”", resultWeights: {'face': 1} },
        { id: 'b', label: '“Okay... what did you do?” 👀', resultWeights: {'evaluative': 1}, traitSignals: [{dimension: 'social_attunement', value: 1}] },
        { id: 'c', label: "I immediately wonder whether I've made it hard for them to bring me things.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'perspective_taking_self_referencing', value: 2}, {dimension: 'accountability_defensiveness', value: 1}] },
        { id: 'd', label: "“You should've just told me.” I don't have patience for the buildup.", resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'direct_indirect', value: 1}, {dimension: 'tactful_blunt', value: -1}] },
      ],
    },
    {
      id: 'q4',
      prompt: "Someone shows you something they're REALLY proud of. It's... fine. What happens?",
      choices: [
        { id: 'a', label: "I find what they did well and celebrate that. They're proud. Let them have it.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'supportive_challenging', value: 2}] },
        { id: 'b', label: 'I say something nice, but apparently my enthusiasm has a strict authenticity policy. 😂', resultWeights: {'face': 1} },
        { id: 'c', label: "If they ask what I think, I'm going to tell them what I think.", resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'tactful_blunt', value: -2}] },
        { id: 'd', label: "My brain immediately notices what would make it better, even if I don't say it.", resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'supportive_challenging', value: -1}] },
      ],
    },
    {
      id: 'q5',
      prompt: "You're annoyed with somebody, but you're trying NOT to make it a thing. How successful are you?",
      choices: [
        { id: 'a', label: "Very. If I say we're good, we're good.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'control_allowing', value: -1}] },
        { id: 'b', label: "My words say we're fine. My face has apparently released a separate statement.", resultWeights: {'face': 2} },
        { id: 'c', label: "Why am I pretending we're good if we're not? We're talking about it.", resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'conflict_peacekeeping', value: 2}, {dimension: 'direct_indirect', value: 1}] },
        { id: 'd', label: "I can stay pleasant, but I'm definitely quieter until I've decided whether it matters.", resultWeights: {'evaluative': 1}, traitSignals: [{dimension: 'reflective_reactive', value: 1}] },
      ],
    },
    {
      id: 'q6',
      prompt: "Someone disagrees with you in front of everybody. Not disrespectfully. They just think you're wrong.",
      choices: [
        { id: 'a', label: 'Good. Tell me why.', resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}, {dimension: 'independent_collaborative', value: -1}] },
        { id: 'b', label: 'I push back. If you disagree, come with an argument.', resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'supportive_challenging', value: -2}] },
        { id: 'c', label: "I'll debate it, but I'm probably smiling or joking while we do it.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'playful_serious', value: 1}] },
        { id: 'd', label: "Depends whether they actually know what they're talking about. 👀", resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}, {dimension: 'supportive_challenging', value: -1}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Which thing has happened to you MORE than once?',
      choices: [
        { id: 'a', label: 'Someone says, “I thought you were mean before I got to know you.”', resultWeights: {'face': 2} },
        { id: 'b', label: 'People ask for my opinion and then immediately start explaining themselves. 😂', resultWeights: {'evaluative': 2} },
        { id: 'c', label: 'Somebody tells me later they were nervous to bring something to me.', resultWeights: {'intimidating': 2} },
        { id: 'd', label: 'People I barely know start telling me their entire life story.', resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'private_open', value: -2}] },
      ],
    },
    {
      id: 'q8',
      prompt: 'Somebody makes a small mistake that affects you. Which reaction is closest?',
      choices: [
        { id: 'a', label: "“It's fine. Just fix it.” And I genuinely move on.", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'forgiving_receipts', value: 1}] },
        { id: 'b', label: "I want to know how it happened so it doesn't happen again.", resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}] },
        { id: 'c', label: "I'm irritated, and they're probably going to know I'm irritated.", resultWeights: {'intimidating': 2}, traitSignals: [{dimension: 'direct_indirect', value: 1}] },
        { id: 'd', label: "I joke about it unless it keeps happening. Then we're having a different conversation.", resultWeights: {'approachable': 1}, traitSignals: [{dimension: 'playful_serious', value: 1}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'Be serious. When somebody is talking to you and suddenly starts... overexplaining, backtracking, or adding evidence nobody asked for... what do you think is happening?',
      choices: [
        { id: 'a', label: 'I probably looked skeptical. 😭', resultWeights: {'face': 2}, traitSignals: [{dimension: 'social_attunement', value: 1}] },
        { id: 'b', label: "They know I'm going to ask questions if something doesn't add up.", resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'trust_verify', value: -2}] },
        { id: 'c', label: "I usually try to rescue them. “You're good. I get what you mean.”", resultWeights: {'approachable': 2}, traitSignals: [{dimension: 'supportive_challenging', value: 1}, {dimension: 'tactful_blunt', value: 1}] },
        { id: 'd', label: "Maybe they're nervous. People occasionally get weird around me.", resultWeights: {'intimidating': 1} },
      ],
    },
    {
      id: 'q10',
      prompt: 'Someone who knows you VERY well says: “Sometimes people are intimidated by you.” Which response sounds most like you?',
      choices: [
        { id: 'a', label: "“I know. I don't mean to be, but I've heard that my whole life.”", resultWeights: {'face': 2} },
        { id: 'b', label: '“Intimidated by WHAT?!” 😂', resultWeights: {'approachable': 2} },
        { id: 'c', label: "“They're probably not intimidated. They just know I'm paying attention.”", resultWeights: {'evaluative': 2}, traitSignals: [{dimension: 'trust_verify', value: -1}] },
        { id: 'd', label: "“Okay. But do you ever feel like you can't tell me something?”", resultWeights: {'intimidating': 1, 'approachable': 1}, traitSignals: [{dimension: 'perspective_taking_self_referencing', value: 2}] },
      ],
    },
  ],
};
