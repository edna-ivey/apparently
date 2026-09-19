import type { ArchetypeQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Deliberately distinct from Spending:
// Spending is everyday purchase habits, this is specifically what a sudden windfall reveals.
// Questions replaced with the new authored set; THE LEVEL-UP result rewritten to be about
// leverage/capability (course, equipment, seed money), NOT "a nicer version of a product" —
// that phrasing belongs to Spending, not here. Display positions rebalanced (perfect
// 2-per-letter-per-archetype across the 8 questions — verified programmatically).
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
      heroRead: ['You don’t just spend money.', 'You look for leverage.'],
      body: 'A course. Better equipment. A certification. Seed money for an idea. Something that makes you more capable, more valuable, or more able to earn. When extra money appears, your brain naturally asks how it could turn into more options later.',
      kicker: 'Some people buy the bag. You’re wondering who owns the bag company.',
      traits: ['Ambitious', 'Resourceful', 'Growth-minded'],
      profileSignals: [
        { dimension: 'ambitious_content', value: 2 },
        { dimension: 'practical_idealistic', value: 1 },
        { dimension: 'planner_spontaneous', value: 1 },
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
      prompt: 'A surprise $1,500 hits your account. What thought comes first?',
      choices: [
        { id: 'a', label: 'That just made me feel a lot safer.', resultWeights: { 'safety-net': 1 } },
        { id: 'b', label: 'Oh, I can finally do something fun without feeling guilty.', resultWeights: { 'little-treat': 1 } },
        { id: 'c', label: 'What could I use this for that improves my life or income?', resultWeights: { 'level-up': 1 } },
        { id: 'd', label: 'Where does this fit into the bigger plan?', resultWeights: { 'master-plan': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'A week passes and you haven’t touched the money yet.',
      choices: [
        { id: 'a', label: 'A week? I’m clearly overthinking this.', resultWeights: { 'little-treat': 1 } },
        { id: 'b', label: 'I’ve been researching what would make it most useful.', resultWeights: { 'level-up': 1 } },
        { id: 'c', label: 'I’ve already decided where every dollar is going.', resultWeights: { 'master-plan': 1 } },
        { id: 'd', label: 'That actually feels good.', resultWeights: { 'safety-net': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Nobody knows you got the money. What are you secretly imagining?',
      choices: [
        { id: 'a', label: 'A course, equipment, business idea, or something that could open a door.', resultWeights: { 'level-up': 1 } },
        { id: 'b', label: 'Knocking out a goal faster than I expected.', resultWeights: { 'master-plan': 1 } },
        { id: 'c', label: 'Watching my savings number go up.', resultWeights: { 'safety-net': 1 } },
        { id: 'd', label: 'A trip, dinner, purchase, something I normally talk myself out of.', resultWeights: { 'little-treat': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone says, “you work hard. Just enjoy it.”',
      choices: [
        { id: 'a', label: 'Fun can absolutely have a percentage.', resultWeights: { 'master-plan': 1 } },
        { id: 'b', label: 'I’d rather feel secure than treated.', resultWeights: { 'safety-net': 1 } },
        { id: 'c', label: 'Thank you. Finally someone understands me.', resultWeights: { 'little-treat': 1 } },
        { id: 'd', label: 'I enjoy things that keep paying me back.', resultWeights: { 'level-up': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'One month later, which outcome would bother you the MOST?',
      choices: [
        { id: 'a', label: 'I spent it on something that added nothing to my life.', resultWeights: { 'level-up': 1 } },
        { id: 'b', label: 'I let the opportunity pass without moving anything forward.', resultWeights: { 'master-plan': 1 } },
        { id: 'c', label: 'An emergency happens and I wish I had saved it.', resultWeights: { 'safety-net': 1 } },
        { id: 'd', label: 'I saved every penny and didn’t enjoy any of it.', resultWeights: { 'little-treat': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You can use the money for one of these. Which sounds most satisfying?',
      choices: [
        { id: 'a', label: 'Finally doing the thing I keep saying is “too expensive.”', resultWeights: { 'little-treat': 1 } },
        { id: 'b', label: 'Funding something that could make me better, faster, or more valuable.', resultWeights: { 'level-up': 1 } },
        { id: 'c', label: 'Making a meaningful dent in one of my bigger goals.', resultWeights: { 'master-plan': 1 } },
        { id: 'd', label: 'Knowing an unexpected bill wouldn’t scare me anymore.', resultWeights: { 'safety-net': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Six months later, someone asks, “whatever happened to that money?”',
      choices: [
        { id: 'a', label: '“It helped me get ahead.”', resultWeights: { 'master-plan': 1 } },
        { id: 'b', label: '“Most of it’s still there.”', resultWeights: { 'safety-net': 1 } },
        { id: 'c', label: '“Gone. Worth it.”', resultWeights: { 'little-treat': 1 } },
        { id: 'd', label: '“It turned into something I use to grow.”', resultWeights: { 'level-up': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Which sentence would make you feel BEST about the money?',
      choices: [
        { id: 'a', label: '“I don’t have to worry about that anymore.”', resultWeights: { 'safety-net': 1 } },
        { id: 'b', label: '“I’m so glad I actually let myself enjoy that.”', resultWeights: { 'little-treat': 1 } },
        { id: 'c', label: '“That ended up opening a door for me.”', resultWeights: { 'level-up': 1 } },
        { id: 'd', label: '“That moved me months ahead.”', resultWeights: { 'master-plan': 1 } },
      ],
    },
  ],
};
