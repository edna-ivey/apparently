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
      prompt: 'You wake up to 74 unread messages.',
      choices: [
        { id: 'a', label: 'Start from the beginning. I need context.', resultWeights: { lurker: 1 } },
        { id: 'b', label: 'Scroll until I find out who is upset.', resultWeights: { therapist: 1 } },
        { id: 'c', label: 'Skip to the bottom and respond to the funniest part.', resultWeights: { 'meme-department': 1 } },
        { id: 'd', label: '“Can somebody summarize this meeting?”', resultWeights: { 'chaos-coordinator': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Somebody sends one message: “Y’all...”',
      choices: [
        { id: 'a', label: '“Are you okay?”', resultWeights: { therapist: 1 } },
        { id: 'b', label: 'I already have the reaction GIF ready.', resultWeights: { 'meme-department': 1 } },
        { id: 'c', label: '“WHO DID IT?”', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'd', label: 'I’m reading immediately.', resultWeights: { lurker: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Friday plans have been discussed for two days and nobody has actually decided anything.',
      choices: [
        { id: 'a', label: 'I’m making jokes about how we’ll still be deciding Friday night.', resultWeights: { 'meme-department': 1 } },
        { id: 'b', label: 'I pick the place. Democracy had its chance.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'c', label: 'I’ll go wherever everyone lands. Just tell me when.', resultWeights: { lurker: 1 } },
        { id: 'd', label: 'I’m trying to find the option everybody can live with.', resultWeights: { therapist: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone deletes a message before you read it.',
      choices: [
        { id: 'a', label: 'I need somebody who saw it to report immediately.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'b', label: 'I noticed. I will be watching quietly.', resultWeights: { lurker: 1 } },
        { id: 'c', label: 'If they wanted to say it, they’ll say it when they’re ready.', resultWeights: { therapist: 1 } },
        { id: 'd', label: '“OH NOW WHAT DID YOU DELETE???”', resultWeights: { 'meme-department': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'One of the most active people in the chat suddenly goes quiet for a few days.',
      choices: [
        { id: 'a', label: 'I send something I know will make them respond.', resultWeights: { 'meme-department': 1 } },
        { id: 'b', label: 'I ask the group if anybody has heard from them.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'c', label: 'I notice, but I’ll give them space.', resultWeights: { lurker: 1 } },
        { id: 'd', label: 'I check on them privately.', resultWeights: { therapist: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Two friends start arguing in the chat.',
      choices: [
        { id: 'a', label: 'I’m checking on both of them separately.', resultWeights: { therapist: 1 } },
        { id: 'b', label: 'I’m trying to stop this from becoming a congressional hearing.', resultWeights: { 'meme-department': 1 } },
        { id: 'c', label: 'Okay, enough. Let’s actually deal with what happened.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'd', label: 'I’m watching. I’m not getting drafted into this.', resultWeights: { lurker: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Somebody’s birthday is next week.',
      choices: [
        { id: 'a', label: 'Somehow I’m now coordinating dinner, cake, and reservations.', resultWeights: { 'chaos-coordinator': 1 } },
        { id: 'b', label: 'I know. I’ve known. I simply haven’t said anything.', resultWeights: { lurker: 1 } },
        { id: 'c', label: 'I remember the little thing they mentioned wanting months ago.', resultWeights: { therapist: 1 } },
        { id: 'd', label: 'They’re getting the funniest birthday post of their life.', resultWeights: { 'meme-department': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'You leave the group chat for one week. What falls apart first?',
      choices: [
        { id: 'a', label: 'Nobody knows who saw what.', resultWeights: { lurker: 1 } },
        { id: 'b', label: 'Somebody realizes no one is checking on everybody.', resultWeights: { therapist: 1 } },
        { id: 'c', label: 'The chat becomes painfully unfunny.', resultWeights: { 'meme-department': 1 } },
        { id: 'd', label: 'They are still discussing Saturday plans on Sunday.', resultWeights: { 'chaos-coordinator': 1 } },
      ],
    },
  ],
};
