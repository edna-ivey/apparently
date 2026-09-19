import type { ArchetypeQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Results/archetypes unchanged — approved
// copy, do not rewrite. Questions replaced with the new authored set; display positions
// rebalanced (perfect 2-per-letter-per-archetype across the 8 questions — verified
// programmatically), preserving each choice's exact text and its archetype mapping.
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
      prompt: 'Your partner said they weren’t hungry. Your food arrives. Now they’re staring at your plate.',
      choices: [
        { id: 'a', label: 'I knew this was coming. Take some.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'Tell me exactly what you want before you start freelancing.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'We specifically discussed whether you were hungry.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'I’m ordering you your own food.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone reaches for your fries without asking.',
      choices: [
        { id: 'a', label: '“Ask first.” I’m still probably giving you some.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'I move the fries. Instinctively.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'Absolutely not. Those are assigned fries.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'Go ahead. Fries are communal.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'The table wants to order everything family-style.',
      choices: [
        { id: 'a', label: 'Fine, but I’m also ordering something that belongs to me.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'I respect the concept from over here with my entrée.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'Perfect. I want to try everything.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'I’m in, but we need enough food and a real plan.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'There is exactly one perfect bite left on your plate.',
      choices: [
        { id: 'a', label: 'Why are we even discussing MY final bite?', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'If somebody wants it, they can have it.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'Depends what I’m getting in return.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'There are several other bites available to you.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You open the fridge and the leftovers you were thinking about all day are gone.',
      choices: [
        { id: 'a', label: 'I am way more upset than leftovers should legally make a person.', resultWeights: { 'plate-protector': 1 } },
        { id: 'b', label: 'This household will now be implementing labels.', resultWeights: { 'order-your-own': 1 } },
        { id: 'c', label: 'Honestly, I hope they enjoyed them.', resultWeights: { sharer: 1 } },
        { id: 'd', label: 'I need to know who ate them and whether they knew they were mine.', resultWeights: { negotiator: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You bring snacks for a road trip. Two hours in...',
      choices: [
        { id: 'a', label: 'I’m making sure nobody kills one snack before everyone gets some.', resultWeights: { negotiator: 1 } },
        { id: 'b', label: 'Certain snacks were clearly for me, and we all knew that.', resultWeights: { 'plate-protector': 1 } },
        { id: 'c', label: 'Next trip everybody gets their own bag.', resultWeights: { 'order-your-own': 1 } },
        { id: 'd', label: 'Everybody is eating everything. That’s why I brought it.', resultWeights: { sharer: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your date says, “let’s just split an entrée.”',
      choices: [
        { id: 'a', label: 'That sounds romantic for somebody else.', resultWeights: { 'order-your-own': 1 } },
        { id: 'b', label: 'Sure. We can get appetizers too.', resultWeights: { sharer: 1 } },
        { id: 'c', label: 'Fine, but we need to agree on what we’re ordering.', resultWeights: { negotiator: 1 } },
        { id: 'd', label: 'We can taste each other’s food. I still want my own.', resultWeights: { 'plate-protector': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Dinner is over. Which thing would irritate you MOST?',
      choices: [
        { id: 'a', label: 'Everybody ordered separately and nobody let me taste anything.', resultWeights: { sharer: 1 } },
        { id: 'b', label: 'The bill got split evenly when some people ordered way more.', resultWeights: { negotiator: 1 } },
        { id: 'c', label: 'Somebody boxed up MY leftovers without asking.', resultWeights: { 'plate-protector': 1 } },
        { id: 'd', label: 'We spent half the meal passing plates around.', resultWeights: { 'order-your-own': 1 } },
      ],
    },
  ],
};
