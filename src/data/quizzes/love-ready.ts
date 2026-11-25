import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/LOVE_READY_APPROVED_LOCKED_2026-10-31.md -- the owner's approved
// editorial version 2.0 of this quiz. Quiz id, question ids (q1-q10), and choice ids (a-d) are
// preserved per the document's own instruction; the content under them (prompts, choice
// wording, verdict weights, result copy) is entirely new. No real production data exists
// under this quiz_key today (its award-activation migration has never been applied to
// production -- see scripts/lib/quiz-pole-award-rows.ts), so this replacement carries no
// historical-answer-reinterpretation risk.
//
// Gate/tie-break values below are a PROPOSED calibration, not owner-approved like the other
// three locked quizzes' gates -- the Love document explicitly defers exact gate/tie numbers to
// the implementing engineer and requires presenting them for SEPARATE owner approval before
// release (document rule 10: "Present the proposed implementation gate values for separate
// owner approval before release"). See the Build 22 report for the reachability simulation
// behind these specific thresholds.
export const LOVE_READY_QUIZ: ArchetypeQuizDefinition = {
  id: 'love-soulmates-ready',
  scoringType: 'archetype',
  category: 'Love & Soulmates',
  access: 'private',
  contributesToProfile: true,
  title: 'Are You Actually Ready for Love?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: ['Wanting a relationship and being ready for one are not the same thing.'],
  introNote: "Choose what you'd actually do. Your ideal self can sit this one out.",
  meta: '10 questions · About 3 minutes',
  introCta: 'Clock me →',
  mixLabel: 'YOUR LOVE & SOULMATES MIX',
  recentReadMetricLabel: 'your read',
  // PROPOSED, pending separate owner approval (see header comment above).
  highSignalQuestionIds: ['q4', 'q5', 'q7', 'q8', 'q9', 'q10'],
  primaryTieWeight: 3,
  countPrimaryMatchesTieBreak: true,
  tieFallbackOrder: ['open', 'terms', 'walls', 'bae'],
  resultGates: {
    bae: { minSignals: 4 },
    walls: { minSignals: 3 },
  },
  archetypes: [
    {
      id: 'open',
      title: 'OPEN | OPEN FOR LOVE. CLOSED FOR NONSENSE.',
      kicker: 'Love is a partnership, not a solo project.',
      apparentlySignature: 'Apparently, your heart is open, not on clearance.',
      traits: ['Emotionally Present', 'Collaborative', 'Repair-Oriented'],
      structuredRead: {
        theVerdict: ["You want the relationship, not just the butterflies. You're willing to show up when love gets inconvenient."],
        theRead: ["You understand that real intimacy requires honesty, compromise, and occasional uncomfortable conversations. You're not afraid of the work. Just make sure you're not doing it alone."],
        theCallOut: ["Being emotionally available doesn't mean everybody deserves access."],
        theCost: ['Your willingness to make things work could keep you fixing something somebody else keeps breaking.'],
        tryThis: ['Stop asking, "Could we build something?" Ask, "Are they building with me?"'],
      },
    },
    {
      id: 'terms',
      title: 'TERMS | LOVE, PENDING APPROVAL.',
      kicker: 'At some point, the background check has to end.',
      apparentlySignature: 'Apparently, your standards have standards.',
      traits: ['Discerning', 'Independent', 'Careful With Trust'],
      structuredRead: {
        theVerdict: ['Your heart has a front desk. Identification, references, and proof of consistency required. 😂'],
        theRead: ['You want love, but certainty feels safer than vulnerability. Some of your caution is wisdom. Some of it is fear wearing a blazer.'],
        theCallOut: ["Standards protect you. Surprise tests exhaust people. Stop making someone new pay for somebody else's mistakes."],
        theCost: ['A good person can spend so long auditioning for your trust that the relationship never actually begins.'],
        tryThis: ['Keep your nonnegotiables. Retire the moving goalposts.'],
      },
    },
    {
      id: 'walls',
      title: 'WALLS | HEART OPEN. SECURITY SYSTEM ARMED.',
      kicker: 'The lock works. Unfortunately, love is outside.',
      apparentlySignature: "Apparently, your heart RSVP'd yes. Your defenses canceled.",
      traits: ['Observant', 'Guarded', 'Emotionally Deep'],
      structuredRead: {
        theVerdict: ['You want somebody to know the real you. Your defenses would prefer they submit a request in writing.'],
        theRead: ["You crave closeness, but when someone gets close enough to hurt you, your instincts start looking for an exit. You don't necessarily want out. You just want guarantees love can't give."],
        theCallOut: ["You can't ask for deep connection while handing everybody an edited version of yourself."],
        theCost: ['Your walls might prevent heartbreak. They might also turn away someone who was trying to stay.'],
        tryThis: ['Before pulling away, ask: "Is this actually unsafe, or does being loved feel scary?"'],
      },
    },
    {
      id: 'bae',
      title: 'BAE | YOU WANT THE PERKS, NOT THE PARTNERSHIP.',
      kicker: 'A partner is a person, not a subscription perk.',
      apparentlySignature: 'Apparently, you love the perks. The terms of service need another look.',
      traits: ['Independent', 'Selectively Invested', 'Comfort-Seeking'],
      structuredRead: {
        theVerdict: ['You read the relationship brochure. The shared-responsibilities section? Apparently skipped. 😭'],
        theRead: ['You love attention, affection, and having somebody in your corner. But when love requires inconvenient effort, suddenly your availability gets complicated.'],
        theCallOut: ["Wanting independence is healthy. Expecting someone to show up for you while your own participation stays optional? That's a benefits package, not a relationship."],
        theCost: ['Someone can love you and still feel lonely doing all the showing up.'],
        tryThis: ["Ask yourself: \"Would I still choose this person when they're the one who needs me?\""],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Three months in. Someone you really like follows through, remembers things, and makes plans. It feels... easy. What catches you off guard?',
      choices: [
        { id: 'a', label: 'I stop waiting for the plot twist. Boring in the best way.', resultWeights: { open: 2 } },
        { id: 'b', label: 'After our best dates, I somehow catch myself waiting longer to text back.', resultWeights: { walls: 2, terms: 1 } },
        { id: 'c', label: 'I enjoy it. I’m curious whether “consistent” lasts through a bad week.', resultWeights: { terms: 2, open: 1 } },
        { id: 'd', label: 'The dates are great. I’m already doing math on how much time they’ll take.', resultWeights: { bae: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You had one completely free Saturday. Your person calls after a rough morning and asks to see you. You...',
      choices: [
        { id: 'a', label: 'Ask what they need and what can wait. You had plans, too.', resultWeights: { terms: 2, open: 1 } },
        { id: 'b', label: 'Go. But you definitely notice that your day no longer belongs to you.', resultWeights: { bae: 2 } },
        { id: 'c', label: 'Move a couple things around and ask where they want to meet.', resultWeights: { open: 2 } },
        { id: 'd', label: 'Check on them by text first. You need a second before walking into big feelings.', resultWeights: { walls: 1, terms: 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'They tell you, “Sometimes when you’re upset, I feel shut out.” Your first reply?',
      choices: [
        { id: 'a', label: 'I was quiet, not angry. Why does it need a meaning?', resultWeights: { bae: 1, terms: 1 } },
        { id: 'b', label: "I was processing. What could I say so it doesn't feel like I'm leaving?", resultWeights: { open: 2 } },
        { id: 'c', label: "I say we're okay. I'm just not ready to unpack the rest.", resultWeights: { walls: 2 } },
        { id: 'd', label: 'I hear that. I also need room to be quiet without it becoming a verdict.', resultWeights: { terms: 2, open: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'You were sure you were right. Turns out your partner had receipts. Now what?',
      choices: [
        { id: 'a', label: 'I admit it, then spend the evening a little harder to reach.', resultWeights: { walls: 2 } },
        { id: 'b', label: 'Sorry first, timeline review second. I want us aligned on what happened.', resultWeights: { terms: 2, walls: 1 } },
        { id: 'c', label: 'I say sorry, then ask if we can please retire the whole postmortem.', resultWeights: { bae: 3 } },
        { id: 'd', label: 'I own it and ask what I can do to actually repair it.', resultWeights: { open: 3 } },
      ],
    },
    {
      id: 'q5',
      prompt: "Six months in, you're being folded into the ordinary stuff. Dinners, errands, family plans. Your reaction?",
      choices: [
        { id: 'a', label: "I'm in. I start suggesting a few things we can make ours.", resultWeights: { open: 2 } },
        { id: 'b', label: 'I love being included. Being expected to organize things myself? Less exciting.', resultWeights: { bae: 3 } },
        { id: 'c', label: "I enjoy it, but I book solo time before the calendar fills itself.", resultWeights: { terms: 2, open: 1 } },
        { id: 'd', label: 'I say yes more than I mean to, then start dodging invitations.', resultWeights: { walls: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'They say “I’m fine,” but their whole energy says “maybe not.” Your move?',
      choices: [
        { id: 'a', label: 'They said fine. I heard fine. They know where to find me.', resultWeights: { bae: 1, open: 1 } },
        { id: 'b', label: "I ask whether they'd rather talk or have space. Either works.", resultWeights: { terms: 2, open: 1 } },
        { id: 'c', label: 'I start rewinding our last conversation to see what I missed.', resultWeights: { walls: 2 } },
        { id: 'd', label: 'I give it room, then check back later without making it a test.', resultWeights: { open: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'They forget something important to you, apologize, and offer to make it up. You...',
      choices: [
        { id: 'a', label: 'Take the apology, then watch what changes next time.', resultWeights: { terms: 3 } },
        { id: 'b', label: 'Tell them it hurt, then talk about how to make it right.', resultWeights: { open: 3 } },
        { id: 'c', label: "Say it's fine. Their next important day gets a little less effort from you.", resultWeights: { bae: 2 } },
        { id: 'd', label: 'Forgive them aloud, then quietly wonder what else you’ll be forgotten in.', resultWeights: { walls: 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: "A six-month opportunity they worked hard for would disrupt plans you've made together. You...",
      choices: [
        { id: 'a', label: "Say you're excited, then run a private worst-case scenario in your head.", resultWeights: { walls: 2 } },
        { id: 'b', label: 'Celebrate them. Later, catch yourself counting whose plans keep moving.', resultWeights: { bae: 3 } },
        { id: 'c', label: "Figure there's room for both dreams and start making a plan.", resultWeights: { open: 3 } },
        { id: 'd', label: "Ask which changes are temporary and what you're each agreeing to.", resultWeights: { terms: 2, open: 1 } },
      ],
    },
    {
      id: 'q9',
      prompt: "They've seen your insecure side and stayed. Now what?",
      choices: [
        { id: 'a', label: 'I let them see another piece of me I usually edit out.', resultWeights: { open: 2 } },
        { id: 'b', label: "I appreciate it. I also catch myself asking if we're okay more often.", resultWeights: { terms: 2, walls: 1 } },
        { id: 'c', label: 'I love that they stayed. I still start keeping more thoughts to myself.', resultWeights: { walls: 3 } },
        { id: 'd', label: 'Being understood is beautiful. Offering that same access back? Still working on it.', resultWeights: { bae: 3 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'You both want different things from a decision that affects you equally. Neither person is wrong. What happens?',
      choices: [
        { id: 'a', label: "Before agreeing, I catch myself totaling what I've already given up.", resultWeights: { bae: 3 } },
        { id: 'b', label: "I say we'll come back to it. Then somehow it's next week.", resultWeights: { walls: 3 } },
        { id: 'c', label: 'I want us to be specific about what each of us needs before choosing.', resultWeights: { terms: 2, open: 1 } },
        { id: 'd', label: 'I ask what’s nonnegotiable for them, explain mine, and build from there.', resultWeights: { open: 3 } },
      ],
    },
  ],
};
