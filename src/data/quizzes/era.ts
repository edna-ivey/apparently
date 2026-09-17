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
      prompt: 'You need to have an important conversation.',
      choices: [
        { id: 'a', label: 'Face to face. Sit down with me.', resultWeights: { 'golden-age': 1 } },
        { id: 'b', label: 'Call me. Let’s actually talk.', resultWeights: { 'retro-era': 1 } },
        { id: 'c', label: 'Text me the whole story. Receipts included.', resultWeights: { 'y2k-era': 1 } },
        { id: 'd', label: 'Voice note me now. I need tone and speed.', resultWeights: { 'always-on-era': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friends are meeting at 7.',
      choices: [
        { id: 'a', label: 'Send the pin, your ETA, and your location.', resultWeights: { 'always-on-era': 1 } },
        { id: 'b', label: 'We made the plan. I’ll see you at 7.', resultWeights: { 'golden-age': 1 } },
        { id: 'c', label: 'Call me if anything changes.', resultWeights: { 'retro-era': 1 } },
        { id: 'd', label: 'The group chat will somehow produce 73 messages first.', resultWeights: { 'y2k-era': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'You had an amazing night. What happens to the photos?',
      choices: [
        { id: 'a', label: 'Thirty-seven photos, captions, and inside jokes.', resultWeights: { 'y2k-era': 1 } },
        { id: 'b', label: 'Best ones edited and posted before bed.', resultWeights: { 'always-on-era': 1 } },
        { id: 'c', label: 'One good photo. Everybody looking at the camera.', resultWeights: { 'golden-age': 1 } },
        { id: 'd', label: 'A few candids. Then back to the night.', resultWeights: { 'retro-era': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'You find a song you LOVE.',
      choices: [
        { id: 'a', label: 'Turn it up. I don’t need a playlist strategy.', resultWeights: { 'retro-era': 1 } },
        { id: 'b', label: 'I’m making a playlist with a dramatic name.', resultWeights: { 'y2k-era': 1 } },
        { id: 'c', label: 'The algorithm already queued my next obsession.', resultWeights: { 'always-on-era': 1 } },
        { id: 'd', label: 'Put on the whole album and let it play.', resultWeights: { 'golden-age': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Early dating. Pick your style.',
      choices: [
        { id: 'a', label: 'Ask me out face to face. Pick a time.', resultWeights: { 'golden-age': 1 } },
        { id: 'b', label: 'Call me. Make a plan.', resultWeights: { 'retro-era': 1 } },
        { id: 'c', label: 'Long texts, inside jokes, light profile stalking.', resultWeights: { 'y2k-era': 1 } },
        { id: 'd', label: 'Screenshots are already in the group chat.', resultWeights: { 'always-on-era': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You’re going somewhere you’ve never been.',
      choices: [
        { id: 'a', label: 'GPS, live traffic, ETA sent.', resultWeights: { 'always-on-era': 1 } },
        { id: 'b', label: 'Give me the address and directions before I leave.', resultWeights: { 'golden-age': 1 } },
        { id: 'c', label: 'I’ll figure it out. Call if I get lost.', resultWeights: { 'retro-era': 1 } },
        { id: 'd', label: 'I printed directions and somehow still missed a turn.', resultWeights: { 'y2k-era': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You find a show you LOVE. What’s next?',
      choices: [
        { id: 'a', label: 'I’m on fan pages, quotes, and episode recaps now.', resultWeights: { 'y2k-era': 1 } },
        { id: 'b', label: 'Whole season tonight. Sleep has been canceled.', resultWeights: { 'always-on-era': 1 } },
        { id: 'c', label: 'One episode a week. I like having something to look forward to.', resultWeights: { 'golden-age': 1 } },
        { id: 'd', label: 'If it’s on, I’m watching. No homework.', resultWeights: { 'retro-era': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Pick the world you would most happily live in.',
      choices: [
        { id: 'a', label: 'You can disappear for hours and nobody launches an investigation.', resultWeights: { 'retro-era': 1 } },
        { id: 'b', label: 'Custom profiles, away messages, ridiculous ringtones.', resultWeights: { 'y2k-era': 1 } },
        { id: 'c', label: 'Same-day delivery, live locations, and answers instantly.', resultWeights: { 'always-on-era': 1 } },
        { id: 'd', label: 'People dress up, host, and make real plans.', resultWeights: { 'golden-age': 1 } },
      ],
    },
  ],
};
