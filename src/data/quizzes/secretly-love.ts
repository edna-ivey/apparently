import type { ArchetypeQuizDefinition } from './types';

// Apparently Private's ONE real playable free preview — the gateway quiz. Content-polish pass
// (post-launch content review): all four results rewritten to the approved "gold" copy, all
// eight questions replaced with the new authored set. Q8's wording is LOCKED — its answer
// text is exactly as authored and must not be reworded (its on-screen letter position is
// still part of the same balanced rotation every other question uses).
//
// Fully playable, no special-casing anywhere: it feeds local history, remote quiz_results, and
// personality_evidence exactly like every other quiz (see src/app/quiz/[quizId].tsx and
// submit_quiz_result — neither branches on access at all). `access: 'private-preview'` is
// merchandising metadata only, read by Explore/private.tsx to decide WHERE this card shows up
// and how it's badged — it changes nothing about scoring, persistence, or the You profile.
//
// Display positions verified programmatically: each archetype lands on each letter exactly
// twice across the 8 questions.
export const SECRETLY_LOVE_QUIZ: ArchetypeQuizDefinition = {
  id: 'secretly-love',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private-preview',
  // Superseded by keep-you-around as Apparently Private's active OPEN preview (see
  // private.tsx) — retained here, fully registered and playable via direct/shared links, so
  // historical completions/shares keep resolving. Excludes it from "current playable quizzes"
  // surfaces (e.g. admin Quiz Analytics) without deleting or altering anything about it.
  historicalOnly: true,
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
      heroRead: [
        'People know you’ll actually come.',
        'That matters more than you think.',
        'Not “thinking of you.”',
        'Not “let me know if you need anything.”',
        'Come.',
      ],
      body: 'You remember the appointment. You make the drive. You carry the bag. You follow up after everybody else assumes the crisis is over. You notice the annoying little thing that needs doing and somehow it gets done. You may not always be the softest person in someone’s life. But when life gets real, people know exactly who they want beside them.',
      kicker: 'Your love has receipts.',
      traits: ['Dependable', 'Protective', 'Grounded'],
      profileSignals: [
        { dimension: 'protective_hands_off', value: 2 },
        { dimension: 'practical_idealistic', value: 1 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'safe-place',
      title: 'THE SAFE PLACE',
      heroRead: ['People accidentally tell you the truth.', 'Then immediately feel lighter for having said it.'],
      body: 'There is something about you that makes people stop editing themselves. They can be embarrassed. Messy. Confused. Not emotional enough. You don’t rush to fix the feeling or make them package it neatly enough for you to understand. You make room first.',
      kicker: 'Not everyone feels like somewhere you can put your bags down.',
      traits: ['Warm', 'Perceptive', 'Patient'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
        { dimension: 'sentimental_thick_skinned', value: 1 },
      ],
    },
    {
      id: 'spark',
      title: 'THE SPARK',
      heroRead: ['The room doesn’t feel the same', 'the second you walk out of it.'],
      body: 'You make regular life feel less regular. A grocery run becomes a story. A boring dinner gets funny. Somebody who was sitting quietly suddenly feels included. People stay an extra hour because leaving while you’re still there somehow feels premature. You don’t necessarily have to be the loudest person in the room. You just make the room feel more alive.',
      kicker: '“Remember that time...” is apparently part of your brand.',
      traits: ['Magnetic', 'Playful', 'Warm'],
      profileSignals: [
        { dimension: 'playful_serious', value: 2 },
        { dimension: 'private_open', value: -1 },
        { dimension: 'adventure_comfort', value: 1 },
      ],
    },
    {
      id: 'real-one',
      title: 'THE REAL ONE',
      heroRead: ['You don’t tell people what they want to hear.', 'You tell them what’s true.'],
      body: 'But this isn’t just about being blunt. People trust you because your loyalty doesn’t disappear when honesty becomes inconvenient. You will defend them when they aren’t there, call them out when they need it, and keep the same energy privately that you have publicly. You don’t hand out fake enthusiasm or convenient loyalty. When you say it, people know you mean it.',
      kicker: 'You are not everybody’s cup of tea. The right people stopped asking for tea.',
      traits: ['Honest', 'Loyal', 'Direct'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'protective_hands_off', value: 1 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your friend has been stressing about a big appointment all week. What do you do?',
      choices: [
        { id: 'a', label: 'Text them before it starts. I remembered.', resultWeights: { 'shows-up': 1 } },
        { id: 'b', label: 'Check in after and ask how it really went.', resultWeights: { 'safe-place': 1 } },
        { id: 'c', label: 'Send something funny to break the tension.', resultWeights: { spark: 1 } },
        { id: 'd', label: 'Give them the pep talk they actually need.', resultWeights: { 'real-one': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend tells you something embarrassing, then says, “don’t judge me.”',
      choices: [
        { id: 'a', label: 'Make it safe enough to tell the rest.', resultWeights: { 'safe-place': 1 } },
        { id: 'b', label: 'Tell them something ridiculous I’ve done too.', resultWeights: { spark: 1 } },
        { id: 'c', label: 'Tell them the truth without making it cruel.', resultWeights: { 'real-one': 1 } },
        { id: 'd', label: 'Help them fix whatever can still be fixed.', resultWeights: { 'shows-up': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone you love finally gets the thing they’ve worked for forever.',
      choices: [
        { id: 'a', label: 'Turn it into a whole celebration. Obviously.', resultWeights: { spark: 1 } },
        { id: 'b', label: 'Remind them how far they’ve come.', resultWeights: { 'real-one': 1 } },
        { id: 'c', label: 'Handle the details so they can enjoy it.', resultWeights: { 'shows-up': 1 } },
        { id: 'd', label: 'Tell them exactly why I’m proud of them.', resultWeights: { 'safe-place': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your friend has cancelled on you twice because life is a mess.',
      choices: [
        { id: 'a', label: 'Ask what’s really going on.', resultWeights: { 'real-one': 1 } },
        { id: 'b', label: 'Find one small thing I can take off their plate.', resultWeights: { 'shows-up': 1 } },
        { id: 'c', label: 'Give them space without making them feel guilty.', resultWeights: { 'safe-place': 1 } },
        { id: 'd', label: 'Keep sending little things that make them smile.', resultWeights: { spark: 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Somebody starts talking badly about your friend when they aren’t there.',
      choices: [
        { id: 'a', label: 'Change the whole energy before it gets ugly.', resultWeights: { spark: 1 } },
        { id: 'b', label: 'Correct anything that isn’t true.', resultWeights: { 'real-one': 1 } },
        { id: 'c', label: 'Shut it down. They’re not here to defend themselves.', resultWeights: { 'shows-up': 1 } },
        { id: 'd', label: 'If there’s a fair point, I’ll admit that. I’m still not letting everybody tear my friend apart.', resultWeights: { 'safe-place': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You’re spending the day doing boring errands with your favorite person.',
      choices: [
        { id: 'a', label: 'We barely need to talk. It’s still nice.', resultWeights: { 'safe-place': 1 } },
        { id: 'b', label: 'Somehow errands turn into an entire adventure.', resultWeights: { spark: 1 } },
        { id: 'c', label: 'Eventually I ask what’s really been on their mind.', resultWeights: { 'real-one': 1 } },
        { id: 'd', label: 'I remembered something they completely forgot.', resultWeights: { 'shows-up': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You’re mad at someone you love. What happens?',
      choices: [
        { id: 'a', label: 'I say what bothered me and deal with it.', resultWeights: { 'real-one': 1 } },
        { id: 'b', label: 'I’m still doing the little things I always do.', resultWeights: { 'shows-up': 1 } },
        { id: 'c', label: 'I take space without making them feel abandoned.', resultWeights: { 'safe-place': 1 } },
        { id: 'd', label: 'Eventually one of us is going to laugh.', resultWeights: { spark: 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'You disappear for a week. Which text are you MOST likely to get?',
      choices: [
        { id: 'a', label: '“Please come back. Nobody remembers anything around here.”', resultWeights: { 'shows-up': 1 } },
        { id: 'b', label: '“I have SO much to tell you.”', resultWeights: { 'safe-place': 1 } },
        { id: 'c', label: '“It has been painfully boring without you.”', resultWeights: { spark: 1 } },
        { id: 'd', label: '“I need your opinion. Everybody else is sugarcoating it.”', resultWeights: { 'real-one': 1 } },
      ],
    },
  ],
};
