import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved (Content + Explore Revamp). Result archetypes/copy are KEPT
// EXACTLY per instruction — the user loves these results. The 12 old questions were replaced
// with 8 new short/playful ones. The given letter order in the new spec put Improviser at D
// in every single question (8/8), which fails the "letters must not consistently map to
// archetypes" requirement, so positions were rebalanced (verified programmatically) to a
// perfect 2-per-letter-per-archetype distribution across the 8 questions — every answer's
// exact wording/archetype stayed attached; only which letter it renders as moved.
export const CRISIS_QUIZ: ArchetypeQuizDefinition = {
  id: 'crisis',
  scoringType: 'archetype',
  category: 'Ridiculous',
  access: 'free',
  title: 'Which version of you shows up in a crisis?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Plans fall apart.', 'People start panicking.', 'Who shows up?'],
  meta: '8 questions · About 2 min',
  introCta: 'Put me under pressure →',
  introNote: 'No actual emergencies required.',
  mixLabel: 'YOUR CRISIS MIX',
  recentReadMetricLabel: 'of your crisis picks',
  archetypes: [
    {
      id: 'commander',
      title: 'THE COMMANDER',
      heroRead: ['Everyone is panicking.', 'Congratulations, you’ve been promoted.'],
      body: 'When things go sideways, you tend to get decisive fast. You organize the chaos, make the call, and start assigning jobs before anyone has officially agreed you’re in charge.',
      kicker: 'Nobody voted. Somehow you’re leading.',
      traits: ['Decisive', 'Direct', 'Protective'],
      profileSignals: [
        { dimension: 'control_allowing', value: 2 },
        { dimension: 'curious_decisive', value: -2 },
        { dimension: 'direct_indirect', value: 1 },
      ],
    },
    {
      id: 'fixer',
      title: 'THE FIXER',
      heroRead: ['You already have three solutions.', 'Nobody asked yet.'],
      body: 'Your brain goes straight to the problem. What broke? What do we need? What can we do right now? You feel better when something useful is happening, preferably immediately.',
      kicker: 'Feelings are welcome after we solve the problem.',
      traits: ['Resourceful', 'Practical', 'Focused'],
      profileSignals: [
        { dimension: 'practical_idealistic', value: 2 },
        { dimension: 'patient_urgent', value: -1 },
      ],
    },
    {
      id: 'anchor',
      title: 'THE ANCHOR',
      heroRead: ['The situation may be a mess.', 'You are not adding to it.'],
      body: 'When everyone else gets louder, you tend to get steadier. You notice who is overwhelmed, lower the temperature, and somehow make people feel like this might actually be okay.',
      kicker: 'Every chaotic group has one emotional support human.',
      traits: ['Steady', 'Supportive', 'Observant'],
      profileSignals: [
        { dimension: 'emotional_intensity', value: -2 },
        { dimension: 'conflict_peacekeeping', value: -1 },
        { dimension: 'social_attunement', value: 1 },
      ],
    },
    {
      id: 'improviser',
      title: 'THE IMPROVISER',
      heroRead: ['Was there a plan?', 'Cute.'],
      body: 'You adapt quickly when reality refuses to cooperate. You trust your instincts, work with what you have, and are surprisingly good at turning “well, this is bad” into “okay, here’s what we’re doing.”',
      kicker: 'Plan B is more of a lifestyle.',
      traits: ['Adaptable', 'Instinctive', 'Creative'],
      profileSignals: [
        { dimension: 'planner_spontaneous', value: -2 },
        { dimension: 'adventure_comfort', value: 1 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Group trip. The car won’t start. Everybody looks at you.',
      choices: [
        { id: 'a', label: 'Hood’s up. I’m figuring out what’s wrong.', resultWeights: { fixer: 1 } },
        { id: 'b', label: 'Everybody breathe. The car is broken, not the trip.', resultWeights: { anchor: 1 } },
        { id: 'c', label: 'You call roadside. You call the hotel. I’ll handle the rest.', resultWeights: { commander: 1 } },
        { id: 'd', label: 'Uber, rental car, stranger with jumper cables. New plan.', resultWeights: { improviser: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'The restaurant lost your reservation for eight.',
      choices: [
        { id: 'a', label: 'Fine. Drinks somewhere else. Dinner just became an adventure.', resultWeights: { improviser: 1 } },
        { id: 'b', label: 'I need the manager. Now. We had a reservation.', resultWeights: { commander: 1 } },
        { id: 'c', label: 'I’m checking every restaurant nearby before anybody finishes complaining.', resultWeights: { fixer: 1 } },
        { id: 'd', label: 'Nobody be rude to the hostess. We are still eating tonight.', resultWeights: { anchor: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your friend calls: “Okay, don’t freak out...”',
      choices: [
        { id: 'a', label: 'Are you safe? Okay. I’m here.', resultWeights: { anchor: 1 } },
        { id: 'b', label: 'Is this “oops” bad or “come get me” bad?', resultWeights: { improviser: 1 } },
        { id: 'c', label: 'Where are you? Who’s with you?', resultWeights: { commander: 1 } },
        { id: 'd', label: 'Start at the beginning. I need facts.', resultWeights: { fixer: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your flight gets canceled while you’re standing at the gate.',
      choices: [
        { id: 'a', label: 'I’m checking every flight, airport, and route within 200 miles.', resultWeights: { fixer: 1 } },
        { id: 'b', label: 'Everybody relax. Worst case, we stay another night.', resultWeights: { anchor: 1 } },
        { id: 'c', label: 'Bonus vacation day. Where are we eating?', resultWeights: { improviser: 1 } },
        { id: 'd', label: 'Everybody stay here. I’m going to the desk.', resultWeights: { commander: 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your phone disappears at a crowded event.',
      choices: [
        { id: 'a', label: 'Nobody moves. You check there. I’ll check here.', resultWeights: { commander: 1 } },
        { id: 'b', label: 'Find My iPhone. Call it. Lock it. Done.', resultWeights: { fixer: 1 } },
        { id: 'c', label: 'Okay. It’s a phone. You’re safe. One thing at a time.', resultWeights: { anchor: 1 } },
        { id: 'd', label: 'Well... apparently I’m off-grid now.', resultWeights: { improviser: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'The power goes out during a storm.',
      choices: [
        { id: 'a', label: 'Candles. Snacks. We live like pioneers now.', resultWeights: { improviser: 1 } },
        { id: 'b', label: 'Flashlights. Chargers. Breaker. I’m checking everything.', resultWeights: { fixer: 1 } },
        { id: 'c', label: 'Everybody okay? Good. We’re fine.', resultWeights: { anchor: 1 } },
        { id: 'd', label: 'Nobody open the fridge. Phones on low power.', resultWeights: { commander: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Water is pouring from under the kitchen sink.',
      choices: [
        { id: 'a', label: 'You grab towels. You move that. I’m shutting the water.', resultWeights: { commander: 1 } },
        { id: 'b', label: 'Bucket underneath. Temporary fix. Tomorrow problem.', resultWeights: { improviser: 1 } },
        { id: 'c', label: 'Find the shutoff valve. Towels. Plumber.', resultWeights: { fixer: 1 } },
        { id: 'd', label: 'Get everybody out of the kitchen. Nobody panic.', resultWeights: { anchor: 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Crisis over. What are you doing now?',
      choices: [
        { id: 'a', label: 'Checking on everybody one more time.', resultWeights: { anchor: 1 } },
        { id: 'b', label: 'Reviewing what went wrong so this never happens again.', resultWeights: { commander: 1 } },
        { id: 'c', label: 'Telling the story like it was hilarious.', resultWeights: { improviser: 1 } },
        { id: 'd', label: 'Fixing the last thing nobody noticed.', resultWeights: { fixer: 1 } },
      ],
    },
  ],
};
