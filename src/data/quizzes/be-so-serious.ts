import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-02): replaces the prior draft content verbatim from
// docs/private-quizzes/APPROVED_11_QUIZ_SOURCE_PACK_2026-11-02.md, source file 01, Quiz 2
// ("BE SO SERIOUS RIGHT NOW."). Quiz id, question ids, and 5 choice ids (a-e) preserved; no
// production data exists under this quiz_key. Personality evidence now comes only from real
// quiz_choice_trait_awards (private-quiz-trait-awards.ts) -- no result-level profileSignals.
//
// MX is a genuine new mechanism, not previously supported: a sixth outcome that wins ONLY
// when every one of the five real, gated outcomes (HW included -- HW itself requires >=3
// different +2 HW choices including one diagnostic) fails to qualify. MX never appears in
// any choice's resultWeights (confirmed against every cell below) and carries no resultGates
// entry of its own (always eligible) -- see 20261102010000's migration header for exactly why
// this needs no new scoring_config field: once it is discoverable (fixed in that migration),
// the existing "highest total among ELIGIBLE candidates" logic already makes it win
// automatically and only when it is the sole eligible candidate left standing.
//
// Harsh gates (CT/PU/HM/AC) and HW's own gate were derived cell-by-cell from the document's
// own answer-level weights (every +2 cell, every diagnostic-question cell for Q2/Q3/Q5/Q7/Q9
// per archetype) -- not copied from any prior draft, since this content is entirely new.
export const BE_SO_SERIOUS_QUIZ: ArchetypeQuizDefinition = {
  id: 'be-so-serious',
  scoringType: 'archetype',
  category: 'Shadow Side',
  access: 'private-preview',
  title: 'Be So Serious Right Now.',
  eyebrow: 'APPARENTLY PRIVATE · FREE PREVIEW',
  introSupport: [
    'We came in ready to ask if you’re the problem. Sometimes you’re not. Sometimes the answer is “Girl. 👀” Let’s see which version of you shows up when your feelings have a microphone.',
  ],
  meta: '10 questions · About 3 minutes',
  introCta: 'Fine. Clock me →',
  mixLabel: 'YOUR SHADOW SIDE MIX',
  recentReadMetricLabel: 'your read',
  highSignalQuestionIds: ['q2', 'q3', 'q5', 'q7', 'q9'],
  countPrimaryMatchesTieBreak: true,
  resultGates: {
    'human-handles-it-well': { minSignals: 3, requiredAnyOf: [['q2-a', 'q2-e', 'q3-a', 'q3-d', 'q5-a', 'q7-a', 'q7-c', 'q9-a', 'q9-c']], requiredGroups: [{ answers: ['q1-a', 'q2-a', 'q2-e', 'q3-a', 'q4-a', 'q5-a', 'q6-a', 'q7-a', 'q7-c', 'q8-a', 'q9-a'], min: 3 }] },
    'control-sometimes': { minSignals: 3, requiredAnyOf: [['q3-b', 'q3-e', 'q5-b', 'q5-e']], requiredGroups: [{ answers: ['q1-e', 'q3-b', 'q4-d', 'q5-e', 'q8-b', 'q8-d'], min: 2 }] },
    'punish-not-communicate': { minSignals: 3, requiredAnyOf: [['q3-c', 'q3-e', 'q5-c', 'q5-d', 'q7-b', 'q7-e']], requiredGroups: [{ answers: ['q1-b', 'q3-c', 'q3-e', 'q5-c', 'q5-d', 'q7-b', 'q7-e'], min: 2 }] },
    'honest-or-mad': { minSignals: 3, requiredAnyOf: [['q2-d', 'q7-d']], requiredGroups: [{ answers: ['q1-d', 'q2-d', 'q7-d'], min: 2 }] },
    'accountability-until-my-turn': { minSignals: 3, requiredAnyOf: [['q2-b', 'q2-c', 'q2-d', 'q9-b', 'q9-d', 'q9-e']], requiredGroups: [{ answers: ['q2-b', 'q2-c', 'q6-c', 'q6-e', 'q8-e', 'q9-b', 'q9-d'], min: 2 }] },
  },
  archetypes: [
    {
      id: 'human-handles-it-well',
      title: 'HW | NO, ACTUALLY. YOU HANDLE THIS PRETTY WELL.',
      kicker: 'Apparently, you’re not always the problem. Please don’t become a problem about that.',
      traits: ['Self-Aware', 'Fair', 'Able to Repair'],
      structuredRead: {
        theVerdict: ['We arrived with a clipboard full of accusations. Disappointingly, you brought emotional range.'],
        theRead: ['You can feel angry without making anger the entire conversation. You can hear “that hurt” without launching a countersuit and say “you have a point” without requiring someone to frame the moment. That is not perfection. It is the ability to catch yourself while something still can be repaired.'],
        theCallOut: ['Don’t make “I’m the mature one” your new favorite personality trait. Self-awareness becomes obnoxious when you use it as proof that everyone else is less evolved. 😂'],
        theCost: ['If you stop listening the moment someone questions your self-image as reasonable, you eventually become difficult to correct in much more sophisticated language.'],
        tryThis: ['When someone says you missed something, ask, “What did that feel like on your side?” before presenting your own transcript.'],
      },
    },
    {
      id: 'control-sometimes',
      title: 'CT | YOU CALL IT STANDARDS. SOMETIMES IT’S CONTROL.',
      kicker: 'Apparently, you’re not wrong every time. That’s exactly why this one is so annoying.',
      traits: ['Capable', 'Organized', 'Occasionally Overbearing'],
      structuredRead: {
        theVerdict: ['You are good at organizing things. You have unfortunately started organizing people.'],
        theRead: ['You think ahead and notice trouble before it happens. Your plans work often enough that “I told you so” has become a quiet internal soundtrack. You genuinely want things to go well.'],
        theCallOut: ['Your way being effective does not automatically make it everybody else’s assignment. “I was only trying to help” can become an endless presentation nobody requested. Other adults are allowed to understand you perfectly and still disagree.'],
        theCost: ['People start making decisions without telling you until afterward because they don’t want to negotiate for ownership of their own choices.'],
        tryThis: ['Give your opinion once. Then ask yourself whether this decision belongs to you. If it doesn’t, let the silence after your suggestion be actual silence.'],
      },
    },
    {
      id: 'punish-not-communicate',
      title: 'PU | YOU DON’T COMMUNICATE. YOU PUNISH.',
      kicker: 'Apparently, you’re not mysterious. You’re mad. They would understand faster if you sent the memo.',
      traits: ['Guarded', 'Withholding', 'Hard to Read When Hurt'],
      structuredRead: {
        theVerdict: ['Your silence is saying a LOT. It just refuses to sign its name.'],
        theRead: ['When you’re hurt, you may get quieter, colder, less available, or suddenly very generous with “fine.” Your distance does not simply protect your peace; sometimes you want somebody else to feel the change and come looking for the reason.'],
        theCallOut: ['Needing time is healthy. Making affection disappear to teach someone a lesson is a different activity. If the goal is for them to worry until they chase you, that’s punishment with excellent deniability.'],
        theCost: ['People start reading your tone like a weather alert. Eventually some stop asking what happened, and you may interpret their exhaustion as more proof they don’t care.'],
        tryThis: ['Try the embarrassingly direct version: “I’m hurt. I need an hour. I want to talk tonight.” State the feeling without assigning someone a scavenger hunt.'],
      },
    },
    {
      id: 'honest-or-mad',
      title: 'HM | YOU’RE NOT “JUST HONEST.” SOMETIMES YOU’RE MAD.',
      kicker: 'Apparently, your honesty brought receipts. Your anger brought a folding chair.',
      traits: ['Blunt', 'Unfiltered', 'Sometimes Just Angry'],
      structuredRead: {
        theVerdict: ['The fact-checking department is excellent. The delivery department needs supervision.'],
        theRead: ['You do not enjoy pretending a problem isn’t there. You can name the inconsistency everybody else keeps dancing around, and people value that courage. A straight answer is genuinely useful.'],
        theCallOut: ['The thing you said might be true. But why that volume? Why that moment? Why the extended director’s cut? Sometimes anger borrows the credibility of honesty so it can land a punch without having to own the swing.'],
        theCost: ['People start editing their stories before bringing them to you. The person who wants truth the most gets the most carefully managed version.'],
        tryThis: ['Ask whether your next sentence is meant to make the situation clearer or to make the person hurt. If it’s both, edit it until the first purpose can stand on its own.'],
      },
    },
    {
      id: 'accountability-until-my-turn',
      title: 'AC | YOU WANT ACCOUNTABILITY UNTIL IT’S YOUR TURN.',
      kicker: 'Apparently, you believe in accountability. We just need to confirm your plan includes incoming calls.',
      traits: ['Perceptive', 'Fair-Minded', 'Selectively Defensive'],
      structuredRead: {
        theVerdict: ['Accountability is a beautiful principle. Apparently, you prefer the outgoing department.'],
        theRead: ['You remember who said what, and you understand that intent doesn’t erase impact. You can recognize excuses immediately when somebody else is making them. That’s not the issue.'],
        theCallOut: ['When it’s your turn, “I only did that because...” and “well, you did...” start sprinting toward the microphone. Context can be real and still become a hiding place. You can be provoked and still be responsible for your response.'],
        theCost: ['Someone who has to prove they were completely innocent before you acknowledge your part will eventually stop telling you what hurts. That isn’t peace. It’s paperwork fatigue.'],
        tryThis: ['Say, “You’re right about my part.” Stop there for one complete breath. You can discuss everything else afterward without using it as the entrance fee.'],
      },
    },
    {
      // MX: deliberately UNGATED and NEVER a resultWeights target on any choice -- see the file
      // header. Wins only when HW/CT/PU/HM/AC are ALL ineligible for this submission.
      id: 'mixed-not-villain',
      title: 'MX | YOU’RE NOT THE VILLAIN. YOU’RE ALSO NOT ABOVE IT.',
      kicker: 'Apparently, you’re not a villain. You’re a person with recurring guest appearances from several villains.',
      traits: ['Human', 'Inconsistent', 'A Little of Everything'],
      structuredRead: {
        theVerdict: ['The evidence says you’re human and inconsistent. Congratulations. Annoying diagnosis.'],
        theRead: ['Sometimes you handle conflict with surprising grace. Other times you manage, sting, withdraw, or defend yourself before you can slow down. No single sharp pattern dominated your responses enough to earn the full call-out. That is a more truthful result than putting you in somebody else’s box.'],
        theCallOut: ['“I’m not always like that” is true and also completely beside the point. The occasional version still counts. A behavior doesn’t need to be your brand to affect someone.'],
        theCost: ['If you only examine the version of yourself that feels flattering, the less attractive behaviors keep turning up under different names.'],
        tryThis: ['Pick the answer you least enjoyed selecting. Ask what tends to happen right before that response, and what one sentence you could say instead.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'Someone close cancels on you at the last minute. Again. What are you actually doing?',
      choices: [
        { id: 'a', label: 'I ask what happened. Twice is a pattern, but I want the story before I decide what it means.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: 'I say “It’s fine,” then quietly stop offering them the things they always ask me for.', resultWeights: { 'punish-not-communicate': 2 } },
        { id: 'c', label: 'I tell them this doesn’t work for me and stop holding time for plans they don’t confirm.', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'd', label: 'I tell them exactly how disrespectful they were, including a few details they probably didn’t need.', resultWeights: { 'honest-or-mad': 2 } },
        { id: 'e', label: 'I invent a whole confirmation system and expect them to follow it next time.', resultWeights: { 'control-sometimes': 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'They tell you, “What you did really hurt me.” What actually comes out of your mouth first?',
      choices: [
        { id: 'a', label: '“Tell me what part hurt. I want to understand.”', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: '“That is not what I meant,” followed by an explanation before I hear what hurt.', resultWeights: { 'accountability-until-my-turn': 2 } },
        { id: 'c', label: '“Interesting. You had no issue hurting me last week.”', resultWeights: { 'accountability-until-my-turn': 2 } },
        { id: 'd', label: '“What did I even say that was so bad?” I start cross-examining before hearing the answer.', resultWeights: { 'honest-or-mad': 2, 'accountability-until-my-turn': 1 } },
        { id: 'e', label: '“I can feel myself getting defensive. Give me a minute, then I want to hear you out.”', resultWeights: { 'human-handles-it-well': 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'Someone you love says NO to something you want. You think their reason is weak. What happens next?',
      choices: [
        { id: 'a', label: 'I check once whether there’s room to reconsider. If it’s still no, it’s no.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: 'I keep explaining. I think they’ll agree once they understand how much sense my plan makes.', resultWeights: { 'control-sometimes': 2 } },
        { id: 'c', label: 'I say okay. My affection disappears for a while, and yes, I want them to notice.', resultWeights: { 'punish-not-communicate': 2 } },
        { id: 'd', label: 'I accept it, then rethink what I can do independently without making their no a punishment.', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'e', label: 'I remind them of every time I said yes for them. Suddenly reciprocity is Exhibit A.', resultWeights: { 'punish-not-communicate': 2, 'control-sometimes': 1 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'They ignored your advice, and now exactly what you warned about has happened. What do you do?',
      choices: [
        { id: 'a', label: 'If they need real help, I help. They already know they were wrong.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: 'I help, but I cannot resist one tiny “Now what did I say?” 😂', resultWeights: { 'honest-or-mad': 1 } },
        { id: 'c', label: 'I ask what help they want. I am not automatically responsible for fixing choices I warned against.', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'd', label: 'I make sure they know next time they need to run the plan by me. I was right, after all.', resultWeights: { 'control-sometimes': 2 } },
        { id: 'e', label: 'Crisis first, discussion later. A lecture isn’t an emergency service.', resultWeights: { 'human-handles-it-well': 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Your partner keeps liking an attractive person’s very obvious thirst traps. It bothers you. Now what?',
      choices: [
        { id: 'a', label: '“This bothers me. I want to talk about what we both consider respectful.”', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: 'Before I say a word, I’m tracking who this person is and every interaction I can find.', resultWeights: { 'control-sometimes': 1 } },
        { id: 'c', label: 'I get colder and less available so they can feel how I feel.', resultWeights: { 'punish-not-communicate': 2 } },
        { id: 'd', label: 'Fine. I can like people’s pictures too. Let’s all be extremely supportive. 😂', resultWeights: { 'punish-not-communicate': 2 } },
        { id: 'e', label: 'I tell them my rule is final and treat any disagreement as proof they’re disrespecting me.', resultWeights: { 'control-sometimes': 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Mid-argument, you realize they might actually be right. Painful development. What now?',
      choices: [
        { id: 'a', label: '“You’re right about that part.” I hate how much personal growth that required.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: 'I concede the specific point and stay on the rest without pretending the whole argument is settled.', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'c', label: 'I immediately explain why I did it. Context first, acknowledgment maybe later.', resultWeights: { 'accountability-until-my-turn': 2 } },
        { id: 'd', label: 'If they’re smug, admitting anything feels suddenly impossible.', resultWeights: { 'accountability-until-my-turn': 1 } },
        { id: 'e', label: 'I keep arguing even though I know, then admit it after my pride has recovered.', resultWeights: { 'accountability-until-my-turn': 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'You’re mad. They ask, “Are you okay?” What do they get?',
      choices: [
        { id: 'a', label: '“No. I’m upset about earlier. Can we talk?”', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: '“I’m fine.” Everything about my expression says they should know better.', resultWeights: { 'punish-not-communicate': 2 } },
        { id: 'c', label: '“Not yet. I need an hour, and I will come back to this.”', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'd', label: 'A very accurate description of what they did, delivered at a completely unnecessary volume.', resultWeights: { 'honest-or-mad': 2 } },
        { id: 'e', label: 'I want them to work it out themselves. They were there; why should I explain?', resultWeights: { 'punish-not-communicate': 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Somebody says, “You always have to have things your way.” What’s your reaction?',
      choices: [
        { id: 'a', label: '“Do I?” I hate the accusation, but I will actually think about it.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: '“No, I just get tired of being right after everybody ignored me.”', resultWeights: { 'control-sometimes': 2 } },
        { id: 'c', label: '“Give me examples. I want to separate the pattern from one bad day.”', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'd', label: '“Funny how nobody complains about my way when my way works.”', resultWeights: { 'control-sometimes': 2 } },
        { id: 'e', label: 'I list every time I compromised. The historical record must be corrected.', resultWeights: { 'accountability-until-my-turn': 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'You get caught doing something you’ve criticized someone else for doing. What happens?',
      choices: [
        { id: 'a', label: '“Yep. That’s hypocritical. You got me.” An absolutely terrible day for my ego.', resultWeights: { 'human-handles-it-well': 2 } },
        { id: 'b', label: '“The situations are different,” followed by my very detailed opening argument.', resultWeights: { 'accountability-until-my-turn': 2 } },
        { id: 'c', label: 'I own my part; I also don’t let them use it to erase theirs.', resultWeights: { 'human-handles-it-well': 1 } },
        { id: 'd', label: 'I resist it first, then privately recognize they were right, without telling them.', resultWeights: { 'accountability-until-my-turn': 2 } },
        { id: 'e', label: 'I joke until we have conveniently stopped talking about my part.', resultWeights: { 'accountability-until-my-turn': 1 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Which sentence has someone close to you probably wanted to say?',
      choices: [
        { id: 'a', label: '“You do not have to manage everything.”', resultWeights: { 'control-sometimes': 1 } },
        { id: 'b', label: '“If you’re mad, just SAY you’re mad.”', resultWeights: { 'punish-not-communicate': 1 } },
        { id: 'c', label: '“Being right did not require all that.”', resultWeights: { 'honest-or-mad': 1 } },
        { id: 'd', label: '“Stop telling me what I did when we’re discussing what YOU did.”', resultWeights: { 'accountability-until-my-turn': 1 } },
        { id: 'e', label: '“I appreciate that you can disagree without making me the enemy.”', resultWeights: { 'human-handles-it-well': 1 } },
      ],
    },
  ],
};
