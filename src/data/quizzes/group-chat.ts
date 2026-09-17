import type { ArchetypeQuizDefinition } from './types';

// New for the Explore expansion sprint — Friendship's second free quiz. Archetype scoring,
// same rigor as Crisis/Friendship: 8 questions, one archetype per choice, a rotating position
// schedule so no letter consistently maps to an archetype (verified programmatically — see
// the sprint's content validation script), a perfect 2-per-letter-per-archetype distribution.
export const GROUP_CHAT_QUIZ: ArchetypeQuizDefinition = {
  id: 'group-chat',
  scoringType: 'archetype',
  category: 'Friendship',
  access: 'free',
  title: 'Who are you in the group chat?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Everybody has a role.', 'Yours has probably never been said out loud.'],
  meta: '8 questions · About 2 min',
  introCta: 'Expose the chat →',
  introNote: 'This will get forwarded. We already know.',
  mixLabel: 'YOUR GROUP CHAT MIX',
  recentReadMetricLabel: 'of your group chat picks',
  archetypes: [
    {
      id: 'lurker',
      title: 'THE LURKER',
      heroRead: ['You read every message.', 'You reply to maybe three of them.'],
      body: 'You’re not checked out — you’re just economical. You catch everything, you just don’t feel the need to narrate your presence. When you finally do say something, people actually stop and read it.',
      kicker: 'Online, but make it mysterious.',
      traits: ['Observant', 'Selective', 'Low-key'],
      profileSignals: [
        { dimension: 'private_open', value: 2 },
        { dimension: 'social_attunement', value: 1 },
      ],
    },
    {
      id: 'therapist',
      title: 'THE THERAPIST',
      heroRead: ['You check in.', 'Nobody asked you to. You just do it.'],
      body: 'You notice the small shift before anyone says anything is wrong, and you’re already typing before you’ve fully processed why. It’s not performative — it’s just how you’re wired. People save your messages.',
      kicker: 'Unlicensed. Extremely effective anyway.',
      traits: ['Empathetic', 'Attentive', 'Steady'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'protective_hands_off', value: 1 },
      ],
    },
    {
      id: 'meme-department',
      title: 'THE MEME DEPARTMENT',
      heroRead: ['Words are optional.', 'You have a gif for everything.'],
      body: 'You communicate in reaction images and you’re never wrong about which one. When things get heavy, you’re the one who knows exactly how to lighten it without dismissing it. It’s a skill. Nobody’s found the manual.',
      kicker: 'The group chat’s unofficial Chief Vibes Officer.',
      traits: ['Playful', 'Quick', 'Perceptive'],
      profileSignals: [
        { dimension: 'playful_serious', value: 2 },
        { dimension: 'curious_decisive', value: -1 },
      ],
    },
    {
      id: 'chaos-coordinator',
      title: 'THE CHAOS COORDINATOR',
      heroRead: ['Nobody voted for you.', 'Somehow you’re planning everything anyway.'],
      body: 'A vague suggestion becomes a full itinerary within the hour, entirely because of you. You don’t wait for consensus — you just start moving, and everyone somehow ends up exactly where you said to be.',
      kicker: 'Democracy was considered. Briefly.',
      traits: ['Decisive', 'Organized', 'Bold'],
      profileSignals: [
        { dimension: 'control_allowing', value: 2 },
        { dimension: 'planner_spontaneous', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone drops a huge life update in the chat.',
      choices: [
        { id: 'a', label: 'I read it. I say nothing. I will discuss later, privately.', resultWeights: { lurker: 1 } },
        { id: 'b', label: 'I ask three follow-up questions immediately.', resultWeights: { therapist: 1 } },
        { id: 'c', label: 'I respond with exactly one perfect gif.', resultWeights: { 'meme-department': 1 } },
        { id: 'd', label: 'I immediately suggest we all get on a call RIGHT NOW.', resultWeights: { 'chaos-coordinator': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'It’s been quiet in the chat for four days.',
      choices: [
        { id: 'a', label: 'I check in. “Everyone okay? Haven’t heard from y’all.”', resultWeights: { therapist: 1 } },
        { id: 'b', label: 'I post something unhinged to revive it.', resultWeights: { 'meme-department': 1 } },
        { id: 'c', label: 'I start planning something just to force activity.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'd', label: 'Perfect. I like it quiet.', resultWeights: { lurker: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone asks “anyone free Friday?”',
      choices: [
        { id: 'a', label: 'I reply with a meme instead of an actual answer.', resultWeights: { 'meme-department': 1 } },
        { id: 'b', label: 'I’ve already made a poll.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'c', label: 'I see it. I do not respond for six hours.', resultWeights: { lurker: 1 } },
        { id: 'd', label: 'I ask what everyone’s actually in the mood for.', resultWeights: { therapist: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'A minor disagreement breaks out between two members.',
      choices: [
        { id: 'a', label: 'I address it head-on in the group. Somebody has to.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'b', label: 'I mute the chat until it’s over.', resultWeights: { lurker: 1 } },
        { id: 'c', label: 'I DM both of them separately to check in.', resultWeights: { therapist: 1 } },
        { id: 'd', label: 'I post something to lighten the mood.', resultWeights: { 'meme-department': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Someone posts a blurry, chaotic photo dump from the weekend.',
      choices: [
        { id: 'a', label: 'I’m already captioning three of these.', resultWeights: { 'meme-department': 1 } },
        { id: 'b', label: 'I’m making a plan for us to do this again, bigger.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'c', label: 'I like it. That’s my whole contribution.', resultWeights: { lurker: 1 } },
        { id: 'd', label: 'I ask who that person in photo 4 was.', resultWeights: { therapist: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Someone vague-posts something sad.',
      choices: [
        { id: 'a', label: 'I’m typing “you okay?” before I even finish reading.', resultWeights: { therapist: 1 } },
        { id: 'b', label: 'I don’t know what to say so I send a comfort gif.', resultWeights: { 'meme-department': 1 } },
        { id: 'c', label: 'I’m already organizing backup. Who’s near them?', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'd', label: 'I watch quietly. I’ll reach out privately.', resultWeights: { lurker: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'The chat has been arguing about restaurant options for 45 minutes.',
      choices: [
        { id: 'a', label: 'I just pick one and tell everyone where to be.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'b', label: 'I have opinions. I share none of them.', resultWeights: { lurker: 1 } },
        { id: 'c', label: 'I try to find something everyone can agree on.', resultWeights: { therapist: 1 } },
        { id: 'd', label: 'I post a meme about how long this is taking.', resultWeights: { 'meme-department': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Someone asks, “what’s the group chat’s whole personality, actually?”',
      choices: [
        { id: 'a', label: 'I don’t say anything. Fitting.', resultWeights: { lurker: 1 } },
        { id: 'b', label: 'Emotional support hotline, unofficially.', resultWeights: { therapist: 1 } },
        { id: 'c', label: 'A meme archive with occasional human activity.', resultWeights: { 'meme-department': 1 } },
        { id: 'd', label: 'Whoever’s making the plans nobody agreed to.', resultWeights: { 'chaos-coordinator': 1 } },
      ],
    },
  ],
};
