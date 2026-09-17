import type { ArchetypeQuizDefinition } from './types';

// New for the Explore expansion sprint — Nostalgia's second free quiz (Era was the only one
// before this). Unlike Era, this isn't about decades — it's about who you actually were as a
// kid, current behavior implied by childhood instinct, not birth year. Archetype scoring, same
// rigor as the rest of the library: 8 questions, one archetype per choice, a rotating position
// schedule (each archetype lands on each letter exactly twice across the 8 questions —
// verified programmatically).
export const KID_YOU_QUIZ: ArchetypeQuizDefinition = {
  id: 'kid-you',
  scoringType: 'archetype',
  category: 'Nostalgia',
  access: 'free',
  title: 'What kind of kid were you when adults weren’t looking?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Not who you were told to be.', 'Who you actually were.'],
  meta: '8 questions · About 2 min',
  introCta: 'Go back →',
  introNote: 'Your parents are not allowed to fact-check this.',
  mixLabel: 'YOUR KID-YOU MIX',
  recentReadMetricLabel: 'of your kid-you picks',
  archetypes: [
    {
      id: 'little-ceo',
      title: 'THE LITTLE CEO',
      heroRead: ['You didn’t have a business.', 'You definitely had a business model.'],
      body: 'Even as a kid, you understood leverage. Trading, negotiating, assigning roles nobody asked you to assign — you weren’t bossy, you were just always three steps ahead of everyone else’s plan.',
      kicker: 'The lemonade stand was never just a lemonade stand.',
      traits: ['Strategic', 'Confident', 'Resourceful'],
      profileSignals: [
        { dimension: 'ambitious_content', value: 2 },
        { dimension: 'control_allowing', value: 1 },
      ],
    },
    {
      id: 'neighborhood-menace',
      title: 'THE NEIGHBORHOOD MENACE',
      heroRead: ['You weren’t a bad kid.', 'You were just... a lot.'],
      body: 'Somebody had to try it first, and it was usually you. Not out of defiance exactly — you just genuinely wanted to know what would happen, and “probably shouldn’t” rarely stopped you from finding out.',
      kicker: 'At least one adult still remembers your name specifically.',
      traits: ['Bold', 'Curious', 'Fearless'],
      profileSignals: [
        { dimension: 'adventure_comfort', value: 2 },
        { dimension: 'rules_bending', value: -2 },
      ],
    },
    {
      id: 'quiet-observer',
      title: 'THE QUIET OBSERVER',
      heroRead: ['You didn’t say much.', 'You didn’t miss anything either.'],
      body: 'While everyone else was busy being loud, you were quietly cataloging every detail. You still are. People are often surprised by how much you actually noticed back then — you just never felt the need to announce it.',
      kicker: 'The receipts have always existed. You just kept them to yourself.',
      traits: ['Perceptive', 'Private', 'Steady'],
      profileSignals: [
        { dimension: 'private_open', value: 2 },
        { dimension: 'social_attunement', value: 1 },
      ],
    },
    {
      id: 'golden-child',
      title: 'THE GOLDEN CHILD OFF-DUTY',
      displayTitle: 'The Golden Child Off-Duty',
      heroRead: ['You were good.', 'Suspiciously, genuinely good.'],
      body: 'Straight A’s, please and thank you, asking permission before anyone required it — you weren’t performing for anyone, you just actually cared about doing it right. The good-kid thing wasn’t a mask. It was just you.',
      kicker: 'The permission slip was signed before it was even handed out.',
      traits: ['Conscientious', 'Earnest', 'Reliable'],
      profileSignals: [
        { dimension: 'rules_bending', value: 2 },
        { dimension: 'conflict_peacekeeping', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Recess. Who are you?',
      choices: [
        { id: 'a', label: 'Running some kind of unofficial trading operation.', resultWeights: { 'little-ceo': 1 } },
        { id: 'b', label: 'Already banned from at least one game.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'c', label: 'Watching everyone from the swings, taking notes.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'd', label: 'Being extremely good, on the record.', resultWeights: { 'golden-child': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'A group project gets assigned.',
      choices: [
        { id: 'a', label: 'I’m doing the least amount of work possible, loudly.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'b', label: 'I quietly do most of the actual work.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'c', label: 'I raise my hand to volunteer first.', resultWeights: { 'golden-child': 1 } },
        { id: 'd', label: 'I’m assigning roles within the first two minutes.', resultWeights: { 'little-ceo': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Something breaks at home and nobody saw who did it.',
      choices: [
        { id: 'a', label: 'I saw everything and I am saying nothing.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'b', label: 'I confess immediately, unprompted.', resultWeights: { 'golden-child': 1 } },
        { id: 'c', label: 'I negotiate a deal before anyone finds out.', resultWeights: { 'little-ceo': 1 } },
        { id: 'd', label: 'It was me. It was obviously me.', resultWeights: { 'neighborhood-menace': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Sleepover. It’s 1am.',
      choices: [
        { id: 'a', label: 'Already asleep. Lights out means lights out.', resultWeights: { 'golden-child': 1 } },
        { id: 'b', label: 'Running some kind of game with actual rules and stakes.', resultWeights: { 'little-ceo': 1 } },
        { id: 'c', label: 'Doing something we were explicitly told not to do.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'd', label: 'Still awake, listening to everyone else talk.', resultWeights: { 'quiet-observer': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Report card day.',
      choices: [
        { id: 'a', label: 'Solid grades. Nobody really notices me either way.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'b', label: 'Straight A’s, framed, mentioned at dinner.', resultWeights: { 'golden-child': 1 } },
        { id: 'c', label: 'Negotiating what the good grades are worth.', resultWeights: { 'little-ceo': 1 } },
        { id: 'd', label: 'There is a “talks too much” comment somewhere in here.', resultWeights: { 'neighborhood-menace': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'The ice cream truck shows up.',
      choices: [
        { id: 'a', label: 'I’m already three houses away chasing it down.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'b', label: 'I already knew exactly when it comes. I planned ahead.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'c', label: 'I ask permission first. Every time.', resultWeights: { 'golden-child': 1 } },
        { id: 'd', label: 'I’m reselling snacks by 3pm.', resultWeights: { 'little-ceo': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone dares you to do something a little risky.',
      choices: [
        { id: 'a', label: 'I politely decline and suggest we not.', resultWeights: { 'golden-child': 1 } },
        { id: 'b', label: 'What’s in it for me?', resultWeights: { 'little-ceo': 1 } },
        { id: 'c', label: 'Already done before you finished the sentence.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'd', label: 'I watch to see what happens to whoever does it first.', resultWeights: { 'quiet-observer': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Looking back, what were you actually like as a kid?',
      choices: [
        { id: 'a', label: 'Running something. I just didn’t know what yet.', resultWeights: { 'little-ceo': 1 } },
        { id: 'b', label: 'A LOT. I was simply a lot.', resultWeights: { 'neighborhood-menace': 1 } },
        { id: 'c', label: 'Quiet. Saw everything. Said very little.', resultWeights: { 'quiet-observer': 1 } },
        { id: 'd', label: 'Trying very hard to be good at being good.', resultWeights: { 'golden-child': 1 } },
      ],
    },
  ],
};
