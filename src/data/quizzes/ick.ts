import type { NumericBandQuizDefinition } from './types';

// New for the Explore expansion sprint — Love's second free quiz (Dating was the only one
// before this). Numeric-band, same shape/rigor as Petty: 8 questions, 4 choices each scored
// 0-3, a rotating position schedule (each score lands on each letter exactly twice across the
// 8 questions — verified programmatically, see the sprint's content validation script) so no
// letter is a giveaway for "the ick answer." Bands cover the full 0-24 range with no gaps.
export const ICK_QUIZ: NumericBandQuizDefinition = {
  id: 'ick',
  scoringType: 'numericBand',
  category: 'Love',
  access: 'free',
  title: 'How fast do you catch the ick?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Eight scenarios.', 'Zero mercy.'],
  meta: '8 questions · About 2 min',
  introCta: 'Let’s find out →',
  introNote: 'Your current situationship is not invited to see these results.',
  maxScore: 24,
  meterLabel: 'YOUR ICK METER',
  scoreLabel: 'ick',
  questions: [
    {
      id: 'q1',
      prompt: 'He orders for you at a restaurant. Nobody asked him to.',
      choices: [
        { id: 'a', label: 'Kind of like it, not gonna lie.', score: 0 },
        { id: 'b', label: 'Depends on the order, honestly.', score: 1 },
        { id: 'c', label: 'I’m ordering my own food, but okay.', score: 2 },
        { id: 'd', label: 'We are done here.', score: 3 },
      ],
    },
    {
      id: 'q2',
      prompt: 'Mid-argument, he says, “You’re kind of hot when you’re mad.”',
      choices: [
        { id: 'a', label: 'Weird timing, but sure.', score: 1 },
        { id: 'b', label: 'Sir. We are fighting.', score: 2 },
        { id: 'c', label: 'New ick, immediately unlocked.', score: 3 },
        { id: 'd', label: 'I felt that in my whole chest.', score: 0 },
      ],
    },
    {
      id: 'q3',
      prompt: 'He says “I’m not really a reader” like it’s a personality trait.',
      choices: [
        { id: 'a', label: 'Mild concern has been registered.', score: 2 },
        { id: 'b', label: 'Immediate and total exit.', score: 3 },
        { id: 'c', label: 'Kind of makes me like him more.', score: 0 },
        { id: 'd', label: 'Fine, everyone has a thing.', score: 1 },
      ],
    },
    {
      id: 'q4',
      prompt: 'He full-on sings along in public. Off-key. Zero shame.',
      choices: [
        { id: 'a', label: 'I am pretending I don’t know him.', score: 3 },
        { id: 'b', label: 'This might be the most attractive thing I’ve seen all week.', score: 0 },
        { id: 'c', label: 'Endearing, actually.', score: 1 },
        { id: 'd', label: 'I need this to stop immediately.', score: 2 },
      ],
    },
    {
      id: 'q5',
      prompt: 'He calls it “getting you a lady drink.”',
      choices: [
        { id: 'a', label: '...come again?', score: 2 },
        { id: 'b', label: 'We need to talk.', score: 3 },
        { id: 'c', label: 'Honestly didn’t even clock it.', score: 0 },
        { id: 'd', label: 'I’ll allow it. Once.', score: 1 },
      ],
    },
    {
      id: 'q6',
      prompt: 'He texts back “k.”',
      choices: [
        { id: 'a', label: 'Once is fine. Twice, we’re talking.', score: 1 },
        { id: 'b', label: 'I noticed. I’m choosing peace.', score: 2 },
        { id: 'c', label: 'A war crime.', score: 3 },
        { id: 'd', label: 'He’s probably driving.', score: 0 },
      ],
    },
    {
      id: 'q7',
      prompt: 'He brings up his ex within the first ten minutes.',
      choices: [
        { id: 'a', label: 'Immediate red flag. Check, please.', score: 3 },
        { id: 'b', label: 'Everyone has a past. Moving on.', score: 0 },
        { id: 'c', label: 'I’m listening a little too closely now.', score: 1 },
        { id: 'd', label: 'Okay, but why though.', score: 2 },
      ],
    },
    {
      id: 'q8',
      prompt: 'He does a bit. A full bit. In front of your friends.',
      choices: [
        { id: 'a', label: 'My friends are obsessed now. Fine.', score: 0 },
        { id: 'b', label: 'A little much, but I’ll allow the encore.', score: 1 },
        { id: 'c', label: 'It’s giving main character. Concerning.', score: 2 },
        { id: 'd', label: 'Someone please stop him.', score: 3 },
      ],
    },
  ],
  resultBands: [
    {
      id: 'very-forgiving',
      title: 'VERY FORGIVING',
      minScore: 0,
      maxScore: 6,
      heroRead: ['Almost nothing actually bothers you.', 'We have questions.'],
      body: 'Little things roll right off you. Off-key singing, a bad text, an overshare — none of it registers as a real problem. You save your reactions for things that actually matter, which means most people never catch you flinching.',
      kicker: 'Your tolerance is either enlightenment or a red flag. Unclear.',
      traits: ['Easygoing', 'Unbothered', 'Forgiving'],
      profileSignals: [
        { dimension: 'forgiving_receipts', value: 2 },
        { dimension: 'emotional_intensity', value: -1 },
      ],
    },
    {
      id: 'selective',
      title: 'SELECTIVE',
      minScore: 7,
      maxScore: 12,
      heroRead: ['You’re not picky.', 'You’re just paying attention.'],
      body: 'Most things get a pass. A few specific things do not, and you know exactly what they are. You’re not chasing perfection — you’re just not willing to ignore an actual pattern.',
      kicker: 'The bar is reasonable. It is, however, a bar.',
      traits: ['Discerning', 'Fair', 'Observant'],
      profileSignals: [
        { dimension: 'social_attunement', value: 1 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'ick-prone',
      title: 'ICK-PRONE',
      minScore: 13,
      maxScore: 18,
      heroRead: ['You notice everything.', 'Unfortunately, everything notices back.'],
      body: 'Small things land loudly for you. A weird laugh, a strange word choice, a vibe shift mid-sentence — you catch it instantly, and once you catch it, it’s very hard to unsee. Your standards aren’t unreasonable. They’re just extremely online.',
      kicker: 'You didn’t choose the ick. The ick chose you.',
      traits: ['Perceptive', 'Particular', 'Instinctive'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
    {
      id: 'one-wrong-move',
      title: 'ONE WRONG MOVE',
      minScore: 19,
      maxScore: 24,
      heroRead: ['One weird sentence.', 'That’s really all it takes.'],
      body: 'You don’t need a pattern. You need one moment, and you are out — mentally, possibly physically. It’s not that you’re harsh, you just trust your first reaction completely, and your first reaction is rarely wrong.',
      kicker: 'The exit was already halfway planned before the sentence finished.',
      traits: ['Instinctive', 'Decisive', 'Exacting'],
      profileSignals: [
        { dimension: 'curious_decisive', value: -2 },
        { dimension: 'emotional_intensity', value: 1 },
      ],
    },
  ],
};
