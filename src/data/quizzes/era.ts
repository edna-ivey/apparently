import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). The old 80s/90s/2000s/2010s
// structure has been DELETED per instruction and replaced with vibe-named results (Golden
// Age/Retro Era/Y2K Era/Always-On Era), each carrying its year/period as a `resultSubtitle`
// (shown on the result screen, never during questions — see types.ts/scoring.ts for the
// generic optional field this uses). All 8 questions are new and written as CURRENT
// preferences/behaviors, never decade trivia or "did you own X" — a 22-year-old can land
// Golden Age and a 50-year-old can land Always-On. The given spec text used an identical
// answer order in every single question, which fails the "letters must not consistently map
// to results" requirement, so positions were rebalanced (a verified 4-rotation scheme applied
// per question) to a perfect 2-per-letter-per-era distribution across the 8 questions — every
// answer's exact wording/era stayed attached; only which letter it renders as moved.
export const ERA_QUIZ: ArchetypeQuizDefinition = {
  id: 'era',
  scoringType: 'archetype',
  category: 'Nostalgia',
  access: 'free',
  title: 'What era are you emotionally stuck in?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Not your birth year.', 'Your natural operating system.'],
  meta: '8 questions · About 2 min',
  introCta: 'Find my era →',
  introNote: 'Actual age is inadmissible evidence.',
  mixLabel: 'YOUR ERA MIX',
  recentReadMetricLabel: 'of your era picks',
  archetypes: [
    {
      id: 'golden-age',
      title: 'THE GOLDEN AGE',
      resultSubtitle: '1950s',
      heroRead: ['If it’s important, sit down and say it with your whole face.'],
      body: 'You like intention. Face-to-face conversations, actual plans, good manners, privacy, and fewer moving parts. Constant access does not automatically feel like progress to you. Sometimes simple really is better.',
      kicker: 'We already made the plan. Why are we still discussing the plan?',
      traits: ['Intentional', 'Classic', 'Grounded'],
      profileSignals: [
        { dimension: 'private_open', value: 2 },
        { dimension: 'planner_spontaneous', value: 1 },
      ],
    },
    {
      id: 'retro-era',
      title: 'THE RETRO ERA',
      resultSubtitle: '1980s',
      heroRead: ['Call me, make the plan, then go live your life.'],
      body: 'You like bold energy, independence, spontaneity, and enough technology to be useful without requiring constant coordination. You do not need fourteen messages to leave the house.',
      kicker: 'You do not need a group chat to go somewhere.',
      traits: ['Bold', 'Independent', 'Spontaneous'],
      profileSignals: [
        { dimension: 'independent_collaborative', value: 2 },
        { dimension: 'planner_spontaneous', value: -1 },
        { dimension: 'adventure_comfort', value: 1 },
      ],
    },
    {
      id: 'y2k-era',
      title: 'THE Y2K ERA',
      // The generic naive title-caser turns the acronym into "Y2k" — spelled out explicitly.
      displayTitle: 'The Y2K Era',
      resultSubtitle: '2000s',
      heroRead: ['You like your personality customized and your internet slightly unhinged.'],
      body: 'You want things expressive, personal, dramatic, funny, and unmistakably yours. Long texts, inside jokes, pop culture rabbit holes, custom everything, and just enough digital chaos to make life interesting.',
      kicker: 'Your away message would have required emotional interpretation.',
      traits: ['Expressive', 'Playful', 'Obsessive'],
      profileSignals: [
        { dimension: 'private_open', value: -2 },
        { dimension: 'playful_serious', value: 1 },
      ],
    },
    {
      id: 'always-on-era',
      title: 'THE ALWAYS-ON ERA',
      // The generic naive title-caser only capitalizes after a space, not after a hyphen —
      // spelled out explicitly so "On" doesn't render lowercase.
      displayTitle: 'The Always-On Era',
      resultSubtitle: 'TODAY',
      heroRead: ['Send the pin, the link, the ETA, and preferably all three.'],
      body: 'You like instant access, efficient coordination, streaming, delivery, live updates, and knowing the answer while the question is still happening. If technology can remove three steps, you see no reason to keep the three steps.',
      kicker: 'If the answer exists, why are we waiting?',
      traits: ['Connected', 'Efficient', 'Current'],
      profileSignals: [
        { dimension: 'patient_urgent', value: -2 },
        { dimension: 'practical_idealistic', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "Somebody says, 'We should hang out sometime.' What's your response?",
      choices: [
        { id: 'a', label: "Okay, what day? Because 'sometime' is not a date.", resultWeights: { "golden-age": 1 } },
        { id: 'b', label: "Cool. Call me when you're serious.", resultWeights: { "retro-era": 1 } },
        { id: 'c', label: "Now I'm planning outfits, taking pictures, and making it a whole event.", resultWeights: { "y2k-era": 1 } },
        { id: 'd', label: "Sending the calendar invite before you change your mind.", resultWeights: { "always-on-era": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "Your friend is 30 minutes late. No text. Nothing.",
      choices: [
        { id: 'a', label: "I'm checking their location. Are you alive or just disrespectful?", resultWeights: { "always-on-era": 1 } },
        { id: 'b', label: "I'll wait a little longer, but we're discussing this.", resultWeights: { "golden-age": 1 } },
        { id: 'c', label: "I already left. Enjoy wherever you are.", resultWeights: { "retro-era": 1 } },
        { id: 'd', label: "I've sent six dramatic messages and a GIF of a skeleton waiting.", resultWeights: { "y2k-era": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "Your friend tells you some unbelievable gossip. What's first?",
      choices: [
        { id: 'a', label: "Wait. Start from the beginning. I need every detail.", resultWeights: { "y2k-era": 1 } },
        { id: 'b', label: "Names, screenshots, timestamps. Let's establish the facts.", resultWeights: { "always-on-era": 1 } },
        { id: 'c', label: "Have you actually talked to the person involved?", resultWeights: { "golden-age": 1 } },
        { id: 'd', label: "That's wild. Anyway, what are we eating?", resultWeights: { "retro-era": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "You suddenly have a whole Saturday with no obligations.",
      choices: [
        { id: 'a', label: "I'm going wherever the day takes me. No itinerary, no check-ins.", resultWeights: { "retro-era": 1 } },
        { id: 'b', label: "I'm turning this into a whole experience. Outfit, pictures, soundtrack.", resultWeights: { "y2k-era": 1 } },
        { id: 'c', label: "I've already found three things to do, compared reviews, and booked one.", resultWeights: { "always-on-era": 1 } },
        { id: 'd', label: "A nice breakfast, a little self-care, and quality time with my people.", resultWeights: { "golden-age": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "Someone is interested in dating you. What wins you over?",
      choices: [
        { id: 'a', label: "Consistency. Make plans, keep them, and mean what you say.", resultWeights: { "golden-age": 1 } },
        { id: 'b', label: "Someone who gives me space and doesn't need constant updates.", resultWeights: { "retro-era": 1 } },
        { id: 'c', label: "Someone who makes me laugh so hard we develop our own language.", resultWeights: { "y2k-era": 1 } },
        { id: 'd', label: "Someone who communicates clearly and doesn't leave me guessing for days.", resultWeights: { "always-on-era": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "Plans fall apart at the last minute. What's your reaction?",
      choices: [
        { id: 'a', label: "Okay, new plan. I've already found two alternatives.", resultWeights: { "always-on-era": 1 } },
        { id: 'b', label: "Let's reschedule properly so everybody knows what's happening.", resultWeights: { "golden-age": 1 } },
        { id: 'c', label: "Perfect. Now we can do whatever we want.", resultWeights: { "retro-era": 1 } },
        { id: 'd', label: "Well, this is officially a plot twist. Somebody get snacks.", resultWeights: { "y2k-era": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "Your favorite person has something big to celebrate. What do you do?",
      choices: [
        { id: 'a', label: "I'm planning a whole surprise. There will be a theme. There may be tears.", resultWeights: { "y2k-era": 1 } },
        { id: 'b', label: "I've got the reservation, gift delivery, and group chat handled.", resultWeights: { "always-on-era": 1 } },
        { id: 'c', label: "Something thoughtful and personal. I want them to remember it.", resultWeights: { "golden-age": 1 } },
        { id: 'd', label: "I'm showing up with their favorite thing. No production necessary.", resultWeights: { "retro-era": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "What kind of world would suit your personality best?",
      choices: [
        { id: 'a', label: "One where I can disappear for a while and nobody takes it personally.", resultWeights: { "retro-era": 1 } },
        { id: 'b', label: "One where people can be extra, expressive, and unapologetically themselves.", resultWeights: { "y2k-era": 1 } },
        { id: 'c', label: "One where everything is convenient, transparent, and moves FAST.", resultWeights: { "always-on-era": 1 } },
        { id: 'd', label: "One where people are considerate, keep their word, and make real time for each other.", resultWeights: { "golden-age": 1 } },
      ],
    },
  ],
};
