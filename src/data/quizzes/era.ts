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
      heroRead: ['You were born for a world where people had manners, plans, and the decency to show up when they said they would.'],
      body: 'You believe in real conversations, thoughtful gestures, and putting a little effort into things. You like your plans confirmed, your intentions clear, and your relationships built on something sturdier than a three-day texting streak. You’re not necessarily old-fashioned. You just think some things were better before everybody started calling basic consideration “doing too much.”',
      kicker: 'You don’t need a time machine. You need people with home training.',
      traits: ['Intentional', 'Classic Standards', 'Keeps Their Word'],
      apparentlySignature: 'Apparently, you have standards, and society keeps acting like that’s a personality flaw.',
      profileSignals: [
        { dimension: 'private_open', value: 2 },
        { dimension: 'planner_spontaneous', value: 1 },
      ],
    },
    {
      id: 'retro-era',
      title: 'THE RETRO ERA',
      resultSubtitle: '1980s',
      heroRead: ['You belong to the era when people went outside, figured things out, and nobody needed your location every twelve minutes.'],
      body: 'You like freedom, loud music, real fun, and being able to live your life without providing a full incident report afterward. You’re resourceful, independent, and perfectly capable of having an amazing time without documenting every second. You’re not against technology. You just don’t think everybody needs unlimited access to you because you own a phone.',
      kicker: 'Your phone could die at noon and you’d still somehow have a better day than everybody else.',
      traits: ['Unbothered', 'Free Spirit', 'Offline Energy'],
      apparentlySignature: 'Apparently, you’re not hard to reach. You’re just not available for everybody’s nonsense.',
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
      heroRead: ['You were built for custom ringtones, dramatic away messages, and friendships with enough inside jokes to qualify as their own language.'],
      body: 'You make everything a little more entertaining than it needs to be. A simple night out becomes a photo album. A crush becomes a developing storyline. A song becomes the soundtrack to a situation you haven’t even fully experienced yet. You’re expressive, curious, and deeply committed to the art of making ordinary moments feel iconic. Sometimes you’re doing the most, but at least you’re giving everybody something to talk about.',
      kicker: 'Your away message was absolutely about somebody, and you know it.',
      traits: ['Main Character', 'Playfully Dramatic', 'Inside-Joke Royalty'],
      apparentlySignature: 'Apparently, you’ve never met a situation you couldn’t turn into a whole storyline.',
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
      heroRead: ['You were made for a world where everything is instant, everybody is searchable, and patience is apparently an optional subscription.'],
      body: 'You’re quick, connected, and allergic to unnecessary waiting. You want the information, the receipts, the ETA, and preferably a tracking number. You can organize a night out, investigate a suspicious profile, and discover a new obsession before somebody else has finished saying, “Let me get back to you.” You know how to make modern life work for you. Unfortunately, you’ve also forgotten what it’s like to wait five minutes without checking something.',
      kicker: 'You’ve checked the delivery status four times. The order was placed six minutes ago.',
      traits: ['Instant Answers', 'Receipts Ready', 'Zero Patience'],
      apparentlySignature: 'Apparently, you want instant gratification with same-day shipping and a confirmation email.',
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
