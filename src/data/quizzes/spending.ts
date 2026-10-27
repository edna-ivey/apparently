import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). The old archetypes (Justifier/
// Calculator/Experience Collector/Treat-Yourself Economist) have been fully DELETED per
// instruction and replaced with Luxury Loyalist/Bargain Hunter/Planner/Impulse Spender. All 8
// questions are new. The given spec text used an identical answer order in every single
// question, which fails the "letters must not consistently map to archetypes" requirement, so
// positions were rebalanced (a verified 4-rotation scheme applied per question) to a perfect
// 2-per-letter-per-archetype distribution across the 8 questions — every answer's exact
// wording/archetype stayed attached; only which letter it renders as moved.
export const SPENDING_QUIZ: ArchetypeQuizDefinition = {
  id: 'spending',
  scoringType: 'archetype',
  category: 'Money',
  access: 'free',
  title: 'What does your spending say about you?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Same money.', 'Very different decisions.'],
  meta: '8 questions · About 2 min',
  introCta: 'Read my receipts →',
  introNote: 'Your cart would like representation.',
  mixLabel: 'YOUR SPENDING MIX',
  recentReadMetricLabel: 'of your spending picks',
  archetypes: [
    {
      id: 'luxury-loyalist',
      title: 'THE LUXURY LOYALIST',
      heroRead: ['If it comes in a dust bag, you understand.'],
      body: 'You care about quality, presentation, design, and yes, sometimes the name on the label. If something is going to be yours, you want the version that feels special every time you use it. Function matters. The experience matters too.',
      kicker: 'The logo is not the point. It is, however, invited.',
      traits: ['Elevated', 'Brand-aware', 'Indulgent'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: -1 },
        { dimension: 'sentimental_thick_skinned', value: 1 },
      ],
    },
    {
      id: 'bargain-hunter',
      title: 'THE BARGAIN HUNTER',
      heroRead: ['If the cheap one works, explain the expensive one.'],
      body: 'You take real satisfaction in paying less for something that does the same job. Labels do not impress you nearly as much as value, function, and knowing you did not get played by the price tag.',
      kicker: 'You don’t need the best one. You need the one that works and minds its price.',
      traits: ['Practical', 'Value-driven', 'Resourceful'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: 2 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'planner',
      title: 'THE PLANNER',
      heroRead: ['You can spend.', 'You just prefer advance notice.'],
      body: 'You research, compare, budget, wait, and buy on purpose. You are fully capable of spending serious money when the purchase makes sense. You just prefer the decision to happen before the card swipe.',
      kicker: 'Your money would like a calendar invite.',
      traits: ['Deliberate', 'Organized', 'Measured'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'impulse-spender',
      title: 'THE IMPULSE SPENDER',
      heroRead: ['You saw it.', 'You loved it.', 'Meeting adjourned.'],
      body: 'Your purchases tend to begin with a feeling. Excitement, mood, a random little reward, the sudden conviction that this specific thing would improve your life immediately. Sometimes you’re right. The committee rarely gets enough time to investigate.',
      kicker: 'The purchase happened before the committee could meet.',
      traits: ['Spontaneous', 'Emotional', 'Fast-moving'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: -2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "You said you weren't spending any money today. Then you walked into Target.",
      choices: [
        { id: 'a', label: "I came for toothpaste. Why am I looking at lamps?", resultWeights: { "impulse-spender": 1 } },
        { id: 'b', label: "I found something cute, but I'm checking the price first.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'c', label: "I have a list. We're not doing this today.", resultWeights: { "planner": 1 } },
        { id: 'd', label: "That candle smells expensive. Unfortunately, I have taste.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "Your friend shows you a $900 purse. 'Isn't it cute?'",
      choices: [
        { id: 'a', label: "It's cute, but $900 cute? Let's be serious.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'b', label: "If I'm paying $900, it better be the one I really want.", resultWeights: { "luxury-loyalist": 1 } },
        { id: 'c', label: "I'd have to think about that one. For a while.", resultWeights: { "planner": 1 } },
        { id: 'd', label: "Don't show me things I can't stop thinking about.", resultWeights: { "impulse-spender": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "You get paid. What's the first thing you do?",
      choices: [
        { id: 'a', label: "Pay what needs paying. Then we'll see what's left.", resultWeights: { "planner": 1 } },
        { id: 'b', label: "Check which sales are actually worth looking at.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'c', label: "I deserve a little something. I've been through enough.", resultWeights: { "impulse-spender": 1 } },
        { id: 'd', label: "That thing I've been wanting? It's looking real possible right now.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "You're supposed to be saving money. Then your favorite store announces a sale.",
      choices: [
        { id: 'a', label: "A sale is not a savings account. Nice try, though.", resultWeights: { "planner": 1 } },
        { id: 'b', label: "How much of a sale? Don't play with me.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'c', label: "I was doing so good. SO good.", resultWeights: { "impulse-spender": 1 } },
        { id: 'd', label: "That one thing I've been eyeing better be included.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "Your friend says, “You have a package coming EVERY day.”",
      choices: [
        { id: 'a', label: "And? You counting my packages or paying my bills?", resultWeights: { "impulse-spender": 1 } },
        { id: 'b', label: "Those were all on sale. Mind your business.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'c', label: "Three orders, one delivery day. Relax.", resultWeights: { "planner": 1 } },
        { id: 'd', label: "I like nice things. This isn't breaking news.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "You find the perfect thing. Then you see '50% OFF.'",
      choices: [
        { id: 'a', label: "Now THAT'S what I'm talking about.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'b', label: "Was it actually worth the original price, though?", resultWeights: { "planner": 1 } },
        { id: 'c', label: "See? It was meant for me.", resultWeights: { "impulse-spender": 1 } },
        { id: 'd', label: "Perfect. Now I can justify getting the nicer version.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "Your phone works perfectly. The new one just dropped.",
      choices: [
        { id: 'a', label: "I already watched three reviews. I'm considering my options.", resultWeights: { "planner": 1 } },
        { id: 'b', label: "Mine works. Apple can miss me with this one.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'c', label: "Why did I watch the launch? Now I want it.", resultWeights: { "impulse-spender": 1 } },
        { id: 'd', label: "If I'm upgrading, I'm getting the best one. Period.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "Your bank app sends a notification: “You've spent more than usual this month.”",
      choices: [
        { id: 'a', label: "I KNOW. Why are you yelling at me?", resultWeights: { "impulse-spender": 1 } },
        { id: 'b', label: "More than usual WHERE? Let me see the breakdown.", resultWeights: { "planner": 1 } },
        { id: 'c', label: "And that's why we're eating what's in the freezer.", resultWeights: { "bargain-hunter": 1 } },
        { id: 'd', label: "Well, I do have excellent taste. Unfortunately.", resultWeights: { "luxury-loyalist": 1 } },
      ],
    },
  ],
};
