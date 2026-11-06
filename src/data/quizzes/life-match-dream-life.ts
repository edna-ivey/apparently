import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/LIFE_MATCH_APPROVED_LOCKED_2026-11-01.md -- editorial version 2.0,
// owner-approved including exact gate/tie values (document's own "Locked scoring contract"
// section). Quiz id, question ids (q1-q10), and choice ids (a-d) are preserved; no real
// production data exists under this quiz_key (its award-activation migration has never been
// applied). The prior held draft's gate/tie config (highSignalQuestionIds, tieFallbackOrder,
// resultGates letters) was independently verified to already match this document's own
// numbers letter-for-letter -- carried forward unchanged.
export const LIFE_MATCH_DREAM_LIFE_QUIZ: ArchetypeQuizDefinition = {
  id: 'life-match-dream-life',
  scoringType: 'archetype',
  category: 'Life Match',
  access: 'private',
  contributesToProfile: true,
  title: 'Would Your Dream Life Actually Fit You?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: [
    'The house, the freedom, the money, the schedule. Everybody loves the dream. We’re checking the average Tuesday that comes with it.',
  ],
  introNote: 'Answer for the person you are now, not the imaginary future version of you who suddenly enjoys everything.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Check my life →',
  mixLabel: 'YOUR LIFE MATCH MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim ("Locked scoring contract"): high-signal questions Q3,Q5,Q6,Q8,Q9,Q10;
  // tie order highest eligible total -> high-signal total -> count of full +2 primary
  // selections -> FIT -> LIFESTYLE -> RELIEF -> BORROWED.
  highSignalQuestionIds: ['q3', 'q5', 'q6', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['fit', 'lifestyle', 'relief', 'borrowed'],
  // Owner-approved verbatim: "BORROWED requires 3+ BORROWED-supporting answers including 1+ of
  // Q3D, Q6D, Q9A, Q10C." / "RELIEF requires 3+ RELIEF-supporting answers including 1+ of
  // Q5A, Q7B, Q8D, Q9C, Q10D." FIT and LIFESTYLE ungated.
  resultGates: {
    borrowed: { minSignals: 3, requiredAnyOf: [['q3-d', 'q6-d', 'q9-a', 'q10-c']] },
    relief: { minSignals: 3, requiredAnyOf: [['q5-a', 'q7-b', 'q8-d', 'q9-c', 'q10-d']] },
  },
  archetypes: [
    {
      id: 'fit',
      title: 'FIT | WAIT... YOU MIGHT ACTUALLY LIKE YOUR DREAM LIFE.',
      kicker: 'The house looks lovely. You even considered who’s cleaning it.',
      apparentlySignature: 'Apparently, your dream has a realistic floor plan.',
      traits: ['Practical', 'Self-Directed', 'Reality-Ready'],
      structuredRead: {
        theVerdict: ['You planned a dream that might survive an average Tuesday. We’re impressed.'],
        theRead: ['You seem to understand that a life isn’t just a collection of achievements. It comes with responsibilities, routines, and ordinary mornings. Your answers suggest that what you want lines up reasonably well with how you actually like to live.'],
        theCallOut: ['Knowing what fits you doesn’t mean the blueprint can never change.'],
        theCost: ['You could become so attached to your original vision that you overlook a better life taking shape.'],
        tryThis: ['Write down three parts of your dream that are essential to your happiness. Let the decorations stay negotiable.'],
      },
    },
    {
      id: 'lifestyle',
      title: 'LIFESTYLE | YOU WANT THE LIFE. JUST... NOT THE LIFESTYLE.',
      kicker: 'The dream has a maintenance department. Nobody told you?',
      apparentlySignature: 'Apparently, you want the penthouse. We need to discuss the plumbing.',
      traits: ['Dream-Oriented', 'Comfort-Loving', 'Selectively Practical'],
      structuredRead: {
        theVerdict: ['You ordered the highlight reel. Unfortunately, the package includes chores. 😭'],
        theRead: ['You aren’t wrong for enjoying beautiful things, comfort, experiences, or convenience. But your answers suggest that the less glamorous work behind your dream hasn’t received quite as much attention as the reward.'],
        theCallOut: ['You may be shopping for a lifestyle by looking only at its best days.'],
        theCost: ['You could achieve exactly what you wanted and discover that maintaining it takes more of your life than enjoying it.'],
        tryThis: ['Choose one dream. Calculate the weekly time, energy, money, and support required to maintain it. Outsourcing counts, as long as it’s realistic.'],
      },
    },
    {
      id: 'relief',
      title: 'RELIEF | YOU DON’T WANT A NEW LIFE. YOU WANT RELIEF.',
      kicker: 'The dream vacation might just be a Tuesday without seventeen requests.',
      apparentlySignature: 'Apparently, your dream life is asking for backup.',
      traits: ['Peace-Seeking', 'Overextended', 'Boundary-Aware'],
      structuredRead: {
        theVerdict: ['Your dream keeps sounding suspiciously like nobody needs anything from you for a minute.'],
        theRead: ['Your answers suggest that what you’re craving may be less about a particular house, city, job, or lifestyle and more about having room to breathe. You may have real responsibilities, real pressure, or too little support. Wanting relief is not a character flaw.'],
        theCallOut: ['Before rebuilding your entire life, identify which part of it is wearing you down.'],
        theCost: ['Exhaustion can make everything feel wrong, including parts of your life you might still value under different conditions.'],
        tryThis: ['Name the biggest source of pressure and one concrete change that would reduce it. The answer might involve help, money, boundaries, or a genuinely different arrangement.'],
      },
    },
    {
      id: 'borrowed',
      title: 'BORROWED | THAT DREAM MIGHT BELONG TO SOMEBODY ELSE.',
      kicker: 'The vision board has excellent taste. We’re looking for the person who lives there.',
      apparentlySignature: 'Apparently, your dream needs your signature, not somebody else’s.',
      traits: ['Image-Aware', 'Ambitious', 'Approval-Sensitive'],
      structuredRead: {
        theVerdict: ['That’s a beautiful dream. One question: whose life are we actually designing? 👀'],
        theRead: ['Some of what you’ve been chasing may have come from what you’ve seen celebrated, admired, or expected. You can genuinely want success and still realize that certain parts were borrowed from someone else’s definition of a good life.'],
        theCallOut: ['An achievement can impress everyone and still be wrong for the person who has to maintain it.'],
        theCost: ['You could spend years building a life you enjoy describing more than living.'],
        tryThis: ['Remove the audience from one major goal. What parts would you still choose if nobody knew about them?'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You’re financially set. Working is optional. Six months later, what are you doing?',
      choices: [
        { id: 'a', label: 'I’ve picked up a project. I like having something to work toward.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'Taking trips, trying things, coming home when I feel like it. I’d enjoy that freedom.', resultWeights: { lifestyle: 2, fit: 1 } },
        { id: 'c', label: 'Sleeping properly, making appointments, and catching up on everything I’ve been putting off.', resultWeights: { relief: 2 } },
        { id: 'd', label: 'Enjoying the money, sure. But I would love for certain people to see how well I’m doing.', resultWeights: { borrowed: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'The huge dream house is finally yours. So are the repairs, bills, cleaning, and upkeep. What happens?',
      choices: [
        { id: 'a', label: 'I already factored those things in. I’d have a system.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'Honestly, I pictured the rooms more than the work. That might get old.', resultWeights: { lifestyle: 2 } },
        { id: 'c', label: 'I budget for help with the work I don’t want to do. If I can afford the house, that’s part of affording it.', resultWeights: { fit: 2 } },
        { id: 'd', label: 'I think I’d rather have a smaller place where I can close the door and finally relax.', resultWeights: { relief: 2, fit: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Nobody will ever see a picture of your dream life. Which version still sounds good?',
      choices: [
        { id: 'a', label: 'A comfortable home, steady money, people I love, and time that belongs to me.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'Big projects, new experiences, plenty to learn. I’d probably stay busy by choice.', resultWeights: { fit: 2 } },
        { id: 'c', label: 'Beautiful spaces, excellent food, memorable experiences. I like those things for myself.', resultWeights: { lifestyle: 2 } },
        { id: 'd', label: 'I’d still want nice things, but it’s harder to choose when nobody will know I have them.', resultWeights: { borrowed: 3 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your ideal life comes with routines you can’t skip. What’s your response?',
      choices: [
        { id: 'a', label: 'If the work is part of something I value, I’ll make time for it.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'I’d delegate what I could. I want to enjoy the life, not personally handle every task.', resultWeights: { lifestyle: 2, fit: 1 } },
        { id: 'c', label: 'I like the idea of it more than doing the same maintenance tasks every week.', resultWeights: { lifestyle: 2 } },
        { id: 'd', label: 'My current schedule is already full of demands. More obligations don’t sound like freedom.', resultWeights: { relief: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'When you say you’d love a simpler life, what do you actually mean?',
      choices: [
        { id: 'a', label: 'I want to stop being everyone’s default person. I need some space.', resultWeights: { relief: 3 } },
        { id: 'b', label: 'Less stuff, fewer commitments, more ordinary days. That’s genuinely what I enjoy.', resultWeights: { fit: 2 } },
        { id: 'c', label: 'Simple, but with lovely surroundings, good food, trips, and plenty of conveniences.', resultWeights: { lifestyle: 2 } },
        { id: 'd', label: 'I don’t necessarily want less to do. I want more control over what I agree to.', resultWeights: { fit: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'One year into your dream life, it’s completely normal. There’s no excitement or applause anymore. Then what?',
      choices: [
        { id: 'a', label: 'Great. I wanted a life I could enjoy repeatedly.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'I’d probably start thinking about an upgrade or something different to try.', resultWeights: { lifestyle: 2, fit: 1 } },
        { id: 'c', label: 'If the pressure has genuinely eased, ordinary sounds wonderful.', resultWeights: { relief: 2 } },
        { id: 'd', label: 'I’d be disappointed. I expected reaching that level to feel special for longer.', resultWeights: { borrowed: 3 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You can remove one thing from your current routine permanently. Which would improve your life most?',
      choices: [
        { id: 'a', label: 'Unnecessary expenses. I’d rather put my money toward things that matter.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'The expectation that I’m always available when someone needs something.', resultWeights: { relief: 2 } },
        { id: 'c', label: 'The recurring chores. I’d enjoy the good parts of life a lot more without them.', resultWeights: { lifestyle: 2 } },
        { id: 'd', label: 'That feeling that everyone else is getting ahead while I’m still catching up.', resultWeights: { borrowed: 2, relief: 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'The life you’ve been chasing turns out to be busier than the one you have now. Your reaction?',
      choices: [
        { id: 'a', label: 'I can manage busy if it feels purposeful and I know what I’m working toward.', resultWeights: { fit: 2 } },
        { id: 'b', label: 'I’d change the design. There’s no reason to keep every part of the original plan.', resultWeights: { fit: 2, lifestyle: 1 } },
        { id: 'c', label: 'That’s disappointing. I was imagining enjoying the rewards, not running another operation.', resultWeights: { lifestyle: 2 } },
        { id: 'd', label: 'No. I want room to breathe. Another packed schedule defeats the whole point.', resultWeights: { relief: 3 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'You compare a modest, peaceful future with an impressive but demanding one. Which thought sounds familiar?',
      choices: [
        { id: 'a', label: 'If I choose the quieter option, people might think I settled.', resultWeights: { borrowed: 2 } },
        { id: 'b', label: 'I need to see what both would require from me every week before deciding.', resultWeights: { fit: 2 } },
        { id: 'c', label: 'Which one would finally give me a break from all the demands on my time?', resultWeights: { relief: 2 } },
        { id: 'd', label: 'I keep picturing the impressive option, even after hearing how much maintenance it takes.', resultWeights: { lifestyle: 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Apparently offers you a life that feels exactly right, but nobody envies it or finds it impressive. Deal?',
      choices: [
        { id: 'a', label: 'Absolutely. They aren’t the ones who have to live it.', resultWeights: { fit: 3 } },
        { id: 'b', label: 'Yes. I’ll probably miss being able to show it off a little, though.', resultWeights: { fit: 2, borrowed: 1 } },
        { id: 'c', label: 'I’m not sure. Part of what I want is knowing I’ve achieved something people respect.', resultWeights: { borrowed: 3 } },
        { id: 'd', label: 'Is it less stressful? Do I have time for myself? That’s what I need to know.', resultWeights: { relief: 3 } },
      ],
    },
  ],
};
