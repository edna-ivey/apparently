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
        { id: 'a', label: 'Start from the beginning. I need context.', resultWeights: { "lurker": 1 } },
        { id: 'b', label: 'Scroll until I find out who is upset.', resultWeights: { "therapist": 1 } },
        { id: 'c', label: 'Skip to the bottom and respond to the funniest part.', resultWeights: { "meme-department": 1 } },
        { id: 'd', label: '“Can somebody summarize this meeting?”', resultWeights: { "chaos-coordinator": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "Somebody drops “Y'all...” in the group chat and then disappears.",
      choices: [
        { id: 'a', label: '“Are you okay?”', resultWeights: { "therapist": 1 } },
        { id: 'b', label: "I'm already searching for the perfect reaction GIF.", resultWeights: { "meme-department": 1 } },
        { id: 'c', label: "“WHO DID WHAT? Don't start this and leave.”", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'd', label: "I immediately open the chat. I'm not typing a thing, though.", resultWeights: { "lurker": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "Friday plans have been discussed for two days, and nobody has actually decided anything.",
      choices: [
        { id: 'a', label: "“At this point, we should just schedule another meeting to discuss the meeting.”", resultWeights: { "meme-department": 1 } },
        { id: 'b', label: "“We're going to this place at 7. You're welcome.”", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'c', label: "I'll show up wherever y'all decide. Just send the address.", resultWeights: { "lurker": 1 } },
        { id: 'd', label: "I'm asking what everybody actually wants so we can finally agree.", resultWeights: { "therapist": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "Someone sends a message, then deletes it before you can read it.",
      choices: [
        { id: 'a', label: "“WHO SAW IT? I need screenshots immediately.”", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'b', label: "I saw the notification. I will be conducting my investigation silently.", resultWeights: { "lurker": 1 } },
        { id: 'c', label: "If they deleted it, they probably had a reason. I'll leave it alone.", resultWeights: { "therapist": 1 } },
        { id: 'd', label: "“Oh, so we're deleting evidence now? Interesting.”", resultWeights: { "meme-department": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "The person who normally sends 47 messages a day hasn't said a word in three days.",
      choices: [
        { id: 'a', label: "I'm sending the most ridiculous meme I can find. Let's see if they're alive.", resultWeights: { "meme-department": 1 } },
        { id: 'b', label: "“Has anybody heard from them? Because this is suspicious.”", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'c', label: "I noticed on day one. I'm just giving them space.", resultWeights: { "lurker": 1 } },
        { id: 'd', label: "I'm texting them privately to make sure they're okay.", resultWeights: { "therapist": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "Two friends start arguing in the group chat. It's getting personal.",
      choices: [
        { id: 'a', label: "I'm checking on both of them separately before this gets worse.", resultWeights: { "therapist": 1 } },
        { id: 'b', label: "“Your Honor, I'd like to submit this GIF into evidence.”", resultWeights: { "meme-department": 1 } },
        { id: 'c', label: "“Okay, enough. What actually happened? Let's deal with it.”", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'd', label: "I'm reading every message. My name will not appear in this conversation.", resultWeights: { "lurker": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "Somebody's birthday is next week. What's your contribution?",
      choices: [
        { id: 'a', label: "Somehow, I've become the event planner, restaurant booker, and payment collector.", resultWeights: { "chaos-coordinator": 1 } },
        { id: 'b', label: "I remembered their birthday. That was my contribution.", resultWeights: { "lurker": 1 } },
        { id: 'c', label: "I already know the perfect gift because I remember what they mentioned six months ago.", resultWeights: { "therapist": 1 } },
        { id: 'd', label: "I'm preparing a birthday post that might actually get me blocked.", resultWeights: { "meme-department": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "The group chat has been completely dead for a week. What brings it back to life?",
      choices: [
        { id: 'a', label: "I finally respond to something from six days ago like it was sent this morning.", resultWeights: { "lurker": 1 } },
        { id: 'b', label: "I check on everybody because something feels off.", resultWeights: { "therapist": 1 } },
        { id: 'c', label: "I drop a meme so disrespectfully accurate that everybody comes running back.", resultWeights: { "meme-department": 1 } },
        { id: 'd', label: "I announce plans and suddenly everybody remembers how to type.", resultWeights: { "chaos-coordinator": 1 } },
      ],
    },
  ],
};
