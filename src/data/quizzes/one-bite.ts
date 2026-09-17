import type { ArchetypeQuizDefinition } from './types';

// New for the Explore expansion sprint — Food's second free quiz (Food Order was the only one
// before this). Archetype scoring, same rigor as the rest of the library: 8 questions, one
// archetype per choice, a rotating position schedule (each archetype lands on each letter
// exactly twice across the 8 questions — verified programmatically).
export const ONE_BITE_QUIZ: ArchetypeQuizDefinition = {
  id: 'one-bite',
  scoringType: 'archetype',
  category: 'Food',
  access: 'free',
  title: 'Someone asks for a bite. How bad is this about to get?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['A simple request.', 'A surprisingly complicated answer.'],
  meta: '8 questions · About 2 min',
  introCta: 'Defend your plate →',
  introNote: 'No judgment. Some judgment.',
  mixLabel: 'YOUR BITE MIX',
  recentReadMetricLabel: 'of your one-bite picks',
  archetypes: [
    {
      id: 'sharer',
      title: 'THE SHARER',
      heroRead: ['Your plate was never really yours.', 'You knew that going in.'],
      body: 'You order with the table in mind, not just yourself. Sharing doesn’t feel like a loss to you — more food on the table means more good moments, and you’d rather have variety than territory.',
      kicker: 'Communal by nature, not by pressure.',
      traits: ['Generous', 'Easygoing', 'Social'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: -2 },
        { dimension: 'practical_idealistic', value: -1 },
      ],
    },
    {
      id: 'negotiator',
      title: 'THE NEGOTIATOR',
      heroRead: ['You’ll share.', 'You will also be keeping count.'],
      body: 'You’re not against sharing — you just want it to be fair. One bite is one bite, and everyone knows exactly where the line is because you drew it clearly, out loud, in real time.',
      kicker: 'Generosity, audited.',
      traits: ['Fair', 'Precise', 'Practical'],
      profileSignals: [
        { dimension: 'trust_verify', value: -1 },
        { dimension: 'practical_idealistic', value: 1 },
      ],
    },
    {
      id: 'plate-protector',
      title: 'THE PLATE PROTECTOR',
      heroRead: ['You ordered this.', 'You would like to eat this.'],
      body: 'You’re not stingy, you just believe food you chose for yourself should stay that way. You’ll split an appetizer out of politeness. Your entree is a closed border.',
      kicker: 'Sharing is caring. This isn’t that.',
      traits: ['Boundary-aware', 'Direct', 'Decisive'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 1 },
        { dimension: 'independent_collaborative', value: 2 },
      ],
    },
    {
      id: 'order-your-own',
      title: 'THE "ORDER YOUR OWN"',
      displayTitle: 'The "Order Your Own"',
      heroRead: ['There’s a whole menu.', 'Use it.'],
      body: 'You’d genuinely rather everyone just get what they actually want. Splitting sounds like a logistics project you didn’t sign up for — order what you’re craving, eat it in peace, everybody wins.',
      kicker: 'Efficient. Slightly antisocial. Correct.',
      traits: ['Independent', 'Efficient', 'Low-drama'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: 2 },
        { dimension: 'conflict_peacekeeping', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone at the table says, “can I get a bite?”',
      choices: [
        { id: 'a', label: 'Take as much as you want.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'One bite. I’m counting.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'I physically angle my plate away.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'There’s a whole menu. Order your own.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You ordered fries to share. They’re almost gone and you’ve had two.',
      choices: [
        { id: 'a', label: 'I’m doing quiet math on who owes who.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'I did not sign up for this. I’m ordering more, for me.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'Next time we’re ordering two baskets. Lesson learned.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'That’s how sharing works. No notes.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your dessert arrives. Six spoons appear out of nowhere.',
      choices: [
        { id: 'a', label: 'Absolutely not. This one’s mine.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'Y’all should’ve ordered your own dessert.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'The more spoons, the better, honestly.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'Everyone gets exactly one bite. I’m supervising.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone says, “just try mine, it’s so good.”',
      choices: [
        { id: 'a', label: 'I’m good, I know what I ordered.', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'Yes, always, put it right here.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'Fine, one bite, but I’m judging the portion.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'I’ll look at it. I will not be eating it.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'The table decides to order a bunch of stuff “for the middle.”',
      choices: [
        { id: 'a', label: 'I’m still getting my own entree too, just in case.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'Can we not. I want my own plate.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'Love this. Order everything.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'I want to know exactly what’s coming before I commit.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Somebody’s fork is creeping toward your plate.',
      choices: [
        { id: 'a', label: 'I’ll allow one, but I’m watching the fork.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'The fork does not make it. I intercept.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'This was never up for discussion.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'Go ahead, I wasn’t going to finish it anyway.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You finish your food first. Someone else is still eating.',
      choices: [
        { id: 'a', label: 'I ordered exactly what I wanted. I’m satisfied.', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'I offer them the rest of my drink, my fries, whatever’s left.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'I ask if they’re going to finish that.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'I quietly finish everything on my own plate. On purpose.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Someone asks the table, “wanna split a few things instead of getting entrees?”',
      choices: [
        { id: 'a', label: 'Yes. Always yes. Bring it all.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'Sure, but let’s actually agree on what first.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'I’ll split appetizers. My entree stays mine.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'I would prefer my own entree, but I respect the idea.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
  ],
};
