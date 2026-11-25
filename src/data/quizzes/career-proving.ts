import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/CAREER_PROVING_APPROVED_LOCKED_2026-10-31.md -- owner-approved
// editorial replacement, including exact gate/tie values (document's "Independently tested
// scoring and reachability" section already ran all four winning paths plus a 100,000-path
// simulation against the real scoreArchetypeQuiz engine before approval). Quiz id, question
// ids (q1-q10), and choice ids (a-d) are preserved; no real production data exists under this
// quiz_key (its award-activation migration has never been applied).
export const CAREER_PROVING_QUIZ: ArchetypeQuizDefinition = {
  id: 'career-ambition-proving',
  scoringType: 'archetype',
  category: 'Career & Ambition',
  access: 'private',
  contributesToProfile: true,
  title: 'Are You Ambitious... or Proving Something?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: [
    'Success hits different when it has an audience.',
    "You can want success, recognition, and a little revenge. We're finding out who's actually driving.",
  ],
  introNote: 'Choose what you’d really think or do. Your inspirational-caption version can sit this one out.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Expose me →',
  mixLabel: 'YOUR CAREER & AMBITION MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim: "Tie order: highest eligible total, then high-signal
  // contributions from Q1, Q3, Q5, Q6, Q9, Q10, then number of +2 primary selections, then
  // CLAP -> SEEN -> PROVE -> PERFORM."
  highSignalQuestionIds: ['q1', 'q3', 'q5', 'q6', 'q9', 'q10'],
  tieFallbackOrder: ['nobody-clapped', 'want-it-seen', 'proving-something', 'performing-for'],
  // Owner-approved verbatim: "PERFORM only eligible after at least two among Q1C, Q6D, Q10A,
  // and at least one among Q3B, Q5C, Q9B, so at least 3 separate supporting questions."
  resultGates: {
    'performing-for': {
      minSignals: 3,
      requiredGroups: [
        { answers: ['q1-c', 'q6-d', 'q10-a'], min: 2 },
        { answers: ['q3-b', 'q5-c', 'q9-b'], min: 1 },
      ],
    },
  },
  archetypes: [
    {
      id: 'nobody-clapped',
      title: 'CLAP | YOU’D STILL WANT IT IF NOBODY CLAPPED',
      kicker: 'Nobody has to clap. But occasionally, you should.',
      apparentlySignature: 'Apparently, your ambition doesn’t need an audience. Just a purpose.',
      traits: ['Self-Directed', 'Grounded', 'Quietly Ambitious'],
      structuredRead: {
        theVerdict: ['You actually want the life. The announcement is just a nice accessory.'],
        theRead: ['Your satisfaction comes from what you build, learn, earn, or experience. Recognition feels good, but it isn’t carrying the whole dream. That’s a freedom plenty of people don’t realize they’re missing.'],
        theCallOut: ["Being internally driven doesn't automatically mean you're good at celebrating yourself."],
        theCost: ['You can spend so much time climbing that every finished goal becomes yesterday’s news.'],
        tryThis: ["Name one thing you've already achieved that deserves a proper celebration."],
      },
    },
    {
      id: 'want-it-seen',
      title: 'SEEN | YOU WANT THE WIN... AND YOU WANT IT SEEN',
      kicker: "The spotlight is fun. It shouldn't be your boss.",
      apparentlySignature: 'Apparently, your ambition enjoys a standing ovation.',
      traits: ['Ambitious', 'Recognition-Motivated', 'Socially Aware'],
      structuredRead: {
        theVerdict: ['You want the achievement. And yes, you’d also appreciate a little applause. 😂'],
        theRead: ['You care about the work, but being acknowledged makes it sweeter. That’s human. The danger starts when being seen becomes part of what makes a goal worth pursuing.'],
        theCallOut: ['Wanting people to celebrate with you is different from needing them to be impressed.'],
        theCost: ["Your confidence can become dependent on reactions you don't control."],
        tryThis: ['Celebrate your next accomplishment privately before telling anyone.'],
      },
    },
    {
      id: 'proving-something',
      title: 'PROVE | YOU’RE STILL TRYING TO PROVE SOMETHING',
      kicker: 'Revenge makes a dramatic vision board. Peace makes a better life.',
      apparentlySignature: 'Apparently, you’ve been winning arguments nobody knows are happening.',
      traits: ['Driven', 'Competitive', 'Validation-Sensitive'],
      structuredRead: {
        theVerdict: ['Oh. Somebody from your past is still sitting in the boardroom. 😂'],
        theRead: ['Your ambition is real, but so is that little file labeled WATCH ME. Maybe someone doubted you, rejected you, or made you feel behind. Proving them wrong became part of the fuel.'],
        theCallOut: ['Spite can start an impressive career. It probably shouldn’t be CEO.'],
        theCost: ['The people you claim not to care about can end up deciding when you’re allowed to feel successful.'],
        tryThis: ['Ask: "Would I still want this if they never found out?"'],
      },
    },
    {
      id: 'performing-for',
      title: 'PERFORM | WHO EXACTLY ARE WE PERFORMING FOR?',
      kicker: "The audience can go home. You're the one who has to live there.",
      apparentlySignature: 'Apparently, your dream has a seating chart.',
      traits: ['Image-Conscious', 'Achievement-Focused', 'Approval-Seeking'],
      structuredRead: {
        theVerdict: ["You may have built an entire success plan for an audience that doesn't pay rent. 👀"],
        theRead: ['Some of your goals appear designed to look impressive before they feel meaningful. The title, the lifestyle, the story. You’ve considered who would notice. Have you considered whether you’d enjoy living it?'],
        theCallOut: ["A successful-looking life isn't automatically a successful-feeling life."],
        theCost: ["You could spend years maintaining achievements you wouldn't have chosen without witnesses."],
        tryThis: ['Take one major goal and remove every imagined reaction. Would you still choose it?'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You land the dream opportunity. Nobody who ever underestimated you will hear about it. Does that change the win?',
      choices: [
        { id: 'a', label: "\"It still counts. Though I'd be lying if I said I didn't want to share the news.\"", resultWeights: { 'want-it-seen': 2, 'nobody-clapped': 1 } },
        { id: 'b', label: 'Not really. I got the opportunity, not a press tour.', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'c', label: 'Honestly? A big part of the fantasy was imagining their reactions.', resultWeights: { 'performing-for': 3, 'want-it-seen': 1 } },
        { id: 'd', label: "There's one specific person I would've liked to prove wrong. Just one.", resultWeights: { 'proving-something': 2, 'want-it-seen': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone you secretly compare yourself to announces a huge win. Your own life is going fine. What happens?',
      choices: [
        { id: 'a', label: "I'm immediately wondering what they figured out that I haven't.", resultWeights: { 'proving-something': 2, 'nobody-clapped': 1 } },
        { id: 'b', label: 'Good for them. My plans haven’t changed.', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'c', label: "I'm happy for them. Also, when is it my turn to have something worth celebrating?", resultWeights: { 'want-it-seen': 2, 'proving-something': 1 } },
        { id: 'd', label: 'I start mentally explaining why they had it easier. Then I catch myself doing it.', resultWeights: { 'proving-something': 2, 'performing-for': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Four possible futures. You only get one. Which would you choose?',
      choices: [
        { id: 'a', label: 'Good income, control over my schedule, and no impressive title.', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'b', label: 'A widely admired role, even if the day-to-day life is more demanding.', resultWeights: { 'performing-for': 2, 'want-it-seen': 2 } },
        { id: 'c', label: "Becoming exceptionally good at something most people won't understand.", resultWeights: { 'nobody-clapped': 2 } },
        { id: 'd', label: "Finishing the thing people said I couldn't, even if it takes years.", resultWeights: { 'proving-something': 2, 'nobody-clapped': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Which compliment would stay with you the longest?',
      choices: [
        { id: 'a', label: '"I was wrong about what you could accomplish."', resultWeights: { 'proving-something': 2 } },
        { id: 'b', label: '"We noticed how hard you worked for this."', resultWeights: { 'want-it-seen': 2 } },
        { id: 'c', label: '"What you built made things better for everybody here."', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'd', label: '"I honestly didn\'t think you\'d get this far."', resultWeights: { 'proving-something': 2, 'performing-for': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'An opportunity would give you excellent money, freedom, and work you enjoy. Unfortunately, the job title sounds painfully boring.',
      choices: [
        { id: 'a', label: "I'd take it. Might need to get creative when somebody asks what I do, though. 😂", resultWeights: { 'want-it-seen': 2, 'nobody-clapped': 1 } },
        { id: 'b', label: 'Boring title, great life? Where do I sign?', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'c', label: 'I might choose a more respected role, even if the hours were worse.', resultWeights: { 'performing-for': 2, 'want-it-seen': 2 } },
        { id: 'd', label: "I'd need the work to challenge me. What people call it doesn't matter.", resultWeights: { 'nobody-clapped': 2, 'proving-something': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Picture the moment you finally think, "I made it." What’s happening?',
      choices: [
        { id: 'a', label: "It's a Tuesday. Bills are handled. I'm not dreading tomorrow.", resultWeights: { 'nobody-clapped': 2 } },
        { id: 'b', label: 'Someone who doubted me finally has to admit I pulled it off.', resultWeights: { 'proving-something': 2 } },
        { id: 'c', label: 'My people are there celebrating with me. I wanted to share this.', resultWeights: { 'want-it-seen': 2, 'nobody-clapped': 1 } },
        { id: 'd', label: "I walk into a room and people immediately know I've become somebody important.", resultWeights: { 'performing-for': 3, 'want-it-seen': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone who once underestimated you asks for career advice. What’s your first reaction?',
      choices: [
        { id: 'a', label: 'Of course I’ll help. And yes, the irony is delicious.', resultWeights: { 'want-it-seen': 1, 'proving-something': 1 } },
        { id: 'b', label: "I'd send them the resources that helped me. No need to revisit the past.", resultWeights: { 'nobody-clapped': 2 } },
        { id: 'c', label: 'First, I’d want to hear them acknowledge how wrong they were about me.', resultWeights: { 'proving-something': 2, 'performing-for': 1 } },
        { id: 'd', label: "They'd get honest advice. Including the parts nobody helped me figure out.", resultWeights: { 'proving-something': 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'You finally achieve something you’ve wanted for years. Three days later, the excitement is gone. Why?',
      choices: [
        { id: 'a', label: "There's always a bigger target. If I slow down, I start questioning myself.", resultWeights: { 'proving-something': 2 } },
        { id: 'b', label: "I celebrated. Now I'm curious about the next challenge.", resultWeights: { 'nobody-clapped': 2 } },
        { id: 'c', label: "The announcement didn't get the reaction I expected. Maybe the next one will.", resultWeights: { 'want-it-seen': 2, 'proving-something': 1 } },
        { id: 'd', label: 'That wouldn’t be me. I want to enjoy what I’ve earned for a while.', resultWeights: { 'nobody-clapped': 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which failure would bother you the longest?',
      choices: [
        { id: 'a', label: 'Getting the impressive title and realizing I hate the actual life.', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'b', label: "Failing publicly after telling everybody what I was about to accomplish.", resultWeights: { 'want-it-seen': 2, 'performing-for': 2 } },
        { id: 'c', label: "Watching an old rival succeed at the thing I couldn't finish.", resultWeights: { 'proving-something': 2 } },
        { id: 'd', label: 'Never finding out whether I could have done something I truly cared about.', resultWeights: { 'nobody-clapped': 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'You finally get everything you were chasing. The person whose approval mattered most says absolutely nothing. What next?',
      choices: [
        { id: 'a', label: 'That would honestly make me wonder what the point of all that work was.', resultWeights: { 'performing-for': 3, 'proving-something': 1 } },
        { id: 'b', label: "I'd be hurt. Then I'd celebrate with the people who actually showed up.", resultWeights: { 'want-it-seen': 2, 'proving-something': 1 } },
        { id: 'c', label: 'The silence would sting. But I’d still have the life I chose.', resultWeights: { 'nobody-clapped': 2 } },
        { id: 'd', label: "I'd start working toward something bigger. Maybe that would finally change their mind.", resultWeights: { 'proving-something': 2 } },
      ],
    },
  ],
};
