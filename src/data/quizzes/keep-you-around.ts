import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): replaces the prior draft content verbatim from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 01, Quiz 1
// ("SO WHY DO PEOPLE KEEP YOU AROUND?"). Quiz id, question ids (q1-q10), and choice ids
// (a-e, FIVE choices per question, not four) are preserved; no real production data exists
// under this quiz_key (its award-activation migration has never been applied). Per the new
// universal scoring rule, personality evidence now comes ONLY from real, server-activated
// quiz_choice_trait_awards (scripts/lib/private-quiz-trait-awards.ts) -- the prior round's
// result-level profileSignals mechanism is removed from this quiz's own definition (it still
// exists as a legacy mechanism scoring.ts supports for other, untouched quizzes; this quiz
// simply no longer opts into it).
//
// Tie order is owner-approved but not literally identical to any single existing engine
// step: "higher total -> count of primary +2 matches on high-signal questions -> last
// diagnostic among Q8/Q6/Q5/Q3/Q1 -> fixed fallback order" (the source document's own words:
// "a runner should verify the exact engine's semantics, not infer implementation approval
// from this prose"). Implemented using the real engine's own steps (high-signal total,
// then all-question +2-primary count, then the NEW multi-question finalTieQuestionId chain
// this round added, then archetype-array-order fallback) -- faithful in spirit and intent,
// not a byte-for-byte reproduction of a tie-break shape the engine has never had.
export const KEEP_YOU_AROUND_QUIZ: ArchetypeQuizDefinition = {
  id: 'keep-you-around',
  scoringType: 'archetype',
  category: 'The Good Stuff',
  access: 'private-preview',
  title: 'So Why Do People Keep You Around?',
  eyebrow: 'APPARENTLY PRIVATE · FREE PREVIEW',
  introSupport: [
    "People don't only love you for your best behavior. Sometimes the reason they keep you close is attached to the thing that drives them absolutely insane. Let's find out what they're signing up for. 😂",
  ],
  meta: '10 questions · About 3 minutes',
  introCta: 'Expose me →',
  mixLabel: 'YOUR GOOD STUFF MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q1', 'q3', 'q5', 'q6', 'q8'],
  countPrimaryMatchesTieBreak: true,
  finalTieQuestionId: ['q8', 'q6', 'q5', 'q3', 'q1'],
  archetypes: [
    {
      id: 'emergency-contact',
      title: 'EC | THE EMERGENCY CONTACT',
      kicker: 'Apparently, you’re the emergency contact. The emergency is that nobody knows whether you’re okay.',
      traits: ['Loyal', 'Capable', 'Quietly Overloaded'],
      structuredRead: {
        theVerdict: ['You are everybody’s “call them” person. That’s love with logistics.'],
        theRead: ['When something falls apart, you don’t send a motivational quote and disappear. You remember, show up, find the charger, make the call, and stay until somebody can breathe again. People trust you because your care gets out of the group chat and does something.'],
        theCallOut: ['Here’s the part you won’t love: sometimes you take over before anyone asks. Then you resent everyone for expecting you to take over. A very efficient little trap. 👀'],
        theCost: ['If you’re always available, people can stop practicing how to show up for you. You become indispensable and quietly furious.'],
        tryThis: ['Before rescuing, ask, “Do you want help, advice, or company?” If they say company, leave the cape in the car.'],
      },
    },
    {
      id: 'reason-theres-a-story',
      title: 'ST | THE REASON THERE’S A STORY',
      kicker: 'Apparently, you’re a core memory. Occasionally a cautionary tale.',
      traits: ['Fun', 'Alive', 'Allergic to Boredom'],
      structuredRead: {
        theVerdict: ['You don’t just attend the function. You become the reason it gets recapped.'],
        theRead: ['You’re the friend who turns errands into an adventure and a dull dinner into an incident somebody mentions for years. People keep you close because ordinary life gets more alive around you.'],
        theCallOut: ['Sometimes your intolerance for boredom means you don’t let people have a quiet, awkward, or sad minute. Every feeling doesn’t need a sequel, a plan, or better lighting. 😂'],
        theCost: ['If you always produce the fun, people might feel obligated to keep up, even when they need to go home.'],
        tryThis: ['Once in a while ask, “Are we all having fun, or am I refusing to let tonight end?” Then honor the answer.'],
      },
    },
    {
      id: 'human-bullshit-detector',
      title: 'BS | THE HUMAN BULLSHIT DETECTOR',
      kicker: 'Apparently, when you say “Can I be honest?” people start bracing.',
      traits: ['Direct', 'Trustworthy', 'Occasionally Too Honest'],
      structuredRead: {
        theVerdict: ['The truth has your number. It does not always appreciate your delivery.'],
        theRead: ['You notice when the explanation and the behavior aren’t on speaking terms. You’re willing to say the inconvenient thing, and that makes your praise believable. Friends come to you when they want an answer, not a decorative yes.'],
        theCallOut: ['“I’m just honest” can become an all-access pass to saying a true thing in the meanest possible font. Sometimes you want clarity. Sometimes you want the winning line. Be able to tell the difference.'],
        theCost: ['If every half-formed thought gets cross-examined, people start bringing you only the polished version. The truth-teller gets less truth.'],
        tryThis: ['Before the hard sentence, ask: Is it true? Is it useful? Is this the moment? If one is missing, edit before sending.'],
      },
    },
    {
      id: 'hype-department',
      title: 'HD | THE HYPE DEPARTMENT',
      kicker: 'Apparently, you’re emotional pre-workout. Powerful. Please read the dosage instructions.',
      traits: ['Encouraging', 'Big-Hearted', 'Sometimes Too Much'],
      structuredRead: {
        theVerdict: ['You see people’s potential so clearly you sometimes forget they are allowed to rest.'],
        theRead: ['You notice the effort behind the win and the courage behind the attempt. People leave your conversations standing taller. You make your friends feel like there is still a bigger version of themselves worth meeting.'],
        theCallOut: ['Not everybody who says “I’m tired” is asking for a five-year plan. Sometimes your encouragement is a beautiful gift. Sometimes it’s pressure wearing a pom-pom hat.'],
        theCost: ['People may avoid sharing their doubts because they don’t want to disappoint the future version of themselves you already introduced to everybody.'],
        tryThis: ['Ask, “Hype, help, or just let me complain?” Then actually respect the selected service.'],
      },
    },
    {
      id: 'one-who-knows-too-much',
      title: 'KN | THE ONE WHO KNOWS TOO MUCH',
      kicker: 'Apparently, the group chat needs a privacy policy. Mostly because of you.',
      traits: ['Observant', 'Attentive', 'Unofficial Archivist'],
      structuredRead: {
        theVerdict: ['You noticed the shift before anybody announced there was a shift.'],
        theRead: ['You pick up the pauses, changed tones, tiny details, and backstories that make other people’s behavior make sense. Friends feel seen because you remember what they said three months ago and can tell when “I’m fine” isn’t the whole sentence.'],
        theCallOut: ['Reading the room is a skill. Reconstructing someone’s entire life from screenshots, mutuals, and one suspicious like is not automatically your assignment.'],
        theCost: ['You become the unofficial archive of everybody’s drama. Eventually people may stop confiding in you because you seem to have a permanent file on everything.'],
        tryThis: ['Ask: Is it mine to know? Mine to repeat? Mine to fix? If the answer is no, retire from that case.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Your friend is dating somebody you cannot stand. What are you actually doing?',
      choices: [
        { id: 'a', label: 'I say what worries me, once, clearly. After that, they’re grown.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'b', label: 'If it blows up, they can call me without getting an “I told you so.”', resultWeights: { 'emergency-contact': 2 } },
        { id: 'c', label: 'I keep making ridiculous plans with them. This relationship isn’t stealing our entire friendship.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'd', label: 'I have noticed three red flags and two inconsistencies. I’ll say more only if asked.', resultWeights: { 'one-who-knows-too-much': 2, 'human-bullshit-detector': 1 } },
        { id: 'e', label: 'I remind my friend they still have an identity outside this relationship. Loudly, if necessary.', resultWeights: { 'hype-department': 2, 'emergency-contact': 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Your friend gets something you wanted too. You are happy for them, but let’s not pretend it doesn’t sting.',
      choices: [
        { id: 'a', label: 'I congratulate them. My disappointment isn’t their bill to pay.', resultWeights: { 'emergency-contact': 2 } },
        { id: 'b', label: 'We are celebrating. My jealousy can stay home with its attitude. 😂', resultWeights: { 'reason-theres-a-story': 2, 'hype-department': 1 } },
        { id: 'c', label: 'I want the entire story. What worked for them, and what did I miss?', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'd', label: 'I make their win feel enormous. I know how hard they worked.', resultWeights: { 'hype-department': 2, 'reason-theres-a-story': 1 } },
        { id: 'e', label: '“I’m thrilled for you and a little sick for me.” Both things can be true.', resultWeights: { 'human-bullshit-detector': 2, 'emergency-contact': 1 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Your friend sends two thirst traps: “Which one should I post? My ex just hard-launched somebody.”',
      choices: [
        { id: 'a', label: 'The hotter one. If we’re being petty, at least give them production value.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'b', label: 'Neither, if the goal is making your ex react. They still have the remote control.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'c', label: 'Wait. Their ex hard-launched WHO? Send the post. 👀', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'd', label: 'Post whichever makes YOU feel good. Your ex doesn’t get a vote.', resultWeights: { 'hype-department': 2 } },
        { id: 'e', label: 'Post it if you want; then hand me the phone. We are not refreshing the views all night.', resultWeights: { 'emergency-contact': 2, 'human-bullshit-detector': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Your friend sends a screenshot ABOUT someone TO the exact person in the screenshot.',
      choices: [
        { id: 'a', label: 'Show me exactly what was sent. Details change the whole situation.', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'b', label: 'I’m laughing for 30 seconds before I’m useful. I’m only human.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'c', label: 'If the message was cruel, that’s the actual problem, not just getting caught.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'd', label: 'Okay. Who needs an apology? What can we repair right now?', resultWeights: { 'emergency-contact': 2 } },
        { id: 'e', label: 'Yes, you messed up. No, your life isn’t over. Own it and come back to Earth.', resultWeights: { 'hype-department': 2, 'human-bullshit-detector': 1 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'At a party, one of your closest friends is being iced out by people you both know.',
      choices: [
        { id: 'a', label: 'If that’s my person, I am not leaving them standing alone.', resultWeights: { 'emergency-contact': 2 } },
        { id: 'b', label: '“Are we going to discuss the problem or do this middle-school nonsense all night?”', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'c', label: 'I know exactly where this started. Tonight is episode four, not episode one.', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'd', label: 'We are having a better night than the people trying to exclude us. Pictures included.', resultWeights: { 'reason-theres-a-story': 2, 'hype-department': 1 } },
        { id: 'e', label: '“Head up. Don’t shrink for an audience.” Then I walk back in with them.', resultWeights: { 'hype-department': 2, 'emergency-contact': 1 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Your friend wants to move across the country for someone they’ve been dating four months.',
      choices: [
        { id: 'a', label: 'If they’re going, we need a job plan, housing plan, money, and a way home.', resultWeights: { 'emergency-contact': 2, 'human-bullshit-detector': 1 } },
        { id: 'b', label: 'Do it. Worst case you come home with character development and a wild story.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'c', label: 'What’s the person’s full name, and what do we actually know about them?', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'd', label: 'Four months? You’re changing ZIP codes before you’ve seen them through a bad Tuesday.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'e', label: '“Would you want that city if the relationship ended?” If yes, I believe in the leap.', resultWeights: { 'hype-department': 2, 'human-bullshit-detector': 1 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You’re furious with someone you love, and the reason is legitimate. What happens first?',
      choices: [
        { id: 'a', label: 'I say what’s wrong. I cannot do fake-normal when everybody knows we’re upset.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'b', label: 'I cool off before I speak. My angry vocabulary is too advanced for this moment.', resultWeights: { 'emergency-contact': 1 } },
        { id: 'c', label: 'I’m angry, but if there’s a genuine emergency tonight, I still answer.', resultWeights: { 'emergency-contact': 2 } },
        { id: 'd', label: 'I call the person who already knows the full backstory and ask what I’m missing.', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'e', label: 'We take a breather. The first truly ridiculous thing one of us says usually breaks the ice.', resultWeights: { 'reason-theres-a-story': 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Your friend shares something that completely changes how you see their earlier behavior.',
      choices: [
        { id: 'a', label: 'I need context. What else haven’t I seen?', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'b', label: 'If the new context changes my opinion, I say so. If it doesn’t, I say that too.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'c', label: 'Whatever I think, this stays between us. They told me, not the group chat.', resultWeights: { 'emergency-contact': 2 } },
        { id: 'd', label: 'I’m going to make one terrible joke to give this heavy conversation some oxygen.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'e', label: 'One mistake doesn’t have to become their entire personality. Own it and grow.', resultWeights: { 'hype-department': 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'It’s 9:07 p.m. You’re home. The group chat says, “We need you. Come out.”',
      choices: [
        { id: 'a', label: 'If somebody needs actual help, I’m coming. If it’s FOMO bait, goodnight.', resultWeights: { 'emergency-contact': 2 } },
        { id: 'b', label: 'Where? I can be dressed in twelve minutes.', resultWeights: { 'reason-theres-a-story': 2 } },
        { id: 'c', label: 'WHO needs me, and why was that message so suspiciously vague?', resultWeights: { 'one-who-knows-too-much': 2 } },
        { id: 'd', label: 'I’m not choosing a side without hearing what actually happened.', resultWeights: { 'human-bullshit-detector': 2 } },
        { id: 'e', label: 'Fine, but if I show up, nobody’s spending the night marinating in misery.', resultWeights: { 'hype-department': 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Which sentence has somebody who loves you said with a completely straight face?',
      choices: [
        { id: 'a', label: '“You are not everybody’s emergency contact.”', resultWeights: { 'emergency-contact': 1 } },
        { id: 'b', label: '“This was supposed to be ONE drink.”', resultWeights: { 'reason-theres-a-story': 1 } },
        { id: 'c', label: '“I asked you not to SAY it, not whether it was true.”', resultWeights: { 'human-bullshit-detector': 1 } },
        { id: 'd', label: '“Why do you have screenshots from February?”', resultWeights: { 'one-who-knows-too-much': 1 } },
        { id: 'e', label: '“I just wanted to complain, not attend your motivational seminar.”', resultWeights: { 'hype-department': 1 } },
      ],
    },
  ],
};
