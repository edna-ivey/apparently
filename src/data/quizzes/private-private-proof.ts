import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): new premium 18+ quiz, approved in full from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 03, Quiz 3
// ("Do You Want Sex... or Proof?"). Server-enforced adult eligibility and premium
// entitlement apply via quizzes.access_tier/requires_age_verification, same mechanism as
// private-private-trouble. 5 choices per question (A-E).
export const PRIVATE_PRIVATE_PROOF_QUIZ: ArchetypeQuizDefinition = {
  id: 'private-private-proof',
  scoringType: 'archetype',
  category: 'Private Private. 😈',
  access: 'private',
  title: 'Do You Want Sex... or Proof?',
  eyebrow: 'APPARENTLY PRIVATE · PRIVATE PRIVATE 😈 · 18+',
  introSupport: [
    'Sometimes desire is desire. Sometimes it wants witnesses.',
    'Chemistry, attention, longing, and the little ego boost of being wanted. We are finding out what you are actually chasing when the flirting gets real.',
  ],
  introNote: 'For consenting adults. Being interested, selective, sexually confident, or not interested in sex is not a negative verdict. Answer for your actual intentions and behavior.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Tell on me 😈 →',
  mixLabel: 'YOUR PRIVATE PRIVATE. 😈 MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q7', 'q8', 'q9', 'q10'],
  tieFallbackOrder: ['connection', 'spark', 'chosen', 'using', 'leading'],
  resultGates: {
    using: { minSignals: 4, requiredGroups: [{ answers: ['q1-d', 'q2-c', 'q4-a', 'q7-c', 'q8-b', 'q9-a', 'q10-e'], min: 3 }] },
    leading: { minSignals: 4, requiredGroups: [{ answers: ['q1-e', 'q2-d', 'q3-c', 'q4-b', 'q6-e', 'q7-d', 'q8-c', 'q9-b', 'q10-a'], min: 3 }] },
  },
  archetypes: [
    {
      id: 'connection',
      title: 'CONNECTION | YOU WANT THE PERSON. NOT JUST THE REACTION.',
      kicker: 'You noticed the chemistry and still remembered there was another person involved.',
      apparentlySignature: 'Apparently, the person is the prize, not the applause.',
      traits: ['Intentional', 'Mutual', 'Clear'],
      structuredRead: {
        theVerdict: ['The attention is nice. The actual human being is the point.'],
        theRead: ['Your answers suggest you are drawn to honest closeness. You care whether the interest is mutual, what the other person wants, and whether the situation feels good after the excitement settles. You can enjoy desire without using it to fill a vacancy in your self-worth. You are willing to say what you mean rather than offer chemistry as a substitute for a conversation.'],
        theCallOut: ['Do not turn being intentional into an audition for a perfect relationship. You are allowed to want something casual, something serious, or nothing right now, as long as you are clear.'],
        theCost: ['If you overanalyze every connection, attraction may start feeling like an interview.'],
        tryThis: ['Say one thing you genuinely want and ask what the other person wants. Keep room for a different answer.'],
      },
    },
    {
      id: 'spark',
      title: 'SPARK | YOU WANT THE HEAT. AND YOU OWN THAT.',
      kicker: 'The chemistry has a reservation. The expectations have been informed.',
      apparentlySignature: 'Apparently, you can be grown without making it everybody else’s guessing game.',
      traits: ['Playful', 'Direct', 'Self-Aware'],
      structuredRead: {
        theVerdict: ['You like attraction without pretending it is automatically a love story.'],
        theRead: ['You can admit when a connection is mainly about chemistry and keep your behavior aligned with what you have actually offered. Flirting is fun. Desire is real. That does not require you to promise commitment, use somebody for a confidence boost, or manufacture mystery. Your answers suggest you can be playful and direct about what is, and is not, on the table.'],
        theCallOut: ['Confidence is not permission to assume the other person wants the same arrangement. They get a full vote.'],
        theCost: ['If you rely too much on “we both know what this is,” one of you may be operating from a very different script.'],
        tryThis: ['Put the terms into words before the situation gets complicated. Clear can still be sexy.'],
      },
    },
    {
      id: 'chosen',
      title: 'CHOSEN | YOU WANT TO FEEL CHOSEN. MORE THAN YOU ADMIT.',
      kicker: 'Your phone lit up and your confidence clocked in for a shift.',
      apparentlySignature: 'Apparently, the notification is sometimes the whole fantasy.',
      traits: ['Validation-Aware', 'Sensitive to Attention', 'Searching for Certainty'],
      structuredRead: {
        theVerdict: ['You are not necessarily chasing sex. You are chasing the exhale that comes with being wanted.'],
        theRead: ['You may love the compliment, the second look, the late-night text, or the feeling that someone made a special effort for you. That does not automatically mean you are manipulating anyone. But your answers suggest that validation is sometimes more important than the person delivering it. The rush feels real, then fades, and you wonder why you need the signal again.'],
        theCallOut: ['Attention can reassure you for a minute. It cannot become your permanent proof that you matter.'],
        theCost: ['You may mistake a brief ego lift for genuine compatibility or keep reopening conversations that do not lead anywhere good.'],
        tryThis: ['Before responding, ask: “Do I want this person, this experience, or just the feeling of being wanted?” Answer privately before you answer them.'],
      },
    },
    {
      id: 'using',
      title: 'USING | YOU’RE USING PEOPLE TO FEEL WANTED.',
      kicker: 'You got the compliment and suddenly remembered you were busy.',
      apparentlySignature: 'Apparently, your confidence should not require an audience on standby.',
      traits: ['Validation-Dependent', 'Self-Referencing', 'Emotionally Inconsiderate'],
      structuredRead: {
        theVerdict: ['You are treating somebody else’s interest like a refill station for your confidence.'],
        theRead: ['Your answers show a repeated pattern: you reach for someone when you feel undesirable, draw out their affection or desire, and lose interest once you get the proof you came for. Then, when the insecurity returns, you know exactly whose messages you can reopen. The person on the other side believes they are connecting with you. Too often, they are being recruited to fix a feeling you do not want to sit with.'],
        theCallOut: ['That is not flirting. That is emotional extraction with attractive lighting. They are a person, not a vending machine for reassurance.'],
        theCost: ['You can leave somebody attached to a connection you had no intention of building, while your own need for validation remains unsolved.'],
        tryThis: ['Stop contacting anyone you only reach for when your confidence drops. If you do not want a connection, do not borrow their hope to feel better.'],
      },
    },
    {
      id: 'leading',
      title: 'LEADING | YOU’RE LEADING PEOPLE ON. AND YOU KNOW IT.',
      kicker: 'You did not want the date. You wanted them to keep asking.',
      apparentlySignature: 'Apparently, the mixed signals were not mixed on your side.',
      traits: ['Misleading', 'Attention-Driven', 'Avoids Clarity'],
      structuredRead: {
        theVerdict: ['You are keeping the door cracked open because you like who waits outside it.'],
        theRead: ['Your answers describe a deliberate pattern: you know you do not want what someone is hoping for, but you keep offering hints, suggestive invitations, and future-shaped language to preserve their attention. You are not confused about your intentions nearly as often as you act. You just do not want to lose the benefits of someone else believing there is a chance.'],
        theCallOut: ['Stop calling it “keeping things open.” You are letting someone build expectations you already know you will not meet.'],
        theCost: ['People spend real time, affection, and emotional energy on a future you are privately ruling out. Once they realize, the chemistry will not excuse the deception.'],
        tryThis: ['Say the uncomfortable sentence now: “I like the attention, but I do not want the relationship you are hoping for.” Then stop sending contradictory signals.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone you find attractive says, “What are you looking for with me?” Your most honest response?',
      choices: [
        { id: 'a', label: '“I want to know you and see if the connection is mutual.”', resultWeights: { connection: 2 } },
        { id: 'b', label: '“I am attracted to you. I am not promising more than that.”', resultWeights: { spark: 2 } },
        { id: 'c', label: '“I am still figuring it out.” What I know is that being wanted feels good.', resultWeights: { chosen: 2 } },
        { id: 'd', label: 'I avoid the question. I mostly text when I need a confidence boost.', resultWeights: { using: 3 } },
        { id: 'e', label: '“Who knows where this could go?” I already know I do not want it to go there.', resultWeights: { leading: 3 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'You have had a rough week and do not feel attractive. What would make you feel better?',
      choices: [
        { id: 'a', label: 'A fun, mutual flirtation where everybody understands the vibe.', resultWeights: { spark: 2 } },
        { id: 'b', label: 'One sincere “I want you” from someone I genuinely like.', resultWeights: { chosen: 2 } },
        { id: 'c', label: 'Texting someone I know is into me, just to see how quickly they respond.', resultWeights: { using: 3 } },
        { id: 'd', label: 'Reviving a conversation I do not want to pursue, because I miss being chased.', resultWeights: { leading: 3 } },
        { id: 'e', label: 'Time with someone who actually knows me, even without flirting.', resultWeights: { connection: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'A former fling messages, “I still think about you.” You do not actually want to see them. You...',
      choices: [
        { id: 'a', label: 'Enjoy the fact they still remember me, then leave the conversation there.', resultWeights: { chosen: 2 } },
        { id: 'b', label: 'Ask if they miss me a lot. I want the details, not the reunion.', resultWeights: { using: 2 } },
        { id: 'c', label: 'Say “I have missed you too, maybe soon,” even though I will not make plans.', resultWeights: { leading: 3 } },
        { id: 'd', label: 'Answer kindly but do not invite something I cannot offer.', resultWeights: { connection: 2 } },
        { id: 'e', label: 'Maybe exchange a compliment, but make the boundary clear.', resultWeights: { spark: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone is clearly developing feelings. You know yours are not growing. What do you do?',
      choices: [
        { id: 'a', label: 'Keep seeing them while the affection still makes me feel better.', resultWeights: { using: 3 } },
        { id: 'b', label: 'Give “maybe later” answers so they do not leave, despite knowing the truth.', resultWeights: { leading: 3 } },
        { id: 'c', label: 'Tell them the truth promptly and let them choose what happens next.', resultWeights: { connection: 2 } },
        { id: 'd', label: 'Explain that I enjoy the chemistry but cannot offer a relationship.', resultWeights: { spark: 2 } },
        { id: 'e', label: 'Feel sad about losing their attention, but admit I should be clear.', resultWeights: { chosen: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'You post a photo and notice exactly ONE person you hoped would react has viewed it. No message. What now?',
      choices: [
        { id: 'a', label: 'Send a flirty “you saw that?” just to pull them back into the game.', resultWeights: { leading: 2 } },
        { id: 'b', label: 'Nothing. If I want to talk to them, I will actually start a conversation.', resultWeights: { connection: 2 } },
        { id: 'c', label: 'Enjoy the possibility, then move on with my evening.', resultWeights: { spark: 2 } },
        { id: 'd', label: 'Feel disappointed. I hoped their reaction would tell me I am still desired.', resultWeights: { chosen: 2 } },
        { id: 'e', label: 'Post something else aimed at baiting their attention, even though I do not want them.', resultWeights: { using: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'After a great mutual evening, the other person wants to know whether they will see you again. You...',
      choices: [
        { id: 'a', label: 'Answer based on whether I actually want to keep getting to know them.', resultWeights: { connection: 2 } },
        { id: 'b', label: 'If I want another casual date, I say that clearly and ask what they want.', resultWeights: { spark: 2 } },
        { id: 'c', label: 'Feel thrilled they asked, then realize I am less sure what I want.', resultWeights: { chosen: 2 } },
        { id: 'd', label: 'Keep them warm with affectionate replies until the ego boost wears off.', resultWeights: { using: 2 } },
        { id: 'e', label: 'Suggest specific future plans I have no intention of making real.', resultWeights: { leading: 3 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Imagine nobody could ever brag about wanting you. Which part of dating would you still enjoy most?',
      choices: [
        { id: 'a', label: 'The actual chemistry and fun, as long as it is mutual.', resultWeights: { spark: 2 } },
        { id: 'b', label: 'I would still date, but I would miss the feeling of being specially chosen.', resultWeights: { chosen: 2 } },
        { id: 'c', label: 'I am not sure. The attention is honestly a huge part of why I reach out.', resultWeights: { using: 3 } },
        { id: 'd', label: 'I would probably flirt less. Knowing somebody is chasing me is the best part.', resultWeights: { leading: 3 } },
        { id: 'e', label: 'The talks, trust, and getting to know the real person.', resultWeights: { connection: 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Someone says, “I am getting mixed signals from you.” What is true?',
      choices: [
        { id: 'a', label: 'My feelings about the attention are clearer than my feelings about the person.', resultWeights: { chosen: 2 } },
        { id: 'b', label: 'I get distant after they reassure me, then return when I feel insecure again.', resultWeights: { using: 3 } },
        { id: 'c', label: 'I know I do not want more. I just hate losing access to their interest.', resultWeights: { leading: 3 } },
        { id: 'd', label: 'I take it seriously and clarify what I actually feel.', resultWeights: { connection: 2 } },
        { id: 'e', label: 'I may have been playful without explaining what I am open to. I fix that.', resultWeights: { spark: 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'You could receive exactly ONE of these tonight. What would you choose?',
      choices: [
        { id: 'a', label: 'A message proving I still have it, from someone I will probably ignore tomorrow.', resultWeights: { using: 3 } },
        { id: 'b', label: 'A person I do not want asking me to give them one more chance.', resultWeights: { leading: 3 } },
        { id: 'c', label: 'An honest conversation with somebody I really like.', resultWeights: { connection: 2 } },
        { id: 'd', label: 'Mutual chemistry with clear expectations and zero mind games.', resultWeights: { spark: 2 } },
        { id: 'e', label: 'Someone looking me in the eye and telling me they want me.', resultWeights: { chosen: 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Final check: Which sentence is uncomfortably close to true?',
      choices: [
        { id: 'a', label: 'I have knowingly let someone hope for something I already ruled out.', resultWeights: { leading: 3 } },
        { id: 'b', label: 'If I cannot be honest about what I want, I should not invite somebody closer.', resultWeights: { connection: 2 } },
        { id: 'c', label: 'I can want physical chemistry without pretending it promises a future.', resultWeights: { spark: 2 } },
        { id: 'd', label: 'Sometimes I want the feeling of being wanted more than I want a date.', resultWeights: { chosen: 2 } },
        { id: 'e', label: 'I have reached out to people for confidence I knew I would not return with care.', resultWeights: { using: 3 } },
      ],
    },
  ],
};
