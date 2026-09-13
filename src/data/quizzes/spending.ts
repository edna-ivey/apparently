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
    },
    {
      id: 'bargain-hunter',
      title: 'THE BARGAIN HUNTER',
      heroRead: ['If the cheap one works, explain the expensive one.'],
      body: 'You take real satisfaction in paying less for something that does the same job. Labels do not impress you nearly as much as value, function, and knowing you did not get played by the price tag.',
      kicker: 'You don’t need the best one. You need the one that works and minds its price.',
      traits: ['Practical', 'Value-driven', 'Resourceful'],
    },
    {
      id: 'planner',
      title: 'THE PLANNER',
      heroRead: ['You can spend.', 'You just prefer advance notice.'],
      body: 'You research, compare, budget, wait, and buy on purpose. You are fully capable of spending serious money when the purchase makes sense. You just prefer the decision to happen before the card swipe.',
      kicker: 'Your money would like a calendar invite.',
      traits: ['Deliberate', 'Organized', 'Measured'],
    },
    {
      id: 'impulse-spender',
      title: 'THE IMPULSE SPENDER',
      heroRead: ['You saw it.', 'You loved it.', 'Meeting adjourned.'],
      body: 'Your purchases tend to begin with a feeling. Excitement, mood, a random little reward, the sudden conviction that this specific thing would improve your life immediately. Sometimes you’re right. The committee rarely gets enough time to investigate.',
      kicker: 'The purchase happened before the committee could meet.',
      traits: ['Spontaneous', 'Emotional', 'Fast-moving'],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You need a new purse. Four of them basically do the same thing.',
      choices: [
        { id: 'a', label: 'Designer. If I’m carrying it every day, I want the good one.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'b', label: 'Cheapest one with solid reviews. It holds stuff.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'c', label: 'I’m comparing price, quality, and how long I’ll use it.', resultWeights: { planner: 1 } },
        { id: 'd', label: 'Whichever one makes me go “ooooh.” That’s the one.', resultWeights: { 'impulse-spender': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You’re booking a hotel.',
      choices: [
        { id: 'a', label: 'That one looks fun. Book it.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'b', label: 'Give me the nicest one I can reasonably justify.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'c', label: 'Clean, safe, cheapest. I’m sleeping there.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'd', label: 'I’m comparing location, reviews, price, and cancellation policy.', resultWeights: { planner: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'The brand-name version has a dupe for half the price.',
      choices: [
        { id: 'a', label: 'I’m comparing materials, reviews, and warranty.', resultWeights: { planner: 1 } },
        { id: 'b', label: 'Honestly? Whichever one I like more right now.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'c', label: 'I want the real one.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'd', label: 'If the dupe works, why am I funding the logo?', resultWeights: { 'bargain-hunter': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'An unexpected $500 lands in your account.',
      choices: [
        { id: 'a', label: 'Keep most of it. Maybe find something cheap on sale.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'b', label: 'Decide where it goes before touching it.', resultWeights: { planner: 1 } },
        { id: 'c', label: 'This feels like free money, which is dangerous.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'd', label: 'Put it toward the nice thing I’ve been wanting.', resultWeights: { 'luxury-loyalist': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You need a winter coat.',
      choices: [
        { id: 'a', label: 'I want the one I’ll love wearing for years.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'b', label: 'Warmest one at the best price.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'c', label: 'I’m researching warmth, durability, and cost.', resultWeights: { planner: 1 } },
        { id: 'd', label: 'The one I put on and immediately want.', resultWeights: { 'impulse-spender': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You’re buying sunglasses.',
      choices: [
        { id: 'a', label: 'The fun pair I noticed from across the store.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'b', label: 'Designer. They’re on my face all summer.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'c', label: 'Twenty bucks and actual UV protection. Done.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'd', label: 'Midrange. Good lenses. Good reviews. Reasonable price.', resultWeights: { planner: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'A new phone comes out. Yours still works.',
      choices: [
        { id: 'a', label: 'I’ll upgrade when the numbers and timing make sense.', resultWeights: { planner: 1 } },
        { id: 'b', label: 'I watched the launch. Unfortunately, now I want it.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'c', label: 'Newest Pro. If I’m upgrading, I’m upgrading.', resultWeights: { 'luxury-loyalist': 1 } },
        { id: 'd', label: 'Mine works. Call me when it dies.', resultWeights: { 'bargain-hunter': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Checkout total is higher than you expected.',
      choices: [
        { id: 'a', label: 'Remove half immediately.', resultWeights: { 'bargain-hunter': 1 } },
        { id: 'b', label: 'Review the cart line by line.', resultWeights: { planner: 1 } },
        { id: 'c', label: 'Apple Pay before I rethink my life.', resultWeights: { 'impulse-spender': 1 } },
        { id: 'd', label: 'If I love everything, I expected quality to cost.', resultWeights: { 'luxury-loyalist': 1 } },
      ],
    },
  ],
};
