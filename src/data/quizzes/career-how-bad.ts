import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/CAREER_HOW_BAD_APPROVED_LOCKED_2026-10-31.md -- editorial version 2.0,
// owner-approved including exact gate/tie values (see that document's "LAZY reachability:
// independent actual-engine confirmation" section, which already ran these exact weights and
// gate against src/data/quizzes/scoring.ts's real scoreArchetypeQuiz before approval). Quiz
// id, question ids (q1-q10), and choice ids (a-d) are preserved; no real production data
// exists under this quiz_key (its award-activation migration has never been applied).
export const CAREER_HOW_BAD_QUIZ: ArchetypeQuizDefinition = {
  id: 'career-ambition-how-bad',
  scoringType: 'archetype',
  category: 'Career & Ambition',
  access: 'private',
  contributesToProfile: true,
  title: 'How Bad Do You Actually Want It?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Everybody wants the life. Fewer people want the Tuesday.'],
  introNote: "Choose what you actually do, not what your future successful self would say.",
  meta: '10 questions · About 3 minutes',
  introCta: 'Clock me →',
  mixLabel: 'YOUR CAREER & AMBITION MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim (document rule 8): "Tie order: compare total verdict score; then
  // high-signal verdict contributions from Q2, Q3, Q5, Q8, Q9, Q10; then count full +2 primary
  // answer selections; then fixed fallback REAL -> COMFORT -> TALK -> LAZY."
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['want-it-for-real', 'comfort-keeps-winning', 'talk-great-game', 'lazy-there-we-said-it'],
  // Owner-approved verbatim (document rule 7): LAZY requires >=6 points AND at least 3 of
  // Q3B/Q8A/Q9B/Q10A. minSignals is redundant (those three alone already total >=8) but kept
  // explicitly for audibility, exactly as the document specifies.
  resultGates: {
    'lazy-there-we-said-it': { minSignals: 3, requiredGroups: [{ answers: ['q3-b', 'q8-a', 'q9-b', 'q10-a'], min: 3 }] },
  },
  archetypes: [
    {
      id: 'want-it-for-real',
      title: 'REAL | YOU WANT IT FOR REAL',
      kicker: 'The vision board finally has receipts.',
      apparentlySignature: 'Apparently, your dreams clock in even when the applause clocks out.',
      traits: ['Driven', 'Patient', 'Self-Directed'],
      structuredRead: {
        theVerdict: ["You don't just love the idea. You'll do the Tuesday."],
        theRead: ['You can survive slow progress, public flops, and the stretch where nobody claps. Your drive is real. Just remember: the goal isn’t to prove how exhausted you can get.'],
        theCallOut: ["You're great at pushing. Are you as good at stopping?"],
        theCost: ['You could build a beautiful life and be too burned out to live it.'],
        tryThis: ['Schedule recovery like you schedule effort. Both count.'],
      },
    },
    {
      id: 'comfort-keeps-winning',
      title: 'COMFORT | YOU WANT IT, BUT COMFORT KEEPS WINNING',
      kicker: "You don't need to suffer. You do need to show up.",
      apparentlySignature: 'Apparently, your ambition keeps hitting snooze.',
      traits: ['Ambitious', 'Comfort-Loving', 'Selectively Consistent'],
      structuredRead: {
        theVerdict: ['You want the upgrade. Your current routine would like to remain employed.'],
        theRead: ['Your ambition is real. So is your desire for rest, stability, and a life outside the hustle. That’s healthy until every inconvenient step becomes a new negotiation.'],
        theCallOut: ['Sometimes "protecting my peace" is a boundary. Sometimes it’s a beautifully dressed excuse.'],
        theCost: ['A year of reasonable delays can still leave you exactly where you started.'],
        tryThis: ["Pick one inconvenient step you'll repeat for 30 days. Keep the rest of your life."],
      },
    },
    {
      id: 'talk-great-game',
      title: 'TALK | YOU TALK A GREAT GAME',
      kicker: "Your potential is fully booked. Your follow-through isn't.",
      apparentlySignature: 'Apparently, your dreams have a publicist, not a project manager.',
      traits: ['Visionary', 'Curious', 'Restart-Prone'],
      structuredRead: {
        theVerdict: ["Your goals have excellent branding. The execution team hasn't been hired."],
        theRead: ["You know how the life should look, what you'll do first, and what you'll say when it works. The planning feels like progress. The unfinished work tells a different story."],
        theCallOut: ["Another new idea isn't always growth. Sometimes it's an exit from the boring middle."],
        theCost: ['You can spend years being almost ready to become who you keep announcing.'],
        tryThis: ['Choose one project. Finish one deliverable. Then tell people.'],
      },
    },
    {
      id: 'lazy-there-we-said-it',
      title: 'LAZY | LAZY. THERE, WE SAID IT.',
      kicker: 'Motivation might not show up. Your hands still can.',
      apparentlySignature: 'Apparently, your dream is on read.',
      traits: ['Comfort-Seeking', 'Capable', 'Stalled'],
      structuredRead: {
        theVerdict: ['You want the result. The effort keeps getting left on read.'],
        theRead: ['This isn’t about rest, real responsibilities, or going at your own pace. Your answers point to a repeated pattern of choosing what’s easier even when you have room to act.'],
        theCallOut: ['You know the next step. You just keep assigning it to a future version of yourself.'],
        theCost: ['Your promises get bigger. Your actual progress stays put.'],
        tryThis: ['Do 20 minutes of the least glamorous task today. Not research. The task.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Pick your poison. The goal you want needs six hours a week for six months. What usually happens when you try to make room?',
      choices: [
        { id: 'a', label: 'I block the time. I still grieve my free evenings a little.', resultWeights: { 'want-it-for-real': 2, 'comfort-keeps-winning': 1 } },
        { id: 'b', label: "I start with two nights, then adjust if my energy doesn't hold.", resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'c', label: 'I spend the first week researching the perfect approach. The calendar is still empty.', resultWeights: { 'talk-great-game': 2, 'comfort-keeps-winning': 1 } },
        { id: 'd', label: 'I keep waiting for a quieter week. Apparently every week has opinions.', resultWeights: { 'lazy-there-we-said-it': 2, 'talk-great-game': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your big break finally shows up. Same destination. Less glamour. More grunt work. Your move?',
      choices: [
        { id: 'a', label: 'I keep browsing for the version I’d be prouder to tell people about.', resultWeights: { 'talk-great-game': 2, 'comfort-keeps-winning': 1 } },
        { id: 'b', label: 'I take it. I can complain in my notes about the fluorescent lighting.', resultWeights: { 'want-it-for-real': 2, 'comfort-keeps-winning': 1 } },
        { id: 'c', label: "I tell myself I'll read the offer tonight. It's been sixteen nights.", resultWeights: { 'lazy-there-we-said-it': 2, 'talk-great-game': 1 } },
        { id: 'd', label: 'I ask about the workload and whether the path still gets me where I want to go.', resultWeights: { 'comfort-keeps-winning': 1, 'want-it-for-real': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Which message from your group chat could actually be yours?',
      choices: [
        { id: 'a', label: '"I can do it, just not on the timeline I said out loud."', resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'b', label: '"Next Monday. Yes, I\'ve said that before. Please stop keeping receipts."', resultWeights: { 'lazy-there-we-said-it': 2, 'talk-great-game': 1 } },
        { id: 'c', label: '"I tested it last week. Turns out half my plan was wrong."', resultWeights: { 'want-it-for-real': 2 } },
        { id: 'd', label: '"New idea. I know, I know. The last one is still in drafts."', resultWeights: { 'talk-great-game': 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'The thing you worked so hard for FLOPS. Publicly. Spectacularly. What happens in the first 48 hours?',
      choices: [
        { id: 'a', label: "I explain all the reasons it wasn't a fair shot before reviewing my own choices.", resultWeights: { 'talk-great-game': 2 } },
        { id: 'b', label: 'I take a week to regroup, then test a smaller version.', resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'c', label: 'I feel awful, ask what failed, and start fixing one part.', resultWeights: { 'want-it-for-real': 2, 'comfort-keeps-winning': 1 } },
        { id: 'd', label: "I start telling people it wasn't that serious, even though I was obsessed last week.", resultWeights: { 'talk-great-game': 2, 'comfort-keeps-winning': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: "Somebody deposits $10 million into your account tomorrow. Be serious: what's left of the dream?",
      choices: [
        { id: 'a', label: "I'd still want it, but I'd plan a slower pace and finally take weekends back.", resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'b', label: 'I’d find a new mountain. A few people still owe me an apology for doubting me.', resultWeights: { 'talk-great-game': 2, 'want-it-for-real': 1 } },
        { id: 'c', label: "I'd still build it. I'd just stop checking my bank account every hour.", resultWeights: { 'want-it-for-real': 2 } },
        { id: 'd', label: 'I might drop that goal. Turns out I wanted freedom more than the title.', resultWeights: { 'comfort-keeps-winning': 2, 'talk-great-game': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'What are you secretly chasing when you picture success?',
      choices: [
        { id: 'a', label: 'The people who doubted me suddenly acting like they always knew.', resultWeights: { 'talk-great-game': 2 } },
        { id: 'b', label: "Knowing I finished something I nearly talked myself out of.", resultWeights: { 'want-it-for-real': 2 } },
        { id: 'c', label: 'Being able to say no without panicking about the bill.', resultWeights: { 'comfort-keeps-winning': 2 } },
        { id: 'd', label: 'A random Tuesday that feels like the life I meant to build.', resultWeights: { 'comfort-keeps-winning': 1, 'want-it-for-real': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Your friend started after you and already passed you. Badly. First uncensored reaction?',
      choices: [
        { id: 'a', label: 'I congratulate them. Later I spend three days comparing my timeline.', resultWeights: { 'comfort-keeps-winning': 1, 'talk-great-game': 1 } },
        { id: 'b', label: 'Good for them. So... what did they figure out that I didn’t?', resultWeights: { 'want-it-for-real': 2 } },
        { id: 'c', label: 'I tell everyone I don’t care. Then quietly shelve my own project.', resultWeights: { 'talk-great-game': 2, 'comfort-keeps-winning': 1 } },
        { id: 'd', label: 'They did have help. Have I been refusing the help that’s available to me?', resultWeights: { 'want-it-for-real': 1, 'comfort-keeps-winning': 1 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Apparently can see the last 90 days of your calendar. Not your captions. What’s the biggest surprise?',
      choices: [
        { id: 'a', label: 'How often my "no time" evenings somehow included three hours of scrolling.', resultWeights: { 'lazy-there-we-said-it': 3 } },
        { id: 'b', label: 'How much unglamorous work happened before I posted anything.', resultWeights: { 'want-it-for-real': 2 } },
        { id: 'c', label: 'Progress, actually. Just less than the pace I promised myself.', resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'd', label: 'Fourteen saved tutorials and a project board with no actual project.', resultWeights: { 'talk-great-game': 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'Month seven. The work is repetitive, nobody’s watching, and you’re bored. What gets you through?',
      choices: [
        { id: 'a', label: 'I check what progress is real and revise the next month.', resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'b', label: 'I’d still call it my goal. The work hasn’t moved since month two.', resultWeights: { 'lazy-there-we-said-it': 3, 'talk-great-game': 1 } },
        { id: 'c', label: "I show up. I don't have to enjoy every minute.", resultWeights: { 'want-it-for-real': 2, 'comfort-keeps-winning': 1 } },
        { id: 'd', label: 'I start something different. For a week, it feels like I’m moving again.', resultWeights: { 'talk-great-game': 2, 'lazy-there-we-said-it': 1 } },
      ],
    },
    {
      id: 'q10',
      prompt: "Five years. No shortcut. Nobody's impressed until it's done. Do you still want the thing you keep saying you want?",
      choices: [
        { id: 'a', label: 'I want to say yes, but the number of restart dates says otherwise.', resultWeights: { 'lazy-there-we-said-it': 3, 'talk-great-game': 1 } },
        { id: 'b', label: "Yes, but I refuse to sacrifice everything else to prove I'm serious.", resultWeights: { 'comfort-keeps-winning': 2, 'want-it-for-real': 1 } },
        { id: 'c', label: "Yes. Five years is going to pass anyway, and I'd rather finish than relive year one.", resultWeights: { 'want-it-for-real': 3 } },
        { id: 'd', label: "I keep imagining the finish line and rewriting the middle so I won't have to live it.", resultWeights: { 'talk-great-game': 3 } },
      ],
    },
  ],
};
