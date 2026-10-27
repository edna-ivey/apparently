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
      heroRead: ['Your friends don’t have a support system. They have you on speed dial.'],
      body: 'You are the friend people call when everything has officially gone left. Need a ride? You’re grabbing your keys. Need food? You’re asking what they want. Need somebody to help clean up a disaster you specifically warned them about? Unfortunately, you’re available for that too. Your loyalty is beautiful. Your inability to mind your business when somebody you love is struggling? A full-time unpaid position.',
      kicker: 'Apparently, being everybody’s backup plan wasn’t on your calendar. Yet here we are.',
      traits: ['Loyal', 'Dependable', 'Protective'],
      profileSignals: [
        { dimension: 'protective_hands_off', value: 2 },
        { dimension: 'control_allowing', value: 1 },
      ],
    },
    {
      id: 'reality-check',
      title: 'THE REALITY CHECK',
      heroRead: ['You are the reason your friends stopped asking for honest opinions.'],
      body: 'You love your people. Deeply. Unfortunately for them, love does not come with a complimentary delusion package. You remember what happened last time, you notice what everybody else is pretending not to see, and you will absolutely interrupt a bad decision before it becomes a six-month healing journey. Your delivery could occasionally use a seatbelt, but your intentions are solid.',
      kicker: 'Apparently, the truth hurts. You just happen to deliver it express.',
      traits: ['Honest', 'Observant', 'Direct'],
      profileSignals: [
        { dimension: 'direct_indirect', value: 2 },
        { dimension: 'trust_verify', value: -1 },
      ],
    },
    {
      id: 'soft-place',
      title: 'THE SOFT PLACE',
      heroRead: ['People tell you things they haven’t even admitted to themselves.'],
      body: 'You’re the friend who makes somebody say, ‘I wasn’t even planning to tell anyone this,’ and then proceeds to hear their entire childhood backstory. You listen, you notice the little changes in people’s voices, and you somehow make difficult conversations feel safe. But here’s the thing: being everybody’s emotional safe place doesn’t mean you have to become their unpaid therapist. You’re allowed to have a bad day too.',
      kicker: 'Apparently, your emotional office hours are 24/7.',
      traits: ['Empathetic', 'Patient', 'Steady'],
      profileSignals: [
        { dimension: 'social_attunement', value: 2 },
        { dimension: 'patient_urgent', value: 1 },
      ],
    },
    {
      id: 'instigator',
      title: 'THE INSTIGATOR',
      heroRead: ['You are not a bad influence. You’re a very enthusiastic accomplice.'],
      body: 'You bring the energy, the audacity, and the kind of encouragement that starts with ‘Hear me out’ and ends with everybody having a story they can’t tell at work. You don’t always create the chaos, but you have an impressive ability to recognize its entertainment potential. Your friends love having you around because life is never boring. Their decision-making skills, however, have filed a complaint.',
      kicker: 'Apparently, the group chat was peaceful before you logged on.',
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
