import type { ArchetypeQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Questions and all four result copies
// replaced with the new authored set. Display positions rebalanced (perfect
// 2-per-letter-per-archetype across the 8 questions — verified programmatically).
export const KID_YOU_QUIZ: ArchetypeQuizDefinition = {
  id: 'kid-you',
  scoringType: 'archetype',
  category: 'Nostalgia',
  access: 'free',
  title: 'What kind of kid were you when adults weren’t looking?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Your family remembers one version.', 'The neighborhood may have additional records.'],
  meta: '8 questions · About 2 min',
  introCta: 'Go back →',
  introNote: 'Your parents are not allowed to fact-check this.',
  mixLabel: 'YOUR KID-YOU MIX',
  recentReadMetricLabel: 'of your kid-you picks',
  archetypes: [
    {
      id: 'little-ceo',
      title: 'THE LITTLE CEO',
      heroRead: ['You didn’t need authority.', 'You simply recognized a leadership vacuum.'],
      body: 'You had plans, opinions, systems, and a suspicious comfort with assigning other children jobs.\n\nAdults called you bossy.\n\nHistory will decide.',
      kicker: 'The clipboard was imaginary. The management style was not.',
      traits: ['Decisive', 'Organized', 'Ambitious'],
      profileSignals: [
        { dimension: 'control_allowing', value: 2 },
        { dimension: 'planner_spontaneous', value: 1 },
        { dimension: 'ambitious_content', value: 1 },
      ],
    },
    {
      id: 'neighborhood-menace',
      title: 'THE NEIGHBORHOOD MENACE',
      heroRead: ['You were not a bad kid.', 'You were committed to field research.'],
      body: 'Rules created questions.\n\nFences created curiosity.\n\nAnd “don’t do that” occasionally sounded less like a warning and more like a challenge.',
      kicker: 'At least one adult still remembers your name specifically.',
      traits: ['Adventurous', 'Bold', 'Playful'],
      profileSignals: [
        { dimension: 'rules_bending', value: -2 },
        { dimension: 'adventure_comfort', value: 1 },
        { dimension: 'playful_serious', value: 1 },
      ],
    },
    {
      id: 'quiet-observer',
      title: 'THE QUIET OBSERVER',
      heroRead: ['You weren’t missing anything.', 'You were taking notes.'],
      body: 'You knew which adults were mad at each other, which kid was lying, who was about to cry, and why everybody suddenly got quiet when one particular person walked into the room.\n\nPeople may have mistaken quiet for innocence.\n\nAdorable.',
      kicker: 'You knew the family business before you knew multiplication.',
      traits: ['Perceptive', 'Quiet', 'Curious'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'private_open', value: 1 },
        { dimension: 'curious_decisive', value: 1 },
      ],
    },
    {
      id: 'golden-child',
      title: 'THE GOLDEN CHILD OFF-DUTY',
      displayTitle: 'The Golden Child Off-Duty',
      heroRead: ['Excellent reputation.', 'Incomplete records.'],
      body: 'Around adults, you knew the rules, used your manners, and understood exactly how not to get yourself killed.\n\nBut once supervision got loose?\n\nThere may be additional documentation.\n\nYou weren’t necessarily the wildest kid in the room.\n\nYou were simply very good at making sure the adults never believed you were.',
      kicker: 'Your publicist started young.',
      traits: ['Well-behaved', 'Strategic', 'Sneaky'],
      profileSignals: [
        { dimension: 'rules_bending', value: 2 },
        { dimension: 'social_attunement', value: 1 },
        { dimension: 'control_allowing', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'The adults leave the room at a family function. What happens?',
      choices: [
        { id: 'a', label: 'I’m somehow deciding what all the cousins are doing.', resultWeights: { 'little-ceo': 1 } },
        { id: 'b', label: 'Excellent. Now we can do the thing we were told not to do.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'c', label: 'I’m listening closely to the grown-folks conversation from a safe distance.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'd', label: 'I am still technically behaving. Technically.', resultWeights: { 'golden-child': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You hear your FULL name yelled from another room.',
      choices: [
        { id: 'a', label: 'My first thought is, “What do they know?”', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'b', label: 'I mentally replay the last hour before answering.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'c', label: 'I go right away. Looking innocent is part of the strategy.', resultWeights: { 'golden-child': 1 } },
        { id: 'd', label: 'I immediately start preparing my explanation.', resultWeights: { 'little-ceo': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'You and the neighborhood kids need something to do.',
      choices: [
        { id: 'a', label: 'I’m happy to watch until I decide whether this is worth joining.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'b', label: 'I participate, but I am absolutely getting home before the streetlights come on.', resultWeights: { 'golden-child': 1 } },
        { id: 'c', label: 'I invent a game and somehow end up in charge.', resultWeights: { 'little-ceo': 1 } },
        { id: 'd', label: 'Whatever we choose will eventually violate at least one rule.', resultWeights: { 'neighborhood-menace': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Something breaks and no adult saw who did it.',
      choices: [
        { id: 'a', label: 'I will tell the truth... strategically.', resultWeights: { 'golden-child': 1 } },
        { id: 'b', label: 'First, we need a plan.', resultWeights: { 'little-ceo': 1 } },
        { id: 'c', label: 'I’m probably involved enough that silence is my best option.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'd', label: 'I know exactly who did it. Nobody asked me yet.', resultWeights: { 'quiet-observer': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You’re at a sleepover and it’s 1:30 AM.',
      choices: [
        { id: 'a', label: 'I’m still awake because this is when everybody starts telling the good stories.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'b', label: 'I’ve been behaving all night. The adults going to sleep changes things slightly.', resultWeights: { 'golden-child': 1 } },
        { id: 'c', label: 'I’ve somehow created an activity with rules and assigned roles.', resultWeights: { 'little-ceo': 1 } },
        { id: 'd', label: 'This is when all our worst ideas become excellent ideas.', resultWeights: { 'neighborhood-menace': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'An adult says, “whatever you do, do NOT touch that.”',
      choices: [
        { id: 'a', label: 'That object has now become the most interesting thing in the room.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'b', label: 'I’m watching somebody else touch it first.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'c', label: 'I’m not touching it. I would simply like to clarify what counts as “touching.”', resultWeights: { 'golden-child': 1 } },
        { id: 'd', label: 'I need to know why before I agree to anything.', resultWeights: { 'little-ceo': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Which sentence did adults say about kid-you the MOST?',
      choices: [
        { id: 'a', label: '“Such a good child.”', resultWeights: { 'golden-child': 1 } },
        { id: 'b', label: '“You always want to be in charge.”', resultWeights: { 'little-ceo': 1 } },
        { id: 'c', label: '“Why are YOU always involved?”', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'd', label: '“You’re so quiet.”', resultWeights: { 'quiet-observer': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your childhood best friend gets to expose you. What are they saying?',
      choices: [
        { id: 'a', label: '“They had a plan for EVERYTHING.”', resultWeights: { 'little-ceo': 1 } },
        { id: 'b', label: '“Do not let the innocent face fool you.”', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'c', label: '“They knew everybody’s business and never said a word.”', resultWeights: { 'quiet-observer': 1 } },
        { id: 'd', label: '“The adults thought they were an angel. That’s all I’m saying.”', resultWeights: { 'golden-child': 1 } },
      ],
    },
  ],
};
