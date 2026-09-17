import type { ArchetypeQuizDefinition } from './types';

// New for the Explore expansion sprint — Money's second free quiz. Deliberately NOT a
// duplicate of Spending: Spending is about everyday purchase habits, this is specifically
// about sudden/unplanned money and what it reveals. Archetype scoring, same rigor as the rest
// of the library: 8 questions, one archetype per choice, a rotating position schedule (each
// archetype lands on each letter exactly twice across the 8 questions — verified
// programmatically).
export const UNEXPECTED_MONEY_QUIZ: ArchetypeQuizDefinition = {
  id: 'unexpected-money',
  scoringType: 'archetype',
  category: 'Money',
  access: 'free',
  title: 'Unexpected money just hit your account. Be honest.',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['No explanation.', 'Just the money. What do you actually do?'],
  meta: '8 questions · About 2 min',
  introCta: 'Reveal my move →',
  introNote: 'This is entirely hypothetical. Unfortunately.',
  mixLabel: 'YOUR MONEY MOVE MIX',
  recentReadMetricLabel: 'of your money-move picks',
  archetypes: [
    {
      id: 'safety-net',
      title: 'THE SAFETY NET',
      heroRead: ['The money didn’t feel real yet.', 'So you protected it like it was.'],
      body: 'Sudden money doesn’t read as fun money to you — it reads as proof you should keep preparing. You’re not scared of enjoying things. You just trust future-you more than a single lucky moment.',
      kicker: 'Security is the treat.',
      traits: ['Prepared', 'Grounded', 'Responsible'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'little-treat',
      title: 'THE LITTLE TREAT',
      heroRead: ['The money showed up.', 'So did the joy, immediately.'],
      body: 'You don’t need a five-year plan to know what makes you happy right now. Sudden money reveals what you actually want, not what you think you should want — and you go get it without the guilt tax.',
      kicker: 'No regrets on record.',
      traits: ['Present', 'Joyful', 'Spontaneous'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: -2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
    {
      id: 'level-up',
      title: 'THE LEVEL-UP',
      heroRead: ['You didn’t want more stuff.', 'You wanted better stuff.'],
      body: 'Random money reveals exactly where your life has a small, specific gap — and you know precisely what fills it. Not impulsive, not overly cautious. Just quietly upgrading, one deliberate purchase at a time.',
      kicker: 'Curated, not compulsive.',
      traits: ['Intentional', 'Discerning', 'Practical'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: 1 },
        { dimension: 'ambitious_content', value: 1 },
      ],
    },
    {
      id: 'master-plan',
      title: 'THE MASTER PLAN',
      heroRead: ['Free money isn’t free money to you.', 'It’s momentum.'],
      body: 'You don’t see a windfall, you see a multiplier. Where it goes depends on what moves you forward fastest, and you already had that answer before the money even cleared.',
      kicker: 'Every dollar has a job.',
      traits: ['Strategic', 'Ambitious', 'Decisive'],
      profileSignals: [
        { dimension: 'ambitious_content', value: 2 },
        { dimension: 'curious_decisive', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: '$500 just landed in your account. No explanation. First thought?',
      choices: [
        { id: 'a', label: 'Into savings. Immediately.', resultWeights: { 'safety-net': 1 } },
        { id: 'b', label: 'Ooh. I know exactly what I’m buying.', resultWeights: { 'little-treat': 1 } },
        { id: 'c', label: 'This could go toward the thing I’ve been wanting to upgrade.', resultWeights: { 'level-up': 1 } },
        { id: 'd', label: 'Okay, where does this actually move the needle.', resultWeights: { 'master-plan': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend asks what you’d do with it.',
      choices: [
        { id: 'a', label: 'Something small and completely unnecessary.', resultWeights: { 'little-treat': 1 } },
        { id: 'b', label: 'Something that makes my life noticeably better.', resultWeights: { 'level-up': 1 } },
        { id: 'c', label: 'I already have three ideas ranked by ROI.', resultWeights: { 'master-plan': 1 } },
        { id: 'd', label: 'Nothing exciting. Emergency fund.', resultWeights: { 'safety-net': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'You picture the money sitting in your account for a week, untouched.',
      choices: [
        { id: 'a', label: 'I’m researching the upgrade in the meantime.', resultWeights: { 'level-up': 1 } },
        { id: 'b', label: 'I’m still deciding the smartest move.', resultWeights: { 'master-plan': 1 } },
        { id: 'c', label: 'That’s the plan. It stays.', resultWeights: { 'safety-net': 1 } },
        { id: 'd', label: 'A week? Absolutely not.', resultWeights: { 'little-treat': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone says “you should just treat yourself.”',
      choices: [
        { id: 'a', label: 'Treating myself IS the plan working.', resultWeights: { 'master-plan': 1 } },
        { id: 'b', label: 'I’d rather feel secure than treated.', resultWeights: { 'safety-net': 1 } },
        { id: 'c', label: 'Already halfway to treating myself, actually.', resultWeights: { 'little-treat': 1 } },
        { id: 'd', label: 'One good treat that actually lasts, maybe.', resultWeights: { 'level-up': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You imagine explaining the purchase to future-you.',
      choices: [
        { id: 'a', label: 'Future me is living slightly better because of this.', resultWeights: { 'level-up': 1 } },
        { id: 'b', label: 'Future me is further along because of this.', resultWeights: { 'master-plan': 1 } },
        { id: 'c', label: 'Future me will thank present me for saving it.', resultWeights: { 'safety-net': 1 } },
        { id: 'd', label: 'Future me won’t even remember. Present me will enjoy it.', resultWeights: { 'little-treat': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'A friend says they’d just blow it all on something fun.',
      choices: [
        { id: 'a', label: 'Same, honestly. Life’s short.', resultWeights: { 'little-treat': 1 } },
        { id: 'b', label: 'Depends what “fun” means. I’m particular.', resultWeights: { 'level-up': 1 } },
        { id: 'c', label: 'Fun is allowed. After the plan is funded.', resultWeights: { 'master-plan': 1 } },
        { id: 'd', label: 'Respectfully, no.', resultWeights: { 'safety-net': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You check your account again a month later.',
      choices: [
        { id: 'a', label: 'Already reinvested into the next thing.', resultWeights: { 'master-plan': 1 } },
        { id: 'b', label: 'Still there. Growing, even.', resultWeights: { 'safety-net': 1 } },
        { id: 'c', label: 'Gone. No regrets.', resultWeights: { 'little-treat': 1 } },
        { id: 'd', label: 'Turned into something I use every day now.', resultWeights: { 'level-up': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Honestly, what does unexpected money reveal about you?',
      choices: [
        { id: 'a', label: 'I plan for the version of me that isn’t lucky forever.', resultWeights: { 'safety-net': 1 } },
        { id: 'b', label: 'I know how to actually enjoy something.', resultWeights: { 'little-treat': 1 } },
        { id: 'c', label: 'I know exactly what’s worth upgrading.', resultWeights: { 'level-up': 1 } },
        { id: 'd', label: 'I don’t waste momentum.', resultWeights: { 'master-plan': 1 } },
      ],
    },
  ],
};
