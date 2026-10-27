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
  access: 'free',
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
      profileSignals: [
        { dimension: 'protective_hands_off', value: 2 },
        { dimension: 'control_allowing', value: 1 },
      ],
    },
    {
      id: 'reality-check',
      title: 'THE REALITY CHECK',
      heroRead: ['You love your friends enough to ruin a perfectly good delusion.'],
      body: 'People come to you when they want the truth, then sometimes regret how efficiently you provide it. You notice patterns, remember history, and rarely confuse being supportive with pretending a terrible idea is secretly brilliant.',
      kicker: 'You’re not a hater. You brought evidence.',
      traits: ['Honest', 'Observant', 'Direct'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'soft-place',
      title: 'THE SOFT PLACE',
      heroRead: ['People accidentally tell you the truth around you.'],
      body: 'You make people feel safe enough to stop performing. You listen before fixing, ask the question underneath the question, and somehow make messy feelings feel less embarrassing just by letting them exist.',
      kicker: 'You’ve heard things. You’re taking them to the grave.',
      traits: ['Empathetic', 'Patient', 'Steady'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'instigator',
      title: 'THE INSTIGATOR',
      heroRead: ['You are not always the solution.', 'You are very often the plot.'],
      body: 'You bring energy, nerve, and just enough questionable encouragement to make ordinary life more interesting. Sometimes your friends need comfort. Sometimes they need someone to say, “Okay, but hear me out...”',
      kicker: 'Somebody had to suggest the bad idea.',
      traits: ['Playful', 'Spontaneous', 'Bold'],
      profileSignals: [
        { dimension: 'playful_serious', value: 2 },
        { dimension: 'planner_spontaneous', value: -1 },
        { dimension: 'adventure_comfort', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: "Your friend says, “I think I’m gonna text my ex.” Again.",
      choices: [
        { id: 'a', label: "Do what you want. Just know my phone will be on when this goes left.", resultWeights: { "emergency-contact": 1 } },
        { id: 'b', label: "Absolutely not. Pull up the screenshots. Apparently we need a refresher course.", resultWeights: { "reality-check": 1 } },
        { id: 'c', label: "Okay, but do you miss THEM, or do you miss having somebody to text?", resultWeights: { "soft-place": 1 } },
        { id: 'd', label: "Show me the draft. If we're reopening this circus, at least let me edit the announcement.", resultWeights: { "instigator": 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: "Your friend calls: “I got fired.” Then says, “But hear me out...”",
      choices: [
        { id: 'a', label: "We're getting food, then we're plotting your comeback. In that order.", resultWeights: { "instigator": 1 } },
        { id: 'b', label: "Do you need money, a ride, or somebody to help you pack your desk?", resultWeights: { "emergency-contact": 1 } },
        { id: 'c', label: "Before I pick a side, tell me the part you're leaving out.", resultWeights: { "reality-check": 1 } },
        { id: 'd', label: "Forget the job for a second. Are YOU okay?", resultWeights: { "soft-place": 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: "Your friend sends an outfit pic: “Be honest.” You know they cannot handle honest.",
      choices: [
        { id: 'a', label: "Do YOU feel good in it? Because that's what matters. Mostly.", resultWeights: { "soft-place": 1 } },
        { id: 'b', label: "It's not ugly. It just needs a better attitude. And maybe different shoes.", resultWeights: { "instigator": 1 } },
        { id: 'c', label: "Give me ten minutes and your closet. We're not going out like this.", resultWeights: { "emergency-contact": 1 } },
        { id: 'd', label: "You asked for honesty. Change.", resultWeights: { "reality-check": 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: "Your friend introduces their new boo. It's giving walking red flag, but they're smiling.",
      choices: [
        { id: 'a', label: "You want my opinion? Because I have exhibits A through F.", resultWeights: { "reality-check": 1 } },
        { id: 'b', label: "Forget my face. How do YOU feel when you're around them?", resultWeights: { "soft-place": 1 } },
        { id: 'c', label: "Should I make a PowerPoint, or are we pretending we don't see this?", resultWeights: { "instigator": 1 } },
        { id: 'd', label: "I don't trust them, but I'm not abandoning you to learn that lesson alone.", resultWeights: { "emergency-contact": 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "Your friend gets promoted and immediately starts acting like they're the CEO.",
      choices: [
        { id: 'a', label: "Drop your address. I'm sending you something before your ego needs its own zip code.", resultWeights: { "emergency-contact": 1 } },
        { id: 'b', label: "I'm proud of you. Now remember who proofread that resume.", resultWeights: { "reality-check": 1 } },
        { id: 'c', label: "Call me. I want the whole story, including the part where you almost cried.", resultWeights: { "soft-place": 1 } },
        { id: 'd', label: "Cancel your plans. We're celebrating like you bought the company.", resultWeights: { "instigator": 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: "Your friend says, “Promise you won't judge me.” That is never a good opening.",
      choices: [
        { id: 'a', label: "Hold on. Let me get comfortable. This sounds expensive.", resultWeights: { "instigator": 1 } },
        { id: 'b', label: "Do I need shoes, bail money, or just emotional availability?", resultWeights: { "emergency-contact": 1 } },
        { id: 'c', label: "I promise to listen. I did NOT promise to agree.", resultWeights: { "reality-check": 1 } },
        { id: 'd', label: "Tell me. You don't have to make it sound pretty.", resultWeights: { "soft-place": 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: "Your friend is crying in the bathroom at a party. The music is still going.",
      choices: [
        { id: 'a', label: "Come here. Cry it out. Nobody's rushing you.", resultWeights: { "soft-place": 1 } },
        { id: 'b', label: "Okay, who's responsible? Because I can ruin somebody's night with a playlist.", resultWeights: { "instigator": 1 } },
        { id: 'c', label: "Grab your stuff. We're leaving. I'll deal with the questions later.", resultWeights: { "emergency-contact": 1 } },
        { id: 'd', label: "Before I get mad on your behalf, tell me exactly what happened.", resultWeights: { "reality-check": 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: "Your friend is one bad decision away from becoming the group chat's next three-week discussion.",
      choices: [
        { id: 'a', label: "Absolutely not. I'm not helping you turn a warning sign into a life lesson.", resultWeights: { "reality-check": 1 } },
        { id: 'b', label: "What are you actually hoping this fixes? Because I don't think it's what you think.", resultWeights: { "soft-place": 1 } },
        { id: 'c', label: "Okay, but HOW bad? Because some mistakes come with excellent stories.", resultWeights: { "instigator": 1 } },
        { id: 'd', label: "I'm putting my shoes on. I refuse to let you be stupid unsupervised.", resultWeights: { "emergency-contact": 1 } },
      ],
    },
  ],
};
