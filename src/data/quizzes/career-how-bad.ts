import type { ArchetypeQuizDefinition } from './types';
export const CAREER_HOW_BAD_QUIZ: ArchetypeQuizDefinition = {
  id: 'career-ambition-how-bad',
  scoringType: 'archetype',
  category: 'Career & Ambition',
  access: 'private',
  contributesToProfile: true,
  answerLevelPersonalityEvidence: true,
  title: 'How bad do you actually want it?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Everybody wants the life. Fewer people want the Tuesday.'],
  meta: '10 questions · About 3 min',
  introCta: 'Expose me →',
  mixLabel: 'YOUR CAREER & AMBITION MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['want-it-for-real', 'comfort-keeps-winning', 'talk-great-game', 'lazy-there-we-said-it'],
  resultGates: {'lazy-there-we-said-it': {'minSignals': 3}},
  archetypes: [
    {
      id: 'want-it-for-real',
      title: 'YOU WANT IT FOR REAL',
      structuredRead: {
        theRead: ['You’re not just fantasizing.', 'You can tolerate boring work, delayed payoff, failure, repetition, and being unimpressive while you learn.', 'That puts you ahead of a lot of people who are very committed to the vision board and considerably less committed to Tuesday.'],
        theCallOut: ['Your problem probably isn’t effort.', 'It’s knowing when enough is enough.', 'You can absolutely work yourself into a life you’re too tired to enjoy.'],
        theCost: [],
        tryThis: [],
      },
    },
    {
      id: 'comfort-keeps-winning',
      title: 'YOU WANT IT, BUT COMFORT KEEPS WINNING',
      structuredRead: {
        theRead: ['You are ambitious.', 'Until ambition becomes inconvenient.', 'You want growth, but you also want certainty, sleep, peace, approval, free time, low risk, and ideally a guarantee that none of this will be embarrassing.', 'Respectfully...', 'pick a struggle. 😂', 'You don’t need to destroy your life to succeed.', 'But you do need to stop treating every uncomfortable feeling like evidence that something is wrong.'],
        theCallOut: ['Sometimes “protecting my peace” is wisdom.', 'Sometimes it is fear wearing a really good outfit.', 'You need to know which one is talking.'],
        theCost: [],
        tryThis: [],
      },
    },
    {
      id: 'talk-great-game',
      title: 'YOU TALK A GREAT GAME',
      structuredRead: {
        theRead: ['Oh, you can describe the life.', 'The business. The promotion. The money. The freedom. The body. The degree. The launch. The version of you who finally gets serious.', 'You have speeches.', 'What you don’t currently have is enough behavior to back them up.', '👀', 'You may genuinely believe you want this.', 'But your calendar, habits, follow-through, and tolerance for boring work are voting against you.', 'And unfortunately, your habits get more votes than your intentions.'],
        theCallOut: ['You keep falling in love with beginnings.', 'New plan. New system. New idea. New burst of motivation.', 'Then the novelty wears off and suddenly the goal “isn’t aligned anymore.”', 'Sure. 😂', 'At some point you have to ask whether you keep discovering better paths...', 'or whether you just really enjoy escaping the boring part.'],
        theCost: ['You will always feel like you are almost becoming the person you want to be.', 'Always reaching.', 'Always planning.', 'Always “about to.”', 'Because you talk the game, but you don’t consistently walk it.'],
        tryThis: ['Pick one thing.', 'Not five.', 'Finish it after it stops being exciting.', 'That is the assignment.'],
      },
    },
    {
      id: 'lazy-there-we-said-it',
      title: 'LAZY. THERE, WE SAID IT.',
      structuredRead: {
        theRead: ['Okay.', 'You wanted Private. 😭', 'Right now?', 'You are being lazy about the life you say you want.', 'Not incapable.', 'Not untalented.', 'Not doomed.', 'Lazy.', 'There is a difference.', 'You want results that require effort you keep deciding you don’t feel like giving.', 'You want motivation before action.', 'You want progress without monotony.', 'You want the payoff while repeatedly renegotiating the price.', 'And eventually we have to stop calling that “waiting for the right time.”'],
        theCallOut: ['You know what to do.', 'That may actually be the most annoying part.', 'You probably do not need another planner.', 'Another podcast.', 'Another productivity method.', 'Another “fresh start Monday.”', 'You need to get off your butt and do the thing. 😂'],
        theCost: ['If nothing changes, you are going to keep watching people with less talent pass you because they were willing to be consistent while you were waiting to feel inspired.', 'That one stings because it’s true.'],
        tryThis: ['Do one boring thing toward your goal today.', 'Not research.', 'Not planning.', 'Not organizing the research about the plan.', 'Work.', 'Then do it again tomorrow.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Pick your poison. Your goal requires ONE of these for the next six months. Which one makes you hesitate most?',
      choices: [
        { id: 'a', label: 'Giving up a chunk of my free time', resultWeights: {'comfort-keeps-winning': 1}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
        { id: 'b', label: 'Being visibly bad at something before I get good', resultWeights: {'talk-great-game': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: 'Doing boring, repetitive work with no guarantee it pays off', resultWeights: {'comfort-keeps-winning': 1}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
        { id: 'd', label: 'Having people watch me try and possibly fail', resultWeights: {'talk-great-game': 1}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your big break shows up looking absolutely nothing like you pictured it. Less glamorous. More work. Same destination. What are you doing?',
      choices: [
        { id: 'a', label: 'Taking it. I asked for the destination, not the aesthetic.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}, {dimension: 'practical_idealistic', value: 1}] },
        { id: 'b', label: 'Taking it… while quietly being mad that this is apparently how we’re getting there.', resultWeights: {'want-it-for-real': 1, 'comfort-keeps-winning': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'c', label: 'Hesitating. Part of what I wanted was the version I imagined.', resultWeights: {'comfort-keeps-winning': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
        { id: 'd', label: 'Honestly? If it looks this miserable, I’m reconsidering the whole dream.', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which sentence would Apparently most likely find in your group chat?',
      choices: [
        { id: 'a', label: '“I haven’t told anybody yet. I want to see if I can actually pull it off first.”', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'b', label: '“Okay, hear me out. I have ANOTHER idea.”', resultWeights: {'talk-great-game': 2} },
        { id: 'c', label: '“I know what I need to do. I just need to get myself to do it.”', resultWeights: {'comfort-keeps-winning': 2, 'talk-great-game': 1}, traitSignals: [{dimension: 'accountability_defensiveness', value: 1}, {dimension: 'ambitious_content', value: 1}] },
        { id: 'd', label: '“At this point, I’m tired. I’ll figure it out later.”', resultWeights: {'lazy-there-we-said-it': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
      ],
    },
    {
      id: 'q4',
      prompt: 'You work your ass off on something and it FLOPS. Publicly. Spectacularly. What hurts the most?',
      choices: [
        { id: 'a', label: 'All that effort for nothing.', resultWeights: {'comfort-keeps-winning': 1} },
        { id: 'b', label: 'Everybody seeing me fail.', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -1}] },
        { id: 'c', label: 'Realizing I might have chosen the wrong strategy.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'reflective_reactive', value: 1}, {dimension: 'practical_idealistic', value: 1}] },
        { id: 'd', label: 'Having to start all over again.', resultWeights: {'comfort-keeps-winning': 1} },
      ],
    },
    {
      id: 'q5',
      prompt: 'Somebody hands you $10 million tomorrow. Be serious: does the dream survive?',
      choices: [
        { id: 'a', label: 'Absolutely. Now I can do it without worrying about money.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'ambitious_content', value: 2}] },
        { id: 'b', label: 'Yes, but I’m definitely doing it at a much more relaxed pace.', resultWeights: {'want-it-for-real': 1, 'comfort-keeps-winning': 1}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'c', label: 'Maybe not. Apparently the money was doing more heavy lifting than I thought.', resultWeights: {'talk-great-game': 2} },
        { id: 'd', label: 'Depends on the dream. Some things I want because of what they would prove.', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
      ],
    },
    {
      id: 'q6',
      prompt: 'What part of success do you secretly like the MOST?',
      choices: [
        { id: 'a', label: 'Knowing I built something difficult', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'b', label: 'Freedom', resultWeights: {'want-it-for-real': 1, 'comfort-keeps-winning': 1} },
        { id: 'c', label: 'Being recognized as successful', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'boundary_holding_approval_seeking', value: -2}] },
        { id: 'd', label: 'The lifestyle that comes with it', resultWeights: {'comfort-keeps-winning': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your friend starts after you and passes you. Badly. First real reaction. Not the one for church.',
      choices: [
        { id: 'a', label: '“Damn. Good for them. What are they doing that I’m not?”', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: 2}, {dimension: 'reflective_reactive', value: 1}, {dimension: 'practical_idealistic', value: 1}] },
        { id: 'b', label: '“Oh, now I’m pissed. Move.”', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'competitive_cooperative', value: 2}] },
        { id: 'c', label: '“Well, they had advantages I didn’t have.”', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: -2}] },
        { id: 'd', label: '“I’m happy for them.”  …followed approximately eight seconds later by emotional damage. 😭', resultWeights: {'want-it-for-real': 1} },
      ],
    },
    {
      id: 'q8',
      prompt: 'Apparently gets access to your last 90 days. Which discovery would make you most nervous?',
      choices: [
        { id: 'a', label: 'How much time I had that I swore I didn’t have', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'accountability_defensiveness', value: 1}] },
        { id: 'b', label: 'How many things I started', resultWeights: {'talk-great-game': 2} },
        { id: 'c', label: 'How much I actually got done', resultWeights: {'lazy-there-we-said-it': 2} },
        { id: 'd', label: 'How often I chose something easier after saying this mattered more', resultWeights: {'lazy-there-we-said-it': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -2}] },
      ],
    },
    {
      id: 'q9',
      prompt: 'The exciting part is over. Nobody is asking about it anymore. You’re in month seven and the work is repetitive as hell. What keeps you moving?',
      choices: [
        { id: 'a', label: 'Routine. I don’t need to be excited anymore.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'patient_urgent', value: 1}, {dimension: 'planner_spontaneous', value: 1}] },
        { id: 'b', label: 'Seeing progress. If I can tell it’s working, I’m good.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'ambitious_content', value: 1}] },
        { id: 'c', label: 'I probably need something to reignite me.', resultWeights: {'comfort-keeps-winning': 2} },
        { id: 'd', label: 'Month seven?? You have a lot of confidence in me.', resultWeights: {'lazy-there-we-said-it': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
      ],
    },
    {
      id: 'q10',
      prompt: 'Last one. Apparently is taking away the cute answer. You can have the thing you say you want. But it will take five years, nobody will be impressed while you’re building it, and there is no shortcut. Still want it?',
      choices: [
        { id: 'a', label: 'Yes. Five years is going to pass anyway.', resultWeights: {'want-it-for-real': 2}, traitSignals: [{dimension: 'patient_urgent', value: 2}, {dimension: 'ambitious_content', value: 2}] },
        { id: 'b', label: 'Yes… but that timeline definitely changes how hard I’m willing to push.', resultWeights: {'comfort-keeps-winning': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -1}] },
        { id: 'c', label: 'I need to think about whether I want that thing or just what I thought it would give me.', resultWeights: {'talk-great-game': 2}, traitSignals: [{dimension: 'reflective_reactive', value: 1}] },
        { id: 'd', label: 'Five years with no shortcut? Whew. We may need a new dream.', resultWeights: {'lazy-there-we-said-it': 2}, traitSignals: [{dimension: 'adventure_comfort', value: -2}] },
      ],
    },
  ],
};
