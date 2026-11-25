import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): new premium quiz, approved as the 17th launch quiz from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 04, Quiz 4
// ("What Do People Trust You With?"). 5 choices per question (A-E).
export const GOOD_STUFF_TRUST_QUIZ: ArchetypeQuizDefinition = {
  id: 'good-stuff-trust',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private',
  title: 'What Do People Trust You With?',
  eyebrow: 'APPARENTLY PRIVATE · THE GOOD STUFF',
  introSupport: ['Being trusted feels nice. Being trustworthy is where we check the receipts.'],
  introNote: 'Secrets, favors, hard truths, emergencies. What people hand you, and what happens after they leave. Answer for what you usually do, not what sounds most respectable.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Check my record →',
  mixLabel: 'YOUR TRUST MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['vault', 'showup', 'truth', 'gossip', 'unreliable'],
  resultGates: {
    gossip: { minSignals: 4, requiredGroups: [{ answers: ['q2-e', 'q3-a', 'q6-d', 'q7-e', 'q8-b', 'q9-c', 'q10-a'], min: 2 }] },
    unreliable: { minSignals: 4, requiredGroups: [{ answers: ['q2-a', 'q5-a', 'q6-b', 'q7-b', 'q10-c'], min: 2 }] },
  },
  archetypes: [
    {
      id: 'vault',
      title: 'VAULT | YOU ARE A VAULT. AND PEOPLE KNOW IT.',
      kicker: 'The secret entered. No press conference was scheduled.',
      apparentlySignature: 'Apparently, confidential still means confidential.',
      traits: ['Discreet', 'Trustworthy', 'Grounded'],
      structuredRead: {
        theVerdict: ['The secret stays where it belongs.'],
        theRead: ['People can tell you something difficult without watching it travel through the group chat. You ask what kind of support they need, understand the difference between your curiosity and their privacy, and do not treat another person’s life as conversation material. You can also recognize when a real safety concern means silence is not the responsible option.'],
        theCallOut: ['Being a safe listener does not mean becoming the storage unit for everyone’s emotional emergencies.'],
        theCost: ['You may carry stories that are heavy long after the person who told you has moved on.'],
        tryThis: ['When someone brings a serious concern, ask whether they want you to listen, help plan, or connect them to appropriate support.'],
      },
    },
    {
      id: 'showup',
      title: 'SHOWUP | YOU ACTUALLY SHOW UP. WILD CONCEPT.',
      kicker: 'You said you would be there. Then you were there. Apparently this is breaking news.',
      apparentlySignature: 'Apparently, reliability is rare enough to look like a superpower.',
      traits: ['Dependable', 'Accountable', 'Considerate'],
      structuredRead: {
        theVerdict: ['Your yes means yes, not “remind me seventeen times.”'],
        theRead: ['People know you will tell them what you can realistically do, and then do it. You follow through on the uncomfortable or unglamorous parts of being dependable. You do not need applause for keeping a promise. You are also willing to renegotiate early rather than disappearing and leaving someone to guess.'],
        theCallOut: ['Reliable people sometimes forget that they are allowed to say no.'],
        theCost: ['Other people may slowly assign you responsibilities they never asked whether you wanted.'],
        tryThis: ['Choose one commitment you maintain from guilt rather than agreement. Renegotiate it before resentment sets in.'],
      },
    },
    {
      id: 'truth',
      title: 'TRUTH | YOU TELL THE TRUTH WITHOUT USING IT AS A WEAPON.',
      kicker: 'The truth arrived. Nobody needed a hazmat team.',
      apparentlySignature: 'Apparently, honesty and kindness are allowed in the same sentence.',
      traits: ['Honest', 'Tactful', 'Supportive'],
      structuredRead: {
        theVerdict: ['People trust you with the answer they do not want to hear.'],
        theRead: ['You can tell a friend a decision is risky, admit when you cannot help, or give feedback without making honesty into a public spectacle. You weigh your words, keep private things private, and understand that compassion does not require telling someone what they want to hear.'],
        theCallOut: ['Sometimes kindness can drift into too much preparation. You do not need the perfect opening sentence to tell a necessary truth.'],
        theCost: ['Delaying an uncomfortable conversation can make the eventual truth harder to hear.'],
        tryThis: ['Say one clear, useful truth to someone who has asked for it. Then leave space for their response.'],
      },
    },
    {
      id: 'gossip',
      title: 'GOSSIP | YOU’RE A GOSSIP. EVERYBODY KNOWS.',
      kicker: 'You promised to keep it between you two. The group chat apparently counts as one person.',
      apparentlySignature: 'Apparently, the tea is not yours to serve.',
      traits: ['Loose-Lipped', 'Approval-Seeking', 'Boundary-Crossing'],
      structuredRead: {
        theVerdict: ['People trust you with information. You turn it into content.'],
        theRead: ['Your answers show a pattern of repeating private stories, offering “anonymous” details people can identify, and telling yourself you are only venting or asking for advice. Unless there is an actual safety concern, that information was not yours to distribute. If you need support, there are ways to ask without broadcasting somebody else’s business.'],
        theCallOut: ['“Do not tell anyone” was not an invitation to choose your favorite three people. You are not the communication department for another person’s private life.'],
        theCost: ['People stop confiding in you. Worse, someone gets hurt or exposed because you needed an interesting story for the conversation.'],
        tryThis: ['Stop repeating a private detail today. If you have already shared one, own it without excuses, tell the person, and do what repair is possible.'],
      },
    },
    {
      id: 'unreliable',
      title: 'UNRELIABLE | YOU’RE UNRELIABLE. STOP OFFERING.',
      kicker: '“I got you” has become an extremely unreliable weather forecast.',
      apparentlySignature: 'Apparently, your intentions keep missing their appointments.',
      traits: ['Overcommitted', 'Avoidant', 'Inconsistent'],
      structuredRead: {
        theVerdict: ['Your promises are starting to sound like decorative language.'],
        theRead: ['You say yes because you want to be seen as helpful, or because saying no is uncomfortable. Then you fail to do what you volunteered for, dodge the follow-up, and let other people find replacement help at the last minute. A genuine emergency is one thing. This is a repeated pattern of making commitments you never protected enough to keep.'],
        theCallOut: ['Stop volunteering for the version of yourself that exists only when everybody is watching you agree. The actual work still needs a person.'],
        theCost: ['Your yes costs people time, money, and contingency plans. Eventually nobody asks because your help creates another problem.'],
        tryThis: ['For the next month, make fewer promises. For every yes, put the task and deadline on your calendar immediately. Tell people early if you cannot deliver.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'A friend says, “I need to tell you something, but nobody can know.” What is your first move?',
      choices: [
        { id: 'a', label: '“Is anyone in danger?” Once I know it’s safe, I let them talk.', resultWeights: { vault: 2 } },
        { id: 'b', label: 'I listen, already wondering whether I can tell my sister without using names.', resultWeights: { gossip: 2 } },
        { id: 'c', label: '“Do you need me to just listen or help you deal with it?”', resultWeights: { showup: 2 } },
        { id: 'd', label: '“Can I come over? This sounds bigger than a text.”', resultWeights: { showup: 2 } },
        { id: 'e', label: '“I’ll be honest with you, even if the answer isn’t the one you want.”', resultWeights: { truth: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You agreed to pick someone up from the airport at 11 p.m. The flight is delayed to 1 a.m.',
      choices: [
        { id: 'a', label: 'I turn off my phone. They’ll find a rideshare. I’m already in bed.', resultWeights: { unreliable: 3 } },
        { id: 'b', label: '“Send me the updated landing time. I’ll be there.” I make more coffee.', resultWeights: { showup: 2 } },
        { id: 'c', label: 'I keep the pickup details private. They told me this trip was personal.', resultWeights: { vault: 2 } },
        { id: 'd', label: '“I can’t safely drive that late. I can pay half for a car.”', resultWeights: { truth: 2 } },
        { id: 'e', label: 'Before they land I’ve told three people why they’re coming into town.', resultWeights: { gossip: 3 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'A mutual friend asks why someone stopped drinking. You know the reason. What comes out?',
      choices: [
        { id: 'a', label: '“I probably shouldn’t say this, but...” You can already hear the rest.', resultWeights: { gossip: 3 } },
        { id: 'b', label: '“That’s their story. Ask them if they want to talk about it.”', resultWeights: { vault: 2 } },
        { id: 'c', label: '“I don’t want to speculate or speak for them.”', resultWeights: { truth: 2 } },
        { id: 'd', label: 'I change the subject and later check on my friend without making it weird.', resultWeights: { showup: 2 } },
        { id: 'e', label: 'I promise to shut down the rumors, then never bother correcting anything.', resultWeights: { unreliable: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone asks for honest feedback on a presentation that has real problems. What do you do?',
      choices: [
        { id: 'a', label: '“The opening works. The numbers on slide four don’t. Want help fixing them?”', resultWeights: { truth: 2 } },
        { id: 'b', label: 'I make an hour to rehearse it with them. They asked for help, not applause.', resultWeights: { showup: 2 } },
        { id: 'c', label: '“I’ll look tonight.” I don’t open it until they’re already presenting.', resultWeights: { unreliable: 2 } },
        { id: 'd', label: 'I tell someone else the deck is a mess before the presenter gets a word from me.', resultWeights: { gossip: 2 } },
        { id: 'e', label: 'I mark up the draft privately. No reason to announce their mistakes to the team.', resultWeights: { vault: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You borrow $80 from a friend and promise to repay it on payday. Payday comes.',
      choices: [
        { id: 'a', label: 'I buy something fun, then hope they feel too awkward to ask.', resultWeights: { unreliable: 3 } },
        { id: 'b', label: '“I’m $20 short. Can I send $60 now and the rest Friday?”', resultWeights: { truth: 2 } },
        { id: 'c', label: 'The payment lands before breakfast. They didn’t have to remind me.', resultWeights: { showup: 2 } },
        { id: 'd', label: 'I pay them back and never turn their generosity into a story for other people.', resultWeights: { vault: 2 } },
        { id: 'e', label: 'I complain to a mutual friend that they’re being weird about the money.', resultWeights: { gossip: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'You know a coworker made a serious mistake. It has not been discovered. Your instinct?',
      choices: [
        { id: 'a', label: 'I bring it to them privately first, unless someone could be harmed by waiting.', resultWeights: { vault: 2 } },
        { id: 'b', label: '“Not my problem.” I leave the error for whoever works the next shift.', resultWeights: { unreliable: 3 } },
        { id: 'c', label: 'I help fix the immediate problem, then make sure the right person knows.', resultWeights: { showup: 2 } },
        { id: 'd', label: 'I tell the team it was a disaster before I tell the person who can fix it.', resultWeights: { gossip: 3 } },
        { id: 'e', label: 'I report the facts without adding a character assassination.', resultWeights: { truth: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'A friend is having a terrible week. They say, “Can you come sit with me tonight?” You already made plans.',
      choices: [
        { id: 'a', label: 'I rearrange one thing I can move and ask what time they need me.', resultWeights: { showup: 2 } },
        { id: 'b', label: '“Absolutely.” Then I never show up, because I didn’t want to say no.', resultWeights: { unreliable: 3 } },
        { id: 'c', label: 'I come over and resist turning their hard week into an update for everyone else.', resultWeights: { vault: 2 } },
        { id: 'd', label: '“I can come tomorrow morning. Tonight I can call at eight.”', resultWeights: { truth: 2 } },
        { id: 'e', label: 'I text the whole group, “We need to talk about what’s going on with them.” They didn’t ask me to.', resultWeights: { gossip: 3 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your friend asks, “Did you know they were talking about me?” You did. What do you say?',
      choices: [
        { id: 'a', label: '“I heard something, but I wasn’t going to keep it circulating. Do you want to know the details?”', resultWeights: { vault: 2 } },
        { id: 'b', label: 'I deliver the entire transcript, including the part I helpfully embellished.', resultWeights: { gossip: 3 } },
        { id: 'c', label: 'I insist I’ll handle it, then avoid the conversation entirely.', resultWeights: { unreliable: 2 } },
        { id: 'd', label: '“Yes. I should have told you it was happening. I’m sorry.”', resultWeights: { truth: 2 } },
        { id: 'e', label: 'I ask how they want to handle it and offer to be there if they confront the person.', resultWeights: { showup: 2 } },
      ],
    },
    {
      id: 'q9',
      // Q9A and Q9B are near-duplicate choice text in the approved source document
      // (both "Please tell everybody what I said," both mapped to vault +2 with
      // identical trait awards). This is a genuine doc redundancy, not a scoring
      // conflict (no contradictory poles), so both are preserved verbatim per the
      // "do not rewrite, soften, or reinterpret approved content" directive.
      prompt: 'Which request would your closest friends be most hesitant to give you?',
      choices: [
        { id: 'a', label: '“Please tell everybody what I said.” They know I will not speak for them unless asked.', resultWeights: { vault: 2 } },
        { id: 'b', label: '“Please tell everybody what I said.” I’m not the messenger unless asked directly.', resultWeights: { vault: 2 } },
        { id: 'c', label: '“Please keep this between us.” I have broken that promise before, and I know why they hesitate.', resultWeights: { gossip: 3 } },
        { id: 'd', label: '“Please tell me the truth.” I’m direct, and I work on not making it sting.', resultWeights: { truth: 2 } },
        { id: 'e', label: '“Can you be there?” They usually ask because they know I’ll show up.', resultWeights: { showup: 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Apparently opens the receipts folder on how you handle someone else’s business. Which file is the thickest?',
      choices: [
        { id: 'a', label: 'My “just between us” conversations have a suspiciously large distribution list.', resultWeights: { gossip: 3 } },
        { id: 'b', label: 'Times I said, “I’m five minutes away,” and actually was.', resultWeights: { showup: 2 } },
        { id: 'c', label: 'Apologies for promising something and then ignoring it until someone chased me.', resultWeights: { unreliable: 3 } },
        { id: 'd', label: 'Messages where I refused to confirm a story that wasn’t mine to tell.', resultWeights: { vault: 2 } },
        { id: 'e', label: 'Conversations where I said the hard thing privately instead of joining the public pile-on.', resultWeights: { truth: 2 } },
      ],
    },
  ],
};
