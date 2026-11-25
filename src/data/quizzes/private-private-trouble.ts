import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): replaces the prior draft content verbatim from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 02 ("HOW MUCH
// TROUBLE ARE YOU AFTER DARK? 😈") -- the final approved After Dark revision, superseding the
// prior draft in this same file. Quiz id, question ids (q1-q10), and choice ids (a-d)
// preserved; no production data exists under this quiz_key. Personality evidence comes only
// from real quiz_choice_trait_awards (private-quiz-trait-awards.ts). Age (18+) and
// subscription gates are enforced server-side via quizzes.access_tier/requires_age_
// verification, unrelated to this content change.
export const PRIVATE_PRIVATE_TROUBLE_QUIZ: ArchetypeQuizDefinition = {
  id: 'private-private-trouble',
  scoringType: 'archetype',
  category: 'Private Private. 😈',
  access: 'private',
  title: 'How Much Trouble Are You After Dark? 😈',
  eyebrow: 'APPARENTLY PRIVATE · PRIVATE PRIVATE · 18+',
  introSupport: [
    'Everybody has a private side. Apparently would like to meet the one that comes out after dark. 😈',
    'The late-night texts. The person you swore you were done with. The chemistry that apparently doesn’t respect your better judgment.',
    'We’re assuming consenting adults and mutual interest. The trouble we’re investigating is what you decide to do with it.',
  ],
  introNote: 'Answer honestly. Your group chat cannot save you here.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Expose me 😈 →',
  mixLabel: 'YOUR PRIVATE PRIVATE. 😈 MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim: "Tie order: Highest eligible total -> high-signal contributions
  // from Q2, Q3, Q5, Q7, Q8, Q9, Q10 -> most full +2 primary selections -> HALO, TENSION,
  // UNLOCKED, BAD_DECISION."
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q7', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['halo', 'tension', 'unlocked', 'bad_decision'],
  // Owner-approved verbatim: "BAD_DECISION hard gate: minimum four distinct supporting
  // answers, including at least one active-pursuit signal from Q1D, Q2D, Q4D, Q5D, Q6D, Q8D,
  // or Q10D, and at least three high-confidence messy-decision signals from Q1D, Q5D, Q8D,
  // Q9D, or Q10D." / "UNLOCKED gate: at least three distinct supporting answers, including at
  // least one from Q3A, Q5C, Q7A, Q8C, Q9C, or Q10C." HALO and TENSION are ungated.
  resultGates: {
    bad_decision: {
      minSignals: 4,
      requiredAnyOf: [['q1-d', 'q2-d', 'q4-d', 'q5-d', 'q6-d', 'q8-d', 'q10-d']],
      requiredGroups: [{ answers: ['q1-d', 'q5-d', 'q8-d', 'q9-d', 'q10-d'], min: 3 }],
    },
    unlocked: { minSignals: 3, requiredAnyOf: [['q3-a', 'q5-c', 'q7-a', 'q8-c', 'q9-c', 'q10-c']] },
  },
  archetypes: [
    {
      id: 'halo',
      title: 'HALO | THE HALO STAYS ON. MOSTLY. 😇',
      kicker: 'You looked at the text, considered the consequences, and went to bed. The character development! 👏',
      apparentlySignature: 'Apparently, your halo has seen things.',
      traits: ['Selective', 'Self-Controlled', 'Boundary-Aware'],
      structuredRead: {
        theVerdict: ['You like a little heat. You just refuse to become the cautionary tale.'],
        theRead: ['You can enjoy chemistry, attention, and the occasional dangerous-looking text without automatically reopening a door you worked hard to close. You know temptation doesn’t always deserve a response. Some chapters were entertaining. That doesn’t mean they need a sequel.'],
        theCallOut: ['Being careful is smart. Just don’t confuse protecting your peace with refusing to take any emotional risks.'],
        theCost: ['You might pass on something genuinely good because it reminds you of something that went badly.'],
        tryThis: ['Notice the difference between a real red flag and an unfamiliar feeling. One deserves caution. The other might deserve curiosity.'],
      },
    },
    {
      id: 'tension',
      title: 'TENSION | YOU LIKE THE TENSION MORE THAN THE TROUBLE. 😏',
      kicker: 'Twenty-seven messages, six inside jokes, two lingering looks. Still no actual plan. 😭',
      apparentlySignature: 'Apparently, you treat chemistry like a slow-burn television series.',
      traits: ['Playful', 'Teasing', 'Anticipation-Loving'],
      structuredRead: {
        theVerdict: ['You could turn eye contact into an entire event. And frankly, you enjoy the production.'],
        theRead: ['You like the buildup. The clever texts. The glances from across the room. That moment when both people know there’s chemistry but nobody has said the obvious thing yet. You’re not necessarily trying to start trouble. You just think anticipation deserves its own season.'],
        theCallOut: ['Sometimes the flirtation is so elaborate nobody knows whether you’re actually interested.'],
        theCost: ['You can spend so much time enjoying the possibility that the opportunity eventually walks away.'],
        tryThis: ['Next time you actually want something to happen, replace one hint with a sentence that cannot be mistaken for friendly banter.'],
      },
    },
    {
      id: 'unlocked',
      title: 'UNLOCKED | YOU HAVE A SIDE PEOPLE HAVE TO UNLOCK. 😈',
      kicker: 'The after-dark version exists. Access is invitation-only.',
      apparentlySignature: 'Apparently, your personality has a very exclusive guest list.',
      traits: ['Private', 'Expressive', 'Selectively Vulnerable'],
      structuredRead: {
        theVerdict: ['Public you got the trailer. Somebody special might get the director’s cut. 👀'],
        theRead: ['You’re selective about what you reveal and to whom. People who know you casually might be genuinely surprised by how expressive, affectionate, playful, or bold you become when you’re comfortable. The private version of you isn’t fake. It’s simply not available to everybody.'],
        theCallOut: ['Privacy is attractive. Making someone solve seventeen riddles to understand your feelings is exhausting.'],
        theCost: ['Someone who genuinely wants to get closer may never know whether you’re inviting them in or politely keeping them outside.'],
        tryThis: ['When someone has earned your trust, give them one honest clue about what you actually want instead of waiting for them to guess.'],
      },
    },
    {
      id: 'bad_decision',
      title: 'BAD DECISION | YOU ARE THE BAD DECISION. 🔥',
      kicker: 'You said “never again.” Apparently there were terms and conditions. 😂',
      apparentlySignature: 'Apparently, trouble still has your number.',
      traits: ['Bold', 'Impulsive', 'Temptation-Prone'],
      structuredRead: {
        theVerdict: ['You see the red flag, decide it’s a lovely shade of burgundy, and text back anyway. 😭'],
        theRead: ['You know when there’s chemistry. You also tend to know when a situation could become complicated. The problem is that sometimes your curiosity, attraction, or nostalgia gets a vote before your better judgment has finished speaking. You’re not clueless. Occasionally, you’re just extremely persuasive when talking yourself into something you already questioned.'],
        theCallOut: ['Chemistry is not a background check. Missing someone is not proof that anything changed.'],
        theCost: ['One electric night can produce three weeks of emotional paperwork and a group chat investigation.'],
        tryThis: ['Before reopening a chapter, ask yourself: “What’s actually different this time, besides the fact that I miss the plot?”'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'It’s 11:47 p.m. Your phone lights up: “I miss you.” It’s the ONE person you promised yourself you’d stop entertaining. What happens?',
      choices: [
        { id: 'a', label: 'Lock the phone. We’ve already done the sequel, and it was worse.', resultWeights: { halo: 2 } },
        { id: 'b', label: '“You miss me, or the attention?” Then I enjoy that little pause. 😏', resultWeights: { tension: 2, bad_decision: 1 } },
        { id: 'c', label: 'I’d need a real explanation before that person gets access to me again.', resultWeights: { unlocked: 2 } },
        { id: 'd', label: '“Where are you?” And yes, I know better. 😭', resultWeights: { bad_decision: 3 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You’re out with friends when someone you used to have RIDICULOUS chemistry with walks in. You’re pretending you don’t see them. What’s next?',
      choices: [
        { id: 'a', label: 'Let our eyes do the talking. I’m not wasting a perfectly good entrance.', resultWeights: { tension: 2 } },
        { id: 'b', label: 'Say hello, catch up, and get back to my friends. I came for a good time, not a plot twist.', resultWeights: { halo: 2 } },
        { id: 'c', label: 'Find a moment alone to ask whether that spark is still real.', resultWeights: { unlocked: 2 } },
        { id: 'd', label: 'Find a reason to cross the room. This outfit didn’t get ready for nothing. 😂', resultWeights: { bad_decision: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone tells you, “You seem so innocent.” What’s your most honest response?',
      choices: [
        { id: 'a', label: 'Depends who’s around. Not everybody gets the whole version of me.', resultWeights: { unlocked: 2 } },
        { id: 'b', label: 'I mean, I’m fairly innocent. Give or take a few thoughts.', resultWeights: { halo: 2 } },
        { id: 'c', label: '“Innocent” is a strong word. I just know when to behave.', resultWeights: { tension: 2 } },
        { id: 'd', label: 'I laugh because they have no idea what I almost did last weekend. 😭', resultWeights: { bad_decision: 2, unlocked: 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'At the end of a date, they lean closer and say, “If I kissed you right now, would that be a bad idea?” Your reply?',
      choices: [
        { id: 'a', label: '“Maybe. Are you always this dramatic?” 😏', resultWeights: { tension: 2 } },
        { id: 'b', label: '“Goodnight.” Then I walk away before I complicate my own life.', resultWeights: { halo: 2 } },
        { id: 'c', label: '“I’ve been thinking about that all night.”', resultWeights: { unlocked: 2 } },
        { id: 'd', label: '“Let’s find out.”', resultWeights: { bad_decision: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your friends have officially banned you from mentioning a certain name. Then THAT NAME texts. What are you telling the group chat?',
      choices: [
        { id: 'a', label: '“Nothing. I blocked the number like I said I would.”', resultWeights: { halo: 2 } },
        { id: 'b', label: '“I didn’t answer. But I’m not going to lie, that was a GOOD message.” 😂', resultWeights: { tension: 2 } },
        { id: 'c', label: '“We talked. I’m figuring out whether anything has actually changed.”', resultWeights: { unlocked: 2 } },
        { id: 'd', label: '“Before y’all start yelling... I may have made plans.”', resultWeights: { bad_decision: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You swore you were keeping things casual. Then they send a voice note saying your name a CERTAIN way. What happens?',
      choices: [
        { id: 'a', label: 'Play it again. That’s all. I do have some self-control.', resultWeights: { tension: 2 } },
        { id: 'b', label: 'I pause. This sounds suspiciously like the beginning of something I promised to avoid.', resultWeights: { halo: 2 } },
        { id: 'c', label: 'I admit I like them more than I originally planned to.', resultWeights: { unlocked: 2 } },
        { id: 'd', label: 'I send one back. The whole “keeping it casual” agreement is apparently under review. 😭', resultWeights: { bad_decision: 2, tension: 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone you’ve been seeing says, “You’re SO different when it’s just us.” What’s the real reason?',
      choices: [
        { id: 'a', label: 'I don’t share every side of myself with everybody. When I trust someone, I’m much more open.', resultWeights: { unlocked: 3 } },
        { id: 'b', label: 'I can flirt all day, then suddenly get shy when it actually matters.', resultWeights: { tension: 2, unlocked: 1 } },
        { id: 'c', label: 'I’m pretty much the same. What you see is what you get.', resultWeights: { halo: 2 } },
        { id: 'd', label: 'Because private me has been known to make a few questionable suggestions. 👀', resultWeights: { bad_decision: 1, unlocked: 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'It’s 1 a.m. You’re dressed to go home. They say, “Come back upstairs for five minutes.” You KNOW five minutes is fiction. Now what?',
      choices: [
        { id: 'a', label: 'I go home. Tomorrow already has enough responsibilities.', resultWeights: { halo: 2 } },
        { id: 'b', label: 'I stand by the door, smile, and make them work for one more minute.', resultWeights: { tension: 2 } },
        { id: 'c', label: '“Tell me what you’re hoping those five minutes turn into.”', resultWeights: { unlocked: 2 } },
        { id: 'd', label: 'I turn around. The rideshare can file a complaint. 😭', resultWeights: { bad_decision: 3 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'Which thing has gotten you into the MOST trouble in relationships or situationships?',
      choices: [
        { id: 'a', label: 'Giving someone one last chance because I missed how things used to feel.', resultWeights: { bad_decision: 2, unlocked: 1 } },
        { id: 'b', label: 'Taking too long to say what I want because flirting feels safer.', resultWeights: { tension: 2 } },
        { id: 'c', label: 'Keeping too much to myself until the other person feels shut out.', resultWeights: { unlocked: 2 } },
        { id: 'd', label: 'Noticing red flags, then convincing myself they’re just decorations. 😭', resultWeights: { bad_decision: 3 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'You’re staring at a text that could reopen an entire chapter. It’s not dangerous, just MESSY. You already know the likely consequences. What do you do?',
      choices: [
        { id: 'a', label: 'Delete it, put the phone down, and let tomorrow-me send a thank-you note.', resultWeights: { halo: 2 } },
        { id: 'b', label: 'Rewrite it into something flirtier and less revealing. I’m testing the waters.', resultWeights: { tension: 2 } },
        { id: 'c', label: 'Send an honest message about what I actually want. No games this time.', resultWeights: { unlocked: 2 } },
        { id: 'd', label: 'Hit send. Read it back. Whisper, “Oh, I have made a choice.” 😭', resultWeights: { bad_decision: 3 } },
      ],
    },
  ],
};
