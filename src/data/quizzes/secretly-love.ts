import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): revives this quiz as an active free preview, replacing
// its content with docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source
// file 01, Quiz 3 ("WHAT DO PEOPLE SECRETLY LOVE ABOUT YOU?"). `historicalOnly` is removed
// (this quiz is playable again); the quiz_key is reused in place rather than versioned to a
// new id, same justification as every other content reuse this round -- no production data
// has ever existed under this key (its content was never pushed, and it has sat
// historicalOnly/unreachable in the registry the entire time this key has existed). No
// harsh-result gate: all four outcomes are affirmative by design, per the document's own
// scoring note. Personality evidence comes only from real quiz_choice_trait_awards.
export const SECRETLY_LOVE_QUIZ: ArchetypeQuizDefinition = {
  id: 'secretly-love',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private-preview',
  title: 'What Do People Secretly Love About You?',
  eyebrow: 'APPARENTLY PRIVATE · FREE PREVIEW',
  introSupport: [
    'Not everything people love about you makes a good toast. Some of it happens in the little moments you barely notice. The moments they do.',
  ],
  meta: '8 questions · About 2 minutes',
  introCta: 'Tell me the quiet part →',
  mixLabel: 'YOUR GOOD STUFF MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q4', 'q6', 'q7'],
  archetypes: [
    {
      id: 'unimpressive-welcome',
      title: 'UP | YOU LET PEOPLE BE UNIMPRESSIVE.',
      kicker: 'Apparently, your superpower is letting people be regular. In this economy? Luxury.',
      traits: ['Accepting', 'Easy to Be Around', 'Nonjudgmental'],
      structuredRead: {
        theVerdict: ['Around you, people are allowed to show up without their good lighting.'],
        theRead: ['They can be tired, repetitive, boring, unsure, or not particularly inspiring today, and you don’t immediately ask them to become more entertaining. That’s rare. Plenty of people love us when we’re shining. The little thing they love about you is that they don’t have to shine on command.'],
        theCallOut: ['Acceptance is a gift, but sometimes you avoid saying the hard thing because you don’t want to ruin the comfort. Making room for someone and never challenging them are not the same skill.'],
        theCost: ['When you always make a soft landing, people may mistake your quiet acceptance for unlimited emotional capacity. They need to know your needs count too.'],
        tryThis: ['Keep being the soft place. Occasionally add one honest sentence about what you need from the relationship.'],
      },
    },
    {
      id: 'remembers-footnotes',
      title: 'FT | YOU REMEMBER THE FOOTNOTES.',
      kicker: 'Apparently, you’re not extra. You’re the footnotes. And somehow that’s the whole love story.',
      traits: ['Attentive', 'Thoughtful', 'Detail-Oriented'],
      structuredRead: {
        theVerdict: ['You notice the detail that never made it into the main story.'],
        theRead: ['The snack they mentioned once. The name of the person they were nervous to call. The little ritual that makes a bad day easier. You keep those details not because you’re collecting intelligence but because they belong to that person. Around you, people feel less interchangeable.'],
        theCallOut: ['Sometimes remembering everything means you also silently expect everyone to remember you with the same precision. They may love you deeply and still forget the exact sauce. 😂'],
        theCost: ['If thoughtfulness becomes a secret scorecard, you can end up disappointed in people who never knew there was a test.'],
        tryThis: ['Let the detail be a gift, not a receipt. If remembering matters to you, tell people which little things make you feel cared for.'],
      },
    },
    {
      id: 'invisible-work',
      title: 'IW | YOU NOTICE THE WORK NOBODY APPLAUDED.',
      kicker: 'Apparently, you clap for the rehearsal. Not just the premiere.',
      traits: ['Observant', 'Appreciative', 'Quietly Supportive'],
      structuredRead: {
        theVerdict: ['You see effort that never got a trophy, a post, or a standing ovation.'],
        theRead: ['You notice when somebody got through a hard day with no help and no dramatic announcement. You see the invisible labor, the emotional restraint, the tiny step after weeks of fear. Your attention makes someone feel like their life is more than just the outcomes people can photograph.'],
        theCallOut: ['Sometimes you spot what needs doing so quickly that you slide from recognition into rescue. Somebody can want their effort seen without wanting you to take over the next chapter.'],
        theCost: ['If you become the only person who notices everything, you can end up carrying more than your share, and resenting the very invisibility you’re trying to correct.'],
        tryThis: ['Tell someone, “I saw that.” Then ask before moving into fixer mode. Recognition counts even when it doesn’t turn into a project.'],
      },
    },
    {
      id: 'room-not-full-time',
      title: 'RM | YOU DON’T MAKE CLOSENESS A FULL-TIME JOB.',
      kicker: 'Apparently, you don’t require daily attendance to remain somebody’s person. Beautiful. Maybe send a text though.',
      traits: ['Relaxed', 'Low-Pressure', 'Respects Space'],
      structuredRead: {
        theVerdict: ['People feel loved by you without having to clock in every morning.'],
        theRead: ['You’re able to care without demanding an immediate reply, a constant explanation, or proof that the relationship still matters. People who are overwhelmed, introverted, or simply busy can relax around you because they don’t have to perform availability to keep their place.'],
        theCallOut: ['Space is healthy. Disappearing indefinitely and calling it “low-maintenance” can also be a convenient way to avoid showing initiative. Respecting their freedom shouldn’t mean never reaching out first.'],
        theCost: ['Some people need more reassurance than you naturally offer. They can misread your easygoing style as indifference unless you make care visible sometimes.'],
        tryThis: ['Send the first message occasionally, especially when you don’t need anything. Make it clear that freedom and affection can coexist.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone tells you about a tiny win: they finally made a phone call they’d been avoiding for weeks. What do you say?',
      choices: [
        { id: 'a', label: '“I know how long that was sitting on you. That’s a big deal.”', resultWeights: { 'invisible-work': 2 } },
        { id: 'b', label: '“Was that the call about the Tuesday appointment you mentioned last month?”', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'c', label: '“You don’t have to convince me it’s impressive. I’m happy with you.”', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'd', label: '“Proud of you. No need to tell me more unless you feel like it.”', resultWeights: { 'room-not-full-time': 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your favorite person is quieter than usual over dinner. You’re not sure why. What happens?',
      choices: [
        { id: 'a', label: 'I keep us company without making them explain their mood.', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'b', label: 'I remember the food they always want when they’re having a rough day. I order that.', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'c', label: 'I quietly take care of the thing they’ve been carrying all week, if they want help.', resultWeights: { 'invisible-work': 2 } },
        { id: 'd', label: 'I tell them they can head home early without hurting my feelings.', resultWeights: { 'room-not-full-time': 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'A good friend goes quiet for two days. You know they’re overwhelmed, not angry with you. Your move?',
      choices: [
        { id: 'a', label: 'I don’t make their need for space into a test of our friendship.', resultWeights: { 'room-not-full-time': 2 } },
        { id: 'b', label: 'When they return, I don’t make them give a courtroom account of where they’ve been.', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'c', label: 'I save the ridiculous thing they’d love and send it when they resurface.', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'd', label: 'I send one low-pressure message offering to take a concrete task off their plate.', resultWeights: { 'invisible-work': 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone you love has been quietly carrying work, family, and everyone else’s needs. They shrug: “It’s nothing.”',
      choices: [
        { id: 'a', label: '“It wasn’t nothing. I saw how much you did when nobody was looking.”', resultWeights: { 'invisible-work': 2 } },
        { id: 'b', label: 'I mention the one specific sacrifice everyone else seems to have missed.', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'c', label: 'I make space for them to admit they’re exhausted without asking for a positive spin.', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'd', label: 'I help create a real break and don’t turn it into one more commitment.', resultWeights: { 'room-not-full-time': 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'At a gathering, someone you care about mentions a very specific preference they’d told you once.',
      choices: [
        { id: 'a', label: '“I remembered. That’s why I picked this one.”', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'b', label: 'I make sure they know they don’t have to pretend they like the popular choice.', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'c', label: 'I thank them for the little work they did to make everyone comfortable today.', resultWeights: { 'invisible-work': 2 } },
        { id: 'd', label: 'I offer them the easy option to opt out without making it a scene.', resultWeights: { 'room-not-full-time': 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Plans get canceled because someone is burned out. What would they be most relieved to hear from you?',
      choices: [
        { id: 'a', label: '“Rest. You don’t owe me replacement plans before you’ve slept.”', resultWeights: { 'room-not-full-time': 2 } },
        { id: 'b', label: '“You don’t need to be the fun version of you for me to want you around.”', resultWeights: { 'unimpressive-welcome': 2 } },
        { id: 'c', label: '“I’ll save you the specific snack you always steal from my plate.”', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'd', label: '“Want me to handle the one annoying errand you haven’t had time for?”', resultWeights: { 'invisible-work': 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Someone is making a life choice that isn’t what you’d choose. You care about them. What do you actually do?',
      choices: [
        { id: 'a', label: 'I let them own the decision without making my approval the prize.', resultWeights: { 'room-not-full-time': 2 } },
        { id: 'b', label: 'I notice the courage and work it took just to reach a decision, regardless of the outcome.', resultWeights: { 'invisible-work': 2 } },
        { id: 'c', label: 'I remember the personal reason they once told me this mattered, even if it sounds random to others.', resultWeights: { 'remembers-footnotes': 2 } },
        { id: 'd', label: 'I let them say the uncertain and contradictory parts out loud without turning it into a debate.', resultWeights: { 'unimpressive-welcome': 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Which unexpected message would feel most like something someone might send you?',
      choices: [
        { id: 'a', label: '“I don’t have to be the impressive version of myself with you.”', resultWeights: { 'unimpressive-welcome': 1 } },
        { id: 'b', label: '“You remember stuff I forgot I even told you.”', resultWeights: { 'remembers-footnotes': 1 } },
        { id: 'c', label: '“You saw the work nobody else thought to mention.”', resultWeights: { 'invisible-work': 1 } },
        { id: 'd', label: '“You’re the only person who doesn’t make me explain why I needed space.”', resultWeights: { 'room-not-full-time': 1 } },
      ],
    },
  ],
};
