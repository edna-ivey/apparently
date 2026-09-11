import type { QuizDefinition } from './types';

// Copy is exact and approved — do not reword casually. Choice scores (0/1/2/3) are the
// literal "petty points" per the approved spec; traitSignals map each choice to an EXISTING
// personality.ts dimension (no new dimensions invented) as a dormant hook for future
// integration — see types.ts and the implementation report for why it isn't live yet.
export const PETTY_QUIZ: QuizDefinition = {
  id: 'petty',
  title: 'How petty are you actually?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Eight questions. No judgment.', 'Okay, maybe a little.'],
  meta: '8 questions · About 2 min',
  introNote: 'Answer like nobody’s watching.',
  maxScore: 24,
  meterLabel: 'YOUR PETTY METER',
  scoreLabel: 'petty',
  questions: [
    // Choice order within each question is intentionally permuted (see scoring.ts/report) so
    // the score doesn't map predictably to letter position across the quiz — A/B/C/D no
    // longer equal 0/1/2/3 anywhere. Each choice's own score/label/traitSignals stayed
    // bundled together through the reorder; only its position (and, for internal bookkeeping
    // clarity only, its `id`) changed. `id` is never persisted or shown to the user — it's
    // purely an in-memory answer-tracking key — so renumbering it to match the new position
    // has no effect on scoring, persistence, or display.
    {
      id: 'q1',
      prompt: 'Someone sends you a text with a tone you definitely noticed.',
      choices: [
        { id: 'a', label: 'I assume they didn’t mean it like that.', score: 0, traitSignals: [{ dimension: 'trust_verify', value: 1 }] },
        { id: 'b', label: 'Match energy is a love language.', score: 3, traitSignals: [{ dimension: 'conflict_peacekeeping', value: 1 }] },
        {
          id: 'c',
          label: 'Oh, I noticed. I’m just deciding what version of me is replying.',
          score: 2,
          traitSignals: [{ dimension: 'control_allowing', value: 1 }, { dimension: 'social_attunement', value: 1 }],
        },
        { id: 'd', label: 'I reread it once and move on.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
      ],
    },
    {
      id: 'q2',
      prompt: 'A friend says, “Be honest. Does this look good on me?”',
      choices: [
        { id: 'a', label: 'Depends. Have they been getting on my nerves?', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        { id: 'b', label: 'You asked for honesty. Don’t get mad at the delivery.', score: 3, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
        { id: 'c', label: 'I’ll find something nice to say first.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        { id: 'd', label: 'I’m telling the truth gently.', score: 0, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone who owes you money posts a picture from brunch.',
      choices: [
        { id: 'a', label: 'I notice, but I’m not saying anything.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
        { id: 'b', label: 'Interesting place to spend MY money.', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        {
          id: 'c',
          label: '“That mimosa looks good. So does my $60.”',
          score: 3,
          traitSignals: [{ dimension: 'conflict_peacekeeping', value: 1 }, { dimension: 'direct_indirect', value: 1 }],
        },
        { id: 'd', label: 'None of my business.', score: 0, traitSignals: [{ dimension: 'conflict_peacekeeping', value: -1 }] },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone cuts in front of you like you are completely invisible.',
      choices: [
        { id: 'a', label: 'Let it go. I have places to be.', score: 0, traitSignals: [{ dimension: 'conflict_peacekeeping', value: -1 }] },
        { id: 'b', label: '“Excuse me, the line starts back there.”', score: 2, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
        { id: 'c', label: 'Deep sigh. Very visible facial expression.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        {
          id: 'd',
          label: 'Now everybody in this line is about to know what happened.',
          score: 3,
          traitSignals: [{ dimension: 'conflict_peacekeeping', value: 1 }, { dimension: 'control_allowing', value: 1 }],
        },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your ex’s new person watches your story.',
      choices: [
        { id: 'a', label: 'Huh. Interesting.', score: 1, traitSignals: [{ dimension: 'social_attunement', value: 1 }] },
        { id: 'b', label: 'I probably wouldn’t even notice.', score: 0, traitSignals: [{ dimension: 'social_attunement', value: -1 }] },
        {
          id: 'c',
          label: 'Oh, you came to LOOK? Let me give you something to see.',
          score: 3,
          traitSignals: [{ dimension: 'control_allowing', value: 1 }, { dimension: 'conflict_peacekeeping', value: 1 }],
        },
        { id: 'd', label: 'Suddenly I’m considering posting something extremely cute.', score: 2, traitSignals: [{ dimension: 'control_allowing', value: 1 }] },
      ],
    },
    {
      id: 'q6',
      prompt: 'The group chat ignored your message and then started a whole new conversation.',
      choices: [
        {
          id: 'a',
          label: 'Great. Now I’m ignoring the next three messages on principle.',
          score: 3,
          traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }, { dimension: 'control_allowing', value: 1 }],
        },
        { id: 'b', label: 'Slightly rude, but whatever.', score: 1, traitSignals: [{ dimension: 'emotional_intensity', value: -1 }] },
        { id: 'c', label: 'I truly do not care.', score: 0, traitSignals: [{ dimension: 'emotional_intensity', value: -1 }] },
        { id: 'd', label: 'I’m not repeating myself. They can scroll.', score: 2, traitSignals: [{ dimension: 'direct_indirect', value: 1 }] },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone borrows something and returns it in worse condition.',
      choices: [
        { id: 'a', label: 'You are never borrowing anything from me again.', score: 2, traitSignals: [{ dimension: 'control_allowing', value: 1 }] },
        { id: 'b', label: 'I’ll mention it politely.', score: 1, traitSignals: [{ dimension: 'direct_indirect', value: -1 }] },
        { id: 'c', label: 'Accidents happen.', score: 0, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
        {
          id: 'd',
          label: 'Oh, we have entered the itemized-damage portion of our friendship.',
          score: 3,
          traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }, { dimension: 'trust_verify', value: 1 }],
        },
      ],
    },
    {
      id: 'q8',
      prompt: '“I forgive…”',
      choices: [
        { id: 'a', label: 'Who said I forgave?', score: 3, traitSignals: [{ dimension: 'forgiving_receipts', value: -2 }] },
        { id: 'b', label: 'Pretty easily, actually.', score: 0, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
        { id: 'c', label: 'But I absolutely remember.', score: 2, traitSignals: [{ dimension: 'forgiving_receipts', value: -1 }] },
        { id: 'd', label: 'Eventually.', score: 1, traitSignals: [{ dimension: 'forgiving_receipts', value: 1 }] },
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
