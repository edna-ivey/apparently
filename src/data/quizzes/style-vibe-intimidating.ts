import type { ArchetypeQuizDefinition } from './types';

// Build 22 owner audit (2026-11-01): replaces the prior draft content verbatim from
// docs/private-quizzes/STYLE_VIBE_APPROVED_LOCKED_2026-11-01.md -- editorial version 2.0,
// owner-approved including exact gate/tie values (document's own "Locked scoring contract"
// section). Quiz id, question ids (q1-q10), and choice ids (a-d) are preserved; no real
// production data exists under this quiz_key. IMPORTANT: the prior held draft's resultGates
// used STALE answer letters (independently verified against this document -- Q4/Q5/Q7/Q8 on
// the INTIMIDATING gate and the entire FACE gate list had drifted from this exact revision's
// own lettering); the gate below is rebuilt letter-for-letter from this document, not carried
// over from the draft.
export const STYLE_VIBE_INTIMIDATING_QUIZ: ArchetypeQuizDefinition = {
  id: 'style-vibe-intimidating',
  scoringType: 'archetype',
  category: 'Style & Vibe',
  access: 'private',
  contributesToProfile: true,
  title: 'Are You Actually Intimidating?',
  eyebrow: 'APPARENTLY PRIVATE',
  introSupport: [
    'People keep saying you’re intimidating. Are they scared of you, your standards, or just your face? 😂',
    'Apparently is reviewing the evidence. You may be entirely innocent. Your delivery may have other ideas.',
  ],
  introNote: 'Choose how you actually respond, especially when you’re annoyed or caught off guard.',
  meta: '10 questions · About 3 minutes',
  introCta: 'Investigate me →',
  mixLabel: 'YOUR STYLE & VIBE MIX',
  recentReadMetricLabel: 'your read',
  // Owner-approved verbatim: "High-signal questions Q2,Q3,Q4,Q6,Q7,Q9,Q10. Tie order: highest
  // eligible total; high-signal total; number full +2 primary selections; APPROACHABLE ->
  // FACE -> EVALUATIVE -> INTIMIDATING."
  highSignalQuestionIds: ['q2', 'q3', 'q4', 'q6', 'q7', 'q9', 'q10'],
  tieFallbackOrder: ['approachable', 'face', 'evaluative', 'intimidating'],
  // Owner-approved verbatim: "INTIMIDATING: minimum 4 distinct supporting answers and at
  // least 1 behavior from Q2C/Q3D/Q4D/Q5D/Q6B/Q8D and at least 1 reported impact from
  // Q7B/Q9D/Q10D." / "FACE: minimum 3 distinct FACE supporting answers with at least one of
  // Q2D/Q3B/Q4B/Q5C/Q6D/Q7C/Q8C/Q9B/Q10A." APPROACHABLE and EVALUATIVE ungated.
  resultGates: {
    intimidating: {
      minSignals: 4,
      requiredAnyOf: [
        ['q2-c', 'q3-d', 'q4-d', 'q5-d', 'q6-b', 'q8-d'],
        ['q7-b', 'q9-d', 'q10-d'],
      ],
    },
    face: { minSignals: 3, requiredAnyOf: [['q2-d', 'q3-b', 'q4-b', 'q5-c', 'q6-d', 'q7-c', 'q8-c', 'q9-b', 'q10-a']] },
  },
  archetypes: [
    {
      id: 'approachable',
      title: 'APPROACHABLE | NOBODY IS SCARED OF YOU. 😂',
      kicker: 'No intimidation charges. Several people would like to tell you their life story.',
      apparentlySignature: 'Apparently, your vibe comes with an open-door policy.',
      traits: ['Approachable', 'Warm', 'Supportive'],
      structuredRead: {
        theVerdict: ['We reviewed the allegations. The evidence suggests you’re easier to approach than people claim.'],
        theRead: ['You tend to make room for conversation, acknowledge other people’s effort, and handle disagreements without making every interaction a contest. That’s a form of social confidence that doesn’t require you to be the loudest person in the room.'],
        theCallOut: ['Being approachable doesn’t mean you need to absorb everyone’s problems.'],
        theCost: ['People may assume you’re always available because you’re usually pleasant and receptive.'],
        tryThis: ['Keep your warmth. Make your limits just as easy to understand.'],
      },
    },
    {
      id: 'face',
      title: 'FACE | IT’S THE FACE. THE FACE IS DOING A LOT.',
      kicker: 'Your face has an entire public relations problem.',
      apparentlySignature: 'Apparently, your expression has opinions you haven’t reviewed.',
      traits: ['Reserved-Looking', 'Frequently Misread', 'Understated'],
      structuredRead: {
        theVerdict: ['Your expression is apparently sending emails you never approved. 😭'],
        theRead: ['People may read your neutral face, thoughtful silence, or straightforward delivery as disapproval. But the fact that someone feels intimidated doesn’t automatically mean you’re behaving aggressively.'],
        theCallOut: ['You don’t owe the world a permanent smile. Still, when an interaction matters to you, a small signal of warmth can prevent a big misunderstanding.'],
        theCost: ['Some people may decide you aren’t interested in talking before you’ve actually had a conversation.'],
        tryThis: ['When you welcome a conversation, make that clear with your words rather than relying on people to interpret your face.'],
      },
    },
    {
      id: 'evaluative',
      title: 'EVALUATIVE | YOU’RE NOT INTIMIDATING. YOU’RE HARD TO IMPRESS.',
      kicker: 'Not everyone arrives with supporting documentation. Tragic.',
      apparentlySignature: 'Apparently, your standards brought a clipboard.',
      traits: ['Observant', 'Analytical', 'High-Standards'],
      structuredRead: {
        theVerdict: ['You don’t need everybody to agree with you. You do need things to make sense.'],
        theRead: ['You notice details, ask follow-up questions, and prefer explanations that hold up under scrutiny. People sometimes experience that as pressure, even when your intention is to understand or improve something.'],
        theCallOut: ['Your questions may be reasonable. Your timing and delivery still matter.'],
        theCost: ['People might stop sharing early ideas because they expect an immediate inspection.'],
        tryThis: ['Before giving feedback, ask whether someone wants encouragement, problem-solving, or a thorough critique.'],
      },
    },
    {
      id: 'intimidating',
      title: 'INTIMIDATING | OH. YOU ACTUALLY ARE INTIMIDATING.',
      kicker: 'You asked for honesty. Apparently everybody practiced first.',
      apparentlySignature: 'Apparently, your presence has a preparation requirement.',
      traits: ['Commanding', 'Direct', 'Intense'],
      structuredRead: {
        theVerdict: ['The room gets a little more prepared when you enter. We found out why.'],
        theRead: ['Your answers suggest a repeated pattern of direct corrections, impatient reactions, or confronting people in ways that make them hesitate before speaking. Your standards may be perfectly reasonable. The pressure people feel when approaching you is still worth noticing.'],
        theCallOut: ['Being right doesn’t automatically make every delivery effective.'],
        theCost: ['People may stop bringing you small concerns until they’ve become big problems.'],
        tryThis: ['At your next difficult conversation, invite the information first. Decide whether a correction is needed second.'],
      },
    },
  ],
  questions: [
    {
      id: 'q1',
      prompt: 'You’re at an event where you barely know anyone. What happens?',
      choices: [
        { id: 'a', label: 'I introduce myself and usually find something we can talk about.', resultWeights: { approachable: 2 } },
        { id: 'b', label: 'I give a little nod, find my spot, and mind my business.', resultWeights: { face: 1 } },
        { id: 'c', label: 'I watch the room for a bit. I’d rather understand the situation before joining in.', resultWeights: { evaluative: 2 } },
        { id: 'd', label: 'I stay quiet and observe. People sometimes take that as me judging them.', resultWeights: { evaluative: 1, face: 1 } },
      ],
    },
    {
      id: 'q2',
      prompt: 'Someone confidently explains something to you. They’re wrong. What do you do?',
      choices: [
        { id: 'a', label: '“Can I ask how you got that?” I’ll give them room to work it out.', resultWeights: { evaluative: 2 } },
        { id: 'b', label: 'If it isn’t important, I’ll just let them finish. No need to embarrass anybody.', resultWeights: { approachable: 2 } },
        { id: 'c', label: '“That’s incorrect.” I don’t see the point in pretending otherwise.', resultWeights: { intimidating: 2 } },
        { id: 'd', label: 'I don’t say anything, but apparently they can tell I’m unconvinced.', resultWeights: { face: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: 'A friend or coworker says, “I was nervous to tell you because I thought you’d be mad.” First reaction?',
      choices: [
        { id: 'a', label: '“Have I done something that makes you feel like you can’t tell me things?”', resultWeights: { approachable: 2 } },
        { id: 'b', label: '“Was I looking upset? What made you think that?”', resultWeights: { face: 2 } },
        { id: 'c', label: '“Okay, what happened? What do you need from me?”', resultWeights: { evaluative: 2 } },
        { id: 'd', label: '“Just get to the point. The buildup is worse than the news.”', resultWeights: { intimidating: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: 'Someone proudly shows you something they’ve made. You notice several things that could be better. What happens?',
      choices: [
        { id: 'a', label: 'They’re excited. I recognize the work and celebrate with them.', resultWeights: { approachable: 2 } },
        { id: 'b', label: 'I say something kind, but apparently my expression suggests I’m grading it.', resultWeights: { face: 2 } },
        { id: 'c', label: 'I ask whether they want feedback. If they do, I give them specifics.', resultWeights: { evaluative: 2 } },
        { id: 'd', label: 'I start telling them how to improve it. That’s useful information, isn’t it?', resultWeights: { intimidating: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: 'Someone respectfully disagrees with you in front of other people. How do you handle it?',
      choices: [
        { id: 'a', label: 'I ask how they reached their conclusion. Maybe they caught something I missed.', resultWeights: { evaluative: 2 } },
        { id: 'b', label: 'Good. We can disagree. I’ll hear them out.', resultWeights: { approachable: 2 } },
        { id: 'c', label: 'My expression goes completely serious. I’m listening, but people sometimes assume I’m furious.', resultWeights: { face: 2 } },
        { id: 'd', label: 'I push back immediately. If they challenge me publicly, I expect them to defend their position.', resultWeights: { intimidating: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: 'Somebody crosses a boundary you’ve already explained. What happens next?',
      choices: [
        { id: 'a', label: 'I tell them calmly what needs to change. I’m not interested in a fight.', resultWeights: { approachable: 1, evaluative: 1 } },
        { id: 'b', label: 'I call it out in front of everybody. Maybe that will make the message stick.', resultWeights: { intimidating: 2 } },
        { id: 'c', label: 'I take time to decide whether it was intentional before approaching them.', resultWeights: { evaluative: 2 } },
        { id: 'd', label: 'I plan to handle it later. Unfortunately, my face has already handled the announcement.', resultWeights: { face: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: 'Which reaction from other people has happened to you more than once?',
      choices: [
        { id: 'a', label: 'People I barely know start opening up to me.', resultWeights: { approachable: 2 } },
        { id: 'b', label: 'Someone admits they rehearsed what they wanted to say before approaching me.', resultWeights: { intimidating: 2 } },
        { id: 'c', label: '“I thought you didn’t like me until we actually spoke.”', resultWeights: { face: 2 } },
        { id: 'd', label: 'People arrive prepared with details because they know I’ll have follow-up questions.', resultWeights: { evaluative: 2 } },
      ],
    },
    {
      id: 'q8',
      prompt: 'Someone makes a small mistake that affects you. What do you do?',
      choices: [
        { id: 'a', label: '“No worries. Let’s fix it.” Once it’s fixed, I move on.', resultWeights: { approachable: 2 } },
        { id: 'b', label: 'I want to know why it happened so we can prevent it next time.', resultWeights: { evaluative: 2 } },
        { id: 'c', label: 'I address it directly. Later someone says I sounded harsher than I intended.', resultWeights: { face: 2 } },
        { id: 'd', label: 'I correct them right there, in front of everyone. I don’t like wasting time.', resultWeights: { intimidating: 2 } },
      ],
    },
    {
      id: 'q9',
      prompt: 'Someone starts backtracking and explaining themselves more than necessary. Your response?',
      choices: [
        { id: 'a', label: '“You’re okay. I understand what you’re trying to say.”', resultWeights: { approachable: 2 } },
        { id: 'b', label: 'I realize I may have been looking skeptical without meaning to.', resultWeights: { face: 2 } },
        { id: 'c', label: 'I probably asked more detailed questions than they expected.', resultWeights: { evaluative: 2 } },
        { id: 'd', label: 'I’ve been cutting in because they’re taking too long to explain. I get impatient.', resultWeights: { intimidating: 2 } },
      ],
    },
    {
      id: 'q10',
      prompt: 'Someone who knows you well says, “You can be intimidating.” Which response would be yours?',
      choices: [
        { id: 'a', label: '“I’ve heard that about my expression. I could probably make it easier to tell when I’m friendly.”', resultWeights: { face: 2 } },
        { id: 'b', label: '“Me? I’m usually the one trying to make everybody comfortable.” 😂', resultWeights: { approachable: 2 } },
        { id: 'c', label: '“I ask a lot of questions and have high standards. I still want people to speak honestly.”', resultWeights: { evaluative: 2 } },
        { id: 'd', label: '“You’re probably right. I’ve heard it from several people, and I can be too harsh when I’m frustrated.”', resultWeights: { intimidating: 2, approachable: 1 } },
      ],
    },
  ],
};
