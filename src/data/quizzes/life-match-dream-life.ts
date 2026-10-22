import type { ArchetypeQuizDefinition } from './types';
export const LIFE_MATCH_DREAM_LIFE_QUIZ: ArchetypeQuizDefinition = {
  id: 'life-match-dream-life',
  scoringType: 'archetype',
  category: 'Life Match',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'Would your dream life actually fit you?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['You know what looks good. We’re asking whether you’d actually like living there. 👀'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR LIFE MATCH MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q3', 'q5', 'q6', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['fit', 'lifestyle', 'relief', 'borrowed'],
  resultGates: {'borrowed': {'minSignals': 3, 'requiredAnyOf': [['q3-d', 'q6-d', 'q9-a', 'q10-c']]}, 'relief': {'minSignals': 3, 'requiredAnyOf': [['q5-a', 'q7-b', 'q8-d', 'q9-c', 'q10-d']]}},
  archetypes: [
    {
      id: 'fit',
      title: 'WAIT... YOU MIGHT ACTUALLY LIKE YOUR DREAM LIFE.',
      structuredRead: {
        theRead: ['Well.', 'This is inconveniently responsible of you. 😂', "Apparently, you didn't just build your dream life out of Pinterest boards, vacation pictures, and things that look good when somebody else has them.", 'You actually seem to understand what living there would require.', 'Your dream has survived contact with reality.', "You aren't only imagining the house.", "You've considered the maintenance.", "You aren't only imagining the freedom.", "You've considered what you'd actually do with your time.", "You aren't only imagining success.", "You've considered what an ordinary Wednesday looks like after success stops feeling new.", 'And most importantly?', 'The person in your fantasy still resembles you.', 'Not some suspicious future version of you who wakes up at 5 a.m., loves networking, enjoys gardening, hosts dinner parties twice a week, maintains twelve acres, works out six days a week, travels constantly, runs three businesses, and somehow finds all of this deeply relaxing.', '😂', 'You seem to want a life that actually fits your temperament, priorities, energy, and preferred pace.', "That's rarer than you'd think."],
        theCallOut: ["Don't become so committed to the blueprint that you miss a better version of the dream.", 'Knowing yourself is useful.', 'Predicting your entire future down to the furniture is not.', "You are allowed to discover that something you wanted five years ago doesn't fit anymore.", "That isn't failure.", "That's updated information."],
        theCost: ["Your biggest risk isn't building the wrong life.", "It's spending so long trying to build the exact life you pictured that you fail to notice when you've already created something pretty damn good.", 'The dream can become a finish line that keeps moving every time you get close.'],
        tryThis: ['Keep the dream.', 'Just separate the requirements from the decorations.', 'Ask:', '“What parts of this life actually make me happy?”', 'Protect those.', 'Everything else is negotiable.', 'Because apparently?', 'You might not need a completely different life.', 'You may just need to keep building the one that actually fits you.'],
      },
    },
    {
      id: 'lifestyle',
      title: 'YOU WANT THE LIFE. JUST... NOT THE LIFESTYLE.',
      structuredRead: {
        theRead: ['Ohhh.', 'You would love owning the farm.', 'We are less convinced you would enjoy...', 'farming.', '😭', 'And there appears to be a little of that happening here.', 'Your dream itself makes perfect sense.', 'The problem is everything apparently included in the terms of service.', 'You want the gorgeous house.', 'Not twelve rooms asking to be cleaned.', 'You want the successful business.', 'Not employees texting you because somebody called out.', 'You want to travel constantly.', 'Not airports, packing, delays, laundry, planning, and figuring out where the hell your charger went.', 'You want the perfect body.', "Not necessarily the Tuesday workout when you're tired and absolutely nobody is impressed.", 'You want the big family.', "Potentially fewer opinions, schedules, appointments, dishes, and people asking what's for dinner.", '😂', "You aren't necessarily chasing the wrong things.", 'But you may be consistently underestimating what those things feel like to maintain.'],
        theCallOut: ['You have been evaluating your dream by its highlights.', 'Apparently would like to introduce you to its administrative department.', 'Because every lifestyle comes with chores.', 'Even the beautiful ones.', 'Especially the beautiful ones.', 'And if you hate the daily machinery required to keep a life running, eventually the thing you prayed for starts feeling suspiciously like another obligation.'],
        theCost: ['You could spend years getting exactly what you wanted...', "only to discover that your reward is maintaining something you don't actually enjoy living inside.", "That's a particularly rude form of success.", 'You won.', "And now you're annoyed every day.", '😭'],
        tryThis: ['Stop asking only:', '“Do I want this?”', 'Ask:', '“Do I want the average Tuesday that comes with this?”', 'The house has a Tuesday.', 'The career has a Tuesday.', 'The marriage has a Tuesday.', 'The body has a Tuesday.', 'The lifestyle has a Tuesday.', 'If you still want it on Tuesday?', 'Okay.', "Now we're talking."],
      },
    },
    {
      id: 'relief',
      title: "YOU DON'T WANT A NEW LIFE. YOU WANT RELIEF.",
      structuredRead: {
        theRead: ['Oh.', 'Baby.', 'You might just be tired.', '😭', 'Because Apparently asked about your dream life and you kept describing variations of:', '“Nobody needs anything from me.”', 'Interesting.', 'Your fantasy may not actually be about yachts, mountains, beaches, cabins, money, travel, or disappearing to a small town where nobody knows your name.', 'It may be about relief.', 'Relief from pressure.', 'Relief from bills.', 'Relief from expectations.', 'Relief from responsibilities.', 'Relief from being needed.', 'Relief from always having something else you should be doing.', 'You may fantasize about an entirely different life because imagining one is easier than figuring out which parts of your current life are draining the hell out of you.', "And suddenly that cabin in Montana isn't really about Montana.", "It's about nobody emailing you.", '😭'],
        theCallOut: ["Here's where Apparently gets annoying.", 'If what you actually need is rest, boundaries, help, money, support, fewer commitments, or permission to stop doing something...', 'a whole new life is an extremely expensive solution.', 'You can change cities and still overcommit.', 'Make more money and still never stop working.', 'Quit the job and immediately fill the empty space with seventeen new obligations.', 'Move to the beach and somehow still become the person everybody calls when something goes wrong.', 'Because unfortunately?', 'You are coming with you. 👀'],
        theCost: ['When exhaustion gets mistaken for dissatisfaction, you can start resenting things you might actually love under better conditions.', 'Your work.', 'Your home.', 'Your relationships.', 'Your city.', 'Your routines.', 'Maybe even your whole life.', "Not because they're all wrong.", "Because you're experiencing all of them while depleted.", 'And depleted people understandably have very strong opinions about escaping.'],
        tryThis: ['Before blowing up the blueprint, ask:', '“What exactly am I trying to get away from?”', 'Name it.', 'Not “my life.”', 'The actual thing.', 'The schedule?', 'The debt?', 'The responsibility?', 'The noise?', 'The expectations?', 'The lack of help?', 'Because your dream life might be trying to tell you something.', 'Just maybe not:', '“Move to Italy.”', '😂'],
      },
    },
    {
      id: 'borrowed',
      title: 'BABE, THAT DREAM BELONGS TO SOMEBODY ELSE.',
      structuredRead: {
        theRead: ['Well...', 'Whose vision board is this?', '👀', 'Because Apparently has a few questions.', 'Your dream life looks great.', "That's actually part of the problem.", 'It photographs beautifully.', 'It sounds impressive when you describe it.', 'Other people would understand why you wanted it.', 'There are recognizable signs that you have, officially, made it.', 'The right house.', 'The right career.', 'The right money.', 'The right body.', 'The right relationship.', 'The right vacations.', 'The right neighborhood.', 'The right version of adulthood.', 'Very nice.', 'One small administrative question:', 'Do YOU actually want to live there?', '😭', 'Because some of your dream may have been assembled from things you learned were desirable before you ever stopped to ask whether they were desirable to you.'],
        theCallOut: ['You may be better at recognizing a good life than recognizing your life.', 'Those are different skills.', "Maybe you don't actually want the giant house.", 'Maybe you want financial security.', "Maybe you don't want to be the boss.", 'Maybe you want autonomy.', "Maybe you don't want to travel constantly.", "Maybe you just don't want your entire year controlled by a work calendar.", "Maybe you don't need everybody to think you've done something extraordinary.", 'Maybe you want to pick your kids up at 3:00, cook something good, sit on your ridiculously comfortable couch, and be left alone.', 'And if that made you happier?', 'Why exactly would it count less?', 'Also...', 'If removing the audience makes your dream significantly less exciting?', 'We found something. 😂', "That doesn't mean you're fake.", 'Everybody absorbs ideas about what success, beauty, adulthood, marriage, wealth, parenting, and happiness are supposed to look like.', "But eventually you have to decide which ones you're keeping.", 'Otherwise you can spend your whole life successfully becoming somebody you never independently chose to be.'],
        theCost: ['A borrowed dream can keep you moving for years.', "That's what makes it dangerous.", 'You can achieve it.', 'Be congratulated for it.', 'Post it.', 'Decorate it.', 'Defend it.', 'And still have this tiny irritating thought:', '“Why am I not happier?”', 'Because achievement cannot make an incompatible life fit.'],
        tryThis: ['Take your dream and remove every part whose primary value is being seen.', 'Then remove everything you only want because you think you should want it.', "Now look at what's left.", 'That quieter version?', "That may be the first time we've actually met your dream life.", 'Apparently, you should probably introduce yourself.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You wake up tomorrow and you're rich enough that you never HAVE to work again. Six months later, what are you probably doing?",
      choices: [
        { id: 'a', label: 'Building, learning, working on something. Apparently I need a mission.', resultWeights: {'fit': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'b', label: "Traveling, relaxing, doing whatever I feel like. That's literally the dream.", resultWeights: {'lifestyle': 1}, traitSignals: [{dimension: 'planner_spontaneous', value: -1}] },
        { id: 'c', label: "Finally handling all the things I've been too tired or busy to deal with. 😭", resultWeights: {'relief': 2} },
        { id: 'd', label: 'Living beautifully enough that people are asking, “Wait... what does she DO?”', resultWeights: {'borrowed': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
      ],
    },
    {
      id: 'q2',
      prompt: "Your dream house is yours. It's gorgeous. Huge. Exactly what you pictured. Plot twist: you have to maintain it.",
      choices: [
        { id: 'a', label: 'Wait. How many bathrooms did I apparently need?', resultWeights: {'lifestyle': 2}, traitSignals: [{dimension: 'practical_idealistic', value: 2}] },
        { id: 'b', label: 'Fine. The house is part of the life I actually want.', resultWeights: {'fit': 2}, traitSignals: [{dimension: 'practical_idealistic', value: 1}] },
        { id: 'c', label: "I'm hiring people. Why are we acting like I bought a mansion to mop it? 😂", resultWeights: {'fit': 1}, traitSignals: [{dimension: 'practical_idealistic', value: 1}] },
        { id: 'd', label: 'Honestly, I mostly want somewhere peaceful that nobody needs anything from me.', resultWeights: {'relief': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -1}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Pick the life that sounds best if nobody will ever see pictures of it.',
      choices: [
        { id: 'a', label: 'Quiet, comfortable, financially secure, plenty of free time', resultWeights: {'fit': 2}, traitSignals: [{dimension: 'ambitious_content', value: -1}] },
        { id: 'b', label: 'Busy, exciting, ambitious, always something happening', resultWeights: {'fit': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}, {dimension: 'adventure_comfort', value: 1}] },
        { id: 'c', label: 'Beautiful home, beautiful places, beautiful experiences', resultWeights: {'lifestyle': 1}, traitSignals: [{dimension: 'adventure_comfort', value: 1}] },
        { id: 'd', label: "I don't know. Removing the audience made this question weirdly harder. 👀", resultWeights: {'borrowed': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
      ],
    },
    {
      id: 'q4',
      prompt: "Your dream requires a schedule you cannot escape. Maybe it's running a business, maintaining land, traveling constantly, raising six kids, managing investments, staying fit, whatever. Your reaction?",
      choices: [
        { id: 'a', label: "If I love the life, I'll build the routine around it.", resultWeights: {'fit': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: 1}] },
        { id: 'b', label: 'Wait. My dream has recurring tasks?? 😭', resultWeights: {'lifestyle': 2}, traitSignals: [{dimension: 'planner_spontaneous', value: -1}] },
        { id: 'c', label: 'I can handle structure. I just need enough freedom inside it.', resultWeights: {'fit': 1}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
        { id: 'd', label: "This is sounding suspiciously like the life I'm trying to get away from.", resultWeights: {'relief': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
      ],
    },
    {
      id: 'q5',
      prompt: 'Be serious. When you say “I just want a simple life,” what do you actually mean?',
      choices: [
        { id: 'a', label: 'Fewer obligations. Fewer people needing things. Less pressure.', resultWeights: {'relief': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'b', label: 'A genuinely smaller, slower life. I would choose that even rested and happy.', resultWeights: {'fit': 2}, traitSignals: [{dimension: 'ambitious_content', value: -2}, {dimension: 'adventure_comfort', value: -1}] },
        { id: 'c', label: 'Simple... but with excellent food, travel, money, a beautiful house, and several conveniences. 😂', resultWeights: {'lifestyle': 2}, traitSignals: [{dimension: 'practical_idealistic', value: -1}] },
        { id: 'd', label: "I don't want simple. I want control over what gets my energy.", resultWeights: {'fit': 1}, traitSignals: [{dimension: 'independent_collaborative', value: 1}] },
      ],
    },
    {
      id: 'q6',
      prompt: 'You get your dream life, but after a year it becomes completely NORMAL. Nobody is impressed anymore. You wake up there every day. Now what?',
      choices: [
        { id: 'a', label: 'Good. I built it to live in, not stare at.', resultWeights: {'fit': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}] },
        { id: 'b', label: "I think I'd immediately start dreaming about the next upgrade.", resultWeights: {'lifestyle': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'c', label: "If my day-to-day feels good, I don't care that it stopped feeling exciting.", resultWeights: {'fit': 2}, traitSignals: [{dimension: 'ambitious_content', value: -1}] },
        { id: 'd', label: "That's uncomfortable. Part of the appeal was definitely how special it felt.", resultWeights: {'borrowed': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'You can permanently delete ONE thing from your current life. Which disappearance feels the most like freedom?',
      choices: [
        { id: 'a', label: 'Financial stress', resultWeights: {'relief': 1}, traitSignals: [{dimension: 'practical_idealistic', value: 1}] },
        { id: 'b', label: "Other people's demands on my time", resultWeights: {'relief': 2}, traitSignals: [{dimension: 'duty_first_self_preserving', value: -2}] },
        { id: 'c', label: 'Boring responsibilities and chores', resultWeights: {'lifestyle': 1}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
        { id: 'd', label: "Feeling like I'm behind where I should be", resultWeights: {'borrowed': 1, 'relief': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}, {dimension: 'perspective_taking_self_referencing', value: -1}] },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your dream life gives you everything you asked for. It also makes you busier than you are now. What happens?',
      choices: [
        { id: 'a', label: "If it's meaningful busy, I can live with that.", resultWeights: {'fit': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'b', label: 'Absolutely not. We have misunderstood the assignment. 😂', resultWeights: {'lifestyle': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -2}] },
        { id: 'c', label: 'Depends. Do I still control my time?', resultWeights: {'fit': 1}, traitSignals: [{dimension: 'independent_collaborative', value: 2}] },
        { id: 'd', label: 'I would be low-key furious. I thought the dream was supposed to make life easier.', resultWeights: {'relief': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}, {dimension: 'duty_first_self_preserving', value: -1}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which sentence feels a LITTLE too personal?',
      choices: [
        { id: 'a', label: "“Sometimes you don't want the thing. You want what you think the thing says about you.”", resultWeights: {'borrowed': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'b', label: '“You keep designing a future version of yourself who enjoys things current-you has never enjoyed.”', resultWeights: {'lifestyle': 2}, traitSignals: [{dimension: 'practical_idealistic', value: -1}] },
        { id: 'c', label: "“Half your fantasies begin immediately after you've had a terrible week.” 😭", resultWeights: {'relief': 2} },
        { id: 'd', label: "“You might actually know yourself better than we're giving you credit for.”", resultWeights: {'fit': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 1}] },
      ],
    },
    {
      id: 'q10',
      prompt: "Apparently offers you a deal. You can have a life that feels perfect to you... but from the outside? It's not particularly impressive. Nobody envies you. Nobody says, “I want your life.” Nobody is surprised by what you have. Deal?",
      choices: [
        { id: 'a', label: "Immediately. They're not the ones living it.", resultWeights: {'fit': 2}, traitSignals: [{dimension: 'self_secure_reassurance', value: 2}, {dimension: 'ambitious_content', value: -1}] },
        { id: 'b', label: 'Yes... but apparently I need a minute to mourn the flex. 😂', resultWeights: {'fit': 1, 'borrowed': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: "I genuinely don't know. Being proud of what I've built matters to me.", resultWeights: {'borrowed': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}, {dimension: 'ambitious_content', value: 1}] },
        { id: 'd', label: "That depends. Does it actually feel peaceful? Because THAT'S what I'm after.", resultWeights: {'relief': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
      ],
    },
  ],
};
