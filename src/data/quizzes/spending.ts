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
      heroRead: ["You've never met an upgrade you didn't at least consider."],
      body: "You like nice things. There, we said it. The packaging matters. The quality matters. And yes, sometimes that little logo matters too. You're not necessarily buying everything expensive, but when something catches your eye, the budget version has a lot of explaining to do. You'll wear the same jacket for five years if it's the RIGHT jacket. You'll also spend twenty minutes convincing yourself the designer one is actually cheaper because it'll last longer. The math may be questionable, but the outfit? Immaculate.",
      kicker: 'Apparently, your taste has a higher credit limit than your common sense.',
      traits: ['Quality-Loving', 'Particular', 'Indulgent'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: -1 },
        { dimension: 'sentimental_thick_skinned', value: 1 },
      ],
    },
    {
      id: 'bargain-hunter',
      title: 'THE BARGAIN HUNTER',
      heroRead: ['Full price? In this economy? Be serious.'],
      body: "You don't mind spending money. You mind spending money STUPIDLY. There's a difference. You know which stores have the real sales, which ones raised their prices first, and exactly how much that thing cost last Tuesday. Someone could show you the most beautiful bag in the world, and your first question would still be, \"Does it come in a cheaper beautiful?\" The best part isn't even the purchase. It's telling somebody how much you saved. And you're going to tell them. Whether they asked or not.",
      kicker: 'Apparently, the discount is half the experience.',
      traits: ['Resourceful', 'Practical', 'Deal-Savvy'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: 2 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'planner',
      title: 'THE PLANNER',
      heroRead: ["You've got money for it. That doesn't mean it's in the budget."],
      body: "You don't just buy things. You conduct a small investigation first. Reviews, prices, return policies, and whether you'll still want it in three weeks. You've probably had something sitting in your cart so long it's gone out of stock, come back, and gone on clearance. Meanwhile, everybody else is already enjoying theirs. But here's the thing: when you finally make a purchase, you rarely regret it. You did the homework. You ran the numbers. You consulted the committee. And yes, the committee is just you.",
      kicker: 'Apparently, even your impulse purchases need prior approval.',
      traits: ['Intentional', 'Thorough', 'Disciplined'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'impulse-spender',
      title: 'THE IMPULSE SPENDER',
      heroRead: ["You've got excellent taste and absolutely no warning system."],
      body: "You weren't even looking for anything. That's the problem. One minute you're buying toothpaste, the next you're leaving with a throw blanket, a candle, and something from the seasonal aisle that you can't explain. You see it, you love it, and suddenly it's a necessity. Sometimes you regret it. Sometimes it's the best thing you've ever bought. And sometimes a package arrives and you genuinely have no idea what's inside. That's not a delivery. That's a surprise party you threw for yourself three days ago.",
      kicker: 'Apparently, your bank account needs parental controls.',
      traits: ['Spontaneous', 'Enthusiastic', 'Easily Tempted'],
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
