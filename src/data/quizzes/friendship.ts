import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). The old archetypes (Ride-or-Die/
// Reality Check/Safe Place/Chaos Coordinator) were too close together and have been fully
// replaced per instruction with Emergency Contact/Reality Check/Soft Place/Instigator. All 8
// questions are new. The given spec text used an identical answer order (Emergency Contact,
// Reality Check, Soft Place, Instigator) in every single question, which fails the "letters
// must not consistently map to archetypes" requirement, so positions were rebalanced (a
// verified 4-rotation scheme applied per question) to a perfect 2-per-letter-per-archetype
// distribution across the 8 questions — every answer's exact wording/archetype stayed
// attached; only which letter it renders as moved.
export const FRIENDSHIP_QUIZ: ArchetypeQuizDefinition = {
  id: 'friendship',
  scoringType: 'archetype',
  category: 'Friendship',
  title: 'What kind of friend are you, actually?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Your friends already know.', 'Let’s see if you do.'],
  meta: '8 questions · About 2 min',
  introCta: 'Expose me →',
  introNote: 'The group chat may request a recount.',
  mixLabel: 'YOUR FRIENDSHIP MIX',
  recentReadMetricLabel: 'of your friendship picks',
  archetypes: [
    {
      id: 'emergency-contact',
      title: 'THE EMERGENCY CONTACT',
      heroRead: ['If we’re friends, you can probably call me at 2:14 a.m.'],
      body: 'You show up. Not just emotionally, but physically, practically, inconveniently. Rides, pickups, food, backup plans, emergency cash, you are the friend who starts moving while everybody else is still saying “oh my God.”',
      kicker: 'You did not volunteer as emergency contact. Somehow you are emergency contact.',
      traits: ['Loyal', 'Dependable', 'Protective'],
    },
    {
      id: 'reality-check',
      title: 'THE REALITY CHECK',
      heroRead: ['You love your friends enough to ruin a perfectly good delusion.'],
      body: 'People come to you when they want the truth, then sometimes regret how efficiently you provide it. You notice patterns, remember history, and rarely confuse being supportive with pretending a terrible idea is secretly brilliant.',
      kicker: 'You’re not a hater. You brought evidence.',
      traits: ['Honest', 'Observant', 'Direct'],
    },
    {
      id: 'soft-place',
      title: 'THE SOFT PLACE',
      heroRead: ['People accidentally tell you the truth around you.'],
      body: 'You make people feel safe enough to stop performing. You listen before fixing, ask the question underneath the question, and somehow make messy feelings feel less embarrassing just by letting them exist.',
      kicker: 'You’ve heard things. You’re taking them to the grave.',
      traits: ['Empathetic', 'Patient', 'Steady'],
    },
    {
      id: 'instigator',
      title: 'THE INSTIGATOR',
      heroRead: ['You are not always the solution.', 'You are very often the plot.'],
      body: 'You bring energy, nerve, and just enough questionable encouragement to make ordinary life more interesting. Sometimes your friends need comfort. Sometimes they need someone to say, “Okay, but hear me out...”',
      kicker: 'Somebody had to suggest the bad idea.',
      traits: ['Playful', 'Spontaneous', 'Bold'],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your friend says, “I’m thinking about texting my ex.”',
      choices: [
        { id: 'a', label: 'Do what you want. I’m on standby for the aftermath.', resultWeights: { 'emergency-contact': 1 } },
        { id: 'b', label: 'Absolutely not. Open the screenshots. We’re reviewing history.', resultWeights: { 'reality-check': 1 } },
        { id: 'c', label: 'Okay. What do you actually miss about them?', resultWeights: { 'soft-place': 1 } },
        { id: 'd', label: 'Show me the draft. If we’re doing this, we’re doing it right.', resultWeights: { instigator: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend calls and says, “I got fired.”',
      choices: [
        { id: 'a', label: 'We’re getting drinks. Then we’re plotting your comeback.', resultWeights: { instigator: 1 } },
        { id: 'b', label: 'What do you need today? Food? Ride? Money?', resultWeights: { 'emergency-contact': 1 } },
        { id: 'c', label: 'Okay... what happened for real?', resultWeights: { 'reality-check': 1 } },
        { id: 'd', label: 'First question: are you okay?', resultWeights: { 'soft-place': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: '“Be honest. Is this outfit bad?”',
      choices: [
        { id: 'a', label: 'Do you feel good in it?', resultWeights: { 'soft-place': 1 } },
        { id: 'b', label: 'Bad? No. We just haven’t committed hard enough yet.', resultWeights: { instigator: 1 } },
        { id: 'c', label: 'Come here. Let me fix what I can fix.', resultWeights: { 'emergency-contact': 1 } },
        { id: 'd', label: 'Yes. Change.', resultWeights: { 'reality-check': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your friend starts dating somebody you already don’t trust.',
      choices: [
        { id: 'a', label: 'You already know what I’m about to say.', resultWeights: { 'reality-check': 1 } },
        { id: 'b', label: 'Forget my opinion. How do you feel around them?', resultWeights: { 'soft-place': 1 } },
        { id: 'c', label: 'Can I present my concerns in PowerPoint form?', resultWeights: { instigator: 1 } },
        { id: 'd', label: 'I don’t love it. I’m still here if it blows up.', resultWeights: { 'emergency-contact': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your friend texts: “I GOT THE PROMOTION!!!”',
      choices: [
        { id: 'a', label: 'Drop the address. I’m sending something.', resultWeights: { 'emergency-contact': 1 } },
        { id: 'b', label: 'I knew it. You worked way too hard for this.', resultWeights: { 'reality-check': 1 } },
        { id: 'c', label: 'Call me. I need to hear the happy scream.', resultWeights: { 'soft-place': 1 } },
        { id: 'd', label: 'Cancel tomorrow. We’re celebrating tonight.', resultWeights: { instigator: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Your friend leans in: “Please don’t tell anybody, but...”',
      choices: [
        { id: 'a', label: 'Wait. Sit down. I need snacks for this.', resultWeights: { instigator: 1 } },
        { id: 'b', label: 'Okay. Do we need to do something?', resultWeights: { 'emergency-contact': 1 } },
        { id: 'c', label: 'Fine. But if this is a bad idea, I’m saying so.', resultWeights: { 'reality-check': 1 } },
        { id: 'd', label: 'Okay. Tell me. I’m listening.', resultWeights: { 'soft-place': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your friend is crying in the bathroom at a party.',
      choices: [
        { id: 'a', label: 'Sit down. Cry first.', resultWeights: { 'soft-place': 1 } },
        { id: 'b', label: 'We’re fixing the mascara. Then we’ll reassess.', resultWeights: { instigator: 1 } },
        { id: 'c', label: 'Grab your bag. We’re leaving.', resultWeights: { 'emergency-contact': 1 } },
        { id: 'd', label: 'Okay, but what actually happened?', resultWeights: { 'reality-check': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your friend is about to make a terrible decision.',
      choices: [
        { id: 'a', label: 'No. And I have reasons.', resultWeights: { 'reality-check': 1 } },
        { id: 'b', label: 'What do you actually want underneath all this?', resultWeights: { 'soft-place': 1 } },
        { id: 'c', label: 'How terrible? Some bad ideas become great stories.', resultWeights: { instigator: 1 } },
        { id: 'd', label: 'I have my shoes on. I’m coming over.', resultWeights: { 'emergency-contact': 1 } },
      ],
    },
  ],
};
