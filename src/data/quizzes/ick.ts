import type { NumericBandQuizDefinition } from './types';

// Content-polish pass (post-launch content review). Exact copy/positions as authored — do not
// rewrite. Gender-neutral throughout ("they/them" — no "he"/"she"). 8 questions, 4 choices
// scored 0-3 each, maxScore 24, full band coverage. Position balance verified programmatically
// (see the sprint's content validation script) — no letter is a giveaway for score/severity.
export const ICK_QUIZ: NumericBandQuizDefinition = {
  id: 'ick',
  scoringType: 'numericBand',
  category: 'Love',
  access: 'free',
  title: 'How fast do you catch the ick?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Sometimes it’s serious.', 'Sometimes they just said one word weird.'],
  meta: '8 questions · About 2 min',
  introCta: 'Let’s find out →',
  introNote: 'Your current situationship is not invited to see these results.',
  maxScore: 24,
  meterLabel: 'YOUR ICK METER',
  scoreLabel: 'ick',
  questions: [
    {
      id: 'q1',
      prompt: 'Someone you really like sends you a 3-minute voice note that could have been one sentence.',
      choices: [
        { id: 'a', label: 'I listen. I like hearing them talk anyway.', score: 0 },
        { id: 'b', label: 'Three minutes is ambitious, but I’ll survive.', score: 1 },
        { id: 'c', label: 'I’m already wondering why this needed chapters.', score: 2 },
        { id: 'd', label: 'I watched the timer hit 3:00 and felt something leave my body.', score: 3 },
      ],
    },
    {
      id: 'q2',
      prompt: 'You’re out together and they start watching videos on full volume. In public.',
      choices: [
        { id: 'a', label: 'I’m quietly asking them to turn it down.', score: 1 },
        { id: 'b', label: 'I’m suddenly aware of everyone around us.', score: 2 },
        { id: 'c', label: 'Oh no. I don’t know this person.', score: 3 },
        { id: 'd', label: 'I barely notice.', score: 0 },
      ],
    },
    {
      id: 'q3',
      prompt: 'They confidently pronounce a common word completely wrong, then correct YOU.',
      choices: [
        { id: 'a', label: 'The confidence is making this significantly worse.', score: 2 },
        { id: 'b', label: 'Attraction down. Immediately.', score: 3 },
        { id: 'c', label: 'Honestly, kind of funny.', score: 0 },
        { id: 'd', label: 'I’m correcting them once and moving on.', score: 1 },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your best friend meets them and later says, “I don’t know... something about them annoys me.”',
      choices: [
        { id: 'a', label: 'Great. Now I can suddenly see everything they meant.', score: 3 },
        { id: 'b', label: 'Good thing I’m dating them, not you.', score: 0 },
        { id: 'c', label: 'I ask why, but I’m making my own decision.', score: 1 },
        { id: 'd', label: 'Now I’m replaying the entire night.', score: 2 },
      ],
    },
    {
      id: 'q5',
      prompt: 'They clap when the plane lands.',
      choices: [
        { id: 'a', label: 'Why did that just change how I see you?', score: 2 },
        { id: 'b', label: 'I’m pretending we did not travel together.', score: 3 },
        { id: 'c', label: 'Let people be happy. 😂', score: 0 },
        { id: 'd', label: 'I noticed. That is all I’m saying.', score: 1 },
      ],
    },
    {
      id: 'q6',
      prompt: 'They text you a single “k.”',
      choices: [
        { id: 'a', label: 'I noticed, but I’m choosing peace.', score: 1 },
        { id: 'b', label: '“K” feels unnecessarily hostile and I have questions.', score: 2 },
        { id: 'c', label: 'Suddenly I don’t even want to finish this conversation.', score: 3 },
        { id: 'd', label: 'They’re probably busy.', score: 0 },
      ],
    },
    {
      id: 'q7',
      prompt: 'They do something objectively harmless that you find deeply unattractive.',
      choices: [
        { id: 'a', label: 'Harmless does not mean attraction survives.', score: 3 },
        { id: 'b', label: 'If I like them, I can get over almost anything harmless.', score: 0 },
        { id: 'c', label: 'I give it a minute. Sometimes the feeling passes.', score: 1 },
        { id: 'd', label: 'I try to get over it, but my brain keeps bringing it back.', score: 2 },
      ],
    },
    {
      id: 'q8',
      prompt: 'Yesterday you were obsessed. Today one tiny thing is bothering you. What usually happens next?',
      choices: [
        { id: 'a', label: 'By tomorrow I’ll probably forget about it.', score: 0 },
        { id: 'b', label: 'I watch to see if it was a one-time thing.', score: 1 },
        { id: 'c', label: 'Unfortunately, I’m going to notice it every single time now.', score: 2 },
        { id: 'd', label: 'If I’m already asking myself whether I still like them, we may be finished.', score: 3 },
      ],
    },
  ],
  resultBands: [
    {
      id: 'grace-period',
      title: 'THE GRACE PERIOD',
      minScore: 0,
      maxScore: 6,
      heroRead: ['You believe in context.', 'And maybe second chances.'],
      body: 'A weird text, questionable habit, or awkward moment rarely destroys attraction on its own. If you like someone, you give the whole person more weight than one tiny offense.',
      kicker: 'Your tolerance is either enlightenment or a red flag. Unclear.',
      traits: ['Easygoing', 'Fair', 'Forgiving'],
      profileSignals: [
        { dimension: 'forgiving_receipts', value: 2 },
        { dimension: 'emotional_intensity', value: -1 },
      ],
    },
    {
      id: 'quality-control',
      title: 'QUALITY CONTROL',
      minScore: 7,
      maxScore: 12,
      heroRead: ['Nothing is wrong.', 'You just have follow-up questions.'],
      body: 'You notice things, but you don’t hand out permanent icks on first contact. You watch for patterns. One odd moment is information. A repeat performance becomes evidence.',
      kicker: 'The investigation remains open.',
      traits: ['Observant', 'Selective', 'Measured'],
      profileSignals: [
        { dimension: 'social_attunement', value: 1 },
        { dimension: 'trust_verify', value: -1 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'ick-detector',
      title: 'THE ICK DETECTOR',
      minScore: 13,
      maxScore: 18,
      heroRead: ['Once you see it,', 'you cannot unsee it.'],
      body: 'Your attraction has excellent pattern recognition and terrible amnesia. Small things can land loudly, and once your brain files something under “no thank you,” reopening the case is difficult.',
      kicker: 'Unfortunately, your brain saved the receipt.',
      traits: ['Perceptive', 'Particular', 'Instinctive'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
    {
      id: 'exit-interview',
      title: 'THE EXIT INTERVIEW',
      minScore: 19,
      maxScore: 24,
      heroRead: ['Thank you for your time.', 'Chemistry will escort itself out.'],
      body: 'You know quickly when the feeling shifts. Maybe it’s a phrase, habit, or tiny social crime. The point is not whether anyone else agrees. Your attraction already left the building.',
      kicker: 'No appeals are being accepted at this time.',
      traits: ['Decisive', 'Exacting', 'Instinctive'],
      profileSignals: [
        { dimension: 'curious_decisive', value: -2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
  ],
};
