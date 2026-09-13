import type { QuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). Result bands/copy are KEPT EXACTLY
// per instruction — the user loves the Petty results. Questions were fully replaced with the
// new short/playful/entertainment-first style. traitSignals were re-attached where a new
// answer's sentiment still cleanly maps to an EXISTING personality.ts dimension (no new
// dimensions invented, never wired into live scoring) — omitted where no existing dimension
// fit without mislabeling. The given answer order for every question already lands each score
// (0/1/2/3) on each letter exactly twice across the 8 questions — verified programmatically —
// so no reordering was needed here (unlike Dating, which required one).
export const PETTY_QUIZ: QuizDefinition = {
  id: 'petty',
  scoringType: 'numericBand',
  category: 'Ridiculous',
  title: 'How petty are you actually?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Eight questions. No judgment.', 'Okay, maybe a little.'],
  meta: '8 questions · About 2 min',
  introCta: 'Let’s find out →',
  introNote: 'Answer like nobody’s watching.',
  maxScore: 24,
  meterLabel: 'YOUR PETTY METER',
  scoreLabel: 'petty',
  questions: [
    {
      id: 'q1',
      prompt: 'They reply “k” after you sent a whole paragraph.',
      choices: [
        { id: 'a', label: 'They’re probably busy.', score: 0, traitSignals: [{ dimension: 'trust_verify', value: 1 }] },
        { id: 'b', label: 'Oh, we’re doing tone? Bet.', score: 3, traitSignals: [{ dimension: 'conflict_peacekeeping', value: 1 }] },
        {
          id: 'c',
          label: 'I’m sending “??” because what was THAT?',
          score: 2,
          traitSignals: [{ dimension: 'social_attunement', value: 1 }],
        },
        { id: 'd', label: 'I notice. One eyebrow definitely goes up.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone who’s been annoying you asks, “Does this outfit look good?”',
      choices: [
        { id: 'a', label: 'I pause long enough to be suspicious.', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        { id: 'b', label: 'I tell the truth with unnecessary detail.', score: 3, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
        { id: 'c', label: 'I find one nice thing to say.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        { id: 'd', label: 'Their outfit is unrelated to their crimes.', score: 0, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone who owes you money posts brunch.',
      choices: [
        { id: 'a', label: 'I clock it. Quietly.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
        { id: 'b', label: 'Brunch with my money is wild.', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        {
          id: 'c',
          label: '“Cute. Now Cash App me.”',
          score: 3,
          traitSignals: [{ dimension: 'direct_indirect', value: 1 }, { dimension: 'conflict_peacekeeping', value: 1 }],
        },
        { id: 'd', label: 'I keep scrolling.', score: 0, traitSignals: [{ dimension: 'conflict_peacekeeping', value: -1 }] },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone cuts the line like you don’t exist.',
      choices: [
        { id: 'a', label: 'Let it go. I have somewhere to be.', score: 0, traitSignals: [{ dimension: 'conflict_peacekeeping', value: -1 }] },
        { id: 'b', label: '“Excuse me. The line starts back there.”', score: 2, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
        { id: 'c', label: 'My face says everything.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        {
          id: 'd',
          label: 'Congratulations. The entire line now knows what you did.',
          score: 3,
          traitSignals: [{ dimension: 'conflict_peacekeeping', value: 1 }, { dimension: 'control_allowing', value: 1 }],
        },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your ex’s new person watches your story.',
      choices: [
        { id: 'a', label: 'Noted.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
        { id: 'b', label: 'I probably wouldn’t notice.', score: 0, traitSignals: [{ dimension: 'social_attunement', value: -1 }] },
        {
          id: 'c',
          label: 'Oh, you came to LOOK? Hold on.',
          score: 3,
          traitSignals: [{ dimension: 'control_allowing', value: 1 }, { dimension: 'conflict_peacekeeping', value: 1 }],
        },
        { id: 'd', label: 'Suddenly my next story needs better lighting.', score: 2, traitSignals: [{ dimension: 'control_allowing', value: 1 }] },
      ],
    },
    {
      id: 'q6',
      prompt: 'The group chat ignored your message, then started talking about something else.',
      choices: [
        {
          id: 'a',
          label: 'Cool. I’m unavailable for the next 24 business hours.',
          score: 3,
          traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }, { dimension: 'control_allowing', value: 1 }],
        },
        { id: 'b', label: 'Rude. Anyway.', score: 1, traitSignals: [{ dimension: 'emotional_intensity', value: -1 }] },
        { id: 'c', label: 'I genuinely do not care.', score: 0, traitSignals: [{ dimension: 'emotional_intensity', value: -1 }] },
        { id: 'd', label: 'I’m not repeating myself. Scroll up.', score: 2, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
      ],
    },
    {
      id: 'q7',
      prompt: 'They return something they borrowed... damaged.',
      choices: [
        { id: 'a', label: 'Congrats. Borrowing privileges revoked.', score: 2, traitSignals: [{ dimension: 'control_allowing', value: 1 }] },
        { id: 'b', label: 'I mention it.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        { id: 'c', label: 'Stuff happens.', score: 0, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
        {
          id: 'd',
          label: 'I’m sending photos and replacement links.',
          score: 3,
          traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }, { dimension: 'trust_verify', value: 1 }],
        },
      ],
    },
    {
      id: 'q8',
      prompt: 'Finish the sentence: “I forgive...”',
      choices: [
        { id: 'a', label: '...who? Be specific.', score: 3, traitSignals: [{ dimension: 'forgiving_receipts', value: -2 }] },
        { id: 'b', label: '...pretty easily.', score: 0, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
        { id: 'c', label: '...but the screenshot lives forever.', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        { id: 'd', label: '...eventually.', score: 1, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
      ],
    },
  ],
  resultBands: [
    {
      id: 'mostly-unbothered',
      title: 'MOSTLY UNBOTHERED',
      minScore: 0,
      maxScore: 6,
      heroRead: ['You really do let things go.', 'Suspicious, but admirable.'],
      body: 'You tend to choose peace over proving a point. You notice more than people probably realize, but most things simply are not worth your energy.',
      kicker: 'Your group chat may have questions.',
      traits: ['Easygoing', 'Measured', 'Low-drama'],
    },
    {
      id: 'selectively-petty',
      title: 'SELECTIVELY PETTY',
      minScore: 7,
      maxScore: 12,
      heroRead: ['You’re not petty.', 'You’re specific.'],
      body: 'Most things get a pass. But when something hits the right nerve, suddenly you have principles, a memory, and excellent documentation.',
      kicker: 'Honestly, this feels reasonable.',
      traits: ['Observant', 'Boundary-aware', 'Selective'],
    },
    {
      id: 'quietly-calculated',
      title: 'QUIETLY CALCULATED',
      minScore: 13,
      maxScore: 18,
      heroRead: ['You don’t react to everything.', 'You file it away.'],
      body: 'You usually know exactly what happened, exactly who did it, and exactly how much energy the situation deserves. You may not make a scene, but please believe the information has been retained.',
      kicker: 'Silence should not be confused with amnesia.',
      traits: ['Strategic', 'Observant', 'Controlled'],
    },
    {
      id: 'petty-with-purpose',
      title: 'PETTY WITH PURPOSE',
      minScore: 19,
      maxScore: 24,
      heroRead: ['You believe actions have consequences.', 'Sometimes the consequence is you.'],
      body: 'You are not looking for drama everywhere. But when the occasion presents itself, you are willing to participate with organization, creativity, and a very strong sense of fairness.',
      kicker: 'Some lessons require visual aids.',
      traits: ['Direct', 'Bold', 'Justice-minded'],
    },
  ],
};
