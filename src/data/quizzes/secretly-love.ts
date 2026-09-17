import type { ArchetypeQuizDefinition } from './types';

// Apparently Private's ONE real playable free preview — the gateway quiz. Fully playable, no
// special-casing anywhere: it feeds local history, remote quiz_results, and
// personality_evidence exactly like every other quiz (see src/app/quiz/[quizId].tsx and
// submit_quiz_result — neither branches on access at all). `access: 'private-preview'` is
// merchandising metadata only, read by Explore/private.tsx to decide WHERE this card shows up
// and how it's badged — it changes nothing about scoring, persistence, or the You profile.
//
// Same content rigor as the rest of the library: 8 questions, one archetype per choice, a
// rotating position schedule (each archetype lands on each letter exactly twice across the 8
// questions — verified programmatically). The four results carry four distinct emotional
// jobs (dependable presence / emotional safety / energy·light / honest loyalty) per the
// sprint's approved result territory.
export const SECRETLY_LOVE_QUIZ: ArchetypeQuizDefinition = {
  id: 'secretly-love',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private-preview',
  title: 'What do people secretly love about you?',
  eyebrow: 'APPARENTLY PRIVATE · FREE PREVIEW',
  introSupport: ['This one’s a little more personal.', 'Worth the eight questions.'],
  meta: '8 questions · About 2 min',
  introCta: 'See what they see →',
  introNote: 'One preview, on us.',
  mixLabel: 'YOUR GOOD STUFF MIX',
  recentReadMetricLabel: 'of what people love about you',
  archetypes: [
    {
      id: 'shows-up',
      title: 'THE ONE WHO SHOWS UP',
      heroRead: ['People know you’ll actually come.', 'Not “thinking of you.” Not “let me know if you need anything.” Come.'],
      body: 'You may not always be the softest person in the room, but when things get real, people already know exactly who they’re calling. Showing up isn’t a grand gesture to you — it’s just what you do, every single time, without needing to be asked twice.',
      kicker: 'Reliability, it turns out, is its own kind of love language.',
      traits: ['Dependable', 'Present', 'Steady'],
      profileSignals: [
        { dimension: 'protective_hands_off', value: 2 },
        { dimension: 'patient_urgent', value: -1 },
      ],
    },
    {
      id: 'safe-place',
      title: 'THE SAFE PLACE',
      heroRead: ['People accidentally tell you the truth.', 'Then immediately feel lighter for having said it.'],
      body: 'You don’t rush to fix things. You just make room for them to exist without judgment, and somehow that’s exactly what people needed the whole time. Nobody has to perform being okay around you — they can just not be, for a second.',
      kicker: 'You’ve heard things. You’re taking them to the grave.',
      traits: ['Trustworthy', 'Patient', 'Empathetic'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'private_open', value: 1 },
      ],
    },
    {
      id: 'spark',
      title: 'THE SPARK',
      heroRead: ['The room doesn’t feel the same', 'the second you walk out of it.'],
      body: 'You have a way of making ordinary moments feel like something worth remembering. It’s not about being the loudest person there — it’s that things just feel a little more alive when you’re around, and people notice the difference when you’re not.',
      kicker: 'Energy like that isn’t something you can fake for long. Yours just is.',
      traits: ['Magnetic', 'Playful', 'Warm'],
      profileSignals: [
        { dimension: 'playful_serious', value: 2 },
        { dimension: 'adventure_comfort', value: 1 },
      ],
    },
    {
      id: 'real-one',
      title: 'THE REAL ONE',
      heroRead: ['You don’t tell people what they want to hear.', 'You tell them what’s true. That’s rarer than it should be.'],
      body: 'You’re not interested in being agreeable if it means being dishonest. People trust what they get from you specifically because it isn’t softened for their comfort — and somehow, that honesty is exactly what makes them trust everything else you say too.',
      kicker: 'Loyalty, to you, means telling the truth. Even the inconvenient kind.',
      traits: ['Honest', 'Loyal', 'Direct'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'conflict_peacekeeping', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone in your life is having the worst week. What do they actually get from you?',
      choices: [
        { id: 'a', label: 'I show up. Physically. With food, probably.', resultWeights: { 'shows-up': 1 } },
        { id: 'b', label: 'A place to fall apart without being judged for it.', resultWeights: { 'safe-place': 1 } },
        { id: 'c', label: 'A reason to laugh even when nothing’s funny yet.', resultWeights: { spark: 1 } },
        { id: 'd', label: 'The truth, gently, whether they want it or not.', resultWeights: { 'real-one': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend’s phone dies at 11pm mid-crisis. What are you doing?',
      choices: [
        { id: 'a', label: 'Waiting up. Whenever they resurface, I’m here.', resultWeights: { 'safe-place': 1 } },
        { id: 'b', label: 'Blowing up the group chat trying to make everyone laugh through it.', resultWeights: { spark: 1 } },
        { id: 'c', label: 'Texting something honest they’ll read when they’re back.', resultWeights: { 'real-one': 1 } },
        { id: 'd', label: 'Already in the car.', resultWeights: { 'shows-up': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'What do people usually thank you for, after the fact?',
      choices: [
        { id: 'a', label: 'For making a hard time feel lighter.', resultWeights: { spark: 1 } },
        { id: 'b', label: 'For telling them the truth when no one else would.', resultWeights: { 'real-one': 1 } },
        { id: 'c', label: 'For actually being there. Not just saying it.', resultWeights: { 'shows-up': 1 } },
        { id: 'd', label: 'For not making them feel crazy for feeling something.', resultWeights: { 'safe-place': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'A friend makes a big decision you privately think is a mistake.',
      choices: [
        { id: 'a', label: 'I tell them exactly what I think. Once. Then I support them.', resultWeights: { 'real-one': 1 } },
        { id: 'b', label: 'I don’t argue. I just make sure I’m there either way.', resultWeights: { 'shows-up': 1 } },
        { id: 'c', label: 'I ask questions instead of giving opinions.', resultWeights: { 'safe-place': 1 } },
        { id: 'd', label: 'I focus on keeping their spirits up either way.', resultWeights: { spark: 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'What’s your actual role in your friend group, if you’re honest?',
      choices: [
        { id: 'a', label: 'The one who makes ordinary nights feel like something.', resultWeights: { spark: 1 } },
        { id: 'b', label: 'The one who says the thing everyone’s thinking.', resultWeights: { 'real-one': 1 } },
        { id: 'c', label: 'The one who’s never once cancelled last minute.', resultWeights: { 'shows-up': 1 } },
        { id: 'd', label: 'The one people cry in front of without apologizing for it.', resultWeights: { 'safe-place': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Someone you love is spiraling over something small. Your first move?',
      choices: [
        { id: 'a', label: 'I let them spiral for a second before fixing anything.', resultWeights: { 'safe-place': 1 } },
        { id: 'b', label: 'I distract them, gently, until they can breathe again.', resultWeights: { spark: 1 } },
        { id: 'c', label: 'I tell them plainly it’s going to be okay, because I mean it.', resultWeights: { 'real-one': 1 } },
        { id: 'd', label: 'I go to them. Talking can happen after.', resultWeights: { 'shows-up': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'What would your closest friend say they trust most about you?',
      choices: [
        { id: 'a', label: 'That I’ll never just tell them what they want to hear.', resultWeights: { 'real-one': 1 } },
        { id: 'b', label: 'That I’ll actually be there. Every time.', resultWeights: { 'shows-up': 1 } },
        { id: 'c', label: 'That I won’t repeat what they told me.', resultWeights: { 'safe-place': 1 } },
        { id: 'd', label: 'That I make hard seasons feel survivable.', resultWeights: { spark: 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'If you disappeared for a week, what would people miss first?',
      choices: [
        { id: 'a', label: 'Someone reliably being there.', resultWeights: { 'shows-up': 1 } },
        { id: 'b', label: 'Someone they could finally exhale around.', resultWeights: { 'safe-place': 1 } },
        { id: 'c', label: 'The energy shifting when I walk in.', resultWeights: { spark: 1 } },
        { id: 'd', label: 'Someone who’d tell them the truth.', resultWeights: { 'real-one': 1 } },
      ],
    },
  ],
};
