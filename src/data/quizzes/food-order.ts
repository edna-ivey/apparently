import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). The old archetypes (Comfort Order/
// Menu Investigator/Table Diplomat/Wildcard Order) were "merely okay" and have been fully
// replaced per instruction with "I'll Have My Usual"/Menu Critic/Table CEO/Wildcard. All 8
// questions are new. The given spec text used an identical answer order in every single
// question, which fails the "letters must not consistently map to archetypes" requirement, so
// positions were rebalanced (a verified 4-rotation scheme applied per question) to a perfect
// 2-per-letter-per-archetype distribution across the 8 questions — every answer's exact
// wording/archetype stayed attached; only which letter it renders as moved.
export const FOOD_ORDER_QUIZ: ArchetypeQuizDefinition = {
  id: 'food-order',
  scoringType: 'archetype',
  category: 'Food',
  access: 'free',
  title: 'What does your food order say about you?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Dinner is revealing.', 'Unfortunately.'],
  meta: '8 questions · About 2 min',
  introCta: 'Read my order →',
  introNote: 'Your regular order has entered the chat.',
  mixLabel: 'YOUR ORDER MIX',
  recentReadMetricLabel: 'of your food picks',
  archetypes: [
    {
      id: 'ill-have-my-usual',
      title: 'THE “I’LL HAVE MY USUAL”',
      // The generic naive title-caser can't handle a title opening with a curly quote (the
      // capital that should follow it gets swallowed), so this is spelled out explicitly.
      displayTitle: 'The “I’ll Have My Usual”',
      heroRead: ['You found your order.', 'Why would you betray it?'],
      body: 'You know what you like and see no reason to turn dinner into a risk assessment. Familiar is not boring when familiar keeps being delicious. Other people call it predictable. You call it repeatedly correct.',
      kicker: 'Your favorite restaurant already knows why you’re calling.',
      traits: ['Loyal', 'Comfort-driven', 'Decisive'],
      profileSignals: [
        { dimension: 'adventure_comfort', value: -2 },
        { dimension: 'curious_decisive', value: -1 },
      ],
    },
    {
      id: 'menu-critic',
      title: 'THE MENU CRITIC',
      heroRead: ['Dinner is not the time for avoidable mistakes.'],
      body: 'You read the menu like it contains evidence. Preparation matters. Reviews matter. Temperature matters. If you’re paying restaurant prices, you would like the restaurant portion of the experience to actually perform.',
      kicker: 'The fries had one job.',
      traits: ['Particular', 'Observant', 'Discerning'],
      profileSignals: [
        { dimension: 'trust_verify', value: -2 },
        { dimension: 'social_attunement', value: 1 },
      ],
    },
    {
      id: 'table-ceo',
      title: 'THE TABLE CEO',
      // The generic naive title-caser only capitalizes the first letter after a space, which
      // turns the acronym into "Ceo" — spelled out explicitly instead.
      displayTitle: 'The Table CEO',
      heroRead: ['Somehow everybody else’s dinner became your responsibility.'],
      body: 'You know who’s sharing, who has allergies, whether the table ordered enough, and which person is pretending they don’t want fries. You did not ask to run dinner. You simply noticed no one else was doing it correctly.',
      kicker: 'You came to eat. You accidentally became management.',
      traits: ['Considerate', 'Social', 'Organized'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: -2 },
        { dimension: 'control_allowing', value: 1 },
      ],
    },
    {
      id: 'wildcard',
      title: 'THE WILDCARD',
      heroRead: ['If nobody at the table knows what it is, you’re interested.'],
      body: 'You would rather risk a strange meal than order something boring on purpose. Specials, tiny restaurants, mystery ingredients, suspicious sauces, you are here for the possibility that dinner becomes a story.',
      kicker: 'Best case, incredible. Worst case, still content.',
      traits: ['Curious', 'Adventurous', 'Impulsive'],
      profileSignals: [
        { dimension: 'adventure_comfort', value: 2 },
        { dimension: 'planner_spontaneous', value: -1 },
        { dimension: 'curious_decisive', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'New restaurant. You open the menu.',
      choices: [
        { id: 'a', label: 'Where’s the thing I already know I’ll like?', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'b', label: 'What are they actually known for?', resultWeights: { 'menu-critic': 1 } },
        { id: 'c', label: 'What is everybody getting? Are we sharing?', resultWeights: { 'table-ceo': 1 } },
        { id: 'd', label: 'What’s the weirdest thing on here?', resultWeights: { wildcard: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'The server says, “Tonight’s special is hard to explain.”',
      choices: [
        { id: 'a', label: 'Perfect. Bring it.', resultWeights: { wildcard: 1 } },
        { id: 'b', label: 'What’s it similar to?', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'c', label: 'How is it prepared?', resultWeights: { 'menu-critic': 1 } },
        { id: 'd', label: 'Can the table split it?', resultWeights: { 'table-ceo': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your fries arrive cold.',
      choices: [
        { id: 'a', label: 'Does anybody else want fresh fries too?', resultWeights: { 'table-ceo': 1 } },
        { id: 'b', label: 'Hot sauce. Problem solved.', resultWeights: { wildcard: 1 } },
        { id: 'c', label: 'They’re still fries. I’m eating them.', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'd', label: 'Fresh fries, please. Fries have one job.', resultWeights: { 'menu-critic': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: '“Can I have a bite?”',
      choices: [
        { id: 'a', label: 'Let me taste mine first.', resultWeights: { 'menu-critic': 1 } },
        { id: 'b', label: 'Take some. Want more?', resultWeights: { 'table-ceo': 1 } },
        { id: 'c', label: 'Yes, but we’re trading.', resultWeights: { wildcard: 1 } },
        { id: 'd', label: 'One bite. Be respectful.', resultWeights: { 'ill-have-my-usual': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'The restaurant has a 90-minute wait.',
      choices: [
        { id: 'a', label: 'Absolutely not. Let’s go to my usual place.', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'b', label: 'If it’s actually worth 90 minutes, I’ll wait.', resultWeights: { 'menu-critic': 1 } },
        { id: 'c', label: 'What does everybody want to do?', resultWeights: { 'table-ceo': 1 } },
        { id: 'd', label: 'Random place nearby. Let’s risk it.', resultWeights: { wildcard: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'One dinner left on vacation.',
      choices: [
        { id: 'a', label: 'That tiny place with no menu online. There.', resultWeights: { wildcard: 1 } },
        { id: 'b', label: 'Give me something I know I’ll love.', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'c', label: 'Best-rated place. I’m not wasting the final meal.', resultWeights: { 'menu-critic': 1 } },
        { id: 'd', label: 'Where will everybody be happy?', resultWeights: { 'table-ceo': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'There’s definitely going to be leftovers.',
      choices: [
        { id: 'a', label: 'Anybody else want it before I take it?', resultWeights: { 'table-ceo': 1 } },
        { id: 'b', label: 'Leftovers? Bold assumption.', resultWeights: { wildcard: 1 } },
        { id: 'c', label: 'Box it. Tomorrow-me is eating this.', resultWeights: { 'ill-have-my-usual': 1 } },
        { id: 'd', label: 'Only if it’ll actually reheat well.', resultWeights: { 'menu-critic': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'The restaurant has no menu online.',
      choices: [
        { id: 'a', label: 'I need reviews before I commit.', resultWeights: { 'menu-critic': 1 } },
        { id: 'b', label: 'Does anyone in the group know the place?', resultWeights: { 'table-ceo': 1 } },
        { id: 'c', label: 'Even better. Surprise me.', resultWeights: { wildcard: 1 } },
        { id: 'd', label: 'That feels unnecessarily risky.', resultWeights: { 'ill-have-my-usual': 1 } },
      ],
    },
  ],
};
