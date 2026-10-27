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
      prompt: "You sit down at a new restaurant. The menu is 14 pages long. Now what?",
      choices: [
        { id: 'a', label: "Find the closest thing to my usual. I didn't come here to discover myself.", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'b', label: "Fourteen pages? That's suspicious. What are they actually GOOD at?", resultWeights: { "menu-critic": 1 } },
        { id: 'c', label: "Before anybody orders, are we sharing? Because I need to know the plan.", resultWeights: { "table-ceo": 1 } },
        { id: 'd', label: "What's the strangest thing on here? I want the dish that requires an explanation.", resultWeights: { "wildcard": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "The server says, “Tonight's special is... hard to explain.”",
      choices: [
        { id: 'a', label: "Perfect. Don't explain it. I love a little danger with my dinner.", resultWeights: { "wildcard": 1 } },
        { id: 'b', label: "Okay, but does it taste like something I've had before?", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'c', label: "Hard to explain or hard to defend? What's actually in it?", resultWeights: { "menu-critic": 1 } },
        { id: 'd', label: "Can we order one for the table? Nobody needs to gamble alone.", resultWeights: { "table-ceo": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "Your fries arrive cold. Like they've been through something.",
      choices: [
        { id: 'a', label: "Wait, did everybody's food come out cold? Because we're addressing this together.", resultWeights: { "table-ceo": 1 } },
        { id: 'b', label: "Hot sauce. Extra seasoning. I'm turning this tragedy into a comeback story.", resultWeights: { "wildcard": 1 } },
        { id: 'c', label: "They're still fries. I'm hungry. We're moving on.", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'd', label: "I'm sending these back. Cold fries are unacceptable.", resultWeights: { "menu-critic": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "Somebody reaches across the table: “Can I have a bite?” You haven't even tasted yours.",
      choices: [
        { id: 'a', label: "Let me taste it first. I need to know whether I'm sharing joy or disappointment.", resultWeights: { "menu-critic": 1 } },
        { id: 'b', label: "Of course. Want me to cut you a piece?", resultWeights: { "table-ceo": 1 } },
        { id: 'c', label: "Yeah, but let me try yours too.", resultWeights: { "wildcard": 1 } },
        { id: 'd', label: "One bite. And I mean ONE. Don't get comfortable.", resultWeights: { "ill-have-my-usual": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "The restaurant says the wait is 90 minutes. Everybody looks at you.",
      choices: [
        { id: 'a', label: "Ninety minutes? My regular spot could've fed us twice by then.", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'b', label: "If the food is actually worth it, I'll wait. Show me the reviews.", resultWeights: { "menu-critic": 1 } },
        { id: 'c', label: "Okay, vote. Are we waiting or relocating? I'm not managing complaints later.", resultWeights: { "table-ceo": 1 } },
        { id: 'd', label: "There's a random little place around the corner. No reviews. Let's live.", resultWeights: { "wildcard": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "Last night of vacation. You only get ONE more dinner. Where are we going?",
      choices: [
        { id: 'a', label: "That tiny place down the alley with the handwritten menu. Obviously.", resultWeights: { "wildcard": 1 } },
        { id: 'b', label: "Somewhere I know I'll love. I'm not spending my final night eating regret.", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'c', label: "The best-rated restaurant in town. I refuse to end this trip with mediocre pasta.", resultWeights: { "menu-critic": 1 } },
        { id: 'd', label: "Where everybody can get something they'll enjoy?", resultWeights: { "table-ceo": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "There's enough food left for tomorrow. What happens to it?",
      choices: [
        { id: 'a', label: "Does anybody want some before I claim it? Speak now.", resultWeights: { "table-ceo": 1 } },
        { id: 'b', label: "Leftovers? That's adorable. You think I'm stopping?", resultWeights: { "wildcard": 1 } },
        { id: 'c', label: "Box it up. Tomorrow-me deserves nice things too.", resultWeights: { "ill-have-my-usual": 1 } },
        { id: 'd', label: "Depends. Some food reheats like a dream. Some comes back as a punishment.", resultWeights: { "menu-critic": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "You find a restaurant that looks amazing. Plot twist: absolutely no menu online.",
      choices: [
        { id: 'a', label: "No menu, no reviews, no information? Apparently we're supposed to eat on faith.", resultWeights: { "menu-critic": 1 } },
        { id: 'b', label: "Has anybody in the group been there? Somebody has to know something.", resultWeights: { "table-ceo": 1 } },
        { id: 'c', label: "Even better. Surprise me. I didn't leave the house to be predictable.", resultWeights: { "wildcard": 1 } },
        { id: 'd', label: "That's a lot of mystery for somebody who already knows what they like.", resultWeights: { "ill-have-my-usual": 1 } },
      ],
    },
  ],
};
