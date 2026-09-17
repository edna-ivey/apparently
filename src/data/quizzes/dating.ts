import type { NumericBandQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). Result bands/copy are KEPT EXACTLY
// from the Batch 1 draft per instruction. Questions were fully replaced with the new
// short/playful/entertainment-first style. Q1 is intentionally left in its exact given
// escalating order (0/1/2/3 → A/B/C/D), locked per spec. Q2-Q10 use a verified rotation so no
// letter consistently means "most" or "least" — see the position-audit table in the
// implementation report; each score (0-3) lands on each letter either 2 or 3 times across
// all 10 questions (the closest even split possible for 10 rows over 4 letters).
export const DATING_QUIZ: NumericBandQuizDefinition = {
  id: 'dating',
  scoringType: 'numericBand',
  category: 'Love',
  access: 'free',
  title: 'How hard are you to date?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['You are absolutely dateable.', 'The maintenance level is the question.'],
  meta: '10 questions · About 2 min',
  introCta: 'Read the fine print →',
  introNote: 'Your ex has been removed from the judging panel.',
  maxScore: 30,
  meterLabel: 'YOUR DATING DIFFICULTY',
  scoreLabel: 'dating difficulty',
  recentReadMetricLabel: 'dating difficulty',
  questions: [
    {
      id: 'q1',
      prompt: 'They haven’t texted you back in four hours. Be serious. What are you doing?',
      choices: [
        { id: 'a', label: 'Nothing. They’re busy.', score: 0 },
        { id: 'b', label: 'I notice, but I wait.', score: 1 },
        { id: 'c', label: 'I’m sending another text. Now I’m annoyed.', score: 2 },
        { id: 'd', label: 'I’ve called twice, sent “wow,” and I’m one bad decision from driving over there.', score: 3 },
      ],
    },
    {
      id: 'q2',
      prompt: 'Things have been suspiciously peaceful between you two all week.',
      choices: [
        { id: 'a', label: 'I may accidentally create a problem because this is way too quiet.', score: 3 },
        { id: 'b', label: 'Good. Peace is the goal.', score: 0 },
        { id: 'c', label: 'I wouldn’t mind a little extra attention.', score: 1 },
        { id: 'd', label: 'I’m starting to wonder if something’s off.', score: 2 },
      ],
    },
    {
      id: 'q3',
      prompt: 'You’re mad. They ask, “Are you okay?”',
      choices: [
        { id: 'a', label: '“I’m fine.” They should know I’m not.', score: 2 },
        { id: 'b', label: '“I’m good.” Meanwhile the entire room is on punishment.', score: 3 },
        { id: 'c', label: 'I tell them what’s wrong.', score: 0 },
        { id: 'd', label: 'I need a minute. Then I’ll talk.', score: 1 },
      ],
    },
    {
      id: 'q4',
      prompt: 'Important date. They forgot.',
      choices: [
        { id: 'a', label: 'I’m hurt. I say that.', score: 1 },
        { id: 'b', label: 'I say it’s fine. I am taking notes.', score: 2 },
        { id: 'c', label: 'Oh, they will remember this forever.', score: 3 },
        { id: 'd', label: 'Annoying, but one miss isn’t a crisis.', score: 0 },
      ],
    },
    {
      id: 'q5',
      prompt: 'They want a whole Saturday to themselves.',
      choices: [
        { id: 'a', label: 'Great. I have a life of my own.', score: 0 },
        { id: 'b', label: 'Fine. Check in later.', score: 1 },
        { id: 'c', label: 'I say okay, then wonder what’s wrong.', score: 2 },
        { id: 'd', label: 'Alone from me? Interesting.', score: 3 },
      ],
    },
    {
      id: 'q6',
      prompt: 'They like somebody’s thirst trap. You see it.',
      choices: [
        { id: 'a', label: 'I send the screenshot with “???”', score: 3 },
        { id: 'b', label: 'A like is not a federal case.', score: 0 },
        { id: 'c', label: 'I clock it and keep scrolling.', score: 1 },
        { id: 'd', label: 'We’re discussing your thumb choices tonight.', score: 2 },
      ],
    },
    {
      id: 'q7',
      prompt: 'Halfway through the argument, you realize you’re wrong.',
      choices: [
        { id: 'a', label: 'I pivot to the part where I was still right.', score: 2 },
        { id: 'b', label: 'This argument is now about your tone.', score: 3 },
        { id: 'c', label: 'Ugh. Fine. I was wrong.', score: 0 },
        { id: 'd', label: 'I admit it, but explain myself first.', score: 1 },
      ],
    },
    {
      id: 'q8',
      prompt: 'They forgot something you’ve told them twice.',
      choices: [
        { id: 'a', label: 'I notice. Deeply.', score: 1 },
        { id: 'b', label: '“Wow. So you listen to nothing I say?”', score: 2 },
        { id: 'c', label: 'If I said it twice, I expected permanent storage.', score: 3 },
        { id: 'd', label: 'I remind them and move on.', score: 0 },
      ],
    },
    {
      id: 'q9',
      prompt: 'Saturday is tomorrow. There are zero plans.',
      choices: [
        { id: 'a', label: 'I’ve made a plan in my head. Keep up.', score: 3 },
        { id: 'b', label: 'Perfect. We’ll wing it.', score: 0 },
        { id: 'c', label: 'I’d like a plan, but okay.', score: 1 },
        { id: 'd', label: 'The uncertainty is already irritating me.', score: 2 },
      ],
    },
    {
      id: 'q10',
      prompt: 'They cancel on you an hour before.',
      choices: [
        { id: 'a', label: '“That sucks. Rain check?”', score: 1 },
        { id: 'b', label: 'I need a minute before I answer.', score: 2 },
        { id: 'c', label: '“No worries ❤️” Then I’m unavailable until Tuesday.', score: 3 },
        { id: 'd', label: 'Okay. Life happens.', score: 0 },
      ],
    },
  ],
  resultBands: [
    {
      id: 'low-maintenance-high-reward',
      title: 'LOW MAINTENANCE, HIGH REWARD',
      minScore: 0,
      maxScore: 7,
      heroRead: ['You’re suspiciously easy to date.', 'Frankly, it’s a little unsettling.'],
      body: 'You say what you mean, recover from small disappointments, and don’t turn every quiet afternoon into a relationship referendum. You still care deeply. You just don’t require someone to solve a riddle before they can love you correctly.',
      kicker: 'No scavenger hunt required.',
      traits: ['Steady', 'Direct', 'Easygoing'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'emotional_intensity', value: -1 },
      ],
    },
    {
      id: 'a-little-work-worth-it',
      title: 'A LITTLE WORK, WORTH IT',
      minScore: 8,
      maxScore: 15,
      heroRead: ['You have needs.', 'Annoyingly, most of them are reasonable.'],
      body: 'You like attention, consistency, and proof that someone is actually paying attention. You’re not asking for psychic powers, but there are definitely moments when “you should know me by now” enters the chat. Once someone learns your rhythm, though, you’re pretty easy to keep happy.',
      kicker: 'There is a manual. You hand it out one page at a time.',
      traits: ['Warm', 'Attentive', 'Particular'],
      profileSignals: [
        { dimension: 'emotional_intensity', value: 1 },
        { dimension: 'sentimental_thick_skinned', value: 1 },
      ],
    },
    {
      id: 'handle-with-context',
      title: 'HANDLE WITH CONTEXT',
      minScore: 16,
      maxScore: 22,
      heroRead: ['Not difficult.', 'Specific. Very specific.'],
      body: 'You notice tone, timing, patterns, promises, and the tiny detail someone else thought did not count. Dating you works best with someone who listens the first time and remembers there was a first time. You are not asking for perfection. You are asking for evidence.',
      kicker: 'Please review previous conversations before your next attempt.',
      traits: ['Perceptive', 'Intense', 'Exacting'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'emotional_intensity', value: 1 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'advanced-placement-dating',
      title: 'ADVANCED PLACEMENT DATING',
      minScore: 23,
      maxScore: 30,
      heroRead: ['Dating you is a course with prerequisites.'],
      body: 'You love hard, expect effort to mean something, and keep a surprisingly detailed internal record of what has and has not been handled correctly. Some expectations are spoken. Some are apparently available through context clues. The right person may love the challenge. Everyone else should study.',
      kicker: 'The syllabus was apparently implied.',
      traits: ['Passionate', 'Devoted', 'Exacting'],
      profileSignals: [
        { dimension: 'emotional_intensity', value: 2 },
        { dimension: 'forgiving_receipts', value: -1 },
        { dimension: 'direct_indirect', value: -1 },
      ],
    },
  ],
};
