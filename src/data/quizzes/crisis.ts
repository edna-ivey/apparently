import type { ArchetypeQuizDefinition } from './types';

// Copy is exact and approved. Answer-to-letter positions are intentionally NOT the order the
// content was originally drafted in — the originally-drafted letter assignment skewed heavily
// toward Commander-at-B (6/12) and Improviser-at-D (6/12), which fails the "letters must not
// consistently map to archetypes" requirement. Positions below were rebalanced (verified
// programmatically) so every archetype appears in every letter slot exactly 3 times across
// the 12 questions — every answer's exact wording and archetype stayed attached; only which
// letter it renders as moved. See the implementation report for the full before/after table.
export const CRISIS_QUIZ: ArchetypeQuizDefinition = {
  id: 'crisis',
  scoringType: 'archetype',
  title: 'Which version of you shows up in a crisis?',
  eyebrow: 'PERSONALITY QUIZ',
  introSupport: ['Plans fall apart.', 'People start panicking.', 'Who shows up?'],
  meta: '12 questions · About 3 min',
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
    },
    {
      id: 'fixer',
      title: 'THE FIXER',
      heroRead: ['You already have three solutions.', 'Nobody asked yet.'],
      body: 'Your brain goes straight to the problem. What broke? What do we need? What can we do right now? You feel better when something useful is happening, preferably immediately.',
      kicker: 'Feelings are welcome after we solve the problem.',
      traits: ['Resourceful', 'Practical', 'Focused'],
    },
    {
      id: 'anchor',
      title: 'THE ANCHOR',
      heroRead: ['The situation may be a mess.', 'You are not adding to it.'],
      body: 'When everyone else gets louder, you tend to get steadier. You notice who is overwhelmed, lower the temperature, and somehow make people feel like this might actually be okay.',
      kicker: 'Every chaotic group has one emotional support human.',
      traits: ['Steady', 'Supportive', 'Observant'],
    },
    {
      id: 'improviser',
      title: 'THE IMPROVISER',
      heroRead: ['Was there a plan?', 'Cute.'],
      body: 'You adapt quickly when reality refuses to cooperate. You trust your instincts, work with what you have, and are surprisingly good at turning “well, this is bad” into “okay, here’s what we’re doing.”',
      kicker: 'Plan B is more of a lifestyle.',
      traits: ['Adaptable', 'Instinctive', 'Creative'],
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your group trip hits a problem and suddenly nobody knows what the plan is.',
      choices: [
        { id: 'a', label: 'Give me five minutes. I’m figuring out our actual options.', resultWeights: { fixer: 1 } },
        { id: 'b', label: 'We’ll make something work. What do we have?', resultWeights: { improviser: 1 } },
        { id: 'c', label: '“Okay, everybody stop. Here’s what we’re doing.”', resultWeights: { commander: 1 } },
        { id: 'd', label: 'I’m checking who is stressed before we decide anything.', resultWeights: { anchor: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'The restaurant lost your reservation for eight people.',
      choices: [
        { id: 'a', label: 'I need to speak to whoever can actually fix this.', resultWeights: { commander: 1 } },
        { id: 'b', label: 'First, nobody turn on each other. We are still eating tonight.', resultWeights: { anchor: 1 } },
        { id: 'c', label: 'I’m already checking nearby places with openings.', resultWeights: { fixer: 1 } },
        { id: 'd', label: 'Honestly? New restaurant. Adventure time.', resultWeights: { improviser: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your friend calls and opens with: “Okay, don’t freak out…”',
      choices: [
        { id: 'a', label: 'I’m already thinking about what they need me to do.', resultWeights: { fixer: 1 } },
        { id: 'b', label: 'Too late. Tell me exactly what happened.', resultWeights: { commander: 1 } },
        { id: 'c', label: 'My voice immediately gets calmer.', resultWeights: { anchor: 1 } },
        { id: 'd', label: 'I need the story before I know how concerned I am.', resultWeights: { improviser: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'The power goes out during a storm.',
      choices: [
        { id: 'a', label: 'I’m making sure everyone is okay first.', resultWeights: { anchor: 1 } },
        { id: 'b', label: 'Flashlights, chargers, food situation. I’m checking supplies.', resultWeights: { fixer: 1 } },
        { id: 'c', label: 'Nobody open the fridge. Phones on low power mode. Listen up.', resultWeights: { commander: 1 } },
        { id: 'd', label: 'Candles. Snacks. We live like pioneers now.', resultWeights: { improviser: 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your presentation stops working two minutes before you have to present.',
      choices: [
        { id: 'a', label: 'Fine. I know the material. We’re doing this without it.', resultWeights: { improviser: 1 } },
        { id: 'b', label: 'I’m troubleshooting cables, files, AirPlay, everything.', resultWeights: { fixer: 1 } },
        { id: 'c', label: 'I’m keeping myself and everyone else from spiraling.', resultWeights: { anchor: 1 } },
        { id: 'd', label: 'I’m telling everyone what we need and buying us two minutes.', resultWeights: { commander: 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Someone you love is crying and can barely explain what happened.',
      choices: [
        { id: 'a', label: 'I sit with them first. The details can wait.', resultWeights: { anchor: 1 } },
        { id: 'b', label: 'I follow their lead. Talk, silence, food, drive around? We can pivot.', resultWeights: { improviser: 1 } },
        { id: 'c', label: '“Who did what?”', resultWeights: { commander: 1 } },
        { id: 'd', label: 'I’m listening for enough information to know what would actually help.', resultWeights: { fixer: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your airport gate changes and half your group is nowhere near you.',
      choices: [
        { id: 'a', label: 'Worst case, we meet at the plane. Everybody has legs.', resultWeights: { improviser: 1 } },
        { id: 'b', label: 'I start calling people with extremely specific instructions.', resultWeights: { commander: 1 } },
        { id: 'c', label: 'I’m finding the fastest route and checking boarding time.', resultWeights: { fixer: 1 } },
        {
          id: 'd',
          label: 'I’m making sure nobody feels like they’re about to be abandoned in Terminal B.',
          resultWeights: { anchor: 1 },
        },
      ],
    },
    {
      id: 'q8',
      prompt: 'Something breaks at home at the absolute worst possible time.',
      choices: [
        { id: 'a', label: 'Is everyone okay? Great. Now we deal with the thing.', resultWeights: { anchor: 1 } },
        { id: 'b', label: 'Nobody touch anything until I figure out what happened.', resultWeights: { commander: 1 } },
        { id: 'c', label: 'Temporary solution first. We can make this work tonight.', resultWeights: { improviser: 1 } },
        { id: 'd', label: 'I’m already looking up the manual, replacement part, or repair person.', resultWeights: { fixer: 1 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'A misunderstanding in the group chat suddenly becomes a whole situation.',
      choices: [
        { id: 'a', label: 'I’m calling somebody because text has clearly failed us.', resultWeights: { commander: 1 } },
        { id: 'b', label: 'I’m privately checking on the person who seems most upset.', resultWeights: { anchor: 1 } },
        { id: 'c', label: 'I’m trying to defuse it with context, humor, or whatever works.', resultWeights: { improviser: 1 } },
        { id: 'd', label: 'Let’s establish what was actually said before this gets worse.', resultWeights: { fixer: 1 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'You are lost somewhere unfamiliar and your phone is at 8%.',
      choices: [
        { id: 'a', label: 'I’m asking a person. We are not dying because nobody wanted to speak.', resultWeights: { commander: 1 } },
        { id: 'b', label: 'I’m studying signs, landmarks, and whatever information we have.', resultWeights: { fixer: 1 } },
        { id: 'c', label: 'Pick a direction. Adjust as necessary. We move.', resultWeights: { improviser: 1 } },
        { id: 'd', label: 'I’m reminding everyone that being lost is not the same as being doomed.', resultWeights: { anchor: 1 } },
      ],
    },
    {
      id: 'q11',
      prompt: 'A surprise expense shows up and it is definitely not in the budget.',
      choices: [
        { id: 'a', label: 'I’m moving numbers around until this makes sense.', resultWeights: { fixer: 1 } },
        { id: 'b', label: 'Annoying, but we’ll figure it out somehow.', resultWeights: { improviser: 1 } },
        { id: 'c', label: 'I need ten minutes before anyone starts catastrophizing.', resultWeights: { anchor: 1 } },
        { id: 'd', label: 'First question: what absolutely has to happen right now?', resultWeights: { commander: 1 } },
      ],
    },
    {
      id: 'q12',
      prompt: 'The crisis is finally over. What are you most likely doing?',
      choices: [
        { id: 'a', label: 'Telling the story like it was the funniest thing that ever happened.', resultWeights: { improviser: 1 } },
        { id: 'b', label: 'Checking on everybody one more time.', resultWeights: { anchor: 1 } },
        { id: 'c', label: 'Fixing the one remaining loose end nobody else noticed.', resultWeights: { fixer: 1 } },
        { id: 'd', label: 'Reviewing what went wrong so this never happens again.', resultWeights: { commander: 1 } },
      ],
    },
  ],
};
